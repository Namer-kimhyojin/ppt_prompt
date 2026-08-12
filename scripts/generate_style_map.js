const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mixerPath = path.join(root, 'src', 'concept-mixer.js');
const conceptStylesPath = path.join(root, 'src', 'concept-styles.js');

function extractBlockFromFile(filePath, identifier, openChar) {
  const src = fs.readFileSync(filePath, 'utf8');
  const idx = src.indexOf(identifier);
  if (idx === -1) throw new Error('Identifier not found: ' + identifier);
  let start = src.indexOf(openChar, idx);
  if (start === -1) throw new Error('Open char not found after identifier ' + identifier);
  const closeChar = openChar === '[' ? ']' : '}';
  let depth = 0;
  let end = -1;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) throw new Error('Closing not found for ' + identifier);
  return src.substring(start, end + 1);
}

// Read and extract arrays
const mixerSrc = fs.readFileSync(mixerPath, 'utf8');
const mediumsBlock = extractBlockFromFile(mixerPath, 'const MIXER_MEDIUMS', '[');
const palettesBlock = extractBlockFromFile(mixerPath, 'const MIXER_PALETTES', '[');

// Extract existing STYLE_TO_PALETTE_MAP if present
let existingStyleMap = {};
const styleIdentifier = 'const STYLE_TO_PALETTE_MAP = window.STYLE_TO_PALETTE_MAP ||';
const styleIdx = mixerSrc.indexOf(styleIdentifier);
if (styleIdx !== -1) {
  const braceIdx = mixerSrc.indexOf('{', styleIdx);
  if (braceIdx !== -1) {
    let depth = 0; let end = -1;
    for (let i = braceIdx; i < mixerSrc.length; i++) {
      const ch = mixerSrc[i];
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      const objStr = mixerSrc.substring(braceIdx, end + 1);
      const tmpStylePath = path.join(root, 'tmp_style_map.js');
      fs.writeFileSync(tmpStylePath, 'module.exports = ' + objStr + ';', 'utf8');
      try { existingStyleMap = require(tmpStylePath); } catch (e) { existingStyleMap = {}; }
      try { fs.unlinkSync(tmpStylePath); } catch(e){}
    }
  }
}

// Save temp modules for mediums & palettes
const tmpMediumsPath = path.join(root, 'tmp_mixer_mediums.js');
const tmpPalettesPath = path.join(root, 'tmp_mixer_palettes.js');
fs.writeFileSync(tmpMediumsPath, 'module.exports = ' + mediumsBlock + ';', 'utf8');
fs.writeFileSync(tmpPalettesPath, 'module.exports = ' + palettesBlock + ';', 'utf8');

const MIXER_MEDIUMS = require(tmpMediumsPath);
const MIXER_PALETTES = require(tmpPalettesPath);

// Load concept styles (if present)
let CONCEPT_STYLES = [];
try {
  const csSrc = fs.readFileSync(conceptStylesPath, 'utf8');
  const csIdx = csSrc.indexOf('window.CONCEPT_STYLES');
  if (csIdx !== -1) {
    const csBlock = extractBlockFromFile(conceptStylesPath, 'window.CONCEPT_STYLES', '[');
    const tmpCsPath = path.join(root, 'tmp_concept_styles.js');
    fs.writeFileSync(tmpCsPath, 'module.exports = ' + csBlock + ';', 'utf8');
    CONCEPT_STYLES = require(tmpCsPath);
    try { fs.unlinkSync(tmpCsPath); } catch(e){}
  }
} catch (e) {
  CONCEPT_STYLES = [];
}

// Helper sets
const paletteIds = new Set(MIXER_PALETTES.map(p=>p.id));

function findPaletteIndexById(id) {
  for (let i=0;i<MIXER_PALETTES.length;i++) if (MIXER_PALETTES[i].id === id) return i;
  return -1;
}

