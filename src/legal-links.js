(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.promptdeck-legal-footer')) return;
    var footer = document.createElement('footer');
    footer.className = 'promptdeck-legal-footer';
    footer.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:8px 14px;padding:18px 16px;color:#657084;font-size:12px;border-top:1px solid rgba(128,128,128,.22)';
    [['개인정보 처리방침','privacy.html'],['이용약관','terms.html'],['AI 이용 안내','ai-policy.html'],['저작권·신고','copyright-policy.html'],['오픈소스 고지','third-party-notices.html']].forEach(function (item) {
      var link = document.createElement('a');
      link.textContent = item[0];
      link.href = item[1];
      link.style.color = 'inherit';
      footer.appendChild(link);
    });
    document.body.appendChild(footer);
  });
})();
