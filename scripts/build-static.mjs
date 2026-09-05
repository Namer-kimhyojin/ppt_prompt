import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.resolve(repoRoot, "dist-static");
const configArg = process.argv.find((arg) => arg.startsWith("--config="));
const configPath = path.resolve(repoRoot, configArg ? configArg.slice(9) : "static-deploy.json");
const allowTestConfig = process.argv.includes("--allow-test-config");
const profileBuild = process.argv.includes("--profile");
let profileMark = Date.now();
const profileStages = [];

function markProfile(stage) {
  if (!profileBuild) return;
  const now = Date.now();
  profileStages.push({ stage, elapsedMs: now - profileMark });
  profileMark = now;
}

if (path.dirname(outputDir) !== repoRoot || path.basename(outputDir) !== "dist-static") {
  throw new Error("정적 빌드 출력 경로가 안전하지 않습니다.");
}

function placeholder(value) {
  return !value || /example\.com|실제 운영자|실제 .*주소|책임자 성명|테스트 운영자|\.test$/i.test(String(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeScriptReference(html, scriptPath) {
  const pattern = new RegExp(
    `^[\\t ]*<script\\s+src=(["'])${escapeRegExp(scriptPath)}(?:\\?[^"']*)?\\1\\s*></script>[\\t ]*(?:\\r?\\n)?`,
    "m",
  );
  const next = html.replace(pattern, "");
  if (next === html) throw new Error(`정적 빌드에서 제거할 스크립트 참조를 찾지 못했습니다: ${scriptPath}`);
  return next;
}

let deployConfig;
try {
  deployConfig = JSON.parse(await fs.readFile(configPath, "utf8"));
} catch {
  throw new Error(`${path.relative(repoRoot, configPath)} 파일이 없습니다. static-deploy.example.json을 복사하고 실제 공개 정보를 입력하세요.`);
}

for (const key of ["operatorName", "privacyOfficer", "privacyEmail"]) {
  if (!allowTestConfig && placeholder(deployConfig[key])) {
    throw new Error(`정적 배포 설정 ${key}에 실제 공개 정보를 입력하세요.`);
  }
  if (!String(deployConfig[key] || "").trim()) {
    throw new Error(`정적 배포 설정 ${key} 값이 비어 있습니다.`);
  }
}
if (!allowTestConfig && deployConfig.operatorAddress && placeholder(deployConfig.operatorAddress)) {
  throw new Error("정적 배포 설정 operatorAddress에는 실제 공개 주소를 입력하거나 빈 값으로 두세요.");
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deployConfig.privacyEmail)) {
  throw new Error("정적 배포 개인정보 문의 이메일 형식이 올바르지 않습니다.");
}

function createLimiter(maxConcurrent) {
  let active = 0;
  const queue = [];
  const schedule = () => {
    while (active < maxConcurrent && queue.length) {
      const { task, resolve, reject } = queue.shift();
      active += 1;
      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          active -= 1;
          schedule();
        });
    }
  };
  return (task) => new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    schedule();
  });
}

const removeLimited = createLimiter(32);
const copyLimited = createLimiter(48);
const statLimited = createLimiter(64);

async function clearDirectory(directory) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  const childDirectories = [];
  await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await clearDirectory(fullPath);
      childDirectories.push(fullPath);
      return;
    }
    await removeLimited(() => fs.rm(fullPath, { force: true, maxRetries: 3, retryDelay: 50 }));
  }));
  for (const childDirectory of childDirectories) {
    await fs.rmdir(childDirectory);
  }
}

await clearDirectory(outputDir);
await fs.mkdir(outputDir, { recursive: true });
markProfile("clear-output");

const skippedSuffixes = new Set([".bak", ".map", ".md", ".log", ".ps1", ".mjs", ".ts"]);
const excludedSourceFiles = new Set([
  "src/account-settings.js",
  "src/adsense-config.js",
  "src/adsense.js",
  "src/generation-queue.js",
  "src/image-generation-client.js",
  "src/slide-image-generation.js",
  "styles/adsense.css",
]);
const maxAssetBytes = 25 * 1024 * 1024;

async function copyTree(source, destination) {
  const stat = await fs.stat(source);
  if (stat.isDirectory()) {
    await fs.mkdir(destination, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });
    await Promise.all(entries
      .filter((entry) => !entry.name.startsWith(".") && entry.name !== "node_modules")
      .map((entry) => copyTree(path.join(source, entry.name), path.join(destination, entry.name))));
    return;
  }
  const relativeSource = path.relative(repoRoot, source).replaceAll("\\", "/");
  if (excludedSourceFiles.has(relativeSource)) return;
  if (relativeSource.startsWith("assets/photo-transform-previews/") && path.extname(source).toLowerCase() === ".png") return;
  if (skippedSuffixes.has(path.extname(source).toLowerCase())) return;
  if (stat.size > maxAssetBytes) throw new Error(`Cloudflare 개별 파일 제한(25MiB) 초과: ${path.relative(repoRoot, source)}`);
  await copyLimited(async () => {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  });
}

