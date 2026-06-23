import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
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

  // 저장 폴더(outputDir)는 repoRoot 밖일 수 있으므로(NAS 볼륨 등)
  // "/outputs/..." 요청은 항상 config.outputDir 기준으로 해석한다.
  if (decoded === "/outputs" || decoded.startsWith("/outputs/")) {
    const rel = decoded.slice("/outputs".length).replace(/^\/+/, "");
    const absolute = path.resolve(config.outputDir, rel);
    if (absolute !== config.outputDir && !absolute.startsWith(config.outputDir + path.sep)) {
      return null;
    }
    return absolute;
  }

  // 서버 코드/설정(예: config.local.js의 API 키)이 정적으로 노출되지 않도록 차단한다.
  // 클라이언트(브라우저)는 server 디렉터리 파일을 요청하지 않는다.
  if (decoded === "/server" || decoded.startsWith("/server/")) {
    return null;
  }

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

// ── mixer manifest helpers ────────────────────────────────────────────────────
async function getMixerManifest() {
  const p = path.join(config.outputDir, "mixer_samples", "manifest.json");
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return {}; }
}
async function saveMixerManifest(manifest) {
  const p = path.join(config.outputDir, "mixer_samples", "manifest.json");
  await fs.writeFile(p, JSON.stringify(manifest, null, 2));
}

async function handleGetMixerImages(res) {
  const manifest = await getMixerManifest();
  sendJson(res, 200, { ok: true, images: manifest });
}

async function handleResetMixerSample(req, res) {
  try {
    const { medId, idx } = await readJsonBody(req);
    if (!medId) return sendJson(res, 400, { ok: false, error: "medId required." });
    const manifest = await getMixerManifest();
    if (manifest[medId]) {
      if (typeof idx === "number") {
        if (!Array.isArray(manifest[medId])) manifest[medId] = [];
        manifest[medId][idx] = null;
        if (manifest[medId].every(v => !v)) delete manifest[medId];
      } else {
        delete manifest[medId];
      }
      await saveMixerManifest(manifest);
    }
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err?.message || "Reset failed." });
  }
}
// ─────────────────────────────────────────────────────────────────────────────

async function handleSaveMixerSample(req, res) {
  try {
    const { medId, idx, image } = await readJsonBody(req);
    if (!medId || typeof idx !== "number" || !image) {
      return sendJson(res, 400, { ok: false, error: "Invalid parameters." });
    }

    const dir = path.join(config.outputDir, "mixer_samples");
    await fs.mkdir(dir, { recursive: true });

    let buffer;
    let ext = "jpg";

    if (image.startsWith("data:")) {
      const match = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!match) {
        return sendJson(res, 400, { ok: false, error: "Invalid data URL format." });
      }
      ext = match[1] === "jpeg" ? "jpg" : match[1];
      buffer = Buffer.from(match[2], "base64");
    } else if (image.startsWith("http://") || image.startsWith("https://")) {
      const response = await fetch(image);
      if (!response.ok) {
        throw new Error(`Failed to fetch external image: ${response.statusText}`);
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.startsWith("image/")) {
        const type = contentType.split("/")[1];
        ext = type === "jpeg" ? "jpg" : type;
      } else {
        const urlMatch = image.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
        if (urlMatch) ext = urlMatch[1];
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      return sendJson(res, 400, { ok: false, error: "Unsupported image source." });
    }

    const filename = `${medId}_${idx}.${ext}`;
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);

    // manifest.json 갱신 — 브라우저/기기에 관계없이 커스텀 이미지 공유
    const serverUrl = `/outputs/mixer_samples/${filename}`;
    const manifest = await getMixerManifest();
    if (!Array.isArray(manifest[medId])) manifest[medId] = [null, null, null];
    while (manifest[medId].length <= idx) manifest[medId].push(null);
    manifest[medId][idx] = serverUrl;
    await saveMixerManifest(manifest);

    sendJson(res, 200, { ok: true, url: serverUrl });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { ok: false, error: error?.message || "Failed to save sample on server." });
  }
}

