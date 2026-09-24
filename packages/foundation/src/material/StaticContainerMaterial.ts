/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ContainerMaterial,
  createContainerMaterialWithOwnedLayers,
  type MaterialLayer,
} from './ContainerMaterial';
import type { StaticContainerMaterialOptions } from './StaticContainerMaterial.types';
import { MaterialColors } from '../colors/Colors';
import { VisualState } from '../base/Interactions';
import { createGlowStrokeLayer } from './DefaultContainerMaterialLayerFactories';
import {
  DropShadowContainerMaterialLayer,
  SolidColorContainerMaterialLayer,
} from './layers';

export type { StaticContainerMaterialOptions } from './StaticContainerMaterial.types';

export function createStaticContainerMaterial(
  options: StaticContainerMaterialOptions = {},
): ContainerMaterial {
  const idleColor = options.idleColor ?? MaterialColors.backgroundSurface;
  const secondaryBlendMode = options.secondary ? 'screen' : undefined;
  const layers: MaterialLayer[] = [
    new SolidColorContainerMaterialLayer({
      id: 'idle-material',
      sortOrder: 50,
      color: idleColor,
      blendMode: secondaryBlendMode,
      alphaForState: (state) => (state === VisualState.NONE ? 0 : 1),
    }),
    createGlowStrokeLayer(),
  ];

  if (options.withDropShadow) {
    layers.unshift(
      new DropShadowContainerMaterialLayer({
        id: 'drop-shadow',
        sortOrder: 10,
        color: 'rgba(0, 0, 0, 0.878)',
        blur: 16,
        offsetX: 0,
        offsetY: 4,
      }),
    );
  }

  const config = {
    layers,
    hidden: false,
    alpha: 1.0,
    backgroundBlendsWithBackdrop: options.secondary === true,
    ...options.config,
  };
  return options.config?.layers == null
    ? createContainerMaterialWithOwnedLayers(config)
    : new ContainerMaterial(config);
}
