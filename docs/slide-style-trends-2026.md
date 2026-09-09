# 2026 발표자료 스타일 확장

검토일: 2026-09-09. 공통 갤러리 204종을 확인하고 신규 시각 스타일 6종을 추가했다. 카탈로그 버전은 13, 전체 210종, 추천 33종이다. 이 문서는 로컬 구현 기록이며 배포 완료를 뜻하지 않는다.

## 선정 근거

[Canva 2026 Design Trends](https://www.canva.com/newsroom/news/design-trends-2026/)는 차분한 편집, 손으로 기록한 듯한 표현, 촉감, 레트로 컴퓨팅과 영화적인 서사를 제시한다. [Adobe 2026 Creative Trends](https://blog.adobe.com/en/publish/2026/01/08/how-creators-leveraging-adobe-2026-creative-trends)는 감각적인 재질과 사람·지역에 가까운 표현을 강조한다. 이는 각 회사가 제시한 디자인 전망이며, 아래 여섯 스타일의 명칭·배치·발표자료 용도는 PromptDeck의 자체 해석이다. 공식 PPTX 템플릿이나 시장점유율 순위가 아니다.

기존 카탈로그에는 미니멀·에디토리얼·시네마틱·글래스·리소그래프 등이 이미 있다. 새 스타일은 같은 명칭에 색상만 더하는 방식 대신 탐색 순서, 사진 관계, 정보 영역과 강조 방법을 구분했다.

| 새 스타일 | 반영한 흐름 | 기존 스타일과 구분되는 배치 | 적합한 발표 |
|---|---|---|---|
| 차분한 인덱스 에디토리얼 | Explorecore / Opt-Out Era | 좁은 세로 인덱스, 비대칭 사진과 근거 | 연구·정책·경영 브리핑 |
| 현장 메모 브리핑 | Notes App Chic / 인간적인 기록 | 맥락 사진과 세부 사진, 번호 관찰과 제한적 주석 | 현장 조사·인터뷰·회고 |
| 소프트 글래스 데이터 | Texture Check / 촉감 | 반투명 면 한 장에 수치와 차트를 결합 | 성과·서비스 지표 |
| 레트로 윈도 스토리 | Prompt Playground | 제목 막대가 있는 창으로 단계별 과정을 연결 | 제품 개발·교육 |
| 시네마틱 콘택트 시트 | Drama Club / 시각적 서사 | 대표 스틸과 보조 스틸로 장면 간 관계를 표현 | 공간·사업·브랜드 사례 |
| 대형 컬러 타이포 | Zinegeist / 대담한 타이포 | 대형 제목 색면과 차분한 근거 열 | 캠페인·비전 발표 |

앞의 세 가지를 추천 스타일에 포함했다. 사용 화면에서는 별도 연도 분류나 트렌드 바로가기를 두지 않고, 기존 카테고리에서 함께 선택한다. PPTX·공통 프롬프트·데이터 다이어그램 갤러리에 동일하게 적용한다.

| 기존 카테고리 | 포함한 스타일 |
|---|---|
| 보고·컨설팅 | 현장 메모 브리핑 |
| 편집·브랜딩 | 차분한 인덱스 에디토리얼, 시네마틱 콘택트 시트 |
| 스타트업·IT | 소프트 글래스 데이터, 레트로 윈도 스토리 |
| 크리에이티브 | 대형 컬러 타이포 |

스타일 ID·견본 이미지·제작 규칙은 유지한다. 소스 파일과 이미지 출처 기록의 연도 명칭은 내부 관리용이며 사용자 카테고리와는 무관하다.

## PPTX 적용 기준

- 글자·수치·캡션·창 프레임·구분선은 편집 가능한 요소로 작성한다.
- 사진과 복잡한 질감·굴절은 별도 이미지로 분리한다. 슬라이드 전체를 이미지 한 장으로 만들지 않는다.
- 차트는 제공된 원자료로 작성한다. 견본의 72% 등은 제작 내용에 포함하지 않는다.
- 현장 사진과 영화적인 장면은 실제 근거와 구별한다. 없는 현장·성과를 사실처럼 생성하지 않는다.
- 한글은 사용 가능한 한글 서체로 자연스럽게 줄바꿈한다. 영문 견본에 맞추려고 자폭을 압축하지 않는다.
- 모션이나 인터랙션 없이도 슬라이드 한 장에서 의미가 완결되게 한다.

## 파일과 견본

- 정의: `src/slide-style-presets/trend-2026.js`
- 이미지: `assets/slide-style-previews/<style-id>.jpg`
- 생성·검수·해시 기록: `assets/slide-style-previews/trend-2026-provenance.json`
- 모든 신규 견본은 built-in OpenAI imagegen으로 개별 생성했다. 원본 1672×941 PNG를 시각 검수한 뒤 기존 가져오기 도구로 960×540 JPEG로 정규화했다. 기존 204개 JPEG를 대체하지 않는다.
- 생성 원본은 `.codex/generated_images`에 보존하고 작업용 복사본은 `tmp/trend2026-preview-selected`에 보관한다.

## 견본 생성 프롬프트

공통 조건: 고해상도 단일 16:9 발표 슬라이드, 외부 기기·목업·소프트웨어 화면 제외, 또렷한 제목과 읽을 수 있는 근거, 스타일 이름·색상 코드·제작 메타데이터를 본문에 출력하지 않는다. 아래는 각 견본의 최종 생성 방향과 핵심 카피다. 카피는 견본용이며 사용자의 발표 원문으로 전달하지 않는다.

### calm-index-editorial

Calm Index Editorial. Ivory paper #F5F1E8, ink #242721, olive #526446. A narrow left vertical index with 01 / 02 / 03, a large editorial serif headline, an asymmetric lower evidence layout with one sunlit library photograph at right and one large statistic at left. Generous whitespace, subtle paper grain, clean sans-serif supporting copy. Headline: “Room to think.” Kicker: “RESEARCH OUTLOOK”. Statistic: “72%”. Caption: “Prefer a clearer path”. Index: “Observe”, “Connect”, “Act”. Subtitle: “Three observations. One direction.”

### field-notes-briefing

Field Notes Briefing. Warm ivory #F4F0E5, ink #27342F, rust #A74428, olive #58634D. A large original documentary workshop photo at left with a smaller detail photo below, three aligned numbered observations at right, limited hand-drawn emphasis, subtle paper edges. Professional body typography, no childish scrapbook. Headline: “What the field revealed”. Kicker: “FIELD OBSERVATIONS”. Observations: “01 Listen first”, “02 Make it tangible”, “03 Close the loop”. Callout: “3 signals. One next step.” Captions: “Context”, “Detail”.

### soft-glass-data

Soft Glass Data. Pale arctic blue #EDF3FA, azure #275AC5, navy #172C48. One broad softly frosted sheet with extremely shallow depth over a restrained refractive oval. Oversized 72% at left, three crisp vertical bars at right with Q1 / Q2 / Q3 and values 40 / 56 / 72. Data surface nearly opaque, blur confined to edges. Headline: “A clearer view of progress”. Kicker: “PERFORMANCE SNAPSHOT”. Caption: “Adoption rate”. Lower copy: “40% → 56% → 72%”. No holograms or stacked transparent cards.

### retro-window-story

Retro Window Story. Pale periwinkle #E7E8F5, cream #FFFCEF, ink #24263D, violet #5940B0 and mustard #DAAC36. Three squared window-like editorial frames stepped diagonally, minimal title bars and simple connecting geometry. Not a real operating-system screenshot. Headline: “From idea to working model”. Kicker: “BUILD LOG”. Window titles: “01 / Discover”, “02 / Prototype”, “03 / Validate”. Messages: “Find the signal”, “Make it useful”, “Test with people”. Modern sans-serif body, compact monospace title bars, no fake interactive controls.

### cinematic-contact-sheet

Cinematic Contact Sheet. Deep ink #171B24, offwhite #F4EEE3, amber #D8A55C. One large original filmic image of a community innovation venue at center-left, two smaller images at right showing collaboration and prototype work in the same context. Coherent warm daylight, restrained grain, no film sprocket frame. Headline: “One place. Many possibilities.” Kicker: “SPACE / PEOPLE / IMPACT”. Captions: “01 / The place”, “02 / The people”, “03 / The change”. Closing line: “A shared space becomes a shared future.”

### chromatic-type-story

Chromatic Type Story. Large condensed two-line headline occupying the left side, integrated with cobalt #2549C7 and yellow #F3D24B fields. Cream #FFF8E9 evidence rail at right with dark ink #222A38. Slight screenprint grain on empty fields and one rough underline, crisp type. Headline: “MAKE” / “IT MATTER”. Kicker: “IDEAS INTO ACTION”. Evidence: “72%”, “Engagement”, “Clear direction”, “Visible progress”, “Shared ownership”. No clipped letters, rotated body copy, rounded cards or fake UI.
