/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  formatPathNumber,
  generateAndroidXRoundedPolygonPath,
} from '@wearables-ui-toolkit/androidx-shapes';
import { TailDirection } from './SmoothCorners.types';
import type {
  RoundedPolygonVertex,
  SmoothRoundedRectParams,
} from './SmoothCorners.types';

export { TailDirection } from './SmoothCorners.types';
export type {
  RoundedPolygonVertex,
  SmoothRoundedRectParams,
} from './SmoothCorners.types';

/**
 * Smooth rounded rectangle path generator using cubic bezier curves.
 *
 * Smoothing behavior:
 *   - smoothing=0.0 → standard circular arc (same as CSS border-radius)
 *   - smoothing=1.0 → fully smoothed (maximum curvature continuity)
 *   - smoothing=0.75 → the toolkit's standard
 *
 * The smoothing parameter controls how far the curve extends beyond the
 * standard circular arc endpoint along each edge, creating a continuous
 * curvature transition from the flat edge into the rounded corner.
 */

/**
 * Generate an SVG path string for a smooth rounded rectangle.
 *
 * The path uses cubic bezier (C) commands to produce smoothed rounded-corner
 * geometry parameterized by radius and smoothing.
 *
 * Each corner produces three cubic bezier segments:
 *   1. smooth-in: transitions from the flat edge to the start of the arc,
 *      with control points tangent to the edge (zero curvature at start)
 *   2. arc: standard circular arc approximation using kappa
 *   3. smooth-out: transitions from the end of the arc back to the flat edge
 *
 * When smoothing=0, segments 1 and 3 collapse to zero length, leaving only
 * the standard circular arc bezier (identical to CSS border-radius).
 */
export function generateSmoothRoundedRectPath({
  x = 0,
  y = 0,
  width,
  height,
  cornerRadius,
  smoothing = 0.75,
}: SmoothRoundedRectParams): string {
  const w = width;
  const h = height;
  const shortSide = Math.min(w, h);
  const pillR = shortSide / 2;
  const r = Math.max(0, Math.min(cornerRadius, pillR));
  const s = Math.max(0, Math.min(smoothing, 1));

  // No radius -> plain rectangle
  if (r <= 0) {
    return `M ${f(x)},${f(y)} L ${f(x + w)},${f(y)} L ${f(x + w)},${f(y + h)} L ${f(x)},${f(y + h)} Z`;
  }

  // Circle fast-path: a square whose radius is half its side is a TRUE circle,
  // not a smoothed rounded polygon. Emitted as two semicircle arcs (center
  // w/2,h/2, radius r). Must precede the pill check (a circle also satisfies
  // r >= pillR).
  if (w === h && r === w / 2) {
    return `M ${f(x)},${f(y + r)} A ${f(r)},${f(r)} 0 1 1 ${f(x + w)},${f(y + r)} A ${f(r)},${f(r)} 0 1 1 ${f(x)},${f(y + r)} Z`;
  }

  // Stadium/pill fast-path: when the radius eats half the short edge, the
  // corners are pure circular arcs (smoothing is intentionally dropped), not
  // smoothed rounded-polygon corners.
  if (r >= pillR) {
    return (
      `M ${f(x + r)},${f(y)} L ${f(x + w - r)},${f(y)} ` +
      `A ${f(r)},${f(r)} 0 0 1 ${f(x + w)},${f(y + r)} L ${f(x + w)},${f(y + h - r)} ` +
      `A ${f(r)},${f(r)} 0 0 1 ${f(x + w - r)},${f(y + h)} L ${f(x + r)},${f(y + h)} ` +
      `A ${f(r)},${f(r)} 0 0 1 ${f(x)},${f(y + h - r)} L ${f(x)},${f(y + r)} ` +
      `A ${f(r)},${f(r)} 0 0 1 ${f(x + r)},${f(y)} Z`
    );
  }

  return generateAndroidXRoundedPolygonPath([
    { x, y, rounding: { radius: r, smoothing: s } },
    { x: x + w, y, rounding: { radius: r, smoothing: s } },
    { x: x + w, y: y + h, rounding: { radius: r, smoothing: s } },
    { x, y: y + h, rounding: { radius: r, smoothing: s } },
  ]);
}

/** Format a number to 4 decimal places, stripping trailing zeros */
function f(n: number): string {
  return formatPathNumber(n);
}

/**
 * Cache for computed paths to avoid recalculation.
 * Keyed on "width|height|cornerRadius|smoothing".
 * Uses LRU eviction: Map insertion order tracks age, cache hits
 * re-insert the entry to move it to most-recently-used position.
 */
const PATH_CACHE_MAX_SIZE = 200;
const pathCache = new Map<string, string>();

