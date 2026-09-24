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
  ZOOM_INDICATOR_CONTROL_WIDTH,
  ZOOM_INDICATOR_SLIDER_MIN_HEIGHT,
  ZOOM_INDICATOR_SLIDER_ICON_GAP,
  ZOOM_INDICATOR_VERTICAL_PADDING,
} from './ZoomIndicatorMetrics';

export function hasZoomIndicatorIcon(icon: unknown): boolean {
  return icon != null;
}

export function getZoomIndicatorClampedValue(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return clampIndicatorValue(value, minimumValue, maximumValue);
}

export function getZoomIndicatorAccessibilityPercent(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return getIndicatorPercentage(value, minimumValue, maximumValue);
}

export function getZoomIndicatorAriaLabel(
  ariaLabel: string | undefined,
  accessibilityPercent: number,
): string {
  return getIndicatorAriaLabel(accessibilityPercent, ariaLabel);
}

export function getZoomIndicatorContentStyle(hasIcon: boolean): CSSProperties {
  return {
    paddingTop: ZOOM_INDICATOR_VERTICAL_PADDING,
    paddingBottom: ZOOM_INDICATOR_VERTICAL_PADDING,
    gap: hasIcon ? ZOOM_INDICATOR_SLIDER_ICON_GAP : 0,
    width: ZOOM_INDICATOR_CONTROL_WIDTH,
  };
}

export function getZoomIndicatorSliderWrapperStyle(): CSSProperties {
  return {
    flexBasis: ZOOM_INDICATOR_SLIDER_MIN_HEIGHT,
    minHeight: ZOOM_INDICATOR_SLIDER_MIN_HEIGHT,
  };
}

export function getZoomIndicatorContainerStyle(
  style: CSSProperties,
): CSSProperties {
  return {
    ...style,
  };
}

export function getZoomIndicatorClassName(
  baseClassName: string,
  className: string,
): string {
  return `${baseClassName} ${className}`;
}
