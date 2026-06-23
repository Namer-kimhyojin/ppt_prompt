# 시놀로지 NAS 배포 가이드

PromptDeck 로컬 서버를 시놀로지 NAS에서 상시 구동해, 참고 이미지(화풍 믹서 샘플 등)를
NAS 디스크에 **영구 저장**하기 위한 문서다.

- 서버는 외부 의존성 없이 Node 표준 라이브러리만 사용한다. (`server/local-server.js`)
- 업로드/붙여넣기/현재 저장 이미지는 `outputs/mixer_samples/`에 실제 파일로 기록된다.
- 재부팅·기기 변경과 무관하게 파일이 유지된다. (단 "선택 포인터" 한계는 맨 아래 참고)

---

## 방법 A. Container Manager(도커) — 권장

재부팅·크래시 자동 복구가 되고 Node 설치가 필요 없다.

### 1. 소스 업로드
File Station으로 저장소 전체를 NAS에 올린다. 예: `/volume1/docker/promptdeck`

### 2. 빌드 & 실행 (SSH)
```sh
cd /volume1/docker/promptdeck
sudo docker compose up -d --build
```
> Container Manager GUI에서 "프로젝트 생성 → 기존 docker-compose.yml 선택"으로도 동일하게 가능.

### 3. 확인
- NAS 내부: `http://localhost:4173`
- 같은 네트워크 PC/폰: `http://<NAS_IP>:4173`

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

## 방법 B. 네이티브 Node + 작업 스케줄러

도커를 안 쓰는 경우.

### 1. Node 설치
패키지 센터 → **Node.js v18 이상** 설치. (서버는 내장 `fetch` 사용 → 18 미만 불가)

### 2. 부팅 시 자동 실행
제어판 → 작업 스케줄러 → 생성 → 트리거된 작업 → 사용자 정의 스크립트
- 이벤트: **부팅 시**
- 사용자: root
- 명령:
```sh
cd /volume1/.../ppt_prompt
PROMPTDECK_HOST=0.0.0.0 PROMPTDECK_PORT=4173 /usr/local/bin/node server/local-server.js >> /volume1/.../ppt_prompt/server.log 2>&1
```
> `node` 실제 경로는 `which node`로 확인.

---

## 외부(인터넷) 접속 — 선택

DSM **제어판 → 로그인 포털 → 고급 → 리버스 프록시**에서
도메인/HTTPS → `localhost:4173` 으로 연결한다.

⚠️ **클립보드 이미지 붙여넣기는 HTTPS(또는 localhost)에서만 동작한다.**
외부 접속으로 붙여넣기 기능을 쓰려면 리버스 프록시에 **HTTPS(Let's Encrypt 인증서)** 적용이 필수다.
`http://<NAS_IP>:4173` 평문 접속에서는 붙여넣기가 권한 차단되어 "사진 교체(파일 선택)"만 가능.

---

## 환경변수 정리

| 변수 | 기본값 | 설명 |
|---|---|---|
| `PROMPTDECK_HOST` | `127.0.0.1` | `0.0.0.0`이면 외부 접속 허용 (NAS 필수) |
| `PROMPTDECK_PORT` | `4173` | 서버 포트 |
| `PROMPTDECK_OUTPUT_DIR` | `<repo>/outputs` | 저장 폴더. 도커에선 `/data/outputs` |
| `IMAGE_PROVIDER` | `mock` | 이미지 생성 사용 시 `gemini`/`pollinations` 등 |

---

## 영구성 정리

| 항목 | 저장 위치 | 재부팅 | 기기 간 공유 |
|---|---|---|---|
| 업로드/붙여넣기 이미지 파일 | NAS 디스크 `outputs/mixer_samples/` | 유지 ✓ | 같은 NAS면 공유 ✓ |
| "어떤 샘플 선택했는지" 포인터 | 각 브라우저 localStorage | 유지 ✓ | ✗ (브라우저별) |

이미지 파일은 NAS에 안전히 남지만, "이 주제/화풍에 이 샘플을 쓴다"는 **선택 정보는 아직 브라우저
localStorage**에 있다. 다른 기기/브라우저에서 열면 기본 이미지로 보인다.
모든 기기에서 선택까지 동일하게 복원하려면 서버에 선택 메타(JSON)를 저장하는 엔드포인트 추가가 필요하다.
