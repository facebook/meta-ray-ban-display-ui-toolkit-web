/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  BlurredRadialGradientContainerMaterialLayer,
  ContainerMaterial,
  CornerRadius,
  InnerShadowContainerMaterialLayer,
  RadialGradientContainerMaterialLayer,
  RoundedRectangleShapeProvider,
  VisualState,
  createGlowStrokeLayer,
  createNoiseMaterialLayer,
  createPressedMaterialLayer,
  type GradientStop,
  type MaterialLayer,
  type ShapeProvider,
} from '@wearables-ui-toolkit/foundation';
import { WebAppIconArtworkContainerMaterialLayer } from './private/WebAppIconArtworkContainerMaterialLayer';
import {
  createWebAppIconTokenScale,
  isWebAppIconColor,
} from './private/WebAppIconColor';

export interface WebAppIconMaterialOptions {
  /** Image URL for the web-app artwork. */
  iconSrc?: string | null;
  /** Base color used to tint monochrome artwork and derive the container gradient. */
  themeColor?: string | null;
  /** Explicit container-gradient colors. */
  radialColors?: readonly string[] | null;
  /** Optional offsets for `radialColors`. Invalid arrays are ignored. */
  radialStops?: readonly number[] | null;
  /** Optional focused inner-glow color. */
  innerGlowColor?: string | null;
  /** Whether the material responds to partial-focus lighting. Defaults to true. */
  partialFocusLighting?: boolean;
}

export interface WebAppIconMaterialRendering {
  /** Complete app-container material. */
  material: ContainerMaterial;
  /** Medium-corner geometry for the host container. */
  shapeProvider: ShapeProvider;
  /** Whether the fallback artwork and palette are in use. */
  isFallback: boolean;
}

interface WebAppIconMaterialTheme {
  radialColors: readonly string[];
  radialStops?: readonly number[];
  innerGlowColor: string;
  artworkEffectColor: string;
}

