const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const ADMIN_COOKIE_NAME = "promptdeck_admin_session";
export const ADMIN_SESSION_SECONDS = 4 * 60 * 60;
export const ADMIN_CREDENTIAL_KEY = "admin:credential:v1";
export const ADMIN_SETTINGS_KEY = "admin:settings:v1";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const PBKDF2_ITERATIONS = 210_000;
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_SECONDS = 15 * 60;

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function fromBase64Url(value) {
  const normalized = String(value || "").replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function safeBytesEqual(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array) || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function sha256(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", textEncoder.encode(String(value || ""))));
}

async function hmacKey(secret, usages) {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(String(secret || "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}

async function signValue(value, secret) {
  const key = await hmacKey(secret, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, textEncoder.encode(value)));
}

async function verifyValue(value, signature, secret) {
  try {
    const key = await hmacKey(secret, ["verify"]);
    return crypto.subtle.verify("HMAC", key, signature, textEncoder.encode(value));
  } catch {
    return false;
  }
}

export function normalizeAdminAccessInput(rawValue) {
  return String(rawValue || "")
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/gu, "")
    .replace(/\u00A0/gu, "")
    .replace(/[\u0000-\u001F\u007F]/gu, "")
    .trim();
}

export function validateAdminAccessKey(rawValue) {
  const accessKey = normalizeAdminAccessInput(rawValue);
  if (accessKey.length < PASSWORD_MIN_LENGTH) return `관리자 모드 비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  if (accessKey.length > PASSWORD_MAX_LENGTH) return `관리자 모드 비밀번호는 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`;
  return "";
}

export function json(data, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  return new Response(JSON.stringify(data), { status, headers });
}

export async function readJson(request, maxBytes = 256 * 1024) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  const text = await request.text();
  if (textEncoder.encode(text).length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  if (!text.trim()) return {};
  const value = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_JSON_OBJECT");
  return value;
}

export function sameOriginRequest(request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return true;
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}

function parseCookies(request) {
  const cookies = {};
  String(request.headers.get("cookie") || "").split(";").forEach((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!key) return;
    try { cookies[key] = decodeURIComponent(value); }
    catch { cookies[key] = value; }
  });
  return cookies;
}

function adminKv(env) {
  return env && env.PROMPTDECK_ADMIN_KV && typeof env.PROMPTDECK_ADMIN_KV.get === "function"
    ? env.PROMPTDECK_ADMIN_KV
    : null;
}

export async function readCredential(env) {
  const kv = adminKv(env);
  if (!kv) return null;
  try {
    const record = await kv.get(ADMIN_CREDENTIAL_KEY, { type: "json" });
    if (!record || record.algorithm !== "PBKDF2-SHA-256" || !record.salt || !record.hash) return null;
    return {
      algorithm: record.algorithm,
      iterations: Number(record.iterations) || PBKDF2_ITERATIONS,
      salt: String(record.salt),
      hash: String(record.hash),
      version: Number(record.version) || 1,
    };
  } catch {
    return null;
  }
}

async function derivePasswordHash(password, salt, iterations = PBKDF2_ITERATIONS) {
  const material = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    256,
  );
  return new Uint8Array(bits);
}

async function verifyStoredPassword(password, credential) {
  try {
    const salt = fromBase64Url(credential.salt);
    const expected = fromBase64Url(credential.hash);
    const actual = await derivePasswordHash(password, salt, credential.iterations);
    return safeBytesEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function verifyAdminPassword(rawValue, env) {
  const accessKey = normalizeAdminAccessInput(rawValue);
  const credential = await readCredential(env);
  if (credential) return { ok: await verifyStoredPassword(accessKey, credential), version: credential.version };
  const configured = normalizeAdminAccessInput(env && env.PROMPTDECK_ADMIN_ACCESS_KEY);
  if (!configured || configured.length < PASSWORD_MIN_LENGTH) return { ok: false, version: 0 };
  const [actual, expected] = await Promise.all([sha256(accessKey), sha256(configured)]);
  return { ok: safeBytesEqual(actual, expected), version: 0 };
}

export async function saveAdminPassword(rawValue, env, previousVersion = 0) {
  const kv = adminKv(env);
  if (!kv) throw new Error("ADMIN_KV_UNAVAILABLE");
  const accessKey = normalizeAdminAccessInput(rawValue);
  const validationError = validateAdminAccessKey(accessKey);
  if (validationError) throw new Error(validationError);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePasswordHash(accessKey, salt);
  const credential = {
    algorithm: "PBKDF2-SHA-256",
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64Url(salt),
    hash: toBase64Url(derived),
    version: Math.max(1, Number(previousVersion) + 1),
    updatedAt: new Date().toISOString(),
  };
  await kv.put(ADMIN_CREDENTIAL_KEY, JSON.stringify(credential));
  return credential;
}

export async function isAdminConfigured(env) {
  const credential = await readCredential(env);
  if (credential) return true;
  return normalizeAdminAccessInput(env && env.PROMPTDECK_ADMIN_ACCESS_KEY).length >= PASSWORD_MIN_LENGTH;
}

export async function createAdminSession(env, credentialVersion = 0) {
  const secret = String(env && env.PROMPTDECK_ADMIN_SESSION_SECRET || "");
  if (secret.length < 32) throw new Error("ADMIN_SESSION_SECRET_UNAVAILABLE");
  const payload = {
    version: 1,
    credentialVersion: Number(credentialVersion) || 0,
    expiresAt: Date.now() + ADMIN_SESSION_SECONDS * 1000,
  };
  const encoded = toBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const signature = toBase64Url(await signValue(encoded, secret));
  return `${encoded}.${signature}`;
}

export async function verifyAdminSession(request, env) {
  const token = parseCookies(request)[ADMIN_COOKIE_NAME] || "";
  const [encoded, encodedSignature, extra] = token.split(".");
  if (!encoded || !encodedSignature || extra !== undefined) return null;
  const secret = String(env && env.PROMPTDECK_ADMIN_SESSION_SECRET || "");
  if (secret.length < 32) return null;
  const verified = await verifyValue(encoded, fromBase64Url(encodedSignature), secret);
  if (!verified) return null;
  try {
    const payload = JSON.parse(textDecoder.decode(fromBase64Url(encoded)));
    if (payload.version !== 1 || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
    const credential = await readCredential(env);
    const currentVersion = credential ? credential.version : 0;
    if ((Number(payload.credentialVersion) || 0) !== currentVersion) return null;
    return payload;
  } catch {
    return null;
  }
}

export function adminSessionCookie(request, token, maxAgeSeconds = ADMIN_SESSION_SECONDS) {
  const secure = new URL(request.url).protocol === "https:";
  return [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

export function clearAdminSessionCookie(request) {
  return adminSessionCookie(request, "", 0);
}

async function rateLimitKey(request) {
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  return `admin:rate:${toBase64Url(await sha256(String(address).slice(0, 128)))}`;
}

export async function recordFailedAdminAttempt(request, env) {
  const kv = adminKv(env);
  if (!kv) return { limited: false, retryAfterSeconds: 0 };
  const key = await rateLimitKey(request);
  const now = Date.now();
  let state = null;
  try { state = await kv.get(key, { type: "json" }); } catch {}
  if (!state || !Number.isFinite(state.resetAt) || state.resetAt <= now) {
    state = { count: 0, resetAt: now + RATE_LIMIT_SECONDS * 1000 };
  }
  state.count = Number(state.count || 0) + 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((state.resetAt - now) / 1000));
  await kv.put(key, JSON.stringify(state), { expirationTtl: retryAfterSeconds });
  return { limited: state.count > RATE_LIMIT_ATTEMPTS, retryAfterSeconds };
}

export async function clearFailedAdminAttempts(request, env) {
  const kv = adminKv(env);
  if (!kv) return;
  try { await kv.delete(await rateLimitKey(request)); } catch {}
}

export async function readAdminSettings(env) {
  const kv = adminKv(env);
  if (!kv) return {};
  try {
    const settings = await kv.get(ADMIN_SETTINGS_KEY, { type: "json" });
    return settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {};
  } catch {
    return {};
  }
}

export async function writeAdminSettings(env, settings) {
  const kv = adminKv(env);
  if (!kv) throw new Error("ADMIN_KV_UNAVAILABLE");
  await kv.put(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
}
