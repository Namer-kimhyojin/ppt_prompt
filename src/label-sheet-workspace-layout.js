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

    pane.classList.add("label-sheet-workspace-v2");
    pane.dataset.workspaceTool = "project";
    pane.dataset.activeTool = "project";
    pane.dataset.canvasView = pane.dataset.outputGoal === "prompt" ? "sheet" : "ticket";
    pane.dataset.bottomTab = "data";

    const topbar = node("header", "label-sheet-workspace-topbar");
    const brand = node("div", "label-sheet-workspace-brand");
    const mark = node("span", "label-sheet-workspace-mark", "LT");
    mark.setAttribute("aria-hidden", "true");
    const brandCopy = node("div", "label-sheet-workspace-brand-copy");
    append(brandCopy, node("span", "label-sheet-workspace-eyebrow", "LABEL & TICKET STUDIO"), node("h2", "", "라벨·티켓 스튜디오"));
    if (workspaceMode) brandCopy.append(workspaceMode);
    append(brand, mark, brandCopy);

    const topbarCenter = node("div", "label-sheet-workspace-topbar-center");
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
    append(topbarCenter, goalSwitch, specSummary);

    const topbarActions = node("div", "label-sheet-workspace-topbar-actions");
    const settingsButton = button("프로젝트 설정");
    settingsButton.id = "labelSheetWorkspaceSettingsBtn";
    settingsButton.dataset.labelWorkspaceDrawer = "settings";
    const reviewButton = button("검토·내보내기", "btn primary label-sheet-compact-btn");
    reviewButton.id = "labelSheetWorkspaceReviewBtn";
    reviewButton.dataset.labelWorkspaceDrawer = "review";
    const actionHost = node("div", "label-sheet-workspace-actions");
    if (tabActions) actionHost.append(tabActions);
    append(topbarActions, actionHost, settingsButton, reviewButton);
    append(topbar, brand, topbarCenter, topbarActions);

    const frame = node("div", "label-sheet-workspace-frame");
    const left = node("aside", "label-sheet-workspace-left");
    left.dataset.labelWorkspaceRegion = "left";
    left.setAttribute("aria-label", "라벨 작업 도구");
    const toolrail = node("nav", "label-sheet-workspace-toolrail");
    toolrail.setAttribute("aria-label", "작업 도구 선택");
    const toolDefinitions = [
      ["project", "프로젝트", "설정과 시작", "◫"],
      ["records", "레코드", "티켓 목록", "≡"],
      ["layers", "레이어", "출력 항목", "◉"],
      ["assets", "자산", "배경 이미지", "◇"],
    ];
    toolDefinitions.forEach(([value, label, title, icon], index) => {
      const control = button("", "label-sheet-workspace-tool");
      control.dataset.labelWorkspaceTool = value;
      control.title = title;
      control.setAttribute("aria-label", label);
      control.classList.toggle("is-active", index === 0);
      control.setAttribute("aria-selected", String(index === 0));
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
    const mobileToolHeader = node("div", "label-sheet-workspace-mobile-tool-header");
    const mobileToolTitle = node("strong", "", "작업 도구");
    const mobileToolClose = button("캔버스로 돌아가기", "label-sheet-workspace-mobile-tool-close");
    mobileToolClose.id = "labelSheetWorkspaceToolPanelClose";
    mobileToolClose.setAttribute("aria-label", "작업 도구 패널 닫기");
    append(mobileToolHeader, mobileToolTitle, mobileToolClose);
    const projectPanel = node("section", "label-sheet-workspace-panel is-active");
    projectPanel.dataset.labelWorkspacePanel = "project";
    append(projectPanel, heading("빠른 시작", "프로젝트", "순서 없이 데이터와 디자인을 바로 시작할 수 있습니다."));
    const projectSummary = node("div", "label-sheet-workspace-project-summary");
    projectSummary.id = "labelSheetWorkspaceProjectSummary";
    append(projectSummary, node("strong", "", workspaceMode?.textContent || "새 라벨 프로젝트"), node("span", "", "규격과 데이터를 선택하면 즉시 캔버스에 반영됩니다."));
    const startActions = node("div", "label-sheet-workspace-start-actions");
    const sampleButton = proxyClick(button("샘플로 시작", "btn primary"), "labelSheetIntentSampleBtn");
    sampleButton.id = "labelSheetWorkspaceSampleBtn";
    const dataButton = button("데이터 가져오기", "btn secondary");
    dataButton.id = "labelSheetWorkspaceDataBtn";
    const blankButton = proxyClick(button("빈 프로젝트", "btn ghost"), "labelSheetResetBtn");
    append(startActions, sampleButton, dataButton, blankButton);
    const projectTips = node("div", "label-sheet-workspace-tip-list");
    [
      "데이터를 수정하면 캔버스가 즉시 갱신됩니다.",
      "규격과 양면 설정은 언제든 변경할 수 있습니다.",
      "오류는 검증 패널에서 해당 항목으로 바로 확인합니다.",
    ].forEach((copy) => projectTips.append(node("p", "", copy)));
    append(projectPanel, projectSummary, startActions, projectTips);

    const recordsPanel = node("section", "label-sheet-workspace-panel");
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

    const assetsPanel = node("section", "label-sheet-workspace-panel label-sheet-workspace-assets-panel");
    assetsPanel.dataset.labelWorkspacePanel = "assets";
    append(assetsPanel, heading("디자인 자산", "배경·DNA", "배경을 등록하거나 이미지 프롬프트의 시각 규칙을 선택합니다."));
    backgroundStep.open = true;
    assetsPanel.append(backgroundStep);
    append(panelHost, mobileToolHeader, projectPanel, recordsPanel, layersPanel, assetsPanel);
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
    const ticketCanvas = node("section", "label-sheet-workspace-canvas-panel label-sheet-workspace-ticket-canvas");
    ticketCanvas.dataset.labelCanvasPanel = "ticket";
    const sheetCanvas = node("section", "label-sheet-workspace-canvas-panel label-sheet-workspace-sheet-canvas");
    sheetCanvas.dataset.labelCanvasPanel = "sheet";
    if (focusStage) ticketCanvas.append(focusStage);
    append(sheetCanvas, pageOverview, pagePreview);

    const emptyState = node("div", "label-sheet-workspace-empty");
    emptyState.id = "labelSheetWorkspaceEmpty";
    append(emptyState, node("span", "label-sheet-workspace-empty-icon", "＋"), node("strong", "", "첫 티켓을 만들어 보세요"), node("p", "", "샘플을 채우거나 표·CSV 데이터를 가져오면 바로 편집할 수 있습니다."));
    const emptyActions = node("div", "label-sheet-workspace-empty-actions");
    append(emptyActions, proxyClick(button("샘플 채우기", "btn primary"), "labelSheetIntentSampleBtn"), proxyClick(button("데이터 열기", "btn secondary"), "labelSheetWorkspaceDataBtn"));
    emptyState.append(emptyActions);
    ticketCanvas.append(emptyState);
    append(canvasColumn, canvasHeader, previewToolbar, ticketCanvas, sheetCanvas, focusStatus);

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
    append(inspector, rightResizer, inspectorHeader, focusHead, focusScope, focusNavigation, focusTooldeck);
    contentStep.open = true;
    inspector.append(contentStep);
    focusEditor.classList.add("label-sheet-workspace-editor");
    focusEditor.hidden = false;
    focusEditor.replaceChildren(canvasColumn, inspector);
    append(stage, focusEditor);
    append(frame, left, leftResizer, stage);

    const bottom = node("section", "label-sheet-workspace-bottom");
    bottom.dataset.labelWorkspaceRegion = "bottom";
    const bottomResizer = node("div", "label-sheet-workspace-bottom-resizer");
    bottomResizer.dataset.labelWorkspaceResizer = "bottom";
    bottomResizer.setAttribute("role", "separator");
    bottomResizer.setAttribute("aria-label", "데이터 시트 높이 조절");
    bottomResizer.tabIndex = 0;
    const bottomHeader = node("header", "label-sheet-workspace-bottom-header");
    const bottomTabs = node("div", "label-sheet-workspace-bottom-tabs");
    [["data", "데이터"], ["mapping", "열 매핑"], ["validation", "검증"]].forEach(([value, label], index) => {
      const control = button(label, "label-sheet-workspace-bottom-tab");
      control.dataset.labelBottomTab = value;
      control.classList.toggle("is-active", index === 0);
      control.setAttribute("aria-selected", String(index === 0));
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
    append(statusbar, node("span", "label-sheet-workspace-save-state", "자동 저장"), $("labelSheetStatus"), node("span", "label-sheet-workspace-shortcut-note", "1~7 항목 · [ ] 크기 · Alt+방향 이동 · L/C/R 정렬"));

    const settingsDrawer = createDrawer("labelSheetWorkspaceSettingsDrawer", "프로젝트 설정", "품목, 제작 방식, 규격과 양면 설정은 언제든 변경할 수 있습니다.");
    settingsDrawer.body.append(intentPanel, specStep);
    specStep.open = true;
    const settingsDone = button("설정 닫기", "btn primary");
    settingsDone.dataset.labelWorkspaceDrawerClose = "";
    settingsDrawer.footer.append(settingsDone);

    const reviewDrawer = createDrawer("labelSheetWorkspaceReviewDrawer", "검토·내보내기", "오류를 확인한 뒤 PNG·PDF·인쇄 또는 프롬프트 결과를 내보냅니다.");
    reviewDrawer.body.append(resultCard);
    const reviewDone = button("작업대로 돌아가기", "btn secondary");
    reviewDone.dataset.labelWorkspaceDrawerClose = "";
    reviewDrawer.footer.append(reviewDone);

    if (resultCard.contains(previewToolbar)) previewToolbar.remove();
    if (resultCard.contains(focusEditor)) focusEditor.remove();
    if (resultCard.contains(pagePreview)) pagePreview.remove();
    if (resultCard.contains(preflightCard)) preflightCard.remove();
    if (dnaDialog?.parentElement) dnaDialog.remove();
    hero?.remove();

    shell.replaceChildren(topbar, frame, bottom, statusbar, settingsDrawer.drawer, reviewDrawer.drawer);
    if (dnaDialog) shell.append(dnaDialog);

    bindWorkspaceViewport();

    specSummary.addEventListener("click", () => settingsButton.click());
    dataButton.addEventListener("click", () => {
      pane.querySelector('[data-label-bottom-tab="data"]')?.click();
      if (pane.classList.contains("is-bottom-collapsed")) bottomToggle.click();
      $("labelSheetDataDirectTab")?.focus({ preventScroll: true });
    });
    const setMobileInspector = (open) => {
      pane.classList.toggle("is-mobile-inspector-open", open);
      inspectorButton.setAttribute("aria-expanded", String(open));
      if (open) inspectorCloseButton.focus({ preventScroll: true });
      else inspectorButton.focus({ preventScroll: true });
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
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) pane.classList.remove("is-mobile-inspector-open");
    }, { passive: true });

    bindWorkspaceSync({ projectSummary, recordList, emptyState, bottomStatus, specSummary, goalSwitch, canvasViews });
    pane.dataset.labelWorkspaceLayoutReady = "true";
    window.dispatchEvent(new CustomEvent("promptdeck:label-workspace-layout-ready", { detail: { version: 2 } }));
  }

  function bindWorkspaceViewport() {
    const sync = () => {
      if (!pane.classList.contains("active")) return;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const viewportTop = Math.max(0, pane.getBoundingClientRect().top);
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
    const header = node("header", "label-sheet-workspace-drawer-header");
    const close = button("닫기", "btn ghost label-sheet-compact-btn");
    close.dataset.labelWorkspaceDrawerClose = "";
    close.setAttribute("aria-label", `${title} 닫기`);
    append(header, heading("LABEL & TICKET", title, description), close);
    const body = node("div", "label-sheet-workspace-drawer-body");
    const footer = node("footer", "label-sheet-workspace-drawer-footer");
    append(panel, header, body, footer);
    drawer.append(panel);
    return { drawer, body, footer };
  }

  function bindWorkspaceSync(context) {
    const tableBody = $("labelSheetRecordTableBody");
    const modeOutput = $("labelSheetWorkspaceMode");
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
      context.emptyState.hidden = count > 0;
      context.bottomStatus.textContent = `데이터 ${count}건`;
      const strong = context.projectSummary.querySelector("strong");
      if (strong) strong.textContent = modeOutput?.textContent || `${count}건 프로젝트`;
      const cell = $("labelSheetCellSize")?.textContent?.trim();
      const capacity = $("labelSheetCapacity")?.textContent?.trim();
      context.specSummary.textContent = cell && cell !== "—" ? `${cell} · ${capacity || "규격"}` : "규격 확인";
      renderRecordList(records, context.recordList);
      syncLayerSelection();
    };

    new MutationObserver(updateGoal).observe(pane, { attributes: true, attributeFilter: ["data-output-goal"] });
    if (tableBody) new MutationObserver(updateSummary).observe(tableBody, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "value", "checked"] });
    if (modeOutput) new MutationObserver(updateSummary).observe(modeOutput, { childList: true, subtree: true, characterData: true });
    pane.addEventListener("input", (event) => {
      if (event.target.closest("#labelSheetRecordTable")) window.requestAnimationFrame(updateSummary);
    });
    pane.addEventListener("click", (event) => {
      if (event.target.closest("[data-label-sheet-focus-target]")) window.requestAnimationFrame(syncLayerSelection);
    });
    window.addEventListener("promptdeck:label-sheet-goal-change", updateGoal);
    window.addEventListener("promptdeck:label-workspace-change", (event) => {
      if (event.detail?.kind === "canvas-view") context.canvasViews.dataset.activeView = event.detail.value;
    });
    updateGoal();
    updateSummary();
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
    pane.querySelectorAll("[data-label-workspace-layer]").forEach((control) => {
      const active = control.dataset.labelWorkspaceLayer === activeTarget;
      control.classList.toggle("is-active", active);
      control.setAttribute("aria-pressed", String(active));
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
