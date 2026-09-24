/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  MaterialColors,
  Overlay,
} from '@wearables-ui-toolkit/foundation/colors/Colors';
import {
  type ContainerMaterial,
  type MaterialLayer,
} from '@wearables-ui-toolkit/foundation';
import { createContainerMaterialWithOwnedLayers } from '@wearables-ui-toolkit/foundation/material/ContainerMaterial';
import { createGlowStrokeLayer } from '@wearables-ui-toolkit/foundation/material/DefaultContainerMaterialLayerFactories';
import {
  DropShadowContainerMaterialLayer,
  SolidColorContainerMaterialLayer,
} from '@wearables-ui-toolkit/foundation/material/layers';

const BADGE_SHADOW_BLUR = 6;
const BADGE_SHADOW_OFFSET_Y = 4;

function createBadgeMaterial({
  fillColor,
  includeGlow,
  screenBlend,
}: {
  fillColor: string;
  includeGlow: boolean;
  screenBlend: boolean;
}): ContainerMaterial {
  const layers: MaterialLayer[] = [
    new DropShadowContainerMaterialLayer({
      id: 'badge-shadow',
      sortOrder: 10,
      color: Overlay.dark[30],
      blur: BADGE_SHADOW_BLUR,
      offsetY: BADGE_SHADOW_OFFSET_Y,
    }),
    new SolidColorContainerMaterialLayer({
      id: 'badge-fill',
      sortOrder: 50,
      color: fillColor,
      blendMode: screenBlend ? 'screen' : undefined,
      alphaForState: state => state === VisualState.NONE ? 0 : 1,
    }),
  ];

  if (includeGlow) {
    layers.push(createGlowStrokeLayer());
  }

  return createContainerMaterialWithOwnedLayers({
    layers,
    backgroundBlendsWithBackdrop: screenBlend,
  });
}

export function createAppBadgeMaterial(): ContainerMaterial {
  return createBadgeMaterial({
    fillColor: MaterialColors.backgroundSurface,
    includeGlow: true,
    screenBlend: true,
  });
}

export function createNotificationBadgeMaterial(): ContainerMaterial {
  return createBadgeMaterial({
    fillColor: MaterialColors.notificationBadge,
    includeGlow: false,
    screenBlend: false,
  });
}
