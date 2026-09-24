/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  clampIndicatorValue,
  getIndicatorAriaLabel,
  getIndicatorPercentage,
} from './IndicatorValue';
import { progressIndicatorSizeToSliderBarSize } from './ProgressIndicatorAdapters';
import { ProgressIndicatorSize } from '../ProgressIndicator.types';
import { SliderBarSize, SliderBarState } from '../SliderBar.types';

export function getProgressIndicatorClampedValue(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return clampIndicatorValue(value, minimumValue, maximumValue);
}

export function getProgressIndicatorAccessibilityPercent(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return getIndicatorPercentage(value, minimumValue, maximumValue);
}

export function getProgressIndicatorSliderState(isActive: boolean): SliderBarState {
  return isActive ? SliderBarState.FOCUSED : SliderBarState.IDLE;
}

export function getProgressIndicatorSliderSize(
  size: ProgressIndicatorSize,
): SliderBarSize {
  return progressIndicatorSizeToSliderBarSize(size);
}

export function getProgressIndicatorAriaLabel(
  ariaLabel: string | undefined,
  accessibilityPercent: number,
): string {
  return getIndicatorAriaLabel(accessibilityPercent, ariaLabel);
}

export function getProgressIndicatorContainerStyle(
  style: CSSProperties,
): CSSProperties {
  return {
    ...style,
  };
}

export function getProgressIndicatorClassName(
  baseClassName: string,
  className: string,
): string {
  return `${baseClassName} ${className}`;
}
