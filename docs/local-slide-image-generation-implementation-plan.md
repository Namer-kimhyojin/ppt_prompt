# 로컬 슬라이드 이미지 자동 생성 구현 계획

## 1. 목표

현재 앱에서 만든 개별 슬라이드별 프롬프트를 Google 이미지 생성 API와 연결해, 로컬 PC에서 슬라이드 이미지를 자동 생성한다.

초기 버전은 서비스 배포가 아니라 **내 컴퓨터에서만 실행하는 로컬 도구**를 목표로 한다. 따라서 API 키는 우선 하드코딩 또는 로컬 설정 파일 방식으로 시작하되, 나중에 백엔드 Secret / 환경변수 / 사용자 계정 기반 서비스로 전환하기 쉽도록 API 호출부를 분리한다.

## 2. 구현 원칙

- 처음에는 "프롬프트 1개 -> 이미지 1장 생성 -> outputs 폴더 저장"만 성공시킨다.
- API 호출 코드는 프론트엔드 UI 코드와 분리한다.
- 이미지 생성은 한꺼번에 요청하지 않고 큐로 순차 실행한다.
- 실패, 재시도, 중단, 재개가 가능한 구조로 만든다.
- 나중에 GitHub Pages + 백엔드 또는 Cloud Run/Vercel/Firebase Functions 구조로 이전할 수 있게 파일 경계를 둔다.

## 3. 권장 파일 구조

```text
ppt_prompt/
├─ app.js
├─ index.html
├─ src/
│  ├─ image-generation-client.js
│  └─ generation-queue.js
├─ server/
│  ├─ local-server.js
│  ├─ google-image-api.js
│  └─ config.js
├─ outputs/
│  └─ .gitkeep
├─ docs/
│  └─ local-slide-image-generation-implementation-plan.md
└─ package.json
```

## 4. 단계별 구현 체크리스트

### Phase 0. 사전 결정

- [ ] 사용할 Google API 방식을 결정한다.
  - 빠른 로컬 MVP: Gemini API 또는 Google AI Studio 계열 이미지 생성
  - 운영 확장 고려: Vertex AI Imagen
- [ ] 생성 이미지 기본 규격을 정한다.
  - 기본값: 현재 슬라이드 프롬프트의 출력 규격을 그대로 사용
  - 파일 형식: 우선 PNG
  - 저장 위치: `outputs/`
- [ ] 요청 간 기본 대기 시간을 정한다.
  - 기본값: 10초
  - UI에서 나중에 변경 가능하게 한다.

완료 기준:
- API 방식, 기본 저장 폴더, 기본 대기 시간이 문서 또는 설정에 명확히 적혀 있다.

### Phase 1. 로컬 서버 뼈대 추가

목표:
브라우저 앱에서 직접 Google API를 호출하지 않고, 로컬 Node 서버를 통해 호출한다.

작업:
- [ ] `server/local-server.js` 추가
- [ ] `server/config.js` 추가
- [ ] `server/google-image-api.js` 추가
- [ ] `outputs/.gitkeep` 추가
- [ ] `package.json`에 로컬 서버 실행 스크립트 추가

예상 스크립트:

```json
{
  "scripts": {
    "dev:server": "node server/local-server.js",
    "smoke:test": "node scripts/smoke-test.mjs"
  }
}
```

초기 API:

```text
GET  /api/health
POST /api/generate-image
GET  /outputs/:filename
```

완료 기준:
- `npm run dev:server` 실행 시 서버가 켜진다.
- `GET /api/health`가 `{ "ok": true }`를 반환한다.

### Phase 2. Google 이미지 API 단일 호출 구현

목표:
서버에서 프롬프트 1개를 받아 Google API로 이미지 1장을 생성한다.

작업:
- [x] `server/config.js`에 API 키와 모델명 설정
- [x] `server/google-image-api.js`에 `generateImage(prompt, options)` 함수 구현
- [x] API 응답에서 base64 또는 이미지 URL을 추출하는 정규화 함수 구현
- [x] 생성 결과를 `outputs/slide-test.png` 형태로 저장
- [x] 서버 응답으로 파일명, URL, 원본 메타데이터 반환

예상 요청:

```json
{
  "slideId": "slide-01",
  "title": "시장 현황",
  "prompt": "..."
}
```

예상 응답:

