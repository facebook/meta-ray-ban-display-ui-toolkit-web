/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { VisualState } from '../../base/Interactions';
import { Utility } from '../../colors/Colors';
import { ContainerMaterialLayer, LayerPlacement } from '../ContainerMaterial';
import type { CanvasLayerDrawParams } from '../ContainerMaterial.types';
import type { GradientStop } from '../canvas/CanvasDrawUtils';
import type { RadialMultiplier } from './LayerSupport';

export interface BlurredRadialGradientLayerConfig {
  id: string;
  placement?: LayerPlacement;
  sortOrder?: number;
  blendMode?: GlobalCompositeOperation;
  stops?: readonly GradientStop[];
  /** Horizontal and vertical radii as fractions of the layer bounds. */
  sizeMultiplier?: RadialMultiplier;
  /** Center offset as fractions of the layer bounds. */
  placementMultiplier?: RadialMultiplier;
  /** Blur radius in logical px. */
  blurRadius?: number;
  alphaForState?: (state: VisualState) => number;
  supportsDiscretePartialFocus?: boolean;
}

interface CachedGradientBitmap {
  canvas: HTMLCanvasElement;
  logicalWidth: number;
  logicalHeight: number;
}

const DEFAULT_STOPS: readonly GradientStop[] = [
  { offset: 0, color: Utility.white },
  { offset: 1, color: Utility.transparentWhite },
];
const DEFAULT_SIZE_MULTIPLIER: RadialMultiplier = {
  x: 90 / 112,
  y: 57 / 112,
};
const DEFAULT_PLACEMENT_MULTIPLIER: RadialMultiplier = { x: 0.5, y: 0 };
const DEFAULT_BLUR_RADIUS = 32;
const BLUR_PADDING_RADII = 3;
const BITMAP_CACHE_MAX = 24;
// About 32 MiB of RGBA pixels. Larger bitmaps stay on their owning layer so
// animation frames can reuse them without allowing the shared cache to balloon.
const BITMAP_CACHE_MAX_PIXELS = 8 * 1024 * 1024;
const bitmapCache = new Map<string, CachedGradientBitmap>();
let bitmapCachePixels = 0;

function bitmapPixels(bitmap: CachedGradientBitmap): number {
  return bitmap.canvas.width * bitmap.canvas.height;
}

function cacheGet(key: string): CachedGradientBitmap | undefined {
  const bitmap = bitmapCache.get(key);
  if (bitmap != null) {
    // Map iteration order is the LRU order, so reinsert a hit as newest.
    bitmapCache.delete(key);
    bitmapCache.set(key, bitmap);
  }
  return bitmap;
}

function cacheSet(key: string, bitmap: CachedGradientBitmap): void {
  const pixels = bitmapPixels(bitmap);
  if (bitmapCache.has(key)) {
    const existing = bitmapCache.get(key);
    if (existing != null) {
      bitmapCachePixels -= bitmapPixels(existing);
    }
    bitmapCache.delete(key);
  }
  while (
    bitmapCache.size > 0 &&
    (bitmapCache.size >= BITMAP_CACHE_MAX ||
      bitmapCachePixels + pixels > BITMAP_CACHE_MAX_PIXELS)
  ) {
    const oldestKey = bitmapCache.keys().next().value;
    if (oldestKey == null) {
      break;
    }
    const evicted = bitmapCache.get(oldestKey);
    bitmapCache.delete(oldestKey);
    if (evicted != null) {
      bitmapCachePixels -= bitmapPixels(evicted);
      evicted.canvas.width = 0;
      evicted.canvas.height = 0;
    }
  }
  bitmapCache.set(key, bitmap);
  bitmapCachePixels += pixels;
}

function createCanvas(
  logicalWidth: number,
  logicalHeight: number,
  dpr: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(logicalWidth * dpr));
  canvas.height = Math.max(1, Math.ceil(logicalHeight * dpr));
  const ctx = canvas.getContext('2d');
  if (ctx == null) {
    return null;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { canvas, ctx };
}

function createBitmap(
  gradientWidth: number,
  gradientHeight: number,
  blurRadius: number,
  dpr: number,
  stops: readonly GradientStop[],
): CachedGradientBitmap | null {
  const blurPadding =
    Math.ceil(blurRadius * BLUR_PADDING_RADII * dpr) / dpr;
  const logicalWidth = gradientWidth + blurPadding * 2;
  const logicalHeight = gradientHeight + blurPadding * 2;
  const source = createCanvas(logicalWidth, logicalHeight, dpr);
  const target = createCanvas(logicalWidth, logicalHeight, dpr);
  if (source == null || target == null) {
    return null;
  }

  const centerX = logicalWidth / 2;
  const centerY = logicalHeight / 2;
  const radius = gradientHeight / 2;
  source.ctx.save();
  source.ctx.translate(centerX, centerY);
  source.ctx.scale(gradientHeight > 0 ? gradientWidth / gradientHeight : 1, 1);
  const gradient = source.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  for (const stop of stops) {
    gradient.addColorStop(stop.offset, stop.color);
  }
  source.ctx.fillStyle = gradient;
  const cover = (logicalWidth + logicalHeight) * 4 + 1;
  source.ctx.fillRect(-cover, -cover, cover * 2, cover * 2);
  source.ctx.restore();

  if (blurRadius > 0) {
    // Canvas filter lengths are device-space values and do not inherit the
    // context transform, so scale the logical radius explicitly.
    target.ctx.filter = `blur(${blurRadius * dpr}px)`;
  }
  target.ctx.drawImage(
    source.canvas,
    0,
    0,
    source.canvas.width,
    source.canvas.height,
    0,
    0,
    logicalWidth,
    logicalHeight,
  );
  target.ctx.filter = 'none';

  return { canvas: target.canvas, logicalWidth, logicalHeight };
}

