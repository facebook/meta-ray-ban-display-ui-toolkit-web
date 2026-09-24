/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Material Layer Canvas Rendering Tests
 *
 * Each material layer draws one visual effect onto a 2D canvas via drawCanvas().
 * These tests record the drawing operations a layer issues and assert MEANINGFUL
 * behavior — which op runs (fill / stroke / gradient), the resolved color, the
 * blend mode, the alpha, the gradient color stops, and whether the layer draws at
 * all for a given state — rather than exact numeric coordinates (which are brittle
 * and were the bulk of the old SVG-string suite). lerpState interpolation during
 * a state transition is also covered.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { MaterialColors, Overlay } from '@wearables-ui-toolkit/foundation/colors/Colors';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import type {
  ContainerMaterial,
  MaterialLayer,
} from '@wearables-ui-toolkit/foundation';
import {
  BlurredRadialGradientContainerMaterialLayer,
  InnerShadowContainerMaterialLayer,
} from '@wearables-ui-toolkit/foundation/material/layers';
import {
  CanvasRecorder,
  drawLayer,
  installOffscreenCanvasStub,
  type DrawParamsOverrides,
} from './helpers/canvasRecorder';

let restoreOffscreen: () => void;

beforeAll(() => {
  restoreOffscreen = installOffscreenCanvasStub();
});

afterAll(() => {
  restoreOffscreen();
});

function getLayer(material: ContainerMaterial, id: string): MaterialLayer {
  const layer = [
    ...material.getBackgroundLayers(),
    ...material.getForegroundLayers(),
  ].find(item => item.id === id);
  if (layer == null) {
    throw new Error(`Layer not found: ${id}`);
  }
  return layer;
}

function record(
  material: ContainerMaterial,
  layerId: string,
  overrides: DrawParamsOverrides = {},
): CanvasRecorder {
  return drawLayer(getLayer(material, layerId), overrides);
}

/** A noise-texture stand-in so the noise layer can build a pattern. */
const fakeNoise = {
  naturalWidth: 50,
  naturalHeight: 50,
} as unknown as CanvasImageSource;

// ============================================================================
// Default material idle layer
// ============================================================================

describe('Default material idle-material canvas rendering', () => {
  it('fills the shape with the background surface color at full alpha in DEFAULT', () => {
    const rec = record(MaterialLibrary.default(), 'idle-material', {
      state: VisualState.DEFAULT,
    });

    const fills = rec.ofType('fill');
    expect(fills).toHaveLength(1);
    expect(fills[0].style?.fillStyle).toBe(MaterialColors.backgroundSurface);
    expect(fills[0].style?.globalAlpha).toBe(1);
  });

  it('draws nothing in NONE state (alpha 0, early return)', () => {
    const rec = record(MaterialLibrary.default(), 'idle-material', {
      state: VisualState.NONE,
    });
    expect(rec.has('fill', 'fillRect', 'stroke', 'drawImage')).toBe(false);
  });
});

// ============================================================================
// Default material focused (radial gradient) layer
// ============================================================================

describe('Default material focused-material canvas rendering', () => {
  it('creates a radial gradient with the 4 color stops when FOCUSED', () => {
    const rec = record(MaterialLibrary.default(), 'focused-material', {
      state: VisualState.FOCUSED,
    });

    const radial = rec.gradients.find(g => g.kind === 'radial');
    expect(radial).toBeDefined();
    expect(radial!.stops.map(s => s.color)).toEqual([
      MaterialColors.gradientStep1,
      MaterialColors.gradientStep2,
      MaterialColors.gradientStep3,
      MaterialColors.gradientStep4,
    ]);
  });

  it('clips to the shape path before filling the gradient', () => {
    const rec = record(MaterialLibrary.default(), 'focused-material', {
      state: VisualState.FOCUSED,
    });
    expect(rec.has('clip')).toBe(true);
  });

  it('draws nothing in DEFAULT state (not visible)', () => {
    const rec = record(MaterialLibrary.default(), 'focused-material', {
      state: VisualState.DEFAULT,
    });
    expect(rec.gradients).toHaveLength(0);
    expect(rec.has('fill', 'fillRect')).toBe(false);
  });

  it('shifts the gradient center with partial-focus offset', () => {
    const centered = record(MaterialLibrary.default(), 'focused-material', {
      state: VisualState.FOCUSED,
      partialFocusPosition: { x: 0, y: 0 },
    });
    const shifted = record(MaterialLibrary.default(), 'focused-material', {
      state: VisualState.FOCUSED,
      partialFocusPosition: { x: 0.3, y: 0 },
    });

    const centeredTranslate = centered.ofType('translate')[0]?.args[0];
    const shiftedTranslate = shifted.ofType('translate')[0]?.args[0];
    expect(shiftedTranslate).not.toBe(centeredTranslate);
  });
});

