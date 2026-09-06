// 공개 페이지 상단 내비게이션: 기능 드롭다운 + 모바일 토글.
// 정적 마크업의 .public-nav-links 를 JS로 표준화한다. 스크립트가 없으면 기존 링크가 그대로 노출된다.
(function () {
  "use strict";

  var nav = document.querySelector(".public-nav");
  if (!nav) return;
  var linksWrap = nav.querySelector(".public-nav-links");
  if (!linksWrap || linksWrap.dataset.enhanced === "true") return;

  var currentPath = location.pathname.replace(/index\.html$/, "").replace(/\/+$/, "/") || "/";

  var existingCta = linksWrap.querySelector(".public-nav-cta");
  var ctaHref = existingCta ? existingCta.getAttribute("href") : "/app";
  var ctaLabel = (existingCta && existingCta.textContent.trim()) || "작업 도구 열기";

  var FEATURE_GROUPS = [
    {
      label: "슬라이드",
      href: "/features#tools-deck",
      desc: "공통 디자인·장별 프롬프트",
      items: [
        ["공통 프롬프트", "/features#tool-commonPrompt"],
        ["슬라이드 분리기", "/features#tool-generator"]
      ]
    },
    {
      label: "업무 이미지",
      href: "/features#tools-special",
      desc: "보고·행사·안내·홍보 자료",
      items: [
        ["양식 이미지", "/features#tool-formImage"],
        ["지도 이미지", "/features#tool-mapPrompt"],
        ["홍보용 이미지", "/features#tool-promotion"],
        ["QR코드 생성기", "/features#tool-qrGenerator"],
        ["데이터 다이어그램", "/features#tool-dataDiagram"],
        ["라벨·티켓 제작", "/features#tool-labelSheet"]
      ]
    },
    {
      label: "일반 이미지",
      href: "/features#tools-visual",
      desc: "컨셉 탐색·시각 요소 조합",
      items: [
        ["컨셉 제안", "/features#tool-promotionPlanner"],
        ["비주얼 믹서", "/features#tool-conceptMixer"],
        ["사진 변환 프롬프터", "/features#tool-photoTransform"]
      ]
    }
  ];

  var TOP_LINKS = [
    { label: "기능", href: "/features", dropdown: true, match: /^\/features/ },
    { label: "실무 가이드", href: "/guides/", match: /^\/guides\//, notMatch: /ppt-slide-planner-skill/ },
    { label: "스킬 다운로드", href: "/guides/ppt-slide-planner-skill", match: /ppt-slide-planner-skill/ },
    { label: "소개", href: "/about", match: /^\/about/ }
  ];

  function isCurrent(link) {
    if (link.notMatch && link.notMatch.test(currentPath)) return false;
    return link.match ? link.match.test(currentPath) : false;
  }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === "text") node.textContent = props[k];
      else node.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  var frag = document.createDocumentFragment();
  var dropdownButton = null;
  var dropdownPanel = null;

  TOP_LINKS.forEach(function (link) {
    if (link.dropdown) {
      var wrap = el("div", { "class": "public-nav-dd" });

      dropdownButton = el("button", {
        type: "button",
        "class": "public-nav-dd-toggle",
        "aria-expanded": "false",
        "aria-controls": "publicFeatureLinks"
      });
      dropdownButton.textContent = link.label;
      if (isCurrent(link)) dropdownButton.setAttribute("aria-current", "page");

      dropdownPanel = el("div", { "class": "public-nav-panel", id: "publicFeatureLinks", hidden: "" });
      FEATURE_GROUPS.forEach(function (group) {
        var col = el("div", { "class": "public-nav-panel-col" });
        var head = el("a", { "class": "public-nav-panel-head", href: group.href });
        head.appendChild(el("strong", { text: group.label }));
        head.appendChild(el("span", { text: group.desc }));
        col.appendChild(head);
        var list = el("ul");
        group.items.forEach(function (item) {
          var li = el("li");
          li.appendChild(el("a", { href: item[1], text: item[0] }));
          list.appendChild(li);
        });
        col.appendChild(list);
        dropdownPanel.appendChild(col);
      });

      wrap.appendChild(dropdownButton);
      wrap.appendChild(dropdownPanel);
      frag.appendChild(wrap);
    } else {
      var a = el("a", { href: link.href, text: link.label });
      if (isCurrent(link)) a.setAttribute("aria-current", "page");
      frag.appendChild(a);
    }
  });

  var cta = el("a", { "class": "public-nav-cta", href: ctaHref, text: ctaLabel });
  frag.appendChild(cta);

  var toggle = el("button", {
    type: "button",
    "class": "public-nav-toggle",
    "aria-expanded": "false",
    "aria-controls": "publicNavLinks",
    "aria-label": "메뉴 열기"
  });
  toggle.innerHTML = "<span></span><span></span><span></span>";

  linksWrap.innerHTML = "";
  linksWrap.id = "publicNavLinks";
  linksWrap.dataset.enhanced = "true";
  linksWrap.appendChild(frag);
  nav.insertBefore(toggle, linksWrap);
  nav.insertBefore(cta.cloneNode(true), toggle);

  var DESKTOP = "(min-width: 821px)";

  function isDesktop() {
    return window.matchMedia(DESKTOP).matches;
  }

  function closeDropdown() {
    if (!dropdownButton) return;
    dropdownButton.setAttribute("aria-expanded", "false");
    dropdownPanel.hidden = true;
  }

  function openDropdown() {
    if (!dropdownButton) return;
    dropdownButton.setAttribute("aria-expanded", "true");
    dropdownPanel.hidden = false;
  }

  function closeMobile() {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "메뉴 열기");
    linksWrap.removeAttribute("data-open");
    closeDropdown();
  }

  function openMobile() {
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "메뉴 닫기");
    linksWrap.setAttribute("data-open", "");
  }

  if (dropdownButton) {
    dropdownButton.addEventListener("click", function (event) {
      event.preventDefault();
      var expanded = dropdownButton.getAttribute("aria-expanded") === "true";
      if (expanded) closeDropdown();
      else openDropdown();
    });
  }

  toggle.addEventListener("click", function () {
    var expanded = toggle.getAttribute("aria-expanded") === "true";
    if (expanded) closeMobile();
    else openMobile();
  });

  document.addEventListener("click", function (event) {
    if (!nav.contains(event.target)) {
      closeDropdown();
      if (!isDesktop()) closeMobile();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    var focusInDropdown = dropdownPanel && dropdownPanel.contains(document.activeElement);
    closeDropdown();
    if (isDesktop() && focusInDropdown) dropdownButton.focus();
    if (!isDesktop()) {
      closeMobile();
      toggle.focus();
    }
  });

  window.matchMedia(DESKTOP).addEventListener("change", function (event) {
    closeMobile();
  });

  // 기능 페이지 진입 시 해시가 가리키는 도구 카드를 펼친다.
  function openTargetDetails() {
    if (!location.hash) return;
    var target;
    try {
      target = document.querySelector(location.hash);
    } catch (error) {
      return;
    }
    if (!target) return;
    var host = target.closest ? target.closest("details") : null;
    if (host) host.open = true;
    else if (target.tagName === "DETAILS") target.open = true;
  }

  openTargetDetails();
  window.addEventListener("hashchange", openTargetDetails);

  if (/^\/guides\/tools\/[^/]+\/?$/u.test(location.pathname) && document.querySelector(".tool-guide-path")) {
    var visualScript = document.createElement("script");
    visualScript.src = "/src/tool-guide-visuals.js";
    visualScript.defer = true;
    document.body.appendChild(visualScript);
  }
})();
