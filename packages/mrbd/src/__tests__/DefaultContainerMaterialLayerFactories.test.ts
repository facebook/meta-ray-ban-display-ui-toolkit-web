/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { MaterialColors } from '@wearables-ui-toolkit/foundation/colors/Colors';
import {
  createDropShadowLayer,
  createFocusedMaterialLayer,
  createGlowStrokeLayer,
  createIdleMaterialLayer,
  createInnerShadowLayer,
  createNoiseMaterialLayer,
  createPressedMaterialLayer,
} from '@wearables-ui-toolkit/foundation/material/DefaultContainerMaterialLayerFactories';
import { drawLayer, installOffscreenCanvasStub } from './helpers/canvasRecorder';
import { defaultShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

let restoreOffscreen: () => void;

beforeAll(() => {
  restoreOffscreen = installOffscreenCanvasStub();
});

afterAll(() => {
  restoreOffscreen();
});

const fakeNoise = {
  naturalWidth: 50,
  naturalHeight: 50,
} as unknown as CanvasImageSource;

describe('DefaultContainerMaterialLayerFactories', () => {
  it('creates the default material layers with stable ids', () => {
    expect([
      createDropShadowLayer().id,
      createIdleMaterialLayer().id,
      createFocusedMaterialLayer().id,
      createInnerShadowLayer().id,
      createNoiseMaterialLayer().id,
      createPressedMaterialLayer().id,
      createGlowStrokeLayer().id,
    ]).toEqual([
      'drop-shadow',
      'idle-material',
      'focused-material',
      'inner-shadow',
      'noise-material',
      'pressed-material',
      'glow-stroke',
    ]);
  });

  it('focused layer draws a radial gradient and glow stroke composites a stroke when FOCUSED', () => {
    const focusedRec = drawLayer(createFocusedMaterialLayer(), {
      state: VisualState.FOCUSED,
      width: 120,
      height: 80,
      shapeContext: { shapeProvider: defaultShapeProvider },
    });
    expect(focusedRec.gradients.some(g => g.kind === 'radial')).toBe(true);

    const glowRec = drawLayer(createGlowStrokeLayer(), {
      state: VisualState.FOCUSED,
      width: 120,
      height: 80,
      shapeContext: { shapeProvider: defaultShapeProvider },
    });
    expect(glowRec.ofType('drawImage').length).toBeGreaterThan(0);
  });

  it('focused gradient uses the four material color stops', () => {
    const rec = drawLayer(createFocusedMaterialLayer(), {
      state: VisualState.FOCUSED,
      shapeContext: { shapeProvider: defaultShapeProvider },
    });
    const radial = rec.gradients.find(g => g.kind === 'radial');
    expect(radial?.stops.map(s => s.color)).toEqual([
      MaterialColors.gradientStep1,
      MaterialColors.gradientStep2,
      MaterialColors.gradientStep3,
      MaterialColors.gradientStep4,
    ]);
  });

  it('inner shadow composites with screen blend when FOCUSED, draws nothing in DEFAULT', () => {
    const focusedRec = drawLayer(createInnerShadowLayer(), {
      state: VisualState.FOCUSED,
      width: 120,
      height: 80,
      shapeContext: { shapeProvider: defaultShapeProvider },
    });
    const composite = focusedRec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some(op => op.style?.globalCompositeOperation === 'screen')).toBe(true);

    const defaultRec = drawLayer(createInnerShadowLayer(), {
      state: VisualState.DEFAULT,
      shapeContext: { shapeProvider: defaultShapeProvider },
    });
    expect(defaultRec.has('drawImage', 'fill', 'stroke')).toBe(false);
  });

  it('noise layer fills an overlay-blended pattern only when FOCUSED and loaded', () => {
    const focusedRec = drawLayer(createNoiseMaterialLayer(), {
      state: VisualState.FOCUSED,
      width: 120,
      height: 80,
      noise: fakeNoise,
    });
    expect(focusedRec.patterns).toHaveLength(1);
    expect(focusedRec.ofType('fill')[0]?.style?.globalCompositeOperation).toBe('overlay');

    const defaultRec = drawLayer(createNoiseMaterialLayer(), {
      state: VisualState.DEFAULT,
      width: 120,
      height: 80,
      noise: fakeNoise,
    });
    expect(defaultRec.has('fill', 'createPattern')).toBe(false);
  });
});