// ============================================================================
// Blurred radial-gradient layer
// ============================================================================

describe('Blurred radial-gradient canvas rendering', () => {
  it('is not part of the default container material', () => {
    const material = MaterialLibrary.default();
    const layers = [
      ...material.getBackgroundLayers(),
      ...material.getForegroundLayers(),
    ];

    expect(
      layers.some(
        layer =>
          layer instanceof BlurredRadialGradientContainerMaterialLayer,
      ),
    ).toBe(false);
  });

  it('uses its built-in focus-light geometry and blur recipe', () => {
    const offscreenRecorders: CanvasRecorder[] = [];
    const restoreNestedStub = installOffscreenCanvasStub(recorder => {
      offscreenRecorders.push(recorder);
    });

    try {
      const layer = new BlurredRadialGradientContainerMaterialLayer({
        id: 'default-focus-light',
      });
      const focused = drawLayer(layer, {
        state: VisualState.FOCUSED,
        width: 112,
        height: 112,
        dpr: 2,
      });

      expect(offscreenRecorders).toHaveLength(2);
      expect(offscreenRecorders[0].gradients[0]?.args[5]).toBe(57);
      expect(offscreenRecorders[0].ofType('scale')[0]?.args).toEqual([
        180 / 114,
        1,
      ]);
      expect(
        offscreenRecorders[1]
          .ofType('drawImage')
          .some(operation => operation.style?.filter === 'blur(64px)'),
      ).toBe(true);

      const composite = focused.ofType('drawImage')[0];
      expect(composite.args.slice(1)).toEqual([-130, -153, 372, 306]);
      expect((composite.args[0] as HTMLCanvasElement).width).toBe(744);
      expect((composite.args[0] as HTMLCanvasElement).height).toBe(612);
    } finally {
      restoreNestedStub();
    }
  });

  it('fades a clipped foreground light with the material state', () => {
    const layer = new BlurredRadialGradientContainerMaterialLayer({
      id: 'focus-light',
      alphaForState: state =>
        state === VisualState.FOCUSED || state === VisualState.PRESSED ? 1 : 0,
    });

    expect(layer.placement).toBe('foreground');
    expect(layer.clipsToShape).toBe(true);
    expect(layer.supportsDiscretePartialFocus).toBe(true);
    expect(
      drawLayer(layer, { state: VisualState.DEFAULT }).has('drawImage'),
    ).toBe(false);

    const focused = drawLayer(layer, { state: VisualState.FOCUSED });
    const focusedComposite = focused.ofType('drawImage');
    expect(focusedComposite).toHaveLength(1);
    expect(focusedComposite[0].style?.globalCompositeOperation).toBe(
      'source-over',
    );
    expect(focusedComposite[0].style?.globalAlpha).toBe(1);

    const transitioning = drawLayer(layer, {
      state: VisualState.FOCUSED,
      transition: {
        from: VisualState.DEFAULT,
        to: VisualState.FOCUSED,
        progress: 0.25,
      },
    });
    expect(
      transitioning.ofType('drawImage')[0].style?.globalAlpha,
    ).toBeCloseTo(0.25, 4);
  });

  it('moves one shared blurred bitmap instead of rerendering it for partial focus', () => {
    const offscreenRecorders: CanvasRecorder[] = [];
    const restoreNestedStub = installOffscreenCanvasStub(recorder => {
      offscreenRecorders.push(recorder);
    });
    const config = {
      id: 'cached-focus-light',
      stops: [
        { offset: 0, color: '#FDFEFE' },
        { offset: 1, color: 'rgba(253, 254, 254, 0)' },
      ],
      sizeMultiplier: { x: 0.713, y: 0.491 },
      placementMultiplier: { x: 0.4, y: 0.2 },
      blurRadius: 13,
    } as const;

    try {
      const centered = drawLayer(
        new BlurredRadialGradientContainerMaterialLayer(config),
        {
          state: VisualState.FOCUSED,
          width: 137,
          height: 91,
          dpr: 1.25,
        },
      );
      const createdForFirstDraw = offscreenRecorders.length;
      const shifted = drawLayer(
        new BlurredRadialGradientContainerMaterialLayer(config),
        {
          state: VisualState.FOCUSED,
          width: 137,
          height: 91,
          dpr: 1.25,
          partialFocusPosition: { x: 0.25, y: -0.1 },
        },
      );

      expect(createdForFirstDraw).toBe(2);
      expect(offscreenRecorders).toHaveLength(createdForFirstDraw);
      expect(
        offscreenRecorders.flatMap(recorder => recorder.gradients)[0]?.stops,
      ).toEqual(config.stops);
      expect(
        offscreenRecorders.some(recorder =>
          recorder
            .ofType('drawImage')
            .some(operation => operation.style?.filter === 'blur(16.25px)'),
        ),
      ).toBe(true);

      const centeredDraw = centered.ofType('drawImage')[0];
      const shiftedDraw = shifted.ofType('drawImage')[0];
      expect(
        (shiftedDraw.args[1] as number) -
          (centeredDraw.args[1] as number),
      ).toBeCloseTo(137 * 0.25, 4);
      expect(
        (shiftedDraw.args[2] as number) -
          (centeredDraw.args[2] as number),
      ).toBeCloseTo(91 * -0.1, 4);
    } finally {
      restoreNestedStub();
    }
  });

  it('renders a new bitmap when size or device pixel ratio changes', () => {
    const offscreenRecorders: CanvasRecorder[] = [];
    const restoreNestedStub = installOffscreenCanvasStub(recorder => {
      offscreenRecorders.push(recorder);
    });
    const config = {
      id: 'resized-focus-light',
      stops: [
        { offset: 0, color: '#FCFDFE' },
        { offset: 1, color: 'rgba(252, 253, 254, 0)' },
      ],
      blurRadius: 17,
    } as const;

    try {
      const layer = new BlurredRadialGradientContainerMaterialLayer(config);
      drawLayer(layer, {
        state: VisualState.FOCUSED,
        width: 143,
        height: 97,
        dpr: 1,
      });
      expect(offscreenRecorders).toHaveLength(2);

      drawLayer(layer, {
        state: VisualState.FOCUSED,
        width: 144,
        height: 97,
        dpr: 1,
      });
      expect(offscreenRecorders).toHaveLength(4);

      drawLayer(layer, {
        state: VisualState.FOCUSED,
        width: 144,
        height: 97,
        dpr: 2,
      });
      expect(offscreenRecorders).toHaveLength(6);
    } finally {
      restoreNestedStub();
    }
  });

  it('reuses a bitmap when size changes stay within one physical pixel', () => {
    const offscreenRecorders: CanvasRecorder[] = [];
    const restoreNestedStub = installOffscreenCanvasStub(recorder => {
      offscreenRecorders.push(recorder);
    });
    const config = {
      id: 'subpixel-focus-light',
      stops: [
        { offset: 0, color: '#FBFCFD' },
        { offset: 1, color: 'rgba(251, 252, 253, 0)' },
      ],
      sizeMultiplier: { x: 0.5, y: 0.5 },
    } as const;

    try {
      drawLayer(new BlurredRadialGradientContainerMaterialLayer(config), {
        state: VisualState.FOCUSED,
        width: 100.1,
        height: 100.1,
        dpr: 1,
      });
      expect(offscreenRecorders).toHaveLength(2);

      drawLayer(new BlurredRadialGradientContainerMaterialLayer(config), {
        state: VisualState.FOCUSED,
        width: 100.2,
        height: 100.2,
        dpr: 1,
      });
      expect(offscreenRecorders).toHaveLength(2);
    } finally {
      restoreNestedStub();
    }
  });

  it('owns a copy of caller-provided gradient stops', () => {
    const stops = [
      { offset: 0, color: '#FAFBFC' },
      { offset: 1, color: 'rgba(250, 251, 252, 0)' },
    ];
    const layer = new BlurredRadialGradientContainerMaterialLayer({
      id: 'owned-focus-light-stops',
      stops,
      blurRadius: 19,
    });
    stops[0].color = '#000000';

    const offscreenRecorders: CanvasRecorder[] = [];
    const restoreNestedStub = installOffscreenCanvasStub(recorder => {
      offscreenRecorders.push(recorder);
    });

    try {
      drawLayer(layer, {
        state: VisualState.FOCUSED,
        width: 149,
        height: 101,
      });
      expect(offscreenRecorders[0].gradients[0]?.stops).toEqual([
        { offset: 0, color: '#FAFBFC' },
        { offset: 1, color: 'rgba(250, 251, 252, 0)' },
      ]);
    } finally {
      restoreNestedStub();
    }
  });

  it('retains one oversized bitmap per layer instead of rerendering every frame', () => {
    const offscreenRecorders: CanvasRecorder[] = [];
    const restoreNestedStub = installOffscreenCanvasStub(recorder => {
      offscreenRecorders.push(recorder);
    });
    const config = {
      id: 'oversized-focus-light',
      stops: [
        { offset: 0, color: '#F9FAFB' },
        { offset: 1, color: 'rgba(249, 250, 251, 0)' },
      ],
    } as const;

    try {
      const layer = new BlurredRadialGradientContainerMaterialLayer(config);
      drawLayer(layer, {
        state: VisualState.FOCUSED,
        width: 2_000,
        height: 2_000,
        dpr: 2,
      });
      drawLayer(layer, {
        state: VisualState.FOCUSED,
        width: 2_000,
        height: 2_000,
        dpr: 2,
        partialFocusPosition: { x: 0.25, y: 0 },
      });

      expect(offscreenRecorders).toHaveLength(2);

      drawLayer(new BlurredRadialGradientContainerMaterialLayer(config), {
        state: VisualState.FOCUSED,
        width: 2_000,
        height: 2_000,
        dpr: 2,
      });
      expect(offscreenRecorders).toHaveLength(4);

      const original = new BlurredRadialGradientContainerMaterialLayer({
        ...config,
        stops: [
          { offset: 0, color: '#F8F9FA' },
          { offset: 1, color: 'rgba(248, 249, 250, 0)' },
        ],
      });
      drawLayer(original, {
        state: VisualState.FOCUSED,
        width: 2_000,
        height: 2_000,
        dpr: 2,
      });
      const createdBeforeCloneDraw = offscreenRecorders.length;
      drawLayer(original.clone(), {
        state: VisualState.FOCUSED,
        width: 2_000,
        height: 2_000,
        dpr: 2,
      });
      expect(offscreenRecorders).toHaveLength(createdBeforeCloneDraw + 2);
    } finally {
      restoreNestedStub();
    }
  });
});

