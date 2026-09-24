/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * DefaultContainerMaterial Layer Tests
 *
 * Tests the layer configuration, state alpha calculations, and glow stroke
 * width changes against this alpha table:
 *
 * | State    | idle | focused | noise | pressed | glow |
 * |----------|------|---------|-------|---------|------|
 * | NONE     |    0 |       0 |     0 |       0 |    0 |
 * | DEFAULT  |  255 |       0 |     0 |       0 |  153 |
 * | FOCUSED  |  255 |     255 |    77 |       0 |  178 |
 * | PRESSED  |  255 |     255 |    77 |     255 |  178 |
 */

import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { createDefaultContainerMaterial } from '@wearables-ui-toolkit/foundation/material/DefaultContainerMaterial';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { LayerPlacement } from '@wearables-ui-toolkit/foundation';
import { drawLayer, installOffscreenCanvasStub } from './helpers/canvasRecorder';

let restoreOffscreen: () => void;

beforeAll(() => {
  restoreOffscreen = installOffscreenCanvasStub();
});

afterAll(() => {
  restoreOffscreen();
});

const fakeNoise = { width: 25, height: 25 } as unknown as CanvasImageSource;

function getLayer(material: ReturnType<typeof MaterialLibrary.default>, id: string) {
  return [...material.getBackgroundLayers(), ...material.getForegroundLayers()]
    .find(l => l.id === id);
}

// Resolve a layer's effective alpha by recording its canvas draw: the resolved
// per-state alpha is the globalAlpha on its final paint op (a layer that paints
// nothing is fully transparent). This is the canvas-renderer equivalent of the
// old CSS render().opacity.
function getOpacity(material: ReturnType<typeof MaterialLibrary.default>, layerId: string, state: VisualState): number {
  const layer = getLayer(material, layerId);
  if (!layer) return -1;
  const rec = drawLayer(layer, { state, width: 100, height: 50, noise: fakeNoise });
  const paint = rec.paintOps;
  if (paint.length === 0) return 0;
  return paint[paint.length - 1].style?.globalAlpha ?? 1;
}

// The blend mode a layer composites with = the globalCompositeOperation on its
// final paint op.
function getBlend(
  material: ReturnType<typeof MaterialLibrary.default>,
  layerId: string,
  state: VisualState,
): string | undefined {
  const rec = drawLayer(getLayer(material, layerId)!, {
    state,
    width: 100,
    height: 50,
    noise: fakeNoise,
  });
  const paint = rec.paintOps;
  return paint[paint.length - 1]?.style?.globalCompositeOperation;
}

// ============================================================================
// Layer configuration
// ============================================================================

describe('DefaultContainerMaterial layer configuration', () => {
  it('creates all required layers', () => {
    const material = MaterialLibrary.default();
    const bgIds = material.getBackgroundLayers().map(l => l.id);
    expect(bgIds).toContain('idle-material');
    expect(bgIds).toContain('focused-material');
    expect(bgIds).toContain('inner-shadow');
    expect(bgIds).toContain('noise-material');
    expect(bgIds).toContain('pressed-material');
    expect(bgIds).toContain('glow-stroke');
  });

  it('has 6 background layers (no drop shadow by default)', () => {
    const material = MaterialLibrary.default();
    expect(material.getBackgroundLayers().length).toBe(6);
  });

  it('has 7 background layers with drop shadow', () => {
    const material = createDefaultContainerMaterial({ withDropShadow: true });
    expect(material.getBackgroundLayers().length).toBe(7);
    const bgIds = material.getBackgroundLayers().map(l => l.id);
    expect(bgIds).toContain('drop-shadow');
  });

  it('all layers have BACKGROUND placement', () => {
    const material = MaterialLibrary.default();
    for (const layer of material.getBackgroundLayers()) {
      expect(layer.placement).toBe(LayerPlacement.BACKGROUND);
    }
  });

  it('layers are sorted by sortOrder', () => {
    const material = MaterialLibrary.default();
    const layers = material.getBackgroundLayers();
    for (let i = 1; i < layers.length; i++) {
      expect(layers[i].sortOrder).toBeGreaterThanOrEqual(layers[i - 1].sortOrder);
    }
  });
});

// ============================================================================
// State alpha calculations
// ============================================================================

describe('DefaultContainerMaterial idle layer alpha per state', () => {
  it('NONE → opacity 0', () => {
    expect(getOpacity(MaterialLibrary.default(), 'idle-material', VisualState.NONE)).toBe(0);
  });

  it('DEFAULT → opacity 1 (alpha 255)', () => {
    expect(getOpacity(MaterialLibrary.default(), 'idle-material', VisualState.DEFAULT)).toBe(1);
  });

  it('FOCUSED → opacity 1 (alpha 255)', () => {
    expect(getOpacity(MaterialLibrary.default(), 'idle-material', VisualState.FOCUSED)).toBe(1);
  });

  it('PRESSED → opacity 1 (alpha 255)', () => {
    expect(getOpacity(MaterialLibrary.default(), 'idle-material', VisualState.PRESSED)).toBe(1);
  });
});

