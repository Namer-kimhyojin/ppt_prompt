import { json, readJson, sameOriginRequest } from "../../cloudflare/admin-auth.js";

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const MAX_PROMPT_LENGTH = 1200;
const MAX_REQUESTS_PER_IP_DAY = 8;
const MAX_REQUESTS_GLOBAL_DAY = 160;
const COUNTER_TTL_SECONDS = 2 * 24 * 60 * 60;
const GENERATED_IMAGE_TTL_SECONDS = 30 * 24 * 60 * 60;
const GENERATED_IMAGE_KEY_PREFIX = "ai:mixer:asset:v1:";
const GENERATED_IMAGE_ID_PATTERN = /^[a-f0-9]{32}$/u;

function imageResponse(bytes, type, extraHeaders = {}) {
  return new Response(bytes, { status: 200, headers: {
    "Cache-Control": "no-store",
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "X-PromptDeck-AI-Provider": "cloudflare-workers-ai",
    "X-Robots-Tag": "noindex, noimageindex",
    ...extraHeaders,
  } });
}

function decodeBase64(value) {
  const binary = atob(String(value || ""));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function detectImageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return "";
}

async function anonymousId(request) {
  const address = String(request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 128);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address)));
  return Array.from(digest.slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function reserveDailyRequest(request, env) {
  const kv = env && env.PROMPTDECK_ADMIN_KV;
  if (!kv || typeof kv.get !== "function" || typeof kv.put !== "function") return { ok: false, unavailable: true };
  const day = new Date().toISOString().slice(0, 10);
  const ipKey = `ai:mixer:ip:${day}:${await anonymousId(request)}`;
  const globalKey = `ai:mixer:global:${day}`;
  const [ipValue, globalValue] = await Promise.all([kv.get(ipKey), kv.get(globalKey)]);
  const ipCount = Math.max(0, Number.parseInt(ipValue || "0", 10) || 0);
  const globalCount = Math.max(0, Number.parseInt(globalValue || "0", 10) || 0);
  if (ipCount >= MAX_REQUESTS_PER_IP_DAY || globalCount >= MAX_REQUESTS_GLOBAL_DAY) return { ok: false, limited: true };
  await Promise.all([
    kv.put(ipKey, String(ipCount + 1), { expirationTtl: COUNTER_TTL_SECONDS }),
    kv.put(globalKey, String(globalCount + 1), { expirationTtl: COUNTER_TTL_SECONDS }),
  ]);
  return { ok: true };
}

function generatedImageStore(env) {
  const kv = env && env.PROMPTDECK_ADMIN_KV;
  return kv && typeof kv.put === "function" && typeof kv.getWithMetadata === "function" ? kv : null;
}

function generatedImageUrl(assetId) {
  return `/api/mixer-reference?asset=${assetId}`;
}

async function storeGeneratedImage(env, bytes, type) {
  const kv = generatedImageStore(env);
  if (!kv) throw new Error("IMAGE_STORAGE_UNAVAILABLE");
  const assetId = crypto.randomUUID().replaceAll("-", "").toLowerCase();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + GENERATED_IMAGE_TTL_SECONDS * 1000).toISOString();
  const value = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
    ? bytes.buffer
    : bytes.slice().buffer;
  await kv.put(`${GENERATED_IMAGE_KEY_PREFIX}${assetId}`, value, {
    expirationTtl: GENERATED_IMAGE_TTL_SECONDS,
    metadata: { type, createdAt, expiresAt },
  });
  return { assetId, expiresAt, url: generatedImageUrl(assetId) };
}

