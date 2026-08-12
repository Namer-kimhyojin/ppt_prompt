# 슬라이드 스타일 프리셋 확장 구현 계획 (100개 이상)

버전: 2026-07-21
목표: 상업적으로 바로 쓸 수 있고, 한국 실무에서 실제 사용 가치가 높은 슬라이드 스타일 프리셋을 **기존 96개 → 196개 이상**로 확장

---

## 0) 현재 상태 요약

- 현재 전체 스타일 수: **96개**(정상 동작 기준)
  - `reporting`: 12개
  - `branding`: 8개
  - `startup`: 8개
  - `technology`: 8개
  - `creative`: 9개
  - `korea-commercial`: 12개
  - `government-ministry`: 19개
  - `major-industry`: 20개
- 대상 파일
  - `src/slide-style-catalog.js`
  - `assets/slide-style-previews/`

목표 달성을 위해 `reporting`, `korea-commercial`, `major-industry`, `technology`, `startup`, `branding`, `creative`로 **카테고리 밸런스를 유지**해 확장한다.

---

## 1) 구현 원칙 (상업성 + 실무성)

- **1순위: 상업성**
  실제 제안서/IR/본부보고/정부 브리핑/홍보자료에 바로 쓰일 수 있는 톤 유지
- **2순위: 검색성과 일관성**
  `aliases`(한글/영문), `tags`, `bestFor`를 실제 검색 키워드 기준으로 정비
- **3순위: 중복 회피**
  기존 96개 스타일의 시각 축(`격자/색면`, `데이터 위주`, `브랜드 중심`, `실험형`)이 겹치지 않도록
- **4순위: 미리보기 정합성**
  `previewImage: assets/slide-style-previews/{id}.jpg` 규칙 준수
- **5순위: 운영성**
  분기별로 덧붙이기 쉬운 구조(정의 분리, 스크립트 자동검증)로 유지

---

## 2) 작업 아키텍처

### 2-1. 스타일 메타 분리(권장)

현재 파일 한 곳에 몰려 있는 구조를 유지하되, 장기적 확장을 위해 다음을 단계적으로 적용:

- `src/slide-style-definitions/` 디렉터리 신설(선택, 2차)
  - `reporting.js`, `branding.js`, `startup.js`, `technology.js`, `creative.js`
  - `korea-commercial.js`, `government-ministry.js`, `major-industry.js`
- `src/slide-style-catalog.js`는 병합 포인트로 축소
- 기존 동작 안정성 검증 후 점진 적용

### 2-2. 생성/검증 파이프라인

- `scripts/generate-style-batch.mjs`(신규)로 후보 입력 → 기본 템플릿 생성
- `scripts/validate-slide-style-catalog.mjs`(신규)로 기본 무결성 점검
- PR 이전 단계에서 아래를 통과시키고 반영:
  - `id` 중복 없음
  - `id` -> `assets/slide-style-previews/{id}.jpg` 존재
  - `category` 존재
  - `nameKo/nameEn/aliases/tags/bestFor/promptKo/promptEn` 필수값

---

## 3) 단계별 실행 계획 (체크리스트)

### Phase 0. 사전 설계 (D0)
- [x] 목표 스코프 정의: 100개 이상 추가 (총 196개 목표)
- [x] 기존 96개 카테고리별 공백/중복 감지
- [x] 확장 네이밍 규칙 확정(슬러그, 라벨링, alias 규칙)
- [x] 한국 실무 시나리오 기반 후보군 프리셋 1차안 작성 (108개)

### Phase 1. 스타일 후보 구성 (D1~D2)
- [x] `카테고리별 15~30개` 균형 배치안 수립
  - `korea-commercial`: 17개
  - `reporting`: 18개
  - `startup`: 16개
  - `branding`: 15개
  - `technology`: 18개
  - `creative`: 16개
  - `government`: 12개
  - `major-industry`: 16개
