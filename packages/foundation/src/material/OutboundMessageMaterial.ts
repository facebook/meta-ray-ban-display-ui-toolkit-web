/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VisualState } from '../base/Interactions';
import { ContainerMaterial } from './ContainerMaterial';
import {
  InnerShadowContainerMaterialLayer,
  RadialGradientContainerMaterialLayer,
  SolidColorContainerMaterialLayer,
} from './layers';
import type {
  DefaultMaterialFactory,
  OutboundMessageMaterialTheme,
} from './OutboundMessageMaterial.types';

export type {
  DefaultMaterialFactory,
  OutboundMessageMaterialTheme,
} from './OutboundMessageMaterial.types';

const isFocusedOrPressed = (state: VisualState): boolean =>
  state === VisualState.FOCUSED || state === VisualState.PRESSED;

export function createOutboundMessageMaterial(
  createDefaultMaterial: DefaultMaterialFactory,
  theme: OutboundMessageMaterialTheme,
): ContainerMaterial {
  const base = createDefaultMaterial();
  const allLayers = [...base.getBackgroundLayers(), ...base.getForegroundLayers()];

  const themedLayers = allLayers.map((layer) => {
    if (layer.id === 'idle-material') {
      return new SolidColorContainerMaterialLayer({
        id: layer.id,
        placement: layer.placement,
        sortOrder: layer.sortOrder,
        color: theme.idleFill,
        alphaForState: (state) => (state === VisualState.NONE ? 0 : 1),
      });
    }
    if (layer.id === 'focused-material') {
      return new RadialGradientContainerMaterialLayer({
        id: layer.id,
        placement: layer.placement,
        sortOrder: layer.sortOrder,
        supportsDiscretePartialFocus: true,
        sizeMultiplier: { x: 216 / 88 / 2, y: 264 / 88 / 2 },
        placementMultiplier: { x: 0.2256, y: 0.1333 },
        useInsetAdjustedHeight: true,
        stops: [
          { offset: 0, color: theme.gradientStep1 },
          { offset: 0.33, color: theme.gradientStep2 },
          { offset: 0.66, color: theme.gradientStep3 },
          { offset: 1, color: theme.gradientStep4 },
        ],
        alphaForState: (state) => (isFocusedOrPressed(state) ? 1 : 0),
      });
    }
    if (layer.id === 'inner-shadow') {
      return new InnerShadowContainerMaterialLayer({
        id: layer.id,
        placement: layer.placement,
        sortOrder: layer.sortOrder,
        color: theme.glowTint,
        blurRadius: 20,
        sigmaScale: 0.5,
        blendMode: 'screen',
        alphaForState: (state) => (isFocusedOrPressed(state) ? 1 : 0),
      });
    }
    return layer;
  });

  return new ContainerMaterial({
    layers: themedLayers,
  });
}
