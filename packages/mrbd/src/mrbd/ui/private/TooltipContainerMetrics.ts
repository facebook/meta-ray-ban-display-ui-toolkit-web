/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/** Geometry constants for the TooltipContainer. */
export const TOOLTIP_CONTAINER_SHADOW_BLUR_RADIUS = 8;
export const TOOLTIP_CONTAINER_MIN_WIDTH = 36;
export const TOOLTIP_CONTAINER_TAIL_HEIGHT_RATIO = 0.35;
export const TOOLTIP_CONTAINER_TAIL_WIDTH_RATIO = 1.5;
export const TOOLTIP_CONTAINER_BASE_LINE_HEIGHT = 28;
export const TOOLTIP_CONTAINER_TAIL_EDGE_SPACING = 4;
export const TOOLTIP_CONTAINER_TAIL_TIP_ROUNDING = 4;
export const TOOLTIP_CONTAINER_TAIL_BASE_ROUNDING = 16;
// This is a clamp sentinel rather than a design radius. It lets the path
// generator reduce the actual radius to half the available extent.
export const TOOLTIP_CONTAINER_CORNER_RADIUS = 9999;
export const TOOLTIP_CONTAINER_SMOOTHING = 0.75;
