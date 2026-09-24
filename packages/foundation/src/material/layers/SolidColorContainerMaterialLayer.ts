/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { VisualState } from '../../base/Interactions';
import { ContainerMaterialLayer, LayerPlacement } from '../ContainerMaterial';
import type { CanvasLayerDrawParams } from '../ContainerMaterial.types';
import { fillSolid } from '../canvas/CanvasDrawUtils';
import { resolveLayerValue, type LayerValue } from './LayerSupport';

export interface SolidColorLayerConfig {
  id: string;
  placement?: LayerPlacement;
  sortOrder?: number;
  /** Fill color (may carry its own alpha, multiplied by the resolved alpha). */
  color: LayerValue<string>;
  alphaForState?: (state: VisualState) => number;
  blendMode?: GlobalCompositeOperation;
}

/**
 * Solid-color fill of the shape path (idle surface fill, pressed overlay). The
 * color's own alpha is multiplied by the resolved per-state alpha.
 */
export class SolidColorContainerMaterialLayer extends ContainerMaterialLayer {
  private readonly color: LayerValue<string>;

  constructor(config: SolidColorLayerConfig) {
    super(config.id, config.placement ?? LayerPlacement.BACKGROUND, {
      sortOrder: config.sortOrder,
      blendMode: config.blendMode,
      alphaForState: config.alphaForState,
      supportsDiscretePartialFocus: false,
    });
    this.color = config.color;
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    fillSolid(ctx, params.path, resolveLayerValue(this.color, params), alpha, this.blendMode);
  }
}
