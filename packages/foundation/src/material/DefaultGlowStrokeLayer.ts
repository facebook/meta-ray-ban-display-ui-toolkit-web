/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  CanvasLayerDrawParams,
  LayerStyles,
} from './ContainerMaterial';
import { VisualState } from '../base/Interactions';
import { MaterialColors } from '../colors/Colors';
import {
  getInsetAdjustedShaderHeight,
  shiftedX,
  shiftedY,
} from './MaterialLayerGeometry';
import { strokeEllipticalRadialGradient } from './canvas/CanvasDrawUtils';

export const DEFAULT_GLOW_STROKE_ALPHA = {
  NONE: 0,
  DEFAULT: 153 / 255,
  FOCUSED: 178 / 255,
} as const;

export function defaultGlowStrokeAlpha(state: VisualState): number {
  if (state === VisualState.DEFAULT) {
    return DEFAULT_GLOW_STROKE_ALPHA.DEFAULT;
  }
  if (state === VisualState.FOCUSED || state === VisualState.PRESSED) {
    return DEFAULT_GLOW_STROKE_ALPHA.FOCUSED;
  }
  return DEFAULT_GLOW_STROKE_ALPHA.NONE;
}

export function defaultGlowStrokeWidth(state: VisualState): number {
  return state === VisualState.FOCUSED || state === VisualState.PRESSED ? 3 : 1;
}

export function renderDefaultGlowStrokeStyles(
  opacity: number,
  strokeWidth: number,
  transition?: string,
): LayerStyles {
  const widthScale = 1.25;
  const heightScale = 1.81 / 2;
  const horizontalOffset = 0.2604;
  const verticalOffset = -0.091;
  const ellipseRadiusX = (widthScale / 2) * 100;
  const ellipseRadiusY = heightScale * 100;
  const gradientX = horizontalOffset * 100;
  const gradientY = verticalOffset * 100;
  const glowGradient = `radial-gradient(ellipse ${ellipseRadiusX}% ${ellipseRadiusY}% at ${gradientX}% ${gradientY}%,
    ${MaterialColors.strokeHighlight} 0%,
    transparent 100%)`;

  return {
    background: glowGradient,
    backgroundOrigin: 'border-box',
    backgroundClip: 'border-box',
    border: `${strokeWidth}px solid transparent`,
    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    opacity,
    mixBlendMode: 'overlay',
    ...(transition != null ? { transition } : {}),
  } as LayerStyles;
}

/**
 * Draw the default radial-gradient glow stroke onto a canvas.
 *
 * Strokes the inset shape path with a white radial gradient whose alpha falls off
 * from the focus-aware origin, blended with overlay to form the focus border.
 * paintAlpha and strokeWidth are resolved by the caller (so a single call covers
 * both the steady state and any in-flight transition).
 */
export function drawDefaultGlowStrokeCanvas(
  ctx: CanvasRenderingContext2D,
  paintAlpha: number,
  strokeWidth: number,
  params: CanvasLayerDrawParams,
): void {
  if (paintAlpha <= 0 || strokeWidth <= 0) {
    return;
  }
  const { width, height, partialFocusPosition, shapeContext, dpr } = params;
  const cx = shiftedX(0.2604, width, partialFocusPosition);
  const cy = shiftedY(-0.091, height, partialFocusPosition);
  const rx = 0.625 * width;
  const fullRy = 0.905 * height;
  const shaderRy = 0.905 * getInsetAdjustedShaderHeight(height, shapeContext);
  const scaleX = fullRy > 0 ? rx / fullRy : 1;
  strokeEllipticalRadialGradient(ctx, {
    strokePath: params.getInsetStrokePath(strokeWidth),
    width,
    height,
    strokeWidth,
    cx,
    cy,
    radius: shaderRy,
    scaleX,
    stops: [
      { offset: 0, color: `rgba(255, 255, 255, ${paintAlpha})` },
      { offset: 1, color: 'rgba(255, 255, 255, 0)' },
    ],
    alpha: 1,
    blend: 'overlay',
    dpr,
  });
}
