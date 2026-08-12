# 라벨 페이지 반복 복사·유형별 샘플 Design QA

- Source visual truth:
  - `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-af4a69a2-09f7-454b-934d-a7fd76cb615f.png` (760×583 px, 96 dpi)
  - `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-ec5c76fd-14e1-41bb-8142-6a588b5a22d4.png` (847×283 px, 96 dpi)
- Implementation screenshots:
  - `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-page-copy-top-final.png`
  - `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-page-copy-bottom-final.png`
  - `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-sample-presets-detail.png`
- Comparison image: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-page-copy-comparison-final.png`
- Viewport: 1265×712 CSS px, device scale factor 1
- Density normalization: 구현 캡처는 1265×712 px 1:1, 소스와 구현의 관련 영역을 각각 600×330 px `contain` 타일로 정규화해 1240×700 비교 이미지에서 함께 확인했다.
- State: light theme, 이미지 생성 프롬프트, 식권, 양면, 교육생 중식 식권 8건, A4 앞·뒷면 프롬프트 2개 생성

## Full-view comparison evidence

소스에서는 페이지 선택과 이전·다음 이동은 프롬프트 위에 있었지만 복사 버튼이 멀리 있거나 하단에 없었다. 구현은 같은 결과 카드 안에서 A4 페이지 선택, 이전·다음, 현재 페이지 복사, 복사 후 다음, 복사 완료 수를 프롬프트 위와 아래에 동일하게 제공한다. 긴 프롬프트를 위에서 읽기 시작하거나 아래까지 검토한 어느 상태에서도 별도 스크롤 복귀 없이 다음 생성 작업을 이어갈 수 있다.

## Focused region comparison evidence

비교 이미지의 오른쪽 위·아래 영역에서 두 도구막대의 버튼 순서와 상태가 동일하고, 선택 페이지 `1/2`, 비활성 이전 버튼, 활성 다음 버튼, `복사 완료 0/2`가 일관되게 표시된다. 목표 단계의 유형별 샘플 선택은 식권에서 `교육생 중식 식권`, `조식·중식·석식 식권`, `알레르기·식단 구분 식권`을 한 자리에서 선택하고 바로 채우는 구조로 확인했다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: 기존 PromptDeck의 Pretendard/시스템 폰트와 12–13px 도구 글자 위계를 유지했다. 짧은 `이전`·`다음` 표기는 접근성 이름에서 전체 의미를 보존한다.
- Spacing and layout rhythm: 좁은 결과 레일 안에서 선택 상자와 이동 버튼이 한 줄, 복사 버튼과 진행률이 다음 줄에 정렬된다. 상·하단 구조가 동일해 반복 조작의 위치 기억을 돕는다.
- Colors and tokens: 기존 파란 기본 버튼, 흰 보조 버튼, 연한 파란 진행 배지를 재사용했다.
- Image quality and assets: 새 장식 자산은 없으며 실제 프롬프트·페이지 상태를 캡처했다. 배경 이미지 품질이나 합성 자산에는 영향을 주지 않는다.
- Copy and content: `현재 페이지 복사`, `복사 후 다음`, `복사 완료 n / total`이 반복 작업의 다음 행동과 진행 상태를 직접 설명한다. 유형별 3종씩 총 12개 샘플은 연번 유무, QR 전체·교차·미사용, 긴 문구, 앞·뒷면 안내를 고르게 포함한다.

## Comparison history

### Pass 1 — blocked

- [P1] 데스크톱의 좁은 결과 레일에서 `이전 페이지`·`다음 페이지` 버튼과 320px 선택 상자가 합쳐져 내부 가로 오버플로가 117px 발생했다.
- Fix: 버튼의 보이는 문구를 `이전`·`다음`으로 줄이고 전체 접근성 이름을 유지했다. 도구막대 안 선택 상자는 `min-width: 0`으로 축소 가능하게 했다.

### Pass 2 — passed

- 결과 카드 `scrollWidth === clientWidth`(506px), 상·하단 내비게이션 각각 `scrollWidth === clientWidth`(414px), 문서 가로 오버플로 없음으로 재확인했다.
- 상단과 하단 선택값·상태가 `2 / 2`로 동기화되고 모든 복사 버튼이 실제 표시 상태임을 앱 내 브라우저에서 확인했다.

## Primary interactions tested

- 특정 A4 페이지를 상단·하단 선택 상자에서 호출
- 상단 이전/다음과 하단 선택값·상태 동기화
- `현재 페이지 복사`와 `복사 후 다음`
- 복사 완료 페이지 체크 표시와 완료 수 갱신
- 유형별 샘플 3종 선택, 연번 없는 스태프 패스 8건, 식권 기본 샘플 복귀
- 데스크톱·390px 정적 화면의 가로 넘침과 44px 모바일 조작 영역

## Console errors checked

- 전체 브라우저 smoke와 정적 desktop/mobile smoke의 page error·script failure·failed response 수집에서 이번 라벨 변경 관련 오류가 없었다.

final result: passed

---

# 라벨 진행 단계 위치 Design QA

- Source visual truth: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-a21e77ff-6d4e-47da-a439-44f5d02228da.png`
- Implementation screenshot: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-progress-placement-desktop.png`
- Mobile screenshot: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-progress-placement-mobile.png`
- Comparison image: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-progress-placement-comparison.png`
- Viewport: desktop CSS 1600×900 (capture 1585×892), mobile CSS 390×844 (capture 375×836)
- Source pixels: 1865×423; comparison pixels: 1600×968
- Density normalization: source was proportionally scaled to 1600px width; implementation was compared at the same 1600px content width and cropped to the relevant top 520px region.
- State: light theme, `라벨·티켓 제작` tab, STEP 1 `목표` open; STEP 5 scroll transition additionally verified.

## Full-view comparison evidence

소스에서는 진행 단계 막대가 PromptDeck 헤더와 메인 탭 메뉴 사이에 독립 고정 층으로 올라와 있었다. 구현 화면에서는 라벨 작업영역의 `목표 정의` 카드 최상단으로 이동했고, 앱 헤더·탭 메뉴 아래에 배치되어 정보 계층이 명확하다.

## Focused region comparison evidence

별도 추가 크롭은 필요하지 않았다. 결합 비교 이미지에서 헤더, 메인 탭 메뉴, 작업 소개, 진행 단계, 목표 카드가 동시에 읽히는 크기로 표시되어 위치·층차 차이를 직접 판단할 수 있다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: 기존 PromptDeck 타이포 스케일과 굵기, 줄높이를 그대로 유지했다. 단계 번호·제목은 데스크톱과 모바일 모두에서 줄바꿈 없이 읽힌다.
- Spacing and layout rhythm: 진행 막대는 목표 카드의 첫 번째 직접 자식이며 카드 내부 여백을 유지한다. 1600px에서 헤더 하단 96px, 탭 메뉴 하단 148px, 진행 막대 상단 304.8px로 실측되어 겹침이 없다.
- Colors and visual tokens: 기존 표면, 테두리, 파란 활성 색상, 그림자 토큰을 재사용했다. 새로운 브랜드 색은 추가하지 않았다.
- Image quality and assets: 이미지·아이콘 자산을 추가하거나 대체하지 않아 선명도와 자산 일관성 변화가 없다.
- Copy and content: 단계 레이블과 목표 정의 문구는 기존 값을 유지했다. 이동으로 인한 중복 표시나 누락이 없다.
- Responsive behavior: 390×844에서 진행 막대는 카드 안에서 2행으로 재배치되며 `scrollWidth 375 <= innerWidth 390`으로 가로 넘침이 없다.
- Accessibility and behavior: 기존 버튼 ID와 키보드 포커스 계약을 유지했다. 목표 단계로 이동할 때는 진행 버튼이 아닌 첫 결과물 선택지에 포커스하도록 보정했다.

## Comparison history

### Pass 1 — blocked

- [P1] 진행 단계 막대가 앱 헤더와 메인 탭 메뉴 사이의 독립 sticky 층으로 표시되어 전체 정보 계층을 역전시켰다.
- Fix: 기존 진행 막대 DOM을 `#labelSheetIntentPanel`의 첫 자식으로 이동하고, `position: sticky` 및 앱 전역 top 옵셋을 제거했다.

