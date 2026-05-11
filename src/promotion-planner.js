(function () {
  const $ = (id) => document.getElementById(id);

  const LABELS = {
    purpose: {
      "business-notice": "사업공고",
      event: "행사안내",
      survey: "수요/설문조사",
      information: "정책/정보전달",
      general: "일반 홍보",
    },
    assetType: {
      poster: "포스터/전단지",
      kakao: "카카오채널 메시지",
      "sns-square": "일반 SNS 정방형",
      "sns-vertical": "일반 SNS 세로형",
      "mini-banner": "미니배너",
      "general-banner": "일반배너",
      "web-banner": "웹사이트 메인배너",
    },
    priority: {
      title: "제목 중심",
      benefit: "혜택 중심",
      deadline: "일정/마감 중심",
      cta: "CTA 중심",
      trust: "신뢰 중심",
      "problem-solution": "문제 해결 중심",
    },
    layoutFlow: {
      "title-visual-cta": "상단 제목 → 중앙 비주얼 → 하단 CTA",
      "left-text-right-visual": "좌측 텍스트 → 우측 비주얼",
      "central-message-cards": "중앙 큰 메시지 → 주변 정보 카드",
      "problem-solution-cta": "문제 제기 → 해결책 → 신청 CTA",
      "card-grid": "카드형 정보 블록",
    },
    emphasis: {
      title: "제목 강조",
      benefit: "혜택 강조",
      deadline: "날짜/마감 강조",
      cta: "CTA 강조",
      brand: "브랜드/기관 신뢰 강조",
    },
    colorMode: {
      ai: "AI에게 맡김",
      brand: "브랜드 색상 사용",
      manual: "직접 지정",
    },
    backgroundMode: {
      clean: "밝고 깨끗한 배경",
      dark: "어두운 배경",
      solid: "단색 배경",
      pattern: "질감/패턴 배경",
      photo: "사진 배경",
    },
    visualStyle: {
      "clean-editorial": "정돈된 에디토리얼",
      "public-notice": "공공기관 안내형",
      "premium-ad": "프리미엄 광고형",
      "minimal-typo": "미니멀 타이포",
      "3d-graphic": "3D 그래픽",
      illustration: "일러스트",
      character: "캐릭터",
      "photo-real": "실사형",
    },
  };

  const ASSET_RULES = {
    poster: {
      ratio: "A4/세로형 또는 4:5 세로형",
      guide: "제목, 일정, 혜택, CTA, 기관 정보를 정보 블록으로 안정적으로 배치",
    },
    kakao: {
      ratio: "카카오채널 메시지형, 모바일 우선",
      guide: "첫 화면에서 제목과 CTA가 보이도록 문장을 짧게 유지",
    },
    "sns-square": {
      ratio: "1:1 정방형",
      guide: "썸네일 가독성을 위해 핵심 메시지 1개와 보조 정보 2~3개 중심",
    },
    "sns-vertical": {
      ratio: "4:5 또는 9:16 세로형",
      guide: "상단 훅, 중앙 비주얼, 하단 CTA의 세로 흐름 유지",
    },
    "mini-banner": {
      ratio: "좁은 가로형 미니배너",
      guide: "제목과 CTA만 남기고 부가 설명은 최소화",
    },
    "general-banner": {
      ratio: "일반 가로형 배너",
      guide: "좌측 핵심 문구, 우측 비주얼 또는 CTA 버튼 구조 권장",
    },
    "web-banner": {
      ratio: "웹사이트 메인배너 와이드형",
      guide: "큰 헤드라인, 짧은 서브카피, 명확한 CTA, 여백 있는 히어로 구성",
    },
  };

  const SAMPLE_STATES = {
    "business-notice": {
      quickBrief: "지역 기업 대상 사업공고 포스터. 지원 혜택과 신청 마감이 한눈에 보이고, 신뢰감 있는 공공기관 안내 느낌.",
      purpose: "business-notice",
      assetType: "poster",
      info: {
        title: "2026 지역기업 성장지원 사업 참여기업 모집",
        subtitle: "컨설팅, 홍보, 판로개척을 한 번에 지원합니다.",
        schedule: "신청 마감: 2026.06.15",
        location: "온라인 접수",
        benefit: "기업당 최대 500만원 상당 지원",
        cta: "지금 신청하기",
        contact: "문의: 지역산업지원센터",
        organizer: "주최: 포항시 · 수행: 지역산업지원센터",
        requiredNotice: "세부 자격과 제출서류는 공고문 확인",
      },
      priority: "deadline",
      bigIdea: "성장과 연결",
      visualMetaphor: "빛의 길이 지역 기업과 시장 기회를 연결하는 장면",
      creativeNote: "공공기관 안내처럼 신뢰감 있게, 하지만 너무 딱딱하지 않게",
      layoutFlow: "title-visual-cta",
      emphasis: "deadline",
      colorMode: "brand",
      backgroundMode: "clean",
      primaryColor: "딥 블루",
      backgroundColor: "밝은 그레이",
      accentColor: "선명한 신청 마감 포인트 컬러",
      visualStyle: "public-notice",
      mood: ["신뢰감", "세련됨"],
      qualityRules: ["모바일 썸네일 가독성 우선", "CTA가 한눈에 보이게", "정보 과밀 방지"],
      forbidden: "과한 네온 효과, 장문 문단, 저해상도 스톡 느낌",
    },
    event: {
      quickBrief: "지역 창업 네트워킹 행사 SNS 세로형 이미지. 일정과 장소, 현장 분위기, 사전 신청 CTA가 잘 보이게.",
      purpose: "event",
      assetType: "sns-vertical",
      info: {
        title: "스타트업 네트워킹 데이",
        subtitle: "지역 창업가와 투자자가 만나는 오픈 밋업",
        schedule: "2026.07.03 금요일 14:00",
        location: "포항창업허브 2층 컨퍼런스홀",
        benefit: "전문가 미니 특강, 네트워킹, 투자 상담",
        cta: "사전 신청하기",
        contact: "문의: 창업지원팀",
        organizer: "주최: 포항창업허브",
        requiredNotice: "선착순 80명 마감",
      },
      priority: "cta",
      bigIdea: "만남과 확장",
      visualMetaphor: "여러 점이 하나의 네트워크로 연결되는 장면",
      creativeNote: "현장감은 있되 과한 축제 느낌보다 전문적인 비즈니스 행사 톤",
      layoutFlow: "title-visual-cta",
      emphasis: "cta",
      colorMode: "ai",
      backgroundMode: "clean",
      primaryColor: "",
      backgroundColor: "",
      accentColor: "",
      visualStyle: "clean-editorial",
      mood: ["역동적", "세련됨"],
      qualityRules: ["모바일 썸네일 가독성 우선", "CTA가 한눈에 보이게"],
      forbidden: "복잡한 배경, 장문 문단, 과한 네온 효과",
    },
    survey: {
      quickBrief: "기업 수요조사 카카오채널 메시지 이미지. 참여 이유와 응답 혜택이 명확하고 부담 없는 느낌.",
      purpose: "survey",
      assetType: "kakao",
      info: {
        title: "기업 지원 수요조사",
        subtitle: "필요한 지원사업을 직접 알려주세요.",
        schedule: "응답 기간: 2026.05.20~06.05",
        location: "온라인 설문",
        benefit: "응답자 대상 커피 쿠폰 추첨",
        cta: "1분 설문 참여",
        contact: "문의: 기업지원팀",
        organizer: "주관: 지역산업지원센터",
        requiredNotice: "수집된 의견은 지원사업 기획에 활용됩니다.",
      },
      priority: "benefit",
      bigIdea: "목소리가 정책이 되는 순간",
      visualMetaphor: "작은 응답 카드들이 모여 큰 방향표가 되는 장면",
      creativeNote: "참여 장벽이 낮아 보이고 친근하지만 기관 신뢰감은 유지",
      layoutFlow: "central-message-cards",
      emphasis: "benefit",
      colorMode: "ai",
      backgroundMode: "clean",
      primaryColor: "",
      backgroundColor: "",
      accentColor: "",
      visualStyle: "public-notice",
      mood: ["신뢰감", "따뜻함"],
      qualityRules: ["모바일 썸네일 가독성 우선", "CTA가 한눈에 보이게", "정보 과밀 방지"],
      forbidden: "딱딱한 행정 문서 느낌, 장문 문단, 응답 부담을 키우는 표현",
    },
    information: {
      quickBrief: "정책 안내 웹사이트 메인배너. 핵심 변경사항을 쉽게 전달하고 공신력 있게 보이게.",
      purpose: "information",
      assetType: "web-banner",
      info: {
        title: "2026 중소기업 지원제도 개편 안내",
        subtitle: "달라지는 신청 절차와 주요 혜택을 한눈에 확인하세요.",
        schedule: "시행일: 2026.07.01",
        location: "온라인 안내 페이지",
        benefit: "지원 대상, 신청 방식, 제출서류 간소화 안내",
        cta: "개편 내용 확인하기",
        contact: "문의: 정책지원팀",
        organizer: "발행: 지역산업지원센터",
        requiredNotice: "세부 내용은 공식 안내문 기준",
      },
      priority: "trust",
      bigIdea: "복잡한 정보를 명확한 길로 정리",
      visualMetaphor: "흩어진 문서와 정보 카드가 하나의 안내 경로로 정렬되는 장면",
      creativeNote: "상업 광고보다 공신력 있는 안내 페이지 톤",
      layoutFlow: "left-text-right-visual",
      emphasis: "brand",
      colorMode: "brand",
      backgroundMode: "clean",
      primaryColor: "차분한 네이비",
      backgroundColor: "화이트",
      accentColor: "밝은 블루 포인트",
      visualStyle: "public-notice",
      mood: ["신뢰감", "세련됨"],
      qualityRules: ["CTA가 한눈에 보이게", "정보 과밀 방지"],
      forbidden: "과한 그라데이션, 네온 효과, 권위적이고 딱딱한 문장",
    },
  };

  const defaultState = () => ({
    quickBrief: "",
    purpose: "business-notice",
    assetType: "poster",
    audience: "",
    outputLanguage: "ko",
    info: {
      raw: "",
      title: "",
      subtitle: "",
      schedule: "",
      location: "",
      benefit: "",
      cta: "",
      contact: "",
      organizer: "",
      requiredNotice: "",
    },
    priority: "title",
    bigIdea: "",
    visualMetaphor: "",
    creativeNote: "",
    layoutFlow: "title-visual-cta",
    emphasis: "title",
    colorMode: "ai",
    backgroundMode: "clean",
    primaryColor: "",
    backgroundColor: "",
    accentColor: "",
    visualStyle: "clean-editorial",
    mood: [],
    qualityRules: ["모바일 썸네일 가독성 우선", "CTA가 한눈에 보이게"],
    forbidden: "과한 네온 효과, 장문 문단, 저해상도 스톡 느낌",
  });

  let state = defaultState();

  const fields = {
    quickBrief: "plannerQuickBrief",
    infoRaw: "plannerInfoRaw",
    bigIdea: "plannerBigIdea",
    visualMetaphor: "plannerVisualMetaphor",
    creativeNote: "plannerCreativeNote",
    layoutFlow: "plannerLayoutFlow",
    emphasis: "plannerEmphasis",
    colorMode: "plannerColorMode",
    backgroundMode: "plannerBackgroundMode",
    primaryColor: "plannerPrimaryColor",
    backgroundColor: "plannerBackgroundColor",
    accentColor: "plannerAccentColor",
    visualStyle: "plannerVisualStyle",
    forbidden: "plannerForbidden",
  };

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function compact(values) {
    return values.map((value) => String(value || "").trim()).filter(Boolean);
  }

  const INFO_LABELS = {
    title: "제목",
    subtitle: "보조 설명",
    schedule: "일정/마감",
    location: "장소/진행 방식",
    benefit: "혜택/지원내용",
    cta: "CTA/신청 방법",
    contact: "문의/QR",
    organizer: "주최/기관",
    requiredNotice: "필수 고지",
  };

  const INFO_KEYWORDS = {
    title: ["제목", "타이틀", "공고명", "행사명", "사업명", "프로그램명", "캠페인명", "설문명", "조사명"],
    subtitle: ["보조", "보조설명", "설명", "소개", "서브", "서브카피", "한줄", "한 줄", "요약", "카피", "부제"],
    schedule: ["일정", "마감", "신청마감", "접수마감", "기간", "모집기간", "접수기간", "응답기간", "일시", "날짜", "시행일", "진행일", "행사일", "데드라인"],
    location: ["장소", "위치", "주소", "접수", "접수처", "진행", "진행방식", "방식", "온라인", "오프라인", "현장", "웹사이트", "홈페이지"],
    benefit: ["혜택", "지원", "지원내용", "지원사항", "지원금", "제공", "제공내용", "참여이유", "참여혜택", "리워드", "쿠폰", "상품", "사은품", "상금", "특전"],
    cta: ["cta", "신청", "신청방법", "참여", "참여방법", "응답", "응답하기", "설문참여", "바로가기", "링크", "url", "클릭", "접수하기", "신청하기"],
    contact: ["문의", "문 의", "문의처", "연락", "연락처", "전화", "전화번호", "이메일", "메일", "email", "qr", "담당", "담당자"],
    organizer: ["주최", "주관", "수행", "운영", "운영기관", "기관", "발행", "발행처", "주최기관", "주관기관", "수행기관", "운영사"],
    requiredNotice: ["필수", "고지", "유의", "유의사항", "주의", "주의사항", "안내사항", "비고", "기타", "참고", "자격", "대상", "제출서류", "준비물"],
  };

  function includesAny(text, words) {
    const normalized = normalizeToken(text);
    return words.some((word) => normalized.includes(normalizeToken(word)));
  }

  function normalizeToken(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[()\[\]{}<>]/g, "")
      .replace(/[\s_\-–—·ㆍ:：|/\\.,，。'"“”‘’`~!@#$%^&*+=?]+/g, "");
  }

  function lineHasAny(line, words) {
    return includesAny(line, words);
  }

  function emptyInfo(raw = "") {
    return {
      raw,
      title: "",
      subtitle: "",
      schedule: "",
      location: "",
      benefit: "",
      cta: "",
      contact: "",
      organizer: "",
      requiredNotice: "",
    };
  }

  function mergeState(base, patch) {
    return {
      ...base,
      ...patch,
      info: { ...base.info, ...(patch.info || {}) },
      mood: [...(patch.mood || base.mood || [])],
      qualityRules: [...(patch.qualityRules || base.qualityRules || [])],
    };
  }

  function serializeInfo(info) {
    return [
      info.title,
      info.subtitle,
      info.schedule ? `일정/마감: ${info.schedule}` : "",
      info.location ? `장소/진행 방식: ${info.location}` : "",
      info.benefit ? `혜택/지원내용: ${info.benefit}` : "",
      info.cta ? `CTA: ${info.cta}` : "",
      info.contact ? `문의: ${info.contact}` : "",
      info.organizer ? `주최/기관: ${info.organizer}` : "",
      info.requiredNotice ? `필수 고지: ${info.requiredNotice}` : "",
    ].filter(Boolean).join("\n");
  }

  function normalizeInfoRaw(info) {
    if (info.raw) return info.raw;
    return serializeInfo(info);
  }

  function keywordToInfoKey(label) {
    const normalized = normalizeToken(label);
    return Object.entries(INFO_KEYWORDS).find(([, words]) => {
      return words.some((word) => normalized.includes(normalizeToken(word)));
    })?.[0] || "";
  }

  function guessInfoKey(line) {
    const cleaned = String(line || "").trim();
    const normalized = normalizeToken(cleaned);
    if (!cleaned) return "";
    if (/(마감|기간|일시|시행일|진행일|행사일|데드라인|\d{1,2}\s*월|\d{4}\s*[.\-/년])/.test(cleaned) || lineHasAny(cleaned, INFO_KEYWORDS.schedule)) return "schedule";
    if (lineHasAny(cleaned, INFO_KEYWORDS.contact) || /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}|@/.test(cleaned)) return "contact";
    if (lineHasAny(cleaned, INFO_KEYWORDS.organizer)) return "organizer";
    if (lineHasAny(cleaned, INFO_KEYWORDS.cta) || /^https?:\/\//i.test(cleaned)) return "cta";
    if (lineHasAny(cleaned, INFO_KEYWORDS.benefit)) return "benefit";
    if (lineHasAny(cleaned, INFO_KEYWORDS.location)) return "location";
    if (lineHasAny(cleaned, INFO_KEYWORDS.requiredNotice)) return "requiredNotice";
    if (lineHasAny(cleaned, INFO_KEYWORDS.subtitle)) return "subtitle";
    if (lineHasAny(cleaned, INFO_KEYWORDS.title) && normalized.length <= 40) return "title";
    return "";
  }

  function applyParsedLine(info, line, fallbackLines) {
    const cleaned = line.replace(/^[-*ㆍ•]\s*/, "").trim();
    if (!cleaned) return;
    const labeled = cleaned.match(/^([^:：\-–—=|/]{1,18})\s*[:：\-–—=|/]\s*(.+)$/);
    if (labeled) {
      if (/https?$/i.test(labeled[1].trim())) {
        info.cta = info.cta ? `${info.cta}, ${cleaned}` : cleaned;
        return;
      }
      const key = keywordToInfoKey(labeled[1]);
      if (key) {
        info[key] = info[key] ? `${info[key]}, ${labeled[2].trim()}` : labeled[2].trim();
        return;
      }
    }

    const guessedKey = guessInfoKey(cleaned);
    if (guessedKey) {
      info[guessedKey] = info[guessedKey] ? `${info[guessedKey]}, ${cleaned}` : cleaned;
      return;
    }
    fallbackLines.push(cleaned);
  }

  function parseInfoRaw(rawText) {
    const raw = String(rawText || "").trim();
    const info = emptyInfo(raw);
    if (!raw) return info;

    const fallbackLines = [];
    raw.split(/\n+/).forEach((line) => applyParsedLine(info, line, fallbackLines));
    if (!info.title && fallbackLines.length) info.title = fallbackLines.shift();
    if (!info.subtitle && fallbackLines.length) info.subtitle = fallbackLines.shift();
    if (!info.schedule) info.schedule = extractFirstDate(raw);
    if (!info.cta && lineHasAny(raw, INFO_KEYWORDS.cta)) info.cta = lineHasAny(raw, ["설문", "응답", "조사"]) ? "설문 참여하기" : "신청하기";
    if (!info.location && lineHasAny(raw, INFO_KEYWORDS.location)) {
      const locationLine = raw.split(/\n+/).find((line) => lineHasAny(line, INFO_KEYWORDS.location));
      info.location = locationLine ? locationLine.replace(/^[-*ㆍ•]\s*/, "").trim() : "";
    }
    if (!info.benefit && lineHasAny(raw, INFO_KEYWORDS.benefit)) {
      const benefitLine = raw.split(/\n+/).find((line) => lineHasAny(line, INFO_KEYWORDS.benefit));
      info.benefit = benefitLine ? benefitLine.replace(/^[-*ㆍ•]\s*/, "").trim() : "";
    }
    if (!info.requiredNotice && fallbackLines.length) info.requiredNotice = fallbackLines.join(" / ");
    return info;
  }

  function getAssetRule() {
    return ASSET_RULES[state.assetType] || ASSET_RULES.poster;
  }

  function setStatus(message, type = "success") {
    const status = $("plannerStatus");
    if (!status) return;
    status.textContent = message;
    status.className = `planner-status is-${type}`;
  }

  function applyIfBlank(target, key, value) {
    if (!value) return;
    if (!target[key]) target[key] = value;
  }

  function extractFirstDate(text) {
    const match = text.match(/(\d{4}[.\-/년]\s*\d{1,2}[.\-/월]\s*\d{1,2}일?|\d{1,2}[.\-/월]\s*\d{1,2}일?|~\s*\d{1,2}[.\-/월]\s*\d{1,2}일?|\d{1,2}월\s*\d{1,2}일)/);
    return match ? match[0].replace(/\s+/g, " ").trim() : "";
  }

  function extractTitleCandidate(text) {
    const sentences = text.split(/[.!?\n。]/).map((item) => item.trim()).filter(Boolean);
    const preferred = sentences.find((item) => /(공고|모집|행사|안내|설문|조사|배너|포스터|이미지)/.test(item)) || sentences[0] || "";
    return preferred
      .replace(/^(예:|요청:)/, "")
      .replace(/(포스터|이미지|배너|카카오채널|SNS|정방형|세로형).*/i, "")
      .trim()
      .slice(0, 48);
  }

  function inferQuickBrief() {
    const quickBrief = $(fields.quickBrief)?.value.trim() || "";
    if (!quickBrief) {
      setStatus("빠른 요청을 입력하면 주요 필드를 자동으로 채웁니다.", "error");
      return;
    }

    const text = quickBrief.toLowerCase();
    const next = mergeState(state, { quickBrief });
    next.info = parseInfoRaw(next.info.raw);

    if (includesAny(text, ["사업공고", "공고", "모집", "지원사업", "참여기업"])) next.purpose = "business-notice";
    else if (includesAny(text, ["행사", "세미나", "교육", "컨퍼런스", "워크숍", "네트워킹"])) next.purpose = "event";
    else if (includesAny(text, ["설문", "수요조사", "조사", "응답", "의견수렴"])) next.purpose = "survey";
    else if (includesAny(text, ["정책", "정보전달", "안내", "공지", "변경사항", "제도"])) next.purpose = "information";

    if (includesAny(text, ["카카오", "카카오채널", "메시지"])) next.assetType = "kakao";
    else if (includesAny(text, ["미니배너"])) next.assetType = "mini-banner";
    else if (includesAny(text, ["웹사이트", "메인배너", "히어로"])) next.assetType = "web-banner";
    else if (includesAny(text, ["배너"])) next.assetType = "general-banner";
    else if (includesAny(text, ["세로", "스토리", "릴스", "9:16"])) next.assetType = "sns-vertical";
    else if (includesAny(text, ["정방형", "피드", "1:1", "sns"])) next.assetType = "sns-square";
    else if (includesAny(text, ["포스터", "전단", "전단지"])) next.assetType = "poster";

    if (includesAny(text, ["마감", "일정", "기간", "시행일"])) next.priority = "deadline";
    if (includesAny(text, ["혜택", "지원", "쿠폰", "이유"])) next.priority = "benefit";
    if (includesAny(text, ["신청", "참여", "응답", "클릭", "바로가기", "cta"])) next.priority = "cta";
    if (includesAny(text, ["신뢰", "공신력", "기관", "공공"])) next.priority = "trust";

    if (["kakao", "sns-square", "sns-vertical"].includes(next.assetType)) {
      next.layoutFlow = "title-visual-cta";
      next.qualityRules = Array.from(new Set([...next.qualityRules, "모바일 썸네일 가독성 우선", "정보 과밀 방지"]));
    }
    if (["mini-banner", "general-banner", "web-banner"].includes(next.assetType)) {
      next.layoutFlow = next.assetType === "web-banner" ? "left-text-right-visual" : "title-visual-cta";
      next.qualityRules = Array.from(new Set([...next.qualityRules, "짧은 헤드라인 우선", "CTA가 한눈에 보이게"]));
    }

    applyIfBlank(next.info, "title", extractTitleCandidate(quickBrief));
    applyIfBlank(next.info, "schedule", extractFirstDate(quickBrief));
    if (includesAny(text, ["온라인", "웹", "링크"])) applyIfBlank(next.info, "location", "온라인");
    if (includesAny(text, ["혜택", "지원", "쿠폰"])) applyIfBlank(next.info, "benefit", "참여 혜택과 지원 내용을 명확히 표시");
    if (includesAny(text, ["신청", "참여", "응답"])) applyIfBlank(next.info, "cta", includesAny(text, ["설문", "응답"]) ? "설문 참여하기" : "신청하기");

    if (!next.bigIdea) {
      if (includesAny(text, ["성장", "도약"])) next.bigIdea = "성장과 도약";
      else if (includesAny(text, ["연결", "네트워킹"])) next.bigIdea = "연결과 확장";
      else if (includesAny(text, ["신뢰", "공공", "기관"])) next.bigIdea = "신뢰와 명확성";
    }
    if (!next.visualMetaphor) {
      if (includesAny(text, ["성장", "도약"])) next.visualMetaphor = "상승하는 빛의 경로와 정보 카드가 연결되는 장면";
      else if (includesAny(text, ["설문", "응답"])) next.visualMetaphor = "작은 응답 카드들이 모여 큰 방향표가 되는 장면";
      else if (includesAny(text, ["정책", "정보", "안내"])) next.visualMetaphor = "흩어진 정보가 명확한 안내 경로로 정렬되는 장면";
    }

    state = next;
    writeStateToInputs();
    renderAll();
    setStatus("빠른 요청을 기준으로 목적, 형태, 일부 정보와 기획 방향을 채웠습니다.");
  }

  function infoEntries() {
    return [
      ["제목", state.info.title],
      ["보조 설명", state.info.subtitle],
      ["일정/마감", state.info.schedule],
      ["장소/진행 방식", state.info.location],
      ["혜택/지원내용", state.info.benefit],
      ["CTA/신청 방법", state.info.cta],
      ["문의/QR", state.info.contact],
      ["주최/기관", state.info.organizer],
      ["필수 고지", state.info.requiredNotice],
    ].filter(([, value]) => String(value || "").trim());
  }

  function countInfo() {
    return infoEntries().length;
  }

  function detectNotes() {
    const notes = [];
    const infoCount = countInfo();
    const assetRule = getAssetRule();
    if (!state.info.title) notes.push({ type: "warning", text: "제목/공고명/행사명이 비어 있습니다." });
    if (state.priority === "cta" && !state.info.cta) notes.push({ type: "warning", text: "CTA 중심을 선택했지만 신청 방법이나 행동 유도 문구가 비어 있습니다." });
    if (state.priority === "deadline" && !state.info.schedule) notes.push({ type: "warning", text: "일정/마감 중심을 선택했지만 일정 정보가 비어 있습니다." });
    if (state.assetType === "poster" && infoCount < 4) notes.push({ type: "warning", text: "포스터/전단지는 제목, 일정, 혜택, CTA 등 최소 4개 이상의 정보가 있으면 안정적입니다." });
    if (["kakao", "sns-square", "sns-vertical"].includes(state.assetType) && infoCount > 7) notes.push({ type: "warning", text: "SNS 이미지는 정보가 많으면 가독성이 떨어질 수 있습니다. 핵심 정보만 남기는 것을 권장합니다." });
    if (["mini-banner", "general-banner", "web-banner"].includes(state.assetType) && infoCount > 5) notes.push({ type: "warning", text: "배너는 노출 시간이 짧기 때문에 제목, 핵심 혜택, CTA 중심으로 줄이는 것을 권장합니다." });
    if (state.visualStyle === "minimal-typo" && infoCount > 6) notes.push({ type: "warning", text: "미니멀 타이포 스타일에 비해 정보량이 많습니다. 카드형 정보 블록을 권장합니다." });
    if (state.backgroundMode === "dark" && state.colorMode === "manual" && !state.accentColor) notes.push({ type: "warning", text: "어두운 배경을 직접 지정할 때는 밝은 포인트 색상이나 고대비 텍스트 지시가 필요합니다." });
    if (!state.bigIdea && !state.visualMetaphor && ["3d-graphic", "illustration", "character", "premium-ad"].includes(state.visualStyle)) notes.push({ type: "warning", text: "표현 스타일은 강하지만 빅아이디어/비주얼 은유가 비어 있어 결과가 평범해질 수 있습니다." });
    notes.push({ type: "ok", text: `권장 규격: ${assetRule.ratio}. ${assetRule.guide}` });
    if (!notes.length) notes.push({ type: "ok", text: "현재 입력은 큰 충돌 없이 프롬프트로 정리할 수 있습니다." });
    return notes;
  }

  function section(title, lines) {
    const body = compact(lines);
    return body.length ? `[${title}]\n${body.join("\n")}` : "";
  }

  function buildPrompt() {
    const infoLines = infoEntries().map(([label, value]) => `- ${label}: ${value}`);
    const assetRule = getAssetRule();
    const colorLines = [
      `- 색상 방식: ${LABELS.colorMode[state.colorMode]}`,
      `- 배경 방식: ${LABELS.backgroundMode[state.backgroundMode]}`,
      state.primaryColor ? `- 메인 색상: ${state.primaryColor}` : "",
      state.backgroundColor ? `- 배경 색상: ${state.backgroundColor}` : "",
      state.accentColor ? `- 포인트 색상: ${state.accentColor}` : "",
    ];
    return compact([
      section("Creative Brief", [state.quickBrief]),
      section("Purpose and Format", [
        `- 목적: ${LABELS.purpose[state.purpose]}`,
        `- 이미지 형태: ${LABELS.assetType[state.assetType]}`,
        `- 권장 규격/비율: ${assetRule.ratio}`,
        `- 매체별 구성 기준: ${assetRule.guide}`,
      ]),
      section("Required Information", infoLines),
      section("Message Priority", [
        `- 우선순위: ${LABELS.priority[state.priority]}`,
      ]),
      section("Creative Direction", [
        state.bigIdea ? `- Big idea: ${state.bigIdea}` : "",
        state.visualMetaphor ? `- Visual metaphor: ${state.visualMetaphor}` : "",
        state.creativeNote ? `- Additional creative note: ${state.creativeNote}` : "",
      ]),
      section("Layout Direction", [
        `- 시선 흐름: ${LABELS.layoutFlow[state.layoutFlow]}`,
        `- 강조 대상: ${LABELS.emphasis[state.emphasis]}`,
      ]),
      section("Color and Background", colorLines),
      section("Visual Style", [
        `- 대표 스타일: ${LABELS.visualStyle[state.visualStyle]}`,
        state.mood.length ? `- 보조 무드: ${state.mood.join(", ")}` : "",
      ]),
      section("Quality Rules", state.qualityRules.map((item) => `- ${item}`)),
      section("Forbidden Elements", [state.forbidden]),
    ]).join("\n\n");
  }

  function syncStateFromInputs() {
    state.quickBrief = $(fields.quickBrief)?.value.trim() || "";
    state.info = parseInfoRaw($(fields.infoRaw)?.value || "");
    state.bigIdea = $(fields.bigIdea)?.value.trim() || "";
    state.visualMetaphor = $(fields.visualMetaphor)?.value.trim() || "";
    state.creativeNote = $(fields.creativeNote)?.value.trim() || "";
    state.layoutFlow = $(fields.layoutFlow)?.value || state.layoutFlow;
    state.emphasis = $(fields.emphasis)?.value || state.emphasis;
    state.colorMode = $(fields.colorMode)?.value || state.colorMode;
    state.backgroundMode = $(fields.backgroundMode)?.value || state.backgroundMode;
    state.primaryColor = $(fields.primaryColor)?.value.trim() || "";
    state.backgroundColor = $(fields.backgroundColor)?.value.trim() || "";
    state.accentColor = $(fields.accentColor)?.value.trim() || "";
    state.visualStyle = $(fields.visualStyle)?.value || state.visualStyle;
    state.forbidden = $(fields.forbidden)?.value.trim() || "";
  }

  function renderChoices() {
    document.querySelectorAll("[data-planner-choice]").forEach((group) => {
      const key = group.dataset.plannerChoice;
      group.querySelectorAll(".planner-choice").forEach((button) => {
        const active = state[key] === button.dataset.value;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
    document.querySelectorAll("[data-planner-toggle]").forEach((group) => {
      const key = group.dataset.plannerToggle;
      group.querySelectorAll(".planner-chip").forEach((button) => {
        const active = state[key].includes(button.dataset.value);
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
  }

  function renderSummary(notes, prompt) {
    const summary = $("plannerSummary");
    const noteList = $("plannerNotes");
    const promptEl = $("plannerPrompt");
    const badge = $("plannerPurposeBadge");
    const statusBadge = $("plannerStatusBadge");
    const parsedInfo = $("plannerParsedInfo");
    if (badge) badge.textContent = LABELS.purpose[state.purpose];
    if (statusBadge) statusBadge.textContent = notes.some((note) => note.type === "warning") ? "검토 필요" : "초안";
    if (summary) {
      const rows = [
        `목적: ${LABELS.purpose[state.purpose]}`,
        `형태: ${LABELS.assetType[state.assetType]}`,
        `권장 규격: ${getAssetRule().ratio}`,
        `우선순위: ${LABELS.priority[state.priority]}`,
        `레이아웃: ${LABELS.layoutFlow[state.layoutFlow]}`,
        `스타일: ${LABELS.visualStyle[state.visualStyle]}`,
        state.bigIdea ? `빅아이디어: ${state.bigIdea}` : "",
        state.visualMetaphor ? `비주얼 은유: ${state.visualMetaphor}` : "",
      ].filter(Boolean);
      summary.innerHTML = rows.map((row) => `<div class="planner-summary-item">${escapeHtml(row)}</div>`).join("");
    }
    if (noteList) {
      noteList.innerHTML = notes.map((note) => `<div class="planner-note-item is-${note.type}">${escapeHtml(note.text)}</div>`).join("");
    }
    if (parsedInfo) {
      const rows = infoEntries();
      parsedInfo.innerHTML = rows.length
        ? rows.map(([label, value]) => `<div class="planner-parsed-item"><span class="planner-parsed-label">${escapeHtml(label)}</span>${escapeHtml(value)}</div>`).join("")
        : `<div class="planner-parsed-item"><span class="planner-parsed-label">파싱 대기</span>전달 정보를 입력하면 자동으로 구분됩니다.</div>`;
    }
    if (promptEl) promptEl.value = prompt;
  }

  function renderAll() {
    syncStateFromInputs();
    renderChoices();
    renderSummary(detectNotes(), buildPrompt());
  }

  function setInput(id, value) {
    const input = $(id);
    if (input) input.value = value || "";
  }

  function writeStateToInputs() {
    setInput(fields.quickBrief, state.quickBrief);
    setInput(fields.infoRaw, normalizeInfoRaw(state.info));
    setInput(fields.bigIdea, state.bigIdea);
    setInput(fields.visualMetaphor, state.visualMetaphor);
    setInput(fields.creativeNote, state.creativeNote);
    setInput(fields.layoutFlow, state.layoutFlow);
    setInput(fields.emphasis, state.emphasis);
    setInput(fields.colorMode, state.colorMode);
    setInput(fields.backgroundMode, state.backgroundMode);
    setInput(fields.primaryColor, state.primaryColor);
    setInput(fields.backgroundColor, state.backgroundColor);
    setInput(fields.accentColor, state.accentColor);
    setInput(fields.visualStyle, state.visualStyle);
    setInput(fields.forbidden, state.forbidden);
  }

  function appendText(key, value) {
    const current = key === "forbidden" ? state.forbidden : state[key];
    const parts = current ? current.split(/\s*,\s*/).filter(Boolean) : [];
    if (!parts.includes(value)) parts.push(value);
    if (key === "forbidden") state.forbidden = parts.join(", ");
    else state[key] = parts.join(", ");
    writeStateToInputs();
    renderAll();
  }

  function applySample(type = "business-notice") {
    state = mergeState(defaultState(), SAMPLE_STATES[type] || SAMPLE_STATES["business-notice"]);
    state.info.raw = normalizeInfoRaw(state.info);
    writeStateToInputs();
    renderAll();
    setStatus(`${LABELS.purpose[state.purpose]} 샘플을 채웠습니다.`);
  }

  async function copyPrompt() {
    const prompt = $("plannerPrompt")?.value || buildPrompt();
    await navigator.clipboard.writeText(prompt);
    setStatus("프롬프트를 복사했습니다.");
  }

  function resetAll() {
    state = defaultState();
    writeStateToInputs();
    renderAll();
    const status = $("plannerStatus");
    if (status) {
      status.textContent = "";
      status.className = "planner-status";
    }
  }

  function bindEvents() {
    Object.values(fields).forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", renderAll);
      el.addEventListener("change", renderAll);
    });
    document.querySelectorAll("[data-planner-choice]").forEach((group) => {
      group.querySelectorAll(".planner-choice").forEach((button) => {
        button.addEventListener("click", () => {
          state[group.dataset.plannerChoice] = button.dataset.value;
          renderAll();
        });
      });
    });
    document.querySelectorAll("[data-planner-append]").forEach((group) => {
      group.querySelectorAll(".planner-chip").forEach((button) => {
        button.addEventListener("click", () => appendText(group.dataset.plannerAppend, button.textContent.trim()));
      });
    });
    document.querySelectorAll("[data-planner-toggle]").forEach((group) => {
      group.querySelectorAll(".planner-chip").forEach((button) => {
        button.addEventListener("click", () => {
          const key = group.dataset.plannerToggle;
          const value = button.dataset.value;
          state[key] = state[key].includes(value) ? state[key].filter((item) => item !== value) : [...state[key], value];
          renderAll();
        });
      });
    });
    $("plannerCopyBtn")?.addEventListener("click", copyPrompt);
    $("plannerAnalyzeBtn")?.addEventListener("click", inferQuickBrief);
    $("plannerSampleBtn")?.addEventListener("click", () => applySample("business-notice"));
    $("plannerResetBtn")?.addEventListener("click", resetAll);
    document.querySelectorAll("[data-planner-sample]").forEach((button) => {
      button.addEventListener("click", () => applySample(button.dataset.plannerSample));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!$("panePromotionPlanner")) return;
    writeStateToInputs();
    bindEvents();
    renderAll();
  });
})();
