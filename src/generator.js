;

    // Slide prompt generator logic
    (function () {
      const $ = (id) => document.getElementById(id);
      const DEFAULT_SPLIT_RULES = $("genSplitRules").value.trim();
      const SPLIT_RULES_DRAFT_KEY = "slidePromptGenerator.splitRulesDraft";
      const SPLIT_RULES_LIBRARY_KEY = "slidePromptGenerator.splitRulesLibrary";
      const DEFAULT_HEADER_FOOTER_SETTINGS = {
        headerEnabled: true,
        footerEnabled: true,
        headerFields: null,
        footerFields: null,
      };
      const HEADER_FOOTER_CONTRACT = window.PromptDeckHeaderFooterContract || null;
      const SKILL_PRESET_CONTRACT = window.PromptDeckSkillPresetContract || null;
      const PROMPT_PACKAGE_SCHEMA_VERSION = 1;
      const PROMPTDECK_CONTRACT_VERSION = SKILL_PRESET_CONTRACT?.versions?.plannerCurrent || "3.6";
      const DESIGN_CONTRACT_VERSION = SKILL_PRESET_CONTRACT?.versions?.designCurrent || "4.0";
      const SKILL_PRESET_CONTRACT_VERSION = SKILL_PRESET_CONTRACT?.versions?.skillPresetCurrent || "1.0";
      const SPECIAL_PAGE_TYPES = new Set(["cover", "agenda", "divider", "closing"]);
      const SPECIAL_PAGE_TYPE_LABELS = {
        cover: "표지",
        agenda: "목차",
        divider: "간지",
        closing: "맺음말",
      };
      const SPECIAL_PAGE_TYPE_LABELS_EN = {
        cover: "cover",
        agenda: "agenda",
        divider: "section divider",
        closing: "closing",
      };
      const VISUAL_PRESENCE_PROFILES = {
        strong: { labelKo: "강한 주도형", labelEn: "strong focal-led", shortKo: "강", className: "is-strong" },
        balanced: { labelKo: "균형 강조형", labelEn: "balanced emphasis", shortKo: "균형", className: "is-balanced" },
        structured: { labelKo: "구조 중심형", labelEn: "structure-led", shortKo: "구조", className: "is-structured" },
        restrained: { labelKo: "절제 검토형", labelEn: "restrained review-led", shortKo: "절제", className: "is-restrained" },
      };
      const GENERATION_PATH_PROFILES = {
        full_slide: { labelKo: "완성 이미지", labelEn: "full slide", shortKo: "완성", className: "is-full" },
        precision_full_slide: { labelKo: "정밀 일체형", labelEn: "precision full slide", shortKo: "정밀", className: "is-precision" },
        background_then_composite: { labelKo: "정밀 일체형", labelEn: "precision full slide", shortKo: "정밀", className: "is-precision" },
        edit_reference: { labelKo: "참조 편집", labelEn: "reference edit", shortKo: "참조", className: "is-reference" },
        unspecified: { labelKo: "경로 확인", labelEn: "path review", shortKo: "확인", className: "is-review" },
      };
      const COMPOSITION_AUTONOMY_PROFILES = {
        open: { rank: 2, labelKo: "의미만 고정", labelEn: "meaning locked, composition delegated", shortKo: "AI 구성", className: "is-open" },
        guided: { rank: 1, labelKo: "읽기 방향 가이드", labelEn: "guided composition", shortKo: "가이드", className: "is-guided" },
        locked: { rank: 0, labelKo: "구성 고정", labelEn: "composition locked", shortKo: "고정", className: "is-locked" },
      };
      const VISUAL_RESOURCE_LABELS = {
        photo: { ko: "실사 이미지", en: "photography" },
        layeredComposite: { ko: "다중 레이어 이미지 합성", en: "multi-layer image composition" },
        icons: { ko: "아이콘·픽토그램", en: "icons and pictograms" },
        gradients: { ko: "그라데이션 효과", en: "gradient effects" },
        threeD: { ko: "3D 개체", en: "3D objects" },
        illustration: { ko: "일러스트레이션", en: "illustration" },
        dataVisualization: { ko: "데이터 시각화", en: "data visualization" },
        diagramInfographic: { ko: "다이어그램·인포그래픽", en: "diagrams and infographics" },
        typographicFocal: { ko: "타이포그래피 중심 표현", en: "typographic focal expression" },
      };

      const genState = {
        latestOutput: "",
        latestFormat: "markdown",
        records: [],
        currentIndex: 0,
        isEditing: false,
        savedPrompts: loadSavedPrompts(),
        savedSplitRules: loadSavedSplitRules(),
        commonConfig: null,
        commonUserInput: null,
        commonDesignPackage: null,
        commonPromptPackageMeta: null,
        commonPromptSections: [],
        commonPromptDraft: [],
        commonPromptReturnFocus: null,
        executionPromptOverrides: { ko: null, en: null },
        executionPromptDraft: null,
        executionPromptDraftLang: "en",
        executionPromptReturnFocus: null,
        headerFooterSettings: deepClone(DEFAULT_HEADER_FOOTER_SETTINGS),
        plannerEnhancements: { visualDirector: true },
        specialSlideScope: { individualDesign: true },
        headerFooterDraft: null,
        configModalIndex: null,
        configDraft: null,
        configReturnFocus: null
      };

      window.PromptDeckSlidePromptGenerator = {
        getRecords() {
          return genState.records.map((record, index) => ({
            index,
            entryType: normalizeStoredRecordType(record),
            slideNo: record.slide_no,
            title: record.title || "",
            prompt: record.prompt || "",
            promptId: promptId(record),
            label: displayNo(record),
            generationPath: record.generationPath || extractGenerationPath(record.screenSpec),
            contractVersion: record.contractVersion || genState.commonPromptPackageMeta?.plannerContractVersion || PROMPTDECK_CONTRACT_VERSION,
            plannerContractVersion: record.plannerContractVersion || record.contractVersion || PROMPTDECK_CONTRACT_VERSION,
            designContractVersion: genState.commonPromptPackageMeta?.designContractVersion || DESIGN_CONTRACT_VERSION,
            skillPresetContractVersion: record.skillPresetContractVersion || genState.commonPromptPackageMeta?.skillPresetContractVersion || SKILL_PRESET_CONTRACT_VERSION,
            targetModel: record.targetModel || resolvePackageTargetModel(),
            outputMode: record.outputMode || resolvePackageOutputMode(),
            pageType: inferPageTypeForRecord(record),
            headerFooterApplied: !isSpecialSlideRecord(record),
            visualPresence: deriveVisualPresence(record),
            compositionAutonomy: deriveCompositionAutonomy(record),
            generationPlan: deriveGenerationPlan(record.screenSpec),
            diagramPlan: deriveDiagramPlan(record.screenSpec),
            commonPromptApplied: typeof record.commonPromptApplied === "boolean"
              ? record.commonPromptApplied
              : !usesIndividualSpecialSlideDesign(record),
          }));
        },
        getCurrentRecord() {
          const record = genState.records[genState.currentIndex];
          if (!record) return null;
          return {
            index: genState.currentIndex,
            entryType: normalizeStoredRecordType(record),
            slideNo: record.slide_no,
            title: record.title || "",
            prompt: record.prompt || "",
            promptId: promptId(record),
            label: displayNo(record),
            generationPath: record.generationPath || extractGenerationPath(record.screenSpec),
            contractVersion: record.contractVersion || genState.commonPromptPackageMeta?.plannerContractVersion || PROMPTDECK_CONTRACT_VERSION,
            plannerContractVersion: record.plannerContractVersion || record.contractVersion || PROMPTDECK_CONTRACT_VERSION,
            designContractVersion: genState.commonPromptPackageMeta?.designContractVersion || DESIGN_CONTRACT_VERSION,
            skillPresetContractVersion: record.skillPresetContractVersion || genState.commonPromptPackageMeta?.skillPresetContractVersion || SKILL_PRESET_CONTRACT_VERSION,
            targetModel: record.targetModel || resolvePackageTargetModel(),
            outputMode: record.outputMode || resolvePackageOutputMode(),
            pageType: inferPageTypeForRecord(record),
            headerFooterApplied: !isSpecialSlideRecord(record),
            visualPresence: deriveVisualPresence(record),
            compositionAutonomy: deriveCompositionAutonomy(record),
            generationPlan: deriveGenerationPlan(record.screenSpec),
            diagramPlan: deriveDiagramPlan(record.screenSpec),
            commonPromptApplied: typeof record.commonPromptApplied === "boolean"
              ? record.commonPromptApplied
              : !usesIndividualSpecialSlideDesign(record),
          };
        },
        getCommonPromptPackage() {
          return {
            schemaVersion: PROMPT_PACKAGE_SCHEMA_VERSION,
            contractVersion: genState.commonPromptPackageMeta?.designContractVersion || DESIGN_CONTRACT_VERSION,
            designContractVersion: genState.commonPromptPackageMeta?.designContractVersion || DESIGN_CONTRACT_VERSION,
            plannerContractVersion: genState.commonPromptPackageMeta?.plannerContractVersion || PROMPTDECK_CONTRACT_VERSION,
            skillPresetContractVersion: genState.commonPromptPackageMeta?.skillPresetContractVersion || SKILL_PRESET_CONTRACT_VERSION,
            text: commonPromptInput.value,
            lang: resolveCommonPromptLanguage(),
            source: genState.commonPromptPackageMeta?.source || "slide-prompt-generator",
            config: deepClone(genState.commonConfig),
            userInput: normalizeCommonUserInput(genState.commonUserInput),
            designPackage: deepClone(genState.commonDesignPackage),
            targetModel: resolvePackageTargetModel(),
            outputMode: resolvePackageOutputMode(),
            enabledSlots: deepClone(genState.commonPromptPackageMeta?.enabledSlots || deriveEnabledSlots(genState.commonDesignPackage)),
          };
        },
        setCommonPrompt(promptPackage = {}) {
          const text = String(promptPackage.text || "");
          const lang = promptPackage.lang === "en" ? "en" : "ko";
          const promptDeck = window.PromptDeck;
          const config = promptPackage.config
            ? (typeof promptDeck?.normalizeConfig === "function"
              ? promptDeck.normalizeConfig(promptPackage.config)
              : deepClone(promptPackage.config))
            : null;

          commonPromptInput.value = text;
          commonPromptInput.dataset.promptLang = lang;
          delete commonPromptInput.dataset.configDetached;
          genState.commonConfig = config ? deepClone(config) : null;
          genState.commonUserInput = normalizeCommonUserInput(promptPackage.userInput);
          genState.commonDesignPackage = promptPackage.designPackage && typeof promptPackage.designPackage === "object"
            ? deepClone(promptPackage.designPackage)
            : null;
          genState.commonPromptPackageMeta = normalizePromptPackageMeta(promptPackage);
          syncHeaderFooterWithDesignPackage(genState.commonPromptPackageMeta.enabledSlots);
          resetCommonPromptSections(text);
          updateHeaderFooterStatus();
          updateExecutionPromptStatus();
        },
      };

      function deriveEnabledSlots(designPackage) {
        const enabledSections = designPackage?.enabledSections || {};
        const settings = designPackage?.settings || {};
        const header = settings.header || {};
        const footer = settings.footer || {};
        const headerEnabled = enabledSections.header !== false && header.type !== "none";
        const footerEnabled = enabledSections.footer !== false && footer.type !== "none";
        return {
          contractVersion: HEADER_FOOTER_CONTRACT?.version || "legacy",
          header: {
            enabled: headerEnabled,
            dynamicCategories: true,
            sectionLabel: headerEnabled && header.showSectionLabel === true,
            subtitle: headerEnabled && header.showSubtitle === true,
            pageNumber: headerEnabled && header.showPageNumber === true,
          },
          footer: {
            enabled: footerEnabled,
            dynamicCategories: true,
            pageNumber: footerEnabled && footer.showPageNumber === true,
          },
        };
      }

      function normalizePromptPackageMeta(promptPackage = {}) {
        const designPackage = promptPackage.designPackage && typeof promptPackage.designPackage === "object"
          ? promptPackage.designPackage
          : null;
        const legacyContractVersion = String(promptPackage.contractVersion || "");
        const legacyPlannerVersion = Boolean(
          legacyContractVersion
          && (SKILL_PRESET_CONTRACT?.isPlannerVersionSupported?.(legacyContractVersion)
            ?? ["3.5", "3.6"].includes(legacyContractVersion))
        );
        const designContractVersion = String(
          promptPackage.designContractVersion
          || designPackage?.contracts?.design
          || (legacyPlannerVersion ? "" : legacyContractVersion)
          || DESIGN_CONTRACT_VERSION
        );
        const plannerContractVersion = String(
          promptPackage.plannerContractVersion
          || designPackage?.contracts?.planner
          || (legacyPlannerVersion ? legacyContractVersion : "")
          || PROMPTDECK_CONTRACT_VERSION
        );
        const skillPresetContractVersion = String(
          promptPackage.skillPresetContractVersion
          || designPackage?.contracts?.skillPreset
          || designPackage?.settings?.skillPresetContract?.version
          || SKILL_PRESET_CONTRACT_VERSION
        );
        return {
          schemaVersion: Number(promptPackage.schemaVersion) || PROMPT_PACKAGE_SCHEMA_VERSION,
          contractVersion: designContractVersion,
          designContractVersion,
          plannerContractVersion,
          skillPresetContractVersion,
          source: String(promptPackage.source || designPackage?.source || "unknown"),
          targetModel: String(promptPackage.targetModel || designPackage?.project?.targetModel || "common"),
          outputMode: String(promptPackage.outputMode || designPackage?.project?.outputMode || "standard"),
          enabledSlots: deepClone(promptPackage.enabledSlots || deriveEnabledSlots(designPackage)),
        };
      }

      function resolvePackageTargetModel() {
        return genState.commonPromptPackageMeta?.targetModel
          || genState.commonDesignPackage?.project?.targetModel
          || "common";
      }

      function resolvePackageOutputMode() {
        return genState.commonPromptPackageMeta?.outputMode
          || genState.commonDesignPackage?.project?.outputMode
          || genState.commonConfig?.promptSettings?.outputMode
          || "standard";
      }

      function syncHeaderFooterWithDesignPackage(enabledSlots) {
        if (!enabledSlots || typeof enabledSlots !== "object") return;
        const next = normalizeHeaderFooterSettings(genState.headerFooterSettings);
        if (typeof enabledSlots.header?.enabled === "boolean") next.headerEnabled = enabledSlots.header.enabled;
        if (typeof enabledSlots.footer?.enabled === "boolean") next.footerEnabled = enabledSlots.footer.enabled;
        genState.headerFooterSettings = next;
      }

      function explicitGenerationPath(screenSpec) {
        const value = String(screenSpec || "").match(/^\s*[-*+]\s*생성 경로\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
          || String(screenSpec || "").match(/^\s*[-*+]\s*Generation Path\s*[:：]\s*(.+?)\s*$/mi)?.[1]?.trim()
          || "";
        if (/정밀.*(?:일체|완성)|precision.*(?:full|slide)|배경.*합성|background.*composit/i.test(value)) return { path: "precision_full_slide", value };
        if (/편집|참조|edit|reference/i.test(value)) return { path: "edit_reference", value };
        if (/일반.*일체|전체|완성|full/i.test(value)) return { path: "full_slide", value };
        return value ? { path: "unspecified", value } : null;
      }

      function deriveDiagramPlan(screenSpec) {
        const source = String(screenSpec || "");
        const record = { screenSpec: source, entryType: "slide" };
        const content = plannerSectionText(source, /^(콘텐츠|본문\s*콘텐츠|본문|content)$/i);
        const expression = plannerSectionText(source, /^(표현\s*방식|expression|visual\s*direction)$/i);
        const quality = plannerSectionText(source, /^(품질\s*조건|quality\s*conditions?)$/i);
        const explicitType = extractPlannerSettingValue(record, "도식\\s*유형|다이어그램\\s*유형|diagram\\s*type");
        const explicitCode = extractPlannerSettingValue(record, "도식\\s*복잡도|다이어그램\\s*복잡도|diagram\\s*complexity").match(/\bD([0-4])\b/i)?.[0]?.toUpperCase() || "";
        const relationship = extractPlannerSettingValue(record, "관계\\s*구조|연결\\s*구조|도식\\s*구조|relationship\\s*structure");
        const integrity = extractPlannerSettingValue(record, "구조\\s*무결성|관계\\s*무결성|structure\\s*integrity");
        const labelScope = extractPlannerSettingValue(record, "관계\\s*레이블\\s*적용\\s*범위|relationship\\s*label\\s*scope");
        const allowedConnections = extractPlannerSettingValue(record, "허용\\s*연결|허용\\s*관계|allowed\\s*(?:connections?|relationships?)");
        const forbiddenConnections = extractPlannerSettingValue(record, "금지\\s*연결|금지\\s*관계|forbidden\\s*(?:connections?|relationships?)");
        const arrowheadPolicy = extractPlannerSettingValue(record, "화살촉\\s*(?:규칙|정책|수)|arrowhead\\s*(?:rule|policy|count)");
        const connectionCorridors = extractPlannerSettingValue(record, "연결\\s*통로|connection\\s*corridors?");
        const meaningStatement = extractPlannerSettingValue(record, "도식\\s*핵심\\s*판단|의미\\s*문장|diagram\\s*(?:core\\s*)?(?:judg(?:e)?ment|argument)|meaning\\s*statement");
        const decisionTakeaway = extractPlannerSettingValue(record, "결론\\s*귀착점|판단\\s*캡션|목표\\s*판단(?:\\s*또는\\s*행동)?|decision\\s*(?:takeaway|endpoint)|target\\s*(?:judg(?:e)?ment|action)");
        const inlineNodeRoles = content.split(/\r?\n/)
          .filter((line) => /\|\s*(?:역할구|역할\s*설명|role)\s*[:：]/i.test(line))
          .map((line) => line.replace(/^\s*[-*+]\s*/, "").trim())
          .join(" | ");
        const inlineRelationshipActions = content.split(/\r?\n/)
          .filter((line) => /(?:관계|EDGE)[^\r\n]*\|\s*(?:관계\s*동사|표시\s*관계구|relationship\s*(?:action|verb))\s*[:：]/i.test(line))
          .map((line) => line.replace(/^\s*[-*+]\s*/, "").trim())
          .join(" | ");
        const nodeRoles = extractPlannerSettingValue(record, "노드\\s*역할(?:\\s*설명|구)?|node\\s*roles?(?:\\s*descriptions?)?") || inlineNodeRoles;
        const relationshipActions = extractPlannerSettingValue(record, "관계\\s*(?:동사|의미\\s*문구)|연결\\s*(?:동사|의미)|relationship\\s*(?:actions?|verbs?|meanings?)") || inlineRelationshipActions;
        const evidenceStatus = extractPlannerSettingValue(record, "관계\\s*지위|증거\\s*지위|relationship\\s*status|evidence\\s*status");
        const argumentGrammar = extractPlannerSettingValue(record, "논증\\s*(?:문법|경로)|argument\\s*(?:grammar|path)");
        const headline = extractPlannerSettingValue(record, "주장\\s*헤드라인|claim\\s*headline");
        const combined = `${content}\n${expression}\n${quality}`;
        const diagramSignal = Boolean(explicitType || explicitCode || relationship || integrity
          || /다이어그램|인포그래픽|흐름도|관계도|네트워크|생태계|허브.?스포크|허브.?브랜치|프로세스|의사결정|순환|피드백|계층|로드맵|타임라인|diagram|infographic|flowchart|network|ecosystem|hierarchy|roadmap|timeline/i.test(combined));
        if (!diagramSignal) {
          return {
            code: "D0",
            labelKo: "도식 없음",
            labelEn: "no diagram",
            type: "",
            nodeCount: 0,
            edgeCount: 0,
            relationship: "",
            integrity: "",
            labelScope: "",
            allowedConnections: "",
            forbiddenConnections: "",
            arrowheadPolicy: "",
            connectionCorridors: "",
            meaningStatement: "",
            decisionTakeaway: "",
            nodeRoles: "",
            relationshipActions: "",
            evidenceStatus: "",
            argumentGrammar: "",
            semanticRequired: false,
            semanticReady: true,
            semanticMissing: [],
            abstractHeadline: false,
            requiresPrecision: false,
          };
        }

        const totalNodeCount = Number(source.match(/(?:총|전체|합계)\s*노드\s*(?:수)?\s*[:：]?\s*(\d+)\s*개?/i)?.[1]
          || source.match(/노드\s*(?:총|합계|수)\s*[:：]?\s*(\d+)\s*개?/i)?.[1]
          || 0);
        const integrityNodeCounts = integrity
          .split(/[·|,;]/)
          .map((segment) => Number(segment.match(/노드\s*(\d+)\s*개/i)?.[1] || 0))
          .filter((count) => count > 0);
        const explicitNodeCount = totalNodeCount
          || (integrityNodeCounts.length > 1
            ? integrityNodeCounts.reduce((sum, count) => sum + count, 0)
            : integrityNodeCounts[0])
          || Number(source.match(/(?:노드|단계|영역)\s*(?:수)?\s*[:：]?\s*(\d+)\s*개?/i)?.[1]
            || source.match(/노드\s*(\d+)\s*개/i)?.[1]
            || 0);
        const candidateLines = content.split(/\r?\n/).filter((line) => /^\s*[-*+]\s*(?:노드\s*\d+|단계\s*\d+|중심\s*기능|보완\s*기능\s*\d+|현재\s*생산|확정\s*투자|정책\s*목표|실행\s*조건\s*\d+|원인\s*\d+|결과\s*\d+|상위\s*군\s*\d+)/i.test(line));
        const nodeCount = explicitNodeCount || candidateLines.length || Math.min(countPlannerDisplayItems(record), 12);
        const explicitEdgeCount = Number(source.match(/(?:연결|엣지|화살표)\s*(?:수)?\s*[:：]?\s*(\d+)\s*개?/i)?.[1]
          || source.match(/(?:연결|엣지|화살표)\s*(\d+)\s*개/i)?.[1]
          || 0);
        const arrowCount = (relationship.match(/(?:→|->|⇒)/g) || []).length;
        const edgeCount = explicitEdgeCount || arrowCount;
        const relationKinds = [
          /분기|합류|branch|merge/i.test(combined),
          /순환|피드백|loop|cycle|feedback/i.test(combined),
          /계층|포함|소속|hierarch|contain/i.test(combined),
          /허브|중심.?보완|network|ecosystem/i.test(combined),
          /시간|타임라인|로드맵|timeline|roadmap/i.test(combined),
          /조건|게이트|의존|dependency|gate/i.test(combined),
        ].filter(Boolean).length;
        const longLabel = candidateLines.some((line) => line.replace(/^\s*[-*+]\s*/, "").length >= 42);

        let level = Number(explicitCode.slice(1)) || 0;
        if (!level) {
          if (nodeCount > 12 || edgeCount > 16 || relationKinds >= 4) level = 4;
          else if (nodeCount > 7 || edgeCount > 8 || relationKinds >= 3) level = 3;
          else if (nodeCount > 4 || edgeCount > 4 || relationKinds >= 2) level = 2;
          else level = 1;
          if (longLabel && level < 4) level += 1;
        }

        const inferredType = explicitType || (/(?:타임라인|로드맵|시간)/i.test(combined)
          ? "시간·상태"
          : /(?:순환|피드백)/i.test(combined)
            ? "순환·피드백"
            : /(?:계층|포함|소속)/i.test(combined)
              ? "계층·레이어"
              : /(?:허브|네트워크|생태계|중심.?보완)/i.test(combined)
                ? "네트워크·생태계"
                : /(?:분기|합류|결정)/i.test(combined)
                  ? "분기·결정"
                  : "과정·관계");
        const semanticRequired = Boolean(
          explicitType
          || explicitCode
          || relationship
          || integrity
          || /^\s*[-*+]\s*(?:노드\s*\d+|관계\s*EDGE-?\d+)\s*[:：]/mi.test(content)
        );
        const semanticRequirements = [
          ["도식 핵심 판단", meaningStatement],
          ["관계 동사", relationshipActions],
          ["결론 귀착점 또는 목표 판단", decisionTakeaway],
          ["관계 지위", evidenceStatus],
          ...(level >= 2 ? [["노드 역할", nodeRoles], ["논증 경로", argumentGrammar]] : []),
        ];
        const semanticMissing = semanticRequired
          ? semanticRequirements.filter(([, value]) => !value).map(([label]) => label)
          : [];
        const abstractHeadline = Boolean(
          headline
          && /작동\\s*구조|공동\\s*성과|연계\\s*체계|생태계(?:의)?(?:\\s*구조)?/i.test(headline)
          && !/→|보다|통해|지원|관리|전환|합류|우선|목표|판단|차이|격차|확대|축소|증가|감소/i.test(headline)
        );
        return {
          code: `D${level}`,
          labelKo: ["도식 없음", "단순 도식", "구조형 도식", "복합 도식", "과밀 위험"][level],
          labelEn: ["no diagram", "simple diagram", "structured diagram", "complex diagram", "overcrowding risk"][level],
          type: inferredType,
          nodeCount,
          edgeCount,
          relationship,
          integrity,
          labelScope,
          allowedConnections,
          forbiddenConnections,
          arrowheadPolicy,
          connectionCorridors,
          meaningStatement,
          decisionTakeaway,
          nodeRoles,
          relationshipActions,
          evidenceStatus,
          argumentGrammar,
          semanticRequired,
          semanticReady: !semanticRequired || (semanticMissing.length === 0 && !abstractHeadline),
          semanticMissing,
          abstractHeadline,
          requiresPrecision: semanticRequired && level >= 2,
        };
      }

      function deriveGenerationPlan(screenSpec) {
        const explicit = explicitGenerationPath(screenSpec);
        const record = { screenSpec: String(screenSpec || ""), entryType: "slide" };
        const densityCode = extractInformationDensityCode(record);
        const visualizationCode = extractDataVisualizationCode(record);
        const diagramPlan = deriveDiagramPlan(screenSpec);
        const displayItems = countPlannerDisplayItems(record);
        const content = plannerSectionText(record.screenSpec, /^(콘텐츠|본문\s*콘텐츠|본문|content)$/i);
        const tableRows = parsePlannerDataRows(content).length;
        const referenceLocked = /(?:콘텐츠\s*참조|참조\s*(?:이미지|자산)).*(?:동일성|보존|고정)|(?:identity|reference).*(?:preserve|lock)/i.test(record.screenSpec);

        let path = explicit?.path || "";
        let reasonKo = explicit ? `개별 명세 지정: ${explicit.value}` : "";
        let reasonEn = explicit ? `Declared by the individual specification: ${explicit.value}` : "";
        let source = explicit ? "declared" : "derived";

        if (!path && referenceLocked) {
          path = "edit_reference";
          reasonKo = "참조 동일성·구조 보존 필요";
          reasonEn = "reference identity or structure must be preserved";
        } else if (!path && (diagramPlan.requiresPrecision || /V[34]/.test(visualizationCode) || densityCode === "C4" || tableRows >= 6 || displayItems >= 9)) {
          path = "precision_full_slide";
          reasonKo = diagramPlan.requiresPrecision
            ? `${diagramPlan.code} ${diagramPlan.type} 구조 무결성 요구`
            : /V[34]/.test(visualizationCode)
              ? `${visualizationCode} 데이터 정확도 요구`
            : densityCode === "C4"
              ? "C4 상세 검토 수준"
              : tableRows >= 6
                ? `정확한 표 ${tableRows}행`
                : `표시 항목 ${displayItems}개`;
          reasonEn = diagramPlan.requiresPrecision
            ? `${diagramPlan.code} ${diagramPlan.type} structural-integrity requirement`
            : /V[34]/.test(visualizationCode)
              ? `${visualizationCode} data-accuracy requirement`
            : densityCode === "C4"
              ? "C4 detailed-review density"
              : tableRows >= 6
                ? `${tableRows} exact table rows`
                : `${displayItems} display items`;
        } else if (!path) {
          path = "full_slide";
          reasonKo = `${densityCode || "밀도 미지정"}/${visualizationCode || "시각화 미지정"} · 짧은 표시 항목 ${displayItems}개`;
          reasonEn = `${densityCode || "unspecified density"}/${visualizationCode || "unspecified visualization"} with ${displayItems} concise display items`;
        }

        const profile = GENERATION_PATH_PROFILES[path] || GENERATION_PATH_PROFILES.unspecified;
        return {
          path,
          labelKo: profile.labelKo,
          labelEn: profile.labelEn,
          shortKo: profile.shortKo,
          className: profile.className,
          reasonKo,
          reasonEn,
          source,
          densityCode,
          visualizationCode,
          displayItems,
          tableRows,
          diagramPlan,
        };
      }

      function extractGenerationPath(screenSpec) {
        return deriveGenerationPlan(screenSpec).path;
      }

      const PROJECT_SCHEMA_VERSION = 13;

      const commonPromptInput = $("genCommonPrompt");
      commonPromptInput.addEventListener("input", (event) => {
        resetCommonPromptSections(commonPromptInput.value);
        updateExecutionPromptStatus();
        if (event.isTrusted) {
          delete commonPromptInput.dataset.promptLang;
          commonPromptInput.dataset.configDetached = "true";
          genState.commonConfig = null;
          genState.commonUserInput = null;
          genState.commonDesignPackage = null;
          genState.commonPromptPackageMeta = null;
        }
      });

      $("genFileInput").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        $("genMdInput").value = await file.text();
        updateHeaderFooterStatus();
        renderPlannerContractStatus();
        renderSplitRulesPreview();
        renderBuilderLivePreview();
        setMessage(`파일을 불러왔습니다: ${file.name}`, false);
      });

      $("genGenerateBtn").addEventListener("click", generate);
      $("genCommonPromptManageBtn").addEventListener("click", openCommonPromptModal);
      $("genCommonPromptApplyBtn").addEventListener("click", applyCommonPromptManagement);
      $("genCommonPromptSelectAllBtn").addEventListener("click", () => setAllCommonPromptSections(true));
      $("genCommonPromptClearSelectionBtn").addEventListener("click", () => setAllCommonPromptSections(false));
      $("genExecutionPromptManageBtn").addEventListener("click", openExecutionPromptModal);
      $("genExecutionPromptApplyBtn").addEventListener("click", applyExecutionPromptManagement);
      $("genExecutionPromptResetBtn").addEventListener("click", resetExecutionPromptDraft);
      $("genExecutionPromptSelectAllBtn").addEventListener("click", () => setAllExecutionPromptRules(true));
      $("genHeaderFooterSettingsBtn").addEventListener("click", openHeaderFooterModal);
      $("genHeaderFooterApplyBtn").addEventListener("click", applyHeaderFooterSettings);
      $("genMobileInputBtn").addEventListener("click", () => setMobilePanel("input", true));
      $("genMobileResultBtn").addEventListener("click", () => setMobilePanel("result", true));
      $("genCopyBtn").addEventListener("click", copyOutput);
      $("genCopyCurrentBtn").addEventListener("click", copyCurrent);
      $("genCopyCurrentTopBtn").addEventListener("click", copyCurrent);
      $("genDownloadBtn").addEventListener("click", downloadOutput);
      $("genClearBtn").addEventListener("click", clearAll);
      $("genSampleBtn").addEventListener("click", insertSample);
      $("genPlannerTemplateBtn").addEventListener("click", insertPlannerTemplate);
      $("genPlannerConvertBtn").addEventListener("click", convertPlannerInput);
      $("genSaveProjectBtn").addEventListener("click", saveProject);
      $("genLoadProjectBtn").addEventListener("click", loadProject);
      $("genJumpBtn").addEventListener("click", jumpToSlide);
      $("genEditCurrentBtn").addEventListener("click", openCurrentEditor);
      $("genSaveEditBtn").addEventListener("click", saveCurrentEdit);
      $("genRestoreSavedBtn").addEventListener("click", restoreCurrentSaved);
      $("genCloseEditBtn").addEventListener("click", closeEditor);
      $("genPrevBtn").addEventListener("click", () => selectSlide(genState.currentIndex - 1));
      $("genNextBtn").addEventListener("click", () => selectSlide(genState.currentIndex + 1));
      $("genConfigCloseBtn").addEventListener("click", closeConfigModal);
      $("genConfigSaveBtn").addEventListener("click", saveConfigModal);
      $("genConfigResetBtn").addEventListener("click", resetSlideConfig);
      $("genConfigUseCurrentBtn").addEventListener("click", useCurrentDesignerConfig);
      $("genSplitRulesHelpBtn").addEventListener("click", openSplitRulesModal);
      $("genSplitRulesCloseBtn").addEventListener("click", closeSplitRulesModal);
      $("genSplitRulesResetBtn").addEventListener("click", resetSplitRules);
      $("genSplitRulesAppendBtn").addEventListener("click", () => applyBuiltSplitRule("append"));
      $("genSplitRulesReplaceBtn").addEventListener("click", () => applyBuiltSplitRule("replace"));
      $("genSplitRulesClearBtn").addEventListener("click", clearSplitRulesEditor);
      $("genSplitRules").addEventListener("input", handleSplitRulesInput);
      $("genMdInput").addEventListener("input", () => {
        updateHeaderFooterStatus();
        renderPlannerContractStatus();
        renderSplitRulesPreview();
        renderBuilderLivePreview();
      });
      $("genSpecialSlidesOwnDesign").addEventListener("change", (event) => {
        genState.specialSlideScope = normalizeSpecialSlideScope({ individualDesign: event.currentTarget.checked });
        renderSplitRulesPreview();
        regenerateAllAutomaticPrompts();
        setMessage(
          event.currentTarget.checked
            ? "표지·목차·간지·맺음말은 개별 구성을 사용하고 공통 팔레트·타이포·프레임 정체성만 이어갑니다."
            : "모든 슬라이드에 공통 디자인 프롬프트를 적용했습니다.",
          false
        );
      });
      $("genMaxChars").addEventListener("input", () => {
        renderSplitRulesPreview();
        renderBuilderLivePreview();
      });
      $("genSplitRulesSaveNamedBtn").addEventListener("click", saveNamedSplitRules);
      $("genSplitRulesLoadNamedBtn").addEventListener("click", loadNamedSplitRules);
      $("genSplitRulesDeleteNamedBtn").addEventListener("click", deleteNamedSplitRules);
      document.querySelectorAll(".gen-split-preset").forEach((el) => {
        el.addEventListener("click", () => appendPresetSplitRule(el.dataset.ruleType, el.dataset.rulePattern));
      });
      document.querySelectorAll(".gen-number-preset").forEach((el) => {
        el.addEventListener("click", () => applyNumberExamplePreset(el.dataset.numberExample));
      });
      document.querySelectorAll("[data-close-config-modal]").forEach((el) => {
        el.addEventListener("click", closeConfigModal);
      });
      document.querySelectorAll("[data-close-common-prompt-modal]").forEach((el) => {
        el.addEventListener("click", closeCommonPromptModal);
      });
      document.querySelectorAll("[data-close-execution-prompt-modal]").forEach((el) => {
        el.addEventListener("click", closeExecutionPromptModal);
      });
      document.querySelectorAll("[data-close-header-footer-modal]").forEach((el) => {
        el.addEventListener("click", closeHeaderFooterModal);
      });
      document.querySelectorAll("[data-close-split-modal]").forEach((el) => {
        el.addEventListener("click", closeSplitRulesModal);
      });
      [
        "genSplitBuilderType",
        "genSplitBuilderHeading",
        "genSplitBuilderPrefix",
        "genSplitBuilderNumber",
        "genSplitBuilderNumberCustom",
        "genSplitBuilderSeparator",
      ].forEach((id) => {
        $(id).addEventListener("input", updateSplitRuleBuilderPreview);
        $(id).addEventListener("change", updateSplitRuleBuilderPreview);
      });
      $("genJumpInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") jumpToSlide();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !$("genSplitRulesModal").hidden) {
          closeSplitRulesModal();
        } else if (event.key === "Escape" && !$("genCommonPromptModal").hidden) {
          closeCommonPromptModal();
        } else if (event.key === "Escape" && !$("genExecutionPromptModal").hidden) {
          closeExecutionPromptModal();
        } else if (event.key === "Escape" && !$("genHeaderFooterModal").hidden) {
          closeHeaderFooterModal();
        } else if (event.key === "Escape" && !$("genConfigModal").hidden) {
          closeConfigModal();
        }
      });
      updateSplitRuleBuilderPreview();
      restoreSplitRulesDraft();
      renderSavedSplitRulesOptions();
      renderSplitRulesPreview();
      renderLintPanel(null);
      resetCommonPromptSections(commonPromptInput.value);
      updateExecutionPromptStatus();
      updateHeaderFooterStatus();
      syncPlannerEnhancementControls();
      syncSpecialSlideScopeControl();
      renderPlannerContractStatus();

      function setMobilePanel(panel, shouldScroll = false) {
        const normalized = panel === "result" ? "result" : "input";
        const main = document.querySelector("#paneGenerator .gen-main");
        const inputBtn = $("genMobileInputBtn");
        const resultBtn = $("genMobileResultBtn");
        if (!main || !inputBtn || !resultBtn) return;

        main.dataset.genMobilePanel = normalized;
        inputBtn.classList.toggle("active", normalized === "input");
        resultBtn.classList.toggle("active", normalized === "result");
        inputBtn.setAttribute("aria-pressed", String(normalized === "input"));
        resultBtn.setAttribute("aria-pressed", String(normalized === "result"));

        if (shouldScroll && window.matchMedia("(max-width: 960px)").matches) {
          document.querySelector("#paneGenerator .gen-mobile-switch")?.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      }

      function updateResultAnnouncement(records, outputLength = 0) {
        const list = Array.isArray(records) ? records : [];
        const count = list.length;
        const mobileCount = $("genMobileResultCount");
        const announcer = $("genResultAnnouncer");
        if (mobileCount) mobileCount.textContent = String(count);
        if (!announcer) return;
        announcer.classList.toggle("is-ready", count > 0);
        announcer.textContent = count
          ? `${count}개 프롬프트가 생성되었습니다. 슬라이드를 선택해 검토하거나 바로 복사할 수 있습니다. 총 ${Number(outputLength || 0).toLocaleString("ko-KR")}자입니다.`
          : "MD를 입력하고 프롬프트를 생성하면 결과가 여기에 표시됩니다.";
      }

      function setMessage(text, isError = true) {
        const el = $("genMessage");
        el.textContent = text || "";
        el.className = "gen-warn" + (isError ? "" : " ok");
      }

      function splitCommonPromptSections(text) {
        return String(text || "")
          .trim()
          .split(/\n\s*\n+/)
          .map((block, index) => {
            const normalized = block.trim();
            const firstLine = normalized.split(/\r?\n/).find((line) => line.trim()) || `공통 문단 ${index + 1}`;
            const label = firstLine
              .replace(/^#{1,6}\s*/, "")
              .replace(/^[-*+]\s*/, "")
              .replace(/[:：]\s*$/, "")
              .trim();
            return {
              id: `common-section-${index + 1}`,
              label: label.length > 42 ? `${label.slice(0, 42)}…` : label,
              text: normalized,
              enabled: true,
            };
          })
          .filter((section) => section.text);
      }

      function resetCommonPromptSections(text, storedSections = null) {
        const parsed = splitCommonPromptSections(text);
        if (Array.isArray(storedSections) && storedSections.length) {
          genState.commonPromptSections = parsed.map((section, index) => ({
            ...section,
            enabled: storedSections[index]?.enabled !== false,
          }));
        } else {
          genState.commonPromptSections = parsed;
        }
        updateCommonPromptStatus();
      }

      function getEffectiveCommonPrompt() {
        const sections = genState.commonPromptSections.length
          ? genState.commonPromptSections
          : splitCommonPromptSections(commonPromptInput.value);
        return sections.filter((section) => section.enabled !== false).map((section) => section.text.trim()).filter(Boolean).join("\n\n");
      }

      function updateCommonPromptStatus() {
        const total = genState.commonPromptSections.length;
        const enabled = genState.commonPromptSections.filter((section) => section.enabled !== false).length;
        $("genCommonPromptStatus").textContent = total ? `${enabled}/${total}개 사용` : "설정 없음";
      }

      function renderCommonPromptManager() {
        const list = $("genCommonPromptManageList");
        list.innerHTML = "";
        genState.commonPromptDraft.forEach((section, index) => {
          const item = document.createElement("section");
          item.className = "gen-prompt-manage-item";

          const label = document.createElement("label");
          label.className = "gen-check-row gen-check-row-master";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = section.enabled !== false;
          checkbox.addEventListener("change", () => {
            section.enabled = checkbox.checked;
            item.classList.toggle("is-disabled", !checkbox.checked);
          });
          const title = document.createElement("span");
          title.textContent = section.label || `공통 문단 ${index + 1}`;
          label.append(checkbox, title);

          const textarea = document.createElement("textarea");
          textarea.className = "gen-textarea";
          textarea.rows = Math.min(8, Math.max(3, section.text.split(/\r?\n/).length + 1));
          textarea.value = section.text;
          textarea.setAttribute("aria-label", `${section.label || `공통 문단 ${index + 1}`} 수정`);
          textarea.addEventListener("input", () => {
            section.text = textarea.value;
            const firstLine = textarea.value.split(/\r?\n/).find((line) => line.trim());
            if (firstLine) title.textContent = firstLine.replace(/^#{1,6}\s*/, "").replace(/^[-*+]\s*/, "").slice(0, 42);
          });

          item.classList.toggle("is-disabled", !checkbox.checked);
          item.append(label, textarea);
          list.appendChild(item);
        });
      }

      function openCommonPromptModal() {
        if (!genState.commonPromptSections.length) resetCommonPromptSections(commonPromptInput.value);
        genState.commonPromptReturnFocus = document.activeElement;
        genState.commonPromptDraft = deepClone(genState.commonPromptSections);
        renderCommonPromptManager();
        $("genCommonPromptModal").hidden = false;
        document.body.classList.add("modal-open");
        requestAnimationFrame(() => $("genCommonPromptModal").querySelector("button, input, textarea")?.focus());
      }

      function closeCommonPromptModal() {
        $("genCommonPromptModal").hidden = true;
        genState.commonPromptDraft = [];
        if (!document.querySelector("#paneGenerator .gen-modal:not([hidden])")) document.body.classList.remove("modal-open");
        genState.commonPromptReturnFocus?.focus?.();
        genState.commonPromptReturnFocus = null;
      }

      function setAllCommonPromptSections(enabled) {
        genState.commonPromptDraft.forEach((section) => { section.enabled = enabled; });
        renderCommonPromptManager();
      }

      function applyCommonPromptManagement() {
        const cleaned = genState.commonPromptDraft
          .map((section) => ({ ...section, text: String(section.text || "").trim() }))
          .filter((section) => section.text);
        if (!cleaned.length) return setMessage("공통 프롬프트 문단을 하나 이상 입력해주세요.");
        genState.commonPromptSections = cleaned;
        commonPromptInput.value = cleaned.map((section) => section.text).join("\n\n");
        commonPromptInput.dataset.configDetached = "true";
        genState.commonConfig = null;
        genState.commonUserInput = null;
        genState.commonDesignPackage = null;
        genState.commonPromptPackageMeta = null;
        updateCommonPromptStatus();
        const enabled = cleaned.filter((section) => section.enabled !== false).length;
        regenerateAllAutomaticPrompts();
        closeCommonPromptModal();
        setMessage(`공통 문단 ${enabled}/${cleaned.length}개를 적용하고 수동 편집하지 않은 결과를 갱신했습니다.`, false);
      }

      function defaultExecutionPromptConfig(lang) {
        if (lang === "en") {
          return {
            title: "FINAL SLIDE IMAGE GENERATION TASK",
            introEnabled: true,
            intro: "Create one complete, production-ready slide image using the Common Design System and Individual Slide Specification below.",
            heading: "EXECUTION ORDER AND SOURCE PRIORITY",
            rules: [
              "Render only user-facing content: keep authoring labels, Markdown, codes, notes, and control metadata invisible, and place only enabled header/footer values—including the computed page number—in their designated slots.",
            ].map((text) => ({ enabled: true, text })),
          };
        }
        return {
          title: "최종 슬라이드 이미지 생성 작업",
          introEnabled: true,
          intro: "아래 공통 디자인 시스템과 개별 슬라이드 명세를 사용하여 완성도 높은 슬라이드 이미지 한 장을 생성합니다.",
          heading: "실행 순서 및 정보 우선순위",
          rules: [
            "사용자 표시 콘텐츠만 렌더링하고 작성용 필드명·Markdown·코드·메모·제어 정보는 숨기며, 활성화된 헤더·푸터 값과 계산된 페이지 번호만 지정 슬롯에 표시합니다.",
          ].map((text) => ({ enabled: true, text })),
        };
      }

      function normalizeExecutionPromptConfig(value, lang) {
        const defaults = defaultExecutionPromptConfig(lang);
        if (!value || typeof value !== "object") return defaults;
        return {
          title: String(value.title || defaults.title).trim() || defaults.title,
          introEnabled: value.introEnabled !== false,
          intro: String(value.intro ?? defaults.intro).trim(),
          heading: String(value.heading || defaults.heading).trim() || defaults.heading,
          rules: defaults.rules.map((fallback, index) => {
            const stored = Array.isArray(value.rules) ? value.rules[index] : null;
            return {
              enabled: stored?.enabled !== false,
              text: String(stored?.text ?? fallback.text).trim() || fallback.text,
            };
          }),
        };
      }

      function getExecutionPromptConfig(lang) {
        return normalizeExecutionPromptConfig(genState.executionPromptOverrides?.[lang], lang);
      }

      function executionPromptIsCustomized(lang) {
        return JSON.stringify(getExecutionPromptConfig(lang)) !== JSON.stringify(defaultExecutionPromptConfig(lang));
      }

      function updateExecutionPromptStatus() {
        const status = $("genExecutionPromptStatus");
        if (!status) return;
        const lang = resolveCommonPromptLanguage();
        const config = getExecutionPromptConfig(lang);
        const enabled = config.rules.filter((rule) => rule.enabled !== false).length;
        status.textContent = executionPromptIsCustomized(lang)
          ? `수정됨 · ${lang === "en" ? "영문" : "국문"} · ${enabled}/${config.rules.length}`
          : `기본값 · ${lang === "en" ? "영문" : "국문"}`;
      }

      function renderExecutionPromptDraft() {
        const draft = genState.executionPromptDraft;
        const lang = genState.executionPromptDraftLang;
        if (!draft) return;
        $("genExecutionPromptLang").textContent = lang === "en" ? "English" : "한국어";
        $("genExecutionPromptTitle").value = draft.title;
        $("genExecutionPromptHeading").value = draft.heading;
        $("genExecutionPromptIntroEnabled").checked = draft.introEnabled !== false;
        $("genExecutionPromptIntro").value = draft.intro;
        $("genExecutionPromptIntroItem").classList.toggle("is-disabled", draft.introEnabled === false);

        const list = $("genExecutionPromptRuleList");
        list.innerHTML = "";
        draft.rules.forEach((rule, index) => {
          const item = document.createElement("section");
          item.className = `gen-prompt-manage-item${rule.enabled === false ? " is-disabled" : ""}`;
          const label = document.createElement("label");
          label.className = "gen-check-row gen-check-row-master";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = rule.enabled !== false;
          checkbox.setAttribute("aria-label", `실행 우선순위 규칙 ${index + 1} 사용`);
          const title = document.createElement("span");
          title.textContent = `규칙 ${index + 1}`;
          label.append(checkbox, title);
          const textarea = document.createElement("textarea");
          textarea.className = "gen-textarea";
          textarea.rows = Math.min(6, Math.max(3, Math.ceil(rule.text.length / 90)));
          textarea.value = rule.text;
          textarea.setAttribute("aria-label", `실행 우선순위 규칙 ${index + 1}`);
          checkbox.addEventListener("change", () => {
            rule.enabled = checkbox.checked;
            item.classList.toggle("is-disabled", !checkbox.checked);
            updateExecutionRuleCount();
          });
          textarea.addEventListener("input", () => { rule.text = textarea.value; });
          item.append(label, textarea);
          list.appendChild(item);
        });
        updateExecutionRuleCount();
      }

      function updateExecutionRuleCount() {
        const draft = genState.executionPromptDraft;
        if (!draft) return;
        const enabled = draft.rules.filter((rule) => rule.enabled !== false).length;
        $("genExecutionRuleCount").textContent = `${enabled}/${draft.rules.length}개 사용`;
      }

      function bindExecutionPromptStaticFields() {
        $("genExecutionPromptTitle").oninput = () => {
          if (genState.executionPromptDraft) genState.executionPromptDraft.title = $("genExecutionPromptTitle").value;
        };
        $("genExecutionPromptHeading").oninput = () => {
          if (genState.executionPromptDraft) genState.executionPromptDraft.heading = $("genExecutionPromptHeading").value;
        };
        $("genExecutionPromptIntro").oninput = () => {
          if (genState.executionPromptDraft) genState.executionPromptDraft.intro = $("genExecutionPromptIntro").value;
        };
        $("genExecutionPromptIntroEnabled").onchange = () => {
          if (!genState.executionPromptDraft) return;
          genState.executionPromptDraft.introEnabled = $("genExecutionPromptIntroEnabled").checked;
          $("genExecutionPromptIntroItem").classList.toggle("is-disabled", !$("genExecutionPromptIntroEnabled").checked);
        };
      }

      function openExecutionPromptModal() {
        const lang = resolveCommonPromptLanguage();
        genState.executionPromptReturnFocus = document.activeElement;
        genState.executionPromptDraftLang = lang;
        genState.executionPromptDraft = deepClone(getExecutionPromptConfig(lang));
        renderExecutionPromptDraft();
        bindExecutionPromptStaticFields();
        $("genExecutionPromptModal").hidden = false;
        document.body.classList.add("modal-open");
        requestAnimationFrame(() => $("genExecutionPromptModal").querySelector("button, input, textarea")?.focus());
      }

      function closeExecutionPromptModal() {
        $("genExecutionPromptModal").hidden = true;
        genState.executionPromptDraft = null;
        if (!document.querySelector("#paneGenerator .gen-modal:not([hidden])")) document.body.classList.remove("modal-open");
        genState.executionPromptReturnFocus?.focus?.();
        genState.executionPromptReturnFocus = null;
      }

      function resetExecutionPromptDraft() {
        genState.executionPromptDraft = defaultExecutionPromptConfig(genState.executionPromptDraftLang);
        renderExecutionPromptDraft();
        bindExecutionPromptStaticFields();
      }

      function setAllExecutionPromptRules(enabled) {
        if (!genState.executionPromptDraft) return;
        genState.executionPromptDraft.rules.forEach((rule) => { rule.enabled = enabled; });
        renderExecutionPromptDraft();
        bindExecutionPromptStaticFields();
      }

      function applyExecutionPromptManagement() {
        const lang = genState.executionPromptDraftLang;
        const draft = normalizeExecutionPromptConfig(genState.executionPromptDraft, lang);
        const defaults = defaultExecutionPromptConfig(lang);
        genState.executionPromptOverrides[lang] = JSON.stringify(draft) === JSON.stringify(defaults) ? null : deepClone(draft);
        genState.executionPromptDraft = null;
        updateExecutionPromptStatus();
        regenerateAllAutomaticPrompts();
        closeExecutionPromptModal();
        const enabled = draft.rules.filter((rule) => rule.enabled !== false).length;
        setMessage(`${lang === "en" ? "영문" : "국문"} 실행 프롬프트를 적용했습니다. 우선순위 규칙 ${enabled}/${draft.rules.length}개를 사용합니다.`, false);
      }

      function regenerateAllAutomaticPrompts() {
        const commonPrompt = getEffectiveCommonPrompt().trim();
        if (!commonPrompt || !genState.records.length) return;
        const promptLang = resolveCommonPromptLanguage(commonPrompt);
        genState.records.forEach((record) => {
          if (record.manualEditedPrompt) return;
          record.prompt = generateSingleSlidePrompt(record, commonPrompt, promptLang);
        });
        refreshLatestOutput();
        renderCurrentPrompt();
      }

      function normalizeMetadataFieldKey(label) {
        if (HEADER_FOOTER_CONTRACT?.normalizeKey) return HEADER_FOOTER_CONTRACT.normalizeKey(label);
        return String(label || "").replace(/\s+/g, "").toLowerCase();
      }

      function parseFlexibleHeaderFooterField(label, fallbackType = "") {
        if (HEADER_FOOTER_CONTRACT?.parseFieldLabel) return HEADER_FOOTER_CONTRACT.parseFieldLabel(label, fallbackType);
        const raw = cleanTitle(String(label || ""))
          .replace(/[：:]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const patterns = [
          { type: "header", regex: /^(?:헤더|상단|header)\s*(?:정보\s*)?(?:[\[(<{]\s*)?(.+?)(?:\s*[\])>}]\s*)?$/i },
          { type: "footer", regex: /^(?:푸터|하단|footer)\s*(?:정보\s*)?(?:[\[(<{]\s*)?(.+?)(?:\s*[\])>}]\s*)?$/i },
          { type: "header", regex: /^(.+?)\s*(?:[\[(<{]\s*)?(?:헤더|상단|header)(?:\s*[\])>}]\s*)$/i },
          { type: "footer", regex: /^(.+?)\s*(?:[\[(<{]\s*)?(?:푸터|하단|footer)(?:\s*[\])>}]\s*)$/i },
        ];
        for (const pattern of patterns) {
          const match = raw.match(pattern.regex);
          const category = match?.[1]?.replace(/^[\s/·>_.-]+|[\s/·>_.-]+$/g, "").trim();
          if (category) return { type: pattern.type, category };
        }
        return fallbackType ? { type: fallbackType, category: raw } : { type: "", category: raw };
      }

      function classifyHeaderFooterField(label, fallbackType = "") {
        if (HEADER_FOOTER_CONTRACT?.classifyField) return HEADER_FOOTER_CONTRACT.classifyField(label, fallbackType);
        const key = normalizeMetadataFieldKey(label).replace(/[()〔〕\[\]·._-]/g, "");
        if (/^(제목|슬라이드제목|헤더제목|2단계제목|헤더2단계제목|헤더파트|1단계파트|헤더1단계파트|헤더섹션명|섹션명|헤더부제|3단계부제|헤더3단계부제|발표자료명|축약자료명|기관명|부서명|발표일자|발표자|보안등급|슬라이드식별번호|슬라이드유형|slidetitle|headertitle|headersection|sectionname|headersubtitle|presentationtitle|shorttitle|organization|department|presentationdate|presenter|securitylevel|slideidentifier|slidetype)$/.test(key)) return "header";
        if (/^(푸터출처|출처|푸터주석|주석|저작권문구|페이지번호정책|페이지번호표기값|페이지번호|footersource|source|footernote|note|copyright|pagenumberpolicy|pagenumberdisplay|pagenumber)$/.test(key)) return "footer";
        return parseFlexibleHeaderFooterField(label, fallbackType).type;
      }

      function canonicalHeaderFooterFieldKey(label, type = classifyHeaderFooterField(label)) {
        if (HEADER_FOOTER_CONTRACT?.canonicalFieldKey) return HEADER_FOOTER_CONTRACT.canonicalFieldKey(label, type);
        const key = normalizeMetadataFieldKey(label);
        if (type === "header" && /^(제목|슬라이드제목|헤더제목|2단계제목|헤더2단계제목|slidetitle|headertitle)$/.test(key)) return "__slide_title";
        if (type === "header" && /^(슬라이드식별번호|slideidentifier)$/.test(key)) return "__slide_id";
        if (type === "header" && /^(슬라이드유형|slidetype)$/.test(key)) return "__slide_type";
        if (type === "footer" && /^(페이지번호표기값|페이지번호|pagenumberdisplay|pagenumber)$/.test(key)) return "__page_number";
        const descriptor = parseFlexibleHeaderFooterField(label, type);
        const categoryKey = normalizeMetadataFieldKey(descriptor.category).replace(/[()〔〕\[\]·._-]/g, "");
        return descriptor.type && categoryKey ? `custom:${descriptor.type}:${categoryKey}` : key;
      }

      function classifyHeaderFooterHeading(title) {
        if (HEADER_FOOTER_CONTRACT?.classifyRegionHeading) return HEADER_FOOTER_CONTRACT.classifyRegionHeading(title);
        const normalized = cleanTitle(String(title || "")).replace(/[：:]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
        if (/^(헤더|상단)(\s*(블록|정보|영역))?$/.test(normalized) || /^header(\s*(block|information|info|area))?$/.test(normalized)) return "header";
        if (/^(푸터|하단)(\s*(블록|정보|영역))?$/.test(normalized) || /^footer(\s*(block|information|info|area))?$/.test(normalized)) return "footer";
        return "";
      }

      function isHeaderFooterSlotDefinitionHeading(title) {
        if (HEADER_FOOTER_CONTRACT?.isDefinitionHeading) return HEADER_FOOTER_CONTRACT.isDefinitionHeading(title);
        const normalized = cleanTitle(String(title || ""))
          .replace(/〔[^〕]*〕/g, "")
          .replace(/[：:]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();
        return /^(헤더[·ㆍ&/ ]*푸터|헤더푸터)\s*(슬롯|카테고리|항목)?\s*(정의|규약|계약)$/.test(normalized)
          || /^header[ &/]*footer\s*(slot|category|field)?\s*(definition|contract)$/.test(normalized);
      }

      function classifySlotDefinitionLabel(label) {
        if (HEADER_FOOTER_CONTRACT?.classifyDefinitionLabel) return HEADER_FOOTER_CONTRACT.classifyDefinitionLabel(label);
        const key = normalizeMetadataFieldKey(label).replace(/[()〔〕\[\]·._-]/g, "");
        if (/^(헤더|상단)(카테고리|슬롯|항목|필드)?$/.test(key) || /^header(categories|category|slots|slot|fields|field)?$/.test(key)) return "header";
        if (/^(푸터|하단)(카테고리|슬롯|항목|필드)?$/.test(key) || /^footer(categories|category|slots|slot|fields|field)?$/.test(key)) return "footer";
        return "";
      }

      function splitSlotCategoryNames(value) {
        if (HEADER_FOOTER_CONTRACT?.splitCategoryNames) return HEADER_FOOTER_CONTRACT.splitCategoryNames(value);
        return String(value || "")
          .split(/[,，|/]/)
          .map((item) => item.replace(/^[-*+]\s*/, "").trim())
          .filter(Boolean);
      }

      function collectHeaderFooterFields(markdown) {
        const reserved = HEADER_FOOTER_CONTRACT?.reserved;
        const result = {
          header: new Map((reserved?.header || [
            { key: "__slide_id", label: "슬라이드 식별 번호" },
            { key: "__slide_type", label: "슬라이드 유형" },
          ]).map((field) => [field.key, `${field.label} (PromptDeck 자동)`])),
          footer: new Map((reserved?.footer || [
            { key: "__page_number", label: "페이지 번호" },
          ]).map((field) => [field.key, `${field.label} (PromptDeck 자동)`])),
        };
        let activeType = "";
        let activeLevel = 0;
        let definitionLevel = 0;
        const addField = (type, key, label, fromDefinition = false) => {
          if (!key) return;
          const current = result[type].get(key);
          if (!current || (!fromDefinition && /\(스킬 정의\)$/.test(current))) {
            result[type].set(key, fromDefinition ? `${label} (스킬 정의)` : label);
          }
        };
        String(markdown || "").split(/\r?\n/).forEach((line) => {
          const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
          if (heading) {
            const level = heading[1].length;
            if (activeType && level <= activeLevel) activeType = "";
            if (definitionLevel && level <= definitionLevel) definitionLevel = 0;
            if (isHeaderFooterSlotDefinitionHeading(heading[2])) {
              definitionLevel = level;
              activeType = "";
              return;
            }
            const nextType = classifyHeaderFooterHeading(heading[2]);
            if (nextType) {
              activeType = nextType;
              activeLevel = level;
            }
            return;
          }
          const item = line.match(/^\s*[-*+]\s+(?:\*\*)?([^:：*]+?)(?:\*\*)?\s*[:：]\s*(.+?)\s*$/);
          if (!item) return;
          const label = item[1].trim();
          if (definitionLevel) {
            const definitionType = classifySlotDefinitionLabel(label);
            if (!definitionType) return;
            splitSlotCategoryNames(item[2]).forEach((category) => {
              const dynamicLabel = `${definitionType === "header" ? "헤더" : "푸터"} ${category}`;
              addField(definitionType, canonicalHeaderFooterFieldKey(dynamicLabel, definitionType), category, true);
            });
            return;
          }
          const fieldType = classifyHeaderFooterField(label, activeType);
          if (!fieldType) return;
          const key = canonicalHeaderFooterFieldKey(label, fieldType);
          addField(fieldType, key, label);
        });
        return result;
      }

      function normalizeHeaderFooterSettings(settings) {
        const source = settings && typeof settings === "object" ? settings : {};
        return {
          headerEnabled: source.headerEnabled !== false,
          footerEnabled: source.footerEnabled !== false,
          headerFields: Array.isArray(source.headerFields) ? source.headerFields.map(normalizeMetadataFieldKey) : null,
          footerFields: Array.isArray(source.footerFields) ? source.footerFields.map(normalizeMetadataFieldKey) : null,
        };
      }

      function headerFooterFieldIsSelected(settings, type, labelOrKey) {
        if (!settings[`${type}Enabled`]) return false;
        const selected = settings[`${type}Fields`];
        if (selected === null) return true;
        const raw = String(labelOrKey || "");
        const key = raw.startsWith("__") ? raw : canonicalHeaderFooterFieldKey(raw, type);
        return selected.includes(key) || selected.includes(normalizeMetadataFieldKey(raw));
      }

      function renderHeaderFooterFieldList(type, fields, settings) {
        const list = $(type === "header" ? "genHeaderFieldList" : "genFooterFieldList");
        const selected = settings[`${type}Fields`];
        list.innerHTML = "";
        if (!fields.size) {
          const empty = document.createElement("div");
          empty.className = "gen-hf-empty";
          empty.textContent = `감지된 ${type === "header" ? "헤더" : "푸터"} 입력 항목이 없습니다.`;
          list.appendChild(empty);
          return;
        }
        fields.forEach((labelText, key) => {
          const label = document.createElement("label");
          label.className = "gen-check-row";
          const input = document.createElement("input");
          input.type = "checkbox";
          input.dataset.hfType = type;
          input.dataset.hfKey = key;
          input.checked = selected === null || selected.includes(key) || selected.includes(normalizeMetadataFieldKey(labelText));
          const textNode = document.createElement("span");
          textNode.textContent = labelText;
          label.append(input, textNode);
          if (key.startsWith("__")) {
            const badge = document.createElement("em");
            badge.className = "gen-hf-auto-badge";
            badge.textContent = "자동";
            label.appendChild(badge);
          } else if (key.startsWith("custom:")) {
            const badge = document.createElement("em");
            badge.className = "gen-hf-auto-badge";
            badge.textContent = "사용자 항목";
            label.appendChild(badge);
          }
          list.appendChild(label);
        });
      }

      function openHeaderFooterModal() {
        const fields = collectHeaderFooterFields($("genMdInput").value);
        genState.headerFooterDraft = normalizeHeaderFooterSettings(genState.headerFooterSettings);
        $("genHeaderEnabled").checked = genState.headerFooterDraft.headerEnabled;
        $("genFooterEnabled").checked = genState.headerFooterDraft.footerEnabled;
        renderHeaderFooterFieldList("header", fields.header, genState.headerFooterDraft);
        renderHeaderFooterFieldList("footer", fields.footer, genState.headerFooterDraft);
        $("genHeaderFooterModal").hidden = false;
        document.body.classList.add("modal-open");
      }

      function closeHeaderFooterModal() {
        $("genHeaderFooterModal").hidden = true;
        genState.headerFooterDraft = null;
        if (!document.querySelector("#paneGenerator .gen-modal:not([hidden])")) document.body.classList.remove("modal-open");
      }

      function applyHeaderFooterSettings() {
        const collectChecked = (type) => Array.from(document.querySelectorAll(`input[data-hf-type="${type}"]:checked`)).map((input) => input.dataset.hfKey);
        genState.headerFooterSettings = {
          headerEnabled: $("genHeaderEnabled").checked,
          footerEnabled: $("genFooterEnabled").checked,
          headerFields: collectChecked("header"),
          footerFields: collectChecked("footer"),
        };
        updateHeaderFooterStatus();
        renderSplitRulesPreview();
        renderBuilderLivePreview();
        closeHeaderFooterModal();
        setMessage("헤더·푸터 전달 설정을 적용했습니다. 프롬프트 생성 시 반영됩니다.", false);
      }

      function updateHeaderFooterStatus() {
        const fields = collectHeaderFooterFields($("genMdInput").value);
        const settings = normalizeHeaderFooterSettings(genState.headerFooterSettings);
        const countSelected = (type) => {
          if (!settings[`${type}Enabled`]) return "제외";
          const selected = settings[`${type}Fields`];
          const total = fields[type].size;
          return selected === null ? (total ? `${total}개` : "전체") : `${selected.filter((key) => fields[type].has(key)).length}개`;
        };
        $("genHeaderFooterStatus").textContent = `헤더 ${countSelected("header")} · 푸터 ${countSelected("footer")}`;
      }

      function restoreSplitRulesDraft() {
        try {
          const saved = localStorage.getItem(SPLIT_RULES_DRAFT_KEY);
          if (saved && saved.trim()) {
            $("genSplitRules").value = saved;
          }
        } catch {
          // 저장소 접근이 막혀도 기본 규칙으로 계속 동작합니다.
        }
      }

      function persistSplitRulesDraft() {
        try {
          localStorage.setItem(SPLIT_RULES_DRAFT_KEY, $("genSplitRules").value);
        } catch {
          setMessage("브라우저 저장소에 구분 규칙을 저장하지 못했습니다.", true);
        }
      }

      function handleSplitRulesInput() {
        persistSplitRulesDraft();
        renderSplitRulesPreview();
      }

      function loadSavedSplitRules() {
        try {
          const parsed = JSON.parse(localStorage.getItem(SPLIT_RULES_LIBRARY_KEY) || "[]");
          return Array.isArray(parsed) ? parsed.filter((item) => item && item.name && item.rules) : [];
        } catch {
          return [];
        }
      }

      function persistSavedSplitRules() {
        try {
          localStorage.setItem(SPLIT_RULES_LIBRARY_KEY, JSON.stringify(genState.savedSplitRules));
        } catch {
          setMessage("브라우저 저장소에 저장 규칙 목록을 기록하지 못했습니다.", true);
        }
      }

      function renderSavedSplitRulesOptions() {
        const select = $("genSplitRulesSavedSelect");
        if (!select) return;
        const options = genState.savedSplitRules.map((item, index) => {
          const selected = index === 0 ? " selected" : "";
          return `<option value="${index}"${selected}>${escapeHtml(item.name)}</option>`;
        });
        select.innerHTML = options.length
          ? options.join("")
          : `<option value="">저장된 규칙 없음</option>`;
        select.disabled = options.length === 0;
        $("genSplitRulesLoadNamedBtn").disabled = options.length === 0;
        $("genSplitRulesDeleteNamedBtn").disabled = options.length === 0;
      }

      function saveNamedSplitRules() {
        const rules = $("genSplitRules").value.trim();
        if (!rules) return setMessage("저장할 구분 규칙이 없습니다.");

        try {
          parseSplitRules(rules);
        } catch (error) {
          renderSplitRulesPreview();
          return setMessage(error.message || "규칙을 먼저 수정해주세요.");
        }

        const fallbackName = `구분 규칙 ${new Date().toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
        const name = $("genSplitRulesName").value.trim() || fallbackName;
        const existingIndex = genState.savedSplitRules.findIndex((item) => item.name === name);
        const item = { name, rules, savedAt: new Date().toISOString() };

        if (existingIndex >= 0) {
          genState.savedSplitRules.splice(existingIndex, 1, item);
        } else {
          genState.savedSplitRules.unshift(item);
        }

        genState.savedSplitRules = genState.savedSplitRules.slice(0, 20);
        persistSavedSplitRules();
        renderSavedSplitRulesOptions();
        $("genSplitRulesName").value = "";
        setMessage(`구분 규칙을 저장했습니다: ${name}`, false);
      }

      function getSelectedSavedSplitRules() {
        const select = $("genSplitRulesSavedSelect");
        if (!select || select.disabled) return null;
        const index = Number.parseInt(select.value, 10);
        return Number.isFinite(index) ? { item: genState.savedSplitRules[index], index } : null;
      }

      function loadNamedSplitRules() {
        const selected = getSelectedSavedSplitRules();
        if (!selected?.item) return;
        $("genSplitRules").value = selected.item.rules;
        persistSplitRulesDraft();
        renderSplitRulesPreview();
        setMessage(`저장된 구분 규칙을 불러왔습니다: ${selected.item.name}`, false);
      }

      function deleteNamedSplitRules() {
        const selected = getSelectedSavedSplitRules();
        if (!selected?.item) return;
        const [removed] = genState.savedSplitRules.splice(selected.index, 1);
        persistSavedSplitRules();
        renderSavedSplitRulesOptions();
        setMessage(`저장된 구분 규칙을 삭제했습니다: ${removed.name}`, false);
      }

      function splitPlannerBlocks(markdown) {
        const source = String(markdown || "");
        const matches = [...source.matchAll(/^##\s+(슬라이드|부록)\s+([^\.\n]+)\.\s*(.+?)\s*$/gm)];
        return matches.map((match, index) => ({
          kind: match[1],
          no: match[2].trim(),
          title: cleanTitle(match[3]),
          index: match.index,
          end: matches[index + 1]?.index ?? source.length,
          text: source.slice(match.index, matches[index + 1]?.index ?? source.length).trim(),
        }));
      }

      function normalizePlannerHeading(value) {
        return cleanTitle(String(value || ""))
          .replace(/〔[^〕]*〕/g, "")
          .replace(/^STEP\s*\d+\.?\s*/i, "")
          .replace(/\s+/g, " ")
          .trim();
      }

      function getPlannerSectionHeadings(block) {
        return [...String(block || "").matchAll(/^###\s+(.+?)\s*$/gm)].map((match) => ({
          title: normalizePlannerHeading(match[1]),
          rawTitle: match[1],
          index: match.index,
        }));
      }

      function hasPlannerSection(block, sectionName) {
        return getPlannerSectionHeadings(block).some((heading) => heading.title === sectionName);
      }

      function extractPromptDeckContractVersion(markdown) {
        const fields = SKILL_PRESET_CONTRACT?.parseFrontMatter?.(markdown);
        if (fields) return String(fields.promptdeck_contract || fields.planner_contract_version || "");
        const frontMatter = String(markdown || "").match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
        if (!frontMatter) return "";
        return frontMatter[1].match(/^\s*promptdeck_contract\s*:\s*["']?([^\s"']+)/mi)?.[1] || "";
      }

      function extractSkillPresetContractVersion(markdown) {
        const fields = SKILL_PRESET_CONTRACT?.parseFrontMatter?.(markdown);
        if (fields) return String(fields.skill_preset_contract || "");
        const frontMatter = String(markdown || "").match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
        if (!frontMatter) return "";
        return frontMatter[1].match(/^\s*skill_preset_contract\s*:\s*["']?([^\s"']+)/mi)?.[1] || "";
      }

      function analyzeSpecialSlideImplementation(block) {
        const pageType = inferPlannerPageType(block.title, block.text);
        if (!["표지", "목차", "간지", "클로징"].includes(pageType)) return { special: false, ready: true, missing: [] };
        const content = plannerSectionText(block.text, /^콘텐츠$/);
        const purpose = plannerSectionText(block.text, /^핵심 주제·목적$/);
        const expression = plannerSectionText(block.text, /^표현 방식$/);
        const missing = [];

        if (pageType === "표지") {
          if (!/(?:^|\n)\s*[-*+]\s+(?:발표\s*)?제목\s*[:：]/m.test(content)) missing.push("정확한 제목");
          if (!/키\s*비주얼|히어로|제목.+비주얼/.test(expression)) missing.push("제목–키 비주얼 관계");
        } else if (pageType === "목차") {
          const sessionLabels = content.match(/(?:^|\n)\s*[-*+]\s+(?:세션|파트|목차\s*항목)\s*\d*/gm) || [];
          const numberedParts = content.match(/(?:PART|파트|세션)\s*\d+/gi) || [];
          const sessionCount = Math.max(sessionLabels.length, new Set(numberedParts.map((item) => item.replace(/\s+/g, "").toLowerCase())).size);
          if (sessionCount < 2) missing.push("확정된 세션명 2개 이상");
          if (!/목차\s*목적|우선\s*인지|전체\s*(?:범위|구조)|현재\s*위치|시작\s*질문/.test(purpose)) missing.push("목차가 먼저 답할 인지 과업");
          if (!/항목\s*관계|병렬|계층|시간|담당|분류|현재\s*위치|순차|의존|질문.?답/.test(purpose)) missing.push("항목의 실제 관계");
          if (!/인덱스|다중\s*열|그룹|클러스터|밴드|계층|매트릭스|모자이크|시간.?담당|표\s*구조|비주얼\s*분할|진행\s*강조|내비게이터|길찾기|경로|계단|타임라인/.test(expression)) missing.push("관계에 맞는 개요 구조");
        } else if (pageType === "간지") {
          if (!/(?:^|\n)\s*[-*+]\s+(?:파트명|세션명|파트\s*번호)\s*[:：]/m.test(content)) missing.push("파트명");
          if (!/(?:^|\n)\s*[-*+]\s+전환\s*메시지\s*[:：]/m.test(content)) missing.push("전환 메시지");
          if (!/앞\s*세션\s*결론/.test(purpose) || !/다음\s*세션\s*질문/.test(purpose)) missing.push("앞 결론–다음 질문 관계");
          if (!/단일\s*시각\s*제스처|전환\s*동사/.test(expression)) missing.push("전환 동사의 단일 제스처");
        } else if (pageType === "클로징") {
          if (!/(?:^|\n)\s*[-*+]\s+(?:결론|결론\s*문구|최종\s*결론)\s*[:：]/m.test(content)) missing.push("최종 결론");
          if (!/클로징\s*유형/.test(purpose)) missing.push("클로징 유형");
          if (!/수렴/.test(expression) || !/표지\s*모티프/.test(expression)) missing.push("수렴 구조와 표지 모티프 회수");
        }

        return { special: true, ready: missing.length === 0, pageType, missing };
      }

      function analyzePlannerContract(markdown) {
        const blocks = splitPlannerBlocks(markdown);
        const summary = {
          total: blocks.length,
          format: 0,
          purpose: 0,
          content: 0,
          expression: 0,
          quality: 0,
          ordered: 0,
          overlaps: 0,
          ready: 0,
          legacy: 0,
          scriptLeaks: 0,
          repeatedDesign: 0,
          diagramTotal: 0,
          diagramSemanticReady: 0,
          diagramSemanticIssues: [],
          specialTotal: 0,
          specialReady: 0,
          specialImplementationIssues: [],
          skillPresetReady: 0,
          skillPresetIssues: [],
          presentationContext: false,
          strategyContext: false,
          sessionPlan: false,
          issues: [],
          contractVersion: extractPromptDeckContractVersion(markdown),
          skillPresetContractVersion: extractSkillPresetContractVersion(markdown),
        };
        const skillPresetFieldsRequired = summary.contractVersion === PROMPTDECK_CONTRACT_VERSION
          || Boolean(summary.skillPresetContractVersion);

        blocks.forEach((block) => {
          const headings = getPlannerSectionHeadings(block.text);
          const format = headings[0]?.title === "양식";
          const purpose = hasPlannerSection(block.text, "핵심 주제·목적");
          const content = hasPlannerSection(block.text, "콘텐츠");
          const expression = hasPlannerSection(block.text, "표현 방식");
          const quality = hasPlannerSection(block.text, "품질 조건");
          const expectedOrder = ["양식", "핵심 주제·목적", "콘텐츠", "표현 방식", "품질 조건"];
          const relevantHeadings = headings.map((heading) => heading.title).filter((title) => expectedOrder.includes(title));
          const ordered = expectedOrder.every((title, index) => relevantHeadings[index] === title);
          const displayValues = [plannerSectionText(block.text, /^양식$/), plannerSectionText(block.text, /^콘텐츠$/)]
            .flatMap((section) => String(section || "").split(/\r?\n/))
            .map((line) => line.match(/^\s*[-*+]\s+(?:\*\*)?[^:：*]+(?:\*\*)?\s*[:：]\s*(.+?)\s*$/)?.[1]?.replace(/\*\*/g, "").trim() || "")
            .filter((value) => value.length >= 4);
          const nonDisplayText = ["핵심 주제·목적", "표현 방식", "품질 조건"]
            .map((title) => plannerSectionText(block.text, new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)))
            .join("\n");
          const overlap = displayValues.some((value) => nonDisplayText.includes(value));
          const scriptLeak = headings.some((heading) => /스크립트|대본|화면 큐|발표자 메모/.test(heading.title));
          const repeatedDesign = headings.some((heading) => /^(메인 스타일|컬러 시스템|색상 시스템|헤더 디자인 규칙|바닥글|푸터|디자인 디테일)$/.test(heading.title));
          const legacy = /###\s+STEP\s*[1-6]/i.test(block.text);
          const specialImplementation = analyzeSpecialSlideImplementation(block);
          const diagramPlan = deriveDiagramPlan(block.text);
          const structuredDiagram = diagramPlan.semanticRequired;
          const skillDirectives = SKILL_PRESET_CONTRACT?.parseSkillDirectives?.(block.text) || {};
          const hasSkillField = (labels) => Boolean(SKILL_PRESET_CONTRACT?.extractField?.(block.text, labels));
          const skillFieldState = {
            authority: Boolean(skillDirectives.compositionAuthority),
            locks: hasSkillField(["잠금 항목", "스킬 잠금", "skill locks", "locked items"]),
            guides: hasSkillField(["가이드 항목", "스킬 가이드", "skill guides", "guided items"]),
            free: hasSkillField(["자유 항목", "스킬 자유", "skill free", "free items"]),
            lockReason: hasSkillField(["구성 잠금 이유", "구성 잠금", "lock reason", "composition lock reason"]),
            presetScope: hasSkillField(["프리셋 적용 범위", "preset scope", "preset compatibility", "preset application scope"]),
          };
          const missingSkillFields = Object.entries(skillFieldState).filter(([, ready]) => !ready).map(([field]) => field);
          const skillPresetReady = !skillPresetFieldsRequired || missingSkillFields.length === 0;

          if (format) summary.format += 1;
          if (purpose) summary.purpose += 1;
          if (content) summary.content += 1;
          if (expression) summary.expression += 1;
          if (quality) summary.quality += 1;
          if (ordered) summary.ordered += 1;
          if (overlap) summary.overlaps += 1;
          if (legacy) summary.legacy += 1;
          if (scriptLeak) summary.scriptLeaks += 1;
          if (repeatedDesign) summary.repeatedDesign += 1;
          if (structuredDiagram) {
            summary.diagramTotal += 1;
            if (diagramPlan.semanticReady) summary.diagramSemanticReady += 1;
            else {
              const missing = [
                ...diagramPlan.semanticMissing,
                ...(diagramPlan.abstractHeadline ? ["추상어 중심 주장 헤드라인"] : []),
              ];
              summary.diagramSemanticIssues.push(`${block.no}: ${missing.join(", ")}`);
            }
          }
          if (specialImplementation.special) {
            summary.specialTotal += 1;
            if (specialImplementation.ready) summary.specialReady += 1;
            else summary.specialImplementationIssues.push(`${block.no} ${specialImplementation.pageType}: ${specialImplementation.missing.join(", ")}`);
          }
          if (skillPresetReady) summary.skillPresetReady += 1;
          else summary.skillPresetIssues.push(`${block.no}: ${missingSkillFields.join(", ")}`);
          if (format && purpose && content && expression && quality && ordered && !overlap && !scriptLeak && !repeatedDesign && specialImplementation.ready && (!structuredDiagram || diagramPlan.semanticReady) && skillPresetReady) summary.ready += 1;
        });

        if (blocks.length) {
          const preamble = String(markdown || "").slice(0, blocks[0].index);
          const metadata = extractDeckMetadata(preamble);
          const context = extractDeckContext(preamble, metadata);
          const project = genState.commonDesignPackage?.project || {};
          summary.presentationContext = context.presentation.length > 0 || Boolean(project.audience && project.presentationPurpose);
          const currentPerception = findContextValue(context.presentation, [/^(청중의현재인식|현재인식)$/]) || project.currentPerception || "";
          const targetPerception = findContextValue(context.presentation, [/^(발표후목표인식|목표인식)$/]) || project.targetPerception || "";
          const keyBarrier = findContextValue(context.presentation, [/^(핵심인식장벽|핵심장벽)$/]) || project.keyBarrier || "";
          const governingThought = findContextValue(context.presentation, [/^governingthought$/]) || project.governingThought || "";
          summary.strategyContext = Boolean(currentPerception && targetPerception && keyBarrier && governingThought);
          summary.sessionPlan = context.sessions.length > 0 || blocks.length === 1;
        }

        if (!blocks.length && String(markdown || "").trim()) {
          summary.issues.push("`## 슬라이드 01. 제목` 형식의 시작점을 찾지 못했습니다.");
        }
        if (blocks.length && summary.format < blocks.length) summary.issues.push(`${blocks.length - summary.format}장에 프레임 정책 또는 헤더·푸터 값을 담는 첫 섹션 ‘양식’이 없습니다.`);
        if (blocks.length && summary.purpose < blocks.length) summary.issues.push(`${blocks.length - summary.purpose}장에 청중 질문·인식 변화·목표 판단을 담은 ‘핵심 주제·목적’이 없습니다.`);
        if (blocks.length && summary.content < blocks.length) summary.issues.push(`${blocks.length - summary.content}장에 실제 화면 문구·수치·데이터를 담은 ‘콘텐츠’가 없습니다.`);
        if (blocks.length && summary.expression < blocks.length) summary.issues.push(`${blocks.length - summary.expression}장에 레이아웃·구도·강조를 담은 ‘표현 방식’이 없습니다.`);
        if (blocks.length && summary.quality < blocks.length) summary.issues.push(`${blocks.length - summary.quality}장에 사실·데이터·출력 보호를 담은 ‘품질 조건’이 없습니다.`);
        if (blocks.length && summary.ordered < blocks.length) summary.issues.push(`${blocks.length - summary.ordered}장이 ‘양식 → 핵심 주제·목적 → 콘텐츠 → 표현 방식 → 품질 조건’ 순서를 따르지 않습니다.`);
        if (summary.overlaps) summary.issues.push(`${summary.overlaps}장에 양식·콘텐츠의 정확한 표시값이 비표시 섹션에 중복됩니다. 역할명으로 바꿔주세요.`);
        if (blocks.length && !summary.presentationContext) summary.issues.push("발표 대상·목적·원하는 행동이 없습니다. MD 또는 웹의 ‘발표 맥락’에서 입력해주세요. 이 값은 공통 디자인과 분리되어 각 슬라이드에 전달됩니다.");
        if (blocks.length && !summary.strategyContext) summary.issues.push("발표 전체의 현재 인식·목표 인식·핵심 장벽·Governing Thought가 없습니다. MD의 ‘발표 맥락’ 또는 홈페이지의 ‘설득 전략 만들기’를 채워주세요.");
        if (blocks.length > 1 && !summary.sessionPlan) summary.issues.push("세션별 역할과 연결을 담은 ‘세션 설계’가 없습니다.");
        if (summary.contractVersion && !(SKILL_PRESET_CONTRACT?.isPlannerVersionSupported?.(summary.contractVersion) ?? summary.contractVersion === PROMPTDECK_CONTRACT_VERSION)) {
          summary.issues.push(`지원하지 않는 PromptDeck 계약 ${summary.contractVersion}입니다. ‘기획안 자동 정리’를 눌러 ${PROMPTDECK_CONTRACT_VERSION} 형식으로 맞춰주세요.`);
        }
        if (summary.contractVersion === PROMPTDECK_CONTRACT_VERSION && summary.skillPresetContractVersion !== SKILL_PRESET_CONTRACT_VERSION) {
          summary.issues.push(`PromptDeck ${PROMPTDECK_CONTRACT_VERSION}에는 skill_preset_contract: ${SKILL_PRESET_CONTRACT_VERSION} 선언이 필요합니다.`);
        }
        if (summary.skillPresetIssues.length) {
          summary.issues.push(`스킬–프리셋 권한 필드를 보강해주세요 — ${summary.skillPresetIssues.join(" / ")}`);
        }
        if (summary.scriptLeaks) summary.issues.push(`${summary.scriptLeaks}장에 발표 스크립트·화면 큐가 남아 있습니다.`);
        if (summary.repeatedDesign) summary.issues.push(`${summary.repeatedDesign}장에 공통 색상·스타일 규칙이 반복됩니다.`);
        if (summary.diagramSemanticIssues.length) summary.issues.push(`도식 의미 계약을 보강해주세요 — ${summary.diagramSemanticIssues.join(" / ")}`);
        if (summary.specialImplementationIssues.length) summary.issues.push(`특수 슬라이드 구현요소를 확인해주세요 — ${summary.specialImplementationIssues.join(" / ")}`);
        return summary;
      }

      function renderPlannerContractStatus() {
        const badge = $("genPlannerContractBadge");
        const metrics = $("genPlannerContractMetrics");
        const list = $("genPlannerContractList");
        const options = $("genPlannerContractOptions");
        const convertButton = $("genPlannerConvertBtn");
        const panel = $("genPlannerContractPanel");
        if (!badge || !metrics || !list) return;

        const markdown = $("genMdInput").value;
        const hasInput = Boolean(markdown.trim());
        const summary = analyzePlannerContract(markdown);
        if (convertButton) convertButton.disabled = !hasInput;
        if (panel) panel.classList.toggle("is-empty", !hasInput);
        if (!summary.total) {
          badge.textContent = hasInput ? "형식 확인 필요" : "MD 입력 전";
          badge.className = "gen-planner-contract-badge";
          metrics.hidden = true;
          if (options) options.hidden = true;
          list.innerHTML = summary.issues.length
            ? summary.issues.map((issue) => `<p class="is-warning">${escapeHtml(issue)}</p>`).join("")
            : "<p>기획안을 붙여넣으면 이미지 생성 준비 상태를 자동으로 확인합니다. 일반 기획안이나 발표 대본은 위의 ‘기획안 자동 정리’를 먼저 사용하세요.</p>";
          return;
        }

        const complete = summary.ready === summary.total
          && summary.presentationContext
          && summary.strategyContext
          && summary.sessionPlan
          && summary.issues.length === 0;
        badge.textContent = complete ? `${summary.total}장 생성 준비 완료` : `${summary.ready}/${summary.total}장 확인 완료`;
        badge.className = `gen-planner-contract-badge ${complete ? "is-ready" : "is-review"}`;
        metrics.hidden = false;
        if (options) options.hidden = false;
        metrics.innerHTML = [
          [summary.format, "양식"],
          [summary.purpose, "주제·목적"],
          [summary.content, "콘텐츠"],
          [summary.expression, "표현 방식"],
          [summary.quality, "품질 조건"],
          [summary.skillPresetReady, "권한 계약"],
        ].map(([value, label]) => `<span class="${value === summary.total ? "is-ok" : ""}"><b>${value}/${summary.total}</b>${label}</span>`).join("")
          + (summary.diagramTotal
            ? `<span class="${summary.diagramSemanticReady === summary.diagramTotal ? "is-ok" : ""}"><b>${summary.diagramSemanticReady}/${summary.diagramTotal}</b>도식 의미</span>`
            : "");
        list.innerHTML = summary.issues.length
          ? summary.issues.slice(0, 5).map((issue) => `<p class="is-warning">${escapeHtml(issue)}</p>`).join("")
          : '<p class="is-ok">양식·목적·콘텐츠·표현 방식·품질 조건이 중복 없이 분리되어 이미지 AI가 정확한 값과 설득 구조를 함께 해석할 수 있습니다.</p>';
      }

      function normalizePlannerEnhancements(value) {
        return { visualDirector: value?.visualDirector !== false };
      }

      function normalizeSpecialSlideScope(value) {
        return { individualDesign: value?.individualDesign !== false };
      }

      function syncPlannerEnhancementControls() {
        const settings = normalizePlannerEnhancements(genState.plannerEnhancements);
        genState.plannerEnhancements = settings;
      }

      function syncSpecialSlideScopeControl() {
        const settings = normalizeSpecialSlideScope(genState.specialSlideScope);
        genState.specialSlideScope = settings;
        const input = $("genSpecialSlidesOwnDesign");
        if (input) input.checked = settings.individualDesign;
      }

      function regeneratePlannerContractPrompts() {
        const commonPrompt = getEffectiveCommonPrompt().trim();
        if (!commonPrompt) return;
        genState.records.forEach((record) => {
          if (record.manualEditedPrompt) return;
          record.prompt = generateSingleSlidePrompt(record, commonPrompt, resolveCommonPromptLanguage(commonPrompt));
        });
        refreshLatestOutput();
        renderCurrentPrompt();
        setMessage("AI 비주얼 디렉터 계약을 생성 결과에 반영했습니다.", false);
      }

      function plannerSectionText(block, titlePattern) {
        const headings = [...String(block || "").matchAll(/^###\s+(.+?)\s*$/gm)];
        const foundIndex = headings.findIndex((match) => titlePattern.test(normalizePlannerHeading(match[1])));
        if (foundIndex < 0) return "";
        const start = headings[foundIndex].index + headings[foundIndex][0].length;
        const end = headings[foundIndex + 1]?.index ?? String(block || "").length;
        return String(block || "").slice(start, end).trim();
      }

      function parsePlannerDataRows(sectionText) {
        return String(sectionText || "").split(/\r?\n/).map((line) => line.trim()).filter((line) => /^\|.+\|$/.test(line)).map((line) => (
          line.slice(1, -1).split("|").map((cell) => cell.trim().replace(/\*\*/g, ""))
        )).filter((cells) => cells.length >= 2 && !cells.every((cell) => /^[-: ]+$/.test(cell)))
          .filter((cells) => !/^(항목|구분|내용|데이터)$/i.test(cells[0]));
      }

      function firstPlannerMessage(block) {
        const section = plannerSectionText(block, /^핵심 메시지$/);
        const quote = section.split(/\r?\n/).map((line) => line.replace(/^>\s*/, "").replace(/\*\*/g, "").trim()).find(Boolean);
        return quote || "";
      }

      function plannerMetaValue(block, label) {
        const pattern = new RegExp(`^\\*\\*${label}[:：]\\*\\*\\s*(.+)$`, "m");
        return String(block || "").match(pattern)?.[1]?.trim() || "";
      }

      function inferPlannerSlideType(title, rows, block) {
        const text = `${title}\n${block}`;
        if (/비교|대비|→|증감|성장/.test(text)) return "비교와 핵심 수치";
        if (/과정|절차|프로세스|단계|로드맵/.test(text)) return "과정";
        if (/관계|체계|구조|생태계|순환/.test(text)) return "관계";
        if (/계획|추진|전략|방향/.test(text) && rows.length >= 3) return "핵심 수치와 다축 전략";
        if (rows.length >= 3) return "핵심 수치와 근거";
        return "핵심 메시지";
      }

      function inferPlannerEvidenceRelation(slideType) {
        if (/비교/.test(slideType)) return "비교·변화 — 기준과 결과의 차이가 결론을 뒷받침";
        if (/과정/.test(slideType)) return "과정·인과 — 단계의 연결이 결과가 만들어지는 방식을 설명";
        if (/관계/.test(slideType)) return "구조·연결 — 주체와 자원의 연결 방식이 핵심 경쟁력을 설명";
        if (/다축 전략/.test(slideType)) return "우선순위·실행 — 여러 실행축이 하나의 정책 방향을 공동으로 뒷받침";
        return "주장·근거 — 표시된 사실과 수치가 핵심 결론을 직접 뒷받침";
      }

      function inferPlannerCognitiveTask(slideType) {
        if (/비교/.test(slideType)) return "차이를 빠르게 비교하고 변화의 크기와 방향을 판단";
        if (/과정/.test(slideType)) return "단계의 순서와 전환 지점을 따라 결과 형성 과정을 이해";
        if (/관계/.test(slideType)) return "핵심 주체와 연결 관계를 파악하고 구조적 강점을 이해";
        if (/전략/.test(slideType)) return "실행축의 우선순위와 결론의 연결을 판단";
        return "핵심 결론과 이를 지지하는 근거를 한 번에 연결";
      }

      function inferPlannerPageType(title, block) {
        const text = `${title}\n${block}`;
        if (/표지|cover/i.test(text)) return "표지";
        if (/목차|contents|agenda/i.test(text)) return "목차";
        if (/간지|구분\s*슬라이드|section\s*(?:divider|break)/i.test(text)) return "간지";
        if (/결론|요청|감사|closing/i.test(title)) return "클로징";
        return "본문";
      }

      function inferPlannerAgendaStructure(blockText) {
        const source = String(blockText || "");
        const sessionMatches = source.match(/(?:^|\n)\s*[-*+]\s+(?:세션|파트|목차\s*항목|session|part|agenda\s*item)\s*\d*/gim) || [];
        const numberedParts = source.match(/(?:PART|파트|세션|SESSION)\s*\d+/gi) || [];
        const itemCount = Math.max(sessionMatches.length, new Set(numberedParts.map((item) => item.replace(/\s+/g, "").toLowerCase())).size);

        if (/현재\s*(?:위치|파트|세션)|진행\s*(?:강조|상태)|progressive|navigator/i.test(source)) return {
          priority: "전체 구조 안의 현재 위치",
          relation: "현재 위치",
          structure: "진행 강조 내비게이터",
          composition: "전체 목차를 유지하되 현재 파트만 크기·명도·역할색으로 선명하게 강조하고 나머지는 판독 가능한 낮은 대비로 정리",
          visualLanguage: "진행 강조 내비게이터를 주 언어로, 타이포 위계를 보조 언어로 사용",
        };
        if (/발표자|담당|책임\s*주체|speaker|owner/i.test(source)) return {
          priority: "주제와 담당 주체",
          relation: "담당",
          structure: "시간·담당 목차",
          composition: "주제와 발표자·담당을 같은 행에서 비교하는 2~3열 구조로 정렬하고 필요한 경우 세션별 시간대를 함께 표시",
          visualLanguage: "구조화된 주제–담당 표를 주 언어로, 역할색을 보조 언어로 사용",
        };
        if (/발표\s*시간|세션\s*시간|시간표|일정|타임테이블|schedule|time-based/i.test(source)) return {
          priority: "세션별 시간과 진행 순서",
          relation: "시간",
          structure: "시간·담당 목차",
          composition: "시간과 세션명을 같은 행에서 빠르게 찾는 2~3열 일정 구조로 정렬하고 시간대별 구분을 명료하게 표시",
          visualLanguage: "시간표형 인덱스를 주 언어로, 세션 구분 밴드를 보조 언어로 사용",
        };
        if (/상위\s*(?:파트|챕터)|하위\s*(?:항목|주제)|계층|chapter|hierarch/i.test(source)) return {
          priority: "상위 파트와 하위 주제의 위계",
          relation: "계층",
          structure: "그룹·계층 목차",
          composition: "상위 파트별 밴드 또는 클러스터 안에 하위 항목을 묶어 포함 관계와 읽기 순서를 명료하게 표시",
          visualLanguage: "그룹·계층 인덱스를 주 언어로, 파트별 표면 구분을 보조 언어로 사용",
        };
        if (/매트릭스|모자이크|2\s*축|분류\s*축|matrix|mosaic/i.test(source)) return {
          priority: "병렬 테마와 분류 기준",
          relation: "분류",
          structure: "매트릭스·모자이크 목차",
          composition: "병렬 테마를 2차원 구역에 배치해 분류 기준과 항목 범위를 한눈에 비교하고 순차성을 암시하지 않음",
          visualLanguage: "매트릭스·모자이크 인덱스를 주 언어로, 범주별 색면을 보조 언어로 사용",
        };
        if (/실사|사진|지도|일러스트|비주얼\s*분할|photo|visual split/i.test(source)) return {
          priority: "발표 범위와 맥락",
          relation: "병렬",
          structure: "텍스트·비주얼 분할 목차",
          composition: "세션 인덱스가 캔버스의 50~60%를 차지하고 하나의 맥락 비주얼이 나머지 영역에서 발표 범위를 보강",
          visualLanguage: "타이포 인덱스를 주 언어로, 맥락 비주얼을 보조 언어로 사용",
        };
        if (/항목\s*관계\s*[:：]\s*(?:순차|의존)|실제\s*(?:순차|의존|인과)|단계\s*전개|타임라인|로드맵|스토리\s*흐름도|프로세스\s*단계도|여정\s*구조/i.test(source)) return {
          priority: "실제 전개 순서와 의존 관계",
          relation: "순차·의존",
          structure: "경로·계단·타임라인",
          composition: "시작–전환–결과가 한 방향으로 읽히는 구조를 사용하고 선·화살표는 실제 시간·의존 관계만 설명",
          visualLanguage: "순차 경로를 주 언어로, 단계별 타이포 위계를 보조 언어로 사용",
        };
        if (/다중\s*열\s*목차|multi-column\s*(?:agenda|index)/i.test(source)) return {
          priority: "병렬 세션의 전체 범위",
          relation: "병렬",
          structure: "다중 열 목차",
          composition: "세션을 2~4개 열로 균형 배치하고 번호·정렬·여백으로 탐색 순서를 제공하며 항목 사이 연결선은 사용하지 않음",
          visualLanguage: "다중 열 인덱스를 주 언어로, 번호와 타이포 위계를 보조 언어로 사용",
        };
        if (/대형\s*번호|타이포\s*인덱스|typographic\s*index/i.test(source)) return {
          priority: "발표 범위와 핵심 구분",
          relation: "병렬",
          structure: "대형 번호·타이포 인덱스",
          composition: "큰 번호와 짧은 세션명을 비대칭 또는 단일 정렬축에 배치하고 스케일·여백·위계로 빠르게 탐색",
          visualLanguage: "대형 번호·타이포 인덱스를 주 언어로, 역할색을 보조 언어로 사용",
        };
        if (/개념도\s*\/\s*다이어그램|관계\s*다이어그램|concept\s*(?:map|diagram)/i.test(source)) return {
          priority: "핵심 주제와 세션 간 구조",
          relation: "구조 관계",
          structure: "관계 다이어그램형 목차",
          composition: "핵심 주제와 세션의 의미 관계를 중심–주변 또는 군집 구조로 표시하고 실제 관계가 없는 항목은 선으로 연결하지 않음",
          visualLanguage: "관계 다이어그램을 주 언어로, 세션별 타이포 위계를 보조 언어로 사용",
        };
        if (itemCount >= 9) return {
          priority: "전체 범위와 상위 묶음",
          relation: "병렬·그룹",
          structure: "그룹형 타이포 인덱스",
          composition: "항목을 상위 파트별 3열 또는 밴드로 묶고 항목명 중심으로 축약해 전체 범위를 빠르게 탐색",
          visualLanguage: "그룹형 타이포 인덱스를 주 언어로, 상위 파트 구역을 보조 언어로 사용",
        };
        if (itemCount >= 6) return {
          priority: "병렬 세션의 전체 범위",
          relation: "병렬",
          structure: "다중 열 목차",
          composition: "세션을 2~3개 열로 균형 배치하고 번호·정렬·여백으로 탐색 순서를 제공하며 항목 사이 연결선은 사용하지 않음",
          visualLanguage: "다중 열 인덱스를 주 언어로, 번호와 타이포 위계를 보조 언어로 사용",
        };
        return {
          priority: "발표 범위와 핵심 구분",
          relation: "병렬",
          structure: "대형 번호·타이포 인덱스",
          composition: "큰 번호와 짧은 세션명을 비대칭 또는 단일 정렬축에 배치하고 스케일·여백·위계로 빠르게 탐색",
          visualLanguage: "대형 번호·타이포 인덱스를 주 언어로, 역할색을 보조 언어로 사용",
        };
      }

      function inferPlannerMacroComposition(pageType, slideType, blockText) {
        if (pageType === "표지") return "발표 성격을 예고하는 단일 키 비주얼과 보호된 제목 영역을 중심으로 구성하고, 전경·중경·배경이 하나의 깊이로 연결되는 히어로 구도";
        if (pageType === "목차") return inferPlannerAgendaStructure(blockText).composition;
        if (pageType === "간지") return "이전 세션의 확정 결론에서 새 세션의 질문으로 전환하는 단일 키 비주얼, 큰 제목, 의도된 넓은 여백의 전환 구도";
        if (pageType === "클로징") return "덱의 결론과 기억점을 하나의 최종 판단 또는 행동 요청으로 수렴시키고, 표지 모티프를 더 단순하고 완결된 형태로 회수하는 종착 구도";
        if (/비교/.test(slideType)) return "기준과 결과가 같은 시선 축에서 바로 비교되는 두 의미 영역과, 차이의 크기를 연결하는 하나의 주 증거 영역";
        if (/과정/.test(slideType)) return "시작–전환–결과의 순서를 따라가는 큰 흐름과 단계별 증거 영역이 끊김 없이 이어지는 과정 구도";
        if (/관계/.test(slideType)) return "핵심 주체 또는 자원을 중심축으로 두고 연결 관계와 순환 경로가 하나의 구조로 읽히는 관계 구도";
        if (/전략/.test(slideType)) return "대표 결론·지표를 주 초점으로 두고 실행축이 이를 뒷받침하는 주–보조 의미 영역 구조";
        return "핵심 결론 또는 대표 지표를 주 초점으로 두고 보조 근거와 출처가 단계적으로 따라오는 집중형 큰 구성";
      }

      function inferPlannerVisualPresence(pageType, density) {
        if (["표지", "간지", "클로징"].includes(pageType)) return "강한 주도형";
        if (pageType === "목차") return "균형 강조형";
        const densityCode = String(density || "").match(/\bC[1-4]\b/i)?.[0]?.toUpperCase();
        return ({ C1: "강한 주도형", C2: "균형 강조형", C3: "구조 중심형", C4: "절제 검토형" })[densityCode] || "균형 강조형";
      }

      function inferPlannerStrategy(pageType, slideType, conclusion) {
        if (pageType === "표지") return {
          task: "발표의 판단 기준을 예고하고 주제를 새로운 전략 관점으로 재해석",
          current: "주제와 관련 정보가 분절되어 있어 발표가 무엇을 판단하게 할지 아직 정해지지 않음",
          target: `${conclusion}을 덱 전체가 증명할 핵심 관점으로 받아들임`,
          tension: "익숙한 주제 인식과 발표가 제안하는 새로운 판단 기준",
          argument: "핵심 주제에서 새로운 전략 관점으로 전환되는 상징적 연결 논증",
        };
        if (pageType === "목차") return {
          task: "세션 정보를 청중이 필요한 구조를 즉시 찾는 발표 개요로 전환",
          current: "세션명을 동일한 항목 목록으로만 이해",
          target: "전체 범위와 항목의 실제 관계·위계·현재 위치를 빠르게 파악",
          tension: "모든 항목의 표시와 핵심 구조의 즉시 인식",
          argument: "항목 관계에 맞는 분류·위계·시간·진행 개요",
        };
        if (pageType === "간지") return {
          task: "앞 세션의 결론을 닫고 새 세션의 질문에 주의를 전환",
          current: "앞 세션의 결론에 머물러 새 질문의 필요성을 아직 느끼지 못함",
          target: "앞 결론이 다음 질문을 요구한다는 전환 논리를 이해",
          tension: "이미 확정된 결론과 이제 답해야 할 새 질문",
          argument: "확정 결론에서 새 질문으로 이동하는 전환 논증",
        };
        if (pageType === "클로징") return {
          task: "덱의 핵심 기억을 회수해 최종 판단 또는 다음 행동으로 수렴",
          current: "핵심 근거를 이해했지만 무엇을 결정하거나 실행할지 아직 한 점으로 모이지 않음",
          target: "덱의 결론과 기억점을 하나의 구체적인 판단 또는 행동으로 연결",
          tension: "이해한 내용과 이제 내려야 할 결정 또는 행동",
          argument: "기억점이 최종 판단 또는 행동 요청으로 모이는 수렴 논증",
        };
        if (/비교/.test(slideType)) return {
          task: "같은 기준에서 차이를 증명해 변화의 크기와 방향을 재평가",
          current: "기준과 결과를 별개 수치로 보아 차이의 의미를 판단하기 어려움",
          target: `${conclusion}을 기준 대비 변화로 판단`,
          tension: "기준 상태와 변화 결과",
          argument: "같은 기준축에서 차이와 변화량을 보여주는 비교·격차 논증",
        };
        if (/과정/.test(slideType)) return {
          task: "개별 단계를 결과 형성의 연결 과정으로 이해시킴",
          current: "단계를 독립된 활동 목록으로 이해",
          target: `${conclusion}이 단계의 연결에서 만들어진다고 이해`,
          tension: "분절된 단계와 완성된 결과",
          argument: "시작–전환–결과의 연결을 보여주는 과정·인과 논증",
        };
        if (/관계/.test(slideType)) return {
          task: "분절된 요소보다 연결 구조가 만드는 가치를 증명",
          current: "주체·자원·기능을 서로 독립된 항목으로 이해",
          target: `${conclusion}의 핵심이 요소 간 연결에 있다고 판단`,
          tension: "개별 요소의 합과 연결된 구조의 가치",
          argument: "중심축과 연결 경로가 상호작용하는 구조·연결 논증",
        };
        if (/전략/.test(slideType)) return {
          task: "여러 실행항목을 하나의 우선 판단을 뒷받침하는 전략으로 묶음",
          current: "실행항목을 동등한 체크리스트로 이해",
          target: `${conclusion}을 중심으로 실행축의 역할과 우선순위를 판단`,
          tension: "분산된 실행항목과 하나의 전략적 결론",
          argument: "대표 결론과 실행축의 기여를 보여주는 위계·연결 논증",
        };
        return {
          task: "핵심 증거를 결론과 직접 연결해 정보의 존재를 판단 근거로 전환",
          current: "사실과 수치를 개별 정보로 이해",
          target: `${conclusion}을 핵심 증거가 뒷받침하는 판단으로 받아들임`,
          tension: "정보의 존재와 청중이 내려야 할 판단",
          argument: "핵심 증거가 결론을 직접 지지하는 주장–근거 논증",
        };
      }

      function inferPlannerStrategyBarrier(pageType, slideType) {
        if (pageType === "표지") return "발표 주제는 보이지만 어떤 판단 기준으로 내용을 읽어야 하는지 아직 드러나지 않음";
        if (pageType === "목차") return "항목의 실제 관계와 중요도 없이 같은 형식으로 반복하면 전체 구조와 우선 정보가 흐려짐";
        if (pageType === "간지") return "앞 세션의 결론과 새 세션의 질문 사이 필요성이 연결되지 않을 수 있음";
        if (pageType === "클로징") return "기억점과 요청이 분리되면 청중이 발표 후 내려야 할 판단이나 행동이 흐려짐";
        if (/비교/.test(slideType)) return "기준과 결과의 조건·단위·시점이 같은 축에서 연결되지 않으면 차이의 의미가 약해짐";
        if (/과정/.test(slideType)) return "단계가 동일한 목록으로 보이면 전환 지점과 결과 형성 논리가 사라짐";
        if (/관계/.test(slideType)) return "요소를 개별 항목으로 읽는 습관 때문에 연결 구조의 가치가 보이지 않음";
        if (/전략/.test(slideType)) return "실행항목을 동등한 체크리스트로 보면 결론과 우선순위가 흐려짐";
        return "핵심 증거가 결론과 직접 연결되지 않으면 정보가 판단 근거가 아니라 단순 나열로 보임";
      }

      function inferPlannerClosingMode(text) {
        const source = String(text || "");
        if (/Q\s*&\s*A|질의.?응답|질문/.test(source)) return "Q&A 전환형";
        if (/승인|의사결정|선택|결정\s*요청/.test(source)) return "의사결정 요청형";
        if (/실행|착수|협업|참여|동참/.test(source)) return "실행 촉구형";
        return "결론 회수형";
      }

      function inferPlannerSpecialImplementation(pageType, blockText) {
        if (pageType === "표지") return {
          purposeLines: [
            "- 인지 과업: 발표 범위와 약속을 첫 시선에 인식",
            "- 발표 약속: 콘텐츠의 제목·부제가 예고하는 관점과 최종 판단",
            "- 세션 연결: 표지의 약속 → 목차의 구조 개요",
          ],
          gesture: "제목과 하나의 히어로 모티프가 긴장 관계를 이루며 발표의 관점을 예고",
          variation: "표지 모티프를 클로징에서 더 단순하고 완결된 형태로 회수할 수 있게 설계",
        };
        if (pageType === "목차") {
          const agendaPlan = inferPlannerAgendaStructure(blockText);
          return {
            purposeLines: [
              `- 목차 목적: ${agendaPlan.priority} 파악`,
              `- 항목 관계: ${agendaPlan.relation}`,
              `- 선택 구조: ${agendaPlan.structure}`,
            ],
            gesture: agendaPlan.composition,
            variation: "공통 정체성 안에서 타이포 위계·역할색·구역 표면을 조정하고 연결선은 실제 관계를 설명할 때만 사용",
          };
        }
        if (pageType === "간지") return {
          purposeLines: [
            "- 인지 과업: 앞 세션의 결론을 닫고 새 세션의 질문으로 이동",
            "- 앞 세션 결론: 직전 세션에서 이미 확정된 판단",
            "- 다음 세션 질문: 새 파트가 답해야 할 한 가지 질문",
            "- 전환 이유: 앞 결론이 다음 질문을 요구하는 이유",
          ],
          gesture: "이동·정렬·개방·수렴 중 의미에 맞는 전환 동사 하나를 공간 제스처로 번역",
          variation: "넓은 여백과 하나의 방향으로 다음 장을 향하는 시선 출구를 형성",
        };
        if (pageType === "클로징") return {
          purposeLines: [
            `- 클로징 유형: ${inferPlannerClosingMode(blockText)}`,
            "- 인지 과업: 핵심 기억을 회수하고 최종 판단 또는 다음 행동을 결정",
            "- 수렴 관계: 기억점 → 최종 결론 → 구체적 요청 또는 Q&A 전환",
          ],
          gesture: "분산된 기억점을 하나의 가장 강한 논리적 종착점으로 수렴",
          variation: "표지 모티프를 더 단순하고 완결된 형태로 회수해 시작과 끝을 연결",
        };
        return null;
      }

      function plannerFocusFromDisplay(displayLines, message, title) {
        const preferred = displayLines.find((line) => /^[-*+]\s*(?:강조\s*수치|핵심\s*지표|핵심\s*성과|대표\s*성과)\s*[:：]/.test(line));
        if (preferred) return preferred.replace(/^[-*+]\s*[^:：]+\s*[:：]\s*/, "").trim();
        const numeric = displayLines.find((line) => /\d/.test(line) && !/^[-*+]\s*(?:출처|주석|페이지)/.test(line));
        if (numeric) return numeric.replace(/^[-*+]\s*[^:：]+\s*[:：]\s*/, "").trim();
        return message || title;
      }

      function convertPlannerBlock(block) {
        const currentSections = ["양식", "핵심 주제·목적", "콘텐츠", "표현 방식", "품질 조건"];
        if (currentSections.every((section) => hasPlannerSection(block.text, section))) return block.text;

        const bulletLines = (text) => String(text || "")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => /^[-*+]\s+\S/.test(line));
        const parseBullet = (line) => {
          const match = String(line || "").match(/^[-*+]\s+(?:\*\*)?([^:：*]+?)(?:\*\*)?\s*[:：]\s*(.+)$/);
          return match ? { label: match[1].trim(), value: match[2].trim() } : null;
        };

        const message = firstPlannerMessage(block.text);
        const dataRows = parsePlannerDataRows(plannerSectionText(block.text, /^핵심 데이터$/));
        const legacyDisplayLines = bulletLines(plannerSectionText(block.text, /^화면 표시 콘텐츠$/));
        const existingFormatLines = bulletLines(plannerSectionText(block.text, /^양식$/));
        const existingContentLines = bulletLines(plannerSectionText(block.text, /^콘텐츠$/));
        const slideType = inferPlannerSlideType(block.title, dataRows, block.text);
        const pageType = inferPlannerPageType(block.title, block.text);
        const specialPage = ["표지", "목차", "간지", "클로징"].includes(pageType);
        const bodyItems = plannerSectionText(block.text, /^(본문 콘텐츠|화면 콘텐츠)$/)
          .split(/\r?\n/)
          .map((line) => line.replace(/^[-*+]\s*/, "").replace(/\*\*/g, "").trim())
          .filter(Boolean);

        const normalizeFormatLine = (line) => {
          const item = parseBullet(line);
          if (!item) return "";
          const type = classifyHeaderFooterField(item.label);
          if (!type) return "";
          const key = canonicalHeaderFooterFieldKey(item.label, type);
          const compact = normalizeMetadataFieldKey(item.label).replace(/[()〔〕\[\]·._-]/g, "");
          if (key === "__slide_title") return `- 헤더 2단계 제목: ${item.value}`;
          if (type === "header" && /^(헤더섹션명|섹션명|파트|헤더파트)$/.test(compact)) return `- 헤더 1단계 파트: ${item.value}`;
          if (type === "header" && /^(헤더부제|부제)$/.test(compact)) return `- 헤더 3단계 부제: ${item.value}`;
          return `- ${item.label}: ${item.value}`;
        };

        const formatLines = specialPage
          ? ["- 프레임 방식: 반복 헤더·푸터 슬롯 없이 전체 캔버스를 콘텐츠와 키 비주얼에 사용"]
          : (existingFormatLines.length
            ? existingFormatLines
            : legacyDisplayLines.map(normalizeFormatLine).filter(Boolean));
        if (!specialPage && !formatLines.some((line) => canonicalHeaderFooterFieldKey(parseBullet(line)?.label || "") === "__slide_title")) {
          formatLines.unshift(`- 헤더 2단계 제목: ${block.title}`);
        }

        const contentLines = existingContentLines.length
          ? existingContentLines
          : legacyDisplayLines.filter((line) => {
              const item = parseBullet(line);
              return !item || !classifyHeaderFooterField(item.label);
            });
        if (!contentLines.length) {
          if (message && message !== block.title) contentLines.push(`- 핵심 문장: ${message}`);
          dataRows.forEach((cells) => {
            const label = cells[0];
            const value = cells[1];
            if (label && value) contentLines.push(`- ${label}: ${value}`);
          });
          if (!dataRows.length) bodyItems.slice(0, 6).forEach((item, index) => contentLines.push(`- 보조 근거 ${index + 1}: ${item}`));
        }
        if (specialPage) {
          const specialTitleLabel = ({ 표지: "제목", 목차: "목차 제목", 간지: "파트명", 클로징: "결론 문구" })[pageType];
          const hasSpecialTitle = contentLines.some((line) => parseBullet(line)?.label.replace(/\s+/g, "") === specialTitleLabel.replace(/\s+/g, ""));
          if (!hasSpecialTitle) {
            contentLines.unshift(`- ${specialTitleLabel}: ${block.title}`);
          }
        }
        if (!contentLines.length) contentLines.push("- 핵심 문장: 확인 필요");

        const density = plannerMetaValue(block.text, "정보 밀도") || plannerMetaValue(block.text, "밀도(?: 레벨)?") || (dataRows.length >= 5 ? "C3 비교·분석" : "C2 근거까지 이해");
        const visualization = plannerMetaValue(block.text, "데이터 시각화 강도")
          || (dataRows.length >= 5 ? "V3 데이터 주도" : dataRows.length >= 2 ? "V2 간단 비교" : dataRows.length === 1 ? "V1 핵심 수치 강조" : "V0 콘텐츠 중심");
        const diagramComplexity = plannerMetaValue(block.text, "도식 복잡도|다이어그램 복잡도") || "";
        const compositionLocked = /D4/i.test(diagramComplexity) || /V4/i.test(visualization) || /참조.*(?:동일성|구조).*(?:고정|보존)/i.test(block.text);
        const compositionGuided = !compositionLocked && (/D[23]/i.test(diagramComplexity) || /V3/i.test(visualization) || /C4/i.test(density));
        const compositionAutonomy = compositionLocked ? "구성 고정" : compositionGuided ? "읽기 방향 가이드" : "의미만 고정";
        const compositionLockReason = compositionLocked
          ? (/V4/i.test(visualization) ? "V4 원자료의 축·행·열·데이터 귀속 보존" : /D4/i.test(diagramComplexity) ? "D4 도식의 그룹·연결 토폴로지 보존" : "참조 자산의 동일성과 구조 보존")
          : "";
        const skillLocks = compositionLocked
          ? "표시 문구·수치·의미 관계·큰 구성·관계 토폴로지·데이터 귀속"
          : compositionGuided
            ? "표시 문구·수치·의미 관계·주 읽기 방향"
            : "표시 문구·수치·사실·증거 지위·의미 관계";
        const skillGuides = compositionLocked
          ? "미세 정렬·국부 대비·표면 마감"
          : compositionGuided
            ? "의미 그룹·인접성·주 읽기 방향·강조 순서"
            : "핵심 강조 대상·읽기 우선순위·정보 위계";
        const skillFree = compositionLocked
          ? "타이포 표현·형태·선·재질·표면·이미지 처리·마감"
          : compositionGuided
            ? "정확한 분할·위치·크기·매체·시각 은유·크롭·레이어"
            : "레이아웃 계열·매체·시각 은유·크기·간격·크롭·깊이·레이어";
        const presetScope = compositionLocked
          ? "타이포 행동·형태 문법·선 처리·재질·표면·이미지 처리"
          : compositionGuided
            ? "호환 레이아웃 계열·매체·타이포 행동·표면·이미지 처리"
            : "레이아웃 계열·공간 실루엣·매체·그림체·타이포 행동·표면·이미지 처리";
        const visualPresence = inferPlannerVisualPresence(pageType, density);
        const strategic = inferPlannerStrategy(pageType, slideType, "이 장의 결론");
        const specialImplementation = inferPlannerSpecialImplementation(pageType, block.text);
        const strategyBarrier = inferPlannerStrategyBarrier(pageType, slideType);
        const cognitiveTask = inferPlannerCognitiveTask(slideType);
        const macroComposition = inferPlannerMacroComposition(pageType, slideType, block.text);
        const specialFocusRole = ({ 표지: "발표 제목", 목차: "전체 구조·핵심 구분", 간지: "전환 메시지", 클로징: "최종 결론" })[pageType];
        const focusRole = specialFocusRole || (dataRows.length || contentLines.some((line) => /수치|지표|성과|\d/.test(line))
          ? "대표 지표"
          : message ? "핵심 문장" : "헤더 3단계 부제");
        const specialVisualLanguage = {
          표지: "타이포그래피와 하나의 키 비주얼을 통합한 히어로 장면",
          목차: inferPlannerAgendaStructure(block.text).visualLanguage,
          간지: "공간 제스처를 주 언어로, 파트 타이포그래피를 보조 언어로 사용",
          클로징: "결론 타이포그래피를 주 언어로, 기억점의 수렴 관계를 보조 언어로 사용",
        }[pageType];
        const visualLanguage = specialVisualLanguage || (dataRows.length || contentLines.some((line) => /\d/.test(line))
          ? "데이터 시각화를 주 언어로, 관계 설명을 보조 언어로 사용"
          : "타이포그래피를 주 언어로, 의미 관계를 설명하는 비주얼을 보조 언어로 사용");
        const generationPath = /V[34]/.test(visualization)
          ? "정밀 일체형 이미지 생성"
          : "일반 일체형 이미지 생성";

        const purposeLines = specialImplementation
          ? specialImplementation.purposeLines.join("\n")
          : `- 핵심 주제: ${slideType}가 청중의 판단에 주는 의미
- 슬라이드 목적: ${strategic.task}
- 청중 질문: 이 장의 근거는 어떤 판단을 새로 가능하게 하는가?
- 인식 변화: ${strategic.current} → 핵심 근거를 통해 이 장의 결론과 우선순위를 판단
- 핵심 장벽: ${strategyBarrier}
- 목표 판단 또는 행동: 표시된 근거를 바탕으로 결론의 타당성과 중요도를 판단
- 핵심 근거의 역할: ${focusRole}가 핵심 장벽을 낮추는 직접 근거로 작동
- 세션 연결: 앞 장의 확정 내용 → 이 장의 새 판단 → 다음 장의 구체적 증명 또는 실행 질문`;

        return `## ${block.kind} ${block.no}. ${block.title}

### 양식 〔${specialPage ? "화면 비표시·전체 캔버스" : "화면 표시·헤더/푸터"}〕

${formatLines.join("\n")}

### 핵심 주제·목적 〔화면 비표시〕

${purposeLines}

### 콘텐츠 〔화면 표시〕

${contentLines.join("\n")}

### 표현 방식 〔화면 비표시〕

- 페이지 유형: ${pageType}
- 정보 밀도: ${density}
- 데이터 시각화 강도: ${visualization}
- 비주얼 존재감: ${visualPresence}
- 설정 반영: 콘텐츠의 근거 수와 설명 깊이를 정보 밀도에 맞추고, 데이터의 주·보조 역할과 정확도 요구를 시각화 강도에 맞추며, 낮은 밀도일수록 요소 수가 아닌 핵심 초점의 스케일·깊이·대비를 강화
- 구성 위임 수준: ${compositionAutonomy}
- 잠금 항목: ${skillLocks}
- 가이드 항목: ${skillGuides}
- 자유 항목: ${skillFree}
- 구성 잠금 이유: ${compositionLockReason || "해당 없음 — 콘텐츠 의미와 데이터 정직성만 고정"}
- 프리셋 적용 범위: ${presetScope}
- 비주얼 논증: ${strategic.argument}
- 의미 그룹과 관계: ${focusRole}를 주장·판단 그룹의 중심으로 두고 핵심 근거와 보조 근거를 결합·대조·흐름 관계에 따라 묶음
- 읽기 우선순위: ${specialPage ? `${focusRole} → 핵심 비주얼의 의미 → 전환·수렴 판단` : `${focusRole} → 핵심 근거 → 보조 근거 → 결론`}
- 큰 구성 아이디어: ${macroComposition}; 구성 잠금이 없으면 AI가 다른 공간·매체 후보와 비교 가능
${specialImplementation ? `- 단일 시각 제스처: ${specialImplementation.gesture}\n- 페이지 변주: ${specialImplementation.variation}` : ""}
- 정보 위계: 1순위 ${focusRole} → 2순위 핵심 근거 → 3순위 보조 근거
- 핵심 강조 대상: ${focusRole}
- 강조 설계: 결론을 가장 직접적으로 뒷받침하므로 큰 스케일·역할색 대비·집중 여백·전경 레이어 중 적합한 방법을 사용
- 시각 언어와 레이어: ${visualLanguage}; 배경 맥락 → 주 증거 → 관계 설명 → 텍스트 보호층으로 구성
- 여백과 리듬: 핵심 강조 대상 주변에는 휴식 공간을 두고 관련 근거는 가깝게, 다른 의미 영역은 더 넓게 분리
- 생성 경로: ${generationPath}
- AI 조정 범위: 의미·문구·수치·관계·강조 이유는 보존하고, ${compositionAutonomy} 범위에서 구도·매체·시각 은유·크기·좌표·간격·크롭·중첩·화풍을 비교·최적화

### 품질 조건 〔화면 비표시〕

- 사실 고정: ${specialPage ? "콘텐츠" : "양식과 콘텐츠"}에 정의된 문자열·수치·단위·날짜·고유명사만 사용
- 허용 해석: 제공된 핵심 근거가 이 장의 목표 판단을 뒷받침한다는 범위
- 해석 경계: 명세에 없는 인과·성과·미래 예측·대표성으로 확대하지 않음
- 데이터 정직성: 서로 다른 단위는 공통 축이나 면적으로 직접 비교하지 않고 원자료의 기준·순서·척도를 보존
- 참조 보존: 제공된 참조가 있으면 고유 형태·비율·방향·식별 특징을 유지
- 맥락 이미지의 지위: 일반 설명 보조이며 특정 사실이나 성과의 실제 증거로 사용하지 않음
- 품질 취약점: 작은 한글, 숫자·단위, 반복 요소의 개수와 정렬
- 출력 품질: 같은 문구를 한 번만 표시하고 필드명·제작 지시·Markdown 표식을 숨기며 글자·수치·도형을 전면 블러 없이 선명하게 마감`;
      }

      function convertPlannerInput() {
        const input = $("genMdInput");
        const source = input.value.trim();
        if (!source) return setMessage("정리할 기획안 MD를 먼저 입력해주세요.");
        const blocks = splitPlannerBlocks(source);
        if (!blocks.length) return setMessage("`## 슬라이드 01. 제목` 형식의 슬라이드 시작점을 찾지 못했습니다.");
        const preamble = source.slice(0, blocks[0].index).trim().replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*/, "").trim();
        const converted = blocks.map(convertPlannerBlock).join("\n\n---\n\n");
        const contractHeader = `---\npromptdeck_contract: ${PROMPTDECK_CONTRACT_VERSION}\nskill_preset_contract: ${SKILL_PRESET_CONTRACT_VERSION}\n---`;
        input.value = [contractHeader, preamble, converted].filter(Boolean).join("\n\n");
        updateHeaderFooterStatus();
        renderPlannerContractStatus();
        renderSplitRulesPreview();
        renderBuilderLivePreview();
        setMessage(`${blocks.length}장 기획안을 PromptDeck 이미지 생성형으로 정리했습니다. 원문 수치와 이미지 주제를 최종 확인해주세요.`, false);
      }

      function previewRecordHtml(record, index) {
        const pageType = inferPageTypeForRecord(record);
        const visualPresence = deriveVisualPresence(record);
        const compositionAutonomy = deriveCompositionAutonomy(record);
        const generationPlan = deriveGenerationPlan(record.screenSpec);
        const diagramPlan = deriveDiagramPlan(record.screenSpec);
        const diagramChip = diagramPlan.code === "D0"
          ? ""
          : `<b class="gen-diagram-chip${diagramPlan.code === "D4" ? " is-risk" : ""}" title="${escapeHtml(`${diagramPlan.type} · 노드 ${diagramPlan.nodeCount || "명세 기준"} · 연결 ${diagramPlan.edgeCount || "명세 기준"}${diagramPlan.code === "D4" ? " · 개요–상세 분할 권장" : ""}`)}">도식 ${escapeHtml(diagramPlan.code)}${diagramPlan.code === "D4" ? " · 분할 검토" : ""}</b>`;
        const diagramMeaningChip = diagramPlan.code === "D0" || !diagramPlan.semanticRequired
          ? ""
          : `<b class="gen-diagram-meaning-chip ${diagramPlan.semanticReady ? "is-ready" : "is-risk"}" title="${escapeHtml(diagramPlan.semanticReady ? "노드 역할·관계 동사·결론 귀착점이 정의됨" : `보강 필요: ${[...diagramPlan.semanticMissing, ...(diagramPlan.abstractHeadline ? ["추상어 중심 헤드라인"] : [])].join(", ")}`)}">${diagramPlan.semanticReady ? "의미 명확" : "의미 보강"}</b>`;
        const typeLabel = isSlideRecord(record)
          ? (SPECIAL_PAGE_TYPE_LABELS[pageType] || "본문")
          : "부록";
        const specialClass = SPECIAL_PAGE_TYPES.has(pageType) ? " is-special" : "";
        const contentPreview = String(record.screenSpec || "")
          .split(/\r?\n/)
          .filter((line, lineIndex) => lineIndex > 0 && line.trim())
          .map((line) => line
            .replace(/^#{1,6}\s+/, "")
            .replace(/^[-*+]\s+/, "")
            .replace(/\*\*/g, "")
            .trim())
          .filter(Boolean)
          .join(" · ")
          .slice(0, 240);
        return [
          `<div class="gen-split-preview-item has-content${specialClass}">`,
          `<span>${index + 1}</span>`,
          `<strong>${escapeHtml(typeLabel)} ${escapeHtml(record.slide_no || "-")}<b class="gen-visual-presence-chip ${escapeHtml(visualPresence.className)}">비주얼 ${escapeHtml(visualPresence.shortKo)}</b><b class="gen-composition-autonomy-chip ${escapeHtml(compositionAutonomy.className)}" title="${escapeHtml(compositionAutonomy.reasonKo)}">구성 ${escapeHtml(compositionAutonomy.shortKo)}</b><b class="gen-generation-path-chip ${escapeHtml(generationPlan.className)}" title="${escapeHtml(generationPlan.reasonKo)}">경로 ${escapeHtml(generationPlan.shortKo)}</b>${diagramChip}${diagramMeaningChip}</strong>`,
          `<em>${escapeHtml(record.title || "제목 없음")}</em>`,
          `<p class="gen-split-preview-content">${escapeHtml(contentPreview || "본문 내용 없음")}</p>`,
          `</div>`
        ].join("");
      }

      function updateSpecialSlideScopeStatus(records = null) {
        const status = $("genSpecialSlidesScopeStatus");
        if (!status) return;
        const settings = normalizeSpecialSlideScope(genState.specialSlideScope);
        status.className = "gen-special-slide-status";

        if (!settings.individualDesign) {
          status.textContent = "공통 디자인 적용 · 특수 슬라이드 헤더·푸터 미사용";
          status.classList.add("is-all");
          return;
        }

        if (!Array.isArray(records)) {
          status.textContent = "분리 규칙 확인 필요";
          return;
        }

        if (!records.length && !$("genMdInput").value.trim()) {
          status.textContent = "MD 입력 후 자동 감지";
          return;
        }

        const specialCount = records.filter((record) => SPECIAL_PAGE_TYPES.has(inferPageTypeForRecord(record))).length;
        status.textContent = specialCount
          ? `특수 슬라이드 ${specialCount}장 · 전체 캔버스 + 헤더·푸터 미사용`
          : "특수 슬라이드 0장";
        if (specialCount) status.classList.add("is-active");
      }

      function renderSplitRulesPreview() {
        const list = $("genSplitRulesPreview");
        const badge = $("genSplitRulesPreviewBadge");
        if (!list || !badge) return;

        const rulesText = $("genSplitRules").value.trim();
        const markdown = $("genMdInput").value.trim();
        const maxChars = readMaxChars();

        if (!rulesText) {
          badge.textContent = "규칙 없음";
          badge.className = "is-error";
          list.innerHTML = `<div class="gen-split-preview-empty">구분 규칙을 하나 이상 입력하거나 도우미에서 추가하세요.</div>`;
          updateSpecialSlideScopeStatus(null);
          return;
        }

        try {
          const rules = parseSplitRules(rulesText);
          if (!markdown) {
            badge.textContent = `${rules.length}개 규칙 유효`;
            badge.className = "is-ok";
            list.innerHTML = rules.map((rule, index) => (
              `<div class="gen-split-preview-item"><span>${index + 1}</span><strong>${escapeHtml(rule.type)}</strong><em>${escapeHtml(rule.source)}</em></div>`
            )).join("");
            updateSpecialSlideScopeStatus([]);
            return;
          }

          const records = parseMarkdown(markdown, maxChars, rulesText);
          if (!records.length) {
            badge.textContent = "0개 인식";
            badge.className = "is-error";
            list.innerHTML = `<div class="gen-split-preview-empty">현재 MD에서 이 규칙과 일치하는 슬라이드 시작점을 찾지 못했습니다.</div>`;
            updateSpecialSlideScopeStatus([]);
            return;
          }

          const slideCount = records.filter((record) => isSlideRecord(record)).length;
          const appendixCount = records.length - slideCount;
          badge.textContent = `${records.length}개 인식`;
          badge.className = "is-ok";
          list.innerHTML = records.slice(0, 8).map(previewRecordHtml).join("")
            + (records.length > 8 ? `<div class="gen-split-preview-more">외 ${records.length - 8}개 더 인식됨</div>` : "");
          if (slideCount || appendixCount) {
            badge.textContent = `본문 ${slideCount} / 부록 ${appendixCount}`;
          }
          updateSpecialSlideScopeStatus(records);
        } catch (error) {
          badge.textContent = "규칙 오류";
          badge.className = "is-error";
          list.innerHTML = `<div class="gen-split-preview-empty">${escapeHtml(error.message || "구분 규칙을 해석하지 못했습니다.")}</div>`;
          updateSpecialSlideScopeStatus(null);
        }
      }

      function renderBuilderLivePreview() {
        const list = $("genSplitBuilderLivePreview");
        const badge = $("genSplitBuilderLiveBadge");
        if (!list || !badge) return;

        const built = buildSplitRuleFromBuilder();
        const markdown = $("genMdInput").value.trim() || built.sample;
        const maxChars = readMaxChars();

        try {
          const records = parseMarkdown(markdown, maxChars, built.rule);
          if (!records.length) {
            badge.textContent = "0개 인식";
            badge.className = "is-error";
            list.innerHTML = `<div class="gen-split-preview-empty">현재 MD에서 이 규칙과 일치하는 시작점을 찾지 못했습니다.</div>`;
            return;
          }
          badge.textContent = `${records.length}개 인식`;
          badge.className = "is-ok";
          list.innerHTML = records.slice(0, 5).map(previewRecordHtml).join("")
            + (records.length > 5 ? `<div class="gen-split-preview-more">외 ${records.length - 5}개 더 인식됨</div>` : "");
        } catch (error) {
          badge.textContent = "규칙 오류";
          badge.className = "is-error";
          list.innerHTML = `<div class="gen-split-preview-empty">${escapeHtml(error.message || "미리보기를 만들지 못했습니다.")}</div>`;
        }
      }

      function escapeRegex(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }

      function stripRegexCapture(value) {
        return String(value || "")
          .trim()
          .replace(/^\^/, "")
          .replace(/\$$/, "")
          .replace(/^\((.*)\)$/, "$1");
      }

      function looksLikeRegex(value) {
        return /[\\[\]{}()+*?|^$]/.test(String(value || ""));
      }

      function sampleFromRegex(value) {
        return stripRegexCapture(value)
          .replace(/\\d/g, "1")
          .replace(/\[A-Z\]/g, "A")
          .replace(/\[a-z\]/g, "a")
          .replace(/\[A-Za-z\]/g, "A")
          .replace(/\[IVXLCDM\]/g, "IV")
          .replace(/\[가-힣\]/g, "가")
          .replace(/[\\[\]{}()+*?|]/g, "")
          .slice(0, 8) || "X1";
      }

      function inferNumberPatternFromExample(rawValue) {
        const value = String(rawValue || "").trim();
        if (!value) return { pattern: ".+", sample: "X1" };

        if (looksLikeRegex(value)) {
          const pattern = stripRegexCapture(value);
          return { pattern, sample: sampleFromRegex(pattern) };
        }

        const sample = value.split(/[,，]/)[0].trim() || value;
        const tokens = [];
        let index = 0;

        while (index < sample.length) {
          const rest = sample.slice(index);
          const digit = rest.match(/^\d+/);
          const upper = rest.match(/^[A-Z]+/);
          const lower = rest.match(/^[a-z]+/);
          const korean = rest.match(/^[가-힣]+/);

          if (digit) {
            tokens.push(digit[0].length === 1 ? "\\d+" : `\\d{${digit[0].length}}`);
            index += digit[0].length;
          } else if (/^[IVXLCDM]+$/.test(sample)) {
            tokens.push("[IVXLCDM]+");
            index = sample.length;
          } else if (upper) {
            tokens.push(upper[0].length === 1 ? "[A-Z]" : "[A-Z]+");
            index += upper[0].length;
          } else if (lower) {
            tokens.push(lower[0].length === 1 ? "[a-z]" : "[a-z]+");
            index += lower[0].length;
          } else if (korean) {
            tokens.push(korean[0].length === 1 ? "[가-힣]" : "[가-힣]+");
            index += korean[0].length;
          } else {
            tokens.push(escapeRegex(sample[index]));
            index += 1;
          }
        }

        return { pattern: tokens.join(""), sample };
      }

      function numberPatternMeta(kind, customValue = "") {
        if (kind === "digits") {
          return { pattern: "\\d+", sample: "1" };
        }
        if (kind === "digits3") {
          return { pattern: "\\d{3}", sample: "001" };
        }
        if (kind === "letterDigits") {
          return { pattern: "[A-Z]\\d+", sample: "A1" };
        }
        if (kind === "letters") {
          return { pattern: "[A-Z]+", sample: "A" };
        }
        if (kind === "roman") {
          return { pattern: "[IVXLCDM]+", sample: "IV" };
        }
        if (kind === "koreanDigits") {
          return { pattern: "[가-힣]\\d+", sample: "가1" };
        }
        if (kind === "custom") {
          return inferNumberPatternFromExample(customValue);
        }
        return { pattern: "\\d{2}", sample: "01" };
      }

      function buildSplitRuleFromBuilder() {
        const type = $("genSplitBuilderType").value;
        const heading = $("genSplitBuilderHeading").value || "##";
        const prefix = $("genSplitBuilderPrefix").value.trim();
        const numberKind = $("genSplitBuilderNumber").value;
        const customNumber = $("genSplitBuilderNumberCustom").value;
        const separator = $("genSplitBuilderSeparator").value;
        const { pattern: numberPattern, sample: numberSample } = numberPatternMeta(numberKind, customNumber);
        const escapedHeading = escapeRegex(heading);
        const escapedPrefix = prefix ? `${escapeRegex(prefix)}\\s+` : "";
        const separatorPattern = separator
          ? escapeRegex(separator).replace(/\s+/g, "\\s*")
          : "\\s+";
        const rule = `${type}|^${escapedHeading}\\s+${escapedPrefix}(${numberPattern})${separatorPattern}(.+)$`;
        const sample = `${heading} ${prefix ? `${prefix} ` : ""}${numberSample}${separator || " " }제목`.replace(/\s+/g, " ").trim();
        return { type, rule, sample };
      }

      function updateSplitRuleBuilderPreview() {
        const isCustom = $("genSplitBuilderNumber").value === "custom";
        $("genSplitBuilderNumberCustom").disabled = !isCustom;

        const built = buildSplitRuleFromBuilder();
        $("genSplitBuilderPreviewRegex").value = built.rule;
        $("genSplitBuilderPreviewSample").value = built.sample;
        renderBuilderLivePreview();
      }

      function applyNumberExamplePreset(example) {
        $("genSplitBuilderNumber").value = "custom";
        $("genSplitBuilderNumberCustom").disabled = false;
        $("genSplitBuilderNumberCustom").value = example || "";
        updateSplitRuleBuilderPreview();
      }

      function openSplitRulesModal() {
        updateSplitRuleBuilderPreview();
        $("genSplitRulesModal").hidden = false;
        document.body.classList.add("modal-open");
      }

      function closeSplitRulesModal() {
        $("genSplitRulesModal").hidden = true;
        if ($("genConfigModal").hidden) {
          document.body.classList.remove("modal-open");
        }
      }

      function appendRuleToSplitRules(ruleLine, mode = "append") {
        const target = $("genSplitRules");
        const normalizedRule = String(ruleLine || "").trim();
        if (!normalizedRule) return;

        if (mode === "replace") {
          target.value = normalizedRule;
          persistSplitRulesDraft();
          renderSplitRulesPreview();
          return;
        }

        const existing = target.value
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (!existing.includes(normalizedRule)) {
          existing.push(normalizedRule);
        }
        target.value = existing.join("\n");
        persistSplitRulesDraft();
        renderSplitRulesPreview();
      }

      function applyBuiltSplitRule(mode = "append") {
        const built = buildSplitRuleFromBuilder();
        appendRuleToSplitRules(built.rule, mode);
        setMessage(mode === "replace" ? "구분 규칙을 새 규칙으로 덮어썼습니다." : "구분 규칙을 추가했습니다.", false);
      }

      function appendPresetSplitRule(type, pattern) {
        appendRuleToSplitRules(`${type}|${pattern}`, "append");
        setMessage("프리셋 규칙을 추가했습니다.", false);
      }

      function resetSplitRules() {
        $("genSplitRules").value = DEFAULT_SPLIT_RULES;
        persistSplitRulesDraft();
        renderSplitRulesPreview();
        setMessage("슬라이드 구분 규칙을 기본값으로 되돌렸습니다.", false);
      }

      function clearSplitRulesEditor() {
        $("genSplitRules").value = "";
        persistSplitRulesDraft();
        renderSplitRulesPreview();
        setMessage("슬라이드 구분 규칙 입력창을 비웠습니다.", false);
      }

      function readMaxChars(strict = false) {
        const raw = $("genMaxChars").value.trim();
        const value = Number(raw);
        if (!Number.isInteger(value) || value <= 0) {
          return strict ? null : 3600;
        }
        return value;
      }

      function inferPromptLanguage(text) {
        const value = String(text || "");
        const hangulCount = (value.match(/[가-힣]/g) || []).length;
        const latinCount = (value.match(/[A-Za-z]/g) || []).length;
        return hangulCount > 0 && hangulCount * 2 >= latinCount ? "ko" : "en";
      }

      function resolveCommonPromptLanguage(commonPrompt = $("genCommonPrompt").value) {
        const explicit = $("genCommonPrompt").dataset.promptLang;
        return explicit === "ko" || explicit === "en"
          ? explicit
          : inferPromptLanguage(commonPrompt);
      }

      function normalizeCommonUserInput(userInput) {
        if (!userInput || typeof userInput !== "object") {
          return { content: "", designContext: "", exclusions: "" };
        }
        return {
          content: String(userInput.content || ""),
          designContext: String(userInput.designContext || ""),
          exclusions: String(userInput.exclusions || ""),
        };
      }

      function hasSameRecordSource(previous, next) {
        return Boolean(previous && next)
          && String(previous.title || "") === String(next.title || "")
          && String(previous.screenSpec || "") === String(next.screenSpec || "");
      }

      function generate() {
        const commonPrompt = getEffectiveCommonPrompt().trim();
        const markdown = $("genMdInput").value.trim();
        const splitRulesText = $("genSplitRules").value.trim();
        const maxChars = readMaxChars(true);
        const format = $("genFormat").value;

        if (!commonPrompt) return setMessage("사용할 공통 프롬프트 문단을 하나 이상 선택해주세요.");
        if (!markdown) return setMessage("MD 내용을 입력하거나 파일을 불러와주세요.");
        if (!splitRulesText) return setMessage("슬라이드 구분 규칙을 하나 이상 입력해주세요.");
        if (!maxChars) return setMessage("슬라이드별 본문 최대 길이는 1 이상의 정수로 입력해주세요.");

        const existingRecords = new Map();
        if (genState.records && genState.records.length > 0) {
           genState.records.forEach((r) => existingRecords.set(getRecordIdentity(r), r));
        }

        let newRecords;
        try {
          newRecords = parseMarkdown(markdown, maxChars, splitRulesText);
        } catch (error) {
          return setMessage(error.message || "슬라이드 구분 규칙을 해석하지 못했습니다.");
        }
        if (!newRecords.length) return setMessage("슬라이드 heading을 찾지 못했습니다. 예: `## 슬라이드 01. 제목`");

        if (!genState.commonConfig) {
          genState.commonConfig = createBasePromptConfig();
          genState.commonUserInput = normalizeCommonUserInput(null);
        }
        const promptLang = resolveCommonPromptLanguage(commonPrompt);

        const records = newRecords.map(r => {
           const existing = existingRecords.get(getRecordIdentity(r));
           if (existing && String(existing.title || "") === String(r.title || "")) {
              r.promptConfig = existing.promptConfig;
              r.selections = existing.selections || existing.promptConfig?.selections;
           }
           if (!existing) {
             const inferredPageType = inferPageTypeForRecord(r);
             if (inferredPageType !== "body") {
               r.promptConfig = deepClone(genState.commonConfig) || createBasePromptConfig();
               r.promptConfig.pageType = inferredPageType;
               clearDisabledSelections(r.promptConfig);
             }
           }
           if (hasSameRecordSource(existing, r)) {
              r.manualEditedPrompt = existing.manualEditedPrompt;
              r.commonPromptApplied = existing.commonPromptApplied;
            }
           return r;
        });

        records.forEach((record) => {
          record.prompt = record.manualEditedPrompt
            ? record.manualEditedPrompt
            : generateSingleSlidePrompt(record, commonPrompt, promptLang);
        });

        const output = format === "jsonl" ? toJsonl(records) : toMarkdown(records);
        genState.latestOutput = output;
        genState.latestFormat = format;
        genState.records = records;
        genState.currentIndex = 0;
        genState.isEditing = false;

        updateRecordStats(records);
        $("genCharCount").textContent = output.length.toLocaleString("ko-KR");
        renderSlideList();
        selectSlide(0);
        updateResultAnnouncement(records, output.length);
        setMessage(`${records.length}개 프롬프트 생성 완료`, false);
        setMobilePanel("result", true);
      }

      function inferPageTypeForRecord(record) {
        if (!isSlideRecord(record)) return "body";
        const configuredType = String(record?.promptConfig?.pageType || "").trim().toLowerCase();
        if (configuredType === "body" || SPECIAL_PAGE_TYPES.has(configuredType)) return configuredType;
        const title = String(record?.title || "").trim();
        const declaredType = String(record?.screenSpec || "").match(/^\s*[-*+]\s*(?:페이지\s*유형|슬라이드\s*유형|Page\s+Type|Slide\s+Type)\s*[:：]\s*(.+?)\s*$/mi)?.[1] || "";
        if (/본문|body|content/i.test(declaredType)) return "body";
        if (/표지|cover|title\s*slide/i.test(declaredType)) return "cover";
        if (/목차|발표\s*개요|agenda|contents/i.test(declaredType)) return "agenda";
        if (/구분\s*(?:슬라이드|페이지)|간지|section\s*(?:divider|break)/i.test(declaredType)) return "divider";
        if (/맺음말|클로징|질의.?응답|q\s*&\s*a|closing/i.test(declaredType)) return "closing";
        if (/표지|cover|title\s*slide/i.test(title)) return "cover";
        if (/목차|발표\s*개요|agenda|contents/i.test(title)) return "agenda";
        if (/^구분$|구분\s*(?:슬라이드|페이지)|간지|(?:^|[\s·:])파트\s*(?:\d+|[IVX]+)?(?=$|[\s·:])|section\s*(?:divider|break)/im.test(title)) return "divider";
        if (/맺음말|클로징|감사합니다|질의.?응답|q\s*&\s*a|closing/i.test(title)) return "closing";
        return "body";
      }

      function extractPlannerSettingValue(record, labelPattern) {
        const screenSpec = String(record?.screenSpec || "");
        const match = screenSpec.match(new RegExp(`^\\s*(?:[-*+]\\s*)?(?:\\*\\*)?(?:${labelPattern})\\s*[:：](?:\\*\\*)?\\s*(.+?)\\s*$`, "mi"));
        return String(match?.[1] || "").trim();
      }

      function extractInformationDensityCode(record) {
        const value = extractPlannerSettingValue(record, "정보\\s*밀도|content\\s*density");
        return value.match(/\bC([1-4])\b/i)?.[0]?.toUpperCase() || "";
      }

      function extractDataVisualizationCode(record) {
        const value = extractPlannerSettingValue(record, "데이터\\s*시각화\\s*강도|data\\s*visuali[sz]ation\\s*intensity");
        return value.match(/\bV([0-4])\b/i)?.[0]?.toUpperCase() || "";
      }

      function compositionAutonomyKey(value) {
        const source = String(value || "").trim();
        if (/구성\s*(?:고정|잠금)|레이아웃\s*(?:고정|잠금)|composition\s*lock|layout\s*lock|fixed\s*composition/i.test(source)) return "locked";
        if (/읽기\s*(?:방향|순서).*가이드|가이드형|guided|reading\s*(?:flow|direction)|semantic\s*group/i.test(source)) return "guided";
        if (/의미(?:·|\s)*(?:데이터)?만\s*고정|구성\s*위임|AI\s*(?:구성|위임)|meaning\s*(?:only|locked)|composition\s*(?:delegated|open)|open/i.test(source)) return "open";
        if (/^low$/i.test(source)) return "locked";
        if (/^medium$/i.test(source)) return "guided";
        if (/^high$/i.test(source)) return "open";
        return "";
      }

      function commonCompositionAutonomyKey() {
        const value = genState.commonDesignPackage?.settings?.compositionGrammar?.layoutFreedom
          || genState.commonConfig?.composition?.layoutFreedom
          || "high";
        return compositionAutonomyKey(value) || "open";
      }

      function deriveCompositionAutonomy(record) {
        const screenSpec = String(record?.screenSpec || "");
        const skillDirectives = SKILL_PRESET_CONTRACT?.parseSkillDirectives?.(screenSpec) || {};
        const explicitValue = extractPlannerSettingValue(record, "구성\\s*(?:위임\\s*수준|자유도|잠금\\s*수준)|AI\\s*구성\\s*(?:위임|자유도)|composition\\s*(?:autonomy|delegation|lock)|layout\\s*(?:freedom|lock)");
        const explicitKey = skillDirectives.compositionAuthority || compositionAutonomyKey(explicitValue);
        const commonKey = commonCompositionAutonomyKey();
        const diagramPlan = deriveDiagramPlan(screenSpec);
        const generationPlan = deriveGenerationPlan(screenSpec);
        const densityCode = extractInformationDensityCode(record);
        const visualizationCode = extractDataVisualizationCode(record);
        const diagramLevel = Number(diagramPlan.code.slice(1)) || 0;
        let safetyKey = "open";
        let safetyReasonKo = "일반 슬라이드 · 의미와 데이터만 고정";
        let safetyReasonEn = "ordinary slide; meaning and data can be locked while composition remains delegated";

        if (generationPlan.path === "edit_reference") {
          safetyKey = "locked";
          safetyReasonKo = "참조 이미지의 동일성과 구조 보존 필요";
          safetyReasonEn = "reference identity and structure must be preserved";
        } else if (diagramLevel >= 4) {
          safetyKey = "locked";
          safetyReasonKo = `${diagramPlan.code} 과밀 도식의 정확한 토폴로지 보존 필요`;
          safetyReasonEn = `${diagramPlan.code} overcrowded diagram requires exact topology preservation`;
        } else if (visualizationCode === "V4") {
          safetyKey = "locked";
          safetyReasonKo = "V4 원자료 수준의 축·행·열·귀속 보존 필요";
          safetyReasonEn = "V4 source-level axes, rows, columns, and ownership must be preserved";
        } else if (diagramLevel >= 2 || visualizationCode === "V3" || densityCode === "C4" || generationPlan.path === "precision_full_slide") {
          safetyKey = "guided";
          safetyReasonKo = diagramLevel >= 2
            ? `${diagramPlan.code} 관계 의미와 읽기 경로 보존 필요`
            : visualizationCode === "V3"
              ? "V3 데이터 관계와 비교 기준 보존 필요"
              : densityCode === "C4"
                ? "C4 상세 검토 정보의 위계 보존 필요"
                : "정밀 생성 경로의 검증 가능한 읽기 순서 필요";
          safetyReasonEn = diagramLevel >= 2
            ? `${diagramPlan.code} relationship meaning and reading path require guidance`
            : visualizationCode === "V3"
              ? "V3 data relationships and comparison basis require guidance"
              : densityCode === "C4"
                ? "C4 review density requires hierarchy guidance"
                : "the precision route requires a verifiable reading order";
        }

        const resolution = SKILL_PRESET_CONTRACT?.resolveCompositionAuthority?.({
          declaredAuthority: explicitKey || "open",
          safetyFloor: safetyKey,
          presetPreference: commonKey,
        }) || {
          key: [explicitKey || "open", safetyKey].reduce((selected, key) => (
            (COMPOSITION_AUTONOMY_PROFILES[key]?.rank ?? 2) < (COMPOSITION_AUTONOMY_PROFILES[selected]?.rank ?? 2) ? key : selected
          ), "open"),
          source: safetyKey !== "open" ? "safety" : (explicitKey ? "skill" : "default"),
          trace: [],
          presetAffectsAuthority: false,
        };
        const profile = COMPOSITION_AUTONOMY_PROFILES[resolution.key] || COMPOSITION_AUTONOMY_PROFILES.open;
        const commonLabelKo = COMPOSITION_AUTONOMY_PROFILES[commonKey].labelKo;
        const commonLabelEn = COMPOSITION_AUTONOMY_PROFILES[commonKey].labelEn;
        const individualLabelKo = COMPOSITION_AUTONOMY_PROFILES[explicitKey || "open"].labelKo;
        const individualLabelEn = COMPOSITION_AUTONOMY_PROFILES[explicitKey || "open"].labelEn;
        return {
          key: resolution.key,
          labelKo: profile.labelKo,
          labelEn: profile.labelEn,
          shortKo: profile.shortKo,
          className: profile.className,
          commonKey,
          safetyKey,
          explicitKey,
          explicitValue,
          reasonKo: `스킬 지정 ${individualLabelKo} · 안전 하한 ${COMPOSITION_AUTONOMY_PROFILES[safetyKey].labelKo} · 프리셋 선호 ${commonLabelKo}(권한 변경 없음) · ${safetyReasonKo}`,
          reasonEn: `skill declaration: ${individualLabelEn}; safety floor: ${COMPOSITION_AUTONOMY_PROFILES[safetyKey].labelEn}; preset preference: ${commonLabelEn} (does not change authority); ${safetyReasonEn}`,
          densityCode,
          visualizationCode,
          diagramCode: diagramPlan.code,
          source: resolution.source,
          skillDirectives,
          resolutionTrace: resolution.trace || [],
          presetAffectsAuthority: resolution.presetAffectsAuthority === true,
        };
      }

      function extractDeclaredVisualPresenceKey(record) {
        const value = extractPlannerSettingValue(record, "비주얼\\s*존재감|visual\\s*presence");
        if (/강한|주도|strong|focal-led/i.test(value)) return "strong";
        if (/균형|balanced/i.test(value)) return "balanced";
        if (/구조|structure/i.test(value)) return "structured";
        if (/절제|검토|restrained|review-led/i.test(value)) return "restrained";
        return "";
      }

      function countPlannerDisplayItems(record) {
        const screenSpec = String(record?.screenSpec || "");
        const content = plannerSectionText(screenSpec, /^(콘텐츠|본문\s*콘텐츠|본문|content)$/i);
        if (!content) return 0;
        const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const bullets = lines.filter((line) => /^[-*+]\s+/.test(line)).length;
        const tableRows = parsePlannerDataRows(content).length;
        const plainLines = lines.filter((line) => !/^[-*+]\s+/.test(line) && !/^\|.+\|$/.test(line) && !/^#{1,6}\s+/.test(line)).length;
        return bullets + tableRows + plainLines;
      }

      function deriveVisualPresence(record) {
        const pageType = inferPageTypeForRecord(record);
        const densityCode = extractInformationDensityCode(record);
        const dataVisualizationCode = extractDataVisualizationCode(record);
        const contentItems = countPlannerDisplayItems(record);
        const declaredKey = extractDeclaredVisualPresenceKey(record);
        let key = declaredKey;
        let source = declaredKey ? "declared" : "derived";

        if (!key && !isSlideRecord(record)) key = "restrained";
        if (!key && ["cover", "divider", "closing"].includes(pageType)) key = "strong";
        if (!key && pageType === "agenda") key = "balanced";
        if (!key) {
          key = ({ C1: "strong", C2: "balanced", C3: "structured", C4: "restrained" })[densityCode] || "";
        }
        if (!key) {
          source = contentItems ? "content-count" : "default";
          key = contentItems <= 0
            ? "balanced"
            : contentItems <= 2
              ? "strong"
              : contentItems <= 5
                ? "balanced"
                : contentItems <= 8
                  ? "structured"
                  : "restrained";
        }

        const profile = VISUAL_PRESENCE_PROFILES[key] || VISUAL_PRESENCE_PROFILES.balanced;
        return {
          key,
          labelKo: profile.labelKo,
          labelEn: profile.labelEn,
          shortKo: profile.shortKo,
          className: profile.className,
          densityCode,
          dataVisualizationCode,
          contentItems,
          source,
        };
      }

      function usesIndividualSpecialSlideDesign(record) {
        const settings = normalizeSpecialSlideScope(genState.specialSlideScope);
        return settings.individualDesign && isSpecialSlideRecord(record);
      }

      function isSpecialSlideRecord(record) {
        return SPECIAL_PAGE_TYPES.has(inferPageTypeForRecord(record));
      }

      function splitRuntimeDeckContext(block) {
        const source = String(block || "").trim();
        if (!source) return { context: "", spec: "" };
        const lines = source.split(/\r?\n/);
        const start = lines.findIndex((line) => /^###\s+(?:발표\s*맥락\s*및\s*세션\s*위치|Presentation\s+Context\s+and\s+Session)/i.test(line));
        if (start < 0) return { context: "", spec: source };
        let end = lines.length;
        for (let index = start + 1; index < lines.length; index += 1) {
          if (/^###\s+/.test(lines[index])) {
            end = index;
            break;
          }
        }
        const context = lines.slice(start, end).join("\n").trim();
        const spec = [...lines.slice(0, start), ...lines.slice(end)].join("\n").replace(/\n{3,}/g, "\n\n").trim();
        return { context, spec };
      }

      function generateSingleSlidePrompt(record, commonPrompt, promptLang = resolveCommonPromptLanguage(commonPrompt)) {
        const promptDeck = window.PromptDeck;
        const recordConfig = normalizePromptConfig(record);
        const specialPage = isSpecialSlideRecord(record);
        const individualSpecialDesign = usesIndividualSpecialSlideDesign(record);
        const commonPromptContractVersion = String(genState.commonPromptPackageMeta?.designContractVersion || genState.commonPromptPackageMeta?.contractVersion || "");
        const usesFiveStageVisualSpecification = /^4(?:\.|$)/.test(commonPromptContractVersion);
        record.commonPromptApplied = !individualSpecialDesign;
        let renderedCommonPrompt = commonPrompt;

        if (!individualSpecialDesign && !usesFiveStageVisualSpecification && recordConfig && hasSlideSpecificConfig(record) && typeof promptDeck?.buildPromptFromConfig === "function") {
          try {
            renderedCommonPrompt = promptDeck.buildPromptFromConfig(
              recordConfig,
              normalizeCommonUserInput(genState.commonUserInput),
              promptLang
            ) || commonPrompt;
          } catch (error) {
            console.warn("개별 슬라이드 프롬프트 재생성에 실패해 공통 프롬프트를 사용합니다.", error);
          }
        }

        let normalizedCommonPrompt = "";
        if (!individualSpecialDesign) {
          if (usesFiveStageVisualSpecification) {
            const visualSpecificationTitle = "SLIDE IMAGE VISUAL SPECIFICATION";
            const hasVisualSpecificationRoot = /^##\s+SLIDE IMAGE VISUAL SPECIFICATION\b/m.test(renderedCommonPrompt);
            const normalizedVisualSpecification = normalizeMarkdownRootHeading(
              renderedCommonPrompt,
              hasVisualSpecificationRoot ? 2 : 3
            );
            normalizedCommonPrompt = removeStandaloneHorizontalRules(hasVisualSpecificationRoot
              ? normalizedVisualSpecification
              : `## ${visualSpecificationTitle}\n\n${normalizedVisualSpecification}`);
          } else {
            normalizedCommonPrompt = removeStandaloneHorizontalRules(normalizeMarkdownRootHeading(
              renderedCommonPrompt,
              2,
              promptLang === "en" ? "COMMON DESIGN SYSTEM" : "공통 디자인 시스템"
            ));
          }
        }
        let slideSpecWithContext = specialPage
          ? stripSpecialSlideFrameMetadata(record.screenSpec, promptLang)
          : record.screenSpec;
        const runtimeContext = splitRuntimeDeckContext(slideSpecWithContext);
        let slideSpec = runtimeContext.spec;
        const diagramPlan = deriveDiagramPlan(slideSpec);
        const structuredDiagram = diagramPlan.semanticRequired && Number(diagramPlan.code.slice(1)) >= 2;
        if (structuredDiagram) {
          slideSpec = compactDiagramScreenSpec(slideSpec, 3200, {
            omitGlobalContext: false,
          });
        }
        const normalizedRuntimeContext = runtimeContext.context
          ? removeStandaloneHorizontalRules(normalizeMarkdownRootHeading(runtimeContext.context, 2))
          : "";
        const normalizedSlideSpecBody = removeStandaloneHorizontalRules(normalizeMarkdownRootHeading(slideSpec, 3));
        const normalizedSlideSpec = `${promptLang === "en" ? "## INDIVIDUAL SLIDE SEMANTIC BRIEF" : "## 개별 슬라이드 의미 브리프"}\n\n${normalizedSlideSpecBody}`.trim();
        const promptRecord = { ...record, screenSpec: slideSpec };
        const compositionAutonomy = deriveCompositionAutonomy(promptRecord);
        record.compositionAutonomy = compositionAutonomy;
        const specialSlideScopeDirective = buildSpecialSlideScopeDirective(record, promptLang);
        const specialSlideIdentityBridge = buildSpecialSlideIdentityBridge(record, promptLang);
        const specialSlideImplementationDirective = buildSpecialSlideImplementationDirective(record, promptLang);
        const plannerContractDirective = buildPlannerContractDirective(promptRecord, promptLang, specialPage, structuredDiagram, compositionAutonomy);
        const visualPresenceDirective = buildVisualPresenceDirective(promptRecord, promptLang);
        const generationPathDirective = buildGenerationPathDirective(promptRecord, promptLang);
        const diagramIntegrityDirective = buildDiagramIntegrityDirective(promptRecord, promptLang, compositionAutonomy);
        const skillPresetResolutionDirective = buildSkillPresetResolutionDirective(promptRecord, promptLang, compositionAutonomy);
        const visualDirectorDirective = buildVisualDirectorDirective(promptRecord, promptLang, individualSpecialDesign, compositionAutonomy);
        const parts = [
          ...buildFinalExecutionHeader(promptLang, specialPage),
          ...(normalizedRuntimeContext ? ["", normalizedRuntimeContext] : []),
          ...(normalizedCommonPrompt ? ["", normalizedCommonPrompt] : []),
          ...(specialSlideScopeDirective ? ["", specialSlideScopeDirective] : []),
          ...(specialSlideIdentityBridge ? ["", specialSlideIdentityBridge] : []),
          ...(specialSlideImplementationDirective ? ["", specialSlideImplementationDirective] : []),
          "",
          normalizedSlideSpec,
          ...(skillPresetResolutionDirective ? ["", skillPresetResolutionDirective] : []),
          ...(visualDirectorDirective ? ["", visualDirectorDirective] : []),
          ...(visualPresenceDirective ? ["", visualPresenceDirective] : []),
          ...(generationPathDirective ? ["", generationPathDirective] : []),
          ...(plannerContractDirective ? ["", plannerContractDirective] : []),
          ...(diagramIntegrityDirective ? ["", diagramIntegrityDirective] : []),
        ];

        return parts.join("\n");
      }

      function buildVisualPresenceDirective(record, lang) {
        if (!isSlideRecord(record)) return "";
        const presence = deriveVisualPresence(record);
        const sourceKo = presence.densityCode
          ? `정보 밀도 ${presence.densityCode}`
          : presence.contentItems
            ? `표시 콘텐츠 ${presence.contentItems}개 수준`
            : "페이지 역할";
        const sourceEn = presence.densityCode
          ? `content density ${presence.densityCode}`
          : presence.contentItems
            ? `approximately ${presence.contentItems} display items`
            : "the page role";
        const instructionsKo = {
          strong: "표시 요소 수를 늘리지 않고 의미 있는 핵심 비주얼·빅 타이포·공간 제스처 중 하나를 지배적 초점으로 키운다. 스케일·깊이·국부 대비·전경 레이어를 강화하고 넓은 여백을 초점 보호와 분위기 형성에 사용한다.",
          balanced: "주 초점 하나가 근거보다 먼저 읽히게 하고, 보조 근거는 가까운 한 그룹으로 정리한다. 초점의 스케일 우위와 충분한 여백을 유지한다.",
          structured: "관계·비교·단계 구조가 주 비주얼이 되게 하고 깊이와 장식은 탐색을 돕는 보조 역할로 제한한다.",
          restrained: "정확한 값·표·차트와 탐색 순서를 우선하고, 비주얼은 구조·구분·가독성을 지원하는 절제된 역할로 사용한다.",
        };
        const instructionsEn = {
          strong: "Do not add more objects. Make one meaningful hero visual, typographic statement, or spatial gesture the dominant focal anchor. Increase its scale, depth, local contrast, and foreground presence; use broad whitespace to protect focus and build atmosphere.",
          balanced: "Let one focal anchor read before the evidence, group supporting points closely, and preserve clear scale dominance with sufficient whitespace.",
          structured: "Make the relationship, comparison, or sequence structure the main visual; keep depth and decoration subordinate to navigation.",
          restrained: "Prioritize exact figures, tables, charts, and scan order; use visuals with restraint to support structure, separation, and legibility.",
        };
        const v0Ko = presence.dataVisualizationCode === "V0"
          ? "V0는 비주얼 약화가 아니라 비데이터 비주얼 주도형이다."
          : "";
        const v0En = presence.dataVisualizationCode === "V0"
          ? "V0 means non-data visual-led, not visually weak."
          : "";

        if (lang === "en") {
          return `## CONTENT DENSITY → VISUAL PRESENCE 〔NON-DISPLAY〕
- Derived from ${sourceEn}: ${presence.labelEn}.
- ${instructionsEn[presence.key]}
${v0En ? `- ${v0En}` : "- Increase visual strength through focal dominance, not decorative object count."}`;
        }
        return `## 정보 밀도 → 비주얼 존재감 〔화면 비표시〕
- 자동 파생: ${sourceKo} → ${presence.labelKo}.
- ${instructionsKo[presence.key]}
${v0Ko ? `- ${v0Ko}` : "- 비주얼 강도는 장식 개체 수가 아니라 핵심 초점의 존재감으로 조절한다."}`;
      }

      function buildSpecialSlideScopeDirective(record, lang) {
        if (!usesIndividualSpecialSlideDesign(record)) return "";
        const pageType = inferPageTypeForRecord(record);
        const label = lang === "en"
          ? (SPECIAL_PAGE_TYPE_LABELS_EN[pageType] || "special slide")
          : (SPECIAL_PAGE_TYPE_LABELS[pageType] || "특수 슬라이드");
        if (lang === "en") {
          return `## SPECIAL-SLIDE DESIGN SCOPE 〔NON-DISPLAY〕
- Page role: ${label}.
- Treat the Individual Slide Specification as the sole source for visible content, semantic relationships, page purpose, and any explicitly locked macro composition.
- Do not combine the full deck-wide prompt with this page. Selectively inherit only the compatible visual DNA, typography, form, surface, image treatment, and motif behavior declared by the compact identity bridge.
- When the inherited preset conflicts with the skill specification, preserve the skill-owned meaning and structure and adapt the preset treatment rather than changing content.`;
        }
        return `## 특수 슬라이드 디자인 적용 범위 〔화면 비표시〕
- 페이지 역할: ${label}.
- 아래 개별 슬라이드 명세를 표시 콘텐츠·의미 관계·페이지 목적과 명시적으로 잠근 큰 구성의 유일한 출처로 사용한다.
- 덱 공통 프롬프트 전체는 이 페이지와 결합하지 않는다. 압축 정체성 브리지의 호환 가능한 시각 DNA·타이포·형태·표면·이미지 처리·모티프 행동만 선택적으로 상속한다.
- 상속한 프리셋이 스킬 명세와 충돌하면 콘텐츠를 바꾸지 말고 스킬의 의미와 구조를 보존한 채 프리셋 표현을 조정한다.`;
      }

      function currentSkillPresetContract() {
        const contract = genState.commonDesignPackage?.settings?.skillPresetContract;
        return contract && typeof contract === "object" ? contract : null;
      }

      function buildSkillPresetResolutionDirective(record, lang, autonomy = deriveCompositionAutonomy(record)) {
        const contract = currentSkillPresetContract();
        const preset = contract?.preset;
        if (!preset) return "";
        const pageType = inferPageTypeForRecord(record);
        const specialPage = SPECIAL_PAGE_TYPES.has(pageType);
        const roleVariant = specialPage ? preset.roleVariants?.[pageType] : null;
        const requiredTraits = Array.isArray(preset.requiredTraits) ? preset.requiredTraits.filter(Boolean) : [];
        const forbiddenTraits = Array.isArray(preset.forbiddenTraits) ? preset.forbiddenTraits.filter(Boolean) : [];
        const minimumRequiredTraits = Math.min(
          requiredTraits.length,
          Math.max(0, Number(preset.minimumRequiredTraits) || 0)
        );
        const authorityKo = contract.compositionAuthority?.[autonomy.key]
          || "스킬의 의미와 구조를 먼저 보존하고 남은 범위에서 프리셋 시각 문법을 적용한다.";
        const authorityEn = {
          open: "Preserve the skill-owned meaning, wording, figures, and relationships; strongly apply the preset's composition family, medium, illustration style, and image treatment.",
          guided: "Preserve the skill-owned semantic groups, adjacency, and primary reading direction; apply a compatible preset layout family and visual treatment.",
          locked: "Preserve the skill-owned macro composition and relationship topology; apply the preset through typography, form, line, material, surface, image treatment, and finish.",
        }[autonomy.key];
        const skillDirectives = autonomy.skillDirectives || SKILL_PRESET_CONTRACT?.parseSkillDirectives?.(record?.screenSpec) || {};
        const lockItems = Array.isArray(skillDirectives.locks) ? skillDirectives.locks : [];
        const guideItems = Array.isArray(skillDirectives.guides) ? skillDirectives.guides : [];
        const freeItems = Array.isArray(skillDirectives.free) ? skillDirectives.free : [];
        const presetScope = Array.isArray(skillDirectives.presetScope) ? skillDirectives.presetScope : [];
        const resolutionTrace = Array.isArray(autonomy.resolutionTrace) ? autonomy.resolutionTrace.join(" → ") : "";
        const roleLabelKo = SPECIAL_PAGE_TYPE_LABELS[pageType] || "본문";
        const roleLabelEn = SPECIAL_PAGE_TYPE_LABELS_EN[pageType] || "body";

        if (lang === "en") {
          return `## SKILL–PRESET VISUAL CONTRACT 〔NON-DISPLAY〕
- Priority: exact user content and assets → skill-owned meaning, evidence, relationships, and composition locks → readability and data integrity → required preset visual DNA → local image-model optimization.
- Composition authority: ${autonomy.labelEn}. ${authorityEn}
- Skill locks: ${lockItems.length ? lockItems.join("; ") : "exact visible content, facts, figures, evidence status, and semantic relationships"}.
- Skill guidance: ${guideItems.length ? guideItems.join("; ") : "reading priority and focal hierarchy"}.
- Free range: ${freeItems.length ? freeItems.join("; ") : "compatible visual treatment inside the resolved authority"}.
- Lock reason: ${skillDirectives.lockReason || "none beyond the declared semantic and data constraints"}.
- Preset scope: ${presetScope.length ? presetScope.join("; ") : "compatible non-color visual traits only"}. Preset preference never reduces skill-declared autonomy.
${resolutionTrace ? `- Resolution trace: ${resolutionTrace}.` : ""}
- Preset: ${preset.nameEn || preset.nameKo || preset.id}. Do not reduce this preset to a palette swap; preserve a recognizable difference in form, spatial silhouette, medium, typography behavior, surface, or image treatment.
${roleVariant ? `- ${roleLabelEn} role variant: ${roleVariant.presetRole || "adapt the deck identity to this page role"}; motif phase: ${roleVariant.motifPhase || "adapt"}.` : "- Body role: let the skill own information meaning and let the preset own the compatible visual grammar."}
${minimumRequiredTraits ? `- Required signature: express at least ${minimumRequiredTraits} compatible signature traits from the preset contract. If one conflicts with the skill, replace it with another compatible signature instead of dropping the visual identity.` : "- Required signature: preserve the preset's recognizable non-color visual identity."}
${forbiddenTraits.length ? `- Avoid the preset's forbidden patterns: ${forbiddenTraits.join("; ")}.` : "- Avoid generic equal-card repetition when it is not required by the skill-owned information structure."}
- Never change, infer, omit, or reorder skill-owned content and semantic relationships merely to satisfy the preset.`;
        }

        return `## 스킬–프리셋 시각 계약 〔화면 비표시〕
- 우선순위: 사용자 원문·실제 자산 → 스킬의 의미·증거·관계·구성 잠금 → 가독성·데이터 정직성 → 프리셋 필수 시각 DNA → 이미지 AI의 세부 최적화.
- 구성 권한: ${autonomy.labelKo}. ${authorityKo}
- 스킬 잠금: ${lockItems.length ? lockItems.join("·") : "표시 문구·사실·수치·증거 지위·의미 관계"}.
- 스킬 가이드: ${guideItems.length ? guideItems.join("·") : "읽기 우선순위·핵심 강조 위계"}.
- 자유 범위: ${freeItems.length ? freeItems.join("·") : "해석된 구성 권한 안의 호환 시각 처리"}.
- 잠금 이유: ${skillDirectives.lockReason || "선언된 의미·데이터 제약 외 추가 잠금 없음"}.
- 프리셋 적용 범위: ${presetScope.length ? presetScope.join("·") : "호환되는 비색상 시각 특성"}. 프리셋 선호는 스킬이 선언한 구성 권한을 축소하지 않는다.
${resolutionTrace ? `- 해석 추적: ${resolutionTrace}.` : ""}
- 프리셋: ${preset.nameKo || preset.nameEn || preset.id}. 색상만 바꾼 결과로 축소하지 않고 형태·공간 실루엣·매체·타이포 행동·표면·이미지 처리 중 호환되는 비색상 차이를 분명히 유지한다.
${roleVariant ? `- ${roleLabelKo} 역할 변형: ${roleVariant.presetRole || "이 페이지 역할에 맞게 덱 정체성을 변환"}; 모티프 단계=${roleVariant.motifPhase || "adapt"}${Array.isArray(roleVariant.requiredBehaviors) && roleVariant.requiredBehaviors.length ? `; 필수 행동=${roleVariant.requiredBehaviors.join("·")}` : ""}.` : "- 본문 역할: 스킬은 정보의 의미를 소유하고 프리셋은 호환되는 시각 문법을 소유한다."}
${minimumRequiredTraits ? `- 필수 시그니처: ${requiredTraits.join("·")} 중 스킬과 충돌하지 않는 ${minimumRequiredTraits}개 이상을 표현한다. 하나가 충돌하면 시각 정체성 전체를 포기하지 말고 다른 호환 시그니처로 대체한다.` : "- 필수 시그니처: 프리셋의 색상 외 시각 정체성을 식별 가능하게 유지한다."}
${forbiddenTraits.length ? `- 금지 패턴: ${forbiddenTraits.join("·")}.` : "- 금지 패턴: 스킬의 정보 구조가 요구하지 않는 동일 카드 반복을 피한다."}
- 프리셋을 만족시키기 위해 스킬이 소유한 콘텐츠·사실·수치·증거 지위·의미 관계를 변경·추론·누락·재정렬하지 않는다.`;
      }

      function buildSpecialSlideIdentityBridge(record, lang) {
        if (!usesIndividualSpecialSlideDesign(record)) return "";
        const settings = genState.commonDesignPackage?.settings || {};
        const contract = currentSkillPresetContract();
        const preset = contract?.preset || settings.galleryStyle || {};
        const pageType = inferPageTypeForRecord(record);
        const roleVariant = preset.roleVariants?.[pageType];
        const colors = settings.colors || genState.commonConfig?.colorSystem || {};
        const typography = settings.typography || {};
        const grammar = preset.compositionGrammar || settings.compositionGrammar || {};
        const paletteName = lang === "en"
          ? (colors.paletteNameEn || colors.paletteNameKo || "deck palette")
          : (colors.paletteNameKo || colors.paletteNameEn || "덱 팔레트");
        const colorTokens = [
          colors.primary ? `P ${colors.primary}` : "",
          colors.secondary ? `S ${colors.secondary}` : "",
          colors.accent ? `A ${colors.accent}` : "",
          colors.background ? `BG ${colors.background}` : "",
          colors.surface ? `Surface ${colors.surface}` : "",
          colors.textPrimary || colors.text ? `Text ${colors.textPrimary || colors.text}` : "",
        ].filter(Boolean).join(" · ");
        const typeTokens = [typography.family || typography.fontName, typography.voice, typography.hierarchyStyle, typography.headlineCharacter, typography.rhythm].filter(Boolean).join(" · ");
        const grammarTokens = [grammar.formLanguage, grammar.lineLanguage, grammar.surfaceLanguage, grammar.spatialRhythm, grammar.primaryVisualLanguage, grammar.secondaryVisualLanguage].filter(Boolean).join(" · ");
        const requiredTraits = Array.isArray(preset.requiredTraits) ? preset.requiredTraits.filter(Boolean) : [];
        const forbiddenTraits = Array.isArray(preset.forbiddenTraits) ? preset.forbiddenTraits.filter(Boolean) : [];
        const minimumRequiredTraits = Math.min(requiredTraits.length, Math.max(0, Number(preset.minimumRequiredTraits) || 0));
        if (lang === "en") {
          return `## COMPACT DECK-IDENTITY BRIDGE 〔NON-DISPLAY〕
- Keep these identity anchors while letting the Individual Slide Specification own the page concept and macro composition.
- Preset identity: ${preset.nameEn || preset.nameKo || preset.id || "the selected deck style"}${roleVariant ? `; adapt it for the ${SPECIAL_PAGE_TYPE_LABELS_EN[pageType] || pageType} role through the ${roleVariant.motifPhase || "adaptive"} motif phase` : ""}.
- Palette: ${paletteName}${colorTokens ? ` — ${colorTokens}` : ""}. Use coordinated but distinct surfaces for the full canvas and focal zones; preserve natural material and photographic color.
- Typography and form: ${typeTokens || "the common deck typography hierarchy"}${grammarTokens ? `; ${grammarTokens}` : ""}.
- Visual signature: ${minimumRequiredTraits ? `express at least ${minimumRequiredTraits} compatible non-color traits from the preset contract` : "preserve recognizable non-color form, medium, surface, or image treatment"}${forbiddenTraits.length ? `; avoid ${forbiddenTraits.join("; ")}` : ""}.
- Full-canvas continuity: preserve the palette, typography, form language, and spatial rhythm without importing recurring header or footer bands.`;
        }
        return `## 압축 덱 정체성 브리지 〔화면 비표시〕
- 개별 슬라이드 명세가 페이지 콘셉트와 큰 구성을 맡고, 다음 정체성 앵커만 덱 전체와 이어서 사용한다.
- 프리셋 정체성: ${preset.nameKo || preset.nameEn || preset.id || "선택한 덱 스타일"}${roleVariant ? `; ${SPECIAL_PAGE_TYPE_LABELS[pageType] || pageType} 역할에서는 모티프를 ${roleVariant.motifPhase || "adapt"} 단계로 변환` : ""}.
- 팔레트: ${paletteName}${colorTokens ? ` — ${colorTokens}` : ""}. 전체 캔버스와 핵심 정보면에는 서로 구분되는 조화 표면을 사용하고 재료·사진의 고유색을 보존한다.
- 타이포·형태: ${typeTokens || "공통 덱의 타이포 위계"}${grammarTokens ? `; ${grammarTokens}` : ""}.
- 시각 시그니처: ${minimumRequiredTraits ? `프리셋 계약의 색상 외 특성 중 스킬과 충돌하지 않는 ${minimumRequiredTraits}개 이상을 표현` : "색상 외 형태·매체·표면·이미지 처리의 식별 가능성을 유지"}${forbiddenTraits.length ? `; ${forbiddenTraits.join("·")}은 피함` : ""}.
- 전체 캔버스 연속성: 반복 헤더·푸터 밴드를 가져오지 않고 팔레트·타이포·형태 문법·공간 리듬만 덱과 이어서 사용한다.`;
      }

      function buildSpecialSlideImplementationDirective(record, lang) {
        if (!isSpecialSlideRecord(record)) return "";
        const pageType = inferPageTypeForRecord(record);
        const agendaPlan = pageType === "agenda" ? inferPlannerAgendaStructure(record?.screenSpec || "") : null;
        const rulesKo = {
          cover: [
            "표시값은 콘텐츠에 있는 제목·부제·제공된 기관·발표자·일자만 사용하고 생략된 선택값은 만들지 않는다.",
            "인지 과업은 발표 범위와 약속의 첫인상 형성이다.",
            "제목과 하나의 키 비주얼이 긴장 관계를 이루는 히어로 구도, 전경·중경·배경의 의미 레이어, 표지 모티프를 사용한다.",
          ],
          agenda: [
            "표시값은 콘텐츠에 확정된 세션명·순서·짧은 역할만 사용한다.",
            "인지 과업은 범위·위계·시간·담당·현재 위치·전개 관계 중 명세가 우선한 정보를 빠르게 파악하는 것이다.",
            `권장 개요 구조는 ${agendaPlan?.structure || "관계 적합형 개요"}: ${agendaPlan?.composition || "항목 관계에 맞는 구조를 선택"}. 연결선은 실제 순차·의존 관계만 설명한다.`,
          ],
          divider: [
            "표시값은 콘텐츠에 있는 파트명과 전환 메시지만 사용한다.",
            "인지 과업은 앞 세션 결론을 닫고 새 세션 질문으로 이동하는 것이다.",
            "하나의 전환 동사를 단일 공간 제스처로 번역하고 넓은 여백과 다음 장을 향한 시선 출구를 만든다.",
          ],
          closing: [
            "표시값은 콘텐츠에 있는 결론·기억점·요청 또는 Q&A 안내만 사용한다.",
            "인지 과업은 핵심 기억을 최종 판단 또는 다음 행동으로 수렴하는 것이다.",
            "기억점을 하나의 논리적 종착점으로 모으고 표지 모티프를 더 단순하고 완결된 형태로 회수한다.",
          ],
        };
        const rulesEn = {
          cover: [
            "Render only the title, subtitle, and supplied organization, presenter, or date values found under Content; do not invent omitted optional values.",
            "The cognitive task is to establish the deck's scope and promise at first glance.",
            "Use one hero motif in tension with the title, meaningful foreground–midground–background layers, and a motif that can return at closing.",
          ],
          agenda: [
            "Render only the confirmed session names, order, and short roles found under Content.",
            "The cognitive task is fast orientation to the priority defined by the specification: scope, hierarchy, schedule, ownership, current position, or a genuine sequence.",
            "Use the overview structure selected in the specification; if it is absent, choose the structure that best matches the real relationship. Use connectors only for genuine sequence or dependency.",
          ],
          divider: [
            "Render only the part name and transition message found under Content.",
            "The cognitive task is to close the prior section's conclusion and move to the next section's question.",
            "Translate one transition verb into a single spatial gesture with intentional whitespace and a clear visual exit toward the next slide.",
          ],
          closing: [
            "Render only the conclusion, memory points, request, or Q&A cue found under Content.",
            "The cognitive task is to converge the deck's key memories into a final judgment or next action.",
            "Converge the memory points into one logical endpoint and recall the cover motif in a simpler, resolved form.",
          ],
        };
        const rules = (lang === "en" ? rulesEn : rulesKo)[pageType];
        if (!rules) return "";
        const heading = lang === "en"
          ? "## SPECIAL-SLIDE IMPLEMENTATION CONTRACT 〔NON-DISPLAY〕"
          : "## 특수 슬라이드 구현 계약 〔화면 비표시〕";
        return `${heading}\n${rules.map((rule) => `- ${rule}`).join("\n")}`;
      }

      function buildGenerationPathDirective(record, lang) {
        if (!isSlideRecord(record)) return "";
        const plan = deriveGenerationPlan(record.screenSpec);
        if (lang === "en") {
          if (["precision_full_slide", "background_then_composite"].includes(plan.path)) {
            return `## GENERATION PATH 〔NON-DISPLAY〕
- Route: ${plan.labelEn}; reason: ${plan.reasonEn}.
- Generate one complete finished slide image containing the exact titles, labels, figures, charts, sources, and enabled page metadata in a single render.
- Verify all locked strings, data ownership, diagram relationships, and reading order before rendering. If space is tight, reduce decorative imagery and depth before reducing or altering meaning.`;
          }
          if (plan.path === "edit_reference") {
            return `## GENERATION PATH 〔NON-DISPLAY〕
- Route: ${plan.labelEn}; reason: ${plan.reasonEn}. Preserve the supplied reference identity and structure before stylistic variation.`;
          }
          return `## GENERATION PATH 〔NON-DISPLAY〕
- Route: ${plan.labelEn}; reason: ${plan.reasonEn}. Render the complete slide while preserving every exact display string and figure.`;
        }
        if (["precision_full_slide", "background_then_composite"].includes(plan.path)) {
          return `## 생성 경로 〔화면 비표시〕
- 경로: ${plan.labelKo}; 이유: ${plan.reasonKo}.
- 제목·라벨·수치·차트·출처·활성 페이지 메타데이터를 한 번에 포함한 완성 슬라이드 이미지 한 장을 생성한다.
- 렌더링 전 고정 문자열·수치 귀속·도식 관계·읽기 순서를 내부 점검한다. 공간이 부족하면 의미를 줄이거나 바꾸기 전에 장식 이미지·깊이·부가 효과를 먼저 줄인다.`;
        }
        if (plan.path === "edit_reference") {
          return `## 생성 경로 〔화면 비표시〕
- 경로: ${plan.labelKo}; 이유: ${plan.reasonKo}. 표현 변주보다 제공된 참조의 동일성과 구조 보존을 우선한다.`;
        }
        return `## 생성 경로 〔화면 비표시〕
- 경로: ${plan.labelKo}; 이유: ${plan.reasonKo}. 모든 표시 문구와 수치를 정확히 보존한 완성 슬라이드 한 장을 렌더링한다.`;
      }

      function buildDiagramIntegrityDirective(record, lang, autonomy = deriveCompositionAutonomy(record)) {
        if (!isSlideRecord(record)) return "";
        const plan = deriveDiagramPlan(record.screenSpec);
        if (plan.code === "D0" || !plan.semanticRequired) return "";
        const relationship = plan.relationship || (lang === "en"
          ? "Use only the relationships declared by the individual specification."
          : "개별 명세가 선언한 관계만 사용");
        const integrity = plan.integrity || (lang === "en"
          ? "Preserve every declared node and connection exactly once; add no new node, edge, loop, direction, or causal claim."
          : "선언된 노드와 연결을 각각 정확히 한 번 보존하고 임의 노드·연결·순환·방향·인과를 추가하지 않음");
        const geometryGuideEn = autonomy.key === "locked"
          ? "Composition is locked: preserve declared group placement, macro geometry, and connection corridors while refining local routing."
          : autonomy.key === "guided"
            ? "Composition is guided: preserve semantic groups and the primary reading direction, but freely redesign node shapes, spatial arrangement, orientation, connector routing, layers, and medium."
            : "Composition is delegated: preserve semantic topology only; freely redesign node shapes, grouping surfaces, spatial arrangement, orientation, connector routing, layers, and medium.";
        const geometryGuideKo = autonomy.key === "locked"
          ? "구성 고정: 선언된 그룹 배치·큰 구도·연결 통로를 보존하고 국부 라우팅만 정교화한다."
          : autonomy.key === "guided"
            ? "읽기 방향 가이드: 의미 그룹과 주 읽기 방향은 보존하되 노드 형태·공간 배치·방향·연결선 경로·레이어·매체는 자유롭게 재설계한다."
            : "의미만 고정: 의미 토폴로지만 보존하고 노드 형태·그룹 표면·공간 배치·방향·연결선 경로·레이어·매체는 자유롭게 재설계한다.";
        const detailLines = lang === "en"
          ? [
            plan.labelScope ? `- Relationship-label scope: ${plan.labelScope}` : "",
            plan.allowedConnections ? `- Allowed connections: ${plan.allowedConnections}` : "",
            plan.forbiddenConnections ? `- Forbidden connections: ${plan.forbiddenConnections}` : "",
            plan.arrowheadPolicy ? `- Arrowhead rule: ${plan.arrowheadPolicy}` : "",
          ].filter(Boolean)
          : [
            plan.labelScope ? `- 관계 레이블 범위: ${plan.labelScope}` : "",
            plan.allowedConnections ? `- 허용 연결: ${plan.allowedConnections}` : "",
            plan.forbiddenConnections ? `- 금지 연결: ${plan.forbiddenConnections}` : "",
            plan.arrowheadPolicy ? `- 화살촉 규칙: ${plan.arrowheadPolicy}` : "",
          ].filter(Boolean);
        if (plan.relationship && plan.integrity) {
          if (lang === "en") {
            return `## DIAGRAM MEANING & INTEGRITY CONTRACT 〔NON-DISPLAY〕
- Diagram load: ${plan.code} ${plan.type || plan.labelEn}.
- Meaning ledger: Treat Diagram Core Judgment, Node Roles, Relationship Actions, Argument Path, Decision Takeaway, and Evidence Status in the Individual Slide Specification as one authoritative argument. Topology is only the visual carrier of that argument.
- Semantic gate: every meaningful node must read as name plus role; every declared connection must be speakable as source + visible relationship action + target; the headline, primary path, and decision endpoint must resolve to the same audience judgment without upgrading evidence status.
- Reject a structurally correct but semantically vague result. In a three-second say-back, the viewer must recover the starting roles, relationship actions, result, and decision takeaway; abstract labels such as ecosystem, linkage, operating structure, or shared outcome cannot substitute for them.
- Reference-key lock: Node 01, N01, EDGE-01, and similar IDs are invisible authoring keys. Never render the key, its number, parentheses, or an ID legend; render only the declared user-facing label, role phrase, and relationship action.
- Treat Relationship Structure, Relationship-label Scope, Structure Integrity, Allowed Connections, Forbidden Connections, Arrowhead Rule, and Data Ownership as the authoritative semantic ledger. Do not paraphrase or extend it. ${geometryGuideEn}
- Before rendering, count nodes, connectors, arrowheads, groups, branches, merges, and loops against that ledger. Use arrowheads only for declared direction, undirected lines for coordination, and shared surfaces for membership or common foundations.
- Keep labels inside their correct nodes, preserve one primary reading path, and add no undeclared connection, direction, loop, causal claim, or label scope.`;
          }
          return `## 다이어그램 의미·무결성 계약 〔화면 비표시〕
- 도식 부담: ${plan.code} ${plan.type || plan.labelKo}.
- 의미 정답: 개별 명세의 도식 핵심 판단·노드 역할·관계 동사·논증 경로·결론 귀착점·관계 지위를 하나의 논증 원장으로 사용한다. 토폴로지는 이 논증을 전달하는 수단이다.
- 의미 게이트: 모든 의미 노드는 이름과 역할구로 읽히고, 모든 선언 연결은 출발점+표시 관계 동사+종착점으로 말할 수 있어야 한다. 주장 헤드라인·주 경로·결론 귀착점은 같은 청중 판단으로 수렴하고 증거 지위를 과장하지 않는다.
- 구조가 맞아도 의미가 모호하면 실패다. 3초 재진술에서 출발 역할·관계 동사·결과·판단을 복원할 수 있어야 하며 생태계·연계·작동 구조·공동 성과 같은 추상어가 이를 대신하지 않는다.
- 참조키 숨김: 노드 01·N01·EDGE-01 같은 ID는 화면 비표시 제작키다. 키·번호·괄호·ID 범례를 절대 렌더링하지 말고 콘텐츠에 선언된 표시 레이블·역할구·관계 동사만 보여준다.
- 개별 명세의 관계 구조·관계 레이블 적용 범위·구조 무결성·허용 연결·금지 연결·화살촉 규칙·데이터 귀속을 하나의 의미 정답으로 사용하고 바꾸거나 확장하지 않는다. ${geometryGuideKo}
- 렌더링 전에 노드·연결·화살촉·그룹·분기·합류·순환 수를 그 정답과 대조한다. 방향 관계만 화살촉, 협업은 방향 없는 선, 소속·공통 기반은 공유 표면으로 표현한다.
- 라벨을 올바른 노드 안에 귀속하고 하나의 주 읽기 경로를 보존하며 선언되지 않은 연결·방향·순환·인과·레이블 범위를 추가하지 않는다.`;
        }
        if (lang === "en") {
          return `## DIAGRAM MEANING & INTEGRITY CONTRACT 〔NON-DISPLAY〕
- Diagram: ${plan.code} ${plan.type || plan.labelEn}; expected nodes: ${plan.nodeCount || "as declared"}; expected connections: ${plan.edgeCount || "as declared"}.
- Meaning ledger: use the declared core judgment, node roles, relationship actions, argument path, decision takeaway, and evidence status. Do not invent any missing semantic claim.
- Semantic gate: every node reads as name plus role; every connection is speakable as source + relationship action + target; headline, primary path, and endpoint produce the same judgment in a three-second say-back.
- Reference-key lock: Node 01, N01, EDGE-01, and similar IDs are invisible authoring keys; never render IDs, numbers, or an ID legend.
- Relationship structure: ${relationship}
- Integrity lock: ${integrity}
${detailLines.join("\n")}${detailLines.length ? "\n" : ""}- Before rendering, count nodes, connectors, arrowheads, groups, branches, merges, and loops against this contract. Preserve only declared connections.
- Validate semantic topology before visual styling. Use arrowheads only for declared direction; use undirected lines for coordination; use shared surfaces for membership or common foundations. ${geometryGuideEn}
- Keep labels inside their correct nodes, prevent line crossings through text, and make one primary reading path clear at presentation distance.`;
        }
        return `## 다이어그램 의미·무결성 계약 〔화면 비표시〕
- 도식: ${plan.code} ${plan.type || plan.labelKo}; 예상 노드: ${plan.nodeCount || "명세 기준"}; 예상 연결: ${plan.edgeCount || "명세 기준"}.
- 의미 정답: 선언된 도식 핵심 판단·노드 역할·관계 동사·논증 경로·결론 귀착점·관계 지위를 사용하고 빠진 의미를 임의로 만들지 않는다.
- 의미 게이트: 모든 노드는 이름+역할구, 모든 연결은 출발점+관계 동사+종착점으로 말할 수 있어야 하며, 헤드라인·주 경로·귀착점이 3초 재진술에서 같은 판단으로 수렴해야 한다.
- 참조키 숨김: 노드 01·N01·EDGE-01 같은 ID와 번호는 화면 비표시 제작키이며 절대 렌더링하지 않는다.
- 관계 구조: ${relationship}
- 구조 고정: ${integrity}
${detailLines.join("\n")}${detailLines.length ? "\n" : ""}- 렌더링 전에 노드·연결·화살촉·그룹·분기·합류·순환 수를 이 계약과 대조하고 선언된 연결만 보존한다.
- 의미 토폴로지를 먼저 검증한다. 화살촉은 선언된 방향 관계에만, 방향 없는 선은 협업·기능 연결에, 공유 표면은 소속·공통 기반에 사용한다. ${geometryGuideKo}
- 라벨을 올바른 노드 안에 귀속하고 연결선이 글자를 관통하지 않게 하며 발표 거리에서 하나의 주 읽기 경로가 선명하게 보이도록 구성한다.`;
      }

      function buildPlannerContractDirective(record, lang, specialPage = false, compact = false, autonomy = deriveCompositionAutonomy(record)) {
        const screenSpec = String(record?.screenSpec || "");
        if (!hasPlannerSection(screenSpec, "콘텐츠")) return "";
        const hasFormat = hasPlannerSection(screenSpec, "양식");
        const hasPurpose = hasPlannerSection(screenSpec, "핵심 주제·목적");
        const hasExpression = hasPlannerSection(screenSpec, "표현 방식");
        const hasQuality = hasPlannerSection(screenSpec, "품질 조건");
        const autonomyKo = autonomy.key === "locked"
          ? "‘구성 고정’으로 선언된 큰 구도와 의미 그룹을 보존하고 미세 배치·표면·마감만 최적화한다."
          : autonomy.key === "guided"
            ? "의미 그룹·주 읽기 방향·강조 순서는 가이드로 보존하되 정확한 분할·위치·크기·매체·시각 은유는 AI가 결정한다."
            : "의미·문구·수치·관계·강조 우선순위만 고정하고 구도·매체·시각 은유는 AI가 서로 다른 후보를 비교해 결정한다.";
        const autonomyEn = autonomy.key === "locked"
          ? "Preserve the explicitly locked macro composition and semantic groups; optimize only local placement, surfaces, and finish."
          : autonomy.key === "guided"
            ? "Keep semantic groups, primary reading direction, and emphasis order as guidance; let the model decide exact partition, position, scale, medium, and visual metaphor."
            : "Lock only meaning, wording, figures, relationships, and emphasis priority; let the model compare and choose the composition, medium, and visual metaphor.";

        if (compact) {
          if (lang === "en") {
            return `## PROMPTDECK MECE CONTRACT ${PROMPTDECK_CONTRACT_VERSION}
- DISPLAY: Render only enabled Format values and exact Content strings, figures, units, and subjects. Do not paraphrase, duplicate, infer, or expose Markdown and authoring labels. Use a logo or institutional mark only when its actual reference asset is supplied.
- NON-DISPLAY: Use Purpose, Expression, and Quality only to decide audience fit, hierarchy, relationship meaning, factual boundaries, and finish.
- COMPOSITION AUTONOMY: ${autonomyEn} Diagram topology, evidence status, and data ownership remain exact.`;
          }
          return `## PromptDeck MECE 계약 ${PROMPTDECK_CONTRACT_VERSION}
- 화면 표시: 활성 양식값과 콘텐츠의 문구·수치·단위·대상만 정확히 렌더링하며 바꾸거나 중복·추론하지 않고 Markdown·작성용 필드명은 숨긴다. 로고·기관 마크는 실제 참조 자산이 제공된 경우에만 사용한다.
- 화면 비표시: 핵심 주제·목적, 표현 방식, 품질 조건은 청중 적합성·위계·관계 의미·사실 경계·마감 판단에만 사용한다.
- 구성 위임: ${autonomyKo} 도식 구조·증거 지위·데이터 귀속은 정확히 보존한다.`;
        }

        if (lang === "en") {
          return `## PROMPTDECK MECE CONTRACT ${PROMPTDECK_CONTRACT_VERSION}
- FORMAT: ${specialPage ? "Use the full canvas for content and the key visual. Do not render a header region, footer region, source strip, or page number." : (hasFormat ? "Render only the supplied header and footer values in their enabled slots. The skill defines the information hierarchy; the common guide defines visual treatment." : "Do not invent header or footer values.")}
- PURPOSE: ${hasPurpose ? "Use Core Topic and Purpose only as non-display reasoning for the audience question, perception change, barrier, and desired judgment." : "Infer only the minimum purpose supported by the content."}
- CONTENT LOCK: Render only the exact user-facing body strings, figures, units, facts, and visual subjects listed under Content. Do not paraphrase, translate, infer, or duplicate them. Use a logo or institutional mark only when its actual reference asset is supplied.
- EXPRESSION: ${hasExpression ? "Use the supplied visual argument, semantic groups, relationship meaning, reading priority, focal role, and generation path as non-display decision inputs." : "Create the minimum semantic hierarchy needed to explain the content."}
- QUALITY: ${hasQuality ? "Obey the supplied factual boundary, data integrity, reference preservation, and output-quality conditions before visual novelty." : "Do not invent evidence or turn contextual imagery into factual proof."}
- MECE: ${specialPage ? "Keep all visible strings under Content and keep Format as a non-display full-canvas policy." : "Do not copy header/footer values into the body."} Do not copy exact content strings and figures into non-display sections. Refer to content by role only.
- COMPOSITION AUTONOMY: ${autonomyEn}
- Non-display sections are reasoning guidance only. Never render their headings, field labels, rationale, or Markdown syntax.`;
        }

        return `## PromptDeck MECE 계약 ${PROMPTDECK_CONTRACT_VERSION}
- 양식: ${specialPage ? "헤더 영역·푸터 영역·출처 밴드·페이지 번호 없이 전체 캔버스를 콘텐츠와 키 비주얼에 사용한다." : (hasFormat ? "스킬이 정의한 헤더·푸터 정보값만 활성 슬롯에 표시하고, 홈페이지 공통 가이드는 형태·정렬·서체 인상만 적용한다." : "헤더·푸터 값을 임의로 만들지 않는다.")}
- 핵심 주제·목적: ${hasPurpose ? "청중 질문·인식 변화·핵심 장벽·목표 판단을 화면 비표시 판단 맥락으로 보존한다." : "콘텐츠가 직접 뒷받침하는 최소 목적만 해석한다."}
- 콘텐츠 고정: ‘콘텐츠’의 사용자 표시 문구·수치·단위·사실·시각 대상만 정확히 렌더링하고 바꾸거나 번역·추론·중복하지 않는다. 로고·기관 마크는 실제 참조 자산이 제공된 경우에만 사용한다.
- 표현 방식: ${hasExpression ? "비주얼 논증·의미 그룹·관계 의미·읽기 우선순위·핵심 강조 역할·생성 경로를 화면 비표시 판단 입력으로 사용한다." : "콘텐츠를 설명하는 최소 의미 위계만 만든다."}
- 품질 조건: ${hasQuality ? "사실·해석 경계, 데이터 정직성, 참조 보존과 출력 품질을 시각적 새로움보다 우선한다." : "맥락 이미지나 장식적 은유를 사실 증거처럼 보이게 만들지 않는다."}
- MECE: ${specialPage ? "모든 표시 문자열은 콘텐츠에만 두고 양식은 화면 비표시 전체 캔버스 정책으로 유지한다." : "헤더·푸터 값을 본문에 옮기지 않는다."} 콘텐츠의 정확한 문구·수치를 비표시 섹션에 다시 만들지 않고 역할명으로만 참조한다.
- 구성 위임: ${autonomyKo}
- 〔화면 비표시〕 섹션은 판단 근거일 뿐이다. 섹션 제목·필드명·판단 이유·Markdown 문법을 화면에 출력하지 않는다.`;
      }

      function resolveVisualResourcePolicy() {
        const raw = genState.commonDesignPackage?.settings?.visualResources;
        if (!raw || typeof raw !== "object") return null;
        const allowed = new Set(Array.isArray(raw.allowed) ? raw.allowed : []);
        const excluded = new Set(Array.isArray(raw.excluded) ? raw.excluded : []);
        const automatic = new Set(Array.isArray(raw.automatic) ? raw.automatic : []);
        const payloadEntries = new Map((Array.isArray(raw.entries) ? raw.entries : []).map((entry) => [entry?.key, entry]));
        const entries = Object.entries(VISUAL_RESOURCE_LABELS).map(([key, fallback]) => {
          const payload = payloadEntries.get(key) || {};
          let mode = allowed.has(key) ? "allow" : excluded.has(key) ? "exclude" : automatic.has(key) ? "auto" : raw[key];
          if (!["auto", "allow", "exclude"].includes(mode)) mode = ["auto", "allow", "exclude"].includes(payload.mode) ? payload.mode : "auto";
          return {
            key,
            mode,
            titleKo: payload.titleKo || fallback.ko,
            titleEn: payload.titleEn || fallback.en,
            guidanceKo: String(payload.guidanceKo || "").trim(),
            guidanceEn: String(payload.guidanceEn || "").trim(),
          };
        });
        return {
          entries,
          allowed: entries.filter((entry) => entry.mode === "allow"),
          excluded: entries.filter((entry) => entry.mode === "exclude"),
          automatic: entries.filter((entry) => entry.mode === "auto"),
          usable: entries.filter((entry) => entry.mode !== "exclude"),
          combinationContracts: (Array.isArray(raw.combinationContracts) ? raw.combinationContracts : []).filter((contract) => contract && typeof contract === "object"),
        };
      }

      function buildVisualResourceDirectorLines(lang, individualSpecialDesign) {
        const policy = resolveVisualResourcePolicy();
        if (individualSpecialDesign) {
          const lines = [lang === "en"
            ? "Actively consider only the visual resources named in the individual brief; omit any resource that does not strengthen persuasion."
            : "개별 의미 브리프에 지정된 시각 자원만 적극 검토하고 설득력을 높이지 않는 자원은 생략한다."];
          if (!policy) return lines;
          const names = (items) => items.map((item) => lang === "en" ? item.titleEn : item.titleKo).join(lang === "en" ? ", " : " · ");
          if (policy.excluded.length) lines.push(lang === "en"
            ? `Excluded resources: ${names(policy.excluded)}. This prohibition remains final for special slides and no individual brief may override it.`
            : `사용 금지 자원: ${names(policy.excluded)}. 이 금지는 특수 슬라이드에서도 최종 조건이며 개별 의미 브리프가 덮어쓸 수 없다.`);
          const guidance = policy.usable.map((item) => lang === "en" ? item.guidanceEn : item.guidanceKo).filter(Boolean);
          if (guidance.length) lines.push(lang === "en" ? `For any permitted resource named in the brief: ${guidance.join("; ")}.` : `브리프에 지정된 허용 자원을 사용할 때: ${guidance.join("; ")}.`);
          return lines;
        }
        if (!policy) return [lang === "en"
          ? "Actively consider available photography, data visualization, diagrams, pictograms, infographics, maps, illustration, technical 3D, multi-layer, typography, background, and palette resources; omit any resource that does not strengthen persuasion."
          : "활용 가능한 사진·데이터 시각화·다이어그램·픽토그램·인포그래픽·지도·일러스트·기술 3D·다중 레이어·타이포그래피·배경·색상 자원을 적극 검토하되 설득력을 높이지 않는 자원은 생략한다."];
        const names = (items) => items.map((item) => lang === "en" ? item.titleEn : item.titleKo).join(lang === "en" ? ", " : " · ");
        const lines = [];
        if (policy.allowed.length) lines.push(lang === "en"
          ? `Priority resources: ${names(policy.allowed)}. Consider these first only when they strengthen the key claim and evidence relationship.`
          : `우선 활용 자원: ${names(policy.allowed)}. 핵심 주장과 증거 관계를 강화하는 페이지에서 먼저 검토한다.`);
        else lines.push(lang === "en" ? "No common visual resource is prioritized." : "공통으로 우선할 시각 자원은 없다.");
        if (policy.automatic.length) lines.push(lang === "en"
          ? `Automatic candidates: ${names(policy.automatic)}. Use them only when the individual brief genuinely requires them.`
          : `AI 판단 자원: ${names(policy.automatic)}. 개별 의미 브리프가 실제로 필요로 할 때만 선택한다.`);
        if (policy.excluded.length) lines.push(lang === "en"
          ? `Excluded resources: ${names(policy.excluded)}. This prohibition is final and no later automatic-composition instruction may override it.`
          : `사용 금지 자원: ${names(policy.excluded)}. 이 금지는 최종 조건이며 이후 자동 구성 지시가 덮어쓰지 않는다.`);
        const guidance = policy.usable.map((item) => lang === "en" ? item.guidanceEn : item.guidanceKo).filter(Boolean);
        if (guidance.length) lines.push(lang === "en" ? `When a resource is used: ${guidance.join("; ")}.` : `자원을 사용할 때: ${guidance.join("; ")}.`);
        policy.combinationContracts.forEach((contract) => {
          const text = String(lang === "en" ? contract.en : contract.ko).trim();
          if (text) lines.push(lang === "en" ? `Combination rule: ${text}.` : `조합 원칙: ${text}.`);
        });
        return lines;
      }

      function buildVisualDirectorDirective(record, lang, individualSpecialDesign = false, autonomy = deriveCompositionAutonomy(record)) {
        if (!normalizePlannerEnhancements(genState.plannerEnhancements).visualDirector || !isSlideRecord(record)) return "";
        const screenSpec = String(record?.screenSpec || "");
        const hasPurpose = hasPlannerSection(screenSpec, "핵심 주제·목적");
        const hasExpression = hasPlannerSection(screenSpec, "표현 방식");
        const taskKo = autonomy.key === "locked"
          ? "명세가 고정한 의미 그룹과 큰 구도 안에서 매체·레이어·깊이·강조 방식이 다른 후보 2개를 비교한다."
          : autonomy.key === "guided"
            ? "의미 그룹·주 읽기 방향·핵심 강조 순서만 가이드로 유지하고 공간 구조·매체·시각 은유가 다른 후보 2~3개를 비교한다. 명세의 큰 레이아웃 문구는 좌표 지시가 아니라 의도 설명으로 해석한다."
            : "의미·문구·수치·관계·강조 이유만 고정하고 공간 구조·매체·시각 은유가 실질적으로 다른 후보 2~3개를 비교한다. 명세에 큰 레이아웃 제안이 있어도 구성 잠금이 없으면 선택 가능한 아이디어로 취급한다.";
        const taskEn = autonomy.key === "locked"
          ? "Silently compare two treatments with different media, layering, depth, and emphasis inside the explicitly locked semantic groups and macro composition."
          : autonomy.key === "guided"
            ? "Keep only semantic groups, primary reading direction, and emphasis order as guidance. Silently compare 2–3 materially different treatments across spatial structure, medium, and visual metaphor. Treat macro-layout wording as intent, not coordinates."
            : "Lock only meaning, wording, figures, relationships, and the reason for emphasis. Silently compare 2–3 materially different treatments across spatial structure, medium, and visual metaphor. Any macro-layout suggestion is optional unless a composition lock is explicit.";
        const resourceLines = buildVisualResourceDirectorLines(lang, individualSpecialDesign).map((line) => `- ${line}`).join("\n");
        if (lang === "en") {
          return `## AI VISUAL DIRECTOR
- Composition autonomy: ${autonomy.labelEn}. ${autonomy.reasonEn}.
- Before rendering, interpret ${hasPurpose ? "the supplied audience question, perception change, persuasion purpose, barrier, evidence role, and desired judgment" : "the minimum audience question and judgment directly supported by the content"}. ${taskEn}
${resourceLines}
- Choose exactly one approach by five tests: 3-second comprehension, evidence-to-conclusion fit, cognitive load, factual honesty, and projected legibility.
- Preserve the declared focal target and reason for emphasis; then resolve exact scale, spacing, negative space, crop, depth, overlap, layers, and local contrast. Integrate evidence serving one argument rather than repeating equal cards or disconnected shapes.
- Keep text, figures, and shape edges pixel-crisp without full-canvas blur or haze. Keep the comparison and production reasoning invisible; output only the complete slide.`;
        }
        return `## AI 비주얼 디렉터
- 구성 위임 수준: ${autonomy.labelKo}. ${autonomy.reasonKo}.
- 렌더링 전에 ${hasPurpose ? "제공된 청중 질문·인식 변화·슬라이드 목적·핵심 장벽·근거 역할·목표 판단" : "제공된 콘텐츠가 직접 뒷받침하는 최소한의 청중 질문과 판단"}을 해석한다. ${taskKo}
${resourceLines}
- 3초 이해도, 증거와 결론의 적합성, 인지 부담, 사실성, 발표 거리 가독성의 다섯 기준으로 한 가지 접근만 선택한다.
- 지정된 핵심 강조 대상과 이유를 보존한 뒤 정확한 크기·간격·여백·크롭·깊이·중첩·레이어·국부 대비를 완성한다. 같은 논증의 근거는 하나의 시각군으로 통합해 동일 카드 반복이나 단절된 단순 도형 집합을 피한다.
- 글자·수치·도형의 가장자리는 픽셀 단위로 선명하게 유지하고 전면 블러·안개 처리를 사용하지 않는다. 비교 과정과 제작 판단은 화면에 노출하지 않고 완성된 슬라이드만 출력한다.`;
      }

      function buildFinalExecutionHeader(lang, specialPage = false) {
        const config = getExecutionPromptConfig(lang === "en" ? "en" : "ko");
        const lines = [`# ${config.title}`];
        const intro = specialPage
          ? (lang === "en"
            ? "Create one complete, production-ready special-slide image using the Individual Slide Specification below."
            : "아래 개별 슬라이드 명세를 사용하여 완성도 높은 특수 슬라이드 이미지 한 장을 생성합니다.")
          : config.intro;
        if (config.introEnabled !== false && intro) lines.push("", intro);
        const enabledRules = specialPage
          ? [{ enabled: true, text: lang === "en"
            ? "Render only user-facing content, keep all authoring metadata invisible, and use the full canvas without a header region, footer region, source strip, or page number."
            : "사용자 표시 콘텐츠만 렌더링하고 모든 작성용 메타데이터를 숨기며, 헤더 영역·푸터 영역·출처 밴드·페이지 번호 없이 전체 캔버스를 사용합니다." }]
          : config.rules.filter((rule) => rule.enabled !== false && rule.text.trim());
        if (enabledRules.length) {
          lines.push("", `## ${config.heading}`, "");
          enabledRules.forEach((rule, index) => lines.push(`${index + 1}. ${rule.text.trim()}`));
        }
        return lines;
      }

      function normalizeMarkdownRootHeading(text, targetLevel = 2, fallbackTitle = "") {
        const source = String(text || "").trim();
        if (!source) return fallbackTitle ? `${"#".repeat(targetLevel)} ${fallbackTitle}` : "";

        const lines = source.split(/\r?\n/);
        let inFence = false;
        let firstLevel = null;

        for (const line of lines) {
          if (/^\s*```/.test(line)) {
            inFence = !inFence;
            continue;
          }
          if (inFence) continue;
          const match = line.match(/^(#{1,6})\s+/);
          if (match) {
            firstLevel = match[1].length;
            break;
          }
        }

        if (!firstLevel) {
          return fallbackTitle
            ? `${"#".repeat(targetLevel)} ${fallbackTitle}\n\n${source}`
            : source;
        }

        const delta = targetLevel - firstLevel;
        if (!delta) return source;

        inFence = false;
        return lines.map((line) => {
          if (/^\s*```/.test(line)) {
            inFence = !inFence;
            return line;
          }
          if (inFence) return line;
          const match = line.match(/^(#{1,6})(\s+.*)$/);
          if (!match) return line;
          const level = Math.min(6, Math.max(1, match[1].length + delta));
          return `${"#".repeat(level)}${match[2]}`;
        }).join("\n");
      }

      function removeStandaloneHorizontalRules(text) {
        let inFence = false;
        return String(text || "")
          .split(/\r?\n/)
          .filter((line) => {
            if (/^\s*```/.test(line)) {
              inFence = !inFence;
              return true;
            }
            return inFence || !/^\s*---+\s*$/.test(line);
          })
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      }

      function normalizeRuleType(rawType) {
        const token = String(rawType || "").trim().toLowerCase();
        if (token === "slide" || token === "슬라이드") return "slide";
        if (token === "appendix" || token === "부록") return "appendix";
        return "";
      }

      function parseSplitRules(text) {
        const rules = [];
        const lines = String(text || "").split(/\r?\n/);

        lines.forEach((line, index) => {
          const raw = line.trim();
          if (!raw || raw.startsWith("//")) return;

          const separator = raw.indexOf("|");
          if (separator < 0) {
            throw new Error(`구분 규칙 ${index + 1}행 형식이 올바르지 않습니다. 예: slide|^##\\s+슬라이드\\s+(\\d{2})\\.\\s*(.+)$`);
          }

          const ruleType = normalizeRuleType(raw.slice(0, separator));
          const source = raw.slice(separator + 1).trim();

          if (!ruleType) {
            throw new Error(`구분 규칙 ${index + 1}행의 type은 slide 또는 appendix만 사용할 수 있습니다.`);
          }
          if (!source) {
            throw new Error(`구분 규칙 ${index + 1}행의 정규식이 비어 있습니다.`);
          }

          try {
            rules.push({
              type: ruleType,
              source,
              pattern: new RegExp(source, "gm"),
            });
          } catch (error) {
            throw new Error(`구분 규칙 ${index + 1}행 정규식이 잘못되었습니다: ${error.message}`);
          }
        });

        if (!rules.length) {
          throw new Error("슬라이드 구분 규칙을 하나 이상 입력해주세요.");
        }

        return rules;
      }

      function parseMarkdown(markdown, maxChars, splitRulesText) {
        const rules = parseSplitRules(splitRulesText);
        const matches = [];

        rules.forEach((rule, ruleIndex) => {
          rule.pattern.lastIndex = 0;
          let match;
          while ((match = rule.pattern.exec(markdown)) !== null) {
            if (match[0].length === 0) {
              throw new Error(`구분 규칙 ${ruleIndex + 1}행이 빈 문자열과 일치합니다. 슬라이드 heading 전체를 포함하도록 정규식을 수정해주세요.`);
            }
            if (typeof match[1] !== "string" || typeof match[2] !== "string") {
              throw new Error(`구분 규칙 ${ruleIndex + 1}행은 번호와 제목을 위한 캡처 그룹 2개가 필요합니다.`);
            }
            matches.push({
              type: rule.type,
              no: match[1].trim(),
              title: cleanTitle(match[2]),
              index: match.index,
              ruleIndex,
            });
          }
        });

        matches.sort((a, b) => a.index - b.index || a.ruleIndex - b.ruleIndex);
        const uniqueMatches = [];
        const seenPositions = new Map();

        matches.forEach((item) => {
          const existing = seenPositions.get(item.index);
          if (!existing) {
            seenPositions.set(item.index, item);
            uniqueMatches.push(item);
            return;
          }

          const sameMatch = existing.type === item.type
            && existing.no === item.no
            && existing.title === item.title;
          if (!sameMatch) {
            throw new Error(`같은 heading이 서로 다른 구분 규칙에 중복 인식되었습니다: ${item.title || item.no}`);
          }
        });

        const seenIdentifiers = new Set();
        uniqueMatches.forEach((item) => {
          const identifier = `${item.type}:${String(item.no).toUpperCase()}`;
          if (seenIdentifiers.has(identifier)) {
            throw new Error(`슬라이드 번호가 중복되었습니다: ${item.no}`);
          }
          seenIdentifiers.add(identifier);
        });

        const firstSlideIndex = uniqueMatches[0]?.index ?? markdown.length;
        const preamble = markdown.slice(0, firstSlideIndex);
        const deckMetadata = extractDeckMetadata(preamble);
        const deckContext = extractDeckContext(preamble, deckMetadata);
        const metadataLang = inferPromptLanguage(markdown);

        return uniqueMatches.map((item, idx) => {
          const next = uniqueMatches[idx + 1];
          const block = markdown.slice(item.index, next ? next.index : markdown.length);
          const filteredScreenSpec = trimForVisual(filterHeaderFooterSections(block, genState.headerFooterSettings), maxChars);
          const detectedPageType = inferPageTypeForRecord({
            slide_no: item.no,
            entryType: item.type,
            title: item.title,
            screenSpec: filteredScreenSpec,
          });
          const baseScreenSpec = SPECIAL_PAGE_TYPES.has(detectedPageType)
            ? stripSpecialSlideFrameMetadata(filteredScreenSpec, metadataLang)
            : filteredScreenSpec;
          const slideContext = {
            index: idx,
            total: uniqueMatches.length,
            slideNo: item.no,
            title: item.title,
            entryType: item.type,
            pageType: detectedPageType,
            lang: metadataLang,
            headerFooterSettings: genState.headerFooterSettings,
          };
          const contextualScreenSpec = appendDeckContext(baseScreenSpec, deckContext, slideContext);
          const screenSpec = appendHeaderFooterMetadata(contextualScreenSpec, deckMetadata, slideContext);
          const tocNumber = item.type === "slide" ? getTocNumber(item.no) : "";

          return {
            slide_no: item.no,
            entryType: item.type,
            toc_number: tocNumber,
            title: item.title,
            screenSpec,
            generationPath: extractGenerationPath(screenSpec),
            contractVersion: extractPromptDeckContractVersion(markdown) || genState.commonPromptPackageMeta?.plannerContractVersion || PROMPTDECK_CONTRACT_VERSION,
            plannerContractVersion: extractPromptDeckContractVersion(markdown) || genState.commonPromptPackageMeta?.plannerContractVersion || PROMPTDECK_CONTRACT_VERSION,
            skillPresetContractVersion: extractSkillPresetContractVersion(markdown) || genState.commonPromptPackageMeta?.skillPresetContractVersion || SKILL_PRESET_CONTRACT_VERSION,
            targetModel: resolvePackageTargetModel(),
            outputMode: resolvePackageOutputMode(),
            prompt: "",
          };
        });
      }

      function isExcludedVisualSection(title) {
        const normalized = cleanTitle(title)
          .replace(/[：:]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();
        return /^(발표자\s*(스크립트|노트|메모)|발표\s*(스크립트|대본)|내부\s*(메모|노트)|speaker\s*notes?|presenter\s*notes?|talk\s*track)$/.test(normalized);
      }

      function stripExcludedVisualSections(block) {
        const lines = String(block || "").split(/\r?\n/);
        const kept = [];
        let skippedHeadingLevel = 0;

        lines.forEach((line) => {
          const heading = line.match(/^(#{3,6})\s+(.+?)\s*$/);

          if (skippedHeadingLevel) {
            if (!heading || heading[1].length > skippedHeadingLevel) return;
            skippedHeadingLevel = 0;
          }

          if (heading && isExcludedVisualSection(heading[2])) {
            skippedHeadingLevel = heading[1].length;
            return;
          }

          kept.push(line);
        });

        return kept.join("\n");
      }

      function compactDiagramScreenSpec(block, maxChars = 3200, options = {}) {
        let source = stripExcludedVisualSections(block).replace(/\n{3,}/g, "\n\n").trim();
        if (Number(deriveDiagramPlan(source).code.slice(1)) < 2) return source;
        if (source.length <= maxChars && !options.omitGlobalContext) return source;

        const pageNumberLine = source.match(/^\s*[-*+]\s*페이지\s*번호\s*표기값\s*[:：].+$/mi)?.[0]?.trim() || "";
        const formatSection = plannerSectionText(source, /^양식$/i);
        if (pageNumberLine && !/페이지\s*번호\s*표기값\s*[:：]/i.test(formatSection)) {
          source = source.replace(/(^###\s+양식[^\r\n]*\r?\n)/m, `$1\n${pageNumberLine}\n`);
        }

        const keepBySection = {
          purpose: /^(?:한눈\s*논지|도식\s*핵심\s*판단|의미\s*문장|슬라이드\s*목적|청중\s*질문|인식\s*변화|핵심\s*장벽|목표\s*판단(?:\s*또는\s*행동)?|결론\s*귀착점|관계\s*지위|핵심\s*근거의\s*역할|세션\s*연결)\s*[:：]/i,
          expression: /^(?:페이지\s*유형|정보\s*밀도|데이터\s*시각화\s*강도|비주얼\s*논증|논증\s*(?:문법|경로)|의미\s*그룹(?:과\s*관계)?|읽기\s*(?:우선순위|방향|경로)|구성\s*(?:위임\s*수준|잠금|고정)|AI\s*구성\s*(?:위임|자유도)|큰\s*레이아웃|정보\s*위계|핵심\s*강조\s*대상|시각\s*언어와\s*레이어|도식\s*유형|도식\s*복잡도|관계\s*구조|관계\s*(?:동사|의미\s*문구)|관계\s*레이블\s*적용\s*범위|노드\s*역할(?:\s*설명|구)?|주\s*읽기\s*경로|여백과\s*리듬|생성\s*경로|AI\s*조정\s*범위)\s*[:：]/i,
          quality: /^(?:사실\s*고정|허용\s*해석|해석\s*경계|관계\s*지위|증거\s*지위|의미\s*(?:보존|무결성)|3초\s*재진술|데이터\s*정직성|참조\s*보존|품질\s*취약점|구조\s*무결성|데이터\s*귀속|허용\s*(?:노드·)?연결|금지\s*(?:노드·)?연결|화살촉\s*(?:규칙|정책|수)|연결\s*통로|추가\s*노드·연결|출력\s*품질|논지\s*선명도|화면\s*어조)\s*[:：]/i,
          metadata: /^.+\s*[:：]/i,
        };
        const lines = source.split(/\r?\n/);
        const kept = [];
        let section = "";
        let keepAll = true;

        lines.forEach((line) => {
          const heading = line.match(/^###\s+(.+?)\s*$/);
          if (heading) {
            const title = cleanTitle(heading[1]);
            if (options.omitGlobalContext && /발표\s*맥락|세션\s*위치/i.test(title)) section = "omit";
            else if (options.omitGlobalContext && /덱\s*메타데이터/i.test(title)) section = "metadata";
            else if (/핵심\s*주제[·ㆍ]목적/i.test(title)) section = "purpose";
            else if (/표현\s*방식/i.test(title)) section = "expression";
            else if (/품질\s*조건/i.test(title)) section = "quality";
            else section = "";
            keepAll = !section || /양식|콘텐츠/i.test(title);
            if (section !== "omit") kept.push(line);
            return;
          }
          if (section === "omit") return;
          if (keepAll || !section || !line.trim() || /^##\s+/.test(line)) {
            kept.push(line);
            return;
          }
          const bullet = line.match(/^\s*[-*+]\s*(.+)$/)?.[1]?.trim() || "";
          if (bullet && keepBySection[section]?.test(bullet)) kept.push(line);
        });

        return trimForVisual(kept.join("\n"), maxChars);
      }

      function trimForVisual(block, maxChars) {
        let trimmed = stripExcludedVisualSections(block);
        trimmed = trimmed.replace(/\n{3,}/g, "\n\n").trim();
        if (trimmed.length <= maxChars) return trimmed;

        const sections = trimmed.split(/(?=^###\s+)/gm).filter(Boolean);
        const protectedSection = (text) => /^###\s+(양식|콘텐츠|품질 조건|Format|Content|Quality Conditions)/im.test(text)
          || /(?:도식|다이어그램)\s*(?:유형|복잡도|구조)|관계\s*구조|구조\s*무결성|diagram\s*(?:type|complexity)|relationship\s*structure|structure\s*integrity/i.test(text);
        const lineFit = (text, budget) => {
          const lines = String(text || "").split(/\r?\n/);
          const kept = [];
          let length = 0;
          for (const line of lines) {
            const cost = line.length + (kept.length ? 1 : 0);
            if (length + cost > budget) break;
            kept.push(line);
            length += cost;
          }
          return kept.join("\n").trim();
        };
        const protectedLength = sections.filter(protectedSection).reduce((sum, section) => sum + section.length + 2, 0);
        const flexible = sections.filter((section) => !protectedSection(section));
        const flexibleBudget = Math.max(0, maxChars - Math.min(protectedLength, Math.floor(maxChars * 0.72)) - 80);
        const perSection = flexible.length ? Math.max(120, Math.floor(flexibleBudget / flexible.length)) : 0;
        const fitted = sections.map((section) => {
          const budget = protectedSection(section)
            ? Math.max(180, Math.min(section.length, Math.floor(maxChars * 0.36)))
            : perSection;
          return lineFit(section, budget);
        }).filter(Boolean).join("\n\n");
        const notice = inferPromptLanguage(block) === "en"
          ? "[Some supporting production guidance was omitted to fit the prompt length limit; Format, Content, diagram integrity, and Quality Conditions take priority.]"
          : "[길이 제한에 맞춰 일부 보조 제작 지시를 생략했습니다. 양식·콘텐츠·도식 무결성·품질 조건을 우선합니다.]";
        return lineFit(`${fitted}\n\n${notice}`, maxChars);
      }

      function filterHeaderFooterSections(block, rawSettings) {
        const settings = normalizeHeaderFooterSettings(rawSettings);
        const selected = {
          header: settings.headerFields === null ? null : new Set(settings.headerFields),
          footer: settings.footerFields === null ? null : new Set(settings.footerFields),
        };
        const enabled = { header: settings.headerEnabled, footer: settings.footerEnabled };
        const kept = [];
        let activeType = "";
        let activeLevel = 0;
        let definitionLevel = 0;

        String(block || "").split(/\r?\n/).forEach((line) => {
          const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
          if (heading) {
            const level = heading[1].length;
            if (activeType && level <= activeLevel) activeType = "";
            if (definitionLevel && level <= definitionLevel) definitionLevel = 0;
            if (isHeaderFooterSlotDefinitionHeading(heading[2])) {
              definitionLevel = level;
              activeType = "";
              return;
            }
            if (definitionLevel) return;
            const nextType = classifyHeaderFooterHeading(heading[2]);
            if (nextType) {
              activeType = nextType;
              activeLevel = level;
              if (enabled[nextType]) kept.push(line);
              return;
            }
            if (activeType && !enabled[activeType]) return;
            kept.push(line);
            return;
          }

          if (definitionLevel) return;

          const item = line.match(/^\s*[-*+]\s+(?:\*\*)?([^:：*]+?)(?:\*\*)?\s*[:：]\s*(.+?)\s*$/);
          const itemType = item ? classifyHeaderFooterField(item[1], activeType) : "";
          if (itemType) {
            if (!enabled[itemType]) return;
            const fieldKey = canonicalHeaderFooterFieldKey(item[1], itemType);
            if (selected[itemType] !== null && !selected[itemType].has(fieldKey)) return;
          } else if (activeType && !enabled[activeType]) {
            return;
          }
          kept.push(line);
        });

        return kept.join("\n");
      }

      function stripSpecialSlideFrameMetadata(screenSpec, lang = "ko") {
        const lines = String(screenSpec || "").split(/\r?\n/);
        const kept = [];
        let skippedLevel = 0;
        let formatLevel = 0;
        let foundFormat = false;
        const isEnglish = lang === "en";
        const formatHeading = isEnglish
          ? "### FORMAT 〔NON-DISPLAY · FULL CANVAS〕"
          : "### 양식 〔화면 비표시·전체 캔버스〕";
        const formatPolicy = isEnglish
          ? "- Frame policy: use the full canvas for content and the key visual without recurring header or footer slots"
          : "- 프레임 방식: 반복 헤더·푸터 슬롯 없이 전체 캔버스를 콘텐츠와 키 비주얼에 사용";

        lines.forEach((line) => {
          const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
          if (skippedLevel) {
            if (!heading || heading[1].length > skippedLevel) return;
            skippedLevel = 0;
          }
          if (formatLevel) {
            if (!heading || heading[1].length > formatLevel) return;
            formatLevel = 0;
          }
          if (heading) {
            const level = heading[1].length;
            const title = normalizePlannerHeading(heading[2]);
            if (/^(?:덱\s*메타데이터|전역\s*메타데이터|deck\s*metadata|global\s*metadata)$/i.test(title)) {
              skippedLevel = level;
              return;
            }
            if (/^(?:양식|format)$/i.test(title)) {
              foundFormat = true;
              formatLevel = level;
              kept.push(formatHeading, "", formatPolicy, "");
              return;
            }
          }
          kept.push(line);
        });

        if (!foundFormat) {
          const firstHeadingIndex = kept.findIndex((line) => /^##\s+/.test(line));
          const insertAt = firstHeadingIndex >= 0 ? firstHeadingIndex + 1 : 0;
          kept.splice(insertAt, 0, "", formatHeading, "", formatPolicy, "");
        }
        return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
      }

      function cleanTitle(title) {
        return title.replace(/\*\*/g, "").replace(/\[[^\]]+\]/g, "").trim();
      }

      function getTocNumber(slideNo) {
        const n = Number(slideNo);
        if (!Number.isFinite(n) || n < 4) return "";
        if (n <= 5) return "1. Why";
        if (n <= 11) return "2. What";
        if (n <= 17) return "3. Bottleneck";
        if (n <= 21) return "4. How";
        if (n <= 25) return "5. Who / How Much";
        if (n <= 33) return "6. Infra";
        if (n <= 37) return "7. Risk";
        if (n <= 43) return "8. Impact";
        return "";
      }

      function toMarkdown(records) {
        return records
          .map((record) => String(record.prompt || "").trim())
          .filter(Boolean)
          .join("\n\n");
      }

      function toJsonl(records) {
        return records.map((r, index) => JSON.stringify({
          prompt_index: index + 1,
          prompt_id: promptId(r),
          slide_no: r.slide_no,
          toc_number: r.toc_number || null,
          title: r.title,
          prompt: r.prompt
        })).join("\n");
      }

      function getRecordConfigDiff(record, lang = resolveCommonPromptLanguage()) {
         if (!record) return null;
         const promptDeck = window.PromptDeck;
         if (!promptDeck || typeof promptDeck.diffConfig !== "function") return null;
         const baseConfig = genState.commonConfig || createBasePromptConfig();
         const config = normalizePromptConfig(record) || baseConfig;
         return promptDeck.diffConfig(baseConfig, config, lang);
      }

      function hasSlideSpecificConfig(record) {
         const diff = getRecordConfigDiff(record);
         return Boolean(diff && diff.changeCount > 0);
      }

      function saveProject() {
         const data = getProjectSnapshot();
         const json = JSON.stringify(data, null, 2);
         const blob = new Blob([json], { type: "application/json" });
         const url = URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = `promptdeck_project_${new Date().getTime()}.json`;
         document.body.appendChild(a);
         a.click();
         a.remove();
         URL.revokeObjectURL(url);
         setMessage("프로젝트 전체를 저장했습니다.", false);
      }

      function loadProject() {
         $("genLoadProjectInput").click();
      }

      $("genLoadProjectInput").addEventListener("change", (e) => {
         const file = e.target.files[0];
         if (!file) return;
         const reader = new FileReader();
         reader.onload = (ev) => {
            try {
               const data = migrateProjectData(JSON.parse(ev.target.result));
               applyLoadedProject(data);
               setMessage("프로젝트를 성공적으로 불러왔습니다.", false);
            } catch (err) {
               setMessage("올바르지 않은 프로젝트 파일입니다.");
            }
            $("genLoadProjectInput").value = "";
         };
         reader.readAsText(file);
      });

      function getProjectSnapshot() {
         const promptDeck = window.PromptDeck;
         const serializeConfig = promptDeck?.serializeConfig;
         const serializeSelections = promptDeck?.serializeSelections;
         const serializeSelectionSet = (selections) => {
           if (typeof serializeSelections === "function") return serializeSelections(selections);
           return normalizeSelections(selections);
         };
         const serializeConfigValue = (config) => {
           if (typeof serializeConfig === "function") return serializeConfig(config);
           return deepClone(config);
         };

         return {
            schemaVersion: PROJECT_SCHEMA_VERSION,
            savedAt: new Date().toISOString(),
            appVersion: "promptdeck-dev",
            format: $("genFormat").value === "jsonl" ? "jsonl" : "markdown",
            maxChars: readMaxChars(),
            globalSelections: serializeSelectionSet(window.globalSelections || window.pptState?.selections),
            commonConfig: serializeConfigValue(genState.commonConfig || createBasePromptConfig()),
            commonPromptPackage: {
              schemaVersion: PROMPT_PACKAGE_SCHEMA_VERSION,
              contractVersion: genState.commonPromptPackageMeta?.designContractVersion || DESIGN_CONTRACT_VERSION,
              designContractVersion: genState.commonPromptPackageMeta?.designContractVersion || DESIGN_CONTRACT_VERSION,
              plannerContractVersion: genState.commonPromptPackageMeta?.plannerContractVersion || PROMPTDECK_CONTRACT_VERSION,
              skillPresetContractVersion: genState.commonPromptPackageMeta?.skillPresetContractVersion || SKILL_PRESET_CONTRACT_VERSION,
              text: $("genCommonPrompt").value,
              lang: resolveCommonPromptLanguage(),
              source: genState.commonPromptPackageMeta?.source || "slide-prompt-generator",
              config: serializeConfigValue(genState.commonConfig || createBasePromptConfig()),
              userInput: normalizeCommonUserInput(genState.commonUserInput),
              designPackage: deepClone(genState.commonDesignPackage),
              targetModel: resolvePackageTargetModel(),
              outputMode: resolvePackageOutputMode(),
              enabledSlots: deepClone(genState.commonPromptPackageMeta?.enabledSlots || deriveEnabledSlots(genState.commonDesignPackage)),
            },
            commonPromptSections: genState.commonPromptSections.map(({ enabled }) => ({ enabled: enabled !== false })),
            executionPromptOverrides: deepClone(genState.executionPromptOverrides),
            headerFooterSettings: deepClone(genState.headerFooterSettings),
            plannerEnhancements: deepClone(genState.plannerEnhancements),
            specialSlideScope: deepClone(genState.specialSlideScope),
            markdown: $("genMdInput").value,
            commonPrompt: $("genCommonPrompt").value,
            commonPromptLang: resolveCommonPromptLanguage(),
            splitRules: $("genSplitRules").value,
            records: genState.records.map((record) => ({
              ...record,
              promptConfig: record.promptConfig ? serializeConfigValue(record.promptConfig) : null,
              selections: serializeSelectionSet(record.selections),
            })),
         };
      }

      function migrateProjectData(data) {
         const project = data && typeof data === "object" ? deepClone(data) : {};
         const version = Number(project.schemaVersion) || 1;
         const promptDeck = window.PromptDeck;

         const normalizeConfig = (config) => {
           if (!config) return null;
           if (promptDeck && typeof promptDeck.normalizeConfig === "function") {
             return promptDeck.normalizeConfig(config);
           }
           return {
             ...config,
             selections: normalizeSelections(config.selections),
           };
         };

         const storedPackage = project.commonPromptPackage && typeof project.commonPromptPackage === "object"
           ? project.commonPromptPackage
           : null;
         const baseCommonConfig = normalizeConfig(storedPackage?.config || project.commonConfig || createBasePromptConfig());

         if (!Array.isArray(project.records)) project.records = [];

         project.records = project.records.map((record) => {
           const next = { ...record };
           delete next.layoutAssignment;
           if (next.promptConfig) {
             next.promptConfig = normalizeConfig(next.promptConfig);
           }
           if (next.selections) {
              next.selections = normalizeSelections(next.selections);
           }
           if (!next.promptConfig && next.selections) {
             const base = deepClone(baseCommonConfig);
             base.selections = normalizeSelections(next.selections);
             next.promptConfig = normalizeConfig(base);
           }
           return next;
         });

         project.commonConfig = baseCommonConfig;
         project.commonUserInput = normalizeCommonUserInput(storedPackage?.userInput || project.commonUserInput);
         project.commonDesignPackage = storedPackage?.designPackage && typeof storedPackage.designPackage === "object"
           ? deepClone(storedPackage.designPackage)
           : (project.commonDesignPackage && typeof project.commonDesignPackage === "object" ? deepClone(project.commonDesignPackage) : null);
         project.commonPromptPackageMeta = normalizePromptPackageMeta(storedPackage || {
           designPackage: project.commonDesignPackage,
           source: "migrated-project",
         });
         if (typeof storedPackage?.text === "string") project.commonPrompt = storedPackage.text;
         if (storedPackage?.lang === "ko" || storedPackage?.lang === "en") {
           project.commonPromptLang = storedPackage.lang;
         }
         project.globalSelections = normalizeSelections(project.globalSelections);
         project.format = project.format === "jsonl" || project.latestFormat === "jsonl"
           ? "jsonl"
           : "markdown";
         const storedMaxChars = Number(project.maxChars);
         project.maxChars = Number.isInteger(storedMaxChars) && storedMaxChars > 0
           ? storedMaxChars
           : 3600;
         project.commonPromptLang = project.commonPromptLang === "ko" || project.commonPromptLang === "en"
           ? project.commonPromptLang
           : inferPromptLanguage(project.commonPrompt);
         project.commonPromptSections = Array.isArray(project.commonPromptSections) ? project.commonPromptSections : null;
         project.executionPromptOverrides = {
           ko: project.executionPromptOverrides?.ko ? normalizeExecutionPromptConfig(project.executionPromptOverrides.ko, "ko") : null,
           en: project.executionPromptOverrides?.en ? normalizeExecutionPromptConfig(project.executionPromptOverrides.en, "en") : null,
         };
          project.headerFooterSettings = normalizeHeaderFooterSettings(project.headerFooterSettings);
          project.plannerEnhancements = normalizePlannerEnhancements(project.plannerEnhancements);
          project.specialSlideScope = normalizeSpecialSlideScope(project.specialSlideScope);
         project.splitRules = typeof project.splitRules === "string" && project.splitRules.trim()
           ? project.splitRules
           : DEFAULT_SPLIT_RULES;
         project.records = project.records.map((record) => ({
           ...record,
           entryType: normalizeStoredRecordType(record),
         }));
         project.schemaVersion = version >= PROJECT_SCHEMA_VERSION ? version : PROJECT_SCHEMA_VERSION;
         return project;
      }

      function applyLoadedProject(data) {
         genState.commonPromptDraft = [];
         genState.executionPromptDraft = null;
         genState.headerFooterDraft = null;
         genState.configModalIndex = null;
         genState.configDraft = null;
         genState.configReturnFocus = null;
         $("genPromptEditor").value = "";
         if (data.globalSelections && window.pptState) {
            const current = createBasePromptConfig();
            current.selections = normalizeSelections(data.globalSelections);
            applyPromptConfigToState(current, window.pptState);
            if (typeof window.pptRenderAll === "function") window.pptRenderAll();
         }
         $("genMdInput").value = typeof data.markdown === "string" ? data.markdown : "";
         $("genCommonPrompt").value = typeof data.commonPrompt === "string" ? data.commonPrompt : "";
         resetCommonPromptSections($("genCommonPrompt").value, data.commonPromptSections);
         genState.executionPromptOverrides = {
           ko: data.executionPromptOverrides?.ko ? normalizeExecutionPromptConfig(data.executionPromptOverrides.ko, "ko") : null,
           en: data.executionPromptOverrides?.en ? normalizeExecutionPromptConfig(data.executionPromptOverrides.en, "en") : null,
         };
         $("genCommonPrompt").dataset.promptLang = data.commonPromptLang || inferPromptLanguage(data.commonPrompt);
         updateExecutionPromptStatus();
         delete $("genCommonPrompt").dataset.configDetached;
         $("genFormat").value = data.format === "jsonl" ? "jsonl" : "markdown";
         $("genMaxChars").value = String(data.maxChars || 3600);
         genState.latestFormat = $("genFormat").value;
         $("genSplitRules").value = data.splitRules || DEFAULT_SPLIT_RULES;
          genState.headerFooterSettings = normalizeHeaderFooterSettings(data.headerFooterSettings);
          genState.plannerEnhancements = normalizePlannerEnhancements(data.plannerEnhancements);
          genState.specialSlideScope = normalizeSpecialSlideScope(data.specialSlideScope);
          syncPlannerEnhancementControls();
          syncSpecialSlideScopeControl();
         persistSplitRulesDraft();
         renderSplitRulesPreview();
         renderBuilderLivePreview();
         genState.commonConfig = data.commonConfig ? deepClone(data.commonConfig) : createBasePromptConfig();
         genState.commonUserInput = normalizeCommonUserInput(data.commonUserInput);
         genState.commonDesignPackage = data.commonDesignPackage ? deepClone(data.commonDesignPackage) : null;
         genState.commonPromptPackageMeta = data.commonPromptPackageMeta
           ? deepClone(data.commonPromptPackageMeta)
           : normalizePromptPackageMeta({ designPackage: genState.commonDesignPackage, source: "loaded-project" });
         syncHeaderFooterWithDesignPackage(genState.commonPromptPackageMeta.enabledSlots);
         updateHeaderFooterStatus();
          renderPlannerContractStatus();
          if (Array.isArray(data.records)) {
              genState.records = data.records;
              updateRecordStats(genState.records);
             renderSlideList();
             if (genState.records.length) {
               refreshLatestOutput();
               selectSlide(0);
               updateResultAnnouncement(genState.records, genState.latestOutput.length);
               setMobilePanel("result");
             } else {
               genState.latestOutput = "";
               genState.currentIndex = 0;
               $("genOutput").textContent = "";
               $("genCharCount").textContent = "0";
               renderLintPanel(null);
               updateResultAnnouncement([], 0);
             }
          }
      }

      function getRecordPromptLint(record) {
         if (!record) return null;
         const promptDeck = window.PromptDeck;
         if (!promptDeck || typeof promptDeck.validateConfig !== "function") return null;
         const config = normalizePromptConfig(record) || genState.commonConfig || createBasePromptConfig();
         return promptDeck.validateConfig(
           config,
           { content: record.screenSpec, designContext: "", exclusions: "" },
           resolveCommonPromptLanguage()
         );
      }

      function summarizeDeckLint() {
         let issueCount = 0;
         let errorCount = 0;
         let warningCount = 0;

         genState.records.forEach((record) => {
           const lint = getRecordPromptLint(record);
           if (!lint) return;
           errorCount += lint.conflicts.length;
           warningCount += lint.warnings.length;
           issueCount += lint.conflicts.length + lint.warnings.length;
         });

         return { issueCount, errorCount, warningCount };
      }

      function localizeLintMessage(message) {
        const text = String(message || "");
        const emptyMatch = text.match(/^(.+?) is empty, so the slide intent may become ambiguous\.?$/i);
        if (emptyMatch) return `${emptyMatch[1]} 항목이 비어 있어 슬라이드 의도가 모호해질 수 있습니다.`;
        return text;
      }

      function renderLintPanelBase(record) {
         const badge = $("genLintBadge");
         const metrics = $("genLintMetrics");
         const list = $("genLintList");

         if (!badge || !metrics || !list) return;

        if (!record) {
          badge.textContent = "대기 중";
          metrics.innerHTML = "";
          list.innerHTML = '<div class="gen-lint-item ok">슬라이드를 선택하면 프롬프트 구조와 경고를 진단해 표시합니다.</div>';
          return;
        }

        const lint = getRecordPromptLint(record);
        if (!lint) {
          badge.textContent = "진단 불가";
          metrics.innerHTML = "";
          list.innerHTML = '<div class="gen-lint-item warning">PromptDeck 진단 API를 사용할 수 없습니다.</div>';
          return;
        }

        const issueCount = lint.conflicts.length + lint.warnings.length;
        badge.textContent = issueCount ? `${issueCount}건 이슈` : "정상";
        metrics.innerHTML = [
          `<span class="gen-lint-metric">페이지 유형: ${escapeHtml(lint.summary.pageLabel)}</span>`,
          `<span class="gen-lint-metric">비주얼 존재감: ${escapeHtml(deriveVisualPresence(record).labelKo)}</span>`,
          `<span class="gen-lint-metric">생성 경로: ${escapeHtml(deriveGenerationPlan(record.screenSpec).labelKo)}</span>`,
          deriveDiagramPlan(record.screenSpec).code !== "D0" ? `<span class="gen-lint-metric">도식 의미: ${deriveDiagramPlan(record.screenSpec).semanticReady ? "명확" : "보강 필요"}</span>` : "",
          `<span class="gen-lint-metric">프롬프트 길이: ${Number((record.prompt || "").length || lint.summary.promptLength || 0).toLocaleString("ko-KR")}자</span>`,
          `<span class="gen-lint-metric">구조 블록: ${lint.summary.partCount}</span>`,
          `<span class="gen-lint-metric">선택 그룹: ${lint.summary.selectedKeyCount}</span>`
        ].join("");

         const issues = [];
         lint.conflicts.forEach((item) => {
           issues.push(`<div class="gen-lint-item error">${escapeHtml(localizeLintMessage(item.message))}</div>`);
         });
         lint.warnings.forEach((item) => {
           issues.push(`<div class="gen-lint-item warning">${escapeHtml(localizeLintMessage(item.message))}</div>`);
         });

        if (!issues.length) {
          issues.push('<div class="gen-lint-item ok">현재 슬라이드 프롬프트 구조는 안정적입니다.</div>');
        }

         list.innerHTML = issues.join("");
      }

      function renderLintPanel(record) {
         const badge = $("genLintBadge");
         const metrics = $("genLintMetrics");
         const diffBox = $("genLintDiff");
         const list = $("genLintList");

         if (!badge || !metrics || !diffBox || !list) return;

        if (!record) {
          badge.textContent = "대기 중";
          metrics.innerHTML = "";
          diffBox.innerHTML = "";
          list.innerHTML = '<div class="gen-lint-item ok">슬라이드를 선택하면 프롬프트 구조와 변경점을 진단해 표시합니다.</div>';
          return;
        }

         const lint = getRecordPromptLint(record);
         const diff = getRecordConfigDiff(record);
        if (!lint) {
          badge.textContent = "진단 불가";
          metrics.innerHTML = "";
          diffBox.innerHTML = "";
          list.innerHTML = '<div class="gen-lint-item warning">PromptDeck 진단 API를 사용할 수 없습니다.</div>';
          return;
        }

        const issueCount = lint.conflicts.length + lint.warnings.length;
        badge.textContent = issueCount ? `${issueCount}건 이슈` : "정상";
        metrics.innerHTML = [
          `<span class="gen-lint-metric">페이지 유형: ${escapeHtml(lint.summary.pageLabel)}</span>`,
          `<span class="gen-lint-metric">비주얼 존재감: ${escapeHtml(deriveVisualPresence(record).labelKo)}</span>`,
          `<span class="gen-lint-metric">생성 경로: ${escapeHtml(deriveGenerationPlan(record.screenSpec).labelKo)}</span>`,
          deriveDiagramPlan(record.screenSpec).code !== "D0" ? `<span class="gen-lint-metric">도식 의미: ${deriveDiagramPlan(record.screenSpec).semanticReady ? "명확" : "보강 필요"}</span>` : "",
          `<span class="gen-lint-metric">프롬프트 길이: ${Number((record.prompt || "").length || lint.summary.promptLength || 0).toLocaleString("ko-KR")}자</span>`,
          `<span class="gen-lint-metric">구조 블록: ${lint.summary.partCount}</span>`,
          `<span class="gen-lint-metric">선택 그룹: ${lint.summary.selectedKeyCount}</span>`,
          `<span class="gen-lint-metric">개별 변경점: ${diff?.changeCount || 0}</span>`
        ].join("");

         if (diff?.changeCount) {
           const visibleChanges = diff.changes.slice(0, 6).map((item) => (
             `<div class="gen-lint-diff-item">${escapeHtml(item.summary)}</div>`
          ));
          if (diff.changeCount > visibleChanges.length) {
            visibleChanges.push(`<div class="gen-lint-diff-item">... 외 ${diff.changeCount - visibleChanges.length}건 추가 변경</div>`);
          }
          diffBox.innerHTML = [
            '<div class="gen-lint-diff-title">공통 설정 대비 개별 변경점</div>',
            `<div class="gen-lint-diff-list">${visibleChanges.join("")}</div>`
          ].join("");
        } else {
          diffBox.innerHTML = '<div class="gen-lint-diff-empty">공통 설정과 동일합니다.</div>';
        }

         const issues = [];
         lint.conflicts.forEach((item) => {
           issues.push(`<div class="gen-lint-item error">${escapeHtml(localizeLintMessage(item.message))}</div>`);
         });
         lint.warnings.forEach((item) => {
           issues.push(`<div class="gen-lint-item warning">${escapeHtml(localizeLintMessage(item.message))}</div>`);
         });

        if (!issues.length) {
          issues.push('<div class="gen-lint-item ok">현재 슬라이드 프롬프트 구조는 안정적인 상태입니다.</div>');
        }

         list.innerHTML = issues.join("");
      }

      async function copyOutput() {
         if (!genState.latestOutput) return setMessage("복사할 결과가 없습니다.");
         try {
           await navigator.clipboard.writeText(genState.latestOutput);
           const deckLint = summarizeDeckLint();
           const suffix = deckLint.issueCount ? ` (${deckLint.issueCount}건의 잔여 경고 있음)` : "";
           setMessage(`클립보드에 복사했습니다.${suffix}`, false);
         } catch {
           setMessage("전체 결과를 클립보드에 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해주세요.");
         }
      }

      async function copyCurrent() {
         const current = genState.records[genState.currentIndex];
         if (!current) return setMessage("복사할 슬라이드가 없습니다.");
         try {
           await navigator.clipboard.writeText(current.prompt);
           const lint = getRecordPromptLint(current);
           const suffix = lint && (lint.conflicts.length || lint.warnings.length)
             ? ` (${lint.conflicts.length + lint.warnings.length}건의 진단 이슈 있음)`
             : "";
           setMessage(`${displayNo(current)} 프롬프트를 복사했습니다.${suffix}`, false);
         } catch {
           setMessage(`${displayNo(current)} 프롬프트를 클립보드에 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해주세요.`);
         }
      }

      function downloadOutput() {
         if (!genState.latestOutput) return setMessage("다운로드할 결과가 없습니다.");
         const ext = genState.latestFormat === "jsonl" ? "jsonl" : "md";
         const blob = new Blob([genState.latestOutput], { type: "text/plain;charset=utf-8" });
         const url = URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = `slide_prompts_separated.${ext}`;
         document.body.appendChild(a);
         a.click();
         a.remove();
         URL.revokeObjectURL(url);
         const deckLint = summarizeDeckLint();
         const suffix = deckLint.issueCount ? ` (${deckLint.issueCount}건의 잔여 경고 있음)` : "";
         setMessage(`파일을 다운로드했습니다.${suffix}`, false);
      }

      function selectSlide(index) {
        if (!genState.records.length) { $("genOutput").textContent = ""; return; }
        if (genState.isEditing) {
          const current = genState.records[genState.currentIndex];
          const edited = $("genPromptEditor").value;
          if (current && edited !== current.prompt) {
            const ok = confirm("저장하지 않은 편집 내용이 있습니다. 저장하지 않고 이동할까요?");
            if (!ok) return;
          }
        }
        if (index < 0) index = 0;
        if (index >= genState.records.length) index = genState.records.length - 1;
        genState.currentIndex = index;
        genState.isEditing = false;
        renderCurrentPrompt();
        showViewer();
        $("genJumpInput").value = genState.records[index].slide_no;
        document.querySelectorAll(".gen-slide-item").forEach((el) => {
          el.classList.toggle("active", Number(el.dataset.index) === index);
        });
        const active = document.querySelector(`.gen-slide-item[data-index="${index}"]`);
        if (active) active.scrollIntoView({ block: "nearest" });
      }

      function renderCurrentPrompt() {
        const record = genState.records[genState.currentIndex];
        if (!record) {
          $("genOutput").textContent = "";
          renderLintPanel(null);
          return;
        }
        $("genOutput").textContent = record.prompt;
        renderLintPanel(record);
      }

      function openCurrentEditor() {
        const current = genState.records[genState.currentIndex];
        if (!current) return setMessage("편집할 슬라이드가 없습니다.");
        genState.isEditing = true;
        $("genPromptEditor").value = current.prompt;
        $("genOutput").style.display = "none";
        $("genEditorPanel").classList.add("active");
        $("genPromptEditor").focus();
        setMessage(`${displayNo(current)} 편집 모드입니다. 저장해야 결과에 반영됩니다.`, false);
      }

      function closeEditor() {
        genState.isEditing = false;
        showViewer();
        setMessage("보기 모드로 돌아왔습니다.", false);
      }

      function showViewer() {
        $("genOutput").style.display = "";
        $("genEditorPanel").classList.remove("active");
      }

      function saveCurrentEdit() {
        const current = genState.records[genState.currentIndex];
        if (!current) return setMessage("저장할 슬라이드가 없습니다.");
        const edited = $("genPromptEditor").value.trim();
        if (!edited) return setMessage("빈 프롬프트는 저장할 수 없습니다.");
        current.manualEditedPrompt = edited;
        current.prompt = edited;
        genState.savedPrompts[savedPromptKey(current)] = edited;
        persistSavedPrompts();
        refreshLatestOutput();
        renderCurrentPrompt();
        showViewer();
        genState.isEditing = false;
        setMessage(`${displayNo(current)} 편집 내용을 저장했습니다.`, false);
      }

      function restoreCurrentSaved() {
        const current = genState.records[genState.currentIndex];
        if (!current) return setMessage("복원할 슬라이드가 없습니다.");
        const saved = genState.savedPrompts[savedPromptKey(current)];
        if (!saved) return setMessage(`${displayNo(current)}에 저장된 값이 없습니다.`);
        current.manualEditedPrompt = saved;
        current.prompt = saved;
        $("genPromptEditor").value = saved;
        refreshLatestOutput();
        renderCurrentPrompt();
        showViewer();
        genState.isEditing = false;
        setMessage(`${displayNo(current)}를 저장된 값으로 복원했습니다.`, false);
      }

      function refreshLatestOutput() {
        if (!genState.records.length) return;
        genState.latestOutput = genState.latestFormat === "jsonl" ? toJsonl(genState.records) : toMarkdown(genState.records);
        $("genCharCount").textContent = genState.latestOutput.length.toLocaleString("ko-KR");
      }

      function jumpToSlide() {
        const raw = $("genJumpInput").value.trim().toUpperCase();
        if (!raw) return setMessage("이동할 슬라이드 번호를 입력해주세요. 예: 5, 05, A1");
        const isNumeric = /^\d+$/.test(raw);
        const index = genState.records.findIndex((record) => {
          const recordNo = String(record.slide_no || "").trim().toUpperCase();
          if (isNumeric && /^\d+$/.test(recordNo)) {
            return Number(recordNo) === Number(raw);
          }
          return recordNo === raw;
        });
        if (index < 0) return setMessage(`찾을 수 없는 번호입니다: ${raw}`);
        selectSlide(index);
        setMessage(`${displayNo(genState.records[index])}로 이동했습니다.`, false);
      }

      function normalizeStoredRecordType(record) {
        if (!record) return "slide";
        return normalizeRuleType(record.entryType) || (/^\d+$/.test(String(record.slide_no || "").trim()) ? "slide" : "appendix");
      }

      function isSlideRecord(record) {
        return normalizeStoredRecordType(record) === "slide";
      }

      function getRecordIdentity(record) {
        return `${normalizeStoredRecordType(record)}:${String(record?.slide_no || "").trim()}`;
      }

      function updateRecordStats(records) {
        const list = Array.isArray(records) ? records : [];
        $("genSlideCount").textContent = list.filter((record) => isSlideRecord(record)).length;
        $("genAppendixCount").textContent = list.filter((record) => !isSlideRecord(record)).length;
        $("genResultBadge").textContent = `${list.length} prompts`;
        const mobileCount = $("genMobileResultCount");
        if (mobileCount) mobileCount.textContent = String(list.length);
      }

      function displayNo(record) {
        if (isSlideRecord(record)) {
          return /^\d+$/.test(String(record.slide_no))
            ? `SLIDE ${String(record.slide_no).padStart(2, "0")}`
            : `SLIDE ${record.slide_no}`;
        }
        return `APPENDIX ${record.slide_no}`;
      }

      function promptId(record) {
        if (isSlideRecord(record)) {
          return /^\d+$/.test(String(record.slide_no))
            ? `slide_${String(record.slide_no).padStart(2, "0")}`
            : `slide_${String(record.slide_no).trim().toLowerCase()}`;
        }
        return `appendix_${String(record.slide_no).trim().toLowerCase()}`;
      }

      function simpleTextHash(value) {
        let hash = 2166136261;
        const text = String(value || "");
        for (let index = 0; index < text.length; index += 1) {
          hash ^= text.charCodeAt(index);
          hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
      }

      function savedPromptKey(record) {
        return `${promptId(record)}:${simpleTextHash(`${record?.title || ""}\n${record?.screenSpec || ""}`)}`;
      }

      function loadSavedPrompts() {
        try {
          const parsed = JSON.parse(localStorage.getItem("slidePromptGenerator.savedPrompts") || "{}");
          return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
        } catch {
          return {};
        }
      }

      function persistSavedPrompts() {
        try {
          localStorage.setItem("slidePromptGenerator.savedPrompts", JSON.stringify(genState.savedPrompts));
        } catch {
          setMessage("브라우저 저장소에 저장하지 못했습니다. 현재 화면에는 반영되지만 새로고침 후에는 유지되지 않을 수 있습니다.");
        }
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
      }

      function deepClone(value) {
        return value == null ? value : JSON.parse(JSON.stringify(value));
      }

      function findOption(key, text) {
        if (!text) return null;
        if (typeof text === "string" && text.startsWith("option:")) {
          const byId = window.pptConfigApi?.findOptionById;
          if (typeof byId === "function") {
            return byId(key, text);
          }
        }
        const byText = window.pptConfigApi?.findOptionByText;
        return typeof byText === "function" ? byText(key, text) : null;
      }

      function getAllowedOptionsForPageType(key, pageType) {
        const fn = window.pptConfigApi?.getAllowedOptionsForPageType;
        if (typeof fn === "function") return fn(key, pageType);
        return [];
      }

      function getPageRuleForType(pageType) {
        const fn = window.pptConfigApi?.getPageRuleForType;
        return typeof fn === "function" ? fn(pageType) : { disabledKeys: [], reasons: {} };
      }

      function getPageTypeLabel(pageTypeId) {
        const item = (window.pptConfigApi?.PAGE_TYPES || []).find((entry) => entry.id === pageTypeId);
        return item?.text || pageTypeId;
      }

      function cssEscape(value) {
        if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
        return String(value).replace(/[\"\\\\]/g, "\\$&");
      }

      function hasConfigurableOptions(key, pageType) {
        return getAllowedOptionsForPageType(key, pageType).length > 0;
      }

      function normalizeSelectionValue(key, value) {
        if (Array.isArray(value)) {
          return value
            .map((item) => normalizeSelectionValue(key, item))
            .filter(Boolean);
        }
        if (!value) return null;
        if (typeof value === "string") return findOption(key, value);
        if (typeof value === "object" && typeof value.text === "string") {
          return findOption(key, value.text) || value;
        }
        return null;
      }

      function normalizeSelections(selections) {
        const createSelections = window.pptConfigApi?.createEmptySelections;
        const next = typeof createSelections === "function" ? createSelections() : {};
        if (!selections || typeof selections !== "object") return next;

        Object.entries(selections).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            next[key] = normalizeSelectionValue(key, value);
            return;
          }
          next[key] = normalizeSelectionValue(key, value);
        });
        return next;
      }

      function hasAnySelections(selections) {
        if (!selections || typeof selections !== "object") return false;
        return Object.values(selections).some((value) => {
          if (Array.isArray(value)) return value.length > 0;
          return Boolean(value);
        });
      }

      function createBasePromptConfig() {
        const promptDeck = window.PromptDeck;
        if (promptDeck && typeof promptDeck.captureCurrentConfig === "function") {
          const captured = promptDeck.captureCurrentConfig();
          if (captured) return deepClone(captured);
        }

        const pptState = window.pptState;
        const createSelections = window.pptConfigApi?.createEmptySelections;
        const baseSelections = normalizeSelections(pptState?.selections);
        const fallbackSelections = normalizeSelections(genState.commonConfig?.selections);
        return {
          pageType: pptState?.pageType || genState.commonConfig?.pageType || "body",
          selections: hasAnySelections(baseSelections)
            ? baseSelections
            : (hasAnySelections(fallbackSelections)
              ? fallbackSelections
              : (typeof createSelections === "function" ? createSelections() : {})),
          colorSystem: pptState?.colorSystem
            ? deepClone(pptState.colorSystem)
            : (genState.commonConfig?.colorSystem ? deepClone(genState.commonConfig.colorSystem) : null),
          customRatio: pptState?.customRatio
            ? deepClone(pptState.customRatio)
            : (genState.commonConfig?.customRatio ? deepClone(genState.commonConfig.customRatio) : { width: 16, height: 9 }),
          barSettings: pptState?.barSettings
            ? deepClone(pptState.barSettings)
            : (genState.commonConfig?.barSettings ? deepClone(genState.commonConfig.barSettings) : null),
          promptSettings: pptState?.promptSettings
            ? deepClone(pptState.promptSettings)
            : (genState.commonConfig?.promptSettings ? deepClone(genState.commonConfig.promptSettings) : null),
          bgSolidColor: pptState?.bgSolidColor || genState.commonConfig?.bgSolidColor || "#F5F6F7",
          customPhotoSubject: typeof pptState?.customPhotoSubject === "string"
            ? pptState.customPhotoSubject
            : (genState.commonConfig?.customPhotoSubject || ""),
          promptLineOverrides: pptState?.promptLineOverrides
            ? deepClone(pptState.promptLineOverrides)
            : (genState.commonConfig?.promptLineOverrides ? deepClone(genState.commonConfig.promptLineOverrides) : {}),
        };
      }

      function normalizePromptConfig(record) {
        const promptDeck = window.PromptDeck;
        if (record?.promptConfig) {
          if (promptDeck && typeof promptDeck.normalizeConfig === "function") {
            return promptDeck.normalizeConfig(record.promptConfig);
          }
          return deepClone(record.promptConfig);
        }
        if (record?.selections) {
          const config = createBasePromptConfig();
          config.selections = normalizeSelections(record.selections);
          return config;
        }
        return null;
      }

      function applyPromptConfigToState(config, pptState) {
        if (!config || !pptState) return;
        if (config.pageType) pptState.pageType = config.pageType;
        if (config.selections) pptState.selections = deepClone(config.selections);
        if (config.colorSystem) pptState.colorSystem = deepClone(config.colorSystem);
        if (config.customRatio) pptState.customRatio = deepClone(config.customRatio);
        if (config.barSettings) pptState.barSettings = deepClone(config.barSettings);
        if (config.promptSettings) pptState.promptSettings = deepClone(config.promptSettings);
        if (config.bgSolidColor) pptState.bgSolidColor = config.bgSolidColor;
        if (typeof config.customPhotoSubject === "string") pptState.customPhotoSubject = config.customPhotoSubject;
        if (config.promptLineOverrides) pptState.promptLineOverrides = deepClone(config.promptLineOverrides);
      }

      function clearDisabledSelections(config) {
        const disabledKeys = getPageRuleForType(config.pageType).disabledKeys || [];
        disabledKeys.forEach((key) => {
          if (!(key in config.selections)) return;
          config.selections[key] = Array.isArray(config.selections[key]) ? [] : null;
        });
      }

      function clearAll() {
        $("genMdInput").value = "";
        $("genOutput").textContent = "";
        $("genSlideList").innerHTML = "";
        $("genJumpInput").value = "";
        $("genFileInput").value = "";
        $("genCharCount").textContent = "0";
        genState.latestOutput = "";
        genState.records = [];
        genState.currentIndex = 0;
        genState.isEditing = false;
        genState.configModalIndex = null;
        genState.configDraft = null;
        $("genPromptEditor").value = "";
        closeConfigModal();
        showViewer();
        renderLintPanel(null);
        updateRecordStats([]);
        updateResultAnnouncement([], 0);
        setMobilePanel("input");
        updateHeaderFooterStatus();
        renderPlannerContractStatus();
        renderSplitRulesPreview();
        renderBuilderLivePreview();
        setMessage("");
      }

      function renderSlideListBase() {
        const list = $("genSlideList");
        list.innerHTML = "";
        genState.records.forEach((record, index) => {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "gen-slide-item";
          item.dataset.index = String(index);
          item.innerHTML = `${displayNo(record)}<small>${escapeHtml(record.title)}</small>`;
          item.addEventListener("click", () => selectSlide(index));
          list.appendChild(item);
        });
      }

      function renderSlideList() {
        const list = $("genSlideList");
        list.innerHTML = "";
        genState.records.forEach((record, index) => {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "gen-slide-item";
          item.dataset.index = String(index);
          item.innerHTML = `${displayNo(record)}<small>${escapeHtml(record.title)}</small>`;
          item.addEventListener("click", () => selectSlide(index));
          list.appendChild(item);
        });
      }

      function openConfigModal(index) {
        const record = genState.records[index];
        if (!record) return;
        genState.configReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        genState.configModalIndex = index;
        genState.configDraft = normalizePromptConfig(record) || deepClone(genState.commonConfig) || createBasePromptConfig();
        const inferredPageType = inferPageTypeForRecord(record);
        if (genState.configDraft.pageType === "body" && inferredPageType !== "body") {
          genState.configDraft.pageType = inferredPageType;
          clearDisabledSelections(genState.configDraft);
        }
        renderConfigModal();
        $("genConfigModal").hidden = false;
        document.body.classList.add("modal-open");
        requestAnimationFrame(() => $("genConfigCloseBtn")?.focus());
      }

      function closeConfigModal() {
        const returnFocus = genState.configReturnFocus;
        genState.configModalIndex = null;
        genState.configDraft = null;
        genState.configReturnFocus = null;
        genState.commonPromptDraft = [];
        genState.executionPromptDraft = null;
        genState.headerFooterDraft = null;
        genState.configReturnFocus = null;
        $("genConfigModal").hidden = true;
        if ($("genSplitRulesModal").hidden) {
          document.body.classList.remove("modal-open");
        }
        if (returnFocus?.isConnected) returnFocus.focus();
      }

      function renderConfigModal() {
        const record = genState.records[genState.configModalIndex];
        const draft = genState.configDraft;
        if (!record || !draft) return;

        const configApi = window.pptConfigApi || {};
        const pageTypes = configApi.PAGE_TYPES || [];
        const sectionDefs = configApi.SECTION_DEFS || [];
        const optionMeta = configApi.OPTION_META || {};
        const coreFields = [];
        const advancedFields = [];
        const coreKeys = new Set(["mood", "layout", "content", "density"]);
        const pageRule = getPageRuleForType(draft.pageType);

        $("genConfigTitle").textContent = `${displayNo(record)} 개별 프롬프트 설정`;
        $("genConfigSubtitle").textContent = `${record.title || "제목 없음"} 슬라이드에만 적용됩니다.`;
        $("genConfigSummary").innerHTML = [
          `<span class="gen-config-chip">${escapeHtml(record.toc_number || "TOC 없음")}</span>`,
          `<span class="gen-config-chip">${escapeHtml(record.title || "제목 없음")}</span>`,
          `<span class="gen-config-chip">페이지 유형: ${escapeHtml(getPageTypeLabel(draft.pageType))}</span>`
        ].join("");

        const pageTypeOptions = pageTypes.map((item) => {
          const selected = item.id === draft.pageType ? " selected" : "";
          return `<option value="${escapeHtml(item.id)}"${selected}>${escapeHtml(item.text)}</option>`;
        }).join("");

        coreFields.push(`
          <section class="gen-config-group gen-config-group-wide">
            <label class="gen-config-label" for="genConfigPageType">페이지 유형</label>
            <p class="gen-config-guide">이 슬라이드가 표지, 본문, 구분, 맺음말 중 어떤 역할인지 지정합니다.</p>
            <select id="genConfigPageType" class="gen-select">
              ${pageTypeOptions}
            </select>
          </section>
        `);

        sectionDefs.forEach((section) => {
          section.groups.forEach((key) => {
            const meta = optionMeta[key];
            if (!meta || meta.mode === "custom" || !hasConfigurableOptions(key, draft.pageType)) return;
            const disabled = pageRule.disabledKeys.includes(key);
            const reason = disabled ? (pageRule.reasons[key] || "현재 페이지 유형에서는 이 항목을 사용할 수 없습니다.") : "";
            const options = getAllowedOptionsForPageType(key, draft.pageType);
            const value = draft.selections[key];

            let control = "";
            if (meta.mode === "multi") {
              control = `
                <div class="gen-config-checks ${disabled ? "is-disabled" : ""}">
                  ${options.map((option) => {
                    const checked = Array.isArray(value) && value.some((item) => item?.text === option.text) ? " checked" : "";
                    return `
                      <label class="gen-config-check">
                        <input type="checkbox" data-config-key="${escapeHtml(key)}" value="${escapeHtml(option.text)}"${checked}${disabled ? " disabled" : ""} />
                        <span>${escapeHtml(option.text)}</span>
                      </label>
                    `;
                  }).join("")}
                </div>
              `;
            } else {
              const optionList = [`<option value="">선택 안 함</option>`].concat(options.map((option) => {
                const selected = value?.text === option.text ? " selected" : "";
                return `<option value="${escapeHtml(option.text)}"${selected}>${escapeHtml(option.text)}</option>`;
              })).join("");
              control = `
                <select id="genConfigField-${escapeHtml(key)}" class="gen-select" data-config-key="${escapeHtml(key)}"${disabled ? " disabled" : ""}>
                  ${optionList}
                </select>
              `;
            }

            const targetFields = coreKeys.has(key) ? coreFields : advancedFields;
            targetFields.push(`
              <section class="gen-config-group ${meta.wide ? "gen-config-group-wide" : ""}">
                <label class="gen-config-label"${meta.mode === "multi" ? "" : ` for="genConfigField-${escapeHtml(key)}"`}>${escapeHtml(meta.label)}</label>
                <p class="gen-config-guide">${escapeHtml(meta.guide || "")}</p>
                ${disabled ? `<p class="gen-config-disabled">${escapeHtml(reason)}</p>` : ""}
                ${control}
              </section>
            `);
          });
        });

        const colorLabels = {
          primary: "주조색",
          secondary: "보조색",
          accent: "강조색",
          backgroundBlock: "배경 블록색",
          text: "본문 글자색",
        };
        const colorInputs = Object.entries(colorLabels).map(([key, label]) => `
          <label class="gen-config-compact-field">
            <span>${label}</span>
            <input type="color" data-config-color-key="${key}" value="${escapeHtml(draft.colorSystem?.[key] || "#000000")}" />
            <code>${escapeHtml(String(draft.colorSystem?.[key] || "#000000").toUpperCase())}</code>
          </label>
        `).join("");

        const photoCompositeValues = Array.isArray(draft.selections?.["photo-composite"])
          ? draft.selections["photo-composite"]
          : (draft.selections?.["photo-composite"] ? [draft.selections["photo-composite"]] : []);
        const customPhotoDisabled = !photoCompositeValues.some((item) => item?.text && item.text !== "사용 안 함");

        advancedFields.push(`
          <section class="gen-config-group gen-config-group-wide">
            <label class="gen-config-label">색상 시스템</label>
            <p class="gen-config-guide">공통 프롬프트의 색상을 이 슬라이드에서만 변경합니다.</p>
            <div class="gen-config-compact-grid">${colorInputs}</div>
            <label class="gen-config-range-field">
              <span>강조색 사용 비율 <strong id="genConfigAccentWeightValue">${Number(draft.colorSystem?.accentWeight) || 0}%</strong></span>
              <input type="range" min="0" max="40" step="1" data-config-accent-weight value="${Number(draft.colorSystem?.accentWeight) || 0}" />
            </label>
          </section>
        `);

        advancedFields.push(`
          <section class="gen-config-group">
            <label class="gen-config-label">화면 비율</label>
            <p class="gen-config-guide">사용자 정의 화면 비율 값을 조정합니다.</p>
            <div class="gen-config-number-row">
              <label><span>너비</span><input class="gen-input-text" type="number" min="1" max="100" data-config-ratio="width" value="${Number(draft.customRatio?.width) || 16}" /></label>
              <label><span>높이</span><input class="gen-input-text" type="number" min="1" max="100" data-config-ratio="height" value="${Number(draft.customRatio?.height) || 9}" /></label>
            </div>
          </section>
          <section class="gen-config-group">
            <label class="gen-config-label">단색 배경</label>
            <p class="gen-config-guide">단색 배경 옵션에서 사용할 색상입니다.</p>
            <label class="gen-config-compact-field gen-config-single-color">
              <span>배경색</span>
              <input type="color" data-config-bg-color value="${escapeHtml(draft.bgSolidColor || "#F5F6F7")}" />
              <code>${escapeHtml(String(draft.bgSolidColor || "#F5F6F7").toUpperCase())}</code>
            </label>
          </section>
          <section class="gen-config-group gen-config-group-wide">
            <label class="gen-config-label" for="genConfigCustomPhotoSubject">실사 소재 직접 입력</label>
            <p class="gen-config-guide">실사 이미지 소재를 쉼표로 구분해 직접 지정합니다.</p>
            ${customPhotoDisabled ? '<p class="gen-config-disabled">먼저 실사 합성 적용 요소를 선택해야 프롬프트에 반영됩니다.</p>' : ""}
            <input id="genConfigCustomPhotoSubject" class="gen-input-text" type="text" data-config-photo-subject value="${escapeHtml(draft.customPhotoSubject || "")}" placeholder="예) 배터리 셀, 생산라인, 연구원, 품질검사 장비"${customPhotoDisabled ? " disabled" : ""} />
          </section>
        `);

        const renderBarFields = (prefix, label, min, max) => {
          const enabledKey = `${prefix}Enabled`;
          const heightKey = `${prefix}Height`;
          const colorKey = `${prefix}Color`;
          return `
            <section class="gen-config-group">
              <label class="gen-config-label">${label}</label>
              <label class="gen-config-toggle-field">
                <input type="checkbox" data-config-bar-key="${enabledKey}"${draft.barSettings?.[enabledKey] ? " checked" : ""} />
                <span>${label} 사용</span>
              </label>
              <label class="gen-config-range-field">
                <span>높이 <strong>${Number(draft.barSettings?.[heightKey]) || min}px</strong></span>
                <input type="range" min="${min}" max="${max}" step="2" data-config-bar-key="${heightKey}" value="${Number(draft.barSettings?.[heightKey]) || min}" />
              </label>
              <label class="gen-config-compact-field gen-config-single-color">
                <span>색상</span>
                <input type="color" data-config-bar-key="${colorKey}" value="${escapeHtml(draft.barSettings?.[colorKey] || "#004DB0")}" />
                <code>${escapeHtml(String(draft.barSettings?.[colorKey] || "#004DB0").toUpperCase())}</code>
              </label>
            </section>
          `;
        };
        advancedFields.push(renderBarFields("header", "상단바", 20, 100));
        advancedFields.push(renderBarFields("footer", "하단바", 10, 60));

        advancedFields.push(`
          <section class="gen-config-group gen-config-group-wide">
            <label class="gen-config-label">프롬프트 출력 설정</label>
            <div class="gen-config-output-settings">
              <label class="gen-config-toggle-field">
                <input type="checkbox" data-config-prompt-setting="addPreamble"${draft.promptSettings?.addPreamble ? " checked" : ""} />
                <span>역할 지시문 포함</span>
              </label>
              <label class="gen-config-toggle-field">
                <input type="checkbox" data-config-prompt-setting="koreanContent"${draft.promptSettings?.koreanContent ? " checked" : ""} />
                <span>텍스트 원문 보존</span>
              </label>
              <label class="gen-config-inline-select">
                <span>출력 형식</span>
                <select class="gen-select" data-config-output-mode>
                  <option value="block"${draft.promptSettings?.outputMode !== "prose" ? " selected" : ""}>블록형</option>
                  <option value="prose"${draft.promptSettings?.outputMode === "prose" ? " selected" : ""}>자연어형</option>
                </select>
              </label>
            </div>
          </section>
        `);

        const promptEntries = window.PromptDeck?.getPromptEditorEntries?.(draft) || [];
        if (promptEntries.length) {
          advancedFields.push(`
            <details class="gen-config-group gen-config-group-wide gen-config-overrides">
              <summary>선택 항목 프롬프트 직접 수정 <span>${promptEntries.length}개 문장</span></summary>
              <p class="gen-config-guide">비워 두면 기본 문장을 사용합니다. 한글·영문 프롬프트를 각각 수정할 수 있습니다.</p>
              <div class="gen-config-override-list">
                ${promptEntries.map((entry) => {
                  const current = draft.promptLineOverrides?.[entry.id] || {};
                  return `
                    <section class="gen-config-override-item">
                      <strong>${escapeHtml(entry.sourceLabel || entry.sectionLabelKo || "프롬프트 문장")}</strong>
                      <label><span>한글</span><textarea data-config-override-id="${escapeHtml(entry.id)}" data-config-override-lang="ko" placeholder="${escapeHtml(entry.ko || "")}">${escapeHtml(current.ko || "")}</textarea></label>
                      <label><span>영문</span><textarea data-config-override-id="${escapeHtml(entry.id)}" data-config-override-lang="en" placeholder="${escapeHtml(entry.en || "")}">${escapeHtml(current.en || "")}</textarea></label>
                    </section>
                  `;
                }).join("")}
              </div>
            </details>
          `);
        }

        $("genConfigFields").innerHTML = `
          <div class="gen-config-section-heading">
            <strong>핵심 표현 전략</strong>
            <span>슬라이드 역할, 스타일, 레이아웃, 도식과 정보 밀도를 먼저 조정하세요.</span>
          </div>
          <div class="gen-config-core-fields">${coreFields.join("")}</div>
          <details class="gen-config-more">
            <summary>상세 디자인 설정 <span>${advancedFields.length}개 영역</span></summary>
            <div class="gen-config-advanced-fields">${advancedFields.join("")}</div>
          </details>
        `;
        bindConfigModalInputs();
        updateConfigModalPreview();
      }

      function bindConfigModalInputs() {
        const pageTypeInput = $("genConfigPageType");
        if (pageTypeInput) {
          pageTypeInput.addEventListener("change", () => {
            if (!genState.configDraft) return;
            genState.configDraft.pageType = pageTypeInput.value || "body";
            clearDisabledSelections(genState.configDraft);
            rerenderConfigModalPreservingScroll();
          });
        }

        document.querySelectorAll("#genConfigFields select[data-config-key]").forEach((input) => {
          input.addEventListener("change", () => {
            if (!genState.configDraft) return;
            genState.configDraft.selections[input.dataset.configKey] = findOption(input.dataset.configKey, input.value);
            rerenderConfigModalPreservingScroll();
          });
        });

        document.querySelectorAll("#genConfigFields input[type='checkbox'][data-config-key]").forEach((input) => {
          input.addEventListener("change", () => {
            if (!genState.configDraft) return;
            const key = input.dataset.configKey;
            const values = Array.from(document.querySelectorAll(`#genConfigFields input[type='checkbox'][data-config-key='${cssEscape(key)}']:checked`))
              .map((el) => findOption(key, el.value))
              .filter(Boolean);
            genState.configDraft.selections[key] = values;
            rerenderConfigModalPreservingScroll();
          });
        });

        document.querySelectorAll("#genConfigFields input[data-config-color-key]").forEach((input) => {
          input.addEventListener("input", () => {
            if (!genState.configDraft?.colorSystem) return;
            genState.configDraft.colorSystem[input.dataset.configColorKey] = input.value.toUpperCase();
            const code = input.closest("label")?.querySelector("code");
            if (code) code.textContent = input.value.toUpperCase();
            updateConfigModalPreview();
          });
        });

        const accentWeight = document.querySelector("#genConfigFields input[data-config-accent-weight]");
        accentWeight?.addEventListener("input", () => {
          if (!genState.configDraft?.colorSystem) return;
          genState.configDraft.colorSystem.accentWeight = Number(accentWeight.value) || 0;
          const value = $("genConfigAccentWeightValue");
          if (value) value.textContent = `${genState.configDraft.colorSystem.accentWeight}%`;
          updateConfigModalPreview();
        });

        document.querySelectorAll("#genConfigFields input[data-config-ratio]").forEach((input) => {
          input.addEventListener("input", () => {
            if (!genState.configDraft?.customRatio) return;
            genState.configDraft.customRatio[input.dataset.configRatio] = Math.max(1, Number(input.value) || 1);
            updateConfigModalPreview();
          });
        });

        const bgColor = document.querySelector("#genConfigFields input[data-config-bg-color]");
        bgColor?.addEventListener("input", () => {
          if (!genState.configDraft) return;
          genState.configDraft.bgSolidColor = bgColor.value.toUpperCase();
          const code = bgColor.closest("label")?.querySelector("code");
          if (code) code.textContent = genState.configDraft.bgSolidColor;
          updateConfigModalPreview();
        });

        const customPhotoSubject = document.querySelector("#genConfigFields input[data-config-photo-subject]");
        customPhotoSubject?.addEventListener("input", () => {
          if (!genState.configDraft) return;
          genState.configDraft.customPhotoSubject = customPhotoSubject.value;
          updateConfigModalPreview();
        });

        document.querySelectorAll("#genConfigFields input[data-config-bar-key]").forEach((input) => {
          input.addEventListener("input", () => {
            if (!genState.configDraft?.barSettings) return;
            const key = input.dataset.configBarKey;
            genState.configDraft.barSettings[key] = input.type === "checkbox"
              ? input.checked
              : input.type === "range"
                ? Number(input.value)
                : input.value.toUpperCase();
            const strong = input.closest("label")?.querySelector("strong");
            if (strong && input.type === "range") strong.textContent = `${input.value}px`;
            const code = input.closest("label")?.querySelector("code");
            if (code && input.type === "color") code.textContent = input.value.toUpperCase();
            updateConfigModalPreview();
          });
        });

        document.querySelectorAll("#genConfigFields input[data-config-prompt-setting]").forEach((input) => {
          input.addEventListener("change", () => {
            if (!genState.configDraft?.promptSettings) return;
            genState.configDraft.promptSettings[input.dataset.configPromptSetting] = input.checked;
            updateConfigModalPreview();
          });
        });

        const outputMode = document.querySelector("#genConfigFields select[data-config-output-mode]");
        outputMode?.addEventListener("change", () => {
          if (!genState.configDraft?.promptSettings) return;
          genState.configDraft.promptSettings.outputMode = outputMode.value === "prose" ? "prose" : "block";
          updateConfigModalPreview();
        });

        document.querySelectorAll("#genConfigFields textarea[data-config-override-id]").forEach((input) => {
          input.addEventListener("input", () => {
            if (!genState.configDraft) return;
            const entryId = input.dataset.configOverrideId;
            const lang = input.dataset.configOverrideLang;
            if (!genState.configDraft.promptLineOverrides) genState.configDraft.promptLineOverrides = {};
            if (!genState.configDraft.promptLineOverrides[entryId]) {
              genState.configDraft.promptLineOverrides[entryId] = { ko: "", en: "" };
            }
            genState.configDraft.promptLineOverrides[entryId][lang] = input.value;
            const current = genState.configDraft.promptLineOverrides[entryId];
            if (!current.ko && !current.en) delete genState.configDraft.promptLineOverrides[entryId];
            updateConfigModalPreview();
          });
        });
      }

      function normalizeDeckMetadataHeading(title) {
        return cleanTitle(String(title || ""))
          .replace(/〔[^〕]*〕/g, "")
          .replace(/\([^)]*\)/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();
      }

      function isDeckMetadataHeading(title) {
        const normalized = normalizeDeckMetadataHeading(title);
        return /^(덱|전역)\s*메타데이터$/.test(normalized)
          || /^(deck|global)\s+metadata$/.test(normalized);
      }

      function isPresentationContextHeading(title) {
        const normalized = normalizeDeckMetadataHeading(title);
        return /^(발표|프레젠테이션)\s*맥락$/.test(normalized)
          || /^presentation\s+context$/.test(normalized);
      }

      function isSessionPlanHeading(title) {
        const normalized = normalizeDeckMetadataHeading(title);
        return /^세션\s*설계$/.test(normalized)
          || /^session\s+(?:plan|design)$/.test(normalized);
      }

      function parseContextListItem(line) {
        const item = String(line || "").match(/^\s*[-*+]\s+([^:：]+?)\s*[:：]\s*(.+?)\s*$/);
        if (!item) return null;
        const label = item[1].trim();
        const value = item[2].trim();
        if (!label || !value || /^(없음|미정|해당\s*없음|none|n\/a)$/i.test(value)) return null;
        return { label, value };
      }

      function parseSessionRange(text) {
        const match = String(text || "").match(/(?:슬라이드|slides?)\s*(\d{1,3})\s*(?:[-–~]|부터)\s*(\d{1,3})/i);
        if (!match) return null;
        return { start: Number(match[1]), end: Number(match[2]) };
      }

      function extractDeckContext(preamble, deckMetadata = []) {
        const lines = String(preamble || "").split(/\r?\n/);
        const presentation = [];
        const sessions = [];
        let mode = "";
        let rootLevel = 0;
        let currentSession = null;
        let inFence = false;

        lines.forEach((line) => {
          if (/^\s*```/.test(line)) { inFence = !inFence; return; }
          if (inFence) return;
          const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
          if (heading) {
            const level = heading[1].length;
            if (isPresentationContextHeading(heading[2])) {
              mode = "presentation";
              rootLevel = level;
              currentSession = null;
              return;
            }
            if (isSessionPlanHeading(heading[2])) {
              mode = "sessions";
              rootLevel = level;
              currentSession = null;
              return;
            }
            if (mode === "sessions" && level > rootLevel) {
              currentSession = { title: normalizePlannerHeading(heading[2]), entries: [], range: parseSessionRange(heading[2]) };
              sessions.push(currentSession);
              return;
            }
            if (mode && level <= rootLevel) {
              mode = "";
              currentSession = null;
            }
            return;
          }
          const entry = parseContextListItem(line);
          if (!entry) return;
          if (mode === "presentation" && presentation.length < 20) presentation.push(entry);
          if (mode === "sessions" && currentSession && currentSession.entries.length < 12) {
            currentSession.entries.push(entry);
            currentSession.range ||= parseSessionRange(`${entry.label}: ${entry.value}`);
          }
        });

        const presentationKeys = new Set(presentation.map((entry) => normalizeMetadataFieldKey(entry.label)));
        deckMetadata.forEach((entry) => {
          const key = normalizeMetadataFieldKey(entry.label);
          if (!/^(발표대상|청중|청중수준|발표목적|발표시간|원하는판단|원하는행동|청중의현재인식|현재인식|발표후목표인식|목표인식|핵심인식장벽|핵심장벽|governingthought)$/.test(key) || presentationKeys.has(key)) return;
          presentation.push(entry);
          presentationKeys.add(key);
        });
        return { presentation, sessions };
      }

      function findContextValue(entries, patterns) {
        return (Array.isArray(entries) ? entries : []).find((entry) => patterns.some((pattern) => pattern.test(normalizeMetadataFieldKey(entry.label))))?.value || "";
      }

      function appendDeckContext(screenSpec, deckContext, context) {
        if (/^###\s+(?:발표\s*맥락\s*및\s*세션\s*위치|Presentation\s+Context\s+and\s+Session)/mi.test(String(screenSpec || ""))) return String(screenSpec || "").trim();
        const project = genState.commonDesignPackage?.project || {};
        const entries = deckContext?.presentation || [];
        const slideNumber = Number(String(context?.slideNo || "").match(/\d+/)?.[0]);
        const session = (deckContext?.sessions || []).find((item) => item.range && slideNumber >= item.range.start && slideNumber <= item.range.end)
          || (deckContext?.sessions || []).find((item) => !item.range)
          || null;
        const audience = findContextValue(entries, [/^(발표대상|청중)$/]) || project.audience || "";
        const level = findContextValue(entries, [/^청중수준$/]) || project.audienceLevel || "";
        const purpose = findContextValue(entries, [/^발표목적$/]) || project.presentationPurpose || "";
        const desired = findContextValue(entries, [/^(발표후원하는판단또는행동|원하는판단|원하는행동)$/]) || project.desiredAction || "";
        const duration = findContextValue(entries, [/^발표시간$/]) || (project.durationMinutes ? `${project.durationMinutes}분` : "");
        const governing = findContextValue(entries, [/^governingthought$/]);
        const currentPerception = findContextValue(entries, [/^(청중의현재인식|현재인식)$/]) || project.currentPerception || "";
        const targetPerception = findContextValue(entries, [/^(발표후목표인식|목표인식)$/]) || project.targetPerception || "";
        const keyBarrier = findContextValue(entries, [/^(핵심인식장벽|핵심장벽)$/]) || project.keyBarrier || "";
        const governingThought = governing || project.governingThought || "";
        const contextEntries = [
          audience && ["발표 대상", audience],
          level && ["청중 수준", level],
          purpose && ["발표 목적", purpose],
          duration && ["발표 시간", duration],
          desired && ["발표 후 원하는 판단 또는 행동", desired],
          currentPerception && ["청중의 현재 인식", currentPerception],
          targetPerception && ["발표 후 목표 인식", targetPerception],
          keyBarrier && ["핵심 인식 장벽", keyBarrier],
          governingThought && ["Governing Thought", governingThought],
        ].filter(Boolean);
        if (!contextEntries.length && !session) return String(screenSpec || "").trim();
        const isEnglish = context?.lang === "en";
        const lines = isEnglish
          ? [
              "### Presentation Context and Session Position 〔non-display; for independent slide generation〕",
              "Use this context to adapt terminology, information density, evidence emphasis, and explanation style. Do not render these labels or values as body copy unless they also appear under Screen Content.",
              ...contextEntries.map(([label, value]) => `- ${label}: ${value}`),
              ...(session ? [`- Current session: ${session.title}`, ...session.entries.map(({ label, value }) => `- Session ${label}: ${value}`)] : []),
            ]
          : [
              "### 발표 맥락 및 세션 위치 〔화면 비표시·독립 이미지 생성용〕",
              "이 맥락을 용어 난이도·정보 밀도·근거 강조·설명 방식에 적용한다. 아래 필드명과 값은 ‘양식’ 또는 ‘콘텐츠’에도 있는 경우를 제외하면 화면 문구로 렌더링하지 않는다.",
              ...contextEntries.map(([label, value]) => `- ${label}: ${value}`),
              ...(session ? [`- 현재 세션: ${session.title}`, ...session.entries.map(({ label, value }) => `- ${/^세션\s*/.test(label) ? label : `세션 ${label}`}: ${value}`)] : []),
            ];
        return [String(screenSpec || "").trim(), lines.join("\n")].filter(Boolean).join("\n\n");
      }

      function isRuntimeMetadataLabel(label) {
        const normalized = String(label || "").replace(/\s+/g, "").toLowerCase();
        return /^(현재슬라이드번호|슬라이드식별번호|현재페이지|현재페이지순번|전체슬라이드수|전체페이지수|페이지번호표기값|슬라이드유형)$/.test(normalized)
          || /^(currentslidenumber|slideidentifier|currentpage|currentpageindex|totalslides|totalpages|pagenumberdisplay|slidetype)$/.test(normalized);
      }

      function extractDeckMetadata(preamble) {
        const lines = String(preamble || "").split(/\r?\n/);
        const entries = [];
        let activeHeadingLevel = 0;
        let inFence = false;

        lines.forEach((line) => {
          if (/^\s*```/.test(line)) {
            inFence = !inFence;
            return;
          }
          if (inFence) return;

          const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
          if (heading) {
            const level = heading[1].length;
            if (isDeckMetadataHeading(heading[2])) {
              activeHeadingLevel = level;
              return;
            }
            if (activeHeadingLevel && level <= activeHeadingLevel) activeHeadingLevel = 0;
            return;
          }

          if (!activeHeadingLevel || entries.length >= 30) return;
          const item = line.match(/^\s*[-*+]\s+([^:：]+?)\s*[:：]\s*(.+?)\s*$/);
          if (!item) return;

          const label = item[1].trim();
          const value = item[2].trim();
          if (!label || !value || /^(없음|미정|해당\s*없음|none|n\/a)$/i.test(value) || isRuntimeMetadataLabel(label)) return;
          entries.push({ label, value });
        });

        return entries;
      }

      function findDeckMetadataValue(entries, labelPattern) {
        return (Array.isArray(entries) ? entries : []).find((entry) => labelPattern.test(normalizeMetadataFieldKey(entry.label)))?.value || "";
      }

      function pageNumberPolicyAllows(deckMetadata, context) {
        const policy = findDeckMetadataValue(deckMetadata, /^(페이지번호정책|pagenumberpolicy)$/).replace(/\s+/g, "").toLowerCase();
        if (!policy) return true;
        if (/표시안함|미표시|사용안함|없음|none|off|hidden/.test(policy)) return false;
        if (/본문만|bodyonly/.test(policy)) return context?.entryType === "slide" && context?.pageType === "body";
        return true;
      }

      function collectSlideHeaderFooterKeys(screenSpec) {
        const keys = new Set();
        let activeType = "";
        let activeLevel = 0;
        String(screenSpec || "").split(/\r?\n/).forEach((line) => {
          const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
          if (heading) {
            const level = heading[1].length;
            if (activeType && level <= activeLevel) activeType = "";
            const nextType = classifyHeaderFooterHeading(heading[2]);
            if (nextType) {
              activeType = nextType;
              activeLevel = level;
            }
            return;
          }
          const item = line.match(/^\s*[-*+]\s+(?:\*\*)?([^:：*]+?)(?:\*\*)?\s*[:：]\s*(.+?)\s*$/);
          if (!item) return;
          const type = classifyHeaderFooterField(item[1], activeType);
          if (type) keys.add(canonicalHeaderFooterFieldKey(item[1], type));
        });
        return keys;
      }

      function appendHeaderFooterMetadata(screenSpec, deckMetadata, context) {
        if (SPECIAL_PAGE_TYPES.has(String(context?.pageType || ""))) return String(screenSpec || "").trim();
        const settings = normalizeHeaderFooterSettings(context?.headerFooterSettings);
        if (!settings.headerEnabled && !settings.footerEnabled) return String(screenSpec || "").trim();
        const total = Math.max(1, Number(context?.total) || 1);
        const index = Math.max(0, Number(context?.index) || 0);
        const digits = Math.max(2, String(total).length);
        const currentPage = String(index + 1).padStart(digits, "0");
        const totalPages = String(total).padStart(digits, "0");
        const slideNo = String(context?.slideNo || currentPage);
        const isEnglish = context?.lang === "en";
        const entryType = context?.entryType === "appendix"
          ? (isEnglish ? "appendix" : "부록")
          : (isEnglish ? "body slide" : "본문 슬라이드");
        const slideFieldKeys = collectSlideHeaderFooterKeys(screenSpec);
        const globalEntries = new Map();
        deckMetadata.forEach(({ label, value }) => {
          const type = classifyHeaderFooterField(label);
          if (!type || !headerFooterFieldIsSelected(settings, type, label)) return;
          const key = normalizeMetadataFieldKey(label);
          if (/^(페이지번호정책|pagenumberpolicy)$/.test(key)) return;
          const canonicalKey = canonicalHeaderFooterFieldKey(label, type);
          if (slideFieldKeys.has(canonicalKey)) return;
          globalEntries.set(canonicalKey, `- ${label}: ${value}`);
        });
        const commonEntries = [...globalEntries.values()];
        const includeTitle = false;
        const includeSlideId = headerFooterFieldIsSelected(settings, "header", "__slide_id") && !slideFieldKeys.has("__slide_id");
        const includeSlideType = headerFooterFieldIsSelected(settings, "header", "__slide_type") && !slideFieldKeys.has("__slide_type");
        const includePageNumber = headerFooterFieldIsSelected(settings, "footer", "__page_number") && !slideFieldKeys.has("__page_number") && pageNumberPolicyAllows(deckMetadata, context);
        if (!commonEntries.length && !includeTitle && !includeSlideId && !includeSlideType && !includePageNumber) return String(screenSpec || "").trim();
        const lines = isEnglish
          ? [
              "### Deck Metadata 〔header/footer control; render values only when enabled〕",
              "Use each selected field as a dynamic named slot in the enabled header or footer region. Category names may vary by deck; preserve the supplied category-value pairing, do not invent fixed categories, and do not place this metadata in the body.",
              ...commonEntries,
              ...(includeTitle ? [`- Slide title: ${context.title}`] : []),
              ...(includeSlideId ? [`- Slide identifier: ${slideNo}`] : []),
              ...(includeSlideType ? [`- Slide type: ${entryType}`] : []),
              ...(includePageNumber ? [`- Page number display: ${currentPage} / ${totalPages}`] : []),
            ]
          : [
              "### 덱 메타데이터 〔헤더·푸터 제어용 / 활성 슬롯의 값만 표시〕",
              "선택된 각 항목을 활성 헤더 또는 푸터 영역의 동적 명명 슬롯으로 사용한다. 덱마다 달라질 수 있는 카테고리명과 값의 연결을 그대로 보존하고 고정 카테고리를 임의로 만들지 않으며, 이 메타데이터를 본문에 배치하지 않는다.",
              ...commonEntries,
              ...(includeTitle ? [`- 슬라이드 제목: ${context.title}`] : []),
              ...(includeSlideId ? [`- 슬라이드 식별 번호: ${slideNo}`] : []),
              ...(includeSlideType ? [`- 슬라이드 유형: ${entryType}`] : []),
              ...(includePageNumber ? [`- 페이지 번호 표기값: ${currentPage} / ${totalPages}`] : []),
            ];

        return [String(screenSpec || "").trim(), lines.join("\n")].filter(Boolean).join("\n\n");
      }

      function rerenderConfigModalPreservingScroll() {
        const body = $("genConfigModal")?.querySelector(".gen-modal-body");
        const scrollTop = body?.scrollTop || 0;
        const advancedOpen = Boolean($("genConfigModal")?.querySelector(".gen-config-more")?.open);
        renderConfigModal();
        const advanced = $("genConfigModal")?.querySelector(".gen-config-more");
        if (advanced) advanced.open = advancedOpen;
        if (body) body.scrollTop = scrollTop;
      }

      function updateConfigModalPreview() {
        const draft = genState.configDraft;
        const preview = $("genConfigPromptPreview");
        const changeSummary = $("genConfigChangeSummary");
        if (!draft || !preview) return;

        const promptDeck = window.PromptDeck;
        const lang = resolveCommonPromptLanguage();
        const diff = promptDeck?.diffConfig?.(genState.commonConfig || createBasePromptConfig(), draft, lang);
        if (changeSummary) {
          const count = diff?.changeCount || 0;
          changeSummary.textContent = count
            ? `공통 설정과 다른 항목 ${count}개 · 저장 시 전체 프롬프트를 다시 생성합니다.`
            : "공통 설정과 동일합니다. 저장해도 별도 설정을 만들지 않습니다.";
          changeSummary.classList.toggle("is-changed", count > 0);
        }

        if (typeof promptDeck?.buildPromptFromConfig !== "function") {
          preview.textContent = "프롬프트 미리보기를 생성할 수 없습니다.";
          return;
        }

        try {
          preview.textContent = promptDeck.buildPromptFromConfig(
            draft,
            normalizeCommonUserInput(genState.commonUserInput),
            lang
          );
        } catch (error) {
          preview.textContent = `미리보기 생성 실패: ${error.message || error}`;
        }
      }

      function saveConfigModal() {
        const index = genState.configModalIndex;
        const record = genState.records[index];
        const draft = genState.configDraft;
        if (!record || !draft) return;

        const validation = window.PromptDeck?.validateConfig?.(draft);
        if (validation?.conflicts?.length) {
          const preview = validation.conflicts
            .slice(0, 3)
            .map((item) => `- ${item.message}`)
            .join("\n");
          const okWithConflicts = confirm(`이 슬라이드 설정에는 충돌 가능성이 있는 조합이 있습니다.\n\n${preview}\n\n그래도 저장할까요?`);
          if (!okWithConflicts) return;
        }

        if (record.manualEditedPrompt) {
          const ok = confirm("이 슬라이드에는 수동 편집한 프롬프트가 있습니다. 개별 설정으로 다시 생성하면 수동 편집본을 덮어씁니다. 계속할까요?");
          if (!ok) return;
        }

        const commonDiff = window.PromptDeck?.diffConfig?.(
          genState.commonConfig || createBasePromptConfig(),
          draft,
          resolveCommonPromptLanguage()
        );
        record.promptConfig = commonDiff?.changeCount ? deepClone(draft) : null;
        record.selections = record.promptConfig ? deepClone(draft.selections) : null;
        record.manualEditedPrompt = "";
        delete genState.savedPrompts[savedPromptKey(record)];
        persistSavedPrompts();
        record.prompt = generateSingleSlidePrompt(record, getEffectiveCommonPrompt().trim());

        refreshLatestOutput();
        renderSlideList();
        selectSlide(index);
        closeConfigModal();
        const individualSpecialDesign = usesIndividualSpecialSlideDesign(record);
        setMessage(
          individualSpecialDesign
            ? `${displayNo(record)} 설정을 저장했습니다. 특수 슬라이드의 개별 구성과 공통 정체성 브리지를 함께 사용합니다.`
            : (record.promptConfig
              ? `${displayNo(record)} 설정으로 전체 프롬프트를 다시 생성했습니다.`
              : `${displayNo(record)} 설정이 공통 설정과 같아 공통 프롬프트를 사용합니다.`),
          false
        );
      }

      function resetSlideConfig() {
        const index = genState.configModalIndex;
        const record = genState.records[index];
        if (!record) return;
        record.promptConfig = null;
        record.selections = null;
        record.manualEditedPrompt = "";
        delete genState.savedPrompts[savedPromptKey(record)];
        persistSavedPrompts();
        record.prompt = generateSingleSlidePrompt(record, getEffectiveCommonPrompt().trim());
        refreshLatestOutput();
        renderSlideList();
        selectSlide(index);
        closeConfigModal();
        setMessage(
          usesIndividualSpecialSlideDesign(record)
            ? `${displayNo(record)} 개별 설정을 해제했습니다. 이 특수 슬라이드는 MD의 개별 구성과 공통 정체성 브리지를 사용합니다.`
            : `${displayNo(record)} 개별 설정을 해제하고 공통 설정으로 되돌렸습니다.`,
          false
        );
      }

      function useCurrentDesignerConfig() {
        genState.configDraft = deepClone(genState.commonConfig) || createBasePromptConfig();
        renderConfigModal();
      }

      function insertSample() {
        $("genMdInput").value = `## 슬라이드 01. 표지

### 헤더 블록
- **섹션번호**: PART 0. 도입 / 01/43
- **핵심요약**: 화학 LFP+ 공급망 재편 실행거점
- **출처범위**: 계획안 p.3~208

### 레이아웃
- 좌측 40% 타이틀, 우측 60% 메인 비주얼
- 하단 4개 키워드 칩

### 본문 콘텐츠
- 화학, LFP+ 공급망 재편 실행거점
- 공급망 재편 / 생산기지 / 순환경제 / 산업전환

### 발표자 스크립트
이 내용은 결과 프롬프트에서 자동 제외됩니다.

---

## 부록 A1. 평가 항목 요약
### 헤더 블록
- **섹션번호**: 부록 A1 / 평가 항목

### 레이아웃
- 5개 질문 카드와 응답 카드
`;
        renderPlannerContractStatus();
        renderSplitRulesPreview();
        renderBuilderLivePreview();
        setMessage("예시 MD를 넣었습니다.", false);
      }

      function insertPlannerTemplate() {
        if ($("genMdInput").value.trim() && !window.confirm("현재 입력 내용을 작성 예시로 바꿀까요? 기존 내용은 사라집니다.")) return;
        $("genMdInput").value = `---
promptdeck_contract: ${PROMPTDECK_CONTRACT_VERSION}
skill_preset_contract: ${SKILL_PRESET_CONTRACT_VERSION}
---

# 덱 메타데이터 〔헤더·푸터 표시용 전역 데이터〕

- 발표자료명: 2026 국제 배터리 엑스포 추진계획
- 축약 자료명: 배터리 엑스포 추진계획
- 페이지 번호 정책: 본문만 표시

# 발표 맥락 〔화면 비표시·모든 슬라이드 전달〕

- 발표 대상: 지역산업 정책 담당자
- 청중 수준: 의사결정자
- 발표 목적: 확대 계획 보고와 추진 우선순위 설득
- 발표 시간: 10분
- 발표 후 원하는 판단 또는 행동: 규모와 세 실행축의 동시 확대에 동의
- 청중의 현재 인식: 행사 규모 확대 중심의 계획으로 이해
- 발표 후 목표 인식: 규모와 콘텐츠가 결합된 산업 성장 전략으로 판단
- 핵심 인식 장벽: 정량 목표와 실행축이 분리되어 보임
- Governing Thought: 규모 확대와 콘텐츠 고도화를 함께 추진해야 산업적 파급력이 커진다.

# 세션 설계 〔화면 비표시·모든 슬라이드 전달〕

## 세션 1. 확대 방향 · 슬라이드 01–01
- 세션 역할: 전년 대비 목표 규모와 실행축 증명
- 청중의 핵심 질문: 새 계획의 실질적 변화는 무엇인가?
- 세션 결론: 규모와 세 실행축을 동시에 확대한다.
- 다음 세션 연결: 확대 방향 합의 → 축별 실행계획 검토

## 슬라이드 01. 2026 중점 추진사항

### 양식 〔화면 표시·헤더/푸터〕

- 헤더 1단계 파트: I. 확대 전략
- 헤더 2단계 제목: 1. 목표 규모
- 헤더 3단계 부제: 가. 산업적 파급력 강화를 위한 동시 확대
- 푸터 출처: 2026 국제 배터리 엑스포 추진계획
- 푸터 주석: 목표값은 계획 기준

### 핵심 주제·목적 〔화면 비표시〕

- 핵심 주제: 정량 목표와 실행축의 결합
- 슬라이드 목적: 계획 변화의 크기와 실행 논리를 동시에 증명
- 청중 질문: 확대 목표와 실행축을 왜 하나의 전략으로 보아야 하는가?
- 인식 변화: 독립된 행사 확대 목표 → 규모와 콘텐츠가 결합된 성장 전략
- 핵심 장벽: 정량 목표와 세 실행축이 별도 정보처럼 보임
- 목표 판단 또는 행동: 네 추진축의 동시 확대 필요성에 동의
- 핵심 근거의 역할: 대표 지표는 변화의 크기를, 보조 근거는 실행 경로를 설명
- 세션 연결: 추진 필요성 → 확대 방향 → 축별 실행계획

### 콘텐츠 〔화면 표시〕

- 핵심 문장: 규모·홍보·시민·기술, 네 축에서 동시에 도약
- 대표 지표: 2026년 목표 50개사·100부스
- 비교 기준: 2025년 36개사·72부스
- 보조 근거 1: POEX 협력, SNS·미디어 확대
- 보조 근거 2: 모빌리티·AI·로보틱스 체험 프로그램
- 보조 근거 3: 전고체·ESS·LFP 기술 동향 반영

### 표현 방식 〔화면 비표시〕

- 페이지 유형: 본문
- 정보 밀도: C2 근거까지 이해
- 데이터 시각화 강도: V2 간단 비교
- 비주얼 존재감: 균형 강조형
- 설정 반영: 결론과 비교 데이터, 세 보조 근거만 유지하고 전년–목표 관계를 주 증거로 사용하며 요소 수보다 핵심 초점의 스케일·깊이·대비로 존재감을 조절
- 구성 위임 수준: 의미만 고정
- 잠금 항목: 표시 문구·수치·사실·증거 지위·의미 관계
- 가이드 항목: 핵심 강조 대상·읽기 우선순위·정보 위계
- 자유 항목: 레이아웃 계열·매체·시각 은유·크기·간격·크롭·깊이·레이어
- 구성 잠금 이유: 해당 없음 — 콘텐츠 의미와 데이터 정직성만 고정
- 프리셋 적용 범위: 레이아웃 계열·공간 실루엣·매체·그림체·타이포 행동·표면·이미지 처리
- 비주얼 논증: 같은 기준축의 전년–목표 비교와 대표 지표에서 실행축으로 확장되는 비교·연결
- 의미 그룹과 관계: 대표 지표와 비교 기준을 하나의 변화 증거군으로 결합하고 세 실행축을 이를 설명하는 보조 근거군으로 연결
- 읽기 우선순위: 대표 지표 → 비교 기준 → 세 실행축 → 결론
- 큰 구성 아이디어: 변화 증거군을 주 초점으로 두고 실행축이 이를 뒷받침하는 주–보조 관계; AI가 데이터·인포그래픽·타이포 후보와 비교 가능
- 정보 위계: 1순위 대표 지표 → 2순위 비교 기준 → 3순위 보조 근거
- 핵심 강조 대상: 대표 지표
- 강조 설계: 변화의 크기를 가장 직접적으로 보여주므로 큰 스케일·역할색 대비·집중 여백을 활용
- 시각 언어와 레이어: 데이터 타이포그래피를 주 언어로, 실행 관계 인포그래픽을 보조 언어로 사용
- 여백과 리듬: 대표 지표 주변은 넓게 비우고 보조 근거는 하나의 그룹으로 묶음
- 생성 경로: 전체 슬라이드 이미지 생성을 기본으로 검토
- AI 조정 범위: 의미·문구·수치·관계·강조 이유는 보존하고 구도·매체·시각 은유·크기·간격·크롭·중첩을 비교·최적화

### 품질 조건 〔화면 비표시〕

- 사실 고정: 양식과 콘텐츠에 정의된 문자열·수치·단위만 사용
- 허용 해석: 계획 규모가 전년보다 확대되고 세 실행축이 함께 추진됨
- 해석 경계: 목표값을 이미 달성한 실적으로 표현하지 않음
- 데이터 정직성: 전년과 목표를 같은 기준으로 비교하고 개사·부스 단위를 혼합하지 않음
- 맥락 이미지의 지위: 일반 설명 보조이며 실제 행사 성과의 증거가 아님
- 품질 취약점: 한글, 개사·부스 단위, 목표와 실적의 구분
- 출력 품질: 같은 문구를 한 번만 표시하고 제작 표식을 숨기며 글자·수치·도형을 전면 블러 없이 선명하게 마감`;
        updateHeaderFooterStatus();
        renderPlannerContractStatus();
        renderSplitRulesPreview();
        renderBuilderLivePreview();
        setMessage("5개 MECE 섹션 작성 예시를 넣었습니다. 양식의 헤더 계층과 콘텐츠의 정확한 값을 실제 기획안에 맞게 바꿔주세요.", false);
      }

    })();
