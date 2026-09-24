/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it } from 'vitest';
import { hasFocusableInDirection } from '@wearables-ui-toolkit/foundation/components/private/PagerFocus';

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function setRect(element: HTMLElement, { left, top, right, bottom }: Rect): void {
  element.getBoundingClientRect = () =>
    ({
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

function focusable(rect: Rect): HTMLButtonElement {
  const el = document.createElement('button');
  el.tabIndex = 0;
  setRect(el, rect);
  return el;
}

describe('hasFocusableInDirection', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function buildPage(children: HTMLElement[]): HTMLElement {
    const page = document.createElement('div');
    setRect(page, { left: 0, top: 0, right: 600, bottom: 600 });
    children.forEach((child) => page.appendChild(child));
    document.body.appendChild(page);
    return page;
  }

  it('a left-column tile sees its same-row right neighbor (in-page move)', () => {
    const leftTile = focusable({ left: 20, top: 200, right: 290, bottom: 260 });
    const rightTile = focusable({ left: 310, top: 200, right: 580, bottom: 260 });
    const page = buildPage([leftTile, rightTile]);

    expect(hasFocusableInDirection(leftTile, page, 'right')).toBe(true);
  });

  it('a full-width tile reports nothing to its right, even with a diagonally-offset neighbor above', () => {
    // Right-column tile one row up — its center is to the right, but its right
    // edge does not extend past the full-width tile's, so it must NOT count as a
    // rightward target. This lets the Pager hand off to the adjacent page.
    const rightColAbove = focusable({ left: 310, top: 400, right: 580, bottom: 460 });
    const fullWidth = focusable({ left: 20, top: 480, right: 580, bottom: 540 });
    const page = buildPage([rightColAbove, fullWidth]);

    expect(hasFocusableInDirection(fullWidth, page, 'right')).toBe(false);
    // ...and the rightmost column tile likewise has nothing further right.
    expect(hasFocusableInDirection(rightColAbove, page, 'right')).toBe(false);
  });

  it('a full-width tile reports nothing to its left either', () => {
    const leftColAbove = focusable({ left: 20, top: 400, right: 290, bottom: 460 });
    const fullWidth = focusable({ left: 20, top: 480, right: 580, bottom: 540 });
    const page = buildPage([leftColAbove, fullWidth]);

    expect(hasFocusableInDirection(fullWidth, page, 'left')).toBe(false);
  });

  it('still finds vertical neighbors for up/down', () => {
    const top = focusable({ left: 20, top: 100, right: 580, bottom: 160 });
    const bottom = focusable({ left: 20, top: 480, right: 580, bottom: 540 });
    const page = buildPage([top, bottom]);

    expect(hasFocusableInDirection(top, page, 'down')).toBe(true);
    expect(hasFocusableInDirection(bottom, page, 'up')).toBe(true);
    expect(hasFocusableInDirection(bottom, page, 'down')).toBe(false);
  });
});
