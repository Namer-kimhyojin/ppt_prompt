import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";

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

function getImageExtension(mimeType) {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/svg+xml") return ".svg";
  return ".png";
}

function assertGeminiConfig(apiKey) {
  if (!apiKey || apiKey === "PASTE_GOOGLE_API_KEY_HERE") {
    throw new Error("Google API 키가 설정되지 않았습니다. 이미지 생성 설정에서 API 키를 입력해주세요.");
  }
}

function assertOpenAIConfig(apiKey) {
  if (!apiKey) {
    throw new Error("OpenAI API 키가 설정되지 않았습니다. 이미지 생성 설정에서 API 키를 입력해주세요.");
  }
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── 비율 유틸리티 ─────────────────────────────────────────────────────────

/**
 * 클라이언트가 보낸 ratio 문자열("16:9", "4:5") 또는 프롬프트 텍스트에서
 * {w, h} 숫자 객체로 파싱. 픽셀 입력(1080x1920)도 비율로 변환.
 */
function parseRatioValue(ratio) {
  if (!ratio) return null;
  const s = String(ratio).trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*[:x×]\s*(\d+(?:\.\d+)?)$/i);
  if (!m) return null;
  const w = Number(m[1]), h = Number(m[2]);
  return w > 0 && h > 0 ? { w, h } : null;
}

/**
 * 프롬프트 텍스트에서 비율 또는 픽셀 크기를 추출해 {w, h} 반환.
 * 픽셀 입력은 그대로 비율로 사용 (절대 크기 정보는 엔진이 결정).
 */
function extractRatioFromPrompt(promptText) {
  const text = String(promptText || "");

  // 1. 직접 입력 크기: "1080x1920 px" 또는 "직접 입력 크기: 1080x1920"
  const sizeMatch =
    text.match(/(?:직접 입력 크기|Exact size|Canvas size|캔버스 크기)[^\n:：]*[:：]?\s*(\d{3,5})\s*[x×]\s*(\d{3,5})/i) ||
    text.match(/\b(\d{3,5})\s*[x×]\s*(\d{3,5})\s*(?:px|픽셀)\b/i);
  if (sizeMatch) return { w: Number(sizeMatch[1]), h: Number(sizeMatch[2]) };

  // 2. 비율 표기: "비율/방향: 4:5" 또는 "Aspect ratio: 16:9"
  const ratioMatch = text.match(
    /(?:비율\/방향|Aspect ratio[^:]*|비율)[^\n:：]*[:：]\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/i
  );
  if (ratioMatch) return { w: Number(ratioMatch[1]), h: Number(ratioMatch[2]) };

  // 3. 키워드 폴백
  if (/9\s*:\s*16|세로 와이드/i.test(text)) return { w: 9, h: 16 };
  if (/16\s*:\s*9|가로 와이드/i.test(text)) return { w: 16, h: 9 };
  if (/4\s*:\s*5|SNS 세로/i.test(text)) return { w: 4, h: 5 };
  if (/5\s*:\s*4|SNS 가로/i.test(text)) return { w: 5, h: 4 };
  if (/세로형|portrait|vertical/i.test(text)) return { w: 3, h: 4 };
  if (/가로형|landscape|horizontal/i.test(text)) return { w: 4, h: 3 };
  if (/정사각|square/i.test(text)) return { w: 1, h: 1 };

  return null;
}

/** 클라이언트 ratio 우선, 없으면 프롬프트에서 추출, 최후 기본값 1:1 */
function resolveRatio(payload) {
  const fromClient = parseRatioValue(payload.ratio);
  if (fromClient) return fromClient;
  return extractRatioFromPrompt(payload.prompt) || { w: 1, h: 1 };
}

// ── OpenAI 크기 해석 ──────────────────────────────────────────────────────

/** gpt-image-1 / gpt-image-2 지원 크기: 1024x1024, 1536x1024, 1024x1536 */
function resolveOpenAISize(ratio) {
  const r = ratio.w / ratio.h;
  if (r > 1.12) return "1536x1024";
  if (r < 0.88) return "1024x1536";
  return "1024x1024";
}

// ── Imagen 3 비율 해석 ───────────────────────────────────────────────────

