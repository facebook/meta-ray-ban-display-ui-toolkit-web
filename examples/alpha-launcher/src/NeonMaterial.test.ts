/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ContainerMaterialLayer,
  MaterialLibrary,
  VisualState,
} from '@wearables-ui-toolkit/mrbd';
import {
  createNeonMaterial,
  NEON_BOTTOM_BORDER_STOPS,
  NEON_BORDER_COLOR,
  NEON_BORDER_STOPS,
  NEON_BORDER_WIDTH,
  NEON_FOCUSED_GRADIENT_STOPS,
  NEON_INNER_GLOW_BLUR_RADIUS,
  NEON_INNER_GLOW_COLOR,
  NEON_RADIAL_PLACEMENT,
  NEON_RADIAL_SIZE,
} from './NeonMaterial';

describe('NeonMaterial', () => {
  it('uses the default layer contract with the Neon focused treatment', () => {
    const defaultMaterial = MaterialLibrary.button();
    const neonMaterial = createNeonMaterial();
    const layerIds = (material: typeof neonMaterial) => [
      ...material.getBackgroundLayers(),
      ...material.getForegroundLayers(),
    ].map(layer => layer.id);

    expect(layerIds(neonMaterial)).toEqual([
      ...layerIds(defaultMaterial),
      'neon-bottom-stroke',
    ]);
    expect(NEON_FOCUSED_GRADIENT_STOPS).toEqual([
      { offset: 0, color: '#624654' },
      { offset: 0.25, color: '#4B3742' },
      { offset: 0.5, color: '#342830' },
      { offset: 0.75, color: '#1E191E' },
      { offset: 0.875, color: '#121115' },
      { offset: 1, color: '#07090C' },
    ]);
    expect(NEON_RADIAL_SIZE).toEqual({ x: 0.68178, y: 1.04844 });
    expect(NEON_RADIAL_PLACEMENT).toEqual({ x: 0.43218, y: 0 });
    expect(NEON_INNER_GLOW_COLOR).toBe('rgba(112, 92, 107, 0.56)');
    expect(NEON_INNER_GLOW_BLUR_RADIUS).toBe(16);
    expect(NEON_BORDER_COLOR).toBe('#E7E2D9');
    expect(NEON_BORDER_WIDTH).toBe(2);
    expect(NEON_BORDER_STOPS).toEqual([
      { offset: 0, color: 'rgba(231, 226, 217, 0.8)' },
      { offset: 0.125, color: 'rgba(231, 226, 217, 0.56)' },
      { offset: 0.8, color: 'rgba(231, 226, 217, 0)' },
    ]);
    expect(NEON_BOTTOM_BORDER_STOPS).toEqual([
      { offset: 0, color: 'rgba(231, 226, 217, 0)' },
      { offset: 0.65, color: 'rgba(231, 226, 217, 0)' },
      { offset: 1, color: 'rgba(231, 226, 217, 0.3)' },
    ]);
  });

  it('shows the Neon layers only while focused or pressed', () => {
    const layers = createNeonMaterial().getBackgroundLayers();
    const focusedLayers = [
      layers.find(layer => layer.id === 'focused-material'),
      layers.find(layer => layer.id === 'inner-shadow'),
      layers.find(layer => layer.id === 'glow-stroke'),
      layers.find(layer => layer.id === 'neon-bottom-stroke'),
    ];

    focusedLayers.forEach(layer => {
      expect(layer).toBeInstanceOf(ContainerMaterialLayer);
      const neonLayer = layer as ContainerMaterialLayer;
      expect(neonLayer.isVisibleForState(VisualState.NONE)).toBe(false);
      expect(neonLayer.isVisibleForState(VisualState.DEFAULT)).toBe(false);
      expect(neonLayer.isVisibleForState(VisualState.FOCUSED)).toBe(true);
      expect(neonLayer.isVisibleForState(VisualState.PRESSED)).toBe(true);
    });
  });
});
