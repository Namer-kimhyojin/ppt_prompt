(function () {
  const client = window.PromptDeckImageGenerationClient;
  const queueFactory = window.PromptDeckGenerationQueue;
  const qualityLoop = window.PromptDeckQualityLoop;
  if (!client || !queueFactory) return;

  const els = {};
  let queue;
  let serverMode = "unknown";
  let providerManagementAvailable = false;
  let activePromptMeta = { generationPath: "full_slide", targetModel: "common", contractVersion: "1.0", outputMode: "standard" };

  // 생성된 이미지 갤러리
  const gallery = [];
  let galleryIndex = -1;

  function bindElements() {
    els.healthBtn = document.getElementById("slideImageHealthBtn");
    els.loadPromptBtn = document.getElementById("slideImageLoadPromptBtn");
    els.loadDeckBtn = document.getElementById("slideImageLoadDeckBtn");
    els.useMockBtn = document.getElementById("slideImageUseMockBtn");
    els.generateBtn = document.getElementById("slideImageGenerateBtn");
    els.clearPromptBtn = document.getElementById("slideImageClearPromptBtn");
    els.resetResultBtn = document.getElementById("slideImageResetResultBtn");
    els.startQueueBtn = document.getElementById("slideImageStartQueueBtn");
    els.retryFailedBtn = document.getElementById("slideImageRetryFailedBtn");
    els.pauseQueueBtn = document.getElementById("slideImagePauseQueueBtn");
    els.resumeQueueBtn = document.getElementById("slideImageResumeQueueBtn");
    els.stopQueueBtn = document.getElementById("slideImageStopQueueBtn");
    els.delayMs = document.getElementById("slideImageDelayMs");
    els.maxRetries = document.getElementById("slideImageMaxRetries");
    els.queueSummary = document.getElementById("slideImageQueueSummary");
    els.queueProgress = document.getElementById("slideImageQueueProgress");
    els.jobList = document.getElementById("slideImageJobList");
    els.title = document.getElementById("slideImageTitle");
    els.prompt = document.getElementById("slideImagePrompt");
    els.status = document.getElementById("slideImageStatus");
    els.serverBadge = document.getElementById("slideImageServerBadge");
    els.resultBadge = document.getElementById("slideImageResultBadge");
    els.preview = document.getElementById("slideImagePreview");
    els.meta = document.getElementById("slideImageResultMeta");
    els.prevBtn = document.getElementById("slideImagePrevBtn");
    els.nextBtn = document.getElementById("slideImageNextBtn");
    els.galleryCounter = document.getElementById("slideImageGalleryCounter");
    els.openFolderBtn = document.getElementById("slideImageOpenFolderBtn");
    els.clearGalleryBtn = document.getElementById("slideImageClearGalleryBtn");
    els.ratioSelect = document.getElementById("slideImageAspectRatio");
    els.ratioHint = document.getElementById("slideImageRatioHint");
    els.qualityPanel = document.getElementById("slideQualityLoopPanel");
    els.qualityBadge = document.getElementById("slideQualityLoopBadge");
    els.qualityContract = document.getElementById("slideQualityContractStatus");
    els.qualityScore = document.getElementById("slideQualityScore");
    els.qualityRubric = document.getElementById("slideQualityRubric");
    els.qualityNotes = document.getElementById("slideQualityNotes");
    els.qualitySaveBtn = document.getElementById("slideQualitySaveBtn");
    els.qualityPlannerFeedbackBtn = document.getElementById("slideQualityPlannerFeedbackBtn");
    els.qualityRefineBtn = document.getElementById("slideQualityRefineBtn");
    els.qualityDeckSummary = document.getElementById("slideQualityDeckSummary");
  }

  function ensureUsabilityControls() {
    const primaryActions = document.getElementById("slideImageGenerateBtn")?.closest(".slide-image-actions");
    if (primaryActions && !document.getElementById("slideImageUseMockBtn")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gen-btn secondary";
      button.id = "slideImageUseMockBtn";
      button.textContent = "목업으로 테스트";
      button.hidden = true;
      primaryActions.appendChild(button);
    }

    if (primaryActions && !document.querySelector(".slide-image-workflow")) {
      const workflow = document.createElement("div");
      workflow.className = "slide-image-workflow";
      workflow.setAttribute("aria-label", "이미지 생성 순서");
      workflow.innerHTML = `
        <div class="slide-image-step"><b>1</b><span>모드 확인</span></div>
        <div class="slide-image-step"><b>2</b><span>프롬프트 선택</span></div>
        <div class="slide-image-step"><b>3</b><span>결과 확인</span></div>
      `;
      primaryActions.insertAdjacentElement("afterend", workflow);
    }

    const promptField = document.getElementById("slideImagePrompt")?.closest(".gen-field");
    if (promptField && !document.getElementById("slideImageClearPromptBtn")) {
      const actions = document.createElement("div");
      actions.className = "slide-image-actions compact";
      actions.innerHTML = `
        <button type="button" class="gen-btn ghost" id="slideImageClearPromptBtn">프롬프트 비우기</button>
        <button type="button" class="gen-btn ghost" id="slideImageResetResultBtn">결과 초기화</button>
      `;
      promptField.insertAdjacentElement("afterend", actions);
    }

    const queueHead = document.querySelector(".slide-image-queue-head");
    if (queueHead && !document.getElementById("slideImageQueueProgress")) {
      const progress = document.createElement("div");
      progress.className = "slide-image-progress";
      progress.setAttribute("aria-hidden", "true");
      progress.innerHTML = '<div id="slideImageQueueProgress"></div>';
      queueHead.insertAdjacentElement("afterend", progress);
    }

    const queueActions = document.getElementById("slideImageStartQueueBtn")?.closest(".slide-image-actions");
    if (queueActions && !document.getElementById("slideImageRetryFailedBtn")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gen-btn secondary";
      button.id = "slideImageRetryFailedBtn";
      button.textContent = "실패 항목만 다시 생성";
      queueActions.insertBefore(button, document.getElementById("slideImagePauseQueueBtn"));
    }
  }

  function setStatus(message, type = "") {
    if (!els.status) return;
    els.status.textContent = message;
    els.status.classList.toggle("is-ok", type === "ok");
    els.status.classList.toggle("is-error", type === "error");
  }

  function setBusy(isBusy) {
    [els.healthBtn, els.loadPromptBtn, els.loadDeckBtn, els.useMockBtn, els.generateBtn, els.startQueueBtn, els.retryFailedBtn, els.qualitySaveBtn, els.qualityPlannerFeedbackBtn, els.qualityRefineBtn].forEach((button) => {
      if (button) button.disabled = isBusy;
    });
  }

  function activePaneId() {
    return document.querySelector(".tab-pane.active")?.id || "";
  }

  function getRegisteredPromptSource() {
    return window.PromptDeckPromptSources?.resolve?.({
      tabId: window.lastActiveTabId,
      paneId: activePaneId(),
    }) || null;
  }

  function getRegisteredPromptPayload() {
    const source = getRegisteredPromptSource();
    if (!source) return null;
    if (typeof source.getGenerationPayload === "function") {
      const payload = source.getGenerationPayload();
      if (payload?.prompt) return { ...payload, sourceKey: source.key };
    }
    const prompt = source.getPrompt?.();
    if (!prompt) return null;
    return {
      title: source.getTitle?.() || "slide-01",
      prompt,
      generationPath: "full_slide",
      targetModel: "common",
      contractVersion: "1.0",
      outputMode: "standard",
      sourceKey: source.key,
    };
  }

  function getPromotionPrompt() {
    return document.getElementById("promotionPromptPreview")?.value?.trim() || "";
  }

  function getCurrentDesignerPrompt() {
    const registered = getRegisteredPromptPayload();
    if (registered?.prompt) return registered.prompt;
    const lastTab = window.lastActiveTabId;
    if (lastTab === "tabBtnPromotion" || lastTab === "tabBtnConceptMixer" || lastTab === "tabBtnPromotionPlanner") {
      return getPromotionPrompt();
    }
    if (lastTab === "tabBtnFormImage" && typeof window.getCurrentFormImagePrompt === "function") {
      return window.getCurrentFormImagePrompt();
    }
    if (lastTab === "tabBtnSlideDocument" && typeof window.getCurrentSlideDocumentPrompt === "function") {
      return window.getCurrentSlideDocumentPrompt();
    }

    // fallback
    if (activePaneId() === "panePromotion") {
      return getPromotionPrompt();
    }
    if (activePaneId() === "paneSlideDocument" && typeof window.getCurrentSlideDocumentPrompt === "function") {
      return window.getCurrentSlideDocumentPrompt();
    }
    if (activePaneId() === "paneFormImage" && typeof window.getCurrentFormImagePrompt === "function") {
      return window.getCurrentFormImagePrompt();
    }
    if (typeof window.buildPromptParts === "function") {
      const lang = window.state?.lang || "ko";
      return window.buildPromptParts(lang)
        .map((part) => `${part.label}\n${part.text || ""}`.trim())
        .filter(Boolean)
        .join("\n\n");
    }

    const promptSections = document.getElementById("promptSections");
    return promptSections?.innerText?.trim() || "";
  }

  function normalizeGenerationPath(value) {
    return value === "background_then_composite" ? "precision_full_slide" : (value || "full_slide");
  }

  function makeJobFromRecord(record) {
    return {
      slideId: record.promptId || `slide-${record.index + 1}`,
      title: record.title || record.label || `slide-${record.index + 1}`,
      label: record.label || `SLIDE ${record.index + 1}`,
      prompt: record.prompt || "",
      generationPath: normalizeGenerationPath(record.generationPath),
      targetModel: record.targetModel || "common",
      contractVersion: record.contractVersion || "1.0",
      outputMode: record.outputMode || "standard",
    };
  }

  function providerForTargetModel(targetModel) {
    if (/gpt|openai/i.test(String(targetModel || ""))) return "openai";
    if (/gemini|imagen|google/i.test(String(targetModel || ""))) return "google";
    return "common";
  }

  function getProviderCompatibility(targetModel, provider = serverMode) {
    const expected = providerForTargetModel(targetModel);
    if (["common", "mock", "unknown", "offline"].includes(expected) || provider === "mock") return { ok: true, expected };
    return { ok: expected === provider, expected };
  }

  function adaptPromptForProvider(payload, provider = serverMode) {
    const path = normalizeGenerationPath(payload.generationPath);
    if (path === "edit_reference") {
      throw new Error("이 슬라이드는 편집·참조 기반 생성이 필요합니다. 현재 API 이미지 탭에는 참조 이미지가 연결되지 않았으므로 직접 생성을 중단했습니다.");
    }
    const compatibility = getProviderCompatibility(payload.targetModel, provider);
    if (!compatibility.ok) {
      throw new Error(`공통 프롬프트 대상 모델(${payload.targetModel})과 현재 서비스(${PROVIDER_LABELS[provider] || provider})가 다릅니다. 설정에서 ${PROVIDER_LABELS[compatibility.expected] || compatibility.expected}(으)로 변경하거나 공통형 프롬프트를 사용하세요.`);
    }

    const providerInstruction = provider === "google"
      ? "MODEL DELIVERY ADAPTER — GEMINI/IMAGEN: Follow the prompt hierarchy in order, preserve all exact Korean strings and figures, and return one raster image only."
      : provider === "openai"
        ? "MODEL DELIVERY ADAPTER — GPT IMAGE: Treat Markdown headings as production structure, never render field labels or Markdown syntax, and return one raster image only."
        : "MODEL DELIVERY ADAPTER: Preserve locked display content and return one raster image only.";
    const pathInstruction = path === "precision_full_slide"
      ? "PIPELINE — PRECISION FULL SLIDE: Generate one complete finished slide image in a single render. Preserve every exact title, label, figure, unit, source, page-meta value, and declared diagram relationship. Verify node ownership, connection meaning, direction, grouping, and reading order before rendering; reduce decoration before changing meaning."
      : "PIPELINE — FULL SLIDE: Generate the complete finished slide exactly as specified.";
    return `${providerInstruction}\n${pathInstruction}\nCONTRACT VERSION: ${payload.contractVersion || "1.0"}\n\n${payload.prompt}`;
  }

  function summarizeJobs(jobs) {
    const counts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
    return `총 ${jobs.length}개 · 완료 ${counts.done || 0} · 실패 ${counts.failed || 0} · 대기 ${counts.pending || 0}`;
  }

  function renderQueue(snapshot = queue?.snapshot()) {
    if (!snapshot) return;
    if (els.queueSummary) els.queueSummary.textContent = summarizeJobs(snapshot.jobs);
    if (els.queueProgress) {
      const done = snapshot.jobs.filter((job) => job.status === "done").length;
      const failed = snapshot.jobs.filter((job) => job.status === "failed").length;
      const total = snapshot.jobs.length || 1;
      els.queueProgress.style.width = `${Math.round(((done + failed) / total) * 100)}%`;
    }
    if (els.pauseQueueBtn) els.pauseQueueBtn.disabled = snapshot.status !== "running";
    if (els.resumeQueueBtn) els.resumeQueueBtn.disabled = snapshot.status !== "paused";
    if (els.stopQueueBtn) els.stopQueueBtn.disabled = !["running", "paused"].includes(snapshot.status);
    if (els.retryFailedBtn) {
      const failedCount = snapshot.jobs.filter((job) => job.status === "failed").length;
      els.retryFailedBtn.disabled = failedCount === 0 || ["running", "paused"].includes(snapshot.status);
    }
    if (!els.jobList) return;

    if (!snapshot.jobs.length) {
      els.jobList.innerHTML = '<div class="slide-image-job-empty">슬라이드 분리기에서 프롬프트를 생성한 뒤 목록을 가져오세요.</div>';
      return;
    }

    els.jobList.innerHTML = snapshot.jobs.map((job) => {
      const statusLabel = {
        pending: "대기",
        running: "생성 중",
        done: "완료",
        failed: "실패",
      }[job.status] || job.status;
      const detail = job.error || job.filename || `${job.prompt.length.toLocaleString("ko-KR")}자`;
      return `
        <div class="slide-image-job is-${job.status}">
          <div class="slide-image-job-title">
            ${escapeHtml(job.label || job.slideId)}
            <small>${escapeHtml(job.title || "")} · ${escapeHtml(detail)}</small>
          </div>
          <span class="slide-image-job-status">${escapeHtml(statusLabel)}</span>
        </div>
      `;
    }).join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const PROVIDER_LABELS = {
    mock: "목업 모드",
    pollinations: "Pollinations",
    google: "Google Gemini",
    openai: "OpenAI GPT Image",
  };

  async function checkServer() {
    try {
      const cfg = await client.checkImageGenerationServer();
      const session = window.PromptDeckAuth?.loadSession?.();
      const configPanel = document.getElementById("slideImageConfigPanel");
      if (configPanel && session?.role !== "admin") configPanel.hidden = true;
      providerManagementAvailable = cfg.authEnabled !== false && session?.role === "admin";
      if (els.useMockBtn) {
        els.useMockBtn.hidden = !providerManagementAvailable;
        els.useMockBtn.title = providerManagementAvailable
          ? "서버 이미지 제공자를 목업으로 전환합니다."
          : "공개 접근 또는 일반 사용자 모드에서는 서버 제공자 설정을 변경할 수 없습니다.";
      }
      serverMode = cfg.provider || "mock";
      if (els.serverBadge) els.serverBadge.textContent = PROVIDER_LABELS[serverMode] || serverMode;
      if (els.generateBtn) els.generateBtn.textContent = serverMode === "mock" ? "목업 이미지 생성" : "이미지 생성";
      syncProviderSelect(serverMode);
      setStatus(`로컬 서버 연결됨 · ${PROVIDER_LABELS[serverMode] || serverMode}`, "ok");
      return true;
    } catch (error) {
      serverMode = "offline";
      providerManagementAvailable = false;
      if (els.useMockBtn) els.useMockBtn.hidden = true;
      if (els.serverBadge) els.serverBadge.textContent = "서버 연결 안 됨";
      setStatus(`로컬 서버 연결 실패: ${error.message}`, "error");
      return false;
    }
  }

  function syncProviderSelect(provider) {
    const sel = document.getElementById("slideImageProvider");
    if (sel && provider) sel.value = provider;
    updateKeyRowVisibility(provider);
  }

  function updateKeyRowVisibility(provider) {
    const googleRow = document.getElementById("slideImageGoogleKeyRow");
    const openaiRow = document.getElementById("slideImageOpenAIKeyRow");
    if (googleRow) googleRow.hidden = provider !== "google";
    if (openaiRow) openaiRow.hidden = provider !== "openai";
  }

  async function saveConfig() {
    const provider = document.getElementById("slideImageProvider")?.value;
    const googleApiKey = document.getElementById("slideImageGoogleKey")?.value?.trim() || "";
    const openaiApiKey = document.getElementById("slideImageOpenAIKey")?.value?.trim() || "";
    try {
      await client.setConfig({ provider, googleApiKey, openaiApiKey });
      serverMode = provider;
      if (els.serverBadge) els.serverBadge.textContent = PROVIDER_LABELS[provider] || provider;
      if (els.generateBtn) els.generateBtn.textContent = provider === "mock" ? "목업 이미지 생성" : "이미지 생성";
      setStatus(`서비스가 ${PROVIDER_LABELS[provider] || provider}(으)로 변경되었습니다.`, "ok");
      document.getElementById("slideImageConfigBody").hidden = true;
      document.getElementById("slideImageConfigToggle").textContent = "설정 열기";
    } catch (error) {
      setStatus(`설정 저장 실패: ${error.message}`, "error");
    }
  }

  async function switchToMockMode() {
    if (!providerManagementAvailable) {
      setStatus("현재 접근 모드에서는 서버 제공자 설정을 변경할 수 없습니다.", "error");
      return;
    }
    setBusy(true);
    try {
      await client.setConfig({ provider: "mock" });
      serverMode = "mock";
      syncProviderSelect("mock");
      if (els.serverBadge) els.serverBadge.textContent = PROVIDER_LABELS.mock;
      if (els.generateBtn) els.generateBtn.textContent = "목업 이미지 생성";
      setStatus("목업 테스트 모드로 전환했습니다. Google 쿼터와 무관하게 테스트할 수 있습니다.", "ok");
    } catch (error) {
      setStatus(`목업 모드 전환 실패: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  function loadPayload(payload, options = {}) {
    const prompt = String(payload?.prompt || "").trim();
    if (!prompt) {
      setStatus("가져올 이미지 생성 프롬프트가 없습니다.", "error");
      return false;
    }
    if (!els.prompt) bindElements();
    queue?.clear?.();
    const title = String(payload.title || payload.slideId || "slide-01").trim() || "slide-01";
    if (els.title) els.title.value = title;
    if (els.prompt) els.prompt.value = prompt;
    activePromptMeta = {
      generationPath: normalizeGenerationPath(payload.generationPath || "full_slide"),
      targetModel: payload.targetModel || "common",
      contractVersion: payload.contractVersion || "1.0",
      outputMode: payload.outputMode || "standard",
      sourceKey: payload.sourceKey || "",
      sourceHash: payload.sourceHash || "",
      diagramSpec: payload.diagramSpec || null,
    };
    const detected = detectRatioFromText(prompt);
    updateRatioHint(detected);
    const detectedLabel = detected ? ` · 비율 ${detected}` : "";
    setStatus(options.message || `${title} 프롬프트를 가져왔습니다${detectedLabel}.`, "ok");
    return true;
  }

  function loadCurrentPrompt() {
    const registered = getRegisteredPromptPayload();
    if (registered?.prompt) {
      loadPayload(registered, { message: `${registered.title || "현재 탭"}의 이미지 생성 프롬프트를 가져왔습니다.` });
      return;
    }
    const prompt = getCurrentDesignerPrompt();
    if (!prompt) {
      queue?.clear?.();
      setStatus("가져올 프롬프트가 없습니다. 슬라이드 프롬프트 제작 탭에서 먼저 프롬프트를 구성해주세요.", "error");
      return;
    }
    loadPayload({ title: els.title?.value || "slide-01", prompt });
  }

  function loadDeckPrompts() {
    const records = window.PromptDeckSlidePromptGenerator?.getRecords?.() || [];
    const jobs = records
      .filter((record) => record.prompt && ["slide", "appendix"].includes(record.entryType))
      .map(makeJobFromRecord);

    if (!jobs.length) {
      queue?.clear?.();
      if (els.title) els.title.value = "slide-01";
      if (els.prompt) els.prompt.value = "";
      activePromptMeta = { generationPath: "full_slide", targetModel: "common", contractVersion: "1.0", outputMode: "standard" };
      updateRatioHint(null);
      setStatus("가져올 슬라이드 프롬프트 목록이 없습니다. 슬라이드 분리기 탭에서 먼저 프롬프트를 생성해주세요.", "error");
      return;
    }

    queue.setJobs(jobs);
    const first = jobs[0];
    activePromptMeta = {
      generationPath: first.generationPath,
      targetModel: first.targetModel,
      contractVersion: first.contractVersion,
      outputMode: first.outputMode,
    };
    els.title.value = first.slideId;
    els.prompt.value = first.prompt;
    const incompatible = jobs.filter((job) => !getProviderCompatibility(job.targetModel).ok).length;
    const precise = jobs.filter((job) => normalizeGenerationPath(job.generationPath) === "precision_full_slide").length;
    const references = jobs.filter((job) => job.generationPath === "edit_reference").length;
    const notes = [precise ? `정밀 일체형 ${precise}장` : "", references ? `참조 편집 ${references}장` : "", incompatible ? `모델 불일치 ${incompatible}장` : ""].filter(Boolean);
    setStatus(`${jobs.length}개 슬라이드 프롬프트를 큐에 추가했습니다.${notes.length ? ` · ${notes.join(" · ")}` : ""}`, incompatible || references ? "error" : "ok");
  }

  function getSelectedRatio() {
    const val = els.ratioSelect?.value || "auto";
    return val === "auto" ? null : val;
  }

  function detectRatioFromText(text) {
    const t = String(text || "");
    const sizeMatch =
      t.match(/(?:직접 입력 크기|Exact size|Canvas size)[^\n:：]*[:：]?\s*(\d{3,5})\s*[x×]\s*(\d{3,5})/i) ||
      t.match(/\b(\d{3,5})\s*[x×]\s*(\d{3,5})\s*(?:px|픽셀)\b/i);
    if (sizeMatch) return `${sizeMatch[1]}:${sizeMatch[2]}`;
    const ratioMatch = t.match(/(?:비율\/방향|Aspect ratio[^:]*|비율)[^\n:：]*[:：]\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/i);
    if (ratioMatch) return `${ratioMatch[1]}:${ratioMatch[2]}`;
    return null;
  }

  function updateRatioHint(detectedRatio) {
    if (!els.ratioHint) return;
    const detected = detectedRatio ? `프롬프트 감지: ${detectedRatio} →` : "비율 감지 안 됨 →";
    els.ratioHint.textContent =
      `${detected} OpenAI: 1:1 / 3:2 / 2:3 중 최근사 · Imagen 3: 1:1, 4:3, 3:4, 16:9, 9:16 중 최근사 · Pollinations: 비율 그대로`;
  }

  async function generateImageForPayload(payload) {
    const manualRatio = getSelectedRatio();
    const ratio = manualRatio || detectRatioFromText(payload.prompt) || null;
    return client.generateSlideImage({
      slideId: payload.slideId,
      title: payload.title,
      prompt: adaptPromptForProvider(payload),
      ratio,
    });
  }

  function updateGalleryNav() {
    const total = gallery.length;
    if (els.galleryCounter) {
      els.galleryCounter.textContent = total ? `${galleryIndex + 1} / ${total}` : "0 / 0";
    }
    if (els.prevBtn) els.prevBtn.disabled = galleryIndex <= 0;
    if (els.nextBtn) els.nextBtn.disabled = galleryIndex >= total - 1;
    if (els.clearGalleryBtn) els.clearGalleryBtn.disabled = total === 0;
    if (els.openFolderBtn) els.openFolderBtn.disabled = total === 0;
  }

  function clearPrompt() {
    queue?.clear?.();
    if (els.title) els.title.value = "slide-01";
    if (els.prompt) els.prompt.value = "";
    activePromptMeta = { generationPath: "full_slide", targetModel: "common", contractVersion: "1.0", outputMode: "standard" };
    updateRatioHint(null);
    setStatus("프롬프트 입력과 이전 슬라이드 큐를 비웠습니다.");
  }

  function clearGallery() {
    gallery.length = 0;
    galleryIndex = -1;
    if (els.preview) els.preview.innerHTML = "<span>아직 생성된 이미지가 없습니다.</span>";
    if (els.meta) els.meta.textContent = "";
    if (els.resultBadge) els.resultBadge.textContent = "결과 없음";
    updateGalleryNav();
    renderQualityPanel(null);
  }

  function renderGalleryItem(index) {
    if (index < 0 || index >= gallery.length) return;
    const item = gallery[index];
    galleryIndex = index;
    if (els.preview) {
      els.preview.innerHTML = "";
      const img = document.createElement("img");
      img.alt = item.title;
      img.src = item.url;
      els.preview.appendChild(img);
    }
    if (els.meta) {
      const pathLabel = normalizeGenerationPath(item.generationPath) === "precision_full_slide"
        ? "정밀 일체형 완성 슬라이드"
        : item.generationPath === "edit_reference" ? "참조 편집" : "완성 슬라이드";
      els.meta.textContent = `[${index + 1}/${gallery.length}] ${item.title}\n저장 파일: ${item.filename}\n모델: ${item.model}\n생성 경로: ${pathLabel}`;
    }
    if (els.resultBadge) els.resultBadge.textContent = `완료 ${gallery.length}장`;
    updateGalleryNav();
    renderQualityPanel(item);
  }

  function showResult(title, result, payload = {}) {
    gallery.push({
      title,
      slideId: payload.slideId || title,
      url: result.url,
      filename: result.filename,
      model: result.model,
      prompt: payload.prompt || "",
      generationPath: payload.generationPath || "full_slide",
      targetModel: payload.targetModel || "common",
      contractVersion: payload.contractVersion || "1.0",
      outputMode: payload.outputMode || "standard",
      iteration: Math.max(0, Number(payload.iteration) || 0),
      ts: Date.now(),
    });
    renderGalleryItem(gallery.length - 1);
  }

  function renderQualityRubric() {
    if (!els.qualityRubric || !qualityLoop) return;
    els.qualityRubric.innerHTML = qualityLoop.rubric.map((item) => `
      <div class="slide-quality-rubric-item" data-quality-item="${item.id}">
        <div class="slide-quality-rubric-copy">
          <strong>${item.label}</strong><em>${item.weight}점${item.critical ? " · 필수" : ""}</em>
          <p>${item.question}</p>
        </div>
        <div class="slide-quality-rating" role="group" aria-label="${item.label} 점수">
          ${[1, 2, 3, 4, 5].map((score) => `<button type="button" data-quality-rating="${item.id}" data-score="${score}" aria-label="${item.label} ${score}점">${score}</button>`).join("")}
        </div>
      </div>
    `).join("");
    els.qualityRubric.addEventListener("click", (event) => {
      const button = event.target.closest("[data-quality-rating]");
      const item = gallery[galleryIndex];
      if (!button || !item) return;
      item.reviewDraft = item.reviewDraft || { ratings: {}, notes: "" };
      item.reviewDraft.ratings[button.dataset.qualityRating] = Number(button.dataset.score);
      renderQualityPanel(item);
    });
  }

  function updateDeckQualitySummary() {
    if (!els.qualityDeckSummary || !qualityLoop) return;
    const summary = qualityLoop.summarizeHistory();
    els.qualityDeckSummary.textContent = summary.reviewed
      ? `덱 QA · 최신 평가 ${summary.reviewed}장 · 통과 ${summary.passed}장 · 평균 ${summary.average}점 · 누적 반복 ${summary.totalRuns}회`
      : "아직 저장된 QA 이력이 없습니다.";
  }

  function renderQualityPanel(item) {
    if (!qualityLoop || !els.qualityPanel) return;
    const hasItem = Boolean(item);
    const draft = item?.reviewDraft || { ratings: {}, notes: "" };
    const assessment = qualityLoop.evaluate(draft.ratings);

    if (els.qualityNotes) {
      els.qualityNotes.disabled = !hasItem;
      if (els.qualityNotes.value !== (draft.notes || "")) els.qualityNotes.value = draft.notes || "";
    }
    els.qualityRubric?.querySelectorAll("[data-quality-rating]").forEach((button) => {
      const selected = Number(draft.ratings?.[button.dataset.qualityRating]) === Number(button.dataset.score);
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      button.disabled = !hasItem;
    });

    if (!hasItem) {
      if (els.qualityBadge) els.qualityBadge.textContent = "평가 대기";
      if (els.qualityContract) {
        els.qualityContract.className = "slide-quality-contract";
        els.qualityContract.textContent = "생성 결과를 선택하면 기획 스킬과 공통 프롬프트의 연결 상태를 확인합니다.";
      }
      if (els.qualityScore) els.qualityScore.innerHTML = "<strong>—</strong><span>6개 품질 축을 평가해주세요.</span>";
      if (els.qualitySaveBtn) els.qualitySaveBtn.disabled = true;
      if (els.qualityPlannerFeedbackBtn) els.qualityPlannerFeedbackBtn.disabled = true;
      if (els.qualityRefineBtn) {
        els.qualityRefineBtn.disabled = true;
        els.qualityRefineBtn.textContent = "실패 항목만 보정·재생성";
      }
      updateDeckQualitySummary();
      return;
    }

    const contract = qualityLoop.analyzePromptContract(item.prompt);
    if (els.qualityContract) {
      els.qualityContract.className = `slide-quality-contract ${contract.ready ? "is-ready" : "is-review"}`;
      els.qualityContract.textContent = contract.ready
        ? `기획 스킬 MECE ${contract.sectionCount}/5 · C/V 확정 · 공통 프롬프트 연결 완료`
        : `연계 확인 필요 · MECE ${contract.sectionCount}/5${contract.warnings.length ? ` · ${contract.warnings.join(" ")}` : ""}`;
    }

    const loopExhausted = assessment.complete && !assessment.passed && item.iteration >= qualityLoop.maxIterations;
    if (els.qualityScore) {
      const message = !assessment.complete
        ? "미평가 항목이 있습니다. 1점은 전면 수정, 5점은 상업 품질 통과입니다."
        : assessment.passed
          ? "상업 품질 게이트 통과 · 이 슬라이드는 다음 제작 단계로 넘길 수 있습니다."
          : loopExhausted
            ? "보정 한도 도달 · 기획 MD의 콘텐츠 깊이·C/V·큰 레이아웃을 다시 설계해야 합니다."
          : `보정 필요 · ${assessment.improvementTargets.map((target) => target.label).slice(0, 3).join(", ")} 우선`;
      els.qualityScore.innerHTML = `<strong>${assessment.complete ? `${assessment.score}` : "—"}</strong><span>${message}</span>`;
    }
    if (els.qualityBadge) els.qualityBadge.textContent = !assessment.complete ? "평가 중" : assessment.passed ? "통과" : loopExhausted ? "기획 재검토" : "보정 필요";
    if (els.qualitySaveBtn) els.qualitySaveBtn.disabled = !assessment.complete;
    if (els.qualityPlannerFeedbackBtn) els.qualityPlannerFeedbackBtn.disabled = !assessment.complete || assessment.passed;
    if (els.qualityRefineBtn) {
      els.qualityRefineBtn.disabled = !assessment.complete || assessment.passed || loopExhausted;
      els.qualityRefineBtn.textContent = loopExhausted ? "기획 MD 재검토 필요" : "실패 항목만 보정·재생성";
    }
    updateDeckQualitySummary();
  }

  function saveCurrentQualityReview(options = {}) {
    const item = gallery[galleryIndex];
    if (!item || !qualityLoop) return null;
    item.reviewDraft = item.reviewDraft || { ratings: {}, notes: "" };
    const assessment = qualityLoop.evaluate(item.reviewDraft.ratings);
    if (!assessment.complete) {
      setStatus("6개 품질 축을 모두 평가해주세요.", "error");
      return null;
    }
    const saved = qualityLoop.saveReview({
      slideId: item.slideId,
      iteration: item.iteration,
      ratings: assessment.ratings,
      score: assessment.score,
      passed: assessment.passed,
      notes: item.reviewDraft.notes,
    });
    item.savedReview = saved;
    if (!options.silent) setStatus(assessment.passed ? `QA ${assessment.score}점으로 통과했습니다.` : `QA ${assessment.score}점과 보정 대상을 저장했습니다.`, assessment.passed ? "ok" : "error");
    renderQualityPanel(item);
    return { saved, assessment };
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("클립보드 복사를 지원하지 않는 브라우저입니다.");
  }

  async function copyPlannerFeedback() {
    const item = gallery[galleryIndex];
    if (!item || !qualityLoop) return;
    item.reviewDraft = item.reviewDraft || { ratings: {}, notes: "" };
    try {
      const feedback = qualityLoop.buildPlannerFeedback({
        slideId: item.slideId,
        title: item.title,
        iteration: item.iteration,
        ratings: item.reviewDraft.ratings,
        notes: item.reviewDraft.notes,
        prompt: item.prompt,
      });
      await copyTextToClipboard(feedback);
      setStatus("$ppt-slide-planner가 바로 읽을 수 있는 재기획 피드백을 복사했습니다.", "ok");
    } catch (error) {
      setStatus(`기획 스킬 피드백 복사 실패: ${error.message}`, "error");
    }
  }

  async function refineCurrentImage() {
    const item = gallery[galleryIndex];
    if (!item || !qualityLoop) return;
    if (item.iteration >= qualityLoop.maxIterations) {
      setStatus(`보정 ${qualityLoop.maxIterations}회 안에 통과하지 못했습니다. 이미지 효과를 더 쌓지 말고 $ppt-slide-planner 기획 MD의 콘텐츠 깊이·C/V·큰 레이아웃을 재검토해주세요.`, "error");
      return;
    }
    const review = saveCurrentQualityReview({ silent: true });
    if (!review || review.assessment.passed) return;

    let correctionPrompt;
    try {
      correctionPrompt = qualityLoop.buildCorrectionPrompt(item.prompt, {
        ratings: review.assessment.ratings,
        notes: item.reviewDraft?.notes,
        iteration: item.iteration + 1,
      });
    } catch (error) {
      setStatus(error.message, "error");
      return;
    }

    const payload = {
      slideId: item.slideId,
      title: item.title,
      prompt: correctionPrompt,
      generationPath: item.generationPath,
      targetModel: item.targetModel,
      contractVersion: item.contractVersion,
      outputMode: item.outputMode,
      iteration: item.iteration + 1,
    };
    if (els.prompt) els.prompt.value = correctionPrompt;
    if (els.title) els.title.value = item.title;
    activePromptMeta = {
      generationPath: item.generationPath,
      targetModel: item.targetModel,
      contractVersion: item.contractVersion,
      outputMode: item.outputMode,
    };

    setBusy(true);
    setStatus(`${item.title}의 실패 항목만 보정해 ${payload.iteration}차 이미지를 생성합니다.`);
    try {
      const result = await generateImageForPayload(payload);
      showResult(item.title, result, payload);
      setStatus(`${item.title} ${payload.iteration}차 보정 생성이 완료되었습니다. 같은 6개 축으로 다시 검수해주세요.`, "ok");
    } catch (error) {
      setStatus(`보정 재생성 실패: ${error.message}`, "error");
    } finally {
      setBusy(false);
      renderQualityPanel(gallery[galleryIndex] || null);
    }
  }

  async function generateImage() {
    const prompt = els.prompt?.value?.trim();
    if (!prompt) {
      setStatus("이미지 생성 프롬프트를 먼저 입력하거나 가져와주세요.", "error");
      return;
    }

    setBusy(true);
    setStatus("이미지를 생성하는 중입니다.");
    if (els.resultBadge) els.resultBadge.textContent = "생성 중";

    try {
      const title = els.title?.value?.trim() || "slide-01";
      const result = await generateImageForPayload({ slideId: title, title, prompt, ...activePromptMeta });
      showResult(title, result, { slideId: title, title, prompt, ...activePromptMeta });
      setStatus(normalizeGenerationPath(activePromptMeta.generationPath) === "precision_full_slide"
        ? "정밀 일체형 슬라이드 생성이 완료되었습니다. 문구·수치·관계 무결성을 검수해주세요."
        : "이미지 생성이 완료되었습니다.", "ok");
    } catch (error) {
      if (els.resultBadge) els.resultBadge.textContent = "실패";
      setStatus(`이미지 생성 실패: ${error.message}`, "error");
    } finally {
      setBusy(false);
      renderQueue();
    }
  }

  async function startQueue() {
    const snapshot = queue.snapshot();
    if (!snapshot.jobs.length) {
      loadDeckPrompts();
    }
    if (!queue.snapshot().jobs.length) return;

    setStatus("순차 생성을 시작합니다.");
    await queue.run({
      delayMs: Number(els.delayMs?.value || 0),
      maxRetries: Number(els.maxRetries?.value || 0),
    });
  }

  async function retryFailedQueue() {
    const failedJobs = queue.snapshot().jobs.filter((job) => job.status === "failed");
    if (!failedJobs.length) {
      setStatus("다시 생성할 실패 항목이 없습니다.");
      return;
    }

    queue.setJobs(failedJobs.map((job) => ({
      slideId: job.slideId,
      title: job.title,
      label: job.label,
      prompt: job.prompt,
      generationPath: job.generationPath,
      targetModel: job.targetModel,
      contractVersion: job.contractVersion,
      outputMode: job.outputMode,
    })));
    setStatus(`실패 항목 ${failedJobs.length}개만 다시 생성합니다.`);
    await queue.run({
      delayMs: Number(els.delayMs?.value || 0),
      maxRetries: Number(els.maxRetries?.value || 0),
    });
  }

  function setupQueue() {
    queue = queueFactory.createGenerationQueue({
      worker: async (job) => {
        const result = await generateImageForPayload(job);
        showResult(job.title, result, job);
        return result;
      },
      onUpdate: (snapshot) => {
        renderQueue(snapshot);
        const isRunning = snapshot.status === "running" || snapshot.status === "paused";
        if (els.startQueueBtn) els.startQueueBtn.disabled = isRunning;
        if (snapshot.status === "running") setStatus("순차 생성 중입니다.");
        if (snapshot.status === "paused") setStatus("순차 생성이 일시정지되었습니다.");
      },
      onDone: (snapshot) => {
        if (els.startQueueBtn) els.startQueueBtn.disabled = false;
        const failed = snapshot.jobs.filter((job) => job.status === "failed").length;
        setStatus(failed ? `순차 생성 완료: 실패 ${failed}개를 확인하세요.` : "순차 생성이 모두 완료되었습니다.", failed ? "error" : "ok");
      },
    });
    renderQueue(queue.snapshot());
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureUsabilityControls();
    bindElements();
    if (!els.generateBtn) return;
    renderQualityRubric();
    setupQueue();
    if (els.healthBtn) els.healthBtn.addEventListener("click", checkServer);
    if (els.useMockBtn) els.useMockBtn.addEventListener("click", switchToMockMode);
    els.loadPromptBtn.addEventListener("click", loadCurrentPrompt);
    els.loadDeckBtn.addEventListener("click", loadDeckPrompts);
    els.generateBtn.addEventListener("click", generateImage);
    els.startQueueBtn.addEventListener("click", startQueue);
    if (els.retryFailedBtn) els.retryFailedBtn.addEventListener("click", retryFailedQueue);
    els.pauseQueueBtn.addEventListener("click", () => queue.pause());
    els.resumeQueueBtn.addEventListener("click", () => queue.resume());
    els.stopQueueBtn.addEventListener("click", () => queue.stop());
    if (els.clearPromptBtn) els.clearPromptBtn.addEventListener("click", clearPrompt);
    if (els.resetResultBtn) els.resetResultBtn.addEventListener("click", clearGallery);
    if (els.qualityNotes) {
      els.qualityNotes.addEventListener("input", () => {
        const item = gallery[galleryIndex];
        if (!item) return;
        item.reviewDraft = item.reviewDraft || { ratings: {}, notes: "" };
        item.reviewDraft.notes = els.qualityNotes.value;
      });
    }
    if (els.qualitySaveBtn) els.qualitySaveBtn.addEventListener("click", () => saveCurrentQualityReview());
    if (els.qualityPlannerFeedbackBtn) els.qualityPlannerFeedbackBtn.addEventListener("click", copyPlannerFeedback);
    if (els.qualityRefineBtn) els.qualityRefineBtn.addEventListener("click", refineCurrentImage);

    // 설정 패널 토글
    const configToggle = document.getElementById("slideImageConfigToggle");
    const configBody = document.getElementById("slideImageConfigBody");
    if (configToggle && configBody) {
      configToggle.addEventListener("click", () => {
        const isHidden = configBody.hidden;
        configBody.hidden = !isHidden;
        configToggle.textContent = isHidden ? "설정 닫기" : "설정 열기";
      });
    }

    // 서비스 선택 변경 시 키 입력 영역 토글
    const providerSelect = document.getElementById("slideImageProvider");
    if (providerSelect) {
      providerSelect.addEventListener("change", () => updateKeyRowVisibility(providerSelect.value));
    }

    // API 키 표시/숨김 토글
    document.querySelectorAll(".slide-image-key-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        btn.textContent = isPassword ? "숨김" : "표시";
      });
    });

    // 설정 저장
    const saveConfigBtn = document.getElementById("slideImageSaveConfigBtn");
    if (saveConfigBtn) saveConfigBtn.addEventListener("click", saveConfig);

    // 갤러리 네비게이션
    if (els.prevBtn) els.prevBtn.addEventListener("click", () => renderGalleryItem(galleryIndex - 1));
    if (els.nextBtn) els.nextBtn.addEventListener("click", () => renderGalleryItem(galleryIndex + 1));

    // 폴더 열기 (로컬 서버 실행 시에만 동작, 브라우저 환경에서는 다운로드 폴더를 직접 확인)
    if (els.openFolderBtn) {
      els.openFolderBtn.addEventListener("click", async () => {
        try {
          await client.openOutputFolder();
          setStatus("outputs 폴더를 열었습니다.", "ok");
        } catch (error) {
          setStatus(`outputs 폴더 열기 실패: ${error.message}`, "error");
        }
      });
    }

    // 갤러리 초기화
    if (els.clearGalleryBtn) {
      els.clearGalleryBtn.addEventListener("click", clearGallery);
    }

    updateGalleryNav();
    renderQualityPanel(null);
    checkServer();
  });

  window.PromptDeckSlideImageGeneration = Object.freeze({
    loadPayload,
    loadCurrentPrompt,
    generateCurrent: generateImage,
    getActivePayload: () => ({
      title: els.title?.value || "slide-01",
      prompt: els.prompt?.value || "",
      ...activePromptMeta,
    }),
  });
})();
