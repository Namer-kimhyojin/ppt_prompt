const generatedConcepts = [
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
    desc: '데이터 센터 서버 랙 사이로 차가운 공기와 더운 공기가 순환하며 열을 식히는 흐름 시각화.',
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
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = generatedConcepts;
}
