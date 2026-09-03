import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { config } from "./config.js";
import { generateImage } from "./google-image-api.js";
import { sendVerificationEmail, sendEmailChangeConfirmation } from "./mailer.js";
import {
  PASSWORD_MIN_LENGTH,
  adminSessionCookie,
  applySecurityHeaders,
  clearAdminSessionCookie,
  clearSessionCookie,
  createRateLimiter,
  detectSensitivePrompt,
  getAdminSessionToken,
  getClientIp,
  getSessionToken,
  hashPassword,
  hashSessionToken,
  sameOriginRequest,
  sessionCookie,
  sniffSupportedImage,
  validatePassword,
  verifyPassword,
} from "./security.js";
import {
  cleanupExpiredUserOutputs,
  createAuditLogger,
  removeUserOutputs,
} from "./data-governance.js";

// 런타임 설정 (브라우저에서 변경 가능, 서버 재시작 전까지 유지)
const runtimeConfig = {
  provider: config.imageProvider,
  googleApiKey: config.googleApiKey,
  openaiApiKey: config.openaiApiKey,
};

const PROVIDERS = {
  mock:         { label: "목업 (테스트용)",         needsKey: false },
  pollinations: { label: "Pollinations (무료)",      needsKey: false },
  google:       { label: "Google Gemini",            needsKey: true  },
  openai:       { label: "OpenAI GPT Image",         needsKey: true  },
};

const TERMS_VERSION = "2026-07-17";
const PRIVACY_VERSION = "2026-07-17";
const consumeRateLimit = createRateLimiter();
const audit = createAuditLogger(config.outputDir, config.auditRetentionDays);
const TAB_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const DUMMY_PASSWORD_HASH = hashPassword(randomBytes(32).toString("hex"));
const PUBLIC_USER = Object.freeze({ id: "0000000000000000", username: "public", role: "public" });
const ADMIN_MODE_USER = Object.freeze({ id: "admin-mode", username: "admin-mode", role: "admin" });
const ADMIN_MODE_SESSION_MS = 4 * 60 * 60 * 1000;
let ADMIN_ACCESS_HASH = config.adminModeEnabled ? hashPassword(config.adminAccessKey) : DUMMY_PASSWORD_HASH;
const ADMIN_ACCESS_STATE = {
  enabled: config.adminModeEnabled,
  initialized: false,
  loadingPromise: null,
};
const adminModeSessions = new Map();
config.adminAccessKey = "";

class RequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

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
  [".zip", "application/zip"],
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

async function readJsonBody(req, maxBytes = config.maxJsonBodyBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new RequestError(413, "요청 데이터가 허용 크기를 초과했습니다.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(raw); }
  catch { throw new RequestError(400, "잘못된 JSON 요청입니다."); }
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

  const segments = decoded.split("/").filter(Boolean);
  const blockedSegments = new Set([
    "server", "scripts", "docs", "node_modules", "backup", "backups",
    "tmp", "scratch", "partials", "비주얼 믹스 가이드",
  ]);
  const basename = segments.at(-1)?.toLowerCase() || "";
  const publicGuideDownloads = new Set([
    "ppt-slide-planner-codex-20260903.zip",
    "ppt-slide-planner-claude-20260903.zip",
  ]);
  const isPublicGuideDownload =
    segments.length === 4 &&
    segments[0]?.toLowerCase() === "static-pages" &&
    segments[1]?.toLowerCase() === "guides" &&
    segments[2]?.toLowerCase() === "downloads" &&
    publicGuideDownloads.has(basename);
  if (
    segments.some((segment) => segment.startsWith(".")) ||
    segments.some((segment) => blockedSegments.has(segment.toLowerCase())) ||
    /^(package(?:-lock)?\.json|dockerfile|docker-compose\.ya?ml|agents\.md|readme(?:\..*)?|index\.template\.html)$/i.test(basename) ||
    (/\.(?:md|log|env|ya?ml|bak|zip|map|mjs|cjs|ts|ps1)$/i.test(basename) && !isPublicGuideDownload)
  ) {
    return null;
  }

  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const absolute = path.resolve(config.repoRoot, relative);
  const repoRelative = path.relative(config.repoRoot, absolute);
  if (repoRelative.startsWith("..") || path.isAbsolute(repoRelative)) return null;
  return absolute;
}

function isOutputPath(pathname) {
  return pathname === "/outputs" || pathname.startsWith("/outputs/");
}

async function canReadOutput(req, pathname) {
  const user = config.authEnabled ? await resolveSession(req) : PUBLIC_USER;
  if (!user) return false;

  const rel = pathname.slice("/outputs/".length).replace(/\\/g, "/");
  if (!rel || rel.endsWith(".json") || rel.includes("/_private/") || rel.startsWith("_private/")) return false;
  if (rel === "auth.json" || rel === "admin-settings.json") return false;

  const userMatch = rel.match(/^users\/([a-f0-9]{16})\//i);
  if (!config.authEnabled) {
    if (rel.startsWith("mixer_samples/")) return true;
    return !!userMatch && userMatch[1] === PUBLIC_USER.id;
  }
  if (userMatch) return user.role === "admin" || userMatch[1] === user.id;
  if (rel.startsWith("mixer_samples/")) return true;

  // 이전 버전에서 루트에 생성된 파일은 관리자만 확인할 수 있다.
  return user.role === "admin";
}

async function serveStatic(req, res, pathname) {
  if (isOutputPath(pathname) && !(await canReadOutput(req, pathname))) {
    return sendText(res, 403, "Forbidden");
  }
  const filePath = resolveStaticPath(pathname);
  if (!filePath) return sendText(res, 403, "Forbidden");

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) return sendText(res, 403, "Forbidden");
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES.get(ext) || "application/octet-stream";
    const data = await fs.readFile(filePath);
    const headers = {
      "content-type": contentType,
      "content-length": data.length,
      "cache-control": "no-store",
    };
    if (ext === ".zip") headers["content-disposition"] = `attachment; filename="${path.basename(filePath)}"`;
    res.writeHead(200, headers);
    res.end(data);
  } catch (error) {
    if (error?.code === "ENOENT") return sendText(res, 404, "Not found");
    console.error(error);
    sendText(res, 500, "Internal server error");
  }
}

async function moveGeneratedFileToUser(result, userId) {
  const userDir = path.join(config.outputDir, "users", userId);
  await fs.mkdir(userDir, { recursive: true, mode: 0o700 });
  const filename = path.basename(result.filename);
  const destination = path.join(userDir, filename);
  await fs.rename(result.filePath, destination);
  return { ...result, filePath: destination, url: `/outputs/users/${userId}/${filename}` };
}

