'use strict';

(function () {
  var SK = 'promptdeck_admin';

  var DEFAULT_TABS = [
    { id: 'tabBtnDesigner',         name: '슬라이드 프롬프트 설계' },
    { id: 'tabBtnGenerator',        name: '슬라이드 분리기' },
    { id: 'tabBtnSlideImage',       name: '슬라이드 이미지 생성' },
    { id: 'tabBtnMapPrompt',        name: '지도 이미지 프롬프트' },
    { id: 'tabBtnSlideDocument',    name: '부속 양식' },
    { id: 'tabBtnPromotionPlanner', name: '컨셉 제안' },
    { id: 'tabBtnConceptMixer',     name: '비주얼 믹서' },
    { id: 'tabBtnPromotion',        name: '홍보용 이미지 생성' },
  ];

  function $(id) { return document.getElementById(id); }
  function loadSettings() { try { return JSON.parse(localStorage.getItem(SK) || '{}'); } catch (e) { return {}; } }
  function saveSettings(d) { try { localStorage.setItem(SK, JSON.stringify(d)); return true; } catch (e) { return false; } }

  // ─── 상태 메시지 ────────────────────────────────────────────────────────────
  function setStatus(msg, type) {
    var el = $('adminSaveStatus');
    if (!el) return;
    el.textContent = msg;
    el.className = 'admin-save-status' + (type ? ' ' + type : '');
    if (type === 'ok') setTimeout(function () { if (el.textContent === msg) { el.textContent = ''; el.className = 'admin-save-status'; } }, 3000);
  }

  // ─── 프로그램 정보 ──────────────────────────────────────────────────────────
  function populateProgramInfo(s) {
    var nameEl = $('adminProgramName');
    var subEl  = $('adminProgramSubtitle');
    if (nameEl) nameEl.value = s.programName || '';
    if (subEl)  subEl.value  = s.programSubtitle || '';
  }
  function collectProgramInfo() {
    return {
      programName:     ($('adminProgramName')     || {}).value || '',
      programSubtitle: ($('adminProgramSubtitle') || {}).value || '',
    };
  }

  // ─── 탭 관리자 ──────────────────────────────────────────────────────────────
  function getTabList(settings) {
    var order      = settings.tabOrder || DEFAULT_TABS.map(function (t) { return t.id; });
    var labels     = settings.tabLabels || {};
    var tabCfg     = settings.tabs || {};
    return order.map(function (id) {
      var def = DEFAULT_TABS.find(function (t) { return t.id === id; });
      if (!def) return null;
      var cfg = tabCfg[id];
      var visible = true, requireAuth = false;
      if (cfg !== undefined) {
        if (typeof cfg === 'boolean') { visible = cfg; }
        else { visible = cfg.visible !== false; requireAuth = !!cfg.requireAuth; }
      }
      return { id: id, defaultName: def.name, label: labels[id] || '', visible: visible, requireAuth: requireAuth };
    }).filter(Boolean);
  }

  function renderTabManager(settings) {
    var container = $('adminTabManager');
    if (!container) return;
    container.innerHTML = '';
    getTabList(settings).forEach(function (t) {
      container.appendChild(buildTabRow(t));
    });
    initDnD(container);
  }

  function buildTabRow(t) {
    var row = document.createElement('div');
    row.className = 'admin-tm-row';
    row.draggable = true;
    row.dataset.tabId = t.id;

    var handle = document.createElement('span');
    handle.className = 'admin-tm-handle';
    handle.setAttribute('aria-hidden', 'true');
    handle.textContent = '⠿';

    var label = document.createElement('input');
    label.type = 'text';
    label.className = 'admin-tm-label';
    label.value = t.label;
    label.placeholder = t.defaultName;
    label.setAttribute('aria-label', t.defaultName + ' 탭 이름');

    var def = document.createElement('span');
    def.className = 'admin-tm-default';
    def.textContent = t.defaultName;

    // 접근 제한 토글 (로그인/권한 필요)
    var authGroup = document.createElement('span');
    authGroup.className = 'admin-tm-toggle-group';
    var authLbl = document.createElement('span');
    authLbl.className = 'admin-tm-toggle-label';
    authLbl.textContent = '접근 제한';
    var authSw = document.createElement('label');
    authSw.className = 'admin-switch admin-switch-auth';
    authSw.setAttribute('aria-label', t.defaultName + ' 접근 제한');
    var authChk = document.createElement('input');
    authChk.type = 'checkbox';
    authChk.className = 'admin-tm-auth-chk';
    authChk.checked = t.requireAuth;
    var authTrack = document.createElement('span');
    authTrack.className = 'admin-switch-track';
    authSw.appendChild(authChk);
    authSw.appendChild(authTrack);
    authGroup.appendChild(authLbl);
    authGroup.appendChild(authSw);

    // 보이기 토글
    var visGroup = document.createElement('span');
    visGroup.className = 'admin-tm-toggle-group';
    var visLbl = document.createElement('span');
    visLbl.className = 'admin-tm-toggle-label';
    visLbl.textContent = '보이기';
    var visSw = document.createElement('label');
    visSw.className = 'admin-switch';
    visSw.setAttribute('aria-label', t.defaultName + ' 보이기');
    var visChk = document.createElement('input');
    visChk.type = 'checkbox';
    visChk.className = 'admin-tm-visible-chk';
    visChk.checked = t.visible;
    var visTrack = document.createElement('span');
    visTrack.className = 'admin-switch-track';
    visSw.appendChild(visChk);
    visSw.appendChild(visTrack);
    visGroup.appendChild(visLbl);
    visGroup.appendChild(visSw);

    row.appendChild(handle);
    row.appendChild(label);
    row.appendChild(def);
    row.appendChild(authGroup);
    row.appendChild(visGroup);
    return row;
  }

  function initDnD(container) {
    var src = null;
    container.addEventListener('dragstart', function (e) {
      src = e.target.closest('.admin-tm-row');
      if (!src) return;
      src.classList.add('admin-dnd-src');
      e.dataTransfer.effectAllowed = 'move';
    });
    container.addEventListener('dragover', function (e) {
      e.preventDefault();
      var tgt = e.target.closest('.admin-tm-row');
      if (!tgt || tgt === src) return;
      e.dataTransfer.dropEffect = 'move';
      var above = e.clientY < tgt.getBoundingClientRect().top + tgt.offsetHeight / 2;
      tgt.classList.toggle('admin-dnd-above', above);
      tgt.classList.toggle('admin-dnd-below', !above);
    });
    container.addEventListener('dragleave', function (e) {
      var tgt = e.target.closest('.admin-tm-row');
      if (tgt) { tgt.classList.remove('admin-dnd-above', 'admin-dnd-below'); }
    });
    container.addEventListener('drop', function (e) {
      e.preventDefault();
      var tgt = e.target.closest('.admin-tm-row');
      if (!tgt || tgt === src || !src) return;
      var above = e.clientY < tgt.getBoundingClientRect().top + tgt.offsetHeight / 2;
      tgt.classList.remove('admin-dnd-above', 'admin-dnd-below');
      container.insertBefore(src, above ? tgt : tgt.nextSibling);
    });
    container.addEventListener('dragend', function () {
      if (src) src.classList.remove('admin-dnd-src');
      src = null;
      container.querySelectorAll('.admin-tm-row').forEach(function (r) { r.classList.remove('admin-dnd-above', 'admin-dnd-below'); });
    });
  }

  function collectTabManager() {
    var rows = document.querySelectorAll('#adminTabManager .admin-tm-row');
    var tabOrder = [], tabLabels = {}, tabs = {};
    rows.forEach(function (row) {
      var id = row.dataset.tabId;
      tabOrder.push(id);
      var labelInput = row.querySelector('.admin-tm-label');
      var val = labelInput ? labelInput.value.trim() : '';
      if (val) tabLabels[id] = val;
      var visChk  = row.querySelector('.admin-tm-visible-chk');
      var authChk = row.querySelector('.admin-tm-auth-chk');
      tabs[id] = {
        visible:     visChk  ? visChk.checked  : true,
        requireAuth: authChk ? authChk.checked : false
      };
    });
    return { tabOrder: tabOrder, tabLabels: tabLabels, tabs: tabs };
  }

  // ─── 사용자 목록 ────────────────────────────────────────────────────────────
  async function renderUsers() {
    var users = await PromptDeckAuth.getUsers();
    var container = $('adminUserList');
    if (!container) return;
    container.innerHTML = '';

    if (!users || users.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = '등록된 사용자가 없습니다. 위에서 사용자를 추가하세요.';
      container.appendChild(empty);
    } else {
      users.forEach(function (user) { container.appendChild(buildUserCard(user, users)); });
    }

    renderPendingRequests(users || []);
  }

  function buildUserCard(user, _allUsers) {
    var settings = loadSettings();
    var tabList  = getTabList(settings);
    var perms    = user.tabPermissions; // null = 전역 설정 따름

    var card = document.createElement('div');
    card.className = 'admin-user-card';
    card.dataset.userId = user.id;

    // 헤더
    var head = document.createElement('div');
    head.className = 'admin-user-head';

    var nameSpan = document.createElement('span');
    nameSpan.className = 'admin-user-name';
    nameSpan.textContent = user.username;

    var badge = document.createElement('span');
    badge.className = 'admin-user-badge admin-user-badge-' + user.role;
    badge.textContent = user.role === 'admin' ? '관리자' : '일반';

    var actions = document.createElement('div');
    actions.className = 'admin-user-actions';

    var pwBtn = document.createElement('button');
    pwBtn.type = 'button';
    pwBtn.className = 'admin-user-action-btn';
    pwBtn.textContent = '비밀번호 변경';
    pwBtn.addEventListener('click', function () { openPwModal(user.id); });

    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'admin-user-action-btn admin-user-action-danger';
    delBtn.textContent = '삭제';
    delBtn.addEventListener('click', async function () {
      if (!confirm(user.username + ' 계정을 삭제하겠습니까?')) return;
      delBtn.disabled = true;
      try { await PromptDeckAuth.deleteUser(user.id); } catch (e) { alert(e.message); delBtn.disabled = false; return; }
      renderUsers();
    });

    actions.appendChild(pwBtn);
    actions.appendChild(delBtn);
    head.appendChild(nameSpan);
    head.appendChild(badge);
    head.appendChild(actions);
    card.appendChild(head);

    // 탭 권한 (전역 비활성화 탭은 표시 안 함)
    var globalEnabled = settings.tabs || {};
    var activeTabs = tabList.filter(function (t) { return globalEnabled[t.id] !== false; });

    var permSection = document.createElement('div');
    permSection.className = 'admin-user-perms';

    var permTitle = document.createElement('div');
    permTitle.className = 'admin-user-perms-title';
    permTitle.textContent = '탭 접근 권한';

    var permNote = document.createElement('span');
    permNote.className = 'admin-user-perms-note';
    permNote.textContent = perms === null ? '전역 설정 따름' : '개별 설정 중';
    permTitle.appendChild(permNote);
    permSection.appendChild(permTitle);

    var grid = document.createElement('div');
    grid.className = 'admin-perm-grid';

    activeTabs.forEach(function (t) {
      var isEnabled = perms === null ? true : (perms[t.id] !== false);
      var item = document.createElement('label');
      item.className = 'admin-perm-item';

      var chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = isEnabled;
      chk.dataset.tabId = t.id;

      var span = document.createElement('span');
      span.textContent = t.label || t.defaultName;

      item.appendChild(chk);
      item.appendChild(span);
      grid.appendChild(item);
    });
    permSection.appendChild(grid);

    var permActions = document.createElement('div');
    permActions.className = 'admin-user-perm-actions';

    var savePermBtn = document.createElement('button');
    savePermBtn.type = 'button';
    savePermBtn.className = 'admin-btn admin-btn-save';
    savePermBtn.style.fontSize = '12px';
    savePermBtn.style.padding = '6px 14px';
    savePermBtn.textContent = '권한 저장';
    savePermBtn.addEventListener('click', async function () {
      var newPerms = {};
      grid.querySelectorAll('input[type="checkbox"]').forEach(function (c) {
        newPerms[c.dataset.tabId] = c.checked;
      });
      savePermBtn.disabled = true;
      try {
        await PromptDeckAuth.updateUserPermissions(user.id, newPerms);
        permNote.textContent = '개별 설정 중';
        savePermBtn.textContent = '✓ 저장됨';
        setTimeout(function () { savePermBtn.textContent = '권한 저장'; }, 2000);
      } catch (e) { alert(e.message); }
      savePermBtn.disabled = false;
    });

    var resetPermBtn = document.createElement('button');
    resetPermBtn.type = 'button';
    resetPermBtn.className = 'admin-btn admin-btn-reset';
    resetPermBtn.style.fontSize = '12px';
    resetPermBtn.style.padding = '6px 14px';
    resetPermBtn.textContent = '전역 설정으로 초기화';
    resetPermBtn.addEventListener('click', async function () {
      resetPermBtn.disabled = true;
      try {
        await PromptDeckAuth.updateUserPermissions(user.id, null);
        grid.querySelectorAll('input[type="checkbox"]').forEach(function (c) { c.checked = true; });
        permNote.textContent = '전역 설정 따름';
      } catch (e) { alert(e.message); }
      resetPermBtn.disabled = false;
    });

    permActions.appendChild(savePermBtn);
    permActions.appendChild(resetPermBtn);
    permSection.appendChild(permActions);
    card.appendChild(permSection);

    // 대기 중인 접근 요청
    if (user.requestedTabs && user.requestedTabs.length > 0) {
      var reqSection = document.createElement('div');
      reqSection.className = 'admin-user-requests';

      var reqTitle = document.createElement('div');
      reqTitle.className = 'admin-user-requests-title';
      reqTitle.textContent = '접근 요청 대기';
      reqSection.appendChild(reqTitle);

      user.requestedTabs.forEach(function (tabId) {
        var tabDef = DEFAULT_TABS.find(function (t) { return t.id === tabId; });
        var tabName = tabDef ? tabDef.name : tabId;
        var item = document.createElement('div');
        item.className = 'admin-req-item';

        var nameEl = document.createElement('span');
        nameEl.className = 'admin-req-tab-name';
        nameEl.textContent = tabName;

        var approveBtn = document.createElement('button');
        approveBtn.type = 'button';
        approveBtn.className = 'admin-req-approve';
        approveBtn.textContent = '승인';
        approveBtn.addEventListener('click', async function () {
          approveBtn.disabled = true;
          await PromptDeckAuth.approveRequest(user.id, tabId);
          renderUsers();
        });

        var denyBtn = document.createElement('button');
        denyBtn.type = 'button';
        denyBtn.className = 'admin-req-deny';
        denyBtn.textContent = '거부';
        denyBtn.addEventListener('click', async function () {
          denyBtn.disabled = true;
          await PromptDeckAuth.denyRequest(user.id, tabId);
          renderUsers();
        });

        item.appendChild(nameEl);
        item.appendChild(approveBtn);
        item.appendChild(denyBtn);
        reqSection.appendChild(item);
      });
      card.appendChild(reqSection);
    }

    return card;
  }

  function renderPendingRequests(users) {
    var section = $('adminPendingSection');
    var list    = $('adminPendingList');
    if (!section || !list) return;

    var all = [];
    users.forEach(function (u) {
      (u.requestedTabs || []).forEach(function (tabId) { all.push({ user: u, tabId: tabId }); });
    });

    section.style.display = all.length ? '' : 'none';
    list.innerHTML = '';
    all.forEach(function (item) {
      var tabDef = DEFAULT_TABS.find(function (t) { return t.id === item.tabId; });
      var tabName = tabDef ? tabDef.name : item.tabId;
      var el = document.createElement('div');
      el.className = 'admin-pending-item';
      el.innerHTML =
        '<span class="admin-pending-user">' + item.user.username + '</span>' +
        '<span class="admin-pending-arrow">→</span>' +
        '<span class="admin-pending-tab">' + tabName + '</span>';

      var ab = document.createElement('button');
      ab.type = 'button'; ab.className = 'admin-req-approve'; ab.textContent = '승인';
      ab.addEventListener('click', async function () { ab.disabled = true; await PromptDeckAuth.approveRequest(item.user.id, item.tabId); renderUsers(); });

      var db = document.createElement('button');
      db.type = 'button'; db.className = 'admin-req-deny'; db.textContent = '거부';
      db.addEventListener('click', async function () { db.disabled = true; await PromptDeckAuth.denyRequest(item.user.id, item.tabId); renderUsers(); });

      el.appendChild(ab);
      el.appendChild(db);
      list.appendChild(el);
    });
  }

  // ─── 비밀번호 변경 모달 ─────────────────────────────────────────────────────
  var pwTargetUserId = null;
  function openPwModal(userId) {
    pwTargetUserId = userId;
    var input = $('pwModalInput');
    var err   = $('pwModalError');
    if (input) input.value = '';
    if (err)   err.textContent = '';
    var modal = $('pwModal');
    if (modal) { modal.style.display = 'flex'; if (input) input.focus(); }
  }
  function closePwModal() {
    pwTargetUserId = null;
    var modal = $('pwModal');
    if (modal) modal.style.display = 'none';
  }

  // ─── Google AdSense ─────────────────────────────────────────────────────────
  function populateAds(s) {
    var chk = $('adminAdsEnabled');
    if (chk) { chk.checked = !!s.adsEnabled; toggleAds(!!s.adsEnabled); }
    var clientEl = $('adminAdClient'),   topEl = $('adminAdSlotTop'),   botEl = $('adminAdSlotBottom');
    if (clientEl) clientEl.value = s.adClient || '';
    if (topEl)    topEl.value    = s.adSlotTop || '';
    if (botEl)    botEl.value    = s.adSlotBottom || '';
  }
  function toggleAds(show) { var el = $('adminAdsSub'); if (el) el.style.display = show ? '' : 'none'; }
  function collectAds() {
    return {
      adsEnabled:    !!($('adminAdsEnabled')  || {}).checked,
      adClient:      ($('adminAdClient')       || {}).value || '',
      adSlotTop:     ($('adminAdSlotTop')      || {}).value || '',
      adSlotBottom:  ($('adminAdSlotBottom')   || {}).value || '',
    };
  }

  // ─── 저장 / 초기화 ──────────────────────────────────────────────────────────
  function handleSave() {
    var tm = collectTabManager();
    var hasEnabled = Object.values(tm.tabs).some(function (t) {
      return typeof t === 'boolean' ? t : t.visible;
    });
    if (!hasEnabled) { setStatus('최소 하나의 탭은 활성화해야 합니다.', 'err'); return; }

    var data = Object.assign({}, collectProgramInfo(), tm, collectAds());
    var unsplashInput = $('adminUnsplashKey');
    if (unsplashInput) data.unsplashKey = unsplashInput.value.trim();

    if (!saveSettings(data)) { setStatus('저장 실패. localStorage를 확인하세요.', 'err'); return; }

    // mixer_unsplash_key 동기화 (concept-mixer.js가 읽는 키)
    if (data.unsplashKey) {
      localStorage.setItem('mixer_unsplash_key', data.unsplashKey);
    } else {
      localStorage.removeItem('mixer_unsplash_key');
    }

    setStatus('저장 중...', '');
    // 서버에도 저장
    var session = PromptDeckAuth.loadSession();
    fetch('/api/admin-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': (session && session.token) || '' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); }).then(function (d) {
      setStatus(d.ok ? '저장되었습니다. 메인 앱 새로고침 시 반영됩니다.' : '로컬 저장됨 (서버 저장 실패)', d.ok ? 'ok' : '');
    }).catch(function () {
      setStatus('로컬 저장됨 (서버 없음)', '');
    });
  }

  function handleReset() {
    if (!confirm('모든 앱 설정(사용자 계정 제외)을 초기화하겠습니까?')) return;
    localStorage.removeItem(SK);
    var s = {};
    populateProgramInfo(s);
    populateAds(s);
    renderTabManager(s);
    setStatus('초기화되었습니다.', 'ok');
  }

  // ─── 초기화 ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // 세션 표시
    var session = PromptDeckAuth.loadSession();
    if (session) {
      var nameEl = $('adminSessionName');
      if (nameEl) nameEl.textContent = session.username;
    }

    // 폼 채우기
    var s = loadSettings();
    populateProgramInfo(s);
    populateAds(s);
    renderTabManager(s);
    renderUsers();

    // 테마 버튼
    var themeBtn = $('adminThemeBtn');
    if (themeBtn) {
      var cur = document.documentElement.dataset.theme;
      themeBtn.textContent = cur === 'dark' ? '☀ 라이트' : '☾ 다크';
      themeBtn.addEventListener('click', function () {
        var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('promptdeck_theme', next);
        themeBtn.textContent = next === 'dark' ? '☀ 라이트' : '☾ 다크';
      });
    }

    // Unsplash 키 토글
    var pwToggle = $('adminUnsplashKeyToggle');
    var pwInput  = $('adminUnsplashKey');
    if (pwToggle && pwInput) {
      var s2 = loadSettings();
      if (pwInput) pwInput.value = s2.unsplashKey || '';
      pwToggle.addEventListener('click', function () {
        var hidden = pwInput.type === 'password';
        pwInput.type = hidden ? 'text' : 'password';
        pwToggle.textContent = hidden ? '숨김' : '표시';
      });
    }

    // 광고 토글
    var adsChk = $('adminAdsEnabled');
    if (adsChk) adsChk.addEventListener('change', function () { toggleAds(adsChk.checked); });

    // 저장 / 초기화
    var saveBtn  = $('adminSaveBtn');
    var resetBtn = $('adminResetBtn');
    if (saveBtn)  saveBtn.addEventListener('click', handleSave);
    if (resetBtn) resetBtn.addEventListener('click', handleReset);

    // 사용자 생성
    var createBtn = $('createUserBtn');
    if (createBtn) {
      createBtn.addEventListener('click', async function () {
        var username = ($('newUsername') || {}).value || '';
        var password = ($('newPassword') || {}).value || '';
        var role     = ($('newUserRole') || {}).value || 'user';
        var errEl    = $('newUserError');
        if (errEl) errEl.textContent = '';
        createBtn.disabled = true;
        try {
          await PromptDeckAuth.createUser(username, password, role);
          var detailsEl = $('adminCreateUserDetails');
          if (detailsEl) detailsEl.removeAttribute('open');
          if ($('newUsername')) $('newUsername').value = '';
          if ($('newPassword')) $('newPassword').value = '';
          renderUsers();
        } catch (err) {
          if (errEl) errEl.textContent = err.message;
        } finally {
          createBtn.disabled = false;
        }
      });
    }

    // 비밀번호 변경 모달
    var pwSaveBtn   = $('pwModalSaveBtn');
    var pwCancelBtn = $('pwModalCancelBtn');
    var pwModal     = $('pwModal');

    if (pwSaveBtn) {
      pwSaveBtn.addEventListener('click', async function () {
        var errEl = $('pwModalError');
        var input = $('pwModalInput');
        if (errEl) errEl.textContent = '';
        if (!pwTargetUserId || !input) return;
        pwSaveBtn.disabled = true;
        try {
          await PromptDeckAuth.changePassword(pwTargetUserId, input.value);
          closePwModal();
        } catch (err) {
          if (errEl) errEl.textContent = err.message;
        } finally {
          pwSaveBtn.disabled = false;
        }
      });
    }
    if (pwCancelBtn) pwCancelBtn.addEventListener('click', closePwModal);
    if (pwModal) pwModal.addEventListener('click', function (e) { if (e.target === pwModal) closePwModal(); });
  });
})();
