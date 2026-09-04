import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/mixer-reference.js";

const pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+Xc1mAAAAAElFTkSuQmCC";

function createKv() {
  const values = new Map();
  return {
    values,
    async get(key) { return values.get(key) || null; },
    async put(key, value) { values.set(key, String(value)); },
  };
}

function request(body, options = {}) {
  const origin = "https://promptdeck.test";
  return new Request(`${origin}/api/mixer-reference`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: options.origin || origin,
      "cf-connecting-ip": options.ip || "203.0.113.1",
    },
    body: JSON.stringify(body),
  });
}

function environment(overrides = {}) {
  const calls = [];
  return {
    calls,
    PROMPTDECK_ADMIN_KV: createKv(),
    AI: { async run(model, input) { calls.push({ model, input }); return { image: pixel }; } },
    ...overrides,
  };
}

let env = environment();
let response = await onRequestPost({ request: request({ prompt: "steel rolling mill", privacyConfirmed: true }), env });
assert.equal(response.status, 200);
assert.equal(response.headers.get("content-type"), "image/png");
assert.equal(response.headers.get("cache-control"), "no-store");
assert.equal(response.headers.get("x-promptdeck-ai-provider"), "cloudflare-workers-ai");
assert.equal(env.calls.length, 1);
assert.equal(env.calls[0].model, "@cf/black-forest-labs/flux-1-schnell");
assert.deepEqual(Object.keys(env.calls[0].input).sort(), ["prompt", "steps"]);
assert.equal(env.calls[0].input.steps, 4);

response = await onRequestPost({ request: request({ prompt: "x", privacyConfirmed: true }, { origin: "https://attacker.test" }), env });
assert.equal(response.status, 403);
assert.equal(env.calls.length, 1);
response = await onRequestPost({ request: request({ prompt: "", privacyConfirmed: true }), env });
assert.equal(response.status, 400);
response = await onRequestPost({ request: request({ prompt: "x", privacyConfirmed: false }), env });
assert.equal(response.status, 400);

env = environment();
for (let index = 0; index < 8; index += 1) {
  response = await onRequestPost({ request: request({ prompt: `test ${index}`, privacyConfirmed: true }), env });
  assert.equal(response.status, 200);
}
response = await onRequestPost({ request: request({ prompt: "limited", privacyConfirmed: true }), env });
assert.equal(response.status, 429);
assert.match((await response.json()).error, /오늘의 무료 이미지 생성 한도/u);
assert.equal(env.calls.length, 8);

env = environment({ PROMPTDECK_ADMIN_KV: null });
response = await onRequestPost({ request: request({ prompt: "test", privacyConfirmed: true }), env });
assert.equal(response.status, 503);
assert.equal(env.calls.length, 0);

env = environment({ AI: { async run() { return { image: btoa("not an image") }; } } });
response = await onRequestPost({ request: request({ prompt: "test", privacyConfirmed: true }), env });
assert.equal(response.status, 502);

console.log("PASS Workers AI mixer API: origin, consent, validation, image, daily limit and fail-closed behavior");