const IMAGEN3_RATIOS = [
  { key: "1:1",  v: 1 / 1  },
  { key: "4:3",  v: 4 / 3  },
  { key: "3:4",  v: 3 / 4  },
  { key: "16:9", v: 16 / 9 },
  { key: "9:16", v: 9 / 16 },
];

function resolveImagen3Ratio(ratio) {
  const target = ratio.w / ratio.h;
  return IMAGEN3_RATIOS.reduce((best, c) =>
    Math.abs(Math.log(target / c.v)) < Math.abs(Math.log(target / best.v)) ? c : best
  ).key;
}

function isImagen3Model(modelName) {
  return /imagen/i.test(String(modelName || ""));
}

// ── Pollinations 픽셀 크기 계산 ───────────────────────────────────────────

function pollinationsDimensions(ratio) {
  const MAX = 1440;
  const r = ratio.w / ratio.h;
  return r >= 1
    ? { width: MAX, height: Math.round(MAX / r) }
    : { width: Math.round(MAX * r), height: MAX };
}

// ── Mock ─────────────────────────────────────────────────────────────────

function buildMockSvg({ slideId, title, prompt }) {
  const shortPrompt = String(prompt || "").replace(/\s+/g, " ").slice(0, 260);
  const label = title || slideId || "Slide image";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#f5f6f7"/>
  <rect x="80" y="80" width="1440" height="740" rx="28" fill="#ffffff" stroke="#d7dfeb" stroke-width="3"/>
  <rect x="80" y="80" width="1440" height="96" rx="28" fill="#004db0"/>
  <text x="120" y="142" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${escapeXml(label)}</text>
  <text x="120" y="260" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#111111">Mock image generation result</text>
  <text x="120" y="320" font-family="Arial, sans-serif" font-size="22" fill="#51647d">Replace server/google-image-api.js with the real Google image API call in Phase 2.</text>
  <foreignObject x="120" y="380" width="1360" height="300">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; font-size: 24px; line-height: 1.45; color: #2c3a4d;">
      ${escapeXml(shortPrompt)}
    </div>
  </foreignObject>
</svg>`;
}

async function writeMockImage({ slideId, title, prompt }) {
  await fs.mkdir(config.outputDir, { recursive: true });
  const safeId = slugify(slideId || title);
  const suffix = crypto.randomUUID().slice(0, 8);
  const filename = `${safeId}-${suffix}.svg`;
  const filePath = path.join(config.outputDir, filename);
  await fs.writeFile(filePath, buildMockSvg({ slideId, title, prompt }), "utf8");
  return {
    filename,
    filePath,
    mimeType: "image/svg+xml",
    model: "mock",
  };
}

// ── Gemini (generateContent) ──────────────────────────────────────────────

function extractGeminiInlineImage(response) {
  const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const inlineData = part.inlineData || part.inline_data;
      if (inlineData?.data) {
        return {
          data: inlineData.data,
          mimeType: inlineData.mimeType || inlineData.mime_type || "image/png",
        };
      }
    }
  }

  const text = candidates
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  throw new Error(text || "Gemini response did not include image data.");
}

async function writeGeminiImage({ slideId, title, prompt, options, apiKey }) {
  assertGeminiConfig(apiKey);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.imageModel)}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        ...(options?.generationConfig || {}),
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Gemini API request failed: ${response.status}`;
    throw new Error(message);
  }

  const image = extractGeminiInlineImage(data);
  const imageBuffer = Buffer.from(image.data, "base64");
  await fs.mkdir(config.outputDir, { recursive: true });

  const safeId = slugify(slideId || title);
  const suffix = crypto.randomUUID().slice(0, 8);
  const ext = getImageExtension(image.mimeType);
  const filename = `${safeId}-${suffix}${ext}`;
  const filePath = path.join(config.outputDir, filename);
  await fs.writeFile(filePath, imageBuffer);

  return {
    filename,
    filePath,
    mimeType: image.mimeType,
    model: config.imageModel,
  };
}

// ── Imagen 3 (/predict 엔드포인트, aspectRatio 지원) ─────────────────────

