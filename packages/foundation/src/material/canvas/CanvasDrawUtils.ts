/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Low-level canvas drawing helpers for material layers.
 *
 * Each helper performs one paint operation (solid fill, radial-gradient
 * fill/stroke, inner glow, noise, drop shadow). They draw onto a 2D context whose
 * transform is already scaled to the device pixel ratio, in logical (CSS px)
 * coordinates with the layer origin at (0, 0). Effects that would otherwise need
 * a shader or filter are reproduced with short offscreen passes.
 */

export type BlendMode = GlobalCompositeOperation;

export interface GradientStop {
  offset: number;
  color: string;
}

interface Offscreen {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

const OFFSCREEN_POOL_MAX = 6;
const OFFSCREEN_POOL_MAX_PIXELS = 8 * 1024 * 1024;
const offscreenPool: Offscreen[] = [];
let offscreenPoolPixels = 0;

function acquireOffscreen(
  logicalW: number,
  logicalH: number,
  dpr: number,
): Offscreen {
  const pooled = offscreenPool.pop();
  if (pooled != null) {
    offscreenPoolPixels -= pooled.canvas.width * pooled.canvas.height;
  }
  const off = pooled ?? createOffscreen();
  const pixelW = Math.max(1, Math.ceil(logicalW * dpr));
  const pixelH = Math.max(1, Math.ceil(logicalH * dpr));
  if (off.canvas.width !== pixelW) {
    off.canvas.width = pixelW;
  }
  if (off.canvas.height !== pixelH) {
    off.canvas.height = pixelH;
  }
  const ctx = off.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  ctx.clearRect(0, 0, off.canvas.width, off.canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return off;
}

function createOffscreen(): Offscreen {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx == null) {
    throw new Error('Failed to acquire 2D context for material offscreen canvas');
  }
  return { canvas, ctx };
}

function releaseOffscreen(off: Offscreen): void {
  const pixels = off.canvas.width * off.canvas.height;
  if (pixels > OFFSCREEN_POOL_MAX_PIXELS) {
    off.canvas.width = 0;
    off.canvas.height = 0;
    return;
  }

  while (
    offscreenPool.length > 0 &&
    (
      offscreenPool.length >= OFFSCREEN_POOL_MAX ||
      offscreenPoolPixels + pixels > OFFSCREEN_POOL_MAX_PIXELS
    )
  ) {
    const evicted = offscreenPool.shift();
    if (evicted != null) {
      offscreenPoolPixels -= evicted.canvas.width * evicted.canvas.height;
      evicted.canvas.width = 0;
      evicted.canvas.height = 0;
    }
  }
  offscreenPool.push(off);
  offscreenPoolPixels += pixels;
}

function applyStops(
  gradient: CanvasGradient,
  stops: readonly GradientStop[],
): void {
  for (const stop of stops) {
    gradient.addColorStop(stop.offset, stop.color);
  }
}

/** Fill the shape path with a solid color. */
export function fillSolid(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  color: string,
  alpha: number,
  blend: BlendMode = 'source-over',
): void {
  if (alpha <= 0) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = blend;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();
}

export interface EllipticalRadialGradientFillParams {
  path: Path2D;
  width: number;
  height: number;
  /** Gradient center in logical px. */
  cx: number;
  cy: number;
  /** Gradient radius (the y radius before x scaling). */
  radius: number;
  /** Horizontal scale applied around the center to make the gradient elliptical. */
  scaleX: number;
  stops: readonly GradientStop[];
  alpha: number;
  blend?: BlendMode;
}

/**
 * Fill the shape path with an elliptical radial gradient.
 *
 * The path is used as a clip so it is never distorted; the gradient is drawn in a
 * scaled local space (translate to center, scale x) so the radial gradient
 * becomes an ellipse.
 */
export function fillEllipticalRadialGradient(
  ctx: CanvasRenderingContext2D,
  p: EllipticalRadialGradientFillParams,
): void {
  if (p.alpha <= 0) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = p.blend ?? 'source-over';
  ctx.globalAlpha = p.alpha;
  ctx.clip(p.path);
  ctx.translate(p.cx, p.cy);
  ctx.scale(p.scaleX === 0 ? 1 : p.scaleX, 1);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(0, p.radius));
  applyStops(gradient, p.stops);
  ctx.fillStyle = gradient;
  const cover = (p.width + p.height) * 4 + 1;
  ctx.fillRect(-cover, -cover, cover * 2, cover * 2);
  ctx.restore();
}

export interface LinearGradientFillParams {
  path: Path2D;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  stops: readonly GradientStop[];
  alpha: number;
  blend?: BlendMode;
}

