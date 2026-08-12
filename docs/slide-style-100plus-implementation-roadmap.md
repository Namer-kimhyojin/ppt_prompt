# 슬라이드 스타일 갤러리 상업형 확장 구현 로드맵 (100개+)

작성일: 2026-07-21
목표: `src/slide-style-catalog.js` 기반 스타일 수를 **기존 96개 → 220개 이상**으로 확장
전제: 한국 실무에서 즉시 사용할 수 있는 상업용 톤, 정부/산업/스타트업/기술 밸런스 강화, 이미지 미리보기 실물 생성

---

## 1) 현재 상태 (검증된 값)

- 현재 스타일: **96개**
- 카테고리: reporting 12 / branding 8 / startup 8 / technology 8 / creative 9 / korea-commercial 12 / government-ministry 19 / major-industry 20
- 미리보기 이미지: **96개**(id 1:1 매칭)
- 점검 스크립트: `scripts/slide-style-audit.mjs` 추가 완료
- 다음 문장/파일은 이미 존재:
  - `docs/slide-style-expansion-100-plan.md` (후보군 100개+ 초안 정리)
  - `docs/slide-style-100plus-expansion-plan.md` (WBS형 실행안)
  - `scripts/slide-style-audit.mjs` (카테고리/preview 정합성 검사)

---

## 2) 최종 목표(비즈니스 기준)

- 총 스타일 수: **220개 이상** (`+124`)
- 목표 카테고리별 최종 수(안)
  - reporting: 26 (+14)
  - branding: 26 (+18)
  - startup: 18 (+10)
  - technology: 18 (+10)
  - creative: 24 (+15)
  - korea-commercial: 26 (+14)
  - government-ministry: 28 (+9)
  - major-industry: 44 (+24)
- 최소 조건
  - 신규 항목 preview 이미지 누락: `0`
  - id 중복: `0`
  - 검색 키워드 빈칸/의미 불명확 항목: `0`
  - `node scripts/smoke-test.mjs` 통과

---

## 3) 구현 아키텍처 (실제 적용 방식)

### 3-1. 구조
- `src/slide-style-catalog.js`를 `stylesByCategory` 결합형으로 정리
- 카테고리 분리 파일 구조는 2단계로 진행
  - 1차: 단일 파일 내에서 구간 분리(`// Region: ...`)로 먼저 구현
  - 2차: 품질 안정 후 `src/slide-style-presets/*.js`로 모듈 분리

### 3-2. 이미지 파이프라인
- 생성 규격: `assets/slide-style-previews/<style.id>.jpg`
- 출력: 960x540, 품질 85~92, 색공간 sRGB
- 재시도 정책: 3회 자동 재요청 + 실패 목록 별도 큐
- 실패 시 즉시 `failed-preview` 태그 부여 후 다음 배치 진행

### 3-3. 상업성 품질 기준(항목별 필수)
- 실제 문서 환경 문구: bestFor 반드시 실무 시나리오 1개 이상
- aliases: 최소 3개(한글/영문 혼재)
- tags: 최소 3개
- prompt Ko/En: 각 1문장 이상 + 의도형 수식어
- `signature`/`composition`/`visualDirection` 값의 톤 편차 존재

---

## 4) 멀티에이전트 운영안 (이미지 생성 병목 완화 핵심)

### 역할 분담(동시에 진행)
- **A트랙: 실무 기획/정의 담당**
  - 파일: `docs/slide-style-expansion-100-plan.md`에 후보 정규화
  - 범위: korea-commercial + major-industry + reporting
  - 산출: 후보 JSON(100개 중 40~50개)
- **B트랙: 디자인 믹스/미적 정의 담당**
  - 범위: branding + creative + startup
  - 산출: 40~50개 후보의 톤 가이드, alias, tags, bestFor
- **C트랙: 품질보증/검증 + 이미지 큐 담당**
  - 범위: technology + government-ministry + QA
  - 산출: preview 생성 큐(우선순위 목록), 누락/실패 리포트

