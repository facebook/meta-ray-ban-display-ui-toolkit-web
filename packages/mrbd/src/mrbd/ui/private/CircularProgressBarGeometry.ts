/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  CIRCULAR_PROGRESS_TRANSITION_DURATION_MS,
  CIRCULAR_PROGRESS_TRANSITION_EASING,
} from './CircularProgressBarMetrics';

export interface ArcPoint {
  x: number;
  y: number;
}

/**
 * Converts a canvas arc polar coordinates to an SVG point.
 * Angles are in degrees, 0 = right, clockwise.
 */
export function circularProgressPolarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleDegrees: number,
): ArcPoint {
  const angleRadians = (angleDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians),
  };
}

/**
 * Creates an SVG arc path drawn clockwise.
 */
export function describeCircularProgressArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = circularProgressPolarToCartesian(centerX, centerY, radius, startAngle);
  const end = circularProgressPolarToCartesian(centerX, centerY, radius, endAngle);
  const sweepAngle = endAngle - startAngle;
  const largeArcFlag = sweepAngle > 180 ? 1 : 0;

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
  ].join(' ');
}

export function getCircularProgressTrackLength(radius: number, sweepAngle: number): number {
  const angleRad = (Math.abs(sweepAngle) * Math.PI) / 180;
  return radius * angleRad;
}

export function getCircularProgressArcStyle(
  progress: number,
  trackLength: number,
  animated: boolean,
): CSSProperties {
  const style: CSSProperties = {
    strokeDasharray: `${trackLength} ${trackLength}`,
    strokeDashoffset: trackLength * (1 - progress),
  };

  if (animated) {
    style.transition =
      `stroke-dashoffset ${CIRCULAR_PROGRESS_TRANSITION_DURATION_MS}ms ` +
      CIRCULAR_PROGRESS_TRANSITION_EASING;
  }

  return style;
}
