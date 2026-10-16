/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { getContextMenuPadding } from '../mrbd/ui/private/ContextMenuLayout';
import { contextMenuPath } from '../mrbd/ui/private/ContextMenuPath';
import {
  getContextMenuContainerStyle,
  getContextMenuMaterialShape,
  getContextMenuScrollViewportStyle,
} from '../mrbd/ui/private/ContextMenuPresentation';

describe('ContextMenuPresentation', () => {
  it('builds the popup container style around menu height, surface, and shadow padding', () => {
    expect(
      getContextMenuContainerStyle({
        totalHeight: 105,
        menuHeight: 64,
        surfaceStyle: 'primary',
        paddingTop: 20,
        paddingBottom: 21,
        dropShadowPadding: 12,
        maxWidth: 320,
        style: { transform: 'translateX(4px)' },
      }),
    ).toMatchObject({
      height: 105,
      padding: '20px 12px 21px 12px',
      width: 'max-content',
      maxWidth: 320,
      boxSizing: 'border-box',
      '--uit-context-menu-height': '64px',
      '--uit-context-menu-surface-color': 'var(--uit-color-background-elevation3)',
      transform: 'translateX(4px)',
    });
  });

  it('uses the secondary semantic surface color when requested', () => {
    expect(
      getContextMenuContainerStyle({
        totalHeight: 80,
        menuHeight: 56,
        surfaceStyle: 'secondary',
        paddingTop: 12,
        paddingBottom: 12,
        dropShadowPadding: 12,
      }),
    ).toMatchObject({
      '--uit-context-menu-height': '56px',
      '--uit-context-menu-surface-color': 'var(--uit-color-background-elevation1)',
    });
  });

  it('creates the same integrated material path inputs for tailed menus', () => {
    const shape = getContextMenuMaterialShape({
      measuredSize: { width: 616, height: 105 },
      totalHeight: 105,
      dropShadowPadding: 12,
      showTailPointer: true,
      tailDirection: 'down',
      tailCenterX: 200,
    });

    expect(shape.effectiveWidth).toBe(616);
    expect(shape.effectiveHeight).toBe(105);
    expect(shape.shadowOffsetY).toBe(4);
    expect(shape.pathD?.length).toBeGreaterThan(300);
  });

  it.each(['up', 'down', undefined] as const)('shares the grown body height with its %s material and shadow geometry', tailDirection => {
    const menuHeight = 88;
    const padding = getContextMenuPadding(tailDirection != null, tailDirection, menuHeight, 12);
    const style = getContextMenuContainerStyle({
      ...padding,
      menuHeight,
      surfaceStyle: 'secondary',
      dropShadowPadding: 12,
      maxWidth: 200,
    });
    const shape = getContextMenuMaterialShape({
      measuredSize: { width: 0, height: 0 },
      maxWidth: 200,
      totalHeight: padding.totalHeight,
      dropShadowPadding: 12,
      showTailPointer: tailDirection != null,
      tailDirection,
    });

    expect(style.height).toBe(tailDirection ? 129 : 112);
    expect(style).toMatchObject({ '--uit-context-menu-height': '88px' });
    expect(shape.effectiveHeight).toBe(style.height);
    expect(shape.effectiveWidth).toBe(200);
    expect(shape.pathD).toBe(contextMenuPath({
      width: 200,
      height: padding.totalHeight,
      inset: 12,
      tailDirection,
      tailCenterX: 100,
    }));
    expect(shape.shadowOffsetY).toBe(tailDirection === 'up' ? -4 : 4);
  });

  it('uses fixed fading edge lengths for scroll viewport overlays', () => {
    const style = getContextMenuScrollViewportStyle(40);

    expect(style).toMatchObject({
      '--uit-context-menu-fading-edge-length': '40px',
    });
  });
});
