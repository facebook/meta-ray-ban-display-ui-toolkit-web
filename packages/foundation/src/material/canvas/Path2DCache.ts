/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MaterialShapeContext } from '../ContainerMaterial.types';
import { getCachedStrokePath } from '../ShapeProvider';

/**
 * Path2D cache for canvas material rendering.
 *
 * The smooth-corner generators produce standard SVG path `d` strings, which the
 * Path2D constructor consumes directly. Building a Path2D is comparatively
 * expensive (the browser re-parses the `d` string), so the result is cached by
 * the same key used for the underlying path string. Each layer in a material
 * draws against the same shared Path2D — every layer draws the single shape path
 * owned by the material.
 */

const PATH2D_CACHE_MAX_SIZE = 200;
const STROKE_PATH_STEPS_PER_DEVICE_PIXEL = 2;
const path2dCache = new Map<string, Path2D>();

function cacheGet(key: string): Path2D | undefined {
  const value = path2dCache.get(key);
  if (value !== undefined) {
    path2dCache.delete(key);
    path2dCache.set(key, value);
  }
  return value;
}

function cacheSet(key: string, value: Path2D): void {
  if (path2dCache.has(key)) {
    path2dCache.delete(key);
  } else if (path2dCache.size >= PATH2D_CACHE_MAX_SIZE) {
    const oldest = path2dCache.keys().next().value;
    if (oldest !== undefined) {
      path2dCache.delete(oldest);
    }
  }
  path2dCache.set(key, value);
}

/**
 * Build (or retrieve) a Path2D for the given SVG path `d` string. Keyed on the
 * string itself so identical geometry shares one Path2D instance.
 */
export function getPath2DForPathD(pathD: string): Path2D {
  const cached = cacheGet(pathD);
  if (cached !== undefined) {
    return cached;
  }
  const path = new Path2D(pathD);
  cacheSet(pathD, path);
  return path;
}

/**
 * Resolve the inset stroke Path2D for a stroke layer.
 *
 * The stroke is inset inward by half its width (and its corner radius reduced by
 * the same amount) so it sits fully inside the fill shape rather than straddling
 * the outer edge. The returned
 * Path2D is already translated into place, so layers stroke it directly without
 * an additional transform.
 */
export function getInsetStrokePath2D(
  width: number,
  height: number,
  strokeWidth: number,
  shapeContext: MaterialShapeContext,
  dpr: number = 1,
): Path2D {
  // Animated strokes produce a different fractional width every frame. Feeding
  // every intermediate value into the shape and Path2D caches causes unbounded
  // native-path churn until both caches evict their oldest entries. Half-device-
  // pixel buckets preserve subpixel animation while bounding each transition to
  // a small, rasterization-relevant set of inset paths.
  const effectiveDpr = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  const quantizedStrokeWidth = Math.round(
    strokeWidth * effectiveDpr * STROKE_PATH_STEPS_PER_DEVICE_PIXEL,
  ) / (effectiveDpr * STROKE_PATH_STEPS_PER_DEVICE_PIXEL);
  const pathD = getCachedStrokePath(shapeContext.shapeProvider, {
    width,
    height,
    strokeWidth: quantizedStrokeWidth,
  });
  return getPath2DForPathD(pathD);
}

/** Clear the Path2D cache (memory management / tests). */
export function clearPath2DCache(): void {
  path2dCache.clear();
}