for (const directory of ["styles", "src", "assets"]) {
  await copyTree(path.join(repoRoot, directory), path.join(outputDir, directory));
  markProfile(`copy-${directory}`);
}
await copyTree(
  path.join(repoRoot, "static-pages", "guides"),
  path.join(outputDir, "guides"),
);
markProfile("copy-guides");
await copyTree(
  path.join(repoRoot, "outputs", "mixer_samples"),
  path.join(outputDir, "outputs", "mixer_samples"),
);
markProfile("copy-mixer-samples");

for (const filename of ["app.js"]) {
  await fs.copyFile(path.join(repoRoot, filename), path.join(outputDir, filename));
}

let adminHtml = await fs.readFile(path.join(repoRoot, "admin.html"), "utf8");
adminHtml = adminHtml.replace(
  "  <script src=\"src/auth.js\"></script>",
  "  <script>window.PROMPTDECK_STATIC_MODE = true;</script>\n  <script src=\"src/auth.js\"></script>",
);
await fs.writeFile(path.join(outputDir, "admin.html"), adminHtml, "utf8");

let indexHtml = await fs.readFile(path.join(repoRoot, "index.html"), "utf8");
const authStart = indexHtml.indexOf("  <!-- 인증 게이트:");
const authScriptStart = indexHtml.indexOf("  <script src=\"src/auth.js\"></script>", authStart);
const gateScriptStart = indexHtml.indexOf("  <script>", authScriptStart);
const gateScriptEnd = indexHtml.indexOf("  </script>", gateScriptStart);
if (authStart < 0 || authScriptStart < 0 || gateScriptStart < 0 || gateScriptEnd < 0) {
  throw new Error("index.html 인증 게이트 위치를 찾지 못했습니다.");
}
indexHtml = `${indexHtml.slice(0, authStart)}  <script>window.PROMPTDECK_STATIC_MODE = true;</script>\n${indexHtml.slice(gateScriptEnd + "  </script>".length + 1)}`;
for (const script of [
  "src/account-settings.js",
  "src/image-generation-client.js",
  "src/generation-queue.js",
  "src/slide-image-generation.js",
]) {
  indexHtml = removeScriptReference(indexHtml, script);
}
const designerConfigScript = "  <script src=\"src/designer-config-globals.js\"></script>";
if (!indexHtml.includes(designerConfigScript)) {
  throw new Error("정적 모드 스크립트 삽입 위치를 찾지 못했습니다.");
}
indexHtml = indexHtml.replace(
  designerConfigScript,
  `  <script src="src/static-mode.js"></script>\n${designerConfigScript}`,
);
await fs.writeFile(path.join(outputDir, "app.html"), indexHtml, "utf8");

const replacements = new Map([
  ["__OPERATOR_NAME__", escapeHtml(deployConfig.operatorName)],
  ["__PRIVACY_OFFICER__", escapeHtml(deployConfig.privacyOfficer)],
  ["__PRIVACY_EMAIL__", escapeHtml(deployConfig.privacyEmail)],
  ["__OPERATOR_ADDRESS_BLOCK__", deployConfig.operatorAddress
    ? `<br>운영자 주소: ${escapeHtml(deployConfig.operatorAddress)}`
    : ""],
  ["__OPERATOR_ADDRESS_TEXT__", deployConfig.operatorAddress
    ? `소재지: ${escapeHtml(deployConfig.operatorAddress)}, `
    : ""],
]);

for (const filename of ["home.html", "features.html", "about.html", "privacy.html", "terms.html", "ai-policy.html", "copyright-policy.html", "third-party-notices.html"]) {
  let source = await fs.readFile(path.join(repoRoot, "static-pages", filename), "utf8");
  for (const [token, value] of replacements) source = source.replaceAll(token, value);
  const outputName = filename === "home.html" ? "index.html" : filename;
  await fs.writeFile(path.join(outputDir, outputName), source, "utf8");
}

for (const filename of [
  "_headers",
  "_routes.json",
  "robots.txt",
  "sitemap.xml",
  "feed.xml",
  "indexnow-c0ffcaf8d345462bbcc8c7d3ae78acae.txt",
  "ads.txt",
  "404.html",
]) {
  await fs.copyFile(path.join(repoRoot, "static-pages", filename), path.join(outputDir, filename));
}
markProfile("write-generated-pages");

let fileCount = 0;
let totalBytes = 0;
async function measure(directory) {
  await Promise.all((await fs.readdir(directory, { withFileTypes: true })).map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await measure(fullPath);
    else {
      const stat = await statLimited(() => fs.stat(fullPath));
      fileCount += 1;
      totalBytes += stat.size;
    }
  }));
}
await measure(outputDir);
markProfile("measure-output");
if (fileCount > 20_000) throw new Error(`Cloudflare Pages 파일 제한 초과: ${fileCount}`);

console.log(`static build ready: ${fileCount} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB`);
if (profileBuild) console.log(`static build profile: ${profileStages.map(({ stage, elapsedMs }) => `${stage}=${elapsedMs}ms`).join(", ")}`);
