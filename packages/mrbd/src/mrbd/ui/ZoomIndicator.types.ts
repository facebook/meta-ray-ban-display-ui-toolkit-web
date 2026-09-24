/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { HTMLAttributes } from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';

export interface ZoomIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Icon displayed at the bottom. Defaults to the circle-handle glyph;
   * set to `null` to hide the icon area.
   */
  icon?: IconSource | null;

  /** The minimum value of the slider. Default: 0 */
  minimumValue?: number;

  /** The maximum value of the slider. Default: 1 */
  maximumValue?: number;

  /** The current value, clamped to [minimumValue, maximumValue]. */
  value: number;

  /**
   * Whether value changes should animate with a smooth transition.
   * Default: false.
   */
  animated?: boolean;

  /**
   * Whether value changes are announced to screen readers via a live region.
   * When enabled, each value change announces the rounded percentage (e.g. "42%").
   * @default false
   */
  announceUpdatesForAccessibility?: boolean;

  /** ID reference for additional progressbar description text. */
  'aria-describedby'?: string;

  /** ID reference for external progressbar label text. */
  'aria-labelledby'?: string;
}
