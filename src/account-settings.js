(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('userBarAccount');
    if (!btn) return;

    btn.addEventListener('click', openAccountModal);

    // 이메일 변경 확인 결과 배너 (index.html?emailChange=ok|expired)
    var param = new URLSearchParams(window.location.search).get('emailChange');
    if (param === 'ok' || param === 'expired') {
      showBanner(
        param === 'ok' ? '이메일이 변경되었습니다.' : '이메일 변경 확인 링크가 만료되었습니다. 다시 시도해주세요.',
        param === 'ok'
      );
      var url = new URL(window.location.href);
      url.searchParams.delete('emailChange');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  });

  function showBanner(text, ok) {
    var el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9500;' +
      'padding:10px 18px;border-radius:8px;font-size:13px;font-family:inherit;' +
      (ok ? 'background:#e8f7ee;color:#1a7a3c;border:1px solid #b2dcbf'
          : 'background:#fdecea;color:#bf3b3b;border:1px solid #f0b8b8');
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 4000);
  }

  async function openAccountModal() {
    var me = await window.PromptDeckAuth.getMe();
    if (!me || !me.ok) return;

    var existing = document.getElementById('accountModal');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'accountModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9000;';

    var box = document.createElement('div');
    box.style.cssText = 'background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:28px;width:360px;max-width:90vw;box-shadow:var(--shadow);font-family:inherit;';

    box.innerHTML =
      '<h3 style="margin:0 0 18px;font-size:16px;">계정 설정</h3>' +
      '<div style="font-size:13px;color:var(--ink-soft);margin-bottom:16px;">' +
        '아이디: <strong>' + escapeHtml(me.username) + '</strong><br>' +
        '현재 이메일: <strong>' + escapeHtml(me.email || '(등록된 이메일 없음)') + '</strong>' +
      '</div>' +
      field('acctCurrentPw', '현재 비밀번호', 'password', '변경을 위해 필수 입력') +
      '<hr style="border:none;border-top:1px solid var(--line);margin:18px 0">' +
      field('acctNewPw', '새 비밀번호 (선택)', 'password', '12자 이상, 문자 종류 3가지 이상') +
      field('acctNewPwConfirm', '새 비밀번호 확인', 'password', '') +
      '<hr style="border:none;border-top:1px solid var(--line);margin:18px 0">' +
      field('acctNewEmail', '새 이메일 (선택)', 'email', '변경 시 확인 메일 발송') +
      '<div style="font-size:12px;margin:14px 0"><a href="privacy.html" target="_blank" rel="noopener">개인정보 처리방침</a> · <a href="terms.html" target="_blank" rel="noopener">이용약관</a> · <a href="ai-policy.html" target="_blank" rel="noopener">AI 이용 안내</a></div>' +
      '<div id="acctError" style="color:#bf3b3b;font-size:13px;margin:4px 0 12px;min-height:1em;"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
        '<button type="button" id="acctExportBtn" style="padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--ink);cursor:pointer;font-size:13px;font-family:inherit;">내 정보 받기</button>' +
        '<button type="button" id="acctDeleteBtn" style="padding:9px 12px;border:1px solid #bf3b3b;border-radius:8px;background:transparent;color:#bf3b3b;cursor:pointer;font-size:13px;font-family:inherit;">회원탈퇴</button>' +
        '<button type="button" id="acctCancelBtn" style="padding:9px 16px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--ink-soft);cursor:pointer;font-size:14px;font-family:inherit;">닫기</button>' +
        '<button type="button" id="acctSaveBtn" style="padding:9px 16px;border:none;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer;font-size:14px;font-weight:600;font-family:inherit;">저장</button>' +
      '</div>';

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.getElementById('acctCancelBtn').addEventListener('click', function () { overlay.remove(); });

    document.getElementById('acctExportBtn').addEventListener('click', async function () {
      var errEl = document.getElementById('acctError');
      try {
        var data = await window.PromptDeckAuth.exportMe();
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'promptdeck-my-data.json';
        link.click();
        setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
      } catch (err) { errEl.textContent = err.message || '내 정보를 받지 못했습니다.'; }
    });

    document.getElementById('acctDeleteBtn').addEventListener('click', async function () {
      var errEl = document.getElementById('acctError');
      var currentPw = document.getElementById('acctCurrentPw').value;
      if (!currentPw) { errEl.textContent = '탈퇴하려면 현재 비밀번호를 입력하세요.'; return; }
      var confirmation = window.prompt("계정과 생성 파일을 삭제하려면 '회원탈퇴'를 입력하세요. 이 작업은 되돌릴 수 없습니다.");
      if (confirmation !== '회원탈퇴') return;
      try {
        await window.PromptDeckAuth.deleteMe(currentPw, confirmation);
        window.location.href = 'login.html?deleted=1';
      } catch (err) { errEl.textContent = err.message || '회원탈퇴에 실패했습니다.'; }
    });

    document.getElementById('acctSaveBtn').addEventListener('click', async function () {
      var errEl = document.getElementById('acctError');
      errEl.textContent = '';

      var currentPw = document.getElementById('acctCurrentPw').value;
      var newPw = document.getElementById('acctNewPw').value;
      var newPwConfirm = document.getElementById('acctNewPwConfirm').value;
      var newEmail = document.getElementById('acctNewEmail').value.trim();

      if (!currentPw) { errEl.textContent = '현재 비밀번호를 입력하세요.'; return; }
      if (!newPw && !newEmail) { errEl.textContent = '변경할 내용을 입력하세요.'; return; }
      if (newPw && newPw !== newPwConfirm) { errEl.textContent = '새 비밀번호가 일치하지 않습니다.'; return; }

      var saveBtn = document.getElementById('acctSaveBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = '저장 중...';

      try {
        var result = await window.PromptDeckAuth.updateMe(currentPw, newPw, newEmail);
        if (!result || !result.ok) {
          errEl.textContent = (result && result.error) || '저장에 실패했습니다.';
          return;
        }
        overlay.remove();
        if (result.pendingEmailRequested) {
          showBanner('새 이메일로 확인 메일을 보냈습니다. 메일함에서 확인해주세요.', true);
        } else {
          showBanner('저장되었습니다.', true);
        }
      } catch (err) {
        errEl.textContent = err.message || '오류가 발생했습니다.';
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장';
      }
    });
  }

  function field(id, label, type, hint) {
    return '<div style="margin-bottom:12px;">' +
      '<label for="' + id + '" style="display:block;font-size:12px;color:var(--ink-soft);margin-bottom:4px;">' + label + '</label>' +
      '<input type="' + type + '" id="' + id + '" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2, transparent);color:var(--ink);font-size:14px;font-family:inherit;box-sizing:border-box;">' +
      (hint ? '<div style="font-size:11px;color:var(--ink-soft);margin-top:3px;">' + hint + '</div>' : '') +
      '</div>';
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
