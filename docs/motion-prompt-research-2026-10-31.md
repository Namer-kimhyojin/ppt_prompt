# 모션 애니메이션 프롬프트 기능: 조사와 구현 근거

확인일: 2026-10-31. 적용 범위: 신규 `영상·모션 → 모션 애니메이션` 도구. 외부 API 호출 없이 브라우저에서 요청문을 구성한다.

## 공식 문서와 유사 서비스

| 확인한 자료 | 분석 | 반영한 기능 |
| --- | --- | --- |
| [Claude 공식 프롬프트 가이드](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | 목적, 자료, 예시, 출력 조건을 구분하고 성공 기준을 명시 | 제작 지침과 사용자 자료를 분리한 XML 요청문, 자산·검수 조건 |
| [OpenAI 공식 프롬프트 가이드](https://developers.openai.com/api/docs/guides/prompt-engineering) | 지침과 문맥의 경계를 명확히 하고 원하는 출력을 구체화 | GPT용 Markdown 구조, 코드/콘티별 산출물과 실행 방법 |
| [OpenAI 영상 프롬프트 참고](https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide) | 장면의 구도·동작·카메라·빛·시간을 구체화 | 장면별 시간, 화면, 동작, 자막, 음성을 분리. 해당 페이지는 보관 문서로 표시되어 모델명·해상도·API 길이 제한은 구현에 사용하지 않음 |
| [Runway 공식 영상 프롬프트 가이드](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide) | 간결한 움직임 묘사와 긍정형 표현, 참조 이미지의 역할 | 영상 AI용 장면별 출력, 생성 입력과 후편집 메모 구분 |
| [Jitter](https://jitter.video/templates/) | 시각형 템플릿 탐색, 텍스트·색상·애니메이션 편집 | 이미지 갤러리, 필터·검색, 선택 연출의 재생·일시정지 |
| [Animaker](https://www.animaker.com/templates) | 홍보·설명·교육·캐릭터 등 용도 중심 분류 | 6개 탐색 범주와 18개 영상 유형 |
| [Canva](https://www.canva.com/features/animation-maker/) | 텍스트·이미지 요소의 움직임을 조합하는 사용 흐름 | 연출·표현 재질·문구·자산을 따로 지정하는 제작 브리프 |

## GitHub 공개 프롬프트 분석과 보강

아래 원문은 읽기만 했으며 저장소나 스킬을 설치·실행하지 않았다. 프롬프트·코드·이미지를 복제하지 않고 적용할 원칙을 한국어로 새로 작성했다. 링크는 조사 시점 커밋으로 고정했다. 커뮤니티의 경험적 주장과 공식 문서의 규격을 구분했다.

| 실제 확인한 소스 | 분석 | 구현 반영 |
| --- | --- | --- |
| [Remotion 공식 생성기의 SYSTEM_PROMPT / FOLLOW_UP_SYSTEM_PROMPT](https://github.com/remotion-dev/template-prompt-to-motion-graphics-saas/blob/7aeb2d6be92e3152886aec4dea8be0007ca4c41d/src/app/api/generate/route.ts), 같은 저장소의 `src/skills/` | 유형별 지침을 조합하고, 색·문구·타이밍을 편집 가능하게 구성. 기존 소스의 작은 수정은 부분 변경으로 처리 | 유형에 필요한 제작 지침 선택, 편집 가능한 코드 설정, 별도 ‘수정 요청’ 출력. 템플릿 변경 시 사용자가 작성한 장면 유지 |
| [Remotion 공식 타이밍](https://github.com/remotion-dev/skills/blob/30d4553ecd46fbc5212fd0ff006ae43af522158b/skills/remotion-markup/timing.md), [전환](https://github.com/remotion-dev/skills/blob/30d4553ecd46fbc5212fd0ff006ae43af522158b/skills/remotion-markup/transitions.md) | 시간/프레임에서 시각 상태 계산. 겹침 전환은 장면 길이의 단순 합보다 결과가 짧아짐 | 재현 가능한 타임라인 지침, 전환 중첩 보정, 시작·전환 경계·마지막 프레임 점검 |
| [Mikefluff 영상 프롬프트](https://github.com/Mikefluff/skills/blob/50d1ae8ae2528cc3a79e946ccebdb7a61e7b2e3a/common/video-prompt-library/system-prompt.md) | 이미지 기반은 원본이 구도를 제공하므로 움직임을 중심으로 작성. 텍스트 기반은 구도와 동작 모두 필요 | t2v/i2v 선택, 장면별 참조 이미지 파일명, 이미지 기반 출력에서 원문·구도 재서술을 제외, 누락 자료 안내 |
| [RFTaurus 브라우저 모션 제작 프롬프트](https://github.com/RFTaurus/motion-skill/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/SKILL.md) | 영상 전체의 시각적 연결, 주제에 맞는 스타일, 같은 시간의 재현 가능성을 강조 | 장면 간 고정 요소 입력, 표현 재질 8종, 대상의 상태 변화로 정보 전달, 코드의 시간 기반 계산 |

공개 프롬프트에서 특정 서비스의 필터를 우회하려는 표현, 검증되지 않은 고정 API 파라미터, 보편적이지 않은 글자 수·영상 길이 제한, 모든 영상에 같은 효과를 강제하는 지침은 채택하지 않았다. Remotion 예제의 특정 폰트와 코드 출력만 허용하는 제약도 이 도구의 범용 제작 요청에는 적용하지 않았다.

## 제공 범위와 검증

- 18개 자체 SVG 샘플 이미지와 재생 가능한 움직임 예시. 외부 템플릿·이미지·네트워크에 의존하지 않음.
- Claude/GPT 대상, HTML·Remotion·기획서 산출물, 제작 요청/장면별 영상/스토리보드/수정 요청 출력.
- 장면 추가·삭제·정렬, 길이 비례 배분, 참조 이미지·자막·대사, 화면비·fps·카메라·음향·루프.
- 현재 출력 복사·UTF-8 TXT 저장, 로컬 자동 저장·복원, 초기화 되돌리기, 모바일 작업 화면 전환.
- 생성되는 것은 제작 프롬프트다. 샘플 재생은 입력 내용으로 렌더링한 완성 영상이 아니며 MP4 제작·검증은 별도 제작 도구에서 수행한다.
- 회귀 검증 명령: `npm run motion:test`, `node scripts/smoke-test.mjs`, 변경 JS의 `node --check`, `git diff --check -- index.html src styles`.

2026-10-31 검증 결과: 신규 모션 테스트, 전체 smoke test, 공개 접근 smoke test, 변경 JS 문법 검사, diff 공백 검사, UTF-8/BOM 검사가 모두 통과했다. 신규 테스트에서는 1440·1024·810·720·390·360px, 라이트·다크 테마, 모션 감소 설정을 확인했다. 홈페이지·전체 기능 안내에서 새 탭으로 이동하는 경로와 기존 지도·부속 양식의 하위 탭 전환도 확인했다. 실제 Claude/GPT 또는 영상 생성 서비스에서 결과 영상을 렌더링하는 검증은 수행 범위에 포함하지 않는다.
