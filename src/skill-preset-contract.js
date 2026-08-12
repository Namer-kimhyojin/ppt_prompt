(function (root) {
  "use strict";

  const VERSIONS = Object.freeze({
    designCurrent: "4.0",
    plannerCurrent: "3.6",
    plannerSupported: Object.freeze(["3.5", "3.6"]),
    skillPresetCurrent: "1.0",
  });

  const AUTHORITY = Object.freeze({
    locked: Object.freeze({ rank: 0, labelKo: "구성 고정", labelEn: "composition locked" }),
    guided: Object.freeze({ rank: 1, labelKo: "읽기 방향 가이드", labelEn: "guided composition" }),
    open: Object.freeze({ rank: 2, labelKo: "의미만 고정", labelEn: "meaning locked, composition delegated" }),
  });

  function cleanScalar(value) {
    return String(value == null ? "" : value)
      .trim()
      .replace(/^(['"])([\s\S]*)\1$/, "$2")
      .trim();
  }

  function normalizeFieldKey(value) {
    return String(value || "")
      .replace(/\*\*/g, "")
      .replace(/[〔〕()[\]{}._·ㆍ\-\s]/g, "")
      .toLowerCase();
  }

  function parseFrontMatter(markdown) {
    const match = String(markdown || "").match(/^\uFEFF?---\s*\r?\n([\s\S]*?)\r?\n---(?:\s*\r?\n|$)/);
    if (!match) return {};
    return match[1].split(/\r?\n/).reduce((fields, line) => {
      const item = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/);
      if (item) fields[item[1]] = cleanScalar(item[2]);
      return fields;
    }, {});
  }

  function parseContractVersions(markdown, fallback = {}) {
    const fields = parseFrontMatter(markdown);
    const legacyContractVersion = cleanScalar(fallback.contractVersion);
    const legacyPlannerVersion = isPlannerVersionSupported(legacyContractVersion);
    return {
      designContractVersion: cleanScalar(
        fields.design_contract_version
        || fallback.designContractVersion
        || (legacyPlannerVersion ? "" : legacyContractVersion)
        || VERSIONS.designCurrent
      ),
      plannerContractVersion: cleanScalar(
        fields.promptdeck_contract
        || fields.planner_contract_version
        || fallback.plannerContractVersion
        || (legacyPlannerVersion ? legacyContractVersion : "")
        || VERSIONS.plannerCurrent
      ),
      skillPresetContractVersion: cleanScalar(
        fields.skill_preset_contract
        || fallback.skillPresetContractVersion
        || VERSIONS.skillPresetCurrent
      ),
      fields,
    };
  }

  function isPlannerVersionSupported(version) {
    return VERSIONS.plannerSupported.includes(cleanScalar(version));
  }

  function extractField(text, labels) {
    const accepted = new Set(labels.map(normalizeFieldKey));
    for (const line of String(text || "").split(/\r?\n/)) {
      const match = line.match(/^\s*[-*+]?\s*(?:\*\*)?([^:：*]+?)(?:\*\*)?\s*[:：]\s*(.*?)\s*$/);
      if (match && accepted.has(normalizeFieldKey(match[1]))) return cleanScalar(match[2]);
    }
    return "";
  }

  function normalizeList(value) {
    const source = cleanScalar(value);
    if (!source || /^(?:없음|해당\s*없음|none|n\/a|not applicable)$/i.test(source)) return [];
    return source
      .split(/\s*(?:,|;|\||·|ㆍ|\/)\s*/)
      .map(cleanScalar)
      .filter(Boolean);
  }

  function normalizeAuthority(value) {
    const source = cleanScalar(value);
    if (/구성\s*(?:고정|잠금)|레이아웃\s*(?:고정|잠금)|composition\s*lock|layout\s*lock|fixed\s*composition|^locked$/i.test(source)) return "locked";
    if (/읽기\s*(?:방향|순서).*가이드|가이드형|guided|reading\s*(?:flow|direction)|semantic\s*group/i.test(source)) return "guided";
    if (/의미(?:·|\s)*(?:데이터)?만\s*고정|구성\s*위임|AI\s*(?:구성|위임)|meaning\s*(?:only|locked)|composition\s*(?:delegated|open)|^open$/i.test(source)) return "open";
    if (/^low$/i.test(source)) return "locked";
    if (/^medium$/i.test(source)) return "guided";
    if (/^high$/i.test(source)) return "open";
    return "";
  }

  function parseSkillDirectives(text) {
    const compositionAuthorityValue = extractField(text, [
      "구성 위임 수준",
      "구성 자유도",
      "구성 잠금 수준",
      "AI 구성 위임",
      "composition autonomy",
      "composition delegation",
      "composition lock",
      "layout freedom",
    ]);
    return {
      compositionAuthority: normalizeAuthority(compositionAuthorityValue),
      compositionAuthorityValue,
      locks: normalizeList(extractField(text, ["잠금 항목", "스킬 잠금", "skill locks", "locked items"])),
      guides: normalizeList(extractField(text, ["가이드 항목", "스킬 가이드", "skill guides", "guided items"])),
      free: normalizeList(extractField(text, ["자유 항목", "자유 범위", "스킬 자유", "skill free", "free range", "free items"])),
      lockReason: extractField(text, ["구성 잠금 이유", "잠금 이유", "구성 잠금", "lock reason", "composition lock reason"]),
      presetScope: normalizeList(extractField(text, ["프리셋 적용 범위", "preset scope", "preset compatibility", "preset application scope"])),
    };
  }

  function resolveCompositionAuthority(options = {}) {
    const declaredAuthority = normalizeAuthority(options.declaredAuthority) || "open";
    const safetyFloor = normalizeAuthority(options.safetyFloor) || "open";
    const presetPreference = normalizeAuthority(options.presetPreference) || "open";
    const declared = AUTHORITY[declaredAuthority];
    const safety = AUTHORITY[safetyFloor];
    const key = safety.rank < declared.rank ? safetyFloor : declaredAuthority;
    return {
      key,
      declaredAuthority,
      safetyFloor,
      presetPreference,
      source: safety.rank < declared.rank ? "safety" : (normalizeAuthority(options.declaredAuthority) ? "skill" : "default"),
      presetAffectsAuthority: false,
      trace: [
        `skill=${declaredAuthority}`,
        `safety=${safetyFloor}`,
        `preset-preference=${presetPreference}`,
        `resolved=${key}`,
      ],
    };
  }

  root.PromptDeckSkillPresetContract = Object.freeze({
    versions: VERSIONS,
    authority: AUTHORITY,
    parseFrontMatter,
    parseContractVersions,
    isPlannerVersionSupported,
    extractField,
    normalizeList,
    normalizeAuthority,
    parseSkillDirectives,
    resolveCompositionAuthority,
  });
})(typeof window !== "undefined" ? window : globalThis);
