// 비주얼 믹서 프리셋 - 주제
(function () {
  // 무제: 모든 주제 카테고리의 맨 앞에 배치
  const NONE_SUBJECT = {
    id: 'none',
    nameKo: '무제',
    emoji: '⚪',
    desc: '적당한 주제가 생각나지 않는다면, 해당 항목을 선택하세요.',
    prompt: 'Something',
    group: 'general',
    scene: 'abstract',
    usage: 'report'
  };

  // 1. 비주얼 주제 (Subject) 데이터 (8대 도메인 × 9종 = 72종, 무제 포함)
  const MIXER_SUBJECTS = {
    steel: [
      NONE_SUBJECT,
      {
        id: 'mix-steel-hot-rolling',
        nameKo: '용광로 쇳물 압연',
        emoji: '🔥',
        desc: '붉게 달아오른 쇳물 판재와 대형 압연 롤러.',
        prompt: 'intense glowing-orange molten steel slab passing through heavy industrial roller cylinders in a hot rolling mill, with showers of sparks and heat haze',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-steel-continuous-casting',
        nameKo: '연속 주조 슬래브',
        emoji: '🏗️',
        desc: '액강이 서서히 응고되어 슬래브로 주조되는 조업.',
        prompt: 'a continuous casting machine solidifying molten steel into rectangular slabs, showing glowing red-hot core and vapor steam rising',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-steel-cold-coil',
        nameKo: '고장력 냉연 강판 코일',
        emoji: '🔩',
        desc: '정밀 가공된 실버 강판 코일의 동심원 적재.',
        prompt: 'rows of large, neatly rolled metallic silver cold-rolled steel coils, showing sharp reflections and concentric circular textures',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-steel-heavy-plate',
        nameKo: '선박 조선 기자재 후판',
        emoji: '🚢',
        desc: '조선소 후판 용접 시의 불꽃 and 대형 선체 프레임.',
        prompt: 'massive heavy plate steel sheets being welded and cut at a shipyard dock, with brilliant orange welding sparks arching near a giant ship hull',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-steel-blast-furnace',
        nameKo: '고로 제선 조업',
        emoji: '🌋',
        desc: '웅장한 용광로 밑단에서 시뻘건 용암처럼 흘러내리는 쇳물.',
        prompt: 'a massive industrial blast furnace with molten pig iron pouring out like glowing orange lava into a transport ladle, surrounded by towering steel pipes, intense heat glow, and heavy machinery',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-steel-wire-rod',
        nameKo: '고속 선재 코일 압연',
        emoji: '➰',
        desc: '고속으로 회전하며 감기는 벌갛게 달아오른 철사 선재 코일.',
        prompt: 'a high-speed wire rod mill winding glowing red-hot steel wire into tight coils on a spinning mandrel, bright sparks flying, industrial machinery, mechanical gears',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-steel-smart-factory',
        nameKo: '제철 스마트 팩토리',
        emoji: '🤖',
        desc: '협동 로봇과 디지털 트윈 화면이 결합된 스마트 제철 공정.',
        prompt: 'a futuristic smart steel factory control room with holographic 3D digital twin displays showing real-time steelmaking processes, and autonomous robotic arms working along the conveyor belt',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-steel-scrap-recycling',
        nameKo: '친환경 전기로 재활용',
        emoji: '♻️',
        desc: '철스크랩을 전극봉 아크열로 녹여 강재를 재생하는 친환경 전기로.',
        prompt: 'a high-tech electric arc furnace melting steel scrap with bright purple and blue electrical arcs, glowing molten steel swirling inside, green energy concepts, steam rising',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      { id: 'mix-steel-stainless', nameKo: '스테인리스 표면 처리', emoji: '✨', desc: '거울처럼 빛나는 스테인리스 강판의 전기화학적 표면 연마', prompt: 'a pristine stainless steel surface with mirror-like electropolished finish, reflecting industrial surroundings, close-up metallic texture with chromium brilliance', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-steel-galvanized', nameKo: '용융 아연도금 공정', emoji: '🌊', desc: '강재를 용융 아연 욕조에 담가 방청 도금하는 공정', prompt: 'steel sheet being immersed in a shimmering molten zinc bath for hot-dip galvanizing, silver liquid metal surface with thermal ripples, industrial coating process', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-steel-h-beam', nameKo: 'H형강 구조 골격', emoji: '🏗️', desc: '고층 빌딩 뼈대를 이루는 H형 구조용 강재의 현장 조립', prompt: 'massive H-section steel beams forming the skeletal frame of a high-rise building under construction, cranes lifting shiny steel members, blue sky backdrop', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-steel-pipe', nameKo: '초대형 강관 파이프라인', emoji: '🔩', desc: '대규모 에너지 수송을 위한 대구경 강관 제조 및 용접', prompt: 'rows of large diameter steel pipe tubes in a manufacturing yard, precise circular cross-sections, welding sparks, pipeline infrastructure, industrial logistics', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-steel-strip', nameKo: '극박 코팅 강판 제조', emoji: '🎞️', desc: '0.1mm 이하 극박 냉연 강판에 기능성 코팅을 적용하는 정밀 공정', prompt: 'ultra-thin cold-rolled steel strip being precision coated on a high-speed industrial line, reflective metal surface, coating rollers, tight quality tolerances', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-steel-forging', nameKo: '대형 단조 프레스 성형', emoji: '🔨', desc: '수천 톤 유압 프레스로 강재를 가압·성형하는 단조 조업', prompt: 'a massive hydraulic forging press stamping glowing red-hot steel billet into a precise shaped die, tons of compression force, industrial scale heavy machinery', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-steel-tempering', nameKo: '열처리 담금질 & 뜨임', emoji: '🌡️', desc: '열처리로에서 담금질·뜨임으로 강도를 극대화하는 공정', prompt: 'steel workpieces glowing red-orange being quenched in an oil bath for hardening, then tempered in an industrial heat treatment furnace, metallurgical process', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-steel-ai-inspection', nameKo: 'AI 표면 결함 자동 검사', emoji: '🤖', desc: '카메라·딥러닝 기반 AI가 강판 표면 결함을 실시간 감지', prompt: 'AI-powered surface defect inspection system scanning steel sheet with high-resolution cameras and laser sensors, real-time defect highlighting on monitor, quality control automation', group: 'mfg', scene: 'facility', usage: 'report' },
    ],
    energy: [
      {
        id: 'mix-energy-lithium',
        nameKo: '리튬 이온 배터리 셀',
        emoji: '🔋',
        desc: '배터리 팩의 실린더형 셀 정렬과 이온 이동.',
        prompt: 'the inner structure of a lithium-ion battery showing multiple cylindrical cells aligned with electrical ions moving between cathode and anode layers',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-energy-solidstate',
        nameKo: '차세대 전고체 배터리',
        emoji: '⚡',
        desc: '덴드라이트가 억제된 결정질 고체 전해질 구조.',
        prompt: 'a solid-state battery with glowing lithium ions moving smoothly through a dense, structured crystalline solid electrolyte layer, metallic electrodes',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-energy-electrolysis',
        nameKo: '그린수소 수전해 생산',
        emoji: '🧪',
        desc: '물(H2O)이 수소와 산소로 전기분해되는 메쉬.',
        prompt: 'water electrolysis splitting water molecules into glowing hydrogen bubbles and oxygen bubbles on a high-tech catalytic mesh anode and cathode',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-energy-fuelcell',
        nameKo: '수소 연료전지 스택',
        emoji: '⚙️',
        desc: '막전극접합체(MEA)의 수소-산소 촉매 반응.',
        prompt: 'a fuel cell stack showing membrane electrode assembly (MEA) plates reacting hydrogen and oxygen to generate electricity and water droplets',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-energy-solar-perovskite',
        nameKo: '페로브스카이트 태양전지',
        emoji: '☀️',
        desc: '기존 실리콘을 대체하는 유연하고 투명한 차세대 태양광 패널.',
        prompt: 'flexible and semi-transparent perovskite solar cells with a glowing iridescent rainbow-colored crystalline film texture, capturing sunlight under a clear blue sky',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-energy-wind-offshore',
        nameKo: '부유식 해상 풍력 발전',
        emoji: '🌬️',
        desc: '끝없는 푸른 바다 위에 우뚝 솟은 친환경 대형 해상 풍력 터빈.',
        prompt: 'massive offshore floating wind turbines spinning slowly over a deep blue ocean with crashing white waves, bright sunny day, dramatic clouds, showcasing clean renewable energy',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-energy-ess-grid',
        nameKo: '대용량 에너지 저장 장치 (ESS)',
        emoji: '🎛️',
        desc: '스마트 그리드 송전선로와 연결된 컨테이너형 대용량 배터리 단지.',
        prompt: 'a large grid-scale energy storage system (ESS) showing rows of sleek white battery containers with glowing green power indicators, connected to electric power lines under sunset sky',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      {
        id: 'mix-energy-ammonia-combustion',
        nameKo: '청정 암모니아 발전',
        emoji: '💨',
        desc: '석탄이나 가스 대신 암모니아를 섞어 태우는 무탄소 친환경 연소 화염.',
        prompt: 'a clean ammonia-hydrogen combustion flame inside an industrial boiler, showing a distinct bright blue and violet burning flame with zero carbon emission, advanced energy technology',
        group: 'mfg',
        scene: 'facility',
        usage: 'report'
      },
      { id: 'mix-energy-offshore-wind', nameKo: '해상풍력 발전단지', emoji: '🌊', desc: '거대한 해상 풍력 터빈들이 군집을 이루는 대규모 해상 발전 단지', prompt: 'vast offshore wind farm with dozens of giant white wind turbines standing in the ocean, aerial view at golden hour, dramatic clouds, clean renewable energy landscape', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-energy-tidal', nameKo: '조류 수중 터빈 발전', emoji: '🌀', desc: '해저 조류 에너지를 전기로 변환하는 수중 터빈 발전 설비', prompt: 'underwater tidal turbine array harnessing ocean current energy, blue-green water flow, spinning turbine blades, marine renewable energy technology, ocean floor installation', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-energy-geothermal', nameKo: '지열 심층 시추 발전', emoji: '🌋', desc: '지하 수km 심층에서 지열 스팀을 끌어올려 발전하는 시추 설비', prompt: 'geothermal power plant with steam rising from deep borehole drilling rigs, volcanic rocky landscape, natural geothermal heat energy extraction, industrial infrastructure', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-energy-smr', nameKo: '소형 모듈 원자로 (SMR)', emoji: '⚛️', desc: '소형·안전·모듈화로 설계된 차세대 원자력 발전 시스템', prompt: 'futuristic small modular reactor facility with clean compact nuclear reactor vessel, advanced safety cooling system, glowing blue reactor core, next-generation nuclear energy', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-energy-pumped-hydro', nameKo: '양수발전 저수지 시스템', emoji: '🏔️', desc: '잉여 전력으로 물을 퍼올려 저장하고 방류로 발전하는 에너지 저장 댐', prompt: 'mountain pumped hydro energy storage facility with two reservoirs at different elevations connected by tunnels, water flowing through penstocks, energy storage dam landscape', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-energy-waste-energy', nameKo: '폐기물 에너지화 열병합', emoji: '🔥', desc: '생활 폐기물을 연소해 전기와 열을 동시 생산하는 자원 회수 시설', prompt: 'modern waste-to-energy combined heat and power plant with clean combustion chambers, waste processing conveyors, steam turbines, district heating pipes, sustainable waste management', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-energy-bipv', nameKo: 'BIPV 건물 일체형 태양광', emoji: '🏢', desc: '건물 외벽과 유리창 자체가 태양광 발전 패널 역할을 하는 BIPV 건축', prompt: 'modern building facade integrated with thin-film photovoltaic solar panels as windows and wall cladding, BIPV architecture, urban solar energy harvesting, futuristic green building', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-energy-grid-storage', nameKo: '그리드 연계 대용량 ESS', emoji: '🔋', desc: '전력망에 연계된 대규모 배터리 에너지 저장 시스템(ESS) 시설', prompt: 'massive grid-scale battery energy storage system facility with rows of container-sized battery packs, power converters, electric substations, large-scale energy storage infrastructure', group: 'mfg', scene: 'facility', usage: 'report' },
    ],
    software: [
      {
        id: 'mix-soft-ai-brain',
        nameKo: '인공지능 가상 두뇌',
        emoji: '🧠',
        desc: '뇌 형상 위의 실리콘 칩과 뉴런 시냅스망.',
        prompt: 'a complex artificial intelligence brain structure floating, created from glowing light nodes, microchips, and fiber-optic neural pathways',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-soft-vision',
        nameKo: '컴퓨터 비전 객체 인식',
        emoji: '👁️',
        desc: '도로 위 오브젝트를 감지하는 형광 바운딩 박스.',
        prompt: 'real-time computer vision object detection overlay, displaying bounding boxes, target vectors, and segmented masks on urban street view objects',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-soft-sdv',
        nameKo: '소프트웨어 정의 자동차',
        emoji: '🚗',
        desc: '전기차 아키텍처 위로 내려오는 무선 OTA 데이터.',
        prompt: 'a glowing 3D wireframe outline of a luxury electric car showcasing its inner software architecture blocks with light-beam ripples of OTA data updates',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-soft-datacenter',
        nameKo: '하이퍼스케일 데이터센터',
        emoji: '🏢',
        desc: '끝없는 서버 랙 통로와 정밀 공기 순환 루프.',
        prompt: 'rows of server racks with flashing blue and green LED status lights, optical fiber cable trays suspended from high ceiling',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-software-quantum',
        nameKo: '양자 컴퓨팅 프로토콜',
        emoji: '🔮',
        desc: '초저온 희석 냉동기 금빛 샹들리에 구조와 양자 비트 격자.',
        prompt: 'a gold-plated quantum computer dilution refrigerator structure, illuminated with glowing cyan and violet laser paths, showing 3D quantum qubits entangled in a grid lattice',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-software-cyber-defense',
        nameKo: '사이버 보안 방어망',
        emoji: '🛡️',
        desc: '해킹 위협을 실시간 차단하는 입체 보안 장벽과 네트워크 노드.',
        prompt: 'a glowing 3D digital shield defending a complex network grid from incoming red data packets, showing light trails, cybersecurity encryption keys, and cyber defense codes',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-software-metaverse',
        nameKo: '메타버스 디지털 트윈',
        emoji: '🕶️',
        desc: '현실과 가상이 융합된 무한한 복셀 공간과 사용자 아바타.',
        prompt: 'a dynamic 3D virtual environment with neon voxel grids, floating holographic user interfaces, and glowing abstract silhouettes interacting with virtual objects',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-software-blockchain',
        nameKo: '블록체인 분산 데이터',
        emoji: '🔗',
        desc: '암호학적 체인으로 연결된 자가 발광 트랜잭션 블록 구조.',
        prompt: 'a chain of translucent glowing crystalline data blocks connected by bright laser beams, representing decentralized blockchain ledger technology, microchip pattern on surface',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      { id: 'mix-soft-llm', nameKo: '대형 언어 모델 GPU 클러스터', emoji: '🧮', desc: '수천 개 GPU가 병렬 연산하는 LLM 학습 슈퍼컴퓨터 클러스터', prompt: 'massive GPU computing cluster for training large language models, thousands of graphics cards in server racks with glowing cooling systems, AI supercomputer data center', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-soft-edge-ai', nameKo: '엣지 AI 추론 칩', emoji: '💡', desc: '모바일·IoT 디바이스에서 실시간 AI 추론이 가능한 초저전력 엣지 SoC', prompt: 'close-up of an edge AI inference chip on a circuit board, glowing neural network pathways etched in silicon, mobile AI processor, low-power embedded machine learning hardware', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-soft-xr-dev', nameKo: 'XR 크로스 플랫폼 개발', emoji: '🥽', desc: 'AR/VR/MR 혼합현실 콘텐츠를 통합 개발하는 XR 플랫폼 환경', prompt: 'XR development environment showing multiple screens with AR, VR and mixed reality applications, spatial computing tools, holographic interface, developer workspace for cross-reality apps', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-software-robotic', nameKo: '협동 로봇 프로그래밍', emoji: '🦾', desc: '사람과 같은 공간에서 협업하는 코봇의 동작 프로그래밍 인터페이스', prompt: 'collaborative robot cobot arm being programmed with a tablet interface, safety sensors, flexible manufacturing cell, human-robot collaboration workspace, industrial automation', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-software-devops', nameKo: 'DevOps CI/CD 파이프라인', emoji: '⚙️', desc: '코드 커밋부터 배포까지 자동화된 지속 통합·배포 파이프라인 시각화', prompt: 'DevOps CI/CD pipeline visualization dashboard showing automated build, test, and deploy stages, code flow through containers, Kubernetes cluster, continuous integration workflow', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-software-api', nameKo: 'API 마이크로서비스 아키텍처', emoji: '🔗', desc: '독립 마이크로서비스들이 API 게이트웨이로 연결되는 클라우드 아키텍처', prompt: 'microservices architecture diagram with interconnected service nodes and API gateway, container orchestration visualization, cloud-native software architecture, technical system map', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-software-deeplearning', nameKo: '딥러닝 컨볼루션 신경망', emoji: '🧠', desc: '이미지 분류를 수행하는 CNN 신경망의 레이어 구조 시각화', prompt: 'convolutional neural network architecture visualization with glowing neuron layers, feature map activations, deep learning model structure, 3D tensor flow diagram', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-software-digital-twin', nameKo: '산업 디지털 트윈 시스템', emoji: '🔮', desc: '물리 설비와 실시간 동기화되는 산업용 디지털 트윈 플랫폼', prompt: 'industrial digital twin platform showing a physical factory floor mirrored by a 3D virtual model with real-time sensor data overlay, predictive maintenance dashboard, IoT connectivity', group: 'knowledge', scene: 'service', usage: 'report' },
    ],
    bio: [
      {
        id: 'mix-bio-cell',
        nameKo: '나노 세포 현미경',
        emoji: '🔬',
        desc: '세포막 구조와 나노 입자의 상호작용.',
        prompt: 'clear scientific visualization of nanoscale cellular structures and molecular bonds under an advanced electron microscope, showing nanoparticles interacting with cells',
        group: 'knowledge',
        scene: 'lab',
        usage: 'report'
      },
      {
        id: 'mix-bio-cybernetic',
        nameKo: '유기적 사이버네틱스 의수',
        emoji: '🦾',
        desc: '인체 조직과 카본 파이버, 기계 구동부의 융합.',
        prompt: 'a cybernetic hand blending organic human skin with sleek mechanical carbon fiber plating and glowing fiber-optic wires',
        group: 'knowledge',
        scene: 'lab',
        usage: 'report'
      },
      {
        id: 'mix-bio-dna',
        nameKo: '유전자 DNA 이중 나선',
        emoji: '🧬',
        desc: '입체적으로 회전하는 유전자 구조와 빛 가루.',
        prompt: 'a double helix DNA strand twisting vertically, surrounded by luminous glowing particles and sparkling genetic dust',
        group: 'knowledge',
        scene: 'lab',
        usage: 'report'
      },
      {
        id: 'mix-bio-petri',
        nameKo: '페트리 접시 생물 배양',
        emoji: '🧫',
        desc: '자가 발광 박테리아 유체의 유기적 문양 패턴.',
        prompt: 'bioluminescent bacterial cultures and crystalline micro-organisms growing in a circular petri dish with neon fluid patterns',
        group: 'knowledge',
        scene: 'lab',
        usage: 'report'
      },
      {
        id: 'mix-bio-brain-link',
        nameKo: '뇌-컴퓨터 인터페이스 (BCI)',
        emoji: '🔌',
        desc: '뇌의 생체 전기 신호와 디지털 컴퓨터를 연결하는 마이크로 임플란트.',
        prompt: 'an ultra-precise brain-computer interface microchip integrated with neural synapses, emitting golden and blue electrical impulses along biological brain tissue',
        group: 'knowledge',
        scene: 'lab',
        usage: 'report'
      },
      {
        id: 'mix-bio-organoid',
        nameKo: '3D 바이오 프린팅 장기',
        emoji: '🫀',
        desc: '콜라겐 지지체 위로 세포를 분사하여 입체 장기를 만드는 정밀 프린터.',
        prompt: 'a 3D bioprinter nozzle deposit glowing red and blue bio-ink cells layer by layer to fabricate an artificial human heart scaffold inside a sterile laboratory glass chamber',
        group: 'knowledge',
        scene: 'lab',
        usage: 'report'
      },
      {
        id: 'mix-bio-mrna-vaccine',
        nameKo: 'mRNA 지질 나노입자 (LNP)',
        emoji: '💧',
        desc: 'mRNA 유전 정보를 감싸고 세포막을 통과하는 지질 이중층 나노구체.',
        prompt: 'a molecular 3D rendering of a lipid nanoparticle (LNP) enclosing glowing mRNA helix strands inside, showing phospholipid bilayer surface floating in cellular fluid',
        group: 'knowledge',
        scene: 'lab',
        usage: 'report'
      },
      {
        id: 'mix-bio-vertical-farm',
        nameKo: '스마트 바이오 버티컬 팜',
        emoji: '🌱',
        desc: '특수 LED 조명과 수경재배 시스템으로 기르는 미래 무균 작물.',
        prompt: 'rows of vertical farming shelves inside a high-tech facility under bright pink and purple growth LED lights, with fresh green lettuce plants growing in nutrient-rich water channels',
        group: 'knowledge',
        scene: 'lab',
        usage: 'report'
      },
      { id: 'mix-bio-gene-sequencing', nameKo: '차세대 유전체 시퀀싱', emoji: '🧬', desc: '나노포어 기술로 DNA 염기서열을 초고속 판독하는 유전체 분석 장비', prompt: 'next-generation DNA sequencing machine reading genetic code with fluorescent base detection, genomics laboratory, colorful DNA strand visualization, bioinformatics data stream', group: 'knowledge', scene: 'lab', usage: 'report' },
      { id: 'mix-bio-organoid', nameKo: '3D 오가노이드 배양 모델', emoji: '🫧', desc: '인체 장기 구조를 모사한 미니 오가노이드 3D 세포 배양 모델', prompt: '3D organoid cell culture in a petri dish under microscope, miniature brain or intestinal organoid tissue structure, fluorescent cell staining, biomedical research laboratory', group: 'knowledge', scene: 'lab', usage: 'report' },
      { id: 'mix-bio-crispr', nameKo: '크리스퍼 유전자 편집', emoji: '✂️', desc: 'CRISPR-Cas9 분자 가위로 특정 유전자를 정밀 편집하는 장면', prompt: 'CRISPR-Cas9 gene editing concept with molecular scissors cutting DNA double helix at precise location, glowing gene sequence, biotechnology genome editing visualization', group: 'knowledge', scene: 'lab', usage: 'report' },
      { id: 'mix-bio-monoclonal', nameKo: '단클론 항체 바이오 의약품', emoji: '💉', desc: '항체 공학으로 생산된 단클론 항체 의약품의 제조 공정', prompt: 'biopharmaceutical manufacturing of monoclonal antibodies in sterile bioreactor vessels, protein purification chromatography columns, GMP cleanroom, antibody drug production facility', group: 'knowledge', scene: 'lab', usage: 'report' },
      { id: 'mix-bio-wearable-sensor', nameKo: '생체 신호 웨어러블', emoji: '⌚', desc: '심박·혈당·뇌파를 실시간 측정하는 의료용 웨어러블 센서 디바이스', prompt: 'advanced biosensor wearable device on human wrist showing real-time ECG heartbeat, blood glucose, and brainwave monitoring, medical IoT health tracking, digital health technology', group: 'knowledge', scene: 'lab', usage: 'report' },
      { id: 'mix-bio-tissue-engineering', nameKo: '생체 조직 공학 스캐폴드', emoji: '🏗️', desc: '인공 지지체에 세포를 배양해 인체 조직을 재건하는 조직 공학', prompt: 'tissue engineering scaffold with living cells growing on a 3D printed biocompatible matrix, regenerative medicine lab, collagen scaffold structure, cell seeding process, biophotonics', group: 'knowledge', scene: 'lab', usage: 'report' },
      { id: 'mix-bio-microbiome', nameKo: '장내 마이크로바이옴 연구', emoji: '🦠', desc: '인체 건강과 밀접한 장내 미생물 군집의 분석과 활용 연구', prompt: 'gut microbiome scientific visualization with diverse bacterial colony clusters, human digestive system anatomy, microorganism ecosystem, 3D rendering of intestinal flora diversity', group: 'knowledge', scene: 'lab', usage: 'report' },
      { id: 'mix-bio-synthetic-protein', nameKo: '합성 단백질 구조 설계', emoji: '🔬', desc: 'AlphaFold AI로 설계된 신규 단백질의 3D 폴딩 구조 시각화', prompt: 'AI-designed synthetic protein 3D structure visualization with ribbons and helices, molecular folding simulation, colorful amino acid chain, computational protein engineering', group: 'knowledge', scene: 'lab', usage: 'report' },
    ],
    finance: [
      {
        id: 'mix-finance-stock-trading',
        nameKo: '실시간 글로벌 트레이딩',
        emoji: '📈',
        desc: '다중 화면에 띄워진 실시간 주가 차트와 역동적인 붉은색 상승 캔들.',
        prompt: 'a futuristic financial trading desk with multiple curved holographic screens displaying real-time stock market candlestick charts, indices, and green glowing uptrend arrows',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-finance-crypto-wallet',
        nameKo: '디지털 자산 지갑',
        emoji: '🪙',
        desc: '스마트폰 화면에서 가상자산 코인이 홀로그램으로 전송되는 모습.',
        prompt: 'a premium smartphone floating in mid-air, with a holographic display of digital gold and platinum coins transferring securely with glowing laser particles',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-finance-credit-scoring',
        nameKo: 'AI 신용등급 분석 시스템',
        emoji: '📊',
        desc: '인공지능이 복합 데이터를 분석하여 최적의 신용도를 산출하는 과정.',
        prompt: 'an abstract financial analytics dashboard showing user profile silhouette, connected to shining radar charts, percentage nodes, and a secure golden checkmark seal',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-finance-fintech-pay',
        nameKo: '모바일 간편 터치 결제',
        emoji: '📱',
        desc: '단말기에 스마트폰을 대는 순간 퍼져나가는 푸른색 결제 무선 파동.',
        prompt: 'a close-up of a human hand holding a sleek smartphone near a modern black contactless payment terminal, with glowing blue NFC wave ripples radiating outwards',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-finance-robotic-advisor',
        nameKo: 'AI 로보어드바이저 자문',
        emoji: '🤖',
        desc: '인공지능 로봇이 제안하는 다각화된 3D 포트폴리오 차트.',
        prompt: 'a friendly transparent holographic robot presenting a 3D pie chart and diverse investment assets like bonds, stocks, and gold in a modern office room',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-finance-central-bank-digital',
        nameKo: '중앙은행 디지털화폐 (CBDC)',
        emoji: '🏛️',
        desc: '국가 상징 마크와 암호 패턴이 새겨진 자가발광 국책 디지털 화폐.',
        prompt: 'a majestic neoclassical central bank building in the background, with a giant glowing digital coin featuring a government seal and cryptographic circuit lines floating in the foreground',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-finance-algorithmic-arbitrage',
        nameKo: '알고리즘 초고속 매매',
        emoji: '⚡',
        desc: '1밀리초 단위로 수백만 건의 데이터를 비교 처리하는 금융 알고리즘.',
        prompt: 'a high-speed abstract digital tunnel filled with streams of financial numbers, binary codes, and sharp lightning-fast trade signal flashes connecting global markets',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      {
        id: 'mix-finance-esg-investment',
        nameKo: 'ESG 친환경 투자',
        emoji: '🌱',
        desc: '환경 보호와 기업 지배구조 개선 프로젝트에 자금을 대는 녹색 금융.',
        prompt: 'a glowing green planet earth surrounded by a rotating ring of financial charts and growing green leaves, representing sustainable ESG investment and green finance',
        group: 'knowledge',
        scene: 'service',
        usage: 'report'
      },
      { id: 'mix-finance-robo-adv2', nameKo: '알고 트레이딩 퀀트 전략', emoji: '📐', desc: '수학 모델과 빅데이터로 시장을 자동 매매하는 퀀트 알고리즘 트레이딩', prompt: 'quantitative algorithmic trading dashboard with mathematical formulas, real-time candlestick charts, trading signals, automated order execution interface, quant finance strategy', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-finance-defi', nameKo: 'DeFi 탈중앙 금융 프로토콜', emoji: '🔗', desc: '블록체인 스마트 계약으로 운영되는 탈중앙화 금융 생태계 시각화', prompt: 'decentralized finance DeFi protocol with blockchain node network, liquidity pool smart contracts, token staking yield farming interface, Web3 finance ecosystem visualization', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-finance-ipo', nameKo: '기업공개 IPO 상장 세레모니', emoji: '🎉', desc: '증권거래소 개장 타종으로 기업 상장을 알리는 IPO 세레모니', prompt: 'stock exchange IPO listing ceremony with executives ringing the opening bell, trading floor screens showing rising stock price, confetti, financial milestone celebration event', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-finance-venture', nameKo: '벤처 투자 IR 피칭', emoji: '🚀', desc: '스타트업이 VC 앞에서 비즈니스 모델과 성장성을 발표하는 IR 피칭', prompt: 'startup founder pitching business to venture capital investors in modern boardroom, growth chart presentation, investor meeting, funding round discussion, entrepreneurial pitch deck', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-finance-trade', nameKo: '글로벌 무역금융 플랫폼', emoji: '🚢', desc: '수출입 결제와 공급망을 지원하는 글로벌 무역금융 시스템', prompt: 'global trade finance platform with shipping containers, letter of credit documents, international payment flow between banks, supply chain finance network visualization', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-finance-actuarial', nameKo: '보험 계리 리스크 분석', emoji: '📊', desc: '생명·손해보험 위험률을 수리·통계 모델로 산출하는 계리 분석 시스템', prompt: 'actuarial insurance risk analysis visualization with mortality tables, probability distribution curves, risk modeling software interface, financial mathematics data science dashboard', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-finance-reit', nameKo: '부동산 리츠 REIT 수익 구조', emoji: '🏙️', desc: '상업용 부동산 포트폴리오에 투자하는 리츠의 임대 수익 배분 구조', prompt: 'real estate investment trust REIT portfolio with commercial property buildings, rental income distribution chart, dividend yield visualization, property fund management dashboard', group: 'knowledge', scene: 'service', usage: 'report' },
      { id: 'mix-finance-credit-score', nameKo: 'AI 신용 평가 스코어링', emoji: '🎯', desc: 'AI와 빅데이터로 개인·기업 신용도를 실시간 분석하는 핀테크 신용 모델', prompt: 'AI credit scoring system with real-time financial data analysis, credit risk gauge meter, machine learning model decision tree, fintech credit assessment platform interface', group: 'knowledge', scene: 'service', usage: 'report' },
    ],
    public: [
      {
        id: 'mix-public-smart-city',
        nameKo: '스마트시티 초연결망',
        emoji: '🏙️',
        desc: '지능형 센서와 IoT망으로 건물들이 실시간 소통하는 미래형 도시.',
        prompt: 'a futuristic smart city skyline at night with glowing blue and cyan fiber-optic data gridlines connecting glass skyscrapers, autonomous cars leaving light trails',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-public-digital-twin',
        nameKo: '국토 공간 디지털 트윈',
        emoji: '🗺️',
        desc: '실제 지형과 건물을 3D 가상 공간에 정밀하게 동기화한 입체 격자 맵.',
        prompt: 'a 3D wireframe digital twin topographic map of a metropolitan city on a high-tech glass table, with glowing green and white altitude contours and digital building blocks',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-public-ev-bus',
        nameKo: '자율주행 친환경 셔틀',
        emoji: '🚌',
        desc: '라이다 센서와 카메라로 도로를 분석하며 운행하는 친환경 셔틀 버스.',
        prompt: 'a futuristic self-driving electric shuttle bus stopping at a smart glass shelter, showing active colorful lidar beam sensors mapping the environment',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-public-water-treatment',
        nameKo: '지능형 수질 정화 시스템',
        emoji: '💧',
        desc: '수처리 시설에서 복합 필터와 센서를 통해 오수를 정화하는 공정.',
        prompt: 'a modern water treatment plant interior, showing massive clean steel pipes and giant transparent filtration cylinders filled with glowing pure blue water and sensory nodes',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-public-disaster-control',
        nameKo: '재난 안전 관제 시스템',
        emoji: '🚨',
        desc: '태풍, 지진 등 재난 상황을 실시간 모니터링하여 경보를 울리는 대시보드.',
        prompt: 'a state-of-the-art disaster command center with a large wall monitor displaying weather radar satellite images of a typhoon, red flashing warning lights, and map markers',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-public-intelligent-traffic',
        nameKo: '지능형 교통 신호 제어',
        emoji: '🚦',
        desc: '교통량 분석 AI가 실시간으로 교차로 신호등을 최적화하는 디지털 시뮬레이션.',
        prompt: 'a busy highway interchange viewed from above, overlaid with glowing green, yellow, and red traffic flow speed indicators, autonomous vehicles, and optimization vectors',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-public-e-gov',
        nameKo: '비대면 모바일 행정 서비스',
        emoji: '📄',
        desc: '스마트폰 화면에서 모바일 면허증과 정부 증명서가 발급되는 직관적 보안 화면.',
        prompt: 'a secure mobile government application interface floating above a desk, showing a high-tech digital identity card with glowing holographic security seal',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-public-waste-sorting',
        nameKo: 'AI 자원 순환 선별기',
        emoji: '♻️',
        desc: '컨베이어 벨트 위 폐기물 종류를 카메라로 판별해 분리하는 고속 로봇 팔.',
        prompt: 'a high-speed robotic sorting arm picking plastic bottles and aluminum cans from a fast-moving conveyor belt using computer vision camera guidance in a recycling plant',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      { id: 'mix-public-smart-safety', nameKo: '스마트 재난 안전 관제센터', emoji: '🚨', desc: 'CCTV·드론·IoT 센서를 통합해 재난 상황을 실시간 모니터링하는 안전 관제', prompt: 'smart city disaster safety control center with multi-screen monitoring wall showing CCTV feeds, drone footage, IoT sensor alerts, emergency response coordination, public safety command', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-public-digital-id', nameKo: '디지털 전자 신분증 시스템', emoji: '🪪', desc: '스마트폰 기반 모바일 신분 인증과 전자 서명을 통합한 디지털 ID', prompt: 'digital identity mobile app on smartphone with biometric verification, QR code secure credential, government-issued digital ID card, secure authentication, e-government services', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-public-gov-cloud', nameKo: '정부 통합 클라우드 행정망', emoji: '☁️', desc: '행정 데이터를 안전하게 처리하는 정부 전용 하이브리드 클라우드 인프라', prompt: 'government cloud computing infrastructure with secure hybrid cloud data centers, encrypted administrative network, public sector IT backbone, e-government digital transformation', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-public-autonomous-transit', nameKo: '자율주행 공공 대중교통', emoji: '🚌', desc: '운전자 없이 AI가 운행하는 자율주행 버스·셔틀의 도심 대중교통 서비스', prompt: 'autonomous self-driving public transit bus operating on dedicated lane in smart city, no driver, AI navigation system, electric vehicle, modern urban mobility infrastructure', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-public-social-housing', nameKo: '공공 임대 주거 복지 단지', emoji: '🏘️', desc: '저소득층을 위한 친환경·스마트 공공임대 주거 단지 개발 사업', prompt: 'modern affordable social housing complex with green rooftop gardens, community spaces, smart home features, sustainable architecture, inclusive public housing development', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-public-e-petition', nameKo: '전자 공론화 청원 플랫폼', emoji: '📣', desc: '시민이 정책 의제를 제안하고 공론화하는 디지털 참여 민주주의 플랫폼', prompt: 'digital civic participation platform showing online petition with public comments, vote counting progress bar, community forum, e-democracy citizen engagement website interface', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-public-border-control', nameKo: '스마트 출입국 자동심사', emoji: '🛂', desc: '생체 인식·AI로 여행자를 빠르게 인증하는 차세대 스마트 출입국 시스템', prompt: 'smart border automated passport control gate with facial recognition scanner, biometric fingerprint, e-passport chip reading, modern airport immigration technology, fast processing', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-public-national-grid', nameKo: '국가 전력망 통합 관제', emoji: '⚡', desc: '전국 발전·송전·배전 현황을 실시간 모니터링하는 국가 전력망 EMS', prompt: 'national electricity grid control room with wall-sized power network map, real-time load monitoring, substation status displays, energy management system EMS, grid operators', group: 'public', scene: 'service', usage: 'plan' },
    ],
    brand: [
      {
        id: 'mix-brand-visual-identity',
        nameKo: '브랜드 아이덴티티 수립',
        emoji: '🎨',
        desc: '가이드북 위에 배치된 감각적인 디자인 모티프와 컬러 팔레트 칩.',
        prompt: 'a collection of professional brand identity guidelines, showing a sleek custom logo, elegant pastel color swatches, typography books, and premium stationary items',
        group: 'life',
        scene: 'people',
        usage: 'promo'
      },
      {
        id: 'mix-brand-pop-up',
        nameKo: '트렌디 팝업 스토어',
        emoji: '🏬',
        desc: '강렬한 메탈/네온 장식과 예술적 포토존으로 꾸며진 플래그십 체험존.',
        prompt: 'a stylish and trendy pop-up store exterior in an urban art district, featuring bold neon signs, artistic window displays, futuristic design installations, and crowds gathered',
        group: 'life',
        scene: 'people',
        usage: 'promo'
      },
      {
        id: 'mix-brand-influencer',
        nameKo: '라이브 커머스 방송',
        emoji: '🎙️',
        desc: '링라이트 조명 아래 크리에이터가 신제품을 소개하는 스마트폰 화면.',
        prompt: 'a high-end camera setup on a tripod with a glowing circular ring light, capturing a dynamic live-stream video feed showing real-time heart emojis and chat overlays',
        group: 'life',
        scene: 'people',
        usage: 'promo'
      },
      {
        id: 'mix-brand-packaging',
        nameKo: '친환경 에코 패키징',
        emoji: '📦',
        desc: '크라프트 종이 박스 위에 콩기름 잉크로 인쇄된 에코 브랜드 패키지.',
        prompt: 'a beautiful, minimalist eco-friendly product packaging box made of textured brown kraft paper, adorned with a clean green plant logo stamp and soft lighting',
        group: 'life',
        scene: 'people',
        usage: 'promo'
      },
      {
        id: 'mix-brand-cx-journey',
        nameKo: '고객 경험 (CX) 여정 맵',
        emoji: '🗺️',
        desc: '고객의 감정선과 구매 단계를 입체적인 마인드맵 형태로 도식화한 차트.',
        prompt: 'a colorful 3D infographic board showing the stages of a customer journey map, with miniature figures moving along a path with positive emoji checkpoints',
        group: 'life',
        scene: 'people',
        usage: 'promo'
      },
      {
        id: 'mix-brand-ai-copywriter',
        nameKo: 'AI 타겟 카피라이팅',
        emoji: '✍️',
        desc: '트렌디한 단어 조합을 실시간으로 추천해주는 인공지능 카피 에디터 화면.',
        prompt: 'a modern workspace desk with a laptop screen displaying high-converting creative ad headlines and slogans, with glowing sparkles of creative ideas',
        group: 'life',
        scene: 'people',
        usage: 'promo'
      },
      {
        id: 'mix-brand-fandom',
        nameKo: '브랜드 굿즈 디자인',
        emoji: '🧸',
        desc: '브랜드 로고가 새겨진 트렌디한 키링, 스티커 팩, 텀블러 레이아웃.',
        prompt: 'a neat flat lay layout of trendy brand merchandise goods, including custom acrylic keyrings, vinyl stickers with cute designs, a sleek matte finish tumbler',
        group: 'life',
        scene: 'people',
        usage: 'promo'
      },
      {
        id: 'mix-brand-ar-try-on',
        nameKo: 'AR 가상 피팅 솔루션',
        emoji: '🕶️',
        desc: '스마트폰 화면을 통해 명품 안경이나 의상을 가상으로 입어보는 화면.',
        prompt: 'a screen showing a young smiling woman using her smartphone camera for an augmented reality (AR) virtual try-on, wearing a 3D digital model of luxury sunglasses',
        group: 'life',
        scene: 'people',
        usage: 'promo'
      },
      { id: 'mix-brand-sustainability', nameKo: '친환경 지속가능 브랜딩', emoji: '🌿', desc: '자연 소재·리사이클 패키지를 전면에 내세운 친환경 지속가능성 브랜드 캠페인', prompt: 'eco-friendly sustainable brand campaign with natural materials, recycled paper packaging, green product photography, earthy color palette, environmental commitment brand identity', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-brand-collab', nameKo: '브랜드 콜라보 한정판', emoji: '🤝', desc: '두 브랜드가 협업해 출시하는 화제성 한정판 컬렉션 패키지 디자인', prompt: 'luxury brand collaboration limited edition product packaging, two brand logos side by side, exclusive collector item, special edition design, unboxing reveal aesthetic', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-brand-mascot', nameKo: '브랜드 캐릭터 & 마스코트', emoji: '🐾', desc: '브랜드 정체성을 대표하는 친근하고 개성 있는 마스코트 캐릭터 디자인', prompt: 'charming brand mascot character design with distinct personality, various emotion poses, brand color scheme, logo integration, cute and memorable corporate character illustration', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-brand-experiential', nameKo: '브랜드 체험 팝업 공간', emoji: '🎪', desc: '소비자가 브랜드 스토리를 직접 체험하는 몰입형 팝업 스토어 공간 연출', prompt: 'immersive brand experience pop-up store with interactive installations, brand storytelling environment, experiential retail design, photogenic selfie corner, unique retail activation', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-brand-social-media', nameKo: '소셜미디어 바이럴 캠페인', emoji: '📱', desc: '틱톡·인스타 챌린지를 활용한 바이럴 소셜미디어 마케팅 캠페인', prompt: 'viral social media brand campaign content grid showing TikTok and Instagram posts, user-generated content montage, hashtag challenge participation, brand engagement metrics', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-brand-packaging', nameKo: '프리미엄 언박싱 패키징', emoji: '📦', desc: '개봉 순간부터 감동을 주는 프리미엄 브랜드 패키지 디자인', prompt: 'premium brand unboxing experience with luxury matte black box, magnetic closure, tissue paper, product reveal, artisanal packaging design, high-end retail aesthetic', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-brand-b2b', nameKo: 'B2B 기업 브랜드 아이덴티티', emoji: '🏢', desc: '비즈니스 고객을 대상으로 신뢰와 전문성을 표현하는 B2B 기업 브랜딩', prompt: 'professional B2B corporate brand identity design with logo on office building signage, business cards, PowerPoint templates, corporate stationery, consistent brand guidelines', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-brand-rebranding', nameKo: '레거시 브랜드 리브랜딩', emoji: '🔄', desc: '오래된 브랜드를 현대적으로 재해석하는 리브랜딩 전·후 비교 캠페인', prompt: 'brand rebranding transformation showing before and after comparison, logo redesign evolution, modernized visual identity, fresh contemporary brand refresh, heritage brand reinvention', group: 'life', scene: 'people', usage: 'promo' },
    ],
    space: [
      {
        id: 'mix-space-rocket-launch',
        nameKo: '우주 로켓 발사',
        emoji: '🚀',
        desc: '발사대를 박차고 거대한 연기구름을 뿜으며 밤하늘로 솟구치는 우주 로켓.',
        prompt: 'a heavy space rocket launching into the starry dark night sky, with a huge plume of glowing fiery smoke, intense orange exhaust flame, and structural steel launch tower',
        group: 'urban',
        scene: 'space',
        usage: 'plan'
      },
      {
        id: 'mix-space-satellite-orbit',
        nameKo: '지구 궤도 위성 통신',
        emoji: '🛰️',
        desc: '푸른 지구를 내려다보며 태양광 패널을 활짝 펼치고 도는 통신 위성.',
        prompt: 'a high-tech communications satellite with large golden solar panels extended, orbiting above the glowing curvature of blue planet Earth in dark deep space',
        group: 'urban',
        scene: 'space',
        usage: 'plan'
      },
      {
        id: 'mix-space-mars-colony',
        nameKo: '화성 거주지 개척 기지',
        emoji: '🏠',
        desc: '붉은 먼지 폭풍이 부는 화성 지표면에 건설된 유리 돔 형태의 우주 기지.',
        prompt: 'a futuristic mars colony with multiple interconnected geodesic dome greenhouses on the reddish Martian dusty landscape, a tiny mars rover nearby, starry sky',
        group: 'urban',
        scene: 'space',
        usage: 'plan'
      },
      {
        id: 'mix-space-asteroid-mining',
        nameKo: '소행성 자원 탐사 채굴',
        emoji: '⛏️',
        desc: '우주 공간에 떠 있는 소행성에 고정되어 레이저로 광물을 캐는 특수선.',
        prompt: 'a specialized industrial spacecraft anchored to a giant rugged asteroid, firing high-power orange lasers to extract glowing space minerals in deep void',
        group: 'urban',
        scene: 'space',
        usage: 'plan'
      },
      {
        id: 'mix-space-space-station',
        nameKo: '우주 정거장 허브 내부',
        emoji: '🛸',
        desc: '무중력 상태의 모듈 내부 기계 장치들과 거대한 관측창 너머의 지구.',
        prompt: 'interior view of a futuristic space station cupola module, with high-tech controls, a floating astronaut in a white suit, looking at the giant blue Earth',
        group: 'urban',
        scene: 'space',
        usage: 'plan'
      },
      {
        id: 'mix-space-deep-space-telescope',
        nameKo: '제임스웹 심우주 망원경',
        emoji: '🔭',
        desc: '벌집 모양 금빛 거울 반사판이 우주의 성운과 은하를 포착하는 순간.',
        prompt: 'a massive space telescope with a hexagonal gold-plated primary mirror array, facing a colorful swirling cosmic nebula in the background, deep space stars',
        group: 'urban',
        scene: 'space',
        usage: 'plan'
      },
      {
        id: 'mix-space-orbital-hotel',
        nameKo: '궤도 우주 호텔 투어',
        emoji: '🏨',
        desc: '인공 중력을 위해 회전하는 거대한 원형 링 구조의 럭셔리 우주 정거장.',
        prompt: 'a colossal wheel-shaped space hotel rotating in low Earth orbit, with glowing window lights showing cozy suites, luxury travelers, and Earth curvature background',
        group: 'urban',
        scene: 'space',
        usage: 'plan'
      },
      {
        id: 'mix-space-fusion-propulsion',
        nameKo: '핵융합 추진 우주 엔진',
        emoji: '💫',
        desc: '심우주 탐사를 위해 항해하는 거대한 탐사선 후미의 파란색 핵융합 화염.',
        prompt: 'a long interstellar explorer spaceship traveling through the void, propelled by a brilliant glowing blue thermonuclear fusion exhaust flame at its tail',
        group: 'urban',
        scene: 'space',
        usage: 'plan'
      },
      { id: 'mix-space-lunar-base', nameKo: '달 표면 기지 건설', emoji: '🌕', desc: '인류 재정착을 위한 달 표면 돔형 거주 기지와 태양광 패널 설비', prompt: 'lunar base habitat on moon surface with dome-shaped pressurized modules, solar array panels, astronauts in spacesuits, Earth rising in background, grey crater lunar landscape', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-space-elevator', nameKo: '우주 엘리베이터 케이블', emoji: '🛗', desc: '지구 적도에서 정지궤도까지 연결된 카본 나노튜브 우주 엘리베이터', prompt: 'space elevator concept with a tethered cable rising from equatorial ocean platform to geostationary orbit, climber vehicle ascending, carbon nanotube ribbon, orbital ring station', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-space-asteroid-mining', nameKo: '소행성 광물 채굴', emoji: '⛏️', desc: '금속 자원이 풍부한 소행성 표면에서 로봇이 광물을 채굴하는 장면', prompt: 'robotic mining spacecraft drilling and extracting minerals from metallic asteroid surface, processing ore in zero gravity, space resource extraction operation, asteroid belt setting', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-space-mars-colony', nameKo: '화성 테라포밍 정착지', emoji: '🔴', desc: '화성 환경을 개조해 인류 정착지를 구축하는 테라포밍 프로젝트 비주얼', prompt: 'Mars colony with biodome habitats on red Martian surface, terraforming atmospheric processors, human settlement with greenhouses, Phobos in sky, long-term human Mars civilization', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-space-deep-probe', nameKo: '딥스페이스 탐사 우주선', emoji: '🛸', desc: '태양계 바깥 성간 공간을 항해하는 무인 딥스페이스 탐사선', prompt: 'deep space probe spacecraft voyaging through interstellar space, radioisotope thermoelectric generator RTG, distant star field background, scientific instruments deployed, NASA JPL aesthetic', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-space-tourism', nameKo: '민간 우주 관광 스테이션', emoji: '🏨', desc: '지구 저궤도에 설치된 민간 우주 호텔과 관광 스테이션', prompt: 'private space tourism station in low Earth orbit with viewing windows overlooking Earth, rotating habitat ring for gravity, luxury space hotel, commercial space travel destination', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-space-geo-satellite', nameKo: '정지궤도 기상 위성', emoji: '🛰️', desc: '지구 정지궤도에서 기상 현상을 관측하는 대형 기상 위성', prompt: 'large geostationary weather satellite in orbit above Earth, solar panels deployed, Earth observation sensors scanning cloud patterns and storm systems, meteorological satellite technology', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-space-exoplanet', nameKo: '외계 행성 탐사 로버', emoji: '🌌', desc: '지구형 외계 행성 표면을 탐사하는 AI 자율주행 우주 탐사 로버', prompt: 'autonomous space rover exploring surface of Earth-like exoplanet with alien landscape, two suns in sky, scientific instruments scanning terrain, astrobiology exploration mission', group: 'urban', scene: 'space', usage: 'plan' },
    ],

    // ==================== 지역산업 & 거점도시 ====================
    regional: [
      {
        id: 'mix-regional-sample-harbor',
        nameKo: '해솔 영일만 산업 항만',
        emoji: '⚓',
        desc: '영일만을 배경으로 한 제철·화학 항만 시설과 대형 크레인.',
        prompt: 'aerial panoramic view of a massive industrial harbor district with large cranes, steel factory smokestacks and pipes reflecting in calm harbor water at dusk, East Sea coastline industrial port',
        group: 'public',
        scene: 'facility',
        usage: 'plan'
      },
      {
        id: 'mix-regional-postech-campus',
        nameKo: '포스텍 & 연구개발 캠퍼스',
        emoji: '🎓',
        desc: '첨단 연구소와 유리·콘크리트 건축물이 어우러진 과학기술 캠퍼스.',
        prompt: 'modern science and technology university research campus with sleek glass and concrete buildings, open green plazas, researchers collaborating in labs, bright sunny day',
        group: 'public',
        scene: 'facility',
        usage: 'plan'
      },
      {
        id: 'mix-regional-smart-greenindu',
        nameKo: '스마트그린 산업단지',
        emoji: '🏭',
        desc: '태양광 패널과 스마트 센서가 통합된 친환경 첨단 산업단지.',
        prompt: 'aerial view of a modern smart green industrial complex with solar panels installed on factory rooftops, green landscaping buffers, digital sensor network nodes connecting facilities, clean and organized',
        group: 'public',
        scene: 'facility',
        usage: 'plan'
      },
      {
        id: 'mix-regional-secondary-battery',
        nameKo: '이차전지 소재 클러스터',
        emoji: '🔋',
        desc: '양극재·음극재 등 이차전지 핵심 소재 생산 시설.',
        prompt: 'high-tech battery material production facility with large industrial chemical reactors, automated conveyor systems processing cathode and anode material powder, clean room environments',
        group: 'public',
        scene: 'facility',
        usage: 'plan'
      },
      {
        id: 'mix-regional-hydrogen-hub',
        nameKo: '동해안 수소 경제 허브',
        emoji: '💨',
        desc: '연안 수소 생산·저장 탱크와 파이프라인 인프라.',
        prompt: 'large spherical hydrogen storage tanks along a coastal industrial area, connected by silver pipeline networks, mountains and East Sea in the background, clean blue sky',
        group: 'public',
        scene: 'facility',
        usage: 'plan'
      },
      {
        id: 'mix-regional-blue-economy',
        nameKo: '동해 블루이코노미',
        emoji: '🌊',
        desc: '해상 양식장, 해양 에너지, 수산 가공이 공존하는 동해 해양 산업.',
        prompt: 'offshore platform in the East Sea with aquaculture net cage arrays, submarine power cables, distant offshore wind turbines on the horizon, combining marine resources and clean energy',
        group: 'public',
        scene: 'facility',
        usage: 'plan'
      },
      {
        id: 'mix-regional-agribio-complex',
        nameKo: '경북 농생명 특화단지',
        emoji: '🌿',
        desc: '스마트팜·바이오 발효 시설과 경북 농업 생태계가 어우러진 단지.',
        prompt: 'modern smart farm greenhouse complex with automated hydroponic cultivation systems and bio-fermentation tanks, surrounded by terraced agricultural landscapes in a mountain valley, North Gyeongsang style scenery',
        group: 'public',
        scene: 'facility',
        usage: 'plan'
      },
      {
        id: 'mix-regional-innovation-center',
        nameKo: '지역 혁신거점 센터',
        emoji: '🏢',
        desc: '혁신지원센터·창업 허브·지원 기관이 집적된 첨단 혁신 센터 빌딩.',
        prompt: 'a modern regional innovation center building with floor-to-ceiling glass windows, collaborative co-working spaces visible inside, startup signage on facade, diverse entrepreneurs and researchers gathered around',
        group: 'public',
        scene: 'facility',
        usage: 'plan'
      },
      { id: 'mix-regional-special-zone', nameKo: '기업도시 & 경제특구', emoji: '🏙️', desc: '민간 기업 주도로 개발되는 자족형 기업도시와 경제자유구역 조성', prompt: 'enterprise city development aerial view with mixed-use towers, industrial park, research campus, residential areas, transport hub, special economic zone master plan visualization', group: 'public', scene: 'facility', usage: 'plan' },
      { id: 'mix-regional-anchor', nameKo: '앵커 기업 유치 협약식', emoji: '🤝', desc: '지역 경제를 이끌 대형 앵커 기업 투자 유치 서명식 행사', prompt: 'official anchor company investment signing ceremony, executives shaking hands with local government officials, media backdrop, flags, formal business cooperation agreement event', group: 'public', scene: 'facility', usage: 'plan' },
      { id: 'mix-regional-startup-campus', nameKo: '지역 스타트업 캠퍼스', emoji: '🚀', desc: '청년 창업가들이 모이는 지역 기반 오픈 이노베이션 스타트업 허브', prompt: 'vibrant regional startup campus with co-working space, innovation labs, pitched startup demos, young entrepreneurs collaborating, accelerator program, local innovation ecosystem', group: 'public', scene: 'facility', usage: 'plan' },
      { id: 'mix-regional-local-brand', nameKo: '지역 특산품 브랜드화', emoji: '🏷️', desc: '지역 농수산물과 특산품을 프리미엄 브랜드로 개발하는 6차 산업화', prompt: 'premium local specialty product branding with beautifully designed packaging, regional origin label, artisan food products, geographical indication, local brand development', group: 'public', scene: 'facility', usage: 'plan' },
      { id: 'mix-regional-heritage', nameKo: '전통 산업 스마트 고도화', emoji: '⚙️', desc: '섬유·세라믹·식품 등 전통 지역 산업을 스마트 기술로 고도화', prompt: 'smart technology modernization of traditional regional industry such as ceramics or textile factory, AI quality control robots, digital transformation of heritage manufacturing', group: 'public', scene: 'facility', usage: 'plan' },
      { id: 'mix-regional-tech-valley', nameKo: '지역 혁신 테크밸리', emoji: '💡', desc: '대학·연구소·기업이 삼각 협력하는 지역 혁신 클러스터 테크밸리', prompt: 'regional technology valley with university research building, corporate R&D lab, startup incubator, triple helix collaboration, innovation district aerial master plan', group: 'public', scene: 'facility', usage: 'plan' },
      { id: 'mix-regional-export', nameKo: '지역 수출 산업 클러스터', emoji: '🌐', desc: '수출 주력 산업이 집적된 지역 특화 산업 단지와 물류 인프라', prompt: 'regional export industrial cluster with specialized manufacturing facilities, port logistics, international trade fair, global supply chain, local product export promotion', group: 'public', scene: 'facility', usage: 'plan' },
      { id: 'mix-regional-rural-revital', nameKo: '농산어촌 활성화 사업', emoji: '🌾', desc: '청년 귀농·관광·6차 산업 융합으로 활성화되는 농산어촌 지역 재생', prompt: 'rural village revitalization project with young farmers, agro-tourism facilities, farm-to-table restaurant, local market, regenerating countryside community, rural innovation', group: 'public', scene: 'facility', usage: 'plan' },
    ],

    // ==================== 정책 & 공공지원 ====================
    policy: [
      {
        id: 'mix-policy-rd-funding',
        nameKo: '국가 R&D 과제 기획',
        emoji: '📋',
        desc: '정부 연구개발 과제 기획·공모·심사 프로세스를 보여주는 다이어그램.',
        prompt: 'government R&D project planning concept illustration, connected flowcharts with scientific research icons, budget allocation nodes, and officials pointing at a structured project roadmap whiteboard',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-policy-innovation-hub-incubation',
        nameKo: '혁신지원센터 창업 보육',
        emoji: '🌱',
        desc: '혁신지원센터 입주기업에 대한 멘토링·공간·자금 지원 생태계.',
        prompt: 'bright startup incubator workspace inside a modern innovation hub building, entrepreneurs working on laptops at open desks, mentors consulting with startup teams, business pitch presentations on screens',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-policy-industrial-complex',
        nameKo: '국가 산업단지 지정·조성',
        emoji: '📐',
        desc: '관계부처와 지자체가 합동으로 산업단지를 기획·설계하는 장면.',
        prompt: 'government planning session for a national industrial complex, large detailed blueprint maps spread on a conference table, public officials and urban planners discussing site design, formal meeting room',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-policy-sme-support',
        nameKo: '중소·벤처기업 지원사업',
        emoji: '🤝',
        desc: '정부 지원금 선정 심사 및 협약 체결 장면.',
        prompt: 'formal government funding award ceremony for small and medium enterprises, officials and business representatives shaking hands, framed award certificates, national and local government flag backdrop',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-policy-regional-innovation',
        nameKo: '지역혁신 클러스터 (RIS)',
        emoji: '🔗',
        desc: '지역 내 산·학·연·관이 협력하는 혁신 생태계 네트워크.',
        prompt: 'regional innovation cluster ecosystem infographic concept, interconnected nodes representing universities, research institutes, companies, and government agencies connected by glowing collaboration links',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-policy-esg-reporting',
        nameKo: '공공기관 ESG 경영 공시',
        emoji: '📊',
        desc: 'ESG 경영 성과 보고와 탄소중립 목표 시각화.',
        prompt: 'corporate ESG sustainability report concept, professional clean white layout featuring green leaf, solar energy panel, social equality, and governance icons, corporate responsibility annual disclosure',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-policy-smart-admin',
        nameKo: '디지털 공공행정 서비스',
        emoji: '📱',
        desc: '전자정부 플랫폼과 모바일 앱을 통한 비대면 행정 민원 처리.',
        prompt: 'modern digital government service platform on multiple screens, citizen digital ID cards, online document applications, approval workflow notifications, clean and accessible UI design',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-policy-performance-mgmt',
        nameKo: '공공기관 성과 관리',
        emoji: '📈',
        desc: '연간 경영 성과지표 대시보드와 KPI 달성률 보고 회의.',
        prompt: 'digital performance management dashboard on a large display in a government conference room, annual KPI metric cards, target achievement progress bars, trend graphs, formal meeting setting',
        group: 'public',
        scene: 'service',
        usage: 'plan'
      },
      { id: 'mix-policy-reg-sandbox', nameKo: '규제 샌드박스 혁신 특례', emoji: '🧪', desc: '신기술·신사업의 임시 허가와 규제 실증 특례를 운영하는 혁신 제도', prompt: 'regulatory sandbox innovation exemption concept, new technology pilot testing in controlled environment, government approval sandbox framework, fintech or mobility innovation test zone', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-policy-startup-fund', nameKo: '창업 지원 정책 펀드', emoji: '💰', desc: '정부 모태펀드 기반의 창업·벤처 투자 생태계 조성 지원 사업', prompt: 'government startup support fund investment ecosystem, venture fund allocation chart, startup acceleration grant application process, policy funding for entrepreneurs, innovation support', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-policy-carbon-market', nameKo: '탄소 배출권 거래 시장', emoji: '🌱', desc: '온실가스 감축 목표 달성을 위한 배출권 거래제(ETS) 시장 시각화', prompt: 'carbon emissions trading market visualization with ETS allowance trading chart, CO2 reduction certificates, green credit exchange platform, cap and trade mechanism', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-policy-oda', nameKo: '공적 개발 원조 ODA 사업', emoji: '🌍', desc: '개발도상국 경제 성장을 지원하는 한국형 ODA 개발 협력 사업', prompt: 'Korean ODA development assistance project in developing country, infrastructure construction, training program, health facility, international development cooperation, K-ODA branding', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-policy-smartcity-plan', nameKo: '스마트시티 종합 계획', emoji: '🏙️', desc: '국가 주도 스마트시티 시범도시 조성 마스터플랜 시각화', prompt: 'national smart city master plan visualization, pilot smart city development zones, mobility-energy-welfare-governance digital integration, smart city government policy roadmap', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-policy-industry-육성', nameKo: '전략 산업 육성 정책', emoji: '🏭', desc: '반도체·배터리·바이오 등 국가 전략 산업 집중 육성 정책 로드맵', prompt: 'national strategic industry development policy roadmap for semiconductors batteries biotech, government investment in future industries, strategic sector growth policy visualization', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-policy-welfare', nameKo: '복지 정책 수혜 서비스', emoji: '🏥', desc: '취약 계층이 복지 급여와 서비스를 디지털로 신청하는 복지 전달 체계', prompt: 'digital welfare service portal interface, vulnerable population benefit application, social safety net service map, government welfare delivery system, inclusive digital government', group: 'public', scene: 'service', usage: 'plan' },
      { id: 'mix-policy-procurement', nameKo: '공공 조달 혁신 플랫폼', emoji: '📋', desc: '전자조달 시스템으로 투명하게 진행되는 공공 계약·입찰 프로세스', prompt: 'e-procurement public bidding platform interface, transparent government contract process, digital bid submission, public sector purchasing system, open procurement data dashboard', group: 'public', scene: 'service', usage: 'plan' },
    ],

    // ==================== 도시 & 건축 공간 ====================
    urban: [
      { id: 'mix-urban-skyscraper', nameKo: '미래형 초고층 빌딩', emoji: '🏙️', desc: '유리 커튼월과 녹지 테라스가 조화로운 초고층 빌딩 스카이라인', prompt: 'futuristic supertall skyscraper with glass curtain wall facade and hanging sky gardens, dramatic city skyline at dusk, modern urban architecture', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-smarthome', nameKo: '스마트홈 IoT 인테리어', emoji: '🏠', desc: '터치 패널과 AI 허브로 제어되는 스마트홈 거실', prompt: 'modern smart home living room with voice-controlled AI hub, smart lighting panels, automated blinds, and integrated IoT screens showing home status', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-modular', nameKo: '모듈형 조립식 주거', emoji: '📦', desc: '컨테이너·모듈을 적층해 조성한 미래형 공동주거', prompt: 'modular stacked container housing units with colorful exterior panels and balcony gardens, innovative prefabricated urban residential architecture', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-retail', nameKo: '팝업 스마트 리테일', emoji: '🛍️', desc: 'AR 피팅·자동 결제 키오스크가 결합된 스마트 팝업 스토어', prompt: 'high-tech pop-up retail space with interactive AR fitting mirrors, self-checkout kiosks, digital signage, and modern minimalist store design', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-regen', nameKo: '도심 재생 복합 문화 공간', emoji: '🎨', desc: '낡은 공장을 리모델링한 복합 문화 예술 센터', prompt: 'industrial warehouse converted into a vibrant mixed-use cultural arts center with exposed brick, modern glass extensions, art installations, and café', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-waterfront', nameKo: '워터프런트 & 수변 공원', emoji: '🌿', desc: '강·해안가를 따라 조성된 친환경 수변 공원 조경', prompt: 'beautifully landscaped waterfront park with walking promenades, modern pedestrian bridges, native plantings, and people enjoying riverside greenspace', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-transit', nameKo: '복합 환승 개발 (TOD)', emoji: '🚇', desc: '지하철역 위에 들어선 주거·상업·공원 복합 개발 단지', prompt: 'transit-oriented development complex above a metro station, high-rise residential and commercial towers with elevated green plaza, urban integration', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-zeroenergy', nameKo: '제로에너지 그린 빌딩', emoji: '♻️', desc: '태양광 외벽, 지열 냉난방, 빗물 재활용이 통합된 녹색 건축', prompt: 'zero-energy green building with solar panel facade, living green walls, wind turbines on rooftop, and rainwater collection systems, sustainable architecture', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-autonomous-city', nameKo: '자율주행 특화 스마트 도시', emoji: '🚗', desc: '자율주행 전용 도로와 MaaS 통합 모빌리티가 설계된 스마트 도시', prompt: 'smart city designed for autonomous vehicles with dedicated AV lanes, sensor poles, vehicle-to-infrastructure V2X network, mobility-as-a-service hub, futuristic urban transport', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-cultural-district', nameKo: '역사 문화 특화 지구', emoji: '🏛️', desc: '역사 건물 보존과 현대 문화 시설이 조화된 문화 역사 지구', prompt: 'historic cultural district with restored heritage buildings alongside modern cultural facilities, museum, art gallery, pedestrian promenade, tourism zone, history meets contemporary design', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-green-corridor', nameKo: '도시 녹지 연결 코리도', emoji: '🌳', desc: '분절된 도시 공원을 연결하는 대형 녹지 생태 축 코리도', prompt: 'urban green corridor connecting parks and nature, linear park promenade, tree-lined walking and cycling path, urban biodiversity habitat, city ecological connectivity network', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-mixed-tower', nameKo: '주상복합 타워 개발', emoji: '🏢', desc: '주거·상업·호텔·오피스가 하나의 타워에 통합된 복합 개발', prompt: 'mixed-use supertall tower with residential floors above, commercial retail podium, hotel and office sections, rooftop amenity deck, urban landmark architecture', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-underground', nameKo: '지하 도시 인프라 네트워크', emoji: '🚇', desc: '지하 공간을 활용한 물류·전력·통신 통합 도시 인프라 네트워크', prompt: 'underground urban infrastructure network with metro tunnels, utility corridors, underground freight logistics, fiber optic cables, cross-section technical illustration of city below ground', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-24h', nameKo: '24시간 야간 경제 도심', emoji: '🌃', desc: '야간 문화·경제 활동이 활성화된 빛나는 24시간 도심 경관', prompt: '24-hour vibrant night economy city with illuminated entertainment district, restaurants and bars, night market street food, neon signs, lively nightlife cityscape photography', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-bike-network', nameKo: '자전거 친화 도시 네트워크', emoji: '🚴', desc: '전용 자전거 도로와 공유 바이크 시스템이 완비된 자전거 친화 도시', prompt: 'bicycle-friendly city with dedicated protected bike lanes, bike-sharing stations at every corner, cyclists commuting, urban cycling infrastructure, car-free zone, sustainable mobility', group: 'urban', scene: 'space', usage: 'plan' },
      { id: 'mix-urban-flood-resilient', nameKo: '홍수 탄력 도시 방재', emoji: '🌊', desc: '스펀지 도시 개념으로 폭우와 홍수에 강한 방재 도시 인프라', prompt: 'flood resilient sponge city design with permeable pavements, bioswale channels, retention ponds, green roofs absorbing rainwater, urban flood management infrastructure', group: 'urban', scene: 'space', usage: 'plan' },
    ],

    // ==================== 푸드 & 농식품 ====================
    food: [
      { id: 'mix-food-cultured-meat', nameKo: '푸드테크 배양육', emoji: '🥩', desc: '생물반응기에서 세포 배양으로 생산되는 대체 단백질', prompt: 'high-tech cultivated meat bioreactor growing beef cells in a sterile laboratory, petri dishes, cell culture medium, food technology innovation', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-vertical-farm', nameKo: '스마트팜 수직 농업', emoji: '🥬', desc: 'LED 조명과 수경재배 시스템으로 운영되는 도심 수직 농장', prompt: 'multi-tier vertical hydroponic farm inside a modern facility, rows of fresh green lettuce under pink and purple LED grow lights, automated irrigation system', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-korean-fine', nameKo: '프리미엄 한식 코스 요리', emoji: '🍱', desc: '모던 한식 파인 다이닝의 아름다운 플레이팅', prompt: 'elegant modern Korean fine dining course meal beautifully plated, traditional ceramic dishware, seasonal ingredients, artistic food presentation, warm restaurant lighting', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-plant-protein', nameKo: '식물성 대체 단백질', emoji: '🌱', desc: '콩·완두 등 식물 원료로 만든 미래형 대체 단백질 식품', prompt: 'futuristic plant-based protein products arranged on a clean white table, pea protein ingredients, modern healthy food packaging, green and natural aesthetic', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-fermentation', nameKo: '발효 바이오 식품', emoji: '🫙', desc: '전통 발효 기술과 현대 바이오가 결합된 기능성 식품 공정', prompt: 'traditional and modern fermentation facility with large ceramic jars and stainless steel bioreactors, producing probiotic and functional food products', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-coldchain', nameKo: '콜드체인 신선 물류', emoji: '🚛', desc: '정온 냉장 물류로 신선 식품을 빠르고 안전하게 배송하는 시스템', prompt: 'modern cold chain logistics warehouse with refrigerated storage racks, temperature monitoring IoT sensors, and fresh produce delivery trucks, food supply chain', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-farmersmarket', nameKo: '로컬 푸드 파머스마켓', emoji: '🥦', desc: '지역 생산자가 직접 판매하는 활기찬 로컬 파머스 마켓', prompt: 'vibrant local farmers market outdoor scene, colorful fresh produce stalls, vegetables and fruits, local producers, sunny day, community gathering atmosphere', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-molecular', nameKo: 'F&B 분자 요리', emoji: '🫧', desc: '액체 질소·구체화 기법으로 만드는 아방가르드 미식 요리', prompt: 'avant-garde molecular gastronomy dish with spherification, liquid nitrogen smoke, geometric food art, colorful unusual food presentation, high-end restaurant atmosphere', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-traditional-craft', nameKo: '전통주 & 장인 발효 식품', emoji: '🍶', desc: '전통 방식으로 빚은 막걸리·전통주와 된장·간장 장인 발효 식품', prompt: 'traditional Korean craft alcohol makgeolli and artisan fermented food, ceramic jars, wooden table setting, traditional brewing process, heritage fermentation craftsmanship', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-agri-drone', nameKo: '농업 드론 정밀 농업', emoji: '🚁', desc: 'AI 드론이 작물 상태를 분석하고 농약·비료를 정밀 살포하는 스마트팜', prompt: 'agricultural drone precision farming, multirotor UAV spraying fertilizer over rice paddy fields, crop health monitoring, smart agriculture technology, rural farmland aerial view', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-food-safety', nameKo: '식품 안전 검사 시스템', emoji: '🔬', desc: 'AI 비전과 센서로 식품 오염·이물질을 자동 검출하는 안전 검사 라인', prompt: 'food safety inspection system with AI vision camera scanning products on conveyor belt, X-ray contaminant detection, microbiological lab testing, food quality control facility', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-fusion', nameKo: '글로벌 퓨전 요리 플레이팅', emoji: '🌏', desc: '동서양 식재료와 조리법을 융합한 크리에이티브 퓨전 요리 플레이팅', prompt: 'creative global fusion cuisine plating, east meets west ingredients on slate plate, artistic food arrangement, chef garnishing, fine dining restaurant, multicultural gastronomy', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-aquaculture', nameKo: '스마트 양식 수산업', emoji: '🐟', desc: 'IoT 수질 관제와 자동 급이 시스템을 갖춘 첨단 스마트 양식장', prompt: 'smart aquaculture fish farm with IoT water quality sensors, automated feeding system, fish school in clear tanks, high-tech inland recirculating aquaculture system RAS', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-upcycle', nameKo: '식품 업사이클링 신소재', emoji: '♻️', desc: '버려지던 식품 부산물을 새로운 식재료나 포장재로 재탄생시키는 업사이클링', prompt: 'food upcycling innovation lab creating new ingredients from food waste byproducts, spent grain products, fruit peel extracts, sustainable food circular economy, creative food science', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-cafe-culture', nameKo: '카페 & 스페셜티 커피 문화', emoji: '☕', desc: '직접 로스팅한 싱글 오리진 원두의 브루잉과 카페 공간 문화', prompt: 'specialty coffee cafe with barista carefully brewing single origin pour-over coffee, roasted beans, espresso extraction, cozy cafe interior, third wave coffee culture aesthetic', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-food-dessert-art', nameKo: '파티스리 & 디저트 아트', emoji: '🍰', desc: '마스터 파티시에의 예술적 케이크 데코레이션과 디저트 플레이팅', prompt: 'master pastry chef artisanal dessert creation, elegantly decorated cake with edible flowers, patisserie display case, dessert art plating, luxurious confectionery craftsmanship', group: 'life', scene: 'people', usage: 'promo' },
    ],

    // ==================== 문화 & 관광 ====================
    culture: [
      { id: 'mix-culture-kpop', nameKo: 'K-팝 & 한류 콘서트', emoji: '🎤', desc: '화려한 무대 LED와 열광하는 관중의 K-팝 공연 현장', prompt: 'spectacular K-pop concert stage with massive LED screen backdrop, laser show, and thousands of glowing audience lightsticks in the arena, energetic performance', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-heritage', nameKo: '전통 문화재 야간 개장', emoji: '🏯', desc: '은은한 조명으로 빛나는 전통 사찰·궁궐의 야간 특별 개장', prompt: 'Korean traditional palace or temple illuminated with warm golden lanterns and modern light art projections at night, serene cultural heritage tourism atmosphere', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-festival', nameKo: '지역 축제 퍼포먼스', emoji: '🎭', desc: '지역 특색을 살린 전통 무예·민속 공연 축제', prompt: 'colorful traditional Korean cultural festival performance with masked dancers, traditional costumes, percussion drumming, outdoor stage, joyful crowd', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-museum', nameKo: '현대 미술관 전시', emoji: '🖼️', desc: '대형 설치 미술과 인터랙티브 미디어아트가 공존하는 현대 미술관', prompt: 'contemporary art museum interior with large-scale installation art, interactive digital media artwork on walls, minimalist white gallery spaces, visitors exploring', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-heritage-tour', nameKo: '역사 도시 역사 투어', emoji: '🗺️', desc: '한국 전통 마을과 역사 도심을 걷는 문화 관광 코스', prompt: 'traditional Korean Hanok village street with historic architecture, stone-paved alleyways, tourists in hanbok, blooming trees, warm cultural heritage atmosphere', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-wellness', nameKo: '웰니스 & 힐링 리조트', emoji: '🧘', desc: '자연 속 명상·스파·요가가 어우러진 프리미엄 웰니스 리조트', prompt: 'premium wellness resort spa pool surrounded by nature, meditation pavilion over tranquil water, guests doing yoga, lush greenery, serene relaxation atmosphere', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-sports', nameKo: '스포츠 & 어드벤처 투어', emoji: '🏄', desc: '서핑·등반·트레일 등 액티브한 스포츠 관광 체험', prompt: 'exciting outdoor adventure sports tourism, surfers on ocean waves, mountain climbers on rock face, cyclists on mountain trail, active lifestyle and nature tourism', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-mice', nameKo: 'MICE 컨벤션 전시회', emoji: '🎪', desc: '대형 전시 부스와 국제 참가자들이 어우러진 MICE 전시회', prompt: 'large international trade show convention hall with elaborate themed exhibition booths, attendees networking, LED signage, professional event atmosphere', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-street-art', nameKo: '거리 예술 & 공공 퍼포먼스', emoji: '🎭', desc: '도심 광장에서 펼쳐지는 거리 예술 공연과 인터랙티브 공공 미술', prompt: 'vibrant street art performance in city square, live acrobatics and music, colorful public art murals, crowd gathering, urban cultural festival, outdoor performance art', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-traditional-craft', nameKo: '무형문화재 전통 공예', emoji: '🏺', desc: '장인이 손으로 빚는 도자기·칠기·한지 등 무형문화재 전통 공예', prompt: 'master craftsman hands shaping traditional ceramic pottery on a wheel, kiln firing, Korean celadon or white porcelain traditional craft, intangible cultural heritage artisan', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-music-festival', nameKo: '글로벌 음악 페스티벌', emoji: '🎵', desc: '야외 대형 무대에서 펼쳐지는 국제 뮤직 페스티벌 현장', prompt: 'massive outdoor music festival stage with epic lighting show, crowd of thousands, colorful stage production, international music festival atmosphere, concert pyrotechnics', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-webtoon', nameKo: '웹툰 & 디지털 만화 산업', emoji: '📱', desc: '모바일 웹툰 플랫폼에서 글로벌로 유통되는 한국 디지털 만화 산업', prompt: 'digital webtoon creation process showing artist drawing on tablet, vertical scrolling webcomic panels, Korean webtoon platform app, global digital manga comics industry', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-esports', nameKo: 'e스포츠 경기 아레나', emoji: '🎮', desc: '수만 명 관중이 응원하는 글로벌 e스포츠 대회 경기장', prompt: 'e-sports arena championship event with huge LED screens showing game action, professional gaming teams at stations, thousands of cheering fans, dramatic lighting effects', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-food-tour', nameKo: '미식 관광 & 로컬 푸드 투어', emoji: '🗺️', desc: '지역 먹거리와 음식 문화를 탐방하는 미식 관광 프로그램', prompt: 'gastronomic food tour experience with tourists sampling local street food, traditional market stalls, guide explaining regional cuisine, cultural food tourism, culinary travel', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-culture-media-facade', nameKo: '디지털 미디어 파사드', emoji: '🌆', desc: '건물 외벽 전체를 캔버스로 활용하는 대형 미디어 아트 파사드', prompt: 'large building facade transformed by massive media art projection mapping, colorful digital artwork covering architecture surface, night time immersive light show, public art', group: 'life', scene: 'people', usage: 'promo' },
    ],

    // ==================== 교육 & 연구 ====================
    education: [
      { id: 'mix-edu-lab', nameKo: '대학 첨단 연구실', emoji: '🔬', desc: '최신 실험 장비가 갖춰진 대학 연구소의 실험 장면', prompt: 'cutting-edge university research laboratory with advanced scientific equipment, researchers in white lab coats conducting experiments, modern lab interior', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-smart-class', nameKo: 'AI 기반 스마트 교실', emoji: '📺', desc: 'AI 튜터와 인터랙티브 디스플레이가 활용되는 미래형 교실', prompt: 'futuristic smart classroom with interactive touchscreen walls, AI teaching assistant avatar on display, students using tablets, personalized learning technology', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-vr-learning', nameKo: 'VR 실감형 교육 콘텐츠', emoji: '🕶️', desc: 'VR 헤드셋으로 역사·과학·우주를 체험하는 몰입형 교육', prompt: 'students wearing VR headsets experiencing immersive educational content, virtual field trip to historical sites or space, next-generation experiential learning', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-stem', nameKo: '과학 실험 STEM 교육', emoji: '⚗️', desc: '화학 실험·코딩·로봇 제작을 통한 창의적 STEM 교육', prompt: 'students engaged in hands-on STEM education, chemistry experiments with colorful reactions, robotics building, coding on computers, creative problem-solving', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-online-lms', nameKo: '온라인 평생교육 LMS', emoji: '💻', desc: '학습자 맞춤형 AI 추천 강의가 제공되는 이러닝 플랫폼 UI', prompt: 'modern e-learning platform interface showing AI-recommended courses, progress tracking dashboard, video lecture, quiz modules, digital learning management system', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-conference', nameKo: '국제 학술 컨퍼런스', emoji: '🎓', desc: '해외 석학들이 모인 국제 학술 심포지엄 발표 현장', prompt: 'international academic conference hall with scholar presenting research on stage, large projection screen, global audience of researchers, formal academic symposium', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-special', nameKo: '특수교육 보조 테크', emoji: '🤝', desc: '장애 학생의 학습을 보조하는 AI·로봇 보조 교육 기기', prompt: 'assistive technology for special education, robot companion helping child with disability, AAC communication device, inclusive classroom with adaptive learning tools', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-research-publish', nameKo: '연구 논문 학술 발표', emoji: '📄', desc: '학술 저널 논문 발표 포스터와 학회 발표 장면', prompt: 'academic poster presentation at a research conference, researcher explaining findings with data charts, peer review, scientific journal publication atmosphere', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-stem-lab', nameKo: 'STEM 융합 과학 실험실', emoji: '🔬', desc: '과학·기술·공학·수학을 융합한 체험형 STEM 교육 실험실', prompt: 'hands-on STEM education laboratory with students conducting science experiments, robotics kits, 3D printers, microscopes, engaging project-based learning, modern STEM classroom', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-distance', nameKo: '원격 비대면 교육 플랫폼', emoji: '💻', desc: '실시간 화상 강의와 인터랙티브 콘텐츠로 진행되는 온라인 학습 플랫폼', prompt: 'online distance learning platform interface with live video lecture, interactive quiz, student virtual classroom, e-learning dashboard, digital education remote school screen', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-vr-classroom', nameKo: 'VR 몰입형 가상 교실', emoji: '🥽', desc: 'VR 헤드셋으로 역사 현장이나 우주를 탐험하는 몰입형 가상 교실', prompt: 'students wearing VR headsets in immersive virtual classroom, exploring ancient historical sites or outer space, virtual reality education experience, EdTech immersive learning', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-library', nameKo: '미래형 도서관 지식 허브', emoji: '📚', desc: 'AI 추천 시스템과 메이커 스페이스가 결합된 미래형 지역 도서관', prompt: 'futuristic public library with digital book kiosks, collaborative maker space, 3D printing corner, AI book recommendation system, modern knowledge hub community space', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-skills-training', nameKo: '직업 기술 훈련 캠프', emoji: '🔧', desc: '실무 현장 중심의 직업 훈련과 기능사 자격 취득 교육 캠프', prompt: 'vocational skills training workshop with trainees learning practical hands-on welding, electrical, or IT skills, professional certification program, career technical education', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-gifted', nameKo: '영재 & 특화 교육 프로그램', emoji: '🌟', desc: '수학·과학·예술 영재를 위한 특화 교육 프로그램과 멘토링', prompt: 'gifted education program with talented students engaged in advanced math or science project, mentoring by expert professors, specialized training center for exceptional students', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-ai-language', nameKo: 'AI 언어 학습 플랫폼', emoji: '🌐', desc: 'AI 튜터와 실시간 회화 연습을 제공하는 개인 맞춤형 언어 학습 앱', prompt: 'AI language learning app interface with conversational AI tutor, real-time pronunciation feedback, personalized lesson plan, gamified language acquisition, EdTech language platform', group: 'life', scene: 'people', usage: 'plan' },
      { id: 'mix-edu-univ-startup', nameKo: '대학 창업 인큐베이터', emoji: '🏫', desc: '대학 내 창업 지원 센터에서 학생 스타트업이 성장하는 이노베이션 허브', prompt: 'university startup incubator space with student entrepreneurs working on prototypes, pitch practice area, faculty mentors, startup lab equipment, campus innovation center', group: 'life', scene: 'people', usage: 'plan' },
    ],

    // ==================== 헬스케어 & 의료 ====================
    health: [
      { id: 'mix-health-precision', nameKo: '정밀 의료 & 유전자 치료', emoji: '🧬', desc: '개인 유전체 분석을 기반으로 한 맞춤형 정밀 의료', prompt: 'precision medicine concept, personalized genomic DNA sequencing data on screen, doctor analyzing genetic markers for targeted cancer treatment, advanced medical technology', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-telemedicine', nameKo: '디지털 헬스 원격 진료', emoji: '📱', desc: '스마트폰으로 언제 어디서든 가능한 비대면 원격 의료 서비스', prompt: 'digital health telemedicine consultation, patient speaking with doctor on smartphone or tablet screen, home healthcare monitoring device, connected health ecosystem', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-surgical-robot', nameKo: '수술 로봇 시스템', emoji: '🦾', desc: '정밀한 로봇 팔이 최소 침습 수술을 집도하는 수술실', prompt: 'advanced surgical robot system with multiple precise robotic arms performing minimally invasive surgery, surgeon controlling at console, hi-tech sterile operating room', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-ai-diagnosis', nameKo: '의료 AI 영상 진단', emoji: '🧠', desc: 'AI가 CT·MRI 영상을 분석하여 병변을 자동 탐지', prompt: 'AI medical imaging diagnosis interface showing CT scan with highlighted tumor detection, machine learning analysis overlay, radiology AI assistant, hospital diagnostic workflow', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-wearable', nameKo: '스마트 웨어러블 헬스', emoji: '⌚', desc: '심박·혈당·산소포화도를 실시간 모니터링하는 스마트 워치', prompt: 'smart health wearable device on wrist displaying real-time heart rate, blood oxygen, glucose monitoring data, connected to smartphone health app, personal wellness tracking', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-drone', nameKo: '메디컬 드론 응급 구호', emoji: '🚁', desc: '도서·산간 지역에 약품과 제세동기를 배달하는 의료 드론', prompt: 'medical emergency delivery drone flying over rural mountainous terrain, dropping AED defibrillator or medicine supply pod, autonomous healthcare access innovation', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-mental', nameKo: '정신건강 & 마인드풀니스', emoji: '🧘', desc: 'AI 심리 상담과 명상 앱이 결합된 정신건강 케어 서비스', prompt: 'mental health and mindfulness app interface on phone, calming visualization of meditation breathing exercise, AI mental health chatbot support, digital wellness platform', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-care-robot', nameKo: '고령화 케어 & 돌봄 로봇', emoji: '🤖', desc: '노인 거동을 보조하고 말벗이 되어주는 사회적 돌봄 로봇', prompt: 'friendly eldercare robot companion assisting an elderly person at home, robotic nurse helper with gentle facial display, aging society care technology, warm healthcare scene', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-precision', nameKo: '맞춤형 정밀 의료', emoji: '🎯', desc: '유전체·바이오마커 기반으로 환자 개인에 최적화된 정밀 의료 치료법', prompt: 'precision medicine concept showing personalized treatment plan based on genomic data, patient DNA profile, targeted therapy selection, individual biomarker analysis, oncology', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-telemedicine', nameKo: '원격 화상 진료 시스템', emoji: '📱', desc: '스마트폰으로 의사와 실시간 화상 진료를 받는 비대면 의료 서비스', prompt: 'telemedicine video consultation on smartphone, doctor on screen discussing health with patient at home, digital stethoscope, remote healthcare app, virtual clinic appointment', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-icu', nameKo: '중환자실 디지털 모니터링', emoji: '💓', desc: 'AI가 환자 활력 징후를 실시간 분석하는 스마트 ICU 중환자실', prompt: 'smart ICU monitoring system with AI analyzing patient vital signs in real-time, multiple display screens, bedside sensor array, intelligent intensive care unit technology', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-rehab', nameKo: '재활 로봇 물리치료', emoji: '🦾', desc: '외골격 로봇 슈트로 마비 환자의 보행 재활을 지원하는 로봇 치료', prompt: 'rehabilitation robot exoskeleton suit assisting paralyzed patient in gait training, physical therapy robot, stroke recovery assisted walking, medical robotics rehabilitation center', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-mental', nameKo: '디지털 멘탈헬스 솔루션', emoji: '🧘', desc: 'AI 챗봇 상담·마음 챙김 앱으로 정신 건강을 관리하는 디지털 헬스케어', prompt: 'digital mental health app with AI chatbot counseling, mindfulness meditation guide, mood tracking journal, stress management tools, mental wellness platform interface', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-genomics', nameKo: '유전체 기반 암 조기 진단', emoji: '🔬', desc: '혈액 속 ctDNA로 암을 조기 발견하는 액체 생검 유전체 진단', prompt: 'liquid biopsy cancer early detection from blood sample, circulating tumor DNA analysis, genomic cancer screening, precision oncology lab with DNA sequencing, early diagnosis technology', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-public-health', nameKo: '공중보건 역학 데이터 센터', emoji: '🦠', desc: '감염병 확산 패턴을 실시간 분석하는 공중보건 역학 감시 시스템', prompt: 'public health epidemiology data center with infectious disease spread map, outbreak monitoring dashboard, epidemiological surveillance system, health data analytics command center', group: 'life', scene: 'people', usage: 'report' },
      { id: 'mix-health-dental', nameKo: '디지털 치과 & 임플란트', emoji: '🦷', desc: '3D 스캔·가이드 수술·CAD/CAM 보철로 진행되는 디지털 치과 치료', prompt: 'digital dentistry with 3D intraoral scanner, guided implant surgery planning software, CAD-CAM ceramic crown milling machine, modern dental clinic, precise digital treatment', group: 'life', scene: 'people', usage: 'report' },
    ],

    // ==================== 모빌리티 & 물류 ====================
    mobility: [
      { id: 'mix-mob-autonomous', nameKo: '자율주행 레벨4 승용차', emoji: '🚗', desc: '라이다·카메라 센서로 완전 자율주행하는 전기차', prompt: 'level 4 autonomous electric vehicle driving on city road, active lidar sensor beams scanning environment, no driver, futuristic self-driving car technology', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-drone-delivery', nameKo: '전기 드론 화물 배송', emoji: '📦', desc: '도심 상공을 날아 현관 앞에 택배를 내려놓는 배송 드론', prompt: 'electric delivery drone hovering above residential street, releasing package to doorstep, urban air delivery system, last-mile logistics innovation, city skyline background', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-hyperloop', nameKo: '초고속 하이퍼루프 철도', emoji: '🚄', desc: '진공 튜브 안을 시속 1000km로 달리는 미래 교통 시스템', prompt: 'futuristic hyperloop tube transport pod station, passengers boarding capsule in vacuum tube tunnel, ultra-high-speed ground transportation concept', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-smartport', nameKo: '스마트 항만 자동화 물류', emoji: '⚓', desc: '자율 크레인과 AGV가 컨테이너를 처리하는 스마트 항만', prompt: 'smart automated port terminal with giant autonomous ship-to-shore cranes, self-driving AGV container transport vehicles, no human operators, digital port management system', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-hydrogen-ship', nameKo: '친환경 수소 화물선', emoji: '🚢', desc: '수소 연료전지로 추진되는 제로카본 화물선', prompt: 'hydrogen fuel cell powered cargo ship sailing on open ocean, zero emission vessel with clean white hull, green maritime shipping future, renewable energy propulsion', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-uam', nameKo: 'UAM 에어택시 & 버티포트', emoji: '✈️', desc: '도심 상공을 날아다니는 전기 에어택시와 버티포트 허브', prompt: 'urban air mobility eVTOL air taxi landing at a vertiport on a city rooftop, multiple aerial vehicles in the sky, future urban transportation infrastructure', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-micromobility', nameKo: '마이크로 모빌리티 & 공유', emoji: '🛴', desc: '공유 킥보드·자전거가 일상화된 친환경 도심 이동 수단', prompt: 'people using shared electric scooters and bikes in a modern city street, docking stations, bike lanes, green urban commuting lifestyle, smart mobility ecosystem', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-ai-logistics', nameKo: 'AI 물류 최적화 시스템', emoji: '🗺️', desc: 'AI가 실시간으로 최적 배송 경로를 계산하는 물류 플랫폼', prompt: 'AI logistics route optimization platform dashboard showing real-time delivery fleet tracking, optimal path algorithms, warehouse robot coordination, supply chain visibility', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-evtol', nameKo: '도심 항공 모빌리티 eVTOL', emoji: '🚁', desc: '도심 빌딩 옥상 UAM 버티포트를 이착륙하는 전기 수직 이착륙 항공기', prompt: 'electric VTOL air taxi taking off from urban building rooftop vertiport, urban air mobility UAM vehicle, futuristic city sky transport, quiet electric propulsion rotors', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-autonomous-truck', nameKo: '자율주행 장거리 화물 트럭', emoji: '🚛', desc: '운전자 없이 고속도로를 달리는 레벨4 자율주행 대형 화물 트럭', prompt: 'autonomous self-driving long-haul freight truck on highway, no driver cab, sensor array lidar radar cameras, convoy platooning, level 4 autonomous freight transportation', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-hyperloop', nameKo: '하이퍼루프 진공 튜브 열차', emoji: '🚄', desc: '진공 튜브 안을 시속 1000km로 이동하는 하이퍼루프 캡슐 열차', prompt: 'hyperloop pod capsule speeding through vacuum tube at 1000 km/h, futuristic high-speed transport system, maglev levitation technology, hyperloop terminal station', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-smart-port', nameKo: '스마트 자동화 항만', emoji: '⚓', desc: '무인 크레인·AGV·항만 관제 AI가 결합된 완전 자동화 스마트 항만', prompt: 'fully automated smart port with autonomous container cranes, AGV transport vehicles, port management AI control center, drone surveillance, unmanned harbor logistics operations', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-bike-share', nameKo: '친환경 공유 모빌리티', emoji: '🛴', desc: '전동 킥보드·공유 자전거가 결합된 퍼스트·라스트 마일 공유 모빌리티', prompt: 'shared micro-mobility station with electric scooters and bicycles, QR code dock-less rental, green urban transport, first and last mile solution, sustainable city commuting', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-supply-chain', nameKo: '공급망 실시간 가시성', emoji: '📡', desc: 'IoT·블록체인으로 원자재부터 배송까지 추적하는 공급망 가시성 플랫폼', prompt: 'supply chain visibility platform showing real-time tracking of goods from factory to customer, blockchain provenance record, IoT sensor telemetry, end-to-end logistics dashboard', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-last-mile', nameKo: '라스트마일 드론 배송', emoji: '📦', desc: '가정까지 직접 배달하는 무인 드론 라스트마일 배송 서비스', prompt: 'delivery drone hovering at residential doorstep, autonomous last-mile package delivery, unmanned aerial vehicle dropping parcel, suburban neighborhood, automated logistics drone', group: 'mfg', scene: 'facility', usage: 'report' },
      { id: 'mix-mob-mobility-hub', nameKo: '복합 모빌리티 환승 허브', emoji: '🏢', desc: '기차·버스·지하철·공유 모빌리티가 통합된 복합 환승 거점 허브', prompt: 'integrated mobility hub with train metro bus and micro-mobility all converging, multimodal transport interchange, smart transit terminal, seamless passenger connection experience', group: 'mfg', scene: 'facility', usage: 'report' },
    ],

    // ==================== 해양 & 수산 ====================
    ocean: [
      { id: 'mix-ocean-rov', nameKo: '수중 ROV 해양 탐사', emoji: '🤿', desc: '심해 탐사에 투입된 원격 조종 무인 잠수정', prompt: 'underwater remotely operated vehicle exploring dark deep sea floor, illuminating hydrothermal vent with thrusters, underwater robotics ocean research expedition', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-aqua', nameKo: '스마트 양식 IoT 관리', emoji: '🐟', desc: 'IoT 센서로 수온·용존산소·먹이를 자동 제어하는 스마트 양식장', prompt: 'smart aquaculture farm with IoT sensor buoys monitoring water temperature and oxygen, automated feeding system, healthy fish in net pens, sustainable fishery technology', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-biomarine', nameKo: '해양 바이오 원료 추출', emoji: '🧪', desc: '해조류·플랑크톤에서 고부가가치 바이오 소재를 추출하는 공정', prompt: 'marine biotechnology laboratory extracting bioactive compounds from seaweed and marine microalgae, photobioreactor cultures, ocean-derived biomaterial production', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-deepsea', nameKo: '심해 광물 채취 탐사', emoji: '⛏️', desc: '망간 단괴·해저 열수 광상 등 심해 광물 채굴 탐사선', prompt: 'deep sea mining vessel deploying underwater collector system to gather manganese nodules from seafloor, ocean mineral resource extraction technology', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-energy', nameKo: '해상 풍력 & 조류 발전', emoji: '🌊', desc: '조류와 파력을 동시에 활용하는 복합 해양 에너지 플랫폼', prompt: 'offshore renewable energy platform combining wind turbines, tidal stream turbines, and wave energy converters, ocean clean energy complex on open sea', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-cleanup', nameKo: '해양 플라스틱 정화 로봇', emoji: '♻️', desc: '자율 운항으로 해양 쓰레기를 수거하는 청소 드론 선박', prompt: 'autonomous ocean cleaning vessel collecting plastic waste from sea surface, boom system gathering marine debris, environmental ocean robot, zero pollution future', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-processing', nameKo: '수산 가공 자동화 라인', emoji: '🏭', desc: '로봇 팔이 신선 수산물을 분류·가공·포장하는 자동화 공정', prompt: 'automated fish processing factory line with robotic arms sorting and filleting fresh seafood, quality inspection cameras, hygienic stainless steel processing facility', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-weather', nameKo: '해양 기상 예측 시스템', emoji: '🌀', desc: '부이 관측소와 위성이 연동된 고정밀 해양 기상 예보 시스템', prompt: 'ocean weather monitoring system with buoy sensor network, satellite data feeds, typhoon prediction model on control center screen, maritime meteorological platform', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-rov', nameKo: '심해 탐사 수중 로봇 ROV', emoji: '🤿', desc: '수천m 심해를 탐사하는 원격 조종 수중 로봇(ROV)의 해저 조사', prompt: 'deep sea ROV remotely operated vehicle exploring ocean floor at thousands of meters depth, searchlight illuminating hydrothermal vent or shipwreck, underwater robotics research', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-offshore', nameKo: '해양 플랜트 부유식 설비', emoji: '⛽', desc: '심해 해저 자원을 생산하는 FPSO 부유식 생산·저장·하역 설비', prompt: 'FPSO floating production storage offloading vessel on open ocean, oil and gas platform, subsea wellhead connection, offshore petroleum production facility, marine engineering', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-tourism', nameKo: '해양 생태 관광 마린 레저', emoji: '🐬', desc: '스쿠버 다이빙·해양 생태 관광·요트 레저가 어우러진 해양 관광', prompt: 'marine ecotourism with scuba divers exploring coral reef, dolphin watching boat tour, sailing yacht in turquoise water, coastal leisure resort, ocean recreation tourism', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-seaweed', nameKo: '해조류 바이오 에너지', emoji: '🌿', desc: '대규모 해조류 양식으로 바이오연료·식품·소재를 생산하는 해양 바이오', prompt: 'large-scale seaweed mariculture farm with kelp forest cultivation, blue carbon sequestration, algae biofuel production, marine biomass sustainable resource, ocean farming', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-microplastic', nameKo: '해양 미세 플라스틱 정화', emoji: '🧹', desc: '해양 플라스틱 폐기물을 수거·분해하는 혁신적 해양 정화 기술', prompt: 'ocean plastic cleanup technology with autonomous collection vessel, microplastic filtration system, underwater cleanup robot, ocean decontamination project, marine pollution removal', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-coral', nameKo: '산호초 복원 생태 프로젝트', emoji: '🪸', desc: '기후 변화로 손상된 산호초를 복원하는 해양 생태 복원 사업', prompt: 'coral reef restoration project with marine biologists planting coral fragments on underwater nursery frame, vibrant coral regeneration, tropical reef ecosystem recovery', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-tidal-energy', nameKo: '조석 파력 에너지 발전', emoji: '🌊', desc: '파도와 조석 에너지를 전기로 변환하는 해양 재생에너지 발전 시설', prompt: 'wave energy and tidal power generation facility on coastline, oscillating water column wave converter, tidal barrage, ocean renewable energy extraction, marine power plant', group: 'life', scene: 'nature', usage: 'report' },
      { id: 'mix-ocean-data-cable', nameKo: '해저 광케이블 인프라', emoji: '🌐', desc: '대륙 간 인터넷을 연결하는 초고속 해저 광섬유 케이블 네트워크', prompt: 'subsea optical fiber cable laying ship deploying undersea internet cable, trans-ocean data network infrastructure, cable cross-section showing fiber bundles, global connectivity', group: 'life', scene: 'nature', usage: 'report' },
    ],

    // ==================== 신소재 & 화학 ====================
    materials: [
      { id: 'mix-mat-carbon-fiber', nameKo: '탄소섬유 복합 소재', emoji: '✈️', desc: '경량·고강도의 탄소섬유 강화 플라스틱 적층 구조', prompt: 'ultra-lightweight carbon fiber reinforced composite material layered structure, woven carbon fiber weave pattern, aerospace and automotive high-performance material close-up', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-graphene', nameKo: '그래핀 나노소재', emoji: '⚛️', desc: '원자 한 층 두께의 2D 탄소 그물망 그래핀 구조', prompt: 'atomic-scale visualization of graphene single-layer carbon hexagonal lattice, glowing honeycomb nanostructure, 2D material science concept, electron microscopy style', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-superconductor', nameKo: '고온 초전도 세라믹', emoji: '🔮', desc: '마이스너 효과로 자기부상하는 고온 초전도체', prompt: 'high-temperature superconductor ceramic floating above a magnet due to Meissner effect, liquid nitrogen vapor, glowing magnetic field lines, physics experiment', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-bioplastic', nameKo: '바이오 플라스틱 순환소재', emoji: '🌿', desc: '옥수수·사탕수수 원료의 생분해성 바이오 플라스틱 생산 공정', prompt: 'bioplastic manufacturing process, corn starch and sugarcane raw materials being converted to biodegradable plastic pellets, circular economy sustainable material production', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-shape-memory', nameKo: '형상기억합금', emoji: '🔧', desc: '열을 가하면 원래 형태로 돌아오는 니티놀 형상기억 금속', prompt: 'shape memory alloy nitinol wire demonstration, metal coiling and uncoiling as temperature changes, smart material actuation, biomedical and robotics application concept', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-aerogel', nameKo: '에어로젤 초단열 소재', emoji: '💨', desc: '세계에서 가장 가벼운 고성능 단열재 에어로젤 블록', prompt: 'aerogel superinsulator material block held in hand, translucent blue glass-like extremely lightweight structure, near-zero density insulation, advanced material science', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-semiconductor', nameKo: '반도체 웨이퍼 & 포토공정', emoji: '💿', desc: '극자외선(EUV) 노광 장비로 회로를 새기는 반도체 웨이퍼', prompt: 'semiconductor silicon wafer under extreme ultraviolet EUV lithography machine, clean room environment, yellow safe light, precision nanoscale circuit patterning process', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-metamaterial', nameKo: '음향 & 광학 메타물질', emoji: '🌈', desc: '빛이나 음파를 구부리는 인공 구조 메타물질', prompt: 'engineered metamaterial structure bending light and sound waves in unusual ways, periodic nanoscale array pattern, invisible cloaking material concept, photonics research', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-graphene', nameKo: '그래핀 나노 소재 응용', emoji: '⚡', desc: '단원자층 탄소 구조 그래핀의 전자·에너지 분야 응용 나노 소재', prompt: 'graphene nanotechnology material with single atom thick carbon lattice structure, electron microscope visualization, graphene-based electronics application, wonder material research', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-aerogel', nameKo: '초경량 에어로겔 단열재', emoji: '❄️', desc: '공기의 99%인 초경량 나노다공성 에어로겔 고성능 단열 소재', prompt: 'aerogel ultra-lightweight thermal insulation material, nanoporous structure visualization, hand holding translucent silica aerogel block, extreme insulation properties demonstration', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-smart-textile', nameKo: '전도성 스마트 섬유 소재', emoji: '🧵', desc: '전기 전도성·센서·발열 기능이 통합된 미래형 스마트 텍스타일', prompt: 'e-textile smart fabric with conductive thread woven into garment, LED illumination, biometric sensor patches, heated clothing technology, electronic wearable textile', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-ceramic', nameKo: '첨단 세라믹 & 내열 소재', emoji: '🔥', desc: '극한 온도와 압력에 견디는 첨단 구조 세라믹 내열 소재', prompt: 'advanced structural ceramic material for extreme heat resistance, silicon carbide tiles, aerospace thermal protection system, high temperature refractory ceramic microstructure', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-bio-plastic', nameKo: '바이오 플라스틱 대체 소재', emoji: '🌱', desc: '옥수수·해조류 등 생물 자원에서 만든 생분해성 바이오 플라스틱', prompt: 'biodegradable bioplastic packaging made from corn starch or seaweed, decomposing in soil, sustainable alternative to petroleum plastic, eco-friendly material lifecycle', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-self-healing', nameKo: '자가 치유 코팅 소재', emoji: '🛡️', desc: '스크래치가 생기면 스스로 복원되는 자가 치유 나노 코팅 소재', prompt: 'self-healing coating material demonstration showing scratch on surface healing itself, polymer network repair mechanism, autonomous material restoration, smart coating technology', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-nanocomposite', nameKo: '나노 복합 구조 강화재', emoji: '🏗️', desc: '탄소나노튜브·나노입자를 분산시킨 초강도 나노복합 구조 소재', prompt: 'nanocomposite reinforced material with carbon nanotubes dispersed in polymer matrix, transmission electron microscopy visualization, super-strength lightweight structural material', group: 'mfg', scene: 'lab', usage: 'report' },
      { id: 'mix-mat-superconductor', nameKo: '고온 초전도 소재 응용', emoji: '🧲', desc: '자기부상·에너지 무손실 전송에 활용되는 고온 초전도 소재', prompt: 'high temperature superconductor demonstration with liquid nitrogen cooling, Meissner effect magnetic levitation floating magnet, zero resistance superconducting wire application', group: 'mfg', scene: 'lab', usage: 'report' },
    ],

    // ==================== 창작 & 미디어 ====================
    creative: [
      { id: 'mix-creative-ott', nameKo: 'OTT 드라마 세트 프로덕션', emoji: '🎬', desc: '대규모 촬영 세트와 크레인 카메라가 동원된 드라마 제작 현장', prompt: 'large-scale film and TV drama production set with crane camera, professional lighting rigs, director and crew at work, elaborate period or sci-fi set design', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-ai-music', nameKo: 'AI 생성 음악 & 사운드', emoji: '🎵', desc: 'AI 작곡 엔진이 만들어내는 파형과 음악 생성 인터페이스', prompt: 'AI music generation interface showing waveform visualization, neural network composing melody on piano roll, generative audio technology, digital music creation studio', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-gamedev', nameKo: '게임 개발 스튜디오', emoji: '🎮', desc: '3D 캐릭터 모델링과 엔진 개발이 진행 중인 게임 개발사', prompt: 'game development studio with artists working on 3D character modeling screens, motion capture suit on mannequin, Unreal Engine viewport, creative game dev workspace', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-webtoon', nameKo: '웹툰 & 디지털 만화 창작', emoji: '✏️', desc: '태블릿과 펜으로 웹툰을 그리는 크리에이터의 작업 환경', prompt: 'webtoon artist workspace with large graphic tablet and digital pen, colorful manga panels on dual monitors, character sketches pinned on board, creative digital illustration studio', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-xr', nameKo: 'VR/AR 실감 콘텐츠 제작', emoji: '🕶️', desc: '몰입형 VR/AR 경험 콘텐츠를 개발하는 XR 스튜디오', prompt: 'XR studio developing immersive VR and AR content, developers testing headsets, mixed reality scene creation tools, volumetric capture stage, immersive media production', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-mediaart', nameKo: '미디어 아트 인터랙티브', emoji: '💡', desc: '관람객의 움직임에 반응하는 대형 인터랙티브 미디어 아트', prompt: 'large interactive media art installation in dark gallery, visitors triggering motion-reactive visual effects on giant display walls, immersive digital art experience', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-youtuber', nameKo: '유튜브 & 숏폼 크리에이터', emoji: '📹', desc: '조명·카메라·배경 세트를 갖춘 유튜브 크리에이터 홈 스튜디오', prompt: 'professional home YouTube studio setup with ring light, multiple cameras, green screen, acoustic panels, creator recording engaging video content, content creation workspace', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-podcast', nameKo: '팟캐스트 & 오디오 콘텐츠', emoji: '🎙️', desc: '방음 스튜디오에서 진행되는 전문 팟캐스트 녹음 세션', prompt: 'professional podcast recording studio with high-end condenser microphones, soundproof acoustic foam walls, mixing board, two hosts engaged in conversation, audio content creation', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-ai-art', nameKo: '생성 AI 아트 크리에이션', emoji: '🤖', desc: 'AI 생성형 아트 툴로 만들어지는 독창적 디지털 아트 크리에이티브', prompt: 'generative AI art creation process with neural network visualizing abstract digital artwork, human artist collaborating with AI tool, creative technology intersection, digital art studio', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-vfx', nameKo: 'VFX & 시각 특수효과 스튜디오', emoji: '🎬', desc: '할리우드급 VFX 파이프라인으로 영화·광고의 특수 효과를 제작하는 스튜디오', prompt: 'VFX visual effects studio with artists working on large monitors, compositing software, 3D rendering farm, special effects work on movie scene, Hollywood production pipeline', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-virtual-prod', nameKo: '버추얼 프로덕션 LED 월', emoji: '📺', desc: '거대한 LED 월 앞에서 실시간 배경 합성으로 촬영하는 버추얼 프로덕션', prompt: 'virtual production studio with giant curved LED wall displaying photorealistic background, actor performing in front of real-time CGI environment, in-camera VFX production technology', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-fashion', nameKo: '패션 디자인 텍스타일', emoji: '👗', desc: '첨단 디지털 패브리케이션으로 구현되는 하이엔드 패션 디자인 과정', prompt: 'fashion design studio with haute couture garment creation, digital pattern making on screen, fabric material swatches, sewing atelier, luxury fashion house design process', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-brand-film', nameKo: '브랜드 필름 광고 제작', emoji: '🎥', desc: '감성적인 브랜드 스토리를 담은 광고 필름 촬영 현장', prompt: 'brand film commercial production set with director behind camera, actors in brand-colored wardrobe, cinematic lighting setup, advertising film shoot, storytelling video campaign', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-3d-print-art', nameKo: '3D 프린팅 조형 예술', emoji: '🖨️', desc: '3D 프린터로 만든 복잡한 기하학적 조형물과 예술 작품', prompt: '3D printed sculptural artwork with complex geometric lattice structure, colorful resin print, additive manufacturing art, intricate impossible shapes, modern digital sculpture', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-sound-design', nameKo: '사운드 디자인 오디오 비주얼', emoji: '🎵', desc: '음악과 시각이 결합된 오디오 반응형 비주얼 아트 퍼포먼스', prompt: 'sound design audio-visual performance with music-reactive particle visualization, spectrum analyzer waveforms, DJ and VJ collaboration, immersive live audio visual show', group: 'life', scene: 'people', usage: 'promo' },
      { id: 'mix-creative-interactive', nameKo: '인터랙티브 미디어 아트 설치', emoji: '🎪', desc: '관람객의 움직임에 반응하는 인터랙티브 디지털 미디어 아트 설치 작품', prompt: 'interactive media art installation responding to audience movement, motion tracking, particle system reacting to touch, immersive art experience, digital interactive exhibition', group: 'life', scene: 'people', usage: 'promo' },
    ],

    // ==================== 환경 & 기후 ====================
    environment: [
      { id: 'mix-env-carbon-neutral', nameKo: '탄소중립 2050 로드맵', emoji: '🌍', desc: '2050 탄소중립 달성을 위한 부문별 전환 전략 시각화', prompt: 'carbon neutrality 2050 roadmap infographic concept, emission reduction pathway by sector, renewable energy transition timeline, green hydrogen and CCUS technologies', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-dac', nameKo: '대기 탄소 직접 포집 (DAC)', emoji: '🌬️', desc: '공기 중 CO2를 직접 빨아들여 지하에 저장하는 DAC 설비', prompt: 'direct air capture facility with large CO2 capturing fan modules in open landscape, carbon dioxide removal technology, industrial scale negative emission facility', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-heat-island', nameKo: '도시 열섬화 저감 기술', emoji: '🌡️', desc: '쿨루프·그린인프라·도심 숲으로 열섬을 완화하는 스마트 도시 전략', prompt: 'urban heat island mitigation, white reflective cool roof buildings, abundant urban tree canopy, bioswale green corridors, city thermal map showing temperature reduction', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-biodiversity', nameKo: '생물다양성 & 산림 복원', emoji: '🌳', desc: '훼손된 생태계를 복원하는 대규모 식생 복원 사업', prompt: 'ecosystem restoration reforestation project, volunteers planting native tree saplings in degraded land, drone aerial seeding, biodiversity recovery, green landscape regeneration', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-circular', nameKo: '순환경제 업사이클링', emoji: '♻️', desc: '폐기물을 새로운 자원으로 되살리는 순환경제 제조 공정', prompt: 'circular economy upcycling factory, waste materials being transformed into new products, recycled material flow diagram, zero waste manufacturing process, green economy', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-climate-data', nameKo: '기후 리스크 데이터 분석', emoji: '📊', desc: '기후 시나리오별 위험 지수를 시각화하는 분석 플랫폼', prompt: 'climate risk data analytics platform, global temperature anomaly maps, flood risk assessment dashboard, AI climate scenario modeling visualization, environmental data science', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-zerowaste', nameKo: '제로웨이스트 라이프스타일', emoji: '🛒', desc: '포장 없는 쇼핑·텀블러·다회용기로 구성된 제로웨이스트 생활', prompt: 'zero waste lifestyle flat lay with reusable tote bag, glass jars, bamboo toothbrush, beeswax wrap, bulk grocery shopping, plastic-free sustainable living aesthetic', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-green-city', nameKo: '녹색건축 & 생태 도시', emoji: '🌱', desc: '건물 외벽 녹화·우수 재활용·탄소 저감이 통합된 생태 도시', prompt: 'eco city with green building facades covered in vertical gardens, rooftop solar panels, rainwater collection pools, bicycle paths, sustainable urban planning masterpiece', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-solar-farm', nameKo: '대규모 태양광 발전 단지', emoji: '☀️', desc: '사막·평지에 펼쳐진 대형 태양광 패널 발전소 단지', prompt: 'massive utility-scale solar farm with endless rows of photovoltaic panels across flat desert landscape, aerial view, clean renewable energy infrastructure, blue panel array', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-hydrogen', nameKo: '수소 경제 연료전지 생태계', emoji: '⚗️', desc: '그린 수소 생산·저장·운반·활용의 수소 경제 가치사슬 시각화', prompt: 'hydrogen economy ecosystem with green hydrogen electrolyzer, hydrogen fuel cell vehicle refueling, hydrogen storage tanks, fuel cell power plant, H2 value chain visualization', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-waste-material', nameKo: '폐기물 자원화 소재 재생', emoji: '♻️', desc: '각종 폐기물에서 새로운 산업용 원료와 소재를 추출·재생하는 공정', prompt: 'waste-to-material recycling facility transforming industrial and municipal waste into new raw materials, chemical recycling process, material recovery from waste, circular economy', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-air-quality', nameKo: '스마트 대기질 모니터링', emoji: '🌫️', desc: 'IoT 센서망과 AI로 도심 대기 오염을 실시간 분석하는 스마트 환경 관제', prompt: 'smart air quality monitoring network with IoT sensor nodes on city streets, real-time pollution heatmap dashboard, PM2.5 measurement, urban environmental surveillance system', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-ocean-cleanup', nameKo: '해양 쓰레기 대청소 시스템', emoji: '🌊', desc: '해양 플라스틱을 대규모로 수거하는 자율 해양 정화 선박 시스템', prompt: 'autonomous ocean plastic cleanup system with barrier collection boom and collection vessel, great pacific garbage patch cleanup, marine waste removal technology, ocean conservation', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-nature-based', nameKo: '자연 기반 해법 (NbS)', emoji: '🌳', desc: '기후 위기 적응을 위해 자연 생태계를 복원·활용하는 자연 기반 해법', prompt: 'nature-based solutions NbS for climate adaptation, mangrove restoration, wetland conservation, urban forest planting, natural flood management, ecosystem-based climate resilience', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-drought', nameKo: '물 부족 가뭄 대응 기술', emoji: '💧', desc: '해수담수화·재사용수·스마트 관개로 물 부족에 대응하는 수자원 기술', prompt: 'water scarcity solutions including seawater desalination plant, water recycling treatment facility, smart drip irrigation precision agriculture, water resource management technology', group: 'future', scene: 'nature', usage: 'promo' },
      { id: 'mix-env-blue-carbon', nameKo: '블루카본 맹그로브 갯벌', emoji: '🐚', desc: '맹그로브 숲และ 해양 갯벌이 탄소를 저장하는 블루카본 생태계', prompt: 'blue carbon ecosystem with dense mangrove forest roots in coastal water, tidal wetland, seagrass meadow, carbon sequestration by coastal marine habitat, climate solution', group: 'future', scene: 'nature', usage: 'promo' },
    ],

    // ==================== 기술사업화 ====================
    tech_transfer: [
      {
        id: 'mix-tech-rec-transfer',
        nameKo: '이차전지 재활용 기술사업화',
        emoji: '♻️',
        desc: '폐배터리에서 고순도 리튬·코발트·니켈을 회수하는 기술의 상용화 계약.',
        prompt: 'battery recycling technology commercialization process, recovering high-purity lithium, cobalt, and nickel from spent electric vehicle batteries, high-tech chemical reaction vessels, robotic handling, green energy transition concept',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-solid-startup',
        nameKo: '전고체 배터리 벤처 투자',
        emoji: '⚡',
        desc: '스타트업과 대기업 간의 전고체 핵심 소재 공동 개발 및 투자 유치 협약.',
        prompt: 'solid-state battery technology commercialization startup signing ceremony, interactive blueprint displays of crystalline solid electrolytes on a digital table, corporate partnership and venture investment concept, sleek modern laboratory backdrop',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-dry-process',
        nameKo: '건식 전극 공정 기술 라이선싱',
        emoji: '🏭',
        desc: '유기 용매 없이 전극을 코팅하여 비용을 절감하는 건식 공정 장비 양산.',
        prompt: 'dry electrode manufacturing equipment commercialization for secondary batteries, roll-to-roll active materials coating without organic solvents, high-speed industrial machinery, cleanroom automation, massive battery production scale',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-sodium-mass',
        nameKo: '나트륨 이온 배터리 양산 계약',
        emoji: '🧂',
        desc: '리튬을 대체하여 원가 경쟁력을 확보한 소듐 이온 셀의 대량 생산 사업화.',
        prompt: 'commercialization of sodium-ion battery cells, mass production assembly line with shimmering yellow-golden sodium ions flowing, cost-effective alternative energy technology, modern battery factory layout',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-lisulfur-uam',
        nameKo: '리튬황 배터리 항공 실증 사업',
        emoji: '🛸',
        desc: '고에너지 밀도 리튬황 전지를 도심항공교통(UAM) 기체에 탑재하여 진행하는 실증 프로젝트.',
        prompt: 'lithium-sulfur battery pack integrated into an advanced electric urban air mobility (UAM) drone, outdoor airfield, commercialization flight test, light-weight sulfur cathode pouch cells visible on side panel, sunset glow',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-bio-001',
        nameKo: '항체 기술이전',
        emoji: '🧬',
        desc: '항체 의약품 원천기술을 글로벌 제약사에 기술이전하는 라이선싱 계약 체결 장면. 바이오벤처 창업팀과 다국적 제약사 임원이 협상 테이블에 마주 앉아 있다.',
        prompt: 'A professional technology licensing ceremony in a sleek biotech conference room. Startup founders in business attire shaking hands with executives from a multinational pharmaceutical company across a polished table. Large screens display molecular antibody structures and clinical trial data charts. Lawyers and IP attorneys review thick contract documents. Glowing vials of biologic drugs visible through a glass partition lab in the background. Bright corporate lighting, photorealistic style, conveying a milestone moment in antibody drug commercialization.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-bio-002',
        nameKo: '세포치료제 양산',
        emoji: '🏭',
        desc: '대학 연구실에서 개발된 CAR-T 세포치료제가 GMP 시설에서 첫 상업 생산에 돌입하는 장면. 연구자와 생산팀이 무균실에서 공정을 점검한다.',
        prompt: 'Inside a sterile GMP biomanufacturing facility, technicians in full cleanroom suits monitor CAR-T cell therapy production lines. Stainless steel bioreactors and automated cell culture systems fill the room. Digital control panels display real-time cell viability metrics. Through a glass window, university researchers in white coats observe the first commercial batch with pride. Blue and white lighting, photorealistic industrial photography style, capturing the transition from academic discovery to pharmaceutical manufacturing scale-up.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-bio-003',
        nameKo: '유전자편집 IR',
        emoji: '🧪',
        desc: '유전자가위(CRISPR) 기반 치료제 스타트업이 시리즈B 투자 유치를 위해 바이오 전문 VC 앞에서 기술 데모와 임상 데이터를 발표하는 피칭 현장.',
        prompt: 'A high-stakes biotech investor pitch in a modern venture capital boardroom. A startup CEO presents CRISPR gene-editing therapy results on a large digital screen showing before-and-after genomic sequencing data and patient outcome graphs. Attentive biotech-focused VC partners sit around the table with tablets and notepads. A physical model of DNA double helix sits on the presenter\'s podium. Warm spot lighting on the presenter, cityscape visible through floor-to-ceiling windows, photorealistic business photography conveying scientific credibility and investment opportunity.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-bio-004',
        nameKo: '체외진단 수출',
        emoji: '🩺',
        desc: '국내 바이오기업이 개발한 AI 기반 암 조기진단 키트가 첫 FDA 승인을 받고 미국 병원 체인과 공급 계약을 체결하는 수출 확대 장면.',
        prompt: 'A celebratory commercial signing event between a Korean biotech company and a major US hospital network. Representatives exchange signed distribution contracts for an AI-powered early cancer detection diagnostic kit. A display table showcases the compact diagnostic device and test kits with FDA approval certification plaques. American and Korean national flags flank the backdrop. Medical professionals examine product brochures. Modern trade conference room setting, professional photography style, conveying international medical technology commercialization success.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-energy-001',
        nameKo: '페로브스카이트 양산',
        emoji: '☀️',
        desc: '차세대 페로브스카이트 태양전지 기술을 보유한 연구팀이 대기업 솔라 사업부와 공동 양산 계약을 맺고 파일럿 라인 가동을 시작하는 장면.',
        prompt: 'Inside a cutting-edge solar cell pilot production facility, engineers and researchers gather around newly installed perovskite solar panel manufacturing equipment. Thin-film deposition machines and precision coating systems gleam under factory lights. A joint venture signing banner hangs above as corporate and academic representatives review production specifications. Sample perovskite solar panels with their distinctive golden-brown iridescent surface are displayed on a stand. Bright industrial lighting, photorealistic manufacturing photography, conveying the commercialization of next-generation solar technology.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-energy-002',
        nameKo: '그린수소 기술이전',
        emoji: '⚡',
        desc: '수전해 수소 생산 원천기술을 중동 국부펀드 컨소시엄에 기술이전하고 대규모 수소 플랜트 공동 개발 협약을 체결하는 에너지 외교 현장.',
        prompt: 'An international green hydrogen technology transfer ceremony in a grand governmental conference hall. Delegates from a research institute shake hands with Middle Eastern sovereign wealth fund representatives beneath national flags and banners reading Green Hydrogen Partnership. Behind them, large display screens show architectural renders of a massive hydrogen electrolysis plant in a desert landscape. Technical diagrams of PEM electrolyzer stacks are displayed on easels. Formal diplomatic setting, wide-angle photorealistic photography, capturing the scale of international clean energy technology commercialization.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-energy-003',
        nameKo: '해상풍력 벤처 IR',
        emoji: '🌬️',
        desc: '부유식 해상풍력 설치·유지보수 플랫폼 스타트업이 인프라 전문 PE펀드 앞에서 기술 경쟁력과 수익 모델을 발표하는 시리즈A 투자 미팅.',
        prompt: 'A startup pitch meeting focused on offshore wind technology in a contemporary investment firm conference room. The founder presents on dual screens showing a 3D render of floating offshore wind turbines at sea alongside detailed revenue model spreadsheets and market size charts. Physical scale model of a floating wind platform sits on the meeting table. Infrastructure PE fund partners examine technical specifications. Floor-to-ceiling windows reveal an ocean horizon. Professional business photography style, natural and artificial lighting blend, emphasizing both technical innovation and commercial viability.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-energy-004',
        nameKo: '열에너지 저장 계약',
        emoji: '🔥',
        desc: '용융염 기반 장기 열에너지 저장(LTES) 기술이 산업단지 열 공급 사업자와 실증 프로젝트 계약을 체결하며 첫 상용화 레퍼런스를 확보하는 현장.',
        prompt: 'A commercial agreement signing for long-duration thermal energy storage technology at an industrial energy company headquarters. Engineers and business development executives review and sign a pilot project contract. A large cross-section model of a molten salt thermal storage tank is displayed prominently. Screens show energy flow diagrams and cost-of-storage comparison graphs. Hard hats and safety vests hang on hooks near the door, suggesting proximity to an actual industrial site. Warm corporate office lighting, photorealistic photography, conveying the first commercial reference for breakthrough energy storage technology.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-sw-001',
        nameKo: 'AI 진단 플랫폼 이전',
        emoji: '🤖',
        desc: '대학병원 AI연구소에서 개발한 영상 판독 AI 플랫폼을 글로벌 의료영상 기업에 기술이전하고 공동 상용화 로드맵을 수립하는 계약 체결 장면.',
        prompt: 'A formal technology licensing agreement signing between a university hospital AI research lab and a global medical imaging corporation. Research directors and corporate executives sit at a long conference table with contract documents. Large monitors display AI diagnostic interface screenshots showing radiology scan analysis with highlighted lesion detection overlays. A wall-mounted display shows a commercialization timeline roadmap. Medical imaging professionals observe from the sides. Modern hospital administrative building setting, professional photographic style with medical and technological atmosphere.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-sw-002',
        nameKo: '스마트팩토리 플랫폼 IR',
        emoji: '🏗️',
        desc: '제조 공정 AI 최적화 SaaS 플랫폼 스타트업이 산업기술 전문 CVC와 전략적 투자 협약을 맺고 대기업 제조 계열사 파일럿 도입을 확정하는 현장.',
        prompt: 'A corporate venture capital investment signing event for a smart manufacturing AI platform startup. Startup team and CVC executives sign strategic investment agreements in a modern corporate office with an actual factory floor visible through a glass wall. Large displays show a real-time digital twin of a manufacturing facility with AI optimization metrics, production efficiency dashboards, and anomaly detection alerts. Physical IoT sensor devices and edge computing hardware samples are arranged on a display table. Industrial-corporate hybrid aesthetic, photorealistic photography, conveying technology commercialization in manufacturing sector.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-sw-003',
        nameKo: '자율주행 SW 수출',
        emoji: '🚗',
        desc: '국내 자율주행 소프트웨어 스타트업이 유럽 완성차 OEM과 기술 라이선싱 계약을 체결하고 차량 통합 테스트를 시작하는 글로벌 진출 장면.',
        prompt: 'An autonomous driving software licensing ceremony and vehicle integration test at a European automotive OEM facility. Korean startup engineers stand beside German automotive executives in front of a prototype vehicle with AV sensor arrays. A testing track is visible through large hangar doors. Inside, screens display real-time lidar point cloud visualizations and autonomous driving decision trees. Signed licensing agreements rest on a presentation table with miniature autonomous vehicle models. Dramatic hangar lighting, automotive photography style, conveying international software technology commercialization in mobility sector.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-sw-004',
        nameKo: 'AI 법률 플랫폼 VC',
        emoji: '⚖️',
        desc: '법률문서 AI 분석 및 계약서 검토 자동화 LegalTech 스타트업이 시리즈A 투자 라운드를 클로즈하며 로펌 대형 고객사와 파일럿 계약도 동시 체결.',
        prompt: 'A dual celebration in a law firm conference room: a LegalTech startup closing a Series A funding round while simultaneously signing a pilot agreement with a major law firm. Startup founders hold a ceremonial oversized check while also exchanging contract documents with law firm partners. Screens display AI contract review interface showing clause-by-clause analysis and risk scoring overlays on legal documents. Stacks of physical legal binders and documents create atmosphere. Traditional law firm wood paneling mixed with modern tech startup energy, photorealistic business photography.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-sw-005',
        nameKo: '사이버보안 기술이전',
        emoji: '🛡️',
        desc: '제로트러스트 기반 네트워크 보안 원천기술을 보유한 연구소기업이 국내 통신 대기업에 기술이전하고 기업형 보안 플랫폼 공동 개발에 착수하는 장면.',
        prompt: 'A cybersecurity technology transfer agreement signing between a government research institute spinoff and a major telecommunications corporation. Security researchers and telecom executives exchange documents in a secure conference room with frosted glass walls. Massive digital displays show network traffic visualization maps, zero-trust architecture diagrams, and real-time threat monitoring dashboards. Physical cybersecurity hardware appliances are arranged as product demonstrations. Blue-tinted lighting creates a security operations center atmosphere. Professional documentary photography style, conveying critical national cybersecurity technology commercialization.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-battery-001',
        nameKo: '실리콘 음극재 양산',
        emoji: '⚗️',
        desc: '실리콘 복합 음극재 원천기술을 보유한 소재 스타트업이 배터리 셀 대기업과 장기 공급 계약 및 기술 공동개발 협약을 동시에 체결하는 장면.',
        prompt: 'A strategic partnership signing between a silicon composite anode material startup and a major battery cell manufacturer. Materials scientists and battery executives sign supply agreements and joint development contracts at a conference table. Display cases show silicon anode material samples in various forms alongside cylindrical and pouch battery cells. Digital screens display electron microscope images of silicon nanostructures, cycle life performance graphs, and energy density comparison charts against conventional graphite anodes. Cleanroom and laboratory aesthetic, photorealistic chemistry and engineering photography, conveying next-generation battery material commercialization.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-battery-002',
        nameKo: '전지팩 설계 기술이전',
        emoji: '🔋',
        desc: '국내 배터리 시스템 설계 전문 연구기관이 동남아 신흥 전기차 OEM에 배터리팩 설계 원천기술과 BMS 소프트웨어를 패키지로 기술이전하는 수출 현장.',
        prompt: 'An international battery technology export ceremony at a research institute exhibition hall. Korean battery system engineers present packaged technology transfer documents to executives from a Southeast Asian electric vehicle startup. Display stands feature actual battery pack prototypes, disassembled cell modules, and BMS control boards. Large screens show EV battery thermal management simulation animations and state-of-charge monitoring dashboards. Flags of both countries flank the signing table. Modern industrial-academic facility setting, wide photorealistic photography, showcasing comprehensive battery technology package commercialization for emerging EV markets.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-battery-003',
        nameKo: '폐배터리 재사용 플랫폼',
        emoji: '♻️',
        desc: 'EV 폐배터리 상태 진단 AI와 재사용(ESS) 전환 플랫폼을 개발한 스타트업이 에너지 대기업과 폐배터리 재사용 사업 합작법인(JV) 설립 계약을 체결.',
        prompt: 'A joint venture establishment ceremony for a battery second-life platform company. EV battery recycling startup founders and energy corporation executives sign a JV agreement surrounded by actual retired EV battery packs in various states of disassembly. Diagnostic equipment with tablet interfaces shows AI-powered battery health assessment readings. Background shows a warehouse facility where battery packs are being converted to energy storage systems. Infographic displays compare battery state-of-health data and ESS economics. Industrial warehouse with corporate meeting area aesthetic, photorealistic photography, conveying circular economy battery commercialization.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-battery-004',
        nameKo: '고체 전해질 소재 IR',
        emoji: '💎',
        desc: '황화물계 고체 전해질 소재 원천기술을 보유한 스핀오프 기업이 배터리 소재 전문 투자펀드와 글로벌 셀 제조사 앞에서 기술력을 동시에 발표하는 공동 피칭.',
        prompt: 'A dual-audience investor and customer pitch in a premium battery materials conference room. A solid electrolyte startup CTO presents on a large curved screen showing ionic conductivity performance graphs, material synthesis process diagrams, and cost reduction roadmaps compared to liquid electrolytes. Seated attendees include both venture capital fund managers with investment portfolios and technical directors from global battery manufacturers taking detailed notes. Sample vials and pressed pellets of sulfide solid electrolyte material are displayed under magnification on a lit exhibition table. Sophisticated technology showcase atmosphere, photorealistic professional photography.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-battery-005',
        nameKo: '배터리 디지털트윈',
        emoji: '🖥️',
        desc: '배터리 셀의 전기화학 모델 기반 디지털 트윈 소프트웨어를 개발한 연구팀이 자동차 OEM 배터리 개발팀에 기술 라이선싱 및 유지보수 계약을 체결하는 장면.',
        prompt: 'A battery digital twin software licensing ceremony at an automotive OEM research and development facility. Software engineers and automotive battery development directors sign licensing agreements beside large curved display walls showing real-time electrochemical battery simulation visualizations. Colorful 3D models of battery cells with heat maps, degradation prediction curves, and charge-discharge cycle animations fill the screens. Actual battery test chambers are visible in the background laboratory. Physical product demo laptop shows the software interface. Modern automotive R&D center aesthetic, photorealistic technology photography, conveying software-driven battery development acceleration.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-bio-005',
        nameKo: '마이크로바이옴 이전',
        emoji: '🦠',
        desc: '장내 마이크로바이옴 조절 기반 대사질환 치료제 원천기술을 보유한 바이오벤처가 글로벌 식품 대기업의 헬스케어 사업부와 기술이전 계약을 체결하는 장면.',
        prompt: 'A microbiome technology licensing agreement between a biotech startup and a global food and nutrition corporation healthcare division. Scientists and corporate business development directors sign agreements in a contemporary life sciences meeting room. Visualization screens display gut microbiome diversity charts, clinical outcome data for metabolic disease patients, and mechanistic pathway illustrations. Stylized cross-section models of the human digestive system with microbiome population graphics are displayed. Product concept packaging for microbiome-based health supplements visible on a display shelf. Warm and scientific atmosphere blend, photorealistic corporate-biotech photography.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-energy-005',
        nameKo: '암모니아 혼소 이전',
        emoji: '🌿',
        desc: '암모니아-수소 혼소 발전 기술을 개발한 국내 연구소가 동남아 발전 공기업과 기술이전 및 실증 발전소 공동 건설 MOU를 체결하는 에너지 협력 현장.',
        prompt: 'An energy technology transfer MOU signing ceremony between a Korean research institute and a Southeast Asian state power utility at an international energy summit. Research institute director and power company CEO shake hands before signing. Behind them, large banner reads Ammonia-Hydrogen Co-firing Technology Partnership. Screens display combustion simulation animations, power plant architectural renders in tropical landscape, and emissions reduction comparison data. Technical brochures and engineering drawings of burner assemblies are spread on the table. International conference room with both country flags, formal diplomatic photography style, wide angle shot.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      },
      {
        id: 'mix-tech-sw-006',
        nameKo: 'AI 농업 플랫폼 수출',
        emoji: '🌾',
        desc: '드론·위성 영상 기반 정밀농업 AI 플랫폼을 개발한 애그테크 스타트업이 중앙아시아 농업부와 스마트팜 국가 보급 사업 계약을 체결하는 수출 현장.',
        prompt: 'An agricultural technology export agreement signing between a Korean AgTech startup and a Central Asian Ministry of Agriculture in a governmental conference hall. Startup executives and ministry officials exchange contracts before a backdrop showing satellite field imagery analysis on large screens. Drone units and sensor packages for precision agriculture are displayed on exhibition tables. Digital dashboards show crop health indices, yield prediction models, and irrigation optimization maps. Representatives review tablet demonstrations of the AI farming platform interface. Modern governmental meeting room, photorealistic official photography, conveying AgTech software platform international commercialization.',
        group: 'knowledge',
        scene: 'service',
        usage: 'plan'
      }
    ],

    // ==================== 인력양성 ====================
    talent_cultivation: [
      {
        id: 'mix-talent-meister',
        nameKo: '이차전지 생산 전문직 양성',
        emoji: '🎓',
        desc: '스마트 팩토리 실습실에서 배터리 셀 조립 실무를 교육받는 마이스터 과정.',
        prompt: 'secondary battery vocational training class, students in cleanroom suits assembling pouch-type battery cells, high-tech hands-on equipment, technical training classroom with digital instructional screens',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-phd-rd',
        nameKo: '배터리 석박사 융합 교육',
        emoji: '🔬',
        desc: '분자 설계 및 양극재 분석 기기 실습을 하는 대학원 전문 연구인력 양성 프로그램.',
        prompt: 'graduate students analyzing advanced cathode crystal structures on high-resolution scanning electron microscopes (SEM), molecular modeling displays on dual monitors, battery research laboratory, collaborative academic research',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-dismantle-safety',
        nameKo: '폐배터리 안전 해체 교육',
        emoji: '🥽',
        desc: '전기차 폐배터리 팩을 무방전 안전 상태로 해체하는 실무 엔지니어 양성 교육.',
        prompt: 'professional safety training for electric vehicle battery pack dismantling, engineers in insulated protective gear and safety glasses using non-conductive tools on a high-voltage EV battery tray, industrial classroom setup',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-bms-ai',
        nameKo: '배터리 AI 진단 개발자 교육',
        emoji: '💻',
        desc: '배터리 수명 및 BMS 안전성 진단을 위한 딥러닝 기반 소프트웨어 엔지니어 양성 과정.',
        prompt: 'programming training for Battery Management System (BMS) diagnostics, students writing Python code to analyze battery aging degradation curves on laptop screens, neural network flowcharts on whiteboard',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-sem-workshop',
        nameKo: '차세대 배터리 산학 워크숍',
        emoji: '🤝',
        desc: '대학의 원천 기술 연구와 기업 실무가 결합된 정기 세미나 및 실무형 인재 매칭.',
        prompt: 'dynamic university-industry battery research workshop, interactive presentation slides showing next-generation anode materials, active discussion between professors, students, and corporate experts in a modern seminar hall',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-bio-001',
        nameKo: '바이오 연구 인재',
        emoji: '🧬',
        desc: '바이오헬스 분야 핵심 연구인력을 양성하는 심화 실습 프로그램. 유전체 분석부터 신약 개발까지 전 과정을 다룬다.',
        prompt: 'Advanced biohealth research training program in a modern molecular biology laboratory. Graduate students and early-career researchers in white lab coats analyzing genetic sequences on large monitors, pipetting samples into microplates, and discussing protein structures around a 3D molecular model display. High-tech equipment including PCR machines, centrifuges, and bioinformatics workstations fills the bright, sterile lab space. Mentors guide small groups through hands-on experiments. Scientific posters about drug discovery and genomics line the walls. Professional academic atmosphere with focused collaboration.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-bio-002',
        nameKo: '제약 공정 전문가',
        emoji: '💊',
        desc: '제약 GMP 공정 전문인력 양성 교육 과정. 의약품 제조 품질관리와 규제 대응 실무 역량을 강화한다.',
        prompt: 'GMP pharmaceutical manufacturing training in a cleanroom facility. Trainees in full protective suits, hairnets, and gloves operating tablet compression machines and liquid filling lines under strict quality protocols. Instructors demonstrate sterile technique at laminar flow hoods while digital dashboards display real-time process parameters. Training manuals and regulatory compliance checklists are visible. Rows of stainless steel processing equipment gleam under bright industrial lighting. Small group sessions around a validation documentation station complete the professional pharmaceutical education scene.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-bio-003',
        nameKo: '헬스케어 AI 개발자',
        emoji: '🏥',
        desc: '의료 AI 모델 개발 및 임상 적용을 위한 전문인력 교육. 의료 데이터 분석과 진단 보조 AI 설계를 훈련한다.',
        prompt: 'Healthcare AI developer training workshop in a medical informatics classroom. Participants working on laptops displaying medical imaging datasets, MRI scans, and deep learning model training dashboards. An instructor at the front explains neural network architecture for diagnostic imaging on a large projection screen. Workstations show Python code for medical image segmentation alongside annotated X-ray and CT scan databases. Participants include doctors and software engineers collaborating. Modern seminar room with health data visualization posters and clinical AI ethics guidelines on the walls.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-bio-004',
        nameKo: '바이오 창업 육성',
        emoji: '🚀',
        desc: '바이오헬스 스타트업 창업자 대상 기술사업화 교육. 기술이전, 투자유치, 글로벌 진출 전략을 집중 훈련한다.',
        prompt: 'Biohealth startup incubation program in a modern innovation hub. Young entrepreneurs and scientists presenting business models on whiteboards covered with biotech product roadmaps and market analysis charts. Mentors from venture capital and pharmaceutical industry provide feedback in small group sessions. Pitch practice area features a podium and panel of evaluators. Collaborative co-working space has laboratory benches alongside business planning tools. Technology transfer agreements and IP strategy documents are spread on tables. Energetic startup atmosphere with biotech branding and innovation posters throughout the facility.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-energy-001',
        nameKo: '태양광 설계 전문가',
        emoji: '☀️',
        desc: '태양광 발전 시스템 설계 및 시공 전문인력 양성 프로그램. PV 모듈 특성부터 계통 연계까지 전 과정을 실습한다.',
        prompt: 'Solar photovoltaic system design and installation training program at an outdoor solar testing facility. Trainees in high-visibility vests working with instructors to install and connect PV modules on rooftop training arrays. Indoor classroom sessions show participants using solar design software to simulate energy yields on workstations with multiple monitors. Circuit diagrams and inverter wiring diagrams cover the walls. A hands-on electrical safety station features PPE demonstrations. Real-time performance data from training panels is displayed on a large dashboard screen. Professional vocational training environment with technical documentation and safety protocols prominently displayed.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-energy-002',
        nameKo: '수소 안전 기술자',
        emoji: '⚗️',
        desc: '수소 생산·저장·이송 설비의 안전 관리 전문기술자 양성. 수소 위험성 평가와 비상대응 절차를 중점 훈련한다.',
        prompt: 'Hydrogen safety technician training at a hydrogen energy test facility. Trainees in flame-resistant protective gear and gas detection equipment learning leak detection procedures around hydrogen storage tanks and fuel cell stacks. An instructor demonstrates emergency shutdown protocols using simulation control panels. Classroom sessions nearby feature explosion-proof equipment displays, pressure vessel safety charts, and hydrogen property posters. Trainees practice using handheld hydrogen detectors and personal gas monitors. Emergency response drills take place in a designated outdoor area. Technical safety manuals and risk assessment worksheets are used throughout the rigorous professional certification program.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-energy-003',
        nameKo: '풍력 정비 기술자',
        emoji: '🌬️',
        desc: '풍력 발전기 유지보수 전문기술자 교육 과정. 타워 등반 안전부터 기어박스 진단까지 현장 실무를 훈련한다.',
        prompt: 'Wind turbine maintenance technician training program at an onshore wind farm training site. Trainees in full personal protective equipment practicing rope access and tower climbing techniques on a training structure. Ground-level workshops feature actual nacelle components including gearboxes, generators, and blade inspection tools laid out for hands-on learning. An instructor guides participants through predictive maintenance diagnostics using vibration analysis equipment connected to laptop computers. Technical drawings of turbine assembly exploded diagrams cover workshop walls. Small groups rotate through stations covering electrical systems, hydraulics, and blade repair techniques in a comprehensive vocational training environment.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-energy-004',
        nameKo: '에너지 저장 전문가',
        emoji: '🔋',
        desc: '대규모 에너지 저장 시스템(ESS) 설계·운영 전문가 양성. 계통 연계형 ESS 실증 데이터를 기반으로 심화 훈련한다.',
        prompt: 'Energy storage system specialist training in a grid-scale ESS demonstration facility. Engineers and technicians gathered around battery rack installations, learning about battery management systems on large display screens showing real-time state-of-charge data and grid frequency response graphs. Instructors explain thermal management and safety monitoring systems while participants take detailed notes. A connected control room features SCADA dashboards displaying energy flow diagrams. Technical seminars cover capacity planning, degradation analysis, and regulatory compliance. Whiteboards show cost modeling calculations. Professional training environment combining classroom theory with direct hands-on ESS equipment interaction and operational simulation exercises.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-sw-001',
        nameKo: 'AI 엔지니어 양성',
        emoji: '🤖',
        desc: '산업 현장 적용 AI 모델 개발 엔지니어 양성 교육. 딥러닝 설계부터 MLOps 운영까지 실무 중심으로 훈련한다.',
        prompt: 'AI engineering bootcamp in a modern tech training center. Participants intensely focused at dual-monitor workstations running deep learning model training, visualization dashboards showing loss curves and accuracy metrics, and Jupyter notebooks with PyTorch code. An experienced instructor at the front presents neural network architecture diagrams on a projection screen showing convolutional and transformer model structures. Team collaboration areas feature whiteboards covered with model pipeline designs. MLOps workflow posters and GPU cluster diagrams decorate the walls. Small group code review sessions and model evaluation workshops create an energetic professional development atmosphere focused on practical AI implementation skills.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-sw-002',
        nameKo: '데이터 엔지니어 교육',
        emoji: '📊',
        desc: '빅데이터 파이프라인 구축 및 분석 전문 데이터 엔지니어 양성. 클라우드 플랫폼 기반 실습 중심 커리큘럼을 운영한다.',
        prompt: 'Data engineering training program in a cloud computing education lab. Students at workstations building data pipelines using cloud platform consoles, with screens displaying Kafka streaming dashboards, Spark job monitoring interfaces, and SQL query editors processing large datasets. An instructor demonstrates ETL workflow design on a projected architecture diagram showing data lake, warehouse, and mart layers. Participants collaborate on data quality assessment exercises using real-world datasets. Cloud service architecture posters and data governance frameworks line the walls. A presentation area hosts student pipeline project demonstrations with performance benchmark comparisons and cost optimization analysis charts displayed prominently.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-sw-003',
        nameKo: '사이버보안 전문가',
        emoji: '🛡️',
        desc: '산업 제어시스템 및 IoT 보안 전문인력 양성 교육. 모의 해킹 실습과 취약점 분석 훈련을 집중 진행한다.',
        prompt: 'Cybersecurity specialist training in a dedicated cyber range facility with controlled network environment. Trainees at individual workstations performing penetration testing exercises on simulated industrial control system networks, with screens displaying network traffic analyzers, vulnerability scanning tools, and SIEM dashboards. Red team and blue team participants compete in a live capture-the-flag exercise projected on central monitors. An instructor guides participants through threat intelligence analysis and incident response procedures. Security certifications, attack vector diagrams, and defense framework posters cover the walls. Professional and focused training atmosphere emphasizing hands-on practical cybersecurity skill development.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-sw-004',
        nameKo: '클라우드 아키텍트',
        emoji: '☁️',
        desc: '엔터프라이즈 클라우드 아키텍처 설계 전문가 양성 프로그램. 멀티 클라우드 전략과 마이크로서비스 설계를 실습한다.',
        prompt: 'Cloud architecture professional development workshop in a corporate training facility. Participants working on architecture design exercises using cloud service provider consoles and infrastructure-as-code tools displayed on large monitors. Teams collaborate around whiteboards sketching microservices diagrams, kubernetes cluster topologies, and serverless function flow charts. An instructor leads a live cloud migration case study with cost estimation tools open on a projected screen. Certificate preparation materials and cloud architecture best practice guides are distributed. Reference architecture posters covering high availability, disaster recovery, and security zones decorate the modern training room. Active hands-on labs alternate with conceptual design review sessions.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-sw-005',
        nameKo: 'SW 품질 전문가',
        emoji: '✅',
        desc: '소프트웨어 품질보증 및 테스트 자동화 전문인력 교육 과정. 애자일 환경에서의 QA 전략과 CI/CD 연계를 훈련한다.',
        prompt: 'Software quality assurance training program in a modern QA engineering classroom. Trainees at workstations writing automated test scripts with test frameworks, reviewing test coverage reports on dual monitors, and analyzing bug tracking dashboards. An instructor demonstrates test automation pipeline integration with CI/CD tools on a projected screen showing build pipelines and test result summaries. Teams participate in exploratory testing workshops using actual application environments. Agile QA process charts, test pyramid diagrams, and code quality metric dashboards are displayed throughout the room. Collaborative code review and pair testing sessions reinforce software quality engineering principles in a professional learning environment.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-battery-006',
        nameKo: '전고체 배터리 연구',
        emoji: '⚡',
        desc: '차세대 전고체 배터리 소재 및 제조 공정 연구인력 양성. 고체 전해질 합성부터 셀 조립 실험까지 심화 실습한다.',
        prompt: 'All-solid-state battery research training in a university battery research center. Graduate researchers in cleanroom suits working at glove box stations, carefully assembling solid-state battery cells under inert atmosphere conditions. Instructors explain solid electrolyte characterization results displayed on electron microscopy images and electrochemical impedance spectroscopy charts on lab monitors. Solid electrolyte powder samples, pressing equipment, and coin cell fabrication tools are arranged at individual workstations. Whiteboards show crystal structure diagrams and ionic conductivity comparison data. Battery performance test chambers line the walls. Collaborative academic research atmosphere with scientific papers and material property databases accessible at each station.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-battery-007',
        nameKo: '배터리 품질관리자',
        emoji: '🔍',
        desc: '이차전지 제조 품질관리 전문인력 양성 프로그램. 전극 불량 분석, 계측 기기 활용, SPC 통계 관리를 실습한다.',
        prompt: 'Battery quality control specialist training in a lithium-ion battery manufacturing quality lab. Trainees using optical microscopes and scanning electron microscopes to examine electrode samples, identifying defects and coating uniformity issues. Statistical process control charts and control limit calculations are practiced at workstations with quality management software. An instructor demonstrates impedance measurement and capacity testing procedures using battery testing equipment connected to computer analysis systems. Failure mode analysis documents and quality standard reference charts are spread on laboratory benches. Measurement gauge calibration and precision instrument handling are demonstrated. Professional quality engineering training environment with ISO standards documentation and production defect sample collections displayed for reference.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-battery-008',
        nameKo: '배터리 팩 설계자',
        emoji: '🔧',
        desc: '전기차 및 ESS용 배터리 팩 설계 전문인력 양성. 구조 설계, 열관리, BMS 통합 설계 능력을 집중 훈련한다.',
        prompt: 'Battery pack design engineer training program in an automotive technology training center. Participants working on CAD workstations designing battery module structural components, thermal management systems, and cooling plate configurations on engineering software. An instructor at the front reviews EV battery pack exploded assembly diagrams projected on screen, highlighting cell configuration strategies and busbar electrical connections. A physical disassembled EV battery pack on a central demonstration table allows hands-on structural examination. Teams work on thermal simulation results and cell-to-pack integration challenges. Battery management system architecture diagrams and safety standard documentation cover the walls of the professional design training facility.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-battery-009',
        nameKo: '배터리 재활용 기술',
        emoji: '♻️',
        desc: '사용 후 배터리 재활용 공정 전문기술자 양성 교육. 방전·해체 공정부터 핵심 소재 회수 기술까지 실무를 훈련한다.',
        prompt: 'Battery recycling process technician training at a battery materials recovery facility. Trainees in full protective equipment including gloves, goggles, and acid-resistant aprons learning hydrometallurgical and pyrometallurgical recovery processes. Instructors demonstrate discharge and dismantling procedures on end-of-life battery samples at specially designed safety workstations. Chemical processing equipment for lithium, cobalt, and nickel recovery is explained through step-by-step demonstration. Lab analysis stations feature ICP spectrometers and purity testing equipment for recovered materials. Environmental compliance and hazardous material handling procedures are emphasized throughout. Safety protocols, material flow diagrams, and circular economy process charts are prominently displayed in the professional training facility.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-battery-010',
        nameKo: '배터리 데이터 분석',
        emoji: '📈',
        desc: '이차전지 성능 데이터 분석 및 수명 예측 전문가 양성. 전기화학 데이터 처리와 머신러닝 모델 적용을 실습한다.',
        prompt: 'Battery data analytics specialist training in a computational electrochemistry lab. Participants at workstations analyzing large cycling test datasets with Python scripts, visualizing capacity fade curves and differential voltage analysis plots on dual monitors. An instructor explains machine learning based state-of-health estimation models on a projected screen showing feature importance rankings and prediction accuracy comparisons. Electrochemical impedance spectroscopy data fitting software and equivalent circuit model parameter extraction tools are demonstrated. Participants work with real battery degradation datasets from cycling test chambers visible through a lab window. Battery analytics algorithm comparison posters and data pipeline architecture diagrams complete the focused professional training environment.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-bio-005',
        nameKo: '임상시험 전문가',
        emoji: '🩺',
        desc: '임상시험 운영 및 데이터 관리 전문인력 양성 교육. GCP 규정 준수와 임상 데이터 시스템 활용을 실무 중심으로 훈련한다.',
        prompt: 'Clinical trial specialist training in a dedicated clinical research education center. Trainees reviewing ICH GCP guidelines and protocol documents at individual workstations with electronic data capture systems open on screens showing case report form completion workflows. An instructor presents regulatory submission requirements and adverse event reporting procedures on a projected clinical trial management system dashboard. Simulated patient recruitment and consent process roleplay exercises take place in a designated training area. Regulatory binder organization and audit trail documentation exercises are practiced. ICH guidelines, ethics committee approval process charts, and CONSORT flow diagrams are displayed throughout the professional clinical research training room setting.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-energy-005',
        nameKo: '스마트그리드 운영자',
        emoji: '🌐',
        desc: '스마트그리드 운영 및 수요반응 관리 전문인력 양성. SCADA 시스템 운영과 계통 안정화 대응 절차를 집중 훈련한다.',
        prompt: 'Smart grid operations specialist training in a control room simulation facility. Trainees seated at operator consoles facing multiple large screens displaying power grid topology maps, real-time load flow data, frequency monitoring dashboards, and demand response management interfaces. An instructor guides participants through emergency contingency scenarios including line fault isolation and load shedding procedures using simulation software. Teams practice coordinating renewable energy dispatch decisions based on weather forecast integration. Technical documentation on grid code compliance and protection relay settings is distributed. Professional control room environment with energy management system architecture diagrams and power system stability concept posters providing comprehensive smart grid operational training.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-sw-006',
        nameKo: '디지털 트윈 개발자',
        emoji: '🖥️',
        desc: '제조 현장 디지털 트윈 구축 전문 개발자 양성 교육. 3D 모델링, 실시간 데이터 연동, 시뮬레이션 설계를 실습한다.',
        prompt: 'Digital twin developer training in a smart manufacturing technology lab. Participants working at high-performance workstations building digital twin models of industrial equipment, with 3D CAD visualization software displaying rotating factory floor models alongside real-time sensor data feeds. An instructor demonstrates IoT data integration connecting physical PLC systems to their digital counterparts on a demonstration manufacturing cell in the center of the room. Simulation calibration exercises compare digital model predictions to physical system behavior. Unity3D and industrial simulation platform interfaces are visible on screens. Participants collaborate on physics-based model validation using collected operational data in a forward-looking professional development environment.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-battery-011',
        nameKo: '전극 공정 전문가',
        emoji: '🏭',
        desc: '이차전지 전극 슬러리 제조 및 코팅 공정 전문인력 양성. 믹싱, 코팅, 롤프레스 공정 제어 실무를 집중 훈련한다.',
        prompt: 'Lithium-ion battery electrode manufacturing process training in a pilot production facility. Trainees in cleanroom gowns observing and operating slurry mixing equipment, slot-die coating machines, and calendar roll-press stations under instructor supervision. Process parameter monitoring screens display coating thickness uniformity, web speed, and drying temperature profiles. Microscopy stations allow participants to examine electrode cross-sections for coating quality evaluation. Yield improvement exercises and process fault diagnosis case studies are conducted at group workstations. Electrode production process flow charts, coating defect reference samples, and material specification documents are arranged throughout the comprehensive battery manufacturing professional training environment.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-talent-energy-006',
        nameKo: '수소연료전지 기술자',
        emoji: '🔌',
        desc: '수소 연료전지 시스템 조립·운영·유지보수 기술자 양성 과정. 스택 조립부터 시스템 성능 평가까지 실습 중심으로 훈련한다.',
        prompt: 'Hydrogen fuel cell technician training at a fuel cell systems laboratory and assembly facility. Trainees carefully assembling proton exchange membrane fuel cell stacks at precision workbenches, torquing bipolar plates and membrane electrode assemblies to specification. Performance testing stations feature polarization curve measurement equipment with electrochemical analysis software. An instructor explains degradation mechanisms and performance recovery procedures using reference MEA samples under a stereomicroscope. System integration workshops cover balance-of-plant components including humidifiers, compressors, and thermal management systems. Hydrogen safety monitors, fuel cell architecture cutaway displays, and efficiency comparison charts create a comprehensive professional vocational training environment.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      }
    ],

    // ==================== 네트워킹 ====================
    networking: [
      {
        id: 'mix-net-bio-001',
        nameKo: '바이오 IR 피칭',
        emoji: '💉',
        desc: '바이오헬스 스타트업이 글로벌 VC 앞에서 신약 파이프라인을 발표하는 투자 유치 피칭 장면.',
        prompt: 'A sleek biohealth startup pitch room where a confident founder stands before a large display showing drug pipeline charts and molecular diagrams. Seated across a polished conference table are three serious venture capitalists in business attire, taking notes on tablets. The room features clean white walls with subtle biopharma branding, warm accent lighting, and a floor-to-ceiling window overlooking a modern city skyline. Presentation clickers, glossy pitch decks, and coffee cups rest on the table. The atmosphere blends scientific credibility with entrepreneurial energy, photorealistic corporate setting, shallow depth of field.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-bio-002',
        nameKo: '헬스케어 MOU',
        emoji: '🤝',
        desc: '국내외 바이오헬스 기업 대표들이 공동 연구 및 기술 이전을 위한 MOU를 공식 체결하는 서명식.',
        prompt: 'A formal MOU signing ceremony between two biohealth corporations in a grand conference hall. Two executives in dark suits stand side by side behind a wide signing desk draped with institutional logos and national flags. Each holds a pen poised over official documents in branded folders. Behind them, a row of delegates and legal representatives applaud. A professional banner reads partnership and collaboration. Bright press cameras flash from the left. The scene conveys gravity and mutual trust, photographed with sharp editorial clarity, warm overhead lighting, polished marble floor reflecting the event.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-bio-003',
        nameKo: '제약 컨퍼런스',
        emoji: '🧬',
        desc: '국제 바이오파마 컨퍼런스에서 연구자와 기업 담당자들이 임상 데이터를 교류하는 네트워킹 세션.',
        prompt: 'Inside a large international biopharmaceutical conference hall, researchers and business development managers engage in animated conversation during a networking break. Name badge lanyards hang from professional attire. Exhibition banners displaying DNA helices and clinical trial graphics line the hall. Attendees hold brochures and business cards, clustered in small groups near high-top tables with refreshments. Natural light streams through a glass ceiling above the exhibition floor. The atmosphere is intellectual and collaborative, with a mix of lab scientists and corporate strategists, photorealistic wide-angle photography, vibrant yet professional color palette.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-bio-004',
        nameKo: '의료기기 전시',
        emoji: '🏥',
        desc: '의료기기 전시 부스에서 기업 담당자가 해외 바이어에게 최신 진단 장비를 시연하는 장면.',
        prompt: 'A modern medical device exhibition booth with clean white and blue branding. A product specialist in business casual attire demonstrates a cutting-edge diagnostic imaging device to two interested international buyers who lean in closely, examining the equipment. A large backlit display shows anatomical scans and product specifications. Brochure stands, sample devices, and QR code panels are arranged neatly. The busy trade show floor hums in the background with adjacent booths visible. Overhead truss lighting highlights the equipment. Professional healthcare trade show atmosphere, photorealistic render, sharp foreground focus.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-bio-005',
        nameKo: '글로벌 임상 협약',
        emoji: '🌐',
        desc: '다국적 바이오 기업들이 글로벌 임상시험 공동 수행을 위한 파트너십 협약을 체결하는 장면.',
        prompt: 'A multinational biotech partnership summit in an upscale hotel conference room. Executives from three different countries sit around a curved table, each with a laptop displaying clinical trial protocols. A moderator at the head presents a global collaboration roadmap on a large screen showing world maps with connected trial sites. Simultaneous interpretation headsets rest on the table beside country flag placards. Formal business attire, warm ambient lighting, and a backdrop of glass walls overlooking a harbor. The scene radiates international scientific collaboration and corporate trust, photorealistic, wide establishing shot.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-ene-001',
        nameKo: '태양광 투자 라운드',
        emoji: '☀️',
        desc: '태양광 에너지 기업이 기관 투자자들과 재생에너지 프로젝트 파이낸싱을 논의하는 라운드테이블.',
        prompt: 'An investor roundtable meeting focused on solar energy project financing, set in a sophisticated boardroom with panoramic windows showing solar farm landscapes on screens and in the distance. Financial analysts and clean energy entrepreneurs sit around a circular mahogany table covered with financial models, infrastructure maps, and term sheets. A presenter points to projected IRR graphs and photovoltaic capacity charts on a wall-mounted display. Carafes of water, legal pads, and branded portfolios fill the table. The room exudes investment authority balanced with green energy optimism, photorealistic corporate interior, cool daylight filtering through blinds.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-ene-002',
        nameKo: '수소 에너지 MOU',
        emoji: '⚡',
        desc: '수소 에너지 기업과 글로벌 물류 기업이 수소 공급망 구축을 위한 전략적 파트너십을 체결.',
        prompt: 'A strategic partnership signing event between a hydrogen energy company and a global logistics corporation at a modern energy summit venue. Two CEOs stand at a signing podium, each holding fountain pens over partnership agreements. Behind them a large LED wall displays hydrogen infrastructure graphics, pipeline maps, and green hydrogen molecular imagery. Company flags flank both sides. A gathered audience of energy industry professionals and journalists watches intently. The setting combines industrial strength with clean energy forward vision, bright stage lighting, photorealistic editorial photography, corporate gravitas.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-ene-003',
        nameKo: '풍력 전시 부스',
        emoji: '🌬️',
        desc: '국제 재생에너지 박람회에서 풍력 터빈 제조사가 해외 개발사에게 최신 기술을 소개하는 전시 부스.',
        prompt: 'A striking wind energy company exhibition booth at an international renewable energy expo. The booth features a large scale model of an offshore wind turbine at its center, surrounded by digital interactive panels showing turbine efficiency data and installation videos. A technical sales representative engages with two overseas developers who gesture at the turbine model with interest. The booth backdrop displays sweeping aerial photography of wind farms over the ocean. Branded merchandise, technical spec sheets, and business card holders are arranged on side counters. Busy expo floor atmosphere, professional lighting, photorealistic trade show setting.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-ene-004',
        nameKo: '에너지 스타트업 데모',
        emoji: '🔋',
        desc: '청정에너지 스타트업 데모데이에서 창업팀이 에너지저장시스템 혁신 기술을 피칭하는 장면.',
        prompt: 'A clean energy startup demo day in a modern innovation hub auditorium. A young founding team member stands confidently at a stage podium, presenting energy storage system innovations on dual large screens showing battery performance charts and prototype photographs. The audience includes corporate venture investors, utility company scouts, and accelerator mentors seated in tiered chairs. Team members operate a live demo unit on a side table displaying real-time energy metrics on a tablet. The space features exposed concrete walls with green branding accents, dramatic stage lighting, photorealistic documentary photography.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-ene-005',
        nameKo: '글로벌 에너지 협의',
        emoji: '🌍',
        desc: '아시아-유럽 재생에너지 협력 포럼에서 정책 입안자와 기업 대표들이 공동 로드맵을 논의.',
        prompt: 'A high-level Asia-Europe renewable energy cooperation forum inside a grand convention hall. Government policy representatives and corporate executives from multiple nations sit at a long curved conference table adorned with country nameplates and miniature flags. A moderator presents a joint clean energy roadmap on a massive projection screen showing interconnected grid diagrams and 2050 carbon neutrality targets. Simultaneous interpretation booths line the back wall. Formal business dress code, professional name badges, and thick briefing documents populate the table. Prestigious diplomatic atmosphere, bright overhead lighting, photorealistic wide shot.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-sw-001',
        nameKo: 'AI 스타트업 피칭',
        emoji: '🤖',
        desc: '인공지능 스타트업이 글로벌 테크 VC 앞에서 SaaS 솔루션과 성장 지표를 발표하는 IR 장면.',
        prompt: 'A dynamic AI startup pitch session in a sleek Silicon Valley-style venture capital meeting room. The founding CEO stands at a glass whiteboard covered with hand-drawn architecture diagrams and metric annotations, gesturing at a laptop screen displaying live SaaS dashboard analytics. Three investors in casual business wear lean forward across a minimalist white table, one typing notes on a MacBook. The room has exposed brick walls, neon-lit logo signage, and a pegboard with sticky note frameworks. Startup energy mixed with investment scrutiny, natural light from skylights, photorealistic startup culture aesthetic.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-sw-002',
        nameKo: 'SW 파트너십 협약',
        emoji: '💻',
        desc: '국내 소프트웨어 기업과 글로벌 빅테크의 공동 개발 및 유통 파트너십 체결 행사.',
        prompt: 'A software partnership ceremony between a domestic tech company and a global big tech corporation in a corporate headquarters event space. Two senior executives shake hands firmly while smiling at each other, framed by dual company logos on a polished backdrop. Behind them a screen shows a joint product roadmap and API integration diagram. Surrounding teams of product managers and business development leads applaud. Press photographers capture the moment from the side. The venue blends corporate sophistication with digital innovation branding, sharp event photography aesthetic, warm spotlighting on the handshake moment.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-sw-003',
        nameKo: 'AI 컨퍼런스 세션',
        emoji: '🧠',
        desc: '국제 AI 컨퍼런스에서 연구자와 개발자들이 최신 LLM 기술 트렌드를 발표하고 토론하는 세션.',
        prompt: 'A packed AI conference breakout session in a modern convention center. A researcher presents at a podium in front of a sold-out audience of software developers and data scientists, the projection screen behind showing neural network architecture diagrams and benchmark comparison tables. Attendees type furiously on laptops and hold up phones to photograph slides. The room features branded AI company signage, rows of padded seats, and a professional AV setup. Bright stage lighting illuminates the speaker while the audience sits in relative darkness. Intellectual energy and technical curiosity fill the atmosphere, photorealistic event photography.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-sw-004',
        nameKo: '스타트업 데모데이',
        emoji: '🚀',
        desc: '액셀러레이터 주관 스타트업 데모데이에서 여러 팀이 투자자와 기업들 앞에 제품을 선보이는 행사.',
        prompt: 'A vibrant startup demo day in a spacious innovation center filled with booths. Each station showcases a different software startup with laptops running live product demos, rollup banners, and tablet sign-up sheets. Founders in startup branded T-shirts engage enthusiastically with visiting investors and corporate partners who wear business casual attire. Overhead hanging signs display startup names. The central stage has a podium for pitch presentations. Networking happens simultaneously in every corner, with business card exchanges, app downloads being demonstrated, and animated conversations. Bright industrial lighting, energetic startup atmosphere, photorealistic documentary style.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-sw-005',
        nameKo: '글로벌 SW 공급망',
        emoji: '🔗',
        desc: '국내 SW 기업이 해외 엔터프라이즈 고객과 소프트웨어 공급망 및 라이선스 계약을 협의하는 장면.',
        prompt: 'A software supply chain agreement meeting between a Korean software firm and an enterprise client delegation in a glass-walled boardroom. Legal and business development teams sit across from each other with open laptops, printed contract documents, and redlined license agreement drafts spread across the table. A compliance officer points to a specific clause in the contract while a counterpart references a pricing sheet. City skyline visible through floor-to-ceiling windows. Translation notes and bilingual summaries of terms visible on tablets. Formal yet collaborative negotiation atmosphere, professional office environment, photorealistic corporate scene.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-bat-001',
        nameKo: '이차전지 투자 IR',
        emoji: '🔌',
        desc: '이차전지 제조사가 글로벌 자동차 OEM 및 기관투자자들에게 배터리 기술 로드맵을 발표하는 IR 행사.',
        prompt: 'A high-stakes investor relations event hosted by a battery manufacturer in a premium hotel ballroom. The COO presents at a stage podium, the large projection screens flanking the stage showing battery cell cross-section diagrams, energy density roadmaps, and EV market growth forecasts. The audience includes representatives from major global automotive OEMs and institutional investment funds seated at round tables with branded materials. The stage design features illuminated battery cell imagery as decorative backdrop. Formal event lighting, professional audio setup, and company branded table settings create an atmosphere of technological ambition and financial gravitas, photorealistic event photography.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-bat-002',
        nameKo: '배터리 공급 협약',
        emoji: '🏭',
        desc: '이차전지 제조사와 글로벌 전기차 기업 간 장기 배터리 공급계약 체결 서명식.',
        prompt: 'A landmark battery supply agreement signing ceremony between a leading battery manufacturer and a global electric vehicle company. Two CEOs in formal suits sit at a wide signing desk positioned on a stage with company logos prominently displayed. Each signs matching bound contract documents simultaneously while photographers capture the moment. Behind them a screen shows the scale of the supply deal with volume figures and partnership timeline graphics. Rows of executives from both companies stand as witnesses in a grand corporate event space. National and corporate flags line the backdrop, dramatic stage lighting, photorealistic editorial photograph.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-bat-003',
        nameKo: '전지 기술 전시회',
        emoji: '⚗️',
        desc: '국제 배터리 기술 전시회에서 이차전지 기업이 차세대 전고체 배터리 기술을 전시하는 부스.',
        prompt: 'An impressive battery technology exhibition booth at an international expo. The display centers on a transparent case housing solid-state battery prototypes and cell stacks illuminated with dramatic blue LED underlighting. Technical engineers in company polo shirts explain the technology to a cluster of automotive engineers and procurement specialists who take photos and review specification pamphlets. The booth backdrop features large-format imagery of EV charging infrastructure and factory production lines. Interactive digital kiosks allow visitors to explore battery chemistry animations. Professional trade show environment, photorealistic product exhibition aesthetic.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-bat-004',
        nameKo: '배터리 스타트업 피칭',
        emoji: '💡',
        desc: '차세대 배터리 스타트업이 딥테크 투자자들 앞에서 혁신 소재 기술과 양산 계획을 발표하는 피칭.',
        prompt: 'A deep tech startup pitch focused on next-generation battery materials in a specialized investment forum conference room. The CTO founder, wearing a smart casual outfit, stands beside a laboratory-grade sample display case containing prototype battery cells and material samples. Behind the founder, dual screens show molecular simulation graphics, manufacturing cost curves, and prototype test result comparisons. Four serious deep tech investors around a curved table review printed technical due diligence packets and take handwritten notes. The room atmosphere balances scientific rigor with entrepreneurial excitement, photorealistic, professional photography, warm focused lighting.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-bat-005',
        nameKo: '글로벌 배터리 포럼',
        emoji: '🌏',
        desc: '아시아-북미 이차전지 산업 포럼에서 기업, 정부, 연구기관이 공급망 안보를 논의하는 국제 회의.',
        prompt: 'A prestigious Asia-North America secondary battery industry forum in a large convention center plenary hall. Government officials, battery company executives, and research institute directors occupy a wide stage panel arrangement with country nameplates. The audience of industry professionals fills theater-style seating facing a central screen displaying global battery supply chain maps, critical mineral sourcing data, and trade policy frameworks. A floor moderator manages question and answer through wireless microphones. Simultaneous interpretation is offered through headsets. The atmosphere is politically significant and strategically critical, formal international conference aesthetic, photorealistic wide angle shot.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
      {
        id: 'mix-net-bat-006',
        nameKo: '배터리 리사이클 협약',
        emoji: '♻️',
        desc: '이차전지 폐배터리 재활용을 위해 제조사, 폐기물 기업, 정부기관이 공급망 협약을 맺는 장면.',
        prompt: 'A tripartite battery recycling supply chain agreement event involving a battery manufacturer, a waste management corporation, and a government environmental agency. Three representative signatories sit at a signing table positioned in front of a backdrop showing battery recycling process infographics and circular economy imagery. Officials in formal attire exchange signed copies while a moderator from the government agency addresses invited media and industry observers seated in rows. The venue is a government convention hall with institutional signage and podium-mounted microphones. Press cameras roll in the back, photorealistic documentary event photography, bright and clean institutional lighting.',
        group: 'public',
        scene: 'people',
        usage: 'plan'
      },
    ],
  };

  // ==================== 공공기관 시각자료 주제 ====================
  MIXER_SUBJECTS.pubinst_viz = [
    NONE_SUBJECT,
    {
      id: 'mix-pubviz-flowchart',
      nameKo: '업무·신청 절차 흐름도',
      emoji: '📊',
      desc: '공공 업무 처리나 민원 신청 절차를 단계별로 도식화한 흐름도',
      prompt: 'step-by-step administrative workflow showing application stages, decision points, approval process, and result notification, with sequential process boxes connected by directional arrows',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-orgchart',
      nameKo: '조직·거버넌스 구조도',
      emoji: '🏛️',
      desc: '공공기관·협의체 조직 체계와 의사결정 구조를 나타내는 구조도',
      prompt: 'organizational governance hierarchy showing institution departments, committees, advisory boards, and executive leadership, with clear reporting line relationships between each node',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-stat-map',
      nameKo: '지역 통계 지도',
      emoji: '🗺️',
      desc: '인구·경제·사업 통계를 지역별로 색상 구분한 통계 지도',
      prompt: 'regional statistical map of Korea showing data distribution intensity by region, with choropleth color coding, legend, and administrative boundary labels',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-budget',
      nameKo: '예산·재정 현황표',
      emoji: '💰',
      desc: '공공 예산 배분과 집행 현황을 보여주는 재정 차트 이미지',
      prompt: 'public institution budget allocation and expenditure status showing fiscal year spending breakdown across program categories, with funding amounts and execution rate',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-eval',
      nameKo: '사업 성과 평가표',
      emoji: '📈',
      desc: '공공사업 추진 성과를 다차원 지표로 측정한 평가 결과표',
      prompt: 'multi-dimensional project performance evaluation scorecard showing KPI achievement rates, target versus actual comparison, quantitative outcome indicators across program objectives',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-survey',
      nameKo: '설문·만족도 조사 결과',
      emoji: '📋',
      desc: '시민 또는 사업 수혜자 만족도 조사 응답 분포 시각화',
      prompt: 'citizen or beneficiary satisfaction survey results showing response distribution, rating percentages, demographic breakdown, and key opinion findings',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-timeline',
      nameKo: '사업 추진 일정표',
      emoji: '📅',
      desc: '사업 단계별 추진 일정을 타임라인으로 정리한 연간 로드맵',
      prompt: 'annual project roadmap timeline showing major milestones, phase start and end points, quarterly schedule, key deliverables, and completion status across program year',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-report-cover',
      nameKo: '기관 보고서 표지',
      emoji: '📁',
      desc: '공공기관 연간 보고서·사업보고서 표지 레이아웃 이미지',
      prompt: 'institutional annual report cover layout featuring title area, year designation, institution name placement, decorative graphic element region, and formal publication header',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-policy-slide',
      nameKo: '정책 발표 슬라이드',
      emoji: '📝',
      desc: '정책 성과와 방향을 발표하는 공식 PPT 슬라이드 내용 구성',
      prompt: 'policy presentation slide showing government program outcomes, key statistics summary, forward strategy direction, and institutional branding in formal slide composition',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-process-step',
      nameKo: '단계별 신청 절차 안내',
      emoji: '🔢',
      desc: '신청·접수·심사·결과 등 공공서비스 단계 안내 이미지',
      prompt: 'numbered step-by-step public service application guide showing sequential stages from registration and document submission through review, approval, and result notification',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-circular',
      nameKo: '순환 정책 사이클',
      emoji: '🔄',
      desc: '정책 기획→실행→평가→환류의 순환 구조를 표현한 사이클 다이어그램',
      prompt: 'circular policy lifecycle diagram showing continuous cycle of planning, implementation, monitoring, evaluation, and feedback improvement phases connected in a loop',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
    {
      id: 'mix-pubviz-loc-map',
      nameKo: '사업 거점·위치 지도',
      emoji: '📍',
      desc: '지원센터·참여기관·사업 거점 위치를 표시한 지도 이미지',
      prompt: 'location map highlighting key program sites, regional support centers, and participating institution offices with pin markers showing geographic coverage and distribution',
      group: 'public',
      scene: 'abstract',
      usage: 'report'
    },
  ];

  Object.assign(window.CONCEPT_MIXER_PRESETS, {
    MIXER_SUBJECTS,
  });
})();
