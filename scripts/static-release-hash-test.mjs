import assert from "node:assert/strict";
import { releaseAssetHash } from "./deploy-static-release.mjs";

const encode = (email, key) => Buffer.from([key, ...Buffer.from(email).map((byte) => byte ^ key)]).toString("hex");
const hash = (file, text) => releaseAssetHash(file, Buffer.from(text));
const email = "editor@example.com";
const link = `<a href="mailto:${email}">${email}</a>`;
const protectedLink = `<a href="/cdn-cgi/l/email-protection#${encode(email, 31)}"><span class="__cf_email__" data-cfemail="${encode(email, 56)}">[email&#160;protected]</span></a>`;
const protectedText = `<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="${encode(email, 86)}">[email&#160;protected]</a>`;
const decoder = '<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>';
for (const file of ["about.html", "ai-policy.html", "privacy.html"]) {
  assert.equal(hash(file, link + `<code>${email}</code>`), hash(file, protectedLink + `<code>${protectedText}</code>` + decoder));
  assert.notEqual(hash(file, link), hash(file, protectedLink + "changed content" + decoder));
  assert.notEqual(hash(file, link), hash(file, protectedLink + decoder + '<script src="/extra.js"></script>'));
  assert.throws(() => hash(file, protectedLink), /decoder count/);
  assert.throws(() => hash(file, protectedLink.replace(encode(email, 56), encode("wrong@example.com", 56)) + decoder), /disagree/);
}
assert.notEqual(hash("index.html", link), hash("index.html", protectedLink + decoder));
assert.equal(hash("app.html", '<script src="app.js"></script>'), hash("app.html", '<script nonce="1234" src="app.js"></script>'));
console.log("Release hash checks passed: only recognized contact obfuscation is reversed; content changes, unexpected scripts, missing decoder and mismatched addresses fail.");
