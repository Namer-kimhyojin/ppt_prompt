import {
  ADMIN_SESSION_SECONDS,
  adminSessionCookie,
  clearFailedAdminAttempts,
  createAdminSession,
  isAdminConfigured,
  json,
  readJson,
  recordFailedAdminAttempt,
  sameOriginRequest,
  saveAdminPassword,
  validateAdminAccessKey,
  verifyAdminPassword,
  verifyAdminSession,
} from "../../../cloudflare/admin-auth.js";

export async function onRequestGet(context) {
  const [enabled, session] = await Promise.all([
    isAdminConfigured(context.env),
    verifyAdminSession(context.request, context.env),
  ]);
  return json({ ok: true, enabled, authenticated: !!session });
}

export async function onRequestPost(context) {
  if (!sameOriginRequest(context.request)) return json({ ok: false, error: "Invalid request origin." }, 403);
  let body;
  try { body = await readJson(context.request, 16 * 1024); }
  catch (error) {
    return json({ ok: false, error: error.message === "PAYLOAD_TOO_LARGE" ? "Request is too large." : "Invalid JSON body." }, 400);
  }

  const isUpdate = ["currentAccessKey", "newAccessKey", "confirmAccessKey"].some((key) => Object.hasOwn(body, key));
  if (isUpdate) {
    const session = await verifyAdminSession(context.request, context.env);
    if (!session) return json({ ok: false, error: "Admin only." }, 403);
    if (body.newAccessKey !== body.confirmAccessKey) return json({ ok: false, error: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다." }, 400);
    const validationError = validateAdminAccessKey(body.newAccessKey);
    if (validationError) return json({ ok: false, error: validationError }, 400);
    const current = await verifyAdminPassword(body.currentAccessKey, context.env);
    if (!current.ok) return json({ ok: false, error: "The administrator access key is incorrect." }, 401);
    try {
      const credential = await saveAdminPassword(body.newAccessKey, context.env, current.version);
      const token = await createAdminSession(context.env, credential.version);
      return json(
        { ok: true, expiresAt: Date.now() + ADMIN_SESSION_SECONDS * 1000 },
        200,
        { "Set-Cookie": adminSessionCookie(context.request, token) },
      );
    } catch {
      return json({ ok: false, error: "관리자 비밀번호를 저장하지 못했습니다." }, 503);
    }
  }

  if (!(await isAdminConfigured(context.env))) {
    return json({ ok: false, error: "Administrator mode is not configured." }, 404);
  }
  const verified = await verifyAdminPassword(body.accessKey, context.env);
  if (!verified.ok) {
    const limit = await recordFailedAdminAttempt(context.request, context.env);
    if (limit.limited) {
      return json(
        { ok: false, error: "Too many administrator access attempts." },
        429,
        { "Retry-After": String(limit.retryAfterSeconds) },
      );
    }
    return json({ ok: false, error: "The administrator access key is incorrect." }, 401);
  }

  await clearFailedAdminAttempts(context.request, context.env);
  try {
    const token = await createAdminSession(context.env, verified.version);
    return json(
      { ok: true, expiresAt: Date.now() + ADMIN_SESSION_SECONDS * 1000 },
      200,
      { "Set-Cookie": adminSessionCookie(context.request, token) },
    );
  } catch {
    return json({ ok: false, error: "Administrator session is not configured." }, 503);
  }
}
