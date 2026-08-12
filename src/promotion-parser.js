(function (root) {
  "use strict";

  const SCHEMA_VERSION = "promotion-source-parser/3.0";
  const MAX_SOURCE_CHARS = 80000;
  const FIELD_DEFS = {
    headline: { labels: ["지원사업명", "프로그램명", "연구과제명", "사업명", "공고명", "모집명", "행사명", "교육명", "과정명", "공모명", "과제명", "제목"], lines: 1 },
    goal: { labels: ["사업목적", "추진목적", "지원목적", "조사목적", "행사목적", "교육목적", "목적", "추진배경", "사업개요", "공고개요", "사업소개"], lines: 3 },
    audience: { labels: ["지원자격및대상", "신청대상및자격", "지원대상및자격", "참가대상및자격", "신청대상", "지원대상", "참가대상", "모집대상", "참여대상", "교육대상", "응모대상", "수혜대상", "신청자격", "지원자격", "참가자격", "입주자격", "응모자격", "자격요건", "모집업소", "대상"], lines: 4 },
    period: { labels: ["연구책임자온라인신청기간", "온라인신청기간", "전산접수기간", "지원신청기간", "신청접수기간", "사업신청기간", "신청기간", "접수기간", "모집기간", "공모기간", "제출기간", "신청기한", "접수기한", "제출기한", "신청마감", "접수마감", "모집마감", "접수일정", "기간"], lines: 2 },
    eventPeriod: { labels: ["행사개최기간", "프로그램운영기간", "사업수행기간", "협약기간", "행사일시", "교육일정", "개최일시", "행사기간", "교육기간", "운영기간", "사업기간", "수행기간", "유학기간", "일정", "일시"], lines: 2 },
    announcementPeriod: { labels: ["공고기간", "게시기간"], lines: 2 },
    method: { labels: ["참여기업신청방법", "사업신청방법", "지원신청방법", "지원서제출방법", "신청방법", "접수방법", "제출방법", "신청절차", "접수절차", "참여방법", "모집방법", "접수처"], lines: 4 },
    documents: { labels: ["신청및제출서류", "신청서류", "제출서류", "제출자료", "필수서류", "구비서류", "첨부서류"], lines: 6 },
    support: { labels: ["지원조건및내용", "지원사항", "지원내용", "지원혜택", "지원항목", "주요혜택", "참가혜택", "주요내용", "사업내용", "모집내용", "교육내용", "행사내용", "프로그램"], lines: 6 },
    budget: { labels: ["연구개발비", "지원금액", "지원한도", "지원예산", "지원액", "사업비", "연구비", "예산"], lines: 3 },
    fee: { labels: ["대상자별부담액", "참가신청금", "참가비용", "참가비", "수강료", "교육비", "신청금", "자부담"], lines: 3 },
    selection: { labels: ["모집기업수", "지원규모", "선정규모", "선정인원", "모집인원", "모집규모", "참가규모", "선발규모", "교육인원"], lines: 3 },
    selectionMethod: { labels: ["선정결과및자원할당", "선정방법", "선정기준", "선발방법", "선발기준", "평가방법", "선정결과", "선발절차"], lines: 3 },
    topic: { labels: ["지원분야", "모집분야", "공모분야", "교육과정", "커리큘럼", "세부분야", "분야"], lines: 5 },
    payment: { labels: ["지원금지급방법", "지급방법", "지급방식"], lines: 2 },
    contact: { labels: ["문의처", "담당자", "연락처", "문의전화", "문의사항", "신청문의", "접수문의", "전화번호", "휴대폰", "이메일", "E-mail", "Email", "Tel"], lines: 3 },
    place: { labels: ["개최장소", "행사장소", "교육장소", "진행장소", "개최지", "소재지", "장소", "교육방식", "진행방식"], lines: 2 },
    organizer: { labels: ["소관부처·지자체", "주무부처/운영기관", "사업수행기관", "소관부처", "주관기관", "주최기관", "운영기관", "수행기관", "시행기관", "담당부서", "주최·주관", "주최/주관", "주무부처", "주관", "주최"], lines: 3 },
    url: { labels: ["사업신청사이트", "온라인신청사이트", "신청링크", "신청URL", "접수링크", "접수URL", "공고URL", "신청주소", "신청페이지", "접수페이지", "홈페이지", "누리집", "URL"], lines: 1 },
  };
  const TYPE_RULES = [
    ["education", [["교육", 4], ["훈련", 4], ["강의", 3], ["교육원", 5], ["수강", 4], ["커리큘럼", 4], ["부트캠프", 5], ["연수", 3]]],
    ["seminar", [["세미나", 6], ["포럼", 6], ["컨퍼런스", 6], ["콘퍼런스", 6], ["설명회", 6], ["박람회", 6], ["전시회", 6], ["로드쇼", 6], ["상담회", 5], ["네트워킹", 4], ["워크숍", 4], ["워크샵", 4], ["행사", 2]]],
    ["contest", [["경진대회", 8], ["공모전", 8], ["아이디어 공모", 7], ["해커톤", 7], ["콘테스트", 7], ["시상", 4]]],
    ["survey", [["수요조사", 7], ["설문", 6], ["의견수렴", 6], ["실태조사", 6], ["만족도", 3]]],
    ["recruit", [["채용", 7], ["인턴", 6], ["직원 모집", 7], ["인력 모집", 7], ["구인", 6], ["임용", 6]]],
    ["support", [["지원사업", 8], ["지원금", 6], ["사업화", 5], ["보조금", 6], ["바우처", 6], ["참가기업", 5], ["참여기업", 5], ["기업지원", 5], ["지원내용", 3], ["자원 지원", 4], ["지원 사용자", 4], ["연구개발과제", 6], ["연구기획과제", 6], ["과제 공모", 4], ["신규과제", 4], ["연구비", 5], ["육성", 2]]],
  ];
  const TYPE_LABELS = { education: "교육", seminar: "세미나·행사", contest: "공모·경진대회", support: "지원사업", survey: "수요조사", recruit: "모집·채용", general: "일반 안내" };
  const TYPE_CTA = { education: "지금 수강 신청하기", seminar: "지금 사전등록하기", contest: "지금 응모하기", support: "지금 신청하기", survey: "설문 참여하기", recruit: "지금 지원하기", general: "자세히 확인하기" };
  const TYPE_GOAL = { education: "교육 참가자 모집 및 신청 유도", seminar: "행사 참여 및 사전등록 유도", contest: "공모·경진대회 참가자 모집 및 응모 유도", support: "지원사업 참여자 모집 및 신청 유도", survey: "조사 참여 유도", recruit: "지원자 모집 및 지원 유도", general: "핵심 정보 안내 및 참여 유도" };
  const BULLET_RE = /^(?:[○◦ㅇ□◇▷▶●◆■➤•▪▸►✔✓☑*·☞\-–—]\s*|\d{1,3}\s*[.)]\s*|[①-⑳]\s*|[가-힣A-Za-z]\s*[.)]\s*)/u;
  const SECTION_RE = /^(?:[○◦ㅇ□◇▷▶●◆■➤]\s*|\d{1,3}\s*[.)]\s*(?=[^\d\s])|\[[^\]]{1,24}\]\s*$)/u;
  const URL_PATTERN = /https?:\/\/[^\s)\]}>"']+/giu;
  const WEB_PATTERN = /(?:www\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[^\s)\]}>"']*)?/giu;
  const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  const PHONE_PATTERN = /(?:\(?(0\d{1,2})\)?[-.\s]?(\d{3,4})[-.\s]?(\d{4})|(1\d{3})[-.\s]?(\d{4}))(?!\d)/g;
  const DATE_MONTH = "(?:1[0-2]|0?[1-9])";
  const DATE_DAY = "(?:3[01]|[12]\\d|0?[1-9])";
  const DATE_YEAR = "(?:(?:20\\d{2}|[’'‘]?\\d{2})\\s*(?:년|[.\\/-])\\s*)?";
  const DATE_TOKEN = `${DATE_YEAR}${DATE_MONTH}\\s*(?:월|[.\\/-])\\s*${DATE_DAY}\\s*(?:일)?(?:\\s*\\([^)]{1,4}\\))?(?:\\s*(?:오전|오후)?\\s*\\d{1,2}:\\d{2})?`;
  const DATE_RANGE = new RegExp(`${DATE_TOKEN}\\s*(?:~|∼|〜|–|—|부터)\\s*${DATE_TOKEN}(?:\\s*까지)?`, "iu");
  const DATE_SINGLE = new RegExp(DATE_TOKEN, "iu");
  const OUTPUT_KEYS = ["headline", "goal", "audience", "subheadline", "bodyCopy", "posterOffer", "snsHook", "cta", "qrUrl"];

  function clean(value) {
    return String(value == null ? "" : value)
      .replace(/\u00a0/g, " ")
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/[ \f\v]+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim();
  }

  function canonical(value) {
    return clean(value).toLowerCase().replace(/[^0-9a-z가-힣]/g, "");
  }

  function unique(values) {
    const seen = new Set();
    return values.map(clean).filter((value) => {
      const key = canonical(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function normalizeWebUrl(value) {
    const source = clean(value).replace(/[.,;:]+$/u, "");
    if (!source) return "";
    return /^www\./iu.test(source) ? `https://${source}` : source;
  }

  function extractUrls(value) {
    return unique([
      ...(String(value || "").match(URL_PATTERN) || []),
      ...(String(value || "").match(WEB_PATTERN) || []),
    ].map(normalizeWebUrl));
  }

  function normalizeSource(raw) {
    const original = String(raw == null ? "" : raw);
    let text = original.slice(0, MAX_SOURCE_CHARS)
      .replace(/\r\n?/g, "\n")
      .replace(/[\f\u2028\u2029]/g, "\n")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(?:td|th)\s*>\s*<(?:td|th)\b[^>]*>/gi, "\t")
      .replace(/<\/(?:p|div|li|tr|table|thead|tbody|h[1-6])\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
    text = text.normalize("NFC")
      .replace(/([^\n])\s*([□■])(?=\s*(?:\([^\n)]{1,40}\)|[가-힣A-Za-z]))/gu, "$1\n$2")
      .replace(/([^\n])\s+([○◦ㅇ])(?=\s*(?:\([^\n)]{1,40}\)|[가-힣A-Za-z][^:：\n]{0,30})\s*[:：])/gu, "$1\n$2");
    const lines = [];
    text.split("\n").forEach((line) => {
      const normalized = clean(line.replace(/\t+/g, "\t"));
      if (!normalized) return;
      const composite = normalized.replace(BULLET_RE, "").trim().match(/^(?:기간|일시)\s*\/\s*장소\s*[:：]?\s*(.+?)\s+\/\s+(.+)$/u);
      const expanded = composite
        ? [`행사기간: ${clean(composite[1])}`, `행사장소: ${clean(composite[2])}`]
        : [normalized];
      expanded.forEach((value) => {
        if (value && lines[lines.length - 1] !== value) lines.push(value);
      });
    });
    return { text: lines.join("\n"), lines, truncated: original.length > MAX_SOURCE_CHARS, originalLength: original.length, parsedLength: Math.min(original.length, MAX_SOURCE_CHARS) };
  }

  function escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function stripPrefix(value) {
    let result = clean(value);
    for (let index = 0; index < 3; index += 1) {
      const next = result.replace(BULLET_RE, "").trim();
      if (next === result) break;
      result = next;
    }
    return result;
  }

  const MATCHERS = Object.entries(FIELD_DEFS).flatMap(([field, def]) => def.labels.map((label, priority) => ({
    field,
    label,
    priority,
    token: [...label.replace(/\s+/gu, "")].map(escapeRegex).join("\\s*"),
  }))).sort((a, b) => b.label.replace(/\s/g, "").length - a.label.replace(/\s/g, "").length);

  function matchLabel(value) {
    const line = stripPrefix(value);
    for (const matcher of MATCHERS) {
      const token = `(?:\\[\\s*${matcher.token}\\s*\\]|\\(\\s*${matcher.token}\\s*\\)|【\\s*${matcher.token}\\s*】|${matcher.token})`;
      const delimited = line.match(new RegExp(`^${token}(?:\\s*[:：]\\s*|\\t+|\\s*\\|\\s*|\\s*[-–—]\\s+)(.*)$`, "iu"));
      if (delimited) return { ...matcher, value: clean(delimited[1]) };
      if (new RegExp(`^${token}\\s*$`, "iu").test(line)) return { ...matcher, value: "" };
      const spaced = line.match(new RegExp(`^${token}\\s+(.+)$`, "iu"));
      if (spaced) return { ...matcher, value: clean(spaced[1]) };
    }
    return null;
  }

  function sectionHeading(value) {
    const line = clean(value);
    const stripped = stripPrefix(line).replace(/[:：]\s*$/, "").trim();
    if (matchLabel(line)) return true;
    return Boolean(stripped && stripped.length <= 24 && !/[.!?。]$/.test(stripped) && (SECTION_RE.test(line) || (/[:：]$/.test(line) && !/\d{1,2}:\d{2}$/.test(line))));
  }

  function collectLabeled(lines) {
    const result = Object.fromEntries(Object.keys(FIELD_DEFS).map((key) => [key, []]));
    lines.forEach((line, lineIndex) => {
      const match = matchLabel(line);
      if (!match) return;
      const values = match.value ? [match.value] : [];
      const evidence = [line];
      const maxLines = FIELD_DEFS[match.field].lines;
      let cursor = lineIndex + 1;
      while (cursor < lines.length && values.length < maxLines) {
        const next = lines[cursor];
        if (matchLabel(next) || (sectionHeading(next) && !BULLET_RE.test(next))) break;
        if (values.length && maxLines <= 2 && !BULLET_RE.test(next)) break;
        const value = stripPrefix(next);
        if (!value) break;
        values.push(value);
        evidence.push(next);
        cursor += 1;
      }
      const value = values.join(" / ");
      if (!value) return;
      let confidence = match.label.replace(/\s/g, "").length <= 2 ? 0.88 : 0.96;
      if (match.field === "budget" && !/[\d원만억천명개팀%]/u.test(value)) confidence -= 0.1;
      const candidate = {
        field: match.field,
        value,
        label: match.label,
        evidence,
        lineIndex,
        origin: "label",
        confidence,
        score: 120 - match.priority * 3 - lineIndex * 0.05 + Math.min(value.length, 80) * 0.08,
      };
      result[match.field].push(candidate);
      if (["support", "selection"].includes(match.field) && /(?:\d[\d,.]*\s*(?:원|천원|만원|백만원|억원)|무료|전액\s*지원)/u.test(value)) {
        result.budget.push({
          ...candidate,
          field: "budget",
          confidence: Math.min(candidate.confidence, 0.92),
          score: candidate.score - 2,
        });
      }
    });
    return result;
  }

  function choose(items) {
    return [...(items || [])].sort((a, b) => b.score - a.score || a.lineIndex - b.lineIndex)[0] || null;
  }

  function combineCandidates(items, field, limit = 4) {
    const ordered = [...(items || [])].sort((a, b) => a.lineIndex - b.lineIndex);
    const values = unique(ordered.map((item) => item.value)).slice(0, limit);
    if (!values.length) return null;
    return {
      field,
      value: values.join(" / "),
      evidence: unique(ordered.flatMap((item) => item.evidence || [])).slice(0, 8),
      lineIndex: ordered[0]?.lineIndex ?? 0,
      score: Math.max(...ordered.map((item) => item.score || 0)),
      confidence: Math.min(...ordered.map((item) => item.confidence || 0.75)),
      origin: ordered.every((item) => item.origin === "label") ? "label" : "context",
    };
  }

  function scheduleFragment(value) {
    const line = clean(value);
    const range = line.match(DATE_RANGE);
    if (range) return clean(range[0]);
    const single = line.match(DATE_SINGLE);
    if (single) {
      const time = line.match(/(?:오전|오후)?\s*\d{1,2}:\d{2}/u);
      return clean(`${single[0]}${time && !single[0].includes(time[0]) ? ` ${time[0]}` : ""}${/마감|까지/u.test(line) ? " 마감" : ""}`);
    }
    return line.match(/(?:상시(?:접수|모집)?|예산\s*소진\s*시까지|선착순\s*마감|채용\s*시까지)/u)?.[0] || "";
  }

  function contextCandidate(lines, field) {
    const candidates = [];
    lines.forEach((line, lineIndex) => {
      if (matchLabel(line)) return;
      const source = stripPrefix(line);
      if (source.length < 4 || source.length > 260) return;
      let score = 0;
      let value = source;
      if (field === "goal") {
        if (/목적|위하여|위해|촉진|도모|강화|제고|확대|지원하고자|활성화/u.test(source)) score += 8;
      } else if (field === "audience") {
        if (/(?:신청|지원|참가|모집|교육)\s*(?:대상|자격)|대상으로|자격을\s*갖춘/u.test(source)) score += 9;
        if (/중소기업|스타트업|창업자|예비창업자|재직자|구직자|청년|학생|실무자|시민|소상공인/u.test(source)) score += 3;
        if (/소재|거주|영위|만\s*\d{1,2}|\d{1,2}세|이하|이내|기관[·ㆍ]?단체|기업\s*등/u.test(source)) score += 5;
        if (BULLET_RE.test(line)) score += 2;
        if (/지원합니다|제공합니다|지원하고자/u.test(source) && !/대상|자격|소재|거주/u.test(source)) score -= 5;
      } else if (field === "period") {
        value = scheduleFragment(source);
        if (value) score += DATE_RANGE.test(value) ? 11 : 8;
        if (/신청|접수|모집|공모|제출|마감|까지/u.test(source)) score += 4;
      } else if (field === "eventPeriod") {
        value = scheduleFragment(source);
        const hasEventContext = /행사|교육|개최|운영|사업\s*기간|수행\s*기간|협약|일정|일시/u.test(source);
        if (value && hasEventContext) score += DATE_RANGE.test(value) ? 10 : 7;
        if (hasEventContext) score += 4;
      } else if (field === "announcementPeriod") {
        value = scheduleFragment(source);
        const hasAnnouncementContext = /공고|게시/u.test(source);
        if (value && hasAnnouncementContext) score += DATE_RANGE.test(value) ? 9 : 6;
        if (hasAnnouncementContext) score += 5;
      } else if (field === "method") {
        if (/온라인|이메일|전자우편|홈페이지|누리집|방문|우편|구글폼|폼\s*작성|제출|접수|사업관리시스템|전산/u.test(source)) score += 7;
        if (/신청|지원|등록/u.test(source)) score += 3;
      } else if (field === "documents") {
        if (/신청서|계획서|동의서|증명서|소개자료|카탈로그|제출서류|첨부서류/u.test(source)) score += 8;
      } else if (field === "support") {
        if (/지원|혜택|제공|컨설팅|멘토링|교육|바우처|사업화|네트워킹|시상/u.test(source)) score += 6;
        if (/[\d,]+\s*(?:원|천원|만원|백만원|억원|명|개사|팀|%)/u.test(source)) score += 3;
        if (/모집\s*공고\s*$/u.test(source)) score -= 4;
      } else if (field === "budget") {
        if (/[\d,]+\s*(?:원|만원|억원|천원|백만원|명|개사|팀|%)/u.test(source)) score += 10;
        if (/무료|전액\s*지원|자부담|지원금|지원한도|선정/u.test(source)) score += 4;
      } else if (field === "fee") {
        if (/무료|없음|참가비|수강료|교육비|신청금|자부담|기업\s*부담/u.test(source)) score += 9;
      } else if (field === "selection") {
        if (/[\d,]+\s*(?:명|명\s*\(팀\)|개사|개소|업체|팀|과제|가구)/u.test(source)) score += 9;
        if (/(?:모집|선정|선발|지원|참가|교육)\s*(?:규모|인원|기업수|업소)/u.test(source)) score += 4;
      } else if (field === "selectionMethod") {
        if (/선정|선발|평가|심사|우선|선착순|추첨/u.test(source)) score += 9;
      } else if (field === "topic") {
        if (/분야|과정|커리큘럼|트랙|부문/u.test(source)) score += 8;
      } else if (field === "payment") {
        if (/지급|계좌\s*입금|정산|환급/u.test(source)) score += 8;
      } else if (field === "place") {
        if (/회의실|강의실|센터|호텔|컨벤션|혁신지원센터|캠퍼스|교육장|행사장|대강당|체육관/u.test(source)) score += 7;
        if (/(?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|경기도|강원도|충청북도|충청남도|전라북도|전라남도|경상북도|경상남도|제주특별자치도)(?:\s+[가-힣]{1,12}(?:시|군|구))?/u.test(source)) score += 6;
        if (/온라인|비대면|오프라인/u.test(source) && /개최|진행|교육|행사|방식/u.test(source)) score += 6;
        if (/개최|진행|교육|행사|장소/u.test(source)) score += 2;
      } else if (field === "organizer" && /주최|주관|운영기관|수행기관|시행기관/u.test(source)) {
        score += 10;
      }
      if (!value || score <= 0) return;
      score += Math.max(0, 2 - lineIndex * 0.03);
      candidates.push({ field, value: clean(value), evidence: [line], lineIndex, score, confidence: Math.min(0.84, 0.56 + score * 0.025), origin: "context" });
    });
    return choose(candidates);
  }

  function headlineCandidate(lines, explicit) {
    const labeled = choose(explicit);
    if (labeled) return { ...labeled, value: labeled.value.replace(/^[「『【《\["]\s*|\s*[」』】》\]"]$/g, "").trim() };
    const quoted = lines.join("\n").match(/[「『【《"]([^」』】》"]{4,90})[」』】》"]/u);
    if (quoted) return { field: "headline", value: clean(quoted[1]), evidence: [quoted[0]], lineIndex: 0, score: 95, confidence: 0.86, origin: "context" };
    const candidates = [];
    lines.slice(0, 18).forEach((line, lineIndex) => {
      if (matchLabel(line)) return;
      const value = stripPrefix(line).replace(/^제?\s*20\d{2}[-.]\d+\s*호\s*/u, "").trim();
      if (value.length < 4 || value.length > 90 || /^\d[\d\s./~-]*$/u.test(value)) return;
      if (/공고\s*제?\s*20\d{2}|^(?:붙임|첨부|목차|문의처|담당자|연락처|페이지)\b|\.(?:hwp|hwpx|pdf|docx?)$/iu.test(value)) return;
      let score = 16 - lineIndex * 0.55;
      if (/모집|공고|지원사업|교육|세미나|포럼|행사|설명회|수요조사|채용|프로그램|캠페인/u.test(value)) score += 10;
      if (/20\d{2}년?/u.test(value)) score += 2;
      if (/[.!?。]$/u.test(value)) score -= 4;
      candidates.push({ field: "headline", value, evidence: [line], lineIndex, score, confidence: score >= 20 ? 0.86 : 0.68, origin: "context" });
    });
    return choose(candidates);
  }

  function contactBundle(text, lines) {
    const emails = unique(text.match(EMAIL_PATTERN) || []).slice(0, 3);
    const phones = [];
    const reps = [];
    for (const match of text.matchAll(PHONE_PATTERN)) {
      if (match[4]) reps.push(`${match[4]}-${match[5]}`);
      else phones.push(`${match[1]}-${match[2]}-${match[3]}`);
    }
    const urls = extractUrls(text).slice(0, 4);
    const values = [...unique(reps).map((value) => `대표 ${value}`), ...unique(phones).map((value) => `전화 ${value}`), ...emails.map((value) => `이메일 ${value}`)];
    const evidenceTokens = [...emails, ...phones, ...reps].map((value) => value.replace(/[^0-9a-z@.가-힣]/gi, ""));
    const evidence = lines.filter((line) => {
      const key = line.replace(/[^0-9a-z@.가-힣]/gi, "");
      return evidenceTokens.some((token) => key.includes(token))
        || urls.some((url) => line.includes(url) || line.includes(url.replace(/^https?:\/\//iu, "")));
    }).slice(0, 6);
    return { emails, phones: unique(phones), reps: unique(reps), urls, values, evidence };
  }

  function mergeContact(labeled, bundle) {
    const prefix = labeled?.value
      ? clean(labeled.value.replace(URL_PATTERN, " ").replace(WEB_PATTERN, " ").replace(EMAIL_PATTERN, " ").replace(PHONE_PATTERN, " ").replace(/\s+(?:\/|·|\|)\s+/g, " "))
      : "";
    return unique([prefix.length >= 2 ? prefix : "", ...bundle.values]).join(" · ");
  }

  function detectType(text, headline, support) {
    const primary = `${headline}\n${headline}\n${headline}\n${support}`.toLowerCase();
    const secondary = text.toLowerCase();
    const scores = TYPE_RULES.map(([id, terms]) => ({
      id,
      score: terms.reduce((sum, [term, weight]) => sum + (primary.split(term).length - 1) * weight + Math.min(secondary.split(term).length - 1, 3) * weight * 0.35, 0),
    })).sort((a, b) => b.score - a.score);
    const best = scores[0] || { id: "general", score: 0 };
    return { id: best.score > 0 ? best.id : "general", confidence: best.score > 0 ? Math.min(0.96, 0.58 + best.score * 0.018) : 0.52 };
  }

  function groundedClip(value, max) {
    const source = clean(value);
    if (source.length <= max) return source;
    const clauses = source.split(/(?<=[.!?。])\s+|\s*;\s*|\s+,\s+(?=[^\d])/u).map(clean).filter(Boolean);
    const selected = unique([clauses[0] || "", ...clauses.slice(1).filter((item) => /\d|원|명|개사|팀|%|마감|까지/u.test(item))]).join(" · ");
    if (selected && selected.length <= max) return selected;
    const cut = source.slice(0, max);
    const boundary = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf("·"), cut.lastIndexOf(","));
    return `${(boundary >= max * 0.6 ? cut.slice(0, boundary) : cut).trim()}…`;
  }

  function deadlineLabel(period) {
    const value = clean(period);
    if (!value) return "";
    const rolling = value.match(/상시(?:접수|모집)?|예산\s*소진\s*시까지|채용\s*시까지/u);
    if (rolling) return rolling[0];
    const matches = [...value.matchAll(new RegExp(DATE_TOKEN, "giu"))];
    if (!matches.length) return "";
    const last = matches.at(-1)[0];
    const date = last.match(/(\d{1,2})\s*(?:월|[.\/-])\s*(\d{1,2})\s*(?:일)?/u);
    const time = last.match(/(?:오전|오후)?\s*\d{1,2}:\d{2}/u) || value.match(/(?:오전|오후)?\s*\d{1,2}:\d{2}/u);
    return date ? `${Number(date[1])}월 ${Number(date[2])}일${time ? ` ${clean(time[0])}` : ""}` : clean(last);
  }

  function splitFacts(value) {
    return unique(String(value || "").split(/\n|\s+(?:\/|·|•)\s+/u).map(stripPrefix));
  }

  function bodySummary(selected, all, lines, headline) {
    const sections = [];
    const add = (title, values) => {
      const items = unique(values.flatMap(splitFacts));
      if (items.length) sections.push({ title, items });
    };
    add("지원 대상", [selected.audience?.value || ""]);
    add("신청 기간", [...(all.period || []).map((item) => item.value), selected.period?.value || ""]);
    add("행사·운영 일정", [...(all.eventPeriod || []).map((item) => item.value), selected.eventPeriod?.value || ""]);
    if (!selected.period) add("공고 기간", [selected.announcementPeriod?.value || ""]);
    add("장소·진행", [selected.place?.value || ""]);
    add("지원·혜택", [selected.budget?.value || "", selected.support?.value || ""]);
    add("비용", [selected.fee?.value || ""]);
    add("모집·선정", [selected.selection?.value || "", selected.selectionMethod?.value || ""]);
    add("분야·과정", [selected.topic?.value || ""]);
    add("신청 방법", [selected.method?.value || ""]);
    add("제출 서류", [selected.documents?.value || ""]);
    add("지급 방식", [selected.payment?.value || ""]);
    add("주최·주관", [selected.organizer?.value || ""]);
    add("문의처", [selected.contact?.value || ""]);
    if (sections.length < 4) {
      const used = unique([headline, ...Object.values(selected).flatMap((item) => item?.evidence || [])]).map((value) => value.replace(/[^0-9a-z가-힣]/gi, "").toLowerCase());
      const extras = lines.map((line, index) => {
        const value = stripPrefix(line);
        const key = value.replace(/[^0-9a-z가-힣]/gi, "").toLowerCase();
        if (value.length < 5 || value.length > 150 || matchLabel(line) || used.some((item) => item.includes(key) || key.includes(item))) return null;
        if (/https?:\/\//iu.test(value) || /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/u.test(value) || /(?:0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}|1\d{3}[-.\s]?\d{4})/u.test(value)) return null;
        let score = BULLET_RE.test(line) ? 4 : 0;
        if (/지원|혜택|신청|접수|대상|일정|장소|선정|제공|\d/u.test(value)) score += 4;
        return score > 2 ? { value, score: score - index * 0.02, index } : null;
      }).filter(Boolean).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 2).map((item) => item.value);
      add("핵심 내용", extras);
    }
    return sections.map((section) => [section.title, ...section.items.slice(0, 5).map((item) => `  - ${groundedClip(item, 90)}`)].join("\n")).join("\n");
  }

  function meta(candidate, overrides = {}) {
    return {
      kind: overrides.kind || (candidate?.origin === "label" ? "extracted" : "inferred"),
      origin: overrides.origin || candidate?.origin || "derived",
      confidence: Number(Math.max(0, Math.min(1, overrides.confidence ?? candidate?.confidence ?? 0.65)).toFixed(2)),
      evidence: unique(overrides.evidence || candidate?.evidence || []).slice(0, 6),
      note: overrides.note || "",
    };
  }

  function evidence(selected, keys) {
    return unique(keys.flatMap((key) => selected[key]?.evidence || [])).slice(0, 6);
  }

  function parse(raw) {
    const source = normalizeSource(raw);
    const all = collectLabeled(source.lines);
    const selected = { headline: headlineCandidate(source.lines, all.headline) };
    [
      "goal",
      "audience",
      "period",
      "eventPeriod",
      "announcementPeriod",
      "method",
      "documents",
      "support",
      "budget",
      "fee",
      "selection",
      "selectionMethod",
      "topic",
      "payment",
      "place",
    ].forEach((field) => {
      selected[field] = choose(all[field]) || contextCandidate(source.lines, field);
    });
    selected.organizer = combineCandidates(all.organizer, "organizer");
    if (
      selected.place?.origin === "context"
      && selected.organizer
      && canonical(selected.organizer.value).includes(canonical(selected.place.value))
    ) {
      selected.place = null;
    }
    const contacts = contactBundle(source.text, source.lines);
    const labeledContact = choose(all.contact);
    const contactValue = mergeContact(labeledContact, contacts);
    selected.contact = contactValue ? { field: "contact", value: contactValue, evidence: unique([...(labeledContact?.evidence || []), ...contacts.evidence]), confidence: labeledContact ? 0.97 : 0.9, origin: labeledContact ? "label" : "context", lineIndex: labeledContact?.lineIndex ?? source.lines.length, score: 80 } : null;
    const labeledUrl = choose(all.url);
    const qrUrl = clean(extractUrls(labeledUrl?.value || "")[0] || contacts.urls[0] || "");
    selected.url = qrUrl ? { field: "url", value: qrUrl, evidence: unique([...(labeledUrl?.evidence || []), ...source.lines.filter((line) => line.includes(qrUrl))]), confidence: labeledUrl ? 0.98 : 0.9, origin: labeledUrl ? "label" : "context", lineIndex: labeledUrl?.lineIndex ?? source.lines.length, score: 80 } : null;

    const headline = clean(selected.headline?.value || "");
    const type = detectType(source.text, headline, selected.support?.value || "");
    const actionEvidence = source.lines.find((line) => /신청|접수|모집|참여|등록|지원|응모|공모|설문/u.test(line)) || headline;
    let goal = clean(selected.goal?.value || "");
    let goalMeta = meta(selected.goal);
    if (!goal && actionEvidence) {
      goal = TYPE_GOAL[type.id] || TYPE_GOAL.general;
      goalMeta = meta(null, { kind: "derived", confidence: type.id === "general" ? 0.62 : 0.76, evidence: [actionEvidence], note: "원문의 유형과 행동 표현을 바탕으로 홍보 목적을 구성했습니다." });
    }
    const audience = clean(selected.audience?.value || "");
    const primaryPeriod = selected.period || selected.eventPeriod;
    const subheadline = groundedClip([
      audience && groundedClip(audience, 38),
      primaryPeriod?.value && groundedClip(primaryPeriod.value, 38),
      (selected.budget?.value || selected.fee?.value) && groundedClip(selected.budget?.value || selected.fee?.value, 32),
    ].filter(Boolean).join(" · "), 110);
    const bodyCopy = bodySummary(selected, all, source.lines, headline);
    const offerSource = selected.budget || selected.fee || selected.support;
    const posterOffer = offerSource ? groundedClip(offerSource.value, 70) : "";
    const deadline = deadlineLabel(selected.period?.value || "");
    const snsHook = deadline ? `${deadline} 마감` : "";
    const cta = /신청|접수|모집|참여|등록|지원|응모|공모|설문/u.test(source.text) ? (TYPE_CTA[type.id] || TYPE_CTA.general) : "";
    const result = { schemaVersion: SCHEMA_VERSION, noticeType: type.id, noticeTypeLabel: TYPE_LABELS[type.id] || TYPE_LABELS.general, headline, goal, audience, subheadline, bodyCopy, cta, posterOffer, snsHook, qrUrl };
    const fields = {
      headline: meta(selected.headline),
      goal: goalMeta,
      audience: meta(selected.audience),
      subheadline: meta(null, { kind: "summary", confidence: subheadline ? Math.min(0.92, Math.max(0.62, (selected.audience?.confidence || 0.6) * 0.5 + (primaryPeriod?.confidence || selected.budget?.confidence || selected.fee?.confidence || 0.6) * 0.5)) : 0, evidence: evidence(selected, ["audience", "period", "eventPeriod", "budget", "fee"]), note: "추출한 대상·신청 또는 행사 일정·지원 규모를 조합한 요약입니다." }),
      bodyCopy: meta(null, { kind: "summary", confidence: bodyCopy ? 0.9 : 0, evidence: evidence(selected, ["audience", "period", "eventPeriod", "place", "budget", "fee", "support", "selection", "selectionMethod", "topic", "method", "documents", "payment", "organizer", "contact"]), note: "원문 사실을 항목별로 재배열한 개조식 요약입니다." }),
      posterOffer: meta(null, { kind: "summary", confidence: posterOffer ? offerSource.confidence : 0, evidence: offerSource?.evidence || [], note: "지원 금액·참가 비용 또는 핵심 혜택을 한 줄로 압축했습니다." }),
      snsHook: meta(null, { kind: "derived", confidence: snsHook ? selected.period?.confidence || 0.7 : 0, evidence: selected.period?.evidence || [], note: "원문의 신청·접수 일정에서 마감 훅을 구성했습니다." }),
      cta: meta(null, { kind: "derived", confidence: cta ? type.confidence : 0, evidence: actionEvidence ? [actionEvidence] : [], note: "공고 유형과 행동 표현에 맞춘 CTA입니다." }),
      qrUrl: meta(selected.url),
    };
    const important = [headline, audience, primaryPeriod?.value, selected.budget?.value || selected.fee?.value || selected.support?.value, selected.method?.value, selected.contact?.value];
    const warnings = [];
    if (source.truncated) warnings.push(`원문이 ${MAX_SOURCE_CHARS.toLocaleString("ko-KR")}자를 넘어 앞부분만 분석했습니다.`);
    if (!headline) warnings.push("제목을 확정하지 못했습니다. 원문 제목을 직접 확인해 주세요.");
    if (!audience) warnings.push("대상·자격 정보를 찾지 못했습니다.");
    if (!selected.period && !selected.eventPeriod) warnings.push("신청·행사 일정을 찾지 못했습니다.");
    if (!selected.support && !selected.budget && !selected.fee && !selected.topic) warnings.push("지원 내용·혜택 또는 주요 분야 정보를 찾지 못했습니다.");
    if (all.period.length > 1) warnings.push("신청·접수 기간 후보가 여러 개입니다. 적용할 일정을 확인해 주세요.");
    if (all.eventPeriod.length > 1) warnings.push("행사·교육·운영 일정이 여러 개입니다. 적용할 일정을 확인해 주세요.");
    if (all.budget.length > 1) warnings.push("지원 금액 후보가 여러 개입니다. 적용할 값을 확인해 주세요.");
    if (!selected.period && selected.announcementPeriod) warnings.push("공고기간은 찾았지만 실제 신청·접수기간은 확정하지 못했습니다.");
    const populated = OUTPUT_KEYS.filter((key) => clean(result[key]));
    const extractedCount = populated.filter((key) => ["extracted", "inferred"].includes(fields[key]?.kind)).length;
    const derivedCount = populated.filter((key) => ["summary", "derived"].includes(fields[key]?.kind)).length;
    const reviewCount = populated.filter((key) => (fields[key]?.confidence || 0) < 0.72).length;
    if (reviewCount) warnings.push(`신뢰도가 낮은 ${reviewCount}개 항목은 원문 근거를 확인해 주세요.`);
    result.analysis = {
      parserVersion: SCHEMA_VERSION,
      completeness: Math.round((important.filter((value) => clean(value)).length / important.length) * 100),
      fields,
      facts: {
        period: clean(selected.period?.value || ""),
        eventPeriod: clean(selected.eventPeriod?.value || ""),
        announcementPeriod: clean(selected.announcementPeriod?.value || ""),
        method: clean(selected.method?.value || ""),
        documents: clean(selected.documents?.value || ""),
        support: clean(selected.support?.value || ""),
        budget: clean(selected.budget?.value || ""),
        fee: clean(selected.fee?.value || ""),
        selection: clean(selected.selection?.value || ""),
        selectionMethod: clean(selected.selectionMethod?.value || ""),
        topic: clean(selected.topic?.value || ""),
        payment: clean(selected.payment?.value || ""),
        place: clean(selected.place?.value || ""),
        organizer: clean(selected.organizer?.value || ""),
        contact: clean(selected.contact?.value || ""),
      },
      stats: { sourceLineCount: source.lines.length, sourceLength: source.originalLength, parsedLength: source.parsedLength, recognizedFieldCount: populated.length, labeledFactCount: Object.values(all).reduce((sum, items) => sum + items.length, 0), extractedCount, derivedCount, reviewCount },
      warnings,
      typeConfidence: Number(type.confidence.toFixed(2)),
    };
    return result;
  }

  function compress(parsed) {
    if (!parsed || typeof parsed !== "object") return parsed;
    const result = JSON.parse(JSON.stringify(parsed));
    result.goal = groundedClip(result.goal, 70);
    result.audience = groundedClip(result.audience, 56);
    result.subheadline = groundedClip(result.subheadline, 100);
    result.posterOffer = groundedClip(result.posterOffer, 56);
    result.bodyCopy = String(result.bodyCopy || "").split("\n").map((line) => {
      const bullet = line.match(/^(\s*-\s+)(.+)$/u);
      return bullet ? `${bullet[1]}${groundedClip(bullet[2], 72)}` : clean(line);
    }).filter(Boolean).join("\n");
    return result;
  }

  function confidenceLabel(value) {
    const score = Number(value) || 0;
    return score >= 0.88 ? "높음" : score >= 0.72 ? "보통" : "검토 필요";
  }

  function kindLabel(kind) {
    return ({ extracted: "원문 추출", inferred: "문맥 추론", summary: "요약 생성", derived: "카피 생성" })[kind] || "분석 결과";
  }

  root.PromptDeckPromotionParser = Object.freeze({ SCHEMA_VERSION, MAX_SOURCE_CHARS, parse, compress, normalizeSource, confidenceLabel, kindLabel });
})(typeof window !== "undefined" ? window : globalThis);
