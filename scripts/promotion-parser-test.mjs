import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

await import("../src/promotion-parser.js");

const parser = globalThis.PromptDeckPromotionParser;
assert.ok(parser, "promotion parser was not exposed");
assert.equal(parser.SCHEMA_VERSION, "promotion-source-parser/3.0");

const corpus = JSON.parse(await readFile(new URL("./fixtures/promotion-notice-reference-corpus.json", import.meta.url), "utf8"));
assert.equal(corpus.schemaVersion, "promotion-notice-reference-corpus/1.0");
assert.equal(corpus.cases.length, 8);
assert.equal(new Set(corpus.cases.map((item) => item.source.url)).size, corpus.cases.length, "reference sources must be unique");
assert.ok(new Set(corpus.cases.map((item) => item.institutionType)).size >= 7, "reference corpus must cover diverse institution formats");

function getPath(value, dottedPath) {
  return dottedPath.split(".").reduce((current, key) => current?.[key], value);
}

function assertGroundedNumbers(parsed, source, label) {
  const visibleNumericTokens = [
    parsed.headline,
    parsed.goal,
    parsed.audience,
    parsed.subheadline,
    parsed.bodyCopy,
    parsed.posterOffer,
    parsed.snsHook,
  ].join("\n").match(/\d[\d,.:%-]*/g) || [];
  const sourceNumericText = source.replace(/\s/g, "");
  visibleNumericTokens.forEach((token) => {
    const normalized = token.replace(/[,:%-]+$/g, "");
    assert.ok(sourceNumericText.includes(normalized), `${label}: visible numeric token was not grounded in source: ${token}`);
  });
}

for (const referenceCase of corpus.cases) {
  assert.ok(referenceCase.observedPatterns.length >= 2, `${referenceCase.id}: observed source patterns are missing`);
  const parsed = parser.parse(referenceCase.referenceText);
  assert.equal(parsed.schemaVersion, parser.SCHEMA_VERSION, `${referenceCase.id}: schema mismatch`);
  assert.equal(parsed.noticeType, referenceCase.expected.noticeType, `${referenceCase.id}: notice type mismatch`);
  assert.equal(parsed.headline, referenceCase.expected.headline, `${referenceCase.id}: headline mismatch`);
  Object.entries(referenceCase.expected.contains || {}).forEach(([path, tokens]) => {
    const actual = String(getPath(parsed, path) || "");
    tokens.forEach((token) => assert.ok(actual.includes(token), `${referenceCase.id}: ${path} is missing ${token}; actual=${actual}`));
  });
  Object.entries(referenceCase.expected.notContains || {}).forEach(([path, tokens]) => {
    const actual = String(getPath(parsed, path) || "");
    tokens.forEach((token) => assert.ok(!actual.includes(token), `${referenceCase.id}: ${path} unexpectedly contains ${token}; actual=${actual}`));
  });
  (referenceCase.expected.empty || []).forEach((path) => {
    assert.equal(String(getPath(parsed, path) || ""), "", `${referenceCase.id}: ${path} should be empty`);
  });
  assert.deepEqual(parser.parse(referenceCase.referenceText), parsed, `${referenceCase.id}: parser output must be deterministic`);
  assertGroundedNumbers(parsed, referenceCase.referenceText, referenceCase.id);
}

const labeledNotice = `2026년 경북 미래차 부품전환 지원사업 참여기업 모집
사업목적: 지역 자동차부품 기업의 미래차 전환과 사업화를 촉진합니다.
지원대상: 경상북도 소재 자동차부품 중소기업
접수기간: 2026. 8. 12.(수) ~ 2026. 9. 5.(토) 18:00
지원내용:
- 기업당 최대 2,000만원 사업화 지원
- 전문가 컨설팅 제공
신청방법: 온라인 신청 후 서류 제출
문의처: 기업지원팀 054-123-4567, future@example.kr
신청링크: https://example.kr/apply
주관기관: 샘플혁신지원센터`;

