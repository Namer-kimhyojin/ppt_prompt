(function (global) {
  "use strict";
  // Original SVG illustrations: no third-party template images or remote dependencies.
  const categories = { all: "전체", brand: "브랜드·홍보", explain: "설명·데이터", product: "제품·서비스", story: "스토리·실사", mood: "배경·음악" };
  const templates = [
    { id: "kinetic", name: "키네틱 타이포", category: "brand", tag: "텍스트 중심", art: "type", colors: ["#161629", "#d4fa58", "#a7a0ff"], sample: "말보다 빠르게, 움직임으로", description: "큰 글자의 순차 등장과 리듬감 있는 정렬. 캠페인·핵심 메시지에 적합합니다.", direction: "문장을 의미 단위로 나누어 마스크 리빌하고 핵심 단어만 스케일 업. 읽기 시간이 확보된 뒤 다음 문장으로 전환.", beats: ["한 문장으로 시선 잡기", "핵심 단어를 순차 강조", "메시지와 행동 안내 고정"] },
    { id: "logo", name: "로고 리빌", category: "brand", tag: "인트로·아웃트로", art: "logo", colors: ["#101b35", "#79e2fa", "#b5a2ff"], sample: "새로운 연결의 시작", description: "선과 도형이 모여 로고가 되는 짧은 오프닝. 브랜드 형상을 정확히 보존합니다.", direction: "얇은 선의 드로잉에서 기하 도형을 조립해 제공된 로고로 수렴. 마지막 로고를 선명하게 유지.", beats: ["빛과 선으로 시작", "도형이 모여 로고 완성", "로고와 슬로건 정지"] },
    { id: "event", name: "행사·모집 안내", category: "brand", tag: "신청·참여 유도", art: "event", colors: ["#3127a0", "#ffce67", "#c7baff"], sample: "오늘의 만남, 내일의 기회", description: "행사명·일시·대상·신청 안내를 차례로 보여주는 홍보 영상.", direction: "행사명을 먼저 리빌하고 정보 카드를 순차 진입. 실제 일정과 접수 방법은 원문을 그대로 사용하며 마지막 CTA는 충분히 유지.", beats: ["행사명과 참여 혜택", "대상·일시·장소 안내", "신청 방법과 마감 안내"] },
    { id: "social", name: "세로 숏폼 광고", category: "brand", tag: "9:16 추천", art: "social", colors: ["#ffede2", "#c13d24", "#fd9d4b"], sample: "당신의 다음 선택", description: "첫 장면의 질문부터 장점과 CTA까지 빠르게 연결하는 릴스·쇼츠.", direction: "첫 화면에 짧은 훅, 중간에는 한 번에 하나의 장점. 플랫폼 UI가 겹치는 상하단을 피하고 CTA로 마무리.", ratio: "9:16", beats: ["질문으로 관심 끌기", "핵심 장점 한 가지 시연", "짧고 분명한 행동 요청"] },
    { id: "explainer", name: "2D 서비스 설명", category: "explain", tag: "문제 → 해결", art: "explain", colors: ["#e9f4ff", "#285ce4", "#ffbf58"], sample: "복잡한 일을, 간단하게", description: "아이콘과 연결선으로 문제·해결 과정·효과를 설명합니다.", direction: "평면 벡터 아이콘과 연결선을 사용. 문제에서 해결로 이동할 때 같은 오브젝트를 유지하고 한 화면에 한 단계씩 설명.", beats: ["사용자의 문제 제시", "서비스가 해결하는 과정", "변화와 다음 행동"] },
    { id: "data", name: "데이터 인포그래픽", category: "explain", tag: "성과·추이", art: "chart", colors: ["#0d2831", "#65e3bb", "#ffce6c"], sample: "숫자로 보는 변화", description: "차트와 숫자가 차례로 나타나는 성과·통계 영상. 근거와 단위를 함께 표시합니다.", direction: "축과 단위를 먼저 고정하고 실제 값에 비례해 막대와 선을 드로잉. 기준 시점·출처를 표시하고 제공되지 않은 수치는 만들지 않음.", beats: ["지표와 비교 기준 소개", "실제 데이터의 변화 표시", "수치가 의미하는 결론"] },
    { id: "whiteboard", name: "화이트보드 드로잉", category: "explain", tag: "과정·개념 설명", art: "whiteboard", colors: ["#fffdf2", "#26384d", "#efa83b"], sample: "아이디어가 이해가 되는 순간", description: "선이 그려지며 개념이 연결되는 강의·업무 절차 설명.", direction: "선의 시작과 끝을 연결해 단계적으로 드로잉하고 핵심 용어에 색을 추가. 그림이 완성된 다음 설명을 전환.", beats: ["질문과 핵심 개념 쓰기", "단계별 그림과 연결선", "한 장의 개념도로 정리"] },
    { id: "education", name: "교육·안전 안내", category: "explain", tag: "순서·실천", art: "steps", colors: ["#f0f5ff", "#2853a8", "#69baa8"], sample: "세 단계로 시작하세요", description: "학습 목표와 행동 순서를 명확히 전달하는 교육·온보딩 영상.", direction: "단계 번호를 고정하고 실제 행동을 하나씩 시연. 주의사항은 화면 문구와 음성에서 동일하게 전달하고 마지막에 실천 요약.", beats: ["목표와 준비사항", "순서대로 행동 시연", "핵심 수칙과 확인"] },
    { id: "map", name: "지도·경로 모션", category: "explain", tag: "위치·동선", art: "map", colors: ["#e7f0e8", "#275a43", "#e9944a"], sample: "공간과 공간을 잇다", description: "지도 위에 위치·경로·거점을 순서대로 표시하는 입지·방문 안내.", direction: "첨부 지도의 해안선·도로·위치 관계를 보존하고 지도 위에 선과 핀만 애니메이션. 실측하지 않은 거리·이동시간은 추정하지 않음.", beats: ["전체 위치와 기준점", "이동 경로 순차 표시", "목적지와 방문 정보"] },
    { id: "product", name: "3D 제품 쇼케이스", category: "product", tag: "제품·디테일", art: "product", colors: ["#191c28", "#c0bcff", "#70d9dc"], sample: "디테일에 집중하다", description: "제품의 형태와 재질을 보여주는 조명·회전 중심의 쇼케이스.", direction: "단순한 스튜디오 배경, 부드러운 측면광과 한 번의 느린 회전. 제품 비율·로고·재질을 유지하고 제공된 특징만 표시.", beats: ["제품 전체 실루엣", "핵심 디테일 클로즈업", "제품명과 핵심 가치"] },
    { id: "ui", name: "앱·웹 사용 시연", category: "product", tag: "UI·온보딩", art: "ui", colors: ["#e7ecff", "#4555d9", "#99d6f8"], sample: "한 번의 클릭으로", description: "실제 화면과 클릭 흐름으로 서비스 사용법을 보여줍니다.", direction: "첨부된 UI의 라벨과 배치를 유지. 커서 이동 → 클릭 → 실제 상태 변화 순서로 시연하고 기능을 임의로 추가하지 않음.", beats: ["시작 화면과 할 일", "클릭과 상태 변화", "완료 결과 확인"] },
    { id: "launch", name: "신제품·기능 런칭", category: "product", tag: "기능 카드", art: "cards", colors: ["#121f32", "#9df0d2", "#9aabff"], sample: "작은 변화, 새로운 가능성", description: "메인 비주얼과 기능 카드를 조합한 서비스·제품 발표 영상.", direction: "제품 비주얼을 중심으로 세부 기능 카드가 순차 정렬. 시선 이동을 최소화하고 실제 기능과 이용 방법을 연결.", beats: ["새로운 가치 소개", "핵심 기능의 실제 활용", "이용 방법과 출시 정보"] },
    { id: "character", name: "캐릭터 스토리", category: "story", tag: "2D·마스코트", art: "character", colors: ["#f8e8cf", "#bc612a", "#668d67"], sample: "작은 도전의 시작", description: "캐릭터의 행동과 감정 변화로 메시지를 전하는 짧은 이야기.", direction: "인물의 실루엣·의상·색을 장면 전체에서 고정. 한 장면당 한 행동과 명료한 표정 변화를 사용하고 대사는 짧게 배치.", beats: ["캐릭터의 목표와 상황", "한 가지 도전과 행동", "변화와 감정의 마무리"] },
    { id: "cinematic", name: "시네마틱 브랜드 필름", category: "story", tag: "실사·무드", art: "cinema", colors: ["#162c38", "#f7c17e", "#75b8bc"], sample: "빛이 머무는 시간", description: "공간·빛·카메라의 절제된 움직임으로 분위기를 전달합니다.", direction: "전경·중경·배경을 분리하고 한 샷에 한 카메라 이동만 사용. 조명 방향·시간대·피사체 외형을 장면 사이에서 일관되게 유지.", beats: ["공간과 분위기 설정", "대상의 한 가지 행동", "잔상과 브랜드 메시지"] },
    { id: "photo", name: "사진 패럴랙스", category: "story", tag: "사진 → 영상", art: "photo", colors: ["#e4e0f7", "#5c46a8", "#e8ad93"], sample: "한 장의 기억에 깊이를", description: "정지 사진에 낮은 깊이감과 느린 이동을 더하는 기록·소개 영상.", direction: "참조 사진의 인물과 구도를 보존. 전경과 배경을 낮은 강도로 이동하고 가려진 부분을 과하게 생성하지 않음.", beats: ["원본 사진 전체 소개", "주요 영역으로 느린 이동", "사진과 설명을 함께 유지"] },
    { id: "interview", name: "인터뷰·인용 하이라이트", category: "story", tag: "자막·이름표", art: "interview", colors: ["#222b46", "#f5cb82", "#afc6e5"], sample: "현장의 목소리를 전합니다", description: "실제 발언과 영상 위에 이름표·인용 자막을 배치합니다.", direction: "원본 인터뷰를 중심으로 이름표와 핵심 인용문을 순차 표시. 실제 발언을 왜곡하지 않으며 제공되지 않은 대사나 입 모양을 만들지 않음.", beats: ["인물·소속·주제 소개", "실제 발언 핵심 인용", "발언 요지와 후속 정보"] },
    { id: "loop", name: "앰비언트 반복 배경", category: "mood", tag: "무음·루프", art: "loop", colors: ["#14192f", "#aba5fc", "#59cec5"], sample: "흐름이 머무는 배경", description: "행사장·디지털 사이니지에 사용할 자연스럽게 이어지는 배경.", direction: "느린 파동과 제한된 입자 흐름. 처음과 끝의 위치·속도·밝기를 맞춰 연결하고 중앙에는 콘텐츠를 위한 여백 확보.", beats: ["기본 구도와 흐름", "주기적인 빛과 파동", "시작 상태로 자연스럽게 연결"] },
    { id: "music", name: "음악·비트 비주얼라이저", category: "mood", tag: "리듬·타이틀", art: "music", colors: ["#251532", "#ffaddc", "#ffba70"], sample: "소리를 그리는 움직임", description: "리듬에 맞춘 바·파형·타이틀로 음악 티저와 공연 화면을 구성합니다.", direction: "입력 오디오가 있으면 실제 분석 값에 동기화. 없으면 지정 BPM의 가이드 리듬으로 명시. 과도한 점멸 없이 타이틀 가독성 유지.", beats: ["타이틀과 리듬 도입", "파형과 비트의 변화", "여운을 남기며 마무리"] },
  ];
  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sampleNotice = "연습용 가상 데이터입니다. 기관·제품·행사·수치는 예시이며 실제 홍보 전에 확정 자료로 교체하세요.";
  const samples = [
    {
      id: "startup", name: "사업 모집", templates: ["event", "explainer", "kinetic"], styles: ["swiss-motion", "pictogram-motion", "paper-popup"],
      brief: { title: "새봄 스타트업 성장 프로그램 모집", audience: "창업 3년 이내의 예비·초기 창업팀", goal: "지원 혜택을 이해하고 프로그램 신청하기", ratio: "16:9", duration: 30, audio: "narration",
        source: "프로그램: 새봄 스타트업 성장 프로그램\n모집: 20팀 / 접수: 11월 1일~15일\n지원: 시제품 제작비 최대 500만 원, 전문가 멘토링, 시장 검증 워크숍\n신청: 예시 신청 페이지에서 사업 소개서 제출\n핵심 메시지: 아이디어를 실제 고객과 만날 기회로 연결합니다.",
        assets: "미첨부 예시 자료: 프로그램 로고, 시제품 사진, 신청 페이지 캡처", requirements: "신청 대상·지원 항목·접수 기간을 읽기 쉽게 제안하고 확정되지 않은 웹 주소는 만들지 않기" },
    },
    {
      id: "product", name: "제품 소개", templates: ["product", "launch", "social"], styles: ["glass-product", "teardown", "memphis-diorama"],
      brief: { title: "리프컵, 다시 쓰는 일상", audience: "다회용 컵에 관심 있는 직장인·대학생", goal: "제품의 사용 편의성을 이해하고 상세 소개 확인하기", ratio: "9:16", duration: 15, audio: "music",
        source: "가상 제품: 리프컵 다회용 컵\n용량: 500mL / 무게: 240g / 예시 가격: 23,000원\n특징: 분리 세척 가능한 뚜껑, 교체형 패킹, 휴대용 스트랩\n제공 색상: 크림·숲색·차콜\n핵심 메시지: 매일 챙기기 편하고 오래 사용하는 나만의 컵",
        assets: "미첨부 예시 자료: 제품 정면·측면·분해 사진, 브랜드 로고", requirements: "제품 사진이 없으면 필요한 촬영 구도를 제안하고 확인되지 않은 보온·보냉 성능은 추가하지 않기", continuity: "동일한 컵의 비율·뚜껑 구조·색상 유지" },
    },
    {
      id: "learning", name: "교육 안내", templates: ["education", "whiteboard", "explainer"], styles: ["whiteboard", "chalkboard", "crayon-book"],
      brief: { title: "처음 시작하는 데이터 읽기", audience: "표와 차트를 업무에 활용하려는 입문자", goal: "교육 내용을 이해하고 수강 신청하기", ratio: "16:9", duration: 60, audio: "narration",
        source: "교육: 처음 시작하는 데이터 읽기\n과정: 표 읽기, 비율 이해, 차트 선택, 한 장 보고서 작성\n운영: 4주 과정, 주 1회 2시간 / 정원: 20명\n준비물: 노트북과 간단한 연습 데이터\n핵심 메시지: 어려운 수식보다 데이터를 읽고 설명하는 방법부터 배웁니다.",
        assets: "미첨부 예시 자료: 실습용 표, 차트 전후 비교 화면, 교육 안내 로고", requirements: "전문 용어를 풀어 설명하고 초보자가 기대할 학습 결과를 구체화하기" },
    },
    {
      id: "festival", name: "축제 홍보", templates: ["event", "photo", "social"], styles: ["risograph", "paper-lantern", "urban-sketch"],
      brief: { title: "달빛 골목 페스티벌", audience: "주말에 가까운 문화 행사를 찾는 가족·친구", goal: "행사의 분위기를 느끼고 방문 일정 정하기", ratio: "9:16", duration: 30, audio: "music",
        source: "가상 행사: 달빛 골목 페스티벌\n일시: 10월 두 번째 토요일 18:00~21:00\n장소: 가상 공간인 달빛문화거리\n내용: 골목 공연 3팀, 공예 마켓 12개 부스, 야간 포토존\n입장: 무료 / 일부 체험은 현장 접수\n핵심 메시지: 익숙한 골목에서 만나는 작은 축제",
        assets: "미첨부 예시 자료: 거리 사진, 공연·공예 이미지, 행사 워드마크", requirements: "실제 장소의 사진이나 지도처럼 단정하지 말고 행사명·시간·입장 정보를 명료하게 전달하기" },
    },
    {
      id: "impact", name: "데이터 성과", templates: ["data", "explainer", "kinetic"], styles: ["dataviz", "data-physical", "iso-infographic"],
      brief: { title: "우리 동네 자원순환 100일", audience: "지역 활동에 참여하는 주민과 운영 담당자", goal: "활동의 변화를 이해하고 다음 캠페인에 참여하기", ratio: "16:9", duration: 30, audio: "narration",
        source: "가상 캠페인 실적: 자원순환 활동 100일\n참여 주민: 320명\n수거한 재활용품: 1,850kg\n일회용 컵 사용량: 직전 100일 대비 42% 감소\n비교 기준: 동일한 참여 거점의 이전 100일\n핵심 메시지: 함께 실천한 작은 습관이 눈에 보이는 변화가 됩니다.",
        assets: "미첨부 예시 자료: 거점별 집계표, 수거 활동 사진, 캠페인 로고", requirements: "참여 인원·수거량·감소율의 단위와 비교 기간을 구분하고 근거 없는 탄소 감축량으로 환산하지 않기" },
    },
    {
      id: "app", name: "앱 사용 시연", templates: ["ui", "launch", "explainer"], styles: ["living-screencast", "dark-keynote", "swiss-motion"],
      brief: { title: "모아노트, 일정과 메모를 한 곳에", audience: "모임 일정과 기록을 함께 관리하는 소규모 팀", goal: "주요 사용 흐름을 이해하고 체험 화면 열기", ratio: "9:16", duration: 30, audio: "silent",
        source: "가상 앱: 모아노트\n기능: 일정 만들기, 메모 태그 분류, 팀원과 기록 공유\n예시 상황: 독서 모임의 다음 약속과 지난 토론 내용을 한 화면에서 확인\n안내 문구: 일정도 기록도, 모아노트에서\n핵심 메시지: 흩어진 일정과 메모를 하나의 흐름으로 연결합니다.",
        assets: "미첨부 예시 자료: 일정·메모·공유 화면 캡처와 앱 아이콘", requirements: "무음 시청을 기준으로 자막과 화면 상태 변화만으로 이해되게 기획하기", continuity: "동일한 화면 구성·버튼 위치·앱 아이콘 유지" },
    },
    {
      id: "safety", name: "캐릭터 안전 안내", templates: ["character", "education", "whiteboard"], styles: ["midcentury-toon", "crayon-book", "paper-popup"],
      brief: { title: "초록이의 안전한 등굣길", audience: "초등학교 저학년 어린이와 보호자", goal: "횡단보도 앞에서 지킬 안전 행동을 기억하기", ratio: "16:9", duration: 60, audio: "narration",
        source: "가상 캐릭터: 초록색 가방을 멘 작은 새 초록이\n주제: 횡단보도 앞에서 잠깐 멈추는 습관\n전달할 행동: 보도에서 멈추기, 좌우 살피기, 초록불에도 차량이 멈춘 것을 확인하고 걷기\n핵심 문구: 멈추고, 살피고, 천천히 걸어요.\n표현 방향: 친근한 일상 상황에서 어린이가 행동을 이해하도록 설명",
        assets: "미첨부 예시 자료: 초록이 정면·측면·표정 시트, 횡단보도 배경", requirements: "불안감을 과장하는 사고 묘사보다 올바른 행동을 차분하게 보여 주기", continuity: "초록이의 부리 모양·깃털 색·초록 가방 유지" },
    },
    {
      id: "brand", name: "브랜드 소개", templates: ["cinematic", "photo", "logo"], styles: ["watercolor", "one-line", "art-deco"],
      brief: { title: "느린숲 로스터리, 한 잔의 여유", audience: "조용한 공간에서 커피를 즐기는 방문객", goal: "브랜드의 분위기를 기억하고 공간 소개 확인하기", ratio: "4:5", duration: "auto", audio: "music",
        source: "가상 브랜드: 느린숲 로스터리\n소개: 작은 정원과 함께하는 동네 커피 공간\n핵심 요소: 직접 볶은 원두, 계절별 원두 소개, 개인 컵 사용 안내\n브랜드 문구: 바쁜 하루에 잠깐의 숲\n원하는 인상: 따뜻하고 절제된 여유, 편안한 환대",
        assets: "미첨부 예시 자료: 로고 원본, 원두·추출·공간 사진", requirements: "확인되지 않은 수상 경력·산지 인증·고객 후기를 추가하지 않기" },
    },
    {
      id: "route", name: "지도·경로 안내", templates: ["map", "explainer", "whiteboard"], styles: ["transit-map", "iso-infographic", "blueprint"],
      brief: { title: "바다길 전시관 찾아오는 길", audience: "전시관을 처음 찾는 대중교통 이용객", goal: "이동 경로를 이해하고 방문 동선 준비하기", ratio: "16:9", duration: 30, audio: "silent",
        source: "가상 장소: 바다길 전시관\n가상 이동 경로: 역 광장 → 관광 안내소 → 전시관 입구\n예시 거리: 650m / 도보 약 8분\n안내 요소: 갈림길 2곳, 전시관 정문, 보행자 이동 방향\n주의: 실제 지리 자료가 아닌 연습용 동선입니다.\n핵심 메시지: 주요 지점을 따라 편안하게 찾아오세요.",
        assets: "미첨부 예시 자료: 가상 경로 도식, 안내소·입구 사진", requirements: "가상 동선을 실제 지리처럼 단정하지 말고 자료가 제공되면 지점 순서·도로 연결을 보존하기", continuity: "같은 경로선 색상과 지점 표기 유지" },
    },
    {
      id: "concert", name: "공연 홍보", templates: ["music", "event", "loop"], styles: ["countdown", "silkscreen-poster", "swiss-motion"],
      brief: { title: "오로라 나이트 라이브", audience: "라이브 공연과 새로운 음악을 즐기는 관객", goal: "공연 정보를 기억하고 예매 안내 확인하기", ratio: "9:16", duration: 30, audio: "music",
        source: "가상 공연: 오로라 나이트 라이브\n운영: 금요일 19:00 시작, 총 90분\n출연: 가상 아티스트 4팀 / 좌석: 120석\n예매: 예시 예매 페이지에서 사전 예약\n음원: 미첨부. 110BPM은 연습용 리듬 가이드입니다.\n핵심 메시지: 서로 다른 소리가 만나는 한밤의 무대",
        assets: "미첨부 예시 자료: 공연 로고, 아티스트 사진, 사용 허가된 음원", requirements: "실제 음원 분석을 했다고 단정하지 말고 과도한 점멸 없이 공연명·시작 시간·예매 안내를 읽을 수 있게 하기" },
    },
  ].map((sample) => Object.freeze({ ...sample, templates: Object.freeze(sample.templates), styles: Object.freeze(sample.styles), brief: Object.freeze(sample.brief) }));
  Object.freeze(samples);
  function createSamplePicker(random = Math.random) {
    let remaining = [], lastId = "";
    const pick = (values, previous) => {
      const alternatives = values.filter((value) => value !== previous);
      const pool = alternatives.length ? alternatives : values;
      return pool[Math.floor(random() * pool.length)];
    };
    return (current = {}) => {
      if (!remaining.length) {
        remaining = [...samples];
        for (let i = remaining.length - 1; i > 0; i -= 1) {
          const j = Math.floor(random() * (i + 1));
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
      }
      const currentId = samples.find((sample) => sample.brief.title === current.title)?.id;
      const next = remaining.findIndex((sample) => sample.id !== lastId && sample.id !== currentId);
      const sample = remaining.splice(next < 0 ? 0 : next, 1)[0];
      lastId = sample.id;
      const template = pick(sample.templates, current.template), style = pick(sample.styles, current.style);
      return { sample, values: { ...sample.brief, source: sampleNotice + "\n\n" + sample.brief.source, template, style, loop: template === "loop" } };
    };
  }
  function artwork(template, animated = false) {
    const [bg, fg, accent] = template.colors;
    const box = (x, y, w, h, fill, r = 14, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
    const text = (x, y, content, size = 20, fill = fg, extra = "") => `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="750" ${extra}>${escape(content)}</text>`;
    const line = (d, color = fg, width = 4) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const group = (content, kind = "rise") => `<g class="motion-art-${kind}">${content}</g>`;
    let art = "";
    switch (template.art) {
      case "type": art = text(40, 79, "MAKE", 55) + group(text(40, 140, "IT MOVE.", 55)) + box(42, 167, 122, 5, accent, 2) + text(42, 204, "WORDS IN MOTION", 11, "#ffffff"); break;
      case "logo": art = `<circle cx="200" cy="115" r="77" fill="none" stroke="${accent}" stroke-opacity=".3"/>` + group(`<path d="M164 147V81L230 114Z" fill="${fg}"/>`, "turn") + text(200, 221, "YOUR BRAND", 14, fg, 'text-anchor="middle"'); break;
      case "event": art = box(32, 28, 336, 194, "#ffffff", 8) + text(52, 60, "INVITATION / 01", 12, bg) + text(52, 108, "NEXT", 45, bg) + group(text(52, 158, "TOGETHER", 40, bg)) + box(52, 182, 171, 23, bg, 5) + text(64, 198, "JOIN THE EXPERIENCE", 10, "#ffffff") + `<circle cx="326" cy="57" r="16" fill="${fg}"/>`; break;
      case "social": art = box(114, 18, 172, 214, fg, 22) + box(126, 31, 148, 185, bg, 13) + text(144, 77, "WHAT'S", 24) + group(text(144, 107, "NEXT?", 30)) + `<circle cx="200" cy="153" r="27" fill="${accent}"/>` + box(146, 194, 108, 8, fg, 4); break;
      case "explain": art = line("M96 126H304", accent, 5) + [60, 164, 268].map((x, i) => group(box(x, 86, 72, 72, "#ffffff") + (i === 1 ? `<path d="M186 125l10 10 20-25" fill="none" stroke="${fg}" stroke-width="6"/>` : `<circle cx="${x + 36}" cy="122" r="13" fill="${i ? accent : fg}"/>`))).join("") + text(200, 207, "SIMPLIFY THE PROCESS", 17, fg, 'text-anchor="middle"'); break;
      case "chart": art = text(34, 51, "GROWTH / INSIGHT", 13) + line("M40 194H363", "#8aa3ac", 1) + [56, 123, 190, 257].map((x, i) => group(box(x, 169 - i * 30, 42, 25 + i * 30, i === 3 ? accent : fg, 4))).join("") + line("M74 140L143 113L212 93L281 56", "#ffffff", 2) + `<circle cx="281" cy="56" r="5" fill="${accent}"/>`; break;
      case "whiteboard": art = text(40, 56, "THE BIG IDEA", 24) + group(line("M45 66H224", accent, 6) + `<circle cx="91" cy="134" r="30" fill="none" stroke="${fg}" stroke-width="3"/>` + line("M125 134H193M180 124l14 10-14 10") + box(213, 104, 114, 60, "none", 5, `stroke="${fg}" stroke-width="3"`)) + text(42, 213, "DRAW. CONNECT. UNDERSTAND.", 12); break;
      case "steps": art = text(32, 47, "ONE STEP AT A TIME", 19) + [1, 2, 3].map((n, i) => group(box(30 + i * 118, 82, 104, 124, "#ffffff") + `<circle cx="${82 + i * 118}" cy="124" r="22" fill="${i === 1 ? accent : fg}"/>` + text(82 + i * 118, 132, String(n), 22, "#ffffff", 'text-anchor="middle"') + box(49 + i * 118, 166, 66, 5, fg, 2))).join(""); break;
      case "map": art = `<path d="M0 40L145 80 247 12 400 73V250H0Z" fill="${accent}" opacity=".15"/>` + line("M-20 150L115 65 230 189 420 85", "#ffffff", 22) + line("M67 270L138 -20M288 270L235 -20", "#ffffff", 12) + group(line("M80 151L115 126 175 176 288 122", fg, 5), "draw") + `<circle cx="288" cy="122" r="12" fill="${fg}" stroke="white" stroke-width="5"/>` + box(225, 156, 130, 36, "#ffffff", 7) + text(243, 179, "DESTINATION", 12); break;
      case "product": art = `<ellipse cx="200" cy="207" rx="90" ry="14" fill="#000000" opacity=".3"/>` + group(`<path d="M140 74L205 42 266 77 201 111Z" fill="${fg}"/><path d="M140 74V170L201 205V111Z" fill="${accent}"/><path d="M201 111L266 77V169L201 205Z" fill="${fg}" opacity=".65"/>`, "float") + text(29, 36, "FORM / MATERIAL / LIGHT", 10, "#ffffff"); break;
      case "ui": art = box(36, 29, 328, 196, "#ffffff", 12) + box(36, 29, 328, 25, fg, 10) + box(53, 70, 68, 135, bg, 5) + box(136, 70, 207, 35, bg, 5) + group(box(136, 116, 93, 89, fg, 7)) + box(239, 116, 104, 89, accent, 7) + `<path d="M221 159l7 30 7-12 13-4Z" fill="#172338" stroke="white" stroke-width="2"/>`; break;
      case "cards": art = text(32, 42, "BUILT FOR WHAT'S NEXT", 16) + box(32, 70, 151, 145, fg, 13) + group(box(199, 70, 167, 66, "#ffffff", 11) + box(199, 149, 167, 66, accent, 11)) + text(54, 122, "+", 45, bg) + text(54, 186, "NEW", 26, bg) + box(217, 91, 96, 6, bg, 3) + box(217, 110, 68, 5, bg, 2); break;
      case "character": art = `<circle cx="200" cy="116" r="75" fill="${accent}" opacity=".18"/>` + group(`<circle cx="200" cy="97" r="32" fill="${fg}"/>` + box(161, 134, 78, 70, accent, 24) + `<circle cx="189" cy="95" r="3" fill="#ffffff"/><circle cx="212" cy="95" r="3" fill="#ffffff"/>` + line("M191 109q10 10 20 0", "#ffffff", 3) + line("M236 149L262 119", fg, 13), "float") + box(264, 49, 85, 39, "#ffffff", 17) + text(283, 75, "Hello!", 17); break;
      case "cinema": art = `<circle cx="292" cy="72" r="34" fill="${fg}"/><path d="M0 185L99 87 213 187 310 115 400 180V250H0Z" fill="${accent}" opacity=".45"/><path d="M0 215L119 140 236 223 345 167 400 198V250H0Z" fill="#0b1e2a"/>` + group(`<path d="M0 210Q170 140 400 210" fill="none" stroke="${fg}" stroke-width="2" opacity=".5"/>`, "float") + text(30, 38, "A MOMENT IN LIGHT", 12, "#ffffff"); break;
      case "photo": art = box(51, 24, 298, 210, "#ffffff", 5) + box(66, 39, 268, 159, accent, 1) + `<circle cx="267" cy="81" r="23" fill="#fff4db"/>` + group(`<path d="M66 179L141 83 209 170 268 108 334 179V198H66Z" fill="${fg}" opacity=".7"/>`, "float") + text(70, 220, "MOMENTS, WITH DEPTH.", 12); break;
      case "interview": art = `<circle cx="233" cy="86" r="37" fill="${accent}"/><path d="M172 199v-40q0-44 61-44t61 44v40" fill="${accent}" opacity=".7"/>` + text(33, 89, "“", 90) + group(box(29, 164, 239, 59, fg, 5) + text(44, 188, "A VOICE THAT MATTERS", 13, bg) + text(44, 208, "NAME / ORGANIZATION", 9, bg)); break;
      case "loop": art = group(`<circle cx="131" cy="111" r="64" fill="${fg}" opacity=".55"/><circle cx="251" cy="145" r="80" fill="${accent}" opacity=".45"/>`, "float") + [0, 1, 2, 3, 4].map((i) => `<ellipse cx="200" cy="125" rx="${105 + i * 14}" ry="${35 + i * 12}" fill="none" stroke="${fg}" opacity=".25" transform="rotate(-20 200 125)"/>`).join(""); break;
      case "music": art = text(31, 48, "SOUND IN SHAPE", 19) + group([45, 70, 113, 52, 92, 131, 76, 107, 58, 39, 80, 51].map((h, i) => box(35 + i * 28, 146 - h / 2, 15, h, i % 3 ? fg : accent, 7)).join(""), "beat") + text(31, 224, "RHYTHM / FREQUENCY / FEELING", 10); break;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" role="img" aria-label="${escape(template.name)} 연출 샘플" style="font-family:Arial,sans-serif"><rect width="400" height="250" fill="${bg}"/>${animated ? '<style>.motion-art-rise{transform-origin:center;animation:rise 4s ease-in-out infinite}.motion-art-float{animation:float 4s ease-in-out infinite}.motion-art-turn{transform-origin:200px 115px;animation:turn 6s ease-in-out infinite}.motion-art-beat{transform-origin:center;animation:beat 1s ease-in-out infinite}.motion-art-draw{animation:rise 4s ease-in-out infinite}@keyframes rise{0%,100%{opacity:.3;transform:translateY(12px)}30%,75%{opacity:1;transform:translateY(0)}}@keyframes float{50%{transform:translate(7px,-9px)}}@keyframes turn{50%{transform:rotate(25deg) scale(.9)}}@keyframes beat{50%{transform:scaleY(.55)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>' : ""}${art}</svg>`;
  }
  global.PromptDeckMotionCatalog = Object.freeze({ categories, templates, artwork, samples, createSamplePicker });
})(globalThis);
