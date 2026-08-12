(function (root) {
  "use strict";

  const STORAGE_KEY = "promptdeck.deckQualityLoop.v1";
  const PASS_SCORE = 85;
  const MAX_ITERATIONS = 3;
  const CORRECTION_MARKER = "## PROMPTDECK QUALITY CORRECTION LOOP";
  const SKILL_PRESET_CONTRACT = root.PromptDeckSkillPresetContract || null;
  const PLANNER_CONTRACT_VERSION = SKILL_PRESET_CONTRACT?.versions?.plannerCurrent || "3.6";

  const RUBRIC = Object.freeze([
    {
      id: "contentFidelity",
      label: "콘텐츠 정확성",
      weight: 25,
      critical: true,
      question: "문구·수치·단위·출처가 명세와 정확히 일치하는가?",
      correction: "양식과 콘텐츠의 정확한 문자열·수치·단위·날짜·고유명사를 원문 그대로 복원하고, 임의 문구·중복·누락을 제거한다.",
    },
    {
      id: "messageClarity",
      label: "3초 이해도",
      weight: 20,
      critical: true,
      question: "첫 시선에서 결론 하나와 핵심 근거의 관계가 읽히는가?",
      correction: "첫 시선의 초점을 결론 하나로 모으고 핵심 근거가 그 결론을 직접 증명하도록 위계와 시선 흐름을 재정렬한다.",
    },
    {
      id: "legibility",
      label: "발표 가독성",
      weight: 20,
      critical: true,
      question: "실제 발표 크기에서 글자·수치·도형이 선명한가?",
      correction: "발표 거리에서 읽히도록 글자·수치·도형의 대비와 보호 여백을 강화하고, 잘림·번짐·전면 블러·과밀을 제거한다.",
    },
    {
      id: "deckConsistency",
      label: "덱 일관성",
      weight: 15,
      critical: false,
      question: "공통 디자인 DNA와 헤더·푸터 규칙을 유지하는가?",
      correction: "덱 공통 디자인 시스템의 디자인 DNA·색채·타이포그래피·표면·헤더·푸터 앵커를 복원하되 이 페이지의 목적에 맞는 변주는 유지한다.",
    },
    {
      id: "composition",
      label: "구성 완성도",
      weight: 10,
      critical: false,
      question: "여백·정렬·레이어·강조가 상업 디자인 수준인가?",
      correction: "의미 그룹·관계·읽기 우선순위를 보존한다. 구성 고정이 아니면 현재 구도에 묶이지 말고 공간 구조·매체·시각 은유 후보를 다시 비교한 뒤 정렬·간격·여백·크롭·레이어를 정교하게 완성한다.",
    },
    {
      id: "finish",
      label: "시각 마감",
      weight: 10,
      critical: false,
      question: "깨진 글자·어색한 도형·저해상도 질감이 없는가?",
      correction: "깨진 글자, 뒤틀린 도형, 거친 가장자리, 저해상도 질감, 불필요한 효과를 제거하고 픽셀 단위로 선명하게 마감한다.",
    },
  ]);

  function clampRating(value) {
    const rating = Number(value);
    return Number.isFinite(rating) ? Math.max(0, Math.min(5, Math.round(rating))) : 0;
  }

  function normalizeRatings(ratings = {}) {
    return RUBRIC.reduce((result, item) => {
      result[item.id] = clampRating(ratings[item.id]);
      return result;
    }, {});
  }

  function evaluate(ratings = {}) {
    const normalized = normalizeRatings(ratings);
    const complete = RUBRIC.every((item) => normalized[item.id] > 0);
    const score = Math.round(RUBRIC.reduce((sum, item) => (
      sum + (normalized[item.id] / 5) * item.weight
    ), 0));
    const criticalFailures = RUBRIC.filter((item) => item.critical && normalized[item.id] < 4);
    const improvementTargets = RUBRIC
      .filter((item) => normalized[item.id] > 0 && normalized[item.id] < 5)
      .sort((a, b) => normalized[a.id] - normalized[b.id] || b.weight - a.weight);
    const passed = complete && score >= PASS_SCORE && criticalFailures.length === 0;
    return { ratings: normalized, complete, score, passed, criticalFailures, improvementTargets };
  }

  function extractProductionMetadata(prompt) {
    const text = String(prompt || "");
    const skillDirectives = SKILL_PRESET_CONTRACT?.parseSkillDirectives?.(text) || {};
    const density = (
      text.match(/(?:정보 밀도|information density)\s*[:：]?\s*(C[1-4])/i)?.[1]
      || text.match(/(?:^|[\s|,/·ㆍ])(?:C)\s*([1-4])(?=\s*(?:$|[|,/·ㆍ]|V\s*[0-4]))/im)?.[1]?.replace(/^/, "C")
      || ""
    ).toUpperCase();
    const dataStrength = (
      text.match(/(?:데이터 시각화 강도|data visualization strength)\s*[:：]?\s*(V[0-4])/i)?.[1]
      || text.match(/(?:^|[\s|,/·ㆍ])(?:V)\s*([0-4])(?=\s*(?:$|[|,/·ㆍ]))/im)?.[1]?.replace(/^/, "V")
      || ""
    ).toUpperCase();
    const diagramComplexity = (
      text.match(/(?:도식|다이어그램)\s*복잡도\s*[:：]?\s*(D[0-4])/i)?.[1]
      || text.match(/diagram\s*complexity\s*[:：]?\s*(D[0-4])/i)?.[1]
      || ""
    ).toUpperCase();
    const compositionAutonomy = text.match(/(?:구성 위임 수준|composition autonomy)\s*[:：]?\s*(.+?)\s*$/mi)?.[1]?.trim() || "";
    const compositionAutonomyKey = /구성\s*고정|composition\s*lock/i.test(compositionAutonomy)
      ? "locked"
      : /읽기\s*방향\s*가이드|guided/i.test(compositionAutonomy)
        ? "guided"
        : /의미만\s*고정|meaning.*(?:locked|only)|delegated/i.test(compositionAutonomy)
          ? "open"
          : "";
    return {
      density,
      dataStrength,
      diagramComplexity,
      compositionAutonomy,
      compositionAutonomyKey: skillDirectives.compositionAuthority || compositionAutonomyKey,
      skillLocks: skillDirectives.locks || [],
      skillGuides: skillDirectives.guides || [],
      skillFree: skillDirectives.free || [],
      lockReason: skillDirectives.lockReason || "",
      presetScope: skillDirectives.presetScope || [],
    };
  }

  function extractDiagramContract(prompt) {
    const text = String(prompt || "");
    const metadata = extractProductionMetadata(text);
    const diagramSignal = Boolean(
      metadata.diagramComplexity
      || /(?:도식|다이어그램)\s*유형\s*[:：]|(?:관계|연결|도식)\s*구조\s*[:：]|(?:구조|관계)\s*무결성\s*[:：]|relationship\s*structure\s*[:：]|structure\s*integrity\s*[:：]/i.test(text)
    );
    if (!diagramSignal) return {
      detected: false,
      ready: true,
      semanticReady: true,
      topologyReady: true,
      semanticWarnings: [],
      topologyWarnings: [],
      warnings: [],
    };
    const type = text.match(/(?:도식|다이어그램)\s*유형\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/diagram\s*type\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const relationship = text.match(/(?:관계|연결|도식)\s*구조\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/relationship\s*structure\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const integrity = text.match(/(?:구조|관계)\s*무결성\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/structure\s*integrity\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const labelScope = text.match(/관계\s*레이블\s*적용\s*범위\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/relationship\s*label\s*scope\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const allowedConnections = text.match(/허용\s*(?:연결|관계)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/allowed\s*(?:connections?|relationships?)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const forbiddenConnections = text.match(/금지\s*(?:연결|관계)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/forbidden\s*(?:connections?|relationships?)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const arrowheadPolicy = text.match(/화살촉\s*(?:규칙|정책|수)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/arrowhead\s*(?:rule|policy|count)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const connectionCorridors = text.match(/연결\s*통로\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/connection\s*corridors?\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const meaningStatement = text.match(/(?:도식\s*핵심\s*판단|의미\s*문장)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/(?:diagram\s*(?:core\s*)?(?:judg(?:e)?ment|argument)|meaning\s*statement)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const decisionTakeaway = text.match(/(?:결론\s*귀착점|판단\s*캡션|목표\s*판단(?:\s*또는\s*행동)?)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/(?:decision\s*(?:takeaway|endpoint)|target\s*(?:judg(?:e)?ment|action))\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const inlineNodeRoles = text.split(/\r?\n/)
      .filter((line) => /\|\s*(?:역할구|역할\s*설명|role)\s*[:：]/i.test(line))
      .map((line) => line.replace(/^\s*[-*+]\s*/, "").trim())
      .join(" | ");
    const inlineRelationshipActions = text.split(/\r?\n/)
      .filter((line) => /(?:관계|EDGE)[^\r\n]*\|\s*(?:관계\s*동사|표시\s*관계구|relationship\s*(?:action|verb))\s*[:：]/i.test(line))
      .map((line) => line.replace(/^\s*[-*+]\s*/, "").trim())
      .join(" | ");
    const nodeRoles = text.match(/노드\s*역할(?:\s*설명|구)?\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/node\s*roles?(?:\s*descriptions?)?\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || inlineNodeRoles
      || "";
    const relationshipActions = text.match(/(?:관계\s*(?:동사|의미\s*문구)|연결\s*(?:동사|의미))\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/relationship\s*(?:actions?|verbs?|meanings?)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || inlineRelationshipActions
      || "";
    const evidenceStatus = text.match(/(?:관계\s*지위|증거\s*지위)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/(?:relationship|evidence)\s*status\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const argumentGrammar = text.match(/논증\s*(?:문법|경로)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/argument\s*(?:grammar|path)\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const headline = text.match(/주장\s*헤드라인\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || text.match(/claim\s*headline\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
      || "";
    const abstractHeadline = Boolean(
      headline
      && /작동\s*구조|공동\s*성과|연계\s*체계|생태계(?:의)?(?:\s*구조)?/i.test(headline)
      && !/→|보다|통해|지원|관리|전환|합류|우선|목표|판단|차이|격차|확대|축소|증가|감소/i.test(headline)
    );
    const topologyWarnings = [];
    const semanticWarnings = [];
    if (!metadata.diagramComplexity) topologyWarnings.push("도식 복잡도 D1~D4를 확인하세요.");
    if (!type) topologyWarnings.push("도식의 주 관계 유형을 확인하세요.");
    if (!relationship) topologyWarnings.push("노드 사이 관계·방향·그룹 구조를 확인하세요.");
    if (!integrity) topologyWarnings.push("노드·연결·방향·귀속의 구조 무결성 조건을 확인하세요.");
    if (!labelScope && /관계\s*레이블|relationship\s*label/i.test(text)) topologyWarnings.push("관계 레이블의 적용 범위를 확인하세요.");
    if (/^D[34]$/.test(metadata.diagramComplexity) && !allowedConnections) topologyWarnings.push("복합 도식의 허용 연결 목록을 확인하세요.");
    if (/^D[34]$/.test(metadata.diagramComplexity) && !forbiddenConnections) topologyWarnings.push("복합 도식이 추정하면 안 되는 금지 연결을 확인하세요.");
    if (/^D[34]$/.test(metadata.diagramComplexity) && !arrowheadPolicy) topologyWarnings.push("복합 도식의 화살촉 수와 적용 범위를 확인하세요.");
    if (metadata.diagramComplexity === "D4" && /합류|분기|네트워크|merge|branch|network/i.test(`${type} ${relationship}`) && !connectionCorridors) {
      topologyWarnings.push("D4 구성 고정 도식의 연결 통로와 비연결 여백을 확인하세요.");
    }
    if (metadata.diagramComplexity === "D4" && !/개요.?상세|슬라이드\s*분할|부록\s*이동|overview.?detail|split\s*(?:the\s*)?slide|move\s*to\s*appendix/i.test(text)) {
      topologyWarnings.push("D4 과밀 위험입니다. 개요–상세 분할 또는 부록 이동 방침을 먼저 확인하세요.");
    }
    if (!meaningStatement) semanticWarnings.push("도식이 증명할 핵심 판단을 한 문장으로 정의하세요.");
    if (!relationshipActions) semanticWarnings.push("각 연결을 출발점·관계 동사·종착점으로 말할 수 있게 정의하세요.");
    if (!decisionTakeaway) semanticWarnings.push("도식이 귀결될 판단 또는 행동을 정의하세요.");
    if (!evidenceStatus) semanticWarnings.push("관계를 사실·해석·정책 설계·권고·목표 중 하나로 구분하세요.");
    if (/^D[2-4]$/.test(metadata.diagramComplexity) && !nodeRoles) semanticWarnings.push("D2 이상 도식의 각 노드에 짧은 역할구를 정의하세요.");
    if (/^D[2-4]$/.test(metadata.diagramComplexity) && !argumentGrammar) semanticWarnings.push("D2 이상 도식의 논증 경로를 조건·작동·결과·판단 순으로 정의하세요.");
    if (abstractHeadline) semanticWarnings.push("개수·생태계·작동 구조 같은 추상어보다 작동 방식과 결론을 주장 헤드라인에 표시하세요.");
    const warnings = [...semanticWarnings, ...topologyWarnings];
    return {
      detected: true,
      ready: warnings.length === 0,
      semanticReady: semanticWarnings.length === 0,
      topologyReady: topologyWarnings.length === 0,
      complexity: metadata.diagramComplexity,
      type,
      relationship,
      integrity,
      labelScope,
      allowedConnections,
      forbiddenConnections,
      arrowheadPolicy,
      connectionCorridors,
      meaningStatement,
      decisionTakeaway,
      nodeRoles,
      relationshipActions,
      evidenceStatus,
      argumentGrammar,
      headline,
      abstractHeadline,
      semanticWarnings,
      topologyWarnings,
      warnings,
    };
  }

  function analyzePromptContract(prompt) {
    const text = String(prompt || "");
    const metadata = extractProductionMetadata(text);
    const diagram = extractDiagramContract(text);
    const checks = [
      ["commonGuide", /공통 디자인 시스템|COMMON DESIGN SYSTEM|덱 (?:공통 )?디자인 가이드/i],
      ["format", /#{2,4}\s*양식(?:\s|〔)|\bFORMAT\b/i],
      ["purpose", /#{2,4}\s*핵심 주제[·ㆍ]목적|\bPURPOSE\b/i],
      ["content", /#{2,4}\s*콘텐츠(?:\s|〔)|CONTENT LOCK/i],
      ["expression", /#{2,4}\s*표현 방식(?:\s|〔)|\bEXPRESSION\b/i],
      ["quality", /#{2,4}\s*품질 조건(?:\s|〔)|\bQUALITY\b/i],
    ];
    const result = Object.fromEntries(checks.map(([id, pattern]) => [id, pattern.test(text)]));
    result.density = Boolean(metadata.density);
    result.dataStrength = Boolean(metadata.dataStrength);
    result.compositionAutonomy = Boolean(metadata.compositionAutonomyKey);
    result.colorOrchestration = (
      /사진·지도·재료|사진.*고유색|local colors? of photography|preserve (?:the )?local colors?/i.test(text)
      && /단일 색조|한 색조로 수렴하지|전체 화면.*(?:물들이|워시)|single[- ]hue wash|avoid converging to one hue|full canvas.*(?:hue|wash)|색온도 대비점|chromatic counterpoint/i.test(text)
    );
    result.paletteIdentity = /팔레트 (?:서명|아이덴티티)|연결 흐름 \+ 결정점|palette signature|current plus decision point|Primary·Secondary·Accent|P=#[0-9a-f]{6}.*S=#[0-9a-f]{6}.*A=#[0-9a-f]{6}/i.test(text);
    result.skillPresetContract = /스킬[–-]프리셋 시각 계약|SKILL[–-]PRESET VISUAL CONTRACT/i.test(text);
    result.skillPresetResolution = !result.skillPresetContract || (
      metadata.skillLocks.length > 0
      && metadata.skillGuides.length > 0
      && metadata.skillFree.length > 0
      && Boolean(metadata.lockReason)
      && metadata.presetScope.length > 0
    );
    const slideSections = ["format", "purpose", "content", "expression", "quality"];
    const sectionCount = slideSections.filter((id) => result[id]).length;
    const warnings = [];
    if (!result.commonGuide) warnings.push("덱 공통 디자인 가이드 연결을 확인하세요.");
    if (sectionCount < slideSections.length) warnings.push(`슬라이드 MECE 계약이 ${sectionCount}/5입니다.`);
    if (!result.density || !result.dataStrength) warnings.push("확정된 C·V 제작 메타데이터를 확인하세요.");
    if (!result.compositionAutonomy) warnings.push("의미만 고정·읽기 방향 가이드·구성 고정 중 구성 위임 수준을 확인하세요.");
    if (!result.colorOrchestration) warnings.push("팔레트 구조색·실사 고유색·단일 색조 워시 금지 규칙을 연결하세요.");
    if (!result.paletteIdentity) warnings.push("Primary·Secondary·Accent가 반복되는 팔레트 아이덴티티 패턴을 연결하세요.");
    if (!result.skillPresetResolution) warnings.push("스킬 잠금·가이드·자유 범위와 프리셋 적용 범위의 해석 추적을 연결하세요.");
    warnings.push(...diagram.warnings);
    return {
      ...result,
      diagram,
      sectionCount,
      ready: result.commonGuide && sectionCount === 5 && result.density && result.dataStrength && result.compositionAutonomy && result.colorOrchestration && result.paletteIdentity && result.skillPresetResolution && diagram.ready,
      warnings,
    };
  }

  function stripCorrectionBlock(prompt) {
    const text = String(prompt || "").trim();
    const markerIndex = text.indexOf(CORRECTION_MARKER);
    return (markerIndex >= 0 ? text.slice(0, markerIndex) : text).trim();
  }

  function buildCorrectionPrompt(prompt, review = {}) {
    const assessment = evaluate(review.ratings);
    if (!assessment.complete) throw new Error("6개 품질 축을 모두 평가해주세요.");
    if (assessment.passed) throw new Error("이미 상업 품질 통과 상태입니다.");

    const preserved = RUBRIC
      .filter((item) => assessment.ratings[item.id] >= 4)
      .map((item) => item.label);
    const targets = assessment.improvementTargets.length
      ? assessment.improvementTargets
      : RUBRIC.filter((item) => assessment.ratings[item.id] < 4);
    const notes = String(review.notes || "").trim();
    const diagram = extractDiagramContract(prompt);
    const metadata = extractProductionMetadata(prompt);
    const compositionPreserve = metadata.compositionAutonomyKey === "locked"
      ? "명세가 잠근 큰 구도와 구성 잠금 이유"
      : "명세의 의미 그룹·관계·읽기 우선순위";
    const lines = [
      CORRECTION_MARKER,
      "",
      `- 현재 QA 점수: ${assessment.score}/100 · 목표: ${PASS_SCORE}/100 이상, 핵심 축 모두 4점 이상`,
      `- 반복 번호: ${Math.max(1, Number(review.iteration) || 1)}`,
      "- 작업 방식: 새 디자인을 처음부터 만들지 말고 현재 결과를 교정한다. 아래 실패 항목만 수정하고 통과한 요소는 보존한다.",
      preserved.length ? `- 반드시 보존: ${preserved.join(", ")}와 양식·콘텐츠의 정확한 표시값, ${compositionPreserve}` : `- 반드시 보존: 양식·콘텐츠의 정확한 표시값과 ${compositionPreserve}`,
      "- 교정 대상:",
      ...targets.map((item, index) => `  ${index + 1}. ${item.label} (${assessment.ratings[item.id]}/5): ${item.correction}`),
    ];
    if (notes) lines.push(`- 검수자 메모: ${notes}`);
    if (diagram.detected) {
      lines.push(
        `- 도식 의미 보존: ${diagram.meaningStatement || "명세의 도식 핵심 판단을 복원"}`,
        ...(diagram.nodeRoles ? [`- 노드 역할 보존: ${diagram.nodeRoles}`] : []),
        ...(diagram.relationshipActions ? [`- 관계 동사 보존: ${diagram.relationshipActions}`] : []),
        ...(diagram.argumentGrammar ? [`- 논증 경로 보존: ${diagram.argumentGrammar}`] : []),
        `- 결론 귀착점: ${diagram.decisionTakeaway || "명세의 목표 판단 또는 행동으로 수렴"}`,
        `- 관계 지위: ${diagram.evidenceStatus || "확인 사실·해석·정책 설계·권고·목표의 지위를 임의로 강화하지 않음"}`,
        `- 도식 구조 보존: ${diagram.complexity || "D값 확인"} ${diagram.type || "관계 유형 확인"}. ${diagram.integrity || "명세의 노드·연결·방향·귀속을 모두 보존"}`,
        ...(diagram.allowedConnections ? [`- 허용 연결만 보존: ${diagram.allowedConnections}`] : []),
        ...(diagram.forbiddenConnections ? [`- 금지 연결 제거: ${diagram.forbiddenConnections}`] : []),
        ...(diagram.arrowheadPolicy ? [`- 화살촉 규칙: ${diagram.arrowheadPolicy}`] : []),
        ...(diagram.connectionCorridors && metadata.compositionAutonomyKey === "locked" ? [`- 연결 통로 보존: ${diagram.connectionCorridors}`] : []),
        ...(metadata.compositionAutonomyKey !== "locked" ? ["- 도식 구성 재선택 허용: 의미 토폴로지와 데이터 귀속은 고정하되 노드 형태·공간 배치·방향·연결선 경로·레이어·매체는 다시 비교한다."] : []),
        "- 제작키 숨김: 노드 01·N01·EDGE-01 같은 참조키·번호·ID 범례는 화면에 표시하지 않고 실제 표시 레이블·역할구·관계 동사만 남긴다.",
        "- 도식 교정: 구조만 맞는 추상 도식을 통과시키지 않는다. 각 노드는 이름+역할구, 각 연결은 출발점+표시 관계 동사+종착점으로 읽히게 하고, 헤드라인·주 경로·귀착점이 같은 판단을 전달하도록 전체 이미지를 다시 생성한다.",
        "- 3초 재진술: 출발 역할·관계 동사·결과·판단을 한 문장으로 복원할 수 있어야 하며, 임의 노드·연결·화살표·순환·인과는 추가하지 않는다."
      );
    }
    lines.push(
      "- 출력 제한: 비교안, 설명문, 평가표, Markdown을 출력하지 말고 교정된 완성 슬라이드 이미지 한 장만 생성한다.",
      "- 재검수 기준: 정확한 표시값, 3초 이해도, 발표 가독성, 덱 일관성, 구성 완성도, 시각 마감을 다시 확인한다."
    );
    return `${stripCorrectionBlock(prompt)}\n\n${lines.join("\n")}`;
  }

  function buildPlannerFeedback(payload = {}) {
    const assessment = evaluate(payload.ratings);
    if (!assessment.complete) throw new Error("6개 품질 축을 모두 평가해주세요.");

    const prompt = stripCorrectionBlock(payload.prompt);
    const contract = analyzePromptContract(prompt);
    const metadata = extractProductionMetadata(prompt);
    const density = metadata.density || "확인 필요";
    const dataStrength = metadata.dataStrength || "확인 필요";
    const preserved = RUBRIC.filter((item) => assessment.ratings[item.id] >= 4);
    const revisions = assessment.improvementTargets;
    const notes = String(payload.notes || "").trim();
    const sectionMap = {
      contentFidelity: "양식·콘텐츠·품질 조건 — 원문 대조 후 정확한 표시값과 사실 경계만 교정",
      messageClarity: "핵심 주제·목적·표현 방식 — 결론 하나, 증거 역할, 첫 시선의 논증을 재정렬",
      legibility: "표현 방식·품질 조건 — 정보 위계, 보호 여백, 과밀·잘림 방지 조건을 보강",
      deckConsistency: "표현 방식 — 공통 디자인 DNA를 반복하지 말고 일관성 앵커와 페이지 변주를 재정렬",
      composition: "표현 방식 — 의미 그룹·관계·읽기 우선순위·구성 위임 수준을 보존하고 구도·매체 후보를 재비교",
      finish: "품질 조건 — 한글·수치·도형·참조 동일성·선명도 취약점을 구체화",
    };

    return [
      "# PromptDeck → $ppt-slide-planner 재기획 피드백",
      "",
      `- PromptDeck 계약: ${PLANNER_CONTRACT_VERSION}`,
      `- 대상 슬라이드: ${String(payload.slideId || payload.title || "확인 필요")}`,
      `- 이미지 반복: ${Math.max(0, Number(payload.iteration) || 0)}차`,
      `- QA 점수: ${assessment.score}/100 · ${assessment.passed ? "통과" : "재기획 필요"}`,
      `- 확정 정보 밀도: ${density}`,
      `- 확정 데이터 시각화 강도: ${dataStrength}`,
      `- 구성 위임 수준: ${metadata.compositionAutonomy || "확인 필요"}`,
      `- 스킬 잠금: ${metadata.skillLocks.length ? metadata.skillLocks.join("·") : "확인 필요"}`,
      `- 스킬 가이드: ${metadata.skillGuides.length ? metadata.skillGuides.join("·") : "확인 필요"}`,
      `- 자유 범위: ${metadata.skillFree.length ? metadata.skillFree.join("·") : "확인 필요"}`,
      `- 프리셋 적용 범위: ${metadata.presetScope.length ? metadata.presetScope.join("·") : "확인 필요"}`,
      `- 도식 복잡도: ${metadata.diagramComplexity || "해당 없음"}`,
      ...(contract.diagram.detected ? [`- 도식 의미 계약: ${contract.diagram.semanticReady ? "준비 완료" : "보강 필요"} · 구조 계약: ${contract.diagram.topologyReady ? "준비 완료" : "보강 필요"}`] : []),
      `- 계약 연결: MECE ${contract.sectionCount}/5 · 공통 디자인 가이드 ${contract.commonGuide ? "연결" : "확인 필요"}`,
      "",
      "## 통과 요소 〔보존〕",
      ...(preserved.length ? preserved.map((item) => `- ${item.label}: ${assessment.ratings[item.id]}/5 · 기존 기획 의도와 통과한 결과를 유지`) : ["- 없음 · 기획 구조를 전반적으로 재검토"]),
      "",
      "## 개선 대상 〔해당 섹션만 수정〕",
      ...(revisions.length ? revisions.map((item) => `- ${item.label}: ${assessment.ratings[item.id]}/5 · ${sectionMap[item.id]}`) : ["- 추가 수정 없음"]),
      ...(contract.warnings.length ? ["", "## 계약 경고", ...contract.warnings.map((warning) => `- ${warning}`)] : []),
      ...(notes ? ["", "## 검수자 관찰", notes] : []),
      "",
      "## $ppt-slide-planner 작업 요청",
      "1. 기존 원문과 PromptDeck MD를 단일 진실원으로 사용하고, 새로운 사실·문구·수치·출처를 만들지 않는다.",
      "2. 통과 요소와 기존 공통 디자인 가이드는 고정한다. 공통 색상·폰트·표면·헤더·푸터 규칙을 개별 MD에 반복하지 않는다.",
      "3. 위 개선 대상과 연결된 섹션만 수정하고 `양식 → 핵심 주제·목적 → 콘텐츠 → 표현 방식 → 품질 조건` 순서를 유지한다.",
      "4. 확정된 C/V는 임의로 바꾸지 않는다. 변경이 필요하면 이유와 대안을 먼저 제시하고 사용자 확인을 기다린다.",
      "5. 의미 그룹·관계·읽기 우선순위·정보 위계·구성 위임 수준을 재설계한다. 구성 고정이 아닌 장에서는 큰 레이아웃·픽셀 좌표·고정 크기·세부 간격을 선결정하지 않는다.",
      "6. 수정된 해당 슬라이드 블록과 앞뒤 슬라이드 연결에 미치는 영향만 출력한다.",
    ].join("\n");
  }

  function readHistory() {
    try {
      const parsed = JSON.parse(root.localStorage?.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveReview(review) {
    const history = readHistory();
    const entry = {
      id: String(review.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      slideId: String(review.slideId || "slide"),
      iteration: Math.max(0, Number(review.iteration) || 0),
      score: Number(review.score) || 0,
      passed: Boolean(review.passed),
      ratings: normalizeRatings(review.ratings),
      notes: String(review.notes || "").slice(0, 2000),
      createdAt: review.createdAt || new Date().toISOString(),
    };
    history.push(entry);
    const trimmed = history.slice(-300);
    try {
      root.localStorage?.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (_) {
      // The current review still remains usable when storage is unavailable.
    }
    return entry;
  }

  function summarizeHistory(history = readHistory()) {
    const latestBySlide = new Map();
    history.forEach((entry) => latestBySlide.set(entry.slideId, entry));
    const latest = [...latestBySlide.values()];
    const passed = latest.filter((entry) => entry.passed).length;
    const average = latest.length
      ? Math.round(latest.reduce((sum, entry) => sum + (Number(entry.score) || 0), 0) / latest.length)
      : 0;
    return { reviewed: latest.length, passed, average, totalRuns: history.length };
  }

  root.PromptDeckQualityLoop = {
    rubric: RUBRIC,
    passScore: PASS_SCORE,
    maxIterations: MAX_ITERATIONS,
    evaluate,
    extractDiagramContract,
    analyzePromptContract,
    buildCorrectionPrompt,
    buildPlannerFeedback,
    readHistory,
    saveReview,
    summarizeHistory,
  };
})(typeof window !== "undefined" ? window : globalThis);
