import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const localConfigPath = path.join(__dirname, "config.local.js");

async function loadLocalConfig() {
  try {
    await fs.access(localConfigPath);
    const module = await import(`file://${localConfigPath.replace(/\\/g, "/")}?t=${Date.now()}`);
    return module.localConfig || {};
  } catch {
    return {};
  }
}

const localConfig = await loadLocalConfig();

export const config = {
  // 기본은 로컬 전용(127.0.0.1). NAS/도커처럼 외부 접속이 필요하면
  // PROMPTDECK_HOST=0.0.0.0 환경변수로 모든 인터페이스에 바인딩한다.
  host: process.env.PROMPTDECK_HOST || "127.0.0.1",
  port: Number(process.env.PROMPTDECK_PORT || 4173),
  repoRoot,
  // 저장 폴더도 환경변수로 분리 가능(예: NAS 볼륨 마운트 경로).
  outputDir: process.env.PROMPTDECK_OUTPUT_DIR
    ? path.resolve(process.env.PROMPTDECK_OUTPUT_DIR)
    : path.join(repoRoot, "outputs"),

  // Local MVP only. Move these values to environment variables before service deployment.
  imageProvider: process.env.IMAGE_PROVIDER || localConfig.imageProvider || "mock",
  googleApiKey: process.env.GEMINI_API_KEY || localConfig.googleApiKey || "PASTE_GOOGLE_API_KEY_HERE",
  googleProjectId: process.env.GOOGLE_PROJECT_ID || localConfig.googleProjectId || "",
  googleLocation: process.env.GOOGLE_LOCATION || localConfig.googleLocation || "us-central1",
  imageModel: process.env.GEMINI_IMAGE_MODEL || localConfig.imageModel || "gemini-2.0-flash-preview-image-generation",
  openaiImageModel: process.env.OPENAI_IMAGE_MODEL || localConfig.openaiImageModel || "gpt-image-2",
  openaiImageQuality: process.env.OPENAI_IMAGE_QUALITY || localConfig.openaiImageQuality || "medium",
};

config.useMockImageGeneration = config.imageProvider === "mock";
config.usePollinationsImageGeneration = config.imageProvider === "pollinations";