describe('DefaultContainerMaterial focused layer alpha per state', () => {
  it('NONE → opacity 0', () => {
    expect(getOpacity(MaterialLibrary.default(), 'focused-material', VisualState.NONE)).toBe(0);
  });

  it('DEFAULT → opacity 0', () => {
    expect(getOpacity(MaterialLibrary.default(), 'focused-material', VisualState.DEFAULT)).toBe(0);
  });

  it('FOCUSED → opacity 1 (alpha 255)', () => {
    expect(getOpacity(MaterialLibrary.default(), 'focused-material', VisualState.FOCUSED)).toBe(1);
  });

  it('PRESSED → opacity 1 (alpha 255)', () => {
    expect(getOpacity(MaterialLibrary.default(), 'focused-material', VisualState.PRESSED)).toBe(1);
  });
});

describe('DefaultContainerMaterial noise layer alpha per state', () => {
  const NOISE_ALPHA = 77 / 255; // focusedGlowFillAlpha * 0.3 = 255 * 0.3 = 77

  it('NONE → opacity 0', () => {
    expect(getOpacity(MaterialLibrary.default(), 'noise-material', VisualState.NONE)).toBe(0);
  });

  it('DEFAULT → opacity 0', () => {
    expect(getOpacity(MaterialLibrary.default(), 'noise-material', VisualState.DEFAULT)).toBe(0);
  });

  it('FOCUSED → opacity matches (255 * 0.3) / 255', () => {
    expect(getOpacity(MaterialLibrary.default(), 'noise-material', VisualState.FOCUSED)).toBeCloseTo(NOISE_ALPHA, 2);
  });

  it('PRESSED → opacity matches (255 * 0.3) / 255', () => {
    expect(getOpacity(MaterialLibrary.default(), 'noise-material', VisualState.PRESSED)).toBeCloseTo(NOISE_ALPHA, 2);
  });
});

describe('DefaultContainerMaterial pressed layer alpha per state', () => {
  it('NONE → opacity 0', () => {
    expect(getOpacity(MaterialLibrary.default(), 'pressed-material', VisualState.NONE)).toBe(0);
  });

  it('DEFAULT → opacity 0', () => {
    expect(getOpacity(MaterialLibrary.default(), 'pressed-material', VisualState.DEFAULT)).toBe(0);
  });

  it('FOCUSED → opacity 0', () => {
    expect(getOpacity(MaterialLibrary.default(), 'pressed-material', VisualState.FOCUSED)).toBe(0);
  });

  it('PRESSED → opacity 1 (alpha 255)', () => {
    expect(getOpacity(MaterialLibrary.default(), 'pressed-material', VisualState.PRESSED)).toBe(1);
  });
});

describe('DefaultContainerMaterial glow stroke alpha per state', () => {
  it('NONE → opacity 0', () => {
    expect(getOpacity(MaterialLibrary.default(), 'glow-stroke', VisualState.NONE)).toBe(0);
  });

  it('DEFAULT → opacity 60% (alpha 153/255)', () => {
    expect(getOpacity(MaterialLibrary.default(), 'glow-stroke', VisualState.DEFAULT)).toBeCloseTo(153 / 255, 2);
  });

  it('FOCUSED → opacity 70% (alpha 178/255)', () => {
    expect(getOpacity(MaterialLibrary.default(), 'glow-stroke', VisualState.FOCUSED)).toBeCloseTo(178 / 255, 2);
  });

  it('PRESSED → opacity 70% (alpha 178/255)', () => {
    expect(getOpacity(MaterialLibrary.default(), 'glow-stroke', VisualState.PRESSED)).toBeCloseTo(178 / 255, 2);
  });

  it('can hide the glow only in selected states', () => {
    const material = MaterialLibrary.default({
      hideGlowForStates: [VisualState.DEFAULT],
    });

    expect(getOpacity(material, 'idle-material', VisualState.DEFAULT)).toBe(1);
    expect(getOpacity(material, 'glow-stroke', VisualState.DEFAULT)).toBe(0);
    expect(getOpacity(material, 'glow-stroke', VisualState.FOCUSED)).toBeCloseTo(178 / 255, 2);
  });
});

