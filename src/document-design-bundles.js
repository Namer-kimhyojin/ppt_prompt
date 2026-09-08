(function () {
  "use strict";

  const families = [
    { id: "report", label: "보고서", description: "본문·표·성과를 정돈한 업무 문서" },
    { id: "proposal", label: "기획·제안", description: "메시지·도식·실행 계획을 연결하는 제안" },
    { id: "learning", label: "학습 교재", description: "개념에서 예제·활동으로 이어지는 학습" },
    { id: "exam", label: "수험서", description: "이론·문제·해설을 구분하는 집중 학습" },
    { id: "prose", label: "산문집", description: "긴 글과 여백의 호흡을 살린 읽기" },
    { id: "story", label: "동화책", description: "그림과 문장이 함께 흐르는 이야기" },
  ];
  const page = (id, label, kind, rule) => ({ id, label, kind, rule });
  const pages = {
    report: [
      page("cover", "표지", "cover", "제목·발행 정보·시각 표식을 분리해 문서의 첫인상을 정돈한다."),
      page("chapter", "장 시작", "chapter", "장 번호와 제목에 충분한 호흡을 주고 다음 본문의 탐색 기준을 제공한다."),
      page("body", "본문", "body", "제목·핵심 문장·본문·근거를 위계로 구분하고 문단을 안정적으로 연결한다."),
      page("table", "비교표", "table", "머리행과 비교 기준을 명확하게 표시하고 단위·출처를 가까이 배치한다."),
      page("chart", "성과 차트", "chart", "주요 수치와 변화 추이를 구분하고 같은 의미에 같은 색상을 반복한다."),
      page("image", "근거 사진·주석", "image", "근거 사진의 비중을 조절하되 사진과 설명·출처의 관계를 유지한다."),
    ],
    proposal: [
      page("cover", "표지", "cover", "제안의 인상을 큰 제목과 대표 색면 또는 이미지로 표현한다."),
      page("message", "핵심 메시지", "message", "한 가지 제안 메시지와 이를 뒷받침하는 세 가지 근거를 구분한다."),
      page("diagram", "전략 도식", "diagram", "단계 또는 계층 관계를 연결선·번호·그룹의 위치로 표현한다."),
      page("roadmap", "로드맵", "roadmap", "단계와 산출물의 관계를 일정 축을 따라 정렬한다."),
      page("table", "예산·일정표", "table", "항목·일정·예산·담당 정보를 반복 가능한 표 위계로 구성한다."),
      page("image", "사례·근거", "image", "사례 이미지와 짧은 근거 문장을 가까이 배치해 제안의 신뢰를 높인다."),
    ],
    learning: [
      page("cover", "표지", "cover", "단원 분위기와 학습 수준이 읽히는 친절한 제목 체계를 사용한다."),
      page("chapter", "단원 도입", "chapter", "단원 표식·핵심 질문·학습 목표를 구별한다."),
      page("body", "개념 본문", "body", "개념 설명·핵심 용어·도움말을 반복 가능한 학습 블록으로 편집한다."),
      page("diagram", "그림 설명", "diagram", "개념의 흐름을 도식과 번호·캡션으로 연결한다."),
      page("example", "예제", "example", "질문·풀이 단계·확인 문장을 읽는 순서에 맞춰 구분한다."),
      page("activity", "활동·정리", "activity", "활동 지시·작성 공간·단원 정리를 독립적인 영역으로 배치한다."),
    ],
    exam: [
      page("cover", "표지", "cover", "학습 영역과 책의 용도를 제목 위계와 절제된 색상으로 구분한다."),
      page("chapter", "단원 구분", "chapter", "큰 단원 번호와 학습 범위를 고정 위치에 반복한다."),
      page("body", "핵심 이론", "body", "정의·조건·예외·핵심어를 구분하고 긴 이론의 읽기 리듬을 유지한다."),
      page("question", "문제·선택지", "question", "문제 번호·질문·선택지 간격을 일정하게 유지하고 답안 표시는 분리한다."),
      page("data-question", "자료 문제", "data-question", "문제 자료·단위·질문을 묶되 자료와 해설의 시각 신호를 구분한다."),
      page("solution", "풀이·정답", "solution", "정답 표식·풀이 근거·오답 설명의 위계를 분명히 한다."),
      page("answers", "정답표", "answers", "문항 번호와 정답을 빠르게 찾을 수 있도록 규칙적인 표로 정렬한다."),
    ],
    prose: [
      page("cover", "표지", "cover", "제목과 저자명을 절제된 판면에 배치해 작품의 호흡을 표현한다."),
      page("chapter", "장 시작", "chapter", "짧은 장 제목과 넉넉한 빈 공간으로 읽기의 전환을 만든다."),
      page("body", "긴 본문", "body", "한글 본문의 안정된 행 길이와 행간을 유지하고 문단의 호흡을 살린다."),
      page("quote", "인용", "quote", "인용문과 출처를 구분하고 장식보다 문장의 리듬을 우선한다."),
      page("image", "사진·짧은 글", "image", "사진과 짧은 문장이 서로의 여백을 침범하지 않도록 배치한다."),
    ],
    story: [
      page("cover", "표지", "cover", "같은 주인공과 그림 표현을 유지하며 제목이 장면과 어울리도록 배치한다."),
      page("body", "글과 그림", "body", "글 영역과 그림 영역의 비중을 조절하며 읽는 순서를 분명하게 한다."),
      page("dialogue", "대화 장면", "dialogue", "화자의 대사를 분리하고 인물과 대화의 공간적 관계를 유지한다."),
      page("image", "전면 그림", "image", "그림의 흐름을 크게 보여주고 글이 있으면 안전한 읽기 영역을 확보한다."),
      page("spread-left", "왼쪽 펼침", "spread-left", "짝수 면과 오른쪽 면의 그림 연결을 유지하고 제본 안쪽에 중요한 정보를 두지 않는다."),
      page("spread-right", "오른쪽 펼침", "spread-right", "왼쪽 면과 색감·시선을 연결하고 글은 제본에서 떨어진 안전한 영역에 배치한다."),
    ],
  };
  const palette = (primary, secondary, accent, background, text) => ({ primary, secondary, accent, background, surface: "#ffffff", text: text || "#202d38", muted: "#697781", border: "#d9dfe2" });
  const make = (definition) => ({
    ...definition,
    version: 3,
    pages: pages[definition.familyId].map((entry) => ({ ...entry })),
    fonts: definition.fonts || { heading: "Noto Sans KR", body: "Noto Sans KR" },
    defaultFeel: { colorPresence: "balanced", breathing: "balanced", imagePresence: "balanced", titlePresence: "clear", decorationPresence: "balanced", ...definition.defaultFeel, ...(definition.defaultFeel?.imagePresence === "image-led" ? { imagePresence: "image" } : {}) },
  });
  const bundles = [
    make({ id: "report-public-calm", familyId: "report", label: "정갈한 공공 보고", description: "곧은 제목선과 차분한 본문, 근거가 또렷한 정돈된 판면", themeId: "public-brief", variant: "public", palette: palette("#193d58", "#587080", "#b48737", "#ffffff"), image: "assets/document-design-images/workspace.jpg", rules: ["단일 본문 판면과 얇은 기준선으로 공적인 신뢰감을 유지한다.", "주색은 제목과 표 머리행에, 강조색은 꼭 필요한 수치에만 사용한다."] }),
    make({ id: "report-data-clear", familyId: "report", label: "선명한 데이터 보고", description: "크게 읽히는 수치와 측면 주석으로 정보의 차이를 선명하게", themeId: "data-evidence", variant: "data", palette: palette("#175e68", "#327a8a", "#e69a3e", "#f8fbfc"), image: "assets/document-design-images/workspace.jpg", rules: ["핵심 결론과 수치를 넓은 강조 영역에 배치한다.", "측면 주석과 분리된 데이터 블록으로 정보의 읽는 순서를 만든다."] }),
    make({ id: "proposal-strategy", familyId: "proposal", label: "단정한 전략 기획", description: "주장과 근거, 실행 단계를 논리적인 구조로 연결", themeId: "consulting-strategy", variant: "strategy", palette: palette("#273c67", "#667697", "#bc8739", "#ffffff"), image: "assets/document-design-images/workspace.jpg", rules: ["결론형 제목과 번호를 붙인 근거 블록을 사용한다.", "도식·일정·예산은 같은 정렬축으로 연결한다."] }),
    make({ id: "proposal-visual", familyId: "proposal", label: "이미지로 설득하는 제안", description: "큰 사례 이미지와 대담한 메시지, 시선을 이끄는 편집", themeId: "proposal-win", variant: "visual", palette: palette("#244c46", "#71908a", "#df734e", "#fbfaf5"), image: "assets/document-design-images/workspace.jpg", fonts: { heading: "Noto Serif KR", body: "Noto Sans KR" }, defaultFeel: { imagePresence: "image-led" }, rules: ["대표 이미지와 비대칭 제목으로 제안의 첫인상을 만든다.", "메시지와 사례를 넓은 면으로 나누고 짧은 근거를 연결한다."] }),
    make({ id: "learning-step", familyId: "learning", label: "차근차근 개념 학습", description: "번호와 학습 상자를 따라 개념에서 활동까지 차근차근", themeId: "education-guide", variant: "step", palette: palette("#286b65", "#6a9690", "#d59839", "#fffefa"), image: "assets/document-design-images/forest.jpg", rules: ["개념·예시·활동의 표식을 반복해 다음 행동을 안내한다.", "학습 도움말은 본문과 인접한 독립 상자로 표시한다."] }),
    make({ id: "learning-visual", familyId: "learning", label: "그림으로 이해하는 학습", description: "넓은 설명 그림과 짧은 메모로 개념을 한눈에", themeId: "warm-human", variant: "visual-learning", palette: palette("#315c9a", "#78a4be", "#dc8247", "#f9fbff"), image: "assets/document-design-images/forest.jpg", defaultFeel: { imagePresence: "image-led" }, rules: ["그림·도식이 주축이 되며 설명은 번호와 색상으로 연결한다.", "긴 문단보다 작은 개념 묶음과 질문 공간을 구분한다."] }),
    make({ id: "exam-theory", familyId: "exam", label: "이론·해설 집중", description: "체계적인 이론 위계와 여유 있는 풀이로 깊게 이해", themeId: "technology-industry", variant: "theory", palette: palette("#273e58", "#60768c", "#bf7247", "#ffffff"), image: "assets/document-design-images/workspace.jpg", rules: ["이론 제목·정의·예외·풀이를 번호와 얇은 선으로 구분한다.", "해설에는 본문보다 충분한 문단 간격을 제공한다."] }),
    make({ id: "exam-practice", familyId: "exam", label: "문제·실전 집중", description: "큰 문제 번호, 선명한 정답 신호, 빠른 반복 학습", themeId: "minimal-office", variant: "practice", palette: palette("#334ab0", "#7883b5", "#c05247", "#fdfdfd"), image: "assets/document-design-images/workspace.jpg", rules: ["문제 번호와 선택지의 시작점을 고정해 빠른 탐색을 돕는다.", "문제와 해설은 배경과 정답 표식으로 구별한다."] }),
    make({ id: "prose-quiet", familyId: "prose", label: "여백이 깊은 산문", description: "명조 본문과 넓은 빈 공간, 문장을 오래 머무르게", themeId: "editorial-premium", variant: "quiet", palette: palette("#5b5944", "#8a8975", "#b08b65", "#fcfaf5", "#353a35"), image: "assets/document-design-images/forest.jpg", fonts: { heading: "Noto Serif KR", body: "Noto Serif KR" }, defaultFeel: { breathing: "airy", decorationPresence: "minimal" }, rules: ["긴 읽기에 맞는 명조 본문과 안정된 단일 판면을 사용한다.", "장 시작과 인용에만 제한적인 색상과 넓은 여백을 둔다."] }),
    make({ id: "prose-photo", familyId: "prose", label: "사진과 함께 읽는 산문", description: "사진의 여운과 짧은 글이 교차하는 감각적인 읽기", themeId: "warm-human", variant: "photo", palette: palette("#395a52", "#759085", "#bd825e", "#f8f6f0", "#303c38"), image: "assets/document-design-images/forest.jpg", fonts: { heading: "Noto Serif KR", body: "Noto Serif KR" }, defaultFeel: { imagePresence: "image-led" }, rules: ["넓은 사진과 조용한 글 페이지를 교차하며 읽기의 리듬을 만든다.", "사진 캡션은 작게 정렬하고 인용은 독립된 여백에 배치한다."] }),
    make({ id: "story-watercolor", familyId: "story", label: "따뜻한 수채 동화", description: "부드러운 숲의 색과 여유로운 글, 포근한 이야기 장면", themeId: "warm-human", variant: "watercolor", palette: palette("#4f745c", "#88a58b", "#ca9053", "#fffdf6", "#354d3e"), image: "assets/document-design-images/story-watercolor.webp", fonts: { heading: "Noto Serif KR", body: "Noto Sans KR" }, rules: ["수채화의 부드러운 색면과 같은 캐릭터 표현을 전 장면에 유지한다.", "그림과 글의 안전 영역을 분리하고 문장은 짧고 편안하게 배치한다."] }),
    make({ id: "story-papercut", familyId: "story", label: "또렷한 종이조형 동화", description: "선명한 형태와 색면, 활기 있게 펼쳐지는 장면", themeId: "education-guide", variant: "papercut", palette: palette("#2b6276", "#709895", "#de8049", "#fff9ed", "#294a50"), image: "assets/document-design-images/story-papercut.webp", rules: ["종이조형의 또렷한 실루엣과 겹친 면의 일관성을 유지한다.", "강한 제목과 넓은 그림 면으로 리듬을 만들되 글의 대비를 보장한다."] }),
    make({ id: "report-editorial-grid", familyId: "report", label: "편집형 인사이트 리포트", description: "비대칭 제목과 2단 본문, 인용과 수치가 교차하는 매거진형 보고", themeId: "editorial-premium", variant: "editorial-report", palette: palette("#593f54", "#8a6b80", "#d66d55", "#fcf8f3", "#342e33"), image: "assets/document-design-images/workspace.jpg", fonts: { heading: "Noto Serif KR", body: "Noto Sans KR" }, defaultFeel: { breathing: "airy", titlePresence: "strong" }, rules: ["표지는 비대칭 제목 블록과 넓은 여백으로 편집물의 첫 장처럼 구성한다.", "본문은 짧은 2단 판면과 측면 인용을 사용하고 표·차트는 큰 수치와 캡션으로 연결한다."] }),
    make({ id: "report-field-ledger", familyId: "report", label: "현장 기록형 실무 보고", description: "점검표·사진·주석을 장부처럼 쌓아 근거를 빠르게 찾는 실무형", themeId: "minimal-office", variant: "field-ledger", palette: palette("#3f5548", "#7d8b79", "#d3943f", "#f7f4ea", "#2e3831"), image: "assets/document-design-images/forest.jpg", defaultFeel: { breathing: "compact", imagePresence: "balanced", decorationPresence: "minimal" }, rules: ["쪽마다 얇은 기준선과 항목 번호를 반복해 현장 기록의 위치를 빠르게 찾게 한다.", "근거 사진·점검표·짧은 주석을 같은 정렬축에 배치하고 상태 표식은 제한된 강조색으로 구분한다."] }),
    make({ id: "proposal-brand-story", familyId: "proposal", label: "브랜드 스토리 제안", description: "큰 이미지와 한 문장 메시지가 장면처럼 이어지는 감성 설득형", themeId: "warm-human", variant: "brand-story", palette: palette("#4d4058", "#8d7896", "#d97558", "#fffaf4", "#352f39"), image: "assets/document-design-images/workspace.jpg", fonts: { heading: "Noto Serif KR", body: "Noto Sans KR" }, defaultFeel: { imagePresence: "image", titlePresence: "strong", breathing: "airy" }, rules: ["표지와 핵심 메시지는 대표 이미지와 큰 문장을 하나의 장면으로 묶어 감정적 설득력을 만든다.", "전략·로드맵·사례 지면은 짧은 서사와 시각 근거가 번갈아 나타나는 리듬으로 구성한다."] }),
    make({ id: "proposal-sprint-canvas", familyId: "proposal", label: "스프린트 실행 캔버스", description: "목표·담당·일정·성과를 모듈로 묶어 바로 실행하는 워크숍형", themeId: "proposal-win", variant: "sprint-canvas", palette: palette("#154d5b", "#3a8994", "#f08a4b", "#f5fbfa", "#22383e"), image: "assets/document-design-images/workspace.jpg", defaultFeel: { colorPresence: "high", breathing: "compact", titlePresence: "clear" }, rules: ["핵심 목표·근거·담당·일정을 독립 모듈로 구분하되 한 방향의 정렬축으로 연결한다.", "로드맵은 단계별 산출물과 결정 시점을 넓은 가로 흐름으로 배치하고 표는 실행 점검에 맞게 압축한다."] }),
    make({ id: "learning-visual-atlas", familyId: "learning", label: "탐구형 비주얼 아틀라스", description: "큰 관찰 이미지와 번호 캡션으로 개념 관계를 찾아가는 도감형", themeId: "education-guide", variant: "visual-atlas", palette: palette("#235e72", "#5e94a2", "#e5a24b", "#f6fbf8", "#273d42"), image: "assets/document-design-images/forest.jpg", defaultFeel: { imagePresence: "image", titlePresence: "clear", decorationPresence: "rich" }, rules: ["관찰 이미지와 도식을 지면의 중심에 두고 번호·캡션·핵심 용어가 같은 위치 규칙을 반복하게 한다.", "개념 본문은 짧은 설명 묶음으로 나누고 예제·활동은 발견한 내용을 직접 연결하도록 구성한다."] }),
    make({ id: "learning-write-workbook", familyId: "learning", label: "쓰기 중심 탐구 워크북", description: "질문·힌트·기록 공간을 넉넉히 배치한 참여형 학습지", themeId: "minimal-office", variant: "write-workbook", palette: palette("#53633d", "#89986f", "#e0a33d", "#fffdf4", "#33402e"), image: "assets/document-design-images/forest.jpg", defaultFeel: { imagePresence: "text", breathing: "airy", decorationPresence: "minimal" }, rules: ["각 개념 뒤에 질문·힌트·기록 공간을 반복해 읽기와 쓰기가 한 흐름으로 이어지게 한다.", "활동 지면은 손으로 작성할 수 있는 여백과 구분선을 충분히 두고 안내 문장은 짧게 유지한다."] }),
    make({ id: "exam-quick-review", familyId: "exam", label: "한눈에 보는 핵심 요약", description: "정의·공식·주의점을 압축 카드로 묶어 회독 속도를 높이는 요약형", themeId: "technology-industry", variant: "quick-review", palette: palette("#27376d", "#6976a8", "#ed9d37", "#f8f9fd", "#252d4d"), image: "assets/document-design-images/workspace.jpg", defaultFeel: { breathing: "compact", imagePresence: "text", titlePresence: "strong", colorPresence: "high" }, rules: ["핵심 정의·조건·예외를 짧은 요약 블록으로 구분하고 왼쪽 탐색 표식을 모든 지면에 반복한다.", "문제와 해설은 같은 핵심어 색상을 이어 사용해 빠른 회독에서도 관계가 끊기지 않게 한다."] }),
    make({ id: "exam-question-bank", familyId: "exam", label: "고밀도 문제은행", description: "큰 문항 번호와 2단 선택지, 빠른 채점표를 갖춘 반복 훈련형", themeId: "data-evidence", variant: "question-bank", palette: palette("#1f5964", "#4f8890", "#d9574f", "#fbfcfc", "#25383c"), image: "assets/document-design-images/workspace.jpg", defaultFeel: { breathing: "compact", imagePresence: "text", titlePresence: "strong" }, rules: ["문항 번호·문제·선택지의 시작선을 고정하고 한 지면에서 여러 문항을 빠르게 탐색할 수 있게 한다.", "자료 문제와 해설은 배경 면과 정답 표식으로 구분하고 정답표는 번호 중심의 고밀도 그리드로 구성한다."] }),
    make({ id: "prose-letterpress", familyId: "prose", label: "활판 인쇄 문학판", description: "좁은 행폭과 작은 장 표식, 종이의 온기를 살린 고전 단행본형", themeId: "editorial-premium", variant: "letterpress", palette: palette("#4a4035", "#857565", "#a95d45", "#fbf5e9", "#302b27"), image: "assets/document-design-images/forest.jpg", fonts: { heading: "Noto Serif KR", body: "Noto Serif KR" }, defaultFeel: { colorPresence: "low", breathing: "airy", imagePresence: "text", decorationPresence: "minimal" }, rules: ["본문 행폭을 좁고 안정적으로 유지하고 장 제목·쪽번호·인용 표식만 제한적으로 반복한다.", "표지와 장 시작은 활판 인쇄의 작은 색점과 종이 여백을 살리며 긴 글의 읽기 리듬을 우선한다."] }),
    make({ id: "prose-seasonal-journal", familyId: "prose", label: "계절 사진 산문", description: "사진 띠와 짧은 단락이 번갈아 흐르는 감각적인 계절 저널형", themeId: "warm-human", variant: "seasonal-journal", palette: palette("#465d50", "#85988b", "#c9774f", "#faf6ee", "#303a34"), image: "assets/document-design-images/forest.jpg", fonts: { heading: "Noto Serif KR", body: "Noto Serif KR" }, defaultFeel: { imagePresence: "image", breathing: "airy", titlePresence: "quiet" }, rules: ["넓은 사진 띠와 짧은 본문을 교차해 계절의 장면과 문장이 번갈아 머물게 한다.", "캡션과 날짜는 사진 가장자리에 작게 두고 인용 지면은 색면보다 여백과 행간으로 구분한다."] }),
    make({ id: "story-night-adventure", familyId: "story", label: "달빛 모험 그림책", description: "짙은 밤색 장면과 따뜻한 빛 상자가 교차하는 영화적 이야기", themeId: "dark-innovation", variant: "night-adventure", palette: palette("#24366b", "#685f9a", "#f2b343", "#f7f3e8", "#20294a"), image: "assets/document-design-images/story-night-adventure.webp", fonts: { heading: "Noto Serif KR", body: "Noto Sans KR" }, defaultFeel: { imagePresence: "image", titlePresence: "strong", decorationPresence: "rich", colorPresence: "high" }, rules: ["달빛의 차가운 배경과 등불의 따뜻한 빛을 반복해 장면 간 감정 흐름을 유지한다.", "그림을 크게 사용하되 글은 밝은 안전 영역에 짧게 배치하고 인물의 얼굴과 이동 방향을 가리지 않는다."] }),
    make({ id: "story-comic-panels", familyId: "story", label: "네 컷 이야기책", description: "선명한 칸과 표정, 짧은 대사가 순서대로 이어지는 만화형 동화", themeId: "education-guide", variant: "comic-panels", palette: palette("#1d6672", "#5b9bad", "#dc673f", "#fff6dc", "#26383b"), image: "assets/document-design-images/story-comic-panels.webp", defaultFeel: { imagePresence: "image", titlePresence: "strong", decorationPresence: "rich", colorPresence: "high" }, rules: ["일러스트의 칸 순서를 유지하고 장면마다 인물·행동·배경의 연결이 자연스럽게 이어지게 한다.", "대사는 말풍선이나 대사 영역으로 분리하되 이미지에 없는 문구를 임의로 만들지 않고 읽는 순서를 명확히 한다."] }),
    make({ id: "report-executive-brief", familyId: "report", label: "임원 의사결정 브리프", description: "결론·판단 근거·요청 사항을 첫눈에 읽는 고위 의사결정형", themeId: "executive-summary", variant: "executive-brief", palette: palette("#1f3857", "#61758b", "#d79b38", "#f7f8fa", "#202c39"), image: "assets/document-design-images/workspace.jpg", defaultFeel: { breathing: "balanced", imagePresence: "text", titlePresence: "strong", decorationPresence: "minimal" }, rules: ["각 지면의 첫 영역에 결론과 의사결정 요청을 먼저 배치하고 근거 수치는 바로 아래에 연결한다.", "세부 설명은 짧은 항목으로 압축하고 표·차트에는 판단 기준과 다음 행동을 함께 표시한다."] }),
    make({ id: "report-audit-matrix", familyId: "report", label: "감사·점검 결과 보고", description: "쟁점·확인 결과·근거·조치를 번호와 상태로 추적하는 검토형", themeId: "public-policy", variant: "audit-matrix", palette: palette("#3d4a54", "#77838c", "#b84a45", "#fbfaf7", "#2d3439"), image: "assets/document-design-images/workspace.jpg", defaultFeel: { breathing: "compact", imagePresence: "text", titlePresence: "clear", decorationPresence: "minimal" }, rules: ["쟁점 번호·확인 결과·근거·후속 조치를 동일한 순서로 반복해 검토 이력을 추적하게 한다.", "확정·보완·확인 필요 상태는 색과 표식으로만 구분하고 판단 문장은 중립적으로 배치한다."] }),
    make({ id: "report-research-monograph", familyId: "report", label: "연구·분석 보고서", description: "초록·방법·분석·논의를 긴 호흡으로 연결하는 전문 연구형", themeId: "editorial-premium", variant: "research-monograph", palette: palette("#314b62", "#71869a", "#a46a4a", "#fbfaf6", "#28343d"), image: "assets/document-design-images/forest.jpg", fonts: { heading: "Noto Serif KR", body: "Noto Serif KR" }, defaultFeel: { breathing: "airy", imagePresence: "balanced", titlePresence: "quiet", colorPresence: "low" }, rules: ["초록·연구 방법·결과·논의를 명확히 분리하고 본문은 좁은 행폭과 안정된 주석 체계로 구성한다.", "표와 차트에는 번호·제목·단위·출처를 고정 위치에 두어 인용과 검증이 가능하게 한다."] }),
    make({ id: "report-operations-dashboard", familyId: "report", label: "운영 성과 대시보드", description: "핵심 지표·추이·이슈·조치가 한 화면에서 이어지는 성과관리형", themeId: "data-evidence", variant: "operations-dashboard", palette: palette("#164e63", "#398096", "#eb8f35", "#f3f8fa", "#1f3740"), image: "assets/document-design-images/workspace.jpg", defaultFeel: { colorPresence: "high", breathing: "compact", imagePresence: "text", titlePresence: "strong" }, rules: ["핵심 지표와 전기 대비 변화를 상단에 고정하고 추이·원인·조치를 같은 읽기 순서로 연결한다.", "경고색은 예외와 조치 필요 상태에만 사용하며 모든 수치에는 기준 시점과 단위를 표시한다."] }),
    make({ id: "proposal-tender-response", familyId: "proposal", label: "공모·입찰 제안서", description: "요구사항 대응·수행 체계·증빙을 목차 번호로 추적하는 평가 대응형", themeId: "proposal-win", variant: "tender-response", palette: palette("#24466d", "#5f7d9e", "#d08a32", "#f7f9fb", "#253341"), image: "assets/document-design-images/workspace.jpg", defaultFeel: { breathing: "compact", imagePresence: "text", titlePresence: "strong", decorationPresence: "minimal" }, rules: ["요구사항 번호와 제안 내용을 같은 축에 배치하고 평가 근거·산출물·담당을 바로 확인하게 한다.", "목차·본문·표·로드맵의 단계 번호를 일관되게 유지해 평가자가 빠르게 대조할 수 있게 한다."] }),
    make({ id: "proposal-investment-case", familyId: "proposal", label: "투자·사업성 제안", description: "시장 기회·사업 모델·성과 지표를 강한 수치와 흐름으로 설득하는 투자형", themeId: "technology-industry", variant: "investment-case", palette: palette("#162c4c", "#41648a", "#ef7c45", "#f6f8fc", "#1d2b3b"), image: "assets/document-design-images/workspace.jpg", defaultFeel: { colorPresence: "high", breathing: "balanced", imagePresence: "balanced", titlePresence: "strong" }, rules: ["시장 기회와 해결 방식, 수익 구조, 실행 지표를 큰 수치와 짧은 문장으로 연속 배치한다.", "차트는 성장·비교·구성 목적을 분리하고 가정과 기준 시점을 각 지면에서 확인할 수 있게 한다."] }),
    make({ id: "proposal-service-blueprint", familyId: "proposal", label: "서비스 설계 제안", description: "사용자 흐름·접점·운영 역할을 층별로 보여주는 서비스 블루프린트형", themeId: "minimal-office", variant: "service-blueprint", palette: palette("#215a68", "#6d929b", "#e6a13f", "#f5fbfa", "#263d43"), image: "assets/document-design-images/workspace.jpg", defaultFeel: { breathing: "airy", imagePresence: "balanced", titlePresence: "clear", decorationPresence: "balanced" }, rules: ["사용자 행동·접점·운영 역할·지원 시스템을 같은 단계 축에 맞춰 서비스 흐름을 읽게 한다.", "문제 지점과 개선안을 연결선·번호·짧은 주석으로 표현하고 책임 구간을 명확히 구분한다."] }),
    make({ id: "proposal-creative-concept", familyId: "proposal", label: "브랜드·콘텐츠 콘셉트북", description: "키 비주얼·톤앤매너·적용 장면을 한 세트로 체감하는 크리에이티브형", themeId: "warm-human", variant: "creative-concept", palette: palette("#5c3e52", "#957388", "#e1714f", "#fff8f2", "#352b31"), image: "assets/document-design-images/workspace.jpg", fonts: { heading: "Noto Serif KR", body: "Noto Sans KR" }, defaultFeel: { colorPresence: "high", breathing: "airy", imagePresence: "image", titlePresence: "strong", decorationPresence: "rich" }, rules: ["핵심 메시지·키 비주얼·색·서체·이미지 방향을 하나의 콘셉트 문장 아래 묶어 일관된 인상을 만든다.", "적용 장면은 실제 비율의 이미지와 짧은 사용 원칙으로 제시해 제작자가 바로 확장할 수 있게 한다."] }),
  ];
  window.PromptDeckDocumentBundles = { version: 3, families, bundles, get(id) { return bundles.find((bundle) => bundle.id === id) || null; } };
})();