- [x] 카테고리별 유니크 콘셉트 테마 정의(예: 대시보드형/IR형/브랜드형/플로우형/산업형)
- [x] 중복 위험 항목 사전 제거(예: minimal/modern/grid류 과도 중복)
- [x] 후보 100개를 "카드(메타 최소 템플릿)"로 먼저 생성

### Phase 2. 메타 데이터 적재 (D2~D3)
- [ ] `slide-style-catalog.js`에 단계 반영(또는 분할 모듈 우선 반영)
- [ ] alias/태그/주용도/키워드 보강
- [ ] `korea-commercial` 기준으로 `한국 실무 검색어` 포함
  - 예: 실적/성과/KPI/금액/계약/입찰/실행계획/로드맵/리스크
- [ ] 1차 문법검사
  - `node --check src/slide-style-catalog.js`
- [x] `scripts/validate-slide-style-catalog.mjs` 도입 및 실행

### Phase 3. 이미지 프리뷰 생성(병렬, 멀티에이전트 활용) (D3~D4)
- [ ] 프리뷰 생성 우선순위 기준 수립
  - High value: 정부·산업·IR·기업보고형
- [ ] 멀티에이전트 분할 렌더:
  - Agent A: 정부/산업군 30개 미리보기
  - Agent B: 창업/기술군 30개 미리보기
  - Agent C: 편집/creative/브랜드군 30개 미리보기
  - 주체: 메인 프로세스가 큐 관리 + 업로드 검수
- [ ] 생성 규격 고정: **960x540 JPG**
- [ ] 미리보기 파일 네이밍: `assets/slide-style-previews/{style.id}.jpg`
- [ ] 정합성 스크립트로 파일 누락 검사
  - 미리보기 id 매칭 실패 항목 목록 추출

### Phase 4. 통합 QA (D4)
- [ ] 카탈로그 검사 스크립트 통과
- [ ] 카테고리별 추천 검색 흐름 점검
- [ ] 모바일/데스크톱에서 스타일 목록 렌더 검증
- [ ] 실제 검색어 시나리오 점검(한글/영문 혼합 검색)
- [ ] 샘플 10개 랜덤 시각 선택성 검토 (실사용성)
- [ ] 중복/오용/부적절 톤 항목 재조정

### Phase 5. 릴리스
- [ ] `VERSION` 갱신 (캐시 갱신 목적)
- [ ] 변경 로그 문서화 + 마이그레이션 노트
- [ ] 푸시/배포

---

## 4) 한국 실무형 컨셉 믹스 전략

- `보고/컨설팅` + `기술` → 실적형·정량형 브리핑
- `스타트업/IT` + `브랜딩` → 투자자/고객 커뮤니케이션형
- `주요 산업` + `정부 부처` → 정책/지원사업/산업 보고형
- 각 카테고리에서 2~3개는 **하이브리드 스타일**로 설계
  - 예: `Executive + Regulatory`, `Investor + Product Story`, `Data Story + Brand Hero`

---

## 5) 현재 미진 항목 체크리스트 (진행 로그)

| 날짜 | 작업 | 상태 | 비고 |
|---|---|---|---|
| 2026-07-21 | 스타일 확장 계획 문서 생성 | 진행중 | 이 문서 생성 완료 |
| 2026-07-21 | 100개 후보군 1차 큐레이션 | 미완료 | 하위 항목에서 병렬 수집 예정 |
| 2026-07-21 | 후보군 메타 정규화 스키마 확정 | 진행중 | 핵심 항목(중복/필수필드) 기준 확정 |
| 2026-07-21 | `scripts/validate-slide-style-catalog.mjs` 실행 | 완료 | 현재 96개 기준점 통과 |
| 2026-07-21 | 프리뷰 생성 파이프라인 설계 | 미완료 | 멀티에이전트 분업 반영 예정 |
| 2026-07-21 | 캐시 갱신 및 통합 QA | 미완료 | Phase 4에서 일괄 수행 |

