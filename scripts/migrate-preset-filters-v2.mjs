import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const presetRoot = join(__dirname, '..', 'src', 'concept-mixer-presets');

const SUBJECT_GROUP_MAP = {
  steel: 'mfg',
  energy: 'mfg',
  materials: 'mfg',
  mobility: 'mfg',
  software: 'knowledge',
  bio: 'knowledge',
  finance: 'knowledge',
  tech_transfer: 'knowledge',
  public: 'public',
  policy: 'public',
  regional: 'public',
  networking: 'public',
  talent_cultivation: 'public',
  urban: 'urban',
  space: 'urban',
  brand: 'life',
  food: 'life',
  culture: 'life',
  education: 'life',
  health: 'life',
  creative: 'life',
  ocean: 'life',
  environment: 'future'
};

const SUBJECT_SCENE_MAP = {
  steel: 'facility',
  energy: 'facility',
  mobility: 'facility',
  regional: 'facility',
  bio: 'lab',
  materials: 'lab',
  software: 'service',
  finance: 'service',
  tech_transfer: 'service',
  public: 'service',
  policy: 'service',
  networking: 'people',
  talent_cultivation: 'people',
  brand: 'people',
  food: 'people',
  culture: 'people',
  education: 'people',
  health: 'people',
  creative: 'people',
  urban: 'space',
  space: 'space',
  ocean: 'nature',
  environment: 'nature'
};

const SUBJECT_USAGE_MAP = {
  steel: 'report',
  energy: 'report',
  software: 'report',
  bio: 'report',
  finance: 'report',
  materials: 'report',
  mobility: 'report',
  health: 'report',
  ocean: 'report',
  public: 'plan',
  policy: 'plan',
  regional: 'plan',
  tech_transfer: 'plan',
  talent_cultivation: 'plan',
  networking: 'plan',
  urban: 'plan',
  space: 'plan',
  education: 'plan',
  brand: 'promo',
  food: 'promo',
  culture: 'promo',
  creative: 'promo',
  environment: 'promo'
};

const MEDIUM_GROUP_MAP = {
  tech3d: 'render3d',
  arch: 'render3d',
  analog: 'graphic',
  graphic: 'graphic',
  trad: 'graphic',
  editorial: 'graphic',
  digital_paint: 'graphic',
  youtube_anim: 'graphic',
  photo: 'photo',
  nature_photo: 'photo',
  craft: 'craft',
  official: 'uiinfo',
  ui_ux: 'uiinfo',
  anime: 'experimental',
  game: 'experimental',
  pixel_adv: 'experimental',
  abstract: 'experimental'
};

const MEDIUM_TEXTURE_MAP = {
  tech3d: 'glossy',
  arch: 'clean',
  analog: 'textured',
  graphic: 'clean',
  trad: 'textured',
  editorial: 'glossy',
  digital_paint: 'textured',
  youtube_anim: 'clean',
  photo: 'real',
  nature_photo: 'real',
  craft: 'tactile',
  official: 'clean',
  ui_ux: 'clean',
  anime: 'vivid',
  game: 'vivid',
  pixel_adv: 'vivid',
  abstract: 'vivid'
};

const MEDIUM_USAGE_MAP = {
  tech3d: 'proposal',
  arch: 'proposal',
  analog: 'brand',
  graphic: 'brand',
  trad: 'brand',
  editorial: 'brand',
  digital_paint: 'brand',
  youtube_anim: 'explainer',
  photo: 'campaign',
  nature_photo: 'campaign',
  craft: 'campaign',
  official: 'proposal',
  ui_ux: 'explainer',
  anime: 'campaign',
  game: 'campaign',
  pixel_adv: 'campaign',
  abstract: 'brand'
};

const PALETTE_MOOD_BY_ID = {
  'pal-vintage': 'retro',
  'pal-vintage-navy': 'retro',
  'pal-film-grain': 'retro',
  'pal-anime-cinematic': 'retro',
  'pal-white-premium': 'luxury',
  'pal-tax-gold': 'luxury',
  'pal-court-navy': 'luxury',
  'pal-plum-velvet': 'luxury',
  'pal-tiffany': 'luxury',
  'pal-holographic': 'vivid',
  'pal-vivid-rainbow': 'festival',
  'pal-miami-vice': 'festival',
  'pal-disco-foil': 'festival',
  'pal-neon-sunset': 'festival',
  'pal-lego': 'festival',
  'pal-mario': 'festival',
  'pal-roblox': 'festival'
};

