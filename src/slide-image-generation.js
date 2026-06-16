(function () {
  const client = window.PromptDeckImageGenerationClient;
  const queueFactory = window.PromptDeckGenerationQueue;
  if (!client || !queueFactory) return;

  const els = {};
  let queue;
  let serverMode = "unknown";

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
  }

  function ensureUsabilityControls() {
    const primaryActions = document.getElementById("slideImageGenerateBtn")?.closest(".slide-image-actions");
    if (primaryActions && !document.getElementById("slideImageUseMockBtn")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gen-btn secondary";
      button.id = "slideImageUseMockBtn";
      button.textContent = "목업으로 테스트";
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
    [els.healthBtn, els.loadPromptBtn, els.loadDeckBtn, els.useMockBtn, els.generateBtn, els.startQueueBtn, els.retryFailedBtn].forEach((button) => {
      if (button) button.disabled = isBusy;
    });
  }

  function activePaneId() {
    return document.querySelector(".tab-pane.active")?.id || "";
  }

  function getPromotionPrompt() {
    return document.getElementById("promotionPromptPreview")?.value?.trim() || "";
  }

  function getCurrentDesignerPrompt() {
    if (activePaneId() === "panePromotion") {
      return getPromotionPrompt();
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

  function makeJobFromRecord(record) {
    return {
      slideId: record.promptId || `slide-${record.index + 1}`,
      title: record.title || record.label || `slide-${record.index + 1}`,
      label: record.label || `SLIDE ${record.index + 1}`,
      prompt: record.prompt || "",
    };
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
      serverMode = cfg.provider || "mock";
      if (els.serverBadge) els.serverBadge.textContent = PROVIDER_LABELS[serverMode] || serverMode;
      if (els.generateBtn) els.generateBtn.textContent = serverMode === "mock" ? "목업 이미지 생성" : "이미지 생성";
      syncProviderSelect(serverMode);
      setStatus(`로컬 서버 연결됨 · ${PROVIDER_LABELS[serverMode] || serverMode}`, "ok");
      return true;
    } catch (error) {
      serverMode = "offline";
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
    await client.setConfig({ provider: "mock" });
    serverMode = "mock";
    syncProviderSelect("mock");
    if (els.serverBadge) els.serverBadge.textContent = PROVIDER_LABELS.mock;
    if (els.generateBtn) els.generateBtn.textContent = "목업 이미지 생성";
    setStatus("목업 테스트 모드로 전환했습니다. Google 쿼터와 무관하게 테스트할 수 있습니다.", "ok");
  }

  function loadCurrentPrompt() {
    const prompt = getCurrentDesignerPrompt();
    if (!prompt) {
      setStatus("가져올 프롬프트가 없습니다. 슬라이드 프롬프트 제작 탭에서 먼저 프롬프트를 구성해주세요.", "error");
      return;
    }
    els.prompt.value = prompt;
    const detected = detectRatioFromText(prompt);
    updateRatioHint(detected);
    const detectedLabel = detected ? ` (비율 감지: ${detected})` : "";
    setStatus(`현재 프롬프트를 가져왔습니다.${detectedLabel}`, "ok");
  }

  function loadDeckPrompts() {
    const records = window.PromptDeckSlidePromptGenerator?.getRecords?.() || [];
    const jobs = records
      .filter((record) => record.prompt && record.entryType === "slide")
      .map(makeJobFromRecord);

    if (!jobs.length) {
      setStatus("가져올 슬라이드 프롬프트 목록이 없습니다. 슬라이드 분리기 탭에서 먼저 프롬프트를 생성해주세요.", "error");
      return;
    }

    queue.setJobs(jobs);
    const first = jobs[0];
    els.title.value = first.slideId;
    els.prompt.value = first.prompt;
    setStatus(`${jobs.length}개 슬라이드 프롬프트를 큐에 추가했습니다.`, "ok");
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
      prompt: payload.prompt,
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
    if (els.prompt) els.prompt.value = "";
    setStatus("프롬프트 입력을 비웠습니다.");
  }

  function clearGallery() {
    gallery.length = 0;
    galleryIndex = -1;
    if (els.preview) els.preview.innerHTML = "<span>아직 생성된 이미지가 없습니다.</span>";
    if (els.meta) els.meta.textContent = "";
    if (els.resultBadge) els.resultBadge.textContent = "결과 없음";
    updateGalleryNav();
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
      els.meta.textContent = `[${index + 1}/${gallery.length}] ${item.title}\n저장 파일: ${item.filename}\n모델: ${item.model}`;
    }
    if (els.resultBadge) els.resultBadge.textContent = `완료 ${gallery.length}장`;
    updateGalleryNav();
  }

  function showResult(title, result) {
    gallery.push({ title, url: result.url, filename: result.filename, model: result.model, ts: Date.now() });
    renderGalleryItem(gallery.length - 1);
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
      const result = await generateImageForPayload({ slideId: title, title, prompt });
      showResult(title, result);
      setStatus("이미지 생성이 완료되었습니다.", "ok");
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
        showResult(job.title, result);
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
    checkServer();
  });
})();
