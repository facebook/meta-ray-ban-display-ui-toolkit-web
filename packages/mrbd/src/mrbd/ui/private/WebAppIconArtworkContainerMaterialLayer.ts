/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ContainerMaterialLayer,
  LayerPlacement,
  MAX_SORT_ORDER,
  type CanvasLayerDrawParams,
} from '@wearables-ui-toolkit/foundation';
import { Utility } from '@wearables-ui-toolkit/foundation/colors/Colors';
import {
  colorAlpha,
  createWebAppIconTokenScale,
  opaqueColor,
} from './WebAppIconColor';
import {
  WEB_APP_ICON_ARTWORK_SCALE,
  WEB_APP_ICON_ARTWORK_SIZE,
} from './WebAppIconMetrics';

interface WebAppIconArtworkLayerConfig {
  iconSrc: string;
  effectColor: string;
}

interface CanvasWithContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

interface ArtworkCacheEntry {
  artwork: HTMLCanvasElement;
  iconSrc: string;
  /**
   * The artwork's intended size in CSS pixels. The backing store is rounded up
   * to whole device pixels, so dividing its dimensions back by `dpr` overshoots
   * and de-centers the draw; this keeps the exact value.
   */
  renderSize: number;
}

const SHADOW_OFFSET_X = 3.42857;
const SHADOW_OFFSET_Y = 4.57143;
const SHADOW_BLUR = 3.42857;
const SHADOW_OPACITY = 0.35;
const EFFECT_BLUR = 16;
const EFFECT_MASK_PASSES = 4;
const EFFECT_OPACITY_MULTIPLIER = 2.5;
const THEME_CENTER_X = 6.5;
const THEME_CENTER_Y = 9;
const THEME_RADIUS_X = 57.6563;
const THEME_RADIUS_Y = 58.2329;
const THEME_ROTATION_RADIANS = 43.243 * Math.PI / 180;
const THEME_CLEAR_STOP = 0.6;
const ARTWORK_CACHE_LIMIT = 64;
const artworkCache = new Map<string, ArtworkCacheEntry>();
const preloadedArtworkCache = new Map<string, CanvasImageSource>();

function invalidateRenderedArtwork(iconSrc: string): void {
  artworkCache.forEach((entry, key) => {
    if (entry.iconSrc === iconSrc) {
      artworkCache.delete(key);
      entry.artwork.width = 0;
      entry.artwork.height = 0;
    }
  });
}

export function cachePreloadedWebAppIconArtwork(
  iconSrc: string,
  image: CanvasImageSource,
): void {
  invalidateRenderedArtwork(iconSrc);
  preloadedArtworkCache.delete(iconSrc);
  preloadedArtworkCache.set(iconSrc, image);
  while (preloadedArtworkCache.size > ARTWORK_CACHE_LIMIT) {
    const oldestKey = preloadedArtworkCache.keys().next().value as string | undefined;
    if (oldestKey == null) {
      break;
    }
    preloadedArtworkCache.delete(oldestKey);
    invalidateRenderedArtwork(oldestKey);
  }
}

export function getPreloadedWebAppIconArtwork(
  iconSrc: string,
): CanvasImageSource | null {
  const image = preloadedArtworkCache.get(iconSrc);
  if (image == null) {
    return null;
  }
  // Deliberate: the delete/re-insert is what makes this LRU rather than FIFO,
  // and a read is a real use. Reads never evict — eviction lives only in the
  // insert loop above — so this reorders recency without dropping entries.
  preloadedArtworkCache.delete(iconSrc);
  preloadedArtworkCache.set(iconSrc, image);
  return image;
}

/**
 * Whether artwork can actually be drawn. Callers reporting a cache hit as
 * success share this rule with the paint path, so both agree on what resolved.
 */
export function isRenderableWebAppIconArtwork(image: CanvasImageSource): boolean {
  return imageDimensions(image) != null;
}

function createCanvas(size: number, dpr: number): CanvasWithContext | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(size * dpr));
  canvas.height = Math.max(1, Math.ceil(size * dpr));
  const context = canvas.getContext('2d');
  if (context == null) {
    return null;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { canvas, context };
}

function imageDimensions(image: CanvasImageSource): { width: number; height: number } | null {
  const candidate = image as {
    naturalWidth?: number;
    naturalHeight?: number;
    videoWidth?: number;
    videoHeight?: number;
    width?: number;
    height?: number;
  };
  const width = candidate.naturalWidth ?? candidate.videoWidth ?? candidate.width;
  const height = candidate.naturalHeight ?? candidate.videoHeight ?? candidate.height;
  return width != null && height != null && width > 0 && height > 0
    ? { width, height }
    : null;
}