const PALETTE_MOOD_BY_CATEGORY = {
  tech: 'minimal',
  nature: 'natural',
  energy: 'vivid',
  soft: 'minimal',
  official: 'minimal',
  light_pastel: 'minimal',
  morning: 'minimal',
  nordic: 'minimal',
  candy: 'festival',
  warm_earth: 'natural',
  multicolor: 'festival',
  photo: 'minimal',
  modern: 'minimal'
};

const PALETTE_USAGE_BY_ID = {
  'pal-cyber': 'event',
  'pal-obsidian': 'corporate',
  'pal-quantum': 'event',
  'pal-aurora-neon': 'event',
  'pal-cybernetic-silver': 'corporate',
  'pal-deep-ai': 'corporate',
  'pal-matrix': 'event',
  'pal-film-grain': 'content',
  'pal-anime-cinematic': 'content',
  'pal-canva': 'corporate',
  'pal-miricanvas': 'brand',
  'pal-lego': 'event',
  'pal-mario': 'event',
  'pal-roblox': 'event',
  'pal-webtoon': 'content',
  'pal-bio-mint': 'corporate',
  'pal-smart-tech': 'corporate',
  'pal-mobility-orange': 'corporate',
  'pal-pitch-neon': 'event'
};

const PALETTE_USAGE_BY_CATEGORY = {
  tech: 'corporate',
  nature: 'brand',
  energy: 'event',
  soft: 'brand',
  official: 'corporate',
  light_pastel: 'content',
  morning: 'brand',
  nordic: 'corporate',
  candy: 'event',
  warm_earth: 'brand',
  multicolor: 'event',
  photo: 'content',
  modern: 'corporate'
};

const FILE_CONFIGS = {
  subjects: {
    fileName: 'subjects.js',
    shouldProcessBlock(blockText) {
      return blockText.includes('prompt:');
    },
    createState() {
      return { currentCategory: null };
    },
    updateState(line, state) {
      const match = line.trimEnd().match(/^\s{4}([a-z_]+):\s*\[/);
      if (match) state.currentCategory = match[1];
    },
    getAdditions(blockText, state) {
      const categoryId = state.currentCategory;
      return [
        maybeAdd(blockText, 'group', SUBJECT_GROUP_MAP[categoryId] || 'knowledge'),
        maybeAdd(blockText, 'scene', SUBJECT_SCENE_MAP[categoryId] || 'people'),
        maybeAdd(blockText, 'usage', SUBJECT_USAGE_MAP[categoryId] || 'promo')
      ].filter(Boolean);
    }
  },
  mediums: {
    fileName: 'mediums.js',
    shouldProcessBlock(blockText) {
      return blockText.includes('prefix:') && blockText.includes('suffix:');
    },
    createState() {
      return {};
    },
    updateState() {},
    getAdditions(blockText) {
      const categoryId = getMatch(blockText, /category:\s*'([a-z_]+)'/);
      return [
        maybeAdd(blockText, 'group', MEDIUM_GROUP_MAP[categoryId] || 'graphic'),
        maybeAdd(blockText, 'texture', MEDIUM_TEXTURE_MAP[categoryId] || 'clean'),
        maybeAdd(blockText, 'usage', MEDIUM_USAGE_MAP[categoryId] || 'brand')
      ].filter(Boolean);
    }
  },
  palettes: {
    fileName: 'palettes.js',
    shouldProcessBlock(blockText) {
      return blockText.includes('colors:') && blockText.includes('colorMapping:');
    },
    createState() {
      return {};
    },
    updateState() {},
    getAdditions(blockText) {
      const currentId = getMatch(blockText, /id:\s*'(pal-[^']+|none)'/);
      const currentCategory = getMatch(blockText, /category:\s*'([^']+)'/);
      return [
        maybeAdd(blockText, 'mood', PALETTE_MOOD_BY_ID[currentId] || PALETTE_MOOD_BY_CATEGORY[currentCategory] || 'minimal'),
        maybeAdd(blockText, 'usage', PALETTE_USAGE_BY_ID[currentId] || PALETTE_USAGE_BY_CATEGORY[currentCategory] || 'brand')
      ].filter(Boolean);
    }
  }
};

function maybeAdd(blockText, key, value) {
  if (new RegExp(`${key}:\\s*'[^']+'`).test(blockText)) return null;
  return { key, value };
}

function getMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1] : '';
}

