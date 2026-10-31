(function (global) {
  "use strict";
  const revision = "f17136060781a0068a7951245a3aa7835a7230de";
  // Korean direction notes are written for PromptDeck, independent of the example films' plots.
  const groups = {
    documentary: ["편집·다큐", [
      "caption-news|자막 중심 뉴스|실제 자료와 큰 핵심 문구, 출처가 보이는 편집|정보의 우선순위에 맞춰 화면과 자막을 교차",
      "newsreel|빈티지 뉴스릴|흑백 기록 영상과 오래된 인쇄 자막|시대감을 주는 컷과 필름 질감으로 사실을 연결",
      "countdown|분할 화면 카운트다운|동시에 비교하는 화면과 시간의 긴장감|서로 다른 흐름이 하나의 결과로 수렴",
      "city-symphony|도시 타임랩스|시간에 따라 달라지는 도시와 생활의 리듬|반복과 속도 변화를 음악의 흐름에 맞춰 편집",
      "visual-investigation|시각적 탐사|기록·사진·지도와 검증 가능한 증거|질문을 따라 증거의 세부를 차례로 드러냄",
      "kino-montage|구성주의 몽타주|강한 대비, 사선, 절제된 색과 활자|충돌하는 크기와 방향으로 주장을 명료하게 연결",
      "telestrator|스포츠 전술 분석|실제 장면 위 동선·영역·핵심 지점 표시|정지·반복·선 그리기로 움직임의 원인을 설명",
      "news-package|방송 뉴스 패키지|헤드라인·정보 띠·자료 화면의 방송 문법|코너 전환과 정보 갱신을 일관된 체계로 구성",
    ]],
    evidence: ["자료·과학", [
      "satellite-briefing|위성 지도 브리핑|실제 지형과 시기별 공간 변화|정확한 위치 관계를 유지하며 범위와 근거를 확대",
      "briefing-board|공학 비교 보드|대안·구조·조건을 비교하는 한 장의 작업판|같은 기준에서 대안을 시험하고 차이를 드러냄",
      "lidar-survey|라이다 포인트클라우드|깊이와 구조가 드러나는 점군 표현|표면을 걷어 내며 숨은 공간을 단계적으로 탐색",
      "white-model|백색 모형 프로젝션|절제된 흰 모형 위에 얹는 정보와 빛|공간 구조는 유지하고 층별 의미를 투사",
      "data-physical|데이터 조형물|수치를 실제 크기·개수의 물체로 표현|일정한 단위의 물체가 쌓이며 변화와 비교를 전달",
      "teardown|제품 분해·조립|부품과 연결 구조가 보이는 제품 탐구|부품의 위치 관계를 유지하며 분해와 재결합",
      "microscope|현미경 탐험|전체에서 미세 구조로 이어지는 관찰|배율과 측정 기준을 제시하며 핵심 차이를 탐색",
      "archive-lighttable|아카이브 라이트테이블|원본 기록·필름·사진을 비추는 작업대|확대와 자료 대조로 의미와 맥락을 밝혀감",
    ]],
    painting: ["손그림·회화", [
      "crayon-book|크레용 그림책|종이 위 거친 크레용 자국과 따뜻한 형태|그림이 자라나고 작은 몸짓으로 감정을 전달",
      "watercolor|수채화|종이 결, 투명한 물감과 번지는 색의 층|붓질로 대상을 드러내며 부드럽게 다음 풍경으로 이동",
      "ink-wash|수묵화|여백과 먹의 농담, 절제된 붓의 흔적|붓의 속도와 농담 변화로 행동과 감정을 표현",
      "impasto|유화 임파스토|두꺼운 물감의 질감과 빛의 깊이|색의 축적과 물감의 변화로 장면을 이어감",
      "one-line|한 줄 드로잉|끊기지 않는 선과 넓은 여백|하나의 선이 형태와 의미를 바꾸며 이야기를 연결",
      "whiteboard|화이트보드 설명|간결한 손그림과 핵심 용어의 연결|개념을 그려 가며 이해의 순서를 설계",
      "urban-sketch|펜·수채 도시 스케치|건축적 펜선과 가벼운 채색|장소를 따라 시선을 이동시키며 색과 정보를 더함",
      "chalkboard|칠판 분필|검은 판 위 분필 선과 지워진 흔적|쓰고 지우며 질문·수정·발견을 자연스럽게 연결",
    ]],
    tradition: ["전통·종이 공예", [
      "shadow-puppet|그림자 인형극|빛을 통과한 평면 인형과 무대의 그림자|관절과 실루엣의 움직임으로 사건을 표현",
      "ukiyoe|목판화 풍경|평면적인 색면과 목판의 선, 겹친 풍경|판화의 층을 유지하며 풍경과 시점을 전환",
      "papercut-red|붉은 종이 오리기|오려 낸 종이의 빈 공간과 대칭 문양|종이의 펼침과 문양 변형으로 의미를 드러냄",
      "paper-lantern|종이 조각 라이트박스|겹겹이 쌓인 종이와 은은한 내부 조명|층 사이의 깊이와 빛의 변화를 따라 시선을 안내",
    ]],
    print: ["인쇄·판화", [
      "risograph|리소그래프|적은 수의 잉크, 망점과 미세한 어긋남|색판이 순차로 겹치며 장면이 완성",
      "halftone-dossier|하프톤 기록물|망점 사진, 종이 조각과 기록 문구|자료를 펼치고 대조하며 이야기의 단서를 연결",
      "woodcut|목판 조각|날카로운 조각선과 강한 명암|선과 면이 파이며 형상이 드러나는 리듬",
      "engraving|동판 인그레이빙|섬세한 해칭과 정밀한 도감 구도|선의 밀도를 쌓아 대상의 구조와 명암을 표현",
      "silkscreen-poster|실크스크린 포스터|큰 색면과 제한된 잉크의 인쇄감|색을 한 층씩 찍어 낸 뒤 화면 안의 공간을 탐색",
      "printed-long-take|판화 롱테이크|한결같은 판화 질감과 이어지는 풍경|화면을 끊기보다 공간을 이동하며 정보를 발견",
    ]],
    graphic: ["그래픽·타이포", [
      "swiss-motion|스위스 모션 그래픽|그리드, 큰 활자와 절제된 강조색|정렬·마스크·크기 대비가 정확한 리듬을 형성",
      "spy-titles|레트로 첩보 오프닝|실루엣과 기하 도형의 강한 대비|추적·가림·형태 전환으로 긴장과 호기심을 구성",
      "art-deco|아르데코|대칭 장식, 세련된 기하와 금속성 포인트|대칭적인 펼침과 단계적 리빌로 품격을 전달",
      "blueprint|블루프린트 설계도|청색 도면, 흰 기술선과 주석|중심선에서 구조·상세·치수 순으로 그려 나감",
      "stained-glass|스테인드글라스|색유리 조각과 경계선, 통과하는 빛|빛이 이동하면서 각 조각의 이야기가 활성화",
      "pictogram-motion|픽토그램 모션|일관된 규칙의 간결한 기호와 인체|형태의 변환과 동작의 연결로 의미를 명확히 전달",
      "ascii-crt|ASCII·CRT 터미널|문자로 구성된 화면과 레트로 모니터 질감|문자의 갱신과 스캔으로 정보와 장면이 변화",
    ]],
    information: ["정보·키노트", [
      "dataviz|데이터 스토리텔링|수치·축·출처가 분명한 데이터 화면|차트의 변화 자체가 질문과 결론을 이끌도록 설계",
      "iso-infographic|아이소메트릭 정보도|같은 투영 규칙의 공간과 작은 기능 요소|같은 세계 안에서 흐름과 원리를 따라 이동",
      "dark-keynote|다크 테크 키노트|여백이 큰 어두운 무대와 선명한 제품 포인트|핵심 기능과 상태 변화를 크게 보여 주며 집중",
      "living-screencast|살아 있는 사용 시연|실제 화면과 맥락에 맞는 작은 시각 안내|커서·클릭·응답이 연결되는 실제 사용 흐름",
      "hologram-hud|홀로그램 HUD|구조를 읽는 와이어프레임과 절제된 계측 정보|스캔·표적 고정·기능 표시로 대상을 해석",
      "transit-map|노선도 모션|연결망과 지점이 읽히는 간결한 선 지도|선이 뻗고 거점이 연결되며 관계와 성장을 표현",
      "isometric-picture-book|아이소메트릭 그림책|작은 공간 안의 인물과 행동을 보여 주는 입체 그림|같은 공간에서 행동과 결과를 비교하며 설명",
      "circuit-board|회로 기판|연결선과 부품, 흐르는 신호의 시각 언어|신호의 이동을 따라 공급·연결·작동 원리를 전달",
    ]],
    cartoon: ["카툰·애니메이션", [
      "rubber-hose|고전 흑백 카툰|유연한 팔다리와 흑백 손그림의 탄력|준비·멈춤·과장된 행동과 음악의 박자를 연결",
      "cel-anime-80s|레트로 셀 애니메이션|선명한 윤곽과 셀 채색, 층이 나뉜 배경|인물 연기와 배경 이동을 분리하며 감정을 쌓음",
      "scifi-toon|SF 시트콤 카툰|단순한 인물과 낯선 공간의 코믹한 대비|짧은 행동과 반응, 시각적 반전으로 구성",
      "midcentury-toon|미드센추리 플랫 카툰|평면적인 색과 단순화된 복고 캐릭터|제한된 동작과 명확한 포즈로 핵심을 설명",
    ]],
    game: ["게임·픽셀", [
      "pixel-rpg|16비트 픽셀 RPG|선명한 픽셀과 게임 화면의 작은 세계|이동·선택·상태 변화로 여정과 성취를 전달",
      "hd-2d|픽셀과 입체 조명의 조합|픽셀 인물과 깊이가 있는 배경·조명|층별 공간 이동과 조명 변화로 몰입감을 구성",
      "microgame|마이크로게임 릴레이|짧고 직관적인 과제와 명확한 피드백|과제·반응·결과가 연속되며 에너지를 축적",
      "game-show|게임쇼 그래픽|경쾌한 무대, 점수와 참여형 그래픽|박자와 단계적 보상으로 과정과 비교를 전달",
    ]],
    cinema: ["영화·시대감", [
      "silent-film|고전 무성영화|흑백 필름과 단순한 자막 카드|몸짓과 시선, 장면의 대비로 이야기를 전달",
      "backrooms|리미널 파운드푸티지|익숙하지만 낯선 공간과 기록 영상의 질감|제한된 시점과 미묘한 변화로 호기심을 유지",
    ]],
    material: ["재질·3D", [
      "brick-toy|블록 장난감 세계|작은 블록의 결합과 장난감 비례|분해·결합·쌓기로 과정과 아이디어를 표현",
      "paper-popup|팝업 북|종이의 접힘과 펼침, 겹친 입체 레이어|페이지 안의 공간이 펼쳐지며 다음 내용을 연결",
      "tilt-shift|틸트시프트 미니어처|작은 모형처럼 보이는 공간과 얕은 초점|규모감과 초점 이동으로 시선을 안내",
      "lowpoly-island|로우폴리 공간|낮은 면 수와 명확한 입체 형태|공간의 배치와 카메라 이동으로 관계를 설명",
      "glass-product|유리 제품 렌더|투명 재질·굴절·내부 구조와 절제된 조명|빛과 초점, 분해·결합으로 제품의 가치를 드러냄",
      "memphis-diorama|멤피스 디오라마|다채로운 기하와 작은 입체 무대|형태의 조합과 경쾌한 공간 변화로 메시지를 전달",
      "desktop-flythrough|책상 위 플라이스루|실물 소품과 여러 깊이의 작은 장면|물체 사이를 이어 이동하며 하나의 세계를 탐색",
    ]],
  };
  const categories = { all: "전체 스타일" };
  const styles = Object.entries(groups).flatMap(([category, [label, entries]]) => {
    categories[category] = label;
    return entries.map((entry) => {
      const [id, name, visual, motion] = entry.split("|");
      return Object.freeze({ id, name, category, visual, motion, preview: `assets/motion-style-previews/${id}.jpg`, referenceImage: `https://raw.githubusercontent.com/lemomo-ai/lemo-opuscar/${revision}/styleboard/img/${id}_0.jpg`, reference: `https://github.com/lemomo-ai/lemo-opuscar/blob/${revision}/styles/${id}/STYLE.md`, video: `https://github.com/lemomo-ai/lemo-opuscar/releases/download/films/${id}.mp4` });
    });
  });
  global.PromptDeckMotionStyles = Object.freeze({ revision, categories, styles, get: (id) => styles.find((style) => style.id === id) || null });
})(globalThis);
