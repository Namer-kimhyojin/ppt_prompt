(function () {
  "use strict";
  const bundles = window.PromptDeckDocumentBundles;
  const supportedBundles = ["report-public-calm", "report-data-clear", "proposal-strategy", "proposal-visual"];
  const entry = (id, label, description, rule) => ({ id, label, description, rule });
  const variants = {
    body: [
      entry("body-columns", "두 단 편집", "본문을 두 단으로 나누어 읽는 흐름을 만듭니다.", "제목과 도입은 지면 전체 폭에 두고 본문 문단은 읽는 순서대로 두 단에 배치한다. 주석은 본문 뒤에서 정리한다."),
      entry("body-sidebar", "측면 주석", "본문 옆에 읽는 관점을 가까이 배치합니다.", "본문을 넓은 읽기 영역에 두고 보조 주석을 좁은 측면에 배치한다. 주석의 소속과 본문 순서를 유지한다."),
      entry("body-linear", "넓은 한 단", "문단을 넓게 이어 긴 글의 흐름을 살립니다.", "제목·도입·본문을 안정된 한 단으로 연결하고 보조 주석은 본문 뒤에 배치한다."),
    ],
    table: [
      entry("table-rail", "표와 해설 나란히", "표와 읽는 기준을 두 영역으로 나눕니다.", "비교표를 넓은 영역에 두고 표를 읽는 기준은 좁은 측면에 나란히 배치한다. 행·열 제목과 모든 값을 보존한다."),
      entry("table-records", "항목별 기록 카드", "각 행을 독립된 기록으로 펼쳐 비교합니다.", "표의 각 행을 항목별 기록 카드로 배치하고 각 값에 원래 열 제목을 함께 표시한다. 원래 행 순서와 단위를 보존하고 누락된 값을 만들지 않는다."),
    ],
    chart: [
      entry("chart-focus", "차트를 크게", "큰 그래프를 먼저 보고 아래에서 수치를 읽습니다.", "차트를 지면의 주된 영역으로 크게 배치하고 관련 수치는 아래에 한 줄로 정리한다. 같은 데이터·단위·비교 기준을 유지한다."),
      entry("chart-sidebar", "수치와 차트 병렬", "핵심 수치와 그래프를 나란히 비교합니다.", "핵심 수치를 좁은 세로 영역에 쌓고 차트는 옆의 넓은 영역에 배치한다. 차트 유형과 데이터의 의미를 배치 변경만을 이유로 바꾸지 않는다."),
    ],
    message: [
      entry("message-split", "메시지와 근거 병렬", "큰 메시지와 설명을 나란히 보여줍니다.", "핵심 메시지를 한쪽의 큰 영역에 두고 근거 문단은 옆에 읽는 순서대로 배치한다. 관련 수치는 하단에서 연결한다."),
      entry("message-editorial", "메시지와 두 단 근거", "메시지 아래에 근거를 두 단으로 펼칩니다.", "핵심 메시지를 상단 전체 폭에 두고 근거 문단을 두 단으로 구성한다. 수치는 하단의 일관된 띠 영역에 배치한다."),
    ],
    diagram: [
      entry("diagram-lanes", "단계별 펼침", "번호가 이어지는 넓은 단계 블록입니다.", "흐름은 번호 순서의 단계 블록으로 펼쳐 보여주고 계층이면 상위 항목을 위에, 하위 항목을 아래에 둔다. 원래 연결 관계를 보존한다."),
      entry("diagram-spine", "중심축 연결", "하나의 기준축을 따라 관계를 보여줍니다.", "흐름은 중심축을 따라 단계가 순서대로 교차하도록 배치한다. 계층 관계는 상위와 하위의 연결을 분명하게 유지하며 임의의 연결을 만들지 않는다."),
    ],
    roadmap: [
      entry("roadmap-columns", "단계별 열 구성", "실행 단계를 나란히 읽을 수 있습니다.", "실행 단계를 같은 폭의 열로 나란히 놓고 각 단계의 설명을 바로 아래에 배치한다. 좁은 판형에서는 읽는 순서대로 다음 줄에 이어 배치한다."),
      entry("roadmap-spine", "교차형 일정 흐름", "단계가 중심선을 따라 번갈아 이어집니다.", "중심선의 양쪽에 실행 단계를 순서대로 배치하고 번호로 읽는 순서를 표시한다. 주어진 일정과 설명을 유지하며 새로운 기간이나 산출물을 추가하지 않는다."),
    ],
  };
  function options(bundleId, pageId) {
    if (!supportedBundles.includes(bundleId)) return [];
    const page = bundles.get(bundleId)?.pages.find((item) => item.id === pageId);
    if (!page || !variants[page.kind]) return [];
    if (bundleId.startsWith("proposal-") && page.kind === "table") return [];
    const isDataBody = bundleId === "report-data-clear" && page.kind === "body";
    const choices = page.kind === "body" ? variants.body.filter((item) => item.id !== (isDataBody ? "body-sidebar" : "body-linear")) : variants[page.kind];
    return [entry("default", isDataBody ? "기본 · 측면 주석" : "견본 기본 배치", "선택한 테마의 원래 배치입니다.", page.rule), ...choices];
  }
  function get(bundleId, pageId, id) { return options(bundleId, pageId).find((item) => item.id === id); }
  function normalize(bundleId, input) {
    const value = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    return Object.fromEntries((bundles.get(bundleId)?.pages || []).flatMap((page) => {
      const id = value[page.id];
      return id !== "default" && get(bundleId, page.id, id) ? [[page.id, id]] : [];
    }));
  }
  window.PromptDeckDocumentLayouts = Object.freeze({ supportedBundles: Object.freeze(supportedBundles), options, get, normalize });
})();