/** Fill the shape path with a linear gradient. */
export function fillLinearGradient(
  ctx: CanvasRenderingContext2D,
  p: LinearGradientFillParams,
): void {
  if (p.alpha <= 0) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = p.blend ?? 'source-over';
  ctx.globalAlpha = p.alpha;
  const gradient = ctx.createLinearGradient(p.x0, p.y0, p.x1, p.y1);
  applyStops(gradient, p.stops);
  ctx.fillStyle = gradient;
  ctx.fill(p.path);
  ctx.restore();
}

export interface LinearGradientRectFillParams {
  x: number;
  y: number;
  width: number;
  height: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  stops: readonly GradientStop[];
  alpha: number;
  blend?: BlendMode;
}

/**
 * Fill a rectangle (not the shape path) with a linear gradient. Used by layers
 * that intentionally supply their own rectangular geometry rather than the
 * rounded container shape (e.g. a panel scrim).
 */
export function fillLinearGradientRect(
  ctx: CanvasRenderingContext2D,
  p: LinearGradientRectFillParams,
): void {
  if (p.alpha <= 0) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = p.blend ?? 'source-over';
  ctx.globalAlpha = p.alpha;
  const gradient = ctx.createLinearGradient(p.x0, p.y0, p.x1, p.y1);
  applyStops(gradient, p.stops);
  ctx.fillStyle = gradient;
  ctx.fillRect(p.x, p.y, p.width, p.height);
  ctx.restore();
}

export interface SolidStrokeParams {
  /** Stroke path, already inset/translated into place. */
  strokePath: Path2D;
  strokeWidth: number;
  color: string;
  alpha: number;
  blend?: BlendMode;
}

/** Stroke the inset path with a solid color. */
export function strokeSolid(
  ctx: CanvasRenderingContext2D,
  p: SolidStrokeParams,
): void {
  if (p.alpha <= 0 || p.strokeWidth <= 0) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = p.blend ?? 'source-over';
  ctx.globalAlpha = p.alpha;
  ctx.lineWidth = p.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = p.color;
  ctx.stroke(p.strokePath);
  ctx.restore();
}

export interface LinearGradientStrokeParams {
  /** Stroke path, already inset/translated into place. */
  strokePath: Path2D;
  strokeWidth: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  stops: readonly GradientStop[];
  alpha: number;
  blend?: BlendMode;
}

/** Stroke the inset path with a linear gradient. */
export function strokeLinearGradient(
  ctx: CanvasRenderingContext2D,
  p: LinearGradientStrokeParams,
): void {
  if (p.alpha <= 0 || p.strokeWidth <= 0) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = p.blend ?? 'source-over';
  ctx.globalAlpha = p.alpha;
  ctx.lineWidth = p.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const gradient = ctx.createLinearGradient(p.x0, p.y0, p.x1, p.y1);
  applyStops(gradient, p.stops);
  ctx.strokeStyle = gradient;
  ctx.stroke(p.strokePath);
  ctx.restore();
}

export interface ClippedImageParams {
  path: Path2D;
  image: CanvasImageSource;
  width: number;
  height: number;
  /** How the image fills the area. Defaults to 'cover'. */
  fit?: 'cover' | 'fill';
  /** Optional blur radius in logical px. */
  blurPx?: number;
  alpha: number;
  blend?: BlendMode;
}

/** Draw an image clipped to the shape path, optionally blurred. */
export function drawImageClipped(
  ctx: CanvasRenderingContext2D,
  p: ClippedImageParams,
): void {
  if (p.alpha <= 0 || p.width <= 0 || p.height <= 0) {
    return;
  }
  const naturalW =
    (p.image as HTMLImageElement).naturalWidth ||
    (p.image as HTMLCanvasElement).width ||
    p.width;
  const naturalH =
    (p.image as HTMLImageElement).naturalHeight ||
    (p.image as HTMLCanvasElement).height ||
    p.height;
  ctx.save();
  ctx.globalCompositeOperation = p.blend ?? 'source-over';
  ctx.globalAlpha = p.alpha;
  ctx.clip(p.path);
  if (p.blurPx != null && p.blurPx > 0) {
    ctx.filter = `blur(${p.blurPx}px)`;
  }
  if ((p.fit ?? 'cover') === 'cover' && naturalW > 0 && naturalH > 0) {
    const scale = Math.max(p.width / naturalW, p.height / naturalH);
    const drawW = naturalW * scale;
    const drawH = naturalH * scale;
    const dx = (p.width - drawW) / 2;
    const dy = (p.height - drawH) / 2;
    ctx.drawImage(p.image, dx, dy, drawW, drawH);
  } else {
    ctx.drawImage(p.image, 0, 0, p.width, p.height);
  }
  ctx.restore();
}

