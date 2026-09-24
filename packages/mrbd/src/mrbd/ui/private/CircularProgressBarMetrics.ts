/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  SpringConfigs,
  DEFAULT_MOTION_FRAME_TIME_MS,
  createLinearTimingFunction,
  getSpringTiming,
} from '@wearables-ui-toolkit/foundation/motion/Animations';

/** Start angle: 90 + 50 = 140 degrees. */
export const CIRCULAR_PROGRESS_DEFAULT_START_ANGLE_DEGREES = 140;

/** End angle: 90 + 310 = 400 degrees. */
export const CIRCULAR_PROGRESS_DEFAULT_END_ANGLE_DEGREES = 400;

/** Stroke width: 6px. */
export const CIRCULAR_PROGRESS_DEFAULT_STROKE_WIDTH = 6;

/** Track alpha: 0x33. */
export const CIRCULAR_PROGRESS_BACKGROUND_ALPHA = 0x33;

/** Default web demo size used when layout does not constrain the view. */
export const CIRCULAR_PROGRESS_DEFAULT_SIZE = 100;

const CIRCULAR_PROGRESS_SPRING_TIMING = getSpringTiming(
  SpringConfigs.PROGRESS_VALUE,
  1,
  DEFAULT_MOTION_FRAME_TIME_MS,
);

/** Sampled duration of the spring (stiffness 150, damping 18, mass 1). */
export const CIRCULAR_PROGRESS_TRANSITION_DURATION_MS =
  CIRCULAR_PROGRESS_SPRING_TIMING.settleMs;

/** Sampled timing function for the spring (stiffness 150, damping 18, mass 1). */
export const CIRCULAR_PROGRESS_TRANSITION_EASING = createLinearTimingFunction(
  CIRCULAR_PROGRESS_SPRING_TIMING.samples,
);
