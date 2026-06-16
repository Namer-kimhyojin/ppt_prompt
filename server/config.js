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
  host: "127.0.0.1",
  port: Number(process.env.PROMPTDECK_PORT || 4173),
  repoRoot,
  outputDir: path.join(repoRoot, "outputs"),

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
