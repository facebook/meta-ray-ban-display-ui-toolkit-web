/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ContainerMaterial,
  InnerShadowContainerMaterialLayer,
  LinearGradientGlowStrokeContainerMaterialLayer,
  RadialGradientContainerMaterialLayer,
  RadialGradientGlowStrokeContainerMaterialLayer,
  VisualState,
  createIdleMaterialLayer,
  createNoiseMaterialLayer,
  createPressedMaterialLayer,
  type GradientStop,
} from '@wearables-ui-toolkit/mrbd';

export const NEON_FOCUSED_GRADIENT_STOPS = [
  { offset: 0, color: '#624654' },
  { offset: 0.25, color: '#4B3742' },
  { offset: 0.5, color: '#342830' },
  { offset: 0.75, color: '#1E191E' },
  { offset: 0.875, color: '#121115' },
  { offset: 1, color: '#07090C' },
] as const satisfies readonly GradientStop[];

export const NEON_RADIAL_SIZE = { x: 0.68178, y: 1.04844 } as const;
export const NEON_RADIAL_PLACEMENT = { x: 0.43218, y: 0 } as const;
export const NEON_INNER_GLOW_COLOR = 'rgba(112, 92, 107, 0.56)';
export const NEON_INNER_GLOW_BLUR_RADIUS = 16;
export const NEON_BORDER_COLOR = '#E7E2D9';
export const NEON_BORDER_WIDTH = 2;
export const NEON_BORDER_STOPS = [
  { offset: 0, color: 'rgba(231, 226, 217, 0.8)' },
  { offset: 0.125, color: 'rgba(231, 226, 217, 0.56)' },
  { offset: 0.8, color: 'rgba(231, 226, 217, 0)' },
] as const satisfies readonly GradientStop[];
export const NEON_BOTTOM_BORDER_STOPS = [
  { offset: 0, color: 'rgba(231, 226, 217, 0)' },
  { offset: 0.65, color: 'rgba(231, 226, 217, 0)' },
  { offset: 1, color: 'rgba(231, 226, 217, 0.3)' },
] as const satisfies readonly GradientStop[];

function isFocusedOrPressed(state: VisualState): boolean {
  return state === VisualState.FOCUSED || state === VisualState.PRESSED;
}

function createNeonFocusedLayer(): RadialGradientContainerMaterialLayer {
  return new RadialGradientContainerMaterialLayer({
    id: 'focused-material',
    sortOrder: 100,
    supportsDiscretePartialFocus: true,
    sizeMultiplier: NEON_RADIAL_SIZE,
    placementMultiplier: NEON_RADIAL_PLACEMENT,
    stops: NEON_FOCUSED_GRADIENT_STOPS,
    alphaForState: state => (isFocusedOrPressed(state) ? 1 : 0),
  });
}

function createNeonInnerGlowLayer(): InnerShadowContainerMaterialLayer {
  return new InnerShadowContainerMaterialLayer({
    id: 'inner-shadow',
    sortOrder: 150,
    color: NEON_INNER_GLOW_COLOR,
    blurRadius: NEON_INNER_GLOW_BLUR_RADIUS,
    blendMode: 'screen',
    alphaForState: state => (isFocusedOrPressed(state) ? 1 : 0),
  });
}

function createNeonBorderLayer(): RadialGradientGlowStrokeContainerMaterialLayer {
  return new RadialGradientGlowStrokeContainerMaterialLayer({
    id: 'glow-stroke',
    sortOrder: 300,
    blendMode: 'source-over',
    supportsDiscretePartialFocus: true,
    sizeMultiplier: NEON_RADIAL_SIZE,
    placementMultiplier: NEON_RADIAL_PLACEMENT,
    stops: NEON_BORDER_STOPS,
    strokeWidthForState: () => NEON_BORDER_WIDTH,
    alphaForState: state => (isFocusedOrPressed(state) ? 1 : 0),
  });
}

function createNeonBottomBorderLayer(): LinearGradientGlowStrokeContainerMaterialLayer {
  return new LinearGradientGlowStrokeContainerMaterialLayer({
    id: 'neon-bottom-stroke',
    sortOrder: 301,
    blendMode: 'source-over',
    supportsDiscretePartialFocus: false,
    points: (_width, height) => ({ x0: 0, y0: 0, x1: 0, y1: height }),
    stops: NEON_BOTTOM_BORDER_STOPS,
    strokeWidthForState: () => NEON_BORDER_WIDTH,
    alphaForState: state => (isFocusedOrPressed(state) ? 1 : 0),
  });
}

/**
 * Creates an independent Neon material for one interactive control.
 *
 * The default layer factories preserve the standard resting surface, noise,
 * and press feedback. The Neon layers replace only the focused appearance.
 * Callers can select the semantic corner radius that fits their control.
 */
export function createNeonMaterial(): ContainerMaterial {
  return new ContainerMaterial({
    layers: [
      createIdleMaterialLayer(),
      createNeonFocusedLayer(),
      createNeonInnerGlowLayer(),
      createNoiseMaterialLayer(),
      createPressedMaterialLayer(),
      createNeonBorderLayer(),
      createNeonBottomBorderLayer(),
    ],
  });
}
