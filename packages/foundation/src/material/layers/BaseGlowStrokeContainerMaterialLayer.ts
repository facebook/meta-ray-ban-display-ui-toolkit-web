/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { VisualState } from '../../base/Interactions';
import {
  ContainerMaterialLayer,
  LayerPlacement,
  MAX_SORT_ORDER,
} from '../ContainerMaterial';
import type { CanvasLayerDrawParams } from '../ContainerMaterial.types';

export interface BaseGlowStrokeLayerConfig {
  id: string;
  placement?: LayerPlacement;
  /** Defaults to MAX_SORT_ORDER so glow strokes draw last within their group. */
  sortOrder?: number;
  /** Defaults to 'overlay'. */
  blendMode?: GlobalCompositeOperation;
  alphaForState?: (state: VisualState) => number;
  /** Per-state stroke width in logical px. Defaults to a constant 1px. */
  strokeWidthForState?: (state: VisualState) => number;
  supportsDiscretePartialFocus?: boolean;
}

/**
 * Abstract base for glowing border strokes: draws last (MAX_SORT_ORDER), strokes
 * the inset border path with `overlay` blending by default, and resolves the
 * per-state stroke width across the active transition. Subclasses supply the
 * paint (linear vs radial gradient) in {@link strokePaint}.
 */
export abstract class BaseGlowStrokeContainerMaterialLayer extends ContainerMaterialLayer {
  private readonly strokeWidthFn?: (state: VisualState) => number;

  constructor(config: BaseGlowStrokeLayerConfig) {
    super(config.id, config.placement ?? LayerPlacement.BACKGROUND, {
      sortOrder: config.sortOrder ?? MAX_SORT_ORDER,
      blendMode: config.blendMode ?? 'overlay',
      alphaForState: config.alphaForState,
      clipsToShape: false,
      supportsDiscretePartialFocus: config.supportsDiscretePartialFocus ?? true,
    });
    this.strokeWidthFn = config.strokeWidthForState;
  }

  protected strokeWidthForState(state: VisualState): number {
    return this.strokeWidthFn != null ? this.strokeWidthFn(state) : 1;
  }

  protected paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    const strokeWidth = params.lerpState((state) => this.strokeWidthForState(state));
    if (strokeWidth <= 0) {
      return;
    }
    this.strokePaint(ctx, params, params.getInsetStrokePath(strokeWidth), strokeWidth, alpha);
  }

  protected abstract strokePaint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    strokePath: Path2D,
    strokeWidth: number,
    alpha: number,
  ): void;
}