describe('ContextMenuItem material hides the default layer', () => {
  it('hides the idle material in every state', () => {
    const material = MaterialLibrary.contextMenuItem();

    expect(getOpacity(material, 'idle-material', VisualState.NONE)).toBe(0);
    expect(getOpacity(material, 'idle-material', VisualState.DEFAULT)).toBe(0);
    expect(getOpacity(material, 'idle-material', VisualState.FOCUSED)).toBe(0);
    expect(getOpacity(material, 'idle-material', VisualState.PRESSED)).toBe(0);
  });

  it('keeps the glow stroke hidden at rest and visible when focused', () => {
    const material = MaterialLibrary.contextMenuItem();

    expect(getOpacity(material, 'glow-stroke', VisualState.DEFAULT)).toBe(0);
    expect(getOpacity(material, 'glow-stroke', VisualState.FOCUSED)).toBeCloseTo(178 / 255, 2);
  });
});

// ============================================================================
// Glow stroke canvas rendering per state
// ============================================================================

describe('DefaultContainerMaterial glow stroke canvas rendering per state', () => {
  it('DEFAULT composites a stroke with overlay blend', () => {
    const rec = drawLayer(getLayer(MaterialLibrary.default(), 'glow-stroke')!, {
      state: VisualState.DEFAULT,
      width: 100,
      height: 50,
    });
    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some(op => op.style?.globalCompositeOperation === 'overlay')).toBe(true);
  });

  it('FOCUSED composites a stroke', () => {
    const rec = drawLayer(getLayer(MaterialLibrary.default(), 'glow-stroke')!, {
      state: VisualState.FOCUSED,
      width: 100,
      height: 50,
    });
    expect(rec.ofType('drawImage').length).toBeGreaterThan(0);
  });

  it('NONE draws nothing (alpha 0)', () => {
    const rec = drawLayer(getLayer(MaterialLibrary.default(), 'glow-stroke')!, {
      state: VisualState.NONE,
      width: 100,
      height: 50,
    });
    expect(rec.has('drawImage', 'stroke')).toBe(false);
  });

  it('still composites with overlay mid focus transition', () => {
    const rec = drawLayer(getLayer(MaterialLibrary.default(), 'glow-stroke')!, {
      state: VisualState.FOCUSED,
      width: 100,
      height: 50,
      transition: {
        from: VisualState.DEFAULT,
        to: VisualState.FOCUSED,
        progress: 0.5,
      },
    });
    const composite = rec.ofType('drawImage');
    expect(composite.some(op => op.style?.globalCompositeOperation === 'overlay')).toBe(true);
  });
});

describe('PanelMaterial scrim canvas behavior', () => {
  it('fills a linear-gradient rectangle without clipping to the rounded shape', () => {
    const rec = drawLayer(getLayer(MaterialLibrary.panel(), 'panel-scrim')!, {
      state: VisualState.DEFAULT,
      width: 200,
      height: 120,
    });
    expect(rec.gradients.some(g => g.kind === 'linear')).toBe(true);
    expect(rec.has('fillRect')).toBe(true);
    expect(rec.has('clip')).toBe(false);
  });

  it('keeps the scrim drawing identically during a focus transition (no per-state fade)', () => {
    const layer = getLayer(MaterialLibrary.panel(), 'panel-scrim')!;
    const steady = drawLayer(layer, {
      state: VisualState.DEFAULT,
      width: 200,
      height: 120,
    });
    const transition = drawLayer(layer, {
      state: VisualState.FOCUSED,
      width: 200,
      height: 120,
      transition: {
        from: VisualState.DEFAULT,
        to: VisualState.FOCUSED,
        progress: 0.5,
      },
    });
    // The scrim ignores state, so it issues the same op sequence either way.
    expect(transition.calls.map(c => c.type)).toEqual(steady.calls.map(c => c.type));
    expect(transition.ofType('fillRect')[0]?.style?.globalAlpha).toBe(1);
  });
});

// ============================================================================
// Blend modes per layer
// ============================================================================

describe('DefaultContainerMaterial blend modes', () => {
  it('idle-material uses source-over', () => {
    expect(getBlend(MaterialLibrary.default(), 'idle-material', VisualState.DEFAULT)).toBe('source-over');
  });

  it('focused-material uses source-over', () => {
    expect(getBlend(MaterialLibrary.default(), 'focused-material', VisualState.FOCUSED)).toBe('source-over');
  });

  it('inner-shadow: SCREEN blend', () => {
    expect(getBlend(MaterialLibrary.default(), 'inner-shadow', VisualState.FOCUSED)).toBe('screen');
  });

  it('noise-material: OVERLAY blend', () => {
    expect(getBlend(MaterialLibrary.default(), 'noise-material', VisualState.FOCUSED)).toBe('overlay');
  });

  it('glow-stroke: OVERLAY blend', () => {
    expect(getBlend(MaterialLibrary.default(), 'glow-stroke', VisualState.DEFAULT)).toBe('overlay');
  });
});

// ============================================================================
// Full alpha table verification (master test)
// Repeated state changes maintain layer alpha consistency
// ============================================================================