---

## 6) 검증용 체크리스트(실행 명령)

```bash
# 카탈로그 문법
node --check src/slide-style-catalog.js

# 스타일/프리뷰 정합성
node scripts/validate-slide-style-catalog.mjs

# 탭/스타일 기본 점검
node scripts/smoke-test.mjs
```

---

## 7) 바로 실행할 다음 액션(현재 턴)

- 1차로 각 카테고리별 후보 100개+를 최종 확정하기
- 확정된 후보를 체크리스트로 업데이트하고, 즉시 `draft` JSON(또는 JS 객체 목록)으로 반영 가능한 형태로 정리
- 정리 완료 후 다음 턴에서 멀티에이전트 분할로 이미지 생성 및 카탈로그 반영 착수

---

## 8) 1차 후보군 큐레이션 (100개+ 초안)

아래는 바로 적용 가능한 형태로 구성한 1차 후보입니다.
최종 반영 전 중복 제거 및 실사용성 검증을 거쳐 `100개 이상`을 선별합니다.

### 8-1. 보고·컨설팅 (18개)

| nameKo | nameEn | 주용도 | 핵심 시각 키워드 | 구분성 |
|---|---|---|---|---|
|전략 실행 아키텍처|Strategy Execution Architecture|경영진 실행계획/로드맵|단계형 막대, 게이트 점검표, 승인 플로우|전통 전략 문서형과 구분되는 실행 단계 강조|
|의사결정 정합성|Decision Integrity|의사결정 근거 제시/리스크 통보|요건-가정-근거-리스크 4분면|근거 추적형 메시지 구조|
|성과 임팩트 브리핑|Impact Reporting Brief|성과 리뷰|성과 대비 그래프+임팩트 카드|숫자 서사보다 실행 효과 집중|
|재무 지형도|Financial Topography|재무 보고서|자산·부채·현금흐름 3축|기존 재무차트형과 달리 지형도식 구성|
|리스크 레이어드|Risk Layering|리스크 평가/통제|확률-영향-우선순위 레이어|위험성 분리형 의사결정|
|컨설팅 액션맵|Consulting Action Map|개선안 제출|액션/주체/기한 매트릭스|실행책 중심의 시각|
|성과 드릴다운|Drill-down Performance|사업부 성과 분석|요약→세부 전개 링크형|탐색형 리뷰에 강함|
|정책 연계 리포트|Policy Link Report|정책 연계 제안서|규정 블록, 영향 범위|정책형 대응 문서와 분리|
|시나리오 전개보드|Scenario Deck|대안 비교 제시|동일 기준선 비교 표|시나리오 기준 추적이 쉬움|
|조직 운영 진단|Operations Diagnosis|운영진단/개선권고|프로세스 파이프라인 + 병목 하이라이트|개선 포인트 가시화|
|투자심의 브리핑|Investment Committee Brief|투자 심의|요약 메시지+핵심지표 카드|투자심의 속도형 표현|
|월간 실행 리뷰|Monthly Execution Review|월간 KPI 리뷰|월별 캘린더+임팩트 점수|성과 점검형 리듬 강화|
|법무 컴플라이언스 레터|Compliance Memo|컴플라이언스 대응|체크 항목·증빙 블록|감사 대응형 정합성|
|전환율 인사이트|Conversion Insight|마케팅 성과 분석|퍼널 단계별 전환과 개선점|매출전환 중심|
|채용 KPI 인텔리전스|Hiring KPI Intelligence|채용/인사 보고|직군·채널·전환율 패널|채용운영형 시각 강화|
|예산 사용 최적화|Budget Utilization Optimization|예산 운영 보고|한도/사용률/증감률 색구분|예산 운영 실행성 강화|
|파트너십 구조도|Partnership Structure|외부 협업/계약|이해관계자 네트워크|협업형 제안 특화|
|성과 서사형 데이터맵|Narrative Data Map|사업성과 서사화|시간축·지표축 교차|스토리형 데이터 프레임|

