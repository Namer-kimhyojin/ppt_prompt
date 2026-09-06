// src/qr-generator.js

(function () {
  // DOM \uC694\uC18C \uCC38\uC870
  const pane = document.getElementById("paneQrGenerator");
  if (!pane) return;

  const typeButtons = pane.querySelectorAll(".qr-type-btn");
  const inputGroups = pane.querySelectorAll(".qr-input-group");
  const container = document.getElementById("qrCodeContainer");
  const btnPaste = document.getElementById("btnQrPasteClipboard");
  const qrInputText = document.getElementById("qrInputText");
  const btnClearCurrent = document.getElementById("btnQrClearCurrent");
  const btnShortenUrl = document.getElementById("btnQrShortenUrl");
  const qrShortUrlPanel = document.getElementById("qrShortUrlPanel");
  const qrShortUrlOutput = document.getElementById("qrShortUrlOutput");
  const qrShortUrlStatus = document.getElementById("qrShortUrlStatus");
  const qrAutoShortenLongUrl = document.getElementById("qrAutoShortenLongUrl");
  const btnCopyShortUrl = document.getElementById("btnQrCopyShortUrl");
  const btnRestoreLongUrl = document.getElementById("btnQrRestoreLongUrl");
  const qrLabelText = document.getElementById("qrLabelText");
  const qrPrintTitle = document.getElementById("qrPrintTitle");
  const qrPrintSubtitle = document.getElementById("qrPrintSubtitle");
  const qrPrintBadge = document.getElementById("qrPrintBadge");
  const qrPrintTemplateCards = document.getElementById("qrPrintTemplateCards");
  const qrPrintPreviewSheet = document.getElementById("qrPrintPreviewSheet");
  const qrTemplateHint = document.getElementById("qrTemplateHint");
  const qrPrintModal = document.getElementById("qrPrintModal");
  const qrPrintModalCloseBtn = document.getElementById("qrPrintModalCloseBtn");
  const qrPrintModalPrintBtn = document.getElementById("qrPrintModalPrintBtn");
  const qrPrintRefreshPreviewBtn = document.getElementById("qrPrintRefreshPreviewBtn");
  const logoFile = document.getElementById("qrLogoFile");
  const btnLogoUpload = document.getElementById("btnQrLogoUpload");
  const logoName = document.getElementById("qrLogoName");
  const btnRemoveLogo = document.getElementById("btnQrRemoveLogo");
  const logoOptionRow = document.getElementById("qrLogoOptionRow");
  const logoSizeRatio = document.getElementById("qrLogoSizeRatio");

  // \uC2A4\uD0C0\uC77C 옵션\uB4E4
  const qrColorDark = document.getElementById("qrColorDark");
  const qrColorDarkHex = document.getElementById("qrColorDarkHex");
  const qrColorLight = document.getElementById("qrColorLight");
  const qrColorLightHex = document.getElementById("qrColorLightHex");
  const qrOptionSize = document.getElementById("qrOptionSize");
  const qrOptionMargin = document.getElementById("qrOptionMargin");
  const qrOptionEcc = document.getElementById("qrOptionEcc");

  // 스타일 \uD655\uC7A5 옵션\uB4E4
  const qrOptionRoundDots = document.getElementById("qrOptionRoundDots");
  const qrOptionCustomEyeColor = document.getElementById("qrOptionCustomEyeColor");
  const qrColorEye = document.getElementById("qrColorEye");
  const qrColorEyeHex = document.getElementById("qrColorEyeHex");
  const qrEyeColorRow = document.getElementById("qrEyeColorRow");

  // 소셜 \uD50C\uB7AB\uD3FC \uBCC0\uACBD \uC694\uC18C
  const qrSocialPlatform = document.getElementById("qrSocialPlatform");
  const qrSocialId = document.getElementById("qrSocialId");
  const qrSocialHelpText = document.getElementById("qrSocialHelpText");

  // \uC778\uC1C4 옵션
  const qrPrintLayout = document.getElementById("qrPrintLayout");
  const qrPrintTemplate = document.getElementById("qrPrintTemplate");
  const qrPrintBorder = document.getElementById("qrPrintBorder");
  const qrPrintAccentColor = document.getElementById("qrPrintAccentColor");
  const qrPrintAccentHex = document.getElementById("qrPrintAccentHex");
  const qrPrintDensity = document.getElementById("qrPrintDensity");
  const qrPrintAlign = document.getElementById("qrPrintAlign");
  const qrPrintShowBadge = document.getElementById("qrPrintShowBadge");
  const qrPrintShowSubtitle = document.getElementById("qrPrintShowSubtitle");
  const qrPrintShowInfo = document.getElementById("qrPrintShowInfo");
  const qrPrintShowFooter = document.getElementById("qrPrintShowFooter");
  const qrPrintResetCopyBtn = document.getElementById("qrPrintResetCopyBtn");
  const qrPrintInfoRows = document.getElementById("qrPrintInfoRows");
  const qrPrintInfoAddBtn = document.getElementById("qrPrintInfoAddBtn");
  const printInfoRowRefs = []; // { row, label, value } - 세부 정보는 동적으로 추가/삭제 가능
  const MAX_PRINT_INFO_ROWS = 8;

  // \uC2E4\uC2DC\uAC04 \uBD84\uC11D 대시보드 \uC694\uC18C
  const statQrLength = document.getElementById("statQrLength");
  const statQrBytes = document.getElementById("statQrBytes");
  const statQrVersion = document.getElementById("statQrVersion");
  const statQrSafeScore = document.getElementById("statQrSafeScore");

  // \uC561\uC158 버튼\uB4E4
  const btnGenerate = document.getElementById("btnQrGenerate");
  const btnDownloadPng = document.getElementById("btnQrDownloadPng");
  const btnDownloadSvg = document.getElementById("btnQrDownloadSvg");
  const btnPrintLabel = document.getElementById("btnQrPrintLabel");
  const btnSendToLabel = document.getElementById("btnQrSendToLabel");
  const btnCopyImage = document.getElementById("btnQrCopyImage");
  const btnReset = document.getElementById("btnQrReset");
  const btnSample = document.getElementById("btnQrSample");
  const stylePresetButtons = pane.querySelectorAll("[data-qr-style-preset]");

  // \uD504\uB85D\uC2DC 버튼 \uB9E4\uD551 \uB300\uC0C1\uB4E4
  const proxyGenerate = document.getElementById("qrGeneratorGenerateBtn");
  const proxySample = document.getElementById("qrGeneratorSampleBtn");
  const proxyDownloadPng = document.getElementById("qrGeneratorDownloadPngBtn");
  const proxyDownloadSvg = document.getElementById("qrGeneratorDownloadSvgBtn");
  const proxyPrint = document.getElementById("qrGeneratorPrintBtn");
  const proxyReset = document.getElementById("qrGeneratorResetBtn");

  // \uC804\uC5ED \uC0C1\uD0DC\uAC12
  let currentType = "text";
  let loadedLogoDataUrl = null;
  let loadedLogoImage = null;
  let originalLongUrl = "";
  let latestShortUrl = "";
  let isShorteningUrl = false;
  const shortUrlCache = new Map();

  const URL_SHORTEN_THRESHOLD = 80;

  const QR_PRINT_TEMPLATES = {
    text: [
      { id: "url_info", name: "웹 안내형", desc: "웹사이트, 공지, 상세 안내로 연결", badge: "SCAN", title: "자세한 안내 보기", subtitle: "카메라로 QR코드를 스캔하세요.", footer: "웹페이지로 이동합니다.", accent: "#1f5eff", className: "template-url-info" },
      { id: "url_download", name: "자료 다운로드형", desc: "PDF, 신청서, 발표자료 배포", badge: "DOWNLOAD", title: "자료 다운로드", subtitle: "스캔 후 자료를 내려받으세요.", footer: "최신 자료로 연결됩니다.", accent: "#0f766e", className: "template-url-download" },
      { id: "url_survey", name: "설문 참여형", desc: "만족도 조사와 피드백 수집", badge: "SURVEY", title: "설문에 참여해 주세요", subtitle: "소중한 의견은 서비스 개선에 활용됩니다.", footer: "응답에는 1분 정도 소요됩니다.", accent: "#7c3aed", className: "template-url-survey" },
    ],
    wifi: [
      { id: "wifi_meeting", name: "회의실 Wi-Fi", desc: "회의실, 세미나실, 교육장", badge: "FREE Wi-Fi", title: "Guest Wi-Fi", subtitle: "스캔하면 네트워크에 연결됩니다.", footer: "방문객 전용 네트워크입니다.", accent: "#0f766e", className: "template-wifi-meeting" },
      { id: "wifi_store", name: "매장 안내형", desc: "카페, 매장, 라운지", badge: "WELCOME", title: "무료 Wi-Fi 안내", subtitle: "편하게 이용해 주세요.", footer: "이용 중 불편사항은 직원에게 문의하세요.", accent: "#b45309", className: "template-wifi-store" },
      { id: "wifi_secure", name: "보안 접속형", desc: "사내/기관 게스트망 안내", badge: "SECURE", title: "보안 Wi-Fi 접속", subtitle: "허가된 방문객만 이용할 수 있습니다.", footer: "사용 후 접속 정보는 공유하지 마세요.", accent: "#334155", className: "template-wifi-secure" },
    ],
    vcard: [
      { id: "contact_card", name: "명함형 프로필", desc: "개인 명함과 프로필 공유", badge: "PROFILE", title: "연락처 저장", subtitle: "스캔하면 연락처를 저장할 수 있습니다.", footer: "전화, 이메일, 웹사이트 정보를 포함합니다.", accent: "#2563eb", className: "template-contact-card" },
      { id: "contact_staff", name: "담당자 문의형", desc: "행사/상담 담당자 안내", badge: "CONTACT", title: "담당자 문의", subtitle: "문의가 필요하면 QR을 스캔하세요.", footer: "담당자 연락처로 연결됩니다.", accent: "#475569", className: "template-contact-staff" },
      { id: "contact_booth", name: "부스 상담형", desc: "전시 부스, 상담 데스크", badge: "BOOTH", title: "상담 정보 받기", subtitle: "스캔 후 상담 담당자 정보를 저장하세요.", footer: "현장 상담 후 후속 연락에 활용됩니다.", accent: "#be123c", className: "template-contact-booth" },
    ],
    email: [
      { id: "email_support", name: "고객센터 문의형", desc: "지원 메일 바로 작성", badge: "SUPPORT", title: "문의 메일 보내기", subtitle: "스캔하면 메일 작성 화면이 열립니다.", footer: "제목과 기본 내용이 자동 입력됩니다.", accent: "#0369a1", className: "template-email-support" },
      { id: "email_feedback", name: "피드백 접수형", desc: "행사/서비스 의견 수집", badge: "FEEDBACK", title: "의견을 남겨주세요", subtitle: "현장의 의견을 빠르게 전달할 수 있습니다.", footer: "더 나은 운영을 위해 활용됩니다.", accent: "#6d28d9", className: "template-email-feedback" },
    ],
    sms: [
      { id: "sms_alert", name: "문자 알림형", desc: "사전 작성된 문자 전송", badge: "SMS", title: "문자 보내기", subtitle: "스캔하면 문자 작성 화면이 열립니다.", footer: "수신 번호와 문구가 자동 입력됩니다.", accent: "#c2410c", className: "template-sms-alert" },
    ],
    social: [
      { id: "social_follow", name: "팔로우 유도형", desc: "인스타그램, 링크드인, 페이스북", badge: "FOLLOW", title: "공식 채널 팔로우", subtitle: "스캔하고 최신 소식을 받아보세요.", footer: "공식 소셜 채널로 연결됩니다.", accent: "#db2777", className: "template-social-follow" },
      { id: "social_channel", name: "채널 추가형", desc: "유튜브/카카오 채널 안내", badge: "CHANNEL", title: "채널 추가하기", subtitle: "행사와 공지 소식을 확인하세요.", footer: "구독 또는 채널 추가 화면으로 이동합니다.", accent: "#dc2626", className: "template-social-channel" },
    ],
  };

  function allPrintTemplates() {
    return Object.values(QR_PRINT_TEMPLATES).flat();
  }

  function templatesForCurrentType() {
    return QR_PRINT_TEMPLATES[currentType] || QR_PRINT_TEMPLATES.text;
  }

  function currentPrintTemplate() {
    return allPrintTemplates().find((template) => template.id === qrPrintTemplate.value) || templatesForCurrentType()[0];
  }

  function syncPrintCopyDefaults(force = false) {
    const template = currentPrintTemplate();
    if (!template) return;
    if (force || !qrPrintTitle.value.trim()) qrPrintTitle.value = template.title;
    if (force || !qrPrintSubtitle.value.trim()) qrPrintSubtitle.value = template.subtitle;
    if (force || !qrPrintBadge.value.trim()) qrPrintBadge.value = template.badge;
    if (force || !qrLabelText.value.trim()) qrLabelText.value = template.footer;
    if (force) {
      syncPrintInfoDefaults(true);
      setPrintAccent(template.accent);
      if (qrPrintDensity) qrPrintDensity.value = "standard";
      if (qrPrintAlign) qrPrintAlign.value = "left";
      [qrPrintShowBadge, qrPrintShowSubtitle, qrPrintShowInfo, qrPrintShowFooter].forEach((checkbox) => {
        if (checkbox) checkbox.checked = true;
      });
    }
  }

  function setPrintAccent(color) {
    const normalized = normalizeHexColor(color) || "#1f5eff";
    if (qrPrintAccentColor) qrPrintAccentColor.value = normalized;
    if (qrPrintAccentHex) qrPrintAccentHex.value = normalized;
  }

  function normalizeHexColor(value) {
    if (!value) return "";
    const trimmed = value.trim();
    const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    return /^#[0-9A-F]{6}$/i.test(hex) ? hex.toLowerCase() : "";
  }

  function normalizeUrlForShortening(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    const unwrapped = trimmed.replace(/[\t\r\n\f]+/g, "");
    const candidate = /^https?:\/\//i.test(unwrapped) ? unwrapped : `https://${unwrapped}`;
    try {
      const url = new URL(candidate);
      if (!/^https?:$/i.test(url.protocol)) return "";
      if (!url.hostname || !url.hostname.includes(".")) return "";
      return url.href;
    } catch (error) {
      return "";
    }
  }

  function isShortUrl(value) {
    const normalized = normalizeUrlForShortening(value);
    if (!normalized) return false;
    try {
      const parsed = new URL(normalized);
      return parsed.hostname.replace(/^www\./i, "").toLowerCase() === "spoo.me";
    } catch (error) {
      return false;
    }
  }

  function getTextInputUrl() {
    return normalizeUrlForShortening(qrInputText?.value || "");
  }

  function shouldSuggestShortening(value = qrInputText?.value || "") {
    const normalized = normalizeUrlForShortening(value);
    return Boolean(normalized && normalized.length >= URL_SHORTEN_THRESHOLD && !isShortUrl(normalized));
  }

  function setShortUrlStatus(message, type = "info") {
    if (!qrShortUrlStatus) return;
    qrShortUrlStatus.textContent = message || "";
    qrShortUrlStatus.className = `gen-config-note qr-short-url-status is-${type}`;
  }

  function syncShortUrlPanel() {
    if (!qrShortUrlPanel) return;
    const currentUrl = getTextInputUrl();
    const hasShortResult = Boolean(latestShortUrl);
    const showPanel = currentType === "text" && (hasShortResult || shouldSuggestShortening(qrInputText?.value || "") || isShorteningUrl);
    qrShortUrlPanel.hidden = !showPanel;
    if (qrShortUrlOutput && latestShortUrl && qrShortUrlOutput.value !== latestShortUrl) {
      qrShortUrlOutput.value = latestShortUrl;
    }
    if (!showPanel) return;
    if (isShorteningUrl) {
      setShortUrlStatus("단축주소를 생성하는 중입니다...", "info");
    } else if (latestShortUrl && currentUrl === latestShortUrl) {
      setShortUrlStatus("현재 QR코드는 단축주소를 사용하고 있습니다.", "success");
    } else if (latestShortUrl) {
      setShortUrlStatus("단축주소가 준비되었습니다. 필요하면 다시 적용하거나 복사하세요.", "success");
    } else {
      setShortUrlStatus("긴 URL이 감지되었습니다. 단축주소를 만들면 QR 밀도와 스캔 안정성이 좋아집니다.", "info");
    }
  }

  async function requestShortUrl(longUrl) {
    const response = await fetch('https://spoo.me/api/v1/shorten', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ long_url: longUrl }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.short_url) throw new Error(data?.detail || data?.message || '단축주소 생성 실패');
    const shortUrl = normalizeUrlForShortening(data.short_url);
    if (!shortUrl || !isShortUrl(shortUrl)) throw new Error('단축주소 응답 형식이 올바르지 않습니다.');
    return shortUrl;
  }

  async function shortenCurrentUrl({ applyToInput = true } = {}) {
    if (currentType !== "text") {
      showToast("단축주소는 텍스트/URL 유형에서만 사용할 수 있습니다.", true);
      return "";
    }

    const longUrl = getTextInputUrl();
    if (!longUrl) {
      showToast("단축할 URL을 입력하세요. 예: https://example.com/page", true);
      return "";
    }
    try {
      const parsed = new URL(longUrl);
      const sensitiveNames = /^(token|access_token|api_?key|key|signature|sig|auth|password|passwd|secret|code)$/i;
      const found = Array.from(parsed.searchParams.keys()).find((name) => sensitiveNames.test(name));
      if (found) {
        showToast(`보안정보로 보이는 쿼리 항목(${found})이 있어 단축을 중단했습니다.`, true);
        return "";
      }
    } catch (_) {
      showToast("올바른 HTTP(S) URL을 입력하세요.", true);
      return "";
    }
    if (isShortUrl(longUrl)) {
      latestShortUrl = longUrl;
      if (qrShortUrlOutput) qrShortUrlOutput.value = longUrl;
      syncShortUrlPanel();
      showToast("이미 단축주소로 보입니다.");
      return longUrl;
    }

    const cachedShortUrl = shortUrlCache.get(longUrl);
    if (cachedShortUrl) {
      originalLongUrl = longUrl;
      latestShortUrl = cachedShortUrl;
      if (qrShortUrlOutput) qrShortUrlOutput.value = cachedShortUrl;
      if (applyToInput && qrInputText) qrInputText.value = cachedShortUrl;
      setShortUrlStatus("기존에 생성한 단축주소를 다시 적용했습니다.", "success");
      generateQRCode();
      showToast("기존 단축주소를 다시 적용했습니다.");
      return cachedShortUrl;
    }

    if (!window.confirm("단축주소 생성을 위해 원본 URL이 외부 서비스 Spoo.me로 전송되며, 해당 서비스가 URL과 클릭 정보를 처리할 수 있습니다. 개인정보·로그인 토큰·비공개 문서 주소가 없음을 확인하고 계속할까요?")) {
      setShortUrlStatus("단축주소 생성을 취소했습니다.", "");
      return "";
    }

    originalLongUrl = originalLongUrl || longUrl;
    isShorteningUrl = true;
    if (btnShortenUrl) btnShortenUrl.disabled = true;
    syncShortUrlPanel();

    try {
      const shortUrl = await requestShortUrl(longUrl);
      shortUrlCache.set(longUrl, shortUrl);
      latestShortUrl = shortUrl;
      if (qrShortUrlOutput) qrShortUrlOutput.value = shortUrl;
      if (applyToInput && qrInputText) {
        qrInputText.value = shortUrl;
      }
      setShortUrlStatus("단축주소가 생성되었습니다. QR코드는 이 단축주소로 생성됩니다.", "success");
      generateQRCode();
      showToast("단축주소를 생성하고 QR코드에 적용했습니다.");
      return shortUrl;
    } catch (error) {
      console.error(error);
      setShortUrlStatus("단축주소 서비스가 응답하지 않았습니다. 잠시 후 다시 시도하거나 원본 URL로 QR코드를 생성하세요.", "error");
      showToast("단축주소 생성에 실패했습니다. 원본 URL로 QR코드는 계속 생성할 수 있습니다.", true);
      return "";
    } finally {
      isShorteningUrl = false;
      if (btnShortenUrl) btnShortenUrl.disabled = false;
      syncShortUrlPanel();
    }
  }

  // QR 패턴/배경 색상 대비 검증 (WCAG 상대휘도 기반) - 대비 낮으면 스캔 실패 위험
  function relativeLuminance(hex) {
    const clean = (hex || "#000000").replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) / 255);
    const channel = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }
  function contrastRatio(hexA, hexB) {
    const lumA = relativeLuminance(hexA);
    const lumB = relativeLuminance(hexB);
    const [light, dark] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
    return (light + 0.05) / (dark + 0.05);
  }

  // 세부 정보 행 하나 생성 (라벨 입력, 값 입력, 삭제 버튼)
  function createInfoRow(labelVal = "", valueVal = "") {
    const row = document.createElement("div");
    row.className = "qr-print-info-row";

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.className = "gen-input";
    labelInput.placeholder = "항목명 (선택)";
    labelInput.value = labelVal;

    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.className = "gen-input";
    valueInput.placeholder = "내용";
    valueInput.value = valueVal;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "qr-print-info-remove-btn";
    removeBtn.setAttribute("aria-label", "항목 삭제");
    removeBtn.textContent = "×";

    row.appendChild(labelInput);
    row.appendChild(valueInput);
    row.appendChild(removeBtn);

    const ref = { row, label: labelInput, value: valueInput };
    [labelInput, valueInput].forEach((el) => {
      el.addEventListener("change", () => {
        renderPrintPreview();
        generateQRCode();
      });
      el.addEventListener("input", () => renderPrintPreview());
    });
    removeBtn.addEventListener("click", () => removeInfoRow(ref));

    qrPrintInfoRows.appendChild(row);
    printInfoRowRefs.push(ref);
    return ref;
  }

  function removeInfoRow(ref) {
    const index = printInfoRowRefs.indexOf(ref);
    if (index === -1) return;
    printInfoRowRefs.splice(index, 1);
    ref.row.remove();
    renderPrintPreview();
    generateQRCode();
  }

  function clearInfoRows() {
    printInfoRowRefs.splice(0).forEach((ref) => ref.row.remove());
  }

  function printInfoInputs() {
    return printInfoRowRefs.map((ref) => ({ label: ref.label, value: ref.value }));
  }

  function hasCustomPrintInfo() {
    return printInfoInputs().some((pair) => pair.label?.value.trim() || pair.value?.value.trim());
  }

  function syncPrintInfoDefaults(force = false) {
    if (!force) return;
    const lines = buildDefaultInfoLines(getPrintContextBase()).slice(0, MAX_PRINT_INFO_ROWS);
    clearInfoRows();
    lines.forEach((line) => createInfoRow(line.label, line.value));
  }

  function readCustomInfoLines() {
    return printInfoInputs()
      .map((pair) => ({
        label: pair.label?.value.trim() || "",
        value: pair.value?.value.trim() || "",
      }))
      .filter((line) => line.label || line.value)
      .map((line) => {
        // 항목명 없이 값만 입력하면 라벨 없는 단순 텍스트 줄로 표시
        if (!line.label) return { type: "text", label: "", value: line.value };
        return { type: "pair", label: line.label, value: line.value || "-" };
      });
  }

  function getPrintContextBase() {
    return {
      type: currentType,
      ssid: document.getElementById("qrWifiSsid")?.value.trim() || "Guest_Access",
      password: document.getElementById("qrWifiPassword")?.value || "\uBE44\uBC00\uBC88\uD638 \uC5C6\uC74C",
      name: document.getElementById("qrCardName")?.value.trim() || "",
      org: document.getElementById("qrCardOrg")?.value.trim() || "",
      titleRole: document.getElementById("qrCardTitle")?.value.trim() || "",
      phone: document.getElementById("qrCardPhone")?.value.trim() || "",
      email: document.getElementById("qrCardEmail")?.value.trim() || "",
      cardUrl: document.getElementById("qrCardUrl")?.value.trim() || "",
      platform: qrSocialPlatform?.value || "",
      socialId: qrSocialId?.value.trim() || "",
      emailAddress: document.getElementById("qrEmailAddress")?.value.trim() || "",
      emailSubject: document.getElementById("qrEmailSubject")?.value.trim() || "",
      smsPhone: document.getElementById("qrSmsPhone")?.value.trim() || "",
      smsMessage: document.getElementById("qrSmsMessage")?.value.trim() || "",
      linkValue: document.getElementById("qrInputText")?.value.trim() || "",
    };
  }

  function renderTemplateCards() {
    if (!qrPrintTemplateCards || !qrPrintTemplate) return;
    const templates = templatesForCurrentType();
    if (!templates.some((template) => template.id === qrPrintTemplate.value)) {
      qrPrintTemplate.value = templates[0]?.id || "url_info";
      syncPrintCopyDefaults(true);
    }
    const selectedTemplateId = qrPrintTemplate.value;
    qrPrintTemplate.innerHTML = "";
    templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      qrPrintTemplate.appendChild(option);
    });
    // <select> innerHTML 초기화 후 옵션을 다시 채우면 첫 옵션이 자동 선택되므로 원래 값 복원
    qrPrintTemplate.value = selectedTemplateId;
    qrPrintTemplateCards.innerHTML = "";
    templates.forEach((template) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "qr-template-card";
      card.classList.toggle("active", template.id === qrPrintTemplate.value);
      card.dataset.templateId = template.id;
      card.style.setProperty("--qr-template-accent", template.accent);
      card.innerHTML = `
        <span class="qr-template-card-badge">${template.badge}</span>
        <strong>${template.name}</strong>
        <small>${template.desc}</small>
      `;
      card.addEventListener("click", () => {
        qrPrintTemplate.value = template.id;
        syncPrintCopyDefaults(true);
        renderTemplateCards();
        renderPrintPreview();
        generateQRCode();
      });
      qrPrintTemplateCards.appendChild(card);
    });
    if (qrTemplateHint) {
      const typeNames = { text: "텍스트/URL", wifi: "Wi-Fi", vcard: "연락처", email: "이메일", sms: "SMS", social: "소셜 미디어" };
      qrTemplateHint.textContent = `${typeNames[currentType] || "현재 유형"}에 맞는 출력 템플릿입니다.`;
    }
  }

  function getPrintContext(qrDataUrl = "") {
    const template = currentPrintTemplate();
    const baseContext = getPrintContextBase();
    return {
      ...baseContext,
      template,
      title: qrPrintTitle.value.trim() || template.title,
      subtitle: qrPrintSubtitle.value.trim() || template.subtitle,
      badge: qrPrintBadge.value.trim() || template.badge,
      footer: qrLabelText.value.trim() || template.footer,
      qrDataUrl,
      accent: normalizeHexColor(qrPrintAccentColor?.value || qrPrintAccentHex?.value) || template.accent,
      density: qrPrintDensity?.value || "standard",
      align: qrPrintAlign?.value || "left",
      showBorder: qrPrintBorder.checked,
      showBadge: qrPrintShowBadge?.checked !== false,
      showSubtitle: qrPrintShowSubtitle?.checked !== false,
      showInfo: qrPrintShowInfo?.checked !== false,
      showFooter: qrPrintShowFooter?.checked !== false,
      url: document.getElementById("qrCardUrl")?.value.trim() || "",
      customInfoLines: readCustomInfoLines(),
      layoutCount: parseInt(qrPrintLayout?.value, 10) || 1,
    };
  }

  // 소형 라벨(4/12/24분할)일수록 물리적 공간이 줄어 세부 정보 줄 수를 더 제한
  function infoRowCapForLayout(layoutCount) {
    if (layoutCount >= 24) return 2;
    if (layoutCount >= 12) return 3;
    if (layoutCount >= 4) return 5;
    return MAX_PRINT_INFO_ROWS;
  }

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function renderPrintCard(context, compact = false) {
    const card = document.createElement("div");
    card.className = `print-label-card template-custom ${context.template.className} density-${context.density} align-${context.align}`;
    card.style.setProperty("--print-accent", context.accent);
    if (context.showBorder && !compact) card.classList.add("with-border");

    const header = makeEl("div", "print-custom-header");
    const titleWrap = makeEl("div", "print-custom-title-wrap");
    if (context.showBadge) {
      const badge = makeEl("span", "print-custom-badge", context.badge);
      header.appendChild(badge);
    }
    titleWrap.appendChild(makeEl("strong", "", context.title));
    if (context.showSubtitle) titleWrap.appendChild(makeEl("span", "", context.subtitle));
    header.appendChild(titleWrap);
    card.appendChild(header);

    const body = makeEl("div", "print-custom-body");
    const qrBox = makeEl("div", "print-custom-qr");
    if (context.qrDataUrl) {
      const img = document.createElement("img");
      img.src = context.qrDataUrl;
      qrBox.appendChild(img);
    } else {
      qrBox.appendChild(makeEl("span", "", "QR"));
    }
    body.appendChild(qrBox);

    if (context.showInfo) {
      const info = makeEl("div", "print-custom-info");
      buildInfoLines(context).forEach((line) => {
        if (line.type === "text") {
          // 항목명 없는 단순 텍스트 줄
          const row = makeEl("div", "print-custom-info-row plain");
          row.appendChild(makeEl("span", "", line.value));
          info.appendChild(row);
          return;
        }
        const row = makeEl("div", "print-custom-info-row");
        row.appendChild(makeEl("b", "", line.label));
        row.appendChild(makeEl("span", "", line.value));
        info.appendChild(row);
      });
      body.appendChild(info);
    }
    card.appendChild(body);

    if (context.showFooter) card.appendChild(makeEl("div", "print-custom-footer", context.footer));
    return card;
  }

  function buildInfoLines(context) {
    const cap = infoRowCapForLayout(context.layoutCount || 1);
    if (context.customInfoLines?.length) return context.customInfoLines.slice(0, cap);
    return buildDefaultInfoLines(context).slice(0, cap);
  }

  // 각 유형에서 실제로 입력한 개별 값들을 라벨 인쇄 세부 정보에 최대한 반영
  function buildDefaultInfoLines(context) {
    if (context.type === "wifi") {
      return [
        { label: "SSID", value: context.ssid },
        { label: "PW", value: context.password },
      ];
    }
    if (context.type === "vcard") {
      const lines = [{ label: "NAME", value: context.name || context.title || "-" }];
      const orgLine = [context.org, context.titleRole].filter(Boolean).join(" · ");
      if (orgLine) lines.push({ label: "ORG", value: orgLine });
      if (context.phone) lines.push({ label: "TEL", value: context.phone });
      if (context.email) lines.push({ label: "MAIL", value: context.email });
      if (context.cardUrl) lines.push({ label: "WEB", value: context.cardUrl });
      if (lines.length === 1) lines.push({ label: "INFO", value: "Scan to save" });
      return lines;
    }
    if (context.type === "email") {
      const lines = [];
      if (context.emailAddress) lines.push({ label: "MAIL", value: context.emailAddress });
      if (context.emailSubject) lines.push({ label: "SUBJECT", value: context.emailSubject });
      if (!lines.length) lines.push({ label: "MAIL", value: "Email request" });
      return lines;
    }
    if (context.type === "sms") {
      const lines = [];
      if (context.smsPhone) lines.push({ label: "TEL", value: context.smsPhone });
      if (context.smsMessage) lines.push({ label: "MSG", value: context.smsMessage });
      if (!lines.length) lines.push({ label: "SMS", value: "Message ready" });
      return lines;
    }
    if (context.type === "social") {
      const lines = [{ label: "CHANNEL", value: context.platform || "social" }];
      if (context.socialId) lines.push({ label: "ID", value: `@${context.socialId}` });
      return lines;
    }
    return [{ label: "LINK", value: context.linkValue && context.linkValue.length <= 40 ? context.linkValue : "Scan for details" }];
  }

  function renderPrintPreview() {
    if (!qrPrintPreviewSheet) return;
    syncPrintCopyDefaults(false);
    const canvas = container?.querySelector("canvas");
    const context = getPrintContext(canvas ? canvas.toDataURL("image/png") : "");
    qrPrintPreviewSheet.innerHTML = "";
    const card = renderPrintCard(context, true);
    qrPrintPreviewSheet.appendChild(card);
    enablePreviewEditing(card);
  }

  function enablePreviewEditing(card) {
    const editableTargets = [
      { selector: ".print-custom-badge", input: qrPrintBadge },
      { selector: ".print-custom-title-wrap strong", input: qrPrintTitle },
      { selector: ".print-custom-title-wrap span", input: qrPrintSubtitle },
      { selector: ".print-custom-footer", input: qrLabelText },
    ];
    const infoInputs = printInfoInputs();
    card.querySelectorAll(".print-custom-info-row").forEach((row, index) => {
      const pair = infoInputs[index];
      if (!pair) return;
      const labelEl = row.querySelector("b");
      const valueEl = row.querySelector("span");
      [
        { el: labelEl, input: pair.label },
        { el: valueEl, input: pair.value },
      ].forEach(({ el, input }) => {
        if (!el || !input) return;
        el.contentEditable = "true";
        el.spellcheck = false;
        el.dataset.editablePrintText = "true";
        el.addEventListener("input", () => {
          input.value = el.textContent.trim();
        });
        el.addEventListener("blur", () => {
          input.value = el.textContent.trim();
          renderPrintPreview();
        });
      });
    });
    editableTargets.forEach(({ selector, input }) => {
      const el = card.querySelector(selector);
      if (!el || !input) return;
      el.contentEditable = "true";
      el.spellcheck = false;
      el.dataset.editablePrintText = "true";
      el.addEventListener("input", () => {
        input.value = el.textContent.trim();
      });
      el.addEventListener("blur", () => {
        input.value = el.textContent.trim();
        renderPrintPreview();
      });
    });
  }

  function openPrintModal() {
    const data = getQRDataString();
    if (!data) {
      showToast("\uBA3C\uC800 QR\uCF54\uB4DC\uB97C \uC0DD\uC131\uD558\uC138\uC694.", true);
      return;
    }
    generateQRCode();
    renderTemplateCards();
    if (!printInfoRowRefs.length) syncPrintInfoDefaults(true);
    renderPrintPreview();
    if (qrPrintModal) {
      qrPrintModal.hidden = false;
      document.body.classList.add("qr-print-modal-open");
      qrPrintModalPrintBtn?.focus();
    }
  }

  function closePrintModal() {
    if (!qrPrintModal) return;
    qrPrintModal.hidden = true;
    document.body.classList.remove("qr-print-modal-open");
  }

  // 1. \uC785\uB825 \uD0ED \uC804\uD658 \uC81C\uC5B4
  function syncTypeButtons(activeType) {
    typeButtons.forEach((button) => {
      const isActive = button.dataset.type === activeType;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  typeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentType = btn.dataset.type;
      syncTypeButtons(currentType);
      inputGroups.forEach((group) => {
        if (group.dataset.inputType === currentType) {
          group.style.display = "block";
          group.classList.add("active");
        } else {
          group.style.display = "none";
          group.classList.remove("active");
        }
      });
      
      renderTemplateCards();
      syncPrintCopyDefaults(true);
      renderPrintPreview();
      syncShortUrlPanel();
      generateQRCode();
    });
  });

  // 2. \uC0C9\uC0C1 \uD53C\uCEE4 \uB3D9\uAE30\uD654
  function setupColorSync(picker, hexInput) {
    picker.addEventListener("input", (e) => {
      hexInput.value = e.target.value;
      generateQRCode();
    });
    hexInput.addEventListener("change", (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith("#")) val = "#" + val;
      if (/^#[0-9A-F]{6}$/i.test(val)) {
        picker.value = val;
        generateQRCode();
      }
    });
  }
  setupColorSync(qrColorDark, qrColorDarkHex);
  setupColorSync(qrColorLight, qrColorLightHex);
  setupColorSync(qrColorEye, qrColorEyeHex);

  // \uB208\uB3D9\uC790 \uAC1C\uBCC4\uC0C9\uC0C1 \uD161\uAE00 \uC81C\uC5B4
  qrOptionCustomEyeColor.addEventListener("change", (e) => {
    qrEyeColorRow.style.display = e.target.checked ? "flex" : "none";
    generateQRCode();
  });

  // 소셜 \uD50C\uB7AB\uD3FC \uBCC0\uACBD
  qrSocialPlatform.addEventListener("change", (e) => {
    const val = e.target.value;
    let help = "";
    if (val === "instagram") help = "인스타그램 \uD504\uB85C\uD544\uB85C \uBC14\uB85C \uC5F0\uACB0\uB429\uB2C8\uB2E4.";
    else if (val === "youtube") help = "\uC720\uD29C\uBE0C 채널로 \uBC14\uB85C \uC5F0\uACB0\uB429\uB2C8\uB2E4.";
    else if (val === "kakaotalk") help = "\uCE74\uCE74\uC624\uD1A1 채널로 \uBC14\uB85C \uC5F0\uACB0\uB429\uB2C8\uB2E4.";
    else if (val === "linkedin") help = "\uB9C1\uD06C\uB4DC\uC778 \uD504\uB85C\uD544\uB85C \uBC14\uB85C \uC5F0\uACB0\uB429\uB2C8\uB2E4.";
    else if (val === "facebook") help = "페이스북 \uD504\uB85C\uD544\uB85C \uBC14\uB85C \uC5F0\uACB0\uB429\uB2C8\uB2E4.";
    qrSocialHelpText.textContent = help;
    generateQRCode();
  });

  // \uC635\uC158 \uBCC0\uACBD \uC2DC \uC790\uB3D9 \uC0DD\uC131
  [
    qrOptionSize,
    qrOptionMargin,
    qrOptionEcc,
    qrLogoSizeRatio,
    qrLabelText,
    qrPrintTitle,
    qrPrintSubtitle,
    qrPrintBadge,
    qrOptionRoundDots,
    qrPrintLayout,
    qrPrintBorder,
    qrPrintDensity,
    qrPrintAlign,
    qrPrintShowBadge,
    qrPrintShowSubtitle,
    qrPrintShowInfo,
    qrPrintShowFooter,
  ].filter(Boolean).forEach((el) => {
    el.addEventListener("change", () => {
      renderPrintPreview();
      generateQRCode();
    });
    el.addEventListener("input", () => renderPrintPreview());
  });

  qrPrintAccentColor?.addEventListener("input", (event) => {
    setPrintAccent(event.target.value);
    renderPrintPreview();
  });

  qrPrintAccentHex?.addEventListener("change", (event) => {
    const normalized = normalizeHexColor(event.target.value);
    if (!normalized) {
      qrPrintAccentHex.value = qrPrintAccentColor?.value || currentPrintTemplate()?.accent || "#1f5eff";
      return;
    }
    setPrintAccent(normalized);
    renderPrintPreview();
  });

  qrPrintResetCopyBtn?.addEventListener("click", () => {
    syncPrintCopyDefaults(true);
    renderTemplateCards();
    renderPrintPreview();
  });

  qrPrintInfoAddBtn?.addEventListener("click", () => {
    if (printInfoRowRefs.length >= MAX_PRINT_INFO_ROWS) {
      showToast(`세부 정보는 최대 ${MAX_PRINT_INFO_ROWS}개까지 추가할 수 있습니다.`, true);
      return;
    }
    const ref = createInfoRow();
    ref.label.focus();
    renderPrintPreview();
  });

  qrPrintTemplate.addEventListener("change", () => {
    syncPrintCopyDefaults(true);
    renderTemplateCards();
    renderPrintPreview();
    generateQRCode();
  });

  // 입력 형식 가벼운 검증 (이메일/URL) - blur 시 형식 어긋나면 빨간 테두리 + 안내
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  function isValidUrl(value) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      return Boolean(url.hostname && url.hostname.includes("."));
    } catch (e) {
      return false;
    }
  }
  function attachFormatValidation(el, validateFn, message, { required = false } = {}) {
    if (!el) return;
    el.addEventListener("blur", () => {
      const value = el.value.trim();
      const invalid = value ? !validateFn(value) : required;
      el.classList.toggle("qr-field-invalid", invalid);
      if (invalid) showToast(message, true);
    });
    el.addEventListener("input", () => {
      if (el.classList.contains("qr-field-invalid")) el.classList.remove("qr-field-invalid");
    });
  }
  attachFormatValidation(document.getElementById("qrCardEmail"), isValidEmail, "올바른 이메일 형식이 아닙니다.");
  attachFormatValidation(document.getElementById("qrCardUrl"), isValidUrl, "올바른 웹사이트 주소가 아닙니다.");
  attachFormatValidation(document.getElementById("qrEmailAddress"), isValidEmail, "받는 사람 이메일 형식이 올바르지 않습니다.", { required: true });

  function clearCurrentTypeInput() {
    const fieldsByType = {
      text: [qrInputText],
      wifi: [document.getElementById("qrWifiSsid"), document.getElementById("qrWifiPassword")],
      vcard: [
        document.getElementById("qrCardName"),
        document.getElementById("qrCardPhone"),
        document.getElementById("qrCardOrg"),
        document.getElementById("qrCardTitle"),
        document.getElementById("qrCardEmail"),
        document.getElementById("qrCardUrl"),
      ],
      email: [document.getElementById("qrEmailAddress"), document.getElementById("qrEmailSubject"), document.getElementById("qrEmailBody")],
      sms: [document.getElementById("qrSmsPhone"), document.getElementById("qrSmsMessage")],
      social: [qrSocialId],
    };
    const fields = fieldsByType[currentType] || [];
    const firstField = fields.find(Boolean);
    const hadValue = fields.some((field) => field?.value);

    fields.forEach((field) => {
      if (!field) return;
      field.value = "";
      field.classList.remove("qr-field-invalid");
    });
    if (currentType === "text") {
      latestShortUrl = "";
      originalLongUrl = "";
      if (qrShortUrlOutput) qrShortUrlOutput.value = "";
      syncShortUrlPanel();
    }

    renderPrintPreview();
    generateQRCode();
    firstField?.focus();
    showToast(hadValue ? "현재 유형의 입력 내용을 지웠습니다." : "지울 입력 내용이 없습니다.");
  }

  btnClearCurrent?.addEventListener("click", clearCurrentTypeInput);

  // 3. \uD074\uB9BD\uBCF4\uB4DC \uC790\uB3D9 \uAC00\uC838\uC624\uAE30
  btnPaste.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (qrInputText) {
        qrInputText.value = text;
        latestShortUrl = "";
        originalLongUrl = "";
        syncShortUrlPanel();
        showToast("\uD074\uB9BD\uBCF4\uB4DC \uD14D\uC2A4\uD2B8\uB97C \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4.");
        generateQRCode();
      }
    } catch (err) {
      showToast("\uD074\uB9BD\uBCF4\uB4DC 접근 \uAD8C\uD55C\uC774 \uC5C6\uAC70\uB098 \uC9C0\uC6D0\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", true);
    }
  });

  btnShortenUrl?.addEventListener("click", () => shortenCurrentUrl({ applyToInput: true }));

  btnCopyShortUrl?.addEventListener("click", async () => {
    const value = latestShortUrl || qrShortUrlOutput?.value || "";
    if (!value) {
      showToast("복사할 단축주소가 없습니다.", true);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      showToast("단축주소가 클립보드에 복사되었습니다.");
    } catch (error) {
      if (qrShortUrlOutput) {
        qrShortUrlOutput.focus();
        qrShortUrlOutput.select();
      }
      showToast("복사가 제한되어 단축주소 입력칸을 선택했습니다.", true);
    }
  });

  btnRestoreLongUrl?.addEventListener("click", () => {
    if (!originalLongUrl || !qrInputText) {
      showToast("복원할 원본 URL이 없습니다.", true);
      return;
    }
    qrInputText.value = originalLongUrl;
    syncShortUrlPanel();
    generateQRCode();
    showToast("원본 긴 URL로 복원했습니다.");
  });

  qrInputText?.addEventListener("input", () => {
    const currentUrl = getTextInputUrl();
    if (currentUrl !== latestShortUrl) {
      latestShortUrl = "";
      if (qrShortUrlOutput) qrShortUrlOutput.value = "";
      if (currentUrl !== originalLongUrl) originalLongUrl = "";
    }
    syncShortUrlPanel();
  });

  // 4. \uB85C\uACE0 \uC5C5\uB85C\uB4DC 처리
  btnLogoUpload.addEventListener("click", () => logoFile.click());
  logoFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    logoName.textContent = file.name;
    btnRemoveLogo.style.display = "inline-block";
    logoOptionRow.style.display = "flex";

    const reader = new FileReader();
    reader.onload = (event) => {
      loadedLogoDataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        loadedLogoImage = img;
        qrOptionEcc.value = "H";
        syncStylePresetButtons();
        generateQRCode();
      };
      img.src = loadedLogoDataUrl;
    };
    reader.readAsDataURL(file);
  });

  btnRemoveLogo.addEventListener("click", () => {
    logoFile.value = "";
    logoName.textContent = "\uC120\uD0DD\uB41C \uD30C\uC77C \uC5C6\uC74C";
    btnRemoveLogo.style.display = "none";
    logoOptionRow.style.display = "none";
    loadedLogoDataUrl = null;
    loadedLogoImage = null;
    syncStylePresetButtons();
    generateQRCode();
  });

  // 5. \uD1A0\uC2A4\uD2B8 \uBA54\uC2DC\uC9C0
  function showToast(msg, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = "block";
    toast.style.background = isError ? "#bf3b3b" : "var(--accent, #4a6fa5)";
    toast.style.color = "#ffffff";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = "10000";
    toast.style.fontSize = "14px";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    
    setTimeout(() => {
      toast.style.display = "none";
    }, 2500);
  }

  // 6. \uB370\uC774\uD130 포맷터
  // 순수 함수: 폼 상태와 무관하게 유형+필드 값만으로 QR 데이터 문자열 조립 (일괄 생성에서도 재사용)
  function buildQRPayload(type, fields = {}) {
    switch (type) {
      case "text":
        return (fields.data || "").trim();

      case "wifi": {
        const ssid = (fields.ssid || "").trim();
        const pwd = fields.password || "";
        const auth = fields.auth || "WPA";
        const hidden = Boolean(fields.hidden);
        if (!ssid) return "";
        return `WIFI:S:${escapeWifiString(ssid)};T:${auth};P:${escapeWifiString(pwd)};H:${hidden ? "true" : ""};;`;
      }

      case "vcard": {
        const name = (fields.name || "").trim();
        const phone = (fields.phone || "").trim();
        const org = (fields.org || "").trim();
        const title = (fields.title || "").trim();
        const email = (fields.email || "").trim();
        const url = (fields.url || "").trim();
        if (!name) return "";
        return [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${name}`,
          `FN:${name}`,
          org ? `ORG:${org}` : "",
          title ? `TITLE:${title}` : "",
          phone ? `TEL;TYPE=CELL:${phone}` : "",
          email ? `EMAIL;TYPE=PREF,INTERNET:${email}` : "",
          url ? `URL:${url}` : "",
          "END:VCARD"
        ].filter(Boolean).join("\n");
      }

      case "email": {
        const toEmail = (fields.to || "").trim();
        const subject = fields.subject || "";
        const body = fields.body || "";
        if (!toEmail) return "";
        return `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }

      case "sms": {
        const phoneSms = (fields.phone || "").trim();
        const msg = fields.message || "";
        if (!phoneSms) return "";
        return `SMSTO:${phoneSms}:${msg}`;
      }

      case "social": {
        const platform = fields.platform || "instagram";
        const sId = (fields.id || "").trim();
        if (!sId) return "";
        if (platform === "instagram") return `https://www.instagram.com/${sId}/`;
        if (platform === "youtube") return `https://www.youtube.com/@${sId}`;
        if (platform === "kakaotalk") return `https://pf.kakao.com/${sId}`;
        if (platform === "linkedin") return `https://www.linkedin.com/in/${sId}/`;
        if (platform === "facebook") return `https://www.facebook.com/${sId}`;
        return sId;
      }

      default:
        return "";
    }
  }

  function getQRDataString() {
    switch (currentType) {
      case "text":
        return buildQRPayload("text", { data: qrInputText?.value || "" });

      case "wifi":
        return buildQRPayload("wifi", {
          ssid: document.getElementById("qrWifiSsid").value,
          password: document.getElementById("qrWifiPassword").value,
          auth: document.getElementById("qrWifiAuth").value,
          hidden: document.getElementById("qrWifiHidden").checked,
        });

      case "vcard":
        return buildQRPayload("vcard", {
          name: document.getElementById("qrCardName").value,
          phone: document.getElementById("qrCardPhone").value,
          org: document.getElementById("qrCardOrg").value,
          title: document.getElementById("qrCardTitle").value,
          email: document.getElementById("qrCardEmail").value,
          url: document.getElementById("qrCardUrl").value,
        });

      case "email":
        return buildQRPayload("email", {
          to: document.getElementById("qrEmailAddress").value,
          subject: document.getElementById("qrEmailSubject").value,
          body: document.getElementById("qrEmailBody").value,
        });

      case "sms":
        return buildQRPayload("sms", {
          phone: document.getElementById("qrSmsPhone").value,
          message: document.getElementById("qrSmsMessage").value,
        });

      case "social":
        return buildQRPayload("social", {
          platform: qrSocialPlatform.value,
          id: qrSocialId.value,
        });

      default:
        return "";
    }
  }

  const QR_STYLE_PRESETS = {
    standard: { label: "기본", dark: "#000000", light: "#ffffff", eye: "#000000", size: "1000", margin: "2", ecc: "L", roundDots: true, customEye: false },
    brand: { label: "브랜드", dark: "#1f5eff", light: "#ffffff", eye: "#1f5eff", size: "1000", margin: "4", ecc: "M", roundDots: true, customEye: true },
    print: { label: "인쇄", dark: "#000000", light: "#ffffff", eye: "#000000", size: "1000", margin: "4", ecc: "M", roundDots: false, customEye: false },
  };

  function syncStylePresetButtons(activePreset = "") {
    stylePresetButtons.forEach((button) => {
      const isActive = button.dataset.qrStylePreset === activePreset;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setQrColorValue(colorPicker, hexInput, value) {
    if (colorPicker) colorPicker.value = value;
    if (hexInput) hexInput.value = value;
  }

  function applyQrStylePreset(presetId) {
    const preset = QR_STYLE_PRESETS[presetId];
    if (!preset) return;
    setQrColorValue(qrColorDark, qrColorDarkHex, preset.dark);
    setQrColorValue(qrColorLight, qrColorLightHex, preset.light);
    setQrColorValue(qrColorEye, qrColorEyeHex, preset.eye);
    qrOptionSize.value = preset.size;
    qrOptionMargin.value = preset.margin;
    qrOptionEcc.value = loadedLogoImage ? "H" : preset.ecc;
    qrOptionRoundDots.checked = preset.roundDots;
    qrOptionCustomEyeColor.checked = preset.customEye;
    qrEyeColorRow.style.display = preset.customEye ? "flex" : "none";
    syncStylePresetButtons(presetId);
    generateQRCode();
    showToast(`${preset.label} 스타일을 적용했습니다.`);
  }

  stylePresetButtons.forEach((button) => {
    button.addEventListener("click", () => applyQrStylePreset(button.dataset.qrStylePreset));
  });

  [
    qrColorDark,
    qrColorLight,
    qrColorEye,
    qrOptionSize,
    qrOptionMargin,
    qrOptionEcc,
    qrOptionRoundDots,
    qrOptionCustomEyeColor,
  ].forEach((control) => {
    control?.addEventListener("input", () => syncStylePresetButtons());
    control?.addEventListener("change", () => syncStylePresetButtons());
  });

  function escapeWifiString(val) {
    if (!val) return "";
    return val.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/:/g, "\\:").replace(/,/g, "\\,");
  }

  // 7. QR\uCF54\uB4DC \uC0DD\uC131
  function drawCustomQRCode(data, size, options = {}) {
    const {
      margin = 4,
      ecc = "M",
      darkColor = "#000000",
      lightColor = "#ffffff",
      roundDots = false,
      customEye = false,
      eyeColor = "#000000",
      logoImage = null,
      logoRatio = 0.2
    } = options;

    const qr = QRCode.create(data, { errorCorrectionLevel: ecc });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, size, size);

    const moduleCount = qr.modules.size;
    const totalModules = moduleCount + 2 * margin;
    const cellSize = size / totalModules;

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          const x = (c + margin) * cellSize;
          const y = (r + margin) * cellSize;

          const isTopLeftEye = r < 7 && c < 7;
          const isTopRightEye = r < 7 && c >= moduleCount - 7;
          const isBottomLeftEye = r >= moduleCount - 7 && c < 7;
          const isEye = isTopLeftEye || isTopRightEye || isBottomLeftEye;

          ctx.fillStyle = (isEye && customEye) ? eyeColor : darkColor;

          if (roundDots && !isEye) {
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * 0.88, 0, 2 * Math.PI);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, cellSize + 0.5, cellSize + 0.5);
          }
        }
      }
    }

    if (logoImage) {
      const logoWidth = size * logoRatio;
      const logoHeight = size * logoRatio;
      const x = (size - logoWidth) / 2;
      const y = (size - logoHeight) / 2;

      ctx.fillStyle = lightColor;
      ctx.fillRect(x - 3, y - 3, logoWidth + 6, logoHeight + 6);
      ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);
    }

    return { canvas, version: qr.version };
  }

  const SAMPLE_QR_CONTENT = "PromptDeck QR Sample";

  function renderSampleQRCode() {
    if (typeof QRCode === "undefined") {
      container.innerHTML = `
        <div class="qr-empty-state">
          <span class="qr-empty-state-icon">▦</span>
          샘플 QR코드를 준비하는 중입니다.
        </div>`;
      return;
    }

    try {
      const { canvas } = drawCustomQRCode(SAMPLE_QR_CONTENT, 600, {
        margin: 4,
        ecc: "M",
        darkColor: "#334155",
        lightColor: "#ffffff",
        roundDots: true,
      });
      const preview = document.createElement("div");
      const note = document.createElement("div");

      preview.className = "qr-sample-preview";
      canvas.className = "qr-sample-canvas";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", "입력 전 표시되는 샘플 QR코드");
      note.className = "qr-sample-note";
      note.innerHTML = "<strong>샘플 QR</strong><span>내용을 입력하면 실제 QR로 바뀝니다.</span>";

      preview.append(canvas, note);
      container.replaceChildren(preview);
    } catch (error) {
      console.warn("Sample QR preview could not be rendered", error);
      container.innerHTML = `
        <div class="qr-empty-state">
          <span class="qr-empty-state-icon">▦</span>
          내용을 입력하면 실제 QR코드가 표시됩니다.
        </div>`;
    }
  }

  function generateQRCode() {
    const data = getQRDataString();
    syncShortUrlPanel();
    
    if (data) {
      const charLen = data.length;
      const byteLen = new Blob([data]).size;
      statQrLength.textContent = `${charLen}\uC790`;
      statQrBytes.textContent = `${byteLen} B`;
    } else {
      statQrLength.textContent = "0\uC790";
      statQrBytes.textContent = "0 B";
      statQrVersion.textContent = "-";
      statQrSafeScore.textContent = "샘플 표시";
      statQrSafeScore.style.color = "var(--ink-faint)";

      renderSampleQRCode();
      renderPrintPreview();
      return;
    }

    if (typeof QRCode === "undefined") {
      container.innerHTML = `<div class="qr-error-state"><span class="qr-empty-state-icon">\u26A0\uFE0F</span>QR\uCF54\uB4DC 라이브러리\uB97C \uB85C\uB4DC\uD558\uB294 중\uC785\uB2C8\uB2E4...</div>`;
      return;
    }

    const size = parseInt(qrOptionSize.value, 10) || 300;
    const margin = parseInt(qrOptionMargin.value, 10);
    const ecc = qrOptionEcc.value;
    const darkColor = qrColorDark.value;
    const lightColor = qrColorLight.value;
    const roundDots = qrOptionRoundDots.checked;
    const customEye = qrOptionCustomEyeColor.checked;
    const eyeColor = qrColorEye.value;
    const logoRatio = parseFloat(logoSizeRatio.value) || 0.2;

    try {
      const { canvas, version } = drawCustomQRCode(data, size, {
        margin, ecc, darkColor, lightColor, roundDots, customEye, eyeColor,
        logoImage: loadedLogoImage, logoRatio
      });

      statQrVersion.textContent = `v${version}`;

      const contrast = contrastRatio(darkColor, lightColor);
      if (contrast < 2.5) {
        statQrSafeScore.textContent = "위험 (색상 대비 부족)";
        statQrSafeScore.style.color = "#c0392b";
      } else if (ecc === "H") {
        statQrSafeScore.textContent = "안전 (로고 적합)";
        statQrSafeScore.style.color = "#2e7d32";
      } else if (data.length > 150) {
        statQrSafeScore.textContent = "주의 (용량 과다)";
        statQrSafeScore.style.color = "#d84315";
      } else if (contrast < 4) {
        statQrSafeScore.textContent = "주의 (색상 대비 낮음)";
        statQrSafeScore.style.color = "#d84315";
      } else {
        statQrSafeScore.textContent = "양호 (스캔 최적)";
        statQrSafeScore.style.color = "var(--accent)";
      }

      container.innerHTML = "";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.maxWidth = "260px";
      canvas.style.maxHeight = "260px";
      canvas.id = "activeQrCanvas";
      container.appendChild(canvas);
      renderPrintPreview();

    } catch (e) {
      const isCapacityError = /amount of data is too big|cannot contain this amount of data/i.test(e?.message || "");
      if (isCapacityError) console.warn("QR input exceeds capacity", e);
      else console.error(e);
      const errorMessage = isCapacityError
        ? "입력 내용이 QR코드 최대 용량을 초과했습니다. URL은 단축주소를 사용하고, 일반 텍스트는 내용을 줄여주세요."
        : `생성 중 오류가 발생했습니다: ${e.message}`;
      statQrVersion.textContent = "-";
      statQrSafeScore.textContent = isCapacityError ? "오류 (용량 초과)" : "오류";
      statQrSafeScore.style.color = "#c0392b";
      container.innerHTML = `<div class="qr-error-state"><span class="qr-empty-state-icon">\u26A0\uFE0F</span>${errorMessage}</div>`;
    }
  }

  async function generateQRCodeWithShortening() {
    if (
      currentType === "text" &&
      qrAutoShortenLongUrl?.checked &&
      shouldSuggestShortening(qrInputText?.value || "")
    ) {
      const shortUrl = await shortenCurrentUrl({ applyToInput: true });
      if (shortUrl) return;
    }
    generateQRCode();
  }

  // 8. \uB2E4\uC6B4\uB85C\uB4DC \uAE30\uB2A5
  btnDownloadPng.addEventListener("click", () => {
    const canvas = document.getElementById("activeQrCanvas");
    if (!canvas) {
      showToast("\uBA3C\uC800 QR\uCF54\uB4DC\uB97C \uC0DD\uC131\uD558\uC138\uC694.", true);
      return;
    }

    const size = qrOptionSize.value;
    const link = document.createElement("a");
    link.download = `qrcode_${currentType}_${size}px.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("PNG \uB2E4\uC6B4\uB85C\uB4DC\uAC00 시작되었습니다.");
  });

  btnDownloadSvg.addEventListener("click", () => {
    const data = getQRDataString();
    if (!data) {
      showToast("\uBA3C\uC800 QR\uCF54\uB4DC\uB97C \uC0DD\uC131\uD558\uC138\uC694.", true);
      return;
    }

    const size = parseInt(qrOptionSize.value, 10) || 300;
    const margin = parseInt(qrOptionMargin.value, 10);
    const ecc = qrOptionEcc.value;
    const darkColor = qrColorDark.value;
    const lightColor = qrColorLight.value;

    const roundDots = qrOptionRoundDots.checked;
    const customEye = qrOptionCustomEyeColor.checked;
    const eyeColor = qrColorEye.value;

    try {
      const qr = QRCode.create(data, { errorCorrectionLevel: ecc });
      const moduleCount = qr.modules.size;
      const totalModules = moduleCount + 2 * margin;
      const cellSize = size / totalModules;

      let paths = "";
      paths += `<rect width="${size}" height="${size}" fill="${lightColor}" />`;

      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.modules.get(r, c)) {
            const x = (c + margin) * cellSize;
            const y = (r + margin) * cellSize;

            const isTopLeftEye = r < 7 && c < 7;
            const isTopRightEye = r < 7 && c >= moduleCount - 7;
            const isBottomLeftEye = r >= moduleCount - 7 && c < 7;
            const isEye = isTopLeftEye || isTopRightEye || isBottomLeftEye;

            const fill = (isEye && customEye) ? eyeColor : darkColor;

            if (roundDots && !isEye) {
              const radius = (cellSize / 2) * 0.88;
              const cx = x + cellSize / 2;
              const cy = y + cellSize / 2;
              paths += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" />`;
            } else {
              paths += `<rect x="${x}" y="${y}" width="${cellSize + 0.1}" height="${cellSize + 0.1}" fill="${fill}" />`;
            }
          }
        }
      }

      if (loadedLogoDataUrl) {
        const ratio = parseFloat(logoSizeRatio.value) || 0.2;
        const logoWidth = size * ratio;
        const logoHeight = size * ratio;
        const x = (size - logoWidth) / 2;
        const y = (size - logoHeight) / 2;

        paths += `<rect x="${x - 2}" y="${y - 2}" width="${logoWidth + 4}" height="${logoHeight + 4}" fill="${lightColor}" />`;
        paths += `<image x="${x}" y="${y}" width="${logoWidth}" height="${logoHeight}" href="${loadedLogoDataUrl}" />`;
      }

      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">${paths}</svg>`;

      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const link = document.createElement("a");
      link.download = `qrcode_${currentType}_${size}px.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      showToast("SVG \uB2E4\uC6B4\uB85C\uB4DC\uAC00 시작되었습니다.");
    } catch (err) {
      console.error(err);
      showToast("SVG \uC0DD\uC131 중 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.", true);
    }
  });

  // 9. \uD074\uB9BD\uBCF4\uB4DC 복사
  btnCopyImage.addEventListener("click", () => {
    const canvas = document.getElementById("activeQrCanvas");
    if (!canvas) {
      showToast("\uBA3C\uC800 QR\uCF54\uB4DC\uB97C \uC0DD\uC131\uD558\uC138\uC694.", true);
      return;
    }

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast("\uC774\uBBF8\uC9C0 복사\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", true);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob
            })
          ]);
          showToast("QR\uCF54\uB4DC\uAC00 \uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uC774\uBBF8\uC9C0\uB85C 복사\uB418\uC5C8\uC2B5\uB2C8\uB2E4! (Ctrl+V)");
        } catch (err) {
          console.error(err);
          const dataUrl = canvas.toDataURL("image/png");
          await navigator.clipboard.writeText(dataUrl);
          showToast("\uC774\uBBF8\uC9C0 직접 복사\uAC00 \uC81C\uD55C\uB418\uC5B4 Base64 \uD14D\uC2A4\uD2B8\uB85C 복사\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", true);
        }
      }, "image/png");
    } catch (e) {
      console.error(e);
      showToast("\uC774\uBBF8\uC9C0 복사\uB97C \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 브라우저\uC785\uB2C8\uB2E4.", true);
    }
  });

  // 10. A4 라벨지 \uC778\uC1C4 \uACE0\uB3C4\uD654 (\uC548\uB0B4\uD310 \uB808\uBCA8\uB85C 업데이트 / Promise \uB3D9\uAE30\uD654)
  function printLabelSheet() {
    const data = getQRDataString();
    if (!data) {
      showToast("\uBA3C\uC800 QR\uCF54\uB4DC\uB97C \uC0DD\uC131\uD558\uC138\uC694.", true);
      return;
    }

    const printSize = 2000; // 대형 배너/A0 인쇄 대비 고해상도
    const margin = parseInt(qrOptionMargin.value, 10);
    const ecc = qrOptionEcc.value;
    const darkColor = qrColorDark.value;
    const lightColor = qrColorLight.value;
    const roundDots = qrOptionRoundDots.checked;
    const customEye = qrOptionCustomEyeColor.checked;
    const eyeColor = qrColorEye.value;
    const logoRatio = parseFloat(logoSizeRatio.value) || 0.2;

    const { canvas: hdCanvas } = drawCustomQRCode(data, printSize, {
      margin, ecc, darkColor, lightColor, roundDots, customEye, eyeColor,
      logoImage: loadedLogoImage, logoRatio
    });

    const qrDataUrl = hdCanvas.toDataURL("image/png");

    const count = parseInt(qrPrintLayout.value, 10) || 1;
    const context = getPrintContext(qrDataUrl);
    document.getElementById("printArea")?.remove();
    const printArea = document.createElement("div");
    printArea.id = "printArea";
    printArea.className = `layout-${count} qr-print-sheet-custom`;

    const imageLoadPromises = [];
    for (let i = 0; i < count; i++) {
      const card = renderPrintCard(context);
      card.querySelectorAll("img").forEach((img) => {
        imageLoadPromises.push(new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        }));
      });
      printArea.appendChild(card);
    }

    document.body.appendChild(printArea);
    let cleanupTimer = 0;
    let cleanedUp = false;
    const cleanupPrintArea = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      window.removeEventListener("afterprint", cleanupPrintArea);
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
      printArea.remove();
    };

    Promise.all(imageLoadPromises)
      .then(() => new Promise((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
      }))
      .then(() => {
        window.addEventListener("afterprint", cleanupPrintArea, { once: true });
        window.print();
        if (!cleanedUp) cleanupTimer = window.setTimeout(cleanupPrintArea, 60000);
      })
      .catch((error) => {
        cleanupPrintArea();
        console.error(error);
        showToast("인쇄 화면을 준비하지 못했습니다. 다시 시도해 주세요.", true);
      });
    return;

    {
    const labelText = qrLabelText.value.trim();
    const count = parseInt(qrPrintLayout.value, 10) || 1;
    const showBorder = qrPrintBorder.checked;
    const template = qrPrintTemplate.value; // classic, wifi, business, security

    // \uC778\uC1C4\uC6A9 \uC784\uC2DC \uCEE8\uD14C\uC774\uB108
    const printArea = document.createElement("div");
    printArea.id = "printArea";
    printArea.className = `layout-${count}`;

    // \uACE0\uD488\uACA9 \uC548\uB0B4\uD310 SVG \uC544\uC774\uCF58\uB4E4
    const wifiSvgPrint = `<svg viewBox="0 0 24 24" width="22" height="22" fill="#ffffff" style="display:inline-block; vertical-align:middle;"><path d="M12 21a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-5.657-5.657a8.001 8.001 0 0 1 11.314 0l-1.414 1.414a6 6 0 0 0-8.486 0L6.343 15.343zm-2.829-2.829a12 12 0 0 1 16.972 0l-1.415 1.415a10 10 0 0 0-14.142 0L3.514 12.514zm-2.828-2.828a16 16 0 0 1 22.628 0l-1.414 1.414a14 14 0 0 0-19.8 0L.686 9.686z"/></svg>`;
    const warningSvgPrint = `<svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff" style="display:inline-block; vertical-align:middle; margin-right:6px;"><path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z"/></svg>`;

    const imageLoadPromises = [];

    // \uC778\uC1C4 \uCE90\uC2DC \uBC29\uC9C0 \uBC0F \uB3D9\uAE30\uD654 \uC774\uBBF8\uC9C0 \uC0DD\uC131 헬퍼
    function createPrintImage() {
      const img = document.createElement("img");
      img.style.margin = (template === "wifi") ? "4px 0" : ((template === "business") ? "3px 0" : ((template === "security") ? "3px 0" : "4px 0"));
      
      const p = new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
      imageLoadPromises.push(p);
      img.src = qrDataUrl;
      return img;
    }

    for (let i = 0; i < count; i++) {
      const card = document.createElement("div");
      card.className = `print-label-card template-${template}`;
      if (showBorder) {
        card.classList.add("with-border");
      }

      // 1) Wi-Fi Zone \uC548\uB0B4\uD310 \uD15C\uD50C\uB9BF (SSID, PW 포함)
      if (template === "wifi") {
        const header = document.createElement("div");
        header.className = "wifi-header-bar";
        header.innerHTML = `${wifiSvgPrint} <span>WIFI ZONE</span>`;
        card.appendChild(header);

        const img = createPrintImage();
        card.appendChild(img);

        // SSID \uBC0F PW \uC815\uBCF4\uB97C \uB0B4\uD3EC\uD55C \uBA54\uD0C0 값들
        const metaDiv = document.createElement("div");
        metaDiv.className = "wifi-meta-card";

        let ssidVal = document.getElementById("qrWifiSsid").value.trim() || "Guest_Access";
        let pwdVal = document.getElementById("qrWifiPassword").value || "비밀번호 \uC5C6\uC74C (Open)";

        const ssidRow = document.createElement("div");
        ssidRow.className = "wifi-meta-row";
        ssidRow.innerHTML = `<strong>SSID:</strong> <span>${ssidVal}</span>`;
        metaDiv.appendChild(ssidRow);

        const pwdRow = document.createElement("div");
        pwdRow.className = "wifi-meta-row";
        pwdRow.innerHTML = `<strong>PW:</strong> <span>${pwdVal}</span>`;
        metaDiv.appendChild(pwdRow);

        card.appendChild(metaDiv);

        const footerGuide = document.createElement("div");
        footerGuide.className = "print-label-text";
        footerGuide.style.color = "#555";
        footerGuide.style.fontSize = count > 12 ? "6px" : "9px";
        footerGuide.style.marginTop = "2px";
        footerGuide.textContent = labelText || "카메라 \uC571\uC73C\uB85C \uC2A4\uCE94\uD558\uBA74 \uC790\uB3D9\uC73C\uB85C \uC5F0\uACB0\uB429\uB2C8\uB2E4.";
        card.appendChild(footerGuide);
      } 
      // 2) Business \uD504\uB85C\uD544 \uBA85\uD568\uD310 \uD15C\uD50C\uB9BF (TEL, EMAIL, URL \uD45C\uAE30)
      else if (template === "business") {
        let orgVal = document.getElementById("qrCardOrg").value.trim() || "\uBE44\uC988\uB2C8\uC2A4 \uC548\uB0B4\uD310";
        let titleVal = document.getElementById("qrCardTitle").value.trim() || "";
        let nameVal = document.getElementById("qrCardName").value.trim() || labelText || "CONTACT PROFILE";
        
        let telVal = document.getElementById("qrCardPhone").value.trim();
        let emailVal = document.getElementById("qrCardEmail").value.trim();
        let urlVal = document.getElementById("qrCardUrl").value.trim();

        const topHeader = document.createElement("div");
        topHeader.className = "biz-header";
        topHeader.innerHTML = `<span class="biz-org">${orgVal}</span><span style="font-size:7px; color:#aaa;">QR Profile</span>`;
        card.appendChild(topHeader);

        const img = createPrintImage();
        card.appendChild(img);

        const profileZone = document.createElement("div");
        profileZone.className = "biz-profile-zone";
        profileZone.innerHTML = `<span class="biz-name">${nameVal}</span> <span class="biz-title">${titleVal}</span>`;
        card.appendChild(profileZone);

        // \uC804\uD654\uBC88\uD638, \uC774\uBA54\uC77C, URL \uD45C\uAE30\uD310 \uB9AC\uC2A4\uD2B8
        const detailsList = document.createElement("div");
        detailsList.className = "biz-details-list";
        
        if (telVal) {
          detailsList.innerHTML += `<div>\uD83D\uDCDE ${telVal}</div>`;
        }
        if (emailVal) {
          detailsList.innerHTML += `<div>\u2709 ${emailVal}</div>`;
        }
        if (urlVal) {
          detailsList.innerHTML += `<div>\uD83C\uDF10 ${urlVal.replace(/^https?:\/\//i, "")}</div>`;
        }
        if (!telVal && !emailVal && !urlVal) {
          detailsList.innerHTML += `<div>\uD83D\uDCDD Scan to view full digital profile</div>`;
        }

        card.appendChild(detailsList);
      } 
      // 3) Security Warning \uBCF4\uC548 \uACBD\uACE0\uD310 \uD15C\uD50C\uB9BF (빗금 패턴 + 행동 지침)
      else if (template === "security") {
        const hazardBar = document.createElement("div");
        hazardBar.className = "hazard-header-bar";
        card.appendChild(hazardBar);

        const titleBar = document.createElement("div");
        titleBar.className = "security-title-bar";
        titleBar.innerHTML = warningSvgPrint + "<span>RESTRICTED AREA</span>";
        card.appendChild(titleBar);

        const img = createPrintImage();
        card.appendChild(img);

        const guideBox = document.createElement("div");
        guideBox.className = "security-guide-box";
        guideBox.innerHTML = `허가자 \uC678 \uCD9C\uC785\uAE08\uC9C0<br><span style="font-size:7px; font-weight:normal; opacity:0.85;">\uC2A4\uCE94\uD558\uC5EC \uCD9C\uC785 \uC778\uC790 \uBC0F \uBCF4\uC548 \uC2B9\uC778\uC744 확인\uD558\uC138\uC694.</span>`;
        card.appendChild(guideBox);

        const footer = document.createElement("div");
        footer.className = "print-label-text";
        footer.style.color = "#842029";
        footer.style.fontSize = count > 12 ? "7px" : "9px";
        footer.style.marginTop = "2px";
        footer.textContent = labelText || "SECURE PORTAL ACCESS";
        card.appendChild(footer);
      } 
      // 4) Classic 기본형 \uC548\uB0B4\uD310 (스캔 띠 바 추가)
      else {
        const topBar = document.createElement("div");
        topBar.className = "classic-header-bar";
        topBar.innerHTML = "<span>SCAN ME</span>";
        card.appendChild(topBar);

        const img = createPrintImage();
        card.appendChild(img);

        if (labelText) {
          const textDiv = document.createElement("div");
          textDiv.className = "print-label-text";
          textDiv.style.color = "#111111";
          textDiv.textContent = labelText;
          card.appendChild(textDiv);
        } else {
          const textDiv = document.createElement("div");
          textDiv.className = "print-label-text";
          textDiv.style.color = "#888888";
          textDiv.style.fontSize = "8px";
          textDiv.textContent = "Scan for details";
          card.appendChild(textDiv);
        }
      }

      printArea.appendChild(card);
    }

    document.body.appendChild(printArea);

    // 모든 이미지 로드 대기 완료 후 대화상자 실행
    Promise.all(imageLoadPromises).then(() => {
      window.print();
      setTimeout(() => {
        document.body.removeChild(printArea);
      }, 500);
    });
    }
  }

  // 11. 샘플 \uB370\uC774\uD130
  btnPrintLabel.addEventListener("click", openPrintModal);
  btnSendToLabel?.addEventListener("click", async () => {
    const data = getQRDataString();
    if (!data) {
      showToast("라벨로 보낼 QR 데이터를 먼저 입력해 주세요.");
      return;
    }
    const bridge = window.PromptDeckLabelBridge;
    if (typeof bridge?.send !== "function") {
      showToast("라벨·티켓 제작 모듈을 불러오지 못했습니다.");
      return;
    }
    const template = currentPrintTemplate();
    const style = {
      margin: parseInt(qrOptionMargin.value, 10),
      ecc: qrOptionEcc.value,
      darkColor: qrColorDark.value,
      lightColor: qrColorLight.value,
      roundDots: qrOptionRoundDots.checked,
      customEye: qrOptionCustomEyeColor.checked,
      eyeColor: qrColorEye.value,
    };
    try {
      await bridge.send({
        sourceTab: "qrGenerator",
        importMode: "append",
        records: [{
          id: `qr-${Date.now()}`,
          front_title: qrLabelText.value.trim() || template?.title || "QR 안내",
          front_subtitle: template?.subtitle || "카메라로 QR코드를 스캔하세요.",
          front_qr_value: data,
        }],
        settings: { documentType: "label" },
        qrSettings: { enabled: true, side: "front", source: "record", position: "right", sizePercent: 30, ...style },
      });
      showToast("현재 QR과 스타일을 라벨·티켓 제작으로 보냈습니다.");
    } catch (error) {
      showToast(error.message || "QR 데이터를 라벨로 보내지 못했습니다.");
    }
  });
  qrPrintModalPrintBtn?.addEventListener("click", printLabelSheet);
  qrPrintModalCloseBtn?.addEventListener("click", closePrintModal);
  qrPrintRefreshPreviewBtn?.addEventListener("click", () => {
    renderTemplateCards();
    renderPrintPreview();
  });
  qrPrintModal?.querySelectorAll("[data-qr-print-close]").forEach((el) => {
    el.addEventListener("click", closePrintModal);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && qrPrintModal && !qrPrintModal.hidden) closePrintModal();
  });

  btnSample.addEventListener("click", loadSampleData);
  if (proxySample) proxySample.addEventListener("click", loadSampleData);

  function loadSampleData() {
    if (currentType === "text") {
      qrInputText.value = "https://www.google.com";
      latestShortUrl = "";
      originalLongUrl = "";
      if (qrShortUrlOutput) qrShortUrlOutput.value = "";
      qrLabelText.value = "\uAD6C\uAE00 \uD648\uD398\uC774\uC9C0 방문\uD558\uAE30";
    } else if (currentType === "wifi") {
      document.getElementById("qrWifiSsid").value = "Office_Guest_5G";
      document.getElementById("qrWifiPassword").value = "office@guest99!";
      document.getElementById("qrWifiAuth").value = "WPA";
      document.getElementById("qrWifiHidden").checked = false;
      qrLabelText.value = "\uD68C\uC758\uC2E4 Guest \uC640\uC774\uD30C\uC774 \uC5F0\uACB0";
    } else if (currentType === "vcard") {
      document.getElementById("qrCardName").value = "홍길동";
      document.getElementById("qrCardPhone").value = "000-0000-0000";
      document.getElementById("qrCardOrg").value = "샘플 \uD14C\uD06C";
      document.getElementById("qrCardTitle").value = "컨설팅 \uACFC\uC7A5";
      document.getElementById("qrCardEmail").value = "gildong.hong@example.com";
      document.getElementById("qrCardUrl").value = "https://www.example.com";
      qrLabelText.value = "홍길동 \uACFC\uC7A5 \uBA85\uD568 \uC815\uBCF4";
    } else if (currentType === "email") {
      document.getElementById("qrEmailAddress").value = "support@example.com";
      document.getElementById("qrEmailSubject").value = "[업데이트] QR\uCF54\uB4DC \uC124\uC815 \uD53C\uB4DC\uBC31";
      document.getElementById("qrEmailBody").value = "\uC548\uB155\uD558\uC138\uC694, \uC2E0\uADDC 탭 \uD53C\uB4DC\uBC31\uC744 전달합니다.";
      qrLabelText.value = "\uACE0\uAC1D\uC13C\uD130 \uBB38\uC758 \uBA54\uC77C \uBC1C\uC1A1";
    } else if (currentType === "sms") {
      document.getElementById("qrSmsPhone").value = "000-0000-0000";
      document.getElementById("qrSmsMessage").value = "\uD68C\uC758 \uC2DC\uC791\uC774 10\uBD84 \uC9C0\uC5F0\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCC38\uACE0 \uBC14\uB78D\uB2C8\uB2E4.";
      qrLabelText.value = "\uD68C\uC758 \uC9C0\uC5F0 \uC54C\uB9BC \uBB38\uC790";
    } else if (currentType === "social") {
      qrSocialPlatform.value = "youtube";
      qrSocialId.value = "googlemind";
      qrSocialHelpText.textContent = "\uC720\uD29C\uBE0C 채널로 \uBC14\uB85C \uC5F0\uACB0\uB429\uB2C8\uB2E4.";
      qrLabelText.value = "\uACF5\uC2DD \uC720\uD29C\uBE0C 채널 방문";
    }

    syncPrintCopyDefaults(false);
    renderPrintPreview();
    syncShortUrlPanel();
    generateQRCode();
    showToast("\uC120\uD0DD\uB41C \uD0ED\uC5D0 샘플 \uB370\uC774\uD130\uAC00 \uCC44\uC6CC\uC9C0\uACE0 QR\uCF54\uB4DC\uAC00 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  }

  // 12. \uCD08\uAE30\uD654
  btnReset.addEventListener("click", resetAll);

  function resetAll() {
    currentType = "text";
    syncTypeButtons(currentType);

    inputGroups.forEach((group, idx) => {
      if (idx === 0) {
        group.style.display = "block";
        group.classList.add("active");
      } else {
        group.style.display = "none";
        group.classList.remove("active");
      }
    });

    qrInputText.value = "";
    latestShortUrl = "";
    originalLongUrl = "";
    isShorteningUrl = false;
    if (qrShortUrlOutput) qrShortUrlOutput.value = "";
    if (qrShortUrlPanel) qrShortUrlPanel.hidden = true;
    if (qrAutoShortenLongUrl) qrAutoShortenLongUrl.checked = true;
    document.getElementById("qrWifiSsid").value = "";
    document.getElementById("qrWifiPassword").value = "";
    document.getElementById("qrWifiAuth").value = "WPA";
    document.getElementById("qrWifiHidden").checked = false;

    document.getElementById("qrCardName").value = "";
    document.getElementById("qrCardPhone").value = "";
    document.getElementById("qrCardOrg").value = "";
    document.getElementById("qrCardTitle").value = "";
    document.getElementById("qrCardEmail").value = "";
    document.getElementById("qrCardUrl").value = "";

    document.getElementById("qrEmailAddress").value = "";
    document.getElementById("qrEmailSubject").value = "";
    document.getElementById("qrEmailBody").value = "";

    document.getElementById("qrSmsPhone").value = "";
    document.getElementById("qrSmsMessage").value = "";

    qrSocialPlatform.value = "instagram";
    qrSocialId.value = "";
    qrSocialHelpText.textContent = "인스타그램 \uD504\uB85C\uD544\uB85C \uBC14\uB85C \uC5F0\uACB0\uB429\uB2C8\uB2E4.";

    qrColorDark.value = "#000000";
    qrColorDarkHex.value = "#000000";
    qrColorLight.value = "#ffffff";
    qrColorLightHex.value = "#ffffff";
    qrOptionSize.value = "1000";
    qrOptionMargin.value = "2";
    qrOptionEcc.value = "L";

    qrOptionRoundDots.checked = true;
    qrOptionCustomEyeColor.checked = false;
    qrColorEye.value = "#000000";
    qrColorEyeHex.value = "#000000";
    qrEyeColorRow.style.display = "none";

    qrPrintLayout.value = "1";
    qrPrintBorder.checked = true;

    logoFile.value = "";
    logoName.textContent = "\uC120\uD0DD\uB41C \uD30C\uC77C \uC5C6\uC74C";
    btnRemoveLogo.style.display = "none";
    logoOptionRow.style.display = "none";
    loadedLogoDataUrl = null;
    loadedLogoImage = null;

    qrPrintTemplate.value = templatesForCurrentType()[0]?.id || "url_info";
    qrPrintTitle.value = "";
    qrPrintSubtitle.value = "";
    qrPrintBadge.value = "";
    qrLabelText.value = "";
    renderTemplateCards();
    syncPrintCopyDefaults(true);
    renderPrintPreview();
    syncStylePresetButtons("standard");

    statQrLength.textContent = "0\uC790";
    statQrBytes.textContent = "0 B";
    statQrVersion.textContent = "-";
    statQrSafeScore.textContent = "샘플 표시";
    statQrSafeScore.style.color = "var(--ink-faint)";

    renderSampleQRCode();
      
    showToast("\uBAA8\uB4E0 \uC124\uC815\uC774 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  }

  // 13. \uD504\uB85D\uC2DC \uB9E4\uD551 \uBC14\uC778\uB529
  if (proxyGenerate) proxyGenerate.addEventListener("click", () => btnGenerate.click());
  if (proxyDownloadPng) proxyDownloadPng.addEventListener("click", () => btnDownloadPng.click());
  if (proxyDownloadSvg) proxyDownloadSvg.addEventListener("click", () => btnDownloadSvg.click());
  if (proxyPrint) proxyPrint.addEventListener("click", () => btnPrintLabel.click());
  if (proxyReset) proxyReset.addEventListener("click", () => btnReset.click());

  // 14. \uC2E4\uC2DC\uAC04 \uB514\uBC14\uC6B4\uC2A4
  let debounceTimeout = null;
  function triggerRealtimeGenerate() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      generateQRCode();
    }, 200);
  }

  pane.querySelectorAll("input, textarea, select").forEach((input) => {
    if (input.type !== "file") {
      input.addEventListener("input", triggerRealtimeGenerate);
    }
  });

  btnGenerate.addEventListener("click", generateQRCodeWithShortening);

  // \uCD5C\uCD08 \uC0DD\uC131
  renderTemplateCards();
  syncPrintCopyDefaults(true);
  renderPrintPreview();
  syncTypeButtons(currentType);
  syncStylePresetButtons("standard");
  syncShortUrlPanel();
  setTimeout(generateQRCode, 300);

  // \uC77C\uAD04 \uC778\uC1C4(src/qr-batch.js)\uC6A9: CSV \uD589 \uD544\uB4DC\uB85C \uD604\uC7AC \uD15C\uD50C\uB9BF/\uC2A4\uD0C0\uC77C \uAE30\uC900 \uB77C\uBCA8 \uCE74\uB4DC \uCEE8\uD14D\uC2A4\uD2B8 \uAD6C\uC131
  function buildBatchPrintContext(type, fields, qrDataUrl) {
    const template = currentPrintTemplate();
    const base = {
      type,
      ssid: fields.ssid || "Guest_Access",
      password: fields.password || "\uBE44\uBC00\uBC88\uD638 \uC5C6\uC74C",
      name: fields.name || "",
      org: fields.org || "",
      titleRole: fields.title || "",
      phone: fields.phone || "",
      email: fields.email || "",
      cardUrl: fields.url || "",
      platform: fields.platform || "",
      socialId: fields.id || "",
      emailAddress: fields.to || "",
      emailSubject: fields.subject || "",
      smsPhone: fields.phone || "",
      smsMessage: fields.message || "",
      linkValue: fields.data || "",
    };
    const rowTitle = base.name || base.ssid || (base.socialId ? `@${base.socialId}` : "") || base.emailAddress || base.smsPhone || base.linkValue;
    return {
      ...base,
      template,
      title: rowTitle || template.title,
      subtitle: template.subtitle,
      badge: template.badge,
      footer: qrLabelText.value.trim() || template.footer,
      qrDataUrl,
      accent: normalizeHexColor(qrPrintAccentColor?.value || qrPrintAccentHex?.value) || template.accent,
      density: qrPrintDensity?.value || "standard",
      align: qrPrintAlign?.value || "left",
      showBorder: qrPrintBorder.checked,
      showBadge: qrPrintShowBadge?.checked !== false,
      showSubtitle: qrPrintShowSubtitle?.checked !== false,
      showInfo: qrPrintShowInfo?.checked !== false,
      showFooter: qrPrintShowFooter?.checked !== false,
      customInfoLines: [],
      layoutCount: parseInt(qrPrintLayout?.value, 10) || 1,
    };
  }

  // \uC77C\uAD04 \uC0DD\uC131(src/qr-batch.js)\uC5D0\uC11C \uC7AC\uC0AC\uC6A9\uD558\uB294 \uD575\uC2EC \uD568\uC218 \uBE0C\uB9BF\uC9C0
  window.QRGeneratorCore = {
    buildQRPayload,
    drawCustomQRCode,
    escapeWifiString,
    buildBatchPrintContext,
    renderPrintCard,
    getCurrentType: () => currentType,
    getCurrentValue: () => getQRDataString(),
    getLogoState: () => ({ image: loadedLogoImage, ratio: parseFloat(logoSizeRatio.value) || 0.2 }),
    getStyleOptions: () => ({
      margin: parseInt(qrOptionMargin.value, 10),
      ecc: qrOptionEcc.value,
      darkColor: qrColorDark.value,
      lightColor: qrColorLight.value,
      roundDots: qrOptionRoundDots.checked,
      customEye: qrOptionCustomEyeColor.checked,
      eyeColor: qrColorEye.value,
      size: parseInt(qrOptionSize.value, 10) || 300,
    }),
  };
})();