// Keyword map (mirrors in-file heuristic)
const keywordMap = [
  { keys: ['pixel','voxel','sprite','retro','8bit','16bit','pixel-art','voxel'], palette: 'pal-lego' },
  { keys: ['lego','brick'], palette: 'pal-lego' },
  { keys: ['mario','nintendo'], palette: 'pal-mario' },
  { keys: ['roblox','roblo'], palette: 'pal-roblox' },
  { keys: ['mabinogi'], palette: 'pal-mabinogi' },
  { keys: ['webtoon','manhwa','korean webtoon'], palette: 'pal-webtoon' },
  { keys: ['chibi','kawaii','cute'], palette: 'pal-webtoon' },
  { keys: ['anime','manga','cel','cel shading','ghibli','studio ghibli'], palette: 'pal-anime-cinematic' },
  { keys: ['cinematic','film','movie','luts','color grading','cinematic'], palette: 'pal-film-grain' },
  { keys: ['flat','vector','bauhaus','duotone','pop art','popart','risograph','minimal'], palette: 'pal-canva' },
  { keys: ['watercolor','gouache','oil painting','oil','acrylic','painterly'], palette: 'pal-miricanvas' },
  { keys: ['neon','cyberpunk','holographic','glow'], palette: 'pal-cyber' },
  { keys: ['isometric','iso','lowpoly','low-poly','low poly'], palette: 'pal-canva' },
  { keys: ['bokeh','portrait','polaroid','vintage film','film grain','photorealistic'], palette: 'pal-film-grain' }
];

const CAT_TO_PALETTE_CATS = {
  tech3d: ['tech'],
  '3d': ['tech'],
  tech: ['tech'],
  game: ['energy','tech','soft'],
  pixel_adv: ['candy','soft'],
  analog: ['soft','nature'],
  graphic: ['soft','modern','graphic'],
  anime: ['photo','soft'],
  photo: ['photo'],
  craft: ['soft'],
  digital_paint: ['soft','modern'],
  arch: ['nature','soft','tech'],
  editorial: ['soft','photo'],
  official: ['soft','neutral'],
  modern: ['soft','modern'],
  nature: ['nature'],
  energy: ['energy']
};

function mapForMedium(med) {
  if (!med || !med.id) return null;
  // 1) explicit
  if (existingStyleMap && existingStyleMap[med.id] && paletteIds.has(existingStyleMap[med.id])) return existingStyleMap[med.id];
  if (existingStyleMap && existingStyleMap[med.nameEn] && paletteIds.has(existingStyleMap[med.nameEn])) return existingStyleMap[med.nameEn];
  if (existingStyleMap && existingStyleMap[med.nameKo] && paletteIds.has(existingStyleMap[med.nameKo])) return existingStyleMap[med.nameKo];

  // 2) concept styles
  try {
    const found = CONCEPT_STYLES.find(s => s.id === med.id || s.nameEn === med.nameEn || s.nameKo === med.nameKo || (s.tags && s.tags.includes(med.id)));
    if (found && Array.isArray(found.palette) && found.palette.length) {
      return `pal-style-${found.id}`;
    }
  } catch(e) {}

  // 3) keyword heuristics
  const text = [med.id, med.nameEn, med.nameKo, med.desc, med.prefix, med.suffix].filter(Boolean).join(' ').toLowerCase();
  for (const km of keywordMap) {
    for (const k of km.keys) {
      if (text.includes(k)) {
        if (paletteIds.has(km.palette)) return km.palette;
      }
    }
  }

  // 4) color hints overlap (if present)
  if (med.colorHints && Array.isArray(med.colorHints) && med.colorHints.length) {
    let best = null, bestScore = -1;
    MIXER_PALETTES.forEach(p => {
      const common = p.colors.filter(c => med.colorHints.includes(c)).length;
      if (common > bestScore) { bestScore = common; best = p; }
    });
    if (best && bestScore > 0) return best.id;
  }

  // 5) category mapping
  const cat = String(med.category || '').toLowerCase();
  const candidateCats = CAT_TO_PALETTE_CATS[cat] || [cat];
  for (const tryCat of candidateCats) {
    const p = MIXER_PALETTES.find(p => p.category === tryCat);
    if (p) return p.id;
  }

  // 6) fallback
  const fallback = MIXER_PALETTES.find(p => p.category === 'soft' || p.category === 'nature' || p.category === 'tech');
  if (fallback) return fallback.id;
  return MIXER_PALETTES[0] && MIXER_PALETTES[0].id;
}

const mapping = {};
for (const med of MIXER_MEDIUMS) {
  const pid = mapForMedium(med) || null;
  if (pid) mapping[med.id] = pid;
}

// Also include any explicit entries that map non-med ids (preserve user map)
for (const k of Object.keys(existingStyleMap || {})) {
  if (!mapping[k] && existingStyleMap[k] && paletteIds.has(existingStyleMap[k])) mapping[k] = existingStyleMap[k];
}

console.log(JSON.stringify(mapping, null, 2));

// cleanup tmp files
try { fs.unlinkSync(tmpMediumsPath); } catch(e){}
try { fs.unlinkSync(tmpPalettesPath); } catch(e){}

process.exit(0);
