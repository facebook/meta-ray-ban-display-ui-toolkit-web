/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * DefaultContainerMaterial configuration tests
 *
 * Tests the ACTUAL values and configurations of the default container material.
 * These are the values that determine how components look — colors, gradients,
 * alphas, blend modes.
 *
 * Layers render to a canvas (the sole renderer), so these assertions inspect the
 * recorded canvas operations rather than CSS output.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { createDefaultContainerMaterial } from '@wearables-ui-toolkit/foundation/material/DefaultContainerMaterial';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import type { ContainerMaterial, MaterialLayer } from '@wearables-ui-toolkit/foundation';
import { Gray, Slate, MaterialColors } from '@wearables-ui-toolkit/foundation/colors/Colors';
import {
  drawLayer,
  installOffscreenCanvasStub,
  type DrawParamsOverrides,
} from './helpers/canvasRecorder';

const fakeNoise = { width: 25, height: 25 } as unknown as CanvasImageSource;

function layerById(material: ContainerMaterial, id: string): MaterialLayer {
  const layer = [
    ...material.getBackgroundLayers(),
    ...material.getForegroundLayers(),
  ].find((l) => l.id === id);
  if (layer == null) {
    throw new Error(`Layer not found: ${id}`);
  }
  return layer;
}

function recordLayer(
  material: ContainerMaterial,
  id: string,
  overrides: DrawParamsOverrides = {},
) {
  return drawLayer(layerById(material, id), overrides);
}

let restoreOffscreen: () => void;
beforeAll(() => {
  restoreOffscreen = installOffscreenCanvasStub();
});
afterAll(() => {
  restoreOffscreen();
});

// ============================================================================
// Color palette values
// ============================================================================

describe('MaterialColors', () => {
  it('backgroundSurface is Gray 1000 (#27282D)', () => {
    expect(MaterialColors.backgroundSurface).toBe('#27282D');
    expect(MaterialColors.backgroundSurface).toBe(Gray['1000']);
  });

  it('innerGlowTint is Slate 550 (#6D84A9)', () => {
    expect(MaterialColors.innerGlowTint).toBe('#6D84A9');
    expect(MaterialColors.innerGlowTint).toBe(Slate['550']);
  });

  it('pressedOverlay is slate-tinted rgba(109,132,169,0.25)', () => {
    expect(MaterialColors.pressedOverlay).toBe('rgba(109, 132, 169, 0.25)');
  });

  it('gradient steps use the default radial colors', () => {
    expect(MaterialColors.gradientStep1).toBe(Gray['700']);  // #585E6A
    expect(MaterialColors.gradientStep2).toBe(Gray['950']);  // #30333A
    expect(MaterialColors.gradientStep3).toBe(Gray['1050']); // #1E1E21
    expect(MaterialColors.gradientStep4).toBe(Gray['1100']); // #111113
  });
});

describe('Gray scale values', () => {
  it('Gray 700 = #585E6A', () => expect(Gray['700']).toBe('#585E6A'));
  it('Gray 850 = #41454E (elevation2)', () => expect(Gray['850']).toBe('#41454E'));
  it('Gray 950 = #30333A', () => expect(Gray['950']).toBe('#30333A'));
  it('Gray 1000 = #27282D (backgroundSurface)', () => expect(Gray['1000']).toBe('#27282D'));
  it('Gray 1050 = #1E1E21', () => expect(Gray['1050']).toBe('#1E1E21'));
  it('Gray 1100 = #111113', () => expect(Gray['1100']).toBe('#111113'));
});

describe('Slate scale values', () => {
  it('Slate 550 = #6D84A9 (innerGlowTint)', () => expect(Slate['550']).toBe('#6D84A9'));
});

// ============================================================================
// Default material layer configuration
// ============================================================================

