/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Public BackgroundStyle + TextSwitcher always-visible material tests.
 *
 * The public BackgroundStyle union is exactly NONE/PRIMARY/SECONDARY — no IDLE.
 * TextSwitcher used to rely on the now-removed public IDLE case to keep its
 * material always visible; that behavior now uses a private always-visible style
 * that resolves to the DEFAULT visual state. These tests assert both the shape
 * of the public union and the resolved material/rendered output.
 */

import { render } from '@testing-library/react';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { TextSwitcher } from '@wearables-ui-toolkit/foundation/components/TextSwitcher';
import {
  BackgroundStyle,
} from '@wearables-ui-toolkit/foundation/components/StaticContainer.types';
import { PrivateBackgroundStyle } from '@wearables-ui-toolkit/foundation/components/private/StaticContainerBackgroundStyle';
import { getStaticContainerVisualState } from '@wearables-ui-toolkit/foundation/components/private/StaticContainerLayout';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { MaterialColors } from '@wearables-ui-toolkit/foundation/colors/Colors';
import {
  drawLayer,
  installOffscreenCanvasStub,
} from './helpers/canvasRecorder';

let restoreOffscreen: () => void;
beforeAll(() => {
  restoreOffscreen = installOffscreenCanvasStub();
});
afterAll(() => {
  restoreOffscreen();
});

describe('public BackgroundStyle union', () => {
  it('exposes exactly NONE/PRIMARY/SECONDARY', () => {
    expect(BackgroundStyle).toEqual({
      NONE: 'none',
      PRIMARY: 'primary',
      SECONDARY: 'secondary',
    });
  });
});

describe('PrivateBackgroundStyle always-visible material', () => {
  it('resolves the always-visible style to the DEFAULT visual state (what IDLE did)', () => {
    expect(
      getStaticContainerVisualState(PrivateBackgroundStyle.ALWAYS_VISIBLE),
    ).toBe(VisualState.DEFAULT);
    // PRIMARY also resolves to DEFAULT; only NONE hides the material.
    expect(getStaticContainerVisualState(BackgroundStyle.PRIMARY)).toBe(
      VisualState.DEFAULT,
    );
    expect(getStaticContainerVisualState(BackgroundStyle.NONE)).toBe(
      VisualState.NONE,
    );
  });

  it('paints the primary surface token in DEFAULT state and nothing in NONE state', () => {
    const idleLayer = MaterialLibrary.defaultStatic()
      .getBackgroundLayers()
      .find((layer) => layer.id === 'idle-material');
    expect(idleLayer).not.toBeUndefined();

    const visibleFills = drawLayer(idleLayer!, {
      state: VisualState.DEFAULT,
    }).ofType('fill');
    expect(visibleFills).toHaveLength(1);
    // The resolved always-visible fill is the background surface token (#27282D).
    expect(visibleFills[0].style?.fillStyle).toBe(MaterialColors.backgroundSurface);
    expect(visibleFills[0].style?.globalAlpha).toBe(1);

    const hiddenFills = drawLayer(idleLayer!, {
      state: VisualState.NONE,
    }).ofType('fill');
    expect(hiddenFills).toHaveLength(0);
  });
});

describe('TextSwitcher always-visible material rendering', () => {
  it('renders its always-visible background material layer container', () => {
    const { container } = render(<TextSwitcher text="Hello" noAnimationFirstView />);

    const backgroundLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(backgroundLayers).not.toBeNull();
    expect(container.textContent).toContain('Hello');
  });
});
