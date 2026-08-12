(function () {
  'use strict';
  function value(info, path) {
    return path.split('.').reduce(function (current, key) { return current && current[key]; }, info) || '미설정(배포 전 입력 필요)';
  }
  document.addEventListener('DOMContentLoaded', function () {
    fetch('/api/public-info', { cache: 'no-store' }).then(function (response) {
      return response.ok ? response.json() : null;
    }).then(function (info) {
      if (!info) return;
      document.querySelectorAll('[data-public-info]').forEach(function (element) {
        element.textContent = value(info, element.getAttribute('data-public-info'));
      });
    }).catch(function () {});
  });
})();
