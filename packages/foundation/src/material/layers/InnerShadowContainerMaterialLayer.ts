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
import { drawInnerGlow } from '../canvas/CanvasDrawUtils';
import { getShapeProviderId } from '../ShapeProvider';

export interface InnerShadowLayerConfig {
  id: string;
  placement?: LayerPlacement;
  sortOrder?: number;
  /** Glow/shadow tint color. */
  color: string;
  /** Inner-shadow blur radius in logical px. */
  blurRadius?: number;
  sigmaScale?: number;
  /** Directional inner-shadow falloff offset in logical px. */
  offsetX?: number;
  offsetY?: number;
  /** Inner-shadow inward dilation in logical px. */
  spread?: number;
  /** Inner-shadow peak strength multiplier. */
  intensity?: number;
  blendMode?: GlobalCompositeOperation;
  alphaForState?: (state: VisualState) => number;
}

/**
 * Inner shadow / inner glow: a blurred falloff strongest at the shape edge,
 * fading inward.
 *
 * The expensive blurred bitmap depends only on geometry + color + blur (not
 * alpha), so it is cached by the shared inner-glow LRU inside {@link drawInnerGlow}.
 * A focus transition (only alpha interpolating) recomputes the blur zero times. The
 * shape discriminator below feeds that cache.
 */
export class InnerShadowContainerMaterialLayer extends ContainerMaterialLayer {
  private readonly color: string;
  private readonly blurRadius: number;
  private readonly sigmaScale: number;
  private readonly offsetX: number;
  private readonly offsetY: number;
  private readonly spread: number;
  private readonly intensity: number;

  constructor(config: InnerShadowLayerConfig) {
    super(config.id, config.placement ?? LayerPlacement.BACKGROUND, {
      sortOrder: config.sortOrder,
      blendMode: config.blendMode ?? 'screen',
      alphaForState: config.alphaForState,
      supportsDiscretePartialFocus: false,
    });
    this.color = config.color;
    this.blurRadius = config.blurRadius ?? 20;
    this.sigmaScale = config.sigmaScale ?? 0.5;
    this.offsetX = config.offsetX ?? 0;
    this.offsetY = config.offsetY ?? 0;
    this.spread = config.spread ?? 0;
    this.intensity = config.intensity ?? 1;
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    drawInnerGlow(ctx, {
      path: params.path,
      width: params.width,
      height: params.height,
      color: this.color,
      blurRadius: this.blurRadius,
      sigmaScale: this.sigmaScale,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      spread: this.spread,
      intensity: this.intensity,
      alpha,
      blend: this.blendMode ?? 'screen',
      dpr: params.dpr,
      shapeKey: `${this.color}|${getShapeProviderId(params.shapeContext.shapeProvider)}|${this.offsetX}|${this.offsetY}|${this.spread}`,
    });
  }
}