async function handleGenerateImage(req, res, user) {
  try {
    const body = await readJsonBody(req);
    if (typeof body.prompt !== "string" || !body.prompt.trim() || body.prompt.length > 20_000 || String(body.title || "").length > 500) {
      return sendJson(res, 400, { ok: false, error: "프롬프트는 1~20,000자, 제목은 500자 이하여야 합니다." });
    }
    if (body.privacyConfirmed !== true) {
      return sendJson(res, 400, { ok: false, error: "외부 AI 전송 안내를 확인한 뒤 다시 시도하세요." });
    }
    if (runtimeConfig.provider === "google" && body.adultProfessionalUseConfirmed !== true) {
      return sendJson(res, 400, { ok: false, error: "Google Gemini API의 연령·업무용 이용 조건 확인이 필요합니다." });
    }
    const sensitiveType = detectSensitivePrompt(`${body.title || ""}\n${body.prompt || ""}`);
    if (sensitiveType) {
      return sendJson(res, 400, {
        ok: false,
        error: `${sensitiveType}로 보이는 정보가 포함되어 외부 AI 전송을 중단했습니다. 개인정보를 제거한 뒤 다시 시도하세요.`,
      });
    }
    const generated = await generateImage({ ...body, runtimeConfig });
    const result = await moveGeneratedFileToUser(generated, user.id);
    await audit.log("image.generate", { userId: user.id, ip: getClientIp(req, config.trustProxy) });
    sendJson(res, 200, {
      ok: true,
      slideId: body.slideId || null,
      filename: result.filename,
      url: result.url,
      mimeType: result.mimeType,
      model: result.model,
    });
  } catch (error) {
    await audit.log("image.generate", { userId: user?.id, ip: getClientIp(req, config.trustProxy), ok: false });
    sendJson(res, error?.statusCode || 400, {
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

let mixerManifestMutationQueue = Promise.resolve();
function mutateMixerManifest(mutator) {
  const mutation = mixerManifestMutationQueue.then(async () => {
    const manifest = await getMixerManifest();
    const result = await mutator(manifest);
    await saveMixerManifest(manifest);
    return result;
  });
  mixerManifestMutationQueue = mutation.catch(() => {});
  return mutation;
}

async function removeMixerSampleVariants(directory, medId, idx, keepFilename = "") {
  for (const extension of ["jpg", "jpeg", "png", "webp"]) {
    const filename = `${medId}_${idx}.${extension}`;
    if (filename === keepFilename) continue;
    await fs.unlink(path.join(directory, filename)).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
}

async function removeMixerSampleUrls(urls) {
  const directory = path.resolve(config.outputDir, "mixer_samples");
  for (const value of urls) {
    if (typeof value !== "string") continue;
    const pathname = new URL(value, "http://localhost").pathname;
    if (!pathname.startsWith("/outputs/mixer_samples/")) continue;
    const filename = path.basename(pathname);
    const filePath = path.resolve(directory, filename);
    if (!filePath.startsWith(directory + path.sep)) continue;
    await fs.unlink(filePath).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
}

async function handleGetMixerImages(res) {
  const manifest = await getMixerManifest();
  sendJson(res, 200, { ok: true, images: manifest });
}

// ── 관리자 설정 저장/로드 ─────────────────────────────────────────────────────
const PRIVATE_DIR = path.join(config.outputDir, "_private");
const ADMIN_SETTINGS_FILE = path.join(PRIVATE_DIR, "admin-settings.json");
const LEGACY_ADMIN_SETTINGS_FILE = path.join(config.outputDir, "admin-settings.json");
const SHORT_LINKS_FILE = path.join(PRIVATE_DIR, "short-links.json");

async function writeJsonAtomic(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(data, null, 2), { mode: 0o600 });
  await fs.rename(temporary, filePath);
}

async function loadAdminSettings() {
  try { return JSON.parse(await fs.readFile(ADMIN_SETTINGS_FILE, "utf8")); }
  catch (error) {
    if (error?.code !== "ENOENT") return {};
    try {
      const legacy = JSON.parse(await fs.readFile(LEGACY_ADMIN_SETTINGS_FILE, "utf8"));
      await writeJsonAtomic(ADMIN_SETTINGS_FILE, legacy);
      await fs.rename(LEGACY_ADMIN_SETTINGS_FILE, path.join(PRIVATE_DIR, "admin-settings.legacy.json")).catch(() => {});
      return legacy;
    } catch { return {}; }
  }
}
async function saveAdminSettingsFile(data) {
  await writeJsonAtomic(ADMIN_SETTINGS_FILE, data);
}

function validateAdminAccessKey(rawKey) {
  const accessKey = normalizeAdminAccessInput(rawKey);
  if (accessKey.length < PASSWORD_MIN_LENGTH) return `관리자 모드 비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  if (accessKey.length > 128) return "관리자 모드 비밀번호는 128자 이하여야 합니다.";
  return "";
}


function normalizeAdminAccessInput(rawKey) {
  return String(rawKey || "")
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function getStoredAdminAccessHash(settings = {}) {
  const candidate = String(settings.adminAccessHash || "").trim();
  return candidate.startsWith("scrypt$") ? candidate : "";
}

async function initializeAdminAccessState() {
  if (ADMIN_ACCESS_STATE.initialized) return;
  if (ADMIN_ACCESS_STATE.loadingPromise) return ADMIN_ACCESS_STATE.loadingPromise;
  ADMIN_ACCESS_STATE.loadingPromise = (async () => {
    try {
      const settings = await loadAdminSettings();
      const savedHash = getStoredAdminAccessHash(settings);
      if (savedHash) {
        ADMIN_ACCESS_HASH = savedHash;
        ADMIN_ACCESS_STATE.enabled = true;
        config.adminModeEnabled = true;
      }
    } finally {
      ADMIN_ACCESS_STATE.initialized = true;
      ADMIN_ACCESS_STATE.loadingPromise = null;
    }
  })();
  return ADMIN_ACCESS_STATE.loadingPromise;
}

async function saveAdminAccessStateHash(newHash) {
  const current = await loadAdminSettings();
  ADMIN_ACCESS_HASH = newHash;
  ADMIN_ACCESS_STATE.enabled = true;
  config.adminModeEnabled = true;
  await saveAdminSettingsFile({
    ...current,
    adminAccessHash: newHash,
    adminModeEnabled: true,
  });
}

async function loadShortLinks() {
  try { return JSON.parse(await fs.readFile(SHORT_LINKS_FILE, "utf8")); }
  catch { return { links: [] }; }
}

let shortLinkMutationQueue = Promise.resolve();
function mutateShortLinks(mutator) {
  const mutation = shortLinkMutationQueue.then(async () => {
    const data = await loadShortLinks();
    data.links = Array.isArray(data.links) ? data.links.filter((link) => link.expiresAt > Date.now()) : [];
    const result = await mutator(data.links);
    await writeJsonAtomic(SHORT_LINKS_FILE, data);
    return result;
  });
  shortLinkMutationQueue = mutation.catch(() => {});
  return mutation;
}

async function handleCreateShortLink(req, res, user) {
  const { url: rawUrl } = await readJsonBody(req);
  if (typeof rawUrl !== "string" || rawUrl.length > 2_048) return sendJson(res, 400, { ok: false, error: "URL은 2,048자 이하여야 합니다." });
  let target;
  try { target = new URL(rawUrl); }
  catch { return sendJson(res, 400, { ok: false, error: "올바른 URL이 아닙니다." }); }
  if (!["http:", "https:"].includes(target.protocol) || target.username || target.password) {
    return sendJson(res, 400, { ok: false, error: "인증정보가 없는 HTTP(S) URL만 단축할 수 있습니다." });
  }
  const host = target.hostname.toLowerCase();
  const privateHost = host === "localhost" || host.endsWith(".local") || host === "::1" || host === "[::1]" ||
    /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (privateHost) return sendJson(res, 400, { ok: false, error: "내부망·로컬 주소는 단축할 수 없습니다." });
  const sensitiveNames = /^(token|access_token|api_?key|key|signature|sig|auth|password|passwd|secret|code)$/i;
  const sensitiveKey = [...target.searchParams.keys()].find((key) => sensitiveNames.test(key));
  if (sensitiveKey) return sendJson(res, 400, { ok: false, error: `보안정보로 보이는 쿼리 항목(${sensitiveKey})이 있어 단축을 중단했습니다.` });
  const code = randomBytes(9).toString("base64url");
  const expiresAt = Date.now() + config.outputRetentionDays * 24 * 60 * 60 * 1000;
  await mutateShortLinks((links) => links.push({ code, target: target.href, userId: user.id, createdAt: Date.now(), expiresAt }));
  await audit.log("shortlink.create", { userId: user.id, targetId: code, ip: getClientIp(req, config.trustProxy) });
  sendJson(res, 200, { ok: true, shortUrl: `${publicBaseUrl(req)}/s/${code}`, expiresAt });
}

async function handleOpenShortLink(res, code) {
  const data = await loadShortLinks();
  const link = (data.links || []).find((item) => item.code === code && item.expiresAt > Date.now());
  if (!link) return sendText(res, 404, "만료되었거나 존재하지 않는 단축주소입니다.");
  res.writeHead(302, { Location: link.target, "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" });
  res.end();
}

async function removeUserShortLinks(userId) {
  await mutateShortLinks((links) => {
    for (let index = links.length - 1; index >= 0; index -= 1) {
      if (links[index].userId === userId) links.splice(index, 1);
    }
  });
}

const ADMIN_SETTING_KEYS = new Set([
  "programName", "programSubtitle", "tabOrder", "tabLabels", "tabGroups", "tabs", "defaultTab",
  "unsplashKey", "adsEnabled", "adClient", "adSlotTop", "adSlotBottom",
]);

async function handleGetAdminSettings(req, res) {
  const me = config.authEnabled ? await resolveSession(req) : PUBLIC_USER;
  if (config.authEnabled && !me) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
  const data = await loadAdminSettings();
  const safe = { ...data };
  delete safe.unsplashKey;
  delete safe.adminAccessHash;
  delete safe.adminModeEnabled;
  sendJson(res, 200, { ok: true, ...safe, hasUnsplashKey: !!data.unsplashKey });
}

async function handleSaveAdminSettings(req, res) {
  const me = await resolveAdminActor(req);
  if (!me) return sendJson(res, 403, { ok: false, error: "Admin only." });
  const body = await readJsonBody(req);
  const current = await loadAdminSettings();
  const sanitized = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (ADMIN_SETTING_KEYS.has(key)) sanitized[key] = value;
  }
  if (typeof sanitized.unsplashKey === "string") {
    sanitized.unsplashKey = sanitized.unsplashKey.trim().slice(0, 200);
    if (!sanitized.unsplashKey) delete sanitized.unsplashKey;
    else if (config.deploymentMode && !config.unsplashDataTransferConfirmed) {
      return sendJson(res, 400, { ok: false, error: "Unsplash의 국외 전송·API 조건을 확인하고 PROMPTDECK_UNSPLASH_DATA_TRANSFER_CONFIRMED=true를 설정해야 합니다." });
    }
  }
  if (sanitized.adsEnabled !== undefined) sanitized.adsEnabled = sanitized.adsEnabled === true;
  if (sanitized.adClient !== undefined && !/^ca-pub-\d{6,32}$/.test(String(sanitized.adClient))) delete sanitized.adClient;
  for (const slotKey of ["adSlotTop", "adSlotBottom"]) {
    if (sanitized[slotKey] !== undefined && !/^\d{4,32}$/.test(String(sanitized[slotKey]))) delete sanitized[slotKey];
  }
  for (const textKey of ["programName", "programSubtitle", "defaultTab"]) {
    if (sanitized[textKey] !== undefined) sanitized[textKey] = String(sanitized[textKey]).trim().slice(0, textKey === "programSubtitle" ? 160 : 80);
  }
  await saveAdminSettingsFile({ ...current, ...sanitized });
  await audit.log("admin.settings.update", { userId: me.id, ip: getClientIp(req, config.trustProxy) });
  sendJson(res, 200, { ok: true });
}

async function handleUnsplashSearch(req, res, url, user) {
  const settings = await loadAdminSettings();
  const accessKey = String(settings.unsplashKey || "").trim();
  if (!accessKey) return sendJson(res, 503, { ok: false, error: "Unsplash 연동이 설정되지 않았습니다." });
  const query = String(url.searchParams.get("query") || "").trim().slice(0, 120);
  if (!query) return sendJson(res, 400, { ok: false, error: "검색어가 필요합니다." });
  const medId = String(url.searchParams.get("medId") || "").trim();
  const idx = Number(url.searchParams.get("idx") || 0);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/.test(medId) || !Number.isInteger(idx) || idx < 0 || idx > 9) {
    return sendJson(res, 400, { ok: false, error: "저장할 미리보기 ID가 올바르지 않습니다." });
  }
  const page = Math.floor(Math.random() * 5) + 1;
  const endpoint = new URL("https://api.unsplash.com/search/photos");
  endpoint.searchParams.set("query", query);
  endpoint.searchParams.set("per_page", "10");
  endpoint.searchParams.set("page", String(page));
  endpoint.searchParams.set("orientation", "landscape");
  endpoint.searchParams.set("content_filter", "high");
  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
  });
  if (!response.ok) return sendJson(res, 502, { ok: false, error: `Unsplash 검색 실패 (${response.status})` });
  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];
  if (!results.length) return sendJson(res, 404, { ok: false, error: "검색 결과가 없습니다." });
  const photo = results[Math.floor(Math.random() * Math.min(results.length, 10))];
  if (photo.links?.download_location) {
    fetch(photo.links.download_location, {
      signal: AbortSignal.timeout(5_000),
      headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
    }).catch(() => {});
  }

  const remoteImageUrl = photo.urls?.small || "";
  if (!remoteImageUrl) return sendJson(res, 502, { ok: false, error: "Unsplash 이미지 주소가 없습니다." });
  const buffer = await fetchAllowedExternalImage(remoteImageUrl, UNSPLASH_IMAGE_HOSTS);
  const detected = sniffSupportedImage(buffer);
  if (!detected) throw new RequestError(400, "Unsplash 이미지의 실제 형식을 확인할 수 없습니다.");

  const directory = path.join(config.outputDir, "mixer_samples");
  await fs.mkdir(directory, { recursive: true });
  const filename = `${medId}_${idx}.${detected.ext}`;
  await fs.writeFile(path.join(directory, filename), buffer);
  await removeMixerSampleVariants(directory, medId, idx, filename);

  const serverUrl = `/outputs/mixer_samples/${filename}`;
  await mutateMixerManifest((manifest) => {
    if (!Array.isArray(manifest[medId])) manifest[medId] = [null, null, null];
    while (manifest[medId].length <= idx) manifest[medId].push(null);
    manifest[medId][idx] = serverUrl;
  });
  await audit.log("mixer.sample.unsplash-import", {
    userId: user.id,
    targetId: `${medId}:${idx}`,
    ip: getClientIp(req, config.trustProxy),
  });

  sendJson(res, 200, {
    ok: true,
    url: serverUrl,
    storage: "local",
    photographer: photo.user?.name || "Unsplash contributor",
    photographerUrl: `${photo.user?.links?.html || "https://unsplash.com"}?utm_source=promptdeck&utm_medium=referral`,
    unsplashUrl: `${photo.links?.html || "https://unsplash.com"}?utm_source=promptdeck&utm_medium=referral`,
  });
}
// ─────────────────────────────────────────────────────────────────────────────

async function handleResetMixerSample(req, res, user) {
  try {
    const { medId, idx } = await readJsonBody(req);
    if (!medId) return sendJson(res, 400, { ok: false, error: "medId required." });
    const removedUrls = await mutateMixerManifest((manifest) => {
      if (!manifest[medId]) return [];
      const current = Array.isArray(manifest[medId]) ? manifest[medId] : [];
      const urls = typeof idx === "number" ? [current[idx]].filter(Boolean) : current.filter(Boolean);
      if (typeof idx === "number") {
        if (!Array.isArray(manifest[medId])) manifest[medId] = [];
        manifest[medId][idx] = null;
        if (manifest[medId].every(v => !v)) delete manifest[medId];
      } else {
        delete manifest[medId];
      }
      return urls;
    });
    await removeMixerSampleUrls(removedUrls);
    await audit.log("mixer.sample.reset", { userId: user.id, targetId: medId, ip: getClientIp(req, config.trustProxy) });
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err?.message || "Reset failed." });
  }
}
// ─────────────────────────────────────────────────────────────────────────────

async function handlePhotoPreviewStatus(res) {
  try {
    const manifest = await getMixerManifest();
    const directory = path.join(config.outputDir, "mixer_samples");
    const entries = [];
    for (const [medId, urls] of Object.entries(manifest)) {
      if (!medId.startsWith("photo-transform-")) continue;
      const url = Array.isArray(urls) ? urls.find(Boolean) : null;
      let bytes = 0;
      if (url) {
        const filename = path.basename(new URL(url, "http://localhost").pathname);
        try { bytes = (await fs.stat(path.join(directory, filename))).size; } catch { bytes = 0; }
      }
      entries.push({ medId, url, bytes });
    }
    sendJson(res, 200, { ok: true, entries, count: entries.length, totalBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0) });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error?.message || "Preview status failed." });
  }
}

async function handleDeletePhotoPreview(req, res, user) {
  try {
    const body = await readJsonBody(req);
    const medId = typeof body?.medId === "string" ? body.medId : "";
    if (!medId.startsWith("photo-transform-")) return sendJson(res, 400, { ok: false, error: "Invalid preview id." });
    const manifest = await getMixerManifest();
    const urls = manifest[medId];
    const directory = path.resolve(config.outputDir, "mixer_samples");
    for (const url of Array.isArray(urls) ? urls.filter(Boolean) : []) {
      const filename = path.basename(new URL(url, "http://localhost").pathname);
      const filePath = path.resolve(directory, filename);
      if (filePath.startsWith(directory + path.sep)) await fs.unlink(filePath).catch((error) => { if (error?.code !== "ENOENT") throw error; });
    }
    delete manifest[medId];
    await saveMixerManifest(manifest);
    await audit.log("photo.preview.delete", { userId: user.id, targetId: medId, ip: getClientIp(req, config.trustProxy) });
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error?.message || "Preview deletion failed." });
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const EXTERNAL_IMAGE_HOSTS = new Set();
const UNSPLASH_IMAGE_HOSTS = new Set(["images.unsplash.com", "plus.unsplash.com"]);

async function fetchAllowedExternalImage(imageUrl, allowedHosts = EXTERNAL_IMAGE_HOSTS) {
  let current = new URL(imageUrl);
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (current.protocol !== "https:" || !allowedHosts.has(current.hostname.toLowerCase())) {
      throw new RequestError(400, "허용되지 않은 외부 이미지 주소입니다.");
    }
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
      headers: { "user-agent": "PromptDeck/1.0 image-import" },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new RequestError(400, "외부 이미지 리디렉션이 올바르지 않습니다.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new RequestError(400, `외부 이미지를 가져오지 못했습니다 (${response.status}).`);
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > config.maxImageBytes) throw new RequestError(413, "이미지 파일이 허용 크기를 초과했습니다.");

    const chunks = [];
    let total = 0;
    for await (const chunk of response.body) {
      total += chunk.length;
      if (total > config.maxImageBytes) throw new RequestError(413, "이미지 파일이 허용 크기를 초과했습니다.");
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  throw new RequestError(400, "외부 이미지 리디렉션 횟수를 초과했습니다.");
}

async function handleSaveMixerSample(req, res, user) {
  try {
    const bodyLimit = Math.ceil(config.maxImageBytes * 1.5) + 1024 * 1024;
    const { medId, idx, image } = await readJsonBody(req, bodyLimit);
    if (!medId || !Number.isInteger(idx) || idx < 0 || idx > 9 || typeof image !== "string" || !image) {
      return sendJson(res, 400, { ok: false, error: "Invalid parameters." });
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/.test(medId)) {
      return sendJson(res, 400, { ok: false, error: "Invalid preview id." });
    }

    const dir = path.join(config.outputDir, "mixer_samples");
    await fs.mkdir(dir, { recursive: true });

    let buffer;
    let sourceType = "upload";

    if (image.startsWith("data:")) {
      const match = image.match(/^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$/);
      if (!match) {
        return sendJson(res, 400, { ok: false, error: "PNG, JPEG, WebP 이미지만 업로드할 수 있습니다." });
      }
      buffer = Buffer.from(match[2], "base64");
      if (buffer.length > config.maxImageBytes) throw new RequestError(413, "이미지 파일이 허용 크기를 초과했습니다.");
    } else if (image.startsWith("http://") || image.startsWith("https://")) {
      sourceType = "external";
      buffer = await fetchAllowedExternalImage(image);
    } else if (image.startsWith("/outputs/mixer_samples/")) {
      const existingName = path.basename(new URL(image, "http://localhost").pathname);
      const existingPath = path.join(dir, existingName);
      const stat = await fs.stat(existingPath).catch(() => null);
      if (!stat?.isFile()) throw new RequestError(404, "기존 샘플 이미지를 찾을 수 없습니다.");
      const serverUrl = `/outputs/mixer_samples/${existingName}`;
      await mutateMixerManifest((manifest) => {
        if (!Array.isArray(manifest[medId])) manifest[medId] = [null, null, null];
        while (manifest[medId].length <= idx) manifest[medId].push(null);
        manifest[medId][idx] = serverUrl;
      });
      return sendJson(res, 200, { ok: true, url: serverUrl });
    } else {
      return sendJson(res, 400, { ok: false, error: "지원하지 않는 이미지 원본입니다." });
    }

    const detected = sniffSupportedImage(buffer);
    if (!detected) throw new RequestError(400, "이미지 파일의 실제 형식을 확인할 수 없습니다.");

    const filename = `${medId}_${idx}.${detected.ext}`;
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);
    await removeMixerSampleVariants(dir, medId, idx, filename);

    // manifest.json 갱신 — 브라우저/기기에 관계없이 커스텀 이미지 공유
    const serverUrl = `/outputs/mixer_samples/${filename}`;
    await mutateMixerManifest((manifest) => {
      if (!Array.isArray(manifest[medId])) manifest[medId] = [null, null, null];
      while (manifest[medId].length <= idx) manifest[medId].push(null);
      manifest[medId][idx] = serverUrl;
    });

    await audit.log("mixer.sample.save", { userId: user.id, targetId: `${medId}:${idx}:${sourceType}`, ip: getClientIp(req, config.trustProxy) });
    sendJson(res, 200, { ok: true, url: serverUrl });
  } catch (error) {
    console.error(error);
    sendJson(res, error?.statusCode || 500, { ok: false, error: error?.message || "Failed to save sample on server." });
  }
}

// ── 서버사이드 사용자 인증 ────────────────────────────────────────────────────
const AUTH_FILE = path.join(PRIVATE_DIR, "auth.json");
const LEGACY_AUTH_FILE = path.join(config.outputDir, "auth.json");
const SESSION_MS = 24 * 60 * 60 * 1000;

async function loadAuth() {
  try { return JSON.parse(await fs.readFile(AUTH_FILE, "utf8")); }
  catch (error) {
    if (error?.code !== "ENOENT") return { users: [], sessions: [] };
    try {
      const legacy = JSON.parse(await fs.readFile(LEGACY_AUTH_FILE, "utf8"));
      await writeJsonAtomic(AUTH_FILE, legacy);
      await fs.rename(LEGACY_AUTH_FILE, path.join(PRIVATE_DIR, "auth.legacy.json")).catch(() => {});
      return legacy;
    } catch { return { users: [], sessions: [] }; }
  }
}
async function saveAuth(data) {
  await writeJsonAtomic(AUTH_FILE, data);
}
function newToken() { return randomBytes(32).toString("hex"); }
function newId()    { return randomBytes(8).toString("hex"); }

function publicBaseUrl(req) {
  if (config.publicBaseUrl) {
    try {
      const configured = new URL(config.publicBaseUrl);
      if (!["https:", "http:"].includes(configured.protocol)) throw new Error();
      return configured.origin;
    } catch {
      throw new RequestError(500, "PROMPTDECK_PUBLIC_BASE_URL 설정이 올바르지 않습니다.");
    }
  }
  const host = String(req.headers.host || "").toLowerCase();
  if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)) return `http://${host}`;
  throw new RequestError(500, "공개 서비스 URL이 설정되지 않았습니다. 관리자에게 문의하세요.");
}

async function resolveSession(req) {
  const token = getSessionToken(req);
  if (!token) return null;
  const auth = await loadAuth();
  const tokenHash = hashSessionToken(token);
  const sess = (auth.sessions || []).find(s => (s.tokenHash === tokenHash || s.token === token) && s.expiresAt > Date.now());
  if (!sess) return null;
  if (sess.token) {
    sess.tokenHash = tokenHash;
    delete sess.token;
    await saveAuth(auth);
  }
  return (auth.users || []).find(u => u.id === sess.userId) || null;
}

async function resolveAdminActor(req) {
  if (config.authEnabled) {
    const account = await resolveSession(req);
    if (account?.role === "admin") return account;
  }

  const token = getAdminSessionToken(req);
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const expiresAt = adminModeSessions.get(tokenHash) || 0;
  if (expiresAt <= Date.now()) {
    adminModeSessions.delete(tokenHash);
    return null;
  }
  return ADMIN_MODE_USER;
}

async function handleAdminAccessStatus(req, res) {
  await initializeAdminAccessState();
  const actor = await resolveAdminActor(req);
  sendJson(res, 200, {
    ok: true,
    enabled: ADMIN_ACCESS_STATE.enabled,
    authenticated: !!actor,
  });
}

async function handleAdminAccessLogin(req, res) {
  await initializeAdminAccessState();
  if (!ADMIN_ACCESS_STATE.enabled) {
    return sendJson(res, 404, { ok: false, error: "Administrator mode is not configured." });
  }
  const body = await readJsonBody(req);
  const ip = getClientIp(req, config.trustProxy);
  if (Object.prototype.hasOwnProperty.call(body || {}, "newAccessKey") || Object.prototype.hasOwnProperty.call(body || {}, "currentAccessKey") || Object.prototype.hasOwnProperty.call(body || {}, "confirmAccessKey")) {
    return handleAdminAccessUpdate(req, res, body);
  }

  const accessKey = normalizeAdminAccessInput(body?.accessKey || "");
  const verified = verifyPassword(accessKey, ADMIN_ACCESS_HASH);
  if (!verified.ok) {
    const limit = consumeRateLimit(`admin-access:${ip}`, 5, 15 * 60_000);
    if (!limit.ok) {
      res.setHeader("Retry-After", limit.retryAfterSeconds);
      return sendJson(res, 429, { ok: false, error: "Too many administrator access attempts." });
    }
    await audit.log("admin-mode.login", { ip, ok: false, remaining: limit.remaining });
    return sendJson(res, 401, { ok: false, error: "The administrator access key is incorrect." });
  }

  consumeRateLimit.reset(`admin-access:${ip}`);
  const token = newToken();
  const expiresAt = Date.now() + ADMIN_MODE_SESSION_MS;
  for (const [storedHash, storedExpiry] of adminModeSessions) {
    if (storedExpiry <= Date.now()) adminModeSessions.delete(storedHash);
  }
  adminModeSessions.set(hashSessionToken(token), expiresAt);
  res.setHeader("Set-Cookie", adminSessionCookie(req, token, ADMIN_MODE_SESSION_MS / 1000, config.secureCookies));
  await audit.log("admin-mode.login", { userId: ADMIN_MODE_USER.id, ip: getClientIp(req, config.trustProxy), ok: true });
  sendJson(res, 200, { ok: true, expiresAt });
}

async function handleAdminAccessUpdate(req, res, payload) {
  const actor = await resolveAdminActor(req);
  if (!actor) return sendJson(res, 403, { ok: false, error: "Admin only." });

  const body = payload || (await readJsonBody(req));
  const currentAccessKey = normalizeAdminAccessInput(body?.currentAccessKey || "");
  const newAccessKey = normalizeAdminAccessInput(body?.newAccessKey || "");
  const confirmAccessKey = normalizeAdminAccessInput(body?.confirmAccessKey || "");

  if (!currentAccessKey || !newAccessKey || !confirmAccessKey) {
    return sendJson(res, 400, { ok: false, error: "현재 비밀번호, 새 비밀번호, 비밀번호 확인을 모두 입력하세요." });
  }
  if (newAccessKey !== confirmAccessKey) {
    return sendJson(res, 400, { ok: false, error: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다." });
  }

  const currentVerified = verifyPassword(currentAccessKey, ADMIN_ACCESS_HASH);
  if (!currentVerified.ok) {
    await audit.log("admin-mode.access-key.update", { userId: actor.id, ip: getClientIp(req, config.trustProxy), ok: false });
    return sendJson(res, 401, { ok: false, error: "현재 비밀번호가 올바르지 않습니다." });
  }

  const validateError = validateAdminAccessKey(newAccessKey);
  if (validateError) return sendJson(res, 400, { ok: false, error: validateError });

  if (newAccessKey === currentAccessKey) {
    return sendJson(res, 400, { ok: false, error: "현재 비밀번호와 새 비밀번호가 같습니다." });
  }

  const nextHash = hashPassword(newAccessKey);

  await saveAdminAccessStateHash(nextHash);
  await audit.log("admin-mode.access-key.update", { userId: actor.id, ip: getClientIp(req, config.trustProxy), ok: true });
  sendJson(res, 200, { ok: true, enabled: ADMIN_ACCESS_STATE.enabled });
}

async function handleAdminAccessLogout(req, res) {
  const token = getAdminSessionToken(req);
  if (token) adminModeSessions.delete(hashSessionToken(token));
  res.setHeader("Set-Cookie", clearAdminSessionCookie(req, config.secureCookies));
  sendJson(res, 200, { ok: true });
}

async function handleAuthHasUsers(res) {
  if (!config.authEnabled) return sendJson(res, 200, { ok: true, authEnabled: false, hasUsers: false });
  const { users } = await loadAuth();
  sendJson(res, 200, { ok: true, authEnabled: true, hasUsers: (users || []).length > 0 });
}

async function handleAuthLogin(req, res) {
  const body = await readJsonBody(req);
  const { username, password } = body;
  const auth = await loadAuth();
  const user = (auth.users || []).find(u => u.username.toLowerCase() === (username || "").trim().toLowerCase());
  const verified = verifyPassword(password || "", user?.passwordHash || DUMMY_PASSWORD_HASH);
  if (!user || !verified.ok) {
    await audit.log("auth.login", { ip: getClientIp(req, config.trustProxy), ok: false });
    return sendJson(res, 401, { ok: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }
  if (user.status === "pending")
    return sendJson(res, 403, { ok: false, error: "이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요." });
  if (verified.needsRehash) user.passwordHash = hashPassword(password);
  const token = newToken();
  if (!auth.sessions) auth.sessions = [];
  auth.sessions = auth.sessions.filter(s => s.expiresAt > Date.now()); // 만료 세션 정리
  auth.sessions.push({ tokenHash: hashSessionToken(token), userId: user.id, expiresAt: Date.now() + SESSION_MS });
  await saveAuth(auth);
  res.setHeader("Set-Cookie", sessionCookie(req, token, SESSION_MS / 1000, config.secureCookies));
  await audit.log("auth.login", { userId: user.id, ip: getClientIp(req, config.trustProxy) });
  sendJson(res, 200, { ok: true, userId: user.id, username: user.username, email: user.email || "", role: user.role,
    tabPermissions: user.tabPermissions, requestedTabs: user.requestedTabs || [], expiresAt: Date.now() + SESSION_MS });
}

async function handleAuthMe(req, res) {
  const user = await resolveSession(req);
  if (!user) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
  sendJson(res, 200, { ok: true, userId: user.id, username: user.username, email: user.email || "", role: user.role,
    tabPermissions: user.tabPermissions, requestedTabs: user.requestedTabs || [],
    termsVersion: user.termsVersion || null, privacyVersion: user.privacyVersion || null });
}

// ── 본인 계정 정보 수정 (비밀번호 / 이메일) ─────────────────────────────────────
async function handleAuthMeUpdate(req, res) {
  const me = await resolveSession(req);
  if (!me) return sendJson(res, 401, { ok: false, error: "Unauthorized" });

  const body = await readJsonBody(req);
  if (!body) return sendJson(res, 400, { ok: false, error: "잘못된 요청입니다." });
  const { currentPassword, newPassword, newEmail } = body;

  if (!currentPassword) return sendJson(res, 400, { ok: false, error: "현재 비밀번호를 입력하세요." });

  const auth = await loadAuth();
  const user = (auth.users || []).find(u => u.id === me.id);
  if (!user) return sendJson(res, 404, { ok: false, error: "User not found." });
  if (!verifyPassword(currentPassword, user.passwordHash).ok)
    return sendJson(res, 400, { ok: false, error: "현재 비밀번호가 올바르지 않습니다." });

  if (!newPassword && !newEmail)
    return sendJson(res, 400, { ok: false, error: "변경할 내용이 없습니다." });

  if (newPassword) {
    const passwordError = validatePassword(newPassword, { username: user.username, email: user.email });
    if (passwordError) return sendJson(res, 400, { ok: false, error: passwordError });
    user.passwordHash = hashPassword(newPassword);
    const currentTokenHash = hashSessionToken(getSessionToken(req));
    auth.sessions = (auth.sessions || []).filter((session) => session.userId !== user.id || session.tokenHash === currentTokenHash || hashSessionToken(session.token) === currentTokenHash);
  }

  let pendingEmailRequested = false;
  if (newEmail) {
    const email = newEmail.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return sendJson(res, 400, { ok: false, error: "올바른 이메일 주소를 입력하세요." });
    if (email === user.email)
      return sendJson(res, 400, { ok: false, error: "현재 이메일과 동일합니다." });
    if ((auth.users || []).some(u => u.id !== user.id && u.email?.toLowerCase() === email))
      return sendJson(res, 400, { ok: false, error: "이미 사용 중인 이메일입니다." });

    if (!config.smtp?.host)
      return sendJson(res, 500, { ok: false, error: "이메일 변경 확인 메일을 보낼 수 없습니다. 관리자에게 문의하세요." });

    const token = newToken();
    const adminSettings = await loadAdminSettings();
    const appName = adminSettings.programName || "PromptDeck";
    const confirmUrl = `${publicBaseUrl(req)}/api/auth/confirm-email-change?token=${encodeURIComponent(token)}`;

    let sent = false;
    try { sent = await sendEmailChangeConfirmation(email, confirmUrl, appName); }
    catch (error) { console.error("[auth] 이메일 변경 확인 메일 발송 실패:", error); sent = false; }

    if (!sent) return sendJson(res, 500, { ok: false, error: "확인 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요." });

    user.pendingEmail = email;
    user.pendingEmailToken = token;
    user.pendingEmailTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    pendingEmailRequested = true;
  }

  await saveAuth(auth);
  await audit.log("account.update", { userId: user.id, ip: getClientIp(req, config.trustProxy) });
  sendJson(res, 200, { ok: true, pendingEmailRequested });
}

async function handleAuthExport(req, res) {
  const me = await resolveSession(req);
  if (!me) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
  const userDir = path.join(config.outputDir, "users", me.id);
  const files = [];
  try {
    for (const entry of await fs.readdir(userDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const stat = await fs.stat(path.join(userDir, entry.name));
      files.push({ name: entry.name, bytes: stat.size, createdAt: stat.birthtimeMs || stat.mtimeMs });
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const shortLinkData = await loadShortLinks();
  const shortLinks = (shortLinkData.links || []).filter((link) => link.userId === me.id).map((link) => ({
    code: link.code,
    target: link.target,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
  }));
  const auditEvents = await audit.readForUser(me.id);
  await audit.log("account.export", { userId: me.id, ip: getClientIp(req, config.trustProxy) });
  sendJson(res, 200, {
    ok: true,
    exportedAt: new Date().toISOString(),
    account: safeAdminUser(me),
    generatedFiles: files,
    shortLinks,
    auditEvents,
  });
}

async function handleAuthDeleteMe(req, res) {
  const me = await resolveSession(req);
  if (!me) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
  const { currentPassword, confirmation } = await readJsonBody(req);
  if (confirmation !== "회원탈퇴") {
    return sendJson(res, 400, { ok: false, error: "확인 문구 '회원탈퇴'를 정확히 입력하세요." });
  }
  const auth = await loadAuth();
  const user = (auth.users || []).find((candidate) => candidate.id === me.id);
  if (!user || !verifyPassword(currentPassword || "", user.passwordHash).ok) {
    return sendJson(res, 400, { ok: false, error: "현재 비밀번호가 올바르지 않습니다." });
  }
  if (user.role === "admin" && (auth.users || []).filter((candidate) => candidate.role === "admin").length <= 1) {
    return sendJson(res, 409, { ok: false, error: "마지막 관리자 계정은 탈퇴할 수 없습니다. 다른 관리자를 먼저 지정하세요." });
  }
  auth.users = (auth.users || []).filter((candidate) => candidate.id !== me.id);
  auth.sessions = (auth.sessions || []).filter((session) => session.userId !== me.id);
  await removeUserOutputs(config.outputDir, me.id);
  await removeUserShortLinks(me.id);
  await saveAuth(auth);
  await audit.log("account.delete", { userId: me.id, ip: getClientIp(req, config.trustProxy) });
  res.setHeader("Set-Cookie", clearSessionCookie(req, config.secureCookies));
  sendJson(res, 200, { ok: true });
}

async function handleConfirmEmailChange(req, res, token) {
  const auth = await loadAuth();
  const user = (auth.users || []).find(
    u => u.pendingEmailToken === token && u.pendingEmailTokenExpiresAt > Date.now()
  );
  if (!user) {
    res.writeHead(302, { Location: "/index.html?emailChange=expired" });
    return res.end();
  }
  user.email = user.pendingEmail;
  user.pendingEmail = null;
  user.pendingEmailToken = null;
  user.pendingEmailTokenExpiresAt = null;
  await saveAuth(auth);
  res.writeHead(302, { Location: "/index.html?emailChange=ok" });
  res.end();
}

async function handleGeneratePhotoPreview(req, res, user) {
  let generatedFilePath = "";
  try {
    const { medId, prompt, privacyConfirmed, provider } = await readJsonBody(req);
    if (!medId || !prompt || !String(prompt).trim() || String(prompt).length > 4_000) {
      return sendJson(res, 400, { ok: false, error: "미리보기 ID와 프롬프트가 필요합니다." });
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/.test(medId)) {
      return sendJson(res, 400, { ok: false, error: "잘못된 미리보기 ID입니다." });
    }
    if (privacyConfirmed !== true) return sendJson(res, 400, { ok: false, error: "외부 AI 전송 안내를 확인하세요." });
    const sensitiveType = detectSensitivePrompt(prompt);
    if (sensitiveType) return sendJson(res, 400, { ok: false, error: `${sensitiveType}로 보이는 정보가 포함되어 외부 AI 전송을 중단했습니다.` });
    if (provider && !["openai", "pollinations"].includes(provider)) {
      return sendJson(res, 400, { ok: false, error: "지원하지 않는 미리보기 이미지 제공자입니다." });
    }
    const previewProvider = provider || "openai";

    const generated = await generateImage({
      slideId: medId,
      title: medId,
      prompt: String(prompt).trim(),
      ratio: "4:3",
      runtimeConfig: { ...runtimeConfig, provider: previewProvider },
    });
    generatedFilePath = generated.filePath;

    const dir = path.join(config.outputDir, "mixer_samples");
    await fs.mkdir(dir, { recursive: true });
    const ext = generated.mimeType === "image/jpeg" ? "jpg" : "png";
    const filename = `${medId}_0.${ext}`;
    const destination = path.join(dir, filename);
    await fs.copyFile(generated.filePath, destination);

    const serverUrl = `/outputs/mixer_samples/${filename}`;
    await mutateMixerManifest((manifest) => {
      if (!Array.isArray(manifest[medId])) manifest[medId] = [null, null, null];
      manifest[medId][0] = serverUrl;
    });

    await audit.log("photo.preview.generate", { userId: user.id, targetId: medId, provider: previewProvider, ip: getClientIp(req, config.trustProxy) });
    sendJson(res, 200, {
      ok: true,
      url: serverUrl,
      model: generated.model,
      size: generated.size,
      provider: previewProvider,
    });
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error?.message || "이미지 미리보기 생성에 실패했습니다." });
  } finally {
    if (generatedFilePath) await fs.unlink(generatedFilePath).catch(() => {});
  }
}
// ─────────────────────────────────────────────────────────────────────────────

async function handleAuthLogout(req, res) {
  const token = getSessionToken(req);
  let userId = "";
  if (token) {
    const auth = await loadAuth();
    const tokenHash = hashSessionToken(token);
    userId = (auth.sessions || []).find((session) => session.tokenHash === tokenHash || session.token === token)?.userId || "";
    auth.sessions = (auth.sessions || []).filter(s => s.tokenHash !== tokenHash && s.token !== token);
    await saveAuth(auth);
  }
  if (userId) await audit.log("auth.logout", { userId, ip: getClientIp(req, config.trustProxy) });
  res.setHeader("Set-Cookie", clearSessionCookie(req, config.secureCookies));
  sendJson(res, 200, { ok: true });
}

function safeAdminUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email || "",
    role: user.role,
    status: user.status || "active",
    emailVerified: !!user.emailVerified,
    tabPermissions: user.tabPermissions ?? null,
    requestedTabs: user.requestedTabs || [],
    createdAt: user.createdAt || null,
    termsAcceptedAt: user.termsAcceptedAt || null,
    termsVersion: user.termsVersion || null,
    privacyVersion: user.privacyVersion || null,
    adultConfirmedAt: user.adultConfirmedAt || null,
  };
}

function sanitizeTabIds(value) {
  return Array.isArray(value) ? [...new Set(value.filter((item) => TAB_ID_PATTERN.test(String(item))).map(String))].slice(0, 100) : [];
}

function sanitizeTabPermissions(value) {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = {};
  for (const [tabId, allowed] of Object.entries(value)) {
    if (TAB_ID_PATTERN.test(tabId)) result[tabId] = allowed === true;
  }
  return result;
}

async function handleAuthGetUsers(req, res) {
  const me = await resolveSession(req);
  if (!me || me.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
  const { users } = await loadAuth();
  sendJson(res, 200, { ok: true, users: (users || []).map(safeAdminUser) });
}

async function handleAuthCreateUser(req, res) {
  const me = await resolveSession(req);
  if (!me || me.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
  const { username, password, role, adultConfirmed } = await readJsonBody(req);
  if (!/^[A-Za-z0-9._-]{2,40}$/.test(String(username || "").trim()) || !password)
    return sendJson(res, 400, { ok: false, error: "아이디와 비밀번호를 입력하세요." });
  const passwordError = validatePassword(password, { username });
  if (passwordError) return sendJson(res, 400, { ok: false, error: passwordError });
  if (adultConfirmed !== true) return sendJson(res, 400, { ok: false, error: "만 18세 이상 확인이 필요합니다." });
  const auth = await loadAuth();
  if ((auth.users || []).find(u => u.username.toLowerCase() === username.trim().toLowerCase()))
    return sendJson(res, 400, { ok: false, error: "이미 사용 중인 아이디입니다." });
  const user = { id: newId(), username: username.trim(), passwordHash: hashPassword(password),
    role: role === "admin" ? "admin" : "user", status: "active", emailVerified: false,
    tabPermissions: null, requestedTabs: [], createdAt: Date.now(), createdBy: me.id, adultConfirmedAt: Date.now() };
  auth.users.push(user);
  await saveAuth(auth);
  await audit.log("admin.user.create", { userId: me.id, targetId: user.id, ip: getClientIp(req, config.trustProxy) });
  sendJson(res, 200, { ok: true, user: safeAdminUser(user) });
}

async function handleAuthUpdateUser(req, res, userId) {
  const me = await resolveSession(req);
  if (!me || me.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
  const body = await readJsonBody(req);
  const auth = await loadAuth();
  const user = (auth.users || []).find(u => u.id === userId);
  if (!user) return sendJson(res, 404, { ok: false, error: "User not found." });
  if (body.password) {
    const passwordError = validatePassword(body.password, { username: user.username, email: user.email });
    if (passwordError) return sendJson(res, 400, { ok: false, error: passwordError });
    user.passwordHash = hashPassword(body.password);
    auth.sessions = (auth.sessions || []).filter((session) => session.userId !== user.id);
  }
  if (body.tabPermissions !== undefined) user.tabPermissions = sanitizeTabPermissions(body.tabPermissions);
  if (body.requestedTabs !== undefined) user.requestedTabs = sanitizeTabIds(body.requestedTabs);
  await saveAuth(auth);
  await audit.log("admin.user.update", { userId: me.id, targetId: user.id, ip: getClientIp(req, config.trustProxy) });
  sendJson(res, 200, { ok: true });
}

async function handleAuthDeleteUser(req, res, userId) {
  const me = await resolveSession(req);
  if (!me || me.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
  const auth = await loadAuth();
  const target = (auth.users || []).find((user) => user.id === userId);
  if (!target) return sendJson(res, 404, { ok: false, error: "User not found." });
  if (target.id === me.id) return sendJson(res, 409, { ok: false, error: "관리자 화면에서는 본인 계정을 삭제할 수 없습니다. 계정 설정의 회원탈퇴를 이용하세요." });
  if (target.role === "admin" && (auth.users || []).filter((user) => user.role === "admin").length <= 1) {
    return sendJson(res, 409, { ok: false, error: "마지막 관리자 계정은 삭제할 수 없습니다." });
  }
  auth.users    = (auth.users    || []).filter(u => u.id !== userId);
  auth.sessions = (auth.sessions || []).filter(s => s.userId !== userId);
  await saveAuth(auth);
  await removeUserOutputs(config.outputDir, userId).catch((error) => console.error("[privacy] 사용자 출력 삭제 실패:", error));
  await removeUserShortLinks(userId).catch((error) => console.error("[privacy] 사용자 단축주소 삭제 실패:", error));
  await audit.log("admin.user.delete", { userId: me.id, targetId: userId, ip: getClientIp(req, config.trustProxy) });
  sendJson(res, 200, { ok: true });
}

async function handleAuthRequestAccess(req, res) {
  const me = await resolveSession(req);
  if (!me) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
  const { tabId } = await readJsonBody(req);
  if (!TAB_ID_PATTERN.test(String(tabId || ""))) return sendJson(res, 400, { ok: false, error: "잘못된 탭 ID입니다." });
  const auth = await loadAuth();
  const user = (auth.users || []).find(u => u.id === me.id);
  if (!user) return sendJson(res, 404, { ok: false, error: "User not found." });
  if (!user.requestedTabs) user.requestedTabs = [];
  if (!user.requestedTabs.includes(tabId)) user.requestedTabs.push(tabId);
  await saveAuth(auth);
  sendJson(res, 200, { ok: true });
}
async function handleAuthSignup(req, res) {
  if (!config.allowSignups) return sendJson(res, 403, { ok: false, error: "현재 신규 회원가입을 받지 않습니다." });
  const body = await readJsonBody(req);
  if (!body) return sendJson(res, 400, { ok: false, error: "잘못된 요청입니다." });
  const { username, email, password, acceptedTermsVersion, acceptedPrivacyVersion, ageConfirmed } = body;

  const normalizedUsername = String(username || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!/^[A-Za-z0-9._-]{2,40}$/.test(normalizedUsername))
    return sendJson(res, 400, { ok: false, error: "아이디는 영문, 숫자, 점, 밑줄, 하이픈으로 2~40자여야 합니다." });
  if (!normalizedEmail || normalizedEmail.length > 254 || !password)
    return sendJson(res, 400, { ok: false, error: "아이디, 이메일, 비밀번호를 모두 입력하세요." });
  const passwordError = validatePassword(password, { username: normalizedUsername, email: normalizedEmail });
  if (passwordError) return sendJson(res, 400, { ok: false, error: passwordError });
  if (acceptedTermsVersion !== TERMS_VERSION || acceptedPrivacyVersion !== PRIVACY_VERSION || ageConfirmed !== true) {
    return sendJson(res, 400, { ok: false, error: "최신 이용약관·개인정보 처리방침 동의와 만 18세 이상 확인이 필요합니다." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
    return sendJson(res, 400, { ok: false, error: "올바른 이메일 주소를 입력하세요." });

  const auth = await loadAuth();

  if ((auth.users || []).find(u => u.username.toLowerCase() === normalizedUsername.toLowerCase()))
    return sendJson(res, 400, { ok: false, error: "입력한 정보로는 가입할 수 없습니다. 기존 계정 여부를 확인하거나 관리자에게 문의하세요." });

  if ((auth.users || []).find(u => u.email?.toLowerCase() === normalizedEmail))
    return sendJson(res, 400, { ok: false, error: "입력한 정보로는 가입할 수 없습니다. 기존 계정 여부를 확인하거나 관리자에게 문의하세요." });

  // 이메일 인증은 예외 없이 필수. SMTP 미설정 상태로는 가입 자체를 막는다.
  if (!config.smtp?.host) {
    console.error("[auth] SMTP 미설정 — 이메일 인증을 보낼 수 없어 가입을 차단합니다.");
    return sendJson(res, 500, { ok: false, error: "이메일 인증 시스템이 설정되지 않았습니다. 관리자에게 문의하세요." });
  }

  const verifyToken = newToken();
  const verifyTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

  const user = {
    id: newId(),
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: "user",
    status: "pending",
    emailVerified: false,
    verifyToken,
    verifyTokenExpiresAt,
    tabPermissions: null,
    requestedTabs: [],
    createdAt: Date.now(),
    termsAcceptedAt: Date.now(),
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
    adultConfirmedAt: Date.now(),
  };

  if (!auth.users) auth.users = [];
  auth.users.push(user);
  await saveAuth(auth);

  // 이메일 발송
  const adminSettings = await loadAdminSettings();
  const appName = adminSettings.programName || "PromptDeck";
  const verifyUrl = `${publicBaseUrl(req)}/api/auth/verify?token=${encodeURIComponent(verifyToken)}`;

  let sent = false;
  try {
    sent = await sendVerificationEmail(normalizedEmail, verifyUrl, appName);
  } catch (error) {
    console.error("[auth] 인증 이메일 발송 실패:", error);
    sent = false;
  }

  if (!sent) {
    // 발송 실패 시 가입 자체를 롤백한다 — 인증 없이는 계정을 만들지 않는다.
    auth.users = auth.users.filter(u => u.id !== user.id);
    await saveAuth(auth);
    return sendJson(res, 500, { ok: false, error: "인증 이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요." });
  }

  await audit.log("auth.signup", { userId: user.id, ip: getClientIp(req, config.trustProxy) });
  return sendJson(res, 200, { ok: true, autoApproved: false, email: user.email });
}

async function handleAuthVerify(req, res, token) {
  const auth = await loadAuth();
  const user = (auth.users || []).find(
    u => u.verifyToken === token && u.verifyTokenExpiresAt > Date.now()
  );
  if (!user) {
    res.writeHead(302, { Location: "/login.html?verify=expired" });
    return res.end();
  }
  user.status = "active";
  user.emailVerified = true;
  user.verifyToken = null;
  user.verifyTokenExpiresAt = null;
  await saveAuth(auth);
  res.writeHead(302, { Location: "/login.html?verify=ok" });
  res.end();
}

// ─────────────────────────────────────────────────────────────────────────────

function handleGetConfig(res) {
  sendJson(res, 200, {
    ok: true,
    provider: runtimeConfig.provider,
    photoPreviewProvider: "openai",
    openaiImageModel: config.openaiImageModel,
    openaiImageQuality: config.openaiImageQuality,
    hasGoogleApiKey: !!runtimeConfig.googleApiKey && runtimeConfig.googleApiKey !== "PASTE_GOOGLE_API_KEY_HERE",
    hasOpenaiApiKey: !!runtimeConfig.openaiApiKey,
    providers: PROVIDERS,
  });
}

function handlePublicInfo(res) {
  sendJson(res, 200, {
    ok: true,
    serviceName: "PromptDeck",
    legal: config.legal,
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
    authEnabled: config.authEnabled,
    allowSignups: config.allowSignups,
    outputRetentionDays: config.outputRetentionDays,
    auditRetentionDays: config.auditRetentionDays,
    imageProvider: runtimeConfig.provider,
    aiProviders: ["OpenAI", "Google", "Pollinations"],
  });
}

async function handleSetConfig(req, res) {
  try {
    const body = await readJsonBody(req);
    if (body.provider && PROVIDERS[body.provider]) {
      if (body.provider !== "mock" && config.deploymentMode && !config.aiDataTransferConfirmed) {
        return sendJson(res, 400, { ok: false, error: "외부 AI 국외 전송 고지·적법 근거를 확인하고 PROMPTDECK_AI_DATA_TRANSFER_CONFIRMED=true를 설정해야 합니다." });
      }
      if (body.provider === "pollinations" && config.deploymentMode && !config.allowPollinations) {
        return sendJson(res, 400, { ok: false, error: "Pollinations는 처리 위치·보유기간을 확인하고 PROMPTDECK_ALLOW_POLLINATIONS=true로 명시 허용해야 합니다." });
      }
      if (body.provider === "google" && config.deploymentMode && !config.googlePaidServiceConfirmed) {
        return sendJson(res, 400, { ok: false, error: "운영 배포에서는 Google 유료 서비스·데이터 처리 조건을 확인하고 PROMPTDECK_GOOGLE_PAID_SERVICE_CONFIRMED=true를 설정해야 합니다." });
      }
      runtimeConfig.provider = body.provider;
    }
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

  if (!sameOriginRequest(req, config.trustProxy)) {
    return sendJson(res, 403, { ok: false, error: "허용되지 않은 출처의 요청입니다." });
  }
  const ip = getClientIp(req, config.trustProxy);
  if (url.pathname.startsWith("/api/")) {
    const generalLimit = consumeRateLimit(`api:${ip}`, 300, 60_000);
    if (!generalLimit.ok) {
      res.setHeader("Retry-After", generalLimit.retryAfterSeconds);
      return sendJson(res, 429, { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." });
    }
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      provider: runtimeConfig.provider,
      providers: PROVIDERS,
    });
  }

  if (req.method === "GET" && url.pathname === "/api/admin/access") {
    return handleAdminAccessStatus(req, res);
  }
  if (req.method === "POST" && url.pathname === "/api/admin/access") {
    return handleAdminAccessLogin(req, res);
  }
  if (req.method === "POST" && url.pathname === "/api/admin/logout") {
    return handleAdminAccessLogout(req, res);
  }
  if (req.method === "GET" && url.pathname === "/api/config") {
    const user = config.authEnabled ? await resolveSession(req) : PUBLIC_USER;
    if (!user) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return handleGetConfig(res);
  }

  if (req.method === "POST" && url.pathname === "/api/config") {
    if (!config.authEnabled) return sendJson(res, 404, { ok: false, error: "Management is disabled." });
    const user = await resolveSession(req);
    if (!user || user.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
    return handleSetConfig(req, res);
  }

  if (req.method === "POST" && url.pathname === "/api/generate-image") {
    const user = config.authEnabled ? await resolveSession(req) : PUBLIC_USER;
    if (!user) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
    const limit = consumeRateLimit(`generate:${config.authEnabled ? user.id : ip}`, 20, 60_000);
    if (!limit.ok) return sendJson(res, 429, { ok: false, error: "이미지 생성 요청이 너무 많습니다. 잠시 후 다시 시도하세요." });
    return handleGenerateImage(req, res, user);
  }

  if (req.method === "POST" && url.pathname === "/api/shorten-url") {
    const user = config.authEnabled ? await resolveSession(req) : PUBLIC_USER;
    if (!user) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
    const limit = consumeRateLimit(`shortlink:${config.authEnabled ? user.id : ip}`, 30, 60 * 60_000);
    if (!limit.ok) return sendJson(res, 429, { ok: false, error: "단축주소 생성 요청이 너무 많습니다." });
    return handleCreateShortLink(req, res, user);
  }

  if (req.method === "POST" && url.pathname === "/api/save-mixer-sample") {
    const user = config.authEnabled ? await resolveSession(req) : PUBLIC_USER;
    if (!user) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
    if (config.authEnabled && user.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
    return handleSaveMixerSample(req, res, user);
  }

  if (req.method === "GET" && url.pathname === "/api/public-info") return handlePublicInfo(res);

  const shortLinkMatch = url.pathname.match(/^\/s\/([A-Za-z0-9_-]{12})$/);
  if (req.method === "GET" && shortLinkMatch) return handleOpenShortLink(res, shortLinkMatch[1]);

  if (req.method === "POST" && url.pathname === "/api/generate-photo-preview") {
    const user = config.authEnabled ? await resolveAdminActor(req) : PUBLIC_USER;
    if (!user) return sendJson(res, 403, { ok: false, error: "Admin only." });
    const limit = consumeRateLimit(`photo-preview:${config.authEnabled ? user.id : ip}`, 10, 60_000);
    if (!limit.ok) return sendJson(res, 429, { ok: false, error: "참고 이미지 생성 요청이 너무 많습니다. 잠시 후 다시 시도하세요." });
    return handleGeneratePhotoPreview(req, res, user);
  }

  if (req.method === "GET" && url.pathname === "/api/mixer-images") {
    const user = config.authEnabled ? await resolveSession(req) : PUBLIC_USER;
    if (!user) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return handleGetMixerImages(res);
  }

  if (req.method === "GET" && url.pathname === "/api/unsplash/search") {
    const user = config.authEnabled ? await resolveSession(req) : PUBLIC_USER;
    if (!user) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
    if (config.authEnabled && user.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
    const limit = consumeRateLimit(`unsplash:${config.authEnabled ? user.id : ip}`, 30, 60_000);
    if (!limit.ok) return sendJson(res, 429, { ok: false, error: "사진 검색 요청이 너무 많습니다." });
    return handleUnsplashSearch(req, res, url, user);
  }

  if (req.method === "POST" && url.pathname === "/api/reset-mixer-sample") {
    const user = config.authEnabled ? await resolveSession(req) : PUBLIC_USER;
    if (!user) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
    if (config.authEnabled && user.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
    return handleResetMixerSample(req, res, user);
  }

  if (req.method === "GET" && url.pathname === "/api/photo-preview-status") {
    const user = await resolveAdminActor(req);
    if (!user) return sendJson(res, 403, { ok: false, error: "Admin only." });
    return handlePhotoPreviewStatus(res);
  }

  if (req.method === "POST" && url.pathname === "/api/delete-photo-preview") {
    const user = await resolveAdminActor(req);
    if (!user) return sendJson(res, 403, { ok: false, error: "Admin only." });
    return handleDeletePhotoPreview(req, res, user);
  }

  // ── 관리자 설정 API ────────────────────────────────────────────────────────
  if (req.method === "GET"  && url.pathname === "/api/admin-settings") return handleGetAdminSettings(req, res);
  if (req.method === "POST" && url.pathname === "/api/admin-settings") {
    if (!config.adminModeEnabled && !config.authEnabled) return sendJson(res, 404, { ok: false, error: "Management is disabled." });
    return handleSaveAdminSettings(req, res);
  }

  // ── 인증 API ───────────────────────────────────────────────────────────────
  if (req.method === "GET"  && url.pathname === "/api/auth/has-users") return handleAuthHasUsers(res);
  if (!config.authEnabled && url.pathname.startsWith("/api/auth/")) {
    return sendJson(res, 404, { ok: false, error: "Authentication is disabled." });
  }
  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const limit = consumeRateLimit(`login:${ip}`, 10, 15 * 60_000);
    if (!limit.ok) return sendJson(res, 429, { ok: false, error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요." });
    return handleAuthLogin(req, res);
  }
  if (req.method === "GET"  && url.pathname === "/api/auth/me")        return handleAuthMe(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/me/update") return handleAuthMeUpdate(req, res);
  if (req.method === "GET"  && url.pathname === "/api/auth/me/export") return handleAuthExport(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/me/delete") return handleAuthDeleteMe(req, res);
  if (req.method === "GET"  && url.pathname === "/api/auth/confirm-email-change") {
    return handleConfirmEmailChange(req, res, url.searchParams.get("token") || "");
  }
  if (req.method === "POST" && url.pathname === "/api/auth/logout")    return handleAuthLogout(req, res);
  if (req.method === "GET"  && url.pathname === "/api/auth/users")     return handleAuthGetUsers(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/users")     return handleAuthCreateUser(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/request-access") return handleAuthRequestAccess(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/signup") {
    const limit = consumeRateLimit(`signup:${ip}`, 5, 60 * 60_000);
    if (!limit.ok) return sendJson(res, 429, { ok: false, error: "회원가입 요청이 너무 많습니다. 나중에 다시 시도하세요." });
    return handleAuthSignup(req, res);
  }
  if (req.method === "GET"  && url.pathname === "/api/auth/verify") {
    return handleAuthVerify(req, res, url.searchParams.get("token") || "");
  }
  const updateMatch = url.pathname.match(/^\/api\/auth\/users\/([^/]+)\/update$/);
  if (req.method === "POST" && updateMatch)  return handleAuthUpdateUser(req, res, updateMatch[1]);
  const deleteMatch = url.pathname.match(/^\/api\/auth\/users\/([^/]+)\/delete$/);
  if (req.method === "POST" && deleteMatch)  return handleAuthDeleteUser(req, res, deleteMatch[1]);
  // ───────────────────────────────────────────────────────────────────────────

  if (req.method === "POST" && url.pathname === "/api/open-folder") {
    if (!config.authEnabled) return sendJson(res, 404, { ok: false, error: "Management is disabled." });
    const user = await resolveSession(req);
    if (!user || user.role !== "admin") return sendJson(res, 403, { ok: false, error: "Admin only." });
    const remote = String(req.socket?.remoteAddress || "");
    if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote)) {
      return sendJson(res, 403, { ok: false, error: "폴더 열기는 서버 컴퓨터에서만 사용할 수 있습니다." });
    }
    execFile("explorer.exe", [config.outputDir]);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET") {
    if (url.pathname.startsWith("/static-pages/styles/")) {
      const mappedPathname = url.pathname.replace(/^\/static-pages\//, "/");
      return serveStatic(req, res, mappedPathname);
    }
    if (url.pathname.startsWith("/static-pages/assets/")) {
      const mappedPathname = url.pathname.replace(/^\/static-pages\//, "/");
      return serveStatic(req, res, mappedPathname);
    }

    if (!config.authEnabled && ["/login.html", "/signup.html"].includes(url.pathname)) {
      res.writeHead(302, { Location: "/app", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/") {
      res.writeHead(302, { Location: "/static-pages/home.html", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/app") {
      res.writeHead(302, { Location: `/index.html${url.search}`, "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/home") {
      res.writeHead(302, { Location: "/", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/about") {
      res.writeHead(302, { Location: "/static-pages/about.html", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/privacy") {
      res.writeHead(302, { Location: "/static-pages/privacy.html", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/terms") {
      res.writeHead(302, { Location: "/static-pages/terms.html", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/ai-policy") {
      res.writeHead(302, { Location: "/static-pages/ai-policy.html", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/copyright-policy") {
      res.writeHead(302, { Location: "/static-pages/copyright-policy.html", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/third-party-notices") {
      res.writeHead(302, { Location: "/static-pages/third-party-notices.html", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/feed.xml") {
      res.writeHead(302, { Location: "/static-pages/feed.xml", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/sitemap.xml") {
      res.writeHead(302, { Location: "/static-pages/sitemap.xml", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname === "/guides" || url.pathname === "/guides/") {
      res.writeHead(302, { Location: "/static-pages/guides/index.html", "Cache-Control": "no-store" });
      return res.end();
    }
    if (url.pathname.startsWith("/guides/")) {
      const guide = url.pathname.slice("/guides/".length).replace(/\/$/, "");
      if (guide === "ai-presentation-prompt") {
        res.writeHead(302, { Location: "/static-pages/guides/ai-presentation-prompt.html", "Cache-Control": "no-store" });
        return res.end();
      }
      if (guide === "data-diagram-prompt") {
        res.writeHead(302, { Location: "/static-pages/guides/data-diagram-prompt.html", "Cache-Control": "no-store" });
        return res.end();
      }
      if (guide === "promotion-image-prompt") {
        res.writeHead(302, { Location: "/static-pages/guides/promotion-image-prompt.html", "Cache-Control": "no-store" });
        return res.end();
      }
      if (guide === "ppt-slide-planner-skill") {
        res.writeHead(302, { Location: "/static-pages/guides/ppt-slide-planner-skill.html", "Cache-Control": "no-store" });
        return res.end();
      }
    }
    if (url.pathname === "/admin.html") {
      const actor = await resolveAdminActor(req);
      if (!actor) {
        res.writeHead(302, { Location: config.adminModeEnabled ? "/app?admin=locked" : "/app", "Cache-Control": "no-store" });
        return res.end();
      }
    }
    return serveStatic(req, res, url.pathname);
  }

  sendText(res, 405, "Method not allowed");
}

async function initializeServerData() {
  if (!PROVIDERS[runtimeConfig.provider]) {
    throw new Error(`지원하지 않는 IMAGE_PROVIDER입니다: ${runtimeConfig.provider}`);
  }
  await fs.mkdir(config.outputDir, { recursive: true, mode: 0o700 });
  await audit.initialize();
  await initializeAdminAccessState();
  const now = Date.now();
  if (config.authEnabled) {
    const auth = await loadAuth();
    const expiredPendingIds = (auth.users || [])
      .filter((user) => user.status === "pending" && (!user.verifyTokenExpiresAt || user.verifyTokenExpiresAt <= now))
      .map((user) => user.id);
    auth.users = (auth.users || []).filter((user) => !expiredPendingIds.includes(user.id));
    auth.users.forEach((user) => {
      if (user.pendingEmailTokenExpiresAt && user.pendingEmailTokenExpiresAt <= now) {
        user.pendingEmail = null;
        user.pendingEmailToken = null;
        user.pendingEmailTokenExpiresAt = null;
      }
    });
    auth.sessions = (auth.sessions || []).filter((session) => session.expiresAt > now && auth.users.some((user) => user.id === session.userId));
    auth.sessions.forEach((session) => {
      if (session.token) {
        session.tokenHash = hashSessionToken(session.token);
        delete session.token;
      }
    });
    if (!auth.users || auth.users.length === 0) {
      const username = config.bootstrapAdminUsername.trim();
      const passwordError = validatePassword(config.bootstrapAdminPassword, { username });
      const placeholderPassword = /change|replace|example|password/i.test(config.bootstrapAdminPassword);
      if (!/^[A-Za-z0-9._-]{2,40}$/.test(username) || passwordError || placeholderPassword) {
        throw new Error(`최초 관리자 계정이 없습니다. PROMPTDECK_BOOTSTRAP_ADMIN_USERNAME과 안전한 PROMPTDECK_BOOTSTRAP_ADMIN_PASSWORD를 설정하세요${passwordError ? ` (${passwordError})` : ""}.`);
      }
      auth.users = [{
        id: newId(),
        username,
        passwordHash: hashPassword(config.bootstrapAdminPassword),
        role: "admin",
        status: "active",
        emailVerified: false,
        tabPermissions: null,
        requestedTabs: [],
        createdAt: now,
        createdBy: "bootstrap",
        adultConfirmedAt: now
      }];
      auth.sessions = [];
      console.log(`[auth] 최초 관리자 계정 생성: ${username}`);
    }
    await saveAuth(auth);
    for (const userId of expiredPendingIds) await removeUserOutputs(config.outputDir, userId).catch(() => {});
  } else {
    console.log("[auth] 공개 접근 모드: 로그인, 회원가입, 관리 기능 비활성화");
  }
  config.bootstrapAdminPassword = "";
  const deletedCount = await cleanupExpiredUserOutputs(config.outputDir, config.outputRetentionDays);
  if (deletedCount) console.log(`[privacy] 보존기간이 지난 생성 파일 ${deletedCount}개 삭제`);

  if (config.deploymentMode) {
    const missing = [];
    const deployedSettings = await loadAdminSettings();
    const placeholder = (value) => !value || /example\.com|미설정|실제 사업장|운영자 또는|책임자 성명|your[-_ ]/i.test(String(value));
    if (!/^https:\/\//i.test(config.publicBaseUrl) || placeholder(config.publicBaseUrl)) missing.push("PROMPTDECK_PUBLIC_BASE_URL(실제 HTTPS 주소)");
    if (!config.secureCookies) missing.push("PROMPTDECK_SECURE_COOKIES=true");
    if (!config.trustProxy) missing.push("PROMPTDECK_TRUST_PROXY=true(신뢰하는 리버스 프록시 바로 뒤에서만)");
    if (placeholder(config.legal.operatorName)) missing.push("PROMPTDECK_OPERATOR_NAME");
    if (placeholder(config.legal.address)) missing.push("PROMPTDECK_OPERATOR_ADDRESS");
    if (placeholder(config.legal.privacyOfficer)) missing.push("PROMPTDECK_PRIVACY_OFFICER");
    if (placeholder(config.legal.privacyEmail)) missing.push("PROMPTDECK_PRIVACY_EMAIL");
    if (config.allowSignups && !config.smtp.host) missing.push("SMTP_HOST(회원가입 활성 시)");
    if (config.allowSignups && !config.smtp.from) missing.push("SMTP_FROM(회원가입 활성 시)");
    if (config.allowSignups && !config.legal.smtpProvider) missing.push("PROMPTDECK_SMTP_PROVIDER(회원가입 활성 시)");
    if (runtimeConfig.provider === "pollinations" && !config.allowPollinations) missing.push("PROMPTDECK_ALLOW_POLLINATIONS=true 또는 다른 IMAGE_PROVIDER");
    if (runtimeConfig.provider === "google" && /preview/i.test(config.imageModel) && !config.allowPreviewModels) {
      missing.push("정식 출시 GEMINI_IMAGE_MODEL 또는 PROMPTDECK_ALLOW_PREVIEW_MODELS=true");
    }
    if (runtimeConfig.provider === "google" && !config.googlePaidServiceConfirmed) missing.push("PROMPTDECK_GOOGLE_PAID_SERVICE_CONFIRMED=true");
    if (runtimeConfig.provider !== "mock" && !config.aiDataTransferConfirmed) missing.push("PROMPTDECK_AI_DATA_TRANSFER_CONFIRMED=true");
    if (deployedSettings.unsplashKey && !config.unsplashDataTransferConfirmed) missing.push("PROMPTDECK_UNSPLASH_DATA_TRANSFER_CONFIRMED=true");
    if (missing.length) throw new Error(`운영 배포 필수 설정이 누락되었습니다: ${missing.join(", ")}`);
  }
}

async function pruneExpiredAuthData() {
  const auth = await loadAuth();
  const now = Date.now();
  const expiredIds = (auth.users || [])
    .filter((user) => user.status === "pending" && (!user.verifyTokenExpiresAt || user.verifyTokenExpiresAt <= now))
    .map((user) => user.id);
  auth.users = (auth.users || []).filter((user) => !expiredIds.includes(user.id));
  auth.users.forEach((user) => {
    if (user.pendingEmailTokenExpiresAt && user.pendingEmailTokenExpiresAt <= now) {
      user.pendingEmail = null;
      user.pendingEmailToken = null;
      user.pendingEmailTokenExpiresAt = null;
    }
  });
  auth.sessions = (auth.sessions || []).filter((session) => session.expiresAt > now && auth.users.some((user) => user.id === session.userId));
  await saveAuth(auth);
  for (const userId of expiredIds) await removeUserOutputs(config.outputDir, userId).catch(() => {});
}

await initializeServerData();

const server = http.createServer((req, res) => {
  applySecurityHeaders(res, req);
  handleRequest(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) sendJson(res, error?.statusCode || 500, { ok: false, error: error?.message || "Internal server error." });
    else res.end();
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error("\n==================================================");
    console.error(`[오류] 포트 ${config.port}가 이미 사용 중입니다.`);
    console.error("이미 PromptDeck 서버가 백그라운드에서 실행 중이거나,");
    console.error(`다른 프로그램이 해당 포트(${config.port})를 점유하고 있을 수 있습니다.`);
    console.error("==================================================\n");
    process.exit(1);
  }
  throw error;
});

server.listen(config.port, config.host, () => {
  if (config.host === "::" || config.host === "0.0.0.0") {
    console.log(`PromptDeck local server listening on port ${config.port} (all interfaces)`);
    console.log(`  http://localhost:${config.port}`);
    console.log(`  http://127.0.0.1:${config.port}`);
  } else {
    console.log(`PromptDeck local server: http://${config.host}:${config.port}`);
  }
});

const retentionTimer = setInterval(() => {
  cleanupExpiredUserOutputs(config.outputDir, config.outputRetentionDays)
    .catch((error) => console.error("[privacy] 정기 보존기간 정리 실패:", error));
}, 24 * 60 * 60 * 1000);
retentionTimer.unref();

const authPruneTimer = setInterval(() => {
  if (config.authEnabled) {
    pruneExpiredAuthData().catch((error) => console.error("[privacy] 만료 계정·세션 정리 실패:", error));
  }
  mutateShortLinks(() => {}).catch((error) => console.error("[privacy] 만료 단축주소 정리 실패:", error));
}, 60 * 60 * 1000);
authPruneTimer.unref();
