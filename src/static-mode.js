'use strict';

(function () {
  window.PROMPTDECK_STATIC_MODE = true;

  const hiddenSelectors = [
    '#tabBtnSlideImage',
    '#paneSlideImage',
    '#userBar',
    '#photoTransformPreviewAdminBtn',
    '#photoTransformAdminGenerateMissingBtn',
    '#photoTransformAdminRefreshBtn',
    '#btnSubjectSampleRefresh',
    '#btnMediumSampleRefresh',
    '#labelSheetGenerateMissingBtn',
  ];

  const style = document.createElement('style');
  style.textContent = `${hiddenSelectors.join(',')} { display: none !important; }`;
  document.head.appendChild(style);

  function applyStaticUi() {
    hiddenSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.hidden = true;
        element.setAttribute('aria-hidden', 'true');
      });
    });

    const customSave = document.getElementById('photoTransformCustomSaveBtn');
    if (customSave && customSave.textContent !== '프리셋을 이 브라우저에 저장') {
      customSave.textContent = '프리셋을 이 브라우저에 저장';
    }

    const activeServerPane = document.querySelector('#paneSlideImage.active');
    if (activeServerPane) document.getElementById('tabBtnCommonPrompt')?.click();
  }

  const observer = new MutationObserver(applyStaticUi);
  document.addEventListener('DOMContentLoaded', () => {
    applyStaticUi();
    observer.observe(document.body, { childList: true, subtree: true });
  }, { once: true });
})();
