/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SliderBarSize, SliderBarState } from '../SliderBar.types';
import {
  SLIDER_BAR_FOCUSED_HEIGHT,
  SLIDER_BAR_IDLE_HEIGHT,
  SLIDER_BAR_THIN_HEIGHT,
} from './SliderBarMetrics';

/**
 * Returns the cross-axis height in px for state + size + expansion config.
 */
export function getSliderBarCrossAxisHeight(
  state: SliderBarState,
  size: SliderBarSize,
  shouldExpandOnFocus: boolean,
): number {
  if (size === SliderBarSize.THIN) {
    return SLIDER_BAR_THIN_HEIGHT;
  }
  if (state === SliderBarState.FOCUSED && shouldExpandOnFocus) {
    return SLIDER_BAR_FOCUSED_HEIGHT;
  }
  return SLIDER_BAR_IDLE_HEIGHT;
}

/**
 * Calculate the percentage of progress [0, 1] for the fill bar.
 * If min === max, returns 1.
 */
export function getSliderBarProgressScale(
  value: number,
  min: number,
  max: number,
): number {
  if (min === max) {
    return 1;
  }
  return (value - min) / (max - min);
}

export function clampSliderBarValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
