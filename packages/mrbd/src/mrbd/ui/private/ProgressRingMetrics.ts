/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ProgressRingSize } from '../ProgressRing.types';
import {
  SpringConfigs,
  DEFAULT_MOTION_FRAME_TIME_MS,
  createLinearTimingFunction,
  getSpringTiming,
} from '@wearables-ui-toolkit/foundation/motion/Animations';

/** Ring diameter in px for each size variant. */
export const PROGRESS_RING_SIZE_PX: Record<ProgressRingSize, number> = {
  [ProgressRingSize.SMALL]: 48,
  [ProgressRingSize.LARGE]: 100,
};

/** Stroke width in px. */
export const PROGRESS_RING_STROKE_WIDTH = 4;

/** Start angle in degrees (top of the ring). */
export const PROGRESS_RING_START_ANGLE_DEGREES = -90;

/** Sweep angle in degrees (full circle). */
export const PROGRESS_RING_SWEEP_ANGLE_DEGREES = 360;

const PROGRESS_RING_SPRING_TIMING = getSpringTiming(
  SpringConfigs.PROGRESS_VALUE,
  1,
  DEFAULT_MOTION_FRAME_TIME_MS,
);

/** Sampled duration of the progress-value spring. */
export const PROGRESS_RING_TRANSITION_DURATION_MS =
  PROGRESS_RING_SPRING_TIMING.settleMs;

/** Sampled timing function for the progress-value spring. */
export const PROGRESS_RING_TRANSITION_EASING = createLinearTimingFunction(
  PROGRESS_RING_SPRING_TIMING.samples,
);
