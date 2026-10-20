/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Larger text grows more slowly to preserve the typography hierarchy.
const SP_SIZES = [8, 10, 12, 14, 18, 20, 24, 30, 100] as const;
const SCALE_CURVES = [
  {scale: 1.15, sizes: [9.2, 11.5, 13.8, 16.4, 19.8, 21.8, 25.2, 30, 100]},
  {scale: 1.3, sizes: [10.4, 13, 15.6, 18.8, 21.6, 23.6, 26.4, 30, 100]},
  {scale: 1.5, sizes: [12, 15, 18, 22, 24, 26, 28, 30, 100]},
  {scale: 1.8, sizes: [14.4, 18, 21.6, 24.4, 27.6, 30.8, 32.8, 34.8, 100]},
  {scale: 2, sizes: [16, 20, 24, 26, 30, 34, 36, 38, 100]},
] as const;

function interpolateSize(size: number, values: readonly number[]): number {
  const sign = Math.sign(size);
  const absolute = Math.abs(size);
  for (let index = 0; index < SP_SIZES.length; index += 1) {
    const upper = SP_SIZES[index];
    if (absolute === upper) return sign * values[index];
    if (absolute < upper) {
      const lower = index === 0 ? 0 : SP_SIZES[index - 1];
      const lowerValue = index === 0 ? 0 : values[index - 1];
      const progress = (absolute - lower) / (upper - lower);
      return sign * (lowerValue + progress * (values[index] - lowerValue));
    }
  }
  return size * values[values.length - 1] / SP_SIZES[SP_SIZES.length - 1];
}

/** Convert a scalable text dimension while preserving the size hierarchy. */
export function convertSpToDp(size: number, fontScale: number): number {
  if (!Number.isFinite(size) || !Number.isFinite(fontScale) || fontScale <= 0) {
    throw new RangeError('Text size and scale must be finite, with a positive scale.');
  }
  if (fontScale < 1.13) return size * fontScale;
  const nearestCurve = SCALE_CURVES.find(curve => Math.abs(curve.scale - fontScale) <= 0.0001);
  if (nearestCurve != null) return interpolateSize(size, nearestCurve.sizes);
  const key = Math.trunc(Math.fround(Math.fround(fontScale) * 100));
  const exact = SCALE_CURVES.find(curve => Math.round(curve.scale * 100) === key);
  if (exact != null) return interpolateSize(size, exact.sizes);
  const upperIndex = SCALE_CURVES.findIndex(curve => curve.scale * 100 > key);
  if (upperIndex <= 0) return size * fontScale;
  const lower = SCALE_CURVES[upperIndex - 1];
  const upper = SCALE_CURVES[upperIndex];
  const progress = (fontScale - lower.scale) / (upper.scale - lower.scale);
  const lowerSize = interpolateSize(size, lower.sizes);
  return lowerSize + progress * (interpolateSize(size, upper.sizes) - lowerSize);
}

/** CSS values for shared font sizes; line-box policy remains owned by text appearances. */
export function getScaledTextSizeProperties(fontScale: number): Record<string, string> {
  if (fontScale === 1) return {};
  const properties: Record<string, string> = {};
  for (const size of [18, 22, 24, 28, 32, 36, 40, 64, 80]) {
    properties[`--uit-scaled-font-size-${size}`] = `${getScaledCssTextSize(size, fontScale)}px`;
  }
  return properties;
}

/** CSS dimension that compensates for a host's linear text-size multiplication. */
export function getScaledCssTextSize(size: number, fontScale: number): number {
  return Math.round(convertSpToDp(size, fontScale)) / fontScale;
}
