/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ButtonRailFrame } from '../mrbd/ui/private/ButtonRailFrame';

const BUTTON_RAIL_CSS = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/ui/ButtonRail.module.css`,
  'utf8',
);
// The `.buttonRail` rule body (not `.buttonRailInner`, which lacks a space/brace).
const RAIL_RULE = BUTTON_RAIL_CSS.match(/\.buttonRail\s*\{([^}]*)\}/)?.[1] ?? '';

function renderFrame(overrides = {}) {
  return render(
    <ButtonRailFrame
      outerRef={() => {}}
      innerRef={() => {}}
      className="custom-rail"
      style={{ margin: 8 }}
      innerStyle={{ transform: 'translateX(-20px)', transition: 'none' }}
      showLeftFade
      showRightFade={false}
      onScroll={vi.fn()}
      onKeyDown={vi.fn()}
      onFocus={vi.fn()}
      onBlur={vi.fn()}
      {...overrides}
    >
      <button>A</button>
    </ButtonRailFrame>,
  );
}

describe('ButtonRailFrame', () => {
  it('renders the rail group and children', () => {
    renderFrame();

    expect(screen.getByRole('group', { name: 'Button rail' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
  });

  it('applies the translated inner row style', () => {
    const { container } = renderFrame();
    const inner = container.querySelector('[class*="buttonRailInner"]');

    expect(inner?.getAttribute('style')).toContain('translateX(-20px)');
  });

  it('toggles fading edge visibility independently', () => {
    const { container } = renderFrame({ showLeftFade: true, showRightFade: false });
    const left = container.querySelector('[class*="fadingEdgeLeft"]');
    const right = container.querySelector('[class*="fadingEdgeRight"]');

    expect(left?.className).toContain('visible');
    expect(right?.className).not.toContain('visible');
  });
});

describe('ButtonRail viewport clipping', () => {
  it('clips horizontally to form the scroll viewport', () => {
    // `clip` (or `hidden`) on X hides buttons scrolled out of the viewport.
    expect(RAIL_RULE).toMatch(/overflow-x:\s*clip/);
  });

  it('leaves the vertical axis visible so the focus rubberband is not clipped', () => {
    // The ~4px up/down partial-focus nudge must bleed past the rail instead of
    // being cut off (the original bug).
    expect(RAIL_RULE).toMatch(/overflow-y:\s*visible/);
  });

  it('does not clip both axes via overflow:hidden', () => {
    // `overflow: hidden` clipped the vertical rubberband and regressed this fix.
    expect(RAIL_RULE).not.toMatch(/overflow:\s*hidden/);
  });
});
