(function () {
  "use strict";

  var slug = location.pathname.replace(/\/+$/u, "").split("/").pop().replace(/\.html$/u, "");
  var guides = {
    "common-prompt": {
      name: "공통 프롬프트",
      overview: "5단계 입력 영역과 오른쪽 현재 설정 요약을 한 화면에서 확인합니다.",
      detail: "첫 단계의 출력 규격과 예약 영역입니다. 실제 사용 매체를 먼저 정하면 뒤의 선택 기준이 흔들리지 않습니다.",
      detailSize: [765, 720],
      nodes: [["입력", "발표 목적·규격"], ["설계", "색상·글자·시각 자원"], ["결과", "공통 디자인 가이드"], ["연결", "분리기 또는 이미지 AI"]]
    },
    "slide-splitter": {
      name: "슬라이드 분리기",
      overview: "왼쪽에서 공통 규칙과 기획안을 입력하고 오른쪽에서 장별 결과를 검토합니다.",
      detail: "공통 프롬프트와 기획안 입력부입니다. 공통 규칙과 장별 내용을 구분해서 전달하는 것이 핵심입니다.",
      detailSize: [762, 720],
      nodes: [["입력", "공통 가이드+기획안"], ["처리", "슬라이드 단위 분리"], ["검토", "장수·제목·수치 확인"], ["결과", "장별 실행 프롬프트"]]
    },
    "form-image": {
      name: "양식 이미지",
      overview: "왼쪽의 단계별 설정과 오른쪽의 프롬프트 결과를 나란히 보며 작업합니다.",
      detail: "만들 이미지 종류와 실제 표시 문구를 고르는 영역입니다. 최종 문구를 그대로 입력해야 결과 검수가 쉽습니다.",
      detailSize: [655, 720],
      nodes: [["선택", "표지·간지·배경 등"], ["입력", "제목·기관명·날짜"], ["설계", "유형·스타일·보기"], ["결과", "양식 이미지 프롬프트"]]
    },
    "map-image": {
      name: "지도 이미지",
      overview: "지도 조건을 왼쪽에서 정하고 원본 보존 조건이 포함된 프롬프트를 오른쪽에서 확인합니다.",
      detail: "참조 지역과 강조 대상을 입력하는 시작 영역입니다. 지명·도로·경계 중 유지할 요소를 구체적으로 적으세요.",
      detailSize: [932, 720],
      nodes: [["자료", "원본 지도"], ["보존", "도로·경계·지명"], ["강조", "위치·경로·구역"], ["결과", "참조 지도+생성 지시문"]]
    },
    "promotion-image": {
      name: "홍보용 이미지",
      overview: "홍보 내용과 시각 방향을 입력하면서 오른쪽 완성 프롬프트를 실시간으로 확인합니다.",
      detail: "생성 엔진, 규격, 목적과 대상을 정하는 시작 영역입니다. 게시 매체에 맞는 비율을 먼저 선택하세요.",
      detailSize: [655, 720],
      nodes: [["기획", "목적·대상·매체"], ["문구", "제목·본문·CTA"], ["연출", "색상·화풍·배치"], ["결과", "외부 AI용 프롬프트"]]
    },
    "qr-code": {
      name: "QR코드 생성기",
      overview: "왼쪽에서 담을 정보와 디자인을 정하고 오른쪽에서 실제 QR과 출력 기능을 확인합니다.",
      detail: "URL·Wi-Fi·연락처 등 QR에 넣을 데이터 입력부입니다. 디자인보다 연결 정보의 정확성을 먼저 확인하세요.",
      detailSize: [796, 716],
      nodes: [["입력", "URL·Wi-Fi·연락처"], ["디자인", "색상·패턴·여백"], ["검증", "휴대폰 스캔"], ["출력", "PNG·SVG·라벨"]]
    },
    "data-diagram": {
      name: "데이터 다이어그램",
      overview: "원본 데이터와 시각 전략을 입력하고 오른쪽에서 구조화된 예상 결과를 확인합니다.",
      detail: "목적과 원본 데이터를 넣는 첫 영역입니다. 수치, 단위, 항목 관계를 원문 그대로 입력하세요.",
      detailSize: [749, 720],
      nodes: [["원본", "수치·항목·관계"], ["구조", "흐름·비교·계층"], ["검토", "단위·합계·방향"], ["출력", "SVG·PNG·JSON"]]
    },
    "label-ticket": {
      name: "라벨·티켓 제작",
      overview: "샘플 프로젝트를 연 실제 편집 화면으로, 작업 단계와 캔버스·속성 패널을 함께 보여줍니다.",
      detail: "라벨·티켓 캔버스와 페이지 설정 영역입니다. 시험 출력 전에 용지 규격과 앞뒤 방향을 확인하세요.",
      detailSize: [1119, 678],
      nodes: [["준비", "용지·명단·연번"], ["편집", "문구·이미지·QR 배치"], ["검토", "페이지·양면·배율"], ["출력", "프로젝트·PNG·PDF"]]
    },
    "concept-suggest": {
      name: "컨셉 제안",
      overview: "검색·범주·테마·엔진 필터 아래에서 여러 스타일 카드를 한 번에 비교합니다.",
      detail: "실제 컨셉 카드 비교 영역입니다. 설명과 팔레트, 생성 엔진별 프롬프트를 함께 보고 후보를 좁히세요.",
      detailSize: [1389, 720],
      nodes: [["질문", "주제·분위기 키워드"], ["탐색", "범주·테마·엔진"], ["선택", "스타일 카드 비교"], ["결과", "선택 컨셉 프롬프트"]]
    },
    "visual-mixer": {
      name: "비주얼 믹서",
      overview: "왼쪽에서 시각 요소를 조합하고 오른쪽에서 참고 이미지와 완성 프롬프트를 확인합니다.",
      detail: "주제·매체·스타일·색상·구도를 조합하는 선택 영역입니다. 각 항목을 하나씩 고르면 방향이 선명해집니다.",
      detailSize: [927, 720],
      nodes: [["주제", "대상·장면"], ["스타일", "매체·화풍·색상"], ["구성", "구도·타이포그래피"], ["결과", "조합형 이미지 프롬프트"]]
    },
    "photo-transform": {
      name: "사진 변환 프롬프터",
      overview: "왼쪽에서 원본 보존 조건을 정하고 오른쪽에서 스타일 갤러리와 결과 프롬프트를 선택합니다.",
      detail: "인물 수, 결과 구성, 보존 우선순위와 변환 강도를 설정하는 영역입니다. 정체성 보존 항목을 먼저 고르세요.",
      detailSize: [404, 720],
      nodes: [["원본", "사용 권한 있는 사진"], ["보존", "인물·표정·구도"], ["변환", "스타일·비율·강도"], ["결과", "사진+외부 AI 지시문"]]
    }
  };

  var guide = guides[slug];
  var content = document.querySelector(".guide-content");
  var steps = document.getElementById("steps");
  if (!guide || !content || !steps) {
    if (/^\/guides\/tools\/(?:index\.html)?$/u.test(location.pathname)) enhanceToolHub();
    return;
  }

  function create(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function enhanceToolHub() {
    document.querySelectorAll('a.guide-card[href^="/guides/tools/"]').forEach(function (card) {
      var href = card.getAttribute("href") || "";
      var cardSlug = href.replace(/\/+$/u, "").split("/").pop();
      var cardGuide = guides[cardSlug];
      if (!cardGuide || card.querySelector(".tool-guide-card-thumb")) return;
      var media = create("span", "tool-guide-card-thumb");
      var image = create("img");
      image.src = `/assets/guides/tools/${cardSlug}-overview.jpg`;
      image.alt = `${cardGuide.name} 실제 화면 미리보기`;
      image.loading = "lazy";
      image.decoding = "async";
      image.width = 1440;
      image.height = 900;
      media.append(image, create("span", "", "실제 화면 미리보기"));
      card.insertBefore(media, card.firstChild);
    });
  }

  function installLightbox() {
    if (typeof HTMLDialogElement === "undefined") return;
    var dialog = create("dialog", "tool-screen-dialog");
    dialog.setAttribute("aria-labelledby", "toolScreenDialogTitle");
    var panel = create("div", "tool-screen-dialog-panel");
    var head = create("header", "tool-screen-dialog-head");
    var title = create("strong");
    title.id = "toolScreenDialogTitle";
    var close = create("button", "", "닫기");
    close.type = "button";
    close.setAttribute("aria-label", "확대 화면 닫기");
    var image = create("img");
    var caption = create("p");
    head.append(title, close);
    panel.append(head, image, caption);
    dialog.appendChild(panel);
    document.body.appendChild(dialog);
    var lastTrigger = null;

    content.addEventListener("click", function (event) {
      var link = event.target.closest(".tool-screen-image-link");
      if (!link) return;
      event.preventDefault();
      var source = link.querySelector("img");
      var figureCaption = link.closest("figure")?.querySelector("figcaption span")?.textContent || "";
      if (!source) return;
      lastTrigger = link;
      image.src = source.src;
      image.alt = source.alt;
      title.textContent = source.alt;
      caption.textContent = figureCaption;
      dialog.showModal();
      close.focus();
    });
    close.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", function () {
      image.removeAttribute("src");
      lastTrigger?.focus();
    });
  }

  function screenFigure(kind, caption, width, height) {
    var figure = create("figure", `tool-screen-figure tool-screen-${kind}`);
    var link = create("a", "tool-screen-image-link");
    var src = `/assets/guides/tools/${slug}-${kind}.jpg`;
    link.href = src;
    link.target = "_blank";
    link.rel = "noopener";
    link.dataset.toolScreen = kind;
    link.setAttribute("aria-label", `${guide.name} ${kind === "overview" ? "전체 화면" : "세부 화면"} 원본 크기로 보기`);
    var img = create("img");
    img.src = src;
    img.alt = `${guide.name} 실제 ${kind === "overview" ? "전체 작업 화면" : "핵심 조작부 확대 화면"}`;
    img.loading = "lazy";
    img.decoding = "async";
    img.width = width;
    img.height = height;
    link.appendChild(img);
    var figcaption = create("figcaption");
    figcaption.appendChild(create("strong", "", kind === "overview" ? "전체 화면" : "세부 화면"));
    figcaption.appendChild(create("span", "", caption));
    figure.append(link, figcaption);
    return figure;
  }

  var visualSection = create("section", "tool-guide-visuals");
  visualSection.setAttribute("aria-labelledby", "screen");
  var screenHeading = create("h2", "", "실제 화면에서 보는 위치");
  screenHeading.id = "screen";
  var screenIntro = create("p", "tool-screen-intro", "화면 이미지를 선택하면 원본 크기로 열어 버튼과 입력 항목을 자세히 볼 수 있습니다.");
  var detailWidth = guide.detailSize[0];
  var detailHeight = guide.detailSize[1];
  var screenGrid = create("div", "tool-screen-grid");
  screenGrid.append(
    screenFigure("overview", guide.overview, 1440, 900),
    screenFigure("detail", guide.detail, detailWidth, detailHeight)
  );
  visualSection.append(screenHeading, screenIntro, screenGrid);

  var diagramSection = create("section", "tool-concept-section");
  diagramSection.setAttribute("aria-labelledby", "concept");
  var diagramHeading = create("h2", "", "작업 흐름 한눈에 보기");
  diagramHeading.id = "concept";
  var diagram = create("figure", "tool-concept-diagram");
  var flow = create("div", "tool-concept-flow");
  guide.nodes.forEach(function (item, index) {
    var node = create("div", "tool-concept-node");
    node.append(create("span", "", String(index + 1).padStart(2, "0")), create("strong", "", item[0]), create("small", "", item[1]));
    flow.appendChild(node);
    if (index < guide.nodes.length - 1) flow.appendChild(create("i", "", "→"));
  });
  diagram.appendChild(flow);
  var diagramCaption = create("figcaption", "", `${guide.name}은 입력을 먼저 확정하고, 중간 검토를 거쳐 재사용 가능한 결과로 내보내는 흐름입니다.`);
  diagram.appendChild(diagramCaption);
  diagramSection.append(diagramHeading, diagram);

  content.insertBefore(visualSection, steps);
  content.insertBefore(diagramSection, steps);

  var toc = document.querySelector(".guide-toc");
  var stepLink = toc && toc.querySelector('a[href="#steps"]');
  if (toc && stepLink) {
    var screenLink = create("a", "", "실제 화면");
    screenLink.href = "#screen";
    var conceptLink = create("a", "", "작업 흐름");
    conceptLink.href = "#concept";
    toc.insertBefore(screenLink, stepLink);
    toc.insertBefore(conceptLink, stepLink);
  }
  installLightbox();
})();
