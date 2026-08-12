// PromptDeck label/ticket page renderer.
// Depends only on the optional PromptDeckLabelSheetAssets global and browser Canvas APIs.
(function (root) {
  "use strict";

  const A4 = Object.freeze({ widthMm: 210, heightMm: 297 });
  const DEFAULT_DPI = 300;
  const PRINT_STYLE_ID = "promptdeck-label-sheet-print-style";

  class LabelSheetRenderError extends Error {
    constructor(code, message, details) {
      super(message);
      this.name = "LabelSheetRenderError";
      this.code = code;
      if (details !== undefined) this.details = details;
    }
  }

  function firstFinite(...values) {
    for (const value of values) {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
    return undefined;
  }

  function clamp(value, minimum, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number)) return minimum;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function parseColor(value, fallback = "#000000") {
    const input = String(value || "").trim().toLowerCase();
    const source = input || String(fallback || "#000000").trim().toLowerCase();
    if (source === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    const hex = source.match(/^#([0-9a-f]{3,8})$/i)?.[1];
    if (hex) {
      const expanded = hex.length === 3 || hex.length === 4 ? Array.from(hex).map((character) => character + character).join("") : hex;
      if (expanded.length === 6 || expanded.length === 8) {
        return {
          r: Number.parseInt(expanded.slice(0, 2), 16),
          g: Number.parseInt(expanded.slice(2, 4), 16),
          b: Number.parseInt(expanded.slice(4, 6), 16),
          a: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
        };
      }
    }
    const rgb = source.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
    if (rgb) {
      const alpha = rgb[4]?.endsWith("%") ? Number(rgb[4].slice(0, -1)) / 100 : Number(rgb[4] ?? 1);
      return {
        r: clamp(Number(rgb[1]), 0, 255),
        g: clamp(Number(rgb[2]), 0, 255),
        b: clamp(Number(rgb[3]), 0, 255),
        a: clamp(alpha, 0, 1),
      };
    }
    if (source !== String(fallback || "#000000").trim().toLowerCase()) return parseColor(fallback, "#000000");
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  function relativeLuminance(value) {
    const color = typeof value === "object" && value !== null ? value : parseColor(value);
    const linear = [color.r, color.g, color.b].map((channel) => {
      const normalized = clamp(channel, 0, 255) / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  }

  function contrastRatio(left, right) {
    const leftLuminance = typeof left === "number" ? clamp(left, 0, 1) : relativeLuminance(left);
    const rightLuminance = typeof right === "number" ? clamp(right, 0, 1) : relativeLuminance(right);
    const lighter = Math.max(leftLuminance, rightLuminance);
    const darker = Math.min(leftLuminance, rightLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function summarizeContrastSamples(input = []) {
    const samples = Array.from(input || []).map((value) => clamp(Number(value), 0, 1)).filter(Number.isFinite).sort((left, right) => left - right);
    if (!samples.length) samples.push(1);
    const darkText = "#111827";
    const lightText = "#ffffff";
    const darkLuminance = relativeLuminance(darkText);
    const lightLuminance = relativeLuminance(lightText);
    const passRate = (foreground) => samples.filter((background) => contrastRatio(foreground, background) >= 4.5).length / samples.length;
    const darkPassRate = passRate(darkLuminance);
    const lightPassRate = passRate(lightLuminance);
    const meanLuminance = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const preferLight = lightPassRate > darkPassRate || (lightPassRate === darkPassRate && meanLuminance < 0.48);
    const color = preferLight ? lightText : darkText;
    const chosenPassRate = preferLight ? lightPassRate : darkPassRate;
    const percentile = (ratio) => samples[Math.min(samples.length - 1, Math.max(0, Math.round((samples.length - 1) * ratio)))];
    const luminanceRange = percentile(0.9) - percentile(0.1);
    const needsScrim = chosenPassRate < 0.88 || luminanceRange > 0.58;
    return {
      color,
      outlineColor: preferLight ? "rgba(15, 23, 42, 0.72)" : "rgba(255, 255, 255, 0.78)",
      scrimColor: preferLight ? "#0f172a" : "#ffffff",
      scrimOpacity: needsScrim ? clamp(0.38 + (0.88 - chosenPassRate) * 0.55 + luminanceRange * 0.16, 0.38, 0.68) : 0,
      passRate: chosenPassRate,
      darkPassRate,
      lightPassRate,
      meanLuminance,
      luminanceRange,
      needsScrim,
    };
  }

  function resolveQrContrast(qr = {}) {
    let darkColor = qr.darkColor || "#000000";
    let lightColor = qr.lightColor || "#ffffff";
    let eyeColor = qr.eyeColor || darkColor;
    const dark = parseColor(darkColor);
    const light = parseColor(lightColor, "#ffffff");
    const eye = parseColor(eyeColor);
    const invalidDirection = relativeLuminance(dark) >= relativeLuminance(light);
    const insufficientModules = light.a < 0.95 || dark.a < 0.95 || contrastRatio(dark, light) < 4.5 || invalidDirection;
    const insufficientEyes = eye.a < 0.95 || contrastRatio(eye, light) < 4.5 || relativeLuminance(eye) >= relativeLuminance(light);
    const adjusted = insufficientModules || insufficientEyes;
    if (adjusted) {
      darkColor = "#000000";
      lightColor = "#ffffff";
      eyeColor = "#000000";
    }
    return { darkColor, lightColor, eyeColor, adjusted, ratio: contrastRatio(darkColor, lightColor) };
  }

  function normalizeOrientation(value) {
    const normalized = String(value || "").toLowerCase();
    return normalized === "landscape" || normalized === "가로" ? "landscape" : "portrait";
  }

  function normalizePageSpec(input = {}) {
    const source = input.paper || input.spec || input.geometry?.paper || input.geometry || input;
    const orientation = normalizeOrientation(source.orientation || input.orientation);
    let widthMm = firstFinite(source.widthMm, source.paperWidthMm, source.pageWidthMm);
    let heightMm = firstFinite(source.heightMm, source.paperHeightMm, source.pageHeightMm);
    if (!widthMm || !heightMm) {
      widthMm = orientation === "landscape" ? A4.heightMm : A4.widthMm;
      heightMm = orientation === "landscape" ? A4.widthMm : A4.heightMm;
    }
    return {
      widthMm: Math.max(1, widthMm),
      heightMm: Math.max(1, heightMm),
      orientation,
      name: source.name || source.paperName || "A4",
    };
  }

  function getPagePixelSize(spec = {}, dpi = DEFAULT_DPI) {
    const page = normalizePageSpec(spec);
    const safeDpi = Math.max(1, Number(dpi) || DEFAULT_DPI);
    return {
      width: Math.max(1, Math.round((page.widthMm / 25.4) * safeDpi)),
      height: Math.max(1, Math.round((page.heightMm / 25.4) * safeDpi)),
      widthMm: page.widthMm,
      heightMm: page.heightMm,
      orientation: page.orientation,
      dpi: safeDpi,
    };
  }

  function fallbackDrawRect(sourceWidth, sourceHeight, targetWidth, targetHeight, options = {}) {
    const sw = Math.max(1, Number(sourceWidth) || 1);
    const sh = Math.max(1, Number(sourceHeight) || 1);
    const tw = Math.max(1, Number(targetWidth) || 1);
    const th = Math.max(1, Number(targetHeight) || 1);
    const fit = options.fit === "contain" ? "contain" : options.fit === "stretch" ? "stretch" : "cover";
    const focalX = clamp(options.focalPoint?.x ?? 0.5, 0, 1);
    const focalY = clamp(options.focalPoint?.y ?? 0.5, 0, 1);
    if (fit === "stretch") return { sx: 0, sy: 0, sw, sh, dx: 0, dy: 0, dw: tw, dh: th, fit };
    if (fit === "contain") {
      const scale = Math.min(tw / sw, th / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      return { sx: 0, sy: 0, sw, sh, dx: (tw - dw) * focalX, dy: (th - dh) * focalY, dw, dh, fit };
    }
    const sourceRatio = sw / sh;
    const targetRatio = tw / th;
    let cropW = sw;
    let cropH = sh;
    if (sourceRatio > targetRatio) cropW = sh * targetRatio;
    else cropH = sw / targetRatio;
    return {
      sx: (sw - cropW) * focalX,
      sy: (sh - cropH) * focalY,
      sw: cropW,
      sh: cropH,
      dx: 0,
      dy: 0,
      dw: tw,
      dh: th,
      fit,
    };
  }

  function calculateDrawRect(...args) {
    return root.PromptDeckLabelSheetAssets?.calculateDrawRect?.(...args) || fallbackDrawRect(...args);
  }

  function resolveBackTransform(options = {}, page = {}) {
    const requested = String(options.backTransform || page.backTransform || page.duplex?.backTransform || "none").toLowerCase();
    const aliases = {
      horizontal: "mirror-x",
      "flip-x": "mirror-x",
      vertical: "mirror-y",
      "flip-y": "mirror-y",
      rotate: "rotate-180",
      "180": "rotate-180",
    };
    return aliases[requested] || (["none", "mirror-x", "mirror-y", "rotate-180"].includes(requested) ? requested : "none");
  }

  function transformRectForSide(rect, paper, options = {}) {
    const side = String(options.side || "front").toLowerCase();
    const result = { ...rect };
    if (side !== "back") return result;
    const transform = resolveBackTransform(options, options.page || {});
    if (transform === "mirror-x" || transform === "rotate-180") {
      result.xMm = paper.widthMm - rect.xMm - rect.widthMm;
    }
    if (transform === "mirror-y" || transform === "rotate-180") {
      result.yMm = paper.heightMm - rect.yMm - rect.heightMm;
    }
    result.xMm += Number(options.backOffsetXmm ?? options.offsetXmm) || 0;
    result.yMm += Number(options.backOffsetYmm ?? options.offsetYmm) || 0;
    return result;
  }

  function canvasFactory(width, height, preferDom) {
    const safeWidth = Math.max(1, Math.round(width));
    const safeHeight = Math.max(1, Math.round(height));
    if (!preferDom && typeof root.OffscreenCanvas === "function") return new root.OffscreenCanvas(safeWidth, safeHeight);
    if (root.document?.createElement) {
      const canvas = root.document.createElement("canvas");
      canvas.width = safeWidth;
      canvas.height = safeHeight;
      return canvas;
    }
    throw new LabelSheetRenderError("CANVAS_UNAVAILABLE", "이 환경에서는 라벨 페이지를 렌더링할 수 없습니다.");
  }

  function canvasContext(canvas, alpha = false) {
    const context = canvas.getContext("2d", { alpha: Boolean(alpha) });
    if (!context) throw new LabelSheetRenderError("CANVAS_CONTEXT_UNAVAILABLE", "페이지 렌더링 컨텍스트를 만들 수 없습니다.");
    context.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in context) context.imageSmoothingQuality = "high";
    return context;
  }

  function canvasToBlob(canvas, type = "image/png", quality = 0.95) {
    if (typeof canvas.convertToBlob === "function") return canvas.convertToBlob({ type, quality });
    if (typeof canvas.toBlob === "function") {
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new LabelSheetRenderError("ENCODE_FAILED", "PNG 파일을 만들 수 없습니다."))),
          type,
          quality
        );
      });
    }
    throw new LabelSheetRenderError("ENCODE_UNAVAILABLE", "이 환경에서는 PNG 파일을 만들 수 없습니다.");
  }

  function pagePlacements(page) {
    const direct = page?.items || page?.placements || page?.cells || page?.slots || page?.labels;
    if (Array.isArray(direct)) return direct;
    const geometryCells = page?.geometry?.cells || page?.geometry?.placements || page?.layout?.cells;
    if (Array.isArray(geometryCells)) return geometryCells;
    return [];
  }

  function placementRecord(page, placement, index) {
    if (placement?.record) return placement.record;
    if (placement?.data) return placement.data;
    if (placement?.label) return placement.label;
    const recordIndex = firstFinite(placement?.recordIndex, placement?.dataIndex, placement?.index, index);
    return page?.records?.[recordIndex] || page?.data?.[recordIndex] || {};
  }

  function placementRect(placement) {
    const source = placement?.geometry || placement?.rectMm || placement?.rect || placement || {};
    const xMm = firstFinite(source.xMm, source.leftMm, source.x, 0);
    const yMm = firstFinite(source.yMm, source.topMm, source.y, 0);
    const widthMm = firstFinite(source.widthMm, source.wMm, source.width, 0);
    const heightMm = firstFinite(source.heightMm, source.hMm, source.height, 0);
    return {
      xMm: Math.max(0, xMm),
      yMm: Math.max(0, yMm),
      widthMm: Math.max(0, widthMm),
      heightMm: Math.max(0, heightMm),
    };
  }

  function sideData(record, placement, side) {
    const placementSide = placement?.[side];
    const recordSide = record?.[side];
    return {
      ...(record && typeof record === "object" ? record : {}),
      ...(recordSide && typeof recordSide === "object" ? recordSide : {}),
      ...(placementSide && typeof placementSide === "object" ? placementSide : {}),
    };
  }

  function pickAssetId(placement, data, side) {
    return (
      placement?.assetId ||
      placement?.backgroundAssetId ||
      placement?.[`${side}AssetId`] ||
      placement?.[`${side}_background_asset_id`] ||
      data?.backgroundAssetId ||
      data?.background_asset_id ||
      data?.assetId ||
      data?.[`${side}_background_asset_id`] ||
      ""
    );
  }

  function mmToPx(mm, dpi) {
    return (Number(mm) / 25.4) * dpi;
  }

  function normalizePlacement(page, placement, index, side, paper, options) {
    const record = placementRecord(page, placement, index);
    const data = sideData(record, placement, side);
    const sourceRect = placementRect(placement);
    const rect = transformRectForSide(sourceRect, paper, {
      ...options,
      page,
      side,
      backTransform: placement.backTransform || data.backTransform || options.backTransform,
    });
    return {
      index,
      side,
      placement,
      record,
      data,
      rect,
      assetId: pickAssetId(placement, data, side),
    };
  }

  async function decodeRenderable(renderable) {
    if (!renderable) return null;
    const blob = renderable.blob || renderable.original?.blob;
    if (blob && typeof root.createImageBitmap === "function") {
      const bitmap = await root.createImageBitmap(blob);
      return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close?.() };
    }
    const url = renderable.url || renderable.original?.url;
    if (url && typeof root.Image === "function") {
      const image = new root.Image();
      image.decoding = "async";
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new LabelSheetRenderError("IMAGE_LOAD_FAILED", "배경 이미지를 불러올 수 없습니다."));
        image.src = url;
      });
      return {
        image,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        close: () => undefined,
      };
    }
    return null;
  }

  async function resolveRenderable(assetStore, item, dpi, options) {
    if (!assetStore || !item.assetId) return null;
    const fit = item.data.imageFit || item.data.image_fit || item.data.fit || "cover";
    const crop = item.data.crop || item.data.backgroundCrop;
    const focalPoint = item.data.focalPoint || item.data.backgroundFocalPoint;
    if (options.usePrintDerivatives !== false && typeof assetStore.process === "function") {
      try {
        const derivative = await assetStore.process(item.assetId, {
          widthMm: item.rect.widthMm,
          heightMm: item.rect.heightMm,
          dpi,
          bleedMm: Number(options.bleedMm) || 0,
          fit,
          crop,
          focalPoint,
          allowUpscale: options.allowUpscale === true,
        });
        return { ...derivative, precomposed: true };
      } catch (_error) {
        // The original remains usable for a warning-quality preview.
      }
    }
    // A derivative is already cropped and fitted. Reusing it as a raw source would
    // apply the record crop a second time, so preview/fallback paths prefer the
    // untouched original and perform exactly one draw-time crop.
    return assetStore.get?.(item.assetId)?.original || assetStore.getRenderable?.(item.assetId) || null;
  }

  function drawImageBackground(context, decoded, destination, data, precomposed) {
    if (!decoded) return;
    if (precomposed) {
      context.drawImage(decoded.image, destination.x, destination.y, destination.width, destination.height);
      return;
    }
    const rect = calculateDrawRect(decoded.width, decoded.height, destination.width, destination.height, {
      fit: data.imageFit || data.image_fit || data.fit || "cover",
      crop: data.crop || data.backgroundCrop,
      focalPoint: data.focalPoint || data.backgroundFocalPoint,
    });
    context.drawImage(
      decoded.image,
      rect.sx,
      rect.sy,
      rect.sw,
      rect.sh,
      destination.x + rect.dx,
      destination.y + rect.dy,
      rect.dw,
      rect.dh
    );
  }

  function analyzePlacementContrast(item, decoded, precomposed, backgroundColor) {
    const ratio = Math.max(0.2, Math.min(5, Number(item.rect?.widthMm) / Math.max(0.1, Number(item.rect?.heightMm))));
    const longestEdge = 40;
    const width = ratio >= 1 ? longestEdge : Math.max(12, Math.round(longestEdge * ratio));
    const height = ratio >= 1 ? Math.max(12, Math.round(longestEdge / ratio)) : longestEdge;
    try {
      const canvas = canvasFactory(width, height, true);
      const context = canvasContext(canvas, false);
      context.fillStyle = backgroundColor || "#ffffff";
      context.fillRect(0, 0, width, height);
      if (decoded) drawImageBackground(context, decoded, { x: 0, y: 0, width, height }, item.data || {}, precomposed);
      const pixels = context.getImageData(0, 0, width, height).data;
      const samples = [];
      for (let index = 0; index < pixels.length; index += 4) {
        samples.push(relativeLuminance({ r: pixels[index], g: pixels[index + 1], b: pixels[index + 2], a: pixels[index + 3] / 255 }));
      }
      return summarizeContrastSamples(samples);
    } catch (_error) {
      return summarizeContrastSamples([relativeLuminance(backgroundColor || "#ffffff")]);
    }
  }

  function setFont(context, sizePx, weight, family) {
    const safeSize = Math.max(6, Number(sizePx) || 12);
    context.font = `${weight || 400} ${safeSize}px ${family || '"Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif'}`;
    context.textBaseline = "top";
  }

  function splitParagraphs(value) {
    return String(value ?? "")
      .replace(/\r\n?/g, "\n")
      .split("\n");
  }

  function analyzeWrappedLines(context, value, maxWidth, maxLines) {
    const limit = Math.max(1, Math.trunc(Number(maxLines) || 1));
    const lines = [];
    const paragraphs = splitParagraphs(value);
    let truncated = false;
    outer: for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
      const paragraph = paragraphs[paragraphIndex];
      if (!paragraph) {
        if (lines.length < limit) lines.push("");
        else {
          truncated = paragraphIndex < paragraphs.length - 1;
          break;
        }
        continue;
      }
      let current = "";
      const characters = Array.from(paragraph);
      for (let characterIndex = 0; characterIndex < characters.length; characterIndex += 1) {
        const character = characters[characterIndex];
        const candidate = current + character;
        if (current && context.measureText(candidate).width > maxWidth) {
          lines.push(current);
          if (lines.length >= limit) {
            truncated = true;
            break outer;
          }
          current = character;
        } else current = candidate;
      }
      if (current) {
        if (lines.length < limit) lines.push(current);
        else {
          truncated = true;
          break;
        }
      }
      if (lines.length >= limit && paragraphIndex < paragraphs.length - 1) {
        truncated = true;
        break;
      }
    }
    if (truncated && lines.length) {
      let last = lines[lines.length - 1].replace(/…$/, "");
      while (last.length > 0 && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      lines[lines.length - 1] = `${last}…`;
    }
    return { lines, truncated };
  }

  function wrapLines(context, value, maxWidth, maxLines) {
    return analyzeWrappedLines(context, value, maxWidth, maxLines).lines;
  }

  function drawTextLine(context, text, x, y, width, align, options = {}) {
    context.textAlign = align;
    const drawX = align === "center" ? x + width / 2 : align === "right" ? x + width : x;
    if (options.strokeStyle && Number(options.strokeWidth) > 0) {
      context.save();
      context.strokeStyle = options.strokeStyle;
      context.lineWidth = Number(options.strokeWidth);
      context.lineJoin = "round";
      context.miterLimit = 2;
      context.strokeText(text, drawX, y);
      context.restore();
    }
    context.fillText(text, drawX, y);
  }

  function drawWrappedText(context, text, box, options = {}) {
    if (!String(text ?? "").trim()) return box.y;
    const size = Math.max(options.minimumSize || 7, options.size || 12);
    setFont(context, size, options.weight, options.family);
    const lines = wrapLines(context, text, box.width, options.maxLines || 2);
    const lineHeight = size * (options.lineHeight || 1.32);
    lines.forEach((line, index) => drawTextLine(context, line, box.x, box.y + index * lineHeight, box.width, options.align || "left"));
    return box.y + lines.length * lineHeight;
  }

  function rectanglesIntersect(left, right) {
    if (!left || !right) return false;
    return left.x < right.x + right.width
      && left.x + left.width > right.x
      && left.y < right.y + right.height
      && left.y + left.height > right.y;
  }

  function normalizeContentRotation(input) {
    const value = Number(input) || 0;
    const normalized = ((value % 360) + 360) % 360;
    if (Math.abs(normalized - 90) < 0.001) return 90;
    if (Math.abs(normalized - 180) < 0.001) return 180;
    if (Math.abs(normalized - 270) < 0.001) return 270;
    return 0;
  }

  /**
   * Returns the logical text box that exactly occupies the supplied physical
   * box after a quarter-turn. Measuring against this box before drawing keeps
   * wrapping and alignment correct for portrait text inside a landscape label.
   */
  function resolveOrientedBox(input = {}, rotationInput = 0) {
    const x = Number(input.x) || 0;
    const y = Number(input.y) || 0;
    const width = Math.max(0, Number(input.width) || 0);
    const height = Math.max(0, Number(input.height) || 0);
    const rotation = normalizeContentRotation(rotationInput);
    const swapsAxes = rotation === 90 || rotation === 270;
    const logicalWidth = swapsAxes ? height : width;
    const logicalHeight = swapsAxes ? width : height;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    return {
      x: centerX - logicalWidth / 2,
      y: centerY - logicalHeight / 2,
      width: logicalWidth,
      height: logicalHeight,
      centerX,
      centerY,
      rotation,
      swapsAxes,
    };
  }

  function applyOrientedTransform(context, geometry) {
    if (!geometry.rotation) return;
    context.translate(geometry.centerX, geometry.centerY);
    context.rotate((geometry.rotation * Math.PI) / 180);
    context.translate(-geometry.centerX, -geometry.centerY);
  }

  function rotatedRectBounds(rect, geometry) {
    if (!rect || !geometry.rotation) return rect;
    const radians = geometry.rotation * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const points = [
      [rect.x, rect.y],
      [rect.x + rect.width, rect.y],
      [rect.x, rect.y + rect.height],
      [rect.x + rect.width, rect.y + rect.height],
    ].map(([x, y]) => {
      const dx = x - geometry.centerX;
      const dy = y - geometry.centerY;
      return {
        x: geometry.centerX + dx * cosine - dy * sine,
        y: geometry.centerY + dx * sine + dy * cosine,
      };
    });
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    return {
      x: left,
      y: top,
      width: Math.max(...xs) - left,
      height: Math.max(...ys) - top,
    };
  }

  function rectInLogicalOrientation(rect, geometry) {
    if (!rect || !geometry.rotation) return rect;
    return rotatedRectBounds(rect, {
      centerX: geometry.centerX,
      centerY: geometry.centerY,
      rotation: (360 - geometry.rotation) % 360,
    });
  }

  /**
   * Measures the same fixed label layout used by drawLabelText(). This powers
   * preflight checks so clipped copy is reported before a print canvas is made.
   */
  function analyzeLabelLayout(input = {}, options = {}) {
    const side = String(input.side || options.side || "front").toLowerCase() === "back" ? "back" : "front";
    const record = input.record || {};
    const placement = input.placement || input;
    const data = sideData(record, placement, side);
    const item = { record, placement, data, side };
    const dpi = Math.max(24, Number(options.dpi) || 72);
    const widthMm = Math.max(0.1, Number(input.widthMm ?? input.rectMm?.widthMm ?? placement.widthMm) || 1);
    const heightMm = Math.max(0.1, Number(input.heightMm ?? input.rectMm?.heightMm ?? placement.heightMm) || 1);
    const destination = { x: 0, y: 0, width: mmToPx(widthMm, dpi), height: mmToPx(heightMm, dpi) };
    const context = options.context || canvasContext(canvasFactory(2, 2, true), true);
    const text = normalizedTextData(item);
    const style = mergedStyle(item);
    const layout = textLayout(item, destination, dpi, options);
    const oriented = resolveOrientedBox(layout, style.rotation ?? data.rotation ?? 0);
    const { x, y, width, height } = oriented;
    const { qr } = layout;
    const base = Math.max(8, Math.min(width, height));
    const qrRect = qr ? { x: qr.x, y: qr.y, width: qr.size, height: qr.size } : null;
    const customMetrics = buildCustomTextMetrics(context, text, style, { x, y, width, height }, {
      mode: layout.mode,
      qrRect: rectInLogicalOrientation(qrRect, oriented),
      gap: layout.gap,
    });
    if (customMetrics) {
      const fieldRects = customMetrics.fields.map((field) => rotatedRectBounds({ x: field.x, y: field.y, width: field.width, height: field.height }, oriented));
      const qrCollision = Boolean(qrRect && fieldRects.some((rect) => rectanglesIntersect(rect, qrRect)));
      const truncatedFields = Array.from(new Set([...customMetrics.truncatedFields, ...customMetrics.overflowFields]));
      return {
        fits: truncatedFields.length === 0 && !qrCollision,
        truncatedFields,
        verticalOverflow: customMetrics.overflowFields.length > 0,
        qrCollision,
        metrics: {
          width,
          height,
          contentTop: customMetrics.bounds.y,
          contentBottom: customMetrics.bounds.y + customMetrics.bounds.height,
          footerTop: customMetrics.fields.find((field) => field.field === "footer")?.y ?? y + height,
          qrRect,
          contentFlow: layout.contentFlow,
          rotation: oriented.rotation,
          physicalWidth: layout.width,
          physicalHeight: layout.height,
          custom: true,
          autoWrappedFields: customMetrics.autoWrappedFields,
          group: customMetrics.group,
          fields: customMetrics.fields.map((field) => ({
            field: field.field,
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            lineCount: field.lines.length,
            color: field.color,
          })),
        },
      };
    }
    const metrics = buildTextMetrics(context, text, style, base, width);
    const footerGap = metrics.footer ? base * 0.03 : 0;
    const mainAvailableHeight = Math.max(0, height - metrics.footerHeight - footerGap);
    const contentTop = alignedContentTop(y, mainAvailableHeight, metrics.mainHeight, style.verticalAlign);
    const footerTop = y + height - metrics.footerHeight;
    const verticalOverflow = metrics.mainHeight > mainAvailableHeight + 0.5;
    const contentRect = rotatedRectBounds({ x, y: contentTop, width, height: Math.max(0, metrics.mainHeight) }, oriented);
    const footerRect = metrics.footer ? rotatedRectBounds({ x, y: footerTop, width, height: metrics.footerHeight }, oriented) : null;
    const qrCollision = Boolean(qrRect
      && layout.mode === "overlay"
      && (rectanglesIntersect(contentRect, qrRect) || rectanglesIntersect(footerRect, qrRect)));
    return {
      fits: metrics.truncatedFields.length === 0 && !verticalOverflow && !qrCollision,
      truncatedFields: Array.from(new Set(metrics.truncatedFields)),
      verticalOverflow,
      qrCollision,
      metrics: {
        width,
        height,
        contentTop,
        contentBottom: contentTop + metrics.mainHeight,
        footerTop,
        qrRect,
        contentFlow: layout.contentFlow,
        rotation: oriented.rotation,
        physicalWidth: layout.width,
        physicalHeight: layout.height,
      },
    };
  }

  function normalizedTextData(item) {
    const data = item.data || {};
    return {
      title: data.title ?? data.front_title ?? "",
      subtitle: data.subtitle ?? data.front_subtitle ?? "",
      body: data.body ?? data.front_body ?? "",
      footer: data.footer ?? data.front_footer ?? "",
      number: data.number ?? item.record?.number ?? "",
    };
  }

  function mergedStyle(item) {
    return { ...(item.record?.style || {}), ...(item.data?.style || {}), ...(item.placement?.style || {}) };
  }

  function qrLayout(item, destination, dpi, options = {}) {
    const data = item.data || {};
    const style = mergedStyle(item);
    const qr = { ...(style.qr || {}), ...(data.qrStyle || {}), ...(item.placement?.qrStyle || {}) };
    const value = String(data.qrValue ?? data.qr_value ?? "").trim();
    const enabled = data.qrEnabled ?? data.qr_enabled ?? qr.enabled ?? options.qrEnabled;
    const explicitlyDisabled = enabled === false || enabled === 0 || String(enabled).toLowerCase() === "false";
    if (!value || options.qrEnabled === false || explicitlyDisabled) return null;
    const safeInset = Math.max(mmToPx(firstFinite(style.safeAreaMm, options.safeAreaMm, 2), dpi), Math.min(destination.width, destination.height) * 0.04);
    const ratio = clamp(firstFinite(qr.sizePercent, qr.sizeRatio ? Number(qr.sizeRatio) * 100 : undefined, options.qrSizePercent, 28), 16, 48) / 100;
    const size = Math.max(8, Math.min(destination.width, destination.height) * ratio);
    const position = ["left", "right", "top-left", "top-right", "bottom-left", "bottom-right", "center"].includes(qr.position)
      ? qr.position
      : "right";
    let x = destination.x + destination.width - safeInset - size;
    let y = destination.y + (destination.height - size) / 2;
    if (position.includes("left")) x = destination.x + safeInset;
    if (position === "center") x = destination.x + (destination.width - size) / 2;
    if (position.startsWith("top")) y = destination.y + safeInset;
    if (position.startsWith("bottom")) y = destination.y + destination.height - safeInset - size;
    const hasCustomPosition = qr.xPercent !== null && qr.xPercent !== undefined
      && qr.yPercent !== null && qr.yPercent !== undefined
      && Number.isFinite(Number(qr.xPercent)) && Number.isFinite(Number(qr.yPercent));
    if (hasCustomPosition) {
      const widthPercent = size / destination.width * 100;
      const heightPercent = size / destination.height * 100;
      x = destination.x + destination.width * clamp(Number(qr.xPercent), 0, Math.max(0, 100 - widthPercent)) / 100;
      y = destination.y + destination.height * clamp(Number(qr.yPercent), 0, Math.max(0, 100 - heightPercent)) / 100;
    }
    return { value, qr, position, x, y, size, safeInset, customPosition: hasCustomPosition };
  }

  function qrDrawLayer(item) {
    const data = item.data || {};
    const style = mergedStyle(item);
    const qr = { ...(style.qr || {}), ...(data.qrStyle || {}), ...(item.placement?.qrStyle || {}) };
    return qr.layer === "behind" ? "behind" : "front";
  }

  function textLayout(item, destination, dpi, options = {}) {
    const style = mergedStyle(item);
    const inset = Math.max(mmToPx(firstFinite(style.safeAreaMm, options.safeAreaMm, 2), dpi), Math.min(destination.width, destination.height) * 0.04);
    const qr = qrLayout(item, destination, dpi, options);
    let x = destination.x + inset;
    let y = destination.y + inset;
    let width = Math.max(1, destination.width - inset * 2);
    let height = Math.max(1, destination.height - inset * 2);
    const requestedMode = qr?.qr?.layoutMode ?? style.qrLayoutMode;
    const mode = qr && ["adaptive", "reserved", "overlay"].includes(requestedMode) ? requestedMode : qr ? "adaptive" : "none";
    const configuredGap = qr && Number.isFinite(Number(qr.qr.gapPercent))
      ? Math.min(destination.width, destination.height) * clamp(Number(qr.qr.gapPercent), 0, 12) / 100
      : 0;
    const gap = configuredGap || Math.max(inset * 0.8, mmToPx(0.8, dpi));
    const reserveWholeBox = qr && (mode === "reserved" || (mode === "adaptive" && !style.textFields));

    if (reserveWholeBox) {
      const centerX = qr.x + qr.size / 2;
      const centerY = qr.y + qr.size / 2;
      const relativeCenterX = (centerX - destination.x) / destination.width;
      const relativeCenterY = (centerY - destination.y) / destination.height;
      if (qr.customPosition && relativeCenterX >= 0.62) {
        width = Math.max(1, qr.x - gap - x);
      } else if (qr.customPosition && relativeCenterX <= 0.38) {
        const rightEdge = destination.x + destination.width - inset;
        x = qr.x + qr.size + gap;
        width = Math.max(1, rightEdge - x);
      } else if (qr.customPosition && relativeCenterY >= 0.55) {
        height = Math.max(1, qr.y - gap - y);
      } else if (qr.customPosition) {
        const bottomEdge = destination.y + destination.height - inset;
        y = qr.y + qr.size + gap;
        height = Math.max(1, bottomEdge - y);
      } else if (qr.position === "right" || qr.position.endsWith("-right")) {
        width = Math.max(1, qr.x - gap - x);
      } else if (qr.position === "left" || qr.position.endsWith("-left")) {
        const rightEdge = destination.x + destination.width - inset;
        x = qr.x + qr.size + gap;
        width = Math.max(1, rightEdge - x);
      } else if (qr.position === "center") {
        height = Math.max(1, qr.y - gap - y);
      }
    }

    return {
      x,
      y,
      width,
      height,
      inset,
      qr,
      mode,
      gap,
      contentFlow: !qr
        ? "full-width-no-qr-reservation"
        : mode === "adaptive"
          ? "field-aware-wrap-around-qr"
          : mode === "reserved"
            ? "fixed-reserved-qr-zone"
            : "full-width-overlay",
    };
  }

  function fontScaleFor(style) {
    const percent = firstFinite(style.fontScalePercent);
    return clamp(firstFinite(style.fontScale, percent === undefined ? undefined : percent / 100, 1), 0.7, 1.6);
  }

  function buildTextMetrics(context, text, style, base, width) {
    const scale = fontScaleFor(style);
    const family = style.fontFamily;
    const fields = [];
    const truncatedFields = [];
    let mainHeight = 0;

    const addField = (field, value, options = {}) => {
      if (!String(value ?? "").trim()) return;
      const size = Math.max(options.minimumSize || 5, firstFinite(style[options.sizeKey], options.fallbackSize) * scale);
      const lineHeight = size * (options.lineHeight || 1.32);
      const gap = mainHeight > 0 ? options.gap || 0 : 0;
      setFont(context, size, options.weight, family);
      const wrapped = field === "number"
        ? { lines: [String(value)], truncated: context.measureText(String(value)).width > width }
        : analyzeWrappedLines(context, value, width, firstFinite(style[options.maxLinesKey], options.maxLines));
      if (wrapped.truncated) truncatedFields.push(field);
      fields.push({ field, value: String(value), lines: wrapped.lines, size, lineHeight, gap, weight: options.weight });
      mainHeight += gap + wrapped.lines.length * lineHeight;
    };

    addField("number", text.number, { sizeKey: "numberSizePx", fallbackSize: base * 0.12, minimumSize: 6, lineHeight: 1.25, weight: 700, maxLines: 1 });
    addField("title", text.title, { sizeKey: "titleSizePx", fallbackSize: base * 0.15, minimumSize: 6, lineHeight: 1.22, weight: style.titleWeight || 700, maxLinesKey: "titleMaxLines", maxLines: 2 });
    addField("subtitle", text.subtitle, { sizeKey: "subtitleSizePx", fallbackSize: base * 0.085, minimumSize: 5.5, weight: style.subtitleWeight || 500, maxLinesKey: "subtitleMaxLines", maxLines: 2, gap: base * 0.025 });
    addField("body", text.body, { sizeKey: "bodySizePx", fallbackSize: base * 0.072, minimumSize: 5.5, weight: style.bodyWeight || 400, maxLinesKey: "bodyMaxLines", maxLines: 4, gap: base * 0.035 });

    let footer = null;
    let footerHeight = 0;
    if (String(text.footer).trim()) {
      const size = Math.max(5, firstFinite(style.footerSizePx, base * 0.06) * scale);
      const lineHeight = size * 1.25;
      setFont(context, size, style.footerWeight || 400, family);
      const wrapped = analyzeWrappedLines(context, text.footer, width, firstFinite(style.footerMaxLines, 2));
      if (wrapped.truncated) truncatedFields.push("footer");
      footerHeight = wrapped.lines.length * lineHeight;
      footer = { field: "footer", value: String(text.footer), lines: wrapped.lines, size, lineHeight, gap: 0, weight: style.footerWeight || 400 };
    }

    return { fields, footer, footerHeight, mainHeight, truncatedFields };
  }

  const CUSTOM_TEXT_FIELD_ORDER = Object.freeze(["number", "title", "subtitle", "body", "footer"]);
  const CUSTOM_TEXT_FIELD_DEFAULTS = Object.freeze({
    number: Object.freeze({ xPercent: 50, yPercent: 0, widthPercent: 50, heightPercent: null, sizePercent: 12, color: "inherit", align: "right", weight: 700, maxLines: 1, visible: true, avoidQr: true }),
    title: Object.freeze({ xPercent: 5, yPercent: 18, widthPercent: 90, heightPercent: null, sizePercent: 15, color: "inherit", align: "center", weight: 700, maxLines: 2, visible: true, avoidQr: true }),
    subtitle: Object.freeze({ xPercent: 5, yPercent: 43, widthPercent: 90, heightPercent: null, sizePercent: 8.5, color: "inherit", align: "center", weight: 500, maxLines: 2, visible: true, avoidQr: true }),
    body: Object.freeze({ xPercent: 5, yPercent: 58, widthPercent: 90, heightPercent: null, sizePercent: 7.2, color: "inherit", align: "center", weight: 400, maxLines: 4, visible: true, avoidQr: true }),
    footer: Object.freeze({ xPercent: 5, yPercent: 87, widthPercent: 90, heightPercent: null, sizePercent: 6, color: "inherit", align: "center", weight: 400, maxLines: 2, visible: true, avoidQr: true }),
  });

  function optionalPercent(value, minimum, maximum) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? clamp(number, minimum, maximum) : null;
  }

  function normalizeCustomTextGroup(input) {
    const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const widthPercent = clamp(firstFinite(source.widthPercent, 100), 10, 100);
    const heightPercent = clamp(firstFinite(source.heightPercent, 100), 10, 100);
    return {
      xPercent: clamp(firstFinite(source.xPercent, 0), 0, Math.max(0, 100 - widthPercent)),
      yPercent: clamp(firstFinite(source.yPercent, 0), 0, Math.max(0, 100 - heightPercent)),
      widthPercent,
      heightPercent,
    };
  }

  function normalizeCustomTextFields(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return null;
    return Object.fromEntries(CUSTOM_TEXT_FIELD_ORDER.map((field) => {
      const fallback = CUSTOM_TEXT_FIELD_DEFAULTS[field];
      const source = input[field] && typeof input[field] === "object" ? input[field] : {};
      const widthPercent = clamp(firstFinite(source.widthPercent, fallback.widthPercent), 5, 100);
      return [field, {
        xPercent: clamp(firstFinite(source.xPercent, fallback.xPercent), 0, Math.max(0, 100 - widthPercent)),
        yPercent: clamp(firstFinite(source.yPercent, fallback.yPercent), 0, 96),
        widthPercent,
        heightPercent: optionalPercent(source.heightPercent, 5, 100),
        sizePercent: clamp(firstFinite(source.sizePercent, fallback.sizePercent), 3, 30),
        fontFamily: String(source.fontFamily || "inherit").trim() || "inherit",
        color: /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/iu.test(String(source.color || "").trim()) ? String(source.color).trim().toLowerCase() : "inherit",
        align: ["left", "center", "right"].includes(source.align) ? source.align : fallback.align,
        weight: clamp(firstFinite(source.weight, fallback.weight), 300, 900),
        maxLines: clamp(Math.trunc(firstFinite(source.maxLines, fallback.maxLines)), 1, 8),
        visible: source.visible !== false,
        avoidQr: source.avoidQr !== false,
      }];
    }));
  }

  function qrAwareFieldRect(rect, qrRect, groupBox, gap) {
    if (!qrRect) return { ...rect, wrapped: false };
    const expanded = {
      x: qrRect.x - gap,
      y: qrRect.y - gap,
      width: qrRect.width + gap * 2,
      height: qrRect.height + gap * 2,
    };
    if (!rectanglesIntersect(rect, expanded)) return { ...rect, wrapped: false };
    const preferredRight = Math.min(groupBox.x + groupBox.width, rect.x + rect.width);
    const leftWidth = Math.max(0, Math.min(preferredRight, expanded.x) - rect.x);
    const rightX = Math.max(rect.x, expanded.x + expanded.width);
    const rightWidth = Math.max(0, preferredRight - rightX);
    const minimum = Math.max(1, groupBox.width * 0.05);
    if (leftWidth < minimum && rightWidth < minimum) return { ...rect, wrapped: false };
    if (leftWidth >= rightWidth) return { ...rect, width: leftWidth, wrapped: true };
    return { ...rect, x: rightX, width: rightWidth, wrapped: true };
  }

  function buildCustomTextMetrics(context, text, style, box, options = {}) {
    const layout = normalizeCustomTextFields(style.textFields);
    if (!layout) return null;
    const group = normalizeCustomTextGroup(style.textGroup);
    const groupBox = {
      x: box.x + box.width * group.xPercent / 100,
      y: box.y + box.height * group.yPercent / 100,
      width: Math.max(1, box.width * group.widthPercent / 100),
      height: Math.max(1, box.height * group.heightPercent / 100),
    };
    const base = Math.max(8, Math.min(groupBox.width, groupBox.height));
    const scale = fontScaleFor(style);
    const fields = [];
    const truncatedFields = [];
    const overflowFields = [];
    const autoWrappedFields = [];
    CUSTOM_TEXT_FIELD_ORDER.forEach((fieldName) => {
      const value = String(text[fieldName] ?? "");
      const config = layout[fieldName];
      if (config.visible === false || !value.trim()) return;
      const preferredWidth = Math.max(1, groupBox.width * config.widthPercent / 100);
      const preferredX = groupBox.x + groupBox.width * config.xPercent / 100;
      const y = groupBox.y + groupBox.height * config.yPercent / 100;
      const size = Math.max(5, base * config.sizePercent / 100 * scale);
      const lineHeight = size * 1.25;
      const family = config.fontFamily === "inherit" ? style.fontFamily : config.fontFamily;
      setFont(context, size, config.weight, family);
      const previewWrap = analyzeWrappedLines(context, value, preferredWidth, config.maxLines);
      const fixedHeight = config.heightPercent === null ? null : Math.max(1, groupBox.height * config.heightPercent / 100);
      const collisionHeight = fixedHeight ?? previewWrap.lines.length * lineHeight;
      const preferredRect = { x: preferredX, y, width: preferredWidth, height: collisionHeight };
      const adjusted = options.mode === "adaptive" && config.avoidQr !== false
        ? qrAwareFieldRect(preferredRect, options.qrRect, groupBox, Math.max(0, Number(options.gap) || 0))
        : { ...preferredRect, wrapped: false };
      if (adjusted.wrapped) autoWrappedFields.push(fieldName);
      const availableLineCount = fixedHeight === null ? config.maxLines : Math.max(1, Math.floor(fixedHeight / lineHeight));
      const wrapped = analyzeWrappedLines(context, value, Math.max(1, adjusted.width), Math.min(config.maxLines, availableLineCount));
      const height = fixedHeight ?? wrapped.lines.length * lineHeight;
      const overflow = y + height > groupBox.y + groupBox.height + 0.5;
      if (wrapped.truncated) truncatedFields.push(fieldName);
      if (overflow) overflowFields.push(fieldName);
      fields.push({
        field: fieldName,
        value,
        lines: wrapped.lines,
        x: adjusted.x,
        y,
        width: adjusted.width,
        height,
        size,
        lineHeight,
        family,
        color: config.color,
        align: config.align,
        weight: config.weight,
        autoWrapped: adjusted.wrapped,
      });
    });
    const bounds = fields.length ? {
      x: Math.min(...fields.map((field) => field.x)),
      y: Math.min(...fields.map((field) => field.y)),
      width: Math.max(...fields.map((field) => field.x + field.width)) - Math.min(...fields.map((field) => field.x)),
      height: Math.max(...fields.map((field) => field.y + field.height)) - Math.min(...fields.map((field) => field.y)),
    } : { x: groupBox.x, y: groupBox.y, width: 0, height: 0 };
    return { fields, bounds, truncatedFields, overflowFields, autoWrappedFields, layout, group, groupBox };
  }

  function alignedContentTop(y, availableHeight, contentHeight, value) {
    const position = ["top", "center", "bottom"].includes(value) ? value : "top";
    const free = Math.max(0, availableHeight - contentHeight);
    if (position === "center") return y + free / 2;
    if (position === "bottom") return y + free;
    return y;
  }

  function drawStyleAccents(context, item, destination, dpi) {
    const style = mergedStyle(item);
    const accent = style.accentColor;
    if (!accent) return;
    const edge = ["top", "right", "bottom", "left"].includes(style.accentEdge) ? style.accentEdge : "top";
    const thickness = Math.max(1, mmToPx(firstFinite(style.accentWidthMm, 0.8), dpi));
    context.save();
    context.beginPath();
    context.rect(destination.x, destination.y, destination.width, destination.height);
    context.clip();
    context.fillStyle = accent;
    if (edge === "top") context.fillRect(destination.x, destination.y, destination.width, thickness);
    else if (edge === "right") context.fillRect(destination.x + destination.width - thickness, destination.y, thickness, destination.height);
    else if (edge === "bottom") context.fillRect(destination.x, destination.y + destination.height - thickness, destination.width, thickness);
    else context.fillRect(destination.x, destination.y, thickness, destination.height);
    if (style.borderColor) {
      context.strokeStyle = style.borderColor;
      context.lineWidth = Math.max(0.5, mmToPx(firstFinite(style.borderWidthMm, 0.25), dpi));
      context.strokeRect(destination.x, destination.y, destination.width, destination.height);
    }
    context.restore();
  }

  function drawLabelQr(context, item, destination, dpi, options = {}) {
    const layout = qrLayout(item, destination, dpi, options);
    if (!layout) return false;
    const core = root.QRGeneratorCore;
    if (typeof core?.drawCustomQRCode !== "function") {
      options.onWarning?.({ code: "QR_RENDERER_MISSING", message: "QR 렌더링 모듈을 불러오지 못했습니다.", recordId: item.record?.id, side: item.side });
      return false;
    }
    try {
      const sourceSize = Math.max(192, Math.round(layout.size * 2));
      const palette = resolveQrContrast(layout.qr);
      if (palette.adjusted) {
        options.onWarning?.({
          code: "QR_CONTRAST_ADJUSTED",
          message: "QR 색상 대비가 낮아 검정 모듈과 흰 배경으로 자동 보정했습니다.",
          recordId: item.record?.id,
          side: item.side,
        });
      }
      const result = core.drawCustomQRCode(layout.value, sourceSize, {
        margin: Math.max(2, Math.trunc(firstFinite(layout.qr.margin, 4))),
        ecc: ["L", "M", "Q", "H"].includes(layout.qr.ecc) ? layout.qr.ecc : "M",
        darkColor: palette.darkColor,
        lightColor: palette.lightColor,
        roundDots: Boolean(layout.qr.roundDots),
        customEye: Boolean(layout.qr.customEye),
        eyeColor: palette.eyeColor,
      });
      context.save();
      context.beginPath();
      context.rect(destination.x, destination.y, destination.width, destination.height);
      context.clip();
      if (layout.qr.contrastProtection !== false) {
        const platePadding = Math.max(1, Math.min(layout.safeInset * 0.42, layout.size * 0.075));
        const plateX = layout.x - platePadding;
        const plateY = layout.y - platePadding;
        const plateSize = layout.size + platePadding * 2;
        context.fillStyle = "rgba(255, 255, 255, 0.98)";
        context.fillRect(plateX, plateY, plateSize, plateSize);
        context.strokeStyle = "rgba(17, 24, 39, 0.28)";
        context.lineWidth = Math.max(0.5, dpi / 300);
        context.strokeRect(plateX, plateY, plateSize, plateSize);
      }
      context.drawImage(result.canvas, layout.x, layout.y, layout.size, layout.size);
      context.restore();
      return true;
    } catch (error) {
      options.onWarning?.({ code: "QR_RENDER_FAILED", message: error.message || "QR코드를 그릴 수 없습니다.", recordId: item.record?.id, side: item.side });
      return false;
    }
  }

  function drawLabelText(context, item, destination, dpi, options = {}) {
    const data = item.data || {};
    const text = normalizedTextData(item);
    const style = mergedStyle(item);
    const layout = textLayout(item, destination, dpi, options);
    const oriented = resolveOrientedBox(layout, style.rotation ?? data.rotation ?? 0);
    const { x, y, width, height } = oriented;
    const base = Math.max(8, Math.min(width, height));
    const align = ["left", "center", "right"].includes(style.align) ? style.align : "center";
    const contrastMode = String(style.contrastMode || data.textContrast || options.textContrast || "manual").toLowerCase();
    const automaticContrast = contrastMode === "auto" || style.autoContrast === true;
    const contrastProfile = item.contrastProfile || summarizeContrastSamples([
      relativeLuminance(data.backgroundColor || style.backgroundColor || options.labelBackground || "#ffffff"),
    ]);
    const color = automaticContrast ? contrastProfile.color : style.color || data.textColor || "#111827";
    const qrRect = layout.qr ? { x: layout.qr.x, y: layout.qr.y, width: layout.qr.size, height: layout.qr.size } : null;
    const customMetrics = buildCustomTextMetrics(context, text, style, { x, y, width, height }, {
      mode: layout.mode,
      qrRect: rectInLogicalOrientation(qrRect, oriented),
      gap: layout.gap,
    });
    if (customMetrics) {
      context.save();
      context.beginPath();
      context.rect(destination.x, destination.y, destination.width, destination.height);
      context.clip();
      const overlayOpacity = clamp(style.overlayOpacity ?? data.overlayOpacity ?? 0, 0, 1);
      if (overlayOpacity > 0) {
        context.fillStyle = style.overlayColor || "#ffffff";
        context.globalAlpha = overlayOpacity;
        context.fillRect(destination.x, destination.y, destination.width, destination.height);
        context.globalAlpha = 1;
      }
      applyOrientedTransform(context, oriented);
      if (automaticContrast && contrastProfile.needsScrim && customMetrics.bounds.height > 0) {
        const protectionPadding = Math.max(1, Math.min(layout.inset * 0.45, base * 0.08));
        const boxX = Math.max(oriented.x, customMetrics.bounds.x - protectionPadding);
        const boxY = Math.max(oriented.y, customMetrics.bounds.y - protectionPadding);
        const boxWidth = Math.min(oriented.x + oriented.width, customMetrics.bounds.x + customMetrics.bounds.width + protectionPadding) - boxX;
        const boxHeight = Math.min(oriented.y + oriented.height, customMetrics.bounds.y + customMetrics.bounds.height + protectionPadding) - boxY;
        context.save();
        context.globalAlpha = contrastProfile.scrimOpacity;
        context.fillStyle = contrastProfile.scrimColor;
        context.beginPath();
        if (typeof context.roundRect === "function") context.roundRect(boxX, boxY, boxWidth, boxHeight, Math.min(protectionPadding, base * 0.05));
        else context.rect(boxX, boxY, boxWidth, boxHeight);
        context.fill();
        context.restore();
      }
      const lineOptions = automaticContrast ? {
        strokeStyle: contrastProfile.outlineColor,
        strokeWidth: Math.max(0.45, dpi / 360),
      } : {};
      customMetrics.fields.forEach((field) => {
        setFont(context, field.size, field.weight, field.family);
        context.fillStyle = field.color === "inherit" ? color : field.color;
        field.lines.forEach((line, index) => drawTextLine(context, line, field.x, field.y + index * field.lineHeight, field.width, field.align, lineOptions));
      });
      context.restore();
      return;
    }
    const metrics = buildTextMetrics(context, text, style, base, width);
    const footerGap = metrics.footer ? base * 0.03 : 0;
    const mainAvailableHeight = Math.max(0, height - metrics.footerHeight - footerGap);
    let cursorY = alignedContentTop(y, mainAvailableHeight, metrics.mainHeight, style.verticalAlign);
    const mainStartY = cursorY;
    const footerY = y + height - metrics.footerHeight;

    context.save();
    context.beginPath();
    context.rect(destination.x, destination.y, destination.width, destination.height);
    context.clip();
    const overlayOpacity = clamp(style.overlayOpacity ?? data.overlayOpacity ?? 0, 0, 1);
    if (overlayOpacity > 0) {
      context.fillStyle = style.overlayColor || "#ffffff";
      context.globalAlpha = overlayOpacity;
      context.fillRect(destination.x, destination.y, destination.width, destination.height);
      context.globalAlpha = 1;
    }
    applyOrientedTransform(context, oriented);
    if (automaticContrast && contrastProfile.needsScrim && (metrics.mainHeight > 0 || metrics.footerHeight > 0)) {
      const protectionPadding = Math.max(1, Math.min(layout.inset * 0.45, base * 0.08));
      const protectionTop = Math.min(
        metrics.mainHeight > 0 ? mainStartY : Number.POSITIVE_INFINITY,
        metrics.footerHeight > 0 ? footerY : Number.POSITIVE_INFINITY
      );
      const protectionBottom = Math.max(
        metrics.mainHeight > 0 ? mainStartY + metrics.mainHeight : 0,
        metrics.footerHeight > 0 ? footerY + metrics.footerHeight : 0
      );
      const boxX = Math.max(oriented.x, x - protectionPadding);
      const boxY = Math.max(oriented.y, protectionTop - protectionPadding);
      const boxWidth = Math.min(oriented.x + oriented.width, x + width + protectionPadding) - boxX;
      const boxHeight = Math.min(oriented.y + oriented.height, protectionBottom + protectionPadding) - boxY;
      context.save();
      context.globalAlpha = contrastProfile.scrimOpacity;
      context.fillStyle = contrastProfile.scrimColor;
      context.beginPath();
      if (typeof context.roundRect === "function") context.roundRect(boxX, boxY, boxWidth, boxHeight, Math.min(protectionPadding, base * 0.05));
      else context.rect(boxX, boxY, boxWidth, boxHeight);
      context.fill();
      context.restore();
    }
    context.fillStyle = color;
    const lineOptions = automaticContrast ? {
      strokeStyle: contrastProfile.outlineColor,
      strokeWidth: Math.max(0.45, dpi / 360),
    } : {};

    metrics.fields.forEach((field) => {
      cursorY += field.gap;
      setFont(context, field.size, field.weight, style.fontFamily);
      const fieldAlign = field.field === "number" ? style.numberAlign || align : align;
      field.lines.forEach((line, index) => drawTextLine(context, line, x, cursorY + index * field.lineHeight, width, fieldAlign, lineOptions));
      cursorY += field.lines.length * field.lineHeight;
    });
    if (metrics.footer) {
      setFont(context, metrics.footer.size, metrics.footer.weight, style.fontFamily);
      metrics.footer.lines.forEach((line, index) => drawTextLine(context, line, x, footerY + index * metrics.footer.lineHeight, width, align, lineOptions));
    }
    context.restore();
  }

  function drawGuides(context, destination, dpi, options) {
    if (options.showCutLines) {
      context.save();
      context.strokeStyle = options.cutLineColor || "rgba(17, 24, 39, 0.48)";
      context.lineWidth = Math.max(0.5, dpi / 300);
      context.setLineDash([Math.max(2, dpi / 40), Math.max(2, dpi / 60)]);
      context.strokeRect(destination.x, destination.y, destination.width, destination.height);
      context.restore();
    }
    if (options.showSafeArea) {
      const inset = mmToPx(firstFinite(options.safeAreaMm, 2), dpi);
      if (destination.width > inset * 2 && destination.height > inset * 2) {
        context.save();
        context.strokeStyle = options.safeAreaColor || "rgba(220, 38, 38, 0.52)";
        context.lineWidth = Math.max(0.5, dpi / 300);
        context.setLineDash([Math.max(2, dpi / 50), Math.max(2, dpi / 70)]);
        context.strokeRect(destination.x + inset, destination.y + inset, destination.width - inset * 2, destination.height - inset * 2);
        context.restore();
      }
    }
  }

  function assertNotAborted(signal) {
    if (signal?.aborted) throw new DOMException("렌더링이 취소되었습니다.", "AbortError");
  }

  async function waitForDocumentFonts(signal) {
    assertNotAborted(signal);
    try {
      if (root.document?.fonts?.ready) await root.document.fonts.ready;
    } catch (_error) {
      // Keep rendering with the configured fallback stack when a webfont fails.
    }
    assertNotAborted(signal);
  }

  async function composePageCanvas(page, options = {}) {
    if (!page || typeof page !== "object") throw new LabelSheetRenderError("INVALID_PAGE", "렌더링할 페이지 정보가 없습니다.");
    await waitForDocumentFonts(options.signal);
    const paper = normalizePageSpec(page);
    const dpi = Math.max(24, Number(options.dpi) || DEFAULT_DPI);
    const pixelSize = getPagePixelSize(paper, dpi);
    const canvas = options.canvas || canvasFactory(pixelSize.width, pixelSize.height, options.preferDomCanvas === true);
    if (canvas.width !== pixelSize.width) canvas.width = pixelSize.width;
    if (canvas.height !== pixelSize.height) canvas.height = pixelSize.height;
    const outputLayer = ["background", "overlay"].includes(options.outputLayer) ? options.outputLayer : "merged";
    const drawBackground = outputLayer !== "overlay";
    const drawOverlay = outputLayer !== "background";
    const context = canvasContext(canvas, outputLayer === "overlay");
    if (outputLayer === "overlay") context.clearRect(0, 0, pixelSize.width, pixelSize.height);
    else {
      context.fillStyle = options.pageBackground || "#ffffff";
      context.fillRect(0, 0, pixelSize.width, pixelSize.height);
    }

    if (page.blank) return canvas;
    const side = String(options.side || page.side || "front").toLowerCase() === "back" ? "back" : "front";
    const placements = pagePlacements(page);
    for (let index = 0; index < placements.length; index += 1) {
      assertNotAborted(options.signal);
      const item = normalizePlacement(page, placements[index], index, side, paper, options);
      if (item.rect.widthMm <= 0 || item.rect.heightMm <= 0 || item.placement?.empty) continue;
      const destination = {
        x: mmToPx(item.rect.xMm, dpi),
        y: mmToPx(item.rect.yMm, dpi),
        width: mmToPx(item.rect.widthMm, dpi),
        height: mmToPx(item.rect.heightMm, dpi),
      };
      const bleedPx = mmToPx(Math.max(0, Number(options.bleedMm) || 0), dpi);
      const backgroundDestination = {
        x: destination.x - bleedPx,
        y: destination.y - bleedPx,
        width: destination.width + bleedPx * 2,
        height: destination.height + bleedPx * 2,
      };
      const style = mergedStyle(item);
      const backgroundColor = item.data.backgroundColor || style.backgroundColor || options.labelBackground || "#ffffff";
      let renderable = null;
      let decoded = null;
      if (item.assetId && (drawBackground || drawOverlay)) {
        renderable = await resolveRenderable(options.assetStore, item, dpi, options);
        if (renderable) {
          try {
            decoded = await decodeRenderable(renderable);
          } catch (error) {
            options.onWarning?.({
              code: error.code || "BACKGROUND_RENDER_FAILED",
              message: error.message,
              assetId: item.assetId,
              index,
              side,
            });
          }
        }
      }
      if (drawBackground) {
        context.save();
        context.beginPath();
        context.rect(backgroundDestination.x, backgroundDestination.y, backgroundDestination.width, backgroundDestination.height);
        context.clip();
        context.fillStyle = backgroundColor;
        context.fillRect(backgroundDestination.x, backgroundDestination.y, backgroundDestination.width, backgroundDestination.height);
        if (decoded) {
          try {
            drawImageBackground(context, decoded, backgroundDestination, item.data, renderable.precomposed);
          } catch (error) {
            options.onWarning?.({
              code: error.code || "BACKGROUND_RENDER_FAILED",
              message: error.message,
              assetId: item.assetId,
              index,
              side,
            });
          }
        }
        context.restore();
      }
      if (drawOverlay) {
        item.contrastProfile = analyzePlacementContrast(item, decoded, renderable?.precomposed, backgroundColor);
        drawStyleAccents(context, item, destination, dpi);
        if (qrDrawLayer(item) === "behind") drawLabelQr(context, item, destination, dpi, options);
        drawLabelText(context, item, destination, dpi, options);
        if (qrDrawLayer(item) !== "behind") drawLabelQr(context, item, destination, dpi, options);
      }
      decoded?.close?.();
      if (outputLayer === "merged") {
        drawGuides(context, destination, dpi, {
          ...options,
          showCutLines: options.showCutLines ?? page.showCutLines,
          showSafeArea: options.showSafeArea ?? page.showSafeArea,
        });
      }
    }
    return canvas;
  }

  function clearElement(element) {
    if (typeof element.replaceChildren === "function") element.replaceChildren();
    else while (element.firstChild) element.removeChild(element.firstChild);
  }

  /** Renders only one selected page. Passing an array uses currentPageIndex. */
  async function renderPreview(container, pageOrPages, options = {}) {
    if (!container || !root.document) throw new LabelSheetRenderError("PREVIEW_CONTAINER_REQUIRED", "미리보기 영역을 찾을 수 없습니다.");
    const pages = Array.isArray(pageOrPages) ? pageOrPages : [pageOrPages];
    const index = clamp(options.currentPageIndex ?? 0, 0, Math.max(0, pages.length - 1));
    const page = pages[index];
    if (!page) throw new LabelSheetRenderError("PAGE_NOT_FOUND", "선택한 미리보기 페이지가 없습니다.");
    const canvas = await composePageCanvas(page, {
      ...options,
      dpi: Number(options.previewDpi) || 72,
      preferDomCanvas: true,
    });
    assertNotAborted(options.signal);
    canvas.className = "label-sheet-preview-canvas";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `${page.side === "back" ? "뒷면" : "앞면"} ${index + 1}쪽 미리보기`);
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    const wrapper = root.document.createElement("div");
    wrapper.className = "label-sheet-preview-page";
    wrapper.dataset.pageIndex = String(index);
    wrapper.appendChild(canvas);
    clearElement(container);
    container.appendChild(wrapper);
    return { page, pageIndex: index, canvas, wrapper };
  }

  async function exportPagePng(page, options = {}) {
    const canvas = await composePageCanvas(page, { ...options, dpi: Number(options.dpi) || DEFAULT_DPI });
    const blob = await canvasToBlob(canvas, "image/png");
    if (options.download === true && root.document) {
      const url = root.URL.createObjectURL(blob);
      const anchor = root.document.createElement("a");
      anchor.href = url;
      anchor.download = options.filename || `label-sheet-${page.side || options.side || "front"}-${page.pageNumber || 1}.png`;
      anchor.click();
      root.setTimeout(() => root.URL.revokeObjectURL(url), 1000);
    }
    return blob;
  }

  function asciiBytes(input) {
    const source = String(input || "");
    const bytes = new Uint8Array(source.length);
    for (let index = 0; index < source.length; index += 1) bytes[index] = source.charCodeAt(index) & 0x7f;
    return bytes;
  }

  function concatByteArrays(parts) {
    const arrays = Array.from(parts || []).map((part) => part instanceof Uint8Array ? part : new Uint8Array(part || 0));
    const size = arrays.reduce((sum, part) => sum + part.byteLength, 0);
    const output = new Uint8Array(size);
    let offset = 0;
    arrays.forEach((part) => {
      output.set(part, offset);
      offset += part.byteLength;
    });
    return output;
  }

  function pdfNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "0";
    return String(Math.round(number * 1000) / 1000);
  }

  /** Builds a standards-compatible PDF from already encoded JPEG page images. */
  function buildPdfFromJpegPages(pageImages) {
    const pages = Array.from(pageImages || []);
    if (!pages.length) throw new LabelSheetRenderError("NO_PDF_PAGES", "PDF로 저장할 페이지가 없습니다.");
    const objects = new Map();
    const pageObjectIds = [];

    pages.forEach((page, index) => {
      const jpegBytes = page?.bytes instanceof Uint8Array ? page.bytes : new Uint8Array(page?.bytes || 0);
      const widthPx = Math.max(1, Math.round(Number(page?.widthPx) || 1));
      const heightPx = Math.max(1, Math.round(Number(page?.heightPx) || 1));
      const widthPt = Math.max(1, Number(page?.widthMm) || A4.widthMm) * 72 / 25.4;
      const heightPt = Math.max(1, Number(page?.heightMm) || A4.heightMm) * 72 / 25.4;
      if (!jpegBytes.byteLength) throw new LabelSheetRenderError("PDF_IMAGE_EMPTY", `${index + 1}쪽 PDF 이미지가 비어 있습니다.`);
      const pageObjectId = 3 + index * 3;
      const imageObjectId = pageObjectId + 1;
      const contentObjectId = pageObjectId + 2;
      pageObjectIds.push(pageObjectId);
      objects.set(pageObjectId, asciiBytes(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNumber(widthPt)} ${pdfNumber(heightPt)}] /Resources << /XObject << /Im0 ${imageObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      ));
      objects.set(imageObjectId, concatByteArrays([
        asciiBytes(`<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.byteLength} >>\nstream\n`),
        jpegBytes,
        asciiBytes("\nendstream"),
      ]));
      const content = asciiBytes(`q\n${pdfNumber(widthPt)} 0 0 ${pdfNumber(heightPt)} 0 0 cm\n/Im0 Do\nQ\n`);
      objects.set(contentObjectId, concatByteArrays([
        asciiBytes(`<< /Length ${content.byteLength} >>\nstream\n`),
        content,
        asciiBytes("endstream"),
      ]));
    });

    objects.set(1, asciiBytes("<< /Type /Catalog /Pages 2 0 R >>"));
    objects.set(2, asciiBytes(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`));
    const objectCount = 2 + pages.length * 3;
    const chunks = [new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])];
    const offsets = new Array(objectCount + 1).fill(0);
    let byteOffset = chunks[0].byteLength;
    for (let objectId = 1; objectId <= objectCount; objectId += 1) {
      const body = objects.get(objectId);
      if (!body) throw new LabelSheetRenderError("PDF_OBJECT_MISSING", `PDF 객체 ${objectId}를 만들지 못했습니다.`);
      const objectBytes = concatByteArrays([asciiBytes(`${objectId} 0 obj\n`), body, asciiBytes("\nendobj\n")]);
      offsets[objectId] = byteOffset;
      chunks.push(objectBytes);
      byteOffset += objectBytes.byteLength;
    }
    const xrefOffset = byteOffset;
    const xrefRows = ["xref", `0 ${objectCount + 1}`, "0000000000 65535 f "];
    for (let objectId = 1; objectId <= objectCount; objectId += 1) {
      xrefRows.push(`${String(offsets[objectId]).padStart(10, "0")} 00000 n `);
    }
    chunks.push(asciiBytes(`${xrefRows.join("\n")}\ntrailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`));
    return concatByteArrays(chunks);
  }

  /** Renders the supplied print sequence and returns one multi-page PDF Blob. */
  async function exportPagesPdf(pages, options = {}) {
    const sequence = normalizePrintPages(pages, options);
    if (!sequence.length) throw new LabelSheetRenderError("NO_PDF_PAGES", "PDF로 저장할 페이지가 없습니다.");
    const dpi = Math.max(72, Number(options.dpi) || DEFAULT_DPI);
    const quality = clamp(Number(options.jpegQuality ?? 0.94), 0.72, 1);
    const pageImages = [];
    for (let index = 0; index < sequence.length; index += 1) {
      assertNotAborted(options.signal);
      const page = sequence[index];
      const canvas = await composePageCanvas(page, {
        ...options,
        side: page.side || options.side,
        dpi,
        outputLayer: "merged",
      });
      const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);
      const paper = normalizePageSpec(page);
      pageImages.push({
        bytes: new Uint8Array(await jpeg.arrayBuffer()),
        widthPx: canvas.width,
        heightPx: canvas.height,
        widthMm: paper.widthMm,
        heightMm: paper.heightMm,
      });
      options.onProgress?.({ completed: index + 1, total: sequence.length, page, side: page.side || "front" });
    }
    assertNotAborted(options.signal);
    return new Blob([buildPdfFromJpegPages(pageImages)], { type: "application/pdf" });
  }

  function blankBackPage(frontPage, index) {
    return {
      blank: true,
      side: "back",
      pageNumber: frontPage?.pageNumber || index + 1,
      paper: normalizePageSpec(frontPage || {}),
    };
  }

  function buildPrintSequence(frontPages, backPages, mode = "auto-duplex") {
    const fronts = Array.from(frontPages || []).map((page) => ({ ...page, side: "front" }));
    const backs = Array.from(backPages || []).map((page) => ({ ...page, side: "back" }));
    const normalizedMode = String(mode || "auto-duplex").toLowerCase();
    if (["front-only", "manual-front", "front"].includes(normalizedMode)) return fronts;
    if (["back-only", "manual-back", "back"].includes(normalizedMode)) return backs;
    const sequence = [];
    for (let index = 0; index < fronts.length; index += 1) {
      sequence.push(fronts[index]);
      sequence.push(backs[index] || blankBackPage(fronts[index], index));
    }
    return sequence;
  }

  function ensurePrintStyle(spec = {}) {
    if (!root.document) throw new LabelSheetRenderError("DOCUMENT_UNAVAILABLE", "인쇄 문서를 만들 수 없습니다.");
    const paper = normalizePageSpec(spec);
    let style = root.document.getElementById(PRINT_STYLE_ID);
    if (!style) {
      style = root.document.createElement("style");
      style.id = PRINT_STYLE_ID;
      root.document.head.appendChild(style);
    }
    style.textContent = `
      @page { size: ${paper.widthMm}mm ${paper.heightMm}mm; margin: 0; }
      @media print {
        body.label-sheet-printing > *:not(.label-sheet-print-root) { display: none !important; }
        .label-sheet-print-root { display: block !important; margin: 0 !important; padding: 0 !important; }
        .label-sheet-print-page {
          width: ${paper.widthMm}mm !important;
          height: ${paper.heightMm}mm !important;
          margin: 0 !important;
          overflow: hidden !important;
          break-after: page;
          page-break-after: always;
        }
        .label-sheet-print-page:last-child { break-after: auto; page-break-after: auto; }
        .label-sheet-print-page > img,
        .label-sheet-print-page > canvas { width: 100% !important; height: 100% !important; display: block !important; }
      }
    `;
    return style;
  }

  function normalizePrintPages(pages, options) {
    if (Array.isArray(pages)) return pages;
    if (pages && typeof pages === "object") {
      return buildPrintSequence(pages.frontPages || pages.front || [], pages.backPages || pages.back || [], options.mode);
    }
    return [];
  }

  async function waitForPrintImage(image, signal) {
    const isReady = () => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    assertNotAborted(signal);
    if (isReady()) return image;

    if (typeof image.decode === "function") {
      try {
        await image.decode();
      } catch (error) {
        assertNotAborted(signal);
        if (!isReady()) {
          throw new LabelSheetRenderError("PRINT_IMAGE_DECODE_FAILED", "인쇄용 페이지 이미지를 준비하지 못했습니다.", {
            cause: error?.message || String(error || ""),
          });
        }
      }
    } else if (typeof image.addEventListener === "function") {
      await new Promise((resolve, reject) => {
        const finish = (callback, value) => {
          image.removeEventListener("load", onLoad);
          image.removeEventListener("error", onError);
          signal?.removeEventListener?.("abort", onAbort);
          callback(value);
        };
        const onLoad = () => finish(resolve, image);
        const onError = () => finish(reject, new LabelSheetRenderError("PRINT_IMAGE_LOAD_FAILED", "인쇄용 페이지 이미지를 불러오지 못했습니다."));
        const onAbort = () => finish(reject, new DOMException("렌더링이 취소되었습니다.", "AbortError"));
        image.addEventListener("load", onLoad, { once: true });
        image.addEventListener("error", onError, { once: true });
        signal?.addEventListener?.("abort", onAbort, { once: true });
        if (image.complete) {
          if (isReady()) finish(resolve, image);
          else finish(reject, new LabelSheetRenderError("PRINT_IMAGE_LOAD_FAILED", "인쇄용 페이지 이미지를 불러오지 못했습니다."));
        }
      });
    }

    assertNotAborted(signal);
    if (!isReady()) throw new LabelSheetRenderError("PRINT_IMAGE_NOT_READY", "인쇄용 페이지 이미지가 완전히 준비되지 않았습니다.");
    return image;
  }

  async function createPrintRoot(pages, options = {}) {
    if (!root.document) throw new LabelSheetRenderError("DOCUMENT_UNAVAILABLE", "인쇄 문서를 만들 수 없습니다.");
    const sequence = normalizePrintPages(pages, options);
    if (!sequence.length) throw new LabelSheetRenderError("NO_PRINT_PAGES", "인쇄할 페이지가 없습니다.");
    ensurePrintStyle(sequence[0]);
    const printRoot = root.document.createElement("div");
    printRoot.className = "label-sheet-print-root";
    printRoot.setAttribute("aria-label", "라벨 및 티켓 인쇄 페이지");
    const objectUrls = [];

    try {
      for (let index = 0; index < sequence.length; index += 1) {
        assertNotAborted(options.signal);
        const page = sequence[index];
        const canvas = await composePageCanvas(page, {
          ...options,
          side: page.side || options.side,
          dpi: Number(options.dpi) || DEFAULT_DPI,
        });
        const blob = await canvasToBlob(canvas, "image/png");
        const url = root.URL.createObjectURL(blob);
        objectUrls.push(url);
        const section = root.document.createElement("section");
        section.className = "label-sheet-print-page";
        section.dataset.side = page.side || "front";
        section.dataset.pageIndex = String(index);
        const paper = normalizePageSpec(page);
        section.style.width = `${paper.widthMm}mm`;
        section.style.height = `${paper.heightMm}mm`;
        const image = root.document.createElement("img");
        image.alt = `${page.side === "back" ? "뒷면" : "앞면"} ${page.pageNumber || index + 1}쪽`;
        image.width = canvas.width;
        image.height = canvas.height;
        image.src = url;
        section.appendChild(image);
        printRoot.appendChild(section);
        await waitForPrintImage(image, options.signal);
        options.onProgress?.({ completed: index + 1, total: sequence.length, page, side: page.side || "front" });
      }
    } catch (error) {
      objectUrls.splice(0).forEach((url) => root.URL.revokeObjectURL(url));
      printRoot.remove();
      throw error;
    }

    printRoot.dataset.ready = "true";
    printRoot.cleanup = () => {
      objectUrls.splice(0).forEach((url) => root.URL.revokeObjectURL(url));
      printRoot.remove();
    };
    if (options.mount) options.mount.appendChild(printRoot);
    return printRoot;
  }

  /** Explicit print API. No renderer function calls window.print implicitly. */
  async function print(printRoot, options = {}) {
    if (!printRoot || !root.document) throw new LabelSheetRenderError("PRINT_ROOT_REQUIRED", "먼저 인쇄 페이지를 생성해주세요.");
    for (const image of printRoot.querySelectorAll?.("img") || []) await waitForPrintImage(image, options.signal);
    if (printRoot.parentElement !== root.document.body) root.document.body.appendChild(printRoot);
    root.document.body.classList.add("label-sheet-printing");
    const cleanupClass = () => root.document.body.classList.remove("label-sheet-printing");
    root.addEventListener?.("afterprint", cleanupClass, { once: true });
    try {
      root.print();
    } catch (error) {
      cleanupClass();
      throw error;
    }
    return printRoot;
  }

  root.PromptDeckLabelSheetRenderer = Object.freeze({
    A4,
    DEFAULT_DPI,
    LabelSheetRenderError,
    normalizePageSpec,
    getPagePixelSize,
    relativeLuminance,
    contrastRatio,
    summarizeContrastSamples,
    resolveQrContrast,
    resolveQrLayout: qrLayout,
    resolveOrientedBox,
    normalizeCustomTextFields,
    resolveBackTransform,
    transformRectForSide,
    analyzeLabelLayout,
    buildPrintSequence,
    renderPreview,
    composePageCanvas,
    exportPagePng,
    buildPdfFromJpegPages,
    exportPagesPdf,
    ensurePrintStyle,
    createPrintRoot,
    print,
  });
})(typeof window !== "undefined" ? window : globalThis);
