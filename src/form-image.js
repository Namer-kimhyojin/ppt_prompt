(function () {
  const TARGETS = {
    cover: { label: "표지", strength: "strong" },
    divider: { label: "간지", strength: "medium" },
    background: { label: "배경", strength: "subtle" },
    signboard: { label: "안내판", strength: "balanced" },
    closing: { label: "맺음말", strength: "medium" },
  };

  const CLOSING_TYPES = {
    thanks: { label: "감사합니다", main: "감사합니다", sub: "" },
    thanks_listen: { label: "경청 감사", main: "경청해주셔서 감사합니다", sub: "" },
    qna: { label: "질의응답", main: "Q&A", sub: "질의응답" },
    qna_thanks: { label: "Q&A + 감사", main: "Q&A", sub: "경청해주셔서 감사합니다" },
    custom: { label: "직접 입력", main: "", sub: "" },
  };

  const CLOSING_TYPE_GUIDES = {
    thanks: {
      title: "감사 인사 중심",
      desc: "간결한 감사 문구를 크게 배치하고 기관 정보는 작게 정리합니다.",
      mainLabel: "메인 감사 문구",
      subLabel: "보조 문구",
      mainPlaceholder: "예: 감사합니다",
      subPlaceholder: "예: 함께해주셔서 감사합니다",
      mainSample: "감사합니다",
      subSample: "함께해주셔서 감사합니다",
    },
    thanks_listen: {
      title: "경청 감사 중심",
      desc: "발표 종료 화면에 어울리도록 경청 감사 문구를 안정적으로 배치합니다.",
      mainLabel: "메인 감사 문구",
      subLabel: "보조 문구",
      mainPlaceholder: "예: 경청해주셔서 감사합니다",
      subPlaceholder: "예: 더 나은 성과로 보답하겠습니다",
      mainSample: "경청해주셔서 감사합니다",
      subSample: "더 나은 성과로 보답하겠습니다",
    },
    qna: {
      title: "질의응답 중심",
      desc: "Q&A를 가장 크게 보여주고, 보조 문구와 연락 정보는 낮은 위계로 정리합니다.",
      mainLabel: "Q&A 메인 문구",
      subLabel: "질문 안내 문구",
      mainPlaceholder: "예: Q&A",
      subPlaceholder: "예: 질문을 받겠습니다",
      mainSample: "Q&A",
      subSample: "질문을 받겠습니다",
    },
    qna_thanks: {
      title: "Q&A + 감사 조합",
      desc: "Q&A와 감사 인사를 함께 보여주되, 한 화면 안에서 과밀하지 않게 구성합니다.",
      mainLabel: "Q&A 메인 문구",
      subLabel: "감사 보조 문구",
      mainPlaceholder: "예: Q&A",
      subPlaceholder: "예: 경청해주셔서 감사합니다",
      mainSample: "Q&A",
      subSample: "경청해주셔서 감사합니다",
    },
    custom: {
      title: "직접 입력",
      desc: "사용자가 입력한 문구를 그대로 중심 메시지로 사용합니다. 비워두면 공통 제목/부제목만 사용됩니다.",
      mainLabel: "직접 입력 메인 문구",
      subLabel: "직접 입력 보조 문구",
      mainPlaceholder: "예: 함께 만들어갈 내일",
      subPlaceholder: "예: 문의는 전략기획팀으로 연락해 주세요",
      mainSample: "함께 만들어갈 내일",
      subSample: "문의는 전략기획팀으로 연락해 주세요",
    },
  };

  const STRENGTH_LABELS = {
    subtle: "낮음",
    medium: "균형",
    balanced: "균형",
    strong: "강함",
  };

  const TARGET_PROMPT_LABELS = {
    cover: "cover",
    divider: "section divider",
    background: "editable background",
    signboard: "guidance signboard",
    closing: "closing page",
  };

  const STRENGTH_PROMPT_LABELS = {
    subtle: "subtle",
    medium: "balanced",
    balanced: "balanced",
    strong: "strong",
  };

  const CLOSING_PROMPT_TYPES = {
    thanks: "thank-you closing",
    thanks_listen: "thank-you-for-listening closing",
    qna: "Q&A closing",
    qna_thanks: "Q&A plus thank-you closing",
    custom: "custom closing",
  };

  const LIST_VALUE_KEYS = new Set([
    "dividerKeywords",
    "sponsor",
    "partner",
    "signboardInfo",
    "blockNote",
    "processItems",
    "programSchedule",
    "backgroundAvoid",
    "extraNotes",
  ]);

  const state = {
    mode: "single",
    targetType: "cover",
    resultTarget: "cover",
    sampleCursor: {},
    title: "",
    subtitle: "",
    organization: "",
    department: "",
    date: "",
    presenter: "",
    host: "",
    organizer: "",
    sponsor: "",
    partner: "",
    canvasRatio: "wide_16_9",
    canvasCustomRatio: "",
    rolePlacement: "auto",
    roleDisplayMode: "plain",
    coverTitlePlacement: "ai",
    coverVisualPosition: "ai",
    dividerNo: "",
    dividerKeywords: "",
    dividerStrength: "medium",
    dividerNumberStyle: "ai",
    dividerLayout: "ai",
    backgroundSafeArea: "center",
    backgroundDecoration: "edge",
    backgroundDensity: "very_low",
    backgroundBrightness: "bright",
    backgroundContent: "text",
    backgroundAvoid: "",
    toneMemo: "",
    mustKeep: "",
    avoidNotes: "",
    extraNotes: "",
    signboardPurpose: "location",
    signboardStructure: "blocks",
    signboardHierarchy: "title",
    signboardEnvironment: "indoor",
    signboardInfo: "",
    blockPrimary: "",
    blockSecondary: "",
    blockTertiary: "",
    blockNote: "",
    qrEnabled: false,
    qrUrl: "",
    qrSize: "medium",
    qrCaption: "",
    qrPosition: "auto",
    qrEmphasis: false,
    farRead: false,
    directionDestination: "",
    directionArrow: "ai",
    directionDistance: "",
    directionEmphasis: "strong",
    processTitle: "",
    processSteps: "3",
    processItems: "",
    processAfter: "",
    programName: "",
    programDatePlace: "",
    programSchedule: "",
    programSpeaker: "",
    noticeType: "caution",
    noticeTone: "official",
    noticeHeadline: "",
    noticeDetail: "",
    closingType: "thanks",
    closingMainText: "",
    closingSubText: "",
    closingContact: "",
    closingEmail: "",
    closingWebsite: "",
    closingQrEnabled: false,
    closingQrUrl: "",
    closingQrSize: "medium",
    closingQrCaption: "",
    closingQrPosition: "auto",
    closingQrEmphasis: false,
    closingTone: "calm",
    mixerStyle: null,
    textVisibility: {},
    strengths: {
      cover: "strong",
      divider: "medium",
      background: "subtle",
      signboard: "balanced",
      closing: "medium",
    },
    outputs: {
      cover: "",
      divider: "",
      background: "",
      signboard: "",
      closing: "",
    },
  };
  let skipNextFieldChangePreview = false;
  let sectionEditOpen = false;

  const TEXT_FIELD_LABELS = {
    formImageTitle: { key: "title", label: "Title" },
    formImageSubtitle: { key: "subtitle", label: "Subtitle" },
    formImageOrganization: { key: "organization", label: "Organization" },
    formImageDepartment: { key: "department", label: "Department" },
    formImageDate: { key: "date", label: "Date" },
    formImagePresenter: { key: "presenter", label: "Presenter" },
    formImageHost: { key: "host", label: "Host" },
    formImageOrganizer: { key: "organizer", label: "Organizer" },
    formImageSponsor: { key: "sponsor", label: "Sponsor" },
    formImagePartner: { key: "partner", label: "Partner" },
    formImageDividerNo: { key: "dividerNo", label: "Section number" },
    formImageDividerKeywords: { key: "dividerKeywords", label: "Section keywords" },
    formImageSignboardInfo: { key: "signboardInfo", label: "Signboard information" },
    formImageBlockPrimary: { key: "blockPrimary", label: "Primary block" },
    formImageBlockSecondary: { key: "blockSecondary", label: "Secondary block" },
    formImageBlockTertiary: { key: "blockTertiary", label: "Tertiary block" },
    formImageBlockNote: { key: "blockNote", label: "Block note" },
    formImageQrCaption: { key: "qrCaption", label: "QR caption" },
    formImageDirectionDestination: { key: "directionDestination", label: "Destination" },
    formImageDirectionDistance: { key: "directionDistance", label: "Distance or time" },
    formImageProcessTitle: { key: "processTitle", label: "Process title" },
    formImageProcessItems: { key: "processItems", label: "Process steps" },
    formImageProcessAfter: { key: "processAfter", label: "After-process guidance" },
    formImageProgramName: { key: "programName", label: "Program name" },
    formImageProgramDatePlace: { key: "programDatePlace", label: "Program date/place" },
    formImageProgramSchedule: { key: "programSchedule", label: "Program schedule" },
    formImageProgramSpeaker: { key: "programSpeaker", label: "Program speaker" },
    formImageNoticeHeadline: { key: "noticeHeadline", label: "Notice headline" },
    formImageNoticeDetail: { key: "noticeDetail", label: "Notice detail" },
    formImageClosingContact: { key: "closingContact", label: "Contact" },
    formImageClosingEmail: { key: "closingEmail", label: "Email" },
    formImageClosingWebsite: { key: "closingWebsite", label: "Website" },
    formImageClosingMainText: { key: "closingMainText", label: "Closing main message" },
    formImageClosingSubText: { key: "closingSubText", label: "Closing supporting message" },
    formImageClosingQrCaption: { key: "closingQrCaption", label: "Closing QR caption" },
  };

  const TOGGLE_KEY_TO_FIELD_ID = Object.fromEntries(
    Object.entries(TEXT_FIELD_LABELS).map(([id, config]) => [config.key, id])
  );

  const CANVAS_RATIO = {
    wide_16_9: "16:9 widescreen presentation canvas",
    a4_portrait: "A4 portrait document canvas",
    a4_landscape: "A4 landscape document canvas",
    square: "1:1 square canvas",
    vertical: "vertical portrait canvas",
    custom: "custom canvas ratio",
    auto: "choose the best aspect ratio for the selected form type",
  };

  const ROLE_PLACEMENT = {
    auto: "choose the best integrated placement for organization role text",
    top: "place organization role text in the top area",
    bottom: "place organization role text in the bottom area",
    left: "left-align organization role text",
    right: "right-align organization role text",
    distributed: "distribute host/organizer and sponsor/partner groups across left and right areas",
    integrated: "integrate organization role text naturally inside the information flow",
  };

  const ROLE_DISPLAY_MODE = {
    plain: "render participant organization names as simple text only",
    subtle: "render participant organization names smaller and more subtly than the main document title",
    transparent: "reserve blank layout space matching the size and placement of participant organization names, but render zero ink there — no faint ghost text, no watermark-style translucency, just empty background",
  };

  const SIGNBOARD_ENVIRONMENT = {
    indoor: "indoor wayfinding or venue guidance",
    outdoor: "outdoor signboard with stronger contrast and simpler information groups",
    digital: "digital signage screen with clean pixel-safe spacing",
    print: "printed signboard or notice with safe margins and clear hierarchy",
    slide: "presentation slide used as a guidance-sign style screen",
  };

  const CLOSING_TONE = {
    calm: "calm and composed",
    official: "official and institutional",
    warm: "warm and appreciative",
    minimal: "minimal and spacious",
    qna: "Q&A-centered with clear audience attention",
  };

  const $ = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setStatus(message, type = "") {
    const el = $("formImageStatus");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("is-ok", type === "ok");
    el.classList.toggle("is-error", type === "error");
  }

  function composeExtraNotes(mustKeep, avoidNotes, legacyNotes = "") {
    return [
      mustKeep ? `Must keep: ${mustKeep}` : "",
      avoidNotes ? `Avoid: ${avoidNotes}` : "",
      legacyNotes && !mustKeep && !avoidNotes ? legacyNotes : "",
    ].filter(Boolean).join("\n");
  }

  function updateStyleStateBadge() {
    const badge = $("formImageStyleStateBadge");
    if (!badge) return;
    const hasMixer = Boolean(state.mixerStyle);
    const hasDirection = Boolean(state.toneMemo || state.mustKeep || state.avoidNotes || state.extraNotes);
    badge.textContent = hasMixer ? "비주얼 스타일 적용됨" : hasDirection ? "스타일 방향 입력됨" : "스타일 미적용";
    badge.classList.toggle("is-ready", hasMixer || hasDirection);
  }

  function activeTargets() {
    return [state.targetType];
  }

  function syncStateFromInputs() {
    state.title = $("formImageTitle")?.value?.trim() || "";
    state.subtitle = $("formImageSubtitle")?.value?.trim() || "";
    state.organization = $("formImageOrganization")?.value?.trim() || "";
    state.department = $("formImageDepartment")?.value?.trim() || "";
    state.date = $("formImageDate")?.value?.trim() || "";
    state.presenter = $("formImagePresenter")?.value?.trim() || "";
    state.host = $("formImageHost")?.value?.trim() || "";
    state.organizer = $("formImageOrganizer")?.value?.trim() || "";
    state.sponsor = $("formImageSponsor")?.value?.trim() || "";
    state.partner = $("formImagePartner")?.value?.trim() || "";
    state.canvasRatio = $("formImageCanvasRatio")?.value || "wide_16_9";
    state.canvasCustomRatio = $("formImageCanvasCustomRatio")?.value?.trim() || "";
    state.rolePlacement = $("formImageRolePlacement")?.value || "auto";
    state.roleDisplayMode = $("formImageRoleDisplayMode")?.value || "plain";
    state.coverTitlePlacement = $("formImageCoverTitlePlacement")?.value || "ai";
    state.coverVisualPosition = $("formImageCoverVisualPosition")?.value || "ai";
    state.dividerNo = $("formImageDividerNo")?.value?.trim() || "";
    state.dividerKeywords = $("formImageDividerKeywords")?.value?.trim() || "";
    state.dividerStrength = $("formImageDividerStrength")?.value || "medium";
    state.dividerNumberStyle = $("formImageDividerNumberStyle")?.value || "ai";
    state.dividerLayout = $("formImageDividerLayout")?.value || "ai";
    state.backgroundSafeArea = $("formImageBackgroundSafeArea")?.value || "center";
    state.backgroundDecoration = $("formImageBackgroundDecoration")?.value || "edge";
    state.backgroundDensity = $("formImageBackgroundDensity")?.value || "very_low";
    state.backgroundBrightness = $("formImageBackgroundBrightness")?.value || "bright";
    state.backgroundContent = $("formImageBackgroundContent")?.value || "text";
    state.backgroundAvoid = $("formImageBackgroundAvoid")?.value?.trim() || "";
    state.toneMemo = $("formImageToneMemo")?.value?.trim() || "";
    state.mustKeep = $("formImageMustKeep")?.value?.trim() || "";
    state.avoidNotes = $("formImageAvoidNotes")?.value?.trim() || "";
    state.extraNotes = composeExtraNotes(state.mustKeep, state.avoidNotes, $("formImageExtraNotes")?.value?.trim() || "");
    if ($("formImageExtraNotes")) $("formImageExtraNotes").value = state.extraNotes;
    updateStyleStateBadge();
    state.signboardPurpose = $("formImageSignboardPurpose")?.value || "location";
    state.signboardStructure = SIGNBOARD_PURPOSE_DEFAULT_STRUCTURE[state.signboardPurpose] || "blocks";
    state.signboardHierarchy = $("formImageSignboardHierarchy")?.value || "title";
    state.signboardEnvironment = $("formImageSignboardEnvironment")?.value || "indoor";
    state.signboardInfo = $("formImageSignboardInfo")?.value?.trim() || "";
    state.blockPrimary = $("formImageBlockPrimary")?.value?.trim() || "";
    state.blockSecondary = $("formImageBlockSecondary")?.value?.trim() || "";
    state.blockTertiary = $("formImageBlockTertiary")?.value?.trim() || "";
    state.blockNote = $("formImageBlockNote")?.value?.trim() || "";
    state.qrEnabled = Boolean($("formImageQrEnabled")?.checked);
    state.qrUrl = $("formImageQrUrl")?.value?.trim() || "";
    state.qrSize = $("formImageQrSize")?.value || "medium";
    state.qrCaption = $("formImageQrCaption")?.value?.trim() || "";
    state.qrPosition = $("formImageQrPosition")?.value || "auto";
    state.qrEmphasis = Boolean($("formImageQrEmphasis")?.checked);
    state.farRead = Boolean($("formImageFarRead")?.checked);
    state.directionDestination = $("formImageDirectionDestination")?.value?.trim() || "";
    state.directionArrow = $("formImageDirectionArrow")?.value || "ai";
    state.directionDistance = $("formImageDirectionDistance")?.value?.trim() || "";
    state.directionEmphasis = $("formImageDirectionEmphasis")?.value || "strong";
    state.processTitle = $("formImageProcessTitle")?.value?.trim() || "";
    state.processSteps = $("formImageProcessSteps")?.value || "3";
    state.processItems = $("formImageProcessItems")?.value?.trim() || "";
    state.processAfter = $("formImageProcessAfter")?.value?.trim() || "";
    state.programName = $("formImageProgramName")?.value?.trim() || "";
    state.programDatePlace = $("formImageProgramDatePlace")?.value?.trim() || "";
    state.programSchedule = $("formImageProgramSchedule")?.value?.trim() || "";
    state.programSpeaker = $("formImageProgramSpeaker")?.value?.trim() || "";
    state.noticeType = $("formImageNoticeType")?.value || "caution";
    state.noticeTone = $("formImageNoticeTone")?.value || "official";
    state.noticeHeadline = $("formImageNoticeHeadline")?.value?.trim() || "";
    state.noticeDetail = $("formImageNoticeDetail")?.value?.trim() || "";
    state.closingType = $("formImageClosingType")?.value || "thanks";
    const closingPreset = CLOSING_TYPES[state.closingType] || CLOSING_TYPES.thanks;
    const closingMain = $("formImageClosingMainText")?.value?.trim() || "";
    const closingSub = $("formImageClosingSubText")?.value?.trim() || "";
    state.closingMainText = closingMain;
    state.closingSubText = closingSub;
    state.closingContact = $("formImageClosingContact")?.value?.trim() || "";
    state.closingEmail = $("formImageClosingEmail")?.value?.trim() || "";
    state.closingWebsite = $("formImageClosingWebsite")?.value?.trim() || "";
    state.closingQrEnabled = Boolean($("formImageClosingQrEnabled")?.checked);
    state.closingQrUrl = $("formImageClosingQrUrl")?.value?.trim() || "";
    state.closingQrSize = $("formImageClosingQrSize")?.value || "medium";
    state.closingQrCaption = $("formImageClosingQrCaption")?.value?.trim() || "";
    state.closingQrPosition = $("formImageClosingQrPosition")?.value || "auto";
    state.closingQrEmphasis = Boolean($("formImageClosingQrEmphasis")?.checked);
    state.closingTone = $("formImageClosingTone")?.value || "calm";
  }

  function setPressed(group, attr, value) {
    group?.querySelectorAll(`[${attr}]`).forEach((button) => {
      const active = button.getAttribute(attr) === value;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function setMode(mode) {
    state.mode = "single";
    if (state.mode === "single" && !TARGETS[state.resultTarget]) {
      state.resultTarget = state.targetType;
    }
    if (state.mode === "set" && !state.outputs[state.resultTarget]) {
      state.resultTarget = "cover";
    }
    setPressed($("formImageModeGroup"), "data-form-mode", state.mode);
    const badge = $("formImageModeBadge");
    if (badge) badge.textContent = "단건";
    const targetField = $("formImageTargetField");
    if (targetField) targetField.hidden = false;
    renderStrengths();
    renderResultTabs();
    updateTypePanels();
    updatePreview();
  }

  function setTarget(target) {
    if (!TARGETS[target]) return;
    state.targetType = target;
    state.resultTarget = target;
    setPressed($("formImageTargetGroup"), "data-form-target", target);
    updateTypePanels();
    renderStrengths();
    renderResultTabs();
    updatePreview();
  }

  function updateTypePanels() {
    document.querySelectorAll("[data-type-panel]").forEach((panel) => {
      const target = panel.dataset.typePanel;
      const visible = state.mode === "set" || state.targetType === target;
      panel.hidden = !visible;
      panel.classList.toggle("active", visible && (state.mode === "set" ? state.resultTarget === target : state.targetType === target));
    });
    updateSignboardPanels();
  }

  const SIGNBOARD_PURPOSE_DEFAULT_STRUCTURE = {
    location: "blocks",
    direction: "arrow",
    process: "steps",
    program: "schedule",
    notice: "blocks",
  };

  function updateSignboardPanels() {
    const selectedPurposeRaw = $("formImageSignboardPurpose")?.value || state.signboardPurpose;
    const selectedStructure = SIGNBOARD_PURPOSE_DEFAULT_STRUCTURE[selectedPurposeRaw] || "blocks";
    document.querySelectorAll("[data-signboard-structure-panel]").forEach((panel) => {
      const visible = panel.dataset.signboardStructurePanel === selectedStructure;
      panel.hidden = !visible;
      panel.classList.toggle("active", visible);
    });
    document.querySelectorAll("[data-signboard-purpose-panel]").forEach((panel) => {
      const visible = panel.dataset.signboardPurposePanel === selectedPurposeRaw;
      panel.hidden = !visible;
      panel.classList.toggle("active", visible);
    });
    syncQrPanel();
  }

  function updateClosingTypeUI(fillSample = false) {
    const type = $("formImageClosingType")?.value || state.closingType;
    const guide = CLOSING_TYPE_GUIDES[type] || CLOSING_TYPE_GUIDES.thanks;
    const guideEl = $("formImageClosingTypeGuide");
    if (guideEl) {
      const title = guideEl.querySelector("strong");
      const desc = guideEl.querySelector("span");
      if (title) title.textContent = guide.title;
      if (desc) desc.textContent = guide.desc;
    }
    const mainLabel = $("formImageClosingMainLabel");
    const subLabel = $("formImageClosingSubLabel");
    const mainInput = $("formImageClosingMainText");
    const subInput = $("formImageClosingSubText");
    if (mainLabel) setCaptionText(mainLabel, guide.mainLabel);
    if (subLabel) setCaptionText(subLabel, guide.subLabel);
    if (mainInput) mainInput.placeholder = guide.mainPlaceholder;
    if (subInput) subInput.placeholder = guide.subPlaceholder;
    // 사용자가 직접 유형을 선택했을 때만 샘플 문구를 채워 바로 수정할 수 있게 함
    if (fillSample) {
      if (mainInput) mainInput.value = guide.mainSample || "";
      if (subInput) subInput.value = guide.subSample || "";
      syncStateFromInputs();
    }
  }

  function setCaptionText(caption, text) {
    const toggle = caption.querySelector("[data-text-toggle]");
    caption.textContent = text;
    if (toggle) caption.appendChild(toggle);
  }

  function updateCanvasRatioUI() {
    const field = $("formImageCustomRatioField");
    if (!field) return;
    const selected = $("formImageCanvasRatio")?.value || state.canvasRatio;
    field.hidden = selected !== "custom";
  }

  function syncQrPanel() {
    const enabled = Boolean($("formImageQrEnabled")?.checked);
    const details = $("formImageQrDetails");
    if (details) details.style.display = enabled ? "grid" : "none";
    const closingEnabled = Boolean($("formImageClosingQrEnabled")?.checked);
    const closingDetails = $("formImageClosingQrDetails");
    if (closingDetails) closingDetails.style.display = closingEnabled ? "grid" : "none";
  }

  function textVisible(key) {
    return state.textVisibility[key] !== false;
  }

  function textLine(label, value, key) {
    const clean = normalizeDataValue(value);
    if (!clean) return null;
    return {
      label,
      visible: textVisible(key),
      text: formatDataLine(label, clean, key),
    };
  }

  function commonTextLines(options = {}) {
    const includeRoles = options.roles !== false;
    const includeTitleSubtitle = options.titleSubtitle !== false;
    const lines = [
      includeTitleSubtitle ? textLine("Title", state.title, "title") : null,
      includeTitleSubtitle ? textLine("Subtitle", state.subtitle, "subtitle") : null,
      textLine("Organization", state.organization, "organization"),
      textLine("Department", state.department, "department"),
      textLine("Date", state.date, "date"),
      textLine("Presenter", state.presenter, "presenter"),
      includeRoles ? textLine("Host", state.host, "host") : null,
      includeRoles ? textLine("Organizer", state.organizer, "organizer") : null,
      includeRoles ? textLine("Sponsor", state.sponsor, "sponsor") : null,
      includeRoles ? textLine("Partner", state.partner, "partner") : null,
    ].filter(Boolean);
    if (state.roleDisplayMode === "transparent") {
      lines.forEach((line) => {
        if (/^(Host|Organizer|Sponsor|Partner):/.test(line.text)) line.visible = false;
      });
    }
    return lines;
  }

  function rolePlanningLines() {
    return [
      state.host ? formatDataLine("Host", state.host, "host") : "",
      state.organizer ? formatDataLine("Organizer", state.organizer, "organizer") : "",
      state.sponsor ? formatDataLine("Sponsor", state.sponsor, "sponsor") : "",
      state.partner ? formatDataLine("Partner", state.partner, "partner") : "",
    ].filter(Boolean);
  }

  function canvasInstruction() {
    if (state.canvasRatio === "custom") {
      return state.canvasCustomRatio
        ? `custom canvas ratio or size: ${quoteData(state.canvasCustomRatio)}`
        : "custom canvas ratio selected, but no ratio was provided; choose a practical document image ratio";
    }
    return CANVAS_RATIO[state.canvasRatio] || CANVAS_RATIO.wide_16_9;
  }

  function createTextToggleButton(key) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "form-image-eye-toggle";
    button.dataset.textToggle = key;
    button.title = "텍스트 표시/투명 전환";
    return button;
  }

  function renderTextToggles() {
    Object.entries(TEXT_FIELD_LABELS).forEach(([id, config]) => {
      const field = $(id);
      if (!field) return;
      const label = field.closest(".gen-field");
      if (label) {
        if (label.querySelector(`[data-text-toggle="${config.key}"]`)) return;
        const caption = label.querySelector("span");
        if (!caption) return;
        label.classList.add("form-image-toggle-panel");
        caption.classList.add("form-image-field-caption");
        caption.appendChild(createTextToggleButton(config.key));
        return;
      }
      const configLabel = document.querySelector(`label.gen-config-label[for="${id}"]`);
      if (!configLabel || configLabel.querySelector(`[data-text-toggle="${config.key}"]`)) return;
      configLabel.classList.add("form-image-field-caption");
      configLabel.appendChild(createTextToggleButton(config.key));
    });
    syncTextToggleButtons();
  }

  function syncTextToggleButtons() {
    document.querySelectorAll("[data-text-toggle]").forEach((button) => {
      const key = button.dataset.textToggle;
      const visible = textVisible(key);
      const fieldId = TOGGLE_KEY_TO_FIELD_ID[key];
      const hasValue = Boolean($(fieldId)?.value?.trim());
      button.classList.toggle("is-muted", !visible);
      button.classList.toggle("is-empty", !hasValue);
      button.disabled = !hasValue;
      button.title = hasValue ? "텍스트 표시/투명 전환" : "먼저 값을 입력하면 전환할 수 있습니다.";
      button.setAttribute("aria-pressed", visible ? "true" : "false");
      button.textContent = visible ? "보기" : "투명";
    });
  }

  function paletteColors() {
    const pal = state.mixerStyle?.palette;
    if (!pal) return [];
    if (Array.isArray(pal.colors)) return pal.colors;
    if (Array.isArray(pal)) return pal;
    return [];
  }

  function mixerName() {
    return state.mixerStyle?.nameKo || state.mixerStyle?.nameEn || "비주얼 믹서 스타일";
  }

  function renderMixerSummary() {
    const empty = $("formImageMixerEmpty");
    const summary = $("formImageMixerSummary");
    const hasMixer = Boolean(state.mixerStyle);
    if (empty) empty.hidden = hasMixer;
    if (summary) summary.hidden = !hasMixer;
    updateStyleStateBadge();
    if (!hasMixer) return;

    const name = $("formImageMixerName");
    if (name) name.textContent = mixerName();

    const metaParts = [
      state.mixerStyle.subjectKo || state.mixerStyle.subjectEn,
      state.mixerStyle.mediumKo || state.mixerStyle.mediumEn,
      state.mixerStyle.layoutFeel,
      state.mixerStyle.typographyGuidance,
    ].filter(Boolean);
    const meta = $("formImageMixerMeta");
    if (meta) meta.textContent = metaParts.slice(0, 3).join(" · ") || "선택한 비주얼 믹서 스타일을 양식 이미지용으로 변환합니다.";

    const palette = $("formImagePalette");
    if (palette) {
      const colors = paletteColors().slice(0, 6);
      palette.innerHTML = colors.length
        ? colors.map((color) => `<span style="background:${escapeHtml(color)}" title="${escapeHtml(color)}"></span>`).join("")
        : "";
    }
  }

  function hasContentInput() {
    return Boolean(
      state.title || state.subtitle || state.organization || state.department || state.date || state.presenter ||
      state.host || state.organizer || state.sponsor || state.partner ||
      state.dividerNo || state.dividerKeywords ||
      state.backgroundAvoid || state.signboardInfo || state.blockPrimary || state.blockSecondary || state.blockTertiary ||
      state.qrUrl || state.qrCaption || state.closingContact || state.closingEmail || state.closingWebsite ||
      signboardPurposeContent().length ||
      state.toneMemo || state.extraNotes
    );
  }

  function renderFlowState() {
    const cards = document.querySelectorAll("[data-step-card]");
    const targets = activeTargets();
    const hasGeneratedOutput = targets.some((target) => Boolean(state.outputs[target]));
    const hasStyleDirection = Boolean(state.mixerStyle || state.toneMemo || state.mustKeep || state.avoidNotes || state.extraNotes);
    const completed = {
      target: Boolean(state.targetType),
      content: hasContentInput(),
      style: hasStyleDirection,
      output: hasGeneratedOutput,
    };
    const active = !completed.content && !completed.style && !completed.output
      ? "target"
      : !completed.content
        ? "content"
        : !completed.style
          ? "style"
          : "output";
    cards.forEach((card) => {
      const key = card.dataset.stepCard;
      card.classList.toggle("active", key === active);
      card.classList.toggle("done", completed[key] && key !== active);
    });
  }

  function renderStrengths() {
    const wrap = $("formImageStrengths");
    if (!wrap) return;
    const targets = activeTargets();
    wrap.innerHTML = targets.map((target) => {
      const label = TARGETS[target].label;
      const current = state.strengths[target] || TARGETS[target].strength;
      return `
        <div class="form-image-strength-row" data-strength-row="${target}">
          <span>${label}</span>
          ${["subtle", "medium", "strong"].map((value) => `
            <button type="button" class="${current === value || (current === "balanced" && value === "medium") ? "active" : ""}" data-strength="${value}">
              ${STRENGTH_LABELS[value]}
            </button>
          `).join("")}
        </div>
      `;
    }).join("");
  }

  function renderResultTabs() {
    const tabs = $("formImageResultTabs");
    if (!tabs) return;
    const targets = activeTargets();
    if (!targets.includes(state.resultTarget)) state.resultTarget = targets[0];
    tabs.innerHTML = targets.map((target) => `
      <button type="button" class="${state.resultTarget === target ? "active" : ""}" data-result-target="${target}">
        ${TARGETS[target].label}
      </button>
    `).join("");
  }

  function renderSetMap() {
    const wrap = $("formImageSetMap");
    if (!wrap) return;
    const targets = activeTargets();
    wrap.innerHTML = `
      <div class="form-image-map-head">
        <span class="form-image-mini-label">선택 양식</span>
        <strong>${TARGETS[state.targetType].label}</strong>
      </div>
      <div class="form-image-map-items">
        ${targets.map((target) => {
          const active = state.targetType === target;
          return `
            <button type="button" class="${active ? "active" : ""}" data-map-target="${target}" aria-pressed="${active ? "true" : "false"}">
              <span>${TARGETS[target].label}</span>
              <small>${STRENGTH_LABELS[state.strengths[target]] || "균형"}</small>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderSetOverview() {
    const overview = $("formImageSetOverview");
    if (!overview) return;
    overview.innerHTML = "";
  }

  function renderResultHeader() {
    const target = state.targetType;
    const title = $("formImageResultTitle");
    if (title) title.textContent = TARGETS[target]?.label || "양식";
    const type = $("formImageResultType");
    if (type) type.textContent = TARGETS[target]?.label || "양식";
    const summary = $("formImageResultSummary");
    if (summary) {
      const style = state.mixerStyle ? mixerName() : "기본 문서형 스타일";
      summary.textContent = `${TARGETS[target]?.label || "양식"} 프롬프트를 ${style} 기준으로 자동 구성합니다.`;
    }
  }

  function updatePromptStats(output) {
    const sectionCount = (output.match(/^\[[^\]]+\]/gm) || []).length;
    const length = output.trim().length;
    const sectionEl = $("formImageSectionCount");
    const lengthEl = $("formImagePromptLength");
    const stateEl = $("formImagePromptState");
    if (sectionEl) sectionEl.textContent = `${sectionCount}개`;
    if (lengthEl) lengthEl.textContent = `${length.toLocaleString("ko-KR")}자`;
    if (stateEl) stateEl.textContent = length ? "자동 갱신됨" : "입력 대기";
  }

  function changedLabel(el) {
    const label = el.closest(".gen-field, label");
    const source = label?.querySelector("span, .gen-config-label");
    if (!source) return el.id || "입력값";
    const clone = source.cloneNode(true);
    clone.querySelectorAll("button, [data-text-toggle]").forEach((node) => node.remove());
    return clone.textContent?.trim() || el.id || "입력값";
  }

  function flashChangedInput(el) {
    const target = el.closest(".gen-field, .form-image-participant-panel, .form-image-canvas-panel, .form-image-qr-panel, .form-image-closing-copy-panel, .form-image-strength-panel");
    if (!target) return;
    window.clearTimeout(target._formImageChangedTimer);
    target.classList.remove("form-image-changed");
    void target.offsetWidth;
    target.classList.add("form-image-changed");
    target._formImageChangedTimer = window.setTimeout(() => {
      target.classList.remove("form-image-changed");
    }, 1600);
  }

  function flashPromptUpdated(label) {
    const shell = $("formImagePromptShell") || document.querySelector(".form-image-prompt-shell");
    const stateEl = $("formImagePromptState");
    if (stateEl) stateEl.textContent = `${label} 반영됨`;
    if (!shell) return;
    window.clearTimeout(shell._formImageChangedTimer);
    shell.classList.remove("form-image-prompt-updated");
    void shell.offsetWidth;
    shell.classList.add("form-image-prompt-updated");
    shell._formImageChangedTimer = window.setTimeout(() => {
      shell.classList.remove("form-image-prompt-updated");
      updatePromptStats($("formImagePromptPreview")?.value || "");
    }, 1600);
  }

  function targetTextLines(target) {
    if (target === "cover") {
      return [
        ...commonTextLines(),
      ].filter(Boolean);
    }
    if (target === "divider") {
      return [
        textLine("Section number", state.dividerNo, "dividerNo"),
        textLine("Section keywords", state.dividerKeywords, "dividerKeywords"),
        ...commonTextLines(),
      ].filter(Boolean);
    }
    if (target === "signboard") {
      const specificLines = [
        ...signboardPurposeTextLines(),
        ...signboardPurposeNoticeTextLines(),
        textLine("Signboard information", state.signboardInfo, "signboardInfo"),
        textLine("QR caption", state.qrCaption, "qrCaption"),
      ];
      const commonLines = commonTextLines();
      return (state.signboardHierarchy === "title"
        ? [...commonLines, ...specificLines]
        : [...specificLines, ...commonLines]
      ).filter(Boolean);
    }
    if (target === "closing") {
      const messages = closingMessages();
      return [
        textLine("Closing main message", messages.main, "closingMainText"),
        textLine("Closing supporting message", messages.sub, "closingSubText"),
        textLine("Contact", state.closingContact, "closingContact"),
        textLine("Email", state.closingEmail, "closingEmail"),
        textLine("Website", state.closingWebsite, "closingWebsite"),
        textLine("Closing QR caption", state.closingQrCaption, "closingQrCaption"),
        ...commonTextLines({ titleSubtitle: false }),
      ].filter(Boolean);
    }
    return [];
  }

  function strengthInstruction(target) {
    const strength = state.strengths[target] || TARGETS[target].strength;
    if (strength === "strong") return "Apply the linked visual mixer style strongly while keeping document readability intact.";
    if (strength === "subtle") return "Apply the linked visual mixer style subtly as a restrained background language.";
    return "Apply the linked visual mixer style with balanced intensity and clear information hierarchy.";
  }

  function mixerBlock() {
    const mixer = state.mixerStyle;
    if (!mixer) {
      return [
        "Visual style source: no mixer style linked.",
        "Use a clean premium institutional design language with restrained modern graphics.",
      ].join("\n");
    }
    const parts = [
      `Linked visual style: ${mixerName()}`,
      mixer.prompt ? `Mixer rendering directive: ${mixer.prompt}` : "",
      mixer.mediumRendering ? `Rendering texture: ${mixer.mediumRendering}` : "",
      mixer.colorRoles ? `Color strategy: ${mixer.colorRoles}` : "",
      mixer.layoutFeel ? `Layout feel: ${mixer.layoutFeel}` : "",
      mixer.typographyGuidance ? `Typography guidance: ${mixer.typographyGuidance}` : "",
    ].filter(Boolean);
    const colors = paletteColors();
    if (colors.length) parts.push(`Palette: ${colors.join(", ")}`);
    return parts.join("\n");
  }

  function valueLine(label, value, key = "") {
    if (key === "date" && isSuspiciousDateValue(value)) return "";
    const clean = normalizeDataValue(value);
    return clean ? formatDataLine(label, clean, key) : "";
  }

  function isSuspiciousDateValue(value) {
    return /^\d{1,3}$/.test(String(value || "").trim());
  }

  function quoteData(value) {
    const clean = normalizeDataValue(value).replace(/"/g, '\\"');
    return `"${clean}"`;
  }

  function normalizeDataValue(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  function stripListMarker(value) {
    return String(value || "")
      .replace(/^\s*[-*•·]\s+/, "")
      .replace(/^\s*\d{1,2}[.)]\s+(?=\S)/, "")
      .replace(/^\s*[A-Za-z가-힣][.)]\s+/, "")
      .trim();
  }

  function splitStructuredValue(value, key = "") {
    const clean = normalizeDataValue(value);
    if (!clean) return [];
    const shouldSplitComma = LIST_VALUE_KEYS.has(key);
    const delimiter = shouldSplitComma ? /[\n;；|•]+|(?:\s+\/\s+)|,/g : /[\n;；|•]+|(?:\s+\/\s+)/g;
    return clean
      .split(delimiter)
      .map(stripListMarker)
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  function parseKeyValueItem(item) {
    const match = String(item || "").match(/^(.{1,24}?)[\s]*[:：=][\s]*(.+)$/);
    if (!match) return null;
    const key = stripListMarker(match[1]);
    const value = stripListMarker(match[2]);
    if (!key || !value) return null;
    return { key, value };
  }

  function formatDataLine(label, value, key = "") {
    const items = splitStructuredValue(value, key);
    if (!items.length) return "";
    const pairs = items.map(parseKeyValueItem);
    if (pairs.length && pairs.every(Boolean)) {
      return `${label} groups: ${pairs.map((pair) => `${quoteData(pair.key)} = ${quoteData(pair.value)}`).join("; ")}`;
    }
    if (items.length > 1) {
      return `${label} items: ${items.map(quoteData).join("; ")}`;
    }
    return `${label}: ${quoteData(items[0])}`;
  }

  function formatInlineData(value, key = "") {
    const items = splitStructuredValue(value, key);
    if (!items.length) return "";
    const pairs = items.map(parseKeyValueItem);
    if (pairs.length && pairs.every(Boolean)) {
      return pairs.map((pair) => `${quoteData(pair.key)} = ${quoteData(pair.value)}`).join("; ");
    }
    return items.map(quoteData).join("; ");
  }

  function compactStyleMemo(value) {
    return normalizeDataValue(value)
      .replace(/,\s*color palette:\s*#[^"]+$/i, "")
      .replace(/\s*color palette:\s*#[^"]+$/i, "")
      .trim();
  }

  function sectionBlock(title, lines) {
    const clean = lines.filter(Boolean);
    return clean.length ? [`[${title}]`, ...clean].join("\n") : "";
  }

  function qrSourceLines() {
    if (!state.qrEnabled) return [];
    return [
      state.qrUrl ? `QR destination URL: ${quoteData(state.qrUrl)}` : "QR destination URL: not provided; reserve placeholder only.",
      state.qrCaption ? `QR caption: ${quoteData(state.qrCaption)}` : "",
    ];
  }

  function qrLayoutLines() {
    if (!state.qrEnabled) return [];
    return [
      "Reserve a clean replaceable QR area; do not invent a scannable QR pattern and do not render the destination URL as visible text unless explicitly listed.",
      `QR size: ${QR_SIZE[state.qrSize] || QR_SIZE.medium}.`,
      `QR position: ${QR_POSITION[state.qrPosition] || QR_POSITION.auto}`,
      state.qrEmphasis ? "QR emphasis: add a restrained border, badge, or visual cue around the QR area." : "",
    ];
  }

  function closingQrSourceLines() {
    if (!state.closingQrEnabled) return [];
    return [
      state.closingQrUrl ? `Closing QR destination URL: ${quoteData(state.closingQrUrl)}` : "Closing QR destination URL: not provided; reserve placeholder only.",
      state.closingQrCaption ? `Closing QR caption: ${quoteData(state.closingQrCaption)}` : "",
    ];
  }

  function closingQrLayoutLines() {
    if (!state.closingQrEnabled) return [];
    return [
      "Reserve a clean replaceable closing QR area; do not invent a scannable QR pattern and do not render the destination URL as visible text unless explicitly listed.",
      `Closing QR size: ${QR_SIZE[state.closingQrSize] || QR_SIZE.medium}.`,
      `Closing QR position: ${QR_POSITION[state.closingQrPosition] || QR_POSITION.auto}`,
      state.closingQrEmphasis ? "Closing QR emphasis: add a restrained border, badge, or visual cue around the QR area." : "",
    ];
  }

  function closingMessages() {
    const preset = CLOSING_TYPES[state.closingType] || CLOSING_TYPES.thanks;
    return {
      main: state.closingMainText || state.title || preset.main,
      sub: state.closingSubText || state.subtitle || preset.sub,
    };
  }

  function assetSection(target) {
    const strength = STRENGTH_PROMPT_LABELS[state.strengths[target]] || "balanced";
    const purpose = {
      cover: "business report or presentation first page",
      divider: "section divider page",
      background: "editable body-slide background",
      signboard: "practical public/institutional guidance signboard",
      closing: "final closing page",
    }[target] || "document/form image";
    return sectionBlock("Asset", [
      `Type: ${TARGET_PROMPT_LABELS[target] || "document/form image"}`,
      `Purpose: ${purpose}`,
      `Canvas: ${canvasInstruction()}`,
      `Style intensity: ${strength}`,
      state.toneMemo
        ? `Mood: ${quoteData(state.toneMemo)}`
        : "Mood: calm, trustworthy, professional Korean institutional communication",
    ]);
  }

  function productionDirectiveSection(target) {
    const directives = [
      "Generate the final image itself, not a mockup explanation, prompt sheet, wireframe, or editable template preview.",
      "Keep all visible Korean text sharp, legible, and spelled exactly as provided.",
      "Prioritize information hierarchy and text readability over decorative style effects.",
    ];
    if (target === "cover") {
      directives.push("Make the title the dominant visual element, with metadata and role information clearly secondary.");
    } else if (target === "divider") {
      directives.push("Make the section number and section title immediately recognizable at first glance.");
    } else if (target === "background") {
      directives.push("Keep the central working area clean and low contrast for future slide content.");
    } else if (target === "signboard") {
      directives.push("Optimize for practical wayfinding: large readable blocks, simple grouping, and fast scanning.");
    } else if (target === "closing") {
      directives.push("Make the closing message calm, complete, and visually final.");
    }
    return sectionBlock("Production Directives", directives);
  }

  function documentDataSection(target) {
    if (target === "background") {
      return sectionBlock("Source Data", [
        "Background-only asset: do not use common document text as visible or transparent text.",
      ]);
    }
    const roleLines = rolePlanningLines();
    const titleSubtitle = target === "closing" ? [] : [
      valueLine("Title", state.title, "title"),
      valueLine("Subtitle", state.subtitle, "subtitle"),
    ];
    const orgMeta = [
      valueLine("Organization", state.organization, "organization"),
      valueLine("Department", state.department, "department"),
      valueLine("Date", state.date, "date"),
      valueLine("Presenter", state.presenter, "presenter"),
      roleLines.length ? `Roles: ${roleLines.join(" / ")}` : "",
    ];

    if (target === "divider") {
      return sectionBlock("Source Data", [
        valueLine("Section number", state.dividerNo, "dividerNo"),
        valueLine("Section keywords", state.dividerKeywords, "dividerKeywords"),
        ...titleSubtitle,
        ...orgMeta,
      ]);
    }
    if (target === "signboard") {
      const specific = [];
      signboardPurposeTextLines().forEach((line) => specific.push(line.text));
      signboardPurposeNoticeTextLines().forEach((line) => specific.push(line.text));
      specific.push(valueLine("Signboard information", state.signboardInfo, "signboardInfo"));
      specific.push(...qrSourceLines());
      const ordered = state.signboardHierarchy === "title"
        ? [...titleSubtitle, ...orgMeta, ...specific]
        : [...specific, ...titleSubtitle, ...orgMeta];
      return sectionBlock("Source Data", ordered);
    }
    if (target === "closing") {
      const messages = closingMessages();
      const specific = [
        `Closing type: ${CLOSING_PROMPT_TYPES[state.closingType] || CLOSING_PROMPT_TYPES.thanks}`,
        `Closing tone: ${CLOSING_TONE[state.closingTone] || CLOSING_TONE.calm}`,
        valueLine("Closing main message", messages.main, "closingMainText"),
        valueLine("Closing supporting message", messages.sub, "closingSubText"),
      ];
      const contact = [
        valueLine("Contact", state.closingContact, "closingContact"),
        valueLine("Email", state.closingEmail, "closingEmail"),
        valueLine("Website", state.closingWebsite, "closingWebsite"),
        ...closingQrSourceLines(),
      ];
      return sectionBlock("Source Data", [...specific, ...contact, ...orgMeta]);
    }
    return sectionBlock("Source Data", [...titleSubtitle, ...orgMeta]);
  }

  function textRenderingSection(target) {
    if (target === "background") {
      return sectionBlock("Text Rendering", [
        "No visible text.",
        "No transparent text.",
        "Do not render any letters, numbers, pseudo labels, logos, QR codes, UI text, or decorative typography.",
      ]);
    }
    const lines = targetTextLines(target);
    const fieldName = (line) => line.label || line.text.split(":")[0];
    const visible = lines.filter((line) => line.visible).map(fieldName);
    const transparent = lines.filter((line) => !line.visible).map(fieldName);
    return sectionBlock("Text Rendering", [
      visible.length ? `Visible text fields: ${visible.join(", ")}.` : "Visible text: none.",
      transparent.length
        ? `Reserved blank-space fields (do not render as ink): ${transparent.join(", ")}.`
        : "Transparent text: none.",
      visible.length ? "Render visible quoted values exactly; do not translate, summarize, paraphrase, correct, or add text." : "",
      transparent.length
        ? "For reserved blank-space fields, use the field values from Source Data only to size and position an empty layout slot (placement, spacing, typographic hierarchy); render zero ink there — no letters, no faint ghost text, no watermark-style translucent lettering, no low-opacity outline. The area must look exactly like blank empty space, indistinguishable from surrounding background, ready for the real text to be added later outside this image."
        : "",
      "Do not invent extra Korean copy.",
    ]);
  }

  function layoutSection(target) {
    const lines = targetSpecificContext(target).split("\n").filter(Boolean);
    const ruleLines = targetRules(target).filter((line) => !/^Avoid /.test(line));
    const roleLines = rolePlanningLines();
    const useRoleLayout = target !== "background" && roleLines.length;
    return sectionBlock("Layout", [
      ...lines,
      useRoleLayout ? `Organization role placement: ${ROLE_PLACEMENT[state.rolePlacement] || ROLE_PLACEMENT.auto}.` : "",
      useRoleLayout ? `Organization role display: ${ROLE_DISPLAY_MODE[state.roleDisplayMode] || ROLE_DISPLAY_MODE.plain}.` : "",
      ...ruleLines,
    ]);
  }

  function visualStyleSection(target) {
    const mixer = state.mixerStyle;
    const colors = paletteColors();
    if (!mixer) {
      return sectionBlock("Visual Style", [
        "Clean premium institutional document design with restrained modern graphics.",
        strengthInstruction(target),
      ]);
    }
    const styleMemo = compactStyleMemo(mixer.prompt || mixer.mediumRendering || mixer.layoutFeel || "");
    const colorMemo = colors.length
      ? `Palette: ${colors.join(", ")}`
      : mixer.colorRoles
        ? `Color strategy memo: ${quoteData(mixer.colorRoles)}. Interpret it as palette guidance only.`
        : "";
    return sectionBlock("Visual Style", [
      `Linked style name: ${quoteData(mixerName())}`,
      styleMemo ? `Style memo: ${quoteData(styleMemo)}. Interpret it as visual guidance only; do not render the memo text.` : "",
      colorMemo,
      mixer.typographyGuidance ? `Typography memo: ${quoteData(mixer.typographyGuidance)}. Interpret it as type hierarchy guidance only.` : "",
      "Apply visual style to illustration, background, linework, color, and composition only; never let style reduce text clarity.",
      strengthInstruction(target),
    ]);
  }

  function restrictionsSection() {
    return sectionBlock("Restrictions", [
      "No watermarks, fake logos, pseudo-text, malformed Korean, extra labels, clutter, rough wireframe appearance, or UI screenshot artifacts.",
      "Do not render any instruction text, section header, field name, memo, URL label, or placeholder label unless it appears as a quoted visible value.",
      state.extraNotes ? `Respect avoidance memo: ${quoteData(state.extraNotes)}` : "",
    ]);
  }

  function baseContext(target) {
    const targetLabel = TARGETS[target].label;
    const roleLines = rolePlanningLines();
    return [
      `[Task] Create a ${targetLabel} image prompt for Korean business presentation/document materials.`,
      target !== "background" && state.title ? `Common title: ${quoteData(state.title)}` : "",
      target !== "background" && state.subtitle ? `Common subtitle: ${quoteData(state.subtitle)}` : "",
      target !== "background" && state.organization ? `Organization: ${quoteData(state.organization)}` : "",
      target !== "background" && state.department ? `Department: ${quoteData(state.department)}` : "",
      target !== "background" && state.date ? `Date: ${quoteData(state.date)}` : "",
      target !== "background" && state.presenter ? `Presenter: ${quoteData(state.presenter)}` : "",
      target !== "background" && roleLines.length ? `Role and organization planning data: ${roleLines.join(" / ")}.` : "",
      targetSpecificContext(target),
      state.toneMemo ? `Tone/use memo: ${quoteData(state.toneMemo)}` : "",
      state.extraNotes ? `Additional requirements: ${quoteData(state.extraNotes)}` : "",
    ].filter(Boolean).join("\n");
  }

  function targetSpecificContext(target) {
    if (target === "cover") {
      return "";
    }
    if (target === "divider") {
      return [
        "Use the section number as the primary divider anchor when provided.",
        "Use section keywords as subtle visual metaphors only, not as extra body copy.",
        `Divider transition strength: ${DIVIDER_STRENGTH[state.dividerStrength] || "balanced transition"}`,
        `Divider section number treatment: ${DIVIDER_NUMBER_STYLE[state.dividerNumberStyle] || "choose the best number treatment"}`,
        `Divider layout: ${DIVIDER_LAYOUT[state.dividerLayout] || "choose the best divider layout"}`,
      ].filter(Boolean).join("\n");
    }
    if (target === "background") {
      return [
        `Background safe area: ${BACKGROUND_SAFE_AREA[state.backgroundSafeArea] || "keep main content area open"}`,
        `Background decoration placement: ${BACKGROUND_DECORATION[state.backgroundDecoration] || "edge-focused decoration"}`,
        `Background decoration density: ${BACKGROUND_DENSITY[state.backgroundDensity] || "very low"}`,
        `Background brightness: ${BACKGROUND_BRIGHTNESS[state.backgroundBrightness] || "bright editable background"}`,
        `Expected overlay content: ${BACKGROUND_CONTENT[state.backgroundContent] || "body text"}`,
        state.backgroundAvoid ? `Avoid in background: ${formatInlineData(state.backgroundAvoid, "backgroundAvoid")}` : "",
      ].filter(Boolean).join("\n");
    }
    if (target === "closing") {
      return [
        `Closing page type: ${CLOSING_PROMPT_TYPES[state.closingType] || CLOSING_PROMPT_TYPES.thanks}`,
        `Closing tone: ${CLOSING_TONE[state.closingTone] || CLOSING_TONE.calm}`,
        "Closing page should feel like the final page of a professional Korean presentation or report.",
        ...closingQrLayoutLines(),
      ].filter(Boolean).join("\n");
    }
    return [
      `Signboard purpose: ${SIGNBOARD_PURPOSE[state.signboardPurpose] || "location or venue guidance"}`,
      `Signboard environment: ${SIGNBOARD_ENVIRONMENT[state.signboardEnvironment] || SIGNBOARD_ENVIRONMENT.indoor}`,
      `Information structure: ${SIGNBOARD_STRUCTURE[state.signboardStructure] || "clear information blocks"}`,
      `Signboard hierarchy: ${SIGNBOARD_HIERARCHY[state.signboardHierarchy] || "large title first"}`,
      signboardLayoutGuidance(),
      ...qrLayoutLines(),
    ].filter(Boolean).join("\n");
  }

  const SIGNBOARD_PURPOSE = {
    location: "location or place guidance",
    direction: "directional wayfinding",
    process: "process guidance",
    program: "program information",
    notice: "notice or caution",
  };

  const SIGNBOARD_STRUCTURE = {
    blocks: "title plus three clear information blocks",
    arrow: "title plus strong arrow or direction indicator",
    schedule: "title plus schedule and place information zones",
    steps: "title plus step-by-step process layout",
  };

  const SIGNBOARD_HIERARCHY = {
    title: "large title first, then secondary details",
    blocks: "information block first with clear grouped details",
    icon: "icon-led hierarchy with short supporting labels",
    arrow: "arrow or directional symbol as the dominant visual cue",
  };

  const QR_SIZE = {
    small: "small, secondary QR area",
    medium: "medium QR area balanced with information blocks",
    large: "large QR area with strong scan affordance",
  };

  const QR_POSITION = {
    auto: "choose the most natural integrated QR placement",
    "bottom-right": "bottom-right QR placement",
    "bottom-left": "bottom-left QR placement",
    "top-right": "top-right QR placement",
    "top-left": "top-left QR placement",
    "inline-info": "integrate QR inside the related information block",
  };

  const COVER_PLACEMENT = {
    ai: "choose the best placement for the title length and visual structure",
    left: "left-aligned title block",
    center: "centered title block",
    top: "title placed in the upper area",
    bottom: "title placed in the lower area",
  };

  const COVER_VISUAL_POSITION = {
    ai: "choose the best visual position for readability",
    right: "main visual on the right side",
    left: "main visual on the left side",
    center: "main visual centered behind or near the title with safe contrast",
    full: "full-background visual with protected text overlay zones",
    corner: "small corner visual accent",
  };

  const DIVIDER_STRENGTH = {
    strong: "strong section break with large number and clear separation",
    medium: "balanced transition with title and restrained visual connection",
    subtle: "subtle transition close to a background slide",
  };

  const DIVIDER_NUMBER_STYLE = {
    ai: "choose the best number treatment for the section hierarchy",
    large: "large section number as a strong identifier",
    small: "small section number as a secondary marker",
    none: "do not show a section number",
  };

  const DIVIDER_LAYOUT = {
    ai: "choose the best divider layout for the section title and style",
    left: "left title layout",
    center: "center title layout",
    top_bar: "top bar layout",
    diagonal: "diagonal split layout",
  };

  const BACKGROUND_SAFE_AREA = {
    center: "keep a wide central content area open",
    left: "keep the left content area open",
    right: "keep the right content area open",
    top: "keep the top title area open",
    bottom: "keep the bottom caption area open",
  };

  const BACKGROUND_DECORATION = {
    edge: "edge-focused decoration",
    top: "top decoration",
    bottom: "bottom decoration",
    left: "left-side decoration",
    right: "right-side decoration",
    corner: "corner accents",
    border: "subtle border system",
    pattern: "very subtle full-surface pattern",
  };

  const BACKGROUND_DENSITY = {
    very_low: "very low, almost invisible decoration",
    low: "low, subtle edge decoration",
    medium: "medium but still editable and text-safe",
  };

  const BACKGROUND_BRIGHTNESS = {
    bright: "bright and editable",
    medium: "medium brightness with safe contrast",
    dark: "dark but still presentation-safe with clear empty zones",
    ai: "choose brightness based on readability and style",
  };

  const BACKGROUND_CONTENT = {
    text: "body text",
    table: "tables",
    chart: "graphs and charts",
    photo: "photos",
    icons: "icons and shapes",
    mixed: "mixed slide content",
  };

  const DIRECTION_ARROW = {
    ai: "choose the direction indicator that best fits the layout",
    left: "left arrow",
    right: "right arrow",
    straight: "straight arrow",
    upstairs: "upstairs direction",
    downstairs: "downstairs direction",
  };

  const NOTICE_TYPE = {
    caution: "caution notice",
    prohibited: "prohibition notice",
    required: "required instruction",
    urgent: "urgent notice",
    operation: "operation notice",
  };

  const NOTICE_TONE = {
    official: "official and clear",
    friendly: "friendly but still authoritative",
    urgent: "urgent and high-priority",
    calm: "calm and reassuring",
  };

  function signboardPurposeTextLines() {
    if (state.signboardStructure === "blocks") {
      return [
        textLine("Primary block", state.blockPrimary, "blockPrimary"),
        textLine("Secondary block", state.blockSecondary, "blockSecondary"),
        textLine("Tertiary block", state.blockTertiary, "blockTertiary"),
        textLine("Block note", state.blockNote, "blockNote"),
      ].filter(Boolean);
    }
    if (state.signboardStructure === "arrow") {
      return [
        textLine("Destination", state.directionDestination, "directionDestination"),
        textLine("Distance or time", state.directionDistance, "directionDistance"),
      ].filter(Boolean);
    }
    if (state.signboardStructure === "steps") {
      return [
        textLine("Process title", state.processTitle, "processTitle"),
        textLine("Process steps", state.processItems, "processItems"),
        textLine("After completion note", state.processAfter, "processAfter"),
      ].filter(Boolean);
    }
    if (state.signboardStructure === "schedule") {
      return [
        textLine("Program name", state.programName, "programName"),
        textLine("Date and place", state.programDatePlace, "programDatePlace"),
        textLine("Schedule items", state.programSchedule, "programSchedule"),
        textLine("Speaker or host", state.programSpeaker, "programSpeaker"),
      ].filter(Boolean);
    }
    return [];
  }

  function signboardPurposeNoticeTextLines() {
    if (state.signboardPurpose !== "notice") return [];
    return [
      textLine("Notice headline", state.noticeHeadline, "noticeHeadline"),
      textLine("Notice detail", state.noticeDetail, "noticeDetail"),
    ].filter(Boolean);
  }

  function signboardPurposeContent() {
    const lines = [];
    if (state.signboardStructure === "blocks") {
      lines.push(
        valueLine("Primary block", state.blockPrimary, "blockPrimary"),
        valueLine("Secondary block", state.blockSecondary, "blockSecondary"),
        valueLine("Tertiary block", state.blockTertiary, "blockTertiary"),
        valueLine("Block note", state.blockNote, "blockNote"),
        "Layout should group the information into clear scannable blocks."
      );
    }
    if (state.signboardStructure === "arrow") {
      lines.push(
        valueLine("Destination", state.directionDestination, "directionDestination"),
        `Direction indicator: ${DIRECTION_ARROW[state.directionArrow] || DIRECTION_ARROW.ai}`,
        valueLine("Distance/time", state.directionDistance, "directionDistance"),
        `Arrow emphasis: ${state.directionEmphasis}`,
        "Layout should make the arrow and destination the strongest visual elements."
      );
    }
    if (state.signboardStructure === "steps") {
      lines.push(
        valueLine("Process title", state.processTitle, "processTitle"),
        `Step count: ${state.processSteps} steps`,
        valueLine("Step items", state.processItems, "processItems"),
        valueLine("After completion note", state.processAfter, "processAfter"),
        "Layout should make the process order unmistakable."
      );
    }
    if (state.signboardStructure === "schedule") {
      lines.push(
        valueLine("Program name", state.programName, "programName"),
        valueLine("Date/place", state.programDatePlace, "programDatePlace"),
        valueLine("Schedule items", state.programSchedule, "programSchedule"),
        valueLine("Speaker/host", state.programSpeaker, "programSpeaker"),
        "Layout should read as a compact timetable or session card system."
      );
    }
    if (state.signboardPurpose === "location") {
      lines.push(
        "Purpose tone: location/place guidance.",
        state.blockPrimary ? "Make the place name and zone immediately scannable." : ""
      );
    }
    if (state.signboardPurpose === "notice") {
      lines.push(
        `Notice type: ${NOTICE_TYPE[state.noticeType] || NOTICE_TYPE.caution}`,
        `Notice tone: ${NOTICE_TONE[state.noticeTone] || NOTICE_TONE.official}`,
        valueLine("Core notice sentence", state.noticeHeadline, "noticeHeadline"),
        valueLine("Detailed notice", state.noticeDetail, "noticeDetail"),
        "Layout should feel like a public notice, not an advertisement."
      );
    }
    return lines.filter(Boolean);
  }

  function signboardLayoutGuidance() {
    if (state.signboardStructure === "blocks") {
      return "Group the title and information into clear scannable blocks; make the primary block the strongest visual anchor.";
    }
    if (state.signboardStructure === "arrow") {
      return "Make the direction indicator and destination the strongest visual elements.";
    }
    if (state.signboardStructure === "steps") {
      return "Make the process order unmistakable with numbered or sequential zones.";
    }
    if (state.signboardStructure === "schedule") {
      return "Use a compact timetable or session-card layout with clear time/place hierarchy.";
    }
    return "Use clear information grouping with strong readability and practical wayfinding hierarchy.";
  }

  function targetRules(target) {
    if (target === "cover") {
      return [
        "Design as a premium document cover, not an advertisement poster.",
        "Create a confident key visual with a clear title zone and secondary metadata zone.",
        `Title placement: ${COVER_PLACEMENT[state.coverTitlePlacement] || COVER_PLACEMENT.ai}.`,
        `Main visual placement: ${COVER_VISUAL_POSITION[state.coverVisualPosition] || COVER_VISUAL_POSITION.ai}.`,
        "Use generous margins and a stable editorial composition.",
        "Avoid CTA buttons, fake logos, excessive copy, and cluttered decorative backgrounds.",
      ].filter(Boolean);
    }
    if (target === "divider") {
      return [
        "Design as a section divider slide with immediate chapter/section recognition.",
        "Keep the style connected to the cover but reduce visual density.",
        "Preserve a strong section title area with calm supporting decoration.",
        "Avoid overpowering key visuals, complex information, and poster-like composition.",
      ].filter(Boolean);
    }
    if (target === "background") {
      return [
        "Design as an editable body-slide background.",
        `${BACKGROUND_SAFE_AREA[state.backgroundSafeArea] || "Keep the central content area open"} and low contrast for later text placement.`,
        `Decoration placement: ${BACKGROUND_DECORATION[state.backgroundDecoration] || BACKGROUND_DECORATION.edge}.`,
        `Decoration density should be ${BACKGROUND_DENSITY[state.backgroundDensity] || "very low"}.`,
        `Brightness: ${BACKGROUND_BRIGHTNESS[state.backgroundBrightness] || BACKGROUND_BRIGHTNESS.bright}.`,
        `Optimize for later overlay content: ${BACKGROUND_CONTENT[state.backgroundContent] || BACKGROUND_CONTENT.text}.`,
        state.backgroundAvoid ? `Avoid these background elements: ${quoteData(state.backgroundAvoid)}.` : "",
        "Place subtle patterns, lines, objects, or textures near edges and corners.",
        "Do not include text, fake UI, logos, QR codes, or high-contrast central objects.",
      ].filter(Boolean);
    }
    if (target === "closing") {
      return [
        "Design as a calm final closing page for a Korean business presentation or report.",
        `Closing tone should feel ${CLOSING_TONE[state.closingTone] || CLOSING_TONE.calm}.`,
        "Make the final message the visual focus with generous breathing room and a complete composition.",
        state.closingType === "qna" || state.closingType === "qna_thanks"
          ? "If Q&A is included, make it clear and central without making the slide feel like an event poster."
          : "Keep the thank-you message warm, official, and highly legible.",
        state.closingContact ? "Place contact or final detail text as small secondary information, not as the main title." : "",
        state.closingEmail || state.closingWebsite ? "Place email and website as compact final-contact details with restrained hierarchy." : "",
        state.closingQrEnabled ? "Place the closing QR area as a small replaceable production element that supports the final contact flow, not as a large blank margin." : "",
        state.organization ? "Place the organization text subtly as an official footer or final mark." : "",
        "Avoid oversized empty logo placeholders, decorative bars around the organization name, fake long copy, and clutter.",
      ].filter(Boolean);
    }
    return [
      `Design as a practical signboard for ${SIGNBOARD_PURPOSE[state.signboardPurpose] || "guidance"}.`,
      "Use high readability, clear hierarchy, and enough spacing for real-world viewing.",
      state.farRead ? "Prioritize long-distance readability with larger type zones, stronger contrast, and fewer information groups." : "",
      state.qrEnabled ? "Place the QR area as a small replaceable production element that supports the signboard, not as a large blank margin." : "",
      "Avoid excessive advertising CTA style, fake detailed text, and decorative elements that invade information blocks.",
    ].filter(Boolean);
  }

  function buildPrompt(target) {
    return [
      sectionBlock("Prompt Contract", [
        "Create one finished Korean document/form image directly.",
        "Treat quoted values as source data; render only quoted values from fields listed as visible text.",
      "Use items as separate visual/text units and groups as compact key-value information blocks.",
      "Do not render section names, field labels, instructions, memos, or unquoted metadata.",
      ]),
      "",
      assetSection(target),
      "",
      documentDataSection(target),
      "",
      textRenderingSection(target),
      "",
      productionDirectiveSection(target),
      "",
      layoutSection(target),
      "",
      visualStyleSection(target),
      "",
      restrictionsSection(),
    ].filter(Boolean).join("\n");
  }

  function generatePrompts() {
    syncStateFromInputs();
    state.outputs[state.targetType] = buildPrompt(state.targetType);
    renderResultTabs();
    renderSetMap();
    renderSetOverview();
    updatePreview();
    if (isSuspiciousDateValue(state.date)) {
      setStatus(`날짜 값 "${state.date}"이(가) 실제 날짜로 보이지 않아 프롬프트에서 제외했습니다. 날짜를 확인해 다시 입력하세요.`, "error");
    } else {
      setStatus("프롬프트를 생성했습니다.", "ok");
    }
  }

  function updatePreview() {
    syncStateFromInputs();
    const target = state.targetType;
    const previousOutput = state.outputs[target] || "";
    const output = buildPrompt(target);
    state.outputs[target] = output;
    const preview = $("formImagePromptPreview");
    if (preview) preview.value = output;
    renderPromptHighlight(previousOutput, output);
    renderPromptViewer(output);
    updatePromptStats(output);
    syncTextToggleButtons();

    const quality = $("formImageQualityList");
    if (quality) {
      const label = TARGETS[target]?.label || "양식";
      const strength = STRENGTH_LABELS[state.strengths[target]] || "균형";
      quality.innerHTML = [
        `${label} 변환 강도: ${strength}`,
        state.mixerStyle ? `비주얼 믹서 스타일: ${escapeHtml(mixerName())}` : "비주얼 믹서 스타일: 기본 문서형 스타일",
        target === "background" ? "배경은 텍스트 없이 낮은 대비와 넓은 편집 여백을 우선합니다." : "입력한 텍스트 외 임의 문장 생성을 제한합니다.",
      ].map((item) => `<div>${item}</div>`).join("");
    }
    renderResultHeader();
    renderFlowState();
    renderSetMap();
    renderSetOverview();
  }

  function diffChangedLineIndices(oldText, newText) {
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");
    const n = oldLines.length;
    const m = newLines.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = oldLines[i] === newLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const changed = new Set();
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (oldLines[i] === newLines[j]) {
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        i++;
      } else {
        changed.add(j);
        j++;
      }
    }
    while (j < m) {
      changed.add(j);
      j++;
    }
    return changed;
  }

  function renderPromptHighlight(previousOutput, output) {
    const highlight = $("formImagePromptHighlight");
    if (!highlight) return;
    const lines = output.split("\n");
    if (!previousOutput || previousOutput === output) {
      highlight.textContent = output;
      return;
    }
    const changed = diffChangedLineIndices(previousOutput, output);
    highlight.innerHTML = lines
      .map((line, index) => (changed.has(index) ? `<mark class="form-image-diff-mark">${escapeHtml(line)}</mark>` : escapeHtml(line)))
      .join("\n");
    scrollToChangedLine(highlight);
  }

  function parsePromptSections(text) {
    const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    const sections = [];
    let current = null;
    lines.forEach((line) => {
      const trimmed = line.trim();
      const isTitle = trimmed.startsWith("[") && trimmed.endsWith("]");
      if (isTitle) {
        if (current && (current.title || current.lines.some((item) => item.trim()))) {
          sections.push(current);
        }
        current = { title: trimmed, lines: [] };
        return;
      }
      if (!current) current = { title: "", lines: [] };
      current.lines.push(line);
    });
    if (current && (current.title || current.lines.some((item) => item.trim()))) {
      sections.push(current);
    }
    return sections.map((section) => ({
      title: section.title,
      lines: section.lines.filter((line, index, source) => line.trim() || index < source.length - 1),
    }));
  }

  function serializePromptSections(sections) {
    return sections.map((section) => {
      const lines = [];
      if (section.title) lines.push(section.title);
      lines.push(...section.lines);
      return lines.join("\n").trimEnd();
    }).join("\n\n");
  }

  function renderPromptViewer(output) {
    const viewer = $("formImagePromptViewer");
    if (!viewer) return;
    if (sectionEditOpen) return;
    const sections = parsePromptSections(output);
    if (!sections.length) {
      viewer.innerHTML = `<div class="form-image-viewer-empty">프롬프트를 만들면 섹션별로 표시됩니다.</div>`;
      return;
    }
    viewer.innerHTML = sections.map((section, index) => {
      const lineHtml = section.lines.length
        ? section.lines.map((line) => `<div class="form-image-viewer-line">${escapeHtml(line) || "&nbsp;"}</div>`).join("")
        : `<div class="form-image-viewer-line form-image-viewer-line-empty">내용 없음</div>`;
      return `
        <div class="form-image-viewer-section" data-section-index="${index}">
          ${section.title ? `<div class="form-image-viewer-section-title">${escapeHtml(section.title)}</div>` : ""}
          <button type="button" class="form-image-section-edit-btn" title="이 섹션 편집" onclick="window.handleFormImageSectionAction && window.handleFormImageSectionAction(event)">Edit</button>
          <button type="button" class="form-image-section-cancel-btn" title="편집 취소" onclick="window.handleFormImageSectionAction && window.handleFormImageSectionAction(event)" hidden>Cancel</button>
          <button type="button" class="form-image-section-copy-btn" title="이 섹션 복사" onclick="window.handleFormImageSectionAction && window.handleFormImageSectionAction(event)">Copy</button>
          <div class="form-image-section-lines-container">${lineHtml}</div>
        </div>
      `;
    }).join("");
    viewer.querySelectorAll(".form-image-section-edit-btn, .form-image-section-cancel-btn, .form-image-section-copy-btn").forEach((button) => {
      button.addEventListener("click", handlePromptViewerAction);
    });
  }

  function syncPromptFromViewerSections(sections) {
    const nextPrompt = serializePromptSections(sections);
    const target = state.targetType;
    const previousOutput = $("formImagePromptPreview")?.value || state.outputs[target] || "";
    state.outputs[target] = nextPrompt;
    const preview = $("formImagePromptPreview");
    if (preview) preview.value = nextPrompt;
    renderPromptHighlight(previousOutput, nextPrompt);
    renderPromptViewer(nextPrompt);
    updatePromptStats(nextPrompt);
    flashPromptUpdated("섹션 편집");
  }

  function copyText(text, onDone) {
    const value = String(text || "");
    const done = () => {
      if (typeof onDone === "function") onDone();
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done();
      });
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    done();
  }

  function handlePromptViewerAction(event) {
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    const sectionEl = event.target.closest(".form-image-viewer-section");
    if (!sectionEl) return;
    const sections = parsePromptSections(currentPrompt());
    const index = Number(sectionEl.dataset.sectionIndex);
    const section = sections[index];
    if (!section) return;

    const copyBtn = event.target.closest(".form-image-section-copy-btn");
    if (copyBtn) {
      const editArea = sectionEl.querySelector(".form-image-section-inline-textarea");
      const lines = editArea ? editArea.value.split(/\r?\n/) : section.lines;
      const text = serializePromptSections([{ title: section.title, lines }]);
      copyText(text, () => {
        copyBtn.textContent = "Copied";
        setStatus(`${section.title || "섹션"}을 복사했습니다.`, "ok");
        window.setTimeout(() => { copyBtn.textContent = "Copy"; }, 1400);
      });
      return;
    }

    const cancelBtn = event.target.closest(".form-image-section-cancel-btn");
    if (cancelBtn) {
      sectionEditOpen = false;
      renderPromptViewer(currentPrompt());
      return;
    }

    const editBtn = event.target.closest(".form-image-section-edit-btn");
    if (!editBtn) return;

    const existingArea = sectionEl.querySelector(".form-image-section-inline-textarea");
    if (existingArea) {
      sections[index] = {
        title: section.title,
        lines: existingArea.value.split(/\r?\n/),
      };
      sectionEditOpen = false;
      syncPromptFromViewerSections(sections);
      setStatus(`${section.title || "섹션"} 편집 내용을 반영했습니다.`, "ok");
      return;
    }

    const linesContainer = sectionEl.querySelector(".form-image-section-lines-container");
    if (!linesContainer) return;
    const openEditor = $("formImagePromptViewer")?.querySelector(".form-image-section-inline-textarea");
    if (openEditor) {
      setStatus("열려 있는 섹션 편집을 먼저 저장하거나 취소하세요.", "error");
      return;
    }
    const textarea = document.createElement("textarea");
    sectionEditOpen = true;
    textarea.className = "form-image-section-inline-textarea";
    textarea.value = section.lines.join("\n");
    textarea.setAttribute("aria-label", `${section.title || "섹션"} 편집`);
    linesContainer.hidden = true;
    sectionEl.appendChild(textarea);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    editBtn.textContent = "Save";
    editBtn.classList.add("is-active");
    const currentCancelBtn = sectionEl.querySelector(".form-image-section-cancel-btn");
    if (currentCancelBtn) currentCancelBtn.hidden = false;
  }
  window.handleFormImageSectionAction = handlePromptViewerAction;

  function scrollToChangedLine(highlight) {
    const preview = $("formImagePromptPreview");
    if (!preview) return;
    const marks = highlight.querySelectorAll(".form-image-diff-mark");
    if (!marks.length) return;
    const first = marks[0];
    const markTop = first.offsetTop;
    const markBottom = markTop + first.offsetHeight;
    const viewTop = preview.scrollTop;
    const viewBottom = viewTop + preview.clientHeight;
    if (markTop >= viewTop && markBottom <= viewBottom) return;
    const target = Math.max(0, markTop - preview.clientHeight / 2 + first.offsetHeight / 2);
    preview.scrollTo({ top: target, behavior: "smooth" });
    highlight.scrollTo({ top: target, behavior: "smooth" });
  }

  function currentPrompt() {
    const target = state.targetType;
    return $("formImagePromptPreview")?.value?.trim() || state.outputs[target] || buildPrompt(target);
  }

  function flashCopyConfirmed() {
    const btn = $("formImageCopyPromptBtn");
    if (!btn) return;
    btn.textContent = "복사 완료";
    btn.classList.add("is-confirmed");
    window.clearTimeout(btn._copyResetTimer);
    btn._copyResetTimer = window.setTimeout(() => {
      btn.textContent = "복사하기";
      btn.classList.remove("is-confirmed");
    }, 1600);
  }

  function copyPrompt() {
    const text = currentPrompt();
    if (!text) {
      setStatus("복사할 프롬프트가 없습니다.", "error");
      return;
    }
    navigator.clipboard?.writeText(text).then(() => {
      setStatus("프롬프트를 복사했습니다.", "ok");
      flashCopyConfirmed();
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setStatus("프롬프트를 복사했습니다.", "ok");
      flashCopyConfirmed();
    });
  }

  function resetContentFields() {
    state.title = "";
    state.subtitle = "";
    state.organization = "";
    state.department = "";
    state.date = "";
    state.presenter = "";
    state.host = "";
    state.organizer = "";
    state.sponsor = "";
    state.partner = "";
    state.canvasRatio = "wide_16_9";
    state.canvasCustomRatio = "";
    state.rolePlacement = "auto";
    state.roleDisplayMode = "plain";
    state.coverTitlePlacement = "ai";
    state.coverVisualPosition = "ai";
    state.dividerNo = "";
    state.dividerKeywords = "";
    state.dividerStrength = "medium";
    state.dividerNumberStyle = "ai";
    state.dividerLayout = "ai";
    state.backgroundSafeArea = "center";
    state.backgroundDecoration = "edge";
    state.backgroundDensity = "very_low";
    state.backgroundBrightness = "bright";
    state.backgroundContent = "text";
    state.backgroundAvoid = "";
    state.toneMemo = "";
    state.mustKeep = "";
    state.avoidNotes = "";
    state.extraNotes = "";
    state.signboardPurpose = "location";
    state.signboardStructure = "blocks";
    state.signboardHierarchy = "title";
    state.signboardEnvironment = "indoor";
    state.signboardInfo = "";
    state.blockPrimary = "";
    state.blockSecondary = "";
    state.blockTertiary = "";
    state.blockNote = "";
    state.qrEnabled = false;
    state.qrUrl = "";
    state.qrSize = "medium";
    state.qrCaption = "";
    state.qrPosition = "auto";
    state.qrEmphasis = false;
    state.farRead = false;
    state.directionDestination = "";
    state.directionArrow = "ai";
    state.directionDistance = "";
    state.directionEmphasis = "strong";
    state.processTitle = "";
    state.processSteps = "3";
    state.processItems = "";
    state.processAfter = "";
    state.programName = "";
    state.programDatePlace = "";
    state.programSchedule = "";
    state.programSpeaker = "";
    state.noticeType = "caution";
    state.noticeTone = "official";
    state.noticeHeadline = "";
    state.noticeDetail = "";
    state.closingType = "thanks";
    state.closingMainText = "";
    state.closingSubText = "";
    state.closingContact = "";
    state.closingEmail = "";
    state.closingWebsite = "";
    state.closingQrEnabled = false;
    state.closingQrUrl = "";
    state.closingQrSize = "medium";
    state.closingQrCaption = "";
    state.closingQrPosition = "auto";
    state.closingQrEmphasis = false;
    state.closingTone = "calm";
    state.textVisibility = {};
    state.strengths = { cover: "strong", divider: "medium", background: "subtle", signboard: "balanced", closing: "medium" };
    state.outputs = { cover: "", divider: "", background: "", signboard: "", closing: "" };

    [
      "formImageTitle", "formImageSubtitle", "formImageOrganization", "formImageDepartment", "formImageDate", "formImagePresenter",
      "formImageHost", "formImageOrganizer", "formImageSponsor", "formImagePartner",
      "formImageCanvasCustomRatio",
      "formImageDividerNo", "formImageDividerKeywords",
      "formImageBackgroundAvoid", "formImageSignboardInfo",
      "formImageBlockPrimary", "formImageBlockSecondary", "formImageBlockTertiary", "formImageBlockNote",
      "formImageQrUrl", "formImageQrCaption",
      "formImageDirectionDestination", "formImageDirectionDistance",
      "formImageProcessTitle", "formImageProcessItems", "formImageProcessAfter",
      "formImageProgramName", "formImageProgramDatePlace", "formImageProgramSchedule", "formImageProgramSpeaker",
      "formImageNoticeHeadline", "formImageNoticeDetail",
      "formImageClosingMainText", "formImageClosingSubText", "formImageClosingContact", "formImageClosingEmail", "formImageClosingWebsite",
      "formImageClosingQrUrl", "formImageClosingQrCaption",
      "formImageToneMemo", "formImageMustKeep", "formImageAvoidNotes", "formImageExtraNotes",
    ].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });
    if ($("formImageCanvasRatio")) $("formImageCanvasRatio").value = "wide_16_9";
    if ($("formImageCanvasCustomRatio")) $("formImageCanvasCustomRatio").value = "";
    if ($("formImageRolePlacement")) $("formImageRolePlacement").value = "auto";
    if ($("formImageRoleDisplayMode")) $("formImageRoleDisplayMode").value = "plain";
    if ($("formImageCoverTitlePlacement")) $("formImageCoverTitlePlacement").value = "ai";
    if ($("formImageCoverVisualPosition")) $("formImageCoverVisualPosition").value = "ai";
    if ($("formImageDividerStrength")) $("formImageDividerStrength").value = "medium";
    if ($("formImageDividerNumberStyle")) $("formImageDividerNumberStyle").value = "ai";
    if ($("formImageDividerLayout")) $("formImageDividerLayout").value = "ai";
    if ($("formImageBackgroundSafeArea")) $("formImageBackgroundSafeArea").value = "center";
    if ($("formImageBackgroundDecoration")) $("formImageBackgroundDecoration").value = "edge";
    if ($("formImageBackgroundDensity")) $("formImageBackgroundDensity").value = "very_low";
    if ($("formImageBackgroundBrightness")) $("formImageBackgroundBrightness").value = "bright";
    if ($("formImageBackgroundContent")) $("formImageBackgroundContent").value = "text";
    if ($("formImageSignboardPurpose")) $("formImageSignboardPurpose").value = "location";
    if ($("formImageSignboardHierarchy")) $("formImageSignboardHierarchy").value = "title";
    if ($("formImageSignboardEnvironment")) $("formImageSignboardEnvironment").value = "indoor";
    if ($("formImageQrSize")) $("formImageQrSize").value = "medium";
    if ($("formImageQrPosition")) $("formImageQrPosition").value = "auto";
    if ($("formImageDirectionArrow")) $("formImageDirectionArrow").value = "ai";
    if ($("formImageDirectionEmphasis")) $("formImageDirectionEmphasis").value = "strong";
    if ($("formImageProcessSteps")) $("formImageProcessSteps").value = "3";
    if ($("formImageNoticeType")) $("formImageNoticeType").value = "caution";
    if ($("formImageNoticeTone")) $("formImageNoticeTone").value = "official";
    if ($("formImageClosingType")) $("formImageClosingType").value = "thanks";
    if ($("formImageClosingTone")) $("formImageClosingTone").value = "calm";
    if ($("formImageClosingQrSize")) $("formImageClosingQrSize").value = "medium";
    if ($("formImageClosingQrPosition")) $("formImageClosingQrPosition").value = "auto";
    ["formImageFarRead", "formImageQrEnabled", "formImageQrEmphasis", "formImageClosingQrEnabled", "formImageClosingQrEmphasis"].forEach((id) => {
      const el = $(id);
      if (el) el.checked = false;
    });
  }

  function resetAll() {
    sectionEditOpen = false;
    skipNextFieldChangePreview = false;
    state.mode = "single";
    state.targetType = "cover";
    state.resultTarget = "cover";
    state.mixerStyle = null;
    state.sampleCursor = {};
    resetContentFields();

    setMode("single");
    setTarget("cover");
    renderMixerSummary();
    updateSignboardPanels();
    updateClosingTypeUI();
    updateCanvasRatioUI();
    syncTextToggleButtons();
    setStatus("초기화했습니다.", "ok");
  }

  function setFieldValue(id, value) {
    if (id === "formImageExtraNotes" && ($("formImageMustKeep") || $("formImageAvoidNotes"))) {
      const text = value || "";
      const mustMatch = text.match(/Must keep:\s*([^\n]+)/i);
      const avoidMatch = text.match(/Avoid:\s*([^\n]+)/i);
      if ($("formImageMustKeep")) $("formImageMustKeep").value = mustMatch ? mustMatch[1].trim() : text;
      if ($("formImageAvoidNotes")) $("formImageAvoidNotes").value = avoidMatch ? avoidMatch[1].trim() : "";
    }
    const el = $(id);
    if (!el) return;
    el.value = value || "";
  }

  function applyTonePreset(button) {
    const preset = button?.dataset?.tonePreset || "";
    if (!preset) return;
    setFieldValue("formImageToneMemo", preset);
    document.querySelectorAll("[data-tone-preset]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    syncStateFromInputs();
    generatePrompts();
  }

  function applySampleStyle() {
    window.applyMixerToFormImage({
      nameKo: "차분한 기관형 블루 시스템",
      nameEn: "Calm Institutional Blue System",
      prompt: "clean institutional editorial design, subtle layered blue geometric forms, premium Korean public-sector presentation style",
      palette: { colors: ["#1f5eff", "#0f766e", "#eff6ff", "#f8fafc", "#111827"] },
      mediumKo: "모던 에디토리얼 그래픽",
      mediumEn: "Modern Editorial Graphic",
      mediumRendering: "soft gradients, clean vector-like depth, restrained texture",
      colorRoles: "deep blue primary, teal accent, bright neutral background",
      layoutFeel: "structured editorial grid with generous white space",
      typographyGuidance: "clean Korean sans-serif hierarchy with strong readability",
    });
  }

  function applyInstitutionRandomVisual() {
    const button = $("btnMixerInstRandomForm");
    if (button) {
      button.click();
      setStatus("공공/기관 테마 안에서 랜덤 비주얼과 색상 테마를 적용했습니다.", "ok");
      return;
    }
    const samples = [
      {
        nameKo: "공공기관 블루 보고서",
        nameEn: "Public Institution Blue Report",
        prompt: "clean public institution report style, structured editorial grid, calm blue official visual language, subtle city and data motifs",
        palette: { colors: ["#0b3a75", "#1f6fb2", "#eaf3ff", "#ffffff", "#2f855a"] },
        mediumKo: "공공기관 문서형",
        mediumEn: "Institutional Document Visual",
        mediumRendering: "clean matte surfaces, crisp vector-like graphic depth",
        colorRoles: "official navy and blue base, white background, restrained green accent",
        layoutFeel: "formal grid with generous margins",
        typographyGuidance: "clear Korean sans-serif hierarchy",
      },
      {
        nameKo: "스마트 행정 데이터",
        nameEn: "Smart Public Data",
        prompt: "institutional smart-city data visualization mood, refined network lines, clean civic technology aesthetic",
        palette: { colors: ["#12355b", "#1d8acb", "#f7fbff", "#d9e6f2", "#18a999"] },
        mediumKo: "공공 데이터 비주얼",
        mediumEn: "Public Data Visual",
        mediumRendering: "subtle gradients, clean line systems, low-noise background",
        colorRoles: "deep civic blue, sky blue, neutral white, teal accent",
        layoutFeel: "stable information-design composition",
        typographyGuidance: "modern sans-serif with formal spacing",
      },
    ];
    window.applyMixerToFormImage(samples[Math.floor(Math.random() * samples.length)]);
    setStatus("기관용 랜덤 비주얼을 적용했습니다.", "ok");
  }

  function resetPaletteOnly() {
    if (!state.mixerStyle) {
      setStatus("초기화할 색상 테마가 없습니다.", "error");
      return;
    }
    state.mixerStyle = {
      ...state.mixerStyle,
      palette: null,
      colorRoles: "Use a restrained default institutional palette suitable for Korean public/business document images.",
    };
    renderMixerSummary();
    generatePrompts();
    setStatus("색상 테마만 초기화했습니다.", "ok");
  }

  const SAMPLE_SETS = {
    cover: [
      {
        note: "결과보고형 표지",
        fields: {
          formImageTitle: "지역 혁신사업 결과보고서",
          formImageSubtitle: "2026년 추진성과 및 향후 계획",
          formImageOrganization: "샘플혁신지원센터",
          formImageDepartment: "전략기획팀",
          formImageDate: "2026.06.22.",
          formImagePresenter: "샘플담당자",
          formImageHost: "해솔시",
          formImageOrganizer: "샘플혁신지원센터",
          formImageCanvasRatio: "wide_16_9",
          formImageRolePlacement: "bottom",
          formImageRoleDisplayMode: "plain",
          formImageCoverTitlePlacement: "center",
          formImageCoverVisualPosition: "right",
          formImageToneMemo: "공공기관 결과보고서처럼 차분하고 신뢰감 있게",
          formImageExtraNotes: "넓은 여백과 명확한 위계를 유지하고, 과한 장식은 피하기",
        },
      },
      {
        note: "행사 초청장형 표지",
        fields: {
          formImageTitle: "2026 지역혁신 컨퍼런스",
          formImageSubtitle: "지역과 산업이 함께 만드는 다음 10년",
          formImageOrganization: "경상북도경제진흥원",
          formImageDate: "2026.09.10.",
          formImageHost: "경상북도",
          formImageOrganizer: "경상북도경제진흥원",
          formImageSponsor: "중소벤처기업부",
          formImagePartner: "지역 청년창업 네트워크",
          formImageCanvasRatio: "a4_portrait",
          formImageRolePlacement: "distributed",
          formImageRoleDisplayMode: "subtle",
          formImageCoverTitlePlacement: "left",
          formImageCoverVisualPosition: "full",
          formImageToneMemo: "행사 초청장처럼 활기 있지만 과하지 않게",
          formImageExtraNotes: "가짜 로고, 임의 스폰서명 생성 금지",
        },
      },
      {
        note: "내부 워크숍 표지",
        fields: {
          formImageTitle: "2026년 상반기 전략워크숍",
          formImageSubtitle: "부서별 실행 과제 점검",
          formImageOrganization: "수도권혁신지원센터",
          formImageDepartment: "경영기획실",
          formImageDate: "2026.03.14.",
          formImagePresenter: "이수현 실장",
          formImageOrganizer: "수도권혁신지원센터",
          formImageCanvasRatio: "wide_16_9",
          formImageCoverTitlePlacement: "top",
          formImageCoverVisualPosition: "corner",
          formImageToneMemo: "내부 워크숍 자료처럼 실용적이고 담백하게",
          formImageExtraNotes: "과한 그래픽 요소, 화려한 장식 지양",
        },
      },
    ],
    divider: [
      {
        note: "성과/협력 섹션",
        fields: {
          formImageTitle: "성과 및 협력 현황",
          formImageSubtitle: "주요 지표로 보는 추진 실적",
          formImageOrganization: "샘플혁신지원센터",
          formImageDividerNo: "01",
          formImageDividerKeywords: "성과, 협력, 데이터",
          formImageDividerStrength: "strong",
          formImageDividerNumberStyle: "large",
          formImageDividerLayout: "left",
        },
      },
      {
        note: "정책 기획 섹션",
        fields: {
          formImageTitle: "정책 기획 방향",
          formImageSubtitle: "중장기 로드맵과 실행 전략",
          formImageOrganization: "경상북도경제진흥원",
          formImageDividerNo: "PART 2",
          formImageDividerKeywords: "정책, 로드맵, 전략",
          formImageDividerStrength: "medium",
          formImageDividerNumberStyle: "small",
          formImageDividerLayout: "center",
        },
      },
      {
        note: "예산/향후계획 섹션",
        fields: {
          formImageTitle: "예산 및 향후 계획",
          formImageSubtitle: "2027년 확대 방안",
          formImageOrganization: "수도권혁신지원센터",
          formImageDividerNo: "Ⅲ",
          formImageDividerKeywords: "예산, 확대, 지속가능성",
          formImageDividerStrength: "subtle",
          formImageDividerNumberStyle: "none",
          formImageDividerLayout: "diagonal",
        },
      },
    ],
    background: [
      {
        note: "본문 텍스트용 배경",
        fields: {
          formImageBackgroundSafeArea: "center",
          formImageBackgroundDecoration: "edge",
          formImageBackgroundDensity: "very_low",
          formImageBackgroundBrightness: "bright",
          formImageBackgroundContent: "text",
          formImageBackgroundAvoid: "중앙 오브젝트, 진한 그림자, 실제 글자",
          formImageToneMemo: "깔끔한 공공기관 문서 배경처럼",
          formImageExtraNotes: "가짜 텍스트, 워터마크 금지",
        },
      },
      {
        note: "차트/데이터용 배경",
        fields: {
          formImageBackgroundSafeArea: "left",
          formImageBackgroundDecoration: "right",
          formImageBackgroundDensity: "low",
          formImageBackgroundBrightness: "medium",
          formImageBackgroundContent: "chart",
          formImageBackgroundAvoid: "복잡한 패턴, 사람 형상, 로고",
          formImageToneMemo: "데이터 시각화 슬라이드에 어울리는 절제된 배경",
          formImageExtraNotes: "과도한 채도, 어두운 중앙 영역 지양",
        },
      },
      {
        note: "사진 콘텐츠용 배경",
        fields: {
          formImageBackgroundSafeArea: "top",
          formImageBackgroundDecoration: "bottom",
          formImageBackgroundDensity: "medium",
          formImageBackgroundBrightness: "ai",
          formImageBackgroundContent: "photo",
          formImageBackgroundAvoid: "글자, 로고, 워터마크, 강한 그림자",
          formImageToneMemo: "현장감 있는 사진 위주 배경, 상단은 제목 공간으로 비우기",
          formImageExtraNotes: "사람 얼굴 클로즈업 금지, 저작권 이슈 있는 이미지 지양",
        },
      },
    ],
    signboard: [
      {
        note: "위치 안내 (블록형)",
        fields: {
          formImageTitle: "방문 안내",
          formImageOrganization: "샘플혁신지원센터",
          formImageSignboardPurpose: "location",
          formImageSignboardHierarchy: "blocks",
          formImageSignboardEnvironment: "indoor",
          formImageBlockPrimary: "접수처",
          formImageBlockSecondary: "2층 로비 오른쪽",
          formImageBlockTertiary: "엘리베이터 옆 / 09:00-18:00",
          formImageBlockNote: "장소명, 위치, 문의 순서로 빠르게 읽히게 구성",
          formImageQrUrl: "https://www.example.com",
          formImageQrCaption: "스캔해서 상세 안내 보기",
          formImageQrSize: "medium",
          formImageQrPosition: "bottom-right",
        },
        checks: { formImageFarRead: false, formImageQrEnabled: true },
      },
      {
        note: "평가장 안내 (블록형)",
        fields: {
          formImageTitle: "평가장 안내",
          formImageOrganization: "샘플혁신지원센터",
          formImageSignboardPurpose: "location",
          formImageSignboardHierarchy: "blocks",
          formImageSignboardEnvironment: "indoor",
          formImageBlockPrimary: "평가장 A",
          formImageBlockSecondary: "3층 대회의실",
          formImageBlockTertiary: "입실 마감 09:50 / 지참물: 신분증",
          formImageBlockNote: "평가장 위치, 입실 마감, 지참물 순서로 빠르게 읽히게 구성",
        },
        checks: { formImageFarRead: true, formImageQrEnabled: false },
      },
      {
        note: "교육장 안내 (블록형)",
        fields: {
          formImageTitle: "교육장 안내",
          formImageOrganization: "경상북도경제진흥원",
          formImageSignboardPurpose: "location",
          formImageSignboardHierarchy: "blocks",
          formImageSignboardEnvironment: "indoor",
          formImageBlockPrimary: "교육장 B",
          formImageBlockSecondary: "2층 세미나실",
          formImageBlockTertiary: "09:00 입장 시작 / 좌석은 선착순",
          formImageBlockNote: "교육장 위치, 입장 시간, 좌석 안내 순서로 구성",
          formImageQrUrl: "https://www.gbedu.or.kr/material",
          formImageQrCaption: "교육자료 다운로드",
          formImageQrSize: "small",
          formImageQrPosition: "inline-info",
        },
        checks: { formImageFarRead: false, formImageQrEnabled: true },
      },
      {
        note: "대기실 안내 (블록형)",
        fields: {
          formImageTitle: "대기실 안내",
          formImageOrganization: "수도권혁신지원센터",
          formImageSignboardPurpose: "location",
          formImageSignboardHierarchy: "blocks",
          formImageSignboardEnvironment: "indoor",
          formImageBlockPrimary: "대기실",
          formImageBlockSecondary: "1층 로비 안쪽",
          formImageBlockTertiary: "호출 순서대로 입장 / 음료 제공",
          formImageBlockNote: "대기 장소, 입장 방식, 편의 안내 순서로 구성",
        },
        checks: { formImageFarRead: false, formImageQrEnabled: false },
      },
      {
        note: "방향 안내 (화살표형)",
        fields: {
          formImageTitle: "세미나실 A 안내",
          formImageOrganization: "경상북도경제진흥원",
          formImageSignboardPurpose: "direction",
          formImageSignboardHierarchy: "arrow",
          formImageSignboardEnvironment: "outdoor",
          formImageDirectionDestination: "세미나실 A",
          formImageDirectionArrow: "right",
          formImageDirectionDistance: "도보 2분",
          formImageDirectionEmphasis: "strong",
        },
        checks: { formImageFarRead: true, formImageQrEnabled: false },
      },
      {
        note: "절차 안내 (단계형)",
        fields: {
          formImageTitle: "참가 등록 절차",
          formImageOrganization: "수도권혁신지원센터",
          formImageSignboardPurpose: "process",
          formImageSignboardHierarchy: "blocks",
          formImageSignboardEnvironment: "indoor",
          formImageProcessTitle: "참가 등록 절차",
          formImageProcessSteps: "3",
          formImageProcessItems: "1. 접수 확인 / 2. 명찰 수령 / 3. 세션 입장",
          formImageProcessAfter: "문의는 운영데스크로 방문해 주세요.",
        },
        checks: { formImageFarRead: false, formImageQrEnabled: false },
      },
      {
        note: "일정 안내 (프로그램형)",
        fields: {
          formImageTitle: "지역 혁신사업 성과공유회",
          formImageOrganization: "샘플혁신지원센터",
          formImageSignboardPurpose: "program",
          formImageSignboardHierarchy: "title",
          formImageSignboardEnvironment: "slide",
          formImageProgramName: "지역 혁신사업 성과공유회",
          formImageProgramDatePlace: "2026.06.22. / 컨퍼런스룸 A",
          formImageProgramSchedule: "10:00 개회 / 10:30 성과 발표 / 12:00 네트워킹",
          formImageProgramSpeaker: "샘플담당자 기획팀장",
          formImageQrUrl: "https://www.example.com/event",
          formImageQrCaption: "세부 일정 확인하기",
          formImageQrSize: "small",
          formImageQrPosition: "inline-info",
        },
        checks: { formImageFarRead: false, formImageQrEnabled: true },
      },
      {
        note: "주의/공지 안내",
        fields: {
          formImageTitle: "촬영 제한 안내",
          formImageOrganization: "샘플혁신지원센터",
          formImageSignboardPurpose: "notice",
          formImageSignboardHierarchy: "icon",
          formImageSignboardEnvironment: "print",
          formImageNoticeType: "prohibited",
          formImageNoticeTone: "official",
          formImageNoticeHeadline: "행사장 내 촬영은 제한됩니다",
          formImageNoticeDetail: "사전 승인된 인원만 촬영할 수 있습니다.",
        },
        checks: { formImageFarRead: true, formImageQrEnabled: false },
      },
    ],
    closing: [
      {
        note: "경청 감사형",
        fields: {
          formImageOrganization: "샘플혁신지원센터",
          formImageClosingType: "thanks_listen",
          formImageClosingTone: "official",
          formImageClosingContact: "샘플혁신지원센터 전략기획팀",
          formImageClosingEmail: "strategy@example.com",
          formImageClosingWebsite: "www.example.com",
          formImageClosingQrUrl: "https://www.example.com/report",
          formImageClosingQrCaption: "보고서 전문 내려받기",
          formImageClosingQrSize: "medium",
          formImageClosingQrPosition: "bottom-right",
        },
        checks: { formImageClosingQrEnabled: true },
      },
      {
        note: "질의응답형",
        fields: {
          formImageOrganization: "경상북도경제진흥원",
          formImageClosingType: "qna",
          formImageClosingTone: "qna",
          formImageClosingMainText: "질의응답",
          formImageClosingSubText: "편하게 질문해주세요",
        },
        checks: { formImageClosingQrEnabled: false },
      },
      {
        note: "직접 입력형 인사말",
        fields: {
          formImageOrganization: "수도권혁신지원센터",
          formImageClosingType: "custom",
          formImageClosingTone: "warm",
          formImageClosingMainText: "함께해주셔서 감사합니다",
          formImageClosingSubText: "다음 만남을 기대합니다",
          formImageClosingContact: "수도권혁신지원센터 경영기획실",
          formImageClosingEmail: "contact@example.com",
          formImageClosingWebsite: "www.example.com",
          formImageClosingQrUrl: "https://www.example.com/report",
          formImageClosingQrCaption: "보고서 전문 내려받기",
          formImageClosingQrSize: "large",
          formImageClosingQrPosition: "inline-info",
        },
        checks: { formImageClosingQrEnabled: true },
      },
    ],
  };

  function fillSample() {
    const target = state.targetType;
    const variations = SAMPLE_SETS[target];
    if (!variations || !variations.length) {
      setStatus("이 양식 유형은 아직 샘플 데이터가 없습니다.", "error");
      return;
    }
    const cursor = state.sampleCursor[target] ?? -1;
    const nextIndex = (cursor + 1) % variations.length;
    state.sampleCursor[target] = nextIndex;
    const variation = variations[nextIndex];

    resetContentFields();
    Object.entries(variation.fields || {}).forEach(([id, value]) => setFieldValue(id, value));
    Object.entries(variation.checks || {}).forEach(([id, value]) => {
      const el = $(id);
      if (el) el.checked = value;
    });

    state.textVisibility = {};
    syncStateFromInputs();
    updateSignboardPanels();
    updateClosingTypeUI();
    updateCanvasRatioUI();
    renderTextToggles();
    generatePrompts();
    setStatus(`${TARGETS[target]?.label || "양식"} 샘플 ${nextIndex + 1}/${variations.length} (${variation.note})을 채웠습니다.`, "ok");
  }

  function bind() {
    renderTextToggles();
    $("formImageModeGroup")?.addEventListener("click", (event) => {
      const mode = event.target.closest("[data-form-mode]")?.dataset.formMode;
      if (mode) setMode(mode);
    });
    $("formImageTargetGroup")?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-form-target]")?.dataset.formTarget;
      if (target) setTarget(target);
    });
    $("formImageResultTabs")?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-result-target]")?.dataset.resultTarget;
      if (!TARGETS[target]) return;
      state.resultTarget = target;
      renderResultTabs();
      updatePreview();
    });
    $("formImageSetMap")?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-map-target]")?.dataset.mapTarget;
      if (!TARGETS[target]) return;
      if (state.mode === "set") {
        state.resultTarget = target;
      } else {
        state.targetType = target;
        setPressed($("formImageTargetGroup"), "data-form-target", target);
      }
      updateTypePanels();
      renderResultTabs();
      updatePreview();
    });
    $("formImageSetOverview")?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-overview-target]")?.dataset.overviewTarget;
      if (!TARGETS[target]) return;
      state.resultTarget = target;
      renderResultTabs();
      updatePreview();
    });
    $("formImagePromptViewer")?.addEventListener("mousedown", (event) => {
      if (event.target.closest(".form-image-section-edit-btn, .form-image-section-cancel-btn")) {
        if (event.target.closest(".form-image-section-edit-btn")) sectionEditOpen = true;
        skipNextFieldChangePreview = true;
      }
    }, true);
    $("formImagePromptViewer")?.addEventListener("click", (event) => {
      const sectionEl = event.target.closest(".form-image-viewer-section");
      if (!sectionEl) return;
      const sections = parsePromptSections(currentPrompt());
      const index = Number(sectionEl.dataset.sectionIndex);
      const section = sections[index];
      if (!section) return;

      const copyBtn = event.target.closest(".form-image-section-copy-btn");
      if (copyBtn) {
        const editArea = sectionEl.querySelector(".form-image-section-inline-textarea");
        const lines = editArea ? editArea.value.split(/\r?\n/) : section.lines;
        const text = serializePromptSections([{ title: section.title, lines }]);
        copyText(text, () => {
          copyBtn.textContent = "Copied";
          setStatus(`${section.title || "섹션"}을 복사했습니다.`, "ok");
          window.setTimeout(() => { copyBtn.textContent = "Copy"; }, 1400);
        });
        return;
      }

      const cancelBtn = event.target.closest(".form-image-section-cancel-btn");
      if (cancelBtn) {
        renderPromptViewer(currentPrompt());
        return;
      }

      const editBtn = event.target.closest(".form-image-section-edit-btn");
      if (!editBtn) return;

      const existingArea = sectionEl.querySelector(".form-image-section-inline-textarea");
      if (existingArea) {
        sections[index] = {
          title: section.title,
          lines: existingArea.value.split(/\r?\n/),
        };
        syncPromptFromViewerSections(sections);
        setStatus(`${section.title || "섹션"} 편집 내용을 반영했습니다.`, "ok");
        return;
      }

      const linesContainer = sectionEl.querySelector(".form-image-section-lines-container");
      if (!linesContainer) return;
      const openEditor = $("formImagePromptViewer")?.querySelector(".form-image-section-inline-textarea");
      if (openEditor) {
        setStatus("열려 있는 섹션 편집을 먼저 저장하거나 취소하세요.", "error");
        return;
      }
      const textarea = document.createElement("textarea");
      textarea.className = "form-image-section-inline-textarea";
      textarea.value = section.lines.join("\n");
      textarea.setAttribute("aria-label", `${section.title || "섹션"} 편집`);
      linesContainer.hidden = true;
      sectionEl.appendChild(textarea);
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      editBtn.textContent = "Save";
      editBtn.classList.add("is-active");
      const currentCancelBtn = sectionEl.querySelector(".form-image-section-cancel-btn");
      if (currentCancelBtn) currentCancelBtn.hidden = false;
    });
    $("formImageToneChips")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tone-preset]");
      if (button) applyTonePreset(button);
    });
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-text-toggle]");
      if (!button || !$("paneFormImage")?.contains(button)) return;
      const key = button.dataset.textToggle;
      state.textVisibility[key] = !textVisible(key);
      syncTextToggleButtons();
      generatePrompts();
    });
    $("formImageStrengths")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-strength]");
      const row = event.target.closest("[data-strength-row]");
      if (!button || !row) return;
      const target = row.dataset.strengthRow;
      state.strengths[target] = button.dataset.strength;
      renderStrengths();
      generatePrompts();
    });

    [
      "formImageTitle", "formImageSubtitle", "formImageOrganization", "formImageDepartment", "formImageDate", "formImagePresenter",
      "formImageHost", "formImageOrganizer", "formImageSponsor", "formImagePartner",
      "formImageCanvasRatio", "formImageCanvasCustomRatio", "formImageRolePlacement", "formImageRoleDisplayMode",
      "formImageCoverTitlePlacement", "formImageCoverVisualPosition",
      "formImageDividerNo", "formImageDividerKeywords",
      "formImageDividerStrength", "formImageDividerNumberStyle", "formImageDividerLayout",
      "formImageBackgroundSafeArea", "formImageBackgroundDecoration", "formImageBackgroundDensity",
      "formImageBackgroundBrightness", "formImageBackgroundContent", "formImageBackgroundAvoid",
      "formImageToneMemo", "formImageMustKeep", "formImageAvoidNotes", "formImageExtraNotes", "formImageSignboardPurpose",
      "formImageSignboardHierarchy", "formImageSignboardEnvironment", "formImageSignboardInfo",
      "formImageBlockPrimary", "formImageBlockSecondary", "formImageBlockTertiary", "formImageBlockNote",
      "formImageQrEnabled", "formImageQrUrl", "formImageQrSize", "formImageQrCaption", "formImageQrPosition", "formImageQrEmphasis",
      "formImageFarRead",
      "formImageDirectionDestination", "formImageDirectionArrow", "formImageDirectionDistance", "formImageDirectionEmphasis",
      "formImageProcessTitle", "formImageProcessSteps", "formImageProcessItems", "formImageProcessAfter",
      "formImageProgramName", "formImageProgramDatePlace", "formImageProgramSchedule", "formImageProgramSpeaker",
      "formImageNoticeType", "formImageNoticeTone", "formImageNoticeHeadline", "formImageNoticeDetail",
      "formImageClosingType", "formImageClosingMainText", "formImageClosingSubText", "formImageClosingContact",
      "formImageClosingEmail", "formImageClosingWebsite", "formImageClosingTone",
      "formImageClosingQrEnabled", "formImageClosingQrUrl", "formImageClosingQrSize", "formImageClosingQrCaption",
      "formImageClosingQrPosition", "formImageClosingQrEmphasis",
    ].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", () => {
        const label = changedLabel(el);
        syncStateFromInputs();
        if (id === "formImageCanvasRatio") updateCanvasRatioUI();
        if (id === "formImageSignboardPurpose" || id === "formImageQrEnabled" || id === "formImageClosingQrEnabled") updateSignboardPanels();
        if (id === "formImageClosingType") updateClosingTypeUI(true);
        updatePreview();
        flashChangedInput(el);
        flashPromptUpdated(label);
      });
      el.addEventListener("change", () => {
        if (skipNextFieldChangePreview) {
          skipNextFieldChangePreview = false;
          return;
        }
        const label = changedLabel(el);
        syncStateFromInputs();
        if (id === "formImageCanvasRatio") updateCanvasRatioUI();
        if (id === "formImageSignboardPurpose" || id === "formImageQrEnabled" || id === "formImageClosingQrEnabled") updateSignboardPanels();
        if (id === "formImageClosingType") updateClosingTypeUI(true);
        updatePreview();
        flashChangedInput(el);
        flashPromptUpdated(label);
      });
    });

    $("formImageCopyPromptBtn")?.addEventListener("click", copyPrompt);
    $("formImageSampleBtn")?.addEventListener("click", fillSample);
    $("formImageResetBtn")?.addEventListener("click", resetAll);
    $("formImageGoMixerBtn")?.addEventListener("click", () => $("tabBtnConceptMixer")?.click());
    $("formImageChangeMixerBtn")?.addEventListener("click", () => $("tabBtnConceptMixer")?.click());
    $("formImageClearMixerBtn")?.addEventListener("click", () => {
      state.mixerStyle = null;
      renderMixerSummary();
      generatePrompts();
    });
    $("formImageSampleStyleBtn")?.addEventListener("click", applySampleStyle);
    $("formImageRandomInstitutionBtn")?.addEventListener("click", applyInstitutionRandomVisual);
    $("formImageRandomInstitutionBtnSummary")?.addEventListener("click", applyInstitutionRandomVisual);
    $("formImageRandomInstitutionBtnResult")?.addEventListener("click", applyInstitutionRandomVisual);
    $("formImageResetPaletteBtn")?.addEventListener("click", resetPaletteOnly);

    const promptPreview = $("formImagePromptPreview");
    const promptHighlight = $("formImagePromptHighlight");
    if (promptPreview && promptHighlight) {
      promptPreview.addEventListener("input", () => {
        promptHighlight.textContent = promptPreview.value;
        renderPromptViewer(promptPreview.value);
        updatePromptStats(promptPreview.value);
      });
      promptPreview.addEventListener("scroll", () => {
        promptHighlight.scrollTop = promptPreview.scrollTop;
        promptHighlight.scrollLeft = promptPreview.scrollLeft;
      });
      if (window.ResizeObserver) {
        new ResizeObserver(() => {
          promptHighlight.style.height = `${promptPreview.offsetHeight}px`;
        }).observe(promptPreview);
      }
    }
  }

  window.applyMixerToFormImage = function (mixerData) {
    state.mixerStyle = {
      nameKo: mixerData?.nameKo || "",
      nameEn: mixerData?.nameEn || "",
      prompt: mixerData?.prompt || mixerData?.promotionPrompt || "",
      subjectKo: mixerData?.subjectKo || "",
      subjectEn: mixerData?.subjectEn || "",
      mediumKo: mixerData?.mediumKo || "",
      mediumEn: mixerData?.mediumEn || "",
      mediumRendering: mixerData?.mediumRendering || "",
      colorRoles: mixerData?.colorRoles || mixerData?.promptParts?.paletteStrategy || "",
      textureInfo: mixerData?.textureInfo || mixerData?.promptParts?.textureRendering || "",
      layoutFeel: mixerData?.layoutFeel || mixerData?.promptParts?.layoutBehavior || "",
      typographyGuidance: mixerData?.typographyGuidance || mixerData?.promptParts?.typographyGuidance || "",
      palette: mixerData?.palette || null,
      promptParts: mixerData?.promptParts || null,
    };
    renderMixerSummary();
    generatePrompts();
    $("tabBtnFormImage")?.click();
  };

  window.getCurrentFormImagePrompt = function () {
    return currentPrompt();
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (!$("paneFormImage")) return;
    bind();
    renderMixerSummary();
    setMode("single");
    setTarget("cover");
    updateClosingTypeUI();
    updateCanvasRatioUI();
    updatePreview();
  });
})();
