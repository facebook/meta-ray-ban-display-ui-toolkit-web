/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type MaterialShapeContext } from './ContainerMaterial';

export function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function shiftedX(
  baseX: number,
  width: number,
  partialFocusPosition?: { x: number },
): number {
  return (baseX + (partialFocusPosition?.x ?? 0)) * width;
}

export function shiftedY(
  baseY: number,
  height: number,
  partialFocusPosition?: { y: number },
): number {
  return (baseY + (partialFocusPosition?.y ?? 0)) * height;
}

export function getInsetAdjustedShaderHeight(
  height: number,
  shapeContext?: MaterialShapeContext,
): number {
  const inset = shapeContext?.materialInset;
  if (inset == null) {
    return height;
  }
  return Math.max(0, height - inset.top - inset.bottom);
}
