'use strict';

/**
 * PromptDeckAuth — 서버 API 기반 인증 모듈
 * 세션 토큰을 localStorage에 캐시하여 동기 hasUsers/loadSession 지원.
 * 서버가 없는 환경(정적 호스팅)에서는 자동으로 localStorage 폴백 동작.
 */
(function (global) {
  var SESSION_SK = 'promptdeck_session';  // { token, userId, username, role, tabPermissions, requestedTabs, expiresAt }
  var HAS_USERS_SK = 'promptdeck_has_users'; // "1" or "0"

  // ── 서버 감지 ───────────────────────────────────────────────────────────────
  // /api/auth/* 가 있으면 서버 모드, 없으면 localStorage 폴백
  var _serverMode = null; // null=미확인, true, false

  function apiHeaders() {
    var tok = _rawSession() && _rawSession().token;
    return tok ? { 'Content-Type': 'application/json', 'x-session-token': tok }
               : { 'Content-Type': 'application/json' };
  }

  async function _detectServer() {
    if (_serverMode !== null) return _serverMode;
    try {
      var r = await fetch('/api/auth/has-users', { method: 'GET' });
      if (r.ok) {
        var d = await r.json();
        _serverMode = true;
        localStorage.setItem(HAS_USERS_SK, d.hasUsers ? '1' : '0');
        return true;
      }
    } catch (_) {}
    _serverMode = false;
    return false;
  }

  function _rawSession() {
    try {
      var s = JSON.parse(localStorage.getItem(SESSION_SK) || 'null');
      if (s && s.expiresAt > Date.now()) return s;
      if (s) localStorage.removeItem(SESSION_SK);
      return null;
    } catch (e) { return null; }
  }
  function _writeSession(data) {
    localStorage.setItem(SESSION_SK, JSON.stringify(data));
    return data;
  }

  // ── 공개 API ────────────────────────────────────────────────────────────────
  var Auth = {

    // 동기 — 페이지 로드 시 즉시 판별용
    loadSession: function () { return _rawSession(); },
    hasUsers: function () {
      // 캐시 우선, 없으면 서버 감지를 백그라운드로 트리거
      var cached = localStorage.getItem(HAS_USERS_SK);
      if (cached !== null) return cached === '1';
      // 아직 모르면 서버 확인 시작 (결과는 다음 로드에 반영)
      _detectServer();
      return false;
    },
    clearSession: function () {
      var s = _rawSession();
      if (s && s.token) {
        fetch('/api/auth/logout', { method: 'POST', headers: apiHeaders() }).catch(function () {});
      }
      localStorage.removeItem(SESSION_SK);
    },

    // ── 서버 API 래퍼 ──────────────────────────────────────────────────────────
    async login(username, password) {
      var srv = await _detectServer();
      if (srv) {
        try {
          var r = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
          });
          var d = await r.json();
          if (!d.ok) return null;
          // has-users 캐시 갱신
          localStorage.setItem(HAS_USERS_SK, '1');
          return _writeSession(d);
        } catch (_) { return null; }
      }
      // 폴백: localStorage 모드 (서버 없음)
      return null;
    },

    async getMe() {
      try {
        var r = await fetch('/api/auth/me', { headers: apiHeaders() });
        return r.ok ? await r.json() : null;
      } catch (_) { return null; }
    },

    async getUsers() {
      try {
        var r = await fetch('/api/auth/users', { headers: apiHeaders() });
        var d = await r.json();
        return d.ok ? d.users : [];
      } catch (_) { return []; }
    },

    async createUser(username, password, role) {
      var r = await fetch('/api/auth/users', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ username: username, password: password, role: role || 'user' })
      });
      var d = await r.json();
      if (!d.ok) throw new Error(d.error || '사용자 생성 실패');
      return d.user;
    },

    async changePassword(userId, newPassword) {
      var r = await fetch('/api/auth/users/' + userId + '/update', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ password: newPassword })
      });
      var d = await r.json();
      if (!d.ok) throw new Error(d.error || '비밀번호 변경 실패');
    },

    async deleteUser(userId) {
      var r = await fetch('/api/auth/users/' + userId + '/delete', {
        method: 'POST',
        headers: apiHeaders()
      });
      var d = await r.json();
      if (!d.ok) throw new Error(d.error || '사용자 삭제 실패');
    },

    async updateUserPermissions(userId, tabPermissions) {
      var r = await fetch('/api/auth/users/' + userId + '/update', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ tabPermissions: tabPermissions })
      });
      var d = await r.json();
      if (!d.ok) throw new Error(d.error || '권한 변경 실패');
    },

    async approveRequest(userId, tabId) {
      // 먼저 현재 user 가져오기
      var users = await Auth.getUsers();
      var user = (users || []).find(function (u) { return u.id === userId; });
      if (!user) throw new Error('User not found');
      var perm = user.tabPermissions || {};
      perm[tabId] = true;
      var req = (user.requestedTabs || []).filter(function (t) { return t !== tabId; });
      await fetch('/api/auth/users/' + userId + '/update', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ tabPermissions: perm, requestedTabs: req })
      });
    },

    async denyRequest(userId, tabId) {
      var users = await Auth.getUsers();
      var user = (users || []).find(function (u) { return u.id === userId; });
      if (!user) return;
      var req = (user.requestedTabs || []).filter(function (t) { return t !== tabId; });
      await fetch('/api/auth/users/' + userId + '/update', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ requestedTabs: req })
      });
    },

    async requestTabAccess(tabId) {
      try {
        await fetch('/api/auth/request-access', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ tabId: tabId })
        });
        // 로컬 세션 requestedTabs도 즉시 반영
        var s = _rawSession();
        if (s) {
          if (!s.requestedTabs) s.requestedTabs = [];
          if (s.requestedTabs.indexOf(tabId) === -1) {
            s.requestedTabs.push(tabId);
            _writeSession(s);
          }
        }
        return true;
      } catch (_) { return false; }
    },

    // 초기화: has-users 캐시를 서버에서 갱신
    async init() {
      await _detectServer();
    }
  };

  global.PromptDeckAuth = Auth;

  // 페이지 로드 시 백그라운드로 has-users 동기화
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      Auth.init().catch(function () {});
    });
  }
})(window);