### 운영 규칙
- 1차 배치: 60개(고우선순위), 2차: 64개(잔여), 최소 2회 동시 처리
- 에이전트별 산출물은 `docs/slide-style-implementation-notes.md`에 바로 집계
- 충돌 시 스타일 id로 즉시 조정, 이름 충돌은 수식어 추가(`-ko`, `-pro`, `-compact` 등)

---

## 5) 체크리스트형 진행경과

- [x] 기준 점검 완료: 96개/96개 preview 매핑 정합성 통과
- [x] 확장 계획 문서 작성 2종
- [x] 품질 점검 스크립트 추가(`scripts/slide-style-audit.mjs`)
- [ ] 후보 124개 최종 확정 (카테고리별 분배)
  - [ ] reporting +14
  - [ ] branding +18
  - [ ] startup +10
  - [ ] technology +10
  - [ ] creative +15
  - [ ] korea-commercial +14
  - [ ] government-ministry +9
  - [ ] major-industry +24
- [ ] 1차 반영(약 70개): `src/slide-style-catalog.js` 반영 + 문법검사
  - [ ] `node --check src/slide-style-catalog.js`
  - [ ] `node scripts/slide-style-audit.mjs`
- [ ] 2차 반영(잔여 54개): 스타일 + 미리보기 매핑 점검
- [ ] 미리보기 이미지 1차 생성(고우선순위 60장)
  - [ ] 실패 항목 재시도 3회
  - [ ] 실패 리스트 `docs/failed-preview-batch.md` 기록
- [ ] 미리보기 이미지 2차 생성(잔여 64장)
- [ ] 통합 QA
  - [ ] `node scripts/validate-slide-style-catalog.mjs`
  - [ ] `node scripts/slide-style-audit.mjs`
  - [ ] `node scripts/smoke-test.mjs`
- [ ] `VERSION` bump 및 캐시 갱신
- [ ] 최종 로그 정리 + 다음 주 운영 체크포인트 기록

---

## 6) 실행 순서(10개 하위 작업)

1. 후보군 통합(현재 파일 정리)
2. 스타일 ID 네임스페이스 합의 (`korea-`, `min-`, `gov-`, `ind-`, `tech-`, `cre-`, `brand-`, `startup-`)
3. 카테고리별 기본 40~50개씩 초안 텍스트 확정
4. `src/slide-style-catalog.js`에 분할 등록
5. alias, tags, bestFor, promptKo/En 보완
6. 빠른 정합성 검사(audit script)
7. 우선순위 큐로 이미지 생성(60장)
8. 미리보기 경로 자동 링크 검사
9. 나머지 64장 이미지 생성
10. smoke-test + docs 정리 + 릴리스

---

## 7) 한국형 상업성 강화 포인트(반드시 반영)

- 입찰/제안/공고 대응: `입찰`, `실행계획`, `사업비`, `예산`, `성과지표`, `리스크` 태그 포함
- 파이프라인형 문서: `의사결정`, `실행안`, `KPI`, `로드맵` 패턴 반영
- 금융/공공/제조 특화: 부정확한 과장 그래픽(3D 과몰입/게임맵 톤) 지양
- 스타일 믹스 노출 기준:
  - 보고+정부부처
  - 브랜딩+IR
  - 기술+산업
  - 실무용 하이브리드(예: `policy + dashboard`, `investor + roadmap`, `data + visual storytelling`)

---

## 8) 커뮤니케이션 로그 템플릿(진행요약)

- [2026-07-21] baseline 점검 완료(96개)
- [2026-07-21] `slide-style-audit.mjs` 추가·실행 성공
- [ ] Day1: 후보군 확정 + 분류 완료
- [ ] Day2: 1차 70개 반영 + 이미지 60장 큐
- [ ] Day3: 2차 54개 반영 + 이미지 잔여 64장 큐
- [ ] Day4: 통합 QA 및 버전 갱신

---

이 문서는 다음 실행 체크리스트의 기준 문서로 사용합니다.
참조/변경시 `docs/slide-style-implementation-notes.md`에 변경 사유와 책임자(본인/에이전트)만 간단히 남겨 주세요.
