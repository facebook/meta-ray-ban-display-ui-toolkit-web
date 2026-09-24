/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  PROGRESS_RING_TRANSITION_DURATION_MS,
  PROGRESS_RING_TRANSITION_EASING,
} from './ProgressRingMetrics';

export function getProgressRingRadius(sizePx: number, strokeWidth: number): number {
  return (sizePx - strokeWidth) / 2;
}

export function getProgressRingCircumference(radius: number): number {
  return 2 * Math.PI * radius;
}

export function getProgressRingDashOffset(circumference: number, progress: number): number {
  return circumference * (1 - progress);
}

export function getProgressRingArcStyle(
  circumference: number,
  dashOffset: number,
  animated: boolean,
): CSSProperties {
  const style: CSSProperties = {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: dashOffset,
  };

  if (animated) {
    style.transition =
      `stroke-dashoffset ${PROGRESS_RING_TRANSITION_DURATION_MS}ms ` +
      PROGRESS_RING_TRANSITION_EASING;
  }

  return style;
}