function drawAspectFit(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  size: number,
  left = 0,
  top = 0,
): boolean {
  const dimensions = imageDimensions(image);
  if (dimensions == null) {
    return false;
  }
  const scale = Math.min(size / dimensions.width, size / dimensions.height);
  const width = dimensions.width * scale;
  const height = dimensions.height * scale;
  context.drawImage(
    image,
    left + (size - width) / 2,
    top + (size - height) / 2,
    width,
    height,
  );
  return true;
}

function createBlurredMask(
  source: CanvasWithContext,
  size: number,
  dpr: number,
  blurRadius: number,
  passes = 1,
): CanvasWithContext | null {
  const output = createCanvas(size, dpr);
  if (output == null) {
    return null;
  }
  output.context.filter = `blur(${blurRadius * dpr}px)`;
  // Repeated source-over draws preserve alpha through the wide blur.
  for (let pass = 0; pass < passes; pass += 1) {
    output.context.drawImage(source.canvas, 0, 0, size, size);
  }
  output.context.filter = 'none';
  return output;
}

function createMonochromeArtwork(
  image: CanvasImageSource,
  effectColor: string,
  size: number,
  dpr: number,
): { canvas: HTMLCanvasElement; renderSize: number } | null {
  const geometryScale = size / WEB_APP_ICON_ARTWORK_SIZE;
  // Every effect drawn into the padded canvas has to fit inside this margin, so
  // it tracks the furthest-reaching one rather than assuming the blur wins.
  const renderPadding = Math.max(
    EFFECT_BLUR,
    SHADOW_OFFSET_X + SHADOW_BLUR,
    SHADOW_OFFSET_Y + SHADOW_BLUR,
  ) * geometryScale;
  const renderSize = size + renderPadding * 2;
  const mask = createCanvas(renderSize, dpr);
  const output = createCanvas(renderSize, dpr);
  const face = createCanvas(renderSize, dpr);
  const themed = createCanvas(renderSize, dpr);
  const shadow = createCanvas(renderSize, dpr);
  if (mask == null || output == null || face == null || themed == null || shadow == null) {
    return null;
  }
  if (!drawAspectFit(mask.context, image, size, renderPadding, renderPadding)) {
    return null;
  }
  const shadowMask = createBlurredMask(
    mask,
    renderSize,
    dpr,
    SHADOW_BLUR * geometryScale,
  );
  const effectMask = createBlurredMask(
    mask,
    renderSize,
    dpr,
    EFFECT_BLUR * geometryScale,
    EFFECT_MASK_PASSES,
  );
  if (shadowMask == null || effectMask == null) {
    return null;
  }

  shadow.context.drawImage(shadowMask.canvas, 0, 0, renderSize, renderSize);
  shadow.context.globalCompositeOperation = 'source-in';
  shadow.context.fillStyle = Utility.occlude;
  shadow.context.fillRect(0, 0, renderSize, renderSize);

  output.context.save();
  output.context.globalAlpha = SHADOW_OPACITY;
  output.context.drawImage(
    shadow.canvas,
    0,
    0,
    shadow.canvas.width,
    shadow.canvas.height,
    SHADOW_OFFSET_X * geometryScale,
    SHADOW_OFFSET_Y * geometryScale,
    renderSize,
    renderSize,
  );
  output.context.restore();

  face.context.drawImage(mask.canvas, 0, 0, renderSize, renderSize);
  face.context.globalCompositeOperation = 'source-in';
  face.context.fillStyle = Utility.white;
  face.context.fillRect(0, 0, renderSize, renderSize);
  output.context.drawImage(face.canvas, 0, 0, renderSize, renderSize);

  const effectHighlight = createWebAppIconTokenScale(effectColor, [150])[0] ?? effectColor;
  const gradient = themed.context.createLinearGradient(
    0,
    renderPadding,
    0,
    renderPadding + size,
  );
  gradient.addColorStop(0, opaqueColor(effectHighlight));
  gradient.addColorStop(1, opaqueColor(effectColor));
  themed.context.globalAlpha = Math.min(1, colorAlpha(effectColor) * EFFECT_OPACITY_MULTIPLIER);
  themed.context.fillStyle = gradient;
  themed.context.fillRect(0, 0, renderSize, renderSize);

  themed.context.globalAlpha = 1;
  themed.context.globalCompositeOperation = 'destination-in';
  themed.context.drawImage(effectMask.canvas, 0, 0, renderSize, renderSize);
  themed.context.drawImage(mask.canvas, 0, 0, renderSize, renderSize);

  themed.context.save();
  themed.context.translate(
    renderPadding + THEME_CENTER_X * geometryScale,
    renderPadding + THEME_CENTER_Y * geometryScale,
  );
  themed.context.rotate(THEME_ROTATION_RADIANS);
  themed.context.scale(
    THEME_RADIUS_X * geometryScale,
    THEME_RADIUS_Y * geometryScale,
  );
  const reveal = themed.context.createRadialGradient(0, 0, 0, 0, 0, 1);
  reveal.addColorStop(0, Utility.transparent);
  reveal.addColorStop(THEME_CLEAR_STOP, Utility.transparent);
  reveal.addColorStop(1, Utility.white);
  themed.context.fillStyle = reveal;
  const coverX = renderSize * 2 / (THEME_RADIUS_X * geometryScale);
  const coverY = renderSize * 2 / (THEME_RADIUS_Y * geometryScale);
  themed.context.fillRect(-coverX, -coverY, coverX * 2, coverY * 2);
  themed.context.restore();

  output.context.drawImage(themed.canvas, 0, 0, renderSize, renderSize);
  return { canvas: output.canvas, renderSize };
}

