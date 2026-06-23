(function () {
  'use strict';

  var SK         = 'promptdeck_admin';
  var SESSION_SK = 'promptdeck_session';
  var HAS_USERS_SK = 'promptdeck_has_users';

  var ALL_TABS = [
    { id: 'tabBtnDesigner',         name: '슬라이드 프롬프트 설계' },
    { id: 'tabBtnGenerator',        name: '슬라이드 분리기' },
    { id: 'tabBtnSlideImage',       name: '슬라이드 이미지 생성' },
    { id: 'tabBtnMapPrompt',        name: '지도 이미지 프롬프트' },
    { id: 'tabBtnSlideDocument',    name: '부속 양식' },
    { id: 'tabBtnPromotionPlanner', name: '컨셉 제안' },
    { id: 'tabBtnConceptMixer',     name: '비주얼 믹서' },
    { id: 'tabBtnPromotion',        name: '홍보용 이미지 생성' },
  ];

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch (e) { return fallback; }
  }

  var s       = loadJSON(SK, {});
  var session = (function () {
    try {
      var raw = JSON.parse(localStorage.getItem(SESSION_SK) || 'null');
      if (raw && raw.expiresAt > Date.now()) return raw;
      if (raw) localStorage.removeItem(SESSION_SK);
      return null;
    } catch (e) { return null; }
  })();

  // 전역 노출
  if (s.unsplashKey) window.PROMPTDECK_UNSPLASH_KEY = s.unsplashKey;
  if (s.programName) window.PROMPTDECK_PROGRAM_NAME = s.programName;
  window.PROMPTDECK_SESSION = session;

  // ─── 인증 리다이렉트 ────────────────────────────────────────────────────────
  // has-users 캐시로 즉시 판단, 서버 확인은 비동기로 추가 수행
  var page = window.location.pathname.split('/').pop() || 'index.html';
  var cachedHasUsers = localStorage.getItem(HAS_USERS_SK);

  function maybeRedirect(hasUsers) {
    if (hasUsers && !session) {
      if (page !== 'login.html' && page !== 'admin.html') {
        window.location.replace('login.html?return=' + encodeURIComponent(page || 'index.html'));
      }
    }
  }

  // 캐시가 있으면 즉시 판단
  if (cachedHasUsers !== null) {
    maybeRedirect(cachedHasUsers === '1');
  }

  // 서버에서 최신 has-users 확인 (비동기)
  fetch('/api/auth/has-users').then(function (r) {
    return r.ok ? r.json() : null;
  }).then(function (d) {
    if (!d) return;
    localStorage.setItem(HAS_USERS_SK, d.hasUsers ? '1' : '0');
    if (cachedHasUsers === null) maybeRedirect(d.hasUsers);
  }).catch(function () {});

  // ─── 현재 사용자 탭 권한 ─────────────────────────────────────────────────────
  // 서버 세션에서 tabPermissions 읽기 (세션에 포함되어 있음)
  var currentUserPerms  = session ? session.tabPermissions  : null;
  var currentUserRole   = session ? session.role            : null;
  var currentUserId     = session ? session.userId          : null;
  var requestedTabs     = session ? (session.requestedTabs || []) : [];

  function isTabVisible(tabId) {
    if (s.tabs && s.tabs[tabId] === false) return false;
    if (!session || currentUserRole === 'admin') return true;
    if (currentUserPerms !== null && currentUserPerms !== undefined) {
      return currentUserPerms[tabId] !== false;
    }
    return true;
  }

  function isTabLocked(tabId) {
    if (s.tabs && s.tabs[tabId] === false) return false;
    if (!session || currentUserRole === 'admin') return false;
    if (currentUserPerms !== null && currentUserPerms !== undefined) {
      return currentUserPerms[tabId] === false;
    }
    return false;
  }

  // ─── CSS 주입 (동기, 깜빡임 없음) ──────────────────────────────────────────
  var rules = [];
  ALL_TABS.forEach(function (t) {
    if (!isTabVisible(t.id)) {
      var paneId = t.id.replace('tabBtn', 'pane');
      rules.push('#' + t.id + '{display:none!important}');
      rules.push('#' + paneId + '{display:none!important}');
    }
  });
  if (rules.length) {
    var style = document.createElement('style');
    style.id = 'admin-hidden-tabs';
    style.textContent = rules.join('');
    document.head.appendChild(style);
  }

  // ─── DOM 조작 (DOMContentLoaded) ────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {

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

    // 탭 순서 재정렬
    if (s.tabOrder && s.tabOrder.length) {
      var tabsNav = document.querySelector('.app-tabs');
      if (tabsNav) {
        s.tabOrder.forEach(function (btnId) {
          var btn = document.getElementById(btnId);
          if (btn) tabsNav.appendChild(btn);
        });
      }
    }

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
          showAccessModal(t.id, t.name);
        }, true);
      }
    });

    // 숨겨진 탭이 현재 활성 탭이면 첫 번째 보이는 탭으로 전환
    setTimeout(function () {
      var activeBtn = document.querySelector('.app-tab-btn.active');
      if (activeBtn && !isTabVisible(activeBtn.id)) {
        var visible = Array.from(document.querySelectorAll('.app-tab-btn')).filter(function (b) {
          return getComputedStyle(b).display !== 'none' && !b.classList.contains('tab-locked');
        });
        if (visible.length) visible[0].click();
      }
    }, 0);

    // 사용자 표시바
    var userBar = document.getElementById('userBar');
    if (userBar && session) {
      userBar.style.display = 'inline-flex';
      var nameEl = document.getElementById('userBarName');
      if (nameEl) nameEl.textContent = session.username;
    }
    var logoutBtn = document.getElementById('userBarLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        // 서버 세션 무효화
        var tok = session && session.token;
        var done = function () {
          localStorage.removeItem(SESSION_SK);
          window.location.reload();
        };
        if (tok) {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-session-token': tok }
          }).finally(done);
        } else {
          done();
        }
      });
    }

    // Google AdSense
    if (s.adsEnabled && s.adClient) {
      var scr = document.createElement('script');
      scr.async = true;
      scr.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + s.adClient;
      scr.crossOrigin = 'anonymous';
      document.head.appendChild(scr);
      function injectAd(id, slot) {
        var el = document.getElementById(id);
        if (!el || !slot) return;
        el.style.display = 'block';
        el.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="' + s.adClient + '" data-ad-slot="' + slot + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
      injectAd('adminAdBannerTop',    s.adSlotTop);
      injectAd('adminAdBannerBottom', s.adSlotBottom);
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
          headers: { 'Content-Type': 'application/json', 'x-session-token': session.token || '' },
          body: JSON.stringify({ tabId: tabId })
        }).finally(function () {
          // 로컬 세션 캐시 업데이트
          var raw = JSON.parse(localStorage.getItem(SESSION_SK) || 'null');
          if (raw) {
            if (!raw.requestedTabs) raw.requestedTabs = [];
            if (raw.requestedTabs.indexOf(tabId) === -1) raw.requestedTabs.push(tabId);
            localStorage.setItem(SESSION_SK, JSON.stringify(raw));
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