async function writeImagen3Image({ slideId, title, prompt }, ratio, apiKey) {
  assertGeminiConfig(apiKey);
  const aspectRatio = resolveImagen3Ratio(ratio);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.imageModel)}:predict?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Imagen 3 API request failed: ${response.status}`;
    throw new Error(message);
  }

  const prediction = data?.predictions?.[0];
  const b64 = prediction?.bytesBase64Encoded;
  const mimeType = prediction?.mimeType || "image/png";
  if (!b64) throw new Error("Imagen 3 응답에 이미지 데이터가 없습니다.");

  const imageBuffer = Buffer.from(b64, "base64");
  await fs.mkdir(config.outputDir, { recursive: true });

  const safeId = slugify(slideId || title);
  const suffix = crypto.randomUUID().slice(0, 8);
  const ext = getImageExtension(mimeType);
  const filename = `${safeId}-${suffix}${ext}`;
  const filePath = path.join(config.outputDir, filename);
  await fs.writeFile(filePath, imageBuffer);

  return {
    filename,
    filePath,
    mimeType,
    model: config.imageModel,
    aspectRatio,
  };
}

// ── Pollinations ──────────────────────────────────────────────────────────

async function writePollinationsImage({ slideId, title, prompt }, ratio) {
  const { width, height } = pollinationsDimensions(ratio);
  const encoded = encodeURIComponent(String(prompt).trim().slice(0, 1800));
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`;

  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);
    try {
      response = await fetch(url, { method: "GET", signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (response.status === 429 && attempt < 3) {
      await new Promise((r) => setTimeout(r, 15000 * attempt));
      continue;
    }
    break;
  }
  if (!response.ok) {
    throw new Error(`Pollinations API request failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const ext = getImageExtension(contentType);
  const imageBuffer = Buffer.from(await response.arrayBuffer());

  await fs.mkdir(config.outputDir, { recursive: true });
  const safeId = slugify(slideId || title);
  const suffix = crypto.randomUUID().slice(0, 8);
  const filename = `${safeId}-${suffix}${ext}`;
  const filePath = path.join(config.outputDir, filename);
  await fs.writeFile(filePath, imageBuffer);

  return {
    filename,
    filePath,
    mimeType: contentType,
    model: "pollinations/default",
    size: `${width}x${height}`,
  };
}

// ── OpenAI (gpt-image-1 / gpt-image-2) ────────────────────────────────────

async function writeOpenAIImage({ slideId, title, prompt, apiKey }, ratio) {
  assertOpenAIConfig(apiKey);

  const model = config.openaiImageModel || "gpt-image-1";
  const quality = config.openaiImageQuality || "medium";
  const size = resolveOpenAISize(ratio);

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: String(prompt || "").trim(),
      n: 1,
      size,
      quality,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI API request failed: ${response.status}`;
    throw new Error(message);
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI 응답에 이미지 데이터가 없습니다.");

  const imageBuffer = Buffer.from(b64, "base64");
  await fs.mkdir(config.outputDir, { recursive: true });
  const safeId = slugify(slideId || title);
  const suffix = crypto.randomUUID().slice(0, 8);
  const filename = `${safeId}-${suffix}.png`;
  const filePath = path.join(config.outputDir, filename);
  await fs.writeFile(filePath, imageBuffer);

  return {
    filename,
    filePath,
    mimeType: "image/png",
    model,
    size,
  };
}

// ── 진입점 ───────────────────────────────────────────────────────────────

export async function generateImage({ slideId, title, prompt, ratio: rawRatio, options = {}, runtimeConfig = {} }) {
  if (!prompt || !String(prompt).trim()) {
    throw new Error("Prompt is required.");
  }

  const provider = runtimeConfig.provider || config.imageProvider;
  const ratio = resolveRatio({ ratio: rawRatio, prompt });

  if (provider === "mock") {
    return writeMockImage({ slideId, title, prompt });
  }
  if (provider === "pollinations") {
    return writePollinationsImage({ slideId, title, prompt }, ratio);
  }
  if (provider === "openai") {
    return writeOpenAIImage({ slideId, title, prompt, apiKey: runtimeConfig.openaiApiKey }, ratio);
  }
  // google: Imagen 3 vs Gemini 자동 분기
  if (isImagen3Model(config.imageModel)) {
    return writeImagen3Image({ slideId, title, prompt }, ratio, runtimeConfig.googleApiKey);
  }
  return writeGeminiImage({ slideId, title, prompt, options, apiKey: runtimeConfig.googleApiKey });
}
