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
import { drawImageClipped } from '../canvas/CanvasDrawUtils';
import { resolveLayerValue, type LayerValue } from './LayerSupport';

export interface ImageContentLayerConfig {
  id: string;
  placement?: LayerPlacement;
  sortOrder?: number;
  /** Image URL resolved via the canvas assets. */
  imageUrl: LayerValue<string>;
  /** How the image fills the shape. Defaults to 'cover'. */
  fit?: 'cover' | 'fill';
  /** Optional blur radius in logical px applied to the background image. */
  blurPx?: number;
  blendMode?: GlobalCompositeOperation;
  alphaForState?: (state: VisualState) => number;
}

/**
 * Image content clipped to the shape, optionally blurred (blurred background
 * image fills).
 */
export class ImageContentContainerMaterialLayer extends ContainerMaterialLayer {
  private readonly imageUrl: LayerValue<string>;
  private readonly fit: 'cover' | 'fill';
  private readonly blurPx?: number;

  constructor(config: ImageContentLayerConfig) {
    super(config.id, config.placement ?? LayerPlacement.BACKGROUND, {
      sortOrder: config.sortOrder,
      blendMode: config.blendMode,
      alphaForState: config.alphaForState,
      supportsDiscretePartialFocus: false,
    });
    this.imageUrl = config.imageUrl;
    this.fit = config.fit ?? 'cover';
    this.blurPx = config.blurPx;
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    const image = params.assets.getImage(resolveLayerValue(this.imageUrl, params));
    if (image == null) {
      return;
    }
    drawImageClipped(ctx, {
      path: params.path,
      image,
      width: params.width,
      height: params.height,
      fit: this.fit,
      blurPx: this.blurPx,
      alpha,
      blend: this.blendMode,
    });
  }
}
