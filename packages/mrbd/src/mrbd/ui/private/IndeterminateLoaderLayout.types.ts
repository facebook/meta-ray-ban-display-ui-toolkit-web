/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface IndeterminateLoaderGeometry {
  sizePx: number;
  strokeWidth: number;
  scaledStrokeWidth: number;
  circleRadius: number;
}

export interface IndeterminateLoaderClassNameOptions {
  baseClassName: string;
  sizeClassName: string;
  pausedClassName: string;
  isAnimating: boolean;
  className: string;
}
