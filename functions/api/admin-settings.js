import {
  json,
  readAdminSettings,
  readJson,
  sameOriginRequest,
  verifyAdminSession,
  writeAdminSettings,
} from "../../cloudflare/admin-auth.js";

function cleanText(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001F\u007F]/gu, "").trim().slice(0, maxLength);
}

function cleanStringArray(value, maxItems = 100) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((item) => cleanText(item, 80)).filter(Boolean);
}

function cleanStringMap(value, maxItems = 100) {
  const output = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return output;
  Object.entries(value).slice(0, maxItems).forEach(([key, item]) => {
    const cleanKey = cleanText(key, 80);
    const cleanValue = cleanText(item, 100);
    if (cleanKey && cleanValue) output[cleanKey] = cleanValue;
  });
  return output;
}

function cleanTabs(value) {
  const output = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return output;
  Object.entries(value).slice(0, 100).forEach(([key, item]) => {
    const cleanKey = cleanText(key, 80);
    if (!cleanKey) return;
    if (typeof item === "boolean") output[cleanKey] = item;
    else if (item && typeof item === "object" && !Array.isArray(item)) {
      output[cleanKey] = { visible: item.visible !== false, requireAuth: item.requireAuth === true };
    }
  });
  return output;
}

function sanitizeSettings(body, current) {
  const next = { ...current };
  delete next.pollinationsPublicKey;
  if (Object.hasOwn(body, "programName")) next.programName = cleanText(body.programName, 80);
  if (Object.hasOwn(body, "programSubtitle")) next.programSubtitle = cleanText(body.programSubtitle, 160);
  if (Object.hasOwn(body, "tabOrder")) next.tabOrder = cleanStringArray(body.tabOrder);
  if (Object.hasOwn(body, "tabLabels")) next.tabLabels = cleanStringMap(body.tabLabels);
  if (Object.hasOwn(body, "tabGroups")) next.tabGroups = cleanStringMap(body.tabGroups);
  if (Object.hasOwn(body, "tabs")) next.tabs = cleanTabs(body.tabs);
  if (Object.hasOwn(body, "defaultTab")) next.defaultTab = cleanText(body.defaultTab, 80);
  if (Object.hasOwn(body, "adsEnabled")) next.adsEnabled = body.adsEnabled === true;
  if (Object.hasOwn(body, "adClient")) {
    const value = cleanText(body.adClient, 48);
    next.adClient = /^ca-pub-\d{6,32}$/u.test(value) ? value : "";
  }
  for (const key of ["adSlotTop", "adSlotBottom"]) {
    if (!Object.hasOwn(body, key)) continue;
    const value = cleanText(body[key], 32);
    next[key] = /^\d{4,32}$/u.test(value) ? value : "";
  }
  return next;
}

export async function onRequestGet(context) {
  const settings = await readAdminSettings(context.env);
  const safeSettings = { ...settings };
  delete safeSettings.pollinationsPublicKey;
  return json({ ok: true, ...safeSettings, hasUnsplashKey: false });
}

export async function onRequestPost(context) {
  if (!sameOriginRequest(context.request)) return json({ ok: false, error: "Invalid request origin." }, 403);
  const session = await verifyAdminSession(context.request, context.env);
  if (!session) return json({ ok: false, error: "Admin only." }, 403);
  let body;
  try { body = await readJson(context.request); }
  catch (error) {
    return json({ ok: false, error: error.message === "PAYLOAD_TOO_LARGE" ? "Request is too large." : "Invalid JSON body." }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ ok: false, error: "Invalid JSON body." }, 400);
  if (Object.hasOwn(body, "pollinationsPublicKey")) {
    return json({ ok: false, error: "Pollinations 키 설정은 더 이상 사용하지 않습니다." }, 400);
  }
  try {
    const current = await readAdminSettings(context.env);
    await writeAdminSettings(context.env, sanitizeSettings(body, current));
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "관리자 설정을 저장하지 못했습니다." }, 503);
  }
}
