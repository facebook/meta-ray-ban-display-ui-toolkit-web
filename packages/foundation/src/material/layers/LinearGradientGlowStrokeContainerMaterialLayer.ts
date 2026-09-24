/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CanvasLayerDrawParams } from '../ContainerMaterial.types';
import { strokeLinearGradient, type GradientStop } from '../canvas/CanvasDrawUtils';
import {
  BaseGlowStrokeContainerMaterialLayer,
  type BaseGlowStrokeLayerConfig,
} from './BaseGlowStrokeContainerMaterialLayer';
import type { LinearGradientPointProvider } from './LinearGradientContainerMaterialLayer';
import { resolveLayerValue, type LayerValue } from './LayerSupport';

export interface LinearGradientGlowStrokeLayerConfig extends BaseGlowStrokeLayerConfig {
  stops: LayerValue<readonly GradientStop[]>;
  /** Gradient start/end points; defaults to top-left → bottom-right. */
  points?: LinearGradientPointProvider;
}

const DEFAULT_POINTS: LinearGradientPointProvider = (width, height) => ({
  x0: 0,
  y0: 0,
  x1: width,
  y1: height,
});

/** Glow stroke painted with a linear gradient. */
export class LinearGradientGlowStrokeContainerMaterialLayer extends BaseGlowStrokeContainerMaterialLayer {
  private readonly stops: LayerValue<readonly GradientStop[]>;
  private readonly pointProvider: LinearGradientPointProvider;

  constructor(config: LinearGradientGlowStrokeLayerConfig) {
    super(config);
    this.stops = config.stops;
    this.pointProvider = config.points ?? DEFAULT_POINTS;
  }

  protected strokePaint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    strokePath: Path2D,
    strokeWidth: number,
    alpha: number,
  ): void {
    const pts = this.pointProvider(params.width, params.height, params);
    strokeLinearGradient(ctx, {
      strokePath,
      strokeWidth,
      x0: pts.x0,
      y0: pts.y0,
      x1: pts.x1,
      y1: pts.y1,
      stops: resolveLayerValue(this.stops, params),
      alpha,
      blend: this.blendMode,
    });
  }
}
