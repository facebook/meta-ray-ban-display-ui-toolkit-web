/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ContainerMaterialLayer, LayerPlacement } from '../ContainerMaterial';
import type { ContainerMaterialLayerOptions } from '../ContainerMaterial.types';

/**
 * A layer that draws nothing: a placeholder used where a material's layer slot
 * should render nothing (e.g. an unbounded material with no idle surface fill),
 * keeping layer indices stable.
 */
export class NoOpContainerMaterialLayer extends ContainerMaterialLayer {
  constructor(
    id: string,
    placement: LayerPlacement = LayerPlacement.BACKGROUND,
    options: ContainerMaterialLayerOptions = {},
  ) {
    super(id, placement, { supportsDiscretePartialFocus: false, ...options });
  }

  protected alphaForState(): number {
    return 0;
  }

  protected paint(): void {}
}
