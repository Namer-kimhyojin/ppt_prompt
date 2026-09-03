import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const repoRoot = path.resolve(import.meta.dirname, "..");
const adsenseSource = await fs.readFile(path.join(repoRoot, "src", "adsense.js"), "utf8");

class FakeElement {
  constructor(tagName) {
    this.tagName = String(tagName || "div").toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.style = {};
    this.hidden = false;
    this.removed = false;
    this.className = "";
    this.textContent = "";
    this.classList = {
      values: new Set(),
      add: (...names) => names.forEach((name) => this.classList.values.add(name)),
    };
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  remove() {
    this.removed = true;
    if (this.parentNode) {
      this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    }
  }
}

async function runScenario({
  runtimeSettings,
  fallback = { enabled: true, client: "", slots: ["", ""] },
  hostname = "promptdeck.test",
  protocol = "https:",
  mobile = false,
  search = "",
} = {}) {
  const band = new FakeElement("section");
  band.hidden = true;
  const containers = [new FakeElement("div"), new FakeElement("div")];
  containers.forEach((container) => band.appendChild(container));
  band.querySelectorAll = (selector) => selector === "[data-ad-position]" ? containers : [];

  const head = new FakeElement("head");
  const events = [];
  const document = {
    head,
    getElementById: (id) => id === "mainAdBand" ? band : null,
    createElement: (tagName) => new FakeElement(tagName),
    querySelector: (selector) => {
      if (!selector.includes("script")) return null;
      return head.children.find((element) => element.tagName === "SCRIPT"
        && (element.dataset.promptdeckAdsense === "true" || /pagead2\.googlesyndication\.com/u.test(element.src || ""))) || null;
    },
  };

  const window = {
    location: { hostname, protocol, search },
    matchMedia: () => ({ matches: mobile }),
    PROMPTDECK_ADSENSE: fallback,
    PromptDeckAdminSettingsReady: runtimeSettings === undefined ? undefined : Promise.resolve(runtimeSettings),
    CustomEvent: class CustomEvent {
      constructor(type, options) { this.type = type; this.detail = options?.detail; }
    },
    dispatchEvent: (event) => events.push(event),
  };
  const warnings = [];
  const context = {
    window,
    document,
    URLSearchParams,
    encodeURIComponent,
    console: { warn: (...args) => warnings.push(args) },
  };

  vm.runInNewContext(adsenseSource, context, { filename: "src/adsense.js" });
  await new Promise((resolve) => setImmediate(resolve));

  return {
    band,
    containers,
    events,
    scripts: head.children.filter((element) => element.tagName === "SCRIPT"),
    state: window.PROMPTDECK_ADSENSE_STATE,
    pushes: Array.isArray(window.adsbygoogle) ? window.adsbygoogle.length : 0,
    warnings,
  };
}

const client = "ca-pub-1234567890123456";

{
  const result = await runScenario({ runtimeSettings: { adsEnabled: false, adClient: client } });
  assert.equal(result.state.status, "disabled");
  assert.equal(result.scripts.length, 0);
  assert.equal(result.band.hidden, true);
}

{
  const result = await runScenario({ runtimeSettings: { adsEnabled: true, adClient: "" } });
  assert.equal(result.state.status, "incomplete");
  assert.equal(result.scripts.length, 0);
  assert.equal(result.band.hidden, true);
}

{
  const result = await runScenario({
    runtimeSettings: { adsEnabled: true, adClient: client, adSlotTop: "", adSlotBottom: "" },
  });
  assert.equal(result.state.status, "auto");
  assert.equal(result.state.source, "admin");
  assert.equal(result.scripts.length, 1);
  assert.match(result.scripts[0].src, /client=ca-pub-1234567890123456/u);
  assert.equal(result.band.hidden, true);
  assert.equal(result.pushes, 0);
}

{
  const result = await runScenario({
    runtimeSettings: {
      adsEnabled: true,
      adClient: client,
      adSlotTop: "1111111111",
      adSlotBottom: "2222222222",
    },
  });
  assert.equal(result.state.status, "manual");
  assert.equal(result.state.slotCount, 2);
  assert.equal(result.band.hidden, false);
  assert.equal(result.band.dataset.adCount, "2");
  assert.equal(result.containers[0].children[0].dataset.adSlot, "1111111111");
  assert.equal(result.containers[1].children[0].dataset.adSlot, "2222222222");
  assert.equal(result.pushes, 2);
}

{
  const result = await runScenario({
    mobile: true,
    runtimeSettings: {
      adsEnabled: true,
      adClient: client,
      adSlotTop: "1111111111",
      adSlotBottom: "2222222222",
    },
  });
  assert.equal(result.state.status, "manual");
  assert.equal(result.state.slotCount, 1);
  assert.equal(result.containers[0].children[0].dataset.adSlot, "1111111111");
  assert.equal(result.containers[1].removed, true);
  assert.equal(result.pushes, 1);
}

{
  const result = await runScenario({
    hostname: "localhost",
    runtimeSettings: { adsEnabled: true, adClient: client, adSlotTop: "1111111111" },
  });
  assert.equal(result.state.status, "local");
  assert.equal(result.scripts.length, 0);
}

{
  const result = await runScenario({
    fallback: { enabled: true, client, slots: ["3333333333", "4444444444"] },
  });
  assert.equal(result.state.source, "fallback");
  assert.equal(result.state.status, "manual");
  assert.equal(result.state.slotCount, 2);
}

{
  const result = await runScenario({ search: "?ad-preview=1" });
  assert.equal(result.band.dataset.adStatus, "preview");
  assert.equal(result.band.hidden, false);
  assert.equal(result.scripts.length, 0);
  assert.equal(result.containers[0].children[0].textContent, "광고 미리보기 1");
}

const [
  adminSettingsSource,
  adminSource,
  adminHtml,
  headers,
  routes,
  middleware,
  privacy,
  thirdPartyNotices,
  appHtml,
  homeHtml,
] = await Promise.all([
  fs.readFile(path.join(repoRoot, "src", "admin-settings.js"), "utf8"),
  fs.readFile(path.join(repoRoot, "src", "admin.js"), "utf8"),
  fs.readFile(path.join(repoRoot, "admin.html"), "utf8"),
  fs.readFile(path.join(repoRoot, "static-pages", "_headers"), "utf8"),
  fs.readFile(path.join(repoRoot, "static-pages", "_routes.json"), "utf8"),
  fs.readFile(path.join(repoRoot, "functions", "_middleware.js"), "utf8"),
  fs.readFile(path.join(repoRoot, "static-pages", "privacy.html"), "utf8"),
  fs.readFile(path.join(repoRoot, "static-pages", "third-party-notices.html"), "utf8"),
  fs.readFile(path.join(repoRoot, "index.html"), "utf8"),
  fs.readFile(path.join(repoRoot, "static-pages", "home.html"), "utf8"),
]);

assert.doesNotMatch(adminSettingsSource, /PROMPTDECK_ADS_CONSENT_GRANTED|adminAdBannerTop|adminAdBannerBottom/u);
assert.match(adminSource, /loadAdClientFromAdsTxt/u);
assert.match(adminSource, /광고를 활성화하려면 ca-pub-/u);
assert.match(adminHtml, /id="adminAdClientFromAdsTxt"/u);
assert.match(adminHtml, /Client ID를 저장하면 사이트 검토와 CMP·Auto ads용 Google 태그/u);
assert.doesNotMatch(headers, /! Content-Security-Policy/u);
assert.deepEqual(JSON.parse(routes).include.slice(0, 2), ["/app", "/app.html"]);
assert.match(middleware, /script-src 'nonce-\$\{nonce\}'.*'strict-dynamic'/u);
assert.match(middleware, /new HTMLRewriter\(\)/u);
assert.match(middleware, /PUBLIC_APP_PATHS = new Set\(\["\/app", "\/app\.html"\]\)/u);
assert.doesNotMatch(appHtml, /mainAdBand|src\/adsense(?:-config)?\.js|adsbygoogle/u);
assert.doesNotMatch(homeHtml, /mainAdBand|src\/adsense(?:-config)?\.js|adsbygoogle|pagead2\.googlesyndication\.com/u);
assert.match(privacy, /policies\.google\.com\/technologies\/partner-sites/u);
assert.match(thirdPartyNotices, /홈페이지·가이드·작업 앱은 Google 광고 태그와 광고 슬롯을 로드하지 않습니다/u);

console.log("AdSense separation smoke test passed: app and landing page contain no ad loader or slot.");
