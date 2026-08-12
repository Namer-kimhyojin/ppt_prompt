# 시놀로지 NAS 배포 가이드

PromptDeck 서버를 시놀로지 NAS에서 HTTPS로 운영하고, 계정·생성 이미지·설정을
NAS 디스크에 보관하기 위한 배포 문서다. 인터넷 공개 전 개인정보 처리방침의 운영자 정보를 실제 값으로 채우고 법률 검토를 권장한다.

- 인증 메일 발송에는 Nodemailer를 사용한다. (`server/local-server.js`)
- 업로드/붙여넣기/현재 저장 이미지는 `outputs/mixer_samples/`에 실제 파일로 기록된다.
- 인증·관리자 설정·감사기록은 `outputs/_private/`에 저장되며 HTTP로 제공되지 않는다.
- 일반 생성 이미지는 `outputs/users/<사용자 ID>/`에 격리되고 로그인·소유권 검사 후에만 제공된다.
- 재부팅·기기 변경과 무관하게 파일이 유지된다. (단 "선택 포인터" 한계는 맨 아래 참고)

---

## 방법 A. Container Manager(도커) — 권장

재부팅·크래시 자동 복구가 되고 Node 설치가 필요 없다.

### 1. 소스 업로드
File Station으로 저장소 전체를 NAS에 올린다. 예: `/volume1/docker/promptdeck`

### 2. 빌드 & 실행 (SSH)
```sh
cd /volume1/docker/promptdeck
cp .env.example .env
# .env의 URL·관리자 비밀번호·운영자·개인정보 담당자·SMTP 정보를 실제 값으로 수정
npm run deploy:check
sudo chown -R 1000:1000 outputs
sudo docker compose up -d --build
```
`deploy:check`가 실패하면 표시된 항목을 모두 수정한 뒤 다시 실행한다. 이 명령은 비밀번호나 API 키의 실제 값을 출력하지 않는다.
> Container Manager GUI에서 "프로젝트 생성 → 기존 docker-compose.yml 선택"으로도 동일하게 가능.

### 3. 확인
- 컨테이너 포트는 안전을 위해 NAS의 `127.0.0.1:4173`에만 바인딩된다.
- 사용자는 아래 리버스 프록시에서 설정한 `https://도메인`으로만 접속한다.
- `docker compose logs promptdeck`에서 필수 설정 누락 오류가 없는지 확인한다.

### 4. 저장 위치
`docker-compose.yml`의 볼륨 매핑에 따라 NAS 실제 폴더에 저장된다.
```
./outputs  ->  컨테이너 /data/outputs
```
원하는 경로로 바꾸려면 왼쪽 경로 수정. 예:
```yaml
volumes:
  - /volume1/docker/promptdeck/outputs:/data/outputs
```

---

## 방법 B. 네이티브 Node 20+ + 작업 스케줄러

도커를 안 쓰는 경우.

### 1. Node 설치
패키지 센터 → **Node.js v20 이상** 설치 후 저장소에서 `npm ci --omit=dev`를 실행한다.

### 2. 부팅 시 자동 실행
제어판 → 작업 스케줄러 → 생성 → 트리거된 작업 → 사용자 정의 스크립트
- 이벤트: **부팅 시**
- 사용자: root
- 명령:
```sh
cd /volume1/.../ppt_prompt
NODE_ENV=production PROMPTDECK_HOST=127.0.0.1 PROMPTDECK_PORT=4173 \
PROMPTDECK_PUBLIC_BASE_URL=https://promptdeck.example.com \
PROMPTDECK_SECURE_COOKIES=true \
/usr/local/bin/node server/local-server.js >> /volume1/.../promptdeck/server.log 2>&1
```
> 나머지 관리자·운영자·SMTP 환경변수는 `.env.example`을 기준으로 작업 스케줄러 환경에 함께 등록한다. `node` 실제 경로는 `which node`로 확인한다.

---

## HTTPS 리버스 프록시 — 필수

DSM **제어판 → 로그인 포털 → 고급 → 리버스 프록시**에서
도메인/HTTPS → `localhost:4173` 으로 연결하고 Let's Encrypt 등 유효한 인증서를 지정한다.

리버스 프록시가 `X-Forwarded-Proto`와 `X-Forwarded-For`를 전달하는지 확인한다. 신뢰하지 않는 프록시 뒤에서는 `PROMPTDECK_TRUST_PROXY=true`를 사용하지 않는다. HTTP 직접 접속은 로그인 쿠키와 개인정보 보호를 위해 허용하지 않는다.

### 배포 전 필수 점검

