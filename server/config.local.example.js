// Copy this file to server/config.local.js if you prefer local hardcoded settings.
// server/config.local.js is ignored by git.
//
// Current implementation reads environment variables first:
//   IMAGE_PROVIDER=gemini
//   GEMINI_API_KEY=your_api_key
//   GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview

export const localConfig = {
  imageProvider: "gemini",
  googleApiKey: "PASTE_GOOGLE_API_KEY_HERE",
  imageModel: "gemini-3.1-flash-image-preview",
};

