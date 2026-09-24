/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  BlurredRadialGradientContainerMaterialLayer,
  VisualState,
} from '@wearables-ui-toolkit/foundation';
import { createContentFocusContainerMaterial } from '../mrbd/foundation/ContentFocusContainerMaterial';
import { MaterialLibrary } from '../mrbd/foundation/MaterialLibrary';
import { drawLayer, installOffscreenCanvasStub } from './helpers/canvasRecorder';

let restoreOffscreen: () => void;

beforeAll(() => {
  restoreOffscreen = installOffscreenCanvasStub();
});

afterAll(() => {
  restoreOffscreen();
});

describe('createContentFocusContainerMaterial', () => {
  it('wraps the foundation blurred radial gradient as a foreground layer', () => {
    const material = createContentFocusContainerMaterial();

    expect(material.getBackgroundLayers()).toEqual([]);
    expect(material.getForegroundLayers()).toHaveLength(1);
    expect(material.getForegroundLayers()[0]).toBeInstanceOf(
      BlurredRadialGradientContainerMaterialLayer,
    );
    expect(material.getForegroundLayers()[0]?.id).toBe('content-focus');
    expect(material.supportsDiscretePartialFocus).toBe(true);
  });

  it('shows the focus layer only while focused or pressed', () => {
    const layer = createContentFocusContainerMaterial().getForegroundLayers()[0];

    expect(drawLayer(layer, { state: VisualState.DEFAULT }).paintOps).toEqual([]);
    expect(
      drawLayer(layer, { state: VisualState.FOCUSED }).ofType('drawImage'),
    ).toHaveLength(1);
    expect(
      drawLayer(layer, { state: VisualState.PRESSED }).ofType('drawImage'),
    ).toHaveLength(1);
  });

  it('creates independent material and layer instances', () => {
    const first = createContentFocusContainerMaterial();
    const second = MaterialLibrary.contentFocus();

    expect(first).not.toBe(second);
    expect(first.getForegroundLayers()[0]).not.toBe(
      second.getForegroundLayers()[0],
    );
  });
});
