/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { IndeterminateLoaderSize } from '../IndeterminateLoader.types';

/** Animation duration: ANIMATION_DURATION_MS. */
export const INDETERMINATE_LOADER_ANIMATION_DURATION_MS = 1667;

export const INDETERMINATE_LOADER_TRIM_OFFSET_DEGREES = -14;
export const INDETERMINATE_LOADER_ROTATION_START_DEGREES = -40;
export const INDETERMINATE_LOADER_ROTATION_END_DEGREES = 105;
export const INDETERMINATE_LOADER_TRIM_END_START = 30;
export const INDETERMINATE_LOADER_TRIM_END_FINAL = 90;
export const INDETERMINATE_LOADER_TRIM_END_TRANSITION = 0.8;
export const INDETERMINATE_LOADER_TRIM_START_HOLD = 0.48;

/** Size dimensions. */
export const INDETERMINATE_LOADER_SIZE_PX: Record<IndeterminateLoaderSize, number> = {
  [IndeterminateLoaderSize.XSMALL]: 24,
  [IndeterminateLoaderSize.SMALL]: 32,
  [IndeterminateLoaderSize.MEDIUM]: 48,
  [IndeterminateLoaderSize.LARGE]: 72,
};

/** Stroke widths. */
export const INDETERMINATE_LOADER_STROKE_WIDTH: Record<IndeterminateLoaderSize, number> = {
  [IndeterminateLoaderSize.XSMALL]: 3,
  [IndeterminateLoaderSize.SMALL]: 4,
  [IndeterminateLoaderSize.MEDIUM]: 6,
  [IndeterminateLoaderSize.LARGE]: 8,
};

/**
 * SVG viewports clip antialiased round stroke caps that land exactly on the
 * viewBox edge, so keep one physical pixel of SVG breathing room to avoid
 * visibly flattening the cap.
 */
export const INDETERMINATE_LOADER_EDGE_PADDING_PX = 1;

/** SVG viewBox size for the internal coordinate system. */
export const INDETERMINATE_LOADER_VIEWBOX_SIZE = 48;

/** Circle radius used by the dash keyframes. */
export const INDETERMINATE_LOADER_CIRCLE_RADIUS = 22;

/** Center of the viewBox. */
export const INDETERMINATE_LOADER_CIRCLE_CENTER = INDETERMINATE_LOADER_VIEWBOX_SIZE / 2;

/**
 * Path length matching the dash keyframes.
 * The SVG radius is stroke-inset per size, so pathLength keeps the dash units
 * aligned to the arc percentages instead of raw circle circumference.
 */
export const INDETERMINATE_LOADER_PATH_LENGTH = 138.2;
