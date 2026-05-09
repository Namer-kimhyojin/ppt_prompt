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
    model: config.imageModel,
  };
}

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
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
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

async function writePollinationsImage({ slideId, title, prompt }) {
  const encoded = encodeURIComponent(String(prompt).trim().slice(0, 1800));
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true`;

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
  };
}

async function writeOpenAIImage({ slideId, title, prompt, apiKey }) {
  assertOpenAIConfig(apiKey);

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
    model: "dall-e-3",
  };
}

export async function generateImage({ slideId, title, prompt, options = {}, runtimeConfig = {} }) {
  if (!prompt || !String(prompt).trim()) {
    throw new Error("Prompt is required.");
  }

  const provider = runtimeConfig.provider || config.imageProvider;

  if (provider === "mock") {
    return writeMockImage({ slideId, title, prompt, options });
  }
  if (provider === "pollinations") {
    return writePollinationsImage({ slideId, title, prompt });
  }
  if (provider === "openai") {
    return writeOpenAIImage({ slideId, title, prompt, apiKey: runtimeConfig.openaiApiKey });
  }
  // google (default)
  return writeGeminiImage({ slideId, title, prompt, options, apiKey: runtimeConfig.googleApiKey });
}
