/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VisualState } from '../base/Interactions';
import {
  ContainerMaterial,
  LayerPlacement,
  createContainerMaterialWithOwnedLayers,
} from './ContainerMaterial';
import {
  createGlowStrokeLayer,
  createInnerShadowLayer,
  createPressedMaterialLayer,
} from './DefaultContainerMaterialLayerFactories';
import { defaultGlowStrokeAlpha } from './DefaultGlowStrokeLayer';
import { MaterialColors, Overlay } from '../colors/Colors';
import {
  LinearGradientContainerMaterialLayer,
  NoOpContainerMaterialLayer,
  SolidColorContainerMaterialLayer,
} from './layers';

const CLOCK_PILL_GRADIENT_TOP_ALPHA = 0.82;
const CLOCK_PILL_GRADIENT_BOTTOM_ALPHA = 0.33;
const REDUCED_STATIC_ALPHA = 0x4d / 0xff;
const STATUS_INDICATOR_BLACKOUT_HEIGHT = 12;

export function createClockPillContainerMaterial(): ContainerMaterial {
  return createContainerMaterialWithOwnedLayers({
    layers: [
      createNoOpIdleLayer(),
      createClockPillFocusedLayer(),
      createPressedMaterialLayer(),
      createGlowStrokeLayerHiddenWhenIdle(),
    ],
  });
}

export function createReducedOpacityStaticContainerMaterial(): ContainerMaterial {
  return createContainerMaterialWithOwnedLayers({
    layers: [
      createReducedOpacityIdleLayer(),
      createPressedMaterialLayer(),
      createGlowStrokeLayer(),
    ],
  });
}

export function createStatusIndicatorPanelContainerMaterial(): ContainerMaterial {
  return createContainerMaterialWithOwnedLayers({
    layers: [
      createStatusIndicatorPanelIdleLayer(),
      // statusIndicatorPanel passes no innerGlowTint/pressOverlayTint, so both
      // fall back to white (colorInteractiveFillPressed), unlike the Default
      // container's slate-substituted tints.
      createInnerShadowLayer('#FFFFFF'),
      createPressedMaterialLayer(Overlay.light[25]),
      createGlowStrokeLayer(),
    ],
  });
}

function createNoOpIdleLayer() {
  return new NoOpContainerMaterialLayer('idle-material', LayerPlacement.BACKGROUND, {
    sortOrder: 50,
  });
}

function createClockPillFocusedLayer() {
  return new LinearGradientContainerMaterialLayer({
    id: 'focused-material',
    placement: LayerPlacement.BACKGROUND,
    sortOrder: 100,
    supportsDiscretePartialFocus: false,
    points: (width, height) => ({ x0: width / 2, y0: 0, x1: width / 2, y1: height }),
    stops: [
      {
        offset: 0,
        color: colorWithAlpha(MaterialColors.backgroundSurface, CLOCK_PILL_GRADIENT_TOP_ALPHA),
      },
      {
        offset: 1,
        color: colorWithAlpha(MaterialColors.backgroundSurface, CLOCK_PILL_GRADIENT_BOTTOM_ALPHA),
      },
    ],
    alphaForState: (state) => (isFocusedOrPressed(state) ? 1 : 0),
  });
}

export function createGlowStrokeLayerHiddenWhenIdle() {
  return createGlowStrokeLayer(clockPillGlowStrokeAlpha);
}

function createReducedOpacityIdleLayer() {
  const fill = colorWithAlpha(MaterialColors.backgroundSurface, REDUCED_STATIC_ALPHA);
  return new SolidColorContainerMaterialLayer({
    id: 'idle-material',
    placement: LayerPlacement.BACKGROUND,
    sortOrder: 50,
    color: fill,
    alphaForState: (state) => (state === VisualState.NONE ? 0 : 1),
  });
}

function createStatusIndicatorPanelIdleLayer() {
  return new LinearGradientContainerMaterialLayer({
    id: 'idle-material',
    placement: LayerPlacement.BACKGROUND,
    sortOrder: 50,
    points: (_width, height) => ({
      x0: 0,
      y0: 0,
      x1: 0,
      y1: Math.max(0, height - STATUS_INDICATOR_BLACKOUT_HEIGHT),
    }),
    stops: [
      { offset: 0, color: MaterialColors.backgroundSurface },
      { offset: 1, color: colorWithAlpha(MaterialColors.backgroundSurface, 0) },
    ],
    alphaForState: (state) => (state === VisualState.NONE ? 0 : 1),
  });
}

function clockPillGlowStrokeAlpha(state: VisualState): number {
  if (state === VisualState.NONE || state === VisualState.DEFAULT) {
    return 0;
  }
  return defaultGlowStrokeAlpha(state);
}

function isFocusedOrPressed(state: VisualState): boolean {
  return state === VisualState.FOCUSED || state === VisualState.PRESSED;
}

function colorWithAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
