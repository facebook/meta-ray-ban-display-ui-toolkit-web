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
} from './ContainerMaterial';
import {
  createCardContainerMaterialLayers,
  createFullScreenCardContainerMaterialLayers,
} from './CardContainerMaterialLayers';

export function createCardContainerMaterial(): ContainerMaterial {
  return createContainerMaterialWithOwnedLayers({
    layers: createCardContainerMaterialLayers(),
    foregroundBlendsWithContent: true,
  });
}

export function createFullScreenCardContainerMaterial(): ContainerMaterial {
  return createContainerMaterialWithOwnedLayers({
    layers: createFullScreenCardContainerMaterialLayers(),
    foregroundBlendsWithContent: true,
  });
}
