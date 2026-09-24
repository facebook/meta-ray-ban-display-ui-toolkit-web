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
import { fillEllipticalRadialGradient, type GradientStop } from '../canvas/CanvasDrawUtils';
import {
  computeEllipticalRadialGeometry,
  resolveLayerValue,
  type LayerValue,
  type RadialMultiplier,
} from './LayerSupport';

export interface RadialGradientLayerConfig {
  id: string;
  placement?: LayerPlacement;
  sortOrder?: number;
  blendMode?: GlobalCompositeOperation;
  stops: LayerValue<readonly GradientStop[]>;
  /** Radii as fractions of width/height. */
  sizeMultiplier: RadialMultiplier;
  /** Center offset as fractions of width/height (before partial-focus shift). */
  placementMultiplier: RadialMultiplier;
  /** Shrink the radius by material insets (inset-adjusted shader height). */
  useInsetAdjustedHeight?: boolean;
  alphaForState?: (state: VisualState) => number;
  supportsDiscretePartialFocus?: boolean;
}

/**
 * Elliptical radial-gradient fill of the shape path. The gradient is
 * positioned/scaled via size + placement multipliers and the partial-focus
 * offset.
 */
export class RadialGradientContainerMaterialLayer extends ContainerMaterialLayer {
  protected readonly stops: LayerValue<readonly GradientStop[]>;
  protected readonly sizeMultiplier: RadialMultiplier;
  protected readonly placementMultiplier: RadialMultiplier;
  protected readonly useInsetAdjustedHeight: boolean;

  constructor(config: RadialGradientLayerConfig) {
    super(config.id, config.placement ?? LayerPlacement.BACKGROUND, {
      sortOrder: config.sortOrder,
      blendMode: config.blendMode,
      alphaForState: config.alphaForState,
      supportsDiscretePartialFocus: config.supportsDiscretePartialFocus ?? true,
    });
    this.stops = config.stops;
    this.sizeMultiplier = config.sizeMultiplier;
    this.placementMultiplier = config.placementMultiplier;
    this.useInsetAdjustedHeight = config.useInsetAdjustedHeight ?? false;
  }

  protected resolveStops(params: CanvasLayerDrawParams): readonly GradientStop[] {
    return resolveLayerValue(this.stops, params);
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    const geometry = computeEllipticalRadialGeometry(
      params,
      this.sizeMultiplier,
      this.placementMultiplier,
      this.useInsetAdjustedHeight,
    );
    fillEllipticalRadialGradient(ctx, {
      path: params.path,
      width: params.width,
      height: params.height,
      cx: geometry.cx,
      cy: geometry.cy,
      radius: geometry.radius,
      scaleX: geometry.scaleX,
      stops: this.resolveStops(params),
      alpha,
      blend: this.blendMode,
    });
  }
}
