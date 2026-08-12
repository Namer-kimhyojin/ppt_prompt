# 슬라이드 스타일 갤러리 100개+ 확장 구현 계획 (실행형)

작성일: 2026-07-21
목표: 기존 스타일 96개를 **최종 200개 이상(+104 이상)**으로 확장
요구사항: 한국 실무·상업 환경에서 바로 쓰는 상업적 가치, 빠른 구현, 병렬 작업(멀티에이전트), 이미지 생성 병목 완화

---

## 0) 현재 상태 진단 (현재 기준)

- 현재 등록 스타일: **96개**
  - reporting: 12
  - branding: 8
  - startup: 8
  - technology: 8
  - creative: 1
  - korea-commercial: 12
  - government-ministry: 19
  - major-industry: 20
- 현재 프리뷰 이미지: **96개 JPG** (`assets/slide-style-previews/*.jpg`)와 id 1:1 매칭 완료
- 적용 지점:
  - 카탈로그: `src/slide-style-catalog.js`
  - 렌더/카드: `src/common-prompt.js`
  - 프리뷰 표시 크기/속성: 960x540, lazy load

현재 산출물은 상업성 기준으로 충분히 출발점이지만,
카테고리별 편중(특히 creative 1개) 및 실무별 레버리지(한국 실무/산업별 고도화)가 약함.

---

## 1) 구현 목표(정량 목표)

- 총 스타일 수: **200개 이상**
- 카테고리별 최종 목표(권장)
  - reporting: 24 (+12)
  - branding: 24 (+16)
  - startup: 16 (+8)
  - technology: 18 (+10)
  - creative: 20 (+19)
  - korea-commercial: 20 (+8)
  - government-ministry: 25 (+6)
  - major-industry: 36 (+16)
- 검색 성능: 기본 검색 응답 < 150ms(로컬 렌더 기준)
- 신규 항목 미리보기 누락률: 0%
- 이미지 생성 큐 처리 실패율: 5% 이하 (재시도 포함)

---

## 2) 아키텍처/개발 방향

### 2-1. 구조 정비 (필수)
현재 `src/slide-style-catalog.js`에 직접 항목이 몰려 있어 증분/검수/병렬 작업이 어렵기 때문에 다음 구조로 분리.

1. `src/slide-style-catalog.js`는 카탈로그 조합기 역할로 최소화
2. 카테고리별 정의 파일 추가
   - `src/slide-style-presets/reporting.js`
   - `src/slide-style-presets/branding.js`
   - `src/slide-style-presets/startup.js`
   - `src/slide-style-presets/technology.js`
   - `src/slide-style-presets/creative.js`
   - `src/slide-style-presets/korea-commercial.js`
   - `src/slide-style-presets/government-ministry.js`
   - `src/slide-style-presets/major-industry.js`
3. `src/slide-style-catalog.js`는 상단 8개 카테고리 + `EXPANDED_STYLE_DEFINITIONS` 생성 함수 유지 + 합성 단계만 수행

### 2-2. 프리뷰 생성 파이프라인

이미지 생성은 느리므로, 다음을 병렬로 처리:
- 스타일 정의 생성(메타데이터): 텍스트 기반, 빠름
- 프롬프트/스테이지 큐 생성: 중간 속도
- 이미지 생성: 느림, 비동기 worker 병렬
- 파일명 규칙: `assets/slide-style-previews/<style.id>.jpg` (960x540), 캐시 버전은 catalog `VERSION++`

### 2-3. 상업성 보강 기준

각 스타일 항목이 아래 기준을 갖추지 않으면 사용 불가로 간주:
- 한글/영문 이름 + aliases(검색어 3개 이상)
- bestFor: 실제 업무 use-case 포함
- description: 한 문장 이하 불명료 금지(모호한 문구 지양)
- tags: 최소 3개
- 프롬프트: 한국 실무 톤(가독성 우선, 과한 추상화 억제)
- prompt/색상/구성/타이포가 `지표·결론·가독성` 우선인지

---

## 3) 팀/멀티에이전트 운영안

병목 포인트 기준 3개 에이전트 라인 운영:

### A) 스타일 정의 담당(빠른 병렬 투입)
- 레퍼런스 수집, 카테고리별 40~60개 스타일 텍스트 정의
- 한국 실무/상업 가치 기준으로 우선순위 매핑
- 후보명 중복/유사도 점검

### B) 이미지 프롬프트 + 미리보기 생성 담당
- 각 스타일별 프롬프트 템플릿 생성
- 자동 생성 큐(배치) 스크립트 반영
- 960x540 리사이즈 검증

### C) QA/검증 담당
- id 중복, category 분포, orphan/미존재 preview 검사
- 파일 규칙/형식 검사
- 샘플 UI 렌더링 스팟 체크(데스크톱/모바일)

---

## 4) 실행 WBS (체크리스트)

### 4-1. Day 1 (T+1): 정합성 정비 + 생산 파이프라인
- [ ] 카테고리별 스타일 후보군 120개 준비 (중복 없이)
  - [ ] reporting 후보 30개 중 14개는 기존 갤러리 공백 보강용
  - [ ] branding 후보 24개
  - [ ] startup 후보 16개
  - [ ] technology 후보 16개
  - [ ] creative 후보 20개
  - [ ] korea-commercial 후보 16개
  - [ ] government-ministry 후보 10개
  - [ ] major-industry 후보 18개
- [ ] 스타일 검수 템플릿 작성 (`id/nameKo/nameEn/aliases/bestFor/tags/promptKo/promptEn/palette/notes`)
- [ ] `scripts/`에 스타일 감사 스크립트 추가
  - `scripts/slide-style-audit.mjs` (id-중복/카테고리/preview 매칭)