- `.env`와 `outputs/_private/`를 웹 공유 폴더·Git·백업 공개 링크에 포함하지 않는다.
- 기본 비밀번호는 없다. 최초 실행 때 12자 이상·문자 종류 3가지 이상의 관리자 비밀번호가 없으면 시작이 중단된다.
- SMTP 인증 메일이 정상 도착하는지, 발신자와 개인정보 처리방침의 수탁자 정보가 맞는지 확인한다.
- 현재 선택한 AI 사업자의 계약, 처리 리전, 입력 데이터 학습 여부와 보유기간을 확인한다.
- 외부 AI의 국외 이전 고지·적법 근거를 검토한 후에만 `PROMPTDECK_AI_DATA_TRANSFER_CONFIRMED=true`로 활성화한다.
- Google은 운영 배포에서 Cloud Billing이 연결된 유료 서비스의 데이터 처리 조건을 확인하고 `PROMPTDECK_GOOGLE_PAID_SERVICE_CONFIRMED=true`를 설정한다.
- Pollinations는 처리 위치·기간을 확인한 뒤에만 `PROMPTDECK_ALLOW_POLLINATIONS=true`로 명시 허용한다.
- Unsplash 검색은 API 약관·로컬 저장·출처표시와 국외 이전을 확인한 후 `PROMPTDECK_UNSPLASH_DATA_TRANSFER_CONFIRMED=true`로 활성화한다.
- Google AdSense는 인증된 동의 관리 플랫폼(CMP)이 연결되기 전에는 코드상 로드되지 않는다.
- 개인정보 처리방침·이용약관·AI 안내·저작권 신고 페이지의 운영자 정보가 실제 값으로 표시되는지 확인한다.
- 운영 데이터의 암호화 백업, 복구 시험, NAS 계정 최소권한과 보안 업데이트 절차를 마련한다.

### 자동 사전점검

도커 배포 전 저장소 루트에서 다음을 실행한다.

```sh
npm run deploy:check
```

네이티브 Node 배포는 다음처럼 실행한다.

```sh
node scripts/deployment-preflight.mjs --target=native
```

사전점검은 실제 HTTPS 주소, 관리자 비밀번호 강도, 운영자·개인정보 담당자 정보, AI/SMTP 조건, 보존기간, 법적 문서, Docker의 로컬 포트 바인딩과 Secure 쿠키 설정을 검사한다. 실제 외부 제공자 계약이나 법적 근거의 적정성을 자동으로 판정하지는 않는다.

---

## 환경변수 정리

| 변수 | 기본값 | 설명 |
|---|---|---|
| `NODE_ENV` | - | 운영 배포는 `production`; 필수 법적·HTTPS 설정 검사를 활성화 |
| `PROMPTDECK_HOST` | `127.0.0.1` | Docker 내부는 `0.0.0.0`, 네이티브는 기본값 유지 권장 |
| `PROMPTDECK_PORT` | `4173` | 서버 포트 |
| `PROMPTDECK_OUTPUT_DIR` | `<repo>/outputs` | 저장 폴더. 도커에선 `/data/outputs` |
| `PROMPTDECK_PUBLIC_BASE_URL` | 없음 | `https://` 공개 주소. 인증 메일 링크에도 사용 |
| `PROMPTDECK_SECURE_COOKIES` | `false` | 운영 환경은 반드시 `true` |
| `PROMPTDECK_TRUST_PROXY` | `false` | 신뢰하는 NAS 리버스 프록시 바로 뒤에서만 `true` |
| `PROMPTDECK_BOOTSTRAP_ADMIN_USERNAME/PASSWORD` | 없음 | 최초 관리자. 비밀번호는 12자 이상·문자 종류 3가지 이상 |
| `PROMPTDECK_OPERATOR_NAME/ADDRESS` | 없음 | 약관·처리방침에 표시되는 운영자 정보 |
| `PROMPTDECK_PRIVACY_OFFICER/EMAIL/PHONE` | 없음 | 개인정보 권리행사 연락처 |
| `PROMPTDECK_OUTPUT_RETENTION_DAYS` | `30` | 사용자 생성 파일 자동 삭제 기간 |
| `PROMPTDECK_AUDIT_RETENTION_DAYS` | `365` | 최소 감사기록 보존기간 |
| `IMAGE_PROVIDER` | `mock` | `mock`, `google`, `openai`, 명시 허용한 `pollinations` |

---

## 영구성 정리

| 항목 | 저장 위치 | 재부팅 | 기기 간 공유 |
|---|---|---|---|
| 사용자 생성 이미지 | NAS 디스크 `outputs/users/<사용자 ID>/` | 설정 기간까지만 유지 | 본인 또는 관리자만 |
| 공용 믹서 샘플 | NAS 디스크 `outputs/mixer_samples/` | 관리자가 삭제할 때까지 | 로그인 사용자 공유 |
| 계정·설정·감사기록 | NAS 디스크 `outputs/_private/` | 정책 기간 | HTTP 접근 불가 |
| "어떤 샘플 선택했는지" 포인터 | 각 브라우저 localStorage | 유지 ✓ | ✗ (브라우저별) |

사용자별 생성 파일은 설정한 보존기간 후 자동 삭제된다. NAS 스냅샷·외부 백업에도 같은 보존·삭제 정책을 적용해야 하며, 회원탈퇴 자료가 백업에 남는 경우 복구 시 재삭제 절차를 문서화한다.
