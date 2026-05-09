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
    els.generateBtn = document.getElementById("slideImageGenerateBtn");
    els.startQueueBtn = document.getElementById("slideImageStartQueueBtn");
    els.pauseQueueBtn = document.getElementById("slideImagePauseQueueBtn");
    els.resumeQueueBtn = document.getElementById("slideImageResumeQueueBtn");
    els.stopQueueBtn = document.getElementById("slideImageStopQueueBtn");
    els.delayMs = document.getElementById("slideImageDelayMs");
    els.maxRetries = document.getElementById("slideImageMaxRetries");
    els.queueSummary = document.getElementById("slideImageQueueSummary");
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
  }

  function setStatus(message, type = "") {
    if (!els.status) return;
    els.status.textContent = message;
    els.status.classList.toggle("is-ok", type === "ok");
    els.status.classList.toggle("is-error", type === "error");
  }

  function setBusy(isBusy) {
    [els.healthBtn, els.loadPromptBtn, els.loadDeckBtn, els.generateBtn, els.startQueueBtn].forEach((button) => {
      if (button) button.disabled = isBusy;
    });
  }

  function getCurrentDesignerPrompt() {
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
    openai: "OpenAI DALL·E 3",
  };

  async function checkServer() {
    setBusy(true);
    setStatus("로컬 서버 연결을 확인하는 중입니다.");
    try {
      const result = await client.checkImageGenerationServer();
      serverMode = result.provider || "unknown";
      if (els.serverBadge) els.serverBadge.textContent = PROVIDER_LABELS[serverMode] || serverMode;
      setStatus(`서버 연결 정상 · ${PROVIDER_LABELS[serverMode] || serverMode}`, "ok");
      syncProviderSelect(serverMode);
    } catch (error) {
      setStatus(`서버 연결 실패: ${error.message}. npm run dev:pollinations 실행 여부를 확인하세요.`, "error");
    } finally {
      setBusy(false);
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
      setStatus(`서비스가 ${PROVIDER_LABELS[provider] || provider}(으)로 변경되었습니다.`, "ok");
      document.getElementById("slideImageConfigBody").hidden = true;
      document.getElementById("slideImageConfigToggle").textContent = "설정 열기";
    } catch (error) {
      setStatus(`설정 저장 실패: ${error.message}`, "error");
    }
  }

  function loadCurrentPrompt() {
    const prompt = getCurrentDesignerPrompt();
    if (!prompt) {
      setStatus("가져올 프롬프트가 없습니다. 슬라이드 프롬프트 제작 탭에서 먼저 프롬프트를 구성해주세요.", "error");
      return;
    }
    els.prompt.value = prompt;
    setStatus("현재 프롬프트를 가져왔습니다.", "ok");
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

  async function generateImageForPayload(payload) {
    return client.generateSlideImage({
      slideId: payload.slideId,
      title: payload.title,
      prompt: payload.prompt,
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

  function renderGalleryItem(index) {
    if (index < 0 || index >= gallery.length) return;
    const item = gallery[index];
    galleryIndex = index;
    if (els.preview) {
      els.preview.innerHTML = "";
      const img = document.createElement("img");
      img.alt = item.title;
      img.src = `${item.url}?t=${item.ts}`;
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
    bindElements();
    if (!els.healthBtn) return;
    setupQueue();
    els.healthBtn.addEventListener("click", checkServer);
    els.loadPromptBtn.addEventListener("click", loadCurrentPrompt);
    els.loadDeckBtn.addEventListener("click", loadDeckPrompts);
    els.generateBtn.addEventListener("click", generateImage);
    els.startQueueBtn.addEventListener("click", startQueue);
    els.pauseQueueBtn.addEventListener("click", () => queue.pause());
    els.resumeQueueBtn.addEventListener("click", () => queue.resume());
    els.stopQueueBtn.addEventListener("click", () => queue.stop());

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

    // 폴더 열기
    if (els.openFolderBtn) {
      els.openFolderBtn.addEventListener("click", async () => {
        try {
          await client.openOutputFolder();
        } catch {
          setStatus("폴더 열기 실패: 서버가 실행 중인지 확인하세요.", "error");
        }
      });
    }

    // 갤러리 초기화
    if (els.clearGalleryBtn) {
      els.clearGalleryBtn.addEventListener("click", () => {
        gallery.length = 0;
        galleryIndex = -1;
        if (els.preview) els.preview.innerHTML = "<span>아직 생성된 이미지가 없습니다.</span>";
        if (els.meta) els.meta.textContent = "";
        if (els.resultBadge) els.resultBadge.textContent = "결과 없음";
        updateGalleryNav();
      });
    }

    updateGalleryNav();

    const tabBtn = document.getElementById("tabBtnSlideImage");
    if (tabBtn) {
      tabBtn.addEventListener("click", () => {
        if (serverMode === "unknown") checkServer();
      });
    }
  });
})();
