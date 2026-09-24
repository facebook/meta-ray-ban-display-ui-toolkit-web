/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VisualState } from '../base/Interactions';
import { MaterialColors } from '../colors/Colors';
import { LayerPlacement, type MaterialLayer } from './ContainerMaterial';
import {
  defaultGlowStrokeAlpha,
  defaultGlowStrokeWidth,
} from './DefaultGlowStrokeLayer';
import {
  DropShadowContainerMaterialLayer,
  InnerShadowContainerMaterialLayer,
  NoiseContainerMaterialLayer,
  RadialGradientContainerMaterialLayer,
  RadialGradientGlowStrokeContainerMaterialLayer,
  SolidColorContainerMaterialLayer,
} from './layers';

const ALPHA = {
  // Alpha constants expressed on a 0-255 scale.
  DROP_SHADOW_DEFAULT: 128 / 255,
  NOISE_FOCUSED: 77 / 255,
};

const isFocusedOrPressed = (state: VisualState): boolean =>
  state === VisualState.FOCUSED || state === VisualState.PRESSED;

// Drop shadow layer: 8px radius, y=8px offset, black at alpha 128.
export function createDropShadowLayer(): MaterialLayer {
  return new DropShadowContainerMaterialLayer({
    id: 'drop-shadow',
    sortOrder: 10,
    color: `rgba(0, 0, 0, ${ALPHA.DROP_SHADOW_DEFAULT})`,
    blur: 8,
    offsetX: 0,
    offsetY: 8,
  });
}

// Solid-color idle/default surface fill.
export function createIdleMaterialLayer(): MaterialLayer {
  return new SolidColorContainerMaterialLayer({
    id: 'idle-material',
    sortOrder: 50,
    color: MaterialColors.backgroundSurface,
    alphaForState: (state) => (state === VisualState.NONE ? 0 : 1),
  });
}

// Radial-gradient focused glow fill.
export function createFocusedMaterialLayer(): MaterialLayer {
  return new RadialGradientContainerMaterialLayer({
    id: 'focused-material',
    sortOrder: 100,
    supportsDiscretePartialFocus: true,
    sizeMultiplier: { x: 216 / 88 / 2, y: 264 / 88 / 2 },
    placementMultiplier: { x: 0.2256, y: 0.1333 },
    useInsetAdjustedHeight: true,
    stops: [
      { offset: 0, color: MaterialColors.gradientStep1 },
      { offset: 0.33, color: MaterialColors.gradientStep2 },
      { offset: 0.66, color: MaterialColors.gradientStep3 },
      { offset: 1, color: MaterialColors.gradientStep4 },
    ],
    alphaForState: (state) => (isFocusedOrPressed(state) ? 1 : 0),
  });
}

// Inner-shadow layer with the default slate glow tint in screen blend mode. The
// tint is overridable: materials that omit innerGlowTint fall back to opaque
// white (colorInteractiveFillPressed | opaque).
export function createInnerShadowLayer(
  color: string = MaterialColors.innerGlowTint,
): MaterialLayer {
  return new InnerShadowContainerMaterialLayer({
    id: 'inner-shadow',
    sortOrder: 150,
    color,
    blurRadius: 20,
    sigmaScale: 0.5,
    blendMode: 'screen',
    alphaForState: (state) => (isFocusedOrPressed(state) ? 1 : 0),
  });
}

// Noise layer: 25px source texture rendered with overlay blending.
export function createNoiseMaterialLayer(): MaterialLayer {
  return new NoiseContainerMaterialLayer({
    id: 'noise-material',
    sortOrder: 200,
    tileSize: 25,
    blendMode: 'overlay',
    alphaForState: (state) => (isFocusedOrPressed(state) ? ALPHA.NOISE_FOCUSED : 0),
  });
}

// Pressed slate-tinted press overlay. The tint is overridable: materials that
// omit pressOverlayTint fall back to white 25% (colorInteractiveFillPressed).
export function createPressedMaterialLayer(
  color: string = MaterialColors.pressedOverlay,
): MaterialLayer {
  return new SolidColorContainerMaterialLayer({
    id: 'pressed-material',
    sortOrder: 250,
    color,
    alphaForState: (state) => (state === VisualState.PRESSED ? 1 : 0),
  });
}

// Default radial-gradient glow stroke (white falloff, overlay blend).
// The alpha policy is overridable so materials that hide the glow in certain
// states (context-menu items, unbounded) can fade it from zero rather than
// popping in at the default alpha.
export function createGlowStrokeLayer(
  alphaForState: (state: VisualState) => number = defaultGlowStrokeAlpha,
): MaterialLayer {
  return new RadialGradientGlowStrokeContainerMaterialLayer({
    id: 'glow-stroke',
    placement: LayerPlacement.BACKGROUND,
    sortOrder: 300,
    supportsDiscretePartialFocus: true,
    blendMode: 'overlay',
    sizeMultiplier: { x: 0.625, y: 0.905 },
    placementMultiplier: { x: 0.2604, y: -0.091 },
    useInsetAdjustedHeight: true,
    stops: [
      { offset: 0, color: 'rgba(255, 255, 255, 1)' },
      { offset: 1, color: 'rgba(255, 255, 255, 0)' },
    ],
    alphaForState,
    strokeWidthForState: defaultGlowStrokeWidth,
  });
}