function pathCacheGet(key: string): string | undefined {
  const value = pathCache.get(key);
  if (value !== undefined) {
    // Move to most-recently-used position
    pathCache.delete(key);
    pathCache.set(key, value);
  }
  return value;
}

function pathCacheSet(key: string, value: string): void {
  // If key already exists, delete first so re-insert goes to end
  if (pathCache.has(key)) {
    pathCache.delete(key);
  } else if (pathCache.size >= PATH_CACHE_MAX_SIZE) {
    // Evict the least-recently-used entry (first key in iteration order)
    const oldest = pathCache.keys().next().value;
    if (oldest !== undefined) {
      pathCache.delete(oldest);
    }
  }
  pathCache.set(key, value);
}

/**
 * Generate a smooth rounded rectangle path with caching.
 *
 * This is the primary API for components.
 */
export function getCachedSmoothRoundedRectPath(
  params: SmoothRoundedRectParams
): string {
  const smoothing = params.smoothing ?? 0.75;
  const cacheKey = `${params.x ?? 0}|${params.y ?? 0}|${params.width}|${params.height}|${params.cornerRadius}|${smoothing}`;

  const cached = pathCacheGet(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const path = generateSmoothRoundedRectPath(params);
  pathCacheSet(cacheKey, path);

  return path;
}

/**
 * Clear path cache (useful for memory management).
 */
export function clearPathCache(): void {
  pathCache.clear();
}

// ============================================================================
// Tail bubble shape — message container with chat bubble tail
// Built as a smoothed rounded polygon with 5 vertices.
// ============================================================================

const TAIL_WIDTH = 16;
const TAIL_HEIGHT = 24;
const TAIL_TIP_ROUNDING = 4;
const TAIL_BASE_ROUNDING = 20;

/**
 * Generate a smoothed rounded polygon SVG path.
 *
 * This is the shared generator used by the toolkit's non-rectangular shapes such as chat
 * tails and tooltip/context-menu arrows, applying per-vertex corner rounding
 * with the standard smoothing of 0.75.
 */
export function generateRoundedPolygonPath(
  verts: RoundedPolygonVertex[],
  smoothing: number = 0.75,
): string {
  const s = Math.max(0, Math.min(smoothing, 1));
  return generateAndroidXRoundedPolygonPath(
    verts.map(v => ({
      x: v.x,
      y: v.y,
      rounding: { radius: Math.max(0, v.r), smoothing: s },
    })),
  );
}

/**
 * Generate a tail bubble SVG path, built as a smoothed 5-vertex polygon.
 *
 * RIGHT tail: tail on top-right (outbound messages)
 * LEFT tail: tail on top-left (inbound messages)
 * NONE: standard smooth rounded rect
 */
export function generateTailBubblePath(
  width: number,
  height: number,
  cornerRadius: number,
  direction: TailDirection,
  smoothing: number = 0.75,
  x: number = 0,
  y: number = 0,
): string {
  if (direction === TailDirection.NONE) {
    return generateSmoothRoundedRectPath({ x, y, width, height, cornerRadius, smoothing });
  }

  const w = width;
  const h = height;
  const r = Math.min(cornerRadius, Math.min(w, h) / 2);
  const tw = TAIL_WIDTH;
  const th = TAIL_HEIGHT;
  const tipR = TAIL_TIP_ROUNDING;
  const baseR = TAIL_BASE_ROUNDING;

  let verts: Array<{ x: number; y: number; r: number }>;

  if (direction === TailDirection.RIGHT) {
    verts = [
      { x, y, r },
      { x: x + w, y, r: tipR },
      { x: x + w - tw, y: y + th, r: baseR },
      { x: x + w - tw, y: y + h, r },
      { x, y: y + h, r },
    ];
  } else {
    verts = [
      { x, y, r: tipR },
      { x: x + w, y, r },
      { x: x + w, y: y + h, r },
      { x: x + tw, y: y + h, r },
      { x: x + tw, y: y + th, r: baseR },
    ];
  }

  return generateRoundedPolygonPath(verts, smoothing);
}

export function getCachedTailBubblePath(
  width: number,
  height: number,
  cornerRadius: number,
  direction: TailDirection,
  smoothing: number = 0.75,
  x: number = 0,
  y: number = 0,
): string {
  const cacheKey = `tail|${x}|${y}|${width}|${height}|${cornerRadius}|${direction}|${smoothing}`;
  const cached = pathCacheGet(cacheKey);
  if (cached) return cached;
  const path = generateTailBubblePath(
    width,
    height,
    cornerRadius,
    direction,
    smoothing,
    x,
    y,
  );
  pathCacheSet(cacheKey, path);
  return path;
}
