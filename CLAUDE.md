# PromptDeck 프로젝트 작업 지침

이 저장소는 정적 HTML/CSS/JavaScript 기반의 탭형 프롬프트 생성 서비스입니다. 주요 기능은 슬라이드 프롬프트 설계, 슬라이드 분리, API 이미지 생성, 지도 이미지 프롬프트, 부속 양식 생성, 홍보 이미지 기획, 홍보용 이미지 생성입니다.

## 최우선 원칙

- 모든 파일은 **UTF-8 without BOM**으로 유지한다.
- 한글이 포함된 파일을 읽을 때는 PowerShell에서 `Get-Content -Encoding utf8`을 사용한다.
- 기존 소스 파일을 전체 덮어쓰기하지 않는다. 큰 파일은 반드시 부분 패치 방식으로 수정한다.
- `index.html`, `app.js`, `src/*.js`, `styles/*.css`는 크기가 크므로 작업 전후 주변 맥락을 확인한다.
- `backup/`, `backups/`, `.claude/`, `.codex-remote-attachments/`, `.playwright-mcp/`, `outputs/`, `node_modules/`는 사용자가 명시하지 않는 한 수정하거나 커밋하지 않는다.
- 사용자가 만들었을 수 있는 기존 변경을 되돌리지 않는다.

## 현재 핵심 파일 구조

- `index.html`: 전체 앱 HTML, 탭 버튼, 탭 pane, CSS/JS 로딩 순서를 포함한다.
- `app.js`: 슬라이드 프롬프트 설계 탭의 주요 로직.
- `src/tabs.js`: 상단 탭 전환, 탭별 퀵버튼 프록시 액션 관리.
- `src/generator.js`: 슬라이드 분리기.
- `src/slide-image-generation.js`: API 이미지 생성.
- `src/map-prompt.js`: 지도 이미지 프롬프트 생성.
- `src/slide-document.js`: 부속 양식 탭의 문서 표지/간지/배경 생성.
- `src/promotion-planner.js`: 홍보 이미지 기획.
- `src/promotion.js`: 홍보용 이미지 생성.
- `styles/base.css`: 헤더, 탭 바, 공통 버튼, 모바일 하단 액션바.
- `styles/designer.css`: 슬라이드 프롬프트 설계 탭.
- `styles/generator.css`: 슬라이드 분리기.
- `styles/image-generation.css`: API 이미지 생성.
- `styles/map-prompt.css`: 지도 이미지 탭.
- `styles/slide-document.css`: 부속 양식 탭.
- `styles/promotion-planner.css`: 홍보 이미지 기획.
- `styles/promotion.css`: 홍보용 이미지.
- `styles/theme.css`: 다크모드 및 테마 보정.

## 탭 구조 변경 규칙

탭 하나는 반드시 아래 요소가 함께 있어야 한다. 하나라도 빠지면 화면에서 탭이 사라지거나 퀵버튼이 잘못 표시된다.

1. `index.html`의 상단 탭 버튼  
   예: `id="tabBtnMapPrompt"`, `aria-controls="paneMapPrompt"`

2. `index.html`의 탭 pane  
   예: `id="paneMapPrompt"`, `role="tabpanel"`

3. 필요한 CSS 로딩  
   예: `<link rel="stylesheet" href="styles/map-prompt.css" />`

4. 필요한 JS 로딩  
   예: `<script src="src/map-prompt.js"></script>`

5. `src/tabs.js`의 `tabs` 등록  
   예: `mapPrompt: { button, pane, actions }`

6. `src/tabs.js`의 `actionSets` 등록  
   탭 오른쪽 퀵버튼에 표시할 핵심 액션을 지정한다.

현재 탭 id 매핑은 다음과 같다.

- `tabBtnDesigner` ↔ `paneDesigner`
- `tabBtnGenerator` ↔ `paneGenerator`
- `tabBtnSlideImage` ↔ `paneSlideImage`
- `tabBtnMapPrompt` ↔ `paneMapPrompt`
- `tabBtnSlideDocument` ↔ `paneSlideDocument`
- `tabBtnPromotionPlanner` ↔ `panePromotionPlanner`
- `tabBtnPromotion` ↔ `panePromotion`

## 퀵버튼/탭 바 레이아웃 규칙

- `#tabActions`는 헤더 안이 아니라 `.app-tabs-bar` 내부의 오른쪽에 둔다.
- 데스크톱에서는 `.app-tabs`가 왼쪽, `#tabActions`가 오른쪽에 같은 높이로 배치되어야 한다.
- 모바일에서는 상단 `#tabActions`를 숨기고, 기존 모바일 하단 액션바를 사용한다.
- 탭 영역에는 세로 스크롤바가 생기면 안 된다.
  - `.app-tabs-bar`: `overflow: hidden`
  - `.app-tabs`: `overflow-y: hidden`, `scrollbar-width: none`
  - `.app-tabs-bar .header-actions`: `overflow-y: hidden`, `scrollbar-width: none`

## 지도 이미지 탭 작업 규칙