```json
{
  "ok": true,
  "slideId": "slide-01",
  "filename": "slide-01.png",
  "url": "/outputs/slide-01.png"
}
```

완료 기준:
- 테스트 프롬프트 1개로 실제 이미지 파일이 `outputs/`에 생성된다.
- 실패 시 JSON 에러를 반환한다.

로컬 실행 예:

```powershell
$env:IMAGE_PROVIDER="gemini"
$env:GEMINI_API_KEY="YOUR_API_KEY"
$env:GEMINI_IMAGE_MODEL="gemini-3.1-flash-image-preview"
npm run dev:server
```

목업 모드 실행:

```powershell
npm run dev:mock
```

Google 모드 실행:

```powershell
npm run dev:gemini
```

`npm run dev:server`는 `server/config.local.js` 또는 환경변수의 `imageProvider` 값을 따른다. 목업을 확실히 쓰고 싶으면 `npm run dev:mock`을 사용한다.

로컬 하드코딩 설정 파일 방식:

```powershell
Copy-Item server/config.local.example.js server/config.local.js
```

그 다음 `server/config.local.js`에서 `googleApiKey` 값을 실제 키로 바꾸고 `imageProvider`를 `"gemini"`로 둔다. `server/config.local.js`는 `.gitignore`에 포함되어 GitHub에 올라가지 않는다.

주의:
- `IMAGE_PROVIDER` 기본값은 `mock`이다.
- 실제 API 키를 GitHub에 올리지 않는다.
- `server/config.local.example.js`는 예시 파일이고, 실제 키가 들어간 `server/config.local.js`는 git에서 제외한다.

### Phase 3. 프론트엔드 단일 생성 버튼 추가

목표:
현재 앱에서 만든 프롬프트 1개를 서버로 보내고, 생성 이미지를 화면에 표시한다.

작업:
- [ ] `src/image-generation-client.js` 추가
- [ ] `generateSlideImage(slidePrompt)` 클라이언트 함수 구현
- [ ] 슬라이드 프롬프트 미리보기 영역에 "이미지 생성" 버튼 추가
- [ ] 생성 중 상태 표시
- [ ] 성공 시 이미지 미리보기 표시
- [ ] 실패 시 에러 메시지 표시

완료 기준:
- 버튼 클릭 한 번으로 현재 프롬프트 이미지 1장이 생성된다.
- 생성된 이미지가 앱 화면에서 확인된다.

### Phase 4. 슬라이드 프롬프트 목록 추출 구조 정리

목표:
개별 슬라이드 프롬프트들을 큐에 넣을 수 있는 표준 데이터 구조로 만든다.

작업:
- [ ] 현재 앱에서 개별 슬라이드별 프롬프트 목록이 어디에 저장/렌더링되는지 확인
- [ ] `getSlidePromptJobs()` 함수 추가
- [ ] 각 작업 항목에 표준 필드 부여

표준 구조:

```js
{
  slideId: "slide-01",
  title: "시장 현황",
  prompt: "...",
  status: "pending",
  attempts: 0,
  imageUrl: null,
  error: null
}
```

완료 기준:
- 화면에 있는 개별 슬라이드 프롬프트 전체가 배열로 추출된다.
- 각 항목에 고유 `slideId`가 있다.

### Phase 5. 순차 생성 큐 구현

목표:
여러 슬라이드 프롬프트를 한 번에 넣되, 실제 생성은 일정 시간 간격을 두고 1개씩 진행한다.

작업:
- [x] `src/generation-queue.js` 추가
- [x] 큐 상태 정의
  - `idle`
  - `running`
  - `paused`
  - `done`
  - `failed`
- [x] 작업 상태 정의
  - `pending`
  - `running`
  - `done`
  - `failed`
  - `skipped`
- [x] 순차 실행 함수 구현
- [x] 요청 간 딜레이 구현
- [x] 실패 시 최대 재시도 횟수 구현
- [x] 중지/재개 함수 구현

기본 설정:

```js
{
  delayMs: 10000,
  maxRetries: 2,
  stopOnFailure: false
}
```

완료 기준:
- 3개 이상의 프롬프트가 순서대로 생성된다.
- 요청 사이에 설정된 딜레이가 적용된다.
- 실패한 항목은 재시도 후 실패로 기록된다.

### Phase 6. 순차 생성 UI 추가

