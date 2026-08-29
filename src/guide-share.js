(() => {
  const button = document.querySelector("[data-share-page]");
  if (!button) return;

  const originalLabel = button.textContent;
  const announce = (message) => {
    button.textContent = message;
    window.setTimeout(() => { button.textContent = originalLabel; }, 1800);
  };

  button.addEventListener("click", async () => {
    const data = {
      title: document.title,
      text: document.querySelector('meta[name="description"]')?.content || document.title,
      url: window.location.href.split("#")[0],
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        announce("공유 완료");
        return;
      }
      await navigator.clipboard.writeText(data.url);
      announce("주소 복사 완료");
    } catch (error) {
      if (error?.name !== "AbortError") announce("주소를 직접 복사해 주세요");
    }
  });
})();
