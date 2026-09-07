(function () {
  "use strict";

  const LONG_SIDE = 1600;
  const encoder = new TextEncoder();
  let captureLibrary;

  function clone(value) {
    return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze);
    return Object.freeze(value);
  }

  function checkCancelled(signal) {
    if (signal?.aborted) throw new DOMException("참고 이미지 저장을 취소했습니다.", "AbortError");
  }

  function withSignal(promise, signal) {
    if (signal?.aborted) {
      // The operation may already have started while evaluating the argument.
      // Consume its eventual rejection after the cancelled iframe is removed.
      Promise.resolve(promise).catch(() => {});
      checkCancelled(signal);
    }
    if (!signal) return promise;
    return new Promise((resolve, reject) => {
      const abort = () => reject(new DOMException("참고 이미지 저장을 취소했습니다.", "AbortError"));
      signal.addEventListener("abort", abort, { once: true });
      Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
    });
  }

  function loadCapture(signal) {
    if (typeof window.html2canvas === "function") return Promise.resolve(window.html2canvas);
    if (!captureLibrary) {
      captureLibrary = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = new URL("assets/vendor/html2canvas.min.js?v=1", document.baseURI).href;
        script.dataset.documentCapture = "true";
        script.onload = () => {
          if (typeof window.html2canvas === "function") resolve(window.html2canvas);
          else reject(new Error("이미지 저장 도구를 시작하지 못했습니다. 다시 시도해 주세요."));
        };
        script.onerror = () => {
          script.remove();
          reject(new Error("이미지 저장 도구를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요."));
        };
        document.head.append(script);
      }).catch((error) => { captureLibrary = undefined; throw error; });
    }
    return withSignal(captureLibrary, signal);
  }

  function png(canvas) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("참고 이미지를 만들지 못했습니다.")), "image/png");
      } catch (error) { reject(error); }
    });
  }

  function safeName(value) {
    return String(value || "page").replace(/[^a-zA-Z0-9가-힣_-]/g, "-").slice(0, 90);
  }

  function selectedPages(design, state, options) {
    const pages = design.pages || [];
    if (!pages.length) throw new Error("저장할 문서 견본 페이지가 없습니다.");
    const known = new Set(pages.map((page) => page.id));
    let ids = options.pageIds;
    if (options.kind === "page") ids = [ids?.[0] || state.activePageId || pages[0].id];
    if (!ids?.length) {
      const cover = pages.find((page) => page.id === "cover" || page.role === "cover") || pages[0];
      const body = pages.find((page) => page.id === "body" || page.role === "body") || pages[1] || cover;
      const special = pages.find((page) => page.id !== cover.id && page.id !== body.id && !["chapter", "divider"].includes(page.role || page.id)) || pages.at(-1);
      ids = [cover.id, body.id, special.id];
    }
    const unique = [...new Set(ids)];
    if (unique.some((id) => !known.has(id))) throw new Error("선택한 페이지가 현재 디자인 세트에 없습니다. 페이지를 다시 선택해 주세요.");
    return unique;
  }

  async function createStage(signal) {
    const frame = document.createElement("iframe");
    frame.dataset.documentExportStage = "true";
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.title = "문서 참고 이미지 저장";
    frame.style.cssText = "position:fixed;left:-30000px;top:0;width:1800px;height:1800px;border:0;pointer-events:none;visibility:visible;";
    document.body.append(frame);
    try {
      const doc = frame.contentDocument;
      doc.open();
      doc.write("<!doctype html><html lang='ko'><head><meta charset='utf-8'></head><body></body></html>");
      doc.close();
      const base = doc.createElement("base");
      base.href = document.baseURI;
      const style = doc.createElement("style");
      style.textContent = "html,body{margin:0;padding:0;background:transparent;color-scheme:light}body{width:max-content;}";
      doc.head.append(base, style);
      await withSignal(Promise.all(["document-design-fonts.css", "document-design-pages.css"].map((filename) => new Promise((resolve, reject) => {
        const current = [...document.querySelectorAll("link[rel='stylesheet']")].find((link) => new URL(link.href).pathname.endsWith(`/${filename}`));
        const link = doc.createElement("link");
        link.rel = "stylesheet";
        link.href = current?.href || new URL(`styles/${filename}`, document.baseURI).href;
        link.onload = resolve;
        link.onerror = () => reject(new Error("참고 이미지의 문서 스타일을 불러오지 못했습니다. 다시 시도해 주세요."));
        doc.head.append(link);
      }))), signal);
      const stage = doc.createElement("div");
      doc.body.append(stage);
      return { frame, stage, doc };
    } catch (error) { frame.remove(); throw error; }
  }

  async function readyForCapture(renderer, node, doc, signal) {
    await withSignal(renderer.ready(node), signal);
    if (!doc.fonts) return;
    const families = new Set([...node.querySelectorAll("h1,h2,h3,p,td,th,figcaption,blockquote")].map((element) => doc.defaultView.getComputedStyle(element).fontFamily.split(",")[0].trim()).filter(Boolean));
    await withSignal(Promise.all([...families].map((family) => doc.fonts.load(`16px ${family}`, "문서 디자인"))), signal);
    await withSignal(doc.fonts.ready, signal);
    for (const family of families) if (!doc.fonts.check(`16px ${family}`, "문서 디자인")) throw new Error(`참고 이미지의 서체를 불러오지 못했습니다: ${family}`);
  }

  async function capturePages(resolved, pageIds, options) {
    const renderer = window.PromptDeckDocumentRenderer;
    if (!renderer?.renderPage || !renderer?.ready || !renderer?.paginate) throw new Error("문서 미리보기 도구를 준비하지 못했습니다.");
    const capture = await loadCapture(options.signal);
    const { frame, stage, doc } = await createStage(options.signal);
    const images = [];
    try {
      for (let index = 0; index < pageIds.length; index += 1) {
        checkCancelled(options.signal);
        const id = pageIds[index];
        const definition = resolved.design.pages.find((page) => page.id === id);
        options.onProgress?.(`참고 이미지 ${index + 1}/${pageIds.length} · ${definition.label || definition.title || id}`);
        const original = renderer.renderPage(resolved.design, resolved.previewTokens, id);
        if (!(original instanceof HTMLElement)) throw new Error("문서 페이지를 표시하지 못했습니다.");
        stage.replaceChildren(original);
        await readyForCapture(renderer, original, doc, options.signal);
        checkCancelled(options.signal);
        const fragments = await renderer.paginate(original);
        if (!Array.isArray(fragments) || !fragments.length) throw new Error("문서 페이지를 나누지 못했습니다.");
        for (let continuation = 0; continuation < fragments.length; continuation += 1) {
          checkCancelled(options.signal);
          const node = fragments[continuation];
          stage.replaceChildren(node);
          node.style.transform = "none";
          node.style.zoom = "1";
          node.style.margin = "0";
          await readyForCapture(renderer, node, doc, options.signal);
          const content = node.querySelector("[data-dd-content]");
          if (node.dataset.overflow === "true" || (content && (content.scrollHeight > content.clientHeight + 2 || content.scrollWidth > content.clientWidth + 2))) {
            throw new Error("현재 판형에서 견본 일부가 페이지를 넘칩니다. 용지 크기나 여백을 조정한 뒤 다시 저장해 주세요.");
          }
          const rect = node.getBoundingClientRect();
          const width = Math.ceil(rect.width);
          const height = Math.ceil(rect.height);
          if (width <= 0 || height <= 0) throw new Error("문서 페이지 크기를 확인하지 못했습니다.");
          let captureFrame;
          let canvas;
          try {
            canvas = await capture(node, {
              backgroundColor: null,
              scale: Math.min(2, LONG_SIDE / Math.max(width, height)),
              width,
              height,
              windowWidth: Math.max(1280, width),
              windowHeight: Math.max(900, height),
              scrollX: 0,
              scrollY: 0,
              logging: false,
              useCORS: true,
              allowTaint: false,
              imageTimeout: 15000,
              removeContainer: true,
              onclone(clonedDocument) { captureFrame = clonedDocument.defaultView?.frameElement; },
            });
            checkCancelled(options.signal);
            const blob = await png(canvas);
            images.push({
              id,
              label: `${definition.label || definition.title || id}${continuation ? ` · 이어지는 면 ${continuation + 1}` : ""}`,
              name: `pages/${String(index + 1).padStart(2, "0")}-${safeName(id)}${continuation ? `-${continuation + 1}` : ""}.png`,
              blob,
              width: canvas.width,
              height: canvas.height,
            });
          } finally {
            if (canvas) { canvas.width = 0; canvas.height = 0; }
            captureFrame?.remove();
          }
        }
      }
      return images;
    } finally { stage.replaceChildren(); frame.remove(); }
  }

  async function imageFromBlob(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    } finally { URL.revokeObjectURL(url); }
  }

  async function referenceSheet(images, options) {
    const columns = Math.min(3, images.length);
    const rows = Math.ceil(images.length / columns);
    const cellWidth = 480;
    const cellHeight = 660;
    const gap = 24;
    const naturalWidth = columns * cellWidth + (columns + 1) * gap;
    const naturalHeight = rows * cellHeight + (rows + 1) * gap + 64;
    const scale = LONG_SIDE / Math.max(naturalWidth, naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(naturalWidth * scale);
    canvas.height = Math.round(naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("참고 시트를 만들지 못했습니다.");
    try {
      context.scale(scale, scale);
      context.fillStyle = "#edf0f4";
      context.fillRect(0, 0, naturalWidth, naturalHeight);
      context.fillStyle = "#25354a";
      context.font = '600 23px "PromptDeck Sans", "Noto Sans KR", sans-serif';
      context.fillText("디자인 견본 · 내용은 예시", gap, 42);
      for (let index = 0; index < images.length; index += 1) {
        checkCancelled(options.signal);
        const item = images[index];
        const image = await withSignal(imageFromBlob(item.blob), options.signal);
        const x = gap + (index % columns) * (cellWidth + gap);
        const y = 64 + gap + Math.floor(index / columns) * (cellHeight + gap);
        const ratio = Math.min(cellWidth / item.width, (cellHeight - 42) / item.height);
        const width = item.width * ratio;
        const height = item.height * ratio;
        context.drawImage(image, x + (cellWidth - width) / 2, y, width, height);
        context.fillStyle = "#25354a";
        context.font = '500 19px "PromptDeck Sans", "Noto Sans KR", sans-serif';
        context.fillText(item.label, x, y + cellHeight - 12, cellWidth);
        image.src = "";
      }
      checkCancelled(options.signal);
      return await png(canvas);
    } finally { canvas.width = 0; canvas.height = 0; }
  }

  async function createFiles(inputState, inputOptions = {}) {
    const snapshot = freeze(clone(inputState));
    const options = { kind: "zip", ...inputOptions, pageIds: inputOptions.pageIds ? [...inputOptions.pageIds] : undefined };
    checkCancelled(options.signal);
    if (!["page", "sheet", "zip"].includes(options.kind)) throw new Error("지원하지 않는 저장 방식입니다.");
    const resolver = window.PromptDeckDocumentResolver;
    const contract = window.PromptDeckDocumentDesignContract;
    if (!resolver?.resolve || !contract?.build) throw new Error("문서 디자인 설정을 준비하지 못했습니다.");
    const resolved = resolver.resolve(snapshot);
    const selected = selectedPages(resolved.design, resolved.state || snapshot, options);
    // User text never enters a design-only file, including the reusable JSON.
    const designOnlyState = clone(resolved.state || snapshot);
    designOnlyState.sourcePrompt = "";
    const built = contract.build(designOnlyState);
    options.onProgress?.("저장 시작 시점의 설정으로 참고 이미지를 준비합니다.");
    const images = await capturePages(resolved, selected, options);
    checkCancelled(options.signal);
    const files = [];
    if (options.kind !== "sheet") {
      for (const item of images) files.push({ name: item.name, data: new Uint8Array(await item.blob.arrayBuffer()) });
    }
    if (options.kind !== "page") {
      options.onProgress?.("참고 시트를 구성합니다.");
      const sheet = await referenceSheet(images, options);
      files.push({ name: "reference-sheet.png", data: new Uint8Array(await sheet.arrayBuffer()) });
    }
    if (options.kind === "zip") {
      files.push(
        { name: "design-prompt.txt", data: encoder.encode(built.designPrompt) },
        { name: "design-spec.json", data: encoder.encode(JSON.stringify(built.spec, null, 2)) },
        { name: "README.txt", data: encoder.encode([
          "PromptDeck 문서 디자인 참고 자료",
          "",
          "저장 시작 시점의 설정으로 디자인 지침과 참고 이미지를 함께 생성했습니다.",
          "1. 제작 AI에 실제 문서 내용 또는 작성 요청을 전달합니다.",
          "2. design-prompt.txt의 디자인 지침을 요청 뒤에 붙입니다.",
          "3. reference-sheet.png 또는 pages 폴더의 이미지를 함께 첨부합니다.",
          "4. 이미지의 예시 문장·숫자·문제·정답을 실제 자료로 옮기지 않도록 안내합니다.",
          "",
          "이미지는 디자인 참조용입니다. 실제 내용과 분량에 맞춘 최종 문서는 제작 AI가 구성합니다.",
          "용지 크기·방향은 design-spec.json의 물리 규격을 따르고 실제 문서에서 다시 확인합니다.",
          "서체가 제작 환경에 없으면 같은 역할의 서체로 대체하고 줄바꿈과 표 넘침을 확인합니다.",
          options.includeSource ? "작성 요청 포함을 선택하여 source-prompt.txt에 원문을 그대로 저장했습니다." : "원문 작성 요청은 이 묶음에 포함하지 않았습니다.",
        ].join("\n")) },
      );
      if (options.includeSource) files.push({ name: "source-prompt.txt", data: encoder.encode(String(snapshot.sourcePrompt || "")) });
    }
    checkCancelled(options.signal);
    return files;
  }

  async function download(inputState, options = {}) {
    const snapshot = freeze(clone(inputState));
    const files = await createFiles(snapshot, options);
    checkCancelled(options.signal);
    const single = files.length === 1 && files[0].name.endsWith(".png");
    if (!single && typeof window.createZip !== "function") throw new Error("묶음 저장 도구를 준비하지 못했습니다.");
    const filename = single ? files[0].name.split("/").at(-1) : `promptdeck-${safeName(snapshot.bundleId)}-design.zip`;
    const blob = single ? new Blob([files[0].data], { type: "image/png" }) : window.createZip(files);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    try {
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = "none";
      document.body.append(anchor);
      checkCancelled(options.signal);
      anchor.click();
      await new Promise((resolve) => setTimeout(resolve, 250));
    } finally { anchor.remove(); URL.revokeObjectURL(url); }
    options.onProgress?.("저장 시작 시점의 설정으로 파일 다운로드를 시작했습니다.");
    return { filename, files: files.map((file) => file.name), count: files.length, snapshot };
  }

  window.PromptDeckDocumentExport = { createFiles, download };
})();