export interface EllipticalRadialGradientStrokeParams {
  /** Stroke path, already inset/translated into place. */
  strokePath: Path2D;
  width: number;
  height: number;
  strokeWidth: number;
  cx: number;
  cy: number;
  radius: number;
  scaleX: number;
  stops: readonly GradientStop[];
  alpha: number;
  blend?: BlendMode;
  dpr: number;
}

/**
 * Stroke the inset path with an elliptical radial gradient.
 *
 * Canvas cannot transform a paint independently of its geometry, so the stroke is
 * rasterized as a white mask on an offscreen, then tinted by the elliptical
 * gradient via source-in. This keeps the stroke geometry undistorted while the
 * gradient (which encodes the per-pixel alpha falloff) follows the elliptical
 * scale matrix.
 */
export function strokeEllipticalRadialGradient(
  ctx: CanvasRenderingContext2D,
  p: EllipticalRadialGradientStrokeParams,
): void {
  if (p.alpha <= 0 || p.strokeWidth <= 0 || p.width <= 0 || p.height <= 0) {
    return;
  }
  const off = acquireOffscreen(p.width, p.height, p.dpr);
  const octx = off.ctx;

  octx.lineWidth = p.strokeWidth;
  octx.lineCap = 'round';
  octx.lineJoin = 'round';
  octx.strokeStyle = '#ffffff';
  octx.stroke(p.strokePath);

  octx.globalCompositeOperation = 'source-in';
  octx.save();
  octx.translate(p.cx, p.cy);
  octx.scale(p.scaleX === 0 ? 1 : p.scaleX, 1);
  const gradient = octx.createRadialGradient(0, 0, 0, 0, 0, Math.max(0, p.radius));
  applyStops(gradient, p.stops);
  octx.fillStyle = gradient;
  const cover = (p.width + p.height) * 4 + 1;
  octx.fillRect(-cover, -cover, cover * 2, cover * 2);
  octx.restore();

  ctx.save();
  ctx.globalCompositeOperation = p.blend ?? 'overlay';
  ctx.globalAlpha = p.alpha;
  ctx.drawImage(off.canvas, 0, 0, p.width, p.height);
  ctx.restore();

  releaseOffscreen(off);
}

export interface InnerGlowParams {
  path: Path2D;
  width: number;
  height: number;
  color: string;
  /** Blur radius in logical px; sigma = blurRadius * sigmaScale. */
  blurRadius: number;
  sigmaScale?: number;
  alpha: number;
  blend?: BlendMode;
  dpr: number;
  /**
   * Directional offset (logical px) of the falloff. Shifts the blurred edge
   * bleed so the glow is biased toward one side. Default (0, 0) = symmetric.
   */
  offsetX?: number;
  offsetY?: number;
  /**
   * Inward dilation (logical px) of the shadow source before the blur. Positive
   * values thicken the falloff and push it deeper into the shape. Default 0.
   */
  spread?: number;
  /**
   * Peak strength multiplier applied to the composited falloff (× peakScale).
   * Default 1. Applied at composite time (does not affect the cached bitmap).
   */
  intensity?: number;
  /**
   * Geometry discriminator (e.g. cornerRadius + tailDirection) so a layer cache
   * keyed on size/color/blur also invalidates when the shape changes. Required
   * for caching to engage.
   */
  shapeKey?: string;
}