### Pass 2 — passed

- Post-fix visual evidence: `label-progress-placement-comparison.png`에서 진행 막대가 메인 메뉴 아래, 목표 카드 안에 위치한다.
- STEP 5로 전환하고 출력 영역으로 스크롤한 상태에서도 진행 막대는 전역 sticky 층으로 복귀하지 않았다.
- No remaining P0/P1/P2 visual differences.

## Primary interactions tested

- 라벨·티켓 탭 열기
- STEP 1 `목표` 진입과 목표 결과물 포커스
- STEP 5 `검토·출력` 전환 후 스크롤 배치
- 1600×900 데스크톱 배치
- 390×844 모바일 재배치 및 가로 넘침

## Console errors checked

- 수정 화면에서 버스 오류 및 경고 없음.

final result: passed

---

# 라벨·티켓 단계형 업무공간 UI/UX 개편 Design QA

- Source screenshots: `%USERPROFILE%\.codex\visualizations\2026\08\12\promptdeck-label-ux-audit\01-goal-current.png`, `%USERPROFILE%\.codex\visualizations\2026\08\12\promptdeck-label-ux-audit\08-prompt-page-copy-current.png`
- Implementation screenshots: `%USERPROFILE%\.codex\visualizations\2026\08\12\promptdeck-label-ux-audit\17-redesign-goal-final.png`, `%USERPROFILE%\.codex\visualizations\2026\08\12\promptdeck-label-ux-audit\15-redesign-prompt-output-final.png`, `%USERPROFILE%\.codex\visualizations\2026\08\12\promptdeck-label-ux-audit\16-redesign-print-output-final.png`
- Comparison images: `%USERPROFILE%\.codex\visualizations\2026\08\12\promptdeck-label-ux-audit\qa-goal-before-after.png`, `%USERPROFILE%\.codex\visualizations\2026\08\12\promptdeck-label-ux-audit\qa-prompt-before-after.png`
- Viewport: desktop 1569×856, mobile regression 390×844
- State: light theme, 라벨·티켓 제작, 완성물/프롬프트 양쪽 흐름, 식권·일반 티켓 샘플

## Full-view comparison evidence

소스와 구현을 동일 비교 이미지에 좌우로 배치했다. 목표 화면은 소개 카드와 반복 설명을 덜어내고 결과물·품목·출력 면·샘플·다음 단계를 첫 화면 안에 배치했다. 프롬프트 결과는 기존의 비어 있던 왼쪽 열을 제거하고 A4 미리보기와 페이지별 복사 도구를 같은 가로 작업공간에 배치했다.

## Focused region comparison evidence

`qa-prompt-before-after.png`에서 페이지 선택, 이전·다음, 현재 페이지 복사, 개별 라벨 전환이 A4 미리보기 옆에 모였음을 확인했다. `16-redesign-print-output-final.png`에서는 PNG·PDF·인쇄 버튼, A4 미리보기, 사전 점검, 프로젝트·레이어 묶음이 한 결과 단계 안에서 직접 연결된다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: 기존 PromptDeck 시스템 폰트와 크기 위계를 유지했다. 제목·단계·상태·보조 설명의 역할을 분리하고, 데스크톱 부가 설명은 hover/focus 도움말로 이동해 스캔 밀도를 낮췄다.
- Spacing and layout: 목표 화면의 별도 소개 카드와 중복 배지를 제거했다. 5단계 진행 바, 현재 단계 컨텍스트 바, 결과 작업공간을 일관된 간격과 카드 표면으로 정렬했다.
- Viewport resilience: 전체 회귀 테스트의 390×844 모바일 검사와 데스크톱 실제 브라우저에서 가로 넘침이 없었다. 모바일에서는 설명을 숨기지 않고 44px 조작 영역을 유지한다.
- Colors and tokens: 기존 `--surface`, `--line`, `--accent`, 상태 색상과 그림자 토큰을 재사용했다. 신규 브랜드 팔레트나 장식 자산은 추가하지 않았다.
- Image quality and assets: A4 미리보기는 실제 renderer의 배경·문구·QR 결과를 그대로 사용한다. 대체 이미지, CSS 그림, 임시 아이콘을 만들지 않았다.
- Copy and content: 장황한 안내와 중복된 출력 경로 문구를 제거했다. 컨텍스트 바는 현재 단계에서 무엇을 확인하고 다음에 어디로 이동하는지만 짧게 말한다.
- States and interactions: 목표 수정, 단계 이전·다음, 전체 설정 보기, 프롬프트 생성, 앞·뒤 페이지 전환, PDF·PNG·인쇄, 표 붙여넣기, QR, 확대 편집 흐름을 회귀 검사했다.
- Accessibility: 단계 버튼은 `aria-current`, 도움말은 `aria-describedby`와 `role="tooltip"`, 카드 선택은 실제 radio/label을 유지한다. 포커스와 선택 상태는 기존 파란 강조색으로 구분된다.

## Comparison history

### Pass 1 — findings

- [P1] 목표 화면 위의 별도 소개 카드가 의사결정 영역을 아래로 밀었다.
- [P1] 프롬프트 결과에서 왼쪽 열이 비어 있고 복사 도구가 멀리 떨어졌다.
- [P2] 출력 액션과 설명이 여러 영역에 중복되었다.
- [P2] 깊은 단계에서 현재 위치와 이전·다음 이동 맥락이 약했다.

### Pass 2 — passed

- 목표·규격·데이터·편집·결과의 한 단계 집중 구조로 재배치했다.
- 결과별로 완성물 출력 작업공간과 프롬프트 복사 작업공간을 분리했다.
- 전후 비교 이미지에서 정보 밀도, 빈 공간, 액션 거리, 단계 맥락 문제 해소를 확인했다.
- `npm run smoke:test`가 데스크톱·390px 모바일 및 PNG·PDF·인쇄·프롬프트 페이지 이동을 포함해 통과했다.

## Audit report

- 단계별 감사, 발견 사항, 해결 내역, 증거 화면은 `%USERPROFILE%\.codex\visualizations\2026\08\12\promptdeck-label-ux-audit\audit.md`에 저장했다.

final result: passed

---

# 라벨 확대 편집 도구 통합 Design QA

- Source visual truth: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-97fffe88-b2c3-448c-844c-81d22030cf94.png` (807×355), `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-f1bdcd0d-7bd2-46fc-9a20-c5c777acff82.png` (619×278), `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-3e72b6d8-9bcf-45fe-8de8-a7d84b56d474.png` (619×651), `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-6193f33a-2789-44b7-a661-60318e6a7eda.png` (630×140)
- Implementation screenshot: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-integrated-editor-final-20260812.png` (1554×848)
- Viewport: desktop 1569×856 CSS px, device scale factor 1; mobile regression 390×844 CSS px
- State: light theme, 라벨·티켓 제작 > 완성물 직접 제작 > 화면 편집 > 1번 티켓 > 빠른 서식

## Full-view comparison evidence

네 개의 소스 캡처와 최종 구현을 같은 비교 입력에서 확인했다. 소스에서 서로 떨어져 있던 공통 문구 레이아웃, 선택 라벨 빠른 편집, 세부 편집·프리셋을 확대 편집 카드의 왼쪽 도구 레일로 모았고, 실제 티켓 캔버스는 오른쪽에 유지했다. 결과적으로 항목 선택, 서식 조정, 캔버스 확인이 한 화면에서 연속된다.

## Focused region comparison evidence

