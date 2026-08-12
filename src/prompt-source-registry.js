// 탭별 이미지 생성 프롬프트를 공통 형식으로 연결한다.
(function () {
  "use strict";

  const sources = new Map();

  function cleanIds(values) {
    return [...new Set((Array.isArray(values) ? values : [values])
      .map((value) => String(value || "").trim())
      .filter(Boolean))];
  }

  function register(key, source) {
    const id = String(key || "").trim();
    if (!id || !source || typeof source.getPrompt !== "function") {
      throw new TypeError("프롬프트 소스에는 key와 getPrompt 함수가 필요합니다.");
    }
    const normalized = {
      ...source,
      key: id,
      tabIds: cleanIds(source.tabIds),
      paneIds: cleanIds(source.paneIds),
    };
    sources.set(id, normalized);
    return () => {
      if (sources.get(id) === normalized) sources.delete(id);
    };
  }

  function get(key) {
    return sources.get(String(key || "").trim()) || null;
  }

  function resolve(context = {}) {
    const tabId = String(context.tabId || "").trim();
    const paneId = String(context.paneId || "").trim();
    return [...sources.values()].find((source) => (
      (tabId && source.tabIds.includes(tabId))
      || (paneId && source.paneIds.includes(paneId))
    )) || null;
  }

  function list() {
    return [...sources.values()].map(({ key, tabIds, paneIds }) => ({ key, tabIds: [...tabIds], paneIds: [...paneIds] }));
  }

  window.PromptDeckPromptSources = Object.freeze({ register, get, resolve, list });
})();
