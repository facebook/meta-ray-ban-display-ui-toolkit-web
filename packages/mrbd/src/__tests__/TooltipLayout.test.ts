/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import { TooltipPosition } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';
import {
  calculateTooltipPositionLayout,
  getTooltipPortalStyle,
} from '../mrbd/ui/private/TooltipLayout';

const BOUNDARY = {
  bottom: 260,
  height: 200,
  left: 120,
  right: 420,
  top: 60,
  width: 300,
};

describe('TooltipLayout', () => {
  it('uses fixed viewport coordinates without a scoped portal root', () => {
    expect(getTooltipPortalStyle(BOUNDARY)).toMatchObject({
      height: 200,
      left: 120,
      position: 'fixed',
      top: 60,
      width: 300,
    });
  });

  it('uses app-root-local coordinates for a scoped portal root', () => {
    const portalRoot = document.createElement('div');
    portalRoot.getBoundingClientRect = vi.fn(() => ({
      bottom: 500,
      height: 400,
      left: 100,
      right: 500,
      top: 40,
      width: 400,
      x: 100,
      y: 40,
      toJSON: () => '',
    }));

    expect(getTooltipPortalStyle(BOUNDARY, portalRoot)).toMatchObject({
      height: 200,
      left: 20,
      position: 'absolute',
      top: 20,
      width: 300,
    });
  });

  it('uses an anchor-relative center provider for built-in tooltip placement', () => {
    const { anchor, tooltip } = createAnchoredTooltipFixture();

    expect(calculateTooltipPositionLayout(anchor, tooltip, {
      position: TooltipPosition.ANCHORED,
      text: 'Cursor',
      centerPositionProvider: () => ({ x: 20, y: 10 }),
    })).toMatchObject({
      position: {
        left: 90,
        top: 70,
      },
      tailCenterX: 30,
      tailDirection: 'down',
    });
  });

  it('uses target rect vertical edges while center provider controls horizontal placement', () => {
    const { anchor, tooltip } = createAnchoredTooltipFixture();

    expect(calculateTooltipPositionLayout(anchor, tooltip, {
      position: TooltipPosition.ANCHORED,
      text: 'Cursor',
      centerPositionProvider: () => ({ x: 20, y: 10 }),
      targetRectProvider: () => ({
        left: 10,
        top: 5,
        right: 50,
        bottom: 25,
      }),
    })).toMatchObject({
      position: {
        left: 90,
        top: 65,
      },
      tailCenterX: 30,
      tailDirection: 'down',
    });
  });
});

function createAnchoredTooltipFixture() {
  Object.defineProperties(window, {
    innerWidth: { configurable: true, value: 300 },
    innerHeight: { configurable: true, value: 200 },
  });
  const boundary = document.createElement('div');
  boundary.setAttribute('data-uit-tooltip-boundary', 'true');
  boundary.getBoundingClientRect = vi.fn(() => ({
    bottom: 200,
    height: 200,
    left: 0,
    right: 300,
    top: 0,
    width: 300,
    x: 0,
    y: 0,
    toJSON: () => '',
  }));
  const anchor = document.createElement('button');
  anchor.getBoundingClientRect = vi.fn(() => ({
    bottom: 120,
    height: 40,
    left: 100,
    right: 180,
    top: 80,
    width: 80,
    x: 100,
    y: 80,
    toJSON: () => '',
  }));
  const tooltip = document.createElement('div');
  tooltip.getBoundingClientRect = vi.fn(() => ({
    bottom: 30,
    height: 30,
    left: 0,
    right: 60,
    top: 0,
    width: 60,
    x: 0,
    y: 0,
    toJSON: () => '',
  }));

  boundary.appendChild(anchor);
  document.body.appendChild(boundary);

  return { anchor, tooltip };
}
