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
import {
  fillLinearGradient,
  fillLinearGradientRect,
  type GradientStop,
} from '../canvas/CanvasDrawUtils';
import { resolveLayerValue, type LayerValue } from './LayerSupport';

export interface LinearGradientPoints {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type LinearGradientPointProvider = (
  width: number,
  height: number,
  params: CanvasLayerDrawParams,
) => LinearGradientPoints;

export interface LinearGradientLayerConfig {
  id: string;
  placement?: LayerPlacement;
  sortOrder?: number;
  blendMode?: GlobalCompositeOperation;
  stops: LayerValue<readonly GradientStop[]>;
  /** Gradient start/end points; defaults to top-left → bottom-right. */
  points?: LinearGradientPointProvider;
  alphaForState?: (state: VisualState) => number;
  supportsDiscretePartialFocus?: boolean;
  /**
   * Fill the full layer rectangle instead of the rounded shape path. Used by the
   * panel-scrim layer, which supplies its own corner-radius-free rectangular
   * metrics so the scrim ignores the container rounding. Implies the layer is not
   * clipped to the shape.
   */
  fillRect?: boolean;
}

const DEFAULT_POINTS: LinearGradientPointProvider = (width, height) => ({
  x0: 0,
  y0: 0,
  x1: width,
  y1: height,
});

/**
 * Linear-gradient fill of the shape path. Stops and points may be providers so
 * a material can resolve them per frame from an interpolated config.
 */
export class LinearGradientContainerMaterialLayer extends ContainerMaterialLayer {
  protected readonly stops: LayerValue<readonly GradientStop[]>;
  protected readonly pointProvider: LinearGradientPointProvider;
  private readonly fillRect: boolean;

  constructor(config: LinearGradientLayerConfig) {
    super(config.id, config.placement ?? LayerPlacement.BACKGROUND, {
      sortOrder: config.sortOrder,
      blendMode: config.blendMode,
      alphaForState: config.alphaForState,
      supportsDiscretePartialFocus: config.supportsDiscretePartialFocus ?? false,
      clipsToShape: config.fillRect === true ? false : undefined,
    });
    this.stops = config.stops;
    this.pointProvider = config.points ?? DEFAULT_POINTS;
    this.fillRect = config.fillRect ?? false;
  }

  protected resolveStops(params: CanvasLayerDrawParams): readonly GradientStop[] {
    return resolveLayerValue(this.stops, params);
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    const pts = this.pointProvider(params.width, params.height, params);
    const stops = this.resolveStops(params);
    if (this.fillRect) {
      fillLinearGradientRect(ctx, {
        x: 0,
        y: 0,
        width: params.width,
        height: params.height,
        x0: pts.x0,
        y0: pts.y0,
        x1: pts.x1,
        y1: pts.y1,
        stops,
        alpha,
        blend: this.blendMode,
      });
      return;
    }
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
