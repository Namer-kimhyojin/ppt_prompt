'use strict';

/**
 * PromptDeckAuth — 서버 API 기반 인증 모듈
 * 인증 자격증명은 HttpOnly 쿠키로만 보관하고, 화면 표시용 사용자 정보만 sessionStorage에 둔다.
 */
(function (global) {
  var SESSION_SK = 'promptdeck_session';  // 비밀정보가 아닌 화면 표시용 사용자 정보
  var HAS_USERS_SK = 'promptdeck_has_users'; // "1" or "0"

  // ── 서버 감지 ───────────────────────────────────────────────────────────────
  // /api/auth/* 가 있으면 서버 모드, 없으면 localStorage 폴백
  var _serverMode = null; // null=미확인, true, false

  function apiHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  async function _detectServer() {
    if (_serverMode !== null) return _serverMode;
    try {
      var r = await fetch('/api/auth/has-users', { method: 'GET' });
      if (r.ok) {
        var d = await r.json();
        if (d.authEnabled === false) {
          _serverMode = false;
          localStorage.setItem(HAS_USERS_SK, '0');
          localStorage.removeItem(SESSION_SK);
          sessionStorage.removeItem(SESSION_SK);
          return false;
        }
        _serverMode = true;
        localStorage.setItem(HAS_USERS_SK, d.hasUsers ? '1' : '0');
        return true;
      }
    } catch (_) {}
    // 서버 없음 → 캐시 초기화해 불필요한 로그인 redirect 방지
    _serverMode = false;
    localStorage.setItem(HAS_USERS_SK, '0');
    localStorage.removeItem(SESSION_SK);
    sessionStorage.removeItem(SESSION_SK);
    return false;
  }

  function _rawSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_SK) || 'null');
      if (s && s.expiresAt > Date.now()) return s;
      if (s) sessionStorage.removeItem(SESSION_SK);
      return null;
    } catch (e) { return null; }
  }
  function _writeSession(data) {
    var safe = Object.assign({}, data);
    delete safe.token;
    sessionStorage.setItem(SESSION_SK, JSON.stringify(safe));
    localStorage.removeItem(SESSION_SK);
    return safe;
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
      fetch('/api/auth/logout', { method: 'POST', headers: apiHeaders() }).catch(function () {});
      localStorage.removeItem(SESSION_SK);
      sessionStorage.removeItem(SESSION_SK);
    },

    // ── 서버 API 래퍼 ──────────────────────────────────────────────────────────
    async signup(username, email, password, legalConsent) {
      var srv = await _detectServer();
      if (!srv) return null;
      try {
        var r = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            acceptedTermsVersion: legalConsent && legalConsent.termsVersion,
            acceptedPrivacyVersion: legalConsent && legalConsent.privacyVersion,
            ageConfirmed: !!(legalConsent && legalConsent.ageConfirmed)
          })
        });
        var d = await r.json();
        return d; // { ok, autoApproved, email, error }
      } catch (_) { return null; }
    },

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
          if (!d.ok) return d; // { ok:false, error } — 실패 이유를 호출자에게 전달
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
        if (!r.ok) {
          localStorage.removeItem(SESSION_SK);
          sessionStorage.removeItem(SESSION_SK);
          return null;
        }
        var me = await r.json();
        if (me && me.ok) _writeSession(Object.assign({}, me, { expiresAt: Date.now() + 24 * 60 * 60 * 1000 }));
        return me;
      } catch (_) { return null; }
    },

    async updateMe(currentPassword, newPassword, newEmail) {
      var r = await fetch('/api/auth/me/update', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword || undefined, newEmail: newEmail || undefined })
      });
      return await r.json(); // { ok, error? , pendingEmailRequested? }
    },

    async exportMe() {
      var r = await fetch('/api/auth/me/export', { headers: apiHeaders() });
      var d = await r.json();
      if (!d.ok) throw new Error(d.error || '내 정보 내보내기 실패');
      return d;
    },

    async deleteMe(currentPassword, confirmation) {
      var r = await fetch('/api/auth/me/delete', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ currentPassword: currentPassword, confirmation: confirmation })
      });
      var d = await r.json();
      if (!d.ok) throw new Error(d.error || '회원탈퇴 실패');
      localStorage.removeItem(SESSION_SK);
      sessionStorage.removeItem(SESSION_SK);
      return d;
    },

    async getUsers() {
      try {
        var r = await fetch('/api/auth/users', { headers: apiHeaders() });
        var d = await r.json();
        return d.ok ? d.users : [];
      } catch (_) { return []; }
    },

    async createUser(username, password, role, adultConfirmed) {
      var r = await fetch('/api/auth/users', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ username: username, password: password, role: role || 'user', adultConfirmed: adultConfirmed === true })
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
      var server = await _detectServer();
      if (server && _rawSession()) await Auth.getMe();
    },

    // 서버 모드 여부 (정적 환경 판별용)
    async detectServer() {
      return _detectServer();
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