/**
 * A blurred elliptical radial gradient whose cached bitmap moves with partial
 * focus without recomputing the blur.
 */
export class BlurredRadialGradientContainerMaterialLayer extends ContainerMaterialLayer {
  private readonly stops: readonly GradientStop[];
  private readonly sizeMultiplier: RadialMultiplier;
  private readonly placementMultiplier: RadialMultiplier;
  private readonly blurRadius: number;
  private readonly stopsKey: string;
  private localBitmapKey: string | null = null;
  private localBitmap: CachedGradientBitmap | null = null;

  constructor(config: BlurredRadialGradientLayerConfig) {
    super(config.id, config.placement ?? LayerPlacement.FOREGROUND, {
      sortOrder: config.sortOrder,
      blendMode: config.blendMode ?? 'source-over',
      alphaForState: config.alphaForState,
      supportsDiscretePartialFocus:
        config.supportsDiscretePartialFocus ?? true,
    });
    this.stops = (config.stops ?? DEFAULT_STOPS).map(stop => ({ ...stop }));
    this.sizeMultiplier = config.sizeMultiplier ?? DEFAULT_SIZE_MULTIPLIER;
    this.placementMultiplier =
      config.placementMultiplier ?? DEFAULT_PLACEMENT_MULTIPLIER;
    this.blurRadius = Math.max(0, config.blurRadius ?? DEFAULT_BLUR_RADIUS);
    this.stopsKey = JSON.stringify(this.stops);
  }

  private getBitmap(
    width: number,
    height: number,
    dpr: number,
  ): CachedGradientBitmap | null {
    // Quantize geometry to physical pixels so insignificant layout jitter does
    // not create a distinct cached bitmap on every frame.
    const gradientPixelWidth = Math.max(
      1,
      Math.ceil(width * this.sizeMultiplier.x * 2 * dpr),
    );
    const gradientPixelHeight = Math.max(
      1,
      Math.ceil(height * this.sizeMultiplier.y * 2 * dpr),
    );
    const gradientWidth = gradientPixelWidth / dpr;
    const gradientHeight = gradientPixelHeight / dpr;
    const key = `${gradientPixelWidth}|${gradientPixelHeight}|${this.blurRadius * dpr}|${dpr}|${this.stopsKey}`;
    const cached = cacheGet(key);
    if (cached != null) {
      this.localBitmapKey = null;
      this.localBitmap = null;
      return cached;
    }

    const blurPadding =
      Math.ceil(this.blurRadius * BLUR_PADDING_RADII * dpr) / dpr;
    const pixelWidth = Math.max(
      1,
      Math.ceil((gradientWidth + blurPadding * 2) * dpr),
    );
    const pixelHeight = Math.max(
      1,
      Math.ceil((gradientHeight + blurPadding * 2) * dpr),
    );
    const retainLocally =
      pixelWidth * pixelHeight > BITMAP_CACHE_MAX_PIXELS;
    if (
      retainLocally &&
      this.localBitmapKey === key &&
      this.localBitmap != null &&
      this.localBitmap.canvas.width > 0 &&
      this.localBitmap.canvas.height > 0
    ) {
      return this.localBitmap;
    }

    const bitmap = createBitmap(
      gradientWidth,
      gradientHeight,
      this.blurRadius,
      dpr,
      this.stops,
    );
    if (bitmap != null && retainLocally) {
      this.localBitmapKey = key;
      this.localBitmap = bitmap;
    } else {
      this.localBitmapKey = null;
      this.localBitmap = null;
      if (bitmap != null) {
        cacheSet(key, bitmap);
      }
    }
    return bitmap;
  }

  clone(): this {
    const cloned = super.clone();
    cloned.localBitmapKey = null;
    cloned.localBitmap = null;
    return cloned;
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    if (
      params.width <= 0 ||
      params.height <= 0 ||
      this.sizeMultiplier.x <= 0 ||
      this.sizeMultiplier.y <= 0 ||
      this.stops.length === 0
    ) {
      return;
    }

    const dpr = Number.isFinite(params.dpr) && params.dpr > 0 ? params.dpr : 1;
    const bitmap = this.getBitmap(params.width, params.height, dpr);
    if (bitmap == null) {
      return;
    }

    const centerX =
      (this.placementMultiplier.x + (params.partialFocusPosition?.x ?? 0)) *
      params.width;
    const centerY =
      (this.placementMultiplier.y + (params.partialFocusPosition?.y ?? 0)) *
      params.height;

    ctx.save();
    ctx.globalCompositeOperation = this.blendMode ?? 'source-over';
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      bitmap.canvas,
      centerX - bitmap.logicalWidth / 2,
      centerY - bitmap.logicalHeight / 2,
      bitmap.logicalWidth,
      bitmap.logicalHeight,
    );
    ctx.restore();
  }
}