### 8-2. 편집·브랜딩 (15개)

| nameKo | nameEn | 주용도 | 핵심 시각 키워드 | 구분성 |
|---|---|---|---|---|
|브랜드 인사이트 에디션|Brand Insight Edition|브랜드 연간 계획/리포트|브랜드 아이덴티티 바|가이드형과 제안형 결합|
|브랜드 레이어 보드|Brand Layer Board|톤·카피 가이드|컬러·타이포 레이어|브랜딩 전달 강화|
|매체별 톤팩트|Channel Tone Kit|멀티채널 전략|채널별 분할 카드|채널 특성 반영|
|이커머스 캠페인북|Campaign Book|캠페인 기획|대형 타이포+제품 라이프맵|상업형 카피 연동|
|브랜드 스토리 다이어리|Brand Story Diary|브랜드 내러티브|타임라인+감성 톤 블록|연속 스토리형|
|프리미엄 제안 패널|Premium Deck Shell|상위 고객 제안|고급 질감, 제한적 메탈릭|과장 없는 고급감|
|런칭 모노크롬|Monochrome Launch|제품 런칭|단일색 고대비 정렬|단순 고채도 대비|
|브랜드 컬러 랩|Brand Color Lab|브랜드 가이드|팔레트 샘플+사용 규칙|컬러 관리형 문서|
|키 비주얼 스크롤|Key Visual Scroll|광고/런칭 발표|연속 스크롤 구성|중요 내용 단계 노출|
|스토리폼 에디토리얼|Storyform Editorial|문화 콘텐츠 제안|편집적 여백+캡션|대체 브랜딩형|
|브랜드 재도약|Brand Revitalization|리브랜딩|전후 비교 프레임|개편 프로젝트용|
|플랫폼 브랜딩|Platform Branding|서비스·앱 브랜딩|네비게이션 박스|서비스형 UI 연계|
|지역 가치 브랜딩|Regional Value Branding|지역 협업 제안|지역명 카드+지표|지자체 연계형|
|리테일 스토어 프레임|Retail Store Frame|매장 운영 제안|매장 동선·상품군|리테일 실무형|
|프롬프트 드라마틱|Editorial Drama|콘텐츠 발표|강한 제목/긴장 리듬|기존 에디토리얼과 차별|

### 8-3. 스타트업·IT (16개)

| nameKo | nameEn | 주용도 | 핵심 시각 키워드 | 구분성 |
|---|---|---|---|---|
|시드 피칭 패턴|Seed Pitch Pattern|초기 투자 유치|문제-해결-지표 3단|빠른 판단형 피치|
|SaaS 성장 스택|SaaS Growth Stack|구독형 성장|지표 파이프, CAC/LTV|성장형 KPI 특화|
|PMF 검증 시트|PMF Validation Sheet|시장 적합성 검증|인터뷰 인사이트 블록|실행 실무 포커스|
|모바일 퍼널 다이어그램|Mobile Funnel Diagram|온보딩 설계|단계도+이탈 포인트|사용자 여정 가시성|
|MVP 우선순위표|MVP Priority Matrix|개발 우선순위|긴급도/영향도/난이도|개발 회의형|
|디자인 시스템 인사이트|Design System Insight|디자인 정렬|컴포넌트 상태맵|실무 협업형|
|AI 제품 로드맵|AI Product Roadmap|AI 제품 연차계획|기능-데이터-보안 연동|AI 도입 중심|
|임팩트 피처맵|Feature Impact Map|기능 우선순위|기능별 가치 지도|기능 집중형|
|스타트업 실전 보드|Startup Battle Deck|스타트업 제안|한 장 핵심 KPI+리스크|회의형 제안|
|투자자 미팅 브리프|Investor Meeting Brief|업데이트 미팅|요약/갱신 포맷|짧고 판단력 높은|
|B2B 파이프라인|B2B Pipeline Deck|영업 제안|세그먼트/단계/성과|B2B 특화|
|테크니컬 데모 보드|Technical Demo Board|기술 발표|아키텍처+데모 항목|기술 이해도 강화|
|SaaS 가격 전략|SaaS Pricing Strategy|가격 정책|요금제 티어/가치|가격 논리 가시성|
|실험 설계 다이어그램|Experiment Design Board|AB 테스트|군집/가설/측정 축|실험 의사결정형|
|앱 지표 모니터링|App KPI Monitor|운영 리뷰|스프린트형 지표 카드|운영 지표 정합|
|기술 성장 나침반|Product Compass|장기 전략|기술 부채·인력·속도 축|균형성 강조|

