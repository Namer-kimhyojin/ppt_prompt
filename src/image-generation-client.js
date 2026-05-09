(function () {
  const API_BASE = "";

  async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json; charset=utf-8",
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }
    return data;
  }

  async function checkImageGenerationServer() {
    return requestJson("/api/health", { method: "GET", headers: {} });
  }

  async function getConfig() {
    return requestJson("/api/config", { method: "GET", headers: {} });
  }

  async function setConfig(payload) {
    return requestJson("/api/config", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function generateSlideImage(payload) {
    return requestJson("/api/generate-image", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function openOutputFolder() {
    return requestJson("/api/open-folder", { method: "POST", body: "{}" });
  }

  window.PromptDeckImageGenerationClient = {
    checkImageGenerationServer,
    getConfig,
    setConfig,
    generateSlideImage,
    openOutputFolder,
  };
})();

