(function () {
  const REQUEST_TIMEOUT_MS = 180000;

  function withTimeout() {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    return { controller, timer };
  }

  async function fetchJson(url, options = {}) {
    const { controller, timer } = withTimeout();
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "content-type": "application/json; charset=utf-8",
          ...(options.headers || {}),
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `요청 실패: ${response.status}`);
      }
      return data;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
      }
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  }

  function normalizeImageResult(result) {
    if (!result?.url) throw new Error("서버 응답에 이미지 URL이 없습니다.");
    return {
      ...result,
      url: `${result.url}${result.url.includes("?") ? "&" : "?"}v=${Date.now()}`,
    };
  }

  async function checkImageGenerationServer() {
    return fetchJson("/api/health");
  }

  async function getConfig() {
    return fetchJson("/api/config");
  }

  async function setConfig(payload) {
    const body = { provider: payload.provider };
    if (payload.googleApiKey) body.googleApiKey = payload.googleApiKey;
    if (payload.openaiApiKey) body.openaiApiKey = payload.openaiApiKey;
    return fetchJson("/api/config", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async function generateSlideImage(payload) {
    const body = {
      slideId: payload.slideId,
      title: payload.title,
      prompt: payload.prompt,
    };
    if (payload.ratio) body.ratio = payload.ratio;
    const result = await fetchJson("/api/generate-image", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return normalizeImageResult(result);
  }

  async function openOutputFolder() {
    return fetchJson("/api/open-folder", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  window.PromptDeckImageGenerationClient = {
    checkImageGenerationServer,
    getConfig,
    setConfig,
    generateSlideImage,
    openOutputFolder,
  };
})();
