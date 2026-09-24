/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ContainerMaterial,
} from '@wearables-ui-toolkit/foundation';
import { createContainerMaterialWithOwnedLayers } from '@wearables-ui-toolkit/foundation/material/ContainerMaterial';
import { Overlay } from '@wearables-ui-toolkit/foundation/colors/Colors';
import {
  createGlowStrokeLayer,
  createNoiseMaterialLayer,
  createPressedMaterialLayer,
} from '@wearables-ui-toolkit/foundation/material/DefaultContainerMaterialLayerFactories';
import { SolidColorContainerMaterialLayer } from '@wearables-ui-toolkit/foundation/material/layers';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { CHIP_BACKGROUND_BY_STYLE } from './ChipMetrics';
import { ChipStyle } from '../Chip.types';

/**
 * The chip material uses a solid layer without an inner shadow. It keeps the
 * noise, pressed overlay, and radial glow-stroke layers over the per-style
 * solid fill while omitting the focused fill and emphasized focus stroke.
 * The chip passes no pressOverlayTint, so the press overlay is white 25%
 * (colorInteractiveFillPressed), not the Default container's slate tint.
 */
export function createChipMaterialForStyle(
  chipStyle: ChipStyle,
): ContainerMaterial {
  const backgroundColor = CHIP_BACKGROUND_BY_STYLE[chipStyle];

  const idleLayer = new SolidColorContainerMaterialLayer({
    id: 'chip-idle',
    sortOrder: 50,
    color: backgroundColor,
    alphaForState: (state) => (state === VisualState.NONE ? 0 : 1),
  });

  return createContainerMaterialWithOwnedLayers({
    layers: [
      idleLayer,
      createNoiseMaterialLayer(),
      createPressedMaterialLayer(Overlay.light[25]),
      createGlowStrokeLayer(),
    ],
    hidden: false,
    alpha: 1.0,
  });
}