const labeled = parser.parse(labeledNotice);
assert.equal(labeled.noticeType, "support");
assert.equal(labeled.headline, "2026년 경북 미래차 부품전환 지원사업 참여기업 모집");
assert.equal(labeled.audience, "경상북도 소재 자동차부품 중소기업");
assert.match(labeled.analysis.facts.period, /2026\. 8\. 12/);
assert.match(labeled.analysis.facts.period, /2026\. 9\. 5/);
assert.match(labeled.bodyCopy, /2,000만원/);
assert.match(labeled.bodyCopy, /온라인 신청 후 서류 제출/);
assert.match(labeled.analysis.facts.contact, /054-123-4567/);
assert.match(labeled.analysis.facts.contact, /future@example\.kr/);
assert.equal(labeled.qrUrl, "https://example.kr/apply");
assert.equal(labeled.analysis.fields.audience.kind, "extracted");
assert.equal(labeled.analysis.fields.bodyCopy.kind, "summary");
assert.ok(labeled.analysis.fields.bodyCopy.evidence.length >= 4);
assert.ok(labeled.analysis.completeness >= 95);
assert.deepEqual(parser.parse(labeledNotice), labeled, "parser output must be deterministic");

const proseNotice = `2026 해솔 AI 전환 실무 세미나 참가자 모집
해솔지역 중소기업 실무자를 대상으로 생성형 AI 업무 활용법을 소개합니다.
행사는 2026년 8월 28일 14:00 샘플혁신지원센터 제1회의실에서 진행합니다.
참가자에게 실습 자료와 전문가 네트워킹을 제공합니다.
신청은 8월 25일까지 온라인 페이지 https://event.example.kr 에서 접수합니다.
문의 054-222-3333 / ai@event.example.kr`;

const prose = parser.parse(proseNotice);
assert.equal(prose.noticeType, "seminar");
assert.equal(prose.headline, "2026 해솔 AI 전환 실무 세미나 참가자 모집");
assert.match(prose.audience, /해솔지역 중소기업 실무자/);
assert.match(prose.analysis.facts.period, /8월 25일/);
assert.match(prose.analysis.facts.eventPeriod, /2026년 8월 28일/);
assert.match(prose.analysis.facts.place, /샘플혁신지원센터 제1회의실/);
assert.match(prose.analysis.facts.method, /온라인 페이지/);
assert.equal(prose.qrUrl, "https://event.example.kr");
assert.equal(prose.analysis.fields.goal.kind, "derived");
assert.equal(prose.analysis.fields.audience.kind, "inferred");
assert.ok(prose.analysis.fields.audience.evidence[0].includes("실무자"));

const tableNotice = `<div>[행사명]\t동해안 배터리 산업 포럼</div>
<div>참가 대상\t배터리 기업 재직자 및 연구자</div>
<div>행사 일시\t2026. 10. 7.(수) 13:30</div>
<div>개최 장소\t샘플컨벤션센터 그랜드홀</div>
<div>참가비\t무료</div>
<div>접수 URL\thttps://forum.example.kr/register</div>`;

const table = parser.parse(tableNotice);
assert.equal(table.headline, "동해안 배터리 산업 포럼");
assert.equal(table.audience, "배터리 기업 재직자 및 연구자");
assert.match(table.analysis.facts.eventPeriod, /2026\. 10\. 7/);
assert.match(table.analysis.facts.place, /샘플컨벤션센터 그랜드홀/);
assert.equal(table.qrUrl, "https://forum.example.kr/register");
assert.match(table.posterOffer, /무료/);

const compressed = parser.compress(labeled);
assert.match(compressed.bodyCopy, /2,000만원/);
assert.match(compressed.bodyCopy, /2026\. 9\. 5/);
assert.equal(compressed.analysis.parserVersion, parser.SCHEMA_VERSION);

const visibleNumericTokens = [
  labeled.headline,
  labeled.goal,
  labeled.audience,
  labeled.subheadline,
  labeled.bodyCopy,
  labeled.posterOffer,
  labeled.snsHook,
].join("\n").match(/\d[\d,.:%-]*/g) || [];
const sourceNumericText = labeledNotice.replace(/\s/g, "");
visibleNumericTokens.forEach((token) => {
  const normalized = token.replace(/[,:%-]+$/g, "");
  assert.ok(sourceNumericText.includes(normalized), `visible numeric token was not grounded in source: ${token}`);
});

const empty = parser.parse("   \n\n");
assert.equal(empty.headline, "");
assert.equal(empty.analysis.stats.recognizedFieldCount, 0);
assert.ok(empty.analysis.warnings.some((warning) => warning.includes("제목")));

console.log(`promotion parser tests passed: ${corpus.cases.length} institution-derived corpus cases, labeled, prose, table, grounding, compression, empty input`);
