/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface ProgressRingGeometry {
  sizePx: number;
  center: number;
  radius: number;
  circumference: number;
}

export interface ProgressRingProgressCircleStyleOptions {
  circumference: number;
  progress: number;
  animated: boolean;
}

export interface ProgressRingClassNameOptions {
  baseClassName: string;
  ringClassName: string;
  sizeClassName: string;
  className: string;
}
