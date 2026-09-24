/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ContainerMaterial } from './ContainerMaterial';
import type { DefaultContainerMaterialFactory } from './DefaultContainerMaterial.types';
import { VisualState } from '../base/Interactions';
import { createGlowStrokeLayer } from './DefaultContainerMaterialLayerFactories';
import { defaultGlowStrokeAlpha } from './DefaultGlowStrokeLayer';
import { NoOpContainerMaterialLayer } from './layers';

const hideGlowStates: VisualState[] = [VisualState.NONE, VisualState.DEFAULT];
const isHidden = (state: VisualState): boolean => hideGlowStates.includes(state);

export function createUnboundedContainerMaterial(
  createDefaultMaterial: DefaultContainerMaterialFactory,
): ContainerMaterial {
  const base = createDefaultMaterial();
  const modifiedLayers = [
    ...base.getBackgroundLayers(),
    ...base.getForegroundLayers(),
  ].map((layer) => {
    // Unbounded material has no idle surface fill; nothing to draw.
    if (layer.id === 'idle-material') {
      return new NoOpContainerMaterialLayer('idle-material', layer.placement, {
        sortOrder: layer.sortOrder,
      });
    }
    // Hide the glow stroke in DEFAULT/NONE.
    if (layer.id === 'glow-stroke') {
      return createGlowStrokeLayer((state) =>
        isHidden(state) ? 0 : defaultGlowStrokeAlpha(state),
      );
    }
    return layer;
  });

  return new ContainerMaterial({
    layers: modifiedLayers,
  });
}
