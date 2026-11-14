# 유튜브 반복 언급 기반 AI 업무 도구 초기 목록

- 조사·기록일: 2026-11-14
- 추가 결과: **스킬 4개 · 플러그인 4개 · MCP 5개, 총 13개**
- 추가 위치: [카탈로그 인덱스](../content/ai-tools/_catalog.json), 도구별 JSON, [기능 구성안](ai-work-tools-hub-plan-2026-11-14.md)
- 상태: 목록·데이터 작성 완료. 공개 화면 연결·배포·설치·실행 검증은 수행하지 않음.

## 조사 방법과 범위

사용자가 요청한 ‘자주 언급’을 이번 조사에서는 **서로 다른 채널 2개 이상에서 같은 도구를 명시적으로 소개한 경우**로 운영상 정의했다. 검색으로 발견한 후보를 대상으로 한 표본 조사이며, 유튜브 전체의 인기순위·시장점유율·실사용 성능 순위는 아니다. 후보별로 확인한 영상 수가 다르므로 단순 채널 수로 품질 순위를 매기지 않았다.

13개 중 12개는 같은 도구의 반복 언급 근거다. **PPTX 1개는 스킬 계열 수준의 보완 항목**으로, GitHub 참조 구현 소개 1채널과 Claude 내장 PowerPoint 스킬 소개 1채널을 구분해 기록했다. 참조 구현 자체가 두 채널에서 검증됐다는 뜻은 아니다.

근거는 유튜브 공개 제목·설명·챕터, 제작자가 공개한 전사이며 일부 채널·게시일은 미러 메타데이터로 보강했다. 전체 영상 시청이나 전체 자막 분석은 하지 않았다. 기능·제공 유형은 공식 제작자 문서로 대조했다. 공식 문서상의 지원 환경과 실제 실행 확인은 구분한다.

| 집계 항목 | 결과 |
| --- | ---: |
| 등록 도구 | 13개 |
| 같은 도구의 반복 언급 / 스킬 계열 보완 | 12개 / 1개 |
| 선정 도구에 연결한 고유 영상 | 25개 |
| 선정 근거의 서로 다른 채널 | 24개 |
| 도구–영상 연결 | 29건 |
| 우선 기간 내 게시일 확인 영상 | 22개 |
| 우선 기간 밖 보완 영상 | 2개 |
| 영상 게시일 미확인 | 1개 |
| 위 집계에서 제외한 보충 영상 | 1개 |

우선 기간은 2025-11-14~2026-11-14다. 한국어·영어 검색으로 시작했으며 선정 근거는 영어 중심이다. Obsidian에 폴란드어·일본어, Superpowers에 포르투갈어, Context7에 우크라이나어 보완 표본이 있다. 한국 유튜브 이용자 전체의 선호도를 뜻하지 않는다.

같은 영상이 여러 도구를 소개하면 각 도구에는 연결하고 전체 영상 수에서는 한 번만 센다. 제작사·제휴 영상은 표시했으며 서로 다른 채널이라는 사실이 상업적으로 독립된 검증이라는 뜻은 아니다. 조회수와 제목의 ‘10배’ 같은 홍보 표현은 선정 점수나 검증 결과로 사용하지 않았다.

## 분석 결과와 초기 배치

- **반복 업무를 규칙으로 정리하는 수요:** Skill Creator는 개별 결과물뿐 아니라 자신의 업무 절차를 재사용하는 방법으로 소개된다. 첫 설치 안내와 함께 좋은 입력·결과 기준을 작성하는 예제가 필요하다.
- **실제 산출물 중심의 수요:** PPTX는 발표자료 파일, Remotion은 영상, Obsidian은 업무 지식 정리로 목적이 구체적이다. 준비 파일과 예상 산출물을 카드 앞에 배치한다.
- **업무별 묶음의 수요:** Productivity와 Marketing은 여러 스킬·연결 구성을 업무별로 묶어 소개한다. 플러그인 설치와 외부 서비스 계정 연결을 별도 단계로 안내한다.
- **MCP는 연결 대상이 중요:** Notion은 업무 지식, Firecrawl은 웹 자료, Playwright는 브라우저, GitHub는 저장소, Context7은 개발 문서에 연결한다. ‘MCP를 설치한다’보다 어떤 자료에 접근하고 어떤 결과를 얻는지를 먼저 설명한다.
- **개발 특화 도구를 구분:** Superpowers·Claude-Mem·Context7·GitHub·Playwright는 개발·서비스 운영 업무에 더 적합한 후보로 표시한다. 일반 사무 입문에는 Productivity·Marketing·PPTX·Obsidian·Notion 등의 목적을 우선 보여준다. 이 배치는 편집 판단이며 성능 시험 결과는 아니다.

