/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { HTMLAttributes } from 'react';

export const ScrubberTimestampPosition = {
  BOTTOM: 'bottom',
  TOP: 'top',
} as const;
export type ScrubberTimestampPosition =
  (typeof ScrubberTimestampPosition)[keyof typeof ScrubberTimestampPosition];

export interface ScrubberProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  | 'aria-valuemax'
  | 'aria-valuemin'
  | 'aria-valuenow'
  | 'aria-valuetext'
  | 'onChange'
  | 'role'
> {
  /** Current media position on a 0..100 scale. */
  value: number;

  /** Total media duration in seconds. Zero hides the timestamp row. */
  durationSeconds?: number;

  /** Shows the current time or percentage above the handle while focused. */
  showTooltip?: boolean;

  /** Prevents the interaction scrim from being rendered. */
  hideScrim?: boolean;

  /** Places the timestamp row above or below the track. */
  timestampPosition?: ScrubberTimestampPosition;

  /** Called for every keyboard or pointer value update. */
  onValueChange?: (value: number) => void;

  /** Called for each committed keyboard step and once when pointer seeking ends. */
  onValueChanged?: (value: number) => void;

  /** Whether value interaction is disabled. */
  disabled?: boolean;
}
