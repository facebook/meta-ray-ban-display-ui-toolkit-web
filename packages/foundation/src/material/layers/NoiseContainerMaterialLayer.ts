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
import { fillNoise } from '../canvas/CanvasDrawUtils';

export interface NoiseLayerConfig {
  id: string;
  placement?: LayerPlacement;
  sortOrder?: number;
  /** Tile size in logical px (the source texture is scaled to this). */
  tileSize?: number;
  /**
   * Optional texture URL resolved via the canvas assets. When omitted the shared
   * container noise texture (`assets.noise`) is used.
   */
  imageUrl?: string;
  blendMode?: GlobalCompositeOperation;
  alphaForState?: (state: VisualState) => number;
}

/**
 * Tiled noise texture fill: a repeating texture scaled to a fixed tile size,
 * composited (overlay by default) and faded by the resolved per-state alpha.
 */
export class NoiseContainerMaterialLayer extends ContainerMaterialLayer {
  private readonly tileSize: number;
  private readonly imageUrl?: string;

  constructor(config: NoiseLayerConfig) {
    super(config.id, config.placement ?? LayerPlacement.BACKGROUND, {
      sortOrder: config.sortOrder,
      blendMode: config.blendMode ?? 'overlay',
      alphaForState: config.alphaForState,
      supportsDiscretePartialFocus: false,
    });
    this.tileSize = config.tileSize ?? 25;
    this.imageUrl = config.imageUrl;
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    const image =
      this.imageUrl != null ? params.assets.getImage(this.imageUrl) : params.assets.noise;
    if (image == null) {
      return;
    }
    fillNoise(ctx, {
      path: params.path,
      image,
      tileSize: this.tileSize,
      alpha,
      blend: this.blendMode,
    });
  }
}
