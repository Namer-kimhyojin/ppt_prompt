// 라벨·티켓의 기존 기능 노드를 캔버스 중심 V2 워크스페이스로 재배치합니다.
(function () {
  "use strict";

  const pane = document.getElementById("paneLabelSheet");
  const shell = pane?.querySelector(".label-sheet-shell");
  if (!pane || !shell || pane.dataset.labelWorkspaceLayoutReady === "true") return;

  const $ = (id) => document.getElementById(id);
  const node = (tag, className = "", text = "") => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const button = (label, className = "btn ghost label-sheet-compact-btn") => {
    const element = node("button", className, label);
    element.type = "button";
    return element;
  };
  const ICON_PATHS = {
    app: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    undo: '<path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/>',
    redo: '<path d="m15 7 5 5-5 5"/><path d="M19 12h-8a6 6 0 0 0-6 6"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    review: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 14l2 2 4-4"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    project: '<path d="M4 5h6l2 2h8v12H4z"/>',
    data: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="black" stroke="none"/><circle cx="4.5" cy="12" r="1" fill="black" stroke="none"/><circle cx="4.5" cy="18" r="1" fill="black" stroke="none"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m4 17 5-5 4 4 2-2 5 5"/>',
    properties: '<path d="M4 6h7M15 6h5M4 12h3M11 12h9M4 18h9M17 18h3"/><circle cx="13" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="18" r="2"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    left: '<path d="m14 6-6 6 6 6"/>',
    right: '<path d="m10 6 6 6-6 6"/>',
    up: '<path d="m6 14 6-6 6 6"/>',
    down: '<path d="m6 10 6 6 6-6"/>',
    alignLeft: '<path d="M4 6h14M4 10h10M4 14h14M4 18h8"/>',
    alignCenter: '<path d="M5 6h14M7 10h10M5 14h14M8 18h8"/>',
    alignRight: '<path d="M6 6h14M10 10h10M6 14h14M12 18h8"/>',
    sample: '<path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>',
    prompt: '<path d="M4 5h11v11H8l-4 4z"/><path d="m18 4 .7 2.3L21 7l-2.3.7L18 10l-.7-2.3L15 7l2.3-.7z"/>',
    qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 14h2v2h-2zM18 14h2v5h-3M13 18h2v2h-2z"/>',
    text: '<path d="M5 5h14M12 5v14M8 19h8"/>',
    copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/>',
    download: '<path d="M12 3v12m0 0 5-5m-5 5-5-5M4 20h16"/>',
    pdf: '<path d="M6 3h8l4 4v14H6zM14 3v5h4"/><path d="M8.5 16h1.3a2 2 0 0 0 0-4H8.5v6M13 12v6M13 12h3"/>',
    print: '<path d="M7 9V3h10v6M7 17H4V10h16v7h-3M7 14h10v7H7z"/><circle cx="17" cy="12" r=".8" fill="black" stroke="none"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M18 12a6 6 0 0 0-10-4L5 11M6 12a6 6 0 0 0 10 4l3-3"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    bookmark: '<path d="M7 4h10v17l-5-3-5 3z"/>',
    package: '<path d="m4 7 8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H12a1.5 1.5 0 0 1 0-3h3a6 6 0 0 0 0-12z"/><circle cx="7" cy="10" r="1" fill="black" stroke="none"/><circle cx="9" cy="6" r="1" fill="black" stroke="none"/><circle cx="14" cy="6" r="1" fill="black" stroke="none"/>',
    upload: '<path d="M12 21V9m0 0-5 5m5-5 5 5M5 4h14"/>',
  };
  const iconize = (control, iconName, options = {}) => {
    if (!control || !ICON_PATHS[iconName]) return control;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[iconName]}</svg>`;
    control.dataset.labelIcon = iconName;
    control.style.setProperty("--label-sheet-button-icon", `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
    if (options.iconOnly) {
      const accessibleLabel = options.label || control.getAttribute("aria-label") || control.textContent.trim();
      control.replaceChildren();
      control.classList.add("label-sheet-icon-only");
      if (accessibleLabel) {
        control.setAttribute("aria-label", accessibleLabel);
        if (!control.title) control.title = accessibleLabel;
      }
    }
    return control;
  };
  const iconButton = (label, iconName, className = "btn ghost label-sheet-compact-btn", options = {}) => iconize(button(label, className), iconName, { label, ...options });
  const append = (parent, ...children) => {
    children.filter(Boolean).forEach((child) => parent.append(child));
    return parent;
  };
  const heading = (eyebrow, title, description = "") => {
    const wrapper = node("div", "label-sheet-workspace-section-heading");
    append(wrapper, node("span", "label-sheet-workspace-eyebrow", eyebrow), node("strong", "", title));
    if (description) wrapper.append(node("small", "", description));
    return wrapper;
  };
  const proxyClick = (control, targetId) => {
    control.addEventListener("click", () => {
      const target = $(targetId);
      if (target && !target.disabled) target.click();
    });
    return control;
  };
  const createMenu = (label, name, items) => {
    const wrapper = node("div", "label-sheet-workspace-menu");
    const trigger = button(label, "label-sheet-workspace-menu-trigger");
    const menu = node("div", "label-sheet-workspace-menu-popup");
    wrapper.setAttribute("role", "none");
    trigger.dataset.labelWorkspaceMenuTrigger = name;
    trigger.setAttribute("role", "menuitem");
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    menu.dataset.labelWorkspaceMenu = name;
    menu.id = `labelSheetWorkspace${name[0].toUpperCase()}${name.slice(1)}Menu`;
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", `${label} 메뉴`);
    menu.hidden = true;
    trigger.setAttribute("aria-controls", menu.id);
    items.forEach((definition) => {
      if (definition.separator) {
        const separator = node("div", "label-sheet-workspace-menu-separator");
        separator.setAttribute("role", "separator");
        menu.append(separator);
        return;
      }
      if (definition.section) {
        const section = node("div", "label-sheet-workspace-menu-section", definition.section);
        section.setAttribute("role", "presentation");
        menu.append(section);
        return;
      }
      const control = button("", "label-sheet-workspace-menu-item");
      control.setAttribute("role", definition.toggle ? "menuitemradio" : "menuitem");
      if (definition.toggle) control.setAttribute("aria-checked", "false");
      control.tabIndex = -1;
      if (definition.id) control.id = definition.id;
      if (definition.targetId) proxyClick(control, definition.targetId);
      Object.entries(definition.dataset || {}).forEach(([key, value]) => {
        control.dataset[key] = value;
      });
      const copy = node("span", "", definition.label);
      append(control, copy);
      if (definition.shortcut) control.append(node("kbd", "", definition.shortcut));
      menu.append(control);
    });
    append(wrapper, trigger, menu);
    return { wrapper, trigger, menu };
  };

  function buildWorkspace() {
    const hero = pane.querySelector(".label-sheet-hero");
    const intentPanel = $("labelSheetIntentPanel");
    const specStep = $("labelSheetSpecStep");
    const dataStep = $("labelSheetDataStep");
    const backgroundStep = $("labelSheetDesignBackgroundStep");
    const contentStep = $("labelSheetDesignContentStep");
    const resultCard = $("labelSheetResultCard");
    const focusEditor = $("labelSheetFocusEditor");
    const previewToolbar = $("labelSheetPreviewToolbar");
    const pageOverview = pane.querySelector(".label-sheet-page-overview-head");
    const pagePreview = $("labelSheetPagePreview");
    const preflightCard = resultCard?.querySelector(".label-sheet-preflight-card");
    const mappingPanel = $("labelSheetDataMappingPanel");
    const dnaDialog = $("labelSheetDnaDialog");
    const workspaceMode = $("labelSheetWorkspaceMode");
    const tabActions = $("tabActions");
    const focusHead = focusEditor?.querySelector(".label-sheet-focus-editor-head");
    const focusScope = focusEditor?.querySelector(".label-sheet-focus-scope");
    const focusNavigation = focusEditor?.querySelector(".label-sheet-focus-navigation-grid");
    const focusTooldeck = focusEditor?.querySelector(".label-sheet-focus-tooldeck");
    const focusToolTabs = focusTooldeck?.querySelector(".label-sheet-focus-tool-tabs");
    const focusTargets = focusTooldeck?.querySelector(".label-sheet-focus-targets");
    const focusShortcutActions = focusTooldeck?.querySelector(".label-sheet-focus-shortcut-actions");
    const focusShortcutHelp = $("labelSheetFocusShortcutHelp");
    const focusQuickPanel = $("labelSheetFocusQuickPanel");
    const focusCommonPanel = $("labelSheetFocusCommonPanel");
    const focusDetailPanel = $("labelSheetFocusDetailPanel");
    const focusStage = $("labelSheetFocusStage");
    const focusStatus = $("labelSheetFocusStatus");

    [
      ["labelSheetFocusPrev", "이전", "이전 티켓"],
      ["labelSheetFocusNext", "다음", "다음 티켓"],
      ["labelSheetFocusPagePrev", "이전", "이전 페이지"],
      ["labelSheetFocusPageNext", "다음", "다음 페이지"],
    ].forEach(([id, label, ariaLabel]) => {
      const control = $(id);
      if (!control) return;
      control.textContent = label;
      control.setAttribute("aria-label", ariaLabel);
    });

    if (!intentPanel || !specStep || !dataStep || !backgroundStep || !contentStep || !resultCard || !focusEditor || !focusStage || !pagePreview) {
      throw new Error("라벨·티켓 V2에 필요한 기존 편집 노드를 찾지 못했습니다.");
    }

    pane.classList.add("label-sheet-workspace-v2", "label-sheet-workspace-v3", "label-sheet-workspace-v4", "label-sheet-workspace-v6", "label-sheet-workspace-v7", "label-sheet-workspace-v9", "label-sheet-workspace-v10", "label-sheet-workspace-v11");
    pane.dataset.workspaceTool = "layers";
    pane.dataset.activeTool = "layers";
    pane.dataset.canvasView = pane.dataset.outputGoal === "prompt" ? "sheet" : "ticket";
    pane.dataset.bottomTab = "data";

    const topbar = node("header", "label-sheet-workspace-topbar");
    topbar.setAttribute("aria-label", "라벨 편집기 프로젝트와 명령");
    const brand = node("div", "label-sheet-workspace-brand");
    const mark = iconButton("앱", "app", "label-sheet-workspace-mark label-sheet-workspace-app-nav", { iconOnly: true });
    mark.id = "labelSheetWorkspaceAppNavBtn";
    mark.setAttribute("aria-label", "다른 PromptDeck 도구 열기");
    mark.setAttribute("aria-expanded", "false");
    const brandCopy = node("div", "label-sheet-workspace-brand-copy");
    append(brandCopy, node("span", "label-sheet-workspace-eyebrow", "LABEL & TICKET STUDIO"), node("h2", "", "라벨·티켓"));
    if (workspaceMode) brandCopy.append(workspaceMode);
    append(brand, mark, brandCopy);

    const topbarCenter = node("div", "label-sheet-workspace-topbar-center");
    const menuBar = node("nav", "label-sheet-workspace-menubar");
    menuBar.setAttribute("role", "menubar");
    menuBar.setAttribute("aria-label", "라벨 편집기 메뉴");
    const projectMenu = createMenu("프로젝트", "project", [
      { label: "새 작업·출력 틀 설정…", targetId: "labelSheetWorkspaceSettingsBtn", shortcut: "Alt+P" },
      { label: "샘플로 시작", targetId: "labelSheetIntentSampleBtn" },
      { label: "최근 자동 저장 복구…", id: "labelSheetWorkspaceRecoveryMenu", dataset: { labelWorkspaceRecoveryCommand: "open" } },
      { separator: true },
      { label: "프로젝트 ZIP 저장", targetId: "labelSheetSavePackageBtn" },
    ]);
    const dataMenu = createMenu("데이터", "data", [
      { label: "데이터 편집기 열기…", dataset: { labelWorkspaceBottomCommand: "data" }, shortcut: "Alt+D" },
      { label: "표 붙여넣기", dataset: { labelWorkspaceBottomCommand: "paste" } },
      { label: "CSV 가져오기", dataset: { labelWorkspaceBottomCommand: "csv" } },
      { separator: true },
      { label: "열 매핑", dataset: { labelWorkspaceBottomCommand: "mapping" } },
      { label: "검증 결과", dataset: { labelWorkspaceBottomCommand: "validation" } },
    ]);
    const editMenu = createMenu("레이아웃", "edit", [
      { section: "편집 기록" },
      { label: "실행 취소", id: "labelSheetWorkspaceUndoMenu", dataset: { labelWorkspaceHistoryCommand: "undo" }, shortcut: "Ctrl+Z" },
      { label: "다시 실행", id: "labelSheetWorkspaceRedoMenu", dataset: { labelWorkspaceHistoryCommand: "redo" }, shortcut: "Ctrl+Shift+Z" },
      { separator: true },
      { section: "빠른 선택 · 바로 전환" },
      { label: "전체 콘텐츠", dataset: { labelWorkspaceLayerCommand: "content" }, shortcut: "1", toggle: true },
      { label: "제목", dataset: { labelWorkspaceLayerCommand: "title" }, shortcut: "3", toggle: true },
      { label: "본문", dataset: { labelWorkspaceLayerCommand: "body" }, shortcut: "5", toggle: true },
      { label: "QR", dataset: { labelWorkspaceLayerCommand: "qr" }, shortcut: "7", toggle: true },
      { separator: true },
      { section: "설정 모달" },
      { label: "용지 방향 설정…", dataset: { labelWorkspaceOrientationCommand: "paper" } },
      { label: "문구 방향 설정…", dataset: { labelWorkspaceOrientationCommand: "text" } },
      { label: "배경·디자인 자산…", id: "labelSheetWorkspaceAssetsMenu", dataset: { labelWorkspaceDrawerCommand: "assets" } },
      { label: "면 공통 레이아웃…", targetId: "labelSheetWorkspaceCommonBtn" },
      { label: "선택 항목 배치·프리셋…", targetId: "labelSheetWorkspacePlacementBtn" },
      { label: "QR 코드 설정…", targetId: "labelSheetWorkspaceQrBtn" },
    ]);
    const viewMenu = createMenu("보기", "view", [
      { label: "개별 티켓 캔버스", dataset: { labelWorkspaceCanvasCommand: "ticket" } },
      { label: "A4 시트 캔버스", dataset: { labelWorkspaceCanvasCommand: "sheet" } },
      { label: "속성 패널 접기/펼치기", dataset: { labelWorkspaceToggleCommand: "right" } },
      { label: "단축키 보기", dataset: { labelWorkspaceToggleCommand: "shortcuts" }, shortcut: "?" },
    ]);
    append(menuBar, projectMenu.wrapper, dataMenu.wrapper, editMenu.wrapper, viewMenu.wrapper);
    const workModeSwitch = node("div", "label-sheet-workspace-work-mode");
    workModeSwitch.setAttribute("role", "group");
    workModeSwitch.setAttribute("aria-label", "작업 모드");
    const layoutModeButton = button("레이아웃 편집", "label-sheet-workspace-mode-button is-active");
    layoutModeButton.id = "labelSheetWorkspaceLayoutModeBtn";
    layoutModeButton.dataset.labelWorkspaceMode = "layout";
    layoutModeButton.setAttribute("aria-pressed", "true");
    const dataModeButton = button("데이터 편집", "label-sheet-workspace-mode-button");
    dataModeButton.id = "labelSheetWorkspaceDataModeBtn";
    dataModeButton.dataset.labelWorkspaceMode = "data";
    dataModeButton.dataset.labelWorkspaceBottomCommand = "data";
    dataModeButton.setAttribute("aria-pressed", "false");
    append(workModeSwitch, layoutModeButton, dataModeButton);
    const goalSwitch = node("div", "label-sheet-workspace-goal-switch");
    goalSwitch.setAttribute("role", "group");
    goalSwitch.setAttribute("aria-label", "제작 방식");
    [
      ["print", "직접 제작"],
      ["prompt", "AI 프롬프트"],
    ].forEach(([value, label]) => {
      const control = button(label, "label-sheet-workspace-segment");
      control.dataset.labelWorkspaceGoal = value;
      control.setAttribute("aria-pressed", "false");
      control.addEventListener("click", () => {
        const radio = pane.querySelector(`input[name="labelSheetOutputGoal"][value="${value}"]`);
        if (!radio || radio.checked) return;
        radio.checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));
      });
      goalSwitch.append(control);
    });
    const specSummary = button("규격 확인", "label-sheet-workspace-spec-summary");
    specSummary.id = "labelSheetWorkspaceSpecSummary";
    specSummary.title = "용지, 배치, 면 설정 열기";
    append(topbarCenter, menuBar, workModeSwitch, goalSwitch, specSummary);

    const topbarActions = node("div", "label-sheet-workspace-topbar-actions");
    const historyActions = node("div", "label-sheet-workspace-history-actions");
    historyActions.setAttribute("role", "group");
    historyActions.setAttribute("aria-label", "편집 기록");
    const undoButton = iconButton("실행 취소", "undo", "label-sheet-workspace-history-button", { iconOnly: true });
    undoButton.id = "labelSheetWorkspaceUndoBtn";
    undoButton.dataset.labelWorkspaceHistoryCommand = "undo";
    undoButton.title = "실행 취소 (Ctrl+Z)";
    undoButton.disabled = true;
    const redoButton = iconButton("다시 실행", "redo", "label-sheet-workspace-history-button", { iconOnly: true });
    redoButton.id = "labelSheetWorkspaceRedoBtn";
    redoButton.dataset.labelWorkspaceHistoryCommand = "redo";
    redoButton.title = "다시 실행 (Ctrl+Shift+Z)";
    redoButton.disabled = true;
    append(historyActions, undoButton, redoButton);
    const commandButton = iconButton("명령 찾기", "search", "label-sheet-workspace-command-button", { iconOnly: true });
    commandButton.id = "labelSheetWorkspaceCommandBtn";
    commandButton.title = "명령 찾기 (Ctrl+K)";
    const workspaceToolsButton = iconButton("프로젝트·데이터 메뉴", "menu", "label-sheet-workspace-tools-button", { iconOnly: true });
    workspaceToolsButton.id = "labelSheetWorkspaceToolsBtn";
    workspaceToolsButton.setAttribute("aria-label", "프로젝트·데이터 메뉴 열기");
    workspaceToolsButton.setAttribute("aria-controls", "labelSheetWorkspaceToolPanel");
    workspaceToolsButton.setAttribute("aria-expanded", "false");
    const settingsButton = iconButton("프로젝트 설정", "settings", undefined, { iconOnly: true });
    settingsButton.id = "labelSheetWorkspaceSettingsBtn";
    settingsButton.title = "프로젝트 설정";
    settingsButton.dataset.labelWorkspaceDrawer = "settings";
    const inspectorRevealButton = iconButton("속성 열기", "properties", "label-sheet-workspace-inspector-reveal");
    inspectorRevealButton.id = "labelSheetWorkspaceInspectorRevealBtn";
    inspectorRevealButton.hidden = true;
    inspectorRevealButton.setAttribute("aria-controls", "labelSheetWorkspaceInspector");
    inspectorRevealButton.setAttribute("aria-expanded", "false");
    const reviewButton = iconButton("검토·내보내기", "review", "btn primary label-sheet-compact-btn");
    reviewButton.id = "labelSheetWorkspaceReviewBtn";
    reviewButton.dataset.labelWorkspaceDrawer = "review";
    const actionHost = node("div", "label-sheet-workspace-actions");
    if (tabActions) actionHost.append(tabActions);
    append(topbarActions, workspaceToolsButton, historyActions, commandButton, actionHost, settingsButton, inspectorRevealButton, reviewButton);
    append(topbar, brand, topbarCenter, topbarActions);

    const flowBar = node("nav", "label-sheet-workspace-flowbar");
    flowBar.setAttribute("aria-label", "라벨 제작 5단계");
    flowBar.dataset.labelWorkspaceRegion = "workflow";
    const flowList = node("ol", "label-sheet-workspace-flow-list");
    const flowDefinitions = [
      ["intent", "1", "목표", "결과물 선택"],
      ["spec", "2", "규격", "용지·크기"],
      ["data", "3", "데이터", "가져오기·매핑"],
      ["design", "4", "디자인", "화면 편집"],
      ["output", "5", "출력", "검토·저장"],
    ];
    flowDefinitions.forEach(([value, number, label, description], index) => {
      const item = node("li", "label-sheet-workspace-flow-item");
      const control = button("", "label-sheet-workspace-flow-step");
      control.dataset.labelWorkspaceFlowStep = value;
      control.dataset.state = index === 0 ? "current" : "incomplete";
      control.dataset.readiness = index === 0 ? "complete" : "incomplete";
      control.setAttribute("aria-current", index === 0 ? "step" : "false");
      control.setAttribute("aria-label", `${number}단계 ${label} · ${description}`);
      append(
        control,
        node("span", "label-sheet-workspace-flow-number", number),
        node("strong", "", label),
        node("small", "", description)
      );
      item.append(control);
      flowList.append(item);
    });
    const flowCurrent = node("output", "label-sheet-workspace-flow-current", "1단계 · 목표를 정하세요");
    flowCurrent.id = "labelSheetWorkspaceFlowCurrent";
    flowCurrent.setAttribute("aria-live", "polite");
    append(flowBar, flowList, flowCurrent);

    const frame = node("div", "label-sheet-workspace-frame");
    const left = node("aside", "label-sheet-workspace-left");
    left.dataset.labelWorkspaceRegion = "left";
    left.setAttribute("aria-label", "라벨 작업 도구");
    const toolrail = node("nav", "label-sheet-workspace-toolrail");
    toolrail.setAttribute("aria-label", "작업 도구 선택");
    const toolDefinitions = [
      ["project", "프로젝트", "설정과 시작", "project"],
      ["records", "데이터", "티켓 목록", "list"],
      ["layers", "항목", "출력 항목", "layers"],
      ["assets", "배경", "배경 이미지", "image"],
    ];
    toolDefinitions.forEach(([value, label, title, icon], index) => {
      const control = button("", "label-sheet-workspace-tool");
      control.dataset.labelWorkspaceTool = value;
      control.title = title;
      control.setAttribute("aria-label", label);
      control.classList.toggle("is-active", index === 2);
      control.setAttribute("aria-selected", String(index === 2));
      const iconElement = iconize(node("span", "label-sheet-workspace-tool-icon"), icon);
      iconElement.setAttribute("aria-hidden", "true");
      append(control, iconElement, node("span", "label-sheet-workspace-tool-label", label));
      toolrail.append(control);
    });
    const leftToggle = button("도크 접기", "label-sheet-workspace-left-toggle");
    leftToggle.id = "labelSheetWorkspaceLeftToggle";
    leftToggle.setAttribute("aria-label", "왼쪽 도크 접기 또는 펼치기");
    leftToggle.setAttribute("aria-expanded", "true");
    toolrail.append(leftToggle);

    const panelHost = node("div", "label-sheet-workspace-panel-host");
    panelHost.id = "labelSheetWorkspaceToolPanel";
    panelHost.setAttribute("role", "dialog");
    panelHost.setAttribute("aria-modal", "true");
    panelHost.setAttribute("aria-labelledby", "labelSheetWorkspaceToolPanelTitle");
    const mobileToolHeader = node("div", "label-sheet-workspace-mobile-tool-header");
    const mobileToolTop = node("div", "label-sheet-workspace-mobile-tool-top");
    const mobileToolTitle = node("strong", "", "작업 도구");
    mobileToolTitle.id = "labelSheetWorkspaceToolPanelTitle";
    const mobileToolClose = iconButton("캔버스로 돌아가기", "close", "label-sheet-workspace-mobile-tool-close", { iconOnly: true });
    mobileToolClose.id = "labelSheetWorkspaceToolPanelClose";
    mobileToolClose.setAttribute("aria-label", "작업 도구 패널 닫기");
    append(mobileToolTop, mobileToolTitle, mobileToolClose);
    const mobileToolTabs = node("div", "label-sheet-workspace-mobile-tool-tabs");
    mobileToolTabs.setAttribute("role", "tablist");
    mobileToolTabs.setAttribute("aria-label", "작업 도구 선택");
    toolDefinitions.forEach(([value, label], index) => {
      const control = button(label, "label-sheet-workspace-mobile-tool-tab");
      control.dataset.labelWorkspaceMobileTool = value;
      control.setAttribute("role", "tab");
      control.setAttribute("aria-selected", String(index === 2));
      control.tabIndex = index === 2 ? 0 : -1;
      mobileToolTabs.append(control);
    });
    append(mobileToolHeader, mobileToolTop, mobileToolTabs);
    const entry = node("section", "label-sheet-workspace-entry");
    entry.id = "labelSheetWorkspaceEntry";
    entry.hidden = true;
    entry.setAttribute("aria-labelledby", "labelSheetWorkspaceEntryTitle");
    const projectPanel = node("section", "label-sheet-workspace-panel label-sheet-workspace-entry-panel is-active");
    projectPanel.dataset.labelWorkspacePanel = "project";
    const entryHeading = heading("새 라벨 프로젝트", "어떤 라벨을 완성할까요?", "목표와 출력 틀을 정한 뒤 데이터를 연결하면 편집 작업대로 이어집니다.");
    entryHeading.querySelector("strong").id = "labelSheetWorkspaceEntryTitle";
    projectPanel.append(entryHeading);
    const projectSummary = node("div", "label-sheet-workspace-project-summary");
    projectSummary.id = "labelSheetWorkspaceProjectSummary";
    append(projectSummary, node("strong", "", workspaceMode?.textContent || "새 라벨 프로젝트"), node("span", "", "설정한 규격과 입력 데이터는 자동 저장되어 다음 방문에도 이어집니다."));
    const startActions = node("div", "label-sheet-workspace-start-actions");
    const setupStartButton = proxyClick(iconButton("목표와 출력 틀 정하기", "settings", "btn primary"), "labelSheetWorkspaceSettingsBtn");
    setupStartButton.id = "labelSheetWorkspaceSetupStartBtn";
    const dataButton = iconButton("데이터부터 가져오기", "data", "btn secondary");
    dataButton.id = "labelSheetWorkspaceDataBtn";
    dataButton.dataset.labelWorkspaceBottomCommand = "data";
    const sampleButton = proxyClick(iconButton("샘플 프로젝트 열기", "sample", "btn ghost"), "labelSheetIntentSampleBtn");
    sampleButton.id = "labelSheetWorkspaceSampleBtn";
    append(startActions, setupStartButton, dataButton, sampleButton);
    const projectTips = node("div", "label-sheet-workspace-tip-list");
    [
      "권장 순서: 목표 → 규격 → 데이터 → 디자인 → 출력",
      "완료한 작업은 자동 저장되며, 세부 설정은 필요할 때만 열립니다.",
    ].forEach((copy) => projectTips.append(node("p", "", copy)));
    append(projectPanel, projectSummary, startActions, projectTips);
    entry.append(projectPanel);

    const mobileProjectPanel = projectPanel.cloneNode(true);
    const mobileEntryTitle = mobileProjectPanel.querySelector("#labelSheetWorkspaceEntryTitle");
    const mobileProjectSummary = mobileProjectPanel.querySelector("#labelSheetWorkspaceProjectSummary");
    const mobileSetupStartButton = mobileProjectPanel.querySelector("#labelSheetWorkspaceSetupStartBtn");
    const mobileDataButton = mobileProjectPanel.querySelector("#labelSheetWorkspaceDataBtn");
    const mobileSampleButton = mobileProjectPanel.querySelector("#labelSheetWorkspaceSampleBtn");
    mobileEntryTitle?.removeAttribute("id");
    if (mobileProjectSummary) mobileProjectSummary.id = "labelSheetWorkspaceProjectSummaryMobile";
    if (mobileSetupStartButton) {
      mobileSetupStartButton.id = "labelSheetWorkspaceSetupStartBtnMobile";
      proxyClick(mobileSetupStartButton, "labelSheetWorkspaceSettingsBtn");
    }
    if (mobileDataButton) mobileDataButton.id = "labelSheetWorkspaceDataBtnMobile";
    if (mobileSampleButton) {
      mobileSampleButton.id = "labelSheetWorkspaceSampleBtnMobile";
      proxyClick(mobileSampleButton, "labelSheetIntentSampleBtn");
    }

    const recordsPanel = node("section", "label-sheet-workspace-panel is-active");
    recordsPanel.dataset.labelWorkspacePanel = "records";
    const recordHeading = heading("현재 데이터", "레코드", "티켓을 선택하면 캔버스의 편집 대상이 함께 바뀝니다.");
    const recordList = node("div", "label-sheet-workspace-record-list");
    recordList.id = "labelSheetWorkspaceRecordList";
    recordList.setAttribute("role", "listbox");
    recordList.setAttribute("aria-label", "티켓 레코드 목록");
    append(recordsPanel, recordHeading, recordList);

    const layersPanel = node("section", "label-sheet-workspace-panel");
    layersPanel.dataset.labelWorkspacePanel = "layers";
    append(layersPanel, heading("선택 티켓", "레이어", "편집할 출력 항목을 선택하세요."));
    const layerList = node("div", "label-sheet-workspace-layer-list");
    [
      ["content", "전체 콘텐츠", "1"],
      ["number", "연번", "2"],
      ["title", "제목", "3"],
      ["subtitle", "부제", "4"],
      ["body", "본문", "5"],
      ["footer", "하단 문구", "6"],
      ["qr", "QR", "7"],
    ].forEach(([target, label, shortcut]) => {
      const control = button("", "label-sheet-workspace-layer");
      control.dataset.labelWorkspaceLayer = target;
      const key = node("kbd", "", shortcut);
      append(control, key, node("span", "", label));
      control.addEventListener("click", () => pane.querySelector(`[data-label-sheet-focus-target="${target}"]`)?.click());
      layerList.append(control);
    });
    append(layersPanel, layerList);

    const assetsPanel = node("section", "label-sheet-workspace-panel label-sheet-workspace-assets-panel is-active");
    assetsPanel.dataset.labelWorkspacePanel = "assets";
    append(assetsPanel, heading("디자인 자산", "배경·DNA", "배경을 등록하거나 이미지 프롬프트의 시각 규칙을 선택합니다."));
    backgroundStep.open = true;
    assetsPanel.append(backgroundStep);
    append(panelHost, mobileToolHeader, mobileProjectPanel, recordsPanel, layersPanel, assetsPanel);
    append(left, toolrail, panelHost);

    const leftResizer = node("div", "label-sheet-workspace-resizer");
    leftResizer.dataset.labelWorkspaceResizer = "left";
    leftResizer.setAttribute("role", "separator");
    leftResizer.setAttribute("aria-label", "왼쪽 도크 너비 조절");
    leftResizer.tabIndex = 0;

    const stage = node("main", "label-sheet-workspace-stage");
    const canvasHeader = node("div", "label-sheet-workspace-canvas-header");
    canvasHeader.setAttribute("aria-label", "캔버스 보기와 속성");
    const canvasLabel = node("strong", "label-sheet-workspace-canvas-label", "캔버스");
    const canvasViews = node("div", "label-sheet-workspace-canvas-switch");
    canvasViews.setAttribute("role", "group");
    canvasViews.setAttribute("aria-label", "캔버스 보기 방식");
    [["ticket", "개별 티켓"], ["sheet", "A4 시트"]].forEach(([value, label], index) => {
      const control = button(label, "label-sheet-workspace-segment");
      control.dataset.labelCanvasView = value;
      control.classList.toggle("is-active", index === 0);
      control.setAttribute("aria-pressed", String(index === 0));
      canvasViews.append(control);
    });
    const canvasMeta = node("div", "label-sheet-workspace-canvas-meta");
    append(canvasMeta, node("span", "", "선택 항목 이동·정렬·크기 조정"), node("output", "", "개별 티켓"));
    canvasMeta.lastElementChild.dataset.labelWorkspaceStatus = "canvas";
    const inspectorButton = iconButton("속성", "properties", "label-sheet-workspace-mobile-inspector-toggle");
    inspectorButton.id = "labelSheetWorkspaceInspectorBtn";
    inspectorButton.setAttribute("aria-controls", "labelSheetWorkspaceInspector");
    inspectorButton.setAttribute("aria-expanded", "false");
    append(canvasHeader, canvasLabel, canvasViews, canvasMeta, inspectorButton);

    const canvasColumn = node("div", "label-sheet-workspace-canvas-column");
    const contextToolbar = node("section", "label-sheet-workspace-context-toolbar");
    contextToolbar.setAttribute("aria-label", "선택 항목 빠른 도구");
    const contextToolbarHead = node("div", "label-sheet-workspace-context-heading");
    append(contextToolbarHead, node("strong", "", "빠른 편집"), node("span", "", "선택한 항목에 필요한 조정만 표시합니다."));
    const contextControls = node("div", "label-sheet-workspace-context-controls");
    const contextTargetPicker = node("details", "label-sheet-workspace-context-target-picker");
    contextTargetPicker.id = "labelSheetWorkspaceContextTargetPicker";
    const contextTargetSummary = node("summary", "label-sheet-workspace-context-target-summary");
    append(contextTargetSummary, node("span", "", "편집"));
    const contextTargetLabel = node("span", "", "제목");
    contextTargetLabel.id = "labelSheetWorkspaceContextTargetLabel";
    contextTargetSummary.append(contextTargetLabel);
    append(contextTargetPicker, contextTargetSummary, focusTargets);
    const contextActions = node("div", "label-sheet-workspace-context-actions");
    const contextSizeDown = proxyClick(iconButton("작게", "minus", "label-sheet-workspace-context-action", { iconOnly: true }), "labelSheetFocusSizeDown");
    contextSizeDown.id = "labelSheetWorkspaceContextSizeDown";
    contextSizeDown.dataset.labelWorkspaceContextSize = "";
    const contextSizeUp = proxyClick(iconButton("크게", "plus", "label-sheet-workspace-context-action", { iconOnly: true }), "labelSheetFocusSizeUp");
    contextSizeUp.id = "labelSheetWorkspaceContextSizeUp";
    contextSizeUp.dataset.labelWorkspaceContextSize = "";
    const contextNudgeGroup = node("div", "label-sheet-workspace-context-group label-sheet-workspace-context-nudge-group", "");
    contextNudgeGroup.setAttribute("role", "group");
    contextNudgeGroup.setAttribute("aria-label", "선택 항목 미세 이동");
    [
      ["left", "left", "왼쪽으로 이동"],
      ["up", "up", "위로 이동"],
      ["down", "down", "아래로 이동"],
      ["right", "right", "오른쪽으로 이동"],
    ].forEach(([direction, icon, ariaLabel]) => {
      const control = iconButton(ariaLabel, icon, "label-sheet-workspace-context-icon-action", { iconOnly: true });
      control.dataset.labelWorkspaceContextNudge = direction;
      control.setAttribute("aria-label", ariaLabel);
      control.title = ariaLabel;
      contextNudgeGroup.append(control);
    });
    const contextAlignGroup = node("div", "label-sheet-workspace-context-group label-sheet-workspace-context-align-group", "");
    contextAlignGroup.dataset.labelWorkspaceContextText = "";
    contextAlignGroup.setAttribute("role", "group");
    contextAlignGroup.setAttribute("aria-label", "문구 정렬");
    [
      ["left", "alignLeft", "왼쪽 정렬"],
      ["center", "alignCenter", "가운데 정렬"],
      ["right", "alignRight", "오른쪽 정렬"],
    ].forEach(([align, icon, ariaLabel]) => {
      const control = iconButton(ariaLabel, icon, "label-sheet-workspace-context-icon-action", { iconOnly: true });
      control.dataset.labelWorkspaceContextAlign = align;
      control.setAttribute("aria-label", ariaLabel);
      control.title = ariaLabel;
      contextAlignGroup.append(control);
    });
    const quickFontField = $("labelSheetQuickFont")?.closest(".label-sheet-field");
    const quickColorModeField = $("labelSheetQuickColorMode")?.closest(".label-sheet-field");
    const quickColorField = $("labelSheetQuickColor")?.closest(".label-sheet-field");
    const quickVerticalField = $("labelSheetQuickVerticalGroup")?.closest(".label-sheet-field");
    [quickFontField, quickColorModeField, quickColorField, quickVerticalField].filter(Boolean).forEach((field) => {
      field.classList.add("label-sheet-workspace-context-field");
    });
    append(
      contextActions,
      quickFontField,
      quickColorModeField,
      quickColorField,
      contextSizeDown,
      contextSizeUp,
      quickVerticalField,
      contextNudgeGroup,
      contextAlignGroup
    );
    append(contextControls, contextTargetPicker, contextActions);
    append(contextToolbar, contextToolbarHead, contextControls);
    const ticketCanvas = node("section", "label-sheet-workspace-canvas-panel label-sheet-workspace-ticket-canvas");
    ticketCanvas.dataset.labelCanvasPanel = "ticket";
    const sheetCanvas = node("section", "label-sheet-workspace-canvas-panel label-sheet-workspace-sheet-canvas");
    sheetCanvas.dataset.labelCanvasPanel = "sheet";
    if (focusStage) ticketCanvas.append(focusStage);
    append(sheetCanvas, pageOverview, pagePreview);

    const emptyState = node("div", "label-sheet-workspace-empty");
    emptyState.id = "labelSheetWorkspaceEmpty";
    append(emptyState, node("strong", "", "첫 티켓을 만들어 보세요"), node("p", "", "샘플을 채우거나 표·CSV 데이터를 가져오면 바로 편집할 수 있습니다."));
    const emptyActions = node("div", "label-sheet-workspace-empty-actions");
    append(emptyActions, proxyClick(iconButton("샘플 채우기", "sample", "btn primary"), "labelSheetIntentSampleBtn"), proxyClick(iconButton("데이터 열기", "data", "btn secondary"), "labelSheetWorkspaceDataBtn"));
    emptyState.append(emptyActions);
    ticketCanvas.append(emptyState);
    const promptWorkbench = node("section", "label-sheet-workspace-prompt-workbench");
    promptWorkbench.id = "labelSheetWorkspacePromptWorkbench";
    promptWorkbench.hidden = true;
    promptWorkbench.setAttribute("aria-labelledby", "labelSheetWorkspacePromptTitle");
    const promptWorkbenchHead = node("header", "label-sheet-workspace-prompt-head");
    const promptWorkbenchCopy = node("div", "label-sheet-workspace-prompt-copy");
    const promptWorkbenchKicker = node("span", "label-sheet-kicker", "AI PROMPT · STEP 5");
    const promptWorkbenchTitle = node("h2", "", "페이지별 이미지 프롬프트 설계");
    promptWorkbenchTitle.id = "labelSheetWorkspacePromptTitle";
    const promptWorkbenchDescription = node("p", "", "데이터와 디자인 DNA를 기준으로 프롬프트를 만들고, 페이지·라벨 단위로 바로 복사합니다.");
    append(promptWorkbenchCopy, promptWorkbenchKicker, promptWorkbenchTitle, promptWorkbenchDescription);
    const promptWorkbenchActions = node("div", "label-sheet-workspace-prompt-actions");
    const promptGenerate = proxyClick(iconButton("프롬프트 생성", "prompt", "btn primary"), "labelSheetGeneratePromptBtn");
    promptGenerate.id = "labelSheetWorkspacePromptGenerateBtn";
    const promptData = iconButton("데이터 연결", "data", "btn secondary");
    promptData.dataset.labelWorkspacePromptCommand = "data";
    const promptAssets = iconButton("디자인 DNA", "palette", "btn secondary");
    promptAssets.dataset.labelWorkspacePromptCommand = "assets";
    append(promptWorkbenchActions, promptGenerate, promptData, promptAssets);
    append(promptWorkbenchHead, promptWorkbenchCopy, promptWorkbenchActions);
    const promptWorkbenchGuide = node("section", "label-sheet-workspace-prompt-guide", "");
    promptWorkbenchGuide.setAttribute("aria-label", "프롬프트 설계 준비 상태");
    [
      ["1", "데이터", "문구와 연번을 확인"],
      ["2", "디자인 DNA", "시각 규칙을 선택"],
      ["3", "생성·복사", "페이지 또는 라벨별 사용"],
    ].forEach(([number, label, description]) => {
      const item = node("div", "label-sheet-workspace-prompt-guide-item");
      append(item, node("strong", "", number), node("span", "", label), node("small", "", description));
      promptWorkbenchGuide.append(item);
    });
    const promptResultHost = node("div", "label-sheet-workspace-prompt-result-host");
    promptResultHost.id = "labelSheetWorkspacePromptResultHost";
    promptWorkbench.append(promptWorkbenchHead, promptWorkbenchGuide, promptResultHost);
    append(canvasColumn, canvasHeader, contextToolbar, previewToolbar, ticketCanvas, sheetCanvas, promptWorkbench);

    const inspector = node("aside", "label-sheet-workspace-inspector");
    inspector.id = "labelSheetWorkspaceInspector";
    inspector.dataset.labelWorkspaceRegion = "right";
    inspector.setAttribute("aria-label", "선택 항목 속성");
    const inspectorHeader = node("div", "label-sheet-workspace-inspector-heading");
    const inspectorCloseButton = iconButton("속성 편집기 닫기", "close", "label-sheet-workspace-mobile-inspector-close", { iconOnly: true });
    inspectorCloseButton.setAttribute("aria-label", "속성 편집기 닫기");
    append(inspectorHeader, heading("선택 항목", "속성 편집기", "캔버스를 보며 현재 항목의 서식과 배치를 조정합니다."), inspectorCloseButton);
    const inspectorContext = node("section", "label-sheet-workspace-inspector-context");
    inspectorContext.setAttribute("aria-label", "현재 편집 대상과 적용 범위");
    append(inspectorContext, focusHead, focusScope, focusNavigation);
    const inspectorTabs = node("div", "label-sheet-workspace-inspector-tabs");
    inspectorTabs.setAttribute("role", "tablist");
    inspectorTabs.setAttribute("aria-label", "속성 편집기 범주");
    const inspectorPanels = {};
    [
      ["object", "개체", "선택 개체의 글꼴·문구·배치"],
      ["background", "배경", "라벨 배경과 테두리"],
      ["document", "문서", "용지와 출력 규격"],
    ].forEach(([value, label, description], index) => {
      const tab = button(label, "label-sheet-workspace-inspector-tab");
      tab.id = `labelSheetWorkspaceInspectorTab${value[0].toUpperCase()}${value.slice(1)}`;
      tab.dataset.labelWorkspaceInspectorTab = value;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(index === 0));
      tab.tabIndex = index === 0 ? 0 : -1;
      tab.title = description;
      const panel = node("section", "label-sheet-workspace-inspector-panel");
      panel.id = `labelSheetWorkspaceInspectorPanel${value[0].toUpperCase()}${value.slice(1)}`;
      panel.dataset.labelWorkspaceInspectorPanel = value;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.hidden = index !== 0;
      tab.setAttribute("aria-controls", panel.id);
      inspectorTabs.append(tab);
      inspectorPanels[value] = panel;
    });
    const rightResizer = node("div", "label-sheet-workspace-resizer label-sheet-workspace-resizer-right");
    rightResizer.dataset.labelWorkspaceResizer = "right";
    rightResizer.setAttribute("role", "separator");
    rightResizer.setAttribute("aria-label", "속성 패널 너비 조절");
    rightResizer.tabIndex = 0;
    const inspectorActions = node("div", "label-sheet-workspace-inspector-actions");
    const commonButton = iconButton("면 공통 레이아웃", "properties", "btn secondary");
    commonButton.id = "labelSheetWorkspaceCommonBtn";
    commonButton.dataset.labelWorkspaceFocusTool = "common";
    const detailButton = iconButton("문구 편집", "text", "btn secondary");
    detailButton.id = "labelSheetWorkspaceDetailBtn";
    detailButton.dataset.labelWorkspaceFocusTool = "detail";
    detailButton.setAttribute("aria-controls", "labelSheetDesignContentStep");
    detailButton.setAttribute("aria-expanded", "false");
    const placementButton = iconButton("개별 배치", "layers", "btn secondary");
    placementButton.id = "labelSheetWorkspacePlacementBtn";
    placementButton.setAttribute("aria-controls", "labelSheetWorkspacePlacementEditor");
    placementButton.setAttribute("aria-expanded", "false");
    const qrButton = iconButton("QR 설정", "qr", "btn secondary");
    qrButton.id = "labelSheetWorkspaceQrBtn";
    qrButton.setAttribute("aria-controls", "labelSheetWorkspaceQrDrawer");
    qrButton.setAttribute("aria-expanded", "false");
    detailButton.hidden = true;
    placementButton.hidden = true;
    contentStep.open = false;
    contentStep.hidden = false;
    const contentSummary = contentStep.querySelector("summary");
    if (contentSummary) {
      contentSummary.querySelector("strong")?.replaceChildren("문구 편집");
      contentSummary.querySelector("small")?.replaceChildren("현재 면의 제목·본문·하단 문구와 표시 여부를 편집합니다.");
    }
    const placementEditor = node("details", "label-sheet-workspace-placement-editor");
    placementEditor.id = "labelSheetWorkspacePlacementEditor";
    const placementSummary = node("summary", "");
    append(placementSummary, node("strong", "", "선택 항목 배치"), node("small", "", "위치·크기·정렬과 프리셋을 이 속성 편집기에서 조정합니다."));
    const placementBody = node("div", "label-sheet-workspace-placement-body");
    const precisionTools = node("section", "label-sheet-workspace-precision-tools");
    append(precisionTools, heading("POSITION", "정밀 배치", "위·아래 이동과 크기·정렬은 선택한 항목에만 적용합니다."), focusShortcutActions, focusShortcutHelp);
    append(placementBody, focusDetailPanel, precisionTools);
    append(placementEditor, placementSummary, placementBody);
    append(inspectorActions, detailButton, placementButton, qrButton);
    const surfaceControls = focusQuickPanel.querySelector(".label-sheet-quick-surface-controls")
      || $("labelSheetQuickEditbar")?.querySelector(".label-sheet-quick-surface-controls");
    const backgroundHeading = heading("BACKGROUND", "라벨 표면", "현재 적용 범위에 맞춰 배경색·배경 이미지·테두리를 설정합니다.");
    if (surfaceControls) inspectorPanels.background.append(backgroundHeading, surfaceControls);
    else inspectorPanels.background.append(backgroundHeading, node("p", "label-sheet-workspace-panel-empty", "선택한 라벨의 표면 설정을 준비하고 있습니다."));
    const documentHeading = heading("DOCUMENT", "문서 규격", "용지 방향, 라벨 크기와 배치 수는 프로젝트 전체에 적용됩니다.");
    const documentSummary = node("output", "label-sheet-workspace-document-summary", "문서 규격을 불러오는 중입니다.");
    documentSummary.id = "labelSheetWorkspaceDocumentSpecSummary";
    const documentSpecButton = iconButton("문서 규격 변경", "settings", "btn primary");
    documentSpecButton.id = "labelSheetWorkspaceDocumentSpecBtn";
    documentSpecButton.dataset.labelWorkspaceInspectorCommand = "document-spec";
    const documentCommonButton = commonButton;
    documentCommonButton.textContent = "현재 면 공통 설정";
    const documentActions = node("div", "label-sheet-workspace-document-actions");
    append(documentActions, documentSpecButton, documentCommonButton);
    append(inspectorPanels.document, documentHeading, documentSummary, documentActions);
    const objectHeading = heading("OBJECT", "개체 상세 설정", "자주 쓰는 서식은 캔버스 위 빠른 편집에서, 크기·문구·정밀 배치는 여기서 조정합니다.");
    append(inspectorPanels.object, objectHeading, focusQuickPanel, inspectorActions, contentStep, placementEditor);
    append(inspector, rightResizer, inspectorHeader, inspectorContext, inspectorTabs, inspectorPanels.object, inspectorPanels.background, inspectorPanels.document);
    focusEditor.classList.add("label-sheet-workspace-editor");
    focusEditor.hidden = false;
    focusEditor.replaceChildren(canvasColumn, inspector);
    append(stage, focusEditor);
    append(frame, stage);

    const bottom = node("section", "label-sheet-workspace-bottom");
    bottom.dataset.labelWorkspaceRegion = "bottom";
    const bottomResizer = node("div", "label-sheet-workspace-bottom-resizer");
    bottomResizer.dataset.labelWorkspaceResizer = "bottom";
    bottomResizer.setAttribute("role", "separator");
    bottomResizer.setAttribute("aria-label", "데이터 시트 높이 조절");
    bottomResizer.tabIndex = 0;
    const bottomHeader = node("header", "label-sheet-workspace-bottom-header");
    const bottomTabs = node("div", "label-sheet-workspace-bottom-tabs");
    [["data", "데이터"], ["mapping", "매핑"], ["validation", "검증"]].forEach(([value, label], index) => {
      const control = button("", "label-sheet-workspace-bottom-tab");
      control.dataset.labelBottomTab = value;
      control.classList.toggle("is-active", index === 0);
      control.setAttribute("aria-selected", String(index === 0));
      control.append(node("span", "", label));
      if (value === "data") {
        const count = node("output", "label-sheet-workspace-data-count", "0");
        count.id = "labelSheetWorkspaceDataCount";
        count.setAttribute("aria-label", "데이터 0건");
        control.append(count);
      } else if (value === "validation") {
        const count = node("output", "label-sheet-workspace-validation-count", "0");
        count.id = "labelSheetWorkspaceValidationCount";
        count.hidden = true;
        count.setAttribute("aria-label", "검증 문제 0건");
        control.append(count);
      }
      bottomTabs.append(control);
    });
    const bottomHeaderActions = node("div", "label-sheet-workspace-bottom-actions");
    const bottomStatus = node("output", "", "데이터 0건");
    bottomStatus.id = "labelSheetWorkspaceDataStatus";
    const bottomToggle = button("접기", "label-sheet-workspace-bottom-toggle");
    bottomToggle.id = "labelSheetWorkspaceBottomToggle";
    bottomToggle.setAttribute("aria-expanded", "true");
    append(bottomHeaderActions, bottomStatus, bottomToggle);
    append(bottomHeader, bottomTabs, bottomHeaderActions);
    const bottomBody = node("div", "label-sheet-workspace-bottom-body");
    const dataPanel = node("section", "label-sheet-workspace-bottom-panel is-active");
    dataPanel.dataset.labelBottomPanel = "data";
    dataStep.open = true;
    dataPanel.append(dataStep);
    const mappingWorkspacePanel = node("section", "label-sheet-workspace-bottom-panel");
    mappingWorkspacePanel.dataset.labelBottomPanel = "mapping";
    mappingWorkspacePanel.append(mappingPanel);
    const validationPanel = node("section", "label-sheet-workspace-bottom-panel");
    validationPanel.dataset.labelBottomPanel = "validation";
    validationPanel.append(preflightCard);
    append(bottomBody, dataPanel, mappingWorkspacePanel, validationPanel);
    append(bottom, bottomResizer, bottomHeader, bottomBody);

    const statusbar = node("footer", "label-sheet-workspace-statusbar");
    statusbar.setAttribute("aria-label", "편집 상태와 단축키");
    const saveState = node("span", "label-sheet-workspace-save-state", "자동 저장됨");
    saveState.id = "labelSheetWorkspaceSaveState";
    const historyState = node("span", "label-sheet-workspace-history-state", "편집 기록 준비");
    historyState.id = "labelSheetWorkspaceHistoryState";
    const workspaceState = node("span", "label-sheet-workspace-preset-state", "레이아웃 편집");
    workspaceState.id = "labelSheetWorkspacePresetState";
    const statusPrimary = node("div", "label-sheet-workspace-status-primary");
    const statusContext = node("div", "label-sheet-workspace-status-context");
    const statusShortcuts = node("div", "label-sheet-workspace-status-shortcuts");
    append(statusPrimary, saveState, historyState, workspaceState);
    append(statusContext, focusStatus, $("labelSheetStatus"));
    append(statusShortcuts, node("span", "label-sheet-workspace-shortcut-note", "Ctrl+K 명령 · Ctrl+Z 취소 · Alt+D 데이터"));
    append(statusbar, statusPrimary, statusContext, statusShortcuts);

    const settingsDrawer = createDrawer("labelSheetWorkspaceSettingsDrawer", "제작 준비", "목표와 규격을 한 단계씩 분리해 설정합니다.");
    const settingsStepHeader = node("section", "label-sheet-workspace-settings-step-header");
    settingsStepHeader.id = "labelSheetWorkspaceSettingsStepHeader";
    settingsStepHeader.dataset.step = "intent";
    const settingsStepKicker = node("span", "label-sheet-workspace-settings-step-kicker", "STEP 1 / 5");
    settingsStepKicker.id = "labelSheetWorkspaceSettingsStepKicker";
    const settingsStepTitle = node("h3", "", "제작 목표 선택");
    settingsStepTitle.id = "labelSheetWorkspaceSettingsStepTitle";
    const settingsStepDescription = node("p", "", "결과물, 품목, 출력 면을 먼저 정하세요.");
    settingsStepDescription.id = "labelSheetWorkspaceSettingsStepDescription";
    const settingsStepState = node("output", "label-sheet-workspace-settings-step-state", "현재 단계");
    settingsStepState.id = "labelSheetWorkspaceSettingsStepState";
    settingsStepState.setAttribute("aria-live", "polite");
    append(settingsStepHeader, settingsStepKicker, settingsStepTitle, settingsStepDescription, settingsStepState);
    const recoveryCard = node("section", "label-sheet-workspace-recovery-card");
    recoveryCard.id = "labelSheetWorkspaceRecoveryCard";
    const recoveryList = node("div", "label-sheet-workspace-recovery-list");
    recoveryList.id = "labelSheetWorkspaceRecoveryList";
    recoveryList.setAttribute("aria-live", "polite");
    append(recoveryCard, heading("RECOVERY", "최근 자동 저장", "최근 편집 상태를 선택해 프로젝트 전체를 복원합니다."), recoveryList);
    settingsDrawer.body.append(settingsStepHeader, intentPanel, specStep, recoveryCard);
    specStep.open = true;
    const settingsDone = iconButton("작업대로 돌아가기", "left", "btn secondary");
    settingsDone.dataset.labelWorkspaceDrawerClose = "";
    const settingsNext = iconButton("다음 · 데이터 연결", "right", "btn primary");
    settingsNext.id = "labelSheetWorkspaceSettingsNextBtn";
    append(settingsDrawer.footer, settingsDone, settingsNext);

    const dataDrawer = createDrawer("labelSheetWorkspaceDataDrawer", "데이터 편집", "레코드 입력, CSV 가져오기, 열 매핑과 검증을 한 작업 화면에서 관리합니다.");
    const dataWorkspace = node("div", "label-sheet-workspace-data-workspace");
    const dataRecordPane = node("aside", "label-sheet-workspace-data-records");
    dataRecordPane.setAttribute("aria-label", "현재 레코드 목록");
    dataRecordPane.append(recordsPanel);
    const dataEditorPane = node("section", "label-sheet-workspace-data-editor");
    dataEditorPane.setAttribute("aria-label", "데이터 입력과 매핑");
    dataEditorPane.append(bottom);
    append(dataWorkspace, dataRecordPane, dataEditorPane);
    dataDrawer.body.append(dataWorkspace);
    const dataDone = iconButton("다음 · 디자인 편집", "right", "btn primary");
    dataDone.id = "labelSheetWorkspaceDataNextBtn";
    dataDone.dataset.labelWorkspaceDrawerClose = "";
    dataDrawer.footer.append(dataDone);

    const assetsDrawer = createDrawer("labelSheetWorkspaceAssetsDrawer", "배경·디자인 자산", "배경 이미지와 디자인 DNA는 필요할 때만 열어 조정합니다.");
    assetsDrawer.body.append(assetsPanel);
    const assetsDone = iconButton("적용하고 돌아가기", "check", "btn primary");
    assetsDone.dataset.labelWorkspaceDrawerClose = "";
    assetsDrawer.footer.append(assetsDone);

    const reviewDrawer = createDrawer("labelSheetWorkspaceReviewDrawer", "검토·내보내기", "오류를 확인한 뒤 PNG·PDF·인쇄 또는 프롬프트 결과를 내보냅니다.");
    reviewDrawer.body.append(resultCard);
    const printActions = resultCard.querySelector('.label-sheet-action-dock-group[data-label-sheet-goal="print"]');
    [$("labelSheetExportPdfBtn"), $("labelSheetPrintBtn"), $("labelSheetExportPngBtn"), $("labelSheetExportAllPngBtn")]
      .filter(Boolean)
      .forEach((control) => printActions?.append(control));
    const reviewAdvanced = node("details", "label-sheet-workspace-review-advanced");
    reviewAdvanced.id = "labelSheetWorkspaceReviewAdvanced";
    const reviewAdvancedSummary = node("summary", "", "출력 범위·프로젝트·기록");
    const reviewAdvancedBody = node("div", "label-sheet-workspace-review-advanced-body");
    [resultCard.querySelector(".label-sheet-package-card"), resultCard.querySelector(".label-sheet-print-job-card"), resultCard.querySelector(".label-sheet-secondary-actions")]
      .filter(Boolean)
      .forEach((section) => reviewAdvancedBody.append(section));
    append(reviewAdvanced, reviewAdvancedSummary, reviewAdvancedBody);
    resultCard.append(reviewAdvanced);
    const reviewDone = iconButton("디자인으로 돌아가기", "left", "btn secondary");
    reviewDone.dataset.labelWorkspaceDrawerClose = "";
    reviewDrawer.footer.append(reviewDone);

    const commonDrawer = createDrawer("labelSheetWorkspaceCommonDrawer", "면 공통 레이아웃", "현재 면의 모든 라벨에 함께 적용되는 방향, 정렬, 글자 크기와 대비를 설정합니다.");
    const commonLayoutDetail = node("section", "label-sheet-workspace-detail-section label-sheet-workspace-common-layout-detail");
    commonLayoutDetail.id = "labelSheetWorkspaceCommonLayout";
    append(commonLayoutDetail, heading("LAYOUT", "현재 면 전체에 적용", "여기서 바꾼 설정은 현재 면의 모든 라벨에 반영됩니다."), focusCommonPanel);
    commonDrawer.body.append(commonLayoutDetail);
    const commonDone = iconButton("적용하고 돌아가기", "check", "btn primary");
    commonDone.dataset.labelWorkspaceDrawerClose = "";
    commonDrawer.footer.append(commonDone);

    const qrDrawer = createDrawer("labelSheetWorkspaceQrDrawer", "QR 코드 설정", "QR 사용 여부와 데이터·배치 규칙을 한곳에서 설정합니다.");
    const qrSection = contentStep.querySelector("#labelSheetQrSection");
    if (qrSection) qrDrawer.body.append(qrSection);
    const qrDone = iconButton("적용하고 돌아가기", "check", "btn primary");
    qrDone.dataset.labelWorkspaceDrawerClose = "";
    qrDrawer.footer.append(qrDone);

    const commandPalette = node("section", "label-sheet-workspace-command-palette");
    commandPalette.id = "labelSheetWorkspaceCommandPalette";
    commandPalette.hidden = true;
    commandPalette.setAttribute("role", "dialog");
    commandPalette.setAttribute("aria-modal", "true");
    commandPalette.setAttribute("aria-hidden", "true");
    commandPalette.setAttribute("aria-labelledby", "labelSheetWorkspaceCommandTitle");
    const commandPanel = node("div", "label-sheet-workspace-command-panel");
    const commandHeader = node("header", "label-sheet-workspace-command-header");
    const commandHeading = heading("COMMAND", "명령 찾기", "기능 이름이나 작업 목적을 입력하세요.");
    commandHeading.querySelector("strong").id = "labelSheetWorkspaceCommandTitle";
    const commandClose = iconButton("명령 찾기 닫기", "close", "label-sheet-workspace-command-close", { iconOnly: true });
    commandClose.id = "labelSheetWorkspaceCommandClose";
    commandClose.setAttribute("aria-label", "명령 찾기 닫기");
    append(commandHeader, commandHeading, commandClose);
    const commandSearch = node("input", "label-sheet-workspace-command-search");
    commandSearch.id = "labelSheetWorkspaceCommandSearch";
    commandSearch.type = "search";
    commandSearch.placeholder = "예: 데이터, 검토, 집중, QR";
    commandSearch.autocomplete = "off";
    commandSearch.setAttribute("aria-label", "명령 검색");
    commandSearch.setAttribute("aria-controls", "labelSheetWorkspaceCommandList");
    const commandList = node("div", "label-sheet-workspace-command-list");
    commandList.id = "labelSheetWorkspaceCommandList";
    commandList.setAttribute("role", "menu");
    commandList.setAttribute("aria-label", "사용 가능한 명령");
    const commandEmpty = node("p", "label-sheet-workspace-command-empty", "일치하는 명령이 없습니다.");
    commandEmpty.id = "labelSheetWorkspaceCommandEmpty";
    commandEmpty.hidden = true;
    append(commandPanel, commandHeader, commandSearch, commandList, commandEmpty, node("p", "label-sheet-workspace-command-hint", "↑↓ 이동 · Enter 실행 · Esc 닫기"));
    commandPalette.append(commandPanel);

    const undoToast = node("section", "label-sheet-workspace-undo-toast");
    undoToast.id = "labelSheetWorkspaceUndoToast";
    undoToast.hidden = true;
    undoToast.setAttribute("aria-live", "polite");
    undoToast.setAttribute("aria-atomic", "true");
    const undoToastMessage = node("span", "", "변경사항을 자동 저장했습니다.");
    undoToastMessage.id = "labelSheetWorkspaceUndoToastMessage";
    const undoToastAction = iconButton("실행 취소", "undo", "label-sheet-workspace-undo-toast-action");
    undoToastAction.id = "labelSheetWorkspaceUndoToastAction";
    const undoToastClose = iconButton("변경 알림 닫기", "close", "label-sheet-workspace-undo-toast-close", { iconOnly: true });
    undoToastClose.id = "labelSheetWorkspaceUndoToastClose";
    undoToastClose.setAttribute("aria-label", "변경 알림 닫기");
    append(undoToast, undoToastMessage, undoToastAction, undoToastClose);

    if (resultCard.contains(previewToolbar)) previewToolbar.remove();
    if (resultCard.contains(focusEditor)) focusEditor.remove();
    if (resultCard.contains(pagePreview)) pagePreview.remove();
    if (resultCard.contains(preflightCard)) preflightCard.remove();
    if (dnaDialog?.parentElement) dnaDialog.remove();
    hero?.remove();

    shell.replaceChildren(topbar, flowBar, entry, frame, statusbar, left, panelHost, settingsDrawer.drawer, dataDrawer.drawer, assetsDrawer.drawer, reviewDrawer.drawer, commonDrawer.drawer, qrDrawer.drawer, commandPalette, undoToast);
    if (dnaDialog) shell.append(dnaDialog);

    [
      ["labelSheetIntentSampleBtn", "sample"],
      ["labelSheetIntentContinueBtn", "right"],
      ["labelSheetCalibrationBtn", "settings"],
      ["labelSheetDataSampleBtn", "sample"],
      ["labelSheetApplySequenceBtn", "refresh"],
      ["labelSheetPasteApplyBtn", "check"],
      ["labelSheetCsvSampleBtn", "download"],
      ["labelSheetImportCommitBtn", "check"],
      ["labelSheetImportUndoBtn", "undo"],
      ["labelSheetDataMappingPasteBtn", "copy"],
      ["labelSheetDataMappingCsvBtn", "upload"],
      ["labelSheetDataMappingAutoBtn", "refresh"],
      ["labelSheetDataMappingReviewBtn", "review"],
      ["labelSheetAssetRegisterBtn", "upload"],
      ["labelSheetAssetAssignBtn", "image"],
      ["labelSheetRestoreDefaultsBtn", "refresh"],
      ["labelSheetAssetRemoveBtn", "trash"],
      ["labelSheetOpenDnaGalleryBtn", "palette"],
      ["labelSheetClearStyleBtn", "refresh"],
      ["labelSheetPrepareFreeBackgroundBtn", "prompt"],
      ["labelSheetCopyFreeBackgroundPromptBtn", "copy"],
      ["labelSheetRegisterFreeBackgroundBtn", "upload"],
      ["labelSheetQrAssignBtn", "qr"],
      ["labelSheetQrClearBtn", "trash"],
      ["labelSheetExportPngBtn", "image"],
      ["labelSheetExportAllPngBtn", "package"],
      ["labelSheetExportPdfBtn", "pdf"],
      ["labelSheetPrintBtn", "print"],
      ["labelSheetGeneratePromptBtn", "prompt"],
      ["labelSheetCopyAllPromptsBtn", "copy"],
      ["labelSheetPromptReadinessBtn", "review"],
      ["labelSheetRunPreflightBtn", "refresh"],
      ["labelSheetWysiwygResetField", "refresh"],
      ["labelSheetWysiwygResetLayout", "refresh"],
      ["labelSheetWysiwygPresetSave", "bookmark"],
      ["labelSheetWysiwygPresetApply", "check"],
      ["labelSheetWysiwygPresetDelete", "trash"],
      ["labelSheetCopyPromptBtn", "copy"],
      ["labelSheetCopyPromptNextBtn", "right"],
      ["labelSheetCopyItemPromptBtn", "copy"],
      ["labelSheetCopyPageItemsBtn", "copy"],
      ["labelSheetSavePackageBtn", "package"],
      ["labelSheetExportLayersBtn", "layers"],
      ["labelSheetPrintCurrentBtn", "print"],
      ["labelSheetUseResumeBtn", "bookmark"],
      ["labelSheetMarkPrintedBtn", "check"],
      ["labelSheetSampleBtn", "sample"],
      ["labelSheetResetBtn", "refresh"],
    ].forEach(([id, iconName]) => iconize($(id), iconName));

    bindWorkspaceViewport();

    specSummary.addEventListener("click", () => settingsButton.click());
    const mobileInspectorQuery = window.matchMedia("(max-width: 860px)");
    const setMobileInspector = (open, options = {}) => {
      const nextOpen = Boolean(open) && mobileInspectorQuery.matches;
      if (nextOpen && pane.classList.contains("is-mobile-tool-panel-open")) {
        pane.querySelector("#labelSheetWorkspaceToolPanelClose")?.click();
      }
      pane.classList.toggle("is-mobile-inspector-open", nextOpen);
      inspectorButton.setAttribute("aria-expanded", String(nextOpen));
      if (mobileInspectorQuery.matches) {
        inspector.setAttribute("aria-hidden", String(!nextOpen));
        inspector.inert = !nextOpen;
      } else {
        inspector.removeAttribute("aria-hidden");
        inspector.inert = false;
      }
      if (nextOpen && options.focus !== false) inspectorCloseButton.focus({ preventScroll: true });
      else if (!nextOpen && options.restoreFocus !== false) inspectorButton.focus({ preventScroll: true });
    };
    inspectorButton.addEventListener("click", () => setMobileInspector(!pane.classList.contains("is-mobile-inspector-open")));
    inspectorCloseButton.addEventListener("click", () => setMobileInspector(false));
    pane.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && pane.classList.contains("is-mobile-inspector-open")) {
        event.preventDefault();
        setMobileInspector(false);
      }
    });
    const syncMobileInspector = () => {
      if (!mobileInspectorQuery.matches || !pane.classList.contains("is-mobile-inspector-open")) {
        setMobileInspector(false, { focus: false, restoreFocus: false });
      }
    };
    window.addEventListener("resize", syncMobileInspector, { passive: true });
    mobileInspectorQuery.addEventListener?.("change", syncMobileInspector);
    setMobileInspector(false, { focus: false, restoreFocus: false });

    // 핵심 출력 액션을 먼저 보여 주고 프로젝트·범위 설정은 사용자가 필요할 때 펼칩니다.
    reviewAdvanced.open = false;

    bindWorkspaceSync({ entry, frame, statusbar, projectSummary, recordList, emptyState, bottomStatus, specSummary, goalSwitch, canvasViews, preflightCard, flowBar, promptWorkbench, promptResultHost, resultCard, reviewDrawer, documentSummary });
    pane.dataset.labelWorkspaceLayoutReady = "true";
    window.dispatchEvent(new CustomEvent("promptdeck:label-workspace-layout-ready", { detail: { version: 11 } }));
  }

  function bindWorkspaceViewport() {
    const sync = () => {
      if (!pane.classList.contains("active") || !pane.getClientRects().length) return;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const documentScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const viewportTop = Math.max(0, pane.getBoundingClientRect().top + documentScrollTop);
      const bodyPaddingBottom = Number.parseFloat(window.getComputedStyle(document.body).paddingBottom) || 0;
      const available = Math.max(240, viewportHeight - viewportTop - bodyPaddingBottom);
      pane.style.setProperty("--label-workspace-available-height", `${Math.round(available)}px`);
    };
    const scheduleSync = () => window.requestAnimationFrame(() => window.requestAnimationFrame(sync));
    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(sync) : null;
    [document.querySelector(".app-header"), document.querySelector(".app-tabs-bar"), $("mobileTabActions")]
      .filter(Boolean)
      .forEach((element) => resizeObserver?.observe(element));
    new MutationObserver(sync).observe(pane, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
    pane.addEventListener("promptdeck:label-workspace-change", scheduleSync);
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.matchMedia("print").addEventListener?.("change", scheduleSync);
    window.visualViewport?.addEventListener("resize", sync, { passive: true });
    window.visualViewport?.addEventListener("scroll", sync, { passive: true });
    scheduleSync();
  }

  function createDrawer(id, title, description) {
    const drawer = node("section", "label-sheet-workspace-drawer");
    drawer.id = id;
    drawer.hidden = true;
    drawer.dataset.open = "false";
    const modalKind = id
      .replace(/^labelSheetWorkspace/, "")
      .replace(/Drawer$/, "")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .toLowerCase();
    drawer.dataset.labelWorkspaceModal = modalKind;
    const panel = node("div", "label-sheet-workspace-drawer-panel");
    panel.dataset.labelWorkspaceDrawerPanel = "";
    panel.dataset.labelWorkspaceModalPanel = modalKind;
    const header = node("header", "label-sheet-workspace-drawer-header");
    const close = button("닫기", "btn ghost label-sheet-compact-btn");
    close.dataset.labelWorkspaceDrawerClose = "";
    close.setAttribute("aria-label", `${title} 닫기`);
    const closeIcon = iconize(node("span", "label-sheet-workspace-drawer-close-icon"), "close");
    closeIcon.setAttribute("aria-hidden", "true");
    close.replaceChildren(closeIcon, node("span", "label-sheet-workspace-drawer-close-label", "닫기"));
    const titleBlock = heading("LABEL & TICKET", title, description);
    const titleId = `${id}Title`;
    const descriptionId = `${id}Description`;
    titleBlock.querySelector("strong").id = titleId;
    titleBlock.querySelector("small").id = descriptionId;
    drawer.setAttribute("aria-labelledby", titleId);
    drawer.setAttribute("aria-describedby", descriptionId);
    append(header, titleBlock, close);
    const body = node("div", "label-sheet-workspace-drawer-body");
    body.setAttribute("role", "document");
    const footer = node("footer", "label-sheet-workspace-drawer-footer");
    const footerNote = node(
      "small",
      "label-sheet-workspace-drawer-save-note",
      modalKind === "review" ? "내보내기 전 변경 내용은 자동 저장됩니다." : "변경 내용은 자동 저장됩니다."
    );
    footer.append(footerNote);
    append(panel, header, body, footer);
    drawer.append(panel);
    return { drawer, body, footer, footerNote };
  }

  function bindWorkspaceSync(context) {
    const tableBody = $("labelSheetRecordTableBody");
    const modeOutput = $("labelSheetWorkspaceMode");
    const preflight = context.preflightCard?.querySelector("#labelSheetPreflight");
    const stateLabels = {
      incomplete: "미완료",
      current: "현재 단계",
      complete: "완료",
      warning: "확인 필요",
      blocked: "선행 단계 필요",
    };
    const applyFlowStates = (states, readiness = states) => {
      context.flowBar?.querySelectorAll("[data-label-workspace-flow-step]").forEach((control) => {
        const value = control.dataset.labelWorkspaceFlowStep;
        const state = states[value] || "incomplete";
        const readyState = readiness[value] || state;
        const number = control.querySelector(".label-sheet-workspace-flow-number")?.textContent?.trim() || "";
        const label = control.querySelector("strong")?.textContent?.trim() || value;
        const description = control.querySelector("small")?.textContent?.trim() || "";
        control.dataset.state = state;
        control.dataset.readiness = readyState;
        control.disabled = readyState === "blocked";
        control.setAttribute("aria-label", `${number}단계 ${label} · ${description} · ${stateLabels[state] || state}`);
      });
    };
    const updateFlowReadiness = (count = 0) => {
      const cell = $("labelSheetCellSize")?.textContent?.trim();
      const specReady = Boolean(cell && cell !== "—");
      const draftPending = Boolean($("labelSheetImportCommitBtn") && !$("labelSheetImportCommitBtn").disabled);
      const dataReady = count > 0 && !draftPending;
      const issueCount = Array.from(preflight?.querySelectorAll(".label-sheet-preflight-item:not(.is-success)") || []).length;
      const readiness = {
        intent: "complete",
        spec: specReady ? "complete" : "warning",
        data: dataReady ? "complete" : "incomplete",
        design: dataReady && specReady ? "incomplete" : "blocked",
        output: dataReady && specReady ? (issueCount ? "warning" : "incomplete") : "blocked",
      };
      const activeStep = pane.dataset.activeWorkspaceStep || pane.dataset.activeStep || "intent";
      const states = Object.fromEntries(Object.entries(readiness).map(([step, state]) => [step, step === activeStep ? "current" : state]));
      applyFlowStates(states, readiness);
    };
    const updateGoal = () => {
      const goal = pane.dataset.outputGoal === "prompt" ? "prompt" : "print";
      const promptActive = goal === "prompt";
      context.promptWorkbench.hidden = !promptActive;
      const resultHost = promptActive ? context.promptResultHost : context.reviewDrawer.body;
      if (context.resultCard.parentElement !== resultHost) resultHost.append(context.resultCard);
      context.goalSwitch.querySelectorAll("[data-label-workspace-goal]").forEach((control) => {
        const active = control.dataset.labelWorkspaceGoal === goal;
        control.classList.toggle("is-active", active);
        control.setAttribute("aria-pressed", String(active));
      });
      const outputStep = context.flowBar?.querySelector('[data-label-workspace-flow-step="output"]');
      const outputLabel = outputStep?.querySelector("strong");
      const outputDescription = outputStep?.querySelector("small");
      if (outputLabel) outputLabel.textContent = goal === "prompt" ? "생성" : "출력";
      if (outputDescription) outputDescription.textContent = goal === "prompt" ? "프롬프트 만들기" : "검토·저장";
      outputStep?.setAttribute("aria-label", goal === "prompt" ? "5단계 생성 · 프롬프트 만들기" : "5단계 출력 · 검토·저장");
    };
    const updateSummary = () => {
      const records = tableBody ? Array.from(tableBody.querySelectorAll("tr[data-record-id]")) : [];
      const count = records.length;
      const hasRecords = count > 0;
      context.entry.hidden = hasRecords;
      context.frame.hidden = !hasRecords;
      context.statusbar.hidden = !hasRecords;
      pane.dataset.projectState = hasRecords ? "editing" : "empty";
      context.emptyState.hidden = count > 0;
      context.bottomStatus.textContent = `데이터 ${count}건`;
      const countOutput = $("labelSheetWorkspaceDataCount");
      if (countOutput) {
        countOutput.textContent = String(count);
        countOutput.setAttribute("aria-label", `데이터 ${count}건`);
      }
      pane.querySelectorAll(".label-sheet-workspace-project-summary strong").forEach((strong) => {
        strong.textContent = modeOutput?.textContent || `${count}건 프로젝트`;
      });
      const cell = $("labelSheetCellSize")?.textContent?.trim();
      const capacity = $("labelSheetCapacity")?.textContent?.trim();
      context.specSummary.textContent = cell && cell !== "—" ? `${cell} · ${capacity || "규격"}` : "규격 확인";
      if (context.documentSummary) {
        context.documentSummary.textContent = cell && cell !== "—"
          ? `${cell} · ${capacity || "배치 정보"}`
          : "용지와 라벨 규격을 확인해 주세요.";
      }
      const dataNext = $("labelSheetWorkspaceDataNextBtn");
      if (dataNext) {
        const draftPending = Boolean($("labelSheetImportCommitBtn") && !$("labelSheetImportCommitBtn").disabled);
        dataNext.disabled = !hasRecords || draftPending;
        dataNext.textContent = draftPending
          ? "검토한 데이터를 적용해 주세요"
          : hasRecords ? "다음 · 디자인 편집" : "데이터를 먼저 적용해 주세요";
      }
      updateFlowReadiness(count);
      renderRecordList(records, context.recordList);
      syncLayerSelection();
      window.dispatchEvent(new CustomEvent("promptdeck:label-workspace-record-count", { detail: { count } }));
    };
    const updateValidation = () => {
      const issues = Array.from(preflight?.querySelectorAll(".label-sheet-preflight-item:not(.is-success)") || []);
      const errors = issues.filter((item) => item.classList.contains("is-error")).length;
      const countOutput = $("labelSheetWorkspaceValidationCount");
      const tab = pane.querySelector('[data-label-bottom-tab="validation"]');
      if (countOutput) {
        countOutput.textContent = String(issues.length);
        countOutput.hidden = issues.length === 0;
        countOutput.setAttribute("aria-label", `검증 문제 ${issues.length}건`);
      }
      if (tab) {
        tab.dataset.tone = errors ? "error" : issues.length ? "warning" : "success";
        tab.setAttribute("aria-label", issues.length ? `검증 문제 ${issues.length}건` : "검증 완료");
      }
      updateFlowReadiness(Array.from(tableBody?.querySelectorAll("tr[data-record-id]") || []).length);
    };

    new MutationObserver(updateGoal).observe(pane, { attributes: true, attributeFilter: ["data-output-goal"] });
    if (tableBody) new MutationObserver(updateSummary).observe(tableBody, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "value", "checked"] });
    if (modeOutput) new MutationObserver(updateSummary).observe(modeOutput, { childList: true, subtree: true, characterData: true });
    if (preflight) new MutationObserver(updateValidation).observe(preflight, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    pane.addEventListener("input", (event) => {
      if (event.target.closest("#labelSheetRecordTable")) window.requestAnimationFrame(updateSummary);
    });
    pane.addEventListener("click", (event) => {
      if (event.target.closest("[data-label-sheet-focus-target]")) {
        const picker = $("labelSheetWorkspaceContextTargetPicker");
        if (picker) picker.open = false;
        window.requestAnimationFrame(syncLayerSelection);
      }
    });
    window.addEventListener("promptdeck:label-sheet-goal-change", updateGoal);
    window.addEventListener("promptdeck:label-sheet-step-state-change", (event) => {
      applyFlowStates(event.detail?.states || {}, event.detail?.readiness || {});
    });
    window.addEventListener("promptdeck:label-sheet-focus-issue", async (event) => {
      const detail = event.detail || {};
      const recordIndex = Number(detail.recordIndex);
      if (Number.isInteger(recordIndex) && recordIndex >= 0) {
        if (detail.side === "back") {
          $("labelSheetFocusBackBtn")?.click();
          await new Promise((resolve) => window.setTimeout(resolve, 90));
        }
        await selectRecord(recordIndex);
      }
      window.setTimeout(() => {
        if (detail.route === "data" && Number.isInteger(recordIndex) && recordIndex >= 0) {
          const field = detail.dataField || (detail.code === "DUPLICATE_RECORD_ID" ? "id" : detail.code === "DUPLICATE_NUMBER" ? "number" : "");
          const input = field ? $("labelSheetRecordTableBody")?.querySelector(`input[data-record-index="${recordIndex}"][data-record-field="${field}"]`) : null;
          input?.scrollIntoView({ block: "center", inline: "nearest" });
          input?.focus({ preventScroll: true });
          input?.select?.();
          return;
        }
        if (detail.field) pane.querySelector(`[data-label-sheet-focus-target="${detail.field}"]`)?.click();
      }, 180);
    });
    window.addEventListener("promptdeck:label-workspace-change", (event) => {
      if (event.detail?.kind === "canvas-view") context.canvasViews.dataset.activeView = event.detail.value;
    });
    updateGoal();
    updateSummary();
    updateValidation();
  }

  function renderRecordList(rows, host) {
    const activeIndex = Number.parseInt($("labelSheetFocusPosition")?.textContent || "1", 10) - 1;
    const fragment = document.createDocumentFragment();
    rows.forEach((row, index) => {
      const read = (field) => row.querySelector(`[data-record-field="${field}"]`)?.value?.trim() || "";
      const id = read("id") || row.dataset.recordId || `레코드 ${index + 1}`;
      const number = read("number");
      const name = read("data.name") || read("front.title") || "출력 데이터 대기";
      const category = read("data.category");
      const control = button("", "label-sheet-workspace-record");
      control.dataset.recordIndex = String(index);
      control.dataset.recordId = id;
      control.setAttribute("role", "option");
      control.setAttribute("aria-selected", String(index === activeIndex));
      control.classList.toggle("is-active", index === activeIndex);
      const badge = node("span", "label-sheet-workspace-record-index", String(index + 1));
      const copy = node("span", "label-sheet-workspace-record-copy");
      append(copy, node("strong", "", name), node("small", "", [number || id, category].filter(Boolean).join(" · ")));
      append(control, badge, copy);
      control.addEventListener("click", () => selectRecord(index));
      fragment.append(control);
    });
    if (!rows.length) {
      const empty = node("p", "label-sheet-workspace-panel-empty", "데이터를 입력하면 티켓 목록이 표시됩니다.");
      fragment.append(empty);
    }
    host.replaceChildren(fragment);
  }

  async function selectRecord(index) {
    pane.querySelector('[data-label-canvas-view="ticket"]')?.click();
    const capacity = Math.max(1, Number.parseInt($("labelSheetCapacity")?.textContent || "1", 10) || 1);
    const targetPage = Math.floor(index / capacity);
    const targetSlot = index % capacity;
    const status = $("labelSheetPageStatus")?.textContent || "1 / 1";
    const currentPage = Math.max(0, (Number.parseInt(status, 10) || 1) - 1);
    const delta = targetPage - currentPage;
    const stepButton = delta >= 0 ? $("labelSheetPageNext") : $("labelSheetPagePrev");
    for (let step = 0; step < Math.abs(delta); step += 1) {
      stepButton?.click();
      await new Promise((resolve) => window.setTimeout(resolve, 40));
    }
    window.setTimeout(() => {
      const hits = Array.from($("labelSheetPreviewSurface")?.querySelectorAll(".label-sheet-wysiwyg-hit") || []);
      (hits[targetSlot] || hits[0])?.click();
      const rows = Array.from($("labelSheetRecordTableBody")?.querySelectorAll("tr[data-record-id]") || []);
      rows[index]?.scrollIntoView({ block: "nearest" });
    }, 80);
  }

  function syncLayerSelection() {
    const activeTarget = pane.querySelector("[data-label-sheet-focus-target].active")?.dataset.labelSheetFocusTarget || "title";
    const labels = { content: "전체", number: "연번", title: "제목", subtitle: "부제", body: "본문", footer: "하단", qr: "QR" };
    pane.querySelectorAll("[data-label-workspace-layer]").forEach((control) => {
      const active = control.dataset.labelWorkspaceLayer === activeTarget;
      control.classList.toggle("is-active", active);
      control.setAttribute("aria-pressed", String(active));
    });
    const targetLabel = $("labelSheetWorkspaceContextTargetLabel");
    if (targetLabel) targetLabel.textContent = labels[activeTarget] || "선택 항목";
    pane.querySelectorAll("[data-label-workspace-context-size]").forEach((control) => {
      control.hidden = activeTarget === "content";
    });
    const isText = !["content", "qr"].includes(activeTarget);
    pane.querySelectorAll("[data-label-workspace-context-text]").forEach((control) => {
      control.hidden = !isText;
    });
  }

  try {
    buildWorkspace();
  } catch (error) {
    pane.classList.remove("label-sheet-workspace-v2");
    pane.dataset.labelWorkspaceLayoutError = error.message || "unknown";
    console.error("Label-sheet workspace V2 layout failed", error);
  }
})();
