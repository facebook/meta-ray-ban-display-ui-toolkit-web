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
  RadialGradientContainerMaterialLayer,
  VisualState,
  createGlowStrokeLayer,
  createIdleMaterialLayer,
  createNoiseMaterialLayer,
  createPressedMaterialLayer,
  createWebAppIconMaterial,
  type GradientStop,
  type MaterialLayer,
} from '@wearables-ui-toolkit/mrbd';

export interface SampleAppTileTheme {
  /** Colors are ordered from the brightest stop to the darkest stop. */
  readonly colors: readonly string[];
  readonly innerGlowTint: string;
}

// These colors are app-owned artwork choices, not design-system color tokens.
// Each palette keeps a consistent bright-to-dark luminance progression while
// moving through neighboring hues. Wider hue movement is reserved for a small
// number of materials where it remains smooth at both icon and tile scale.
export const SAMPLE_APP_TILE_THEMES = {
  trail: {
    colors: ['#BFF35E', '#4FD27B', '#257F70', '#163B44'],
    innerGlowTint: '#3E9E71',
  },
  forecast: {
    colors: ['#72E9D7', '#4ABFC4', '#6677C0', '#30335F'],
    innerGlowTint: '#6A9FAB',
  },
  notes: {
    colors: ['#A86134', '#914B31', '#663525', '#37231D'],
    innerGlowTint: '#7D402B',
  },
  soundscape: {
    colors: ['#FF928E', '#E34B61', '#982F58', '#481A3D'],
    innerGlowTint: '#B83A5C',
  },
  gallery: {
    colors: ['#FF8C87', '#E54F86', '#8742A0', '#39245F'],
    innerGlowTint: '#AA5D98',
  },
  wayfinder: {
    colors: ['#5B71D8', '#6454C4', '#79398F', '#401F5E'],
    innerGlowTint: '#6849A8',
  },
  camera: {
    colors: ['#78D8FF', '#439DE8', '#5D56BD', '#342252'],
    innerGlowTint: '#526CB8',
  },
  translate: {
    colors: ['#FFDC57', '#E88D2E', '#B33D4D', '#4A1832'],
    innerGlowTint: '#B65D42',
  },
  timer: {
    colors: ['#007E75', '#00708F', '#2855A6', '#322B73'],
    innerGlowTint: '#17638F',
  },
  reader: {
    colors: ['#FF9FCC', '#E364A4', '#A34C61', '#46241F'],
    innerGlowTint: '#B66580',
  },
  discover: {
    colors: ['#80E8E4', '#4AAFD9', '#536DC7', '#342E78'],
    innerGlowTint: '#4A8CCE',
  },
  colorGrid: {
    colors: ['#C46625', '#B64332', '#812D46', '#3B1A35'],
    innerGlowTint: '#98373D',
  },
} as const satisfies Record<string, SampleAppTileTheme>;

export type SampleAppTileThemeName = keyof typeof SAMPLE_APP_TILE_THEMES;

export interface SampleAppTileMaterialOptions {
  supportsInnerShadow?: boolean;
}

const FOCUSED_GRADIENT_WIDTH_SCALE = 216 / 88;
const FOCUSED_GRADIENT_HEIGHT_SCALE = (264 / 88) / 2;
const FOCUSED_GRADIENT_X = 0.2256;
const FOCUSED_GRADIENT_Y = 0.1333;
const FOCUSED_GLOW_STROKE_ALPHA = 178 / 255;

function isFocusedOrPressed(state: VisualState): boolean {
  return state === VisualState.FOCUSED || state === VisualState.PRESSED;
}

function getGradientStops(theme: SampleAppTileTheme): GradientStop[] {
  const lastIndex = theme.colors.length - 1;
  return theme.colors.map((color, index) => ({
    color,
    offset: lastIndex === 0 ? 0 : index / lastIndex,
  }));
}

function createColorLayer(
  theme: SampleAppTileTheme,
  id: string,
  supportsDiscretePartialFocus: boolean,
  alphaForState: (state: VisualState) => number,
): MaterialLayer {
  return new RadialGradientContainerMaterialLayer({
    id,
    sortOrder: 100,
    supportsDiscretePartialFocus,
    sizeMultiplier: {
      x: FOCUSED_GRADIENT_WIDTH_SCALE / 2,
      y: FOCUSED_GRADIENT_HEIGHT_SCALE,
    },
    placementMultiplier: {
      x: FOCUSED_GRADIENT_X,
      y: FOCUSED_GRADIENT_Y,
    },
    useInsetAdjustedHeight: true,
    stops: getGradientStops(theme),
    alphaForState,
  });
}

function createFocusedLayer(theme: SampleAppTileTheme): MaterialLayer {
  return createColorLayer(
    theme,
    'sample-app-focused-fill',
    true,
    state => isFocusedOrPressed(state) ? 1 : 0,
  );
}

function createInnerShadowLayer(theme: SampleAppTileTheme): MaterialLayer {
  return new InnerShadowContainerMaterialLayer({
    id: 'sample-app-inner-shadow',
    sortOrder: 150,
    color: theme.innerGlowTint,
    blurRadius: 20,
    sigmaScale: 0.5,
    blendMode: 'screen',
    alphaForState: state => isFocusedOrPressed(state) ? 1 : 0,
  });
}

export function createSampleAppTileMaterial(
  themeName: SampleAppTileThemeName,
  options: SampleAppTileMaterialOptions = {},
): ContainerMaterial {
  const theme = SAMPLE_APP_TILE_THEMES[themeName];
  return new ContainerMaterial({
    layers: [
      createIdleMaterialLayer(),
      createFocusedLayer(theme),
      ...(options.supportsInnerShadow === false
        ? []
        : [createInnerShadowLayer(theme)]),
      createNoiseMaterialLayer(),
      createPressedMaterialLayer(),
      createGlowStrokeLayer(state => (
        isFocusedOrPressed(state) ? FOCUSED_GLOW_STROKE_ALPHA : 0
      )),
    ],
  });
}

export function createLauncherTileMaterial(
  themeName: SampleAppTileThemeName,
  supportsInnerShadow: boolean = true,
): ContainerMaterial {
  return createSampleAppTileMaterial(themeName, {
    supportsInnerShadow,
  });
}

export function createLauncherWebAppIconMaterial(
  themeName: SampleAppTileThemeName,
  iconSrc: string,
) {
  const theme = SAMPLE_APP_TILE_THEMES[themeName];
  return createWebAppIconMaterial({
    iconSrc,
    innerGlowColor: theme.innerGlowTint,
    radialColors: theme.colors,
  });
}
