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
    version: 1,
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
  ];
  window.PromptDeckDocumentBundles = { version: 1, families, bundles, get(id) { return bundles.find((bundle) => bundle.id === id) || null; } };
})();
