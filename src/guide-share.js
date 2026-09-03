(() => {
  const buttons = Array.from(document.querySelectorAll("[data-share-page]"));
  if (!buttons.length) return;

  const shareData = {
    title: document.title,
    text: document.querySelector('meta[name="description"]')?.content || document.title,
    url: window.location.href.split("#")[0],
  };

  const copyWithFallback = async (value) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // 권한이 제한된 내장 브라우저에서는 아래 호환 경로를 사용한다.
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();
    return copied;
  };

  const closeAllPanels = (except = null) => {
    document.querySelectorAll("[data-share-panel]").forEach((panel) => {
      if (panel === except) return;
      panel.hidden = true;
      const triggerId = panel.getAttribute("data-share-trigger");
      document.getElementById(triggerId)?.setAttribute("aria-expanded", "false");
    });
  };

  buttons.forEach((button, index) => {
    const triggerId = button.id || `guideShareTrigger${index + 1}`;
    const panelId = `guideSharePanel${index + 1}`;
    button.id = triggerId;
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", panelId);
    button.setAttribute("aria-expanded", "false");

    const panel = document.createElement("div");
    panel.id = panelId;
    panel.className = "guide-share-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "가이드 공유 메뉴");
    panel.setAttribute("data-share-panel", "");
    panel.setAttribute("data-share-trigger", triggerId);

    const heading = document.createElement("strong");
    heading.textContent = "이 가이드 공유하기";
    const helper = document.createElement("p");
    helper.textContent = "링크를 복사해 메신저나 이메일에 붙여넣을 수 있습니다.";
    const urlField = document.createElement("input");
    urlField.className = "guide-share-url";
    urlField.type = "text";
    urlField.readOnly = true;
    urlField.value = shareData.url;
    urlField.setAttribute("aria-label", "공유할 가이드 주소");
    urlField.addEventListener("focus", () => urlField.select());

    const actions = document.createElement("div");
    actions.className = "guide-share-panel-actions";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "guide-share-copy";
    copyButton.textContent = "링크 복사";
    copyButton.setAttribute("data-share-copy", "");
    actions.append(copyButton);

    let systemButton = null;
    if (typeof navigator.share === "function") {
      systemButton = document.createElement("button");
      systemButton.type = "button";
      systemButton.className = "guide-share-system";
      systemButton.textContent = "기기에서 공유";
      actions.append(systemButton);
    }

    const status = document.createElement("span");
    status.className = "guide-share-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    panel.append(heading, helper, urlField, actions, status);
    button.insertAdjacentElement("afterend", panel);

    button.addEventListener("click", () => {
      const willOpen = panel.hidden;
      closeAllPanels(panel);
      panel.hidden = !willOpen;
      button.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) copyButton.focus();
    });

    copyButton.addEventListener("click", async () => {
      const copied = await copyWithFallback(shareData.url);
      if (copied) {
        status.textContent = "주소 복사 완료";
        return;
      }
      urlField.focus();
      status.textContent = "주소를 선택했습니다. Ctrl+C로 복사해 주세요.";
    });

    systemButton?.addEventListener("click", async () => {
      try {
        await navigator.share(shareData);
        status.textContent = "공유 완료";
      } catch (error) {
        if (error?.name !== "AbortError") status.textContent = "기기 공유를 열 수 없습니다. 링크 복사를 이용해 주세요.";
      }
    });

    document.addEventListener("click", (event) => {
      if (panel.hidden || panel.contains(event.target) || button.contains(event.target)) return;
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || panel.hidden) return;
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
      button.focus();
    });
  });
})();
