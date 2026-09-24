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
  getProgressRingArcStyle,
  getProgressRingCircumference,
  getProgressRingDashOffset,
  getProgressRingRadius,
} from './ProgressRingGeometry';
import {
  PROGRESS_RING_SIZE_PX,
  PROGRESS_RING_START_ANGLE_DEGREES,
  PROGRESS_RING_STROKE_WIDTH,
} from './ProgressRingMetrics';
import { ProgressRingSize } from '../ProgressRing.types';
import type {
  ProgressRingClassNameOptions,
  ProgressRingGeometry,
  ProgressRingProgressCircleStyleOptions,
} from './ProgressRingLayout.types';

export type {
  ProgressRingClassNameOptions,
  ProgressRingGeometry,
  ProgressRingProgressCircleStyleOptions,
} from './ProgressRingLayout.types';

export function getProgressRingClampedProgress(progress: number): number {
  return clampIndicatorValue(progress, 0, 1);
}

export function getProgressRingGeometry(size: ProgressRingSize): ProgressRingGeometry {
  const sizePx = PROGRESS_RING_SIZE_PX[size];
  const radius = getProgressRingRadius(sizePx, PROGRESS_RING_STROKE_WIDTH);
  return {
    sizePx,
    center: sizePx / 2,
    radius,
    circumference: getProgressRingCircumference(radius),
  };
}

export function getProgressRingProgressCircleStyle({
  circumference,
  progress,
  animated,
}: ProgressRingProgressCircleStyleOptions): CSSProperties {
  return getProgressRingArcStyle(
    circumference,
    getProgressRingDashOffset(circumference, progress),
    animated,
  );
}

export function getProgressRingPercentage(progress: number): number {
  return getIndicatorPercentage(progress, 0, 1);
}

export function getProgressRingAriaLabel(
  percentageValue: number,
  ariaLabel?: string,
): string {
  return getIndicatorAriaLabel(percentageValue, ariaLabel);
}

export function getProgressRingClassName({
  baseClassName,
  ringClassName,
  sizeClassName,
  className,
}: ProgressRingClassNameOptions): string {
  return [baseClassName, ringClassName, sizeClassName, className]
    .filter(Boolean)
    .join(' ');
}

export function getProgressRingArcTransform(center: number): string {
  return `rotate(${PROGRESS_RING_START_ANGLE_DEGREES} ${center} ${center})`;
}