- [ ] PR 미리보기 대상 파일: `docs/slide-style-100plus-expansion-plan.md`, `scripts/slide-style-audit.mjs`

### 4-2. Day 2~3 (T+2~T+3): 분할 반영 + 생성 큐
- [ ] 카탈로그 분할 리팩터링
- [ ] 기존 기능 호환 확인(카테고리 버튼/필터/검색/드래프트 적용)
- [ ] `korea-commercial` + `major-industry` 1차 40개 반영
- [ ] 후보 큐 CSV/JSON 생성
- [ ] 이미지 생성 큐 1차 제출(40~50장)
  - [ ] 실패 파일 자동 재큐

### 4-3. Day 4~5: 2차 반영 + QA
- [ ] reporting/branding/startup/technology 1차 30개 반영
- [ ] creative 1차 15개 반영
- [ ] 신규 미리보기 업로드(해상도·형식 점검)
- [ ] 검색/필터/카테고리 로딩 smoke check
- [ ] 스타일 갤러리 시각 QA(상대적 품질 샘플 10장)

### 4-4. Day 6~7: 마무리 패키지
- [ ] 목표치 200개 도달 전까지 충원 (최소 +104)
- [ ] `VERSION` bump
- [ ] 전체 미리보기 정합성 리런
- [ ] docs/README update: 갤러리 새 카탈로그 안내
- [ ] 최종 smoke test 실행 + 실패 항목 정리

---

## 5) 체크리스트형 진행경과 (현재는 계획 상태)

- [ ] P0: 구조 정비 설계 확정
- [ ] P0: 스타일 후보 1차 120개 생성(중복 검수)
- [ ] P1: 카탈로그 분할 리팩터링(컴파일/동작 확인)
- [ ] P1: 이미지 생성 큐 스크립트 확정
- [ ] P2: 후보 1차 50개 반영 + 미리보기 50개
- [ ] P2: 후보 2차 50개 반영 + 미리보기 50개
- [ ] P3: 후보 3차 50개 반영 + 미리보기 50개
- [ ] P3: 통합 QA 통과 (미리보기 0미스 / alias 검색 누락 0건 / 오타 점검)
- [ ] P4: 1주차 완료 리포트 작성 + 다음 주 리마인드

---

## 6) 품질/리스크/완화

- 리스크: 스타일 간 톤 편차 과도 → `palette`/`visualDirection` 범주표로 회전 규칙 고정
- 리스크: 이미지 생성 지연/실패 → 병렬 큐 + 지수 백오프 + 실패 파일만 재생성
- 리스크: 검색 품질 저하 → alias/키워드 최소 3개 강제, 금지어 필터(`사이버`, `화려한`, `예쁘기만 함` 과도 표현 제한)
- 리스크: 실무 적용 불가한 과장형 미학 과다 → `가독성`, `정합성`, `의사결정 지표`, `근거 표현` 태그로 필터

---

## 7) 산출/검증 기준

- 최소 완료 조건
  - 총 스타일 수 200개 이상
  - preview 누락 0건
  - category 목록에서 빈 카테고리 없음
  - 검색어로 `보고`, `IR`, `컨설팅`, `공공`, `금융`, `바이오`, `반도체`, `K-커머스` 조회 가능
- QA 명령권고
  - `node scripts/slide-style-audit.mjs`
  - `node --check src/slide-style-catalog.js`
  - `node scripts/smoke-test.mjs`

---

## 8) 다음 실행 우선순위 (지금 바로 착수 항목)

1. 후보군을 **카테고리별 120개까지** 확정해 바로 코드 반영 가능한 형태로 정리
2. 멀티에이전트로 3개 트랙 동시 수행
   - A트랙: `korea-commercial + major-industry`
   - B트랙: `creative + startup`
   - C트랙: `government-ministry + reporting/branding`
3. Day2에 1차 50개 반영 후 브라우저 렌더 샘플 확인

---

## 9) 실무형 혼합 콘셉트 제안(디자인 믹스용)

검색/추천 단계에서 다음 조합을 우선 노출하면 사용자 선택 품질이 올라감:
- `보고·컨설팅 + 산업` (ex. 정부부처+금융, 반도체+대시보드)
- `브랜딩 + 스타트업` (ex. 투자 IR + 애니메틱/플루언트)
- `기술 + 크리에이티브` (ex. 디지털트윈 + 매거진형 데이터)
- `한국 실무 + 고급형` (ex. 공공사업 + 미니멀·정책형 + 프리미엄 계열)

---

## 10) 진행 로그 (예시 템플릿)

- [2026-07-21] 기준 상태 점검 완료: 96개 등록, 96개 preview 1:1 확인
- [2026-07-21] `scripts/slide-style-audit.mjs` 신규 추가 후 실행 성공
- [2026-07-21] 계획 문서 초안 작성 완료
- [ ] Day1: 후보군 초안 수집
- [ ] Day1: audit 스크립트 CI 연동(선택)
- [ ] Day2: 스타일 분할 구조 반영
- [ ] Day2~3: 1차 이미지 큐 발행(40~50장)

### 실시간 상태 요약 (현재)
- [x] 요구사항 정리 및 실무적 확장 기준 합의
- [x] 현재 카탈로그 기초 점검(96개 / 카테고리 분포 산출)
- [x] 실행 계획 md 생성
- [x] 스타일 감사 스크립트 추가
- [ ] 후보군 실제 100개 이상 등록 시작 전 단계