편집 도구와 확대 캔버스가 최종 화면에서 각각 484px, 756px 너비로 동시에 보이므로 별도 크롭 없이 버튼 라벨, 단축키, 글꼴·크기·너비·높이 컨트롤과 문구 상자를 읽을 수 있었다. 상단 고정 탭 아래 편집기 헤더가 13px 이상 떨어져 잘리지 않았고, 문서 가로 넘침은 0px였다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: 기존 PromptDeck 시스템 글꼴과 굵기 위계를 재사용했다. 단축 버튼은 11px 굵은 라벨과 짧은 키 캡을 사용하고, 캔버스 문구는 기존 출력 렌더러의 실제 크기를 그대로 보여 준다.
- Spacing and layout rhythm: 데스크톱 편집 단계는 단일 1278px 작업대로 확장되고, 2열 편집 도구/캔버스 구조를 사용한다. 헤더·적용 범위·티켓/페이지 이동·도구·상태가 같은 카드 안에 정렬된다.
- Colors and visual tokens: 기존 파란 선택색, 표면색, 경계선, 성공 상태 색상만 재사용했다. 선택 항목과 정렬 상태가 동일한 파란 강조색으로 즉시 드러난다.
- Image quality and asset fidelity: 새 장식 자산은 추가하지 않았다. 확대 캔버스는 등록된 실제 배경과 동일 렌더러의 문구 레이어를 사용하며 편집 대비 모드만 화면용으로 적용한다.
- Copy and content: `빠른 서식 / 면 공통 설정 / 세부·프리셋`, `1–7 항목`, `미세 이동`, `크기`, `정렬`로 편집 기능의 위치와 역할을 명확히 했다. 앞·뒷면과 티켓·페이지 이동도 작업대 헤더 안에 배치했다.
- Accessibility and behavior: 항목 단축키 1–7, 크기 `[ ]`, Alt+방향키 이동, Alt+L/C/R 정렬, `?` 도움말을 지원한다. 모든 기능은 같은 버튼으로도 사용할 수 있고, 선택·비활성 상태를 `aria-pressed`, `aria-selected`, `disabled`로 노출한다.
- Responsive behavior: 전체 스모크 테스트의 390×844 다크·라이트 접근성 검사에서 가로 넘침, 선택 대비, 포커스 링 문제가 없었다.

## Comparison history

### Pass 1 — blocked

- [P2] 기존 공통 설정·빠른 편집·세부 프리셋이 확대 캔버스 밖에 분리되어 스크롤 왕복이 필요했다.
- [P2] 데스크톱의 오른쪽 결과 열이 약 608px라 확대 편집과 도구를 함께 보기에는 좁았다.
- Fixes: 세 패널을 확대 편집 카드 내부 탭으로 실제 재배치하고, 편집 단계에서 결과 영역을 1278px 단일 작업대로 확장했다. 왼쪽에 도구, 오른쪽에 확대 캔버스를 배치하고 직접 단축 버튼과 키보드 조작을 추가했다.

### Pass 2 — passed

- Post-fix evidence: `label-integrated-editor-final-20260812.png`에서 편집 카드 전체가 상단 고정 탭 아래 161.6px부터 시작하고 856px 화면 하단 안에 핵심 작업대가 보인다. 문서 가로 넘침은 0px이다.
- No remaining P0/P1/P2 visual differences.

## Primary interactions tested

- 빠른 서식, 면 공통 설정, 세부·프리셋 탭 전환
- 1–7 직접 버튼과 숫자키 항목 선택
- 크기 버튼과 `[ ]` 단축키 즉시 반영
- 미세 이동 버튼과 Alt+방향키
- 정렬 버튼과 Alt+L/C/R
- 앞·뒷면, 이전·다음 티켓, 이전·다음 페이지
- 편집 끝내기 후 기존 전체 A4 및 출력 흐름 복귀
- 전체 앱 PNG·PDF·QR·연속 데이터 회귀 및 390px 모바일 접근성

## Console errors checked

- 전체 `npm run smoke:test` 실행에서 새 콘솔 오류 없이 통과했다.

final result: passed

---

# 라벨 엑셀 편집·확대 개별편집 Design QA

- Source visual truth: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-f006d7d9-21c5-4442-9f4e-a08784d5b218.png`, `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-109e96eb-5388-42c6-8622-b75c8269936e.png`, `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-ca2b9d12-2ad5-45d0-9e02-079d5fa1a2a3.png`
- Pass 1 blocked screenshot: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-focus-editor-pass1-blocked.png`
- Implementation screenshots: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-focus-editor-20260812.png`, `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-spreadsheet-editor-20260812.png`
- Viewport: implementation screenshot 1554×848 px, browser CSS viewport 1569×856, devicePixelRatio 1; mobile regression 390×844
- Source pixels: data table 862×512, A4 overview 626×428, focus editor 596×448
- Density normalization: all captures were inspected at native pixel density; source regions are focused crops while implementation captures retain the full desktop workspace for order and adjacency evidence.
- State: light theme, 라벨·티켓 제작, 완성물 직접 제작, 8개 데이터, 문구·QR 편집 활성, 편집 대비 활성

## Full-view comparison evidence

세 개의 참조 화면과 두 개의 구현 캡처를 한 번의 동일 비교 입력으로 열어 확인했다. 확대 개별 편집 작업대가 전체 A4 배치보다 먼저 나타나고, 그 아래 A4 선택 화면이 이어진다. 왼쪽 데이터 표에는 기존 정보 구조를 유지한 채 Excel 붙여넣기·행 복사·전체 복사·열 채우기 도구가 표 바로 위에 연결됐다.

## Focused region comparison evidence

- 데이터 표: 참조의 직접 입력 표 위에 2×2 액션 그리드와 라이브 상태 문구가 추가됐고 활성 셀은 기존 파란 포커스 토큰으로 식별된다.
- 확대 편집: 참조에서 배경 문구와 편집 문구가 겹치던 영역을 배경 전용 캔버스와 실제 편집 레이어로 분리했다. 편집 대비를 켜면 배경은 약하게, 실제 글자·QR·핸들은 선명하게 보인다.
- 전체 배치: 확대 편집 다음에 `2 · 전체 A4 배치 확인`이 나타나며 티켓 선택이 위 확대 작업대와 연결된다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: 확대 편집 레이어가 출력 렌더러와 같은 항목별 font family, sizePercent, weight, alignment, 강제 줄바꿈을 사용한다. 실제 캡처에서 제목 50.87px, 부제 28.83px, 본문 24.42px로 서로 구분됐다.
- Spacing and layout rhythm: `개별 확대 편집 → 전체 A4 확인` 순서가 명시적인 1·2 단계로 구성되고, Excel 도구는 데이터 표와 10px 간격의 한 카드로 묶였다.
- Colors and visual tokens: 기존 PromptDeck의 surface, line, accent, success 토큰만 재사용했다. 활성 셀·선택 상자·리사이즈 핸들의 파란 강조 체계를 유지했다.
- Image quality and asset fidelity: 확대 편집 바탕은 renderer의 `background` 레이어만 사용해 결과 문구를 중복 렌더링하지 않는다. 배경 흐림/감쇠는 편집 화면에만 적용되며 PNG·PDF 출력 원본에는 영향을 주지 않는다. QR이 있으면 문자열 `QR` 대신 실제 QR canvas를 편집 상자 안에 표시한다.
- Copy and content: `클립보드 붙여넣기`, `선택 행 복사`, `표 전체 복사`, `열 끝까지 채우기`, `편집 대비 켬`으로 동작을 바로 이해할 수 있게 했다.
- Accessibility and behavior: 표 셀 포커스, Ctrl+V 범위 붙여넣기, Ctrl+D 열 채우기, Enter 다음 행 이동, 상태 라이브 영역, ID 중복 방지 안내를 제공한다. 모바일 버튼은 최소 44px 높이를 유지한다.
- Responsive behavior: 전체 smoke test의 390×844 검사에서 라벨 셸과 목표 패널이 뷰포트를 넘지 않았고, Excel 액션은 한 열로 재배치된다.

## Comparison history

### Pass 1 — blocked

- [P1] 확대 작업대가 완성 텍스트가 포함된 merged canvas 위에 편집 텍스트를 다시 표시해 배경 텍스트와 실제 편집 문구를 구분하기 어려웠다.
- [P1] 편집 레이어의 글꼴 크기 계산이 레이아웃 전 5px로 확정되어 크기·정렬 변경의 실제 결과를 알아보기 어려웠다.
- [P2] 표 안의 반복 데이터를 Excel 방식으로 직접 붙여넣거나 아래 행으로 채우는 도구가 없었다.
- Fixes: focus renderer를 background-only로 전환하고 편집 대비 토글을 추가했다. 레이아웃 프레임 후 실제 작업대 치수로 글꼴 크기를 확정하고 정렬·글꼴·색상·QR canvas를 편집 레이어에 적용했다. 셀 범위 붙여넣기, TSV 복사, Ctrl+D와 열 채우기를 추가했다.

### Pass 2 — passed

- Post-fix evidence: `label-sheet-focus-editor-20260812.png`에서 배경 텍스트는 약하게 보이고 실제 문구 서식은 선명한 단일 레이어로 확인된다. `label-sheet-spreadsheet-editor-20260812.png`에서 Excel 도구와 표, 전체 A4 미리보기가 한 작업 화면에 유기적으로 연결된다.
- No remaining P0/P1/P2 differences.

## Primary interactions tested

- 머리글 포함 Excel 2×2 범위를 선택 셀에 직접 붙여넣고 제목·이름 4셀 반영
- 선택 셀 값을 2~8행에 7셀 채우고 검증용 데이터를 원상 복구
- 전체 행과 선택 행을 머리글 포함 TSV로 복사
- 확대 편집에서 글자 크기 슬라이더와 가운데/오른쪽 정렬 즉시 반영
- 배경 전용 canvas 1개, 편집 필드 5개, 실제 QR canvas, 개별/공통 범위, 앞/뒤 티켓 이동
- 확대 편집이 전체 A4 확인보다 먼저 배치되는 순서

## Console errors and automated checks

- In-app Browser console/log errors: 0
- `npm run label:test`: 18 engine tests, assets/renderer tests, package tests passed
- `npm run smoke:test`: desktop WYSIWYG, Excel/TSV, PNG/PDF/print, 390px responsive regression passed
- `node --check src\label-sheet.js`, `node --check scripts\smoke-test.mjs`, `git diff --check`: passed

final result: passed

---

# 라벨 1개 확대 편집 작업대 Design QA

- Source visual truth: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-93d7ad21-41cf-422b-97eb-721b4c823683.png` (312×333 px, 96 dpi)
- Implementation screenshot: `%USERPROFILE%\AppData\Local\Temp\promptdeck-label-focus-editor-desktop-20260812.png` (1440×1000 px, device scale factor 1)
- Mobile screenshot: `%USERPROFILE%\AppData\Local\Temp\promptdeck-label-focus-editor-mobile-20260812.png` (390×844 px, device scale factor 1)
- Viewport: desktop 1440×1000 CSS px, mobile 390×844 CSS px
- Density normalization: 소스는 기존 312×333 캡처를 원본 크기로 확인하고, 구현은 CSS 픽셀과 동일한 1× 캡처에서 편집 영역과 A4 선택 영역을 각각 읽을 수 있는 크기로 비교했다.
- State: light theme, 라벨·티켓 제작 > 완성물 직접 제작 > 화면 편집 > 현장 상담 순번표 8건 > 앞면

