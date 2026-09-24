/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SwipeDirection } from '../SwipeIndicator.types';

export interface SwipeDirectionConfig {
  rotationDegrees: number;
  nudgeOffset: number;
}

/** Scrim alpha (35% opacity). */
export const SWIPE_INDICATOR_SCRIM_ALPHA = 0.35;

/** Nudge offset in px. */
export const SWIPE_INDICATOR_NUDGE_OFFSET = 5;

/** Delay before repeated nudges, in ms. */
export const SWIPE_INDICATOR_NUDGE_INTERVAL_MS = 2000;

/** Return animation delay, in ms. */
export const SWIPE_INDICATOR_NUDGE_RETURN_MS = 500;

/** CSS approximation of the nudge spring duration. */
export const SWIPE_INDICATOR_SPRING_DURATION_MS = 350;

/** CSS approximation of the nudge spring easing. */
export const SWIPE_INDICATOR_SPRING_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

/** Per-direction configuration keyed by swipe direction. */
export const SWIPE_DIRECTION_CONFIG: Record<SwipeDirection, SwipeDirectionConfig> = {
  [SwipeDirection.UP]: { rotationDegrees: 0, nudgeOffset: -SWIPE_INDICATOR_NUDGE_OFFSET },
  [SwipeDirection.DOWN]: { rotationDegrees: 180, nudgeOffset: SWIPE_INDICATOR_NUDGE_OFFSET },
};
