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
import { drawDropShadow } from '../canvas/CanvasDrawUtils';

export interface DropShadowLayerConfig {
  id: string;
  placement?: LayerPlacement;
  sortOrder?: number;
  /** Shadow color (carries its own alpha). */
  color: string;
  /** Blur radius in logical px. */
  blur: number;
  offsetX?: number;
  offsetY?: number;
  alphaForState?: (state: VisualState) => number;
}

/**
 * Outer drop shadow halo around the shape: always behind the fill, alpha baked
 * into the color, optionally faded by the resolved per-state alpha.
 */
export class DropShadowContainerMaterialLayer extends ContainerMaterialLayer {
  private readonly color: string;
  private readonly blur: number;
  private readonly offsetX: number;
  private readonly offsetY: number;

  constructor(config: DropShadowLayerConfig) {
    super(config.id, config.placement ?? LayerPlacement.BACKGROUND, {
      sortOrder: config.sortOrder,
      alphaForState: config.alphaForState,
      supportsDiscretePartialFocus: false,
      clipsToShape: false,
    });
    this.color = config.color;
    this.blur = config.blur;
    this.offsetX = config.offsetX ?? 0;
    this.offsetY = config.offsetY ?? 0;
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    drawDropShadow(ctx, {
      path: params.path,
      color: this.color,
      blur: this.blur,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    });
    ctx.restore();
  }
}