function renderInnerGlowBitmap(
  target: HTMLCanvasElement,
  tctx: CanvasRenderingContext2D,
  p: InnerGlowParams,
  pad: number,
  paddedW: number,
  paddedH: number,
  sigma: number,
): void {
  const pixelW = Math.max(1, Math.ceil(paddedW * p.dpr));
  const pixelH = Math.max(1, Math.ceil(paddedH * p.dpr));
  if (target.width !== pixelW) {
    target.width = pixelW;
  }
  if (target.height !== pixelH) {
    target.height = pixelH;
  }
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  tctx.globalCompositeOperation = 'source-over';
  tctx.globalAlpha = 1;
  tctx.filter = 'none';
  tctx.clearRect(0, 0, pixelW, pixelH);
  tctx.setTransform(p.dpr, 0, 0, p.dpr, 0, 0);

  const spread = p.spread ?? 0;
  const offsetX = p.offsetX ?? 0;
  const offsetY = p.offsetY ?? 0;

  const outside = acquireOffscreen(paddedW, paddedH, p.dpr);
  const octx = outside.ctx;
  // White everywhere, then remove the shape interior -> white only outside.
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, paddedW, paddedH);
  octx.globalCompositeOperation = 'destination-out';
  octx.save();
  octx.translate(pad, pad);
  octx.fill(p.path);
  octx.restore();
  // Spread: dilate the flood inward by stroking the edge with a white ring of
  // half-width `spread`, so the source extends `spread` px into the shape before
  // the blur — thickening the falloff.
  if (spread > 0) {
    octx.globalCompositeOperation = 'source-over';
    octx.strokeStyle = '#ffffff';
    octx.lineWidth = spread * 2;
    octx.lineJoin = 'round';
    octx.save();
    octx.translate(pad, pad);
    octx.stroke(p.path);
    octx.restore();
  }

  // Blur the outside flood inward, shifted by the directional offset.
  tctx.filter = `blur(${sigma}px)`;
  tctx.drawImage(outside.canvas, offsetX, offsetY, paddedW, paddedH);
  tctx.filter = 'none';
  // Keep only the inward bleed (inside the shape).
  tctx.globalCompositeOperation = 'destination-in';
  tctx.save();
  tctx.translate(pad, pad);
  tctx.fill(p.path);
  tctx.restore();
  // Tint the falloff alpha with the glow color.
  tctx.globalCompositeOperation = 'source-in';
  tctx.fillStyle = p.color;
  tctx.fillRect(0, 0, paddedW, paddedH);

  releaseOffscreen(outside);
}

/**
 * Draw an inner glow that is strongest at the shape edge and falls off inward.
 *
 * Renders an inner-shadow effect: flood the region outside the shape, blur it
 * inward across every edge, clip the falloff back to the shape interior, then
 * tint it.
 *
 * The blurred+tinted bitmap depends only on geometry/color/blur (NOT alpha), so
 * a layer can pass its own EffectCache: the (expensive) blur is computed once and
 * only the cheap alpha/blend composite runs per frame — e.g. across a focus
 * transition where only the alpha is interpolating.
 */
// Shared LRU of computed inner-glow bitmaps. Keyed purely on the inputs that
// determine the bitmap (geometry + color + blur + dpr), so identical glows
// across materials share one bitmap and a single inner-shadow computation is
// reused across all configs.
const INNER_GLOW_CACHE_MAX = 24;
const innerGlowCache = new Map<string, HTMLCanvasElement>();

function innerGlowCacheGet(key: string): HTMLCanvasElement | undefined {
  const v = innerGlowCache.get(key);
  if (v !== undefined) {
    innerGlowCache.delete(key);
    innerGlowCache.set(key, v);
  }
  return v;
}

function innerGlowCacheSet(key: string, canvas: HTMLCanvasElement): void {
  if (innerGlowCache.has(key)) {
    innerGlowCache.delete(key);
  } else if (innerGlowCache.size >= INNER_GLOW_CACHE_MAX) {
    const oldest = innerGlowCache.keys().next().value;
    if (oldest !== undefined) {
      innerGlowCache.delete(oldest);
    }
  }
  innerGlowCache.set(key, canvas);
}

