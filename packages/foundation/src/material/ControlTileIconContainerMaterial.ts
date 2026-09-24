/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { MaterialColors } from '../colors/Colors';
import { ContainerMaterial } from './ContainerMaterial';
import { SolidColorContainerMaterialLayer } from './layers';

export function createControlTileCheckedIconContainerMaterial(): ContainerMaterial {
  return new ContainerMaterial({
    layers: [
      new SolidColorContainerMaterialLayer({
        id: 'control-tile-checked-icon-background',
        color: MaterialColors.strokeHighlight,
      }),
    ],
  });
}
