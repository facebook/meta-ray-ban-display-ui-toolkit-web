/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CanvasLayerDrawParams } from '../ContainerMaterial.types';
import {
  strokeEllipticalRadialGradient,
  strokeSolid,
  type GradientStop,
} from '../canvas/CanvasDrawUtils';
import {
  BaseGlowStrokeContainerMaterialLayer,
  type BaseGlowStrokeLayerConfig,
} from './BaseGlowStrokeContainerMaterialLayer';
import {
  computeEllipticalRadialGeometry,
  resolveLayerValue,
  type LayerValue,
  type RadialMultiplier,
} from './LayerSupport';

export interface RadialGradientGlowStrokeLayerConfig extends BaseGlowStrokeLayerConfig {
  stops: LayerValue<readonly GradientStop[]>;
  sizeMultiplier: RadialMultiplier;
  placementMultiplier: RadialMultiplier;
  useInsetAdjustedHeight?: boolean;
}

/**
 * Glow stroke painted with a focus-following elliptical radial gradient. A
 * single-stop config degenerates to a solid stroke, so this radial layer can
 * also render solid card strokes.
 */
export class RadialGradientGlowStrokeContainerMaterialLayer extends BaseGlowStrokeContainerMaterialLayer {
  private readonly stops: LayerValue<readonly GradientStop[]>;
  private readonly sizeMultiplier: RadialMultiplier;
  private readonly placementMultiplier: RadialMultiplier;
  private readonly useInsetAdjustedHeight: boolean;

  constructor(config: RadialGradientGlowStrokeLayerConfig) {
    super(config);
    this.stops = config.stops;
    this.sizeMultiplier = config.sizeMultiplier;
    this.placementMultiplier = config.placementMultiplier;
    this.useInsetAdjustedHeight = config.useInsetAdjustedHeight ?? false;
  }

  protected strokePaint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    strokePath: Path2D,
    strokeWidth: number,
    alpha: number,
  ): void {
    const stops = resolveLayerValue(this.stops, params);
    if (stops.length === 1) {
      strokeSolid(ctx, {
        strokePath,
        strokeWidth,
        color: stops[0].color,
        alpha,
        blend: this.blendMode,
      });
      return;
    }
    const geometry = computeEllipticalRadialGeometry(
      params,
      this.sizeMultiplier,
      this.placementMultiplier,
      this.useInsetAdjustedHeight,
      // The glow stroke tracks partial focus at half magnitude.
      0.5,
    );
    strokeEllipticalRadialGradient(ctx, {
      strokePath,
      width: params.width,
      height: params.height,
      strokeWidth,
      cx: geometry.cx,
      cy: geometry.cy,
      radius: geometry.radius,
      scaleX: geometry.scaleX,
      stops,
      alpha,
      blend: this.blendMode ?? 'overlay',
      dpr: params.dpr,
    });
  }
}
