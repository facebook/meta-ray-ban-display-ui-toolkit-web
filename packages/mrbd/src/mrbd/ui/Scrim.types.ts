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
 * Scrim position enum.
 */
export const ScrimPosition = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
  FULL: 'full',
} as const;
export type ScrimPosition =
  (typeof ScrimPosition)[keyof typeof ScrimPosition];

export interface ScrimProps extends HTMLAttributes<HTMLDivElement> {
  /** Position of the scrim gradient */
  position?: ScrimPosition;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;
}