## Full-view comparison evidence

소스 화면은 A4 전체 미리보기의 작은 2×4 칸 위에 문구·QR 편집 오버레이가 직접 놓여 개별 티켓 조작이 어려웠다. 구현은 A4 화면을 티켓 선택과 전체 배치 확인 용도로 제한하고, 선택한 티켓 1개를 별도 144dpi 작업대에 약 488×351px로 다시 렌더링한다. 데스크톱 캡처에서 확대 작업대, 개별/공통 범위, 이전·다음 티켓, 실제 문구 상자와 크기 핸들이 한 결과 패널 안에 이어진다.

## Focused region comparison evidence

선택한 A4 칸은 약 99×72px이고 확대 편집 티켓은 약 488×351px로 같은 비율을 유지하며 약 4.9배 넓게 표시된다. A4에는 선택 테두리만 1개 남고 편집 문구 상자는 0개이며, 확대 작업대에는 문구 5개 상자와 선택 핸들이 표시된다. 모바일 390px 화면은 편집 카드 폭 321px, 티켓 폭 274px, 적용 범위 세로 적층, 44px 이전·다음 버튼을 유지한다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: 기존 PromptDeck 시스템 폰트와 12–14px 제어 글자 위계를 유지했다. 확대 티켓 안의 편집 레이블은 10–15px 범위로 커져 항목을 식별하기 쉽다.
- Spacing and layout rhythm: 적용 범위, 티켓 이동, 확대 작업대, 상태, 전체 A4 배치 순서로 편집 흐름을 분리했다. 데스크톱 작업대와 모바일 작업대 모두 내부 스크롤바가 없다.
- Colors and visual tokens: 기존 표면, 경계선, 파란 강조색, 성공 상태 토큰을 재사용했다. 선택 티켓과 활성 범위는 동일한 파란 테두리 체계로 연결된다.
- Image quality and asset fidelity: 선택 티켓을 기존 72dpi A4 캔버스에서 확대하지 않고 144dpi로 별도 렌더링한다. 실제 배경 자산, 문구 레이아웃, QR 모델과 출력 렌더러를 그대로 사용한다.
- Copy and content: `이 티켓만`, `현재 면 공통`, `이전 티켓`, `다음 티켓`, `n / 8`이 적용 범위와 연속 편집 대상을 직접 설명한다.
- Accessibility and responsiveness: 범위 버튼은 `aria-pressed`, A4 티켓은 키보드 선택, 이전·다음은 disabled 상태를 제공한다. 데스크톱·모바일 모두 문서 가로 넘침 0px, 작업대 내부 넘침 0px이다.

## Comparison history

### Pass 1 — blocked

- [P1] 소스 화면에서는 A4 칸 안의 약 100px 폭 티켓에서 문구와 QR을 직접 잡아야 해 정밀 이동·크기 조정이 어렵고, 개별 티켓과 공통 레이아웃 적용 범위도 편집 화면에서 즉시 구분되지 않았다.
- Fixes: A4 편집 오버레이를 선택 전용으로 바꾸고, 선택 티켓만 144dpi로 다시 그리는 확대 작업대를 추가했다. 개별/공통 범위를 큰 선택 카드로 분리하고 작업대 내부에 이전·다음 티켓 탐색을 배치했다.

### Pass 2 — passed

- Post-fix visual evidence: 데스크톱 캡처에서 작업대가 선택 A4 칸보다 약 4.9배 넓고, 문구 5개 상자와 핸들이 읽을 수 있는 크기로 표시된다.
- 범위 전환은 빠른 편집과 세부 편집 선택값에 즉시 동기화된다. 다음 티켓 선택 시 `2 / 8`, `2번 · DEMO-WAIT-002`, A4 두 번째 선택 테두리가 함께 갱신된다.
- 390px 모바일에서 범위 카드는 세로로 쌓이고 44px 탐색 버튼, 가로 넘침 없는 확대 티켓을 확인했다.

## Primary interactions tested

- 화면 편집 단계 진입과 확대 작업대 자동 표시
- A4 티켓 선택과 확대 작업대 대상 동기화
- 이전·다음 티켓을 통한 1/8 → 2/8 → 1/8 이동
- `이 티켓만`과 `현재 면 공통` 범위 전환 및 빠른/세부 설정 동기화
- 확대 작업대 문구 5개 영역, QR 사용/미사용 레이아웃, 드래그·크기 핸들 렌더링
- 데스크톱 1440×1000과 모바일 390×844의 가로·내부 세로 넘침
- 전체 PNG·PDF·인쇄·모바일 회귀 테스트

## Console errors checked

- 최종 데스크톱 상호작용 이후 새 오류·경고 로그 0건.
- `npm run smoke:test` 184.7초 전체 회귀 테스트 통과.
- 라벨 엔진 18개 테스트와 자산·렌더러 테스트 통과.

final result: passed

---

# 라벨 결과 패널 중첩 스크롤 제거 Design QA

