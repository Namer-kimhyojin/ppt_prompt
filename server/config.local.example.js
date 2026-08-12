// Copy this file to server/config.local.js if you prefer local hardcoded settings.
// server/config.local.js is ignored by git.
//
// Current implementation reads environment variables first:
//   IMAGE_PROVIDER=google
//   GEMINI_API_KEY=your_api_key
//   GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview

export const localConfig = {
  imageProvider: "mock",
  publicBaseUrl: "http://localhost:4173",
  trustProxy: false,
  secureCookies: false,
  authEnabled: false,
  allowSignups: false,
  // Public apps can enable only the administrator mode with a strong key of 12+ characters.
  adminAccessKey: "",
  outputRetentionDays: 30,
  auditRetentionDays: 365,
  legal: {
    operatorName: "",
    address: "",
    privacyOfficer: "",
    privacyEmail: "",
    privacyPhone: "",
    smtpProvider: "",
  },
};
