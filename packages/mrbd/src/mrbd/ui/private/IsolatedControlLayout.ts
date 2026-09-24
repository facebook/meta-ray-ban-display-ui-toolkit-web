/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { SliderBarState } from '../SliderBar.types';
import {
  ISOLATED_CONTROL_DEFAULT_INCREMENT_PERCENTAGE,
  ISOLATED_CONTROL_ICON_SLIDER_GAP,
  ISOLATED_CONTROL_MIN_WIDTH_NO_ICON,
  ISOLATED_CONTROL_MIN_WIDTH_WITH_ICON,
  ISOLATED_CONTROL_PADDING_LEFT_NO_ICON,
  ISOLATED_CONTROL_PADDING_LEFT_WITH_ICON,
  ISOLATED_CONTROL_PADDING_RIGHT,
} from './IsolatedControlMetrics';

export interface IsolatedControlNextValueOptions {
  value: number;
  minimumValue: number;
  maximumValue: number;
  incrementPercentage?: number;
  increment: boolean;
}

export function clampIsolatedControlValue(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return Math.min(Math.max(value, minimumValue), maximumValue);
}

export function getIsolatedControlAnnouncementPercent(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  if (minimumValue === maximumValue) {
    return 100;
  }

  return Math.round(((value - minimumValue) / (maximumValue - minimumValue)) * 100);
}

export function getIsolatedControlSliderState(state: State): SliderBarState {
  switch (state) {
    case State.FOCUSED:
    case State.PRESSED:
      return SliderBarState.FOCUSED;
    case State.DEFAULT:
    default:
      return SliderBarState.IDLE;
  }
}

export function getIsolatedControlNextValue({
  value,
  minimumValue,
  maximumValue,
  incrementPercentage = ISOLATED_CONTROL_DEFAULT_INCREMENT_PERCENTAGE,
  increment,
}: IsolatedControlNextValueOptions): number {
  const step = (maximumValue - minimumValue) * incrementPercentage;
  const delta = increment ? step : -step;

  return clampIsolatedControlValue(value + delta, minimumValue, maximumValue);
}

export function getIsolatedControlContentStyle(hasIcon: boolean): CSSProperties {
  return {
    paddingLeft: hasIcon
      ? ISOLATED_CONTROL_PADDING_LEFT_WITH_ICON
      : ISOLATED_CONTROL_PADDING_LEFT_NO_ICON,
    paddingRight: ISOLATED_CONTROL_PADDING_RIGHT,
    gap: hasIcon ? ISOLATED_CONTROL_ICON_SLIDER_GAP : 0,
  };
}

export function getIsolatedControlMinWidth(hasIcon: boolean): number {
  return hasIcon
    ? ISOLATED_CONTROL_MIN_WIDTH_WITH_ICON
    : ISOLATED_CONTROL_MIN_WIDTH_NO_ICON;
}