목표:
사용자가 전체 생성 진행 상황을 확인하고 제어할 수 있게 한다.

작업:
- [x] "전체 이미지 순차 생성" 버튼 추가
- [x] "일시정지", "재개", "중지" 버튼 추가
- [x] 요청 간격 입력 추가
- [x] 재시도 횟수 입력 추가
- [x] 전체 진행률 표시
- [x] 슬라이드별 상태 표시
- [ ] 실패 항목만 다시 생성 버튼 추가

표시 예:

```text
총 12장
완료 4 / 실패 1 / 대기 7
현재 생성 중: slide-05
다음 요청까지: 8초
```

완료 기준:
- 사용자가 전체 생성 상태를 눈으로 확인할 수 있다.
- 중간에 멈추고 다시 이어서 생성할 수 있다.

### Phase 7. 결과 파일 관리

목표:
생성된 이미지를 슬라이드 순서대로 관리하고 다시 찾기 쉽게 한다.

작업:
- [ ] 파일명 규칙 정의
  - 예: `slide-01-market-status.png`
- [ ] 제목에서 파일명에 부적합한 문자 제거
- [ ] 중복 파일명 처리
- [ ] 생성 결과 목록에 이미지 링크 표시
- [ ] "outputs 폴더 열기" 또는 경로 표시 기능 검토
- [ ] 기존 결과 덮어쓰기 여부 설정

완료 기준:
- 생성 이미지가 슬라이드 순서와 제목을 알아볼 수 있는 파일명으로 저장된다.
- 앱에서 각 슬라이드 결과 이미지를 확인할 수 있다.

### Phase 8. 설정 분리와 서비스화 대비

목표:
하드코딩 로컬 버전에서 서비스 버전으로 넘어가기 쉽게 만든다.

작업:
- [ ] `server/config.js`의 하드코딩 값을 한 곳에 모은다.
- [ ] 나중에 `.env`로 옮길 항목을 주석으로 표시한다.
- [ ] API 호출부를 프론트에서 직접 참조하지 않게 유지한다.
- [ ] 서비스화 시 필요한 변경점을 문서화한다.

나중에 이전할 항목:

```text
GOOGLE_API_KEY
GOOGLE_PROJECT_ID
GOOGLE_LOCATION
IMAGE_MODEL
MAX_REQUESTS_PER_USER
OUTPUT_STORAGE_BUCKET
```

완료 기준:
- Google API 키 위치가 한 곳으로 제한된다.
- 서비스화할 때 교체해야 할 파일이 명확하다.

## 5. API 키 처리 방침

초기 로컬 버전:
- `server/config.js`에 직접 넣어도 된다.
- 단, GitHub에 올리기 전 반드시 제거한다.
- `server/config.local.js` 또는 `.env` 방식으로 빠르게 전환할 수 있게 한다.

서비스 버전:
- 절대 프론트엔드 JS에 API 키를 넣지 않는다.
- 서버 환경변수나 호스팅 플랫폼 Secret을 사용한다.
- 사용자별 요청 제한과 비용 제한을 둔다.

## 6. 우선순위

반드시 먼저 할 것:
- [ ] 서버 health check
- [ ] 프롬프트 1개 이미지 생성
- [ ] `outputs/` 저장
- [ ] 앱에서 단일 생성 버튼

그 다음 할 것:
- [ ] 슬라이드 프롬프트 목록 추출
- [ ] 순차 생성 큐
- [ ] 진행률 UI

나중에 할 것:
- [ ] Cloud Storage 저장
- [ ] 로그인
- [ ] 결제/사용량 제한
- [ ] GitHub Pages + 백엔드 배포

## 7. 구현 중 확인해야 할 위험

- API 키가 GitHub에 올라가지 않는지 확인
- Google API 응답 형식이 모델별로 다른지 확인
- 이미지 생성 실패 시 앱 전체가 멈추지 않는지 확인
- 너무 빠른 연속 요청으로 rate limit에 걸리지 않는지 확인
- 생성된 이미지 파일이 너무 많이 쌓일 때 정리 방법이 있는지 확인
- 슬라이드 번호와 결과 파일 매칭이 틀어지지 않는지 확인

## 8. 첫 구현 목표

첫 PR 또는 첫 작업 단위는 아래까지만 완료한다.