### 8-4. 기술·산업 (18개)

| nameKo | nameEn | 주용도 | 핵심 시각 키워드 | 구분성 |
|---|---|---|---|---|
|반도체 공정 플로우|Semiconductor Process Flow|공정/생산|단계형 공정 블록|공정 중심 가독성|
|스마트팩토리 동선|Smart Factory Flow|공장 혁신|센서-설비-대시보드 선형|현장 실무형|
|ESG 디지털 트랜스폼|ESG Digital Transform|ESG 운영|출처·감축량·인증 라벨|ESG 문서 최적|
|클라우드 레이어|Cloud Layering|클라우드 아키텍처|인프라·플랫폼·서비스 층|층 구조 직관|
|AI 인프라 아틀라스|AI Infra Atlas|AI 운영 설계|비용·추론량·거버넌스|AI 실무형|
|디지털 트윈 제어판|Digital Twin Command|시뮬레이션 제안|시간축+제어 레이어|실행 시나리오형|
|사이버 보안 위기 대응|Cybersecurity Response|보안 대응|위협도, 대응, 책임|보안특화 구조|
|전력 최적화 맵|Power Optimization Map|에너지 효율|소비-손실-최적화 라운드|기술 실사용 중심|
|물류 디지털 네트워크|Logistics Digital Network|SCM 전략|노드 및 리드타임|네트워크형 가시화|
|스마트시티 인프라|Smart City Infra|도시 프로젝트|안전·교통·환경 KPI|공공사업형|
|양산 품질 관리|Mass Production QA|품질관리|품질단계·이슈·정상범위|제조현장형|
|연구개발 로드맵|R&D Roadmap|기술개발계획|개발단계·시험·출시|연구기관 대응|
|장비 성능 스펙|Equipment Performance|장비 제안/교체|성능곡선·보수주기|교체 판단형|
|통합 플랫폼 아키텍처|Converged Platform Architecture|솔루션 제안|도메인 인터페이스 박스|SI/솔루션형|
|제조 데이터 레이어|Manufacturing Data Layer|데이터 설계|수집-정규화-모델|데이터 아키텍처|
|배터리 원가 시뮬레이터|Battery Cost Simulator|원가 전략|원가 구성 민감도|산업 특화|
|핀테크 계량 프레임|Fintech Quant Frame|핀테크 제안|규제/리스크/효율 지도|금융 적합성|
|AI 산업 정책 브리프|AI Industry Policy Brief|정책 제안|영향도·산업군별 점수|정책 협업형|

### 8-5. 크리에이티브 (16개)

