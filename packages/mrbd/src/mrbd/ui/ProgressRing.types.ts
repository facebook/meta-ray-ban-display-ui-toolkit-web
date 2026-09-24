/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  HTMLAttributes,
} from 'react';

/**
 * Available sizes for the ProgressRing.
 */
export const ProgressRingSize = {
  SMALL: 'small',
  LARGE: 'large',
} as const;
export type ProgressRingSize = (typeof ProgressRingSize)[keyof typeof ProgressRingSize];

/**
 * ProgressRing forwards its ref to the role="progressbar" element.
 */
export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Progress value, clamped to 0.0-1.0 range.
   * @default 0
   */
  progress?: number;

  /**
   * Size variant of the progress ring.
   * @default ProgressRingSize.SMALL
   */
  size?: ProgressRingSize;

  /**
   * Whether progress changes should animate.
   * @default false
   */
  animated?: boolean;

  /**
   * Whether progress changes are announced to screen readers via a live region.
   * When enabled, each progress change announces the rounded percentage (e.g. "42%").
   * @default false
   */
  announceUpdatesForAccessibility?: boolean;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;

  /** Accessible label for screen readers — appended after the percentage. */
  'aria-label'?: string;
}
