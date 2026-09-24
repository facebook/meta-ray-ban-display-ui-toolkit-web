/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { VisualState } from '../../base/Interactions';
import { ContainerMaterialLayer, LayerPlacement } from '../ContainerMaterial';
import type { CanvasLayerDrawParams } from '../ContainerMaterial.types';
import { drawImageClipped } from '../canvas/CanvasDrawUtils';
import { resolveLayerValue, type LayerValue } from './LayerSupport';

export interface NinePatchRange {
  /** Inclusive offset in the image content, excluding the marker border. */
  start: number;
  /** Exclusive offset in the image content, excluding the marker border. */
  end: number;
}

export interface NinePatchMetadata {
  sourceWidth: number;
  sourceHeight: number;
  horizontalStretch: readonly NinePatchRange[];
  verticalStretch: readonly NinePatchRange[];
}

export interface NinePatchAxisSegment {
  sourceStart: number;
  sourceSize: number;
  destinationStart: number;
  destinationSize: number;
}

export interface NinePatchImageOverlayLayerConfig {
  id: string;
  placement?: LayerPlacement;
  sortOrder?: number;
  /** URL of a raw .9.png image whose one-pixel marker border is preserved. */
  imageUrl: LayerValue<string>;
  /** Clip the overlay to the rounded container shape. */
  clipToShape?: boolean;
  blendMode?: GlobalCompositeOperation;
  alphaForState?: (state: VisualState) => number;
}

const metadataCache = new WeakMap<object, NinePatchMetadata | null>();

function isStretchMarker(data: Uint8ClampedArray, offset: number): boolean {
  return data[offset] === 0
    && data[offset + 1] === 0
    && data[offset + 2] === 0
    && data[offset + 3] === 255;
}

function readMarkerRanges(
  data: Uint8ClampedArray,
  markerCount: number,
  pixelOffset: (index: number) => number,
): NinePatchRange[] {
  const ranges: NinePatchRange[] = [];
  let start: number | null = null;
  for (let index = 0; index < markerCount; index += 1) {
    const marked = isStretchMarker(data, pixelOffset(index));
    if (marked && start == null) {
      start = index;
    } else if (!marked && start != null) {
      ranges.push({ start, end: index });
      start = null;
    }
  }
  if (start != null) {
    ranges.push({ start, end: markerCount });
  }
  return ranges;
}

/** Parse .9.png stretch markers from the one-pixel top and left border. */
export function parseNinePatchMetadata(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): NinePatchMetadata | null {
  if (width < 3 || height < 3 || data.length < width * height * 4) {
    return null;
  }
  const sourceWidth = width - 2;
  const sourceHeight = height - 2;
  const horizontalStretch = readMarkerRanges(
    data,
    sourceWidth,
    index => (index + 1) * 4,
  );
  const verticalStretch = readMarkerRanges(
    data,
    sourceHeight,
    index => ((index + 1) * width) * 4,
  );
  if (horizontalStretch.length === 0 || verticalStretch.length === 0) {
    return null;
  }
  return {
    sourceWidth,
    sourceHeight,
    horizontalStretch,
    verticalStretch,
  };
}

/** Map alternating fixed/stretch source runs onto one destination axis. */
export function layoutNinePatchAxis(
  sourceSize: number,
  destinationSize: number,
  stretchRanges: readonly NinePatchRange[],
): NinePatchAxisSegment[] {
  if (sourceSize <= 0 || destinationSize <= 0) {
    return [];
  }

  const runs: Array<{ start: number; end: number; stretch: boolean }> = [];
  let cursor = 0;
  for (const range of stretchRanges) {
    const start = Math.max(cursor, Math.min(sourceSize, range.start));
    const end = Math.max(start, Math.min(sourceSize, range.end));
    if (start > cursor) {
      runs.push({ start: cursor, end: start, stretch: false });
    }
    if (end > start) {
      runs.push({ start, end, stretch: true });
    }
    cursor = end;
  }
  if (cursor < sourceSize) {
    runs.push({ start: cursor, end: sourceSize, stretch: false });
  }

  const stretchSize = runs.reduce(
    (total, run) => total + (run.stretch ? run.end - run.start : 0),
    0,
  );
  if (stretchSize === 0) {
    return [{
      sourceStart: 0,
      sourceSize,
      destinationStart: 0,
      destinationSize,
    }];
  }

  const fixedSize = sourceSize - stretchSize;
  const fixedScale = fixedSize > destinationSize
    ? destinationSize / fixedSize
    : 1;
  const stretchScale = (destinationSize - fixedSize * fixedScale) / stretchSize;
  let destinationCursor = 0;
  return runs.map((run, index) => {
    const runSize = run.end - run.start;
    const isLast = index === runs.length - 1;
    const scaledSize = runSize * (run.stretch ? stretchScale : fixedScale);
    const destinationEnd = isLast
      ? destinationSize
      : destinationCursor + scaledSize;
    const segment = {
      sourceStart: run.start,
      sourceSize: runSize,
      destinationStart: destinationCursor,
      destinationSize: Math.max(0, destinationEnd - destinationCursor),
    };
    destinationCursor = destinationEnd;
    return segment;
  });
}

