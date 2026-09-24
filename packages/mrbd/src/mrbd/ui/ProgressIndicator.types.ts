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
 * ProgressIndicator size variant.
 */
export const ProgressIndicatorSize = {
  /** Standard size with visible height suitable for most use cases. */
  DEFAULT: 'default',
  /** Thin size with minimal height for compact layouts. */
  THIN: 'thin',
} as const;
export type ProgressIndicatorSize =
  (typeof ProgressIndicatorSize)[keyof typeof ProgressIndicatorSize];

export interface ProgressIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /** The minimum value of the progress bar. Default: 0 */
  minimumValue?: number;

  /** The maximum value of the progress bar. Default: 1 */
  maximumValue?: number;

  /** The current value, clamped to [minimumValue, maximumValue]. Default: 0 */
  value?: number;

  /** Size variant. Default: DEFAULT */
  size?: ProgressIndicatorSize;

  /** Whether the indicator is active. Default: true */
  isActive?: boolean;

  /**
   * Whether value changes should animate with a smooth transition.
   * Default: false; value and active-state changes are unanimated unless opted in.
   */
  animated?: boolean;

  /** Whether to announce value updates for accessibility. Default: true */
  announceUpdatesForAccessibility?: boolean;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;

  /** Accessible label for screen readers */
  'aria-label'?: string;
}
