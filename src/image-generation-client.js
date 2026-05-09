(function () {
  const CONFIG_KEY = "promptdeck_image_config";

  const DEFAULT_CONFIG = {
    provider: "pollinations",
    googleApiKey: "",
    openaiApiKey: "",
  };

  function loadConfig() {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}") };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  function saveConfigToStorage(cfg) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .slice(0, 60) || "slide";
  }

  function randomSuffix() {
    return Math.random().toString(36).slice(2, 10);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return url;
  }

  // ── Pollinations ──────────────────────────────────────────────
  async function generatePollinations({ slideId, title, prompt }) {
    const encoded = encodeURIComponent(String(prompt).trim().slice(0, 1800));
    const apiUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true`;

    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120000);
      try {
        response = await fetch(apiUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      if (response.status === 429 && attempt < 3) {
        await new Promise((r) => setTimeout(r, 15000 * attempt));
        continue;
      }
      break;
    }
    if (!response.ok) throw new Error(`Pollinations API 오류: ${response.status}`);

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? ".png" : contentType.includes("webp") ? ".webp" : ".jpg";
    const blob = await response.blob();
    const filename = `${slugify(slideId || title)}-${randomSuffix()}${ext}`;
    const blobUrl = downloadBlob(blob, filename);

    return { url: blobUrl, filename, model: "pollinations/default", mimeType: contentType };
  }

  // ── Google Gemini ─────────────────────────────────────────────
  async function generateGemini({ slideId, title, prompt, apiKey }) {
    if (!apiKey) throw new Error("Google API 키가 설정되지 않았습니다. 이미지 생성 설정에서 키를 입력해주세요.");

    const model = "gemini-2.0-flash-preview-image-generation";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: String(prompt).trim() }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `Gemini API 오류: ${response.status}`);

    const candidates = data?.candidates || [];
    let inlineData = null;
    for (const candidate of candidates) {
      for (const part of candidate?.content?.parts || []) {
        if (part.inlineData?.data) { inlineData = part.inlineData; break; }
        if (part.inline_data?.data) { inlineData = part.inline_data; break; }
      }
      if (inlineData) break;
    }
    if (!inlineData) throw new Error("Gemini 응답에 이미지 데이터가 없습니다.");

    const mimeType = inlineData.mimeType || inlineData.mime_type || "image/png";
    const ext = mimeType.includes("jpeg") ? ".jpg" : mimeType.includes("webp") ? ".webp" : ".png";
    const byteString = atob(inlineData.data);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    const filename = `${slugify(slideId || title)}-${randomSuffix()}${ext}`;
    const blobUrl = downloadBlob(blob, filename);

    return { url: blobUrl, filename, model, mimeType };
  }

  // ── OpenAI DALL·E 3 ───────────────────────────────────────────
  async function generateOpenAI({ slideId, title, prompt, apiKey }) {
    if (!apiKey) throw new Error("OpenAI API 키가 설정되지 않았습니다. 이미지 생성 설정에서 키를 입력해주세요.");

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        "authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: String(prompt).trim().slice(0, 4000),
        n: 1,
        size: "1792x1024",
        response_format: "b64_json",
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI API 오류: ${response.status}`);

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI 응답에 이미지 데이터가 없습니다.");

    const byteString = atob(b64);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
    const blob = new Blob([bytes], { type: "image/png" });
    const filename = `${slugify(slideId || title)}-${randomSuffix()}.png`;
    const blobUrl = downloadBlob(blob, filename);

    return { url: blobUrl, filename, model: "dall-e-3", mimeType: "image/png" };
  }

  // ── Mock ──────────────────────────────────────────────────────
  function generateMock({ slideId, title, prompt }) {
    const label = title || slideId || "Slide";
    const short = String(prompt || "").slice(0, 200);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#f5f6f7"/>
  <rect x="0" y="0" width="1280" height="80" fill="#004db0"/>
  <text x="24" y="52" font-family="Arial" font-size="32" font-weight="700" fill="#fff">${label}</text>
  <text x="24" y="130" font-family="Arial" font-size="20" fill="#333">Mock 이미지 — 실제 서비스에서는 생성된 이미지가 표시됩니다.</text>
  <foreignObject x="24" y="160" width="1232" height="520">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font:18px Arial;color:#444;line-height:1.5">${short}</div>
  </foreignObject>
</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const filename = `${slugify(slideId || title)}-${randomSuffix()}.svg`;
    const blobUrl = downloadBlob(blob, filename);
    return Promise.resolve({ url: blobUrl, filename, model: "mock", mimeType: "image/svg+xml" });
  }

  // ── Public API ────────────────────────────────────────────────
  async function checkImageGenerationServer() {
    const cfg = loadConfig();
    return { ok: true, provider: cfg.provider, providers: {} };
  }

  async function getConfig() {
    return { ok: true, ...loadConfig() };
  }

  async function setConfig(payload) {
    const cfg = loadConfig();
    if (payload.provider) cfg.provider = payload.provider;
    if (typeof payload.googleApiKey === "string") cfg.googleApiKey = payload.googleApiKey;
    if (typeof payload.openaiApiKey === "string") cfg.openaiApiKey = payload.openaiApiKey;
    saveConfigToStorage(cfg);
    return { ok: true, provider: cfg.provider };
  }

  async function generateSlideImage(payload) {
    const cfg = loadConfig();
    const provider = cfg.provider || "pollinations";
    if (provider === "mock") return generateMock(payload);
    if (provider === "pollinations") return generatePollinations(payload);
    if (provider === "google") return generateGemini({ ...payload, apiKey: cfg.googleApiKey });
    if (provider === "openai") return generateOpenAI({ ...payload, apiKey: cfg.openaiApiKey });
    throw new Error(`알 수 없는 서비스: ${provider}`);
  }

  async function openOutputFolder() {
    // 브라우저 환경에서는 다운로드 폴더를 직접 열 수 없음
    return { ok: true };
  }

  window.PromptDeckImageGenerationClient = {
    checkImageGenerationServer,
    getConfig,
    setConfig,
    generateSlideImage,
    openOutputFolder,
    loadConfig,
  };
})();