- Source visual truth: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-999f0de5-b6c3-49d9-b75e-5e81a6391ace.png`
- Implementation screenshot: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-scrollbar-20260812\implementation-card-crop.png`
- Comparison image: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-scrollbar-20260812\combined-qa.png`
- Viewport: desktop 1294×856
- State: 라벨·티켓 제작 > 완성물 직접 제작 > STEP 5 미리보기·출력

## Comparison evidence

기존 화면의 결과 카드 오른쪽에 있던 독립 세로 스크롤을 제거했다. 수정 화면에서 결과 카드는 `overflow: visible`, `max-height: none`으로 콘텐츠 높이만큼 확장되며, 문서 전체 스크롤만 사용한다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Nested scrolling: 결과 카드의 `scrollHeight`와 `clientHeight`가 같고 내부 세로 스크롤이 없다.
- Continuity: 출력 버튼, 세부 편집, 면 전환, 미리보기가 잘리지 않고 같은 결과 흐름에서 이어진다.
- Cache safety: 라벨 스타일 자산 버전을 갱신해 기존 브라우저 캐시가 이전 스크롤 규칙을 유지하지 않도록 했다.

final result: passed

---

# 라벨 무료 AI 배경 등록·인라인 문구/QR 편집 Design QA

- Source visual truth 1: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-69f66eaa-a128-4224-9019-ea9802b8ea27.png`
- Source visual truth 2: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-c795325c-908c-4e42-9a17-0cf0c6dd116f.png`
- Implementation screenshot 1: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-free-ai-workflow-final.png`
- Implementation screenshot 2: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-inline-editor-qr-final.png`
- Comparison image: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-background-editor-comparison-final.png`
- Viewport: desktop 1265×720, mobile 390×844
- State: light theme, 라벨·티켓 제작, 교육생 중식 식권 8건, 앞면, 라벨별 직접 편집, QR 영역 34%

## Full-view comparison evidence

두 참조 화면과 최종 구현을 한 장의 비교 이미지에 같은 순서로 배치해 확인했다. 기존 API 직접 생성 설정은 `배경 전용 프롬프트 준비 → 무료 이용 가능 외부 도구 열기 → 다운로드/클립보드 결과 보관함 등록`의 3단계 작업으로 바뀌었다. 결과 패널에는 미리보기 면·페이지 이동과 같은 행에 `문구·QR 편집` 버튼을 두고, 편집을 켜면 바로 아래에서 선택 라벨·적용 범위·항목·글꼴·크기·정렬을 조정하도록 연결했다.

## Focused region comparison evidence

무료 AI 영역은 개인정보와 실제 문구를 제외한 `[RASTER BACKGROUND ONLY]` 프롬프트, 외부 생성 도구 선택, 파일/클립보드 등록 흐름을 확인했다. 인라인 편집 영역은 QR 전용 선택 상태에서 글꼴·정렬 도구가 숨겨지고 크기와 위치 조정만 남는지, 점선 QR 상자를 움직인 값이 미리보기와 출력 모델에 반영되는지 확인했다.

## Findings

- P0/P1/P2 문제 없음.
- Typography: 기존 PromptDeck 폰트·크기·굵기 토큰을 유지했고, 문구 편집 시 프리텐다드/고딕/명조/고정폭 계열을 라벨별로 선택할 수 있다.
- Spacing/layout: 506px 결과 카드에서 빠른 편집 도구를 3열 반응형 그리드로 재배치해 `scrollWidth === clientWidth`를 확인했다. 편집 버튼·도구·미리보기가 같은 결과 카드 안에서 이어진다.
- Colors/tokens: 기존 표면·경계선·파란 강조색·상태색만 사용했다. QR 편집 상자는 실제 결과물과 구분되는 편집용 점선/실선 상태를 사용한다.
- Image quality: 생성 결과는 PNG·JPEG·WebP 원본으로 등록하고 기존 파생본 처리기의 규격 축소·초점·업스케일 제한·품질 검사를 그대로 거친다.
- Copy/content: 외부 서비스의 로그인·무료 한도·약관이 달라질 수 있음을 명시하고, 직접 API 생성이나 무료 사용 보장을 표현하지 않았다.
- Responsive behavior: 전체 브라우저 회귀 테스트의 390×844 라벨 워크플로가 가로 넘침 없이 통과했다. 모바일 입력·버튼은 44px 이상 터치 높이를 유지한다.

## Comparison history

### Pass 1 — fixed

- [P1] 빠른 편집 도구가 6열로 유지돼 506px 결과 카드에서 `scrollWidth 767px` 가로 넘침이 발생했다.
- [P1] 편집을 처음 켜면 QR 포함 레이아웃의 긴 식권 제목이 잘려 PNG/PDF 버튼이 비활성화될 수 있었다.
- Fixes: 결과 카드 안의 빠른 편집 도구를 3열 그리드로 바꾸고, QR 포함 기본 제목을 12.5%·최대 3줄로 조정했다. 예시 채우기는 이전 개별/공통 WYSIWYG 레이아웃을 초기화해 항상 출력 가능한 예시 상태에서 시작한다.

### Pass 2 — passed

- 결과 카드와 빠른 편집 도구 모두 가로 넘침이 0이 됐다.
- 교육생 식권 8건에서 PNG와 PDF 버튼이 활성화됐고, 실제 다운로드 PDF가 `%PDF-1.4`, 1페이지 `/Pages`, `startxref` 구조 검증을 통과했다.
- 참조와 구현 결합 이미지에서 편집 버튼, 즉시 조정 도구, QR 편집 상자, 배경 등록 3단계가 의도한 작업 흐름으로 확인된다.

## Primary interactions tested

- 현재 규격·면·디자인 DNA 기반 배경 전용 프롬프트 준비 및 복사 버튼 활성화
- 외부 생성 도구 선택과 새 탭 열기 경로
- 생성 파일 선택/클립보드 이미지 등록을 기존 배경 보관함 처리기로 연결
- 첫 라벨 제목의 글꼴·크기·정렬 변경과 두 번째 라벨 기본값 독립 유지
- QR 포함 라벨의 34% 크기 변경과 방향키/Shift+방향키 위치 조정
- QR 없는 라벨에서 QR 편집 선택 비활성화 및 전체 문구 폭 사용
- PDF 파일 저장, 인쇄 루트, PNG 출력 경로
- 데스크톱 결과 카드 가로 넘침과 390px 모바일 워크플로

## Console errors checked

- 라벨 탭 상호작용 후 브라우저 오류·경고 로그 없음.
- `npm run smoke:test` 전체 탭 회귀 검증 통과.

final result: passed

---

# 화풍 믹서 UI 개선 Design QA