function cacheArtwork(
  key: string,
  iconSrc: string,
  artwork: HTMLCanvasElement,
  renderSize: number,
): ArtworkCacheEntry {
  const cached = artworkCache.get(key);
  if (cached != null) {
    artwork.width = 0;
    artwork.height = 0;
    artworkCache.delete(key);
    artworkCache.set(key, cached);
    return cached;
  }
  while (artworkCache.size >= ARTWORK_CACHE_LIMIT) {
    const oldest = artworkCache.entries().next().value as
      | [string, ArtworkCacheEntry]
      | undefined;
    if (oldest == null) {
      break;
    }
    artworkCache.delete(oldest[0]);
    oldest[1].artwork.width = 0;
    oldest[1].artwork.height = 0;
  }
  const entry = { artwork, iconSrc, renderSize };
  artworkCache.set(key, entry);
  return entry;
}

export class WebAppIconArtworkContainerMaterialLayer extends ContainerMaterialLayer {
  private readonly iconSrc: string;
  private readonly effectColor: string;

  constructor(config: WebAppIconArtworkLayerConfig) {
    super('web-app-icon-artwork', LayerPlacement.FOREGROUND, {
      sortOrder: MAX_SORT_ORDER,
      supportsDiscretePartialFocus: false,
      clipsToShape: false,
    });
    this.iconSrc = config.iconSrc;
    this.effectColor = config.effectColor;
  }

  protected paint(
    context: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    const image = getPreloadedWebAppIconArtwork(this.iconSrc) ??
      params.assets.getImage(this.iconSrc);
    if (image == null) {
      return;
    }
    const dpr = Number.isFinite(params.dpr) && params.dpr > 0 ? params.dpr : 1;
    const artworkSize = Math.min(params.width, params.height) *
      WEB_APP_ICON_ARTWORK_SCALE;
    if (!Number.isFinite(artworkSize) || artworkSize <= 0) {
      return;
    }
    const cacheKey = [
      this.iconSrc,
      this.effectColor,
      artworkSize,
      dpr,
    ].join('|');
    let entry = artworkCache.get(cacheKey);
    if (entry == null) {
      const rendered = createMonochromeArtwork(
        image,
        this.effectColor,
        artworkSize,
        dpr,
      );
      if (rendered == null) {
        return;
      }
      entry = cacheArtwork(
        cacheKey,
        this.iconSrc,
        rendered.canvas,
        rendered.renderSize,
      );
    }
    const artwork = entry.artwork;
    // The intended CSS size, not the rounded-up backing store divided by dpr,
    // so the draw stays exactly centered.
    const renderedWidth = entry.renderSize;
    const renderedHeight = entry.renderSize;
    const left = (params.width - renderedWidth) / 2;
    const top = (params.height - renderedHeight) / 2;
    context.save();
    context.globalAlpha = alpha;
    context.drawImage(
      artwork,
      0,
      0,
      artwork.width,
      artwork.height,
      left,
      top,
      renderedWidth,
      renderedHeight,
    );
    context.restore();
  }
}
