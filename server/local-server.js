import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { config } from "./config.js";
import { generateImage } from "./google-image-api.js";

// 런타임 설정 (브라우저에서 변경 가능, 서버 재시작 전까지 유지)
const runtimeConfig = {
  provider: config.imageProvider,
  googleApiKey: config.googleApiKey,
  openaiApiKey: "",
};

const PROVIDERS = {
  mock:         { label: "목업 (테스트용)",         needsKey: false },
  pollinations: { label: "Pollinations (무료)",      needsKey: false },
  google:       { label: "Google Gemini",            needsKey: true  },
  openai:       { label: "OpenAI GPT Image",         needsKey: true  },
};

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
]);

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

function resolveStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const absolute = path.resolve(config.repoRoot, relative);
  if (!absolute.startsWith(config.repoRoot)) return null;
  return absolute;
}

async function serveStatic(req, res, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) return sendText(res, 403, "Forbidden");

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) return sendText(res, 403, "Forbidden");
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES.get(ext) || "application/octet-stream";
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      "content-type": contentType,
      "content-length": data.length,
      "cache-control": "no-store",
    });
    res.end(data);
  } catch (error) {
    if (error?.code === "ENOENT") return sendText(res, 404, "Not found");
    console.error(error);
    sendText(res, 500, "Internal server error");
  }
}

async function handleGenerateImage(req, res) {
  try {
    const body = await readJsonBody(req);
    const result = await generateImage({ ...body, runtimeConfig });
    sendJson(res, 200, {
      ok: true,
      slideId: body.slideId || null,
      filename: result.filename,
      url: `/outputs/${result.filename}`,
      mimeType: result.mimeType,
      model: result.model,
    });
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      error: error?.message || "Image generation failed.",
    });
  }
}

function handleGetConfig(res) {
  sendJson(res, 200, {
    ok: true,
    provider: runtimeConfig.provider,
    googleApiKey: runtimeConfig.googleApiKey ? "••••" + runtimeConfig.googleApiKey.slice(-4) : "",
    openaiApiKey: runtimeConfig.openaiApiKey ? "••••" + runtimeConfig.openaiApiKey.slice(-4) : "",
    providers: PROVIDERS,
  });
}

async function handleSetConfig(req, res) {
  try {
    const body = await readJsonBody(req);
    if (body.provider && PROVIDERS[body.provider]) runtimeConfig.provider = body.provider;
    if (typeof body.googleApiKey === "string" && body.googleApiKey.trim()) {
      runtimeConfig.googleApiKey = body.googleApiKey.trim();
    }
    if (typeof body.openaiApiKey === "string" && body.openaiApiKey.trim()) {
      runtimeConfig.openaiApiKey = body.openaiApiKey.trim();
    }

    const needsKey = PROVIDERS[runtimeConfig.provider]?.needsKey;
    const hasKey = runtimeConfig.provider === "google"
      ? !!runtimeConfig.googleApiKey
      : runtimeConfig.provider === "openai"
      ? !!runtimeConfig.openaiApiKey
      : true;

    if (needsKey && !hasKey) {
      return sendJson(res, 400, { ok: false, error: "선택한 서비스에 API 키가 필요합니다." });
    }

    sendJson(res, 200, { ok: true, provider: runtimeConfig.provider });
  } catch {
    sendJson(res, 400, { ok: false, error: "설정 저장 실패." });
  }
}

async function handleRequest(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      provider: runtimeConfig.provider,
      providers: PROVIDERS,
    });
  }

  if (req.method === "GET" && url.pathname === "/api/config") {
    return handleGetConfig(res);
  }

  if (req.method === "POST" && url.pathname === "/api/config") {
    return handleSetConfig(req, res);
  }

  if (req.method === "POST" && url.pathname === "/api/generate-image") {
    return handleGenerateImage(req, res);
  }

  if (req.method === "POST" && url.pathname === "/api/open-folder") {
    const folderPath = config.outputDir.replace(/\//g, "\\");
    exec(`explorer "${folderPath}"`);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET") {
    return serveStatic(req, res, url.pathname);
  }

  sendText(res, 405, "Method not allowed");
}

await fs.mkdir(config.outputDir, { recursive: true });

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error(error);
    sendJson(res, 500, { ok: false, error: "Internal server error." });
  });
});

server.listen(config.port, config.host, () => {
  console.log(`PromptDeck local server: http://${config.host}:${config.port}`);
});