- Source visual truth: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-d017da79-7e1f-4c1c-9d0f-67afa1a48dd1.png`
- Implementation screenshot: `%USERPROFILE%\AppData\Local\Temp\promptdeck-mixer-desktop.png`
- Mobile screenshot: `%USERPROFILE%\AppData\Local\Temp\promptdeck-mixer-mobile.png`
- Comparison image: `%USERPROFILE%\AppData\Local\Temp\promptdeck-mixer-comparison.png`
- Viewport: desktop 1280×720, mobile 390×844
- State: light theme, mixer open, step 1 selected

## Full-view comparison evidence

The implementation preserves the existing PromptDeck visual language while reducing setup prominence and making the result panel image-led. The API key field moved into a settings popover, controls gained search/random/reset actions, and the mobile layout gained a direct result jump.

## Focused region comparison evidence

A separate crop was not needed because the mixer controls, card typography, result image, labels, and action buttons were readable in the full-view source and implementation captures. Step 2 and the mobile result state were also checked directly in the browser.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Typography: card titles, descriptions, filters, controls, summaries, and prompt text now use a readable 12–14px UI scale with increased line height.
- Spacing/layout: denser card grids and a narrower workspace gap improve scanning without crowding. The result panel remains sticky on desktop.
- Colors/tokens: existing PromptDeck surface, border, accent, dark-mode, and selected-state tokens are retained.
- Image quality: the preview uses the existing medium sample asset at a larger 16:9 crop. A visible “화풍 참고 이미지” badge prevents it from being mistaken for a newly generated final image.
- Copy/content: action labels now describe their destination, including “홍보 이미지에 적용.”
- Accessibility: subject and palette cards are native buttons; medium cards support keyboard activation; selected states use `aria-pressed`; focus-visible styling is present.
- Responsive behavior: mobile controls form a two-column utility grid, selection cards remain readable, and “결과 보기” scrolls directly to the result panel.

## Patches made

- Increased typography and line-height across the mixer.
- Added subject and medium search.
- Unified subject, medium, and palette browsing with horizontally scrollable category tabs.
- Moved medium sample preview, replacement, refresh, save, restore, and keyword editing from selection cards into the right result panel.
- Merged the wizard step indicator and live selection summary into one three-part navigation component.
- Promoted Visual Style Mixer from a Concept Suggestion subview to its own top-level application tab.
- Added random combination and reset controls.
- Moved Unsplash key input into sample settings.
- Added image-led preview with collapsible prompt.
- Added responsive result jump and sticky mobile actions.
- Improved button semantics, keyboard support, and focus visibility.

## Follow-up polish

- P3: An optional future API action could generate a true subject × medium × palette composite preview instead of showing the medium reference image.

final result: passed

---

# 라벨·티켓 PDF·프롬프트 데이터 통합 Design QA

- Source visual truth:
  - `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-f29cbc51-f25b-446c-84fb-5104897685a6.png`
  - `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-f16cf90f-9c04-42f2-88b1-3d9ab1efa6c4.png`
  - `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-3d15abcb-6637-4167-b0f6-f5b728985b57.png`
- Implementation screenshots:
  - `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-final-desktop-top.png`
  - `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-final-desktop-result.png`
  - `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-final-dna-gallery.png`
  - `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-final-mobile-data.png`
- Viewport: desktop 1440×1000, mobile 390×844
- State: light theme, 식권, 양면, 프롬프트 모드와 완성물 PDF 모드를 각각 검증

## Full-view comparison evidence

참조 목표 카드와 구현 데스크톱 화면을 같은 비교 입력에서 확인했다. 구현은 `완성물 직접 제작`과 `이미지 생성 프롬프트 설계`를 첫 단계의 동등한 두 경로로 유지하고, 문서 유형·단면/양면·샘플 채우기를 바로 아래에 연결했다. 오른쪽 결과 열에는 현재 모드의 핵심 버튼, 미리보기, 점검, 페이지·개별 프롬프트 결과가 한 화면 흐름으로 이어진다.

## Focused region comparison evidence

데이터 다이어그램 갤러리 참조와 라벨 DNA 모달을 같은 비교 입력에서 대조했다. 180개 실제 미리보기, 검색, 분류, 추천 표시, 선택 상태, 더 보기와 완료 버튼이 동일한 시각 문법으로 구현되었다. 프롬프트 데이터 표는 완성물과 같은 입력·검토 UI를 사용하며, 390px에서 페이지 가로 넘침 없이 표 내부만 가로 스크롤된다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- PDF: 브라우저에서 17건, A4 3시트, 양면 교차 순서의 6쪽 PDF 생성 완료 상태를 확인했다. PDF 작성기 구조 검사는 portrait/landscape MediaBox, 2쪽 객체 수, xref를 검증한다.
- Data parity: 직접·연속번호, 붙여넣기, CSV와 공통 편집 표가 두 모드에 동일하게 제공된다. 표에서 수정한 앞면 제목이 A4 페이지 프롬프트와 첫 개별 라벨 프롬프트에 함께 포함되는 자동 회귀 검사를 추가했다.
- Prompt content: 실제 제목·부제·본문·하단 문구·연번을 정확 문자열로 포함한다. QR 값은 보내지 않고 `reserve-blank-space`, 위치, 크기만 레이아웃 계약에 남긴다.
- Typography and spacing: 기존 PromptDeck의 카드, 필드, 단계 번호, 상태 색상과 44px 모바일 조작 영역을 유지했다.
- Responsive behavior: 390px에서 페이지 가로 오버플로가 없고, 1160px 데이터 표는 289px 내부 스크롤 컨테이너에서 탐색된다.

## Comparison history

### Pass 1 — failed

- [P1] `print prompt`처럼 두 모드 공통으로 지정한 패널이 반대 모드 토큰을 포함한다는 이유로 숨겨졌다.
- [P1] 프롬프트 모드의 공통 데이터 검토·직접 편집 표가 완성물 전용으로 분류되어 있었다.
- [P2] 수동 연번 적용 직후 대기 중인 자동 적용이 프롬프트 결과를 무효화했고, PDF/PNG 완료 상태도 후속 점검 문구에 덮였다.
- Fixes: 현재 모드 토큰이 없는 요소만 숨기도록 CSS 조건을 수정하고, 데이터 표를 `print prompt` 공통 영역으로 변경했다. 수동 적용 시 예약 타이머를 취소하고 완료 상태를 재적용했다.

### Pass 2 — passed

- 목표 카드, 결과 액션 도크, 페이지·개별 프롬프트, DNA 갤러리, 공통 데이터 표를 데스크톱·모바일에서 재검증했다.
- 전체 브라우저 smoke, 정적 desktop/mobile smoke, 라벨 엔진·렌더러·패키지 테스트가 통과했다.

## Primary interactions tested

- 완성물/프롬프트 모드 전환
- 식권 샘플과 연번 없음/연속번호 전환
- 공통 데이터 표 직접 편집 및 프롬프트 즉시 반영
- 페이지별·개별 라벨별 프롬프트 분리
- QR 합성 공간 예약 및 실제 URL 제외
- 17건·3시트·양면 6쪽 PDF 저장
- DNA 갤러리 검색·선택·닫기
- 390px 모바일 데이터 표 내부 스크롤

## Console errors checked

- 최신 `app.js?v=5`, `label-sheet-engine.js?v=5`, `label-sheet.js?v=7` 로드 상태에서 새 JavaScript 오류 표시가 없음을 확인했다.

final result: passed

---

# 양식 이미지 QR 토글 카드 Design QA

- Source visual truth: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-756959b8-eaad-4c1a-822a-0c210ee139b8.png`
- Implementation screenshot: `%USERPROFILE%\AppData\Local\Temp\promptdeck-form-image-qr-desktop-off-light.png`
- Mobile screenshot: `%USERPROFILE%\AppData\Local\Temp\promptdeck-form-image-qr-mobile-off.png`
- Viewport: desktop 1265×720, mobile 375×844
- State: light theme, 양식 이미지 > 맺음말, QR 사용 OFF 기본 상태와 ON 상세 설정 상태

## Full-view comparison evidence

기준 화면과 구현 화면을 각각 열어 QR 제목, `연결 안내` 배지, 우측 사용 토글, 안내 문구, 카드 테두리와 여백을 확인했다. 구현은 홍보용 이미지 탭과 동일한 토글 구조를 사용하며, 양식 이미지 탭의 좁은 입력 열에서도 정보 위계를 유지한다.

## Focused region comparison evidence

기준 이미지와 구현 집중 캡처를 모두 확인했으나, 브라우저 보안 정책이 두 로컬 이미지를 한 화면에 결합한 비교 페이지 생성을 차단했다. 따라서 필수 결합 비교 증거는 생성하지 못했다.

## Findings

- 별도 확인한 화면에서는 actionable P0, P1, P2 시각 차이를 발견하지 못했다.
- Typography: 기존 PromptDeck의 11–13px 보조문구와 13px 굵은 필드 제목을 유지했다.
- Spacing/layout: 기준 화면의 한 줄 제목·배지·토글 구조와 하단 안내문구 구조를 재현했다.
- Colors/tokens: 기존 표면, 테두리, accent 토큰과 홍보용 이미지 토글 트랙을 재사용했다.
- Image quality: 이미지 자산을 사용하지 않는 네이티브 폼 컨트롤 영역이다.
- Copy/content: 기준의 실제 QR 후삽입 권장 안내를 동일한 의미로 적용했다.
- Interaction: OFF 상태에서는 상세 입력을 숨기고, ON 상태에서는 URL·크기·안내문구·위치·강조 설정을 펼친다. URL 입력이 생성 프롬프트에 반영되는 것을 확인했다.
- Accessibility: 토글은 연결된 checkbox/label 구조이며 키보드 focus-visible 윤곽선을 제공한다.
- Responsive behavior: 375px viewport에서 가로 스크롤 없이 카드와 토글이 한 줄에 유지된다.
- Console: 브라우저 콘솔 오류 없음.