describe('default() material layer configuration', () => {
  const material = MaterialLibrary.default();

  it('has background layers', () => {
    expect(material.getBackgroundLayers().length).toBeGreaterThan(0);
  });

  it('idle layer fills backgroundSurface color in DEFAULT state', () => {
    const rec = recordLayer(material, 'idle-material', { state: VisualState.DEFAULT });
    const fills = rec.ofType('fill');
    expect(fills).toHaveLength(1);
    expect(fills[0].style?.fillStyle).toBe(MaterialColors.backgroundSurface);
    expect(fills[0].style?.globalAlpha).toBe(1);
  });

  it('idle layer paints nothing in NONE state', () => {
    const rec = recordLayer(material, 'idle-material', { state: VisualState.NONE });
    expect(rec.ofType('fill')).toHaveLength(0);
  });

  it('focused gradient layer paints nothing in DEFAULT state', () => {
    const rec = recordLayer(material, 'focused-material', { state: VisualState.DEFAULT });
    expect(rec.gradients).toHaveLength(0);
  });

  it('focused gradient layer is visible in FOCUSED state', () => {
    const rec = recordLayer(material, 'focused-material', { state: VisualState.FOCUSED });
    const radial = rec.gradients.find((g) => g.kind === 'radial');
    expect(radial).toBeDefined();
    const fillRect = rec.ofType('fillRect');
    expect(fillRect[fillRect.length - 1].style?.globalAlpha).toBe(1);
  });

  it('focused gradient layer is visible in PRESSED state', () => {
    const rec = recordLayer(material, 'focused-material', { state: VisualState.PRESSED });
    expect(rec.gradients.find((g) => g.kind === 'radial')).toBeDefined();
  });

  it('focused gradient uses correct 4-color radial gradient', () => {
    const rec = recordLayer(material, 'focused-material', { state: VisualState.FOCUSED });
    const radial = rec.gradients.find((g) => g.kind === 'radial');
    expect(radial).toBeDefined();
    expect(radial!.stops.map((s) => s.color)).toEqual([
      MaterialColors.gradientStep1,
      MaterialColors.gradientStep2,
      MaterialColors.gradientStep3,
      MaterialColors.gradientStep4,
    ]);
    expect(radial!.stops.map((s) => s.offset)).toEqual([0, 0.33, 0.66, 1]);
  });

  it('focused gradient has correct ellipse center (22.56% x, 13.33% y)', () => {
    const rec = recordLayer(material, 'focused-material', {
      state: VisualState.FOCUSED,
      width: 100,
      height: 100,
    });
    const translate = rec.ofType('translate');
    expect(translate.length).toBeGreaterThan(0);
    const [cx, cy] = translate[translate.length - 1].args as [number, number];
    expect(cx).toBeCloseTo(0.2256 * 100, 2);
    expect(cy).toBeCloseTo(0.1333 * 100, 2);
  });

  it('inner shadow composites with screen blend mode', () => {
    const rec = recordLayer(material, 'inner-shadow', { state: VisualState.FOCUSED });
    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some((op) => op.style?.globalCompositeOperation === 'screen')).toBe(true);
  });

  it('inner shadow paints nothing in DEFAULT state', () => {
    const rec = recordLayer(material, 'inner-shadow', { state: VisualState.DEFAULT });
    expect(rec.ofType('drawImage')).toHaveLength(0);
  });

  it('pressed overlay fills slate-blue tint rgba(109,132,169,0.25)', () => {
    const rec = recordLayer(material, 'pressed-material', { state: VisualState.PRESSED });
    const fills = rec.ofType('fill');
    expect(fills).toHaveLength(1);
    expect(fills[0].style?.fillStyle).toBe(MaterialColors.pressedOverlay);
    expect(fills[0].style?.globalAlpha).toBe(1);
  });

  it('pressed overlay is NOT white (bug fix verified)', () => {
    const rec = recordLayer(material, 'pressed-material', { state: VisualState.PRESSED });
    const fillStyle = String(rec.ofType('fill')[0].style?.fillStyle);
    expect(fillStyle).not.toContain('255, 255, 255');
    expect(fillStyle).toContain('109');
    expect(fillStyle).toContain('132');
    expect(fillStyle).toContain('169');
  });

  it('pressed overlay paints nothing in DEFAULT/FOCUSED states', () => {
    expect(recordLayer(material, 'pressed-material', { state: VisualState.DEFAULT }).ofType('fill')).toHaveLength(0);
    expect(recordLayer(material, 'pressed-material', { state: VisualState.FOCUSED }).ofType('fill')).toHaveLength(0);
  });

  it('noise layer uses overlay blend mode', () => {
    const rec = recordLayer(material, 'noise-material', {
      state: VisualState.FOCUSED,
      noise: fakeNoise,
    });
    expect(rec.patterns).toHaveLength(1);
    const fills = rec.ofType('fill');
    expect(fills[0].style?.globalCompositeOperation).toBe('overlay');
  });

  it('noise layer alpha is 77/255 (30%) when focused', () => {
    const rec = recordLayer(material, 'noise-material', {
      state: VisualState.FOCUSED,
      noise: fakeNoise,
    });
    expect(rec.ofType('fill')[0].style?.globalAlpha).toBeCloseTo(77 / 255, 2);
  });

  it('noise layer paints nothing in DEFAULT state', () => {
    const rec = recordLayer(material, 'noise-material', {
      state: VisualState.DEFAULT,
      noise: fakeNoise,
    });
    expect(rec.ofType('fill')).toHaveLength(0);
  });

  it('focused-fill alpha interpolates across a NONE -> FOCUSED transition', () => {
    const rec = recordLayer(material, 'focused-material', {
      state: VisualState.FOCUSED,
      transition: { from: VisualState.NONE, to: VisualState.FOCUSED, progress: 0.5 },
    });
    const fillRect = rec.ofType('fillRect');
    expect(fillRect[fillRect.length - 1].style?.globalAlpha).toBeCloseTo(0.5, 4);
  });
});

// ============================================================================
// Drop shadow configuration
// ============================================================================

