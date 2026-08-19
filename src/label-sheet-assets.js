// PromptDeck label/ticket raster asset registry.
// Keeps uploads local, creates thumbnails/print derivatives, and exposes pure helpers for tests.
(function (root) {
  "use strict";

  const SUPPORTED_MIME_TYPES = Object.freeze(["image/png", "image/jpeg", "image/webp"]);
  const DEFAULT_DPI = 300;
  const DEFAULT_THUMBNAIL_EDGE = 320;
  const MIN_NORMALIZED_CROP_SIZE = 0.0001;
  const DB_NAME = "promptdeck-label-sheet-assets";
  const DB_VERSION = 1;
  const STORE_NAME = "assets";

  const MIME_BY_EXTENSION = Object.freeze({
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  });

  class LabelSheetAssetError extends Error {
    constructor(code, message, details) {
      super(message);
      this.name = "LabelSheetAssetError";
      this.code = code;
      if (details !== undefined) this.details = details;
    }
  }

  function clamp(value, minimum, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number)) return minimum;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function normalizeMime(value) {
    const mime = String(value || "")
      .trim()
      .toLowerCase()
      .split(";", 1)[0];
    return mime === "image/jpg" ? "image/jpeg" : mime;
  }

  function extensionFromFilename(filename) {
    const match = String(filename || "").trim().match(/\.([^.\\/]+)$/);
    return match ? match[1].toLowerCase() : "";
  }

  function mimeFromFilename(filename) {
    return MIME_BY_EXTENSION[extensionFromFilename(filename)] || "";
  }

  function resolveRasterMime(input, filename) {
    const supplied = normalizeMime(
      typeof input === "string" ? input : input && typeof input === "object" ? input.type : ""
    );
    const inferred = mimeFromFilename(filename || input?.name || "");
    if (supplied === "image/svg+xml" || extensionFromFilename(filename || input?.name) === "svg") {
      return "image/svg+xml";
    }
    // Some local/static servers deliver WebP files as application/octet-stream.
    // Prefer the trusted filename extension in that generic case so valid default
    // backgrounds are not surfaced as a user-facing unsupported-image error.
    return supplied === "application/octet-stream" ? inferred : supplied || inferred;
  }

  function isSupportedRasterMime(value, filename) {
    return SUPPORTED_MIME_TYPES.includes(resolveRasterMime(value, filename));
  }

  function normalizeFilename(value) {
    const text = String(value || "")
      .trim()
      .replace(/^['"]|['"]$/g, "")
      .replace(/\\/g, "/");
    const basename = text.split("/").pop() || "";
    return basename.normalize ? basename.normalize("NFC").toLocaleLowerCase("en-US") : basename.toLowerCase();
  }

  function calculateTargetPixels(widthMm, heightMm, dpi = DEFAULT_DPI, bleedMm = 0) {
    const safeDpi = Math.max(1, Number(dpi) || DEFAULT_DPI);
    const bleed = Math.max(0, Number(bleedMm) || 0);
    const width = Math.max(0, Number(widthMm) || 0) + bleed * 2;
    const height = Math.max(0, Number(heightMm) || 0) + bleed * 2;
    return {
      width: Math.max(1, Math.round((width / 25.4) * safeDpi)),
      height: Math.max(1, Math.round((height / 25.4) * safeDpi)),
      dpi: safeDpi,
      bleedMm: bleed,
    };
  }

  function pageDimensions(pageSpec) {
    const input = pageSpec && typeof pageSpec === "object" ? pageSpec : {};
    const source = input.page && typeof input.page === "object"
      ? input.page
      : input.paper && typeof input.paper === "object"
        ? input.paper
        : input;
    const orientation = String(source.orientation || input.orientation || "portrait").toLowerCase() === "landscape"
      ? "landscape"
      : "portrait";
    const defaultWidth = orientation === "landscape" ? 297 : 210;
    const defaultHeight = orientation === "landscape" ? 210 : 297;
    const suppliedWidth = Number(source.widthMm ?? source.pageWidthMm);
    const suppliedHeight = Number(source.heightMm ?? source.pageHeightMm);
    return {
      widthMm: Number.isFinite(suppliedWidth) && suppliedWidth > 0 ? suppliedWidth : defaultWidth,
      heightMm: Number.isFinite(suppliedHeight) && suppliedHeight > 0 ? suppliedHeight : defaultHeight,
      orientation,
    };
  }

  function normalizedCropAxis(startMm, endMm, pageSizeMm) {
    const minimumMm = pageSizeMm * MIN_NORMALIZED_CROP_SIZE;
    let start = clamp(Math.min(startMm, endMm), 0, pageSizeMm);
    let end = clamp(Math.max(startMm, endMm), 0, pageSizeMm);
    if (end - start < minimumMm) {
      const center = clamp((startMm + endMm) / 2, 0, pageSizeMm);
      start = clamp(center - minimumMm / 2, 0, pageSizeMm - minimumMm);
      end = start + minimumMm;
    }
    const normalizedStart = Math.round((start / pageSizeMm) * 1e12) / 1e12;
    const normalizedEnd = Math.round((end / pageSizeMm) * 1e12) / 1e12;
    const normalizedSize = Math.round((normalizedEnd - normalizedStart) * 1e12) / 1e12;
    return {
      start: clamp(normalizedStart, 0, 1 - MIN_NORMALIZED_CROP_SIZE),
      size: clamp(normalizedSize, MIN_NORMALIZED_CROP_SIZE, 1),
    };
  }

  /**
   * Converts a physical rectangle on one full-page raster into a normalized crop.
   * Explicit positive page width/height are authoritative; orientation selects the
   * A4 210x297 or 297x210 fallback only when dimensions are absent. `bleedMm`
   * expands every edge and `insetMm` shrinks every edge before page clamping.
   */
  function calculatePageCrop(rectMm, pageSpec, options = {}) {
    const page = pageDimensions(pageSpec);
    const rect = rectMm && typeof rectMm === "object" ? rectMm : {};
    let x = Number(rect.xMm ?? rect.leftMm ?? rect.x ?? 0);
    let y = Number(rect.yMm ?? rect.topMm ?? rect.y ?? 0);
    let width = Number(rect.widthMm ?? rect.wMm ?? rect.width ?? 0);
    let height = Number(rect.heightMm ?? rect.hMm ?? rect.height ?? 0);
    if (!Number.isFinite(x)) x = 0;
    if (!Number.isFinite(y)) y = 0;
    if (!Number.isFinite(width)) width = 0;
    if (!Number.isFinite(height)) height = 0;
    if (width < 0) {
      x += width;
      width = Math.abs(width);
    }
    if (height < 0) {
      y += height;
      height = Math.abs(height);
    }

    const bleed = Math.max(0, Number(options.bleedMm) || 0);
    const inset = Math.max(0, Number(options.insetMm) || 0);
    let left = x - bleed + inset;
    let top = y - bleed + inset;
    let right = x + width + bleed - inset;
    let bottom = y + height + bleed - inset;
    if (right < left) {
      const center = (left + right) / 2;
      left = center;
      right = center;
    }
    if (bottom < top) {
      const center = (top + bottom) / 2;
      top = center;
      bottom = center;
    }

    const horizontal = normalizedCropAxis(left, right, page.widthMm);
    const vertical = normalizedCropAxis(top, bottom, page.heightMm);
    return {
      x: horizontal.start,
      y: vertical.start,
      width: horizontal.size,
      height: vertical.size,
    };
  }

  function normalizeCrop(crop) {
    if (!crop || typeof crop !== "object") return { x: 0, y: 0, width: 1, height: 1 };
    const x = clamp(crop.x ?? crop.left ?? 0, 0, 0.9999);
    const y = clamp(crop.y ?? crop.top ?? 0, 0, 0.9999);
    const width = clamp(crop.width ?? 1 - x, 0.0001, 1 - x || 0.0001);
    const height = clamp(crop.height ?? 1 - y, 0.0001, 1 - y || 0.0001);
    return { x, y, width, height };
  }

  function normalizeFocalPoint(focalPoint) {
    return {
      x: clamp(focalPoint?.x ?? 0.5, 0, 1),
      y: clamp(focalPoint?.y ?? 0.5, 0, 1),
    };
  }

  /**
   * Calculates source and destination rectangles for drawImage().
   * crop values and focalPoint values are normalized to 0..1.
   */
  function calculateDrawRect(sourceWidth, sourceHeight, targetWidth, targetHeight, options = {}) {
    const sourceW = Math.max(1, Number(sourceWidth) || 1);
    const sourceH = Math.max(1, Number(sourceHeight) || 1);
    const targetW = Math.max(1, Number(targetWidth) || 1);
    const targetH = Math.max(1, Number(targetHeight) || 1);
    const crop = normalizeCrop(options.crop);
    const focal = normalizeFocalPoint(options.focalPoint);
    const fit = options.fit === "contain" ? "contain" : options.fit === "stretch" ? "stretch" : "cover";

    const cropX = sourceW * crop.x;
    const cropY = sourceH * crop.y;
    const cropW = Math.max(1, sourceW * crop.width);
    const cropH = Math.max(1, sourceH * crop.height);

    if (fit === "stretch") {
      return { sx: cropX, sy: cropY, sw: cropW, sh: cropH, dx: 0, dy: 0, dw: targetW, dh: targetH, fit };
    }

    if (fit === "contain") {
      const scale = Math.min(targetW / cropW, targetH / cropH);
      const dw = cropW * scale;
      const dh = cropH * scale;
      return {
        sx: cropX,
        sy: cropY,
        sw: cropW,
        sh: cropH,
        dx: (targetW - dw) * focal.x,
        dy: (targetH - dh) * focal.y,
        dw,
        dh,
        fit,
      };
    }

    const targetRatio = targetW / targetH;
    const cropRatio = cropW / cropH;
    let sw = cropW;
    let sh = cropH;
    if (cropRatio > targetRatio) sw = cropH * targetRatio;
    else if (cropRatio < targetRatio) sh = cropW / targetRatio;

    const extraX = cropW - sw;
    const extraY = cropH - sh;
    return {
      sx: cropX + extraX * focal.x,
      sy: cropY + extraY * focal.y,
      sw,
      sh,
      dx: 0,
      dy: 0,
      dw: targetW,
      dh: targetH,
      fit,
    };
  }

  function calculateDerivativeSize(sourceWidth, sourceHeight, requestedWidth, requestedHeight, drawRect, allowUpscale) {
    const requestW = Math.max(1, Math.round(requestedWidth));
    const requestH = Math.max(1, Math.round(requestedHeight));
    const contentW = Math.max(1, Number(drawRect?.dw) || requestW);
    const contentH = Math.max(1, Number(drawRect?.dh) || requestH);
    const availableW = Math.max(1, Number(drawRect?.sw) || sourceWidth || 1);
    const availableH = Math.max(1, Number(drawRect?.sh) || sourceHeight || 1);
    const requiredScale = Math.max(contentW / availableW, contentH / availableH);
    const lowResolution = requiredScale > 1.001;
    const scale = !allowUpscale && lowResolution ? Math.min(1, availableW / contentW, availableH / contentH) : 1;
    return {
      width: Math.max(1, Math.round(requestW * scale)),
      height: Math.max(1, Math.round(requestH * scale)),
      requestedWidth: requestW,
      requestedHeight: requestH,
      scale,
      requiredScale,
      lowResolution,
      upscaled: Boolean(allowUpscale && lowResolution),
    };
  }

  function stableStringHash(text) {
    let hash = 2166136261;
    const value = String(text || "");
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function cryptoProvider() {
    return root.crypto || (typeof crypto !== "undefined" ? crypto : null);
  }

  async function hashBlob(blob) {
    const provider = cryptoProvider();
    if (!provider?.subtle || typeof blob?.arrayBuffer !== "function") return "";
    try {
      const digest = await provider.subtle.digest("SHA-256", await blob.arrayBuffer());
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    } catch (_error) {
      return "";
    }
  }

  function makeObjectUrl(blob) {
    const api = root.URL || (typeof URL !== "undefined" ? URL : null);
    return api?.createObjectURL && blob ? api.createObjectURL(blob) : "";
  }

  function revokeObjectUrl(url) {
    if (!url || !String(url).startsWith("blob:")) return;
    const api = root.URL || (typeof URL !== "undefined" ? URL : null);
    try {
      api?.revokeObjectURL?.(url);
    } catch (_error) {
      // Object URLs are a best-effort browser resource.
    }
  }

  function isBlobLike(value) {
    return Boolean(value && typeof value === "object" && typeof value.arrayBuffer === "function" && "size" in value);
  }

  function canvasFactory(width, height, preferDom = false) {
    const safeWidth = Math.max(1, Math.round(width));
    const safeHeight = Math.max(1, Math.round(height));
    if (!preferDom && typeof root.OffscreenCanvas === "function") {
      return new root.OffscreenCanvas(safeWidth, safeHeight);
    }
    if (root.document?.createElement) {
      const canvas = root.document.createElement("canvas");
      canvas.width = safeWidth;
      canvas.height = safeHeight;
      return canvas;
    }
    throw new LabelSheetAssetError("CANVAS_UNAVAILABLE", "이 브라우저에서는 이미지 축소용 Canvas를 사용할 수 없습니다.");
  }

  function getContext(canvas) {
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new LabelSheetAssetError("CANVAS_CONTEXT_UNAVAILABLE", "이미지 처리 컨텍스트를 만들 수 없습니다.");
    context.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in context) context.imageSmoothingQuality = "high";
    return context;
  }

  function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
    if (typeof canvas.convertToBlob === "function") return canvas.convertToBlob({ type, quality });
    if (typeof canvas.toBlob === "function") {
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new LabelSheetAssetError("ENCODE_FAILED", "이미지 인코딩에 실패했습니다."))),
          type,
          quality
        );
      });
    }
    throw new LabelSheetAssetError("ENCODE_UNAVAILABLE", "이 브라우저에서는 이미지 파일을 만들 수 없습니다.");
  }

  async function yieldToBrowser() {
    if (typeof root.requestIdleCallback === "function") {
      await new Promise((resolve) => root.requestIdleCallback(resolve, { timeout: 48 }));
      return;
    }
    await new Promise((resolve) => root.setTimeout(resolve, 0));
  }

  async function decodeRaster(blob) {
    if (typeof root.createImageBitmap === "function") {
      const bitmap = await root.createImageBitmap(blob);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close?.(),
      };
    }
    if (typeof root.Image === "function") {
      const url = makeObjectUrl(blob);
      const image = new root.Image();
      image.decoding = "async";
      try {
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () => reject(new LabelSheetAssetError("DECODE_FAILED", "이미지 파일을 해석할 수 없습니다."));
          image.src = url;
        });
        return {
          source: image,
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
          close: () => revokeObjectUrl(url),
        };
      } catch (error) {
        revokeObjectUrl(url);
        throw error;
      }
    }
    throw new LabelSheetAssetError("DECODE_UNAVAILABLE", "이 환경에서는 래스터 이미지를 해석할 수 없습니다.");
  }

  async function stagedResize(source, sourceRect, outputRect, outputWidth, outputHeight) {
    const destinationContentWidth = Math.max(1, Math.round(outputRect.dw));
    const destinationContentHeight = Math.max(1, Math.round(outputRect.dh));
    let currentSource = source;
    let currentWidth = Math.max(1, Math.round(sourceRect.sw));
    let currentHeight = Math.max(1, Math.round(sourceRect.sh));
    let sourceX = sourceRect.sx;
    let sourceY = sourceRect.sy;
    let ownsCurrent = false;

    while (currentWidth > destinationContentWidth * 2 || currentHeight > destinationContentHeight * 2) {
      const nextWidth = Math.max(destinationContentWidth, Math.round(currentWidth / 2));
      const nextHeight = Math.max(destinationContentHeight, Math.round(currentHeight / 2));
      const nextCanvas = canvasFactory(nextWidth, nextHeight);
      const context = getContext(nextCanvas);
      context.clearRect(0, 0, nextWidth, nextHeight);
      context.drawImage(currentSource, sourceX, sourceY, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight);
      if (ownsCurrent && typeof currentSource.close === "function") currentSource.close();
      currentSource = nextCanvas;
      currentWidth = nextWidth;
      currentHeight = nextHeight;
      sourceX = 0;
      sourceY = 0;
      ownsCurrent = true;
      await yieldToBrowser();
    }

    const output = canvasFactory(outputWidth, outputHeight);
    const outputContext = getContext(output);
    outputContext.clearRect(0, 0, outputWidth, outputHeight);
    outputContext.drawImage(
      currentSource,
      sourceX,
      sourceY,
      currentWidth,
      currentHeight,
      outputRect.dx,
      outputRect.dy,
      outputRect.dw,
      outputRect.dh
    );
    if (ownsCurrent && typeof currentSource.close === "function") currentSource.close();
    return output;
  }

  function serializableAsset(record, persistDerivatives) {
    return {
      assetId: record.assetId,
      hash: record.hash,
      fingerprint: record.fingerprint,
      source: record.source,
      filename: record.filename,
      aliases: Array.from(record.aliases),
      mime: record.mime,
      size: record.size,
      width: record.width,
      height: record.height,
      status: record.status,
      warnings: record.warnings,
      errors: record.errors,
      duplicateCount: record.duplicateCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      settings: record.settings,
      originalBlob: record.original.blob,
      thumbnail: record.thumbnail
        ? { blob: record.thumbnail.blob, width: record.thumbnail.width, height: record.thumbnail.height, mime: record.thumbnail.mime }
        : null,
      derivatives: persistDerivatives
        ? Array.from(record.derivatives.values()).map((item) => ({
            ...item,
            url: undefined,
          }))
        : [],
    };
  }

  function hydrateAsset(saved) {
    const record = {
      assetId: saved.assetId,
      hash: saved.hash || "",
      fingerprint: saved.fingerprint || "",
      source: saved.source || "upload",
      filename: saved.filename || "image",
      aliases: new Set(saved.aliases || [saved.filename]),
      mime: saved.mime,
      size: saved.size || saved.originalBlob?.size || 0,
      width: saved.width || 0,
      height: saved.height || 0,
      status: saved.status === "processing" ? "registered" : saved.status || "registered",
      warnings: Array.isArray(saved.warnings) ? saved.warnings : [],
      errors: Array.isArray(saved.errors) ? saved.errors : [],
      duplicateCount: saved.duplicateCount || 0,
      referenceCount: 0,
      referenceKeys: new Set(),
      anonymousReferences: 0,
      createdAt: saved.createdAt || new Date().toISOString(),
      updatedAt: saved.updatedAt || new Date().toISOString(),
      settings: saved.settings || { fit: "cover", crop: normalizeCrop(), focalPoint: normalizeFocalPoint() },
      original: {
        blob: saved.originalBlob,
        url: makeObjectUrl(saved.originalBlob),
        width: saved.width || 0,
        height: saved.height || 0,
        mime: saved.mime,
      },
      thumbnail: saved.thumbnail?.blob
        ? { ...saved.thumbnail, url: makeObjectUrl(saved.thumbnail.blob) }
        : null,
      derivatives: new Map(),
    };
    for (const item of saved.derivatives || []) {
      if (item?.blob && item.key) record.derivatives.set(item.key, { ...item, url: makeObjectUrl(item.blob) });
    }
    return record;
  }

  class IndexedDbPersistence {
    constructor(options = {}) {
      this.enabled = options.enabled !== false && Boolean(root.indexedDB);
      this.persistDerivatives = options.persistDerivatives !== false;
      this.dbName = options.dbName || DB_NAME;
      this._dbPromise = null;
      this.lastError = null;
    }

    async open() {
      if (!this.enabled) return null;
      if (this._dbPromise) return this._dbPromise;
      this._dbPromise = new Promise((resolve, reject) => {
        const request = root.indexedDB.open(this.dbName, DB_VERSION);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "assetId" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
      }).catch((error) => {
        this.lastError = error;
        this.enabled = false;
        return null;
      });
      return this._dbPromise;
    }

    async all() {
      const database = await this.open();
      if (!database) return [];
      try {
        return await new Promise((resolve, reject) => {
          const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        this.lastError = error;
        return [];
      }
    }

    async put(record) {
      const database = await this.open();
      if (!database) return false;
      try {
        await new Promise((resolve, reject) => {
          const request = database
            .transaction(STORE_NAME, "readwrite")
            .objectStore(STORE_NAME)
            .put(serializableAsset(record, this.persistDerivatives));
          request.onsuccess = resolve;
          request.onerror = () => reject(request.error);
        });
        return true;
      } catch (error) {
        this.lastError = error;
        return false;
      }
    }

    async delete(assetId) {
      const database = await this.open();
      if (!database) return false;
      try {
        await new Promise((resolve, reject) => {
          const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(assetId);
          request.onsuccess = resolve;
          request.onerror = () => reject(request.error);
        });
        return true;
      } catch (error) {
        this.lastError = error;
        return false;
      }
    }
  }

  class SequentialQueue {
    constructor() {
      this._tail = Promise.resolve();
      this.pending = 0;
    }

    add(task) {
      this.pending += 1;
      const run = this._tail.catch(() => undefined).then(task);
      this._tail = run.finally(() => {
        this.pending = Math.max(0, this.pending - 1);
      });
      return run;
    }

    async idle() {
      await this._tail.catch(() => undefined);
    }
  }

  function publicAsset(record) {
    if (!record) return null;
    return {
      assetId: record.assetId,
      id: record.assetId,
      hash: record.hash,
      source: record.source,
      filename: record.filename,
      aliases: Array.from(record.aliases),
      mime: record.mime,
      size: record.size,
      width: record.width,
      height: record.height,
      status: record.status,
      warnings: record.warnings.map((warning) => ({ ...warning })),
      errors: record.errors.map((error) => ({ ...error })),
      duplicateCount: record.duplicateCount,
      referenceCount: record.referenceCount,
      settings: { ...record.settings, crop: { ...record.settings.crop }, focalPoint: { ...record.settings.focalPoint } },
      original: { ...record.original },
      thumbnail: record.thumbnail ? { ...record.thumbnail } : null,
      derivatives: Array.from(record.derivatives.values(), (item) => ({ ...item })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  function derivativeKey(assetId, request, target) {
    return [
      assetId,
      target.width,
      target.height,
      request.fit || "cover",
      JSON.stringify(normalizeCrop(request.crop)),
      JSON.stringify(normalizeFocalPoint(request.focalPoint)),
      request.allowUpscale ? "up" : "native",
      request.background || "transparent",
    ].join(":");
  }

  class LabelSheetAssetStore {
    constructor(options = {}) {
      this.options = {
        thumbnailEdge: Math.max(64, Number(options.thumbnailEdge) || DEFAULT_THUMBNAIL_EDGE),
        persist: options.persist !== false,
        persistDerivatives: options.persistDerivatives !== false,
      };
      this.assets = new Map();
      this.hashIndex = new Map();
      this.filenameIndex = new Map();
      this.queue = new SequentialQueue();
      this.persistence = new IndexedDbPersistence({
        enabled: this.options.persist,
        persistDerivatives: this.options.persistDerivatives,
        dbName: options.dbName,
      });
      this._ready = this._restore();
    }

    async _restore() {
      for (const saved of await this.persistence.all()) {
        if (!saved?.assetId || !isBlobLike(saved.originalBlob)) continue;
        const record = hydrateAsset(saved);
        this.assets.set(record.assetId, record);
        this._index(record);
      }
      return this;
    }

    ready() {
      return this._ready;
    }

    _index(record) {
      if (record.hash) this.hashIndex.set(record.hash, record.assetId);
      for (const alias of record.aliases) {
        const key = normalizeFilename(alias);
        if (!key) continue;
        if (!this.filenameIndex.has(key)) this.filenameIndex.set(key, new Set());
        this.filenameIndex.get(key).add(record.assetId);
      }
    }

    _unindex(record) {
      if (record.hash && this.hashIndex.get(record.hash) === record.assetId) this.hashIndex.delete(record.hash);
      for (const alias of record.aliases) {
        const key = normalizeFilename(alias);
        const ids = this.filenameIndex.get(key);
        ids?.delete(record.assetId);
        if (!ids?.size) this.filenameIndex.delete(key);
      }
    }

    get(assetId) {
      return publicAsset(this.assets.get(assetId));
    }

    list(options = {}) {
      const values = Array.from(this.assets.values());
      const filtered = options.status ? values.filter((record) => record.status === options.status) : values;
      return filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(publicAsset);
    }

    findByFilename(filename) {
      const key = normalizeFilename(filename);
      const ids = Array.from(this.filenameIndex.get(key) || []);
      return {
        filename,
        normalizedFilename: key,
        exact: true,
        status: ids.length === 1 ? "matched" : ids.length > 1 ? "ambiguous" : "missing",
        assets: ids.map((id) => this.get(id)).filter(Boolean),
      };
    }

    async register(input, options = {}) {
      return this.queue.add(async () => {
        await this.ready();
        return this._registerNow(input, options);
      });
    }

    async _registerNow(input, options = {}) {
      if (!isBlobLike(input)) {
        throw new LabelSheetAssetError("INVALID_INPUT", "PNG, JPEG 또는 WebP 파일을 선택해주세요.");
      }
      const filename = String(options.filename || input.name || `image-${Date.now()}`).trim();
      const mime = resolveRasterMime(input, filename);
      if (mime === "image/svg+xml") {
        throw new LabelSheetAssetError("SVG_REJECTED", "SVG는 라벨 배경으로 등록할 수 없습니다. PNG, JPEG 또는 WebP를 사용해주세요.");
      }
      if (!SUPPORTED_MIME_TYPES.includes(mime)) {
        throw new LabelSheetAssetError("UNSUPPORTED_MIME", "PNG, JPEG 또는 WebP 이미지만 등록할 수 있습니다.", { mime, filename });
      }

      const digest = await hashBlob(input);
      const fingerprint = stableStringHash(`${normalizeFilename(filename)}:${input.size}:${mime}:${input.lastModified || 0}`);
      const duplicateId = digest ? this.hashIndex.get(digest) : "";
      if (duplicateId) {
        const duplicate = this.assets.get(duplicateId);
        if (duplicate) {
          duplicate.duplicateCount += 1;
          duplicate.aliases.add(filename);
          duplicate.updatedAt = new Date().toISOString();
          this._index(duplicate);
          await this.persistence.put(duplicate);
          const result = publicAsset(duplicate);
          result.registration = { duplicate: true, duplicateOf: duplicate.assetId };
          return result;
        }
      }

      let assetId = `asset_${(digest || fingerprint).slice(0, 24)}`;
      if (!digest && this.assets.has(assetId)) assetId = `${assetId}_${stableStringHash(`${Date.now()}:${Math.random()}`)}`;
      const now = new Date().toISOString();
      const record = {
        assetId,
        hash: digest,
        fingerprint,
        source: options.source === "generated" ? "generated" : "upload",
        filename,
        aliases: new Set([filename]),
        mime,
        size: input.size,
        width: 0,
        height: 0,
        status: "processing",
        warnings: [],
        errors: [],
        duplicateCount: 0,
        referenceCount: 0,
        referenceKeys: new Set(),
        anonymousReferences: 0,
        createdAt: now,
        updatedAt: now,
        settings: {
          fit: options.fit === "contain" ? "contain" : "cover",
          crop: normalizeCrop(options.crop),
          focalPoint: normalizeFocalPoint(options.focalPoint),
        },
        original: { blob: input, url: makeObjectUrl(input), width: 0, height: 0, mime },
        thumbnail: null,
        derivatives: new Map(),
      };
      this.assets.set(assetId, record);

      let decoded = null;
      try {
        decoded = await decodeRaster(input);
        record.width = decoded.width;
        record.height = decoded.height;
        record.original.width = decoded.width;
        record.original.height = decoded.height;
        const scale = Math.min(1, this.options.thumbnailEdge / Math.max(decoded.width, decoded.height));
        const width = Math.max(1, Math.round(decoded.width * scale));
        const height = Math.max(1, Math.round(decoded.height * scale));
        const rect = calculateDrawRect(decoded.width, decoded.height, width, height, { fit: "contain" });
        const thumbnailCanvas = await stagedResize(decoded.source, rect, rect, width, height);
        const thumbnailBlob = await canvasToBlob(thumbnailCanvas, "image/webp", 0.82).catch(() => canvasToBlob(thumbnailCanvas, "image/png"));
        record.thumbnail = {
          blob: thumbnailBlob,
          url: makeObjectUrl(thumbnailBlob),
          width,
          height,
          mime: thumbnailBlob.type || "image/png",
        };
        record.status = "ready";
        record.updatedAt = new Date().toISOString();
        this._index(record);
        await this.persistence.put(record);
        return publicAsset(record);
      } catch (error) {
        record.status = "failed";
        record.errors.push({ code: error.code || "DECODE_FAILED", message: error.message || "이미지 처리에 실패했습니다." });
        record.updatedAt = new Date().toISOString();
        this._index(record);
        await this.persistence.put(record);
        return publicAsset(record);
      } finally {
        decoded?.close?.();
      }
    }

    async registerFiles(files, options = {}) {
      const inputs = Array.from(files || []);
      const result = { assets: [], duplicates: [], rejected: [] };
      for (let index = 0; index < inputs.length; index += 1) {
        const input = inputs[index];
        try {
          const asset = await this.register(input, { ...options, filename: input?.name || options.filename });
          result.assets.push(asset);
          if (asset.registration?.duplicate) result.duplicates.push({ index, filename: input?.name || "", assetId: asset.assetId });
        } catch (error) {
          result.rejected.push({ index, filename: input?.name || "", code: error.code || "REGISTER_FAILED", message: error.message });
        }
      }
      return result;
    }

    async registerGeneratedUrl(url, options = {}) {
      const base = root.location?.href || "http://localhost/";
      let parsed;
      try {
        parsed = new URL(url, base);
      } catch (_error) {
        throw new LabelSheetAssetError("INVALID_URL", "생성 이미지 주소가 올바르지 않습니다.");
      }
      const currentOrigin = root.location?.origin || new URL(base).origin;
      if (!["http:", "https:", "blob:"].includes(parsed.protocol) || parsed.origin !== currentOrigin) {
        throw new LabelSheetAssetError("CROSS_ORIGIN_REJECTED", "같은 출처에서 생성된 이미지만 등록할 수 있습니다.");
      }
      const response = await root.fetch(parsed.href, { credentials: "same-origin" });
      if (!response.ok) throw new LabelSheetAssetError("FETCH_FAILED", `생성 이미지를 불러오지 못했습니다. (${response.status})`);
      const blob = await response.blob();
      const filename = options.filename || decodeURIComponent(parsed.pathname.split("/").pop() || `generated-${Date.now()}.png`);
      return this.register(blob, { ...options, source: "generated", filename });
    }

    mapFilenames(rows, options = {}) {
      const field = options.field || (options.side === "back" ? "back_background_file" : "front_background_file");
      const matches = [];
      const missing = [];
      const ambiguous = [];
      const empty = [];
      Array.from(rows || []).forEach((row, index) => {
        const candidate = row?.[field] ?? row?.fields?.[field] ?? row?.[options.side || "front"]?.background_file;
        if (!String(candidate || "").trim()) {
          empty.push({ index, row, field });
          return;
        }
        const found = this.findByFilename(candidate);
        const item = { index, row, field, filename: candidate, normalizedFilename: found.normalizedFilename };
        if (found.status === "matched") matches.push({ ...item, assetId: found.assets[0].assetId, asset: found.assets[0] });
        else if (found.status === "ambiguous") ambiguous.push({ ...item, assetIds: found.assets.map((asset) => asset.assetId) });
        else missing.push(item);
      });
      return { field, matches, missing, ambiguous, empty, ok: missing.length === 0 && ambiguous.length === 0 };
    }

    async process(assetId, request = {}) {
      return this.queue.add(async () => {
        await this.ready();
        return this._processNow(assetId, request);
      });
    }

    async _processNow(assetId, request = {}) {
      const record = this.assets.get(assetId);
      if (!record) throw new LabelSheetAssetError("ASSET_NOT_FOUND", "등록된 배경 이미지를 찾을 수 없습니다.", { assetId });
      if (record.status === "failed") throw new LabelSheetAssetError("ASSET_FAILED", "처리에 실패한 배경 이미지는 사용할 수 없습니다.", { assetId });
      const target = request.widthPx && request.heightPx
        ? { width: Math.round(request.widthPx), height: Math.round(request.heightPx), dpi: request.dpi || DEFAULT_DPI, bleedMm: request.bleedMm || 0 }
        : calculateTargetPixels(request.widthMm, request.heightMm, request.dpi, request.bleedMm);
      const settings = {
        fit: request.fit || record.settings.fit || "cover",
        crop: normalizeCrop(request.crop || record.settings.crop),
        focalPoint: normalizeFocalPoint(request.focalPoint || record.settings.focalPoint),
        allowUpscale: request.allowUpscale === true,
        background: request.background || "transparent",
      };
      const key = derivativeKey(assetId, settings, target);
      const existing = record.derivatives.get(key);
      if (existing) return { ...existing };

      const previousStatus = record.status;
      record.status = "processing";
      let decoded = null;
      try {
        decoded = await decodeRaster(record.original.blob);
        const requestedRect = calculateDrawRect(decoded.width, decoded.height, target.width, target.height, settings);
        const size = calculateDerivativeSize(decoded.width, decoded.height, target.width, target.height, requestedRect, settings.allowUpscale);
        const actualRect = calculateDrawRect(decoded.width, decoded.height, size.width, size.height, settings);
        const canvas = await stagedResize(decoded.source, actualRect, actualRect, size.width, size.height);
        if (settings.background !== "transparent") {
          const composited = canvasFactory(size.width, size.height);
          const context = getContext(composited);
          context.fillStyle = settings.background;
          context.fillRect(0, 0, size.width, size.height);
          context.drawImage(canvas, 0, 0);
          const blob = await canvasToBlob(composited, "image/png");
          return this._saveDerivative(record, key, blob, target, size, settings);
        }
        const blob = await canvasToBlob(canvas, "image/png");
        return this._saveDerivative(record, key, blob, target, size, settings);
      } catch (error) {
        record.status = previousStatus === "processing" ? "ready" : previousStatus;
        record.errors = record.errors.filter((item) => item.code !== "DERIVATIVE_FAILED");
        record.errors.push({ code: "DERIVATIVE_FAILED", message: error.message || "인쇄용 이미지 처리에 실패했습니다." });
        record.updatedAt = new Date().toISOString();
        await this.persistence.put(record);
        throw error;
      } finally {
        decoded?.close?.();
      }
    }

    async _saveDerivative(record, key, blob, target, size, settings) {
      const derivative = {
        key,
        blob,
        url: makeObjectUrl(blob),
        mime: blob.type || "image/png",
        width: size.width,
        height: size.height,
        requestedWidth: target.width,
        requestedHeight: target.height,
        dpi: target.dpi,
        bleedMm: target.bleedMm,
        fit: settings.fit,
        crop: settings.crop,
        focalPoint: settings.focalPoint,
        lowResolution: size.lowResolution,
        allowUpscale: settings.allowUpscale,
        upscaled: size.upscaled,
        createdAt: new Date().toISOString(),
      };
      record.derivatives.set(key, derivative);
      record.warnings = record.warnings.filter((warning) => warning.code !== "LOW_RESOLUTION");
      if (size.lowResolution) {
        record.warnings.push({
          code: "LOW_RESOLUTION",
          message: settings.allowUpscale
            ? "원본보다 크게 확대된 인쇄용 이미지입니다. 시험 인쇄로 품질을 확인해주세요."
            : "원본 해상도가 목표 인쇄 크기보다 작아 확대하지 않았습니다.",
          requestedWidth: target.width,
          requestedHeight: target.height,
          producedWidth: size.width,
          producedHeight: size.height,
        });
      }
      record.status = size.lowResolution ? "low-resolution" : "ready";
      record.updatedAt = new Date().toISOString();
      await this.persistence.put(record);
      return { ...derivative };
    }

    async processMany(requests) {
      const results = [];
      for (const request of Array.from(requests || [])) {
        try {
          const derivative = await this.process(request.assetId, request);
          results.push({ assetId: request.assetId, ok: true, derivative });
        } catch (error) {
          results.push({ assetId: request.assetId, ok: false, code: error.code || "PROCESS_FAILED", message: error.message });
        }
      }
      return results;
    }

    getRenderable(assetId, options = {}) {
      const record = this.assets.get(assetId);
      if (!record) return null;
      if (options.derivativeKey && record.derivatives.has(options.derivativeKey)) {
        return { ...record.derivatives.get(options.derivativeKey), assetId, kind: "derivative" };
      }
      const derivative = Array.from(record.derivatives.values()).find((item) => {
        if (options.width && item.requestedWidth !== options.width) return false;
        if (options.height && item.requestedHeight !== options.height) return false;
        return !options.fit || item.fit === options.fit;
      });
      if (derivative) return { ...derivative, assetId, kind: "derivative" };
      return { ...record.original, assetId, kind: "original", filename: record.filename };
    }

    addReference(assetId, referenceKey) {
      const record = this.assets.get(assetId);
      if (!record) return 0;
      if (referenceKey) record.referenceKeys.add(String(referenceKey));
      else record.anonymousReferences += 1;
      record.referenceCount = record.referenceKeys.size + record.anonymousReferences;
      return record.referenceCount;
    }

    releaseReference(assetId, referenceKey) {
      const record = this.assets.get(assetId);
      if (!record) return 0;
      if (referenceKey) record.referenceKeys.delete(String(referenceKey));
      else record.anonymousReferences = Math.max(0, record.anonymousReferences - 1);
      record.referenceCount = record.referenceKeys.size + record.anonymousReferences;
      return record.referenceCount;
    }

    async updateSettings(assetId, settings = {}) {
      await this.ready();
      const record = this.assets.get(assetId);
      if (!record) throw new LabelSheetAssetError("ASSET_NOT_FOUND", "등록된 배경 이미지를 찾을 수 없습니다.");
      record.settings = {
        fit: settings.fit === "contain" ? "contain" : settings.fit === "stretch" ? "stretch" : record.settings.fit,
        crop: normalizeCrop(settings.crop || record.settings.crop),
        focalPoint: normalizeFocalPoint(settings.focalPoint || record.settings.focalPoint),
      };
      record.updatedAt = new Date().toISOString();
      await this.persistence.put(record);
      return publicAsset(record);
    }

    async remove(assetId, options = {}) {
      await this.ready();
      const record = this.assets.get(assetId);
      if (!record) return false;
      if (record.referenceCount > 0 && options.force !== true) {
        throw new LabelSheetAssetError("ASSET_IN_USE", "사용 중인 배경 이미지는 먼저 라벨에서 연결 해제해주세요.", {
          assetId,
          referenceCount: record.referenceCount,
        });
      }
      this._unindex(record);
      revokeObjectUrl(record.original.url);
      revokeObjectUrl(record.thumbnail?.url);
      for (const derivative of record.derivatives.values()) revokeObjectUrl(derivative.url);
      this.assets.delete(assetId);
      await this.persistence.delete(assetId);
      return true;
    }

    async destroy(options = {}) {
      await this.queue.idle();
      for (const record of this.assets.values()) {
        revokeObjectUrl(record.original.url);
        revokeObjectUrl(record.thumbnail?.url);
        for (const derivative of record.derivatives.values()) revokeObjectUrl(derivative.url);
      }
      this.assets.clear();
      this.hashIndex.clear();
      this.filenameIndex.clear();
      if (options.deletePersisted) {
        const saved = await this.persistence.all();
        for (const item of saved) await this.persistence.delete(item.assetId);
      }
    }
  }

  function createStore(options) {
    return new LabelSheetAssetStore(options);
  }

  root.PromptDeckLabelSheetAssets = Object.freeze({
    SUPPORTED_MIME_TYPES,
    DEFAULT_DPI,
    LabelSheetAssetError,
    createStore,
    isSupportedRasterMime,
    normalizeFilename,
    calculateTargetPixels,
    calculatePageCrop,
    calculateDrawRect,
    calculateDerivativeSize,
    normalizeCrop,
    normalizeFocalPoint,
  });
})(typeof window !== "undefined" ? window : globalThis);
