/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const SHIMMER_ANIMATION_DURATION_MS = 1500;
export const SHIMMER_DEFAULT_BASE_ALPHA = 0.75;
export const SHIMMER_DEFAULT_HIGHLIGHT_ALPHA = 1;
export const SHIMMER_DEFAULT_TILT_DEGREES = 20;
export const SHIMMER_DEFAULT_INTENSITY = 0;
export const SHIMMER_DEFAULT_DROPOFF = 0.5;
export const SHIMMER_DEFAULT_TILT_TANGENT = Math.tan(
  (SHIMMER_DEFAULT_TILT_DEGREES * Math.PI) / 180,
);

export const SHIMMER_MASK_STOP_0 =
  Math.max((1 - SHIMMER_DEFAULT_INTENSITY - SHIMMER_DEFAULT_DROPOFF) / 2, 0) * 100;
export const SHIMMER_MASK_STOP_1 =
  Math.max((1 - SHIMMER_DEFAULT_INTENSITY - 0.001) / 2, 0) * 100;
export const SHIMMER_MASK_STOP_2 =
  Math.min((1 + SHIMMER_DEFAULT_INTENSITY + 0.001) / 2, 1) * 100;
export const SHIMMER_MASK_STOP_3 =
  Math.min((1 + SHIMMER_DEFAULT_INTENSITY + SHIMMER_DEFAULT_DROPOFF) / 2, 1) * 100;

export const SHIMMER_STATIC_PROGRESS_MIN = 0;
export const SHIMMER_STATIC_PROGRESS_MAX = 1;

export const SHIMMER_MASK_SIZE_PERCENT = 100;

export function getShimmerTranslateWidth(width: number, height: number): number {
  return width + SHIMMER_DEFAULT_TILT_TANGENT * height;
}

export function getShimmerMaskOffset(
  width: number,
  height: number,
  progress: number,
): number {
  const translateWidth = getShimmerTranslateWidth(width, height);
  return -translateWidth + 2 * translateWidth * progress;
}
