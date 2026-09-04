(function () {
  'use strict';

  var SK         = 'promptdeck_admin';
  var HAS_USERS_SK = 'promptdeck_has_users';
  var SETTINGS_KEYS = [
    'programName', 'programSubtitle', 'tabOrder', 'tabLabels', 'tabGroups', 'tabs', 'defaultTab',
    'hasUnsplashKey', 'pollinationsPublicKey', 'adsEnabled', 'adClient', 'adSlotTop', 'adSlotBottom'
  ];

  function getAllTabs() {
    return Array.from(document.querySelectorAll('.app-tabs .app-tab-btn[id][role="tab"]')).map(function (button) {
      return {
        id: button.id,
        name: (button.textContent || '').replace(/\s+/g, ' ').trim() || button.id,
        paneId: button.getAttribute('aria-controls') || button.id.replace('tabBtn', 'pane'),
        group: button.closest('[data-tab-group]')?.getAttribute('data-tab-group') || ''
      };
    });
  }

  var ALL_TABS = getAllTabs();

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch (e) { return fallback; }
  }

  function fetchAdminSettings() {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 3000);
    return fetch('/api/admin-settings', {
      cache: 'no-store',
      signal: controller ? controller.signal : undefined
    }).finally(function () { window.clearTimeout(timeout); });
  }

  var s       = loadJSON(SK, {});
  var session = window.PromptDeckAuth ? window.PromptDeckAuth.loadSession() : null;

  function exposeSettings(settings) {
    window.PROMPTDECK_POLLINATIONS_PUBLIC_KEY = /^pk_[A-Za-z0-9_-]{1,253}$/.test(settings.pollinationsPublicKey || '') ? settings.pollinationsPublicKey : '';
    window.PROMPTDECK_HAS_UNSPLASH_KEY = !!settings.hasUnsplashKey;
    delete window.PROMPTDECK_UNSPLASH_KEY;
    localStorage.removeItem('mixer_unsplash_key');
    if (settings.programName) window.PROMPTDECK_PROGRAM_NAME = settings.programName;
    else delete window.PROMPTDECK_PROGRAM_NAME;
  }

  exposeSettings(s);
  window.PROMPTDECK_SESSION = session;

  // 탭 초기화가 최신 서버 설정 적용을 기다릴 수 있도록 Promise를 공개합니다.
  var settingsReady = fetchAdminSettings().then(function (r) {
    return r.ok ? r.json() : null;
  }).then(function (d) {
    if (!d || !d.ok) return s;
    var merged = {};
    SETTINGS_KEYS.forEach(function (k) { if (d[k] !== undefined) merged[k] = d[k]; });
    localStorage.setItem(SK, JSON.stringify(merged));
    s = merged;
    exposeSettings(s);
    return s;
  }).catch(function () { return s; });
  window.PromptDeckAdminSettingsReady = settingsReady;

  // ─── 인증 리다이렉트 ────────────────────────────────────────────────────────
  // has-users 캐시로 즉시 판단, 서버 확인은 비동기로 추가 수행
  var page = window.location.pathname.split('/').pop() || 'index.html';
  var isStaticMode = !!window.PROMPTDECK_STATIC_MODE;
  var cachedHasUsers = isStaticMode ? null : localStorage.getItem(HAS_USERS_SK);

  function maybeRedirect(hasUsers) {
    if (hasUsers && !session) {
      if (page !== 'login.html' && page !== 'admin.html') {
        window.location.replace('login.html?return=' + encodeURIComponent(page || 'index.html'));
      }
    }
  }

  if (isStaticMode) {
    // 공개 정적 배포에서는 로컬 서버 인증 상태를 조회하거나 로그인 화면으로 보내지 않습니다.
    localStorage.setItem(HAS_USERS_SK, '0');
  } else {
    // 캐시가 있으면 즉시 판단
    if (cachedHasUsers !== null) {
      maybeRedirect(cachedHasUsers === '1');
    }

    // 서버에서 최신 has-users 확인 (비동기)
    fetch('/api/auth/has-users').then(function (r) {
      return r.ok ? r.json() : null;
    }).then(function (d) {
      if (!d) {
        // 서버 없음 → 캐시 초기화, 리다이렉트 안 함
        localStorage.setItem(HAS_USERS_SK, '0');
        return;
      }
      localStorage.setItem(HAS_USERS_SK, d.hasUsers ? '1' : '0');
      if (cachedHasUsers === null) maybeRedirect(d.hasUsers);
    }).catch(function () {
      // 서버 없음 → 캐시 초기화
      localStorage.setItem(HAS_USERS_SK, '0');
    });
  }

  // ─── 현재 사용자 탭 권한 ─────────────────────────────────────────────────────
  // 서버 세션에서 tabPermissions 읽기 (세션에 포함되어 있음)
  var currentUserPerms  = session ? session.tabPermissions  : null;
  var currentUserRole   = session ? session.role            : null;
  var currentUserId     = session ? session.userId          : null;
  var requestedTabs     = session ? (session.requestedTabs || []) : [];

  function getTabCfg(tabId) {
    var cfg = s.tabs && s.tabs[tabId];
    if (cfg === undefined || cfg === null) return { visible: true, requireAuth: false };
    if (typeof cfg === 'boolean') return { visible: cfg, requireAuth: false };
    return { visible: cfg.visible !== false, requireAuth: !!cfg.requireAuth };
  }

  function isTabVisible(tabId) {
    var cfg = getTabCfg(tabId);
    if (!cfg.visible) return false;
    // 접근제한 탭: 미로그인이면 숨김
    if (cfg.requireAuth && !session) return false;
    // 관리자는 모두 접근
    if (!session || currentUserRole === 'admin') return true;
    // 로그인 사용자의 개별 차단 탭은 숨기지 않고 잠금 상태로 보여 접근 요청이 가능하게 합니다.
    return true;
  }

  function isTabLocked(tabId) {
    var cfg = getTabCfg(tabId);
    if (!cfg.visible) return false;  // 숨김 탭은 locked 아님
    if (!session) return false;      // 미로그인은 숨김으로 처리됨
    if (currentUserRole === 'admin') return false;
    // 개별 권한이 명시적으로 false → 잠금
    if (currentUserPerms !== null && currentUserPerms !== undefined) {
      return currentUserPerms[tabId] === false;
    }
    // 접근제한 탭인데 개별 권한 미설정 → 잠금 (관리자 승인 대기)
    if (cfg.requireAuth) return true;
    return false;
  }

  // ─── CSS 주입 (동기, 깜빡임 없음) ──────────────────────────────────────────
  function updateHiddenTabsStyle() {
    var existing = document.getElementById('admin-hidden-tabs');
    if (existing) existing.remove();
    var rules = [];
    ALL_TABS.forEach(function (t) {
      if (!isTabVisible(t.id)) {
        rules.push('#' + t.id + '{display:none!important}');
        rules.push('#' + t.paneId + '{display:none!important}');
      }
    });
    if (rules.length) {
      var style = document.createElement('style');
      style.id = 'admin-hidden-tabs';
      style.textContent = rules.join('');
      document.head.appendChild(style);
    }
  }
  updateHiddenTabsStyle();

  function getEffectiveTabName(tab) {
    return (s.tabLabels && s.tabLabels[tab.id]) || tab.name;
  }

  function applyTabPlacement() {
    var validIds = ALL_TABS.map(function (tab) { return tab.id; });
    var savedOrder = Array.isArray(s.tabOrder) ? s.tabOrder.filter(function (id) {
      return validIds.indexOf(id) !== -1;
    }) : [];
    validIds.forEach(function (id) {
      if (savedOrder.indexOf(id) === -1) savedOrder.push(id);
    });

    savedOrder.forEach(function (tabId) {
      var tab = ALL_TABS.find(function (item) { return item.id === tabId; });
      var button = document.getElementById(tabId);
      if (!tab || !button) return;
      var configuredGroup = s.tabGroups && s.tabGroups[tabId];
      var group = document.querySelector('.app-tab-group[data-tab-group="' + configuredGroup + '"]') ? configuredGroup : tab.group;
      var host = document.querySelector('.app-tab-group[data-tab-group="' + group + '"] .app-tab-group-buttons');
      if (host) host.appendChild(button);
    });
  }

  // ─── DOM 조작 (DOMContentLoaded) ────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async function () {
    s = await settingsReady;
    updateHiddenTabsStyle();

    // 프로그램명
    if (s.programName) {
      document.title = s.programName;
      var bt = document.querySelector('.brand-title');
      if (bt) bt.textContent = s.programName;
    }
    // 부제목
    if (s.programSubtitle) {
      var bst = document.querySelector('.brand-subtitle');
      if (bst) bst.textContent = s.programSubtitle;
    }

    // 탭 이름 변경
    if (s.tabLabels) {
      Object.keys(s.tabLabels).forEach(function (btnId) {
        var btn = document.getElementById(btnId);
        if (btn && s.tabLabels[btnId]) btn.textContent = s.tabLabels[btnId];
      });
    }

    // 그룹 구조를 유지하면서 탭 위치와 그룹 내 순서를 적용합니다.
    applyTabPlacement();

    // 잠긴 탭 처리
    ALL_TABS.forEach(function (t) {
      if (isTabLocked(t.id)) {
        var btn = document.getElementById(t.id);
        if (!btn) return;
        btn.style.display = '';
        btn.classList.add('tab-locked');
        btn.setAttribute('title', '접근 권한 없음 - 클릭하여 요청');
        btn.addEventListener('click', function (e) {
          e.stopImmediatePropagation();
          showAccessModal(t.id, getEffectiveTabName(t));
        }, true);
      }
    });

    // 기본 활성화 탭 강제 선택 및 예외 처리
    setTimeout(function () {
      var defaultTabId = s.defaultTab;
      var defaultBtn = defaultTabId ? document.getElementById(defaultTabId) : null;
      var defaultValid = defaultBtn && isTabVisible(defaultTabId) && !isTabLocked(defaultTabId);
      
      if (defaultValid) {
        defaultBtn.click();
      } else {
        var activeBtn = document.querySelector('.app-tab-btn.active');
        var activeBlocked = activeBtn && (!isTabVisible(activeBtn.id) || isTabLocked(activeBtn.id));
        if (activeBlocked) {
          var visible = Array.from(document.querySelectorAll('.app-tab-btn')).filter(function (b) {
            return getComputedStyle(b).display !== 'none' && !b.classList.contains('tab-locked');
          });
          if (visible.length) visible[0].click();
        }
      }
    }, 0);

    // 사용자 표시바
    var userBar = document.getElementById('userBar');
    if (userBar && session) {
      userBar.style.display = 'inline-flex';
      var nameEl = document.getElementById('userBarName');
      if (nameEl) nameEl.textContent = session.username;
      var avatarEl = document.getElementById('userBarAvatar');
      if (avatarEl) avatarEl.textContent = (session.username || '?').charAt(0).toUpperCase();
      var adminBtn = document.getElementById('userBarAdmin');
      if (adminBtn && session.role === 'admin') adminBtn.style.display = 'inline-flex';
    }
    var logoutBtn = document.getElementById('userBarLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        // 서버 세션 무효화
        var done = function () {
          sessionStorage.removeItem('promptdeck_session');
          localStorage.removeItem('promptdeck_session');
          window.location.reload();
        };
        fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).finally(done);
      });
    }

  });

  // ─── 탭 접근 요청 모달 ──────────────────────────────────────────────────────
  function showAccessModal(tabId, tabName) {
    var existing = document.getElementById('adminAccessModal');
    if (existing) existing.remove();

    var alreadyRequested = requestedTabs.indexOf(tabId) !== -1;

    var overlay = document.createElement('div');
    overlay.id = 'adminAccessModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9000;';

    var box = document.createElement('div');
    box.style.cssText = 'background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:28px;width:320px;max-width:90vw;box-shadow:var(--shadow);font-family:inherit;';
    box.innerHTML = '<h3 style="margin:0 0 10px;font-size:16px;">' + (tabName || '이 탭') + '</h3>' +
      '<p style="margin:0 0 20px;font-size:14px;color:var(--ink-soft);">' +
      (alreadyRequested
        ? '접근 권한 요청이 이미 접수되었습니다. 관리자 승인을 기다려 주세요.'
        : '이 탭에 접근 권한이 없습니다. 관리자에게 접근을 요청하시겠습니까?') +
      '</p>';

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';

    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = '닫기';
    cancelBtn.style.cssText = 'padding:9px 16px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--ink-soft);cursor:pointer;font-size:14px;font-family:inherit;';
    cancelBtn.addEventListener('click', function () { overlay.remove(); });
    actions.appendChild(cancelBtn);

    if (!alreadyRequested && session) {
      var reqBtn = document.createElement('button');
      reqBtn.textContent = '접근 요청';
      reqBtn.style.cssText = 'padding:9px 16px;border:none;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer;font-size:14px;font-weight:600;font-family:inherit;';
      reqBtn.addEventListener('click', function () {
        reqBtn.disabled = true;
        reqBtn.textContent = '요청 중...';
        // 서버 API 호출
        fetch('/api/auth/request-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tabId: tabId })
        }).finally(function () {
          // 로컬 세션 캐시 업데이트
          var raw = JSON.parse(sessionStorage.getItem('promptdeck_session') || 'null');
          if (raw) {
            if (!raw.requestedTabs) raw.requestedTabs = [];
            if (raw.requestedTabs.indexOf(tabId) === -1) raw.requestedTabs.push(tabId);
            sessionStorage.setItem('promptdeck_session', JSON.stringify(raw));
            requestedTabs = raw.requestedTabs;
          }
          overlay.remove();
          showAccessModal(tabId, tabName);
        });
      });
      actions.appendChild(reqBtn);
    }

    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
  }
})();
