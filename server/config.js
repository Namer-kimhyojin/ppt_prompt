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
const requestedImageProvider = String(process.env.IMAGE_PROVIDER || localConfig.imageProvider || "mock").toLowerCase();
const normalizedImageProvider = requestedImageProvider === "gemini" ? "google" : requestedImageProvider;
const authEnabled = process.env.PROMPTDECK_AUTH_ENABLED !== undefined
  ? process.env.PROMPTDECK_AUTH_ENABLED !== "false"
  : localConfig.authEnabled !== false;
const rawAdminAccessKey = process.env.PROMPTDECK_ADMIN_ACCESS_KEY !== undefined
  ? process.env.PROMPTDECK_ADMIN_ACCESS_KEY
  : localConfig.adminAccessKey || "";
const adminAccessKey = String(rawAdminAccessKey).trim();

export const config = {
  // 기본은 로컬 PC와 동일 LAN에서 접속할 수 있도록 모든 IPv4 인터페이스에서 수신한다.
  host: process.env.PROMPTDECK_HOST || "0.0.0.0",
  port: Number(process.env.PROMPTDECK_PORT || 4173),
  repoRoot,
  // 저장 폴더도 환경변수로 분리 가능(예: NAS 볼륨 마운트 경로).
  outputDir: process.env.PROMPTDECK_OUTPUT_DIR
    ? path.resolve(process.env.PROMPTDECK_OUTPUT_DIR)
    : path.join(repoRoot, "outputs"),
  trustProxy: process.env.PROMPTDECK_TRUST_PROXY === "true" || localConfig.trustProxy === true,
  secureCookies: process.env.PROMPTDECK_SECURE_COOKIES === "true" || localConfig.secureCookies === true,
  publicBaseUrl: process.env.PROMPTDECK_PUBLIC_BASE_URL || localConfig.publicBaseUrl || "",
  authEnabled,
  allowSignups: authEnabled && (process.env.PROMPTDECK_ALLOW_SIGNUPS === "true" || localConfig.allowSignups === true),
  adminModeEnabled: adminAccessKey.length >= 12,
  adminAccessKey,
  bootstrapAdminUsername: process.env.PROMPTDECK_BOOTSTRAP_ADMIN_USERNAME || "",
  bootstrapAdminPassword: process.env.PROMPTDECK_BOOTSTRAP_ADMIN_PASSWORD || "",
  outputRetentionDays: Number(process.env.PROMPTDECK_OUTPUT_RETENTION_DAYS || localConfig.outputRetentionDays || 30),
  auditRetentionDays: Number(process.env.PROMPTDECK_AUDIT_RETENTION_DAYS || localConfig.auditRetentionDays || 365),
  maxJsonBodyBytes: Number(process.env.PROMPTDECK_MAX_JSON_BODY_BYTES || localConfig.maxJsonBodyBytes || 1024 * 1024),
  maxImageBytes: Number(process.env.PROMPTDECK_MAX_IMAGE_BYTES || localConfig.maxImageBytes || 8 * 1024 * 1024),
  deploymentMode: process.env.NODE_ENV === "production" || process.env.PROMPTDECK_DEPLOYMENT_MODE === "production",
  allowPollinations: process.env.PROMPTDECK_ALLOW_POLLINATIONS === "true" || localConfig.allowPollinations === true,
  allowPreviewModels: process.env.PROMPTDECK_ALLOW_PREVIEW_MODELS === "true" || localConfig.allowPreviewModels === true,
  googlePaidServiceConfirmed: process.env.PROMPTDECK_GOOGLE_PAID_SERVICE_CONFIRMED === "true" || localConfig.googlePaidServiceConfirmed === true,
  aiDataTransferConfirmed: process.env.PROMPTDECK_AI_DATA_TRANSFER_CONFIRMED === "true" || localConfig.aiDataTransferConfirmed === true,
  unsplashDataTransferConfirmed: process.env.PROMPTDECK_UNSPLASH_DATA_TRANSFER_CONFIRMED === "true" || localConfig.unsplashDataTransferConfirmed === true,

  // Local MVP only. Move these values to environment variables before service deployment.
  imageProvider: normalizedImageProvider,
  googleApiKey: process.env.GEMINI_API_KEY || localConfig.googleApiKey || "",
  googleProjectId: process.env.GOOGLE_PROJECT_ID || localConfig.googleProjectId || "",
  googleLocation: process.env.GOOGLE_LOCATION || localConfig.googleLocation || "us-central1",
  imageModel: process.env.GEMINI_IMAGE_MODEL || localConfig.imageModel || "gemini-2.0-flash-preview-image-generation",
  openaiApiKey: process.env.OPENAI_API_KEY || localConfig.openaiApiKey || "",
  openaiImageModel: process.env.OPENAI_IMAGE_MODEL || localConfig.openaiImageModel || "gpt-image-2",
  openaiImageQuality: process.env.OPENAI_IMAGE_QUALITY || localConfig.openaiImageQuality || "medium",

  // SMTP 이메일 설정 (이메일 인증에 사용). config.local.js 또는 환경변수로 지정.
  smtp: {
    host: process.env.SMTP_HOST || localConfig.smtp?.host || "",
    port: Number(process.env.SMTP_PORT || localConfig.smtp?.port || 587),
    secure: (process.env.SMTP_SECURE === "true") || localConfig.smtp?.secure || false,
    requireTls: process.env.SMTP_REQUIRE_TLS !== "false" && localConfig.smtp?.requireTls !== false,
    user: process.env.SMTP_USER || localConfig.smtp?.user || "",
    pass: process.env.SMTP_PASS || localConfig.smtp?.pass || "",
    from: process.env.SMTP_FROM || localConfig.smtp?.from || "",
  },

  // 아래 정보는 개인정보 처리방침과 서비스 하단에 공개된다.
  // 공개 배포 전 환경변수로 실제 운영자 정보를 반드시 입력한다.
  legal: {
    operatorName: process.env.PROMPTDECK_OPERATOR_NAME || localConfig.legal?.operatorName || "",
    representativeName: process.env.PROMPTDECK_REPRESENTATIVE_NAME || localConfig.legal?.representativeName || "",
    businessNumber: process.env.PROMPTDECK_BUSINESS_NUMBER || localConfig.legal?.businessNumber || "",
    address: process.env.PROMPTDECK_OPERATOR_ADDRESS || localConfig.legal?.address || "",
    privacyOfficer: process.env.PROMPTDECK_PRIVACY_OFFICER || localConfig.legal?.privacyOfficer || "",
    privacyEmail: process.env.PROMPTDECK_PRIVACY_EMAIL || localConfig.legal?.privacyEmail || "",
    privacyPhone: process.env.PROMPTDECK_PRIVACY_PHONE || localConfig.legal?.privacyPhone || "",
    smtpProvider: process.env.PROMPTDECK_SMTP_PROVIDER || localConfig.legal?.smtpProvider || "",
    serviceRegion: process.env.PROMPTDECK_SERVICE_REGION || localConfig.legal?.serviceRegion || "대한민국",
  },

};

config.useMockImageGeneration = config.imageProvider === "mock";
config.usePollinationsImageGeneration = config.imageProvider === "pollinations";
