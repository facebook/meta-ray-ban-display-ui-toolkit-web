/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CanvasLayerDrawParams } from '../ContainerMaterial.types';
import { fillEllipticalRadialGradient } from '../canvas/CanvasDrawUtils';
import { computeEllipticalRadialGeometry } from './LayerSupport';
import { RadialGradientContainerMaterialLayer } from './RadialGradientContainerMaterialLayer';

/**
 * Radial gradient whose position/scale can be animated at runtime: animated
 * position offsets shift the gradient center and `animationScale` scales the
 * radius, layered on top of the configured multipliers. With no animation set it
 * behaves exactly like its base.
 */
export class AnimatableRadialGradientContainerMaterialLayer extends RadialGradientContainerMaterialLayer {
  animatedPositionX = 0;
  animatedPositionY = 0;
  animationScale = 1;

  resetAnimationProperties(): void {
    this.animatedPositionX = 0;
    this.animatedPositionY = 0;
    this.animationScale = 1;
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    if (
      this.animatedPositionX === 0 &&
      this.animatedPositionY === 0 &&
      this.animationScale === 1
    ) {
      super.paint(ctx, params, alpha);
      return;
    }
    const geometry = computeEllipticalRadialGeometry(
      params,
      this.sizeMultiplier,
      {
        x: this.placementMultiplier.x + this.animatedPositionX,
        y: this.placementMultiplier.y + this.animatedPositionY,
      },
      this.useInsetAdjustedHeight,
    );
    fillEllipticalRadialGradient(ctx, {
      path: params.path,
      width: params.width,
      height: params.height,
      cx: geometry.cx,
      cy: geometry.cy,
      radius: geometry.radius * this.animationScale,
      scaleX: geometry.scaleX,
      stops: this.resolveStops(params),
      alpha,
      blend: this.blendMode,
    });
  }
}
