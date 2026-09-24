/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  BlurredRadialGradientContainerMaterialLayer,
  ContainerMaterial,
  VisualState,
} from '@wearables-ui-toolkit/foundation';

/**
 * Creates the focus treatment for containers whose content supplies the fill,
 * such as a full-bleed image.
 */
export function createContentFocusContainerMaterial(): ContainerMaterial {
  return new ContainerMaterial({
    supportsDiscretePartialFocus: true,
    layers: [
      new BlurredRadialGradientContainerMaterialLayer({
        id: 'content-focus',
        sortOrder: 900,
        alphaForState: state =>
          state === VisualState.FOCUSED || state === VisualState.PRESSED ? 1 : 0,
      }),
    ],
  });
}
