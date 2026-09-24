/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';

export interface CircularProgressBarGeometry {
  center: number;
  radius: number;
  totalSweep: number;
  trackPath: string;
  trackLength: number;
}

export interface CircularProgressBarGeometryOptions {
  size: number;
  strokeWidthPx: number;
  startAngleDegrees: number;
  endAngleDegrees: number;
}

export interface CircularProgressBarProgressStyleOptions {
  progress: number;
  trackLength: number;
  animated: boolean;
}

export interface CircularProgressBarContainerStyleOptions {
  /** Explicit pixel size. Omitted means fill the parent square. */
  size?: number;
  style: CSSProperties;
}
