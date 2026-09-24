/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  getIndeterminateLoaderCircleRadius,
  getIndeterminateLoaderScaledEdgePadding,
  getIndeterminateLoaderScaledStrokeWidth,
} from './IndeterminateLoaderGeometry';
import {
  INDETERMINATE_LOADER_SIZE_PX,
  INDETERMINATE_LOADER_STROKE_WIDTH,
} from './IndeterminateLoaderMetrics';
import { IndeterminateLoaderSize } from '../IndeterminateLoader.types';
import type {
  IndeterminateLoaderClassNameOptions,
  IndeterminateLoaderGeometry,
} from './IndeterminateLoaderLayout.types';

export type {
  IndeterminateLoaderClassNameOptions,
  IndeterminateLoaderGeometry,
} from './IndeterminateLoaderLayout.types';

export function getIndeterminateLoaderGeometry(
  size: IndeterminateLoaderSize,
): IndeterminateLoaderGeometry {
  const sizePx = INDETERMINATE_LOADER_SIZE_PX[size];
  const strokeWidth = INDETERMINATE_LOADER_STROKE_WIDTH[size];
  const scaledStrokeWidth = getIndeterminateLoaderScaledStrokeWidth(strokeWidth, sizePx);
  const scaledEdgePadding = getIndeterminateLoaderScaledEdgePadding(sizePx);
  return {
    sizePx,
    strokeWidth,
    scaledStrokeWidth,
    circleRadius: getIndeterminateLoaderCircleRadius(
      scaledStrokeWidth,
      scaledEdgePadding,
    ),
  };
}

export function getIndeterminateLoaderClassName({
  baseClassName,
  sizeClassName,
  pausedClassName,
  isAnimating,
  className,
}: IndeterminateLoaderClassNameOptions): string {
  return [
    baseClassName,
    sizeClassName,
    !isAnimating ? pausedClassName : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