describe('DefaultContainerMaterial full alpha table', () => {
  const alphaTable: Record<string, Record<string, number>> = {
    'idle-material': { NONE: 0, DEFAULT: 1, FOCUSED: 1, PRESSED: 1 },
    'focused-material': { NONE: 0, DEFAULT: 0, FOCUSED: 1, PRESSED: 1 },
    'inner-shadow': { NONE: 0, DEFAULT: 0, FOCUSED: 1, PRESSED: 1 },
    'noise-material': { NONE: 0, DEFAULT: 0, FOCUSED: 77 / 255, PRESSED: 77 / 255 },
    'pressed-material': { NONE: 0, DEFAULT: 0, FOCUSED: 0, PRESSED: 1 },
    'glow-stroke': { NONE: 0, DEFAULT: 153 / 255, FOCUSED: 178 / 255, PRESSED: 178 / 255 },
  };

  for (const [layerId, stateAlphas] of Object.entries(alphaTable)) {
    for (const [stateName, expectedAlpha] of Object.entries(stateAlphas)) {
      it(`${layerId} at ${stateName} → opacity ${expectedAlpha.toFixed(3)}`, () => {
        const state = VisualState[stateName as keyof typeof VisualState];
        const actual = getOpacity(MaterialLibrary.default(), layerId, state);
        expect(actual).toBeCloseTo(expectedAlpha, 2);
      });
    }
  }
});

// ============================================================================
// Rapid state transitions maintain consistency
// ============================================================================

describe('DefaultContainerMaterial rapid state transitions', () => {
  it('100 sequential transitions cycling through all states maintain correct alphas', () => {
    const material = MaterialLibrary.default();
    const states = [VisualState.NONE, VisualState.DEFAULT, VisualState.FOCUSED, VisualState.PRESSED];

    for (let i = 0; i < 100; i++) {
      const state = states[i % 4];
      material.setState(state, false);
      expect(material.getCurrentState()).toBe(state);
    }
  });
});

// ============================================================================
// Card material layer tests
// ============================================================================

describe('CardContainerMaterial layer configuration', () => {
  it('has 1 background layer (idle solid color)', () => {
    const material = MaterialLibrary.card();
    expect(material.getBackgroundLayers().length).toBe(1);
    expect(material.getBackgroundLayers()[0].id).toBe('card-idle');
  });

  it('has 4 foreground layers', () => {
    const material = MaterialLibrary.card();
    const fgIds = material.getForegroundLayers().map(l => l.id);
    expect(fgIds).toContain('card-press');
    expect(fgIds).toContain('card-idle-border');
    expect(fgIds).toContain('card-back-glow');
    expect(fgIds).toContain('card-front-glow');
  });

  it('card-idle-border strokes only in DEFAULT state', () => {
    const material = MaterialLibrary.card();
    const layer = getLayer(material, 'card-idle-border')!;
    const defaultRec = drawLayer(layer, {
      state: VisualState.DEFAULT,
      width: 200,
      height: 300,
    });
    expect(defaultRec.has('stroke')).toBe(true);
    const focusedRec = drawLayer(layer, {
      state: VisualState.FOCUSED,
      width: 200,
      height: 300,
    });
    expect(focusedRec.has('stroke')).toBe(false);
  });

  it('card-idle fills the surface during a focus transition (no fade)', () => {
    const material = MaterialLibrary.card();
    const layer = getLayer(material, 'card-idle')!;
    const rec = drawLayer(layer, {
      state: VisualState.FOCUSED,
      width: 200,
      height: 300,
      transition: {
        from: VisualState.DEFAULT,
        to: VisualState.FOCUSED,
        progress: 0.5,
      },
    });
    const fills = rec.ofType('fill');
    expect(fills).toHaveLength(1);
    // Idle is 1 in both DEFAULT and FOCUSED, so it stays fully opaque.
    expect(fills[0].style?.globalAlpha).toBe(1);
  });

  it('card-back-glow strokes with hard-light blend when FOCUSED', () => {
    const material = MaterialLibrary.card();
    const layer = getLayer(material, 'card-back-glow')!;
    const rec = drawLayer(layer, {
      state: VisualState.FOCUSED,
      width: 200,
      height: 300,
    });
    const strokes = rec.ofType('stroke');
    expect(strokes).toHaveLength(1);
    expect(strokes[0].style?.globalCompositeOperation).toBe('hard-light');
  });

  it('card-front-glow composites a hard-light gradient stroke when FOCUSED', () => {
    const material = MaterialLibrary.card();
    const layer = getLayer(material, 'card-front-glow')!;
    const rec = drawLayer(layer, {
      state: VisualState.FOCUSED,
      width: 200,
      height: 300,
    });
    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some(op => op.style?.globalCompositeOperation === 'hard-light')).toBe(true);
  });

});
