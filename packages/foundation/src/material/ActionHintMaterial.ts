/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ContainerMaterial,
  LayerPlacement,
  createContainerMaterialWithOwnedLayers,
  type MaterialLayer,
} from './ContainerMaterial';
import {
  LinearGradientContainerMaterialLayer,
  RadialGradientGlowStrokeContainerMaterialLayer,
} from './layers';

const ACTION_HINT_STROKE_ALPHA = 0.1;
const ACTION_HINT_STROKE_WIDTH = 1;

export function createActionHintMaterial(): ContainerMaterial {
  const layers: MaterialLayer[] = [
    new LinearGradientContainerMaterialLayer({
      id: 'action-hint-gradient',
      sortOrder: 50,
      stops: [
        { offset: 0, color: 'rgba(255, 255, 255, 0.15)' },
        { offset: 1, color: 'rgba(255, 255, 255, 0)' },
      ],
      points: (width, height) => ({ x0: 0, y0: 0, x1: width, y1: height }),
    }),
    new RadialGradientGlowStrokeContainerMaterialLayer({
      id: 'action-hint-stroke',
      placement: LayerPlacement.BACKGROUND,
      sortOrder: 300,
      supportsDiscretePartialFocus: true,
      blendMode: 'overlay',
      sizeMultiplier: { x: 0.625, y: 0.905 },
      placementMultiplier: { x: 0.2604, y: -0.091 },
      useInsetAdjustedHeight: true,
      stops: [
        { offset: 0, color: 'rgba(255, 255, 255, 1)' },
        { offset: 1, color: 'rgba(255, 255, 255, 0)' },
      ],
      alphaForState: () => ACTION_HINT_STROKE_ALPHA,
      strokeWidthForState: () => ACTION_HINT_STROKE_WIDTH,
    }),
  ];

  return createContainerMaterialWithOwnedLayers({
    layers,
    hidden: false,
    alpha: 1.0,
  });
}
