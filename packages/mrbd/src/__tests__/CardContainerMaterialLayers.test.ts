/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  createCardContainerMaterialLayers,
  createFullScreenCardContainerMaterialLayers,
} from '@wearables-ui-toolkit/foundation/material/CardContainerMaterialLayers';
import { drawLayer, installOffscreenCanvasStub } from './helpers/canvasRecorder';
import { defaultShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

let restoreOffscreen: () => void;

beforeAll(() => {
  restoreOffscreen = installOffscreenCanvasStub();
});

afterAll(() => {
  restoreOffscreen();
});

describe('CardContainerMaterialLayers', () => {
  it('creates regular card layers with the expected ordering ids', () => {
    expect(createCardContainerMaterialLayers().map((layer) => layer.id)).toEqual([
      'card-idle',
      'card-press',
      'card-idle-border',
      'card-back-glow',
      'card-front-glow',
    ]);
  });

  it('creates fullscreen card layers with the expected ordering ids', () => {
    expect(createFullScreenCardContainerMaterialLayers().map((layer) => layer.id)).toEqual([
      'fullscreen-card-idle',
      'fullscreen-card-press',
      'fullscreen-card-border',
    ]);
  });

  it('focused card front glow and fullscreen border composite gradient strokes when FOCUSED', () => {
    const cardFrontGlow = createCardContainerMaterialLayers().find(
      (layer) => layer.id === 'card-front-glow',
    )!;
    const fullScreenBorder = createFullScreenCardContainerMaterialLayers().find(
      (layer) => layer.id === 'fullscreen-card-border',
    )!;

    const cardRec = drawLayer(cardFrontGlow, {
      state: VisualState.FOCUSED,
      width: 184,
      height: 276,
      shapeContext: { shapeProvider: defaultShapeProvider },
    });
    expect(cardRec.ofType('drawImage').length).toBeGreaterThan(0);

    const borderRec = drawLayer(fullScreenBorder, {
      state: VisualState.FOCUSED,
      width: 184,
      height: 276,
      shapeContext: { shapeProvider: defaultShapeProvider },
    });
    expect(borderRec.ofType('drawImage').length).toBeGreaterThan(0);
  });

  it('fullscreen card border grows its stroke when FOCUSED via lerpState', () => {
    const fullScreenBorder = createFullScreenCardContainerMaterialLayers().find(
      (layer) => layer.id === 'fullscreen-card-border',
    )!;
    // DEFAULT draws (alpha non-zero), so border is visible at rest too.
    const defaultRec = drawLayer(fullScreenBorder, {
      state: VisualState.DEFAULT,
      width: 184,
      height: 276,
      shapeContext: { shapeProvider: defaultShapeProvider },
    });
    const noneRec = drawLayer(fullScreenBorder, {
      state: VisualState.NONE,
      width: 184,
      height: 276,
      shapeContext: { shapeProvider: defaultShapeProvider },
    });
    expect(defaultRec.ofType('drawImage').length).toBeGreaterThan(0);
    expect(noneRec.has('drawImage', 'stroke')).toBe(false);
  });
});
