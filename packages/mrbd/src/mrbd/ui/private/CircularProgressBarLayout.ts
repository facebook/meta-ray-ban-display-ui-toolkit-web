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
  getIndicatorPercentage,
} from './IndicatorValue';
import {
  describeCircularProgressArc,
  getCircularProgressArcStyle,
  getCircularProgressTrackLength,
} from './CircularProgressBarGeometry';
import type {
  CircularProgressBarContainerStyleOptions,
  CircularProgressBarGeometry,
  CircularProgressBarGeometryOptions,
  CircularProgressBarProgressStyleOptions,
} from './CircularProgressBarLayout.types';

export type {
  CircularProgressBarContainerStyleOptions,
  CircularProgressBarGeometry,
  CircularProgressBarGeometryOptions,
  CircularProgressBarProgressStyleOptions,
} from './CircularProgressBarLayout.types';

export function getCircularProgressBarClampedProgress(progress: number): number {
  return clampIndicatorValue(progress, 0, 1);
}

export function getCircularProgressBarGeometry({
  size,
  strokeWidthPx,
  startAngleDegrees,
  endAngleDegrees,
}: CircularProgressBarGeometryOptions): CircularProgressBarGeometry {
  const center = size / 2;
  const radius = (size - strokeWidthPx) / 2;
  const totalSweep = endAngleDegrees - startAngleDegrees;
  return {
    center,
    radius,
    totalSweep,
    trackPath: describeCircularProgressArc(
      center,
      center,
      radius,
      startAngleDegrees,
      endAngleDegrees,
    ),
    trackLength: getCircularProgressTrackLength(radius, totalSweep),
  };
}

export function getCircularProgressBarProgressStyle({
  progress,
  trackLength,
  animated,
}: CircularProgressBarProgressStyleOptions): CSSProperties {
  return getCircularProgressArcStyle(progress, trackLength, animated);
}

export function getCircularProgressBarPercentage(progress: number): number {
  return getIndicatorPercentage(progress, 0, 1);
}

export function getCircularProgressBarAriaLabel(percentageValue: number): string {
  return `${percentageValue}%`;
}

export function getCircularProgressBarContainerStyle({
  size,
  style,
}: CircularProgressBarContainerStyleOptions): CSSProperties {
  return { width: size ?? '100%', height: size ?? '100%', ...style };
}

export function getCircularProgressBarClassName(
  baseClassName: string,
  className: string,
): string {
  return [baseClassName, className].filter(Boolean).join(' ');
}