## Comparison history

### Pass 1 — blocked

- 구현 기능, 데스크톱, 모바일, 콘솔 검증은 통과했다.
- 필수 결합 비교 이미지 생성이 브라우저 보안 정책으로 차단되어 formal visual QA를 완료할 수 없었다.

final result: blocked

---

# 공통 프롬프트 타이포그래피 정돈 Design QA

- Source visual truth: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-88eabca7-5139-487d-b1fe-ad48ec2793eb.png`
- Implementation screenshot: `%USERPROFILE%\AppData\Local\Temp\promptdeck-common-after-light-desktop.png`
- Comparison image: `%USERPROFILE%\AppData\Local\Temp\promptdeck-common-typography-comparison.png`
- Viewport: desktop 1680×890
- State: light theme, 공통 프롬프트 탭, 색상 시스템 펼침

## Full-view comparison evidence

문제 화면과 수정 화면을 같은 1680×890 크기로 정규화해 좌우 결합 이미지로 비교했다. 수정 화면은 기능·색상·2열 작업 구조를 유지하면서 작업 UI의 본문, 도움말, 카드 제목과 오른쪽 요약 글자를 한 단계 키웠다. 축척 표현이 필요한 슬라이드 미리보기 내부 텍스트는 기존 크기를 유지했다.

## Focused region comparison evidence

색상 시스템을 펼친 상태에서 아코디언 제목·요약, 섹션 제목·설명, 소스 선택 카드, 팔레트 입력과 오른쪽 설정 요약이 한 화면에 함께 보여 별도 크롭 없이 글자 위계와 줄바꿈을 판단할 수 있었다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: 작업 UI의 보조 문구를 11–13px, 단계 제목을 15px, 섹션 제목을 16px, 오른쪽 미리보기 제목을 18px로 정리했다. 750/700 중심의 제한된 굵기 체계와 1.35–1.55 줄높이를 적용해 갑작스러운 크기·굵기 변화를 제거했다.
- Spacing and layout rhythm: 아코디언 기본 높이를 52px로 높이고 본문 좌우·하단 여백을 조정했다. 글자 확대 후에도 카드, 입력 필드, 상태 토글과 오른쪽 요약 레일에 잘림이나 겹침이 없다.
- Colors and visual tokens: 기존 PromptDeck 표면·테두리·파란 강조·성공 상태 토큰을 유지했다. 타이포그래피 변경을 위해 새로운 색상이나 효과를 추가하지 않았다.
- Image quality and asset fidelity: 이미지 자산을 변경하지 않았다. 오른쪽 슬라이드 미리보기의 축척 글자는 의도적으로 확대 대상에서 제외해 시뮬레이션 비율과 선명도를 유지했다.
- Copy and content: 문구와 정보 구조는 변경하지 않았다.
- Responsive behavior: 767px 이하에서 단계 제목 14px, 보조 설명 11px, 62px 터치 행과 단일 열 본문을 사용한다. 저장소 스모크 테스트의 390×844 반응형 검증이 통과했다.

## Comparison history

### Pass 1 — passed

- 결합 비교에서 기존의 9–11px 보조 글자와 불규칙한 제목 크기가 해소됐다.
- 글자 확대에 따른 P0/P1/P2 잘림, 겹침, 수평 오버플로 또는 상호작용 회귀는 발견되지 않았다.

## Primary interactions tested

- 공통 프롬프트 탭 전환
- 색상 시스템 아코디언 열기
- 데스크톱 라이트·다크 테마 렌더링
- 390×844 반응형 스모크 검증

## Console errors checked

- 공통 프롬프트 탭 렌더링 중 브라우저 콘솔 오류 없음.

## Follow-up polish

- P3: 사용자 선호에 따라 향후 `보통 / 크게` 두 단계의 UI 글자 크기 옵션을 제공할 수 있다.

final result: passed

---

# 기관용 랜덤 설정 리터칭 용어·배치 Design QA

- Source visual truth: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-e5574c08-4019-417d-acbd-2e9ef336025b.png`
- Implementation screenshot: `%USERPROFILE%\.codex\visualizations\2026\07\14\019f60d3-76e8-7200-9ac0-15f145f16ec6\institution-retouch\desktop-light-after.png`
- Mobile screenshot: `%USERPROFILE%\.codex\visualizations\2026\07\14\019f60d3-76e8-7200-9ac0-15f145f16ec6\institution-retouch\mobile-after.png`
- Comparison image: `%USERPROFILE%\.codex\visualizations\2026\07\14\019f60d3-76e8-7200-9ac0-15f145f16ec6\institution-retouch\source-and-after.png`
- Viewport: desktop 1440×1000, mobile 390×844
- State: light theme, 공통 프롬프트 탭, 기관용 조합 적용 상태

## Full-view comparison evidence

참조 화면과 수정 화면을 하나의 비교 이미지로 확인했다. 기존 카드의 색상·테두리·타이포그래피 체계는 유지하면서 상단 용어를 `리터칭`으로 통일했고, 액션 순서를 `전체 조합 → 리터칭 → 팔레트`로 재구성했다.

## Focused region comparison evidence

기관용 랜덤 설정 카드만 별도로 캡처해 설명 문구, 버튼 높이, 버튼 간격, 결과 요약 그리드와 텍스트 말줄임을 확인했다. 모바일에서는 전체 조합 버튼이 한 행 전체를 차지하고 리터칭·팔레트 버튼이 다음 행에서 동일 너비로 배치되는 것을 확인했다.

## Findings

- P0/P1/P2 문제 없음.
- Typography: 기존 폰트 크기와 굵기를 유지하며 `화풍` 표현을 `리터칭 기법`으로 명확히 변경했다.
- Spacing/layout: 데스크톱 액션을 동일 높이의 3열 그리드로 정렬하고, 1180px 이하에서는 한 줄 전체 폭을 활용하도록 전환했다.
- Colors/tokens: 기존 PromptDeck 배경·테두리·강조색 토큰을 그대로 사용했다.
- Image quality: 이미지 자산을 변경하거나 추가하지 않았다.
- Copy/content: 설명, 버튼, 오류 및 완료 알림에서 리터칭 용어를 일관되게 사용한다.
- Responsive behavior: 390px 화면에서 가로 오버플로 없이 321px 전체 조합 버튼과 157px 보조 버튼 두 개가 안정적으로 배치된다.

## Comparison history

- Pass 1 — passed: 참조와 수정 화면의 결합 비교에서 의도한 용어 및 액션 위계 변경 외에 수정이 필요한 P0/P1/P2 차이는 없었다.

## Primary interactions tested

- 전체 조합 바꾸기
- 리터칭 바꾸기
- 팔레트 바꾸기
- 데스크톱 및 모바일 반응형 재배치

## Console errors checked

- 수정 영역에서 오류 또는 경고 없음.

final result: passed

---

# 공통 프롬프트 아코디언 레이아웃 Design QA

- Source visual truth: `%USERPROFILE%\.codex\generated_images\019f5b9d-671e-7962-9c76-c3d220f40308\exec-b8e42fde-d11a-4f95-88fb-a6cb77833826.png`
- Implementation screenshot: `D:\개발관련\ppt_prompt\tmp\common-prompt-qa\common-prompt-desktop-final-evidence.png`
- Mobile screenshot: `D:\개발관련\ppt_prompt\tmp\common-prompt-qa\common-prompt-mobile-final.png`
- Comparison image: `D:\개발관련\ppt_prompt\tmp\common-prompt-qa\common-prompt-comparison-final.png`
- Viewport: desktop 1536×1024, mobile 390×844
- State: light theme, 공통 프롬프트 탭, 7/13 완료, 푸터 시스템 펼침, 오류 없음

## Full-view comparison evidence

