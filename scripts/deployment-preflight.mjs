import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const envArg = process.argv.find((arg) => arg.startsWith("--env="));
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
const envPath = path.resolve(repoRoot, envArg ? envArg.slice(6) : ".env");
const target = targetArg ? targetArg.slice(9).toLowerCase() : "docker";
const errors = [];
const warnings = [];

function addError(message) { errors.push(message); }
function addWarning(message) { warnings.push(message); }

function parseEnv(source) {
  const result = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    result[match[1]] = value;
  }
  return result;
}

function isPlaceholder(value) {
  return !value || /example\.com|change_to|replace|your[-_ ]|운영자 또는|실제 사업장|책임자 성명|사용 중인 메일/i.test(value);
}

function passwordProblem(password, username) {
  if (!password || password.length < 12) return "12자 이상이어야 합니다.";
  const categories = [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  if (categories < 3) return "영문 대문자·소문자·숫자·특수문자 중 3종 이상을 포함해야 합니다.";
  if (/change|replace|example|password/i.test(password)) return "예시·변경 안내 문구를 포함할 수 없습니다.";
  if (username && password.toLowerCase().includes(username.toLowerCase())) return "관리자 아이디를 포함할 수 없습니다.";
  return "";
}

function requireValue(env, name, label = name) {
  if (isPlaceholder(env[name])) addError(`${label}: 실제 값을 설정하세요.`);
}

function requireTrue(env, name, reason) {
  if (env[name] !== "true") addError(`${name}=true: ${reason}`);
}

function checkFile(relativePath) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) addError(`필수 파일 누락: ${relativePath}`);
}

if (!fs.existsSync(envPath)) {
  addError(".env 파일이 없습니다. .env.example을 복사하고 실제 운영 정보를 입력하세요.");
}

const env = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, "utf8")) : {};

if (!["docker", "native"].includes(target)) {
  addError("--target은 docker 또는 native여야 합니다.");
}

requireValue(env, "PROMPTDECK_PUBLIC_BASE_URL", "HTTPS 공개 URL");
if (env.PROMPTDECK_PUBLIC_BASE_URL && !isPlaceholder(env.PROMPTDECK_PUBLIC_BASE_URL)) {
  try {
    const url = new URL(env.PROMPTDECK_PUBLIC_BASE_URL);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
      addError("PROMPTDECK_PUBLIC_BASE_URL은 인증정보·쿼리·해시가 없는 HTTPS 주소여야 합니다.");
    }
  } catch {
    addError("PROMPTDECK_PUBLIC_BASE_URL 형식이 올바르지 않습니다.");
  }
}

const authEnabled = env.PROMPTDECK_AUTH_ENABLED !== "false";
if (authEnabled) {
  requireValue(env, "PROMPTDECK_BOOTSTRAP_ADMIN_USERNAME", "최초 관리자 아이디");
  requireValue(env, "PROMPTDECK_BOOTSTRAP_ADMIN_PASSWORD", "최초 관리자 비밀번호");
  const passwordIssue = passwordProblem(env.PROMPTDECK_BOOTSTRAP_ADMIN_PASSWORD, env.PROMPTDECK_BOOTSTRAP_ADMIN_USERNAME);
  if (!isPlaceholder(env.PROMPTDECK_BOOTSTRAP_ADMIN_PASSWORD) && passwordIssue) addError(`최초 관리자 비밀번호: ${passwordIssue}`);
}
requireValue(env, "PROMPTDECK_OPERATOR_NAME", "운영자명");
requireValue(env, "PROMPTDECK_OPERATOR_ADDRESS", "운영자 주소");
requireValue(env, "PROMPTDECK_PRIVACY_OFFICER", "개인정보 보호책임자");
requireValue(env, "PROMPTDECK_PRIVACY_EMAIL", "개인정보 문의 이메일");
if (env.PROMPTDECK_PRIVACY_EMAIL && !isPlaceholder(env.PROMPTDECK_PRIVACY_EMAIL) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.PROMPTDECK_PRIVACY_EMAIL)) {
  addError("PROMPTDECK_PRIVACY_EMAIL 형식이 올바르지 않습니다.");
}

const outputRetention = Number(env.PROMPTDECK_OUTPUT_RETENTION_DAYS || 30);
const auditRetention = Number(env.PROMPTDECK_AUDIT_RETENTION_DAYS || 365);
if (!Number.isInteger(outputRetention) || outputRetention < 1 || outputRetention > 365) addError("생성물 보존기간은 1~365일 정수로 설정하세요.");
if (!Number.isInteger(auditRetention) || auditRetention < 30 || auditRetention > 3650) addError("감사기록 보존기간은 30~3650일 정수로 설정하세요.");