function parseArgs(argv) {
  const options = {
    targets: new Set(Object.keys(FILE_CONFIGS)),
    dryRun: false,
    backup: true
  };

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--no-backup') {
      options.backup = false;
      continue;
    }
    if (arg.startsWith('--targets=')) {
      const raw = arg.slice('--targets='.length).trim();
      const targets = raw.split(',').map(v => v.trim()).filter(Boolean);
      const invalid = targets.filter(v => !FILE_CONFIGS[v]);
      if (invalid.length) {
        throw new Error(`Unknown targets: ${invalid.join(', ')}`);
      }
      options.targets = new Set(targets);
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log([
    'Usage:',
    '  node scripts/migrate-preset-filters-v2.mjs [--dry-run] [--no-backup] [--targets=subjects,mediums,palettes]',
    '',
    'Examples:',
    '  node scripts/migrate-preset-filters-v2.mjs',
    '  node scripts/migrate-preset-filters-v2.mjs --dry-run',
    '  node scripts/migrate-preset-filters-v2.mjs --targets=subjects,palettes'
  ].join('\n'));
}

function detectEol(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

function ensureBackup(filePath) {
  const backupPath = `${filePath}.bak`;
  if (!existsSync(backupPath)) {
    copyFileSync(filePath, backupPath);
  }
}

function isObjectStart(trimmed) {
  return /^\s+\{$/.test(trimmed) || /^\s+\{ id:/.test(trimmed);
}

function isObjectEnd(trimmed) {
  return trimmed.endsWith('},') || trimmed === '}';
}

function finalizeBlock(blockText, additions, eol) {
  if (!blockText || additions.length === 0) return blockText;

  if (blockText.includes(eol)) {
    const indent = getMatch(blockText, new RegExp(`${escapeRegExp(eol)}(\\s+)id:`)) || '      ';
    const fieldLines = additions.map(({ key, value }) => `${indent}${key}: '${value}'`);
    const lines = blockText.split(eol);
    const closingLine = lines.pop();

    let lastPropIndex = lines.length - 1;
    while (lastPropIndex >= 0 && !lines[lastPropIndex].trim()) {
      lastPropIndex -= 1;
    }
    if (lastPropIndex >= 0 && !lines[lastPropIndex].trimEnd().endsWith(',')) {
      lines[lastPropIndex] = `${lines[lastPropIndex]},`;
    }

    return [...lines, ...fieldLines, closingLine].join(eol);
  }

  const fieldText = additions.map(({ key, value }) => `${key}: '${value}'`).join(', ');
  return blockText.replace(/\s*\}\s*,?\s*$/, `, ${fieldText} },`);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processPresetFile(configKey, options) {
  const config = FILE_CONFIGS[configKey];
  const filePath = join(presetRoot, config.fileName);
  const source = readFileSync(filePath, 'utf8');
  const eol = detectEol(source);
  const lines = source.split(/\r?\n/);
  const out = [];
  const state = config.createState();
  let blockLines = [];
  let blockCount = 0;
  let fieldCount = 0;

  const flushBlock = () => {
    const blockText = blockLines.join(eol);
    blockLines = [];

    if (!config.shouldProcessBlock(blockText, state)) {
      out.push(blockText);
      return;
    }

    const additions = config.getAdditions(blockText, state);
    blockCount += additions.length > 0 ? 1 : 0;
    fieldCount += additions.length;
    out.push(finalizeBlock(blockText, additions, eol));
  };

  for (const line of lines) {
    config.updateState(line, state);
    const trimmed = line.trimEnd();

    if (blockLines.length > 0) {
      blockLines.push(line);
      if (isObjectEnd(trimmed)) {
        flushBlock();
      }
      continue;
    }

    if (isObjectStart(trimmed)) {
      blockLines = [line];
      if (isObjectEnd(trimmed)) {
        flushBlock();
      }
      continue;
    }

    out.push(line);
  }

  if (blockLines.length > 0) {
    flushBlock();
  }

  const nextSource = out.join(eol);
  const changed = nextSource !== source;

  if (changed && !options.dryRun) {
    if (options.backup) ensureBackup(filePath);
    writeFileSync(filePath, nextSource, 'utf8');
  }

  return {
    configKey,
    fileName: config.fileName,
    changed,
    blocksUpdated: blockCount,
    fieldsAdded: fieldCount
  };
}

function formatResult(result) {
  return [
    `- ${result.fileName}`,
    `changed=${result.changed ? 'yes' : 'no'}`,
    `blocks=${result.blocksUpdated}`,
    `fields=${result.fieldsAdded}`
  ].join(' ');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const results = [...options.targets].map(key => processPresetFile(key, options));
  const changedCount = results.filter(result => result.changed).length;
  const totalFieldCount = results.reduce((sum, result) => sum + result.fieldsAdded, 0);

  console.log(options.dryRun ? '[dry-run] preset filter migration preview' : 'Preset filter migration completed.');
  results.forEach(result => console.log(formatResult(result)));
  console.log(`Summary: changed-files=${changedCount}, added-fields=${totalFieldCount}`);
}

main();
