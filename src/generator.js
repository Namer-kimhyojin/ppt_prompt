;

    // ?? ?щ씪?대뱶蹂??앹꽦湲?濡쒖쭅 ????????????????????????????????????????
    (function () {
      const $ = (id) => document.getElementById(id);
      const DEFAULT_SPLIT_RULES = $("genSplitRules").value.trim();

      const genState = {
        latestOutput: "",
        latestFormat: "markdown",
        records: [],
        currentIndex: 0,
        isEditing: false,
        savedPrompts: loadSavedPrompts(),
        commonConfig: null,
        configModalIndex: null,
        configDraft: null
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
          };
        },
      };

      const PROJECT_SCHEMA_VERSION = 3;

      $("genFileInput").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        $("genMdInput").value = await file.text();
        setMessage(`파일을 불러왔습니다: ${file.name}`, false);
      });

      $("genGenerateBtn").addEventListener("click", generate);
      $("genCopyBtn").addEventListener("click", copyOutput);
      $("genCopyCurrentBtn").addEventListener("click", copyCurrent);
      $("genCopyCurrentTopBtn").addEventListener("click", copyCurrent);
      $("genDownloadBtn").addEventListener("click", downloadOutput);
      $("genClearBtn").addEventListener("click", clearAll);
      $("genSampleBtn").addEventListener("click", insertSample);
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
      document.querySelectorAll(".gen-split-preset").forEach((el) => {
        el.addEventListener("click", () => appendPresetSplitRule(el.dataset.ruleType, el.dataset.rulePattern));
      });
      document.querySelectorAll(".gen-number-preset").forEach((el) => {
        el.addEventListener("click", () => applyNumberExamplePreset(el.dataset.numberExample));
      });
      document.querySelectorAll("[data-close-config-modal]").forEach((el) => {
        el.addEventListener("click", closeConfigModal);
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
        } else if (event.key === "Escape" && !$("genConfigModal").hidden) {
          closeConfigModal();
        }
      });
      updateSplitRuleBuilderPreview();
      renderLintPanel(null);

      function setMessage(text, isError = true) {
        const el = $("genMessage");
        el.textContent = text || "";
        el.className = "gen-warn" + (isError ? "" : " ok");
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
        setMessage("슬라이드 구분 규칙을 기본값으로 되돌렸습니다.", false);
      }

      function clearSplitRulesEditor() {
        $("genSplitRules").value = "";
        setMessage("슬라이드 구분 규칙 입력창을 비웠습니다.", false);
      }

      function generate() {
        const commonPrompt = $("genCommonPrompt").value.trim();
        const markdown = $("genMdInput").value.trim();
        const splitRulesText = $("genSplitRules").value.trim();
        const maxChars = Number.parseInt($("genMaxChars").value, 10) || 3600;
        const format = $("genFormat").value;

        if (!commonPrompt) return setMessage("공통 프롬프트를 입력해주세요.");
        if (!markdown) return setMessage("MD 내용을 입력하거나 파일을 불러와주세요.");
        if (!splitRulesText) return setMessage("슬라이드 구분 규칙을 하나 이상 입력해주세요.");

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

        genState.commonConfig = createBasePromptConfig();

        const records = newRecords.map(r => {
           const existing = existingRecords.get(getRecordIdentity(r));
           if (existing) {
             r.promptConfig = existing.promptConfig;
             r.selections = existing.selections || existing.promptConfig?.selections;
             r.manualEditedPrompt = existing.manualEditedPrompt;
           }
           if (r.manualEditedPrompt) {
              r.prompt = r.manualEditedPrompt;
           } else {
              r.prompt = generateSingleSlidePrompt(r, commonPrompt);
           }
           return r;
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
        setMessage("프롬프트 생성 완료", false);
      }

      function generateSingleSlidePrompt(record, commonPrompt) {
        const promptDeck = window.PromptDeck;
        const pptState = window.pptState;
        const config = normalizePromptConfig(record) || genState.commonConfig || createBasePromptConfig();
        let text = "";

        if (promptDeck && typeof promptDeck.buildPromptFromConfig === "function") {
          text = promptDeck.buildPromptFromConfig(
            config,
            { content: record.screenSpec, designContext: "", exclusions: "" },
            pptState?.lang || "ko"
          );
        } else {
          text = "프롬프트 생성 오류 (PromptDeck API 연결 실패)";
        }

        return [
          "# 공통 프롬프트", "", commonPrompt, "", "---", "",
          "# 슬라이드 기획안", "", record.screenSpec, "", "---", "",
          "# 슬라이드별 사용자 프롬프트", "", text
        ].join("\n");
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
            if (typeof match[1] !== "string" || typeof match[2] !== "string") {
              throw new Error(`구분 규칙 ${ruleIndex + 1}행은 번호와 제목을 위한 캡처 그룹 2개가 필요합니다.`);
            }
            matches.push({
              type: rule.type,
              no: match[1].trim(),
              title: cleanTitle(match[2]),
              index: match.index,
            });
          }
        });

        matches.sort((a, b) => a.index - b.index);

        return matches.map((item, idx) => {
          const next = matches[idx + 1];
          const block = markdown.slice(item.index, next ? next.index : markdown.length);
          const screenSpec = trimForVisual(block, maxChars);
          const tocNumber = item.type === "slide" ? getTocNumber(item.no) : "";

          return {
            slide_no: item.no,
            entryType: item.type,
            toc_number: tocNumber,
            title: item.title,
            screenSpec,
            prompt: "",
          };
        });
      }

      function trimForVisual(block, maxChars) {
        const headings = Array.from(block.matchAll(/^###\s+.+$/gm));
        const found = headings.length > 3 ? headings[3].index : -1;
        let trimmed = found >= 0 ? block.slice(0, found) : block;
        trimmed = trimmed.replace(/\n{3,}/g, "\n\n").trim();
        if (trimmed.length > maxChars) trimmed = trimmed.slice(0, maxChars).trimEnd() + "\n...";
        return trimmed;
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
        const chunks = records.map((r, index) => {
          const label = displayNo(r);

          return [
            "", `## PROMPT ${index + 1} / ${records.length} | ${label}`, "",
            `**TOC:** ${r.toc_number || "-"}`, `**TITLE:** ${r.title}`, "",
            `<!-- BEGIN ${label} PROMPT -->`, "", r.prompt, "", `<!-- END ${label} PROMPT -->`, ""
          ].join("\n");
        });

        return [
          "# Slide Image Prompts", "",
          `Generated: ${new Date().toLocaleString("ko-KR")}`,
          `Total prompts: ${records.length}`, "",
          "각 프롬프트는 Markdown 형식이며, `BEGIN ... PROMPT`와 `END ... PROMPT` 사이만 복사해 사용하면 됩니다.",
          ...chunks
        ].join("\n");
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

      function getRecordConfigDiff(record) {
         if (!record) return null;
         const promptDeck = window.PromptDeck;
         if (!promptDeck || typeof promptDeck.diffConfig !== "function") return null;
         const baseConfig = genState.commonConfig || createBasePromptConfig();
         const config = normalizePromptConfig(record) || baseConfig;
         return promptDeck.diffConfig(baseConfig, config, window.pptState?.lang || "ko");
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
            globalSelections: serializeSelectionSet(window.globalSelections || window.pptState?.selections),
            commonConfig: serializeConfigValue(genState.commonConfig || createBasePromptConfig()),
            markdown: $("genMdInput").value,
            commonPrompt: $("genCommonPrompt").value,
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

         const baseCommonConfig = normalizeConfig(project.commonConfig || createBasePromptConfig());

         if (!Array.isArray(project.records)) project.records = [];

         project.records = project.records.map((record) => {
           const next = { ...record };
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
         project.globalSelections = normalizeSelections(project.globalSelections);
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
         if (data.globalSelections && window.pptState) {
            const current = createBasePromptConfig();
            current.selections = normalizeSelections(data.globalSelections);
            applyPromptConfigToState(current, window.pptState);
            if (typeof window.pptRenderAll === "function") window.pptRenderAll();
         }
         if (data.markdown) $("genMdInput").value = data.markdown;
         if (data.commonPrompt) $("genCommonPrompt").value = data.commonPrompt;
         $("genSplitRules").value = data.splitRules || DEFAULT_SPLIT_RULES;
         genState.commonConfig = data.commonConfig ? deepClone(data.commonConfig) : createBasePromptConfig();
         if (data.records) {
             genState.records = data.records;
             refreshLatestOutput();
             updateRecordStats(genState.records);
             renderSlideList();
             selectSlide(0);
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
           window.pptState?.lang || "ko"
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
          `<span class="gen-lint-metric">프롬프트 길이: ${Number((record.prompt || "").length || lint.summary.promptLength || 0).toLocaleString("ko-KR")}자</span>`,
          `<span class="gen-lint-metric">구조 블록: ${lint.summary.partCount}</span>`,
          `<span class="gen-lint-metric">선택 그룹: ${lint.summary.selectedKeyCount}</span>`
        ].join("");

         const issues = [];
         lint.conflicts.forEach((item) => {
           issues.push(`<div class="gen-lint-item error">${escapeHtml(item.message)}</div>`);
         });
         lint.warnings.forEach((item) => {
           issues.push(`<div class="gen-lint-item warning">${escapeHtml(item.message)}</div>`);
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
           issues.push(`<div class="gen-lint-item error">${escapeHtml(item.message)}</div>`);
         });
         lint.warnings.forEach((item) => {
           issues.push(`<div class="gen-lint-item warning">${escapeHtml(item.message)}</div>`);
         });

        if (!issues.length) {
          issues.push('<div class="gen-lint-item ok">현재 슬라이드 프롬프트 구조는 안정적인 상태입니다.</div>');
        }

         list.innerHTML = issues.join("");
      }

      async function copyOutput() {
         if (!genState.latestOutput) return setMessage("복사할 결과가 없습니다.");
         await navigator.clipboard.writeText(genState.latestOutput);
         const deckLint = summarizeDeckLint();
         const suffix = deckLint.issueCount ? ` (${deckLint.issueCount}건의 잔여 경고 있음)` : "";
         setMessage(`클립보드에 복사했습니다.${suffix}`, false);
      }

      async function copyCurrent() {
         const current = genState.records[genState.currentIndex];
         if (!current) return setMessage("복사할 슬라이드가 없습니다.");
         await navigator.clipboard.writeText(current.prompt);
         const lint = getRecordPromptLint(current);
         const suffix = lint && (lint.conflicts.length || lint.warnings.length)
           ? ` (${lint.conflicts.length + lint.warnings.length}건의 진단 이슈 있음)`
           : "";
         setMessage(`${displayNo(current)} 프롬프트를 복사했습니다.${suffix}`, false);
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
        const label = displayNo(record);
        $("genOutput").textContent = [
          `## ${label} | ${record.title}`, "",
          `**TOC:** ${record.toc_number || "-"}`, "",
          `<!-- BEGIN ${label} PROMPT -->`, "", record.prompt, "", `<!-- END ${label} PROMPT -->`
        ].join("\n");
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
        genState.savedPrompts[promptId(current)] = edited;
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
        const saved = genState.savedPrompts[promptId(current)];
        if (!saved) return setMessage(`${displayNo(current)}에 저장된 값이 없습니다.`);
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
        const normalized = raw.match(/^\d+$/) ? String(Number(raw)).padStart(2, "0") : raw;
        const index = genState.records.findIndex((r) => String(r.slide_no).toUpperCase() === normalized);
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

      function loadSavedPrompts() {
        try {
          return JSON.parse(localStorage.getItem("slidePromptGenerator.savedPrompts") || "{}");
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
        setMessage("");
      }

      function renderSlideListBase() {
        const list = $("genSlideList");
        list.innerHTML = "";
        genState.records.forEach((record, index) => {
          const wrap = document.createElement("div");
          wrap.style.display = "flex";
          wrap.style.gap = "4px";
          wrap.style.marginBottom = "6px";
          wrap.className = "gen-slide-item-wrap";

          const item = document.createElement("button");
          item.type = "button";
          item.className = "gen-slide-item";
          item.style.margin = "0";
          item.style.flex = "1";
          item.style.minWidth = "0";
          item.dataset.index = String(index);
          item.innerHTML = `${displayNo(record)}${record.selections ? " <span style='color:var(--gen-accent);font-size:11px;'>(개별)</span>" : ""}<small>${escapeHtml(record.title)}</small>`;
          item.addEventListener("click", () => selectSlide(index));

          const configBtn = document.createElement("button");
          configBtn.type = "button";
          configBtn.className = "gen-btn secondary";
          configBtn.style.padding = "4px 8px";
          configBtn.style.margin = "0";
          configBtn.style.flexShrink = "0";
          configBtn.style.fontSize = "11px";
          configBtn.style.whiteSpace = "nowrap";
          configBtn.title = "슬라이드 개별 프롬프트 설정";
          configBtn.setAttribute("aria-label", "슬라이드 개별 프롬프트 설정");
          configBtn.innerHTML = "개별 설정 &#9881;";
          configBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            openConfigModal(index);
          });

          wrap.appendChild(item);
          wrap.appendChild(configBtn);
          list.appendChild(wrap);
        });
      }

      function renderSlideList() {
        const list = $("genSlideList");
        list.innerHTML = "";
        genState.records.forEach((record, index) => {
          const wrap = document.createElement("div");
          wrap.style.display = "flex";
          wrap.style.gap = "4px";
          wrap.style.marginBottom = "6px";
          wrap.className = "gen-slide-item-wrap";

          const item = document.createElement("button");
          item.type = "button";
          item.className = "gen-slide-item";
          item.style.margin = "0";
          item.style.flex = "1";
          item.style.minWidth = "0";
          item.dataset.index = String(index);
          item.innerHTML = `${displayNo(record)}${hasSlideSpecificConfig(record) ? " <span style='color:var(--gen-accent);font-size:11px;'>(개별)</span>" : ""}<small>${escapeHtml(record.title)}</small>`;
          item.addEventListener("click", () => selectSlide(index));

          const configBtn = document.createElement("button");
          configBtn.type = "button";
          configBtn.className = "gen-btn secondary";
          configBtn.style.padding = "4px 8px";
          configBtn.style.margin = "0";
          configBtn.style.flexShrink = "0";
          configBtn.style.fontSize = "11px";
          configBtn.style.whiteSpace = "nowrap";
          configBtn.title = "개별 슬라이드 프롬프트 설정";
          configBtn.setAttribute("aria-label", "개별 슬라이드 프롬프트 설정");
          configBtn.innerHTML = "개별 설정 &#9881;";
          configBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            openConfigModal(index);
          });

          wrap.appendChild(item);
          wrap.appendChild(configBtn);
          list.appendChild(wrap);
        });
      }

      function configureSlideDesign(index) {
        openConfigModal(index);
      }

      function finishSlideDesign() {
        closeConfigModal();
      }

      function openConfigModal(index) {
        const record = genState.records[index];
        if (!record) return;
        genState.configModalIndex = index;
        genState.configDraft = normalizePromptConfig(record) || deepClone(genState.commonConfig) || createBasePromptConfig();
        renderConfigModal();
        $("genConfigModal").hidden = false;
        document.body.classList.add("modal-open");
      }

      function closeConfigModal() {
        genState.configModalIndex = null;
        genState.configDraft = null;
        $("genConfigModal").hidden = true;
        if ($("genSplitRulesModal").hidden) {
          document.body.classList.remove("modal-open");
        }
      }

      function renderConfigModal() {
        const record = genState.records[genState.configModalIndex];
        const draft = genState.configDraft;
        if (!record || !draft) return;

        const configApi = window.pptConfigApi || {};
        const pageTypes = configApi.PAGE_TYPES || [];
        const sectionDefs = configApi.SECTION_DEFS || [];
        const optionMeta = configApi.OPTION_META || {};
        const fields = [];
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

        fields.push(`
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
                <select class="gen-select" data-config-key="${escapeHtml(key)}"${disabled ? " disabled" : ""}>
                  ${optionList}
                </select>
              `;
            }

            fields.push(`
              <section class="gen-config-group ${meta.wide ? "gen-config-group-wide" : ""}">
                <label class="gen-config-label">${escapeHtml(meta.label)}</label>
                <p class="gen-config-guide">${escapeHtml(meta.guide || "")}</p>
                ${disabled ? `<p class="gen-config-disabled">${escapeHtml(reason)}</p>` : ""}
                ${control}
              </section>
            `);
          });
        });

        $("genConfigFields").innerHTML = fields.join("");
        bindConfigModalInputs();
      }

      function bindConfigModalInputs() {
        const pageTypeInput = $("genConfigPageType");
        if (pageTypeInput) {
          pageTypeInput.addEventListener("change", () => {
            if (!genState.configDraft) return;
            genState.configDraft.pageType = pageTypeInput.value || "body";
            clearDisabledSelections(genState.configDraft);
            renderConfigModal();
          });
        }

        document.querySelectorAll("#genConfigFields select[data-config-key]").forEach((input) => {
          input.addEventListener("change", () => {
            if (!genState.configDraft) return;
            genState.configDraft.selections[input.dataset.configKey] = findOption(input.dataset.configKey, input.value);
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
          });
        });
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

        record.promptConfig = deepClone(draft);
        record.selections = deepClone(draft.selections);
        record.manualEditedPrompt = "";
        delete genState.savedPrompts[promptId(record)];
        persistSavedPrompts();
        record.prompt = generateSingleSlidePrompt(record, $("genCommonPrompt").value.trim());

        refreshLatestOutput();
        renderSlideList();
        selectSlide(index);
        closeConfigModal();
        setMessage(`${displayNo(record)} 개별 프롬프트 설정을 적용했습니다.`, false);
      }

      function resetSlideConfig() {
        const index = genState.configModalIndex;
        const record = genState.records[index];
        if (!record) return;
        record.promptConfig = null;
        record.selections = null;
        record.manualEditedPrompt = "";
        delete genState.savedPrompts[promptId(record)];
        persistSavedPrompts();
        record.prompt = generateSingleSlidePrompt(record, $("genCommonPrompt").value.trim());
        refreshLatestOutput();
        renderSlideList();
        selectSlide(index);
        closeConfigModal();
        setMessage(`${displayNo(record)} 개별 설정을 해제하고 공통 설정으로 되돌렸습니다.`, false);
      }

      function useCurrentDesignerConfig() {
        genState.configDraft = createBasePromptConfig();
        if (!hasAnySelections(genState.configDraft?.selections) && genState.commonConfig) {
          genState.configDraft = deepClone(genState.commonConfig);
        }
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
        setMessage("예시 MD를 넣었습니다.", false);
      }
    })();
