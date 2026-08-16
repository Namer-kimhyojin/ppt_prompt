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
      const control = button("", "label-sheet-workspace-menu-item");
      control.setAttribute("role", "menuitem");
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

    pane.classList.add("label-sheet-workspace-v2", "label-sheet-workspace-v3", "label-sheet-workspace-v4", "label-sheet-workspace-v6", "label-sheet-workspace-v7");
    pane.dataset.workspaceTool = "layers";
    pane.dataset.activeTool = "layers";
    pane.dataset.canvasView = pane.dataset.outputGoal === "prompt" ? "sheet" : "ticket";
    pane.dataset.bottomTab = "data";

    const topbar = node("header", "label-sheet-workspace-topbar");
    const brand = node("div", "label-sheet-workspace-brand");
    const mark = button("앱", "label-sheet-workspace-mark label-sheet-workspace-app-nav");
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
      { label: "실행 취소", id: "labelSheetWorkspaceUndoMenu", dataset: { labelWorkspaceHistoryCommand: "undo" }, shortcut: "Ctrl+Z" },
      { label: "다시 실행", id: "labelSheetWorkspaceRedoMenu", dataset: { labelWorkspaceHistoryCommand: "redo" }, shortcut: "Ctrl+Shift+Z" },
      { separator: true },
      { label: "전체 콘텐츠 선택", dataset: { labelWorkspaceLayerCommand: "content" }, shortcut: "1" },
      { label: "제목 선택", dataset: { labelWorkspaceLayerCommand: "title" }, shortcut: "3" },
      { label: "본문 선택", dataset: { labelWorkspaceLayerCommand: "body" }, shortcut: "5" },
      { label: "QR 선택", dataset: { labelWorkspaceLayerCommand: "qr" }, shortcut: "7" },
      { separator: true },
      { label: "용지 방향 설정…", dataset: { labelWorkspaceOrientationCommand: "paper" } },
      { label: "문구 방향 설정…", dataset: { labelWorkspaceOrientationCommand: "text" } },
      { separator: true },
      { label: "배경·디자인 자산…", id: "labelSheetWorkspaceAssetsMenu", dataset: { labelWorkspaceDrawerCommand: "assets" } },
      { label: "공통 레이아웃…", targetId: "labelSheetWorkspaceCommonBtn" },
      { label: "문구·QR 및 세부 설정…", targetId: "labelSheetWorkspaceDetailBtn" },
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
    const undoButton = button("실행 취소", "label-sheet-workspace-history-button");
    undoButton.id = "labelSheetWorkspaceUndoBtn";
    undoButton.dataset.labelWorkspaceHistoryCommand = "undo";
    undoButton.title = "실행 취소 (Ctrl+Z)";
    undoButton.disabled = true;
    const redoButton = button("다시 실행", "label-sheet-workspace-history-button");
    redoButton.id = "labelSheetWorkspaceRedoBtn";
    redoButton.dataset.labelWorkspaceHistoryCommand = "redo";
    redoButton.title = "다시 실행 (Ctrl+Shift+Z)";
    redoButton.disabled = true;
    append(historyActions, undoButton, redoButton);
    const commandButton = button("명령 찾기", "label-sheet-workspace-command-button");
    commandButton.id = "labelSheetWorkspaceCommandBtn";
    commandButton.title = "명령 찾기 (Ctrl+K)";
    const workspaceToolsButton = button("작업", "label-sheet-workspace-tools-button");
    workspaceToolsButton.id = "labelSheetWorkspaceToolsBtn";
    workspaceToolsButton.setAttribute("aria-label", "작업 메뉴 열기");
    workspaceToolsButton.setAttribute("aria-controls", "labelSheetWorkspaceToolPanel");
    workspaceToolsButton.setAttribute("aria-expanded", "false");
    const settingsButton = button("출력 설정");
    settingsButton.id = "labelSheetWorkspaceSettingsBtn";
    settingsButton.title = "프로젝트 설정";
    settingsButton.dataset.labelWorkspaceDrawer = "settings";
    const reviewButton = button("검토·내보내기", "btn primary label-sheet-compact-btn");
    reviewButton.id = "labelSheetWorkspaceReviewBtn";
    reviewButton.dataset.labelWorkspaceDrawer = "review";
    const actionHost = node("div", "label-sheet-workspace-actions");
    if (tabActions) actionHost.append(tabActions);
    append(topbarActions, workspaceToolsButton, historyActions, commandButton, actionHost, settingsButton, reviewButton);
    append(topbar, brand, topbarCenter, topbarActions);

    const frame = node("div", "label-sheet-workspace-frame");
    const left = node("aside", "label-sheet-workspace-left");
    left.dataset.labelWorkspaceRegion = "left";
    left.setAttribute("aria-label", "라벨 작업 도구");
    const toolrail = node("nav", "label-sheet-workspace-toolrail");
    toolrail.setAttribute("aria-label", "작업 도구 선택");
    const toolDefinitions = [
      ["project", "프로젝트", "설정과 시작", "시작"],
      ["records", "데이터", "티켓 목록", "목록"],
      ["layers", "항목", "출력 항목", "항목"],
      ["assets", "배경", "배경 이미지", "배경"],
    ];
    toolDefinitions.forEach(([value, label, title, icon], index) => {
      const control = button("", "label-sheet-workspace-tool");
      control.dataset.labelWorkspaceTool = value;
      control.title = title;
      control.setAttribute("aria-label", label);
      control.classList.toggle("is-active", index === 2);
      control.setAttribute("aria-selected", String(index === 2));
      const iconElement = node("span", "label-sheet-workspace-tool-icon", icon);
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
    const mobileToolClose = button("캔버스로 돌아가기", "label-sheet-workspace-mobile-tool-close");
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
    const entryHeading = heading("새 라벨 프로젝트", "출력할 라벨의 기본 틀을 먼저 정해 주세요", "규격을 정하고 데이터를 연결하면 전문 편집 작업대로 바로 이동합니다.");
    entryHeading.querySelector("strong").id = "labelSheetWorkspaceEntryTitle";
    projectPanel.append(entryHeading);
    const projectSummary = node("div", "label-sheet-workspace-project-summary");
    projectSummary.id = "labelSheetWorkspaceProjectSummary";
    append(projectSummary, node("strong", "", workspaceMode?.textContent || "새 라벨 프로젝트"), node("span", "", "설정한 규격과 입력 데이터는 자동 저장되어 다음 방문에도 이어집니다."));
    const startActions = node("div", "label-sheet-workspace-start-actions");
    const setupStartButton = proxyClick(button("1. 출력 틀 설정", "btn primary"), "labelSheetWorkspaceSettingsBtn");
    setupStartButton.id = "labelSheetWorkspaceSetupStartBtn";
    const dataButton = button("2. 데이터 가져오기", "btn secondary");
    dataButton.id = "labelSheetWorkspaceDataBtn";
    dataButton.dataset.labelWorkspaceBottomCommand = "data";
    const sampleButton = proxyClick(button("3. 샘플로 둘러보기", "btn ghost"), "labelSheetIntentSampleBtn");
    sampleButton.id = "labelSheetWorkspaceSampleBtn";
    append(startActions, setupStartButton, dataButton, sampleButton);
    const projectTips = node("div", "label-sheet-workspace-tip-list");
    [
      "출력 레이아웃과 데이터는 서로 다른 작업 화면에서 관리합니다.",
      "편집을 시작하면 선택한 항목의 핵심 속성만 오른쪽에 표시됩니다.",
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
    append(canvasMeta, node("span", "", "선택 항목을 직접 이동·정렬·크기 조정"), node("output", "", "개별 티켓"));
    canvasMeta.lastElementChild.dataset.labelWorkspaceStatus = "canvas";
    const inspectorButton = button("속성", "label-sheet-workspace-mobile-inspector-toggle");
    inspectorButton.id = "labelSheetWorkspaceInspectorBtn";
    inspectorButton.setAttribute("aria-controls", "labelSheetWorkspaceInspector");
    inspectorButton.setAttribute("aria-expanded", "false");
    append(canvasHeader, canvasViews, canvasMeta, inspectorButton);

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
    const contextSizeDown = proxyClick(button("작게", "label-sheet-workspace-context-action"), "labelSheetFocusSizeDown");
    contextSizeDown.id = "labelSheetWorkspaceContextSizeDown";
    contextSizeDown.dataset.labelWorkspaceContextSize = "";
    const contextSizeUp = proxyClick(button("크게", "label-sheet-workspace-context-action"), "labelSheetFocusSizeUp");
    contextSizeUp.id = "labelSheetWorkspaceContextSizeUp";
    contextSizeUp.dataset.labelWorkspaceContextSize = "";
    const fineTuneButton = button("더보기…", "label-sheet-workspace-fine-tune");
    fineTuneButton.id = "labelSheetWorkspaceFineTuneBtn";
    fineTuneButton.title = "이동·크기·정렬과 고급 레이아웃 열기";
    append(contextActions, contextSizeDown, contextSizeUp, fineTuneButton);
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
    append(emptyActions, proxyClick(button("샘플 채우기", "btn primary"), "labelSheetIntentSampleBtn"), proxyClick(button("데이터 열기", "btn secondary"), "labelSheetWorkspaceDataBtn"));
    emptyState.append(emptyActions);
    ticketCanvas.append(emptyState);
    append(canvasColumn, canvasHeader, contextToolbar, previewToolbar, ticketCanvas, sheetCanvas, focusStatus);

    const inspector = node("aside", "label-sheet-workspace-inspector");
    inspector.id = "labelSheetWorkspaceInspector";
    inspector.dataset.labelWorkspaceRegion = "right";
    inspector.setAttribute("aria-label", "선택 항목 속성");
    const inspectorHeader = node("div", "label-sheet-workspace-inspector-heading");
    const inspectorCloseButton = button("닫기", "label-sheet-workspace-mobile-inspector-close");
    inspectorCloseButton.setAttribute("aria-label", "속성 편집기 닫기");
    append(inspectorHeader, heading("선택 항목", "속성 편집기", "적용 범위와 출력 항목을 한곳에서 조정합니다."), inspectorCloseButton);
    const rightResizer = node("div", "label-sheet-workspace-resizer label-sheet-workspace-resizer-right");
    rightResizer.dataset.labelWorkspaceResizer = "right";
    rightResizer.setAttribute("role", "separator");
    rightResizer.setAttribute("aria-label", "속성 패널 너비 조절");
    rightResizer.tabIndex = 0;
    const inspectorActions = node("div", "label-sheet-workspace-inspector-actions");
    const commonButton = button("공통 레이아웃", "btn secondary");
    commonButton.id = "labelSheetWorkspaceCommonBtn";
    commonButton.dataset.labelWorkspaceFocusTool = "common";
    const detailButton = button("문구·QR 및 세부 설정", "btn secondary");
    detailButton.id = "labelSheetWorkspaceDetailBtn";
    detailButton.dataset.labelWorkspaceFocusTool = "detail";
    append(inspectorActions, commonButton, detailButton);
    append(inspector, rightResizer, inspectorHeader, focusHead, focusScope, focusNavigation, focusQuickPanel, inspectorActions);
    contentStep.open = true;
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
    append(mappingWorkspacePanel, heading("가져온 데이터", "열 매핑", "CSV·표 열을 ID, 번호, 이름과 출력 문구에 연결합니다."), mappingPanel);
    const validationPanel = node("section", "label-sheet-workspace-bottom-panel");
    validationPanel.dataset.labelBottomPanel = "validation";
    append(validationPanel, heading("출력 전 확인", "검증 결과", "문구 넘침, QR 충돌, 중복 번호와 배경 누락을 확인합니다."), preflightCard);
    append(bottomBody, dataPanel, mappingWorkspacePanel, validationPanel);
    append(bottom, bottomResizer, bottomHeader, bottomBody);

    const statusbar = node("footer", "label-sheet-workspace-statusbar");
    const saveState = node("span", "label-sheet-workspace-save-state", "자동 저장됨");
    saveState.id = "labelSheetWorkspaceSaveState";
    const historyState = node("span", "label-sheet-workspace-history-state", "편집 기록 준비");
    historyState.id = "labelSheetWorkspaceHistoryState";
    const workspaceState = node("span", "label-sheet-workspace-preset-state", "레이아웃 편집");
    workspaceState.id = "labelSheetWorkspacePresetState";
    append(statusbar, saveState, historyState, workspaceState, $("labelSheetStatus"), node("span", "label-sheet-workspace-shortcut-note", "Ctrl+K 명령 · Ctrl+Z 취소 · Alt+D 데이터"));

    const settingsDrawer = createDrawer("labelSheetWorkspaceSettingsDrawer", "출력 레이아웃 설정", "품목, 제작 방식, 용지 규격과 양면 배치를 데이터와 분리해 설정합니다.");
    const recoveryCard = node("section", "label-sheet-workspace-recovery-card");
    recoveryCard.id = "labelSheetWorkspaceRecoveryCard";
    const recoveryList = node("div", "label-sheet-workspace-recovery-list");
    recoveryList.id = "labelSheetWorkspaceRecoveryList";
    recoveryList.setAttribute("aria-live", "polite");
    append(recoveryCard, heading("RECOVERY", "최근 자동 저장", "최근 편집 상태를 선택해 프로젝트 전체를 복원합니다."), recoveryList);
    settingsDrawer.body.append(intentPanel, specStep, recoveryCard);
    specStep.open = true;
    const settingsDone = button("설정 닫기", "btn primary");
    settingsDone.dataset.labelWorkspaceDrawerClose = "";
    settingsDrawer.footer.append(settingsDone);

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
    const dataDone = button("레이아웃 편집으로 돌아가기", "btn primary");
    dataDone.dataset.labelWorkspaceDrawerClose = "";
    dataDrawer.footer.append(dataDone);

    const assetsDrawer = createDrawer("labelSheetWorkspaceAssetsDrawer", "배경·디자인 자산", "배경 이미지와 디자인 DNA는 필요할 때만 열어 조정합니다.");
    assetsDrawer.body.append(assetsPanel);
    const assetsDone = button("적용하고 돌아가기", "btn primary");
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
    const reviewDone = button("작업대로 돌아가기", "btn secondary");
    reviewDone.dataset.labelWorkspaceDrawerClose = "";
    reviewDrawer.footer.append(reviewDone);

    const detailDrawer = createDrawer("labelSheetWorkspaceDetailDrawer", "선택 항목 세부 편집", "고급 레이아웃, 프리셋, 면별 문구와 QR 설정은 필요할 때만 조정합니다.");
    detailDrawer.drawer.dataset.detailView = "content";
    const detailViewTabs = node("div", "label-sheet-workspace-detail-tabs");
    detailViewTabs.setAttribute("role", "tablist");
    detailViewTabs.setAttribute("aria-label", "세부 편집 범주");
    const detailGrid = node("div", "label-sheet-workspace-detail-grid");
    const layoutDetail = node("section", "label-sheet-workspace-detail-section");
    layoutDetail.id = "labelSheetWorkspaceDetailLayout";
    layoutDetail.dataset.labelWorkspaceDetailPanel = "layout";
    const precisionTools = node("section", "label-sheet-workspace-precision-tools");
    append(precisionTools, heading("POSITION", "정밀 배치", "이동·크기·정렬은 필요할 때만 사용합니다."), focusShortcutActions, focusShortcutHelp);
    append(layoutDetail, heading("LAYOUT", "레이아웃과 프리셋", "현재 선택 항목 또는 현재 면 공통 배치를 조정합니다."), focusToolTabs, focusCommonPanel, focusDetailPanel, precisionTools);
    const contentDetail = node("section", "label-sheet-workspace-detail-section label-sheet-workspace-content-detail");
    contentDetail.id = "labelSheetWorkspaceDetailContent";
    contentDetail.dataset.labelWorkspaceDetailPanel = "content";
    append(contentDetail, heading("CONTENT", "문구와 QR", "면별 출력 문구와 QR 합성 방식을 설정합니다."), contentStep);
    const advancedDetail = node("section", "label-sheet-workspace-detail-section label-sheet-workspace-advanced-detail");
    advancedDetail.id = "labelSheetWorkspaceDetailAdvanced";
    advancedDetail.dataset.labelWorkspaceDetailPanel = "advanced";
    append(advancedDetail, heading("ADVANCED", "QR·고급", "QR 합성과 공통 출력 규칙을 필요할 때만 펼쳐 조정합니다."));
    const qrSection = contentStep.querySelector("#labelSheetQrSection");
    if (qrSection) advancedDetail.append(qrSection);
    const detailViews = [
      ["content", "내용", contentDetail],
      ["layout", "배치", layoutDetail],
      ["advanced", "QR·고급", advancedDetail],
    ];
    detailViews.forEach(([value, label, panel], index) => {
      const control = button(label, "label-sheet-workspace-detail-tab");
      control.id = `labelSheetWorkspaceDetail${value[0].toUpperCase()}${value.slice(1)}Tab`;
      control.dataset.labelWorkspaceDetailView = value;
      control.setAttribute("role", "tab");
      control.setAttribute("aria-controls", panel.id);
      control.setAttribute("aria-selected", String(index === 0));
      control.tabIndex = index === 0 ? 0 : -1;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", control.id);
      detailViewTabs.append(control);
    });
    append(detailGrid, contentDetail, layoutDetail, advancedDetail);
    detailDrawer.body.append(detailViewTabs, detailGrid);
    const detailDone = button("편집기로 돌아가기", "btn primary");
    detailDone.dataset.labelWorkspaceDrawerClose = "";
    detailDrawer.footer.append(detailDone);

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
    const commandClose = button("닫기", "label-sheet-workspace-command-close");
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
    const undoToastAction = button("실행 취소", "label-sheet-workspace-undo-toast-action");
    undoToastAction.id = "labelSheetWorkspaceUndoToastAction";
    const undoToastClose = button("닫기", "label-sheet-workspace-undo-toast-close");
    undoToastClose.id = "labelSheetWorkspaceUndoToastClose";
    undoToastClose.setAttribute("aria-label", "변경 알림 닫기");
    append(undoToast, undoToastMessage, undoToastAction, undoToastClose);

    if (resultCard.contains(previewToolbar)) previewToolbar.remove();
    if (resultCard.contains(focusEditor)) focusEditor.remove();
    if (resultCard.contains(pagePreview)) pagePreview.remove();
    if (resultCard.contains(preflightCard)) preflightCard.remove();
    if (dnaDialog?.parentElement) dnaDialog.remove();
    hero?.remove();

    shell.replaceChildren(topbar, entry, frame, statusbar, left, panelHost, settingsDrawer.drawer, dataDrawer.drawer, assetsDrawer.drawer, reviewDrawer.drawer, detailDrawer.drawer, commandPalette, undoToast);
    if (dnaDialog) shell.append(dnaDialog);

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
    $("labelSheetGeneratePromptBtn")?.addEventListener("click", () => {
      window.setTimeout(() => {
        if (pane.dataset.outputGoal === "prompt" && settingsDrawer.drawer.hidden && reviewDrawer.drawer.hidden) reviewButton.click();
      }, 0);
    });
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

    const reviewModeQuery = window.matchMedia("(min-width: 861px)");
    const syncReviewAdvanced = () => { reviewAdvanced.open = reviewModeQuery.matches; };
    reviewModeQuery.addEventListener?.("change", syncReviewAdvanced);
    syncReviewAdvanced();

    bindWorkspaceSync({ entry, frame, statusbar, projectSummary, recordList, emptyState, bottomStatus, specSummary, goalSwitch, canvasViews, preflightCard });
    pane.dataset.labelWorkspaceLayoutReady = "true";
    window.dispatchEvent(new CustomEvent("promptdeck:label-workspace-layout-ready", { detail: { version: 7 } }));
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
    const panel = node("div", "label-sheet-workspace-drawer-panel");
    panel.dataset.labelWorkspaceDrawerPanel = "";
    const header = node("header", "label-sheet-workspace-drawer-header");
    const close = button("닫기", "btn ghost label-sheet-compact-btn");
    close.dataset.labelWorkspaceDrawerClose = "";
    close.setAttribute("aria-label", `${title} 닫기`);
    const titleBlock = heading("LABEL & TICKET", title, description);
    const titleId = `${id}Title`;
    const descriptionId = `${id}Description`;
    titleBlock.querySelector("strong").id = titleId;
    titleBlock.querySelector("small").id = descriptionId;
    drawer.setAttribute("aria-labelledby", titleId);
    drawer.setAttribute("aria-describedby", descriptionId);
    append(header, titleBlock, close);
    const body = node("div", "label-sheet-workspace-drawer-body");
    const footer = node("footer", "label-sheet-workspace-drawer-footer");
    append(panel, header, body, footer);
    drawer.append(panel);
    return { drawer, body, footer };
  }

  function bindWorkspaceSync(context) {
    const tableBody = $("labelSheetRecordTableBody");
    const modeOutput = $("labelSheetWorkspaceMode");
    const preflight = context.preflightCard?.querySelector("#labelSheetPreflight");
    const updateGoal = () => {
      const goal = pane.dataset.outputGoal === "prompt" ? "prompt" : "print";
      context.goalSwitch.querySelectorAll("[data-label-workspace-goal]").forEach((control) => {
        const active = control.dataset.labelWorkspaceGoal === goal;
        control.classList.toggle("is-active", active);
        control.setAttribute("aria-pressed", String(active));
      });
      if (goal === "prompt") {
        context.canvasViews.querySelector('[data-label-canvas-view="sheet"]')?.click();
      }
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
      renderRecordList(records, context.recordList);
      syncLayerSelection();
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
  }

  try {
    buildWorkspace();
  } catch (error) {
    pane.classList.remove("label-sheet-workspace-v2");
    pane.dataset.labelWorkspaceLayoutError = error.message || "unknown";
    console.error("Label-sheet workspace V2 layout failed", error);
  }
})();
