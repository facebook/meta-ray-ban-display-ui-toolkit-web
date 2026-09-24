/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Shared support for the typed container-material layer classes.
 *
 * `LayerValue<T>` lets a layer's config field be either a constant or a function
 * of the draw params. Layers mix constant config (a fixed color) with providers
 * (e.g. `pointProvider`, animated colors driven by `setState`): the constant case
 * covers static materials, and the provider case covers materials whose values
 * are resolved per frame as colors or positions interpolate across states.
 */

import type { CanvasLayerDrawParams } from '../ContainerMaterial.types';
import { getInsetAdjustedShaderHeight } from '../MaterialLayerGeometry';

export type LayerValue<T> = T | ((params: CanvasLayerDrawParams) => T);

export function resolveLayerValue<T>(
  value: LayerValue<T>,
  params: CanvasLayerDrawParams,
): T {
  return typeof value === 'function'
    ? (value as (params: CanvasLayerDrawParams) => T)(params)
    : value;
}

/** Normalized size/placement multipliers for an elliptical radial paint. */
export interface RadialMultiplier {
  /** Horizontal radius as a fraction of width. */
  x: number;
  /** Vertical radius as a fraction of height. */
  y: number;
}

export interface RadialGeometry {
  cx: number;
  cy: number;
  /** The y radius (before x scaling); the gradient is drawn in scaled space. */
  radius: number;
  scaleX: number;
}

/**
 * Compute the elliptical radial geometry shared by the radial-gradient fill and
 * the radial-gradient glow stroke: scale to an ellipse, translate by placement +
 * partial-focus offset. When `useInsetAdjustedHeight` is set the radius shrinks
 * by the material insets while the x-scale keeps using the full height, using the
 * inset-adjusted shader height.
 */
export function computeEllipticalRadialGeometry(
  params: CanvasLayerDrawParams,
  sizeMultiplier: RadialMultiplier,
  placementMultiplier: RadialMultiplier,
  useInsetAdjustedHeight: boolean,
  // Magnitude of the partial-focus translation. The radial FILL uses the full
  // offset (1); the radial glow STROKE halves it (0.5).
  partialFocusScale: number = 1,
): RadialGeometry {
  const { width, height, partialFocusPosition, shapeContext } = params;
  const rx = sizeMultiplier.x * width;
  const fullRy = sizeMultiplier.y * height;
  const effectiveHeight = useInsetAdjustedHeight
    ? getInsetAdjustedShaderHeight(height, shapeContext)
    : height;
  const radius = sizeMultiplier.y * effectiveHeight;
  const scaleX = fullRy > 0 ? rx / fullRy : 1;
  const cx =
    (placementMultiplier.x + (partialFocusPosition?.x ?? 0) * partialFocusScale) * width;
  const cy =
    (placementMultiplier.y + (partialFocusPosition?.y ?? 0) * partialFocusScale) * height;
  return { cx, cy, radius, scaleX };
}
