const COLOR_NAME_MAP = {
  "#ffffff": "pure white",
  "#000000": "true black",
  "#1a1a2e": "deep midnight navy",
  "#16213e": "dark indigo navy",
  "#7c4dff": "electric violet",
  "#e94560": "crimson red",
  "#ffd700": "bright gold yellow",
};

function replaceHexCodesWithNames(text) {
  if (!text) return "";
  return text.replace(/#[0-9a-fA-F]{6}/g, (hex) => {
    const h = hex.toLowerCase();
    return COLOR_NAME_MAP[h] || h || "custom color";
  });
}

function convertAvoidToPositive(avoidText) {
  if (!avoidText) return "";
  let processed = avoidText;
  processed = processed.replace(/avoid\s+losing\s+the\s+original\s+style\s+identity\s+from\s+the\s+source\s+concept\.?/gi, "Maintain the original style identity of the source concept.");
  processed = processed.replace(/avoid\s+([^,.;]+)/gi, (match, p1) => {
    return `maintain a clean design by ensuring there is no ${p1.trim()}`;
  });
  return processed;
}

function sanitizePromptForImagen(text) {
  if (!text) return "";
  
  let processedText = replaceHexCodesWithNames(text);
  let lines = processedText.split(/\r?\n/);
  let keptLines = [];
  
  for (let line of lines) {
    let trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const header = trimmed.slice(1, -1);
      const parts = header.split(/\s*[\/|·]\s*/);
      const englishHeader = parts.find(p => !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(p)) || header;
      keptLines.push(`Regarding ${englishHeader.trim()}:`);
      continue;
    }

    if (trimmed.startsWith("- 절대 금지:") || trimmed.startsWith("- Strictly avoid:")) {
      const token = trimmed.replace(/^-\s*(절대 금지|Strictly avoid):\s*/i, "");
      keptLines.push(`• Maintain a clean design without: ${convertAvoidToPositive(token)}`);
      continue;
    }
    
    if (trimmed.toLowerCase().includes("avoid ")) {
      keptLines.push(`• ${convertAvoidToPositive(trimmed.replace(/^-\s*/, ""))}`);
      continue;
    }

    if (/벡터급 선명도로|vector-quality sharpness|안티에일리어싱|anti-aliasing/i.test(trimmed)) {
      keptLines.push("• Ensure clean visual backdrop spaces for overlay text.");
      continue;
    }
    if (/실제 존재하는 기업|Do not invent or imitate real company/i.test(trimmed)) {
      keptLines.push("• Leave logo zones as empty neutral placeholders.");
      continue;
    }

    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(trimmed)) {
      const quotes = [];
      let placeholderText = trimmed.replace(/"([^"]*)"/g, (match, p1) => {
        quotes.push(p1);
        return `__QUOTE_PLACEHOLDER_${quotes.length - 1}__`;
      });

      if (/ko:\s*(.*?)\s*[\/|·]?\s*en:\s*(.*)/i.test(placeholderText)) {
        const match = placeholderText.match(/en:\s*(.*)/i);
        if (match) {
          placeholderText = "• " + match[1].trim();
        }
      } else {
        const parts = placeholderText.split(/\s*[\/|·|—|-]\s*/);
        const englishParts = parts.filter(p => !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(p));
        if (englishParts.length > 0) {
          placeholderText = englishParts.join(" ").trim();
        } else {
          if (quotes.length === 0) continue;
          placeholderText = "";
        }
      }

      trimmed = placeholderText.replace(/__QUOTE_PLACEHOLDER_(\d+)__/g, (match, p1) => {
        return `"${quotes[parseInt(p1, 10)]}"`;
      });
    }

    trimmed = trimmed.replace(/^[-•]\s*/, "").trim();
    if (!trimmed || (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(trimmed) && !/"[^"]*[ㄱ-ㅎ|ㅏ-ㅣ|가-힣][^"]*"/.test(trimmed))) {
      continue;
    }

    keptLines.push("• " + trimmed);
  }
  
  return keptLines.join("\n");
}

// RPG 던전 DALL-E 스타일 구조화 프롬프트 대리 실험
const sampleDallePrompt = `
[Visual Anatomy]
- Concept name: Dark Fantasy RPG / game — 어둡고 극적인 판타지. 마법 룬과 던전 분위기. 볼류메트릭 포그.
- Category: game
- Visual DNA: Dark Fantasy RPG / game — 어둡고 극적인 판타지. 마법 룬과 던전 분위기. 볼류메트릭 포그.
- Shape language: dramatic chiaroscuro lighting, glowing magical runes, stone dungeon atmosphere, volumetric fog
- Texture / rendering: pixel art style
- Lighting / mood: dark fantasy RPG illustration

[Color System]
- Palette roles: Use the selected concept palette: primary #1a1a2e, secondary #16213e, accent #7c4dff, highlight #e94560, support #ffd700.
`;

console.log("=== ORIGINAL ===");
console.log(sampleDallePrompt);
console.log("\n=== SANITIZED ===");
console.log(sanitizePromptForImagen(sampleDallePrompt));