| nameKo | nameEn | 주용도 | 핵심 시각 키워드 | 구분성 |
|---|---|---|---|---|
|뉴미디어 그래픽 라인|New Media Graphic Line|트렌디 발표|선 굵기 대비|보수형 대비 실험형|
|브루탈리즘 에디션|Brutalism Edition|강한 존재감|콘크리트 질감|실험·강조형|
|레트로 사이언스|Retro Science|기술 문화 발표|모노+네온 라인|레트로·과학 조합|
|피처드 캡슐|Featured Capsule|행사/런칭 패키지|콘텐츠 카드 캡슐|다중 주제 처리|
|유기적 리듬|Organic Rhythm|교육 콘텐츠|곡선 그리드|직선형 대비|
|미니멀 3D 프레임|Minimal 3D Frame|제품 소개|얕은 깊이+평면|과한 3D 억제|
|컬러 브릭|Color Brick|온보딩 자료|색 블록 연속|기능 블록형|
|콜라주 스토리|Collage Story|콘텐츠 브리핑|사진 조합과 카드|정보 과부하 제어|
|유리 모멘트|Glass Moment|프리미엄 발표|유리 모서리+반사|고급감 제어|
|메모리 패턴|Memory Pattern|브랜드 회고형|빈티지 톤|향수형 톤|
|오케스트레이션 키노트|Orchestrated Keynote|전시/이벤트|리듬 있는 카드 순서|서사 구성력|
|데이터 포스터리|Poster Data|교육·홍보 하이브리드|포스터형 라벨/숫자|포스터형 분리|
|메탈릭 실루엣|Metallic Silhouette|현대 산업 발표|메탈 라인|산업 톤 강화|
|컬래퍼런스|Clustered Conference|학회/세미나|병렬 블록 모음|세션형 전달|
|모션 느낌 카드|Motion-Feel Cards|캠페인 발표|점진적 전환 감성|정적에서도 동적 느낌|
|포토 모듈 매트|Photo Module Matte|상품/아트 배치|매트 모듈, 얕은 그림자|비주얼 비중 조절|

### 8-6. 한국 상업형 (17개)

| nameKo | nameEn | 주용도 | 핵심 시각 키워드 | 구분성 |
|---|---|---|---|---|
|서울형 지역 리포트|Seoul District Report|지자체/지역 제안|지역구 기반 지도, 지표카드|지역 문맥 맞춤|
|국내 유통 실무|K-Commerce Ops|유통 운영|채널별 매출·회전율|유통 현장형|
|병원 영업 브리핑|Hospital Outreach Brief|의료 영업|환자 여정+안전 블록|의료규범 반영|
|공공기관 제안본|Public Institution Proposal|공공 기관 입찰|정책·근거·일정 탭|신뢰형 구조|
|재무제표 설명회|Financial Statement Brief|재무 리뷰|요약표+주석 블록|실무 회계형|
|교육행정 보고|Education Admin Brief|교육기관 운영|학급/학교/성과 다차원|공교육형 톤|
|부동산 사업 브리프|Real Estate Project Brief|개발 사업|토지·일정·수익 그래프|사업 제안형|
|MICE 제안보드|MICE Proposal Board|행사/전시 제안|행사일정+예산+효과|현장형 의사결정|
|식품 브랜딩 카드|Food Brand Card|식품 마케팅|원산지·원가·판로 카드|소비자 신뢰형|
|관광 시즌 전략|Tourism Seasonal Plan|관광 제안|시즌별 수요 라인|시즌성 강조|
|K-Corp ESG 제안|K-Corp ESG Kit|ESG 경영|정량 목표·행동 항목|ESG 대응용|
|K-콘텐츠 IP 런치|K-Content IP Launch|IP 확장|에피소드형 전개|콘텐츠 적합|
|소상공인 디지털 전환|SME Digital Shift|지원사업 제안|진입장벽·성과|지원사업형|
|금융권 채널 통합|Financial Channel Merge|핀테크 제휴|채널별 성능·전환|금융업 실무|
|해양물류 실무판|Marine Logistics Practical|물류 제안|항만·물류 연동|물류 실무형|
|산업단지 브랜딩|Industrial Complex Branding|투자유치 홍보|단지 지도·산업군·인프라|지역 경제형|
|K-정부 협업형|K-Gov Collaboration|정부 협업|역할·일정·산출물|공공 협업형|

### 8-7. 정부 부처형 (12개)