- 지도 탭은 `src/map-prompt.js`, `styles/map-prompt.css`, `paneMapPrompt`, `tabBtnMapPrompt`가 한 세트다.
- 지도 프롬프트는 첨부 지도 이미지의 실제 지리 구조를 보존하는 것을 최우선으로 한다.
- `AI 위임` 선택지는 고정값을 전달하지 말고, 콘텐츠와 지도 맥락에 맞춰 최적안을 고르라는 가이드 문장으로 작성한다.
- 3D 효과는 과장된 게임맵/장난감 모형/허위 지형 표현이 되지 않도록 낮은 입체감과 지도 정확성 제약을 함께 둔다.
- 미리보기 SVG를 추가할 때는 외부 이미지 의존성을 만들지 않는다.

## 부속 양식 탭 작업 규칙

- 부속 양식 탭은 `src/slide-document.js`, `styles/slide-document.css`, `paneSlideDocument`, `tabBtnSlideDocument`가 한 세트다.
- 서브탭은 `문서 표지 생성`, `문서 간지 생성`, `문서 배경 생성` 세 가지가 유지되어야 한다.
- 상단 퀵버튼은 `slideDocCopyPromptBtn`, `slideDocSampleBtn`, `slideDocResetBtn`를 프록시한다.
- 표지/간지/배경 중 하나를 수정할 때는 공통 로직이 다른 두 유형에 영향을 주는지 확인한다.

## 파일 수정 방식

- 가능한 한 `apply_patch`로 부분 수정한다.
- `index.html` 같은 큰 파일을 Node/PowerShell 스크립트로 재작성해야 할 때는 반드시 `utf8` 인코딩을 명시하고, 작업 후 한글 깨짐을 검색한다.
- PowerShell의 기본 리다이렉션이나 `Set-Content`로 기존 큰 파일을 전체 재작성하지 않는다.
- 임시 수정 스크립트 파일을 만들지 않는다. 꼭 필요하면 일회성 명령으로 실행하고 파일을 남기지 않는다.
- `Select-Object -First`, `Select-Object -Skip`로 일부만 읽은 내용을 전체 파일처럼 다시 저장하지 않는다.

## 한글 깨짐 방지

수정 후 아래를 확인한다.

```powershell
Select-String -Path index.html -Encoding utf8 -Pattern "\?\?|�"
Select-String -Path src\*.js -Encoding utf8 -Pattern "\?\?|�"
Select-String -Path styles\*.css -Encoding utf8 -Pattern "\?\?|�"
```

의도된 `??`가 아닌 한글 깨짐은 반드시 수정한다.

## 검증 규칙

JavaScript를 수정했다면 최소한 해당 파일에 대해 문법 검사를 실행한다.

```powershell
node --check src\tabs.js
node --check src\map-prompt.js
node --check src\slide-document.js
node --check src\promotion.js
```

수정 범위에 맞춰 필요한 파일만 검사하되, 탭/공통 UI를 건드렸다면 아래도 실행한다.

```powershell
git diff --check -- index.html src styles
node scripts\smoke-test.mjs
```

`smoke-test`가 기존 다른 탭 문제로 실패하면, 실패 원인을 기록하고 수정한 탭에 대한 별도 브라우저 검증을 수행한다. 예를 들어:

- 지도 탭 버튼 표시
- 지도 pane 활성화
- 부속 양식 탭 버튼 표시
- 표지/간지/배경 서브탭 표시
- `#tabActions`가 `.app-tabs-bar` 아래에 있는지
- 탭 바에 세로 스크롤바가 없는지

## 브라우저 검증 기준

탭/레이아웃 수정 후에는 데스크톱과 모바일 폭을 모두 확인한다.

- 데스크톱: 탭 바 왼쪽에 탭, 오른쪽에 퀵버튼.
- 모바일: 탭은 깨지지 않고 표시, 상단 퀵버튼은 숨김, 하단 액션바 사용.
- 지도 이미지, 부속 양식처럼 최근 복구 이력이 있는 탭은 반드시 클릭 검증한다.

## Git 규칙

- 사용자가 커밋/푸시를 명시적으로 요청한 경우에만 스테이징, 커밋, 푸시한다.
- `.claude/`, `.codex-remote-attachments/`, `.playwright-mcp/`, `outputs/`, `node_modules/`는 커밋하지 않는다.
- 커밋 전 `git status --short`와 `git diff --stat`로 범위를 확인한다.
- GitHub Pages 반영이 필요한 경우 `main` 푸시 여부를 사용자 요청 또는 기존 흐름에 맞춰 판단하되, 충돌 없이 fast-forward 가능한지 확인한다.
- `git reset --hard`, `git checkout --`, `git clean` 같은 파괴적 명령은 사용자가 명확히 요청하지 않는 한 사용하지 않는다.

## UI/UX 원칙

- 이 앱은 작업 도구이므로 첫 화면과 각 탭은 바로 사용 가능한 인터페이스여야 한다.
- 장식보다 반복 사용성, 가독성, 빠른 복사/생성 흐름을 우선한다.
- 탭별 핵심 액션은 상단 퀵버튼에 연결한다.
- 버튼 텍스트는 짧고 명확하게 쓴다.
- 모바일에서 텍스트가 버튼 밖으로 넘치거나 탭이 사라지지 않게 한다.
- 카드 안에 카드를 과도하게 중첩하지 않는다.