export function drawInnerGlow(
  ctx: CanvasRenderingContext2D,
  p: InnerGlowParams,
): void {
  if (p.alpha <= 0 || p.width <= 0 || p.height <= 0) {
    return;
  }
  const sigma = p.blurRadius * (p.sigmaScale ?? 0.5);
  const spread = p.spread ?? 0;
  const offsetX = p.offsetX ?? 0;
  const offsetY = p.offsetY ?? 0;
  // Pad for the blur reach plus the directional offset and inward spread so the
  // shifted/thickened falloff is never clipped by the bitmap edge.
  const pad = Math.max(24, Math.ceil(sigma * 3) + spread + Math.max(Math.abs(offsetX), Math.abs(offsetY)));
  const paddedW = p.width + pad * 2;
  const paddedH = p.height + pad * 2;

  // Cache when a shape discriminator is supplied; the bitmap depends on geometry
  // + color + blur + offset + spread (NOT alpha or intensity), so a focus
  // transition (only alpha interpolating) recomputes the blur zero times.
  const key =
    p.shapeKey != null
      ? `${p.shapeKey}|${p.width}|${p.height}|${p.color}|${p.blurRadius}|${p.sigmaScale ?? 0.5}|${offsetX}|${offsetY}|${spread}|${p.dpr}`
      : null;

  let bitmap = key != null ? innerGlowCacheGet(key) : undefined;
  let pooled: Offscreen | null = null;
  if (bitmap == null) {
    if (key != null) {
      const target = document.createElement('canvas');
      const tctx = target.getContext('2d');
      if (tctx == null) {
        return;
      }
      renderInnerGlowBitmap(target, tctx, p, pad, paddedW, paddedH, sigma);
      innerGlowCacheSet(key, target);
      bitmap = target;
    } else {
      pooled = acquireOffscreen(paddedW, paddedH, p.dpr);
      renderInnerGlowBitmap(pooled.canvas, pooled.ctx, p, pad, paddedW, paddedH, sigma);
      bitmap = pooled.canvas;
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = p.blend ?? 'screen';
  // Intensity scales the composited peak (intensity × peakScale); applied here
  // so it never invalidates the cached bitmap.
  ctx.globalAlpha = p.alpha * (p.intensity ?? 1);
  ctx.drawImage(bitmap, -pad, -pad, paddedW, paddedH);
  ctx.restore();

  if (pooled != null) {
    releaseOffscreen(pooled);
  }
}

export interface NoiseFillParams {
  path: Path2D;
  image: CanvasImageSource;
  tileSize: number;
  alpha: number;
  blend?: BlendMode;
}

// Cache the repeating noise CanvasPattern (with its scale matrix already applied).
// A CanvasPattern is bound to the context that created it, so the cache is keyed
// per-ctx, then per source image, then per cache key — all stable across frames.
// A single shared noise pattern is reused process-wide, which avoids re-creating
// the pattern + a DOMMatrix on every fill (the noise layer is
// re-painted every frame whenever it shares a surface with an animated layer).
//
// The cache key must include the source image's natural dimensions, not just the
// tile size: the applied transform is `tileSize / naturalW` × `tileSize / naturalH`.
// An HTMLImageElement that is still decoding reports `naturalWidth`/`naturalHeight`
// of 0, so the fallback collapses the transform to scale 1. Keying on tile size
// alone would then return that wrongly-scaled pattern forever, even after the image
// finishes loading and its real natural size becomes available.
const noisePatternCache = new WeakMap<
  CanvasRenderingContext2D,
  WeakMap<CanvasImageSource, Map<string, CanvasPattern>>
>();

function getNoisePattern(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  tileSize: number,
): CanvasPattern | null {
  let byImage = noisePatternCache.get(ctx);
  if (byImage == null) {
    byImage = new WeakMap();
    noisePatternCache.set(ctx, byImage);
  }
  let byKey = byImage.get(image);
  if (byKey == null) {
    byKey = new Map();
    byImage.set(image, byKey);
  }
  const naturalW =
    (image as HTMLImageElement).naturalWidth ||
    (image as HTMLVideoElement).videoWidth ||
    (image as HTMLCanvasElement).width ||
    tileSize;
  const naturalH =
    (image as HTMLImageElement).naturalHeight ||
    (image as HTMLVideoElement).videoHeight ||
    (image as HTMLCanvasElement).height ||
    tileSize;
  const cacheKey = `${tileSize}:${naturalW}:${naturalH}`;
  const cached = byKey.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  const pattern = ctx.createPattern(image, 'repeat');
  if (pattern == null) {
    return null;
  }
  if (typeof pattern.setTransform === 'function' && naturalW > 0 && naturalH > 0) {
    pattern.setTransform(
      new DOMMatrix().scaleSelf(tileSize / naturalW, tileSize / naturalH),
    );
  }
  byKey.set(cacheKey, pattern);
  return pattern;
}

/** Fill the shape path with a repeating, scaled noise texture. */
export function fillNoise(
  ctx: CanvasRenderingContext2D,
  p: NoiseFillParams,
): void {
  if (p.alpha <= 0) {
    return;
  }
  const pattern = getNoisePattern(ctx, p.image, p.tileSize);
  if (pattern == null) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = p.blend ?? 'overlay';
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = pattern;
  ctx.fill(p.path);
  ctx.restore();
}

export interface DropShadowParams {
  path: Path2D;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Draw a drop shadow halo around the shape (outside the fill).
 *
 * Fills the path with the shadow set, then punches out the solid interior so only
 * the blurred halo remains; the fill above it covers the interior anyway.
 */
export function drawDropShadow(
  ctx: CanvasRenderingContext2D,
  p: DropShadowParams,
): void {
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = p.blur;
  ctx.shadowOffsetX = p.offsetX;
  ctx.shadowOffsetY = p.offsetY;
  ctx.fillStyle = '#000000';
  ctx.fill(p.path);
  ctx.shadowColor = 'transparent';
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fill(p.path);
  ctx.restore();
}
