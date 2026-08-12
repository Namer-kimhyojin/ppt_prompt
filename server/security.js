import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export const SESSION_COOKIE_NAME = "promptdeck_session";
export const ADMIN_SESSION_COOKIE_NAME = "promptdeck_admin_session";
export const PASSWORD_MIN_LENGTH = 12;

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;

function fixedTimeEqualHex(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right) || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function validatePassword(password, { username = "", email = "" } = {}) {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  }
  if (password.length > 128) return "비밀번호는 128자 이하여야 합니다.";

  const categories = [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)]
    .filter(Boolean).length;
  if (categories < 3) return "비밀번호에는 영문 대·소문자, 숫자, 특수문자 중 3종류 이상을 사용하세요.";

  const lowered = password.toLocaleLowerCase("en-US");
  const userPart = String(username || "").trim().toLocaleLowerCase("en-US");
  const emailPart = String(email || "").split("@")[0].trim().toLocaleLowerCase("en-US");
  if ((userPart.length >= 4 && lowered.includes(userPart)) || (emailPart.length >= 4 && lowered.includes(emailPart))) {
    return "비밀번호에 아이디나 이메일 주소를 포함할 수 없습니다.";
  }
  return "";
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  }).toString("hex");
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived}`;
}

export function hashSessionToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

export function verifyPassword(password, encoded) {
  if (typeof password !== "string" || typeof encoded !== "string") return { ok: false, needsRehash: false };

  if (encoded.startsWith("scrypt$")) {
    const parts = encoded.split("$");
    if (parts.length !== 6) return { ok: false, needsRehash: false };
    const [, nText, rText, pText, salt, expected] = parts;
    const N = Number(nText);
    const r = Number(rText);
    const p = Number(pText);
    if (!Number.isSafeInteger(N) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p) || !salt || !expected) {
      return { ok: false, needsRehash: false };
    }
    try {
      const actual = scryptSync(password, salt, expected.length / 2, {
        N,
        r,
        p,
        maxmem: 64 * 1024 * 1024,
      }).toString("hex");
      return {
        ok: fixedTimeEqualHex(actual, expected),
        needsRehash: N !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P,
      };
    } catch {
      return { ok: false, needsRehash: false };
    }
  }

  // 이전 버전의 단순 SHA-256 해시는 로그인 성공 시 scrypt로 즉시 마이그레이션한다.
  if (/^[a-f0-9]{64}$/i.test(encoded)) {
    const legacy = createHash("sha256").update(password).digest("hex");
    return { ok: fixedTimeEqualHex(legacy, encoded), needsRehash: true };
  }

  return { ok: false, needsRehash: false };
}

export function parseCookies(headerValue = "") {
  const cookies = {};
  String(headerValue).split(";").forEach((part) => {
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

export function getSessionToken(req) {
  return parseCookies(req.headers.cookie || "")[SESSION_COOKIE_NAME] || "";
}

export function getAdminSessionToken(req) {
  return parseCookies(req.headers.cookie || "")[ADMIN_SESSION_COOKIE_NAME] || "";
}

function isSecureRequest(req, forceSecure = false) {
  if (forceSecure || req.socket?.encrypted) return true;
  const forwarded = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
  return forwarded === "https";
}

export function sessionCookie(req, token, maxAgeSeconds, forceSecure = false) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];
  if (isSecureRequest(req, forceSecure)) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(req, forceSecure = false) {
  return sessionCookie(req, "", 0, forceSecure);
}

export function adminSessionCookie(req, token, maxAgeSeconds, forceSecure = false) {
  const parts = [
    `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];
  if (isSecureRequest(req, forceSecure)) parts.push("Secure");
  return parts.join("; ");
}

export function clearAdminSessionCookie(req, forceSecure = false) {
  return adminSessionCookie(req, "", 0, forceSecure);
}

export function getClientIp(req, trustProxy = false) {
  if (trustProxy) {
    const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (forwarded) return forwarded.slice(0, 128);
  }
  return String(req.socket?.remoteAddress || "unknown").slice(0, 128);
}

export function sameOriginRequest(req, trustProxy = false) {
  const method = String(req.method || "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const forwardedHost = trustProxy ? String(req.headers["x-forwarded-host"] || "").split(",")[0].trim() : "";
    const requestHost = forwardedHost || String(req.headers.host || "").trim();
    return originUrl.host === requestHost;
  } catch {
    return false;
  }
}

export function createRateLimiter() {
  const buckets = new Map();
  let lastSweep = 0;

  const consume = function consume(key, limit, windowMs) {
    const now = Date.now();
    if (now - lastSweep > 60_000) {
      lastSweep = now;
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey);
      }
    }

    const existing = buckets.get(key);
    const bucket = !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;
    bucket.count += 1;
    buckets.set(key, bucket);
    return {
      ok: bucket.count <= limit,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  };

  consume.reset = function reset(key) {
    if (!key) return false;
    return buckets.delete(key);
  };

  return consume;
}

export function applySecurityHeaders(res, req) {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "font-src 'self' data:",
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (isSecureRequest(req)) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

export function detectSensitivePrompt(value) {
  const text = String(value || "");
  const checks = [
    { label: "이메일 주소", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
    { label: "주민등록번호 형식", pattern: /\b\d{6}\s*-\s*[1-8]\d{6}\b/ },
    { label: "휴대전화번호 형식", pattern: /(?:^|\D)01[016789][ -]?\d{3,4}[ -]?\d{4}(?:\D|$)/ },
    { label: "카드번호 형식", pattern: /(?:^|\D)(?:\d[ -]?){15,16}(?:\D|$)/ },
  ];
  return checks.find((item) => item.pattern.test(text))?.label || "";
}

export function sniffSupportedImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: "png", mimeType: "image/png" };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mimeType: "image/jpeg" };
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return { ext: "webp", mimeType: "image/webp" };
  }
  return null;
}