// ── 서버사이드 사용자 인증 ────────────────────────────────────────────────────
const AUTH_FILE = path.join(config.outputDir, "auth.json");
const SESSION_MS = 24 * 60 * 60 * 1000;

async function loadAuth() {
  try { return JSON.parse(await fs.readFile(AUTH_FILE, "utf8")); }
  catch { return { users: [], sessions: [] }; }
}
async function saveAuth(data) {
  await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true });
  await fs.writeFile(AUTH_FILE, JSON.stringify(data, null, 2));
}
function hashPw(pw) { return createHash("sha256").update(pw).digest("hex"); }
function newToken() { return randomBytes(32).toString("hex"); }
function newId()    { return randomBytes(8).toString("hex"); }

async function resolveSession(req) {
  const token = req.headers["x-session-token"];
  if (!token) return null;
  const auth = await loadAuth();
  const sess = (auth.sessions || []).find(s => s.token === token && s.expiresAt > Date.now());
  if (!sess) return null;
  return (auth.users || []).find(u => u.id === sess.userId) || null;
}

async function handleAuthHasUsers(res) {
  const { users } = await loadAuth();
  sendJson(res, 200, { ok: true, hasUsers: (users || []).length > 0 });
}

async function handleAuthLogin(req, res) {
  const { username, password } = await readJsonBody(req);
  const auth = await loadAuth();
  const user = (auth.users || []).find(u => u.username.toLowerCase() === (username || "").trim().toLowerCase());
  if (!user || user.passwordHash !== hashPw(password || ""))
    return sendJson(res, 401, { ok: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  const token = newToken();
  if (!auth.sessions) auth.sessions = [];
  auth.sessions = auth.sessions.filter(s => s.expiresAt > Date.now()); // 만료 세션 정리
  auth.sessions.push({ token, userId: user.id, expiresAt: Date.now() + SESSION_MS });
  await saveAuth(auth);
  sendJson(res, 200, { ok: true, token, userId: user.id, username: user.username, role: user.role,
    tabPermissions: user.tabPermissions, requestedTabs: user.requestedTabs || [], expiresAt: Date.now() + SESSION_MS });
}

async function handleAuthMe(req, res) {
  const user = await resolveSession(req);
  if (!user) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
  sendJson(res, 200, { ok: true, userId: user.id, username: user.username, role: user.role,
    tabPermissions: user.tabPermissions, requestedTabs: user.requestedTabs || [] });
}

async function handleAuthLogout(req, res) {
  const token = req.headers["x-session-token"];
  if (token) {
    const auth = await loadAuth();
    auth.sessions = (auth.sessions || []).filter(s => s.token !== token);
    await saveAuth(auth);
  }
  sendJson(res, 200, { ok: true });
}

async function handleAuthGetUsers(req, res) {
  const me = await resolveSession(req);
  if (!me || me.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
  const { users } = await loadAuth();
  sendJson(res, 200, { ok: true, users: (users || []).map(({ passwordHash: _, ...u }) => u) });
}

async function handleAuthCreateUser(req, res) {
  const me = await resolveSession(req);
  if (!me || me.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
  const { username, password, role } = await readJsonBody(req);
  if (!username?.trim() || !password || password.length < 4)
    return sendJson(res, 400, { ok: false, error: "아이디와 비밀번호(4자 이상)를 입력하세요." });
  const auth = await loadAuth();
  if ((auth.users || []).find(u => u.username.toLowerCase() === username.trim().toLowerCase()))
    return sendJson(res, 400, { ok: false, error: "이미 사용 중인 아이디입니다." });
  const user = { id: newId(), username: username.trim(), passwordHash: hashPw(password),
    role: role === "admin" ? "admin" : "user", tabPermissions: null, requestedTabs: [], createdAt: Date.now() };
  auth.users.push(user);
  await saveAuth(auth);
  const { passwordHash: _, ...safe } = user;
  sendJson(res, 200, { ok: true, user: safe });
}

async function handleAuthUpdateUser(req, res, userId) {
  const me = await resolveSession(req);
  if (!me || me.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
  const body = await readJsonBody(req);
  const auth = await loadAuth();
  const user = (auth.users || []).find(u => u.id === userId);
  if (!user) return sendJson(res, 404, { ok: false, error: "User not found." });
  if (body.password && body.password.length >= 4) user.passwordHash = hashPw(body.password);
  if (body.tabPermissions !== undefined) user.tabPermissions = body.tabPermissions;
  if (body.requestedTabs !== undefined) user.requestedTabs = body.requestedTabs;
  await saveAuth(auth);
  sendJson(res, 200, { ok: true });
}

async function handleAuthDeleteUser(req, res, userId) {
  const me = await resolveSession(req);
  if (!me || me.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
  const auth = await loadAuth();
  auth.users    = (auth.users    || []).filter(u => u.id !== userId);
  auth.sessions = (auth.sessions || []).filter(s => s.userId !== userId);
  await saveAuth(auth);
  sendJson(res, 200, { ok: true });
}

async function handleAuthRequestAccess(req, res) {
  const me = await resolveSession(req);
  if (!me) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
  const { tabId } = await readJsonBody(req);
  const auth = await loadAuth();
  const user = (auth.users || []).find(u => u.id === me.id);
  if (!user) return sendJson(res, 404, { ok: false, error: "User not found." });
  if (!user.requestedTabs) user.requestedTabs = [];
  if (!user.requestedTabs.includes(tabId)) user.requestedTabs.push(tabId);
  await saveAuth(auth);
  sendJson(res, 200, { ok: true });
}
// ─────────────────────────────────────────────────────────────────────────────

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

  if (req.method === "POST" && url.pathname === "/api/save-mixer-sample") {
    return handleSaveMixerSample(req, res);
  }

  if (req.method === "GET" && url.pathname === "/api/mixer-images") {
    return handleGetMixerImages(res);
  }

  if (req.method === "POST" && url.pathname === "/api/reset-mixer-sample") {
    return handleResetMixerSample(req, res);
  }

  // ── 인증 API ───────────────────────────────────────────────────────────────
  if (req.method === "GET"  && url.pathname === "/api/auth/has-users") return handleAuthHasUsers(res);
  if (req.method === "POST" && url.pathname === "/api/auth/login")     return handleAuthLogin(req, res);
  if (req.method === "GET"  && url.pathname === "/api/auth/me")        return handleAuthMe(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/logout")    return handleAuthLogout(req, res);
  if (req.method === "GET"  && url.pathname === "/api/auth/users")     return handleAuthGetUsers(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/users")     return handleAuthCreateUser(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/request-access") return handleAuthRequestAccess(req, res);
  const updateMatch = url.pathname.match(/^\/api\/auth\/users\/([^/]+)\/update$/);
  if (req.method === "POST" && updateMatch)  return handleAuthUpdateUser(req, res, updateMatch[1]);
  const deleteMatch = url.pathname.match(/^\/api\/auth\/users\/([^/]+)\/delete$/);
  if (req.method === "POST" && deleteMatch)  return handleAuthDeleteUser(req, res, deleteMatch[1]);
  // ───────────────────────────────────────────────────────────────────────────

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

// 최초 실행 시 기본 admin 계정 생성
(async () => {
  const auth = await loadAuth();
  if (!auth.users || auth.users.length === 0) {
    auth.users = [{
      id: newId(),
      username: "admin",
      passwordHash: hashPw("promptdeck1234"),
      role: "admin",
      tabPermissions: null,
      requestedTabs: [],
      createdAt: Date.now()
    }];
    auth.sessions = [];
    await saveAuth(auth);
    console.log("[auth] 기본 admin 계정 생성: admin / promptdeck1234");
  }
})();

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error(error);
    sendJson(res, 500, { ok: false, error: "Internal server error." });
  });
});

server.listen(config.port, config.host, () => {
  console.log(`PromptDeck local server: http://${config.host}:${config.port}`);
});
