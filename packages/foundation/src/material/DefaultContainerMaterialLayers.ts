/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MaterialLayer } from './ContainerMaterial';
import {
  createDropShadowLayer,
  createFocusedMaterialLayer,
  createGlowStrokeLayer,
  createIdleMaterialLayer,
  createInnerShadowLayer,
  createNoiseMaterialLayer,
  createPressedMaterialLayer,
} from './DefaultContainerMaterialLayerFactories';
import { defaultGlowStrokeAlpha } from './DefaultGlowStrokeLayer';
import type {
  DefaultContainerMaterialLayerOptions,
} from './DefaultContainerMaterialLayers.types';

export type {
  DefaultContainerMaterialLayerOptions,
} from './DefaultContainerMaterialLayers.types';

export function createDefaultContainerMaterialLayers(
  options: DefaultContainerMaterialLayerOptions = {},
): MaterialLayer[] {
  const hiddenGlowStates = options.hideGlowForStates;
  const layers = [
    createDropShadowLayer(),
    createIdleMaterialLayer(),
    createFocusedMaterialLayer(),
    createInnerShadowLayer(),
    createNoiseMaterialLayer(),
    createPressedMaterialLayer(),
    createGlowStrokeLayer((state) =>
      hiddenGlowStates?.includes(state) === true
        ? 0
        : defaultGlowStrokeAlpha(state),
    ),
  ];

  return options.withDropShadow
    ? layers
    : layers.filter((layer) => layer.id !== 'drop-shadow');
}
