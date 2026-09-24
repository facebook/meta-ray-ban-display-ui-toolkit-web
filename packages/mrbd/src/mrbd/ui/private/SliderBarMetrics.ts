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

/** Height in px for IDLE state with DEFAULT size. */
export const SLIDER_BAR_IDLE_HEIGHT = 12;

/** Height in px for FOCUSED state with DEFAULT size. */
export const SLIDER_BAR_FOCUSED_HEIGHT = 16;

/** Height in px for THIN size in both states. */
export const SLIDER_BAR_THIN_HEIGHT = 6;

/**
 * Default increment percentage per key press.
 */
export const SLIDER_BAR_DEFAULT_INCREMENT_PERCENTAGE = 0.1;

const SLIDER_BAR_VALUE_SPRING_TIMING = getSpringTiming(
  SpringConfigs.PROGRESS_VALUE,
  1,
  DEFAULT_MOTION_FRAME_TIME_MS,
);

/** Sampled duration of the slider value spring. */
export const SLIDER_BAR_VALUE_TRANSITION_DURATION_MS =
  SLIDER_BAR_VALUE_SPRING_TIMING.settleMs;

/** Sampled timing function for the slider value spring. */
export const SLIDER_BAR_VALUE_TRANSITION_EASING = createLinearTimingFunction(
  SLIDER_BAR_VALUE_SPRING_TIMING.samples,
);
