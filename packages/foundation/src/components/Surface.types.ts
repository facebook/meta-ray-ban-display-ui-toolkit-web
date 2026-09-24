/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  ReactNode,
} from 'react';
import type { InteractableBaseProps } from '../base/InteractableBase.types';
import type { ContentScaleForStateFn } from '../base/Interactions';
import { CornerRadius } from '../theme/CornerRadius';

/**
 * Semantic surface corner radius. Callers pick a named case (XXSMALL..XLARGE);
 * the component resolves it through the shared corner-radius scale. Bare numbers are
 * intentionally NOT assignable — this keeps the API strict (no per-instance raw
 * radii). The fixed set exists because inner shadow assets are pre-rendered per
 * case.
 */
export const SurfaceCornerRadius = {
  XXSMALL: 'xxsmall',
  XSMALL: 'xsmall',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge',
} as const;
export type SurfaceCornerRadius = (typeof SurfaceCornerRadius)[keyof typeof SurfaceCornerRadius];

/**
 * Resolution of each {@link SurfaceCornerRadius} case to the shared corner-radius
 * scale.
 */
const SURFACE_CORNER_RADIUS_TOKEN: Record<SurfaceCornerRadius, CornerRadius> = {
  [SurfaceCornerRadius.XXSMALL]: CornerRadius.XXSMALL,
  [SurfaceCornerRadius.XSMALL]: CornerRadius.XSMALL,
  [SurfaceCornerRadius.SMALL]: CornerRadius.SMALL,
  [SurfaceCornerRadius.MEDIUM]: CornerRadius.MEDIUM,
  [SurfaceCornerRadius.LARGE]: CornerRadius.LARGE,
  [SurfaceCornerRadius.XLARGE]: CornerRadius.XLARGE,
};

export const SURFACE_CORNER_RADIUS_PX: Record<SurfaceCornerRadius, number> =
  SURFACE_CORNER_RADIUS_TOKEN;

/** Resolve a semantic {@link SurfaceCornerRadius} to its Meta Ray-Ban Display pixel value. */
export function getSurfaceCornerRadiusPx(cornerRadius: SurfaceCornerRadius): number {
  return SURFACE_CORNER_RADIUS_PX[cornerRadius];
}

export interface SurfaceProps extends Omit<InteractableBaseProps, 'children'> {
  /** Surface content. */
  children?: ReactNode;

  /** The corner radius of the surface. */
  cornerRadius?: SurfaceCornerRadius;

  /** Whether to draw the background of the surface. */
  drawBackground?: boolean;

  /**
   * Explicit width of the surface, letting callers set dimensions directly
   * without relying on a layout container.
   */
  width?: number | string;

  /**
   * Explicit height of the surface, letting callers set dimensions directly
   * without relying on a layout container.
   */
  height?: number | string;

  /** Overrides the app platform's content-scale policy. */
  contentScaleForStateFn?: ContentScaleForStateFn;

  /** Additional inline styles. */
  style?: CSSProperties;

  /** Additional CSS class. */
  className?: string;
}
