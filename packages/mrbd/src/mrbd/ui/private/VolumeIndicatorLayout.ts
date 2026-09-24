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
import {
  VOLUME_INDICATOR_CONTROL_HEIGHT,
  VOLUME_INDICATOR_HORIZONTAL_PADDING,
  VOLUME_INDICATOR_ICON_SLIDER_GAP,
  VOLUME_INDICATOR_SLIDER_MIN_WIDTH,
} from './VolumeIndicatorMetrics';

export function hasVolumeIndicatorIcon(icon: unknown): boolean {
  return icon != null;
}

export function getVolumeIndicatorClampedValue(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return clampIndicatorValue(value, minimumValue, maximumValue);
}

export function getVolumeIndicatorAccessibilityPercent(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return getIndicatorPercentage(value, minimumValue, maximumValue);
}

export function getVolumeIndicatorAriaLabel(
  ariaLabel: string | undefined,
  accessibilityPercent: number,
): string {
  return getIndicatorAriaLabel(accessibilityPercent, ariaLabel, 'Volume');
}

export function getVolumeIndicatorContentStyle(hasIcon: boolean): CSSProperties {
  return {
    paddingLeft: VOLUME_INDICATOR_HORIZONTAL_PADDING,
    paddingRight: VOLUME_INDICATOR_HORIZONTAL_PADDING,
    gap: hasIcon ? VOLUME_INDICATOR_ICON_SLIDER_GAP : 0,
    height: VOLUME_INDICATOR_CONTROL_HEIGHT,
  };
}

export function getVolumeIndicatorSliderWrapperStyle(): CSSProperties {
  return {
    minWidth: VOLUME_INDICATOR_SLIDER_MIN_WIDTH,
  };
}

export function getVolumeIndicatorContainerStyle(
  style: CSSProperties,
): CSSProperties {
  return {
    ...style,
  };
}

export function getVolumeIndicatorClassName(
  baseClassName: string,
  className: string,
): string {
  return `${baseClassName} ${className}`;
}
