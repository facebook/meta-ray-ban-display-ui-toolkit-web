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

const isGlowHidden = (state: VisualState): boolean =>
  state === VisualState.DEFAULT || state === VisualState.NONE;

export function createContextMenuItemMaterial(
  createDefaultMaterial: DefaultContainerMaterialFactory,
): ContainerMaterial {
  const base = createDefaultMaterial();
  const layers = [...base.getBackgroundLayers(), ...base.getForegroundLayers()].map((layer) => {
    // Context-menu items have no idle surface fill.
    if (layer.id === 'idle-material') {
      return new NoOpContainerMaterialLayer('idle-material', layer.placement, {
        sortOrder: layer.sortOrder,
      });
    }
    // Hide the glow stroke in DEFAULT/NONE so it fades up from zero into
    // FOCUSED/PRESSED rather than popping in at the default alpha.
    if (layer.id === 'glow-stroke') {
      return createGlowStrokeLayer((state) =>
        isGlowHidden(state) ? 0 : defaultGlowStrokeAlpha(state),
      );
    }
    return layer;
  });

  return new ContainerMaterial({
    layers,
  });
}