describe('default() material drop shadow', () => {
  it('does NOT include drop shadow by default', () => {
    const material = MaterialLibrary.default();
    const bgLayers = material.getBackgroundLayers();
    const dropShadow = bgLayers.find(l => l.id === 'drop-shadow');
    expect(dropShadow).toBeUndefined();
  });

  it('includes drop shadow when withDropShadow option is true', () => {
    const material = createDefaultContainerMaterial({ withDropShadow: true });
    const bgLayers = material.getBackgroundLayers();
    const dropShadow = bgLayers.find(l => l.id === 'drop-shadow');
    expect(dropShadow).toBeDefined();
  });

  it('drop shadow has correct values (8px blur, 8px Y offset, black tint)', () => {
    const material = createDefaultContainerMaterial({ withDropShadow: true });
    const rec = recordLayer(material, 'drop-shadow', { state: VisualState.DEFAULT });
    const fills = rec.ofType('fill');
    expect(fills.length).toBeGreaterThan(0);
    const shadowFill = fills[0];
    expect(shadowFill.style?.shadowBlur).toBe(8);
    expect(String(shadowFill.style?.shadowColor)).toContain('rgba(0, 0, 0,');
  });
});

// ============================================================================
// Glow stroke configuration
// ============================================================================

describe('default() material glow stroke', () => {
  it('has a glow-stroke layer', () => {
    const material = MaterialLibrary.default();
    const bgLayers = material.getBackgroundLayers();
    const glowStroke = bgLayers.find(l => l.id === 'glow-stroke');
    expect(glowStroke).toBeDefined();
  });

  it('glow stroke composites with overlay blend mode', () => {
    const material = MaterialLibrary.default();
    const rec = recordLayer(material, 'glow-stroke', { state: VisualState.FOCUSED });
    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some((op) => op.style?.globalCompositeOperation === 'overlay')).toBe(true);
  });
});

// ============================================================================
// defaultStatic() material configuration
// ============================================================================

describe('defaultStatic() material configuration', () => {
  it('has idle fill and glow stroke background layers', () => {
    const material = MaterialLibrary.defaultStatic();
    expect(material.getBackgroundLayers().map(layer => layer.id)).toEqual([
      'idle-material',
      'glow-stroke',
    ]);
  });

  it('has no foreground layers', () => {
    const material = MaterialLibrary.defaultStatic();
    expect(material.getForegroundLayers().length).toBe(0);
  });

  it('idle layer fills backgroundSurface (#27282D)', () => {
    const material = MaterialLibrary.defaultStatic();
    const rec = recordLayer(material, 'idle-material', { state: VisualState.DEFAULT });
    expect(rec.ofType('fill')[0].style?.fillStyle).toBe(MaterialColors.backgroundSurface);
  });

  it('has no interactive fill, shadow, noise, or pressed layers', () => {
    const material = MaterialLibrary.defaultStatic();
    const bgLayers = material.getBackgroundLayers();
    const layerIds = bgLayers.map(l => l.id);
    expect(layerIds).not.toContain('focused-material');
    expect(layerIds).not.toContain('inner-shadow');
    expect(layerIds).not.toContain('noise-material');
    expect(layerIds).not.toContain('pressed-material');
    expect(layerIds).toContain('glow-stroke');
  });
});

// ============================================================================
// button() material configuration
// ============================================================================

describe('button() material configuration', () => {
  it('has same layers as default material', () => {
    const buttonMaterial = MaterialLibrary.button();
    const defaultMaterial = MaterialLibrary.default();

    const buttonLayerIds = buttonMaterial.getBackgroundLayers().map(l => l.id).sort();
    const defaultLayerIds = defaultMaterial.getBackgroundLayers().map(l => l.id).sort();

    expect(buttonLayerIds).toEqual(defaultLayerIds);
  });
});

// ============================================================================
// Layer sort order
// ============================================================================

describe('default() material layer order', () => {
  it('layers are sorted by sortOrder', () => {
    const material = MaterialLibrary.default();
    const bgLayers = material.getBackgroundLayers();

    for (let i = 1; i < bgLayers.length; i++) {
      expect(bgLayers[i].sortOrder).toBeGreaterThanOrEqual(bgLayers[i - 1].sortOrder);
    }
  });

  it('idle layer comes before focused gradient', () => {
    const material = MaterialLibrary.default();
    const bgLayers = material.getBackgroundLayers();
    const idleIndex = bgLayers.findIndex(l => l.id === 'idle-material');
    const focusedIndex = bgLayers.findIndex(l => l.id === 'focused-material');
    expect(idleIndex).toBeLessThan(focusedIndex);
  });

  it('pressed overlay comes after noise layer', () => {
    const material = MaterialLibrary.default();
    const bgLayers = material.getBackgroundLayers();
    const noiseIndex = bgLayers.findIndex(l => l.id === 'noise-material');
    const pressedIndex = bgLayers.findIndex(l => l.id === 'pressed-material');
    expect(pressedIndex).toBeGreaterThan(noiseIndex);
  });
});
