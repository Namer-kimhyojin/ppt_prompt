import {
  clearAdminSessionCookie,
  json,
  sameOriginRequest,
} from "../../../cloudflare/admin-auth.js";

export async function onRequestPost(context) {
  if (!sameOriginRequest(context.request)) return json({ ok: false, error: "Invalid request origin." }, 403);
  return json({ ok: true }, 200, { "Set-Cookie": clearAdminSessionCookie(context.request) });
}
