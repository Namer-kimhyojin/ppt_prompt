# ADR: Cloudflare Pages 관리자 인증

**상태:** 적용
**일자:** 2026-07-23

## 배경

PromptDeck의 기존 관리자 모드는 Node 서버의 `/api/admin/access`, 메모리 세션, 로컬 파일 저장을 사용한다. Cloudflare Pages 정적 배포본에는 이 서버가 없으므로 관리자 창은 열리지만 인증 API가 404를 반환했다.

## 결정

- 기존 관리자 비밀번호 창과 `admin.html`을 유지한다.
- Cloudflare Pages Functions가 관리자 인증과 설정 API를 제공한다.
- 최초 비밀번호는 Cloudflare Secret `PROMPTDECK_ADMIN_ACCESS_KEY`에서 읽는다.
- 비밀번호 변경 후에는 PBKDF2-SHA-256 파생값만 Workers KV에 저장한다.
- 세션은 별도의 Cloudflare Secret으로 HMAC 서명한 4시간 `HttpOnly`, `SameSite=Strict`, `Secure` 쿠키를 사용한다.
- 관리자 설정은 Workers KV에 저장하며 공개 GET 응답에는 비밀값을 포함하지 않는다.
- `/admin.html`은 Pages Functions 미들웨어에서 인증된 세션만 통과시킨다.

## 대안

- 브라우저 JavaScript 비밀번호: 소스에서 비밀번호가 노출되므로 제외한다.
- Cloudflare Access만 사용: 접근 제한에는 적합하지만 기존 비밀번호 UI와 설정 저장 API를 그대로 사용할 수 없어 제외한다.
- 기존 Node 서버 별도 호스팅: 전체 기능 이식에는 유리하지만 이번 정적 Pages 운영 범위를 넘어 제외한다.

## 결과

- 정적 Pages 주소에서도 관리자 비밀번호 인증, 로그아웃, 비밀번호 변경, 프로그램·탭·광고 설정 저장이 가능하다.
- 사용자 계정 관리와 로컬 이미지 생성 같은 Node 전용 기능은 정적 배포에서 계속 제외한다.
