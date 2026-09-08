(function () {
  "use strict";

  const numeric = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const text = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = String(value);
    return node;
  };
  const group = (className, ...children) => {
    const node = text("div", className);
    children.flat().filter(Boolean).forEach((child) => node.append(child));
    return node;
  };
  const tint = (hex, amount) => {
    const value = /^#[\da-f]{6}$/i.test(hex || "") ? hex.slice(1) : "385e69";
    return `#${[0, 2, 4].map((offset) => Math.round(parseInt(value.slice(offset, offset + 2), 16) * (1 - amount) + 255 * amount).toString(16).padStart(2, "0")).join("")}`;
  };
  function paragraphs(sample, count) {
    return (count ? sample.paragraphs.slice(0, count) : sample.paragraphs).map((value) => text("p", "dd-paragraph", value));
  }
  function heading(sample, label, title) {
    return group("dd-section-heading", text("div", "dd-kicker", label), text("h2", "dd-page-title", title || sample.section));
  }
  function callout(value, label = "핵심 메모") {
    return group("dd-callout", text("strong", "dd-callout-label", label), text("p", "dd-paragraph", value));
  }
  function picture(design, sample, options = {}) {
    const figure = text("figure", `dd-figure ${options.className || ""}`);
    const frame = text("div", "dd-photo-frame");
    frame.dataset.positionY = design.familyId === "story" ? ".78" : ".5";
    const img = text("img", "dd-photo");
    img.src = typeof design.image === "string" ? design.image : design.image?.src || "";
    img.alt = sample.imageCaption;
    img.decoding = "async";
    if (options.height) frame.style.height = `${options.height}px`;
    if (options.spread) {
      frame.classList.add("dd-spread-frame");
      frame.dataset.side = options.spread;
      img.classList.add("dd-spread-image");
    }
    frame.append(img);
    figure.append(frame);
    if (options.caption !== false) figure.append(text("figcaption", "dd-caption", sample.imageCaption));
    return figure;
  }
  function table(sample, options = {}) {
    const wrap = text("div", "dd-table-block");
    const data = options.data || sample.table;
    if (!data) return wrap;
    const tableNode = text("table", "dd-document-table");
    const caption = text("caption", "dd-table-caption", options.caption || "항목별 내용을 살펴봅니다");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    data.headers.forEach((value) => {
      const cell = text("th", "", value); cell.scope = "col"; headRow.append(cell);
    });
    head.append(headRow);
    const body = document.createElement("tbody");
    data.rows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((value, index) => {
        const cell = text(index === 0 ? "th" : "td", "", value);
        if (!index) cell.scope = "row";
        tr.append(cell);
      });
      body.append(tr);
    });
    tableNode.append(caption, head, body);
    wrap.append(tableNode, text("p", "dd-caption", sample.source));
    return wrap;
  }
  function stats(sample) {
    return group("dd-stats", (sample.stats || []).map((item) => group("dd-stat", text("span", "dd-stat-label", item.label), group("dd-stat-number", text("strong", "", item.value), text("span", "dd-unit", item.unit)))));
  }
  function chart(design, sample, tokens) {
    const values = sample.chart || [{ label: "A", value: 30 }, { label: "B", value: 50 }, { label: "C", value: 80 }];
    const type = design.componentStyles?.chartType || "bar";
    const plot = text("figure", `dd-chart dd-chart-${type}`);
    plot.append(text("figcaption", "dd-table-caption", sample.chartTitle || "변화를 한눈에 살펴보기"));
    const max = Math.max(...values.map((item) => item.value));
    if (type === "bar") {
      const columns = group("dd-chart-columns", values.map((item, index) => {
        const bar = text("div", "dd-chart-bar");
        bar.style.height = `${Math.max(6, item.value / max * 100)}%`;
        if (index === values.length - 1) bar.classList.add("is-highlight");
        return group("dd-chart-column", group("dd-chart-bar-area", text("span", "dd-chart-value", item.value), bar), text("span", "dd-chart-label", item.label));
      }));
      columns.style.height = `${Math.round(tokens.heightPx * (.1 + tokens.imageRatio * .26))}px`;
      plot.append(columns);
    } else {
      const canvas = document.createElement("canvas");
      const width = Math.round(Math.min(520, tokens.widthPx - tokens.marginPx * 2));
      const height = Math.round(Math.min(360, tokens.heightPx * (.1 + tokens.imageRatio * .22)));
      canvas.width = width * 2; canvas.height = height * 2;
      canvas.style.width = `${width}px`; canvas.style.maxWidth = "100%"; canvas.style.height = `${height}px`;
      canvas.className = "dd-chart-canvas";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `${type === "line" ? "꺾은선" : "도넛"} 차트: ${values.map((entry) => `${entry.label} ${entry.value}`).join(", ")}`);
      const ctx = canvas.getContext("2d");
      ctx.scale(2, 2);
      const colors = [design.palette.primary, design.palette.secondary, design.palette.accent, tint(design.palette.primary, .55)];
      if (type === "line") {
        ctx.strokeStyle = design.palette.border; ctx.lineWidth = 1;
        for (let i = 0; i < 4; i += 1) { const y = 18 + i * (height - 45) / 3; ctx.beginPath(); ctx.moveTo(22, y); ctx.lineTo(width - 22, y); ctx.stroke(); }
        const points = values.map((item, index) => ({ x: 25 + index * (width - 50) / Math.max(1, values.length - 1), y: height - 24 - item.value / max * (height - 54) }));
        ctx.strokeStyle = design.palette.primary; ctx.lineWidth = 3; ctx.beginPath();
        points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke();
        points.forEach((point, index) => { ctx.fillStyle = index === points.length - 1 ? design.palette.accent : design.palette.primary; ctx.beginPath(); ctx.arc(point.x, point.y, 4, 0, Math.PI * 2); ctx.fill(); });
      } else {
        let position = -Math.PI / 2;
        const total = values.reduce((sum, item) => sum + item.value, 0);
        const radius = Math.min(width, height) * .34;
        values.forEach((item, index) => { const end = position + item.value / total * Math.PI * 2; ctx.strokeStyle = colors[index % colors.length]; ctx.lineWidth = radius * .43; ctx.beginPath(); ctx.arc(width / 2, height / 2, radius, position + .015, end - .015); ctx.stroke(); position = end; });
      }
      plot.append(canvas);
      plot.append(group("dd-chart-legend", values.map((item, index) => {
        const dot = text("span", "dd-legend-dot"); dot.style.background = colors[index % colors.length];
        return group("dd-legend-entry", dot, text("span", "", `${item.label} ${item.value}`));
      })));
    }
    plot.append(text("p", "dd-caption", sample.source));
    return plot;
  }
  function diagram(design, sample) {
    const steps = sample.steps || ["자료 살피기", "핵심 찾기", "관계 연결하기", "결과 확인하기"];
    const mode = design.componentStyles?.diagramStyle || "flow";
    const flow = text("div", `dd-diagram dd-diagram-${mode}`);
    steps.forEach((label, index) => {
      const node = group("dd-diagram-node", text("span", "dd-symbol", String(index + 1).padStart(2, "0")), text("strong", "", label));
      if (mode === "hierarchy" && index === 0) node.classList.add("dd-diagram-parent");
      flow.append(node);
      if (mode === "flow" && index < steps.length - 1) flow.append(text("span", "dd-flow-arrow", "↓"));
    });
    return flow;
  }
  function question(sample, number = "01") {
    return group("dd-question", group("dd-question-title", text("strong", "dd-question-number", number), text("p", "dd-question-text", sample.question || "이 장면에서 어떤 관계를 찾을 수 있을까요?")), sample.values ? text("p", "dd-question-data", sample.values) : null, group("dd-options", (sample.options || []).map((option, index) => text("p", "dd-option", `${["①", "②", "③", "④", "⑤"][index]} ${option}`))));
  }
  function cover(design, sample, tokens) {
    const visual = ["visual", "visual-learning", "visual-atlas", "photo", "seasonal-journal", "brand-story", "creative-concept", "watercolor", "papercut", "night-adventure", "comic-panels"].includes(design.variant);
    const main = group("dd-cover-main", text("div", "dd-kicker", sample.eyebrow), text("h1", "dd-cover-title", sample.title), text("p", "dd-cover-subtitle", sample.subtitle));
    if (visual) main.append(picture(design, sample, { height: Math.round(tokens.heightPx * tokens.imageRatio * .62), caption: false }));
    else main.append(group("dd-cover-index", text("span", "dd-cover-number", design.familyId === "exam" ? "01" : "2026"), text("span", "dd-cover-index-label", sample.chapter)));
    main.append(group("dd-cover-author", text("span", "", sample.author), text("span", "", design.familyId === "report" || design.familyId === "proposal" ? "2026. 09" : "")));
    return [main];
  }
  function chapter(design, sample) {
    return [group("dd-chapter-intro", text("span", "dd-chapter-number", "01"), text("div", "dd-kicker", design.familyId === "learning" ? "함께 탐구할 첫 번째 질문" : "CHAPTER ONE"), text("h1", "dd-page-title", sample.chapter), text("p", "dd-lead", sample.lead)), ["learning", "exam"].includes(design.familyId) ? callout(sample.note, "이 단원에서 만나요") : text("p", "dd-chapter-footnote", sample.quote)];
  }
  function body(design, sample, tokens) {
    const family = design.familyId;
    const output = [heading(sample, family === "learning" ? "01 · 개념 알아보기" : family === "exam" ? "핵심 이론 · 01" : family === "prose" ? "첫 번째 이야기" : "01 · 배경과 방향")];
    if (family === "story") return [picture(design, sample, { height: Math.round(tokens.heightPx * tokens.imageRatio * .65), caption: false }), text("h2", "dd-page-title", sample.section), ...paragraphs(sample)];
    output.push(text("p", "dd-lead", sample.lead));
    if (["visual-learning", "visual-atlas", "photo", "seasonal-journal"].includes(design.variant)) output.push(picture(design, sample, { height: Math.round(tokens.heightPx * tokens.imageRatio * .3), caption: false }));
    if (design.variant === "data") {
      const note = callout(sample.note, "읽는 관점");
      note.classList.add("dd-side-note"); output.push(note);
    }
    output.push(...paragraphs(sample));
    if (family !== "prose" && design.variant !== "data") output.push(callout(sample.note, family === "learning" ? "기억해요" : family === "exam" ? "확인 포인트" : "읽는 관점"));
    return output;
  }
  function contentFor(design, sample, tokens, page) {
    const kind = page.kind;
    if (kind === "cover") return cover(design, sample, tokens);
    if (kind === "chapter") return chapter(design, sample);
    if (kind === "body") return body(design, sample, tokens);
    if (kind === "table") return [heading(sample, design.familyId === "proposal" ? "04 · 실행 계획" : "02 · 비교와 점검", design.familyId === "proposal" ? "실행을 구체적으로 준비합니다" : "항목별 차이를 읽는 기준"), text("p", "dd-lead", sample.lead), table(sample), callout(sample.note, "표를 읽는 기준")];
    if (kind === "chart") return [heading(sample, "03 · 주요 성과", "작은 변화가 쌓인 결과"), stats(sample), chart(design, sample, tokens), callout(sample.note, "변화의 맥락")];
    if (kind === "message") return [heading(sample, "01 · 제안의 방향", sample.section), text("p", "dd-message", sample.quote), stats(sample), ...paragraphs(sample, 2)];
    if (kind === "diagram") return [heading(sample, design.familyId === "learning" ? "02 · 그림으로 이해하기" : "02 · 전략의 구조", design.familyId === "learning" ? sample.chapter : "하나의 흐름으로 연결합니다"), text("p", "dd-lead", sample.lead), diagram(design, sample), callout(sample.note, design.familyId === "learning" ? "그림을 읽어 보세요" : "연결의 원칙")];
    if (kind === "roadmap") return [heading(sample, "03 · 실행 로드맵", "작은 실험에서 꾸준한 확장으로"), group("dd-roadmap", (sample.steps || []).map((step, index) => group("dd-roadmap-row", text("span", "dd-symbol", `0${index + 1}`), group("dd-roadmap-detail", text("strong", "", step), text("p", "dd-paragraph", sample.paragraphs[index % sample.paragraphs.length]))))), callout(sample.note, "실행의 기준")];
    if (kind === "example") return [heading(sample, "03 · 함께 풀어보기", "배운 개념을 일상에 연결해요"), question(sample), group("dd-example-steps", text("h3", "dd-small-title", "차근차근 생각해 보기"), ...["무엇이 달라졌는지 먼저 관찰해요.", "배운 핵심어와 관찰한 장면을 연결해요.", sample.answer].map((value, index) => group("dd-example-step", text("span", "dd-symbol", index + 1), text("p", "dd-paragraph", value)))), callout(sample.note, "한 번 더 확인해요")];
    if (kind === "activity") return [heading(sample, "04 · 활동과 정리", "나의 관찰을 기록해요"), ...(sample.activities || []).map((value, index) => group("dd-activity", group("dd-activity-heading", text("span", "dd-symbol", index + 1), text("p", "dd-paragraph", value)), group("dd-writing-space", text("span", "dd-writing-line"), text("span", "dd-writing-line")))), callout(sample.note, "오늘의 한 문장")];
    if (kind === "question") return [heading(sample, "실전 문제 · 대표값", "배운 내용을 확인합니다"), question(sample), text("h3", "dd-small-title", "나의 풀이"), group("dd-writing-space dd-writing-space-large", text("span", "dd-writing-line"), text("span", "dd-writing-line"), text("span", "dd-writing-line")), text("p", "dd-caption", sample.source)];
    if (kind === "data-question") return [heading(sample, "자료 해석 · 02", "자료에서 근거를 찾습니다"), text("p", "dd-lead", "아래 표의 관측값과 관측 횟수를 함께 살펴보세요."), table(sample, { caption: "관측 결과" }), chart(design, sample, tokens), question({ ...sample, question: "가장 자주 관측된 값은 무엇인가요?", values: "", options: ["12", "18", "24", "30"] }, "02")];
    if (kind === "solution") return [heading(sample, "정답과 풀이", "풀이의 이유를 확인합니다"), callout(sample.answer, "정답 확인"), ...paragraphs(sample), group("dd-solution-note", text("h3", "dd-small-title", "다시 살펴볼 개념"), text("p", "dd-paragraph", sample.note))];
    if (kind === "answers") return [heading(sample, "빠른 정답 확인", "문항별 정답표"), table(sample, { caption: "연습 문항의 정답", data: { headers: ["문항", "정답", "핵심 개념", "확인"], rows: Array.from({ length: 10 }, (_, index) => [String(index + 1).padStart(2, "0"), ["②", "③", "①", "④"][index % 4], ["중앙값", "관측 빈도", "평균", "분포"][index % 4], "□"]) } }), text("p", "dd-caption", "정답표의 번호와 표식은 디자인 비교용 예시입니다.")];
    if (kind === "quote") return [group("dd-quote-page", text("span", "dd-quote-mark", "“"), text("blockquote", "dd-literary-quote", sample.quote), text("p", "dd-quote-source", `― ${sample.author}`)), text("p", "dd-quote-context", sample.paragraphs[2])];
    if (kind === "dialogue") return [picture(design, sample, { height: Math.round(tokens.heightPx * tokens.imageRatio * .6), caption: false }), group("dd-dialogue", (sample.dialogue || []).map((value, index) => text("p", `dd-dialogue-line dd-speaker-${index + 1}`, value))), ...paragraphs(sample, 1)];
    if (kind === "spread-left" || kind === "spread-right") return [picture(design, sample, { height: Math.round(tokens.heightPx * .61), caption: false, spread: kind === "spread-left" ? "left" : "right" }), text("p", "dd-story-spread-text", kind === "spread-left" ? sample.paragraphs[0] : sample.paragraphs[2])];
    if (kind === "image") {
      if (design.familyId === "story") return [picture(design, sample, { height: Math.round(tokens.heightPx * .66), caption: false }), text("p", "dd-story-spread-text", sample.quote)];
      return [heading(sample, design.familyId === "prose" ? "풍경과 문장" : "현장의 기록", design.familyId === "prose" ? "빛이 머무는 시간" : "경험을 보여 주는 장면"), picture(design, sample, { height: Math.round(tokens.heightPx * tokens.imageRatio * .7) }), text("p", "dd-lead", sample.quote), ...paragraphs(sample, design.familyId === "prose" ? 1 : 2)];
    }
    return body(design, sample, tokens);
  }
  function renderPage(design, previewTokens, pageId, sampleContent) {
    const definition = design.pages.find((entry) => entry.id === pageId) || design.pages[0];
    const sample = sampleContent || window.PromptDeckDocumentSamples.get(design.familyId);
    const tokens = { widthPx: 600, heightPx: 848.57, marginPx: 48, fontPx: 13, titlePx: 29, lineHeight: 1.8, paragraphGap: 14, cellPadding: 10, imageRatio: .5, decorationLevel: .5, colorLevel: .5, titleWeight: 700, ...previewTokens };
    const node = text("article", `dd-page dd-family-${design.familyId} dd-variant-${design.variant} dd-kind-${definition.kind}`);
    node.dataset.pageId = definition.id; node.dataset.pageKind = definition.kind; node.dataset.bundleId = design.bundleId || "";
    node.setAttribute("aria-label", `${design.label} · ${definition.label}`);
    const color = clamp(numeric(tokens.colorLevel, .5), 0, 1);
    const decoration = clamp(numeric(tokens.decorationLevel, .5), 0, 1);
    const fonts = design.typographyScope || {};
    const fontValue = (value, fallback) => typeof value === "string" ? value : fallback;
    const vars = {
      "--dd-width": `${tokens.widthPx}px`, "--dd-height": `${tokens.heightPx}px`, "--dd-margin": `${tokens.marginPx}px`, "--dd-font": `${tokens.fontPx}px`, "--dd-title": `${tokens.titlePx}px`, "--dd-line": tokens.lineHeight, "--dd-paragraph-gap": `${tokens.paragraphGap}px`, "--dd-cell": `${tokens.cellPadding}px`, "--dd-title-weight": tokens.titleWeight,
      "--dd-primary": design.palette.primary, "--dd-secondary": design.palette.secondary, "--dd-accent": design.palette.accent, "--dd-paper": design.palette.background, "--dd-surface": design.palette.surface, "--dd-ink": design.palette.text, "--dd-muted": design.palette.muted, "--dd-border": design.palette.border, "--dd-tint": tint(design.palette.primary, .96 - color * .15), "--dd-heading-fill": color > .75 ? tint(design.palette.primary, .93) : "transparent", "--dd-color-area": `${4 + color * 12}px`, "--dd-decoration": decoration, "--dd-decoration-width": `${decoration < .1 ? 0 : 1 + decoration * 4}px`, "--dd-image-ratio": clamp(numeric(tokens.imageRatio, .5), .2, .8),
      "--dd-heading-font": `"${fontValue(fonts.heading, design.fonts.heading)}", sans-serif`, "--dd-body-font": `"${fontValue(fonts.body, design.fonts.body)}", sans-serif`, "--dd-numeral-font": `"${fontValue(fonts.numeral, design.fonts.body)}", sans-serif`, "--dd-table-font": `"${fontValue(fonts.table, design.fonts.body)}", sans-serif`, "--dd-caption-font": `"${fontValue(fonts.caption, design.fonts.body)}", sans-serif`, "--dd-quote-font": `"${fontValue(fonts.quote, design.fonts.heading)}", serif`,
    };
    if (window.PromptDeckDocumentPalettes) {
      vars["--dd-tint"] = window.PromptDeckDocumentPalettes.mix(design.palette.background, design.palette.primary, .04 + color * .15);
      vars["--dd-heading-fill"] = color > .75 ? window.PromptDeckDocumentPalettes.mix(design.palette.background, design.palette.primary, .07) : "transparent";
      vars["--dd-on-primary"] = window.PromptDeckDocumentPalettes.inkOn(design.palette.primary);
      vars["--dd-on-accent"] = window.PromptDeckDocumentPalettes.inkOn(design.palette.accent);
      node.dataset.paletteCustom = String(!!design.colorScheme?.presetId || !!design.colorScheme?.customizedRoles?.length || Object.entries(design.colorScheme?.feel || {}).some(([key, value]) => value !== window.PromptDeckDocumentPalettes.defaultFeel[key]));
    }
    Object.entries(vars).forEach(([key, value]) => node.style.setProperty(key, value));
    node.style.width = `${tokens.widthPx}px`; node.style.height = `${tokens.heightPx}px`;
    const styles = design.componentStyles || {};
    node.dataset.tableStyle = styles.tableStyle || "rules";
    node.dataset.iconStyle = styles.iconStyle || "line";
    node.dataset.imageStyle = styles.imageStyle || "original";
    node.dataset.backgroundScope = styles.backgroundScope || "cover";
    node.dataset.orientation = tokens.widthPx > tokens.heightPx ? "landscape" : "portrait";
    node.dataset.binding = design.physicalSpec?.bindingId || "none";
    node.dataset.duplex = design.physicalSpec?.duplex || "single";
    node.dataset.pageSide = design.pages.indexOf(definition) % 2 === 0 ? "right" : "left";
    if (decoration < .1) node.classList.add("dd-decoration-minimal");
    const content = group("dd-page-content", contentFor(design, sample, tokens, definition));
    content.querySelectorAll(".dd-callout-label").forEach((label) => {
      const icon = document.createElement("img");
      icon.src = `assets/document-design-icons/check-circle${styles.iconStyle === "solid" ? "-fill" : ""}.svg`;
      icon.className = "dd-library-icon";
      icon.alt = "";
      icon.width = 14; icon.height = 14;
      label.prepend(icon);
    });
    content.setAttribute("data-dd-content", "");
    const running = group("dd-running-head", text("span", "", sample.author), text("span", "", definition.label));
    const footer = group("dd-page-footer", text("span", "dd-page-foot-title", sample.subtitle), text("span", "dd-page-number", String(design.pages.indexOf(definition) + 1).padStart(2, "0")));
    node.append(running, content, footer);
    return node;
  }
  function fitImages(element) {
    element.querySelectorAll(".dd-photo-frame").forEach((frame) => {
      const img = frame.querySelector("img");
      if (!img?.naturalWidth || !frame.clientWidth || !frame.clientHeight) return;
      const spread = frame.classList.contains("dd-spread-frame");
      const width = frame.clientWidth * (spread ? 2 : 1);
      const scale = Math.max(width / img.naturalWidth, frame.clientHeight / img.naturalHeight);
      const imageWidth = img.naturalWidth * scale;
      const imageHeight = img.naturalHeight * scale;
      const horizontal = spread ? (frame.dataset.side === "right" ? frame.clientWidth : 0) : 0;
      img.style.width = `${imageWidth}px`; img.style.height = `${imageHeight}px`;
      img.style.minWidth = "0"; img.style.minHeight = "0"; img.style.maxWidth = "none";
      img.style.left = `${(width - imageWidth) / 2 - horizontal}px`;
      img.style.right = "auto";
      img.style.top = `${(frame.clientHeight - imageHeight) * Number(frame.dataset.positionY || .5)}px`;
    });
  }
  async function ready(element) {
    const isAttached = () => element.isConnected && (element.ownerDocument === document || element.ownerDocument.defaultView?.frameElement?.isConnected);
    if (!isAttached()) return element;
    if (document.fonts) {
      await document.fonts.ready;
      const families = new Set();
      element.querySelectorAll("h1,h2,h3,p,td,th,figcaption,blockquote").forEach((node) => {
        const family = getComputedStyle(node).fontFamily.split(",")[0]?.trim();
        if (family) families.add(family);
      });
      await Promise.all([...families].map((family) => document.fonts.load(`16px ${family}`, "문서 디자인")));
      for (const family of families) if (!document.fonts.check(`16px ${family}`, "문서 디자인")) throw new Error(`미리보기 서체를 불러오지 못했습니다: ${family}`);
    }
    if (!isAttached()) return element;
    await Promise.all([...element.querySelectorAll("img")].map((img) => new Promise((resolve, reject) => {
      const success = () => img.naturalWidth > 0 ? resolve() : reject(new Error(`미리보기 이미지를 불러오지 못했습니다: ${img.getAttribute("src")}`));
      if (img.complete) { success(); return; }
      img.addEventListener("load", success, { once: true });
      img.addEventListener("error", () => reject(new Error(`미리보기 이미지를 불러오지 못했습니다: ${img.getAttribute("src")}`)), { once: true });
    })));
    fitImages(element);
    return element;
  }

  function clonePage(page, pageNumber) {
    const copy = page.cloneNode(true);
    copy.querySelector("[data-dd-content]").replaceChildren();
    copy.classList.add("dd-page-continuation");
    copy.dataset.continuation = String(pageNumber);
    if (pageNumber % 2 === 0) copy.dataset.pageSide = page.dataset.pageSide === "left" ? "right" : "left";
    copy.querySelector(".dd-page-number").textContent += ` · ${pageNumber}`;
    copy.querySelector(".dd-running-head").lastElementChild.textContent += " · 이어서";
    return copy;
  }
  function fits(content) {
    return content.scrollHeight <= content.clientHeight + 1;
  }
  function splitText(block, content) {
    if (block.children.length || !/^(P|BLOCKQUOTE)$/.test(block.tagName)) return null;
    const original = block.textContent;
    if (original.length < 20) return null;
    let low = 0; let high = original.length;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      block.textContent = original.slice(0, mid);
      if (fits(content)) low = mid; else high = mid - 1;
    }
    if (low < 8 || low >= original.length) { block.textContent = original; return null; }
    const whitespace = original.lastIndexOf(" ", low);
    const split = whitespace > low * .7 ? whitespace + 1 : low;
    block.textContent = original.slice(0, split);
    const rest = block.cloneNode(false); rest.textContent = original.slice(split); rest.classList.add("dd-paragraph-continuation");
    return rest;
  }
  function splitTable(block, content) {
    const body = block.querySelector("tbody");
    if (!body || body.children.length < 2) return null;
    const remaining = [];
    while (!fits(content) && body.children.length > 1) remaining.unshift(body.removeChild(body.lastElementChild));
    if (!fits(content)) { remaining.forEach((row) => body.append(row)); return null; }
    const rest = block.cloneNode(true);
    rest.querySelector("tbody").replaceChildren(...remaining);
    const caption = rest.querySelector("caption");
    if (caption) caption.textContent = caption.textContent.replace(/ · 이어서$/, "") + " · 이어서";
    return rest;
  }
  function paginate(element) {
    const originalParent = element.parentNode;
    let stage;
    if (!element.isConnected) {
      stage = document.createElement("div"); stage.style.cssText = "position:absolute;left:-100000px;top:0;pointer-events:none;";
      document.body.append(stage); stage.append(element);
    }
    const content = element.querySelector("[data-dd-content]");
    const queue = [...content.children];
    content.replaceChildren();
    const result = [element];
    let current = element; let currentContent = content;
    let guard = 0;
    const nextPage = () => {
      current = clonePage(element, result.length + 1); currentContent = current.querySelector("[data-dd-content]");
      element.parentNode.insertBefore(current, result[result.length - 1].nextSibling); result.push(current);
    };
    while (queue.length && guard < 500) {
      guard += 1;
      const block = queue.shift(); currentContent.append(block);
      if (fits(currentContent)) continue;
      const remainder = splitText(block, currentContent) || splitTable(block, currentContent);
      if (remainder) { queue.unshift(remainder); nextPage(); continue; }
      if (currentContent.children.length > 1) { block.remove(); queue.unshift(block); nextPage(); continue; }
      // A compound sample block may be taller than the available page area.
      // Unwrap its flow children instead of hiding content or reducing type size.
      if (block.children.length > 1 && !["TABLE", "FIGURE"].includes(block.tagName)) {
        const pieces = [...block.children]; block.remove(); queue.unshift(...pieces); continue;
      }
      const frame = block.querySelector(".dd-photo-frame");
      if (frame) { frame.style.height = `${Math.max(60, currentContent.clientHeight - 64)}px`; if (fits(currentContent)) continue; }
      // Keep the complete block visibly available when an indivisible custom
      // element cannot fit; callers can surface this explicit export failure.
      current.dataset.overflow = "true";
    }
    if (queue.length) { queue.forEach((node) => currentContent.append(node)); current.dataset.overflow = "true"; }
    result.forEach(fitImages);
    if (stage) {
      result.forEach((node) => node.remove()); stage.remove();
      if (originalParent) originalParent.append(element);
    }
    return result;
  }
  window.PromptDeckDocumentRenderer = { version: 3, renderPage, ready, paginate };
})();