소스와 구현 화면을 같은 크기로 정규화해 한 장에 좌우로 배치했다. 최종 구현은 상단 프로젝트 설정 바 없이 제목·진행률·전체 펼치기/접기, 13개 아코디언, 오른쪽 설정 요약을 동일한 정보 위계로 유지한다. 13개 항목이 데스크톱 첫 화면에 모두 노출되고, 푸터 설정은 소스와 같은 행 단위 편집 구조로 표시된다.

## Focused region comparison evidence

별도 크롭은 필요하지 않았다. 최종 비교 이미지에서 푸터 유형, 높이 슬라이더, 정렬, 페이지 번호와 구분선 제어가 읽을 수 있는 크기로 함께 보이며, 오른쪽 미리보기·설정 요약·검증·핵심 액션도 한 화면에서 직접 비교할 수 있었다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: 기존 PromptDeck의 Pretendard/시스템 폰트 계열과 굵기 위계를 유지했다. 제목, 항목명, 요약, 도움말은 밀도 높은 설정 화면에 맞는 10–30px 범위와 안정적인 줄높이를 사용한다.
- Spacing and layout rhythm: 데스크톱은 메인 아코디언과 410px 고정 요약 레일로 구성했다. 아코디언 행은 40px 밀도로 조정해 13개 항목을 첫 화면에서 확인할 수 있고, 모바일은 58px 터치 영역으로 다시 확장된다.
- Colors and tokens: 기존 PromptDeck의 표면, 경계선, 파란 강조색, 성공/경고 토큰을 재사용했다. 임의의 신규 브랜드 팔레트는 추가하지 않았다.
- Image quality and assets: 별도 장식 이미지나 대체 아이콘 자산을 추가하지 않았다. 오른쪽 슬라이드 미리보기는 실제 설정값으로 반응하는 기존 기능형 미리보기이며, 16:9 비율과 안전영역을 선명하게 유지한다.
- Copy and content: 상단 프로젝트명·제작모델·출력언어·출력형식 바를 제거했다. 제작모델·언어·형식은 `출력 설정` 대화상자에만 배치했고, 프로젝트 기본정보에는 결과물 유형과 사용 목적만 남겼다.
- Accessibility and behavior: 아코디언은 `aria-expanded`와 연결된 본문 ID를 사용한다. 출력 설정과 생성 결과는 `role="dialog"`, Escape 닫기, 배경 클릭 닫기를 지원한다. 모바일 가로 넘침은 없으며 고정 하단 액션이 유지된다.

## Comparison history

### Pass 1 — blocked

- [P2] 제목, 진행률, 펼치기 버튼이 두 줄로 분리되어 소스보다 상단 영역이 높았다.
- [P2] 기본 아코디언 행과 푸터 편집 영역이 너무 높아 13개 섹션을 첫 화면에서 스캔하기 어려웠다.
- Fixes: 제목·진행률·전체 펼치기/접기를 한 줄 그리드로 통합했고, 오른쪽 레일을 410px로 맞췄다. 데스크톱 행 높이를 40px로 줄이고 푸터 편집기를 5개의 가로 설정 행으로 재구성했다.

### Pass 2 — passed

- Post-fix visual evidence: `common-prompt-comparison-final.png`에서 전체 13개 항목, 펼쳐진 푸터 설정, 오른쪽 요약 패널이 소스와 같은 화면 범위와 위계로 확인된다.
- No remaining P0/P1/P2 visual differences.

## Primary interactions tested

- 개별 아코디언 열기/닫기
- 모두 펼치기 13개 및 모두 접기 0개 상태
- 출력 설정 대화상자 열기/닫기와 국문 출력 선택
- 검토 및 프롬프트 생성 결과 대화상자
- 슬라이드 분리기로 전송 후 공통 프롬프트 입력값 확인
- 모바일 하단 `출력 설정 / 검토 및 생성 / 분리기로 보내기` 액션바

## Console errors checked

- 수정한 공통 프롬프트 코드에서 발생한 오류는 없었다.
- 저장소의 기존 `src/promptdeck-api-globals.js:461`에서 `state is not defined` 오류가 반복 기록된다. 이번 변경 파일 밖의 기존 전역 API 문제이며 공통 프롬프트 생성, 출력 설정, 아코디언, 분리기 전송 검증에는 영향을 주지 않았다.

## Follow-up polish

- P3: 기존 전역 API 오류는 별도 정리 작업에서 `app.js`의 상태 노출 계약과 함께 점검할 수 있다.

final result: passed

---

# 라벨 무료 AI 배경·인라인 편집 최종 확인

- Final comparison: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-sheet-background-editor-comparison-final.png`
- Final focused captures: `label-sheet-free-ai-workflow-final.png`, `label-sheet-inline-editor-qr-final.png`
- Functional evidence: 라벨 단위 글꼴·크기·정렬 독립 적용, QR 34% 크기·위치 이동, QR 없는 라벨 전체 폭, 식권 8건 PNG/PDF 활성화, 유효 PDF 다운로드를 확인했다.
- Responsive evidence: 결과 카드와 빠른 편집 도구의 `scrollWidth === clientWidth`; 전체 390×844 브라우저 회귀 검증 통과.
- No remaining P0/P1/P2 visual or interaction findings.

final result: passed

---

# 라벨 QR·콘텐츠 공간 편집 Design QA

- Source visual truth: `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-985329c4-3076-49d7-a7ac-0d7cad551599.png`, `%USERPROFILE%\AppData\Local\Temp\codex-clipboard-2ede81d7-0275-471e-881c-6c53201691a1.png`
- Implementation screenshot: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-space-editor-20260812\implementation-result-panel.png`
- Comparison image: `%USERPROFILE%\.codex\visualizations\2026\08\10\019fe9f9-15e7-7a53-b58d-56eca0a663d8\label-space-editor-20260812\combined-qa.png`
- Viewport: desktop 1265×712, mobile regression 390×844
- State: light theme, 라벨·티켓 제작 > 완성물 직접 제작 > 식권 2×4 양면 > 문구·QR 편집

## Comparison evidence

사용자가 제시한 고정 QR 여백 화면과 개선 결과 패널을 한 이미지에 결합해 비교했다. 개선 화면은 기존 PromptDeck의 패널·입력·강조색 체계를 유지하면서 `전체 콘텐츠` 너비·높이, 항목별 문구 상자, QR 크기·위치·레이어를 같은 결과 패널에서 바로 조정할 수 있다.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Layout: `자동 감싸기`는 QR과 실제로 같은 영역에 놓인 문구만 줄인다. 실측에서 제목은 약 62%로 감싸졌고 QR 아래 하단 문구는 90% 너비를 유지했다.
- Editing freedom: 전체 콘텐츠 영역과 각 문구 상자의 너비·높이를 수치, 슬라이더, 모서리 핸들로 조정한다. QR도 위치·크기·레이어를 독립 편집한다.
- Modes: `자동 감싸기`, `고정 여백`, `자유 겹침`을 분리했다. 자유 겹침의 충돌은 경고로 표시하되 PNG·PDF·인쇄를 막지 않는다.
- Output fidelity: 같은 renderer 모델을 미리보기, PNG, PDF, 인쇄가 공유한다. 전체 스모크 테스트에서 실제 PNG·PDF 다운로드와 인쇄 루트가 통과했다.
- Accessibility: 빠른 편집 컨트롤은 연결된 label과 상태 문구를 제공하며, 문구·QR 상자는 키보드 선택과 방향키 이동을 지원한다. 모바일 리사이즈 핸들은 18px로 확대했다.
- Responsive behavior: 390×844 회귀 검증에서 라벨 셸과 목표 패널의 가로 넘침이 없고 모바일 핵심 컨트롤은 44px 높이를 유지했다.
- Console and runtime: 전체 스모크 테스트에서 새 페이지 오류 없이 통과했다.

## Primary interactions tested

- QR 자동 감싸기에서 충돌 문구와 비충돌 문구의 너비 분리
- 전체 콘텐츠 너비·높이 즉시 반영
- 자유 겹침 및 QR 문구 아래 레이어
- QR 없는 라벨의 전체 폭 사용
- PNG, PDF, 인쇄 출력과 390px 모바일 레이아웃

final result: passed