const WEB_APP_FALLBACK_ARTWORK = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.54 8.46c2.73 2.74 2.73 7.17-.01 9.9l-2.82 2.83c-2.74 2.74-7.17 2.74-9.9 0-2.74-2.73-2.74-7.16 0-9.9l1.66-1.66c-.1.91-.06 1.82.12 2.71l-.37.37c-1.95 1.95-1.95 5.11 0 7.07 1.95 1.95 5.12 1.95 7.07 0l2.83-2.83c1.95-1.95 1.95-5.12 0-7.07-.79-.8-1.79-1.27-2.83-1.42l1.65-1.64c.95.34 1.84.89 2.6 1.64z" fill="#fff"/><path d="M21.19 2.81c2.74 2.73 2.74 7.16 0 9.9l-1.66 1.65c.1-.9.06-1.81-.12-2.7l.37-.37c1.95-1.95 1.95-5.12 0-7.07-1.96-1.95-5.12-1.95-7.07 0L9.88 7.05c-1.95 1.95-1.95 5.12 0 7.07.79.8 1.79 1.27 2.83 1.41l-1.65 1.65c-.95-.34-1.84-.89-2.6-1.65-2.73-2.73-2.73-7.16 0-9.89l2.83-2.83c2.74-2.74 7.17-2.74 9.9 0z" fill="#fff"/></svg>',
)}`;
const WEB_APP_ICON_SHAPE_PROVIDER = new RoundedRectangleShapeProvider(
  CornerRadius.MEDIUM,
);
const WEB_APP_FALLBACK_MATERIAL_THEME: WebAppIconMaterialTheme = {
  radialColors: ['#7F93B5', '#495E84', '#27344A', '#181F2D'],
  innerGlowColor: '#495E84',
  artworkEffectColor: '#495E84',
};
const FOCUSED_GRADIENT_SIZE = { x: 216 / 88 / 2, y: 264 / 88 / 2 };
const FOCUSED_GRADIENT_PLACEMENT = { x: 0.2256, y: 0.1333 };

function isFocusedOrPressed(state: VisualState): boolean {
  return state === VisualState.FOCUSED || state === VisualState.PRESSED;
}

function hasValidGradient(colors: readonly string[] | null | undefined): colors is readonly string[] {
  return colors != null && colors.length > 0 && colors.every(isWebAppIconColor);
}

export function normalizeWebAppIconSource(
  iconSrc: string | null | undefined,
): string | null {
  const normalized = iconSrc?.trim();
  return normalized == null || normalized.length === 0 ? null : normalized;
}

function hasValidStops(
  stops: readonly number[] | null | undefined,
  colorCount: number,
): stops is readonly number[] {
  return stops != null &&
    stops.length === colorCount &&
    stops.every((stop, index) =>
      Number.isFinite(stop) &&
      stop >= 0 &&
      stop <= 1 &&
      (index === 0 || stop >= stops[index - 1]),
    );
}

function evenStops(colorCount: number): number[] {
  if (colorCount <= 1) {
    return Array.from({ length: colorCount }, () => 0);
  }
  return Array.from({ length: colorCount }, (_value, index) => index / (colorCount - 1));
}

function canvasGradientStops(theme: WebAppIconMaterialTheme): GradientStop[] {
  const offsets = hasValidStops(theme.radialStops, theme.radialColors.length)
    ? theme.radialStops
    : evenStops(theme.radialColors.length);
  return theme.radialColors.map((color, index) => ({
    offset: offsets[index],
    color,
  }));
}

function themedMaterialTheme(
  themeColor: string,
  innerGlowColor: string | null | undefined,
): WebAppIconMaterialTheme {
  const scale = createWebAppIconTokenScale(themeColor, [700, 950, 1100, 1100]);
  return {
    radialColors: scale,
    radialStops: [0, 0.33, 0.66, 1],
    innerGlowColor: isWebAppIconColor(innerGlowColor) ? innerGlowColor : themeColor,
    artworkEffectColor: themeColor,
  };
}

function gradientMaterialTheme(
  radialColors: readonly string[],
  radialStops: readonly number[] | null | undefined,
  themeColor: string | null | undefined,
  innerGlowColor: string | null | undefined,
): WebAppIconMaterialTheme {
  const artworkEffectColor = isWebAppIconColor(themeColor)
    ? themeColor
    : radialColors[0];
  return {
    radialColors: [...radialColors],
    radialStops: hasValidStops(radialStops, radialColors.length)
      ? [...radialStops]
      : undefined,
    innerGlowColor: isWebAppIconColor(innerGlowColor)
      ? innerGlowColor
      : artworkEffectColor,
    artworkEffectColor,
  };
}

function createWebAppIconLayers(
  theme: WebAppIconMaterialTheme,
  iconSrc: string,
  partialFocusLighting: boolean,
): MaterialLayer[] {
  const glowStrokeLayer = createGlowStrokeLayer(
    state => state === VisualState.NONE ? 0 : 1,
  );
  glowStrokeLayer.supportsDiscretePartialFocus = !partialFocusLighting;
  return [
    new RadialGradientContainerMaterialLayer({
      id: 'web-app-icon-idle-material',
      sortOrder: 0,
      supportsDiscretePartialFocus: !partialFocusLighting,
      sizeMultiplier: FOCUSED_GRADIENT_SIZE,
      placementMultiplier: FOCUSED_GRADIENT_PLACEMENT,
      useInsetAdjustedHeight: true,
      stops: canvasGradientStops(theme),
      alphaForState: state => state === VisualState.NONE ? 0 : 1,
    }),
    new InnerShadowContainerMaterialLayer({
      id: 'web-app-icon-inner-shadow',
      sortOrder: 150,
      color: theme.innerGlowColor,
      blurRadius: 20,
      sigmaScale: 0.5,
      blendMode: 'screen',
      alphaForState: state => isFocusedOrPressed(state) ? 1 : 0,
    }),
    createNoiseMaterialLayer(),
    createPressedMaterialLayer(),
    glowStrokeLayer,
    ...(partialFocusLighting
      ? [new BlurredRadialGradientContainerMaterialLayer({
          id: 'web-app-icon-partial-focus-lighting',
          sortOrder: 900,
          alphaForState: state => isFocusedOrPressed(state) ? 1 : 0,
          supportsDiscretePartialFocus: true,
        })]
      : []),
    new WebAppIconArtworkContainerMaterialLayer({
      iconSrc,
      effectColor: theme.artworkEffectColor,
    }),
  ];
}

export function isWebAppIconMaterialFallback(
  options: Pick<WebAppIconMaterialOptions, 'iconSrc' | 'radialColors' | 'themeColor'>,
): boolean {
  return normalizeWebAppIconSource(options.iconSrc) == null || (
    !hasValidGradient(options.radialColors) &&
    !isWebAppIconColor(options.themeColor)
  );
}

/**
 * Creates the complete material used by {@link WebAppIcon}.
 *
 * Missing artwork or appearance colors select the standard web-app fallback.
 */
export function createWebAppIconMaterial(
  options: WebAppIconMaterialOptions = {},
): WebAppIconMaterialRendering {
  const normalizedIconSrc = normalizeWebAppIconSource(options.iconSrc);
  const radialColors = hasValidGradient(options.radialColors)
    ? options.radialColors
    : null;
  const themeColor = isWebAppIconColor(options.themeColor)
    ? options.themeColor
    : null;
  const isFallback = isWebAppIconMaterialFallback(options);
  const theme = isFallback
    ? WEB_APP_FALLBACK_MATERIAL_THEME
    : radialColors != null
      ? gradientMaterialTheme(
          radialColors,
          options.radialStops,
          themeColor,
          options.innerGlowColor,
        )
      : themedMaterialTheme(themeColor!, options.innerGlowColor);
  const iconSrc = isFallback
    ? WEB_APP_FALLBACK_ARTWORK
    : normalizedIconSrc ?? WEB_APP_FALLBACK_ARTWORK;
  return {
    material: new ContainerMaterial({
      layers: createWebAppIconLayers(
        theme,
        iconSrc,
        options.partialFocusLighting !== false,
      ),
    }),
    shapeProvider: WEB_APP_ICON_SHAPE_PROVIDER,
    isFallback,
  };
}