interface DrawNinePatchImageParams {
  path?: Path2D;
  image: CanvasImageSource;
  metadata: NinePatchMetadata;
  width: number;
  height: number;
  alpha: number;
  blend?: GlobalCompositeOperation;
}

/** Draw the marker-free image content while preserving each fixed source run. */
export function drawNinePatchImage(
  ctx: CanvasRenderingContext2D,
  params: DrawNinePatchImageParams,
): void {
  if (params.alpha <= 0 || params.width <= 0 || params.height <= 0) {
    return;
  }
  const columns = layoutNinePatchAxis(
    params.metadata.sourceWidth,
    params.width,
    params.metadata.horizontalStretch,
  );
  const rows = layoutNinePatchAxis(
    params.metadata.sourceHeight,
    params.height,
    params.metadata.verticalStretch,
  );

  ctx.save();
  ctx.globalCompositeOperation = params.blend ?? 'source-over';
  ctx.globalAlpha = params.alpha;
  if (params.path != null) {
    ctx.clip(params.path);
  }
  for (const row of rows) {
    if (row.destinationSize <= 0) {
      continue;
    }
    for (const column of columns) {
      if (column.destinationSize <= 0) {
        continue;
      }
      ctx.drawImage(
        params.image,
        column.sourceStart + 1,
        row.sourceStart + 1,
        column.sourceSize,
        row.sourceSize,
        column.destinationStart,
        row.destinationStart,
        column.destinationSize,
        row.destinationSize,
      );
    }
  }
  ctx.restore();
}

function imageDimensions(image: CanvasImageSource): { width: number; height: number } | null {
  const dimensions = image as {
    naturalWidth?: number;
    naturalHeight?: number;
    videoWidth?: number;
    videoHeight?: number;
    width?: number;
    height?: number;
  };
  if ('naturalWidth' in dimensions || 'naturalHeight' in dimensions) {
    const width = dimensions.naturalWidth ?? 0;
    const height = dimensions.naturalHeight ?? 0;
    return width > 0 && height > 0 ? { width, height } : null;
  }
  if ('videoWidth' in dimensions || 'videoHeight' in dimensions) {
    const width = dimensions.videoWidth ?? 0;
    const height = dimensions.videoHeight ?? 0;
    return width > 0 && height > 0 ? { width, height } : null;
  }
  return {
    width: dimensions.width ?? 0,
    height: dimensions.height ?? 0,
  };
}

export function metadataForImage(image: CanvasImageSource): NinePatchMetadata | null {
  const key = image as object;
  const cached = metadataCache.get(key);
  if (cached !== undefined || metadataCache.has(key)) {
    return cached ?? null;
  }

  let metadata: NinePatchMetadata | null = null;
  const dimensions = imageDimensions(image);
  if (dimensions == null || typeof document === 'undefined') {
    return null;
  }
  const { width, height } = dimensions;
  if (width < 3 || height < 3) {
    metadataCache.set(key, null);
    return null;
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context == null) {
      return null;
    }
    context.drawImage(image, 0, 0);
    metadata = parseNinePatchMetadata(
      context.getImageData(0, 0, width, height).data,
      width,
      height,
    );
  } catch {
    // Cross-origin images without CORS cannot expose marker pixels. Preserve
    // the previous fill-stretch behavior for those assets.
  }
  metadataCache.set(key, metadata);
  return metadata;
}

/** .9.png overlay with marker-driven fixed/stretch regions. */
export class NinePatchImageOverlayContainerMaterialLayer extends ContainerMaterialLayer {
  private readonly imageUrl: LayerValue<string>;
  private readonly clipToShape: boolean;

  constructor(config: NinePatchImageOverlayLayerConfig) {
    super(config.id, config.placement ?? LayerPlacement.FOREGROUND, {
      sortOrder: config.sortOrder,
      blendMode: config.blendMode,
      alphaForState: config.alphaForState,
      supportsDiscretePartialFocus: false,
      clipsToShape: config.clipToShape ?? false,
    });
    this.imageUrl = config.imageUrl;
    this.clipToShape = config.clipToShape ?? false;
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    const image = params.assets.getImage(resolveLayerValue(this.imageUrl, params));
    if (image == null) {
      return;
    }
    const metadata = metadataForImage(image);
    if (metadata != null) {
      drawNinePatchImage(ctx, {
        path: this.clipToShape ? params.path : undefined,
        image,
        metadata,
        width: params.width,
        height: params.height,
        alpha,
        blend: this.blendMode,
      });
      return;
    }
    let clipPath = params.path;
    if (!this.clipToShape) {
      clipPath = new Path2D();
      clipPath.rect(0, 0, params.width, params.height);
    }
    drawImageClipped(ctx, {
      path: clipPath,
      image,
      width: params.width,
      height: params.height,
      fit: 'fill',
      alpha,
      blend: this.blendMode,
    });
  }
}