## 스킬 목록

| 도구·공식 출처 | 업무 결과 | 표본 채널 수 | 근거 영상 | 유의할 범위 |
| --- | --- | ---: | --- | --- |
| [Skill Creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator) | 반복하는 업무 절차를 재사용 가능한 스킬로 만들고 예제와 평가로 개선하기 | 2 | [V12](https://www.youtube.com/watch?v=KjEFy5wjFQg&t=725s) · [V09](https://www.youtube.com/watch?v=hSv7ZZ_5M7U) | 동명 커뮤니티 skill-creator와 Anthropic 구현을 구분한다. |
| [PPTX (Anthropic)](https://github.com/anthropics/skills/tree/main/skills/pptx) | 편집 가능한 PowerPoint 발표자료를 생성·수정하고 템플릿·발표자 메모를 다루기 | 2 | [V03](https://www.youtube.com/watch?v=F6JTJ9GeSOY) · [V02](https://www.youtube.com/watch?v=wO8EboopboU) | PPTX 스킬 계열의 소개 근거. 한 영상은 2025-11-06이며 내장 기능과 참조 구현의 동작 차이 확인 필요. |
| [Obsidian Skills](https://github.com/obsidianmd/obsidian-skills) | Obsidian 노트의 링크·속성·Bases·Canvas를 활용해 자료와 업무 지식을 정리하기 | 2 | [V14](https://www.youtube.com/watch?v=z-4t8MgIbCo) · [V10](https://www.youtube.com/watch?v=2pc9uCOe8aA) | Obsidian 앱 내부의 일반 커뮤니티 플러그인과 AI 에이전트용 스킬 묶음을 구분한다. |
| [Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills) | 영상 장면과 모션 그래픽을 코드로 만들고 미리보기·수정·영상 출력으로 연결하기 | 2 | [V05](https://www.youtube.com/watch?v=FVrNRnfC8oM&t=315s) · [V04](https://www.youtube.com/watch?v=7OR-L0AySn8&t=34s) | 영상에 등장하는 별도 음성 생성 스킬이나 ElevenLabs가 Remotion 스킬에 자동 포함된다고 안내하지 않는다. |

## 플러그인 목록

| 도구·공식 출처 | 업무 결과 | 표본 채널 수 | 근거 영상 | 유의할 범위 |
| --- | --- | ---: | --- | --- |
| [Anthropic Productivity](https://github.com/anthropics/knowledge-work-plugins/tree/main/productivity) | 업무 목록과 조직 용어·프로젝트 맥락을 정리하고 작업 대시보드로 관리하기 | 2 | [V06](https://www.youtube.com/watch?v=tTlfUgZOL_0&t=360s) · [V25](https://www.youtube.com/watch?v=oPz0ZYE_A5A) | 동일 2개 영상에 두 플러그인 모두 등장. 영상 1개의 게시일은 미확인. |
| [Anthropic Marketing](https://github.com/anthropics/knowledge-work-plugins/tree/main/marketing) | 홍보 콘텐츠 초안, 캠페인 계획, 브랜드 문체 점검과 성과 보고 준비하기 | 2 | [V06](https://www.youtube.com/watch?v=tTlfUgZOL_0&t=255s) · [V25](https://www.youtube.com/watch?v=oPz0ZYE_A5A&t=306s) | 동일 2개 영상에 두 플러그인 모두 등장. 영상 1개의 게시일은 미확인. |
| [Superpowers](https://github.com/obra/superpowers) | AI 개발 작업을 요구사항 정리·계획·구현·검토 순서로 진행하기 | 3 | [V13](https://www.youtube.com/watch?v=4XqVR6xI6Kw&t=594s) · [V16](https://www.youtube.com/watch?v=NQNi5dyDJFw&t=525s) · [V08](https://www.youtube.com/watch?v=hA_nD-nB3pY&t=318s) | 일반 문서업무보다 소프트웨어 개발에 적합하다. |
| [Claude-Mem](https://github.com/thedotmack/claude-mem) | AI 작업 세션의 진행 내용과 결정을 저장해 다음 작업에서 다시 찾기 | 2 | [V21](https://www.youtube.com/watch?v=LfkpNyTsi7o&t=70s) · [V23](https://www.youtube.com/watch?v=mg69qVeLOp0) | 저장 위치, 요약 모델, 동기화 여부와 기록 범위를 설치 안내에서 확인해야 한다. |

## MCP 목록

| 도구·공식 출처 | 업무 결과 | 표본 채널 수 | 근거 영상 | 유의할 범위 |
| --- | --- | ---: | --- | --- |
| [Notion MCP](https://developers.notion.com/guides/mcp/overview) | Notion의 업무 지식·문서·데이터베이스를 AI와 연결해 읽고 정리한다. | 2 | [V15](https://www.youtube.com/watch?v=pp-sYoaTH4E&t=12s) · [V18](https://www.youtube.com/watch?v=0sMpsbkCfRY&t=443s) | 공식 원격 Notion MCP를 대상으로 한다. 이름이 같은 커뮤니티 로컬 서버의 과거 영상을 근거로 합산하지 않는다. |
| [Firecrawl MCP](https://docs.firecrawl.dev/mcp-server) | 웹 자료를 검색하고 페이지 내용을 Markdown이나 구조화 자료로 정리한다. | 2 | [V07](https://www.youtube.com/watch?v=4efAzBiTeVo&t=131s) · [V19](https://www.youtube.com/watch?v=aovuyqN2QPE) | 2개 중 제작사 영상 1개, 다른 영상은 제휴 링크 포함. |
| [Playwright MCP](https://playwright.dev/docs/getting-started-mcp) | 브라우저에서 업무 흐름을 확인하고 반복 조작·웹 테스트를 자동화한다. | 3 | [V20](https://www.youtube.com/watch?v=e-ynk72_Z3c&t=1278s) · [V11](https://www.youtube.com/watch?v=h3lPYb6SfQM&t=201s) · [V22](https://www.youtube.com/watch?v=uiPSA1htycs) | Playwright CLI·Playwright Test와 구분한 MCP 서버 항목이다. |
| [Context7 MCP](https://context7.com/docs/installation) | 개발 도구가 라이브러리의 현재 문서를 참고하도록 연결한다. | 3 | [V22](https://www.youtube.com/watch?v=uiPSA1htycs) · [V17](https://www.youtube.com/watch?v=egFcVjP_oDQ) · [V01](https://www.youtube.com/watch?v=323l56VqJQw) | 최근 기간 2채널 + 2025년 보조 1채널. 개발 문서 전용 성격. |
| [GitHub MCP Server](https://github.com/github/github-mcp-server) | 저장소·이슈·PR 자료를 AI 작업에 연결해 개발 현황 확인과 협업 작업을 돕는다. | 2 | [V22](https://www.youtube.com/watch?v=uiPSA1htycs) · [V24](https://www.youtube.com/watch?v=84-sHkG4AQU&t=135s) | Git MCP, GitHub CLI, GitHub Copilot 자체를 이 항목과 같은 제품으로 계산하지 않는다. |

## 목록에 저장한 안내 정보

각 레코드는 업무 결과, 대상 사용자, 공식 출처, 문서상 지원 환경, 비용 조건, 포함 기능, 제약, 첫 요청문 예시, 영상 근거와 확인일을 포함한다. 모든 항목은 `reviewStatus: source-reviewed`, `verifiedAt: null`, `publicationStatus: draft`다. 첫 요청문은 카탈로그용 편집 예시이며 실행한 결과가 아니다.

플러그인이 스킬과 MCP를 포함하는 경우 포함 목록에 적었다. Obsidian처럼 여러 배포 방식이 있는 프로젝트는 대표 카드 하나로 관리한다. PPTX를 담는 document-skills처럼 이번 카탈로그에 별도 등록하지 않은 관련 묶음은 관계 정보로만 남겼다.

## 날짜·근거 수준의 예외

- PPTX의 Kevin Stratvert 채널 영상은 2025-11-06으로 우선 기간보다 8일 오래됐다. 최근 12개월의 두 채널 근거로 표시하지 않는다.
- Context7의 AI LABS 영상은 2025-04-24다. 최근 기간 내 다른 두 채널 근거를 확보했으며 오래된 영상은 보조 자료다.
- Trust Insights 영상은 유튜브 게시일 미확인이다. 제작자 전사 게시글의 2026-02-06은 별도 필드로 기록했고 영상 게시일로 대체하지 않았다. 전사가 AI 생성임도 기록했다.
- Obsidian의 일본어 영상 채널명·게시일은 Glasp 메타데이터로 보강했다. 한국어 Remotion 영상은 게시일 미확인·채널 보강 단계라 주 근거 집계에서 제외했다.
- Firecrawl은 제작사와 제휴 영상이 포함된다. 소개 빈도가 중립적 품질평가라는 뜻은 아니다.

## 보류한 후보

- **Google Workspace MCP / Filesystem MCP:** 이번 조사에서는 개별 구현체를 특정하는 서로 다른 채널 2개 이상의 근거 확보를 완료하지 못했다. 일반 Google Workspace CLI·앱 소개를 MCP 반복 언급으로 세지 않았다.
- **구형 커뮤니티 Notion MCP 소개 영상:** 공식 원격 Notion MCP와 같은 구현체인지 확인하기 어려운 2025년 영상은 본 목록의 반복 언급 수에서 제외했다.
- **careerhackeralex/visualize:** 한국어 제작자 설치 영상 1개를 전달받았으나 이번 담당 조사에서 별도 채널 2개와 공식 배포 내용을 교차 확인하지 못해 반복 언급 채택 목록에서 제외했다.
- **Anthropic Sales / Data:** Cowork 일반 소개에서 이름이 등장하더라도 본 조사에서는 해당 개별 플러그인의 구체적 소개 2건을 별도로 확보하지 않았다. 수량을 늘리기 위해 일괄 채택하지 않았다.
- **XLSX / DOCX / PDF (Anthropic):** 공식 배포처와 Mark Kashef 영상은 확인했으나 각 개별 스킬을 명시하는 두 번째 독립 YouTube 원문 근거를 이번 표본에서 충분히 확보하지 못해 반복 언급 목록 확정은 보류한다.
- **Talal Awad의 Excel·PowerPoint 소개 영상:** 미러에 설명과 챕터는 있으나 원문 열기가 throttled였다. 보완 후보로만 남기며 위 반복 언급 수에는 포함하지 않았다.

기존 자체 스킬 ppt-slide-planner는 기존 안내를 보존한다. 이번 조사에서 반복 언급 근거를 확보한 항목처럼 수치에 포함하지 않았다.

## 근거 영상 목록

- **V01** [Context7 MCP Tutorial: Get Instant RAG for Your AI Coders](https://www.youtube.com/watch?v=323l56VqJQw) — AI LABS; 2025-04-24; `youtube_description`.
- **V02** [Claude Skills Explained - Step-by-Step Tutorial for Beginners](https://www.youtube.com/watch?v=wO8EboopboU) — Kevin Stratvert; 2025-11-06; `youtube_indexed_description_with_creator_page`; [보완 출처](https://kevinstratvert.com/2025/11/06/claude-skills-explained-step-by-step-tutorial-for-beginners/).
- **V03** [Claude Code's Document Skills Are an UNFAIR ADVANTAGE](https://www.youtube.com/watch?v=F6JTJ9GeSOY) — Mark Kashef; 2025-12-04; `youtube_indexed_description`.
- **V04** [How people are generating videos with Claude Code (Remotion Skill)](https://www.youtube.com/watch?v=7OR-L0AySn8) — Leonardo Grigorio | Build & Ship with AI; 2026-01-22; `youtube_indexed_description_and_chapter`.
- **V05** [This Claude Skill Just Changed EVERYTHING (Remotion)](https://www.youtube.com/watch?v=FVrNRnfC8oM) — Brock Mesarich | AI for Non Techies; 2026-01-25; `youtube_indexed_description_and_chapter`.
- **V06** [Plugins Are Here for Claude Cowork (Full Walkthrough)](https://www.youtube.com/watch?v=tTlfUgZOL_0) — Alex McFarland; 2026-02-03; `youtube_description_and_chapters`.
- **V07** [Turn Any Website Into LLM Ready Data INSTANTLY](https://www.youtube.com/watch?v=4efAzBiTeVo) — Nate Herk | AI Automation; 2026-02-11; `youtube_description_and_chapters`.
- **V08** [Superpowers: The Plugin that Turns Claude Code into a MACHINE (see how)](https://www.youtube.com/watch?v=hA_nD-nB3pY) — Matheus Battisti - Hora de Codar; 2026-03-12; `youtube_description_and_chapters`.
- **V09** [The Only Claude Skill You Need (skill-creator)](https://www.youtube.com/watch?v=hSv7ZZ_5M7U) — Dan Schwab; 2026-03-20; `youtube_indexed_title_and_description`.
- **V10** [The Official Obsidian AI Plugin (obsidian-skills) Is a Game Changer! A Guide to Installation and ...](https://www.youtube.com/watch?v=2pc9uCOe8aA) — NAOYA IMURA / Claude Cowork × Obsidian 実践; 2026-03-30; `youtube_indexed_description_with_transcript_mirror_metadata`; [보완 출처](https://glasp.co/youtube/2pc9uCOe8aA).
- **V11** [Playwright MCP + Copilot: AI Driven Test Automation](https://www.youtube.com/watch?v=h3lPYb6SfQM) — Testing Funda by Zeeshan Asghar; 2026-03-30; `youtube_description_and_chapters`.
- **V12** [Top 10 Claude Code Skills, Plugins & CLIs (April 2026)](https://www.youtube.com/watch?v=KjEFy5wjFQg) — Chase AI; 2026-04-09; `youtube_indexed_description_and_chapter`; [보완 출처](https://chaseai.io/blog/top-10-claude-code-skills-plugins-clis-april-2026).
- **V13** [This One Plugin Just 10x’d Claude Code](https://www.youtube.com/watch?v=4XqVR6xI6Kw) — Nate Herk | AI Automation; 2026-04-12; `youtube_description_and_chapters`.
- **V14** [Top 10 Skills, Plugins, and CLIs at Claude Code (April 2026)](https://www.youtube.com/watch?v=z-4t8MgIbCo) — Robert Szewczyk; 2026-04-16; `youtube_indexed_description`.
- **V15** [Claude MCP Tutorial: Notion in 90 Seconds](https://www.youtube.com/watch?v=pp-sYoaTH4E) — Darby Rollins | Gen AI University; 2026-04-26; `youtube_description_and_chapters`.
- **V16** [This Plugin Makes Your Claude Code 10X Better (Superpowers)](https://www.youtube.com/watch?v=NQNi5dyDJFw) — Filip Gabriel; 2026-05-04; `youtube_description_and_chapters`.
- **V17** [Context7: (не)секретний буст для Cursor, Claude Code і Codex](https://www.youtube.com/watch?v=egFcVjP_oDQ) — Відчайдушний програміст; 2026-05-15; `youtube_description`.
- **V18** [How to Give Claude Access to Your Notion workspace (MCP Setup)](https://www.youtube.com/watch?v=0sMpsbkCfRY) — Chris Punt; 2026-05-21; `youtube_description_and_chapters`.
- **V19** [Firecrawl MCP Server: Search Scrape And Crawl The Web](https://www.youtube.com/watch?v=aovuyqN2QPE) — Firecrawl; 2026-06-23; `youtube_description`.
- **V20** [Playwright MCP Tutorial 2026 | AI Browser Automation with Codex, Claude Code & VS Code](https://www.youtube.com/watch?v=e-ynk72_Z3c) — Mitchell Agoma; 2026-07-18; `youtube_description_and_chapters`.
- **V21** [How To Give Claude Persistent Memory [Claude-mem]](https://www.youtube.com/watch?v=LfkpNyTsi7o) — WebSensePro; 2026-08-17; `youtube_description_and_chapters`.
- **V22** [The Best MCP Servers for AI Coding Agents](https://www.youtube.com/watch?v=uiPSA1htycs) — Program With Erik; 2026-09-01; `youtube_description`.
- **V23** [Claude-MEM | Tutorial Guide 2026](https://www.youtube.com/watch?v=mg69qVeLOp0) — Next Gen AI; 2026-09-04; `youtube_title_and_description`.
- **V24** [Top 7 AI Agent Tools That Actually Work](https://www.youtube.com/watch?v=84-sHkG4AQU) — Tech With Tim; 2026-09-17; `youtube_description_and_chapters`.
- **V25** [So What? What Plug-ins are Available for Claude Cowork](https://www.youtube.com/watch?v=oPz0ZYE_A5A) — Trust Insights; 영상 게시일 미확인; `publisher_transcript_and_youtube_oembed`; [보완 출처](https://www.trustinsights.ai/blog/2026/02/so-what-plug-ins-for-claude-cowork/).

## 원본 조사 파일과 다음 확인

- [스킬 조사 원본](research/youtube-skills-2026-11-14.json)
- [플러그인 조사 원본](research/youtube-plugins-2026-11-14.json)
- [MCP 조사 원본](research/youtube-mcp-2026-11-14.json)
- [통합 카탈로그 읽기 안내](../content/ai-tools/README.md)

공개 페이지에 연결할 때에는 이 근거를 표시하고 대상 환경별 설치·연결과 대표 업무를 확인한 후 실제 사용 확인일을 기록한다. 이번 작업에서 확인하지 않은 설치 성공·연결 성공·성과 수치를 표시하지 않는다.
