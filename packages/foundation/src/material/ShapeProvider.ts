/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  generateSmoothRoundedRectPath,
  generateTailBubblePath,
  TailDirection,
} from '../utils/SmoothCorners';
import {
  CornerRadius,
  getCornerRadiusValue,
} from '../theme/CornerRadius';

export {
  CornerRadius,
  getCornerRadiusValue,
} from '../theme/CornerRadius';

export interface ShapePathParams {
  width: number;
  height: number;
}

export interface StrokePathParams extends ShapePathParams {
  strokeWidth: number;
}

/**
 * Supplies the fill and inset-stroke geometry for a container material.
 * Implementations should be immutable; create a new provider when shape
 * configuration changes so cached geometry remains valid.
 */
export interface ShapeProvider {
  getShapePath(params: ShapePathParams): string;
  getStrokePath(params: StrokePathParams): string;
  /** CSS fallback used until measured path geometry is available. */
  getCssBorderRadius?(): string;
}

export type ShapeTailDirection = 'none' | 'left' | 'right';

const MAX_PATHS_PER_PROVIDER = 64;
const pathCaches = new WeakMap<ShapeProvider, Map<string, string>>();
const providerIds = new WeakMap<ShapeProvider, number>();
let nextProviderId = 1;

export function getShapeProviderId(provider: ShapeProvider): number {
  const existing = providerIds.get(provider);
  if (existing != null) {
    return existing;
  }
  const id = nextProviderId++;
  providerIds.set(provider, id);
  return id;
}

function getCachedPath(
  provider: ShapeProvider,
  key: string,
  createPath: () => string,
): string {
  let cache = pathCaches.get(provider);
  if (cache == null) {
    cache = new Map();
    pathCaches.set(provider, cache);
  }

  const cached = cache.get(key);
  if (cached != null) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const path = createPath();
  if (cache.size >= MAX_PATHS_PER_PROVIDER) {
    const oldest = cache.keys().next().value;
    if (oldest != null) {
      cache.delete(oldest);
    }
  }
  cache.set(key, path);
  return path;
}

function shapeKey(params: ShapePathParams): string {
  return `${params.width}|${params.height}`;
}

export function getCachedShapePath(
  provider: ShapeProvider,
  params: ShapePathParams,
): string {
  return getCachedPath(provider, `fill|${shapeKey(params)}`, () => (
    provider.getShapePath(params)
  ));
}

export function getCachedStrokePath(
  provider: ShapeProvider,
  params: StrokePathParams,
): string {
  return getCachedPath(
    provider,
    `stroke|${shapeKey(params)}|${params.strokeWidth}`,
    () => provider.getStrokePath(params),
  );
}

export class RoundedRectangleShapeProvider implements ShapeProvider {
  constructor(
    readonly cornerRadius: CornerRadius = CornerRadius.LARGE,
    readonly smoothing: number = 0.75,
  ) {}

  getShapePath({ width, height }: ShapePathParams): string {
    return generateSmoothRoundedRectPath({
      width,
      height,
      cornerRadius: this.cornerRadius,
      smoothing: this.smoothing,
    });
  }

  getStrokePath({
    width,
    height,
    strokeWidth,
  }: StrokePathParams): string {
    const halfStroke = strokeWidth / 2;
    return generateSmoothRoundedRectPath({
      x: halfStroke,
      y: halfStroke,
      width: Math.max(0, width - strokeWidth),
      height: Math.max(0, height - strokeWidth),
      cornerRadius: Math.max(0, this.cornerRadius - halfStroke),
      smoothing: this.smoothing,
    });
  }

  getCssBorderRadius(): string {
    return getCornerRadiusValue(this.cornerRadius);
  }
}

export class TailShapeProvider implements ShapeProvider {
  constructor(
    readonly direction: ShapeTailDirection = 'right',
    readonly cornerRadius: CornerRadius = CornerRadius.MEDIUM,
    readonly smoothing: number = 0.75,
  ) {}

  getShapePath(params: ShapePathParams): string {
    return generateTailBubblePath(
      params.width,
      params.height,
      this.cornerRadius,
      this.toTailDirection(),
      this.smoothing,
    );
  }

  getStrokePath({
    width,
    height,
    strokeWidth,
  }: StrokePathParams): string {
    const halfStroke = strokeWidth / 2;
    return generateTailBubblePath(
      Math.max(0, width - strokeWidth),
      Math.max(0, height - strokeWidth),
      Math.max(0, this.cornerRadius - halfStroke),
      this.toTailDirection(),
      this.smoothing,
      halfStroke,
      halfStroke,
    );
  }

  private toTailDirection(): TailDirection {
    return this.direction === 'left'
      ? TailDirection.LEFT
      : this.direction === 'right'
        ? TailDirection.RIGHT
        : TailDirection.NONE;
  }
}

export const defaultShapeProvider = new RoundedRectangleShapeProvider();

const tailShapeProviders: Record<ShapeTailDirection, TailShapeProvider> = {
  none: new TailShapeProvider('none'),
  left: new TailShapeProvider('left'),
  right: new TailShapeProvider('right'),
};

export function getTailShapeProvider(
  direction: ShapeTailDirection,
): TailShapeProvider {
  return tailShapeProviders[direction];
}
