/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  INDETERMINATE_LOADER_EDGE_PADDING_PX,
  INDETERMINATE_LOADER_VIEWBOX_SIZE,
} from './IndeterminateLoaderMetrics';

export function getIndeterminateLoaderScaledStrokeWidth(
  strokeWidth: number,
  sizePx: number,
): number {
  return (strokeWidth / sizePx) * INDETERMINATE_LOADER_VIEWBOX_SIZE;
}

export function getIndeterminateLoaderCircleRadius(
  scaledStrokeWidth: number,
  scaledEdgePadding = 0,
): number {
  return (INDETERMINATE_LOADER_VIEWBOX_SIZE - scaledStrokeWidth) / 2 - scaledEdgePadding;
}

export function getIndeterminateLoaderScaledEdgePadding(
  sizePx: number,
): number {
  return (INDETERMINATE_LOADER_EDGE_PADDING_PX / sizePx) * INDETERMINATE_LOADER_VIEWBOX_SIZE;
}
