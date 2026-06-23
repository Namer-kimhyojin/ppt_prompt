// 컨셉 제안 탭 — 비주얼 스타일 프롬프트 갤러리
(function () {

  const CATEGORIES = [
    { id: 'all',          label: '전체' },
    { id: 'game',         label: '🎮 게임' },
    { id: '3d',           label: '🧊 3D' },
    { id: 'craft',        label: '🎨 수공예' },
    { id: 'illustration', label: '✏️ 일러스트' },
    { id: 'anime',        label: '🎬 만화/애니' },
    { id: 'modern',       label: '◼ 모던' },
    { id: 'photo',        label: '📷 사진' },
    { id: 'fashion',      label: '👗 패션' },
    { id: 'arch',         label: '🏛 건축' },
    { id: 'sport',        label: '⚽ 스포츠' },
    { id: 'brand',        label: '🏷 브랜드' },
    { id: 'nature',       label: '🌿 자연' },
    { id: 'food',         label: '🍽 음식' },
    { id: 'culture',      label: '🏯 전통' },
    { id: 'science',      label: '🔬 과학' },
    { id: 'bio',          label: '🧬 바이오' },
    { id: 'energy',       label: '⚡ 에너지' },
    { id: 'software',     label: '💻 소프트웨어' },
    { id: 'heavy',        label: '🏭 산업' },
    { id: 'steel',        label: '🏗️ 철강' },
    { id: 'public',       label: '🏛 공공기관' },
    { id: 'music',        label: '🎵 음악' },
    { id: 'finance',      label: '💰 금융' },
    { id: 'wellness',     label: '🌿 웰니스' },
    { id: 'travel',       label: '✈️ 여행' },
  ];

  const CAT_KO = {
    game:         '게임',
    '3d':         '3D',
    craft:        '수공예',
    illustration: '일러스트',
    anime:        '만화/애니',
    modern:       '모던',
    photo:        '사진',
    fashion:      '패션',
    arch:         '건축',
    sport:        '스포츠',
    brand:        '브랜드',
    nature:       '자연',
    food:         '음식',
    culture:      '전통',
    science:      '과학',
    bio:          '바이오',
    energy:       '에너지',
    software:     '소프트웨어',
    heavy:        '산업',
    steel:        '철강',
    public:       '공공기관',
    music:        '음악',
    finance:      '금융',
    wellness:     '웰니스',
    travel:       '여행',
  };

  const CAT_EN = {
    game:         'Game / fantasy',
    '3d':         '3D / technical',
    craft:        'Craft / analog',
    illustration: 'Illustration / drawing',
    anime:        'Comic / Anime / Cartoon',
    modern:       'Modern / graphic',
    photo:        'Photography',
    fashion:      'Fashion / beauty',
    arch:         'Architecture / interior',
    sport:        'Sports',
    brand:        'Brand / commercial',
    nature:       'Nature / eco',
    food:         'Food / cafe',
    culture:      'Culture / heritage',
    science:      'Science',
    bio:          'Bio / medical',
    energy:       'Energy / eco tech',
    software:     'Software / IT',
    heavy:        'Heavy industry',
    steel:        'Steel / Metallurgy',
    public:       'Public institution',
    music:        'Music / performance',
    finance:      'Finance / fintech',
    wellness:     'Wellness / beauty',
    travel:       'Travel / tourism',
  };

  const STYLES = window.CONCEPT_STYLES;

  // ── COLOR NAME MAP & HELPERS FOR IMAGEN ────────────────────
  const COLOR_NAME_MAP = {
    "#ffffff": "pure white",
    "#000000": "true black",
    "#0d0d0d": "near-black charcoal",
    "#1a1a2e": "deep midnight navy",
    "#16213e": "dark indigo navy",
    "#7c4dff": "electric violet",
    "#e94560": "crimson red",
    "#ffd700": "bright gold yellow",
    "#f9d4ff": "soft lavender pastel",
    "#b8d4ff": "sky-blue pastel",
    "#ffe8b8": "warm cream highlights",
    "#c8ffb8": "mint green pastel",
    "#ffd6f9": "blush pink pastel",
    "#ff9de2": "hot pink",
    "#ffb3c6": "rose pink",
    "#ffd6ff": "soft lavender",
    "#caffbf": "pale mint green",
    "#fdffb6": "lemon yellow",
    "#6c63ff": "indigo violet",
    "#3f3d56": "dark charcoal",
    "#f2f2f2": "light gray",
    "#ff6584": "coral pink",
    "#43d9ad": "teal green",
    "#2193b0": "deep cyan blue",
    "#6dd5ed": "sky blue",
    "#ee0979": "vivid magenta",
    "#ff6a00": "vivid orange",
    "#44f7c2": "turquoise",
    "#ff9a9e": "salmon pink",
    "#fad0c4": "peach pink",
    "#a18cd1": "soft purple",
    "#fbc2eb": "blush pink",
    "#ffecd2": "cream white",
    "#11998e": "deep teal",
    "#38ef7d": "lime green",
    "#fc4a1a": "fiery orange-red",
    "#f7b733": "amber yellow",
    "#0099f7": "electric blue",
    "#ff00ff": "electric magenta",
    "#00ffff": "luminous cyan",
    "#ff6600": "warning orange",
    "#ff0055": "crimson alert",
    "#a8e6cf": "pale mint",
    "#dcedc1": "sage green",
    "#ffd3b6": "warm peach",
    "#ffaaa5": "coral orange",
    "#d4a5e5": "soft lilac",
    "#ff6b6b": "coral red",
    "#ffd93d": "bright yellow",
    "#6bcb77": "fresh green",
    "#4d96ff": "sky blue",
    "#ff922b": "warm orange",
    "#2d4a22": "deep forest green",
    "#8b4513": "saddle brown",
    "#daa520": "golden amber",
    "#1a1a5e": "dark navy",
    "#8b0000": "deep crimson",
    "#ff595e": "vivid red",
    "#ffca3a": "amber yellow",
    "#6a4c93": "deep purple",
    "#1982c4": "royal blue",
    "#8ac926": "lime green",
    "#e63946": "vibrant tomato red",
    "#457b9d": "steel blue",
    "#f1faee": "off-white",
    "#a8dadc": "powder blue",
    "#ffd6a5": "warm peach",
    "#264653": "dark slate blue",
    "#2a9d8f": "emerald teal",
    "#e9c46a": "golden yellow",
    "#f4a261": "sandy orange",
    "#e76f51": "burnt terracotta",
    "#c9a84c": "metallic gold",
    "#f5f0e8": "warm ivory",
    "#7d7d7d": "medium gray"
  };

  function translateHexToColorName(hex) {
    const cleanHex = String(hex || "").trim().toLowerCase();
    if (!cleanHex) return "";
    const key = cleanHex.startsWith("#") ? cleanHex : `#${cleanHex}`;
    return COLOR_NAME_MAP[key] || "custom color";
  }

  function replaceHexCodesWithNames(text) {
    if (!text) return "";
    return text.replace(/#([0-9a-fA-F]{3,6})/gi, (match) => {
      return translateHexToColorName(match);
    });
  }

  function convertAvoidToPositive(avoidText) {
    if (!avoidText) return "";
    let clean = avoidText.toLowerCase();
    
    clean = clean.replace("avoid losing the original style identity from the source concept", "maintain the original style identity of the source concept");
    clean = clean.replace("avoid losing the original style identity from the source concept.", "maintain the original style identity of the source concept.");

    const mappings = [
      { bad: "avoid cluttered hud overload, unreadable tiny details, and mismatched fantasy props", good: "Keep the interface clean and spacious without HUD overload, focus on highly readable details, and ensure fantasy props are harmoniously matched" },
      { bad: "avoid plastic-looking overgloss, distorted perspective, and fake terrain unless requested", good: "Ensure natural matte or semi-gloss material finishes, keep the perspective accurate and grounded, and maintain realistic terrain rendering" },
      { bad: "avoid sterile digital finish, excessive symmetry, and glossy stock-photo polish", good: "Emphasize hand-made organic textures, introduce subtle natural asymmetry, and use a soft tactile matte finish" },
      { bad: "avoid generic clip-art, inconsistent line styles, and overcrowded decoration", good: "Create a unique hand-drawn feel, maintain consistent line styles throughout, and keep the composition uncluttered with elegant negative space" },
      { bad: "avoid random decoration, weak alignment, and low-contrast palette mixing", good: "Ensure purposeful layout alignment, maintain structured grid discipline, and use high-contrast color combinations" },
      { bad: "avoid fake-looking composites, warped products, and unreadable busy backgrounds", good: "Maintain authentic photographic integration, preserve accurate product proportions, and keep the background clean and readable" },
      { bad: "avoid awkward anatomy, cheap styling, and fabric texture mismatch", good: "Ensure elegant body proportions, high-end professional styling, and cohesive premium fabric textures" },
      { bad: "avoid impossible construction, broken perspective, and scale confusion", good: "Ensure mathematically possible architectural structures, stable linear perspective, and clear human-scale references" },
      { bad: "avoid weak motion, impossible poses, and confusing team/color hierarchy", good: "Capture dynamic athletic motion, anatomical plausible poses, and clear cohesive team/color branding" },
      { bad: "avoid fake logos, cluttered claims, and off-brand decorative noise", good: "Leave clean space for real logos, keep claims minimal and readable, and focus on brand-aligned visual hierarchy" },
      { bad: "avoid fake ecology, over-saturated greens, and inaccurate natural textures", good: "Depict authentic ecological scenes, natural balanced green tones, and realistic botanical textures" },
      { bad: "avoid unappetizing colors, warped food anatomy, and messy plating", good: "Use warm appetizing color tones, accurate food structures, and clean elegant plating" },
      { bad: "avoid costume clichés, inaccurate symbols, and disrespectful cultural mixing", good: "Respect cultural heritage details, use accurate traditional symbols, and maintain authentic cultural representation" },
      { bad: "avoid fake scientific labels, impossible instruments, and visual misinformation", good: "Use clear factual visual references, mathematically plausible scientific instruments, and clean layout labels" },
      { bad: "avoid misleading medical certainty, grotesque anatomy, and inaccurate scale cues", good: "Depict clean anatomical structures, clear biological scale cues, and professional scientific representation" },
      { bad: "avoid unsafe equipment depictions, fake meters, and chaotic glow effects", good: "Ensure safe and realistic industrial equipment styling, clean metrics, and controlled ambient glows" },
      { bad: "avoid unreadable fake ui, excessive neon, and meaningless data clutter", good: "Design highly legible functional UI panels, balanced clean glows, and scannable structured data layouts" },
      { bad: "avoid unsafe workplace setups, impossible machinery, and dirty visual clutter", good: "Keep scale believable, surfaces specific, and operational context clear" },
      { bad: "avoid black full-canvas background, avoid nightclub/neon darkness, avoid heavy gloomy shadows", good: "Maintain a clean bright layout with high text contrast, generous whitespace, and light neutral backgrounds" }
    ];

    for (const m of mappings) {
      if (clean.includes(m.bad.toLowerCase())) {
        return m.good;
      }
    }

    let processed = avoidText;
    processed = processed.replace(/avoid\s+losing\s+the\s+original\s+style\s+identity\s+from\s+the\s+source\s+concept\.?/gi, "Maintain the original style identity of the source concept.");
    processed = processed.replace(/avoid\s+([^,.;]+)/gi, (match, p1) => {
      return `maintain a clean design by ensuring there is no ${p1.trim()}`;
    });
    return processed;
  }

  // ── 렌더링 엔진 ─────────────────────────────────────────────

  let activeCategory = 'all';
  let searchQuery = '';
  let activeColorMode = 'light';
  let selectedConceptEngine = 'dalle';

  // STYLES에 전역 순번 미리 부여
  STYLES.forEach((s, i) => { s._num = i + 1; });

  function matchesSearch(style, q) {
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      style.nameKo.toLowerCase().includes(lower) ||
      style.nameEn.toLowerCase().includes(lower) ||
      style.desc.toLowerCase().includes(lower) ||
      style.tags.some(t => t.toLowerCase().includes(lower)) ||
      String(style._num) === lower.trim()
    );
  }

  function getLuminance(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  function getHeaderTheme(palette) {
    const avg = getLuminance(palette[0]) * 0.7 + getLuminance(palette[1]) * 0.3;
    if (avg > 0.35) {
      return { primary: 'rgba(20,20,40,0.92)', secondary: 'rgba(20,20,40,0.65)', badge: 'rgba(0,0,0,0.12)', badgeText: 'rgba(20,20,40,0.80)' };
    }
    return { primary: 'rgba(255,255,255,0.95)', secondary: 'rgba(255,255,255,0.72)', badge: 'rgba(255,255,255,0.20)', badgeText: 'rgba(255,255,255,0.90)' };
  }

  function buildGradient(p) { return `linear-gradient(135deg, ${p[0]} 0%, ${p[1]} 100%)`; }

  function normalizeHex(hex) {
    const value = String(hex || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : '';
  }

  function pickLightAccents(palette) {
    return (palette || [])
      .map(normalizeHex)
      .filter(Boolean)
      .filter(hex => getLuminance(hex) < 0.82)
      .sort((a, b) => Math.abs(getLuminance(a) - 0.35) - Math.abs(getLuminance(b) - 0.35))
      .slice(0, 3);
  }

  function pickDarkAccents(palette) {
    return (palette || [])
      .map(normalizeHex)
      .filter(Boolean)
      .filter(hex => getLuminance(hex) > 0.05 && getLuminance(hex) < 0.90)
      .sort((a, b) => Math.abs(getLuminance(b) - 0.55) - Math.abs(getLuminance(a) - 0.55))
      .slice(0, 3);
  }

  function isLightPalette(palette) {
    if (!Array.isArray(palette) || palette.length === 0) return false;
    const firstHex = normalizeHex(palette[0]);
    if (!firstHex) return false;
    return getLuminance(firstHex) > 0.80;
  }

  function getModePalette(style, mode) {
    const source = Array.isArray(style.palette) ? style.palette : [];
    const naturallyLight = isLightPalette(source);

    if (mode === 'light') {
      if (naturallyLight) return source;
      const accents = pickLightAccents(source);
      const fallbackAccents = ['#1f4f99', '#4f6f52', '#d87922'];
      return ['#ffffff', '#f5f7fb', ...accents, ...fallbackAccents].slice(0, 5);
    } else {
      // mode === 'dark'
      if (!naturallyLight) return source;
      const accents = pickDarkAccents(source);
      const fallbackDarkAccents = ['#3b82f6', '#10b981', '#f59e0b'];
      return ['#0f172a', '#1e293b', ...accents, ...fallbackDarkOverwrites(accents, fallbackDarkAccents)].slice(0, 5);
    }
  }

  function fallbackDarkOverwrites(accents, fallbacks) {
    return fallbacks.filter(f => !accents.includes(f));
  }

  function getModePrompt(style, mode, palette) {
    const prompt = String(style.prompt || '').trim();
    const source = Array.isArray(style.palette) ? style.palette : [];
    const naturallyLight = isLightPalette(source);
    const paletteText = palette.join(' ');

    if (mode === 'light') {
      if (naturallyLight) return prompt;
      let adaptedPrompt = prompt
        .replace(/dark background/gi, 'light background')
        .replace(/near-black/gi, 'off-white')
        .replace(/midnight navy/gi, 'light royal blue')
        .replace(/deep midnight navy/gi, 'light blue')
        .replace(/dark charcoal/gi, 'light gray')
        .replace(/dark slate/gi, 'light slate-gray')
        .replace(/black outlines/gi, 'refined gray outlines');
      return [
        adaptedPrompt,
        `Light background adaptation for public institution and official communication use: white or very-light neutral canvas background, clean administrative design tone, bright readable information area, restrained accent colors from palette ${paletteText}, generous whitespace, high text contrast, trustworthy civic visual mood, avoid black full-canvas background, avoid nightclub/neon darkness, avoid heavy gloomy shadows.`
      ].filter(Boolean).join(', ');
    } else {
      // mode === 'dark'
      if (!naturallyLight) return prompt;
      let adaptedPrompt = prompt
        .replace(/white background/gi, 'dark slate background')
        .replace(/pure white canvas/gi, 'dark charcoal canvas')
        .replace(/light cool-gray/gi, 'dark slate-gray')
        .replace(/clean white background/gi, 'clean dark slate background')
        .replace(/white dashboard-style background/gi, 'dark dashboard-style background')
        .replace(/warm white background/gi, 'dark charcoal background')
        .replace(/clinical white background/gi, 'dark clinical slate background')
        .replace(/pure white as dominant full background/gi, 'dark slate as dominant full background')
        .replace(/pure white dominant canvas/gi, 'dark charcoal dominant canvas')
        .replace(/pure white canvas/gi, 'dark charcoal canvas')
        .replace(/white clean canvas/gi, 'dark clean canvas')
        .replace(/white canvas/gi, 'dark canvas')
        .replace(/pale blue-gray for rounded/gi, 'semi-transparent dark gray for rounded')
        .replace(/pale blue step containers/gi, 'semi-transparent dark blue step containers')
        .replace(/pale sky-blue/gi, 'dark slate-blue')
        .replace(/pale green/gi, 'dark forest-green')
        .replace(/pale warm tan/gi, 'dark warm brown')
        .replace(/very pale blue/gi, 'dark indigo-blue')
        .replace(/charcoal for readable body text/gi, 'light gray for readable body text')
        .replace(/near-black for body copy/gi, 'light gray for body copy')
        .replace(/dark charcoal for body text/gi, 'light gray for body text')
        .replace(/no dark full background/gi, 'dark full background')
        .replace(/no hospital horror mood no dark background/gi, 'clean dark mode healthcare layout');
      return [
        adaptedPrompt,
        `Dark background adaptation: replace any white/light backgrounds with a dark slate or charcoal canvas (#0f172a or #1e293b), adapt all text to high-contrast white or light gray, convert information boxes to semi-transparent dark containers, and use the bright accent colors (${paletteText}) for key highlights, lines, and active elements only to maintain official authority with high dark-mode readability.`
      ].filter(Boolean).join(', ');
    }
  }

  function resolveStyleForMode(style, mode = activeColorMode) {
    const palette = getModePalette(style, mode);
    const prompt = getModePrompt(style, mode, palette);
    return Object.assign({}, style, {
      palette,
      prompt,
      paletteMode: mode,
      sourcePrompt: style.prompt,
      sourcePalette: style.palette,
      desc: style.desc || '',
    });
  }

  const PROMOTION_PROMPT_DEFAULTS = {
    game: {
      textureRendering: 'game-ready illustration finish with crisp readable details',
      lightingMood: 'high-contrast focal lighting that supports fast visual recognition',
      shapeLanguage: 'iconic character-like silhouettes, clear foreground/background separation',
      layoutBehavior: 'hero object centered with room for campaign headline and CTA',
      typographyGuidance: 'bold display type or game UI label treatment, keep text short and legible',
      campaignAdaptation: 'adapt as launch key art, event banner, or reward announcement',
      objectAdaptation: 'turn the promoted product into a collectible game item or quest object',
      avoid: 'avoid cluttered HUD overload, unreadable tiny details, and mismatched fantasy props',
      qualityRules: 'keep silhouettes strong, edges intentional, and palette contrast high'
    },
    '3d': {
      textureRendering: 'polished 3D rendering with controlled material highlights',
      lightingMood: 'soft studio lighting with ambient occlusion and readable depth',
      shapeLanguage: 'clean geometric volumes, rounded or faceted forms based on the style',
      layoutBehavior: 'product or offer object in a clean spatial composition with depth layers',
      typographyGuidance: 'modern sans-serif typography, placed on simple planes with clear contrast',
      campaignAdaptation: 'adapt as tech showcase, service explainer, or feature launch visual',
      objectAdaptation: 'translate the promoted item into a dimensional icon, device, package, or scene prop',
      avoid: 'avoid plastic-looking overgloss, distorted perspective, and fake terrain unless requested',
      qualityRules: 'keep lighting believable, materials consistent, and composition uncluttered'
    },
    craft: {
      textureRendering: 'visible handmade texture, material grain, tactile imperfections',
      lightingMood: 'warm natural or soft studio lighting that preserves material detail',
      shapeLanguage: 'organic handcrafted shapes with slight irregularity and human touch',
      layoutBehavior: 'flat lay, tabletop, or poster-like arrangement with calm negative space',
      typographyGuidance: 'handmade lettering or warm serif/sans pairing, avoid over-polished type',
      campaignAdaptation: 'adapt as artisan brand, workshop, seasonal offer, or cozy product visual',
      objectAdaptation: 'render the promoted item as a handmade object, paper piece, textile, or painted motif',
      avoid: 'avoid sterile digital finish, excessive symmetry, and glossy stock-photo polish',
      qualityRules: 'preserve tactile cues, readable subject boundaries, and natural color variation'
    },
    illustration: {
      textureRendering: 'illustrated finish using the selected line, fill, or drawing technique',
      lightingMood: 'stylized lighting that supports the illustration language without photorealism',
      shapeLanguage: 'clear drawn silhouettes, expressive line weight, controlled decorative detail',
      layoutBehavior: 'poster, editorial, or character-led composition with strong focal hierarchy',
      typographyGuidance: 'match type to the illustration era and keep campaign copy integrated but readable',
      campaignAdaptation: 'adapt as poster, social key visual, story card, or editorial campaign image',
      objectAdaptation: 'convert the promoted item into a drawn hero motif or supporting prop',
      avoid: 'avoid generic clip-art, inconsistent line styles, and overcrowded decoration',
      qualityRules: 'keep line treatment consistent, focal subject clear, and decorative elements intentional'
    },
    anime: {
      textureRendering: 'anime cel-shaded or manga-style finish with clean line work',
      lightingMood: 'stylized anime-inspired lighting, dramatic screen tones, or soft backlights',
      shapeLanguage: 'clean outlines, expressive silhouettes, and dynamic graphic compositions',
      layoutBehavior: 'character-led or graphic novel pane layout with spacious copy zones',
      typographyGuidance: 'dynamic graphic novel style typography or clean sub-tab title placement',
      campaignAdaptation: 'adapt as comic banner, key art, character promotion, or web ad',
      objectAdaptation: 'convert the promoted item into a stylized manga prop or comic-style element',
      avoid: 'avoid messy lines, realistic rendering, and overlapping dialog bubbles unless intended',
      qualityRules: 'maintain clean lines, flat colors or screen tones, and stylized anatomy'
    },
    modern: {
      textureRendering: 'clean graphic finish with controlled flat, print, or vector treatment',
      lightingMood: 'minimal implied lighting or high-contrast graphic separation',
      shapeLanguage: 'geometric forms, bold planes, and simple repeatable visual systems',
      layoutBehavior: 'grid-based campaign layout with strong headline zone and modular spacing',
      typographyGuidance: 'confident modern typography, high contrast, tight copy hierarchy',
      campaignAdaptation: 'adapt as brand campaign, presentation cover, event poster, or social ad',
      objectAdaptation: 'simplify the promoted item into a bold graphic icon, silhouette, or abstract mark',
      avoid: 'avoid random decoration, weak alignment, and low-contrast palette mixing',
      qualityRules: 'maintain grid discipline, color hierarchy, and sharp vector-like edges'
    },
    photo: {
      textureRendering: 'photographic surface detail with realistic lens and material response',
      lightingMood: 'cinematic or editorial lighting guided by the source style mood',
      shapeLanguage: 'real-world object silhouettes with believable scale and perspective',
      layoutBehavior: 'hero product or lifestyle scene with clean space for campaign copy',
      typographyGuidance: 'restrained editorial typography, placed away from subject detail',
      campaignAdaptation: 'adapt as advertising key visual, product story, or lifestyle campaign',
      objectAdaptation: 'stage the promoted item as a real product, prop, or experience anchor',
      avoid: 'avoid fake-looking composites, warped products, and unreadable busy backgrounds',
      qualityRules: 'keep realism consistent, lens perspective plausible, and subject detail sharp'
    },
    fashion: {
      textureRendering: 'fashion editorial fabric, styling, and surface detail',
      lightingMood: 'editorial studio or runway-inspired lighting with clear garment texture',
      shapeLanguage: 'elegant body lines, garment silhouettes, and refined accessory shapes',
      layoutBehavior: 'magazine-style hero framing with premium negative space',
      typographyGuidance: 'luxury editorial type, minimal copy, precise placement',
      campaignAdaptation: 'adapt as lookbook, premium launch, seasonal campaign, or brand editorial',
      objectAdaptation: 'style the promoted item as an accessory, garment detail, or fashion set piece',
      avoid: 'avoid awkward anatomy, cheap styling, and fabric texture mismatch',
      qualityRules: 'preserve proportions, styling coherence, and premium material cues'
    },
    arch: {
      textureRendering: 'architectural material detail with clean structure and scale cues',
      lightingMood: 'natural daylight, gallery light, or dramatic architectural shadow',
      shapeLanguage: 'spatial geometry, clean planes, structural rhythm, human-scale references',
      layoutBehavior: 'wide composition, perspective depth, and clear copy-safe zones',
      typographyGuidance: 'architectural sans-serif or editorial serif, restrained and aligned',
      campaignAdaptation: 'adapt as venue promotion, real estate visual, exhibition, or spatial brand image',
      objectAdaptation: 'place the promoted item as signage, installation, furnishing, or architectural focal point',
      avoid: 'avoid impossible construction, broken perspective, and scale confusion',
      qualityRules: 'keep perspective stable, materials coherent, and spatial hierarchy readable'
    },
    sport: {
      textureRendering: 'dynamic sport finish with motion, fabric, equipment, or field texture',
      lightingMood: 'energetic arena, outdoor, or action lighting with strong contrast',
      shapeLanguage: 'athletic diagonals, motion arcs, powerful silhouettes',
      layoutBehavior: 'action-first composition with bold score, event, or offer space',
      typographyGuidance: 'condensed bold sport typography, high legibility under motion',
      campaignAdaptation: 'adapt as match poster, tournament promo, class/event ad, or athlete feature',
      objectAdaptation: 'make the promoted item part of equipment, prize, jersey, or action moment',
      avoid: 'avoid weak motion, impossible poses, and confusing team/color hierarchy',
      qualityRules: 'keep action readable, anatomy plausible, and brand/event information clear'
    },
    brand: {
      textureRendering: 'brand-system polish with consistent surfaces and campaign-ready finish',
      lightingMood: 'controlled commercial lighting that supports trust and recognition',
      shapeLanguage: 'repeatable brand motifs, strong logo-safe shapes, tidy iconography',
      layoutBehavior: 'clear ad layout with headline, visual proof, and conversion area',
      typographyGuidance: 'brand-safe typography hierarchy, short claims, strong CTA contrast',
      campaignAdaptation: 'adapt as launch ad, offer card, website hero, or social campaign',
      objectAdaptation: 'turn the promoted item into the central brand proof or product hero',
      avoid: 'avoid fake logos, cluttered claims, and off-brand decorative noise',
      qualityRules: 'prioritize brand consistency, readable claims, and clean commercial composition'
    },
    nature: {
      textureRendering: 'organic natural texture with foliage, terrain, weather, or botanical detail',
      lightingMood: 'natural ambient light, golden hour, mist, or eco-focused softness',
      shapeLanguage: 'organic curves, layered landscapes, botanical silhouettes',
      layoutBehavior: 'scene-led composition with breathable copy space and environmental context',
      typographyGuidance: 'calm natural typography, avoid overly synthetic effects',
      campaignAdaptation: 'adapt as eco campaign, travel visual, wellness offer, or outdoor product story',
      objectAdaptation: 'place the promoted item naturally within landscape, botanical, or outdoor context',
      avoid: 'avoid fake ecology, over-saturated greens, and inaccurate natural textures',
      qualityRules: 'keep nature cues believable, atmosphere gentle, and subject relationship clear'
    },
    food: {
      textureRendering: 'appetizing food texture, surface gloss, garnish, and plating detail',
      lightingMood: 'warm appetizing light or clean menu photography light',
      shapeLanguage: 'rounded edible forms, plate geometry, ingredient rhythm',
      layoutBehavior: 'menu, hero dish, or tabletop layout with room for offer text',
      typographyGuidance: 'clear menu typography, price/offer copy must stay readable',
      campaignAdaptation: 'adapt as menu promo, delivery ad, seasonal item, or restaurant campaign',
      objectAdaptation: 'style the promoted item as dish, packaging, ingredient, or table moment',
      avoid: 'avoid unappetizing colors, warped food anatomy, and messy plating',
      qualityRules: 'make food look fresh, textures specific, and offer hierarchy clear'
    },
    culture: {
      textureRendering: 'culturally grounded material, pattern, craft, or heritage detail',
      lightingMood: 'respectful atmospheric lighting that highlights tradition and texture',
      shapeLanguage: 'heritage motifs, ceremonial symmetry, or locally meaningful ornament',
      layoutBehavior: 'balanced poster or scene composition with context and dignity',
      typographyGuidance: 'use culturally appropriate type cues without reducing readability',
      campaignAdaptation: 'adapt as festival, exhibition, tourism, heritage, or cultural product visual',
      objectAdaptation: 'integrate the promoted item with relevant craft, pattern, place, or ritual context',
      avoid: 'avoid costume clichés, inaccurate symbols, and disrespectful cultural mixing',
      qualityRules: 'keep references respectful, specific, and visually coherent'
    },
    science: {
      textureRendering: 'precise scientific, diagrammatic, glass, metal, or lab texture',
      lightingMood: 'clean lab light, data glow, or controlled explanatory illumination',
      shapeLanguage: 'structured diagrams, modular systems, particles, charts, or instruments',
      layoutBehavior: 'explanatory campaign layout with clear focal evidence and copy-safe zones',
      typographyGuidance: 'technical sans-serif, labels concise, hierarchy clean',
      campaignAdaptation: 'adapt as research launch, education poster, explainer, or technical campaign',
      objectAdaptation: 'translate the promoted item into a specimen, instrument, diagram, or discovery moment',
      avoid: 'avoid fake scientific labels, impossible instruments, and visual misinformation',
      qualityRules: 'keep details precise, labels plausible, and visual evidence clear'
    },
    bio: {
      textureRendering: 'biological micro-texture, translucent membranes, organic structures',
      lightingMood: 'clean clinical light or soft bioluminescent depth',
      shapeLanguage: 'cellular, molecular, anatomical, or organic network forms',
      layoutBehavior: 'science-marketing composition with clear subject and calm copy zone',
      typographyGuidance: 'clinical modern type, avoid sensational medical claims',
      campaignAdaptation: 'adapt as biotech, health, wellness, research, or product education visual',
      objectAdaptation: 'relate the promoted item to cell, molecule, ingredient, anatomy, or life-system motif',
      avoid: 'avoid misleading medical certainty, grotesque anatomy, and inaccurate scale cues',
      qualityRules: 'preserve biological plausibility, clarity, and trustworthy tone'
    },
    energy: {
      textureRendering: 'energy glow, metal, grid, plasma, battery, or infrastructure detail',
      lightingMood: 'bright directional glow or industrial clean light with high impact',
      shapeLanguage: 'arcs, currents, grids, turbines, cells, or power-flow shapes',
      layoutBehavior: 'forward-motion composition with strong headline and proof area',
      typographyGuidance: 'bold technical typography, clear metrics and CTA',
      campaignAdaptation: 'adapt as sustainability, infrastructure, power product, or innovation campaign',
      objectAdaptation: 'connect the promoted item to power flow, charging, solar, wind, or grid motif',
      avoid: 'avoid unsafe equipment depictions, fake meters, and chaotic glow effects',
      qualityRules: 'keep energy direction clear, materials credible, and contrast controlled'
    },
    software: {
      textureRendering: 'digital interface, data, glassmorphism, code, or clean product UI finish',
      lightingMood: 'controlled screen glow or calm SaaS-style visual light',
      shapeLanguage: 'modular UI panels, nodes, flows, dashboards, and product-system geometry',
      layoutBehavior: 'screen-led layout with readable interface zones and campaign copy area',
      typographyGuidance: 'clean SaaS typography, concise feature labels, strong CTA',
      campaignAdaptation: 'adapt as SaaS ad, feature announcement, AI launch, or product explainer',
      objectAdaptation: 'represent the promoted item as an interface, workflow, automation, or data object',
      avoid: 'avoid unreadable fake UI, excessive neon, and meaningless data clutter',
      qualityRules: 'make UI elements plausible, hierarchy scannable, and claims visually supported'
    },
    heavy: {
      textureRendering: 'industrial metal, machinery, concrete, logistics, or manufacturing texture',
      lightingMood: 'realistic factory, workshop, or infrastructure lighting',
      shapeLanguage: 'large-scale equipment, structural lines, modular components, heavy silhouettes',
      layoutBehavior: 'robust commercial composition with clear scale and product proof',
      typographyGuidance: 'strong industrial sans-serif, concise and practical copy',
      campaignAdaptation: 'adapt as B2B industrial ad, facility story, equipment launch, or service promo',
      objectAdaptation: 'place the promoted item within machinery, logistics, process, or facility context',
      avoid: 'avoid unsafe workplace setups, impossible machinery, and dirty visual clutter',
      qualityRules: 'keep scale believable, surfaces specific, and operational context clear'
    }
  };

  const PROMOTION_SIGNAL_PATTERNS = {
    textureRendering: [
      'pixel', 'matte', 'paper grain', 'brushstroke', 'canvas', 'halftone', 'stitch', 'fabric',
      'collage', 'grain', 'gloss', 'metal', 'glass', 'neon', 'watercolor', 'ink', 'pencil',
      'chalk', 'cross-hatching', 'stippling', 'voxel', 'clay', 'origami'
    ],
    lightingMood: [
      'dramatic', 'chiaroscuro', 'volumetric fog', 'soft warm studio lighting', 'cinematic',
      'neon', 'glowing', 'golden', 'studio lighting', 'natural light', 'single light source',
      'ambient occlusion', 'lens flare', 'bioluminescent'
    ],
    shapeLanguage: [
      'geometric', 'rounded', 'angular', 'faceted', 'organic', 'line art', 'bold outline',
      'silhouette', 'isometric', 'diagonal', 'cubic', 'flat', 'ornate', 'flowing'
    ],
    layoutBehavior: [
      'poster', 'grid', 'dynamic composition', 'isometric', 'vertical scroll', 'panel layout',
      'flat lay', 'centered', 'minimalist', 'negative space', 'wide composition', 'diagram'
    ],
    typographyGuidance: [
      'typography', 'lettering', 'calligraphy', 'blackletter', 'chalkboard', 'sign painting',
      'speech bubble', 'label', 'menu board', 'poster'
    ]
  };

  function uniqueList(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  function findPromptSignals(style, group) {
    const source = `${style.prompt || ''} ${style.desc || ''} ${(style.tags || []).join(' ')}`.toLowerCase();
    return PROMOTION_SIGNAL_PATTERNS[group].filter(term => source.includes(term.toLowerCase()));
  }

  function addSignals(baseText, signals) {
    if (!signals.length) return baseText;
    return `${baseText}; extracted cues: ${signals.join(', ')}`;
  }

  function buildPromotionPromptParts(style) {
    const defaults = PROMOTION_PROMPT_DEFAULTS[style.category] || PROMOTION_PROMPT_DEFAULTS.modern;
    const palette = style.palette || [];
    const paletteRoles = palette.map((hex, index) => {
      const role = ['primary', 'secondary', 'accent', 'highlight', 'support'][index] || `color ${index + 1}`;
      return `${role} ${hex}`;
    });
    const categoryEn = CAT_EN[style.category] || style.category;
    const sourcePrompt = style.prompt || '';
    const styleDNA = uniqueList([style.nameEn, categoryEn]).join(' / ');
    const signalGroups = Object.keys(PROMOTION_SIGNAL_PATTERNS).reduce((acc, key) => {
      acc[key] = findPromptSignals(style, key);
      return acc;
    }, {});

    return {
      visualDNA: styleDNA,
      paletteStrategy: `Use the selected concept palette as campaign color roles: ${paletteRoles.join(', ')}.${style.paletteMode === 'light' ? ' Keep the canvas white or very light, suitable for public institution communication, with accents restrained to hierarchy and CTA use.' : ''}`,
      textureRendering: addSignals(defaults.textureRendering, signalGroups.textureRendering),
      lightingMood: addSignals(defaults.lightingMood, signalGroups.lightingMood),
      shapeLanguage: addSignals(defaults.shapeLanguage, signalGroups.shapeLanguage),
      layoutBehavior: addSignals(defaults.layoutBehavior, signalGroups.layoutBehavior),
      typographyGuidance: addSignals(defaults.typographyGuidance, signalGroups.typographyGuidance),
      campaignAdaptation: defaults.campaignAdaptation,
      objectAdaptation: defaults.objectAdaptation,
      avoid: `${defaults.avoid}; avoid losing the original style identity from the source concept.`,
      qualityRules: `${defaults.qualityRules}; preserve item-level product readability and campaign usability.`
    };
  }

  const IMAGEN_MEDIUM_PREFIXES = {
    game: "A pixel-art style game illustration",
    '3d': "A polished 3D CGI render",
    craft: "A tactile handmade craft artwork",
    illustration: "A clean digital vector illustration",
    anime: "A dynamic anime or comic style illustration",
    modern: "A sleek minimalist graphic design",
    official: "A clean corporate campaign graphic design",
    nature: "An organic stylized graphic illustration",
    food: "A vibrant fresh advertising graphic",
    culture: "A traditional graphic art illustration",
    medical: "A clean high-fidelity technical illustration",
    energy: "A dynamic tech graphic illustration",
    it: "A modern digital UI web graphic design",
    industry: "A robust technical industrial rendering"
  };

  function buildPromotionConceptStyle(style) {
    const promptParts = (style.promptParts && typeof style.promptParts === 'object' && style.promptParts.visualDNA)
      ? style.promptParts
      : buildPromotionPromptParts(style);
    // "avoid ..." 토큰을 styleKeywords에서 제거 (light mode 파생 텍스트 오염 방지)
    const styleKeywords = (style.prompt || '').split(',')
      .map(s => s.trim())
      .filter(s => Boolean(s) && !/^avoid\b/i.test(s))
      .slice(0, 8)
      .join(', ');

    const targetEngine = selectedConceptEngine;
    let promotionPrompt = '';

    if (targetEngine === 'imagen') {
      const positiveAvoid = convertAvoidToPositive(promptParts.avoid);
      const prefix = IMAGEN_MEDIUM_PREFIXES[style.category] || "A premium promotional campaign graphic design";
      const cleanVisualDNA = promptParts.visualDNA.split(' — ')[0];
      const styleCharacter = styleKeywords
        ? `This image should carry the visual character of ${style.nameEn} — expressed through ${styleKeywords}.`
        : `Maintain the full stylistic identity of ${style.nameEn} throughout the composition.`;
      const fluidPrompt = [
        `${prefix} in the style of ${style.nameEn} (${CAT_EN[style.category] || style.category}).`,
        `The visual DNA is characterized by ${cleanVisualDNA}.`,
        `The composition features a shape language of ${promptParts.shapeLanguage}, rendered with ${promptParts.textureRendering}, and illuminated by ${promptParts.lightingMood}.`,
        `The color palette system employs the following strategy: ${promptParts.paletteStrategy}. Reserve the strongest color contrast for key elements like the headline, action button, and essential campaign details.`,
        `For the promotional campaign, the scene is adapted for a ${promptParts.campaignAdaptation}, representing the primary product or offer as a ${promptParts.objectAdaptation}.`,
        `The spatial layout behaves as a ${promptParts.layoutBehavior}, incorporating typography according to the following guidance: ${promptParts.typographyGuidance}. The backdrop immediately behind any text block must be visually flat and uncluttered to ensure maximum legibility.`,
        `For optimal layout structure and aesthetics at 2K quality, ${positiveAvoid} and ${promptParts.qualityRules}.`,
        styleCharacter,
      ].join(' ');

      promotionPrompt = fluidPrompt;
    } else {
      promotionPrompt = [
        `[Style Fidelity]`,
        `- Keep this concept visibly traceable through at least 3 of: palette, shape language, texture, lighting, object proportion, or layout structure.`,
        `- Campaign copy (headline, CTA, target audience) is the message source of truth. If the concept's object metaphor conflicts with the campaign, preserve the style language and replace only the object meaning.`,
        ``,
        `[Visual Anatomy]`,
        `- Concept name: ${style.nameEn}`,
        `- Category: ${CAT_EN[style.category] || style.category}`,
        `- Visual DNA: ${promptParts.visualDNA}`,
        `- Shape language: ${promptParts.shapeLanguage}`,
        `- Texture / rendering: ${promptParts.textureRendering}`,
        `- Lighting / mood: ${promptParts.lightingMood}`,
        ``,
        `[Color System]`,
        `- Palette roles: ${promptParts.paletteStrategy}`,
        `- Reserve the strongest palette contrast for headline, action button, and required information.`,
        ``,
        `[Promotion Image Adaptation]`,
        `- Campaign adaptation: ${promptParts.campaignAdaptation}`,
        `- Object / metaphor adaptation: ${promptParts.objectAdaptation}`,
        `- Layout behavior: ${promptParts.layoutBehavior}`,
        `- Typography guidance: ${promptParts.typographyGuidance}`,
        ``,
        `[Style Keywords]`,
        styleKeywords
      ].join('\n');
    }

    return Object.assign({}, style, {
      promptParts,
      promotionPrompt,
      sourcePrompt: style.prompt
    });
  }


  function createCard(style) {
    const modeStyle = resolveStyleForMode(style);
    const promotionStyle = buildPromotionConceptStyle(modeStyle);
    const displayPrompt = promotionStyle.promotionPrompt || modeStyle.prompt;
    const card = document.createElement('div');
    card.className = `concept-card concept-card-${activeColorMode}`;
    card.dataset.category = style.category;
    const theme = getHeaderTheme(modeStyle.palette);
    const header = document.createElement('div');
    header.className = 'concept-card-header';
    header.style.background = buildGradient(modeStyle.palette);
    header.innerHTML = `<div class="concept-card-emoji">${style.emoji}</div><div class="concept-card-name-en" style="color:${theme.primary}">${style.nameEn}</div><div class="concept-card-name-ko" style="color:${theme.secondary}">${style.nameKo}</div><div class="concept-card-meta-badges"><span class="concept-card-cat-badge" style="background:${theme.badge};color:${theme.badgeText}">${CAT_KO[style.category] || ''}</span><span class="concept-card-num">#${style._num}</span></div>`;
    const body = document.createElement('div');
    body.className = 'concept-card-body';
    const desc = document.createElement('p');
    desc.className = 'concept-card-desc';
    desc.textContent = modeStyle.desc;
    const paletteRow = document.createElement('div');
    paletteRow.className = 'concept-palette-row';
    const palette = document.createElement('div');
    palette.className = 'concept-palette';
    modeStyle.palette.forEach(hex => {
      const dot = document.createElement('div');
      dot.className = 'concept-palette-dot';
      dot.style.backgroundColor = hex;
      dot.title = hex;
      dot.innerHTML = `<span class="concept-palette-hex">${hex}</span>`;
      palette.appendChild(dot);
    });
    const modeToggle = document.createElement('div');
    modeToggle.className = 'concept-card-mode';
    modeToggle.setAttribute('role', 'group');
    modeToggle.setAttribute('aria-label', `${style.nameKo} 색상 모드`);
    ['light', 'dark'].forEach(mode => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'concept-card-mode-btn' + (activeColorMode === mode ? ' active' : '');
      btn.dataset.conceptColorMode = mode;
      btn.setAttribute('aria-pressed', activeColorMode === mode ? 'true' : 'false');
      btn.textContent = mode === 'light' ? '라이트' : '다크';
      btn.addEventListener('click', () => setColorMode(mode, style._num));
      modeToggle.appendChild(btn);
    });
    paletteRow.appendChild(palette);
    paletteRow.appendChild(modeToggle);
    const tags = document.createElement('div');
    tags.className = 'concept-tags';
    style.tags.forEach(t => { const tag = document.createElement('span'); tag.className = 'concept-tag'; tag.textContent = `# ${t}`; tags.appendChild(tag); });
    const promptArea = document.createElement('div');
    promptArea.className = 'concept-prompt-area';
    const promptText = document.createElement('pre');
    promptText.className = 'concept-prompt-text';
    promptText.textContent = displayPrompt;
    const copyRow = document.createElement('div');
    copyRow.className = 'concept-copy-row';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'concept-copy-btn';
    copyBtn.textContent = '프롬프트 복사';

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'concept-apply-btn';
    applyBtn.textContent = '프롬프트 적용';

    const feedback = document.createElement('span');
    feedback.className = 'concept-copy-feedback';
    feedback.textContent = '✓ 복사 완료!';

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(displayPrompt).then(() => {
        copyBtn.textContent = '✓ 복사됨'; copyBtn.classList.add('copied'); feedback.classList.add('visible');
        setTimeout(() => { copyBtn.textContent = '프롬프트 복사'; copyBtn.classList.remove('copied'); feedback.classList.remove('visible'); }, 2000);
      }).catch(() => {
        const ta = document.createElement('textarea'); ta.value = displayPrompt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        copyBtn.textContent = '✓ 복사됨'; copyBtn.classList.add('copied'); feedback.classList.add('visible');
        setTimeout(() => { copyBtn.textContent = '프롬프트 복사'; copyBtn.classList.remove('copied'); feedback.classList.remove('visible'); }, 2000);
      });
    });

    applyBtn.addEventListener('click', () => {
      if (typeof window.applyPromotionConceptStyle === 'function') {
        window.applyPromotionConceptStyle(promotionStyle);
        const tabBtn = document.getElementById('tabBtnPromotion');
        if (tabBtn) tabBtn.click();
      } else {
        alert('홍보용 이미지 탭이 아직 준비되지 않았습니다.');
      }
    });

    const mixerBtn = document.createElement('button');
    mixerBtn.type = 'button';
    mixerBtn.className = 'concept-mixer-btn';
    mixerBtn.textContent = '믹서에 사용';
    mixerBtn.addEventListener('click', () => {
      if (typeof window.applyMixerPaletteForStyle === 'function') {
        window.applyMixerPaletteForStyle(style.id || style);
      } else {
        alert('화풍 믹서가 준비되지 않았습니다.');
      }
    });

    copyRow.appendChild(copyBtn);
    copyRow.appendChild(applyBtn);
    copyRow.appendChild(mixerBtn);
    copyRow.appendChild(feedback);
    promptArea.appendChild(promptText); promptArea.appendChild(copyRow);
    body.appendChild(desc); body.appendChild(paletteRow); body.appendChild(tags); body.appendChild(promptArea);
    card.appendChild(header); card.appendChild(body);
    return card;
  }

  function syncColorModeControls() {
    document.querySelectorAll('[data-concept-color-mode]').forEach(btn => {
      const isActive = btn.dataset.conceptColorMode === activeColorMode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function setColorMode(mode, targetNum = null) {
    activeColorMode = mode === 'dark' ? 'dark' : 'light';
    try { localStorage.setItem('promptdeck_concept_color_mode', activeColorMode); } catch (_) {}
    syncColorModeControls();

    let offsetTop = 0;
    if (targetNum) {
      const cardList = document.querySelectorAll('.concept-card');
      for (const card of cardList) {
        const numEl = card.querySelector('.concept-card-num');
        if (numEl && numEl.textContent === `#${targetNum}`) {
          offsetTop = card.getBoundingClientRect().top;
          break;
        }
      }
    }

    const scrollPos = window.scrollY;
    renderCards();

    if (targetNum) {
      const cardList = document.querySelectorAll('.concept-card');
      let targetCard = null;
      for (const card of cardList) {
        const numEl = card.querySelector('.concept-card-num');
        if (numEl && numEl.textContent === `#${targetNum}`) {
          targetCard = card;
          break;
        }
      }
      if (targetCard) {
        const newTop = targetCard.getBoundingClientRect().top;
        const diff = newTop - offsetTop;
        window.scrollBy(0, diff);

        const activeBtn = targetCard.querySelector(`.concept-card-mode-btn[data-concept-color-mode="${activeColorMode}"]`);
        if (activeBtn) {
          activeBtn.focus({ preventScroll: true });
        }
      } else {
        window.scrollTo(0, scrollPos);
      }
    } else {
      window.scrollTo(0, scrollPos);
    }
  }

  function renderCards() {
    const grid = document.getElementById('conceptGrid');
    const countEl = document.getElementById('conceptResultCount');
    if (!grid) return;
    const byCat = activeCategory === 'all' ? STYLES : STYLES.filter(s => s.category === activeCategory);
    const filtered = byCat.filter(s => matchesSearch(s, searchQuery));
    grid.innerHTML = '';
    if (countEl) {
      countEl.textContent = searchQuery
        ? `${filtered.length} / ${STYLES.length}개`
        : `${filtered.length}개`;
    }
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="concept-empty">검색 결과가 없습니다.</div>';
      return;
    }
    filtered.forEach(style => grid.appendChild(createCard(style)));
  }

  function buildFilterBar() {
    const bar = document.getElementById('conceptFilterBar');
    if (!bar) return;
    CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'concept-filter-btn' + (cat.id === 'all' ? ' active' : '');
      btn.textContent = cat.label;
      btn.dataset.catId = cat.id;
      btn.addEventListener('click', () => {
        activeCategory = cat.id;
        bar.querySelectorAll('.concept-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCards();
      });
      bar.appendChild(btn);
    });
  }

  function bindSearch() {
    const input = document.getElementById('conceptSearchInput');
    const clearBtn = document.getElementById('conceptSearchClear');
    if (!input) return;
    input.addEventListener('input', () => {
      searchQuery = input.value.trim();
      if (clearBtn) clearBtn.hidden = !searchQuery;
      renderCards();
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        searchQuery = '';
        clearBtn.hidden = true;
        input.focus();
        renderCards();
      });
    }
  }

  function bindColorMode() {
    try {
      const saved = localStorage.getItem('promptdeck_concept_color_mode');
      if (saved === 'dark' || saved === 'light') activeColorMode = saved;
    } catch (_) {}
    document.querySelectorAll('#conceptColorMode [data-concept-color-mode]').forEach(btn => {
      btn.addEventListener('click', () => setColorMode(btn.dataset.conceptColorMode));
    });
    syncColorModeControls();
  }

  function syncEngineModeControls(engine) {
    document.querySelectorAll('[data-concept-engine]').forEach(btn => {
      const isActive = btn.dataset.conceptEngine === engine;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function bindEngineMode() {
    const targetEngineSelect = document.getElementById("promotionTargetEngine");
    if (targetEngineSelect) {
      syncEngineModeControls(targetEngineSelect.value);
    }
    document.querySelectorAll('#conceptEngineMode [data-concept-engine]').forEach(btn => {
      btn.addEventListener('click', () => {
        const engine = btn.dataset.conceptEngine;
        selectedConceptEngine = engine;
        if (targetEngineSelect) {
          targetEngineSelect.value = engine;
        }
        syncEngineModeControls(engine);
        renderCards();
      });
    });
  }

  function init() {
    buildFilterBar();
    bindSearch();
    bindColorMode();
    bindEngineMode();

    const targetEngineSelect = document.getElementById("promotionTargetEngine");
    if (targetEngineSelect) {
      targetEngineSelect.addEventListener('change', () => {
        selectedConceptEngine = targetEngineSelect.value;
        syncEngineModeControls(targetEngineSelect.value);
        renderCards();
      });
    }

    renderCards();
  }

  window.resolveStyleForMode = resolveStyleForMode;
  window.buildPromotionConceptStyle = buildPromotionConceptStyle;

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
