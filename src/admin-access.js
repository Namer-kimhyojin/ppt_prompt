'use strict';

(function (global) {
  var state = { enabled: false, authenticated: false };
  var statusPromise = null;
  var dialog = null;

  function normalizeAdminAccessInput(raw) {
    return String(raw || '')
      .normalize('NFC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00A0/g, '')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .trim();
  }

  function publish(next) {
    state.enabled = !!next.enabled;
    state.authenticated = !!next.authenticated;
    document.documentElement.dataset.adminMode = state.authenticated ? 'true' : 'false';
    global.dispatchEvent(new CustomEvent('promptdeck:admin-access', { detail: Object.assign({}, state) }));
    return Object.assign({}, state);
  }

  async function fetchStatus(force) {
    if (statusPromise && !force) return statusPromise;
    statusPromise = fetch('/api/admin/access', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('unavailable');
        return response.json();
      })
      .then(function (data) {
        return publish({
          enabled: data.enabled === true,
          authenticated: data.authenticated === true
        });
      })
      .catch(function () {
        return publish({ enabled: false, authenticated: false });
      })
      .finally(function () { statusPromise = null; });
    return statusPromise;
  }

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'adminAccessDialog';
    dialog.className = 'admin-access-dialog';
    dialog.setAttribute('aria-labelledby', 'adminAccessTitle');
    dialog.innerHTML =
      '<form class="admin-access-card" id="adminAccessForm">' +
        '<button type="button" class="admin-access-close" aria-label="닫기">×</button>' +
        '<span class="admin-access-kicker">RESTRICTED AREA</span>' +
        '<h2 id="adminAccessTitle">관리자 모드</h2>' +
        '<p>관리자 비밀번호를 입력하세요. 인증 세션은 4시간 유지됩니다.</p>' +
        '<label for="adminAccessKey">비밀번호</label>' +
        '<input type="password" id="adminAccessKey" autocomplete="current-password" maxlength="128" required />' +
        '<div class="admin-access-error" id="adminAccessError" role="alert" aria-live="polite"></div>' +
        '<button type="submit" class="admin-access-submit">관리자로 입장</button>' +
      '</form>';
    document.body.appendChild(dialog);

    var form = dialog.querySelector('#adminAccessForm');
    var input = dialog.querySelector('#adminAccessKey');
    var error = dialog.querySelector('#adminAccessError');
    var submit = dialog.querySelector('.admin-access-submit');

    dialog.querySelector('.admin-access-close').addEventListener('click', closeDialog);
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeDialog();
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      error.textContent = '';
      submit.disabled = true;
      submit.textContent = '인증 중…';
      try {
        var normalizedAccessKey = normalizeAdminAccessInput(input.value);
        var response = await fetch('/api/admin/access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessKey: normalizedAccessKey })
        });
        var data = await response.json().catch(function () { return {}; });
        if (!response.ok || !data.ok) {
          if (response.status === 429) {
            var retryAfter = Number(response.headers.get('Retry-After'));
            if (Number.isFinite(retryAfter) && retryAfter > 0) {
              throw new Error('시도 횟수가 너무 많습니다. 잠시 후 ' + retryAfter + '초 뒤에 다시 시도하세요.');
            }
          }
          throw new Error(
            response.status === 429
              ? '시도 횟수가 너무 많습니다. 잠시 후 다시 시도하세요.'
              : '비밀번호를 확인해주세요.'
          );
        }
        publish({ enabled: true, authenticated: true });
        global.location.assign('admin.html');
      } catch (loginError) {
        error.textContent = loginError.message || '관리자 인증에 실패했습니다.';
        input.select();
      } finally {
        submit.disabled = false;
        submit.textContent = '관리자로 입장';
      }
    });
    return dialog;
  }

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  async function openAccess() {
    var current = await fetchStatus(true);
    if (current.authenticated) {
      global.location.assign('admin.html');
      return;
    }

    var modal = ensureDialog();
    var input = modal.querySelector('#adminAccessKey');
    var error = modal.querySelector('#adminAccessError');
    error.textContent = '';
    input.value = '';
    modal.querySelector('.admin-access-submit').disabled = false;
    if (!current.enabled) {
      error.textContent = '서버에 관리자 비밀번호가 설정되지 않았습니다.';
    }
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    window.setTimeout(function () { input.focus(); }, 0);
  }

  function bindSecretEntry() {
    var brand = document.querySelector('.brand-mark');
    var clicks = [];
    if (brand) {
      brand.addEventListener('click', function () {
        var now = Date.now();
        clicks = clicks.filter(function (time) { return now - time < 3500; });
        clicks.push(now);
        if (clicks.length >= 7) {
          clicks = [];
          openAccess();
        }
      });
    }

    document.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && event.altKey && event.shiftKey && event.code === 'KeyP') {
        event.preventDefault();
        openAccess();
      }
    });
  }

  global.PromptDeckAdminAccess = {
    status: fetchStatus,
    open: openAccess,
    isAuthenticated: function () { return state.authenticated; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    bindSecretEntry();
    fetchStatus(false);
    var params = new URLSearchParams(global.location.search);
    if (params.get('admin') === 'locked') {
      params.delete('admin');
      var query = params.toString();
      global.history.replaceState(null, '', global.location.pathname + (query ? '?' + query : '') + global.location.hash);
      openAccess();
    }
  });
})(window);
