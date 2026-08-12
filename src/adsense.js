(() => {
  "use strict";

  const band = document.getElementById("mainAdBand");
  if (!band) return;

  const containers = Array.from(band.querySelectorAll("[data-ad-position]"));
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const requestedCount = isMobile ? 1 : 2;
  const previewMode = new URLSearchParams(window.location.search).get("ad-preview") === "1";
  const isLocalPage = window.location.protocol === "file:"
    || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

  function useContainers(count, status) {
    containers.forEach((container, index) => {
      if (index >= count) container.remove();
    });
    band.dataset.adCount = String(count);
    band.dataset.adStatus = status;
    band.hidden = count === 0;
    return containers.slice(0, count);
  }

  if (previewMode) {
    band.classList.add("is-preview");
    useContainers(requestedCount, "preview").forEach((container, index) => {
      const preview = document.createElement("span");
      preview.className = "main-ad-preview";
      preview.textContent = "\uAD11\uACE0 \uBBF8\uB9AC\uBCF4\uAE30 " + (index + 1);
      container.appendChild(preview);
    });
    return;
  }

  function hasOwn(object, key) {
    return !!object && Object.prototype.hasOwnProperty.call(object, key);
  }

  function resolveConfig(runtimeSettings) {
    const fallback = window.PROMPTDECK_ADSENSE || {};
    const hasRuntimeConfig = ["adsEnabled", "adClient", "adSlotTop", "adSlotBottom"]
      .some((key) => hasOwn(runtimeSettings, key));
    const fallbackSlots = Array.isArray(fallback.slots) ? fallback.slots : [];
    return {
      enabled: hasRuntimeConfig ? runtimeSettings.adsEnabled === true : fallback.enabled !== false,
      client: String(hasRuntimeConfig ? runtimeSettings.adClient || "" : fallback.client || "").trim(),
      slots: (hasRuntimeConfig
        ? [runtimeSettings.adSlotTop, runtimeSettings.adSlotBottom]
        : fallbackSlots
      ).map((slot) => String(slot || "").trim()).slice(0, 2),
      source: hasRuntimeConfig ? "admin" : "fallback",
    };
  }

  function publishState(status, config, slotCount) {
    const state = Object.freeze({
      status,
      source: config.source,
      clientConfigured: /^ca-pub-\d{6,32}$/.test(config.client),
      slotCount,
    });
    window.PROMPTDECK_ADSENSE_STATE = state;
    if (typeof window.CustomEvent === "function" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new window.CustomEvent("promptdeck:adsense-state", { detail: state }));
    }
  }

  function ensureLoader(client) {
    let loader = document.querySelector(
      'script[data-promptdeck-adsense], script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );
    if (loader) return loader;
    loader = document.createElement("script");
    loader.async = true;
    loader.crossOrigin = "anonymous";
    loader.dataset.promptdeckAdsense = "true";
    loader.dataset.adClient = client;
    loader.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    document.head.appendChild(loader);
    return loader;
  }

  async function initialize() {
    let runtimeSettings = null;
    try {
      if (window.PromptDeckAdminSettingsReady
        && typeof window.PromptDeckAdminSettingsReady.then === "function") {
        runtimeSettings = await window.PromptDeckAdminSettingsReady;
      }
    } catch {
      runtimeSettings = null;
    }

    const config = resolveConfig(runtimeSettings);
    if (isLocalPage) {
      useContainers(0, "local");
      publishState("local", config, 0);
      return;
    }
    if (!config.enabled) {
      useContainers(0, "disabled");
      publishState("disabled", config, 0);
      return;
    }
    if (!/^ca-pub-\d{6,32}$/.test(config.client)) {
      useContainers(0, "incomplete");
      publishState("incomplete", config, 0);
      return;
    }

    // The current AdSense tag is also how Google's certified CMP message is delivered.
    // Load it once the administrator enables ads; Google applies the CMP/TCF consent signal.
    ensureLoader(config.client);

    const activeSlots = config.slots
      .slice(0, requestedCount)
      .filter((slot) => /^\d{4,32}$/.test(slot));
    const status = activeSlots.length ? "manual" : "auto";
    const activeContainers = useContainers(activeSlots.length, status);

    window.adsbygoogle = window.adsbygoogle || [];
    activeContainers.forEach((container, index) => {
      const ad = document.createElement("ins");
      ad.className = "adsbygoogle";
      ad.style.display = "block";
      ad.dataset.adClient = config.client;
      ad.dataset.adSlot = activeSlots[index];
      ad.dataset.adFormat = "horizontal";
      ad.dataset.fullWidthResponsive = "true";
      container.appendChild(ad);

      try {
        window.adsbygoogle.push({});
      } catch (error) {
        console.warn("PromptDeck could not initialize an AdSense slot.", error);
      }
    });
    publishState(status, config, activeSlots.length);
  }

  initialize();
})();