| nameKo | nameEn | 주용도 | 핵심 시각 키워드 | 구분성 |
|---|---|---|---|---|
|국세청 세정 브리핑|NTS Tax Operations Brief|세정/세무 행정|세율·징수·감면 가시화|세정 수치 정돈|
|과기정통 미래성장|AI & Convergence Policy|혁신 정책|과제 포트폴리오·지원지표|혁신 정책형|
|산안위 산업안전|Industrial Safety Board|산업안전|위험도·점검|안전 중심|
|환경부 기후 대시보드|Climate Dashboard|기후 환경|감축량·지역별 달성률|환경 지표 선명|
|국방 디지털 국방|Defense Digital Ops|국방 과제|임무·장비·예산 3축|보안 톤|
|보건데이터 거버넌스|Health Data Governance|보건 데이터 운영|개인정보 라벨|민감데이터 대응|
|법무 제도정비|Legal Reform Map|규제/입법|문제·과제·조문·영향|법률형 문서|
|고용 전환 패키지|Employment Transition Pack|고용 정책|재취업 경로·효율|정책사업형|
|해양 수출 기회맵|Marine Export Opportunities|해양수산 지원|항로·클러스터|수출형 톤|
|국방 물류 체계|National Logistics Readiness|국가 대응|물자흐름·대응 단계|안전 우선|
|국립연구 성과 브리핑|National Research Brief|연구 제안|단계·성과·협력체|연구기관형|
|국토 인프라 통합|Territory Infrastructure Plan|인프라 계획|도시축·교통·투자 단계|국토형 구조|

### 8-8. 주요 산업형 (16개)

| nameKo | nameEn | 주용도 | 핵심 시각 키워드 | 구분성 |
|---|---|---|---|---|
|그린 수소 산업|Green Hydrogen Industry|산업 정책/투자|공급망·안전·수익성|신성장 산업 특화|
|양자산업 초기안|Quantum Industry Intro|첨단산업 제안|연산·보안 단계|미래산업 문서|
|해운 스마트 항로|Smart Shipping Route|해운/물류|항로·대기시간·연료|항로 최적화형|
|바이오의약 확장|Bio Pharma Expansion|제약/바이오|R&D·임상·유통|규제 적합|
|우주산업 투자보드|Space Industry Board|우주 산업 투자|발사·개발·파트너십|고부가산업형|
|철강 저탄소 전략|Low-Carbon Steel|제조/투자|공정 저감·원가 비교|산업 현실형|
|디지털 광고 기술|AdTech Performance|광고사업|캠페인→ROI→리스크|광고형 분석|
|항만 물류 플랫폼|Port Logistics Platform|항만 공급망|하역·검역·반입·출고|복합 흐름형|
|국내 모빌리티 플랫폼|Domestic Mobility Platform|교통 서비스|라이프사이클·정산|교통형 제안|
|반도체 장비 수명|Semiconductor Tool Lifecycle|장비 투자|교체 주기·정비·정산|의사결정형|
|배터리 안전성 평가|Battery Safety Review|배터리 산업|시험·승인 단계|안전성 중심|
|게임 퍼블리셔 전략|Game Publisher Strategy|콘텐츠 산업|퍼블리싱·수익률|게임 업계 특화|
|미디어 다자산 믹스|Media Mix Portfolio|콘텐츠 사업|플랫폼별 수익 구조|복합수익형|
|정밀 화학 공급망|Fine Chemical Supply|화학/소재|원료·공정·검증|공정형 문서|
|의료기기 상용화|MedTech Commercialization|의료기기 도입|규제·임상·판매 단계|의료산업형|
|친환경 포장산업|Sustainable Packaging|포장/패키지|재료군·폐기·재활용|ESG 연계|

총 후보 수: **108개**

> 주의: 일부 항목은 카테고리 교차 후보입니다. 확정 단계에서 `reporting/startup/...` 카테고리로 중복 정렬해 100개 이상으로 고정합니다.
