'use strict';

(function () {
  var SK = 'promptdeck_admin';

  // index.html을 읽을 수 없는 환경(file:// 등)에서만 사용하는 현재 탭 목록입니다.
  // 일반 실행 환경에서는 아래 목록이 아니라 실제 .app-tabs 버튼을 자동으로 읽습니다.
  var TAB_GROUPS = [
    { id: 'deck', name: '슬라이드 제작' },
    { id: 'special', name: '업무용 이미지 제작' },
    { id: 'visual', name: '일반·창작 이미지 제작' }
  ];
  var FALLBACK_TABS = [
    { id: 'tabBtnCommonPrompt',     name: '공통 프롬프트', group: 'deck' },
    { id: 'tabBtnGenerator',        name: '슬라이드 분리기', group: 'deck' },
    { id: 'tabBtnSlideImage',       name: '슬라이드 이미지 생성', group: 'deck' },
    { id: 'tabBtnPromotionPlanner', name: '컨셉 제안', group: 'visual' },
    { id: 'tabBtnConceptMixer',     name: '비주얼 믹서', group: 'visual' },
    { id: 'tabBtnPhotoTransform',   name: '사진 변환 프롬프터', group: 'visual' },
    { id: 'tabBtnMapPrompt',        name: '지도 이미지', group: 'special' },
    { id: 'tabBtnSlideDocument',    name: '부속 양식', group: 'special' },
    { id: 'tabBtnFormImage',        name: '양식 이미지', group: 'special' },
    { id: 'tabBtnPromotion',        name: '홍보용 이미지', group: 'special' },
    { id: 'tabBtnQrGenerator',      name: 'QR코드 생성기', group: 'special' },
    { id: 'tabBtnDesigner',         name: '슬라이드 프롬프트(구)', group: 'deck' }
  ];
  var DEFAULT_TABS = FALLBACK_TABS.slice();

  function $(id) { return document.getElementById(id); }
  function loadSettings() { try { return JSON.parse(localStorage.getItem(SK) || '{}'); } catch (e) { return {}; } }
  function saveSettings(d) {
    try {
      var safe = Object.assign({}, d);
      delete safe.unsplashKey;
      localStorage.setItem(SK, JSON.stringify(safe));
      return true;
    } catch (e) { return false; }
  }

  async function loadServerSettings() {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 3000);
    try {
      var response = await fetch('/api/admin-settings', {
        cache: 'no-store',
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) return loadSettings();
      var server = await response.json();
      if (!server || !server.ok) return loadSettings();
      var merged = Object.assign({}, server);
      delete merged.ok;
      saveSettings(merged);
      return merged;
    } catch (e) {
      return loadSettings();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function readTabsFromDocument(doc) {
    if (!doc) return [];
    return Array.from(doc.querySelectorAll('.app-tabs .app-tab-btn[id][role="tab"]')).map(function (btn) {
      var group = btn.closest('[data-tab-group]');
      return {
        id: btn.id,
        name: (btn.textContent || '').replace(/\s+/g, ' ').trim() || btn.id,
        group: group ? group.getAttribute('data-tab-group') : 'special'
      };
    });
  }

  async function loadCurrentTabs() {
    try {
      var response = await fetch('index.html', { cache: 'no-store' });
      if (!response.ok) throw new Error('index.html을 불러오지 못했습니다.');
      var html = await response.text();
      var parsed = new DOMParser().parseFromString(html, 'text/html');
      var tabs = readTabsFromDocument(parsed);
      if (tabs.length) DEFAULT_TABS = tabs;
    } catch (e) {
      DEFAULT_TABS = FALLBACK_TABS.slice();
    }
  }

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
    var order      = settings.tabOrder ? settings.tabOrder.slice() : DEFAULT_TABS.map(function (t) { return t.id; });
    var labels     = settings.tabLabels || {};
    var tabCfg     = settings.tabs || {};
    var tabGroups  = settings.tabGroups || {};

    // DEFAULT_TABS에 추가된 탭이 order에 누락되어 있다면 자동으로 order 끝에 추가해 줍니다.
    DEFAULT_TABS.forEach(function (t) {
      if (order.indexOf(t.id) === -1) {
        order.push(t.id);
      }
    });

    return order.map(function (id) {
      var def = DEFAULT_TABS.find(function (t) { return t.id === id; });
      if (!def) return null;
      var cfg = tabCfg[id];
      var visible = true, requireAuth = false;
      if (cfg !== undefined) {
        if (typeof cfg === 'boolean') { visible = cfg; }
        else { visible = cfg.visible !== false; requireAuth = !!cfg.requireAuth; }
      }
      var group = TAB_GROUPS.some(function (item) { return item.id === tabGroups[id]; }) ? tabGroups[id] : def.group;
      return { id: id, defaultName: def.name, label: labels[id] || '', group: group, visible: visible, requireAuth: requireAuth };
    }).filter(Boolean);
  }

  function renderTabManager(settings) {
    var container = $('adminTabManager');
    if (!container) return;
    container.innerHTML = '';
    var defaultTab = settings.defaultTab || 'tabBtnCommonPrompt';
    var tabs = getTabList(settings);
    TAB_GROUPS.forEach(function (group) {
      var section = document.createElement('section');
      section.className = 'admin-tm-group';
      section.dataset.tabGroup = group.id;

      var heading = document.createElement('div');
      heading.className = 'admin-tm-group-heading';
      heading.textContent = group.name;

      var list = document.createElement('div');
      list.className = 'admin-tm-group-list';
      list.dataset.tabGroupList = group.id;
      tabs.filter(function (t) { return t.group === group.id; }).forEach(function (t) {
        list.appendChild(buildTabRow(t, defaultTab === t.id));
      });

      section.appendChild(heading);
      section.appendChild(list);
      container.appendChild(section);
    });
    initDnD(container);
  }

  function buildTabRow(t, isDefault) {
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
    label.maxLength = 30;
    label.setAttribute('aria-label', t.defaultName + ' 탭 이름');

    var def = document.createElement('span');
    def.className = 'admin-tm-default';
    def.textContent = '기본명: ' + t.defaultName;

    var groupSelect = document.createElement('select');
    groupSelect.className = 'admin-tm-group-select';
    groupSelect.setAttribute('aria-label', t.defaultName + ' 탭 위치');
    TAB_GROUPS.forEach(function (group) {
      var option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.name;
      option.selected = group.id === t.group;
      groupSelect.appendChild(option);
    });
    groupSelect.addEventListener('change', function () {
      var target = document.querySelector('[data-tab-group-list="' + groupSelect.value + '"]');
      if (target) target.appendChild(row);
    });

    // 기본 탭 선택 (라디오 버튼)
    var defTabGroup = document.createElement('span');
    defTabGroup.className = 'admin-tm-toggle-group admin-tm-default-group';
    var defTabLbl = document.createElement('span');
    defTabLbl.className = 'admin-tm-toggle-label';
    defTabLbl.textContent = '기본 탭';
    var defTabRadio = document.createElement('input');
    defTabRadio.type = 'radio';
    defTabRadio.name = 'defaultTab';
    defTabRadio.value = t.id;
    defTabRadio.checked = !!isDefault;
    defTabRadio.className = 'admin-tm-default-radio';
    defTabRadio.setAttribute('aria-label', t.defaultName + ' 기본 탭 지정');
    defTabGroup.appendChild(defTabLbl);
    defTabGroup.appendChild(defTabRadio);

    // 접근 제한 토글 (로그인/권한 필요)
    var authGroup = document.createElement('span');
    authGroup.className = 'admin-tm-toggle-group admin-tm-auth-group';
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
    visGroup.className = 'admin-tm-toggle-group admin-tm-visible-group';
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
    var nameGroup = document.createElement('span');
    nameGroup.className = 'admin-tm-name-group';
    nameGroup.appendChild(label);
    nameGroup.appendChild(def);
    row.appendChild(nameGroup);
    row.appendChild(groupSelect);
    row.appendChild(defTabGroup);
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
      var list = e.target.closest('.admin-tm-group-list');
      if (!src || (!tgt && !list) || tgt === src) return;
      e.dataTransfer.dropEffect = 'move';
      if (!tgt) return;
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
      var list = e.target.closest('.admin-tm-group-list');
      if (!list || !src || tgt === src) return;
      if (tgt) {
        var above = e.clientY < tgt.getBoundingClientRect().top + tgt.offsetHeight / 2;
        tgt.classList.remove('admin-dnd-above', 'admin-dnd-below');
        list.insertBefore(src, above ? tgt : tgt.nextSibling);
      } else {
        list.appendChild(src);
      }
      var select = src.querySelector('.admin-tm-group-select');
      if (select) select.value = list.dataset.tabGroupList;
    });
    container.addEventListener('dragend', function () {
      if (src) src.classList.remove('admin-dnd-src');
      src = null;
      container.querySelectorAll('.admin-tm-row').forEach(function (r) { r.classList.remove('admin-dnd-above', 'admin-dnd-below'); });
    });
  }

  function collectTabManager() {
    var rows = document.querySelectorAll('#adminTabManager .admin-tm-row');
    var tabOrder = [], tabLabels = {}, tabGroups = {}, tabs = {};
    rows.forEach(function (row) {
      var id = row.dataset.tabId;
      tabOrder.push(id);
      var groupList = row.closest('[data-tab-group-list]');
      tabGroups[id] = groupList ? groupList.dataset.tabGroupList : 'special';
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

    var defaultRadio = document.querySelector('#adminTabManager input[name="defaultTab"]:checked');
    var defaultTab = defaultRadio ? defaultRadio.value : 'tabBtnCommonPrompt';

    return { tabOrder: tabOrder, tabLabels: tabLabels, tabGroups: tabGroups, tabs: tabs, defaultTab: defaultTab };
  }

  // ─── 사용자 목록 + 권한 매트릭스 ─────────────────────────────────────────────
  async function renderUsers() {
    var userSection = $('adminUserManagement');
    if (!userSection || userSection.hidden) return;
    var users = await PromptDeckAuth.getUsers();
    var container = $('adminUserList');
    if (!container) return;
    container.innerHTML = '';

    if (!users || users.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = '등록된 사용자가 없습니다. 위에서 사용자를 추가하세요.';
      container.appendChild(empty);
      renderPendingRequests([]);
      return;
    }

    container.appendChild(buildPermMatrix(users));
    renderPendingRequests(users);
  }

  function buildPermMatrix(users) {
    var settings = loadSettings();
    var tabList  = getTabList(settings);
    // 전역 비활성화 탭 제외
    var activeTabs = tabList.filter(function (t) {
      var cfg = settings.tabs && settings.tabs[t.id];
      if (!cfg) return true;
      if (typeof cfg === 'boolean') return cfg;
      return cfg.visible !== false;
    });

    var wrap = document.createElement('div');
    wrap.className = 'apm-wrap';

    var table = document.createElement('table');
    table.className = 'apm-table';

    // ── 헤더 ──
    var thead = document.createElement('thead');
    var hrow  = document.createElement('tr');

    var th0 = document.createElement('th');
    th0.className = 'apm-th-user';
    th0.textContent = '사용자';
    hrow.appendChild(th0);

    activeTabs.forEach(function (t) {
      var th = document.createElement('th');
      th.className = 'apm-th-tab';
      var fullName = t.label || t.defaultName;
      th.textContent = fullName;
      hrow.appendChild(th);
    });

    // 작업 열 헤더
    var thAct = document.createElement('th');
    thAct.className = 'apm-th-act';
    thAct.textContent = '작업';
    hrow.appendChild(thAct);

    thead.appendChild(hrow);
    table.appendChild(thead);

    // ── 바디 ──
    var tbody = document.createElement('tbody');

    users.forEach(function (user) {
      var tr = document.createElement('tr');
      tr.className = 'apm-row';
      tr.dataset.userId = user.id;

      // 사용자 이름 셀
      var tdUser = document.createElement('td');
      tdUser.className = 'apm-td-user';

      var nameWrap = document.createElement('div');
      nameWrap.className = 'apm-user-name-wrap';

      var nameEl = document.createElement('span');
      nameEl.className = 'apm-user-name';
      nameEl.textContent = user.username;

      var badge = document.createElement('span');
      badge.className = 'admin-user-badge admin-user-badge-' + user.role;
      badge.textContent = user.role === 'admin' ? '관' : '일';
      badge.title = user.role === 'admin' ? '관리자' : '일반 사용자';

      nameWrap.appendChild(nameEl);
      nameWrap.appendChild(badge);

      // 접근 요청 뱃지
      var pendingCount = (user.requestedTabs || []).length;
      if (pendingCount > 0) {
        var reqBadge = document.createElement('span');
        reqBadge.className = 'apm-req-badge';
        reqBadge.title = '접근 요청 ' + pendingCount + '건 대기';
        reqBadge.textContent = '요청 ' + pendingCount;
        nameWrap.appendChild(reqBadge);
      }

      // 전역 초기화 버튼 (개별 설정 중일 때만)
      if (user.tabPermissions !== null && user.tabPermissions !== undefined && user.role !== 'admin') {
        var resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'apm-reset-btn';
        resetBtn.title = '전역 설정으로 초기화';
        resetBtn.textContent = '전역';
        resetBtn.addEventListener('click', async function () {
          resetBtn.disabled = true;
          try {
            await PromptDeckAuth.updateUserPermissions(user.id, null);
            renderUsers();
          } catch (e) { alert(e.message); resetBtn.disabled = false; }
        });
        nameWrap.appendChild(resetBtn);
      }

      tdUser.appendChild(nameWrap);
      tr.appendChild(tdUser);

      // 권한 셀
      var isAdminUser = user.role === 'admin';
      var perms = user.tabPermissions;

      activeTabs.forEach(function (t) {
        var td = document.createElement('td');
        td.className = 'apm-td-perm';
        td.dataset.tabId = t.id;

        var isRequested = (user.requestedTabs || []).indexOf(t.id) !== -1;

        if (isAdminUser) {
          td.classList.add('apm-perm-admin');
          td.innerHTML = '<span class="apm-cell-icon">—</span>';
          td.title = '관리자는 모든 탭 접근 가능';
        } else {
          var state = perms === null || perms === undefined
            ? 'global'
            : (perms[t.id] === false ? 'off' : 'on');

          td.dataset.state = state;
          td.classList.add('apm-perm-' + state);
          if (isRequested) td.classList.add('apm-perm-requested');

          var icon = state === 'on' ? '✓' : state === 'off' ? '✗' : '~';
          td.innerHTML = '<span class="apm-cell-icon">' + icon + '</span>';
          td.title = (state === 'on' ? '허용' : state === 'off' ? '차단' : '전역 따름')
            + (isRequested ? ' · 접근 요청 대기' : '');

          td.addEventListener('click', async function () {
            var cur  = td.dataset.state;
            var next = cur === 'on' ? 'off' : 'on';

            // 낙관적 업데이트
            td.dataset.state = next;
            td.className     = 'apm-td-perm apm-perm-' + next + (isRequested ? ' apm-perm-requested' : '') + ' apm-saving';
            td.querySelector('.apm-cell-icon').textContent = next === 'on' ? '✓' : '✗';
            td.title = (next === 'on' ? '허용' : '차단') + (isRequested ? ' · 접근 요청 대기' : '');

            // 이 사용자의 모든 권한 수집
            var newPerms = {};
            tbody.querySelectorAll('tr[data-user-id="' + user.id + '"] .apm-td-perm').forEach(function (c) {
              if (c.dataset.state && c.dataset.state !== 'global') {
                newPerms[c.dataset.tabId] = c.dataset.state === 'on';
              }
            });

            try {
              await PromptDeckAuth.updateUserPermissions(user.id, newPerms);
              td.classList.remove('apm-saving');
            } catch (e) {
              // 롤백
              td.dataset.state = cur;
              td.className     = 'apm-td-perm apm-perm-' + cur + (isRequested ? ' apm-perm-requested' : '');
              td.querySelector('.apm-cell-icon').textContent = cur === 'on' ? '✓' : cur === 'off' ? '✗' : '~';
              td.classList.remove('apm-saving');
              alert('저장 실패: ' + e.message);
            }
          });
        }

        tr.appendChild(td);
      });

      // 작업 셀 (비번 변경 / 삭제)
      var tdAct = document.createElement('td');
      tdAct.className = 'apm-td-act';

      var pwBtn = document.createElement('button');
      pwBtn.type = 'button';
      pwBtn.className = 'admin-user-action-btn';
      pwBtn.textContent = '비번';
      pwBtn.title = '비밀번호 변경';
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

      tdAct.appendChild(pwBtn);
      tdAct.appendChild(delBtn);
      tr.appendChild(tdAct);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);

    // 범례
    var legend = document.createElement('div');
    legend.className = 'apm-legend';
    legend.innerHTML =
      '<span class="apm-legend-item apm-legend-on">✓ 허용</span>' +
      '<span class="apm-legend-item apm-legend-off">✗ 차단</span>' +
      '<span class="apm-legend-item apm-legend-global">~ 전역 따름</span>' +
      '<span class="apm-legend-item apm-legend-requested">● 접근 요청 대기</span>' +
      '<span class="apm-legend-hint">셀 클릭 시 즉시 저장</span>';
    wrap.appendChild(legend);

    return wrap;
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
    var settings = loadSettings();
    var configuredTabs = getTabList(settings);
    all.forEach(function (item) {
      var tabDef = DEFAULT_TABS.find(function (t) { return t.id === item.tabId; });
      var configuredTab = configuredTabs.find(function (t) { return t.id === item.tabId; });
      var tabName = configuredTab ? (configuredTab.label || configuredTab.defaultName) : (tabDef ? tabDef.name : item.tabId);
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
      adClient:      (($('adminAdClient')       || {}).value || '').trim(),
      adSlotTop:     (($('adminAdSlotTop')      || {}).value || '').trim(),
      adSlotBottom:  (($('adminAdSlotBottom')   || {}).value || '').trim(),
    };
  }

  function validateAds(ads) {
    if (!ads.adsEnabled) return '';
    if (!/^ca-pub-\d{6,32}$/.test(ads.adClient)) {
      return '광고를 활성화하려면 ca-pub-로 시작하는 올바른 Ad Client ID가 필요합니다.';
    }
    if (ads.adSlotTop && !/^\d{4,32}$/.test(ads.adSlotTop)) {
      return '광고 슬롯 1 ID는 광고 단위 코드의 숫자형 data-ad-slot 값을 입력해 주세요.';
    }
    if (ads.adSlotBottom && !/^\d{4,32}$/.test(ads.adSlotBottom)) {
      return '광고 슬롯 2 ID는 광고 단위 코드의 숫자형 data-ad-slot 값을 입력해 주세요.';
    }
    if (ads.adSlotBottom && !ads.adSlotTop) {
      return '광고 슬롯 2를 사용하려면 광고 슬롯 1도 함께 입력해 주세요.';
    }
    return '';
  }

  async function loadAdClientFromAdsTxt() {
    var btn = $('adminAdClientFromAdsTxt');
    var input = $('adminAdClient');
    if (!btn || !input) return;
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '확인 중...';
    try {
      var response = await fetch('/ads.txt', { cache: 'no-store' });
      if (!response.ok) throw new Error('ADS_TXT_UNAVAILABLE');
      var source = await response.text();
      var matches = Array.from(source.matchAll(/(?:^|\r?\n)\s*google\.com\s*,\s*pub-(\d{6,32})\s*,\s*(?:DIRECT|RESELLER)\b/gimu));
      var publisherIds = Array.from(new Set(matches.map(function (match) { return match[1]; })));
      if (publisherIds.length !== 1) throw new Error(publisherIds.length ? 'ADS_TXT_AMBIGUOUS' : 'ADS_TXT_MISSING_GOOGLE');
      input.value = 'ca-pub-' + publisherIds[0];
      var adsChk = $('adminAdsEnabled');
      if (adsChk) adsChk.checked = true;
      toggleAds(true);
      setStatus('ads.txt에서 Ad Client ID를 불러왔습니다. 설정 저장을 눌러 반영하세요.', 'ok');
    } catch (error) {
      var message = error && error.message === 'ADS_TXT_AMBIGUOUS'
        ? 'ads.txt에 Google 게시자 ID가 여러 개 있어 AdSense 계정의 Client ID를 직접 입력해야 합니다.'
        : 'ads.txt에서 Google 게시자 ID를 찾지 못했습니다. AdSense 광고 코드의 Client ID를 직접 입력해 주세요.';
      setStatus(message, 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  // ─── 저장 / 초기화 ──────────────────────────────────────────────────────────
  function handleSave() {
    var tm = collectTabManager();
    var hasEnabled = Object.values(tm.tabs).some(function (t) {
      return typeof t === 'boolean' ? t : t.visible;
    });
    if (!hasEnabled) { setStatus('최소 하나의 탭은 활성화해야 합니다.', 'err'); return; }
    if (!tm.tabs[tm.defaultTab] || !tm.tabs[tm.defaultTab].visible) {
      setStatus('기본 탭은 사용자 화면에 보이는 탭으로 선택해 주세요.', 'err');
      return;
    }

    var visibleLabels = {};
    var duplicateLabel = '';
    getTabList(tm).forEach(function (tab) {
      if (duplicateLabel || !tm.tabs[tab.id].visible) return;
      var label = (tm.tabLabels[tab.id] || tab.defaultName).replace(/\s+/g, ' ').trim();
      var normalized = label.toLocaleLowerCase('ko-KR');
      if (visibleLabels[normalized]) duplicateLabel = label;
      visibleLabels[normalized] = true;
    });
    if (duplicateLabel) {
      setStatus('표시되는 탭 이름은 서로 달라야 합니다: ' + duplicateLabel, 'err');
      return;
    }

    var ads = collectAds();
    var adsError = validateAds(ads);
    if (adsError) { setStatus(adsError, 'err'); return; }

    var data = Object.assign({}, collectProgramInfo(), tm, ads);
    var unsplashInput = $('adminUnsplashKey');
    if (unsplashInput) data.unsplashKey = unsplashInput.value.trim();

    if (!saveSettings(data)) { setStatus('저장 실패. localStorage를 확인하세요.', 'err'); return; }
    renderUsers();

    localStorage.removeItem('mixer_unsplash_key');

    setStatus('저장 중...', '');
    // 서버에도 저장
    fetch('/api/admin-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    localStorage.removeItem('mixer_unsplash_key');
    var s = {};
    populateProgramInfo(s);
    populateAds(s);
    renderTabManager(s);
    renderUsers();
    var unsplashInput = $('adminUnsplashKey');
    if (unsplashInput) unsplashInput.value = '';
    var session = PromptDeckAuth.loadSession();
    fetch('/api/admin-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    }).then(function (response) {
      setStatus(response.ok ? '로컬과 서버 설정을 초기화했습니다.' : '로컬 설정만 초기화했습니다.', response.ok ? 'ok' : '');
    }).catch(function () {
      setStatus('로컬 설정을 초기화했습니다. (서버 연결 없음)', 'ok');
    });
  }

  function setAccessKeyStatus(msg, type) {
    var el = $("adminAccessKeyUpdateStatus");
    if (!el) return;
    el.textContent = msg;
    el.className = "admin-save-status" + (type ? " " + type : "");
    if (type === "ok") {
      window.setTimeout(function () {
        if (el.textContent === msg) {
          el.textContent = "";
          el.className = "admin-save-status";
        }
      }, 3500);
    }
  }

  function normalizeAccessKeyValue(raw) {
    return String(raw || "")
      .normalize("NFC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, "")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim();
  }

  function resolveAccessKeyUpdateErrorMessage(rawError) {
    var message = String(rawError || "");
    if (message === "The administrator access key is incorrect.") {
      return "현재 비밀번호가 올바르지 않습니다.";
    }
    if (message === "Admin only.") {
      return "관리자 인증이 필요합니다. 다시 로그인 후 시도해 주세요.";
    }
    return message || "요청이 실패했습니다.";
  }
  function handleAccessKeyUpdate() {
    var currentEl = $("adminCurrentAccessKey");
    var nextEl = $("adminNewAccessKey");
    var confirmEl = $("adminNewAccessKeyConfirm");
    var btn = $("adminAccessKeyUpdateBtn");
    if (!currentEl || !nextEl || !confirmEl || !btn) return;
    var currentAccessKey = normalizeAccessKeyValue(currentEl.value);
    var nextAccessKey = normalizeAccessKeyValue(nextEl.value);
    var confirmAccessKey = normalizeAccessKeyValue(confirmEl.value);
    if (!currentAccessKey || !nextAccessKey || !confirmAccessKey) {
      setAccessKeyStatus("현재 비밀번호, 새 비밀번호, 확인 비밀번호를 모두 입력하세요.", "err");
      return;
    }
    if (nextAccessKey !== confirmAccessKey) {
      setAccessKeyStatus("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.", "err");
      return;
    }
    btn.disabled = true;
    setAccessKeyStatus("변경 요청 중...", "");
    fetch("/api/admin/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentAccessKey: currentAccessKey,
        newAccessKey: nextAccessKey,
        confirmAccessKey: confirmAccessKey,
      }),
    }).then(function (response) {
      return response.json().catch(function () { return null; }).then(function (payload) {
        payload = payload || {};
        if (!response.ok || !payload.ok) {
              throw new Error(payload.error || "요청이 실패했습니다.");
        }
        currentEl.value = "";
        nextEl.value = "";
        confirmEl.value = "";
        setAccessKeyStatus("관리자 비밀번호가 변경되었습니다.", "ok");
      });
    }).catch(function (error) {
      setAccessKeyStatus(resolveAccessKeyUpdateErrorMessage(error && error.message), "err");
    }).finally(function () {
      btn.disabled = false;
    });
  }

  // ─── 초기화 ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async function () {
    if (window.PROMPTDECK_STATIC_MODE) {
      var localServerOnlySection = $('adminApiIntegrationSection');
      if (localServerOnlySection) localServerOnlySection.hidden = true;
    }
    // 세션 표시
    var session = PromptDeckAuth.loadSession();
    if (session) {
      var nameEl = $('adminSessionName');
      if (nameEl) nameEl.textContent = session.username;
    }
    var sessionNameEl = $('adminSessionName');
    if (sessionNameEl && !sessionNameEl.textContent) sessionNameEl.textContent = '\uAD00\uB9AC\uC790 \uBAA8\uB4DC';

    var exitBtn = $('adminModeExitBtn');
    if (exitBtn) {
      exitBtn.addEventListener('click', function () {
        exitBtn.disabled = true;
        fetch('/api/admin/logout', { method: 'POST' })
          .finally(function () { window.location.replace(window.PROMPTDECK_STATIC_MODE ? 'app' : 'index.html'); });
      });
    }
    // 관리자 목록과 사용자 권한 매트릭스를 실제 앱의 탭 구조와 동기화합니다.
    await loadCurrentTabs();

    // 폼 채우기
    var s = await loadServerSettings();
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
      pwInput.value = '';
      pwToggle.addEventListener('click', function () {
        var hidden = pwInput.type === 'password';
        pwInput.type = hidden ? 'text' : 'password';
        pwToggle.textContent = hidden ? '숨김' : '표시';
      });
    }

    // 광고 토글

    // 관리자 비밀번호 토글
    var accessKeyToggle = $("adminAccessKeyShowBtn");
    var accessKeyInput = $("adminCurrentAccessKey");
    if (accessKeyToggle && accessKeyInput) {
      accessKeyInput.value = "";
      accessKeyToggle.addEventListener("click", function () {
        var hidden = accessKeyInput.type === "password";
        accessKeyInput.type = hidden ? "text" : "password";
        accessKeyToggle.textContent = hidden ? "숨김" : "표시";
      });
    }

    var adsChk = $('adminAdsEnabled');
    if (adsChk) adsChk.addEventListener('change', function () { toggleAds(adsChk.checked); });
    var adsTxtBtn = $('adminAdClientFromAdsTxt');
    if (adsTxtBtn) adsTxtBtn.addEventListener('click', loadAdClientFromAdsTxt);

    // 저장 / 초기화

    // 관리자 비밀번호 변경
    var accessKeyUpdateBtn = $("adminAccessKeyUpdateBtn");
    if (accessKeyUpdateBtn) accessKeyUpdateBtn.addEventListener("click", handleAccessKeyUpdate);

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
        var adultConfirmed = !!($('newUserAdultConfirmed') || {}).checked;
        var errEl    = $('newUserError');
        if (errEl) errEl.textContent = '';
        createBtn.disabled = true;
        try {
          if (!adultConfirmed) throw new Error('만 18세 이상 확인이 필요합니다.');
          await PromptDeckAuth.createUser(username, password, role, adultConfirmed);
          var detailsEl = $('adminCreateUserDetails');
          if (detailsEl) detailsEl.removeAttribute('open');
          if ($('newUsername')) $('newUsername').value = '';
          if ($('newPassword')) $('newPassword').value = '';
          if ($('newUserAdultConfirmed')) $('newUserAdultConfirmed').checked = false;
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
