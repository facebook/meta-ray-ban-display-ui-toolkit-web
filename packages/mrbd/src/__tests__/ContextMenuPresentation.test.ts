/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import {
  getContextMenuContainerStyle,
  getContextMenuMaterialShape,
  getContextMenuScrollViewportStyle,
} from '../mrbd/ui/private/ContextMenuPresentation';

describe('ContextMenuPresentation', () => {
  it('builds the popup container style around fixed menu height and shadow padding', () => {
    expect(
      getContextMenuContainerStyle({
        totalHeight: 113,
        paddingTop: 20,
        paddingBottom: 21,
        dropShadowPadding: 12,
        maxWidth: 320,
        style: { transform: 'translateX(4px)' },
      }),
    ).toMatchObject({
      height: 113,
      padding: '20px 12px 21px 12px',
      width: 'max-content',
      maxWidth: 320,
      boxSizing: 'border-box',
      transform: 'translateX(4px)',
    });
  });

  it('creates the same integrated material path inputs for tailed menus', () => {
    const shape = getContextMenuMaterialShape({
      measuredSize: { width: 616, height: 113 },
      totalHeight: 113,
      dropShadowPadding: 12,
      showTailPointer: true,
      tailDirection: 'down',
      tailCenterX: 200,
    });

    expect(shape.effectiveWidth).toBe(616);
    expect(shape.effectiveHeight).toBe(113);
    expect(shape.shadowOffsetY).toBe(4);
    expect(shape.pathD?.length).toBeGreaterThan(300);
  });

  it('uses fixed fading edge lengths for scroll viewport overlays', () => {
    const style = getContextMenuScrollViewportStyle(40);

    expect(style).toMatchObject({
      '--uit-context-menu-fading-edge-length': '40px',
    });
  });
});