const providerAlias = String(env.IMAGE_PROVIDER || "mock").toLowerCase();
const provider = providerAlias === "gemini" ? "google" : providerAlias;
if (!["mock", "google", "openai", "pollinations"].includes(provider)) addError("IMAGE_PROVIDER는 mock, google, openai, pollinations 중 하나여야 합니다.");
if (provider !== "mock") requireTrue(env, "PROMPTDECK_AI_DATA_TRANSFER_CONFIRMED", "외부 AI 국외 이전 고지와 법적 근거를 확인해야 합니다.");
if (provider === "google") {
  requireValue(env, "GEMINI_API_KEY", "Google Gemini API 키");
  requireTrue(env, "PROMPTDECK_GOOGLE_PAID_SERVICE_CONFIRMED", "Google 유료 서비스 데이터 처리 조건 확인이 필요합니다.");
  if (/preview/i.test(env.GEMINI_IMAGE_MODEL || "") && env.PROMPTDECK_ALLOW_PREVIEW_MODELS !== "true") {
    addError("Preview Google 모델을 쓰려면 PROMPTDECK_ALLOW_PREVIEW_MODELS=true로 명시 확인하세요.");
  }
}
if (provider === "openai") requireValue(env, "OPENAI_API_KEY", "OpenAI API 키");
if (provider === "pollinations") requireTrue(env, "PROMPTDECK_ALLOW_POLLINATIONS", "처리 위치와 보존정책 확인 후에만 허용할 수 있습니다.");

if (authEnabled && env.PROMPTDECK_ALLOW_SIGNUPS === "true") {
  requireValue(env, "SMTP_HOST", "SMTP 서버");
  requireValue(env, "SMTP_FROM", "인증메일 발신자");
  requireValue(env, "PROMPTDECK_SMTP_PROVIDER", "개인정보 처리방침의 SMTP 제공자");
  if (!env.SMTP_USER || !env.SMTP_PASS) addWarning("SMTP_USER/SMTP_PASS가 비어 있습니다. 무인증 내부 SMTP가 아니라면 인증정보가 필요합니다.");
  if (env.SMTP_REQUIRE_TLS !== "true") addError("회원가입을 사용하면 SMTP_REQUIRE_TLS=true로 설정하세요.");
}

if (target === "native") {
  if (env.NODE_ENV !== "production" && env.PROMPTDECK_DEPLOYMENT_MODE !== "production") addError("네이티브 배포는 NODE_ENV=production을 설정하세요.");
  requireTrue(env, "PROMPTDECK_SECURE_COOKIES", "HTTPS 로그인 쿠키 보호가 필요합니다.");
  requireTrue(env, "PROMPTDECK_TRUST_PROXY", "신뢰하는 리버스 프록시 바로 뒤에서만 설정하세요.");
}

if (target === "docker") {
  const composePath = path.join(repoRoot, "docker-compose.yml");
  checkFile("docker-compose.yml");
  if (fs.existsSync(composePath)) {
    const compose = fs.readFileSync(composePath, "utf8");
    if (!compose.includes('127.0.0.1:4173:4173')) addError("Docker 포트가 127.0.0.1에만 바인딩되어 있지 않습니다.");
    if (!compose.includes('PROMPTDECK_SECURE_COOKIES: "true"')) addError("Docker Secure 쿠키 설정이 누락되었습니다.");
    if (!compose.includes('PROMPTDECK_TRUST_PROXY: "true"')) addError("Docker 신뢰 프록시 설정이 누락되었습니다.");
  }
  const docker = spawnSync("docker", ["version"], { stdio: "ignore" });
  if (docker.status !== 0) addWarning("현재 장치에서 Docker를 실행할 수 없습니다. NAS/배포 서버에서 docker compose 검증이 필요합니다.");
}

for (const file of [
  "privacy.html", "terms.html", "ai-policy.html", "copyright-policy.html", "third-party-notices.html",
  "server/security.js", "server/data-governance.js", "scripts/security-smoke-test.mjs",
]) checkFile(file);

const ignorePath = path.join(repoRoot, ".gitignore");
if (!fs.existsSync(ignorePath) || !/(^|\n)\.env(\r?\n|$)/.test(fs.readFileSync(ignorePath, "utf8"))) {
  addError(".env가 .gitignore에 등록되어 있지 않습니다.");
}

if (fs.existsSync(envPath) && process.platform !== "win32") {
  const mode = fs.statSync(envPath).mode & 0o777;
  if ((mode & 0o077) !== 0) addWarning(".env 권한을 chmod 600으로 제한하는 것을 권장합니다.");
}

console.log("PromptDeck 운영 배포 사전점검");
console.log(`대상: ${target} / 환경파일: ${path.relative(repoRoot, envPath) || ".env"}`);
for (const message of errors) console.log(`[실패] ${message}`);
for (const message of warnings) console.log(`[주의] ${message}`);
if (errors.length) {
  console.log(`결과: 배포 중단 (${errors.length}개 실패, ${warnings.length}개 주의)`);
  process.exitCode = 1;
} else {
  console.log(`결과: 사전점검 통과 (${warnings.length}개 주의)`);
}