export async function onRequestGet(context) {
  const assetId = String(new URL(context.request.url).searchParams.get("asset") || "").toLowerCase();
  if (!GENERATED_IMAGE_ID_PATTERN.test(assetId)) return json({ ok: false, error: "저장 이미지 주소가 올바르지 않습니다." }, 400);
  const kv = generatedImageStore(context.env);
  if (!kv) return json({ ok: false, error: "이미지 저장소를 사용할 수 없습니다." }, 503);
  try {
    const stored = await kv.getWithMetadata(`${GENERATED_IMAGE_KEY_PREFIX}${assetId}`, { type: "arrayBuffer" });
    if (!stored || !stored.value) return json({ ok: false, error: "저장된 이미지를 찾을 수 없거나 보관기간이 끝났습니다." }, 404);
    const bytes = new Uint8Array(stored.value);
    const type = detectImageType(bytes);
    if (!type || !bytes.length || bytes.length > 8 * 1024 * 1024) return json({ ok: false, error: "저장 이미지 형식이 올바르지 않습니다." }, 500);
    return imageResponse(stored.value, type, {
      "Cache-Control": "private, max-age=300",
      "X-PromptDeck-Storage": "cloudflare-kv",
    });
  } catch (error) {
    console.error("Workers AI mixer storage read failed:", String(error && error.message || "").slice(0, 400));
    return json({ ok: false, error: "저장된 이미지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." }, 503);
  }
}

export async function onRequestPost(context) {
  if (!sameOriginRequest(context.request)) return json({ ok: false, error: "허용되지 않은 요청입니다." }, 403);
  let body;
  try { body = await readJson(context.request, 8 * 1024); }
  catch { return json({ ok: false, error: "요청 형식이 올바르지 않습니다." }, 400); }
  const prompt = String(body.prompt || "").replace(/[\u0000-\u001F\u007F]/gu, " ").replace(/\s+/gu, " ").trim();
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) return json({ ok: false, error: `프롬프트는 1~${MAX_PROMPT_LENGTH}자로 입력해 주세요.` }, 400);
  if (body.privacyConfirmed !== true) return json({ ok: false, error: "외부 AI 전송 확인이 필요합니다." }, 400);
  if (!context.env?.AI || typeof context.env.AI.run !== "function") return json({ ok: false, error: "무료 이미지 생성 기능을 준비하지 못했습니다." }, 503);

  let reservation;
  try { reservation = await reserveDailyRequest(context.request, context.env); }
  catch { return json({ ok: false, error: "무료 생성 한도를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 503); }
  if (!reservation.ok) return json({ ok: false, error: reservation.limited
    ? "오늘의 무료 이미지 생성 한도를 사용했습니다. 내일 다시 이용하거나 파일·클립보드 가져오기를 사용해 주세요."
    : "무료 이미지 생성 기능을 준비하지 못했습니다." }, reservation.limited ? 429 : 503);

  try {
    const result = await context.env.AI.run(MODEL, { prompt, steps: 4 });
    const bytes = decodeBase64(result && result.image);
    const type = detectImageType(bytes);
    if (!type || bytes.length === 0 || bytes.length > 8 * 1024 * 1024) throw new Error("INVALID_IMAGE");
    let saved;
    try { saved = await storeGeneratedImage(context.env, bytes, type); }
    catch (error) {
      console.error("Workers AI mixer storage write failed:", String(error && error.message || "").slice(0, 400));
      return json({ ok: false, error: "이미지는 생성됐지만 서버 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }, 503);
    }
    return imageResponse(bytes, type, {
      "X-PromptDeck-Saved-Url": saved.url,
      "X-PromptDeck-Storage": "cloudflare-kv",
      "X-PromptDeck-Expires-At": saved.expiresAt,
    });
  } catch (error) {
    const message = String(error && error.message || "").toLowerCase();
    console.error("Workers AI mixer generation failed:", message.slice(0, 400));
    if (/quota|limit|neuron|exceed|billing/u.test(message)) return json({ ok: false, error: "Cloudflare의 오늘 무료 AI 제공량을 사용했습니다. 내일 다시 이용해 주세요." }, 429);
    return json({ ok: false, error: "이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." }, 502);
  }
}
