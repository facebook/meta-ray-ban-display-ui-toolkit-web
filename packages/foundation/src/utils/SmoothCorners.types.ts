/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Parameters for generating a smooth rounded rectangle path.
 */
export interface SmoothRoundedRectParams {
  /** Left coordinate of the rectangle in px. */
  x?: number;
  /** Top coordinate of the rectangle in px. */
  y?: number;
  /** Width of the rectangle in px */
  width: number;
  /** Height of the rectangle in px */
  height: number;
  /**
   * Corner radius in px. Clamped to half the shortest side.
   * Clamped to `min(cornerRadius, min(width, height) / 2)`
   */
  cornerRadius: number;
  /**
   * Smoothing factor (0.0 to 1.0). Controls how far the bezier transition
   * extends beyond the standard circular arc endpoint along each edge.
   *   0.0 = standard circular arc (identical to CSS border-radius)
   *   0.75 = the toolkit-wide standard
   *   1.0 = maximum smoothing
   *
   * Default: 0.75 (the toolkit's corner-rounding default)
   */
  smoothing?: number;
}

export enum TailDirection {
  NONE = 'none',
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * Vertex definition for rounded polygon paths.
 *
 * Each vertex has its own rounding radius.
 */
export interface RoundedPolygonVertex {
  x: number;
  y: number;
  r: number;
}
