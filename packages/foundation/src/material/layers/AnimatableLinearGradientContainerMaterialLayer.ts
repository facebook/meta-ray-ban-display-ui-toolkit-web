/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CanvasLayerDrawParams } from '../ContainerMaterial.types';
import { fillLinearGradient, type GradientStop } from '../canvas/CanvasDrawUtils';
import {
  LinearGradientContainerMaterialLayer,
  type LinearGradientPoints,
} from './LinearGradientContainerMaterialLayer';

/** Gradient endpoints for a diagonal at `angleDeg`, centered on the box. */
function pointsForAngle(angleDeg: number, width: number, height: number): LinearGradientPoints {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;
  return {
    x0: cx - dx * half,
    y0: cy - dy * half,
    x1: cx + dx * half,
    y1: cy + dy * half,
  };
}

/**
 * Linear gradient whose colors/angle can be animated at runtime: when animation
 * properties are set they override the configured stops/points; otherwise it
 * behaves exactly like its base.
 */
export class AnimatableLinearGradientContainerMaterialLayer extends LinearGradientContainerMaterialLayer {
  animatedStops?: readonly GradientStop[];
  animatedAngleDeg?: number;

  resetAnimationProperties(): void {
    this.animatedStops = undefined;
    this.animatedAngleDeg = undefined;
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    if (this.animatedStops == null && this.animatedAngleDeg == null) {
      super.paint(ctx, params, alpha);
      return;
    }
    const stops = this.animatedStops ?? this.resolveStops(params);
    const pts =
      this.animatedAngleDeg != null
        ? pointsForAngle(this.animatedAngleDeg, params.width, params.height)
        : this.pointProvider(params.width, params.height, params);
    fillLinearGradient(ctx, {
      path: params.path,
      x0: pts.x0,
      y0: pts.y0,
      x1: pts.x1,
      y1: pts.y1,
      stops,
      alpha,
      blend: this.blendMode,
    });
  }
}