// ============================================================================
// Default material inner-shadow (glow) layer
// ============================================================================

describe('Default material inner-shadow canvas rendering', () => {
  it('composites the inner glow with screen blend when FOCUSED', () => {
    const rec = record(MaterialLibrary.default(), 'inner-shadow', {
      state: VisualState.FOCUSED,
    });

    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some(op => op.style?.globalCompositeOperation === 'screen')).toBe(true);
  });

  it('draws nothing in DEFAULT state', () => {
    const rec = record(MaterialLibrary.default(), 'inner-shadow', {
      state: VisualState.DEFAULT,
    });
    expect(rec.has('drawImage', 'fill', 'stroke')).toBe(false);
  });
});

// ============================================================================
// Inner-shadow params (offset / spread / intensity)
// ============================================================================

describe('InnerShadow offset/spread/intensity params', () => {
  it('intensity scales the composited peak alpha', () => {
    const layer = new InnerShadowContainerMaterialLayer({
      id: 'inner-shadow-intensity',
      color: '#FFFFFF',
      alphaForState: () => 1,
      intensity: 0.5,
    });
    const rec = drawLayer(layer, { state: VisualState.FOCUSED, width: 100, height: 100 });
    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    // resolved alpha (1) * intensity (0.5)
    expect(composite[composite.length - 1].style?.globalAlpha).toBeCloseTo(0.5, 4);
  });

  it('intensity defaults to 1 (no scaling)', () => {
    const layer = new InnerShadowContainerMaterialLayer({
      id: 'inner-shadow-default-intensity',
      color: '#FFFFFF',
      alphaForState: () => 0.8,
    });
    const rec = drawLayer(layer, { state: VisualState.FOCUSED, width: 100, height: 100 });
    const composite = rec.ofType('drawImage');
    expect(composite[composite.length - 1].style?.globalAlpha).toBeCloseTo(0.8, 4);
  });

  it('composites with a directional offset and inward spread without error', () => {
    const layer = new InnerShadowContainerMaterialLayer({
      id: 'inner-shadow-offset-spread',
      color: '#FFFFFF',
      alphaForState: () => 1,
      offsetX: -4,
      offsetY: -4,
      spread: 2,
    });
    const rec = drawLayer(layer, { state: VisualState.FOCUSED, width: 100, height: 100 });
    expect(rec.ofType('drawImage').length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Default material noise layer
// ============================================================================

describe('Default material noise-material canvas rendering', () => {
  it('fills a repeating pattern with overlay blend when FOCUSED and noise is loaded', () => {
    const rec = record(MaterialLibrary.default(), 'noise-material', {
      state: VisualState.FOCUSED,
      noise: fakeNoise,
    });

    expect(rec.patterns).toHaveLength(1);
    const fills = rec.ofType('fill');
    expect(fills).toHaveLength(1);
    expect(fills[0].style?.globalCompositeOperation).toBe('overlay');
  });

  it('draws nothing when the noise asset has not loaded', () => {
    const rec = record(MaterialLibrary.default(), 'noise-material', {
      state: VisualState.FOCUSED,
      noise: null,
    });
    expect(rec.has('fill', 'createPattern')).toBe(false);
  });

  it('draws nothing in DEFAULT state even when noise is loaded', () => {
    const rec = record(MaterialLibrary.default(), 'noise-material', {
      state: VisualState.DEFAULT,
      noise: fakeNoise,
    });
    expect(rec.has('fill', 'createPattern')).toBe(false);
  });
});

// ============================================================================
// Default material pressed layer
// ============================================================================

describe('Default material pressed-material canvas rendering', () => {
  it('fills the pressed overlay color when PRESSED', () => {
    const rec = record(MaterialLibrary.default(), 'pressed-material', {
      state: VisualState.PRESSED,
    });
    const fills = rec.ofType('fill');
    expect(fills).toHaveLength(1);
    expect(fills[0].style?.fillStyle).toBe(MaterialColors.pressedOverlay);
  });

  it('draws nothing in non-PRESSED states', () => {
    for (const state of [
      VisualState.NONE,
      VisualState.DEFAULT,
      VisualState.FOCUSED,
    ]) {
      const rec = record(MaterialLibrary.default(), 'pressed-material', { state });
      expect(rec.has('fill', 'fillRect', 'stroke')).toBe(false);
    }
  });
});

// ============================================================================
// Default material glow stroke layer
// ============================================================================

describe('Default material glow-stroke canvas rendering', () => {
  it('draws its inset stroke path without a second shape clip', () => {
    const layer = getLayer(MaterialLibrary.default(), 'glow-stroke');
    expect(layer.clipsToShape).toBe(false);
  });

  it('composites the stroke with overlay blend in DEFAULT', () => {
    const rec = record(MaterialLibrary.default(), 'glow-stroke', {
      state: VisualState.DEFAULT,
    });
    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some(op => op.style?.globalCompositeOperation === 'overlay')).toBe(true);
  });

  it('draws nothing in NONE state (alpha 0)', () => {
    const rec = record(MaterialLibrary.default(), 'glow-stroke', {
      state: VisualState.NONE,
    });
    expect(rec.has('drawImage', 'stroke')).toBe(false);
  });
});

// ============================================================================
// Drop shadow layer
// ============================================================================

describe('Default material drop-shadow canvas rendering', () => {
  it('fills with a shadow and punches out the interior', () => {
    const material = MaterialLibrary.defaultWithDropShadow();
    const rec = record(material, 'drop-shadow', { state: VisualState.DEFAULT });

    const fills = rec.ofType('fill');
    // One shadowed fill, one destination-out fill to clear the interior.
    expect(fills.length).toBeGreaterThanOrEqual(2);
    // The first fill carries the blurred shadow.
    expect(fills[0].style?.shadowBlur).toBe(8);
  });
});

// ============================================================================
// Themed materials drive layer colors
// ============================================================================

describe('Themed material idle/focused canvas colors', () => {
  it('themedPrimaryBlue fills the idle layer with its themed blue idle color', () => {
    const rec = record(MaterialLibrary.themedPrimaryBlue(), 'idle-material', {
      state: VisualState.DEFAULT,
    });
    const fills = rec.ofType('fill');
    expect(fills).toHaveLength(1);
    // Blue['500'] idle fill.
    expect(fills[0].style?.fillStyle).toBe('#2694FE');
  });

  it('themedPrimaryBlue focused gradient starts with the themed blue gradient color', () => {
    const rec = record(MaterialLibrary.themedPrimaryBlue(), 'focused-material', {
      state: VisualState.FOCUSED,
    });
    const radial = rec.gradients.find(g => g.kind === 'radial');
    expect(radial?.stops[0].color).toBe('#2694FE');
  });

  it('positive persistent-idle fills with the positive accent color', () => {
    const rec = record(MaterialLibrary.positive(false), 'idle-material', {
      state: VisualState.DEFAULT,
    });
    expect(rec.ofType('fill')[0].style?.fillStyle).toBe('#26A756');
  });
});

// ============================================================================
// Panel material
// ============================================================================

describe('Panel material scrim canvas rendering', () => {
  it('fills a vertical linear-gradient rectangle (unclipped, own geometry)', () => {
    const rec = record(MaterialLibrary.panel(), 'panel-scrim', {
      state: VisualState.DEFAULT,
    });
    const linear = rec.gradients.find(g => g.kind === 'linear');
    expect(linear).toBeDefined();
    expect(rec.has('fillRect')).toBe(true);
    expect(rec.has('clip')).toBe(false);
  });

  it('scrim layer does not clip to the rounded container shape', () => {
    const scrim = getLayer(MaterialLibrary.panel(), 'panel-scrim');
    expect(scrim.clipsToShape).toBe(false);
    expect(scrim.supportsDiscretePartialFocus).toBe(false);
  });

  it('dims base layers via the panel alpha multiplier in DEFAULT (0.5x)', () => {
    // The panel scales each base layer's own alpha by the per-state multiplier on
    // the shared canvas (so blend-mode layers still composite against the
    // backdrop). The idle fill is opaque (1) -> 0.5.
    const rec = record(MaterialLibrary.panel(), 'idle-material', {
      state: VisualState.DEFAULT,
    });
    const fills = rec.ofType('fill');
    expect(fills).toHaveLength(1);
    expect(fills[0].style?.globalAlpha).toBeCloseTo(0.5, 4);
  });
});

// ============================================================================
// Card material
// ============================================================================

describe('Card material canvas rendering', () => {
  it('card-idle fills the surface color in DEFAULT', () => {
    const rec = record(MaterialLibrary.card(), 'card-idle', {
      state: VisualState.DEFAULT,
    });
    expect(rec.ofType('fill')[0].style?.fillStyle).toBe(MaterialColors.backgroundSurface);
  });

  it('card-idle-border strokes only in DEFAULT with overlay blend', () => {
    const defaultRec = record(MaterialLibrary.card(), 'card-idle-border', {
      state: VisualState.DEFAULT,
    });
    const strokes = defaultRec.ofType('stroke');
    expect(strokes).toHaveLength(1);
    expect(strokes[0].style?.globalCompositeOperation).toBe('overlay');

    const focusedRec = record(MaterialLibrary.card(), 'card-idle-border', {
      state: VisualState.FOCUSED,
    });
    expect(focusedRec.has('stroke')).toBe(false);
  });

  it('card-back-glow strokes with hard-light blend when FOCUSED only', () => {
    const focusedRec = record(MaterialLibrary.card(), 'card-back-glow', {
      state: VisualState.FOCUSED,
    });
    const strokes = focusedRec.ofType('stroke');
    expect(strokes).toHaveLength(1);
    expect(strokes[0].style?.globalCompositeOperation).toBe('hard-light');

    const defaultRec = record(MaterialLibrary.card(), 'card-back-glow', {
      state: VisualState.DEFAULT,
    });
    expect(defaultRec.has('stroke')).toBe(false);
  });

  it('card-front-glow composites a hard-light gradient stroke when FOCUSED', () => {
    const rec = record(MaterialLibrary.card(), 'card-front-glow', {
      state: VisualState.FOCUSED,
    });
    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some(op => op.style?.globalCompositeOperation === 'hard-light')).toBe(true);
  });

  it('card-press fills the pressed overlay only when PRESSED', () => {
    const pressedRec = record(MaterialLibrary.card(), 'card-press', {
      state: VisualState.PRESSED,
    });
    // Cards use the plain white colorInteractiveFillPressed (not the slate
    // Default-container press tint).
    expect(pressedRec.ofType('fill')[0].style?.fillStyle).toBe(Overlay.light[25]);

    const defaultRec = record(MaterialLibrary.card(), 'card-press', {
      state: VisualState.DEFAULT,
    });
    expect(defaultRec.has('fill')).toBe(false);
  });
});

// ============================================================================
// ActionHint material
// ============================================================================

describe('ActionHint material canvas rendering', () => {
  it('gradient layer fills a top-left to bottom-right linear gradient', () => {
    const rec = record(MaterialLibrary.actionHint(), 'action-hint-gradient', {
      state: VisualState.DEFAULT,
      width: 100,
      height: 42,
    });
    const linear = rec.gradients.find(g => g.kind === 'linear');
    expect(linear).toBeDefined();
    // (x0,y0) -> (x1,y1) spans the full rect diagonal.
    expect(linear!.args).toEqual([0, 0, 100, 42]);
    expect(rec.has('fill')).toBe(true);
  });

  it('stroke layer composites with overlay blend', () => {
    const rec = record(MaterialLibrary.actionHint(), 'action-hint-stroke', {
      state: VisualState.DEFAULT,
    });
    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some(op => op.style?.globalCompositeOperation === 'overlay')).toBe(true);
  });
});

// ============================================================================
// Static material
// ============================================================================

describe('Static material canvas rendering', () => {
  it('idle layer fills the surface color', () => {
    const rec = record(MaterialLibrary.defaultStatic(), 'idle-material', {
      state: VisualState.DEFAULT,
    });
    expect(rec.ofType('fill')[0].style?.fillStyle).toBe(MaterialColors.backgroundSurface);
  });
});

// ============================================================================
// Transition interpolation via lerpState
// ============================================================================

describe('Layer transition interpolation via lerpState', () => {
  it('idle layer fills at the interpolated alpha mid-transition (NONE -> DEFAULT)', () => {
    const rec = record(MaterialLibrary.default(), 'idle-material', {
      state: VisualState.DEFAULT,
      transition: {
        from: VisualState.NONE,
        to: VisualState.DEFAULT,
        progress: 0.5,
      },
    });
    const fills = rec.ofType('fill');
    expect(fills).toHaveLength(1);
    // Alpha lerps 0 -> 1 at progress 0.5.
    expect(fills[0].style?.globalAlpha).toBeCloseTo(0.5, 4);
  });

  it('glow stroke composites with overlay throughout a DEFAULT -> FOCUSED transition', () => {
    const rec = record(MaterialLibrary.default(), 'glow-stroke', {
      state: VisualState.FOCUSED,
      transition: {
        from: VisualState.DEFAULT,
        to: VisualState.FOCUSED,
        progress: 0.5,
      },
    });
    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some(op => op.style?.globalCompositeOperation === 'overlay')).toBe(true);
  });
});

// ============================================================================
// All default-material layers draw without error across every state
// ============================================================================

describe('All default material layers draw safely for every state', () => {
  const states = [
    VisualState.NONE,
    VisualState.DEFAULT,
    VisualState.FOCUSED,
    VisualState.PRESSED,
  ];

  it('no layer throws for any state', () => {
    const material = MaterialLibrary.defaultWithDropShadow();
    const layers = [
      ...material.getBackgroundLayers(),
      ...material.getForegroundLayers(),
    ];
    for (const layer of layers) {
      for (const state of states) {
        expect(() => drawLayer(layer, { state, noise: fakeNoise })).not.toThrow();
      }
    }
  });
});
