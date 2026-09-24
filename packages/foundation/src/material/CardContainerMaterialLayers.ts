/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VisualState } from '../base/Interactions';
import { MaterialColors, Overlay } from '../colors/Colors';
import { LayerPlacement, type MaterialLayer } from './ContainerMaterial';
import {
  RadialGradientGlowStrokeContainerMaterialLayer,
  SolidColorContainerMaterialLayer,
} from './layers';

export function createCardContainerMaterialLayers(): MaterialLayer[] {
  return [
    createCardIdleLayer('card-idle'),
    createCardPressLayer('card-press'),
    createCardIdleBorderLayer('card-idle-border'),
    createCardBackGlowLayer('card-back-glow'),
    createCardFrontGlowLayer('card-front-glow'),
  ];
}

export function createFullScreenCardContainerMaterialLayers(): MaterialLayer[] {
  return [
    createCardIdleLayer('fullscreen-card-idle'),
    createFullScreenCardPressLayer(),
    createFullScreenCardBorderLayer(),
  ];
}

// The card has a visible idle fill in every state except NONE.
function createCardIdleLayer(id: string): MaterialLayer {
  return new SolidColorContainerMaterialLayer({
    id,
    color: MaterialColors.backgroundSurface,
    alphaForState: (state) => (state === VisualState.NONE ? 0 : 1),
  });
}

// The card press overlay is foreground-only and uses the plain
// colorInteractiveFillPressed token (white 25%) — NOT the Default container's
// slate-substituted inner-glow press tint.
function createCardPressLayer(id: string): MaterialLayer {
  return new SolidColorContainerMaterialLayer({
    id,
    placement: LayerPlacement.FOREGROUND,
    sortOrder: 100,
    color: Overlay.light[25],
    alphaForState: cardPressAlpha,
  });
}

function createFullScreenCardPressLayer(): MaterialLayer {
  return new SolidColorContainerMaterialLayer({
    id: 'fullscreen-card-press',
    placement: LayerPlacement.FOREGROUND,
    sortOrder: 100,
    color: Overlay.light[25],
    alphaForState: (state) => (state === VisualState.PRESSED ? 1 : 0),
  });
}

// Resting card border: 1px overlay stroke at alpha 128 in DEFAULT only.
function createCardIdleBorderLayer(id: string): MaterialLayer {
  return new RadialGradientGlowStrokeContainerMaterialLayer({
    id,
    placement: LayerPlacement.FOREGROUND,
    sortOrder: 200,
    supportsDiscretePartialFocus: false,
    blendMode: 'overlay',
    stops: [{ offset: 0, color: MaterialColors.controlIdle }],
    sizeMultiplier: { x: 1, y: 1 },
    placementMultiplier: { x: 0.5, y: 0.5 },
    alphaForState: cardIdleBorderAlpha,
    strokeWidthForState: cardIdleBorderWidth,
  });
}

// Back glow is the wider hard-light stroke behind the focused front stroke.
function createCardBackGlowLayer(id: string): MaterialLayer {
  return new RadialGradientGlowStrokeContainerMaterialLayer({
    id,
    placement: LayerPlacement.FOREGROUND,
    sortOrder: 300,
    supportsDiscretePartialFocus: false,
    blendMode: 'hard-light',
    stops: [{ offset: 0, color: 'rgba(0,0,0,0.5)' }],
    sizeMultiplier: { x: 1, y: 1 },
    placementMultiplier: { x: 0.5, y: 0.5 },
    alphaForState: cardGlowAlpha,
    strokeWidthForState: cardBackGlowWidth,
  });
}

// Front glow supports partial-focus handoff and rubber-band movement.
function createCardFrontGlowLayer(id: string): MaterialLayer {
  return new RadialGradientGlowStrokeContainerMaterialLayer({
    id,
    placement: LayerPlacement.FOREGROUND,
    sortOrder: 400,
    supportsDiscretePartialFocus: true,
    blendMode: 'hard-light',
    stops: [
      { offset: 0, color: MaterialColors.strokeHighlight },
      { offset: 0.72, color: MaterialColors.controlIdle },
    ],
    sizeMultiplier: { x: 0.25, y: 0.5 },
    placementMultiplier: { x: 1.25, y: 1.81818841 },
    alphaForState: cardGlowAlpha,
    strokeWidthForState: cardFrontGlowWidth,
  });
}

function createFullScreenCardBorderLayer(): MaterialLayer {
  return new RadialGradientGlowStrokeContainerMaterialLayer({
    id: 'fullscreen-card-border',
    placement: LayerPlacement.FOREGROUND,
    sortOrder: 200,
    supportsDiscretePartialFocus: true,
    blendMode: 'hard-light',
    stops: [
      { offset: 0, color: MaterialColors.strokeHighlight },
      { offset: 0.7163, color: MaterialColors.controlIdle },
    ],
    sizeMultiplier: { x: 0.5617, y: 0.6801 },
    placementMultiplier: { x: 0.1, y: 0.225 },
    alphaForState: (state) => (state === VisualState.NONE ? 0 : 128 / 255),
    strokeWidthForState: (state) =>
      state === VisualState.FOCUSED || state === VisualState.PRESSED ? 2 : 1,
  });
}

function cardIdleBorderAlpha(state: VisualState): number {
  return state === VisualState.DEFAULT ? 128 / 255 : 0;
}

function cardIdleBorderWidth(state: VisualState): number {
  return state === VisualState.DEFAULT ? 1 : 0;
}

function cardPressAlpha(state: VisualState): number {
  return state === VisualState.PRESSED ? 1 : 0;
}

function cardGlowAlpha(state: VisualState): number {
  return state === VisualState.FOCUSED || state === VisualState.PRESSED ? 1 : 0;
}

function cardFrontGlowWidth(state: VisualState): number {
  return state === VisualState.FOCUSED || state === VisualState.PRESSED ? 3 : 0;
}

function cardBackGlowWidth(state: VisualState): number {
  return state === VisualState.FOCUSED || state === VisualState.PRESSED ? 6 : 0;
}
