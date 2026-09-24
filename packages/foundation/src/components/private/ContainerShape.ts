/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  defaultShapeProvider,
  getCachedShapePath,
  type ShapeProvider,
} from '../../material/ShapeProvider';
import type { MaterialShapeContext } from '../../material/ContainerMaterial';

export interface ContainerMeasuredDimensions {
  w: number;
  h: number;
}

export interface ContainerShapeMetricsOptions {
  width: number | string;
  height: number | string;
  measuredDims: ContainerMeasuredDimensions | null;
  shapeProvider?: ShapeProvider;
}

export interface ContainerShapeMetrics {
  effectiveUseSmoothCorners: boolean;
  containerW: number;
  containerH: number;
  shapeContext: MaterialShapeContext;
  smoothCornerPath: string | null;
  cssSmoothCornerClipPath?: string;
}

export function getContainerShapeMetrics({
  width,
  height,
  measuredDims,
  shapeProvider = defaultShapeProvider,
}: ContainerShapeMetricsOptions): ContainerShapeMetrics {
  const hasFixedDimensions = typeof width === 'number' && typeof height === 'number';
  const hasMeasuredDimensions =
    measuredDims != null && measuredDims.w > 0 && measuredDims.h > 0;
  const effectiveUseSmoothCorners = hasFixedDimensions || hasMeasuredDimensions;

  const containerW = hasFixedDimensions
    ? width
    : hasMeasuredDimensions
      ? measuredDims.w
      : 0;
  const containerH = hasFixedDimensions
    ? height
    : hasMeasuredDimensions
      ? measuredDims.h
      : 0;

  const shapeContext: MaterialShapeContext = {
    shapeProvider,
  };

  const smoothCornerPath = effectiveUseSmoothCorners
    ? getCachedShapePath(shapeProvider, {
        width: containerW,
        height: containerH,
      })
    : null;
  const cssSmoothCornerClipPath =
    effectiveUseSmoothCorners && smoothCornerPath
      ? `path("${smoothCornerPath}")`
      : undefined;

  return {
    effectiveUseSmoothCorners,
    containerW,
    containerH,
    shapeContext,
    smoothCornerPath,
    cssSmoothCornerClipPath,
  };
}
