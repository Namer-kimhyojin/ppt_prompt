import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TYPE_LABELS = { skill: "스킬", plugin: "플러그인", mcp: "MCP" };
const TYPES = Object.keys(TYPE_LABELS);
const RESERVED_SLUGS = new Set(["start", "updates", "workflows"]);
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const array = (value) => Array.isArray(value) ? value : [];
const list = (values) => `<ul>${array(values).map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;

function externalLink(url, label, className = "") {
  let parsed;
  try { parsed = new URL(url); } catch { return escapeHtml(label); }
  if (!["https:", "http:"].includes(parsed.protocol)) return escapeHtml(label);
  return `<a href="${escapeHtml(parsed.href)}"${className ? ` class="${escapeHtml(className)}"` : ""} target="_blank" rel="noopener noreferrer">${escapeHtml(label)}<span class="ai-sr-only"> (새 창)</span></a>`;
}

function badge(type) {
  return `<span class="ai-type ai-type-${escapeHtml(type)}">${escapeHtml(TYPE_LABELS[type])}</span>`;
}

function sectionNavigation(active) {
  return `<nav class="ai-section-nav" aria-label="AI 업무 도구 메뉴">${[
    ["catalog", "/ai-tools/", "도구 찾기"],
    ["start", "/ai-tools/start/", "처음 시작하기"],
    ["workflows", "/ai-tools/workflows/", "업무별 활용법"],
    ["updates", "/ai-tools/updates/", "업데이트 소식"],
  ].map(([key, href, label]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
}

function documentPage({ title, description, route, origin, active, body }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | PromptDeck</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${escapeHtml(origin + route)}" />
  <link rel="icon" type="image/svg+xml" href="/assets/brand/promptdeck-mark.svg" />
  <link rel="alternate" type="application/atom+xml" title="PromptDeck 업데이트" href="/feed.xml" />
  <meta property="og:type" content="${active === "detail" ? "article" : "website"}" />
  <meta property="og:site_name" content="PromptDeck" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:title" content="${escapeHtml(title)} | PromptDeck" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(origin + route)}" />
  <meta property="og:image" content="${escapeHtml(origin)}/assets/brand/promptdeck-social-card.png" />
  <link rel="stylesheet" href="/styles/public-nav.css?v=3" />
  <link rel="stylesheet" href="/styles/ai-tools.css?v=1" />
  <script src="/src/public-nav.js?v=3" defer></script>
  <script src="/src/ai-tools-catalog.js?v=1" defer></script>
</head>
<body class="ai-tools-page">
  <a class="ai-skip-link" href="#main">본문 바로가기</a>
  <header class="public-header"><nav class="public-nav" aria-label="주요 메뉴">
    <a class="public-brand" href="/" aria-label="PromptDeck 홈"><img src="/assets/brand/promptdeck-mark.svg" alt="" />PromptDeck</a>
    <div class="public-nav-links"><a href="/features">기능</a><a href="/guides/">실무 가이드</a><a href="/ai-tools/" aria-current="page">AI 업무 도구</a><a href="/about">소개</a><a class="public-nav-cta" href="/app">작업 도구 열기</a></div>
  </nav></header>
  <main id="main" class="ai-shell">
    ${sectionNavigation(active)}
    ${body}
  </main>
  <footer class="ai-footer"><div class="ai-shell"><p><strong>PromptDeck</strong> · 업무에 맞는 AI 도구와 실무 안내</p><nav aria-label="운영 정보"><a href="/guides/ppt-slide-planner-skill">기존 스킬 다운로드</a><a href="/about">운영 소개</a><a href="/ai-policy">AI 이용정책</a><a href="/privacy">개인정보처리방침</a></nav></div></footer>
</body>
</html>
`;
}

function card(record) {
  const categories = array(record.categories);
  const search = [record.name, record.outcome, ...categories, ...array(record.platforms), ...array(record.audience), TYPE_LABELS[record.type], record.type].join(" ");
  const family = record.youtubeEvidence?.matchScope === "skill-family";
  return `<article class="ai-card" data-ai-tool data-type="${escapeHtml(record.type)}" data-category="${escapeHtml(categories.join("|"))}" data-search="${escapeHtml(search)}">
    <div class="ai-card-meta">${badge(record.type)}<span>${record.listingTier === "technical" ? "개발·서비스 운영" : escapeHtml(categories[0] || "업무 활용")}</span></div>
    <h2><a href="/ai-tools/${escapeHtml(record.slug)}/">${escapeHtml(record.name)}</a></h2>
    <p class="ai-card-outcome">${escapeHtml(record.outcome)}</p>
    <p class="ai-card-platforms">${escapeHtml(array(record.platforms).slice(0, 3).join(" · "))}${array(record.platforms).length > 3 ? " 외" : ""}</p>
    <div class="ai-card-bottom"><span>${family ? "스킬 계열 소개 근거" : `${Number(record.youtubeEvidence?.uniqueChannelCount) || 0}개 채널 소개 근거`}</span><a href="/ai-tools/${escapeHtml(record.slug)}/" aria-label="${escapeHtml(record.name)} 사용 안내">사용 안내 <span aria-hidden="true">→</span></a></div>
  </article>`;
}

function catalog(records, manifest) {
  const categories = [...new Set(records.flatMap((record) => array(record.categories)))];
  const counts = Object.fromEntries(TYPES.map((type) => [type, records.filter((record) => record.type === type).length]));
  return `<section class="ai-hero"><p class="ai-eyebrow">스킬·플러그인·MCP</p><h1>AI 업무 도구</h1><p class="ai-lead">내 업무에 맞는 도구를 찾고,<br class="ai-desktop-break" /> 설치부터 첫 요청까지 이어가세요.</p><div class="ai-hero-links"><a href="/ai-tools/start/">처음이라면 여기서 시작 →</a><a href="/ai-tools/workflows/">업무별 활용법 보기 →</a></div></section>
  <div class="ai-stats" aria-label="목록 현황"><span><strong>${records.length}</strong>개 도구</span><span>스킬 ${counts.skill} · 플러그인 ${counts.plugin} · MCP ${counts.mcp}</span><span>자료 확인 <time datetime="${escapeHtml(manifest.researchedAt)}">${escapeHtml(manifest.researchedAt)}</time></span></div>
  <section class="ai-catalog" aria-label="업무 도구 찾기">
    <form class="ai-search-form" role="search" action="/ai-tools/" method="get"><div class="ai-field ai-search-field"><label for="aiToolsSearch">업무 또는 도구 검색</label><input type="search" name="q" id="aiToolsSearch" placeholder="예: 보고서, Notion, 영상, 데이터" autocomplete="off" /></div><div class="ai-field"><label for="aiToolsCategory">업무 분류</label><select id="aiToolsCategory" name="category"><option value="">모든 업무</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></div><button class="ai-button ai-button-subtle" type="reset">초기화</button></form>
    <div class="ai-filter-row"><div class="ai-type-filters" role="group" aria-label="도구 유형"><button type="button" data-type-filter="all" aria-pressed="true">전체 <span>${records.length}</span></button>${TYPES.map((type) => `<button type="button" data-type-filter="${type}" aria-pressed="false">${TYPE_LABELS[type]} <span>${counts[type]}</span></button>`).join("")}</div><p id="aiToolsCount" class="ai-result-count" role="status" aria-live="polite">${records.length}개 도구</p></div>
    <div class="ai-card-grid">${records.map(card).join("\n")}</div>
    <div id="aiToolsEmpty" class="ai-empty" hidden><h2>조건에 맞는 도구가 없습니다.</h2><p>검색어를 짧게 바꾸거나 업무·유형 필터를 초기화해 보세요.</p><button type="button" class="ai-button" data-clear-filters>필터 초기화</button></div>
    <noscript><p class="ai-note">전체 목록을 표시하고 있습니다. 검색·필터는 JavaScript를 켜면 사용할 수 있습니다.</p></noscript>
  </section>
  <aside class="ai-evidence-note"><h2>추천 근거는 이렇게 확인했습니다</h2><p>${Number(manifest.stats?.citedUniqueVideoCount) || 25}개 영상의 공개 설명·챕터·일부 공개 전사와 공식 자료를 대조했습니다. 검색으로 찾은 표본이며 전체 인기순위가 아닙니다. 12개는 같은 도구의 반복 언급, PPTX는 스킬 계열의 보완 근거입니다.</p><p>현재 항목은 <strong>출처 확인 · 실행 미검증</strong> 상태입니다. 실제 지원 범위와 비용은 설치할 환경의 공식 안내에서 확인하세요.</p><a href="/ai-tools/updates/">자료 확인 범위와 업데이트 보기 →</a></aside>`;
}

const SETUP = {
  skill: [
    ["사용환경 선택", "아래 지원 환경 중 실제 사용하는 AI를 확인합니다. 같은 스킬도 환경마다 등록 방법이 다를 수 있습니다."],
    ["공식 안내로 등록", "공식 설치 안내에서 해당 환경의 설치·등록 절차를 따릅니다. 폴더 또는 패키지에 참고자료가 포함되어 있으면 함께 준비합니다."],
    ["등록 확인 후 첫 요청", "AI의 스킬 목록이나 공식 안내의 호출 방식으로 등록 여부를 확인합니다. 샘플 자료와 아래 예시 요청을 전달합니다."],
    ["결과 확인", "원문 수치·출처·파일 형식을 확인하고 필요한 수정사항을 구체적으로 전달합니다."],
  ],
  plugin: [
    ["대상 플랫폼 확인", "사용하는 AI가 공식 배포처에서 안내하는 플러그인 형식을 지원하는지 확인합니다."],
    ["설치·활성화", "공식 설치 페이지에서 플러그인을 설치하고 활성화합니다. 포함된 스킬·연결 기능을 확인합니다."],
    ["필요한 서비스 연결", "업무에 필요한 계정만 연결합니다. 플러그인 설치와 외부 서비스 로그인은 별도 단계입니다."],
    ["첫 업무 수행", "샘플 자료로 아래 요청을 실행하고 결과를 확인합니다. 이미 포함된 스킬이나 MCP는 중복 설치하지 않습니다."],
  ],
  mcp: [
    ["연결할 AI 선택", "사용하는 AI의 MCP·커넥터 지원 여부를 확인하고 공식 문서에서 해당 클라이언트 안내를 선택합니다."],
    ["서버 준비·등록", "원격 방식은 공식 연결 주소를 등록하고, 로컬 방식은 안내된 실행환경과 서버를 준비합니다."],
    ["인증과 연결 확인", "필요한 계정으로 인증한 뒤 도구 목록이 표시되는지 확인합니다. 비밀키는 해당 앱의 설정에 입력합니다."],
    ["자료 접근·결과 확인", "샘플 자료를 읽는 요청부터 시작합니다. 연결 성공과 실제 업무 수행 성공을 각각 확인합니다."],
  ],
};

function evidenceLabel(video) {
  const level = String(video.evidenceLevel || "");
  if (level.includes("publisher_transcript")) return "제작자 공개 전사·영상 정보";
  if (level.includes("mirror")) return "공개 설명·보완 메타데이터";
  if (level.includes("chapter")) return "공개 설명·챕터";
  return "공개 제목·설명";
}

function detail(record, records) {
  const officialAction = record.type === "mcp" ? "공식 연결 안내" : "공식 설치 안내";
  const videos = array(record.youtubeEvidence?.videos);
  const modes = array(record.connectionModes).map((mode) => mode === "remote" ? "원격 연결" : mode.startsWith("local") ? "로컬 실행" : mode);
  const related = records.filter((item) => item.id !== record.id && item.categories.some((category) => array(record.categories).includes(category))).slice(0, 3);
  const requirements = array(record.requirements).length ? record.requirements : ["사용할 AI 계정과 해당 환경의 스킬·플러그인 지원", "첫 실행에 사용할 샘플 자료와 원하는 결과 조건"];
  const includes = array(record.includedComponents);
  return `<div class="ai-breadcrumb"><a href="/ai-tools/">AI 업무 도구</a><span aria-hidden="true">/</span><span>${escapeHtml(record.name)}</span></div>
  <section class="ai-detail-hero"><div class="ai-card-meta">${badge(record.type)}<span>${record.listingTier === "technical" ? "개발·서비스 운영" : escapeHtml(array(record.categories).join(" · "))}</span></div><h1>${escapeHtml(record.name)}</h1><p class="ai-lead">${escapeHtml(record.outcome)}</p><div class="ai-actions">${externalLink(record.distribution?.url || record.officialUrl, officialAction, "ai-button")}<a class="ai-button ai-button-subtle" href="#first-request">첫 요청 예시</a></div><p class="ai-verification">출처 확인 <time datetime="${escapeHtml(record.sourceCheckedAt)}">${escapeHtml(record.sourceCheckedAt)}</time><span>실행 ${record.verifiedAt ? `확인 ${escapeHtml(record.verifiedAt)}` : "미검증"}</span></p></section>
  <div class="ai-detail-layout"><article class="ai-article">
    <section id="overview"><h2>어떤 업무에 쓰나요?</h2><p>${escapeHtml(record.outcome)}</p><p><strong>추천 대상</strong> ${escapeHtml(array(record.audience).join(" · "))}</p>${includes.length ? `<h3>함께 제공되는 기능</h3>${list(includes)}<p class="ai-note">패키지에 포함된 기능은 별도 설치가 필요한지 먼저 확인하세요.</p>` : ""}</section>
    <section id="prepare"><h2>시작 전에 준비하세요</h2>${list(requirements)}<dl class="ai-facts"><div><dt>안내된 사용환경</dt><dd>${escapeHtml(array(record.platforms).join(" · "))}</dd></div>${modes.length ? `<div><dt>연결 방식</dt><dd>${escapeHtml(modes.join(" · "))}</dd></div>` : ""}<div><dt>비용 조건</dt><dd>${escapeHtml(record.costNotes)}</dd></div>${record.license ? `<div><dt>코드 라이선스</dt><dd>${escapeHtml(record.license)}</dd></div>` : ""}</dl><p class="ai-note">${escapeHtml(record.platformEvidence)} 실제 동작은 선택한 환경에서 확인해야 합니다.</p></section>
    <section id="setup"><h2>${record.type === "mcp" ? "연결하는 순서" : "설치하고 시작하는 순서"}</h2><ol class="ai-steps">${SETUP[record.type].map(([heading, text]) => `<li><h3>${heading}</h3><p>${text}</p></li>`).join("")}</ol><p>${externalLink(record.officialUrl, `${record.name} ${officialAction} 열기 →`)}</p></section>
    <section id="first-request"><div class="ai-section-heading"><h2>첫 요청은 이렇게</h2><button class="ai-button ai-button-subtle" type="button" data-copy-target="aiToolPrompt">예시 요청 복사</button></div><pre id="aiToolPrompt" class="ai-prompt" tabindex="0">${escapeHtml(record.starterPrompt)}</pre><p id="aiToolsCopyStatus" class="ai-copy-status" role="status" aria-live="polite"></p><p class="ai-note">설치·연결 후 상황에 맞게 수정해서 사용하세요. 이 문장은 안내용 예시이며 실행 결과를 검증한 요청문은 아닙니다.</p></section>
    <section id="checks"><h2>결과를 확인할 때</h2><ul><li>선택한 AI에서 해당 스킬·플러그인 또는 연결 도구가 인식되는지 확인합니다.</li><li>원문에 있는 수치·날짜·출처가 유지됐는지 확인합니다.</li><li>원하는 결과물 형식과 실제 저장 위치를 확인합니다.</li></ul>${array(record.caveats).length ? `<h3>이 도구의 확인사항</h3>${list(record.caveats)}` : ""}</section>
    <section id="videos"><h2>소개된 영상과 확인 근거</h2><p class="ai-note">${escapeHtml(record.youtubeEvidence?.selectionBasis)} 영상 전체 시청이나 도구의 성능 시험 결과는 아닙니다.</p>${record.youtubeEvidence?.matchScope === "skill-family" ? '<p class="ai-callout">PPTX는 공개 참조 구현 소개와 Claude 내장 PowerPoint 스킬 소개를 구분한 스킬 계열 근거입니다.</p>' : ""}<div class="ai-video-list">${videos.map((video) => `<article><h3>${externalLink(video.deepLink || video.url, video.title)}</h3><p class="ai-video-meta">${escapeHtml(video.channel)} · ${video.publishedAt ? `<time datetime="${escapeHtml(video.publishedAt)}">${escapeHtml(video.publishedAt)}</time>` : "게시일 미확인"} · ${evidenceLabel(video)}</p><p>${escapeHtml(video.mentionSummary || video.mention)}</p>${video.withinPreferredWindow === false ? '<p class="ai-note">우선 조사 기간 밖의 보완 자료입니다. 현재 설치법은 공식 안내를 확인하세요.</p>' : ""}${video.commercialContext ? `<p class="ai-note">${escapeHtml(video.commercialContext)}</p>` : ""}${video.metadataCaveat ? `<p class="ai-note">${escapeHtml(video.metadataCaveat)}</p>` : ""}</article>`).join("")}</div></section>
    <section id="sources"><h2>공식 자료와 안내 변경</h2><ul>${array(record.officialSources).map((url, index) => `<li>${externalLink(url, index === 0 ? "공식 소개·설치 안내" : `추가 공식 자료 ${index}`)}</li>`).join("")}</ul><p><time datetime="${escapeHtml(record.guideUpdatedAt)}">${escapeHtml(record.guideUpdatedAt)}</time> · 첫 소개와 영상 근거 정리. 실제 설치·연결·업무 수행 확인일은 아직 없습니다.</p><a href="/ai-tools/updates/">전체 업데이트 보기 →</a></section>
  </article><aside class="ai-toc" aria-label="이 페이지 목차"><p>사용 안내</p><a href="#overview">업무와 기능</a><a href="#prepare">준비물·사용환경</a><a href="#setup">설치·연결 순서</a><a href="#first-request">첫 요청 예시</a><a href="#checks">결과 확인</a><a href="#videos">소개 영상</a><a href="#sources">공식 자료·변경</a></aside></div>
  ${related.length ? `<section class="ai-related"><h2>함께 살펴볼 도구</h2><div class="ai-related-list">${related.map((item) => `<a href="/ai-tools/${escapeHtml(item.slug)}/">${badge(item.type)}<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.outcome)}</span></a>`).join("")}</div></section>` : ""}`;
}

function startPage() {
  return `<section class="ai-hero ai-hero-compact"><p class="ai-eyebrow">처음 시작하기</p><h1>내 AI에 필요한 기능을 더하는 법</h1><p class="ai-lead">할 일을 먼저 정하고, 사용하는 AI에 맞춰 설치하거나 연결하세요.</p></section><article class="ai-article ai-reading">
    <section><h2>세 가지는 무엇이 다른가요?</h2><div class="ai-definition-list"><div>${badge("skill")}<h3>업무 방법을 알려줍니다</h3><p>문서 작성·자료 정리 같은 업무의 절차와 참고자료를 AI가 읽도록 등록합니다.</p><a href="/ai-tools/?type=skill">스킬 4개 보기 →</a></div><div>${badge("plugin")}<h3>필요한 기능을 묶어 설치합니다</h3><p>스킬, 명령, 외부 도구 연결 등을 하나의 설치 단위로 제공합니다. 대상 플랫폼을 먼저 확인하세요.</p><a href="/ai-tools/?type=plugin">플러그인 4개 보기 →</a></div><div>${badge("mcp")}<h3>외부 자료와 프로그램을 연결합니다</h3><p>AI가 Notion 문서나 브라우저 같은 도구에 접근하도록 연결합니다. 로컬 실행과 원격 연결이 있습니다.</p><a href="/ai-tools/?type=mcp">MCP 5개 보기 →</a></div></div></section>
    <section><h2>이 순서로 시작하세요</h2><ol class="ai-steps"><li><h3>원하는 결과 정하기</h3><p>‘AI를 잘 쓰기’보다 ‘회의 메모에서 후속 업무를 정리하기’처럼 결과를 정합니다.</p></li><li><h3>사용환경 확인하기</h3><p>도구 상세 페이지에서 현재 사용하는 AI가 안내된 환경인지 확인합니다. 웹 서비스와 데스크톱·CLI는 등록 방법이 다를 수 있습니다.</p></li><li><h3>공식 안내로 설치·연결하기</h3><p>상세 페이지의 공식 설치·연결 안내를 엽니다. 플러그인에 이미 포함된 기능은 다시 설치할 필요가 있는지 확인합니다.</p></li><li><h3>작은 샘플로 첫 요청하기</h3><p>‘예시 요청 복사’를 눌러 자료와 요구사항을 바꿔 전달합니다. 도구가 인식되는지와 결과물이 만들어지는지를 따로 확인합니다.</p></li></ol></section>
    <section><h2>막히면 여기부터 확인하세요</h2><dl class="ai-faq"><div><dt>다운로드했는데 목록에 안 보여요</dt><dd>다운로드와 등록은 별도 단계입니다. 해당 환경의 설치 위치·활성화·세션 갱신 안내를 확인하세요.</dd></div><div><dt>MCP는 연결됐는데 자료를 못 읽어요</dt><dd>로그인한 계정과 대상 자료의 접근권한, 사용 가능한 도구를 확인하세요. 연결 성공이 모든 자료의 접근을 보장하지는 않습니다.</dd></div><div><dt>영상과 화면이 달라요</dt><dd>영상 게시일과 현재 버전이 다를 수 있습니다. 현재 공식 안내를 우선하고 상세 페이지의 확인일을 함께 보세요.</dd></div><div><dt>무료로 사용할 수 있나요?</dt><dd>도구 소스의 공개 여부와 AI 사용료·외부 서비스 요금은 다릅니다. 상세 페이지의 비용 조건과 공식 요금 안내를 확인하세요.</dd></div></dl></section>
    <section><h2>발표 기획부터 시작한다면</h2><p>기존 ppt-slide-planner의 Codex·Claude 패키지와 등록 안내도 계속 이용할 수 있습니다.</p><a href="/guides/ppt-slide-planner-skill" class="ai-button ai-button-subtle">ppt-slide-planner 안내 열기</a></section>
  </article>`;
}

function workflowsPage() {
  const flow = (name, description, steps, tools, result) => `<section class="ai-workflow"><h2>${name}</h2><p>${description}</p><ol class="ai-flow-steps">${steps.map((step) => `<li>${step}</li>`).join("")}</ol><p><strong>살펴볼 도구</strong> ${tools.map(([slug, label]) => `<a href="/ai-tools/${slug}/">${label}</a>`).join(" · ")}</p><p><strong>확인할 결과</strong> ${result}</p></section>`;
  return `<section class="ai-hero ai-hero-compact"><p class="ai-eyebrow">업무별 활용법</p><h1>할 일에 맞춰 도구를 연결하세요</h1><p class="ai-lead">준비물과 결과를 정하면 어떤 기능이 필요한지 보입니다.</p></section><article class="ai-article ai-reading"><p class="ai-callout">아래는 도구를 조합하는 업무 설계 예시입니다. 제품 간 자동 연동이나 실제 실행 성공을 검증한 사례는 아닙니다.</p>
  ${flow("자료 조사에서 발표자료까지", "공개 자료를 조사하고 내부 메모와 함께 발표자료로 정리할 때 활용합니다.", ["조사할 질문과 공식 웹페이지 주소, 내부 참고 메모를 준비합니다.", "Firecrawl로 웹 자료를 정리하고 필요하면 Notion에서 관련 업무 문서를 확인합니다.", "원문 주소·확인일·수치를 모아 PPTX 스킬에 발표 목적과 장수를 전달합니다."], [["firecrawl-mcp", "Firecrawl MCP"], ["notion-mcp", "Notion MCP"], ["anthropic-pptx", "PPTX"]], "원문과 수치가 일치하는지, 발표자료 파일이 편집 가능한지 확인합니다.")}
  ${flow("행사 홍보 콘텐츠 준비", "행사 정보를 채널별 문안과 영상 제작 요청으로 나눕니다.", ["행사명·일시·장소·대상·신청 링크와 기관의 문체 기준을 준비합니다.", "Marketing 플러그인으로 채널별 문안과 캠페인 초안을 작성합니다.", "영상이 필요하면 확정한 문안과 이미지를 Remotion 스킬에 전달합니다."], [["anthropic-marketing-plugin", "Marketing"], ["remotion-agent-skills", "Remotion Agent Skills"]], "모든 콘텐츠의 날짜·장소·신청 주소를 대조하고 영상의 자막 가독성을 확인합니다.")}
  ${flow("주간 업무 정리와 반복 절차 만들기", "매주 비슷한 형식으로 업무 현황을 정리할 때 활용합니다.", ["이번 주 업무 메모와 담당자·기한·결정사항이 있는 원문을 준비합니다.", "Productivity 플러그인으로 업무 목록을 정리하고 필요한 지식은 Obsidian에서 관리합니다.", "반복할 형식이 정해지면 Skill Creator로 입력 조건과 결과 확인 기준을 스킬로 정리합니다."], [["anthropic-productivity-plugin", "Productivity"], ["obsidian-skills", "Obsidian Skills"], ["anthropic-skill-creator", "Skill Creator"]], "원문에 없는 담당자나 기한이 추가되지 않았는지, 다음 주에도 같은 형식으로 쓸 수 있는지 확인합니다.")}
  <section><h2>PromptDeck 작업으로 이어가기</h2><p>확정한 내용으로 이미지 제작 요청문을 만들 때 기존 작업 도구를 사용할 수 있습니다.</p><div class="ai-inline-links"><a href="/app?tab=commonPrompt">슬라이드 디자인 설정 →</a><a href="/app?tab=promotion">홍보 이미지 →</a><a href="/app?tab=videoAssets">영상 에셋 →</a></div></section></article>`;
}

function updatesPage(records, manifest) {
  return `<section class="ai-hero ai-hero-compact"><p class="ai-eyebrow">업데이트 소식</p><h1>무엇이 새로 추가됐나요?</h1><p class="ai-lead">PromptDeck의 안내 변경과 확인 범위를 기록합니다.</p></section><article class="ai-article ai-reading"><section><p class="ai-eyebrow"><time datetime="${escapeHtml(manifest.researchedAt)}">${escapeHtml(manifest.researchedAt)}</time> · 첫 목록 공개</p><h2>스킬 4개·플러그인 4개·MCP 5개를 소개합니다</h2><p>총 ${records.length}개 도구의 업무 용도, 공식 출처, 준비물과 첫 요청 예시를 정리했습니다. 검색으로 발견한 ${Number(manifest.stats.citedUniqueVideoCount)}개 영상·${Number(manifest.stats.citedUniqueChannelCount)}개 채널의 공개 소개를 대조했습니다.</p><div class="ai-update-groups">${TYPES.map((type) => `<div><h3>${TYPE_LABELS[type]}</h3><ul>${records.filter((record) => record.type === type).map((record) => `<li><a href="/ai-tools/${escapeHtml(record.slug)}/">${escapeHtml(record.name)}</a></li>`).join("")}</ul></div>`).join("")}</div><p class="ai-note">이 날짜는 자료 확인과 안내 정리의 기준일입니다. 각 제작사가 같은 날 도구를 업데이트했다는 뜻은 아닙니다.</p></section>
  <section><h2>근거를 읽는 방법</h2><dl class="ai-facts"><div><dt>확인한 내용</dt><dd>영상 제목·설명·챕터·일부 공개 전사와 공식 배포 자료를 대조했습니다.</dd></div><div><dt>표본 범위</dt><dd>영어 영상 중심이며 일부 다른 언어 자료를 포함합니다. 유튜브 전체 인기순위나 성능 순위가 아닙니다.</dd></div><div><dt>반복 언급</dt><dd>12개는 같은 도구의 반복 언급이며 PPTX는 공개 구현과 내장 기능을 구분한 스킬 계열 보완 항목입니다.</dd></div><div><dt>날짜 예외</dt><dd>22개 영상은 우선 조사 기간(2025-11-14~2026-11-14)에 포함됩니다. 기간 밖 보완 영상 2개, 게시일 미확인 영상 1개는 각 상세 안내에 표시했습니다.</dd></div><div><dt>실행 확인</dt><dd>도구 설치·연결·대표 업무 수행은 아직 검증하지 않았습니다. ‘출처 확인’과 ‘실행 확인’을 구분합니다.</dd></div></dl></section>
  <section><h2>기존 자료도 유지합니다</h2><p>ppt-slide-planner의 설치 가이드와 기존 다운로드 주소는 그대로 이용할 수 있습니다.</p><a href="/guides/ppt-slide-planner-skill">기존 스킬 등록·사용 안내 →</a></section></article>`;
}

export async function buildAiTools({ repoRoot, outputDir, origin = "https://promptdeck.kr" }) {
  if (!repoRoot || !outputDir) throw new Error("buildAiTools requires repoRoot and outputDir");
  const siteOrigin = new URL(origin).origin;
  if (!["https:", "http:"].includes(new URL(siteOrigin).protocol)) throw new Error("Invalid site origin");
  const contentDir = path.join(repoRoot, "content", "ai-tools");
  const manifest = JSON.parse(await fs.readFile(path.join(contentDir, "_catalog.json"), "utf8"));
  const records = [];
  for (const type of TYPES) {
    for (const entry of array(manifest.groups?.[type])) {
      if (!/^[a-z0-9-]+\.json$/u.test(entry.file)) throw new Error("Invalid catalog filename");
      const record = JSON.parse(await fs.readFile(path.join(contentDir, entry.file), "utf8"));
      if (record.type !== type || !/^[a-z0-9-]+$/u.test(record.slug) || RESERVED_SLUGS.has(record.slug)) throw new Error("Invalid catalog item");
      if (!record.name || !record.outcome || !record.starterPrompt) throw new Error(`Incomplete catalog item: ${record.slug}`);
      if (records.some((item) => item.slug === record.slug)) throw new Error(`Duplicate catalog slug: ${record.slug}`);
      records.push(record);
    }
  }
  if (!records.length) throw new Error("AI tool catalog is empty");
  const pages = [];
  async function writePage(route, title, description, active, body) {
    const relativePath = route.slice(1) + "index.html";
    const filename = path.join(outputDir, relativePath);
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, documentPage({ title, description, route, origin: siteOrigin, active, body }), "utf8");
    pages.push({ path: relativePath, url: siteOrigin + route, title, description, modifiedAt: manifest.researchedAt });
  }
  await writePage("/ai-tools/", "AI 업무 도구", "업무에 바로 쓰는 스킬·플러그인·MCP 13개를 비교하고 공식 설치·연결 안내와 첫 요청 예시를 확인하세요.", "catalog", catalog(records, manifest));
  for (const record of records) await writePage(`/ai-tools/${record.slug}/`, `${record.name} 사용 안내`, record.outcome, "detail", detail(record, records));
  await writePage("/ai-tools/start/", "AI 업무 도구 처음 시작하기", "스킬·플러그인·MCP의 차이와 사용환경별 설치·연결·첫 요청 순서를 알아보세요.", "start", startPage());
  await writePage("/ai-tools/workflows/", "AI 도구 업무별 활용법", "자료 조사·발표자료·행사 홍보·주간 업무 정리에 AI 도구를 적용하는 순서를 살펴보세요.", "workflows", workflowsPage());
  await writePage("/ai-tools/updates/", "AI 업무 도구 업데이트 소식", "PromptDeck AI 업무 도구 목록의 새 소개, 안내 변경과 자료 확인 범위를 확인하세요.", "updates", updatesPage(records, manifest));
  return { pages, itemCount: records.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const outputDir = path.resolve(process.argv[2] || path.join(repoRoot, "dist-static"));
  const result = await buildAiTools({ repoRoot, outputDir });
  console.log(`AI tools: ${result.itemCount} items, ${result.pages.length} pages`);
}
