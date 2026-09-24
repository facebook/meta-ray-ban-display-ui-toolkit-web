/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { BlurredRadialGradientContainerMaterialLayer, CornerRadius } from '@wearables-ui-toolkit/mrbd';
import {
  launcherIcons,
  createLauncherArtworkSource,
} from './appIcons';
import {
  SAMPLE_APP_TILE_THEMES,
  createLauncherWebAppIconMaterial,
} from './appTileMaterials';

function relativeLuminance(hexColor: string): number {
  const channels = hexColor
    .slice(1)
    .match(/.{2}/g)
    ?.map(channel => Number.parseInt(channel, 16) / 255);
  if (channels == null || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${hexColor}`);
  }

  const [red, green, blue] = channels.map(channel => (
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

describe('sample app tile themes', () => {
  it('creates self-contained launcher artwork with proportional optical placement', () => {
    const source = decodeURIComponent(
      createLauncherArtworkSource(launcherIcons.soundscape).split(',')[1] ?? '',
    );

    expect(source).not.toContain('<image');
    expect(source).not.toContain('/assets/');
    expect(source).toContain('x="4.48"');
    expect(source).toContain('y="5.76"');
    expect(source).toContain('width="52.48"');
    expect(source).toContain('height="52.48"');
    expect(source).toContain('<path');
  });

  it.each(Object.entries(launcherIcons))(
    '%s embeds its glyph inline and positions it on the root element',
    (_iconName, icon) => {
      const source = decodeURIComponent(
        createLauncherArtworkSource(icon).split(',')[1] ?? '',
      );
      const rootTags = source.match(/<svg\b[^>]*>/g) ?? [];

      // The wrapper plus the glyph's own root; the glyph must be inlined rather
      // than referenced, or it is dropped when the artwork is drawn as an image.
      expect(rootTags).toHaveLength(2);
      expect(source).not.toContain('<image');
      expect(source).not.toContain('/assets/');
      expect(source).toContain('<path');
      expect(source).not.toContain('NaN');

      const glyphTag = rootTags[1] ?? '';
      expect(glyphTag).toMatch(/\bx="[\d.]+"/);
      expect(glyphTag).toMatch(/\by="[\d.]+"/);
      expect(glyphTag).toMatch(/\bwidth="[\d.]+"/);
      expect(glyphTag).toMatch(/\bheight="[\d.]+"/);
    },
  );

  it('positions the glyph on the root element even when a child declares width', () => {
    const source = decodeURIComponent(
      createLauncherArtworkSource({
        // A root sized only by viewBox, with the first width on a child.
        src: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
          + '<rect width="24" height="24"/><path d="M0 0h1v1H0z"/></svg>',
        lightingRgb: '255 255 255',
        opticalScale: 0.5,
      }).split(',')[1] ?? '',
    );

    expect(source).toContain('<rect width="24" height="24"/>');
    expect(source).toMatch(
      /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24" x="16" y="16" width="32" height="32">/,
    );
  });

  it.each(Object.entries(SAMPLE_APP_TILE_THEMES))(
    '%s orders its gradient stops from brightest to darkest',
    (_themeName, theme) => {
      const luminances = theme.colors.map(relativeLuminance);
      for (let index = 1; index < luminances.length; index += 1) {
        expect(luminances[index]).toBeLessThan(luminances[index - 1]);
      }
    },
  );

  it.each(['notes', 'timer'] as const)(
    '%s keeps white labels readable over its brightest focused stops',
    themeName => {
      const theme = SAMPLE_APP_TILE_THEMES[themeName];
      for (const color of theme.colors.slice(0, 2)) {
        const contrastWithWhite = 1.05 / (relativeLuminance(color) + 0.05);
        expect(contrastWithWhite).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it('creates the WebAppIcon material used by the icon grid', () => {
    const rendering = createLauncherWebAppIconMaterial(
      'camera',
      'data:image/svg+xml,%3Csvg%2F%3E',
    );
    const layers = [
      ...rendering.material.getBackgroundLayers(),
      ...rendering.material.getForegroundLayers(),
    ];
    const focusLight = layers.find(
      layer => layer.id === 'web-app-icon-partial-focus-lighting',
    );
    const artwork = layers.find(layer => layer.id === 'web-app-icon-artwork');

    expect(rendering.isFallback).toBe(false);
    expect(rendering.shapeProvider.getCssBorderRadius?.())
      .toBe(`${CornerRadius.MEDIUM}px`);
    expect(focusLight).toBeInstanceOf(
      BlurredRadialGradientContainerMaterialLayer,
    );
    expect(focusLight?.supportsDiscretePartialFocus).toBe(true);
    // The artwork rides above the lighting as a foreground layer and, unlike the
    // light, stays put under partial focus.
    expect(rendering.material.getForegroundLayers()).toContain(artwork);
    expect(artwork?.supportsDiscretePartialFocus).toBe(false);
  });
});
