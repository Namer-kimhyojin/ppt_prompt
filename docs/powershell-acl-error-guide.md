# PowerShell ACL/권한 오류 가이드

## 원인 요약

`CreateProcess` 실행 시 `helper_unknown_error` 또는 `Access is denied`가 보이면, 보통 대상 프로세스(예: `node`, `python`)를 실행할 권한이 없거나 폴더/파일 ACL이 거부된 상태입니다.

- PowerShell이 직접 실행할 때만 반복되면, 파워셸 프로필/정책, 보안 소프트웨어, 폴더 ACL을 먼저 의심하세요.
- `index.html`/`src/*.js` 같은 소스 파일이 잠겨 있으면 `CreateProcess` 전에 경로 접근 단계에서 멈출 수 있습니다.

## 현재 프로젝트에서 빠르게 쓰는 확인 명령

- PowerShell ACL 오류/권한 문제는 `safe-run`을 통해 먼저 확인합니다.

```bash
node scripts/safe-run.mjs node --check src/tabs.js
node scripts/safe-run.mjs node --check src/map-prompt.js
node scripts/safe-run.mjs node --check src/slide-document.js
node scripts/safe-run.mjs node --check src/promotion.js
```

## 권장 원클릭 점검

새로 추가한 스크립트는 UI/UX 점검 흐름에서 필요한 항목(문법 검사 + smoke test)을 한 번에 실행합니다.

```bash
npm run safe:preflight
# 또는
node scripts/safe-run.mjs node scripts/safe-preflight.mjs
```

`safe:preflight`는 다음 항목을 검사합니다.
- app.js, src/tabs.js, src/map-prompt.js, src/slide-document.js, src/promotion.js
- scripts/smoke-test.mjs

실행 실패 시 `safe-run`은 `CreateProcess` 권한 오류를 감지해 원인 메시지를 같이 출력합니다.

## 추가 점검

- ACL이 의심되면 대상 폴더/파일 권한을 확인하고, 개발자 권한 터미널에서 재시도해 보세요.
- 여전히 실패하면 에러 코드와 함께 실행 경로를 기록해 에디터/보안 소프트웨어 예외 처리 대상인지 확인하세요.