- [x] `server/local-server.js` 생성
- [x] `GET /api/health` 구현
- [x] `POST /api/generate-image` 목업 구현
- [x] 프론트에서 목업 API 호출
- [x] 결과 이미지 미리보기 표시

그 다음 작업에서 실제 Google API 호출을 붙인다. 이렇게 하면 UI와 서버 통신 구조를 먼저 안정화한 뒤, API 비용이 발생하는 부분을 작은 범위에서 테스트할 수 있다.

## 9. 진행 기록

### 2026-05-09

- [x] `server/config.js` 추가
- [x] `server/google-image-api.js` 추가
- [x] `server/local-server.js` 추가
- [x] `outputs/.gitkeep` 추가
- [x] `.gitignore` 추가
- [x] `package.json`에 `dev:server` 스크립트 추가
- [x] `node --check`로 서버 관련 JS 문법 확인
- [x] `GET /api/health` 응답 확인
- [x] `POST /api/generate-image` 목업 SVG 생성 확인
- [x] `슬라이드 이미지 생성` 신규 탭 추가
- [x] `src/image-generation-client.js` 추가
- [x] `src/slide-image-generation.js` 추가
- [x] `styles/image-generation.css` 추가
- [x] 프론트엔드 버튼/UI 연결
- [x] 브라우저에서 신규 탭 전환, 서버 확인, 목업 생성, 이미지 미리보기 검증
- [x] 실제 Google Gemini 이미지 API 호출 구현
- [x] `server/config.local.js` 자동 로드 구조 추가
- [x] 실제 API 키 인증 경로 확인
- [ ] 실제 API 키로 엔드투엔드 생성 검증
- [x] 슬라이드 분리기 프롬프트 목록을 이미지 생성 탭에서 읽는 연결 추가
- [x] 목업 모드에서 분리기 샘플 프롬프트를 큐로 가져와 순차 생성 검증

실제 API 테스트 메모:
- 로컬 키 파일을 통해 서버가 `google` 모드로 실행되는 것을 확인했다.
- `gemini-3.1-flash-image-preview`, `gemini-2.5-flash-image` 요청 모두 Google API까지 도달했다.
- 현재 계정/프로젝트는 이미지 생성 무료 티어 요청 및 입력 토큰 쿼터가 0으로 응답되어 실제 이미지 파일 생성은 차단되었다.
- 다음 조치: Google AI Studio의 rate limit 페이지 또는 결제/플랜 설정에서 이미지 생성 쿼터 사용 가능 여부를 확인한다.

## 2026-05-09 추가 점검: 버튼 액션 정합성 보강 계획

현재 이미지 생성 탭은 로컬 PC 실행을 우선한다. 따라서 프론트엔드에서 외부 이미지 API를 직접 호출하지 않고, 로컬 Node 서버의 API만 호출하는 구조로 정리한다.

완료한 정리:
- [x] `src/image-generation-client.js`를 로컬 서버 API 전용 클라이언트로 정리
  - `GET /api/health`
  - `GET /api/config`
  - `POST /api/config`
  - `POST /api/generate-image`
  - `POST /api/open-folder`
- [x] 이미지 생성 결과를 `outputs/` 폴더에 저장하고 화면에서는 `/outputs/{filename}` URL을 표시
- [x] `outputs 폴더 열기` 버튼을 실제 로컬 서버 API에 연결
- [x] `서비스 상태 확인` 버튼을 실제 로컬 서버 연결 확인으로 변경
- [x] `설정 저장` 버튼을 로컬 서버 런타임 설정 변경으로 연결
- [x] 빈 API 키로 설정 저장 시 기존 로컬 키를 지우지 않도록 서버 처리 보강
- [x] `실패 항목만 다시 생성` 버튼과 큐 재실행 액션 추가

남은 개발 항목:
- [ ] 순차 생성 중 현재 생성 중인 슬라이드 번호와 다음 요청까지 남은 시간 표시
- [ ] 생성 결과와 원본 프롬프트를 함께 묶은 manifest JSON 저장
- [ ] 이전 실행 결과를 앱 시작 시 다시 불러오기
- [ ] Google Gemini 이미지 생성 쿼터/과금 상태 안내 UX 개선
- [ ] 서비스 배포 버전에서는 API 키를 브라우저나 GitHub에 노출하지 않는 백엔드 Secret 구조로 전환
