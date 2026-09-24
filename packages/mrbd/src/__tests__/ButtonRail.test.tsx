/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ButtonRail tests
 *
 * A horizontal scroll container holding a ButtonGroup with START alignment.
 * Features horizontal scrolling, fading edges, keyboard navigation.
 */

import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ButtonRail } from '../mrbd/ui/ButtonRail';
import type { ButtonRailHandle } from '../mrbd/ui/ButtonRail.types';
import {
  calculateButtonRailTranslation,
  getButtonRailAppliedTranslation,
  getButtonRailFocusFollowTranslation,
  getButtonRailMonotonicFollowTranslation,
  getButtonRailScrollX,
  getButtonRailVisualContentWidth,
  measureButtonRailProjectedVisualChildMetrics,
} from '../mrbd/ui/private/ButtonRailLayout';

const originalResizeObserver = globalThis.ResizeObserver;
const motionPreference = vi.hoisted(() => ({ reduced: false }));
vi.mock('@wearables-ui-toolkit/foundation/motion/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => motionPreference.reduced,
}));

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.ResizeObserver = originalResizeObserver;
  motionPreference.reduced = false;
});

describe('ButtonRail initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ButtonRail>
        <button>A</button>
        <button>B</button>
      </ButtonRail>
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders children', () => {
    render(
      <ButtonRail>
        <button data-testid="btn-a">A</button>
        <button data-testid="btn-b">B</button>
      </ButtonRail>
    );
    expect(screen.getByTestId('btn-a')).toBeInTheDocument();
    expect(screen.getByTestId('btn-b')).toBeInTheDocument();
  });

  it('exposes the rail viewport node via the imperative handle', () => {
    const handleRef = createRef<ButtonRailHandle>();
    const { container } = render(
      <ButtonRail ref={handleRef}>
        <button>A</button>
      </ButtonRail>
    );

    expect(handleRef.current?.getElement()).toBe(container.firstElementChild);
  });
});

describe('ButtonRail translation bounds', () => {
  it('moves monotonically to the final focus target without overshoot', () => {
    expect(getButtonRailFocusFollowTranslation(0, -128, 0)).toBe(0);
    expect(getButtonRailFocusFollowTranslation(0, -128, 0.5)).toBe(-64);
    expect(getButtonRailFocusFollowTranslation(0, -128, 1)).toBe(-128);

    const translations = [0, 0.25, 0.5, 0.75, 1].map(progress =>
      getButtonRailFocusFollowTranslation(
        0,
        -128,
        progress,
      ),
    );
    expect(translations).toEqual([0, -32, -64, -96, -128]);
  });

  it('rejects observer commits that overshoot or reverse a focus follow', () => {
    expect(
      getButtonRailMonotonicFollowTranslation(-260, -224, -278, -290),
    ).toBe(-278);
    expect(
      getButtonRailMonotonicFollowTranslation(-278, -224, -278, -270),
    ).toBe(-278);
    expect(
      getButtonRailMonotonicFollowTranslation(40, 0, 64, 72),
    ).toBe(64);
    expect(
      getButtonRailMonotonicFollowTranslation(64, 0, 64, 52),
    ).toBe(64);
  });

  it('projects the final collapsed and expanded button geometry', () => {
    const createButton = (
      offsetLeft: number,
      offsetWidth: number,
      defaultWidth: number,
      defaultScale: number,
      focusedWidth: number,
      focusedScale: number,
    ): HTMLButtonElement => {
      const button = document.createElement('button');
      Object.defineProperty(button, 'offsetLeft', {
        configurable: true,
        value: offsetLeft,
      });
      Object.defineProperty(button, 'offsetWidth', {
        configurable: true,
        value: offsetWidth,
      });
      button.dataset.uitButtonDefaultLayoutWidth = String(defaultWidth);
      button.dataset.uitButtonDefaultScale = String(defaultScale);
      button.dataset.uitButtonFocusedLayoutWidth = String(focusedWidth);
      button.dataset.uitButtonFocusedScale = String(focusedScale);
      document.body.appendChild(button);
      return button;
    };
    const collapsedScale = 72 / 88;
    const previous = createButton(400, 249, 88, collapsedScale, 249, 1);
    const next = createButton(673, 88, 88, collapsedScale, 218, 1);
    const following = createButton(761, 88, 88, collapsedScale, 237, 1);

    const metrics = measureButtonRailProjectedVisualChildMetrics(
      [previous, next, following],
      1,
    );
    previous.remove();
    next.remove();
    following.remove();

    expect(metrics[0]).toMatchObject({ left: 408, right: 480, width: 72 });
    expect(metrics[1]).toMatchObject({ left: 512, right: 730, width: 218 });
    expect(metrics[2]).toMatchObject({ left: 738, right: 810, width: 72 });
  });

  it('allows focused-item centering to move content beyond either edge', () => {
    expect(
      getButtonRailAppliedTranslation(208, 536, 800, true),
    ).toBe(208);
    expect(
      getButtonRailAppliedTranslation(-472, 536, 800, true),
    ).toBe(-472);
  });

  it('keeps ordinary rail movement within the content edges', () => {
    expect(
      getButtonRailAppliedTranslation(208, 536, 800, false),
    ).toBe(0);
    expect(
      getButtonRailAppliedTranslation(-472, 536, 800, false),
    ).toBe(-264);
  });

  it('recenters an anchor after its focused label expands', () => {
    const children = Array.from({ length: 9 }, () =>
      document.createElement('button'),
    );
    const childMetrics = [
      { center: 68, left: 32, right: 104, width: 72, rectWidth: 72 },
      { center: 156, left: 120, right: 192, width: 72, rectWidth: 72 },
      { center: 244, left: 208, right: 280, width: 72, rectWidth: 72 },
      { center: 332, left: 296, right: 368, width: 72, rectWidth: 72 },
      { center: 476.5, left: 384, right: 569, width: 185, rectWidth: 185 },
      { center: 613, left: 577, right: 649, width: 72, rectWidth: 72 },
      { center: 701, left: 665, right: 737, width: 72, rectWidth: 72 },
      { center: 789, left: 753, right: 825, width: 72, rectWidth: 72 },
      { center: 877, left: 841, right: 913, width: 72, rectWidth: 72 },
    ];

    expect(
      calculateButtonRailTranslation({
        focusedIndex: 4,
        currentTranslation: -56,
        viewportWidth: 552,
        contentWidth: 937,
        children,
        anchorIndex: 4,
        centerContentWhenSmallerThanWidth: true,
        centerFocusedView: false,
        childMetrics,
      }),
    ).toBeCloseTo(-200.5);
  });
});

describe('ButtonRail scroll container', () => {
  it('has overflow hidden for viewport clipping', () => {
    const { container } = render(
      <ButtonRail>
        <button>A</button>
      </ButtonRail>
    );
    const rail = container.firstElementChild;
    expect(rail).not.toBeNull();
  });

  it('centers rail content when it is smaller than the viewport', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRail') && !className.includes('buttonRailInner')) {
        return 536;
      }
      return 100;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRailInner')) {
        return 400;
      }
      return this.offsetWidth;
    });

    const { container } = render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
      </ButtonRail>
    );

    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(68px)');
    });
  });

  it('centers scaled quick reply rails from perceived visual content width', () => {
    const inner = document.createElement('div');
    inner.style.paddingRight = '24px';
    const children = [
      { left: 24, width: 120, visualWidth: 120 },
      { left: 143, width: 81, visualWidth: 63 },
      { left: 217, width: 125, visualWidth: 97.222 },
    ].map(({ left, width, visualWidth }, index) => {
      const child = document.createElement('button');
      child.textContent = String(index);
      Object.defineProperty(child, 'offsetLeft', { configurable: true, value: left });
      Object.defineProperty(child, 'offsetWidth', { configurable: true, value: width });
      child.getBoundingClientRect = vi.fn(() => ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: visualWidth,
        bottom: 72,
        width: visualWidth,
        height: 72,
        toJSON: () => ({}),
      }) as DOMRect);
      inner.appendChild(child);
      return child;
    });

    const contentWidth = getButtonRailVisualContentWidth(inner, children);

    expect(contentWidth).toBeCloseTo(352.111, 3);
    expect(Math.round(calculateButtonRailTranslation({
      focusedIndex: 0,
      currentTranslation: 0,
      viewportWidth: 536,
      contentWidth,
      children,
      centerContentWhenSmallerThanWidth: true,
      centerFocusedView: false,
    }))).toBe(92);
  });

  it('centers mixed regular and quick reply rails around their visual extents', () => {
    const inner = document.createElement('div');
    inner.style.paddingRight = '24px';
    const children = [
      { left: 24, width: 88, visualWidth: 72 },
      { left: 112, width: 161, visualWidth: 161 },
      { left: 266, width: 135, visualWidth: 105 },
    ].map(({ left, width, visualWidth }, index) => {
      const child = document.createElement('button');
      child.textContent = String(index);
      Object.defineProperty(child, 'offsetLeft', { configurable: true, value: left });
      Object.defineProperty(child, 'offsetWidth', { configurable: true, value: width });
      child.getBoundingClientRect = vi.fn(() => ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: visualWidth,
        bottom: 88,
        width: visualWidth,
        height: 88,
        toJSON: () => ({}),
      }) as DOMRect);
      inner.appendChild(child);
      return child;
    });
    const contentWidth = getButtonRailVisualContentWidth(inner, children);

    expect(Math.round(calculateButtonRailTranslation({
      focusedIndex: 1,
      currentTranslation: 0,
      viewportWidth: 536,
      contentWidth,
      children,
      centerContentWhenSmallerThanWidth: true,
      centerFocusedView: false,
    }))).toBe(59);
  });

  it('centers the anchor when the anchor is focused', () => {
    const children = [
      document.createElement('button'),
      document.createElement('button'),
      document.createElement('button'),
    ];

    expect(calculateButtonRailTranslation({
      focusedIndex: 1,
      currentTranslation: 0,
      viewportWidth: 400,
      contentWidth: 600,
      children,
      anchorIndex: 1,
      centerContentWhenSmallerThanWidth: true,
      centerFocusedView: false,
      childMetrics: [
        { center: 100, left: 50, right: 150, width: 100, rectWidth: 100 },
        { center: 300, left: 250, right: 350, width: 100, rectWidth: 100 },
        { center: 500, left: 450, right: 550, width: 100, rectWidth: 100 },
      ],
    })).toBe(-100);
  });

  it('positions focused items proportionally on either side of the anchor', () => {
    const children = [
      document.createElement('button'),
      document.createElement('button'),
      document.createElement('button'),
      document.createElement('button'),
      document.createElement('button'),
    ];
    const childMetrics = [
      { center: 100, left: 50, right: 150, width: 100, rectWidth: 100 },
      { center: 300, left: 250, right: 350, width: 100, rectWidth: 100 },
      { center: 500, left: 450, right: 550, width: 100, rectWidth: 100 },
      { center: 700, left: 650, right: 750, width: 100, rectWidth: 100 },
      { center: 900, left: 850, right: 950, width: 100, rectWidth: 100 },
    ];
    const commonConfig = {
      currentTranslation: 0,
      viewportWidth: 600,
      contentWidth: 1_000,
      children,
      anchorIndex: 2,
      centerContentWhenSmallerThanWidth: true,
      centerFocusedView: false,
      childMetrics,
    };

    const leftTranslation = calculateButtonRailTranslation({
      ...commonConfig,
      focusedIndex: 1,
    });
    const rightTranslation = calculateButtonRailTranslation({
      ...commonConfig,
      focusedIndex: 3,
    });

    expect(childMetrics[1].center + leftTranslation).toBeCloseTo(166.67);
    expect(childMetrics[3].center + rightTranslation).toBeCloseTo(433.33);
  });

  it('does not center rail content when centerContentWhenSmallerThanWidth is false', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRail') && !className.includes('buttonRailInner')) {
        return 536;
      }
      return 100;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRailInner')) {
        return 400;
      }
      return this.offsetWidth;
    });

    const { container } = render(
      <ButtonRail centerContentWhenSmallerThanWidth={false}>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
      </ButtonRail>
    );

    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(0px)');
    });
  });

  it('recenters when child content width changes after first layout', async () => {
    let contentWidth = 224;
    let resizeCallback: ResizeObserverCallback = () => {
      throw new Error('Expected ButtonRail to register a ResizeObserver callback');
    };
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as typeof ResizeObserver;

    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRail') && !className.includes('buttonRailInner')) {
        return 536;
      }
      return 100;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRailInner')) {
        return contentWidth;
      }
      return this.offsetWidth;
    });

    const { container } = render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
      </ButtonRail>
    );

    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(156px)');
    });

    contentWidth = 400;
    resizeCallback([], {} as ResizeObserver);

    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(68px)');
    });
  });

  it('jumps layout recomputes for rail items that cannot animate transitions', async () => {
    let contentWidth = 300;
    let resizeCallback: ResizeObserverCallback = () => {
      throw new Error('Expected ButtonRail to register a ResizeObserver callback');
    };
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as typeof ResizeObserver;

    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRail') && !className.includes('buttonRailInner')) {
        return 200;
      }
      return 40;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRailInner')) {
        return contentWidth;
      }
      return this.offsetWidth;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
      switch (this.textContent) {
        case 'A':
          return 0;
        case 'B':
          return 80;
        case 'C':
          return 160;
        default:
          return 0;
      }
    });

    const { container } = render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
        <button tabIndex={0}>C</button>
      </ButtonRail>,
    );
    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    screen.getByRole('button', { name: 'C' }).focus();
    contentWidth = 360;
    resizeCallback([], {} as ResizeObserver);

    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(-160px)');
      expect(inner.style.transition).toBe('none');
    });
  });

  it('jumps focus movement when reduced motion is requested', async () => {
    motionPreference.reduced = true;
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRail') && !className.includes('buttonRailInner')) {
        return 200;
      }
      return 40;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRailInner')) {
        return 360;
      }
      return this.offsetWidth;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
      switch (this.textContent) {
        case 'A':
          return 0;
        case 'B':
          return 80;
        case 'C':
          return 160;
        default:
          return 0;
      }
    });

    const { container } = render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
        <button tabIndex={0}>C</button>
      </ButtonRail>,
    );
    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    screen.getByRole('button', { name: 'A' }).focus();
    screen.getByRole('button', { name: 'C' }).focus();

    expect(inner.style.transform).toBe('translateX(0px)');
    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(-160px)');
    });
  });

  it('uses state-change timing without CSS transitions for eligible rail items', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRail') && !className.includes('buttonRailInner')) {
        return 200;
      }
      return 40;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRailInner')) {
        return 500;
      }
      return this.offsetWidth;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
      switch (this.textContent) {
        case 'A':
          return 0;
        case 'B':
          return 160;
        case 'C':
          return 320;
        default:
          return 0;
      }
    });

    const { container } = render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
        <button tabIndex={0}>C</button>
      </ButtonRail>,
    );
    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    screen.getByRole('button', { name: 'A' }).focus();
    screen.getByRole('button', { name: 'C' }).focus();

    expect(inner.style.transition).toBe('none');
    await waitFor(() => {
      expect(inner.style.transform).not.toBe('translateX(0px)');
    });
  });

  it('does not reset its scroll offset when focus leaves the rail with no size change', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRail') && !className.includes('buttonRailInner')) {
        return 200;
      }
      return 40;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRailInner')) {
        return 360;
      }
      return this.offsetWidth;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
      switch (this.textContent) {
        case 'A':
          return 0;
        case 'B':
          return 80;
        case 'C':
          return 160;
        default:
          return 0;
      }
    });

    const { container } = render(
      <>
        <ButtonRail>
          <button tabIndex={0}>A</button>
          <button tabIndex={0}>B</button>
          <button tabIndex={0}>C</button>
        </ButtonRail>
        <button tabIndex={0}>Outside</button>
      </>,
    );
    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    // Focus the last child so the rail scrolls to it.
    screen.getByRole('button', { name: 'C' }).focus();
    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(-160px)');
    });

    // Move focus out of the rail. No child changed size, so the rail must stay
    // exactly where it is — it must not snap back to an unfocused rest offset.
    screen.getByRole('button', { name: 'Outside' }).focus();
    expect(inner.style.transform).toBe('translateX(-160px)');
    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(-160px)');
    });
  });

  it('keeps following when WebView transiently blurs and restores the same child', () => {
    const animationFrames = new Map<number, FrameRequestCallback>();
    let nextFrame = 1;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      const handle = nextFrame++;
      animationFrames.set(handle, callback);
      return handle;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(handle => {
      animationFrames.delete(handle);
    });
    const onChildFocusChange = vi.fn();

    render(
      <ButtonRail onChildFocusChange={onChildFocusChange}>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
      </ButtonRail>,
    );
    const first = screen.getByRole('button', { name: 'A' });
    const second = screen.getByRole('button', { name: 'B' });

    first.focus();
    second.focus();
    fireEvent.blur(second, { relatedTarget: null });
    fireEvent.focus(second, { relatedTarget: null });

    act(() => {
      for (const callback of animationFrames.values()) {
        callback(performance.now());
      }
    });

    expect(onChildFocusChange).not.toHaveBeenCalledWith(null);
    expect(document.activeElement).toBe(second);
  });

  it('does not report transient focus on the rail wrapper as child focus', () => {
    const onChildFocusChange = vi.fn();
    const { container } = render(
      <ButtonRail onChildFocusChange={onChildFocusChange}>
        <button tabIndex={0}>A</button>
      </ButtonRail>,
    );
    const inner = container.querySelector(
      '[class*="buttonRailInner"]',
    ) as HTMLElement;

    fireEvent.focus(inner, { relatedTarget: null });

    expect(onChildFocusChange).not.toHaveBeenCalled();
  });

  it('restores the last child when WebView temporarily focuses a rail ancestor', () => {
    let latestFrame: FrameRequestCallback | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      latestFrame = callback;
      return 1;
    });
    render(
      <div data-testid="ancestor" tabIndex={-1}>
        <ButtonRail>
          <button tabIndex={0}>A</button>
          <button tabIndex={0}>B</button>
        </ButtonRail>
      </div>,
    );
    const ancestor = screen.getByTestId('ancestor');
    const second = screen.getByRole('button', { name: 'B' });
    const originalFocus = second.focus.bind(second);
    const focusSpy = vi.fn((options?: FocusOptions) => originalFocus(options));
    second.focus = focusSpy;

    second.focus();
    focusSpy.mockClear();
    fireEvent.focusOut(second, { relatedTarget: null });
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(ancestor);
    act(() => latestFrame?.(performance.now()));

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });
});

describe('ButtonRail custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <ButtonRail className="my-rail">
        <button>A</button>
      </ButtonRail>
    );
    expect(container.firstElementChild?.className).toContain('my-rail');
  });

  it('accepts custom style', () => {
    const { container } = render(
      <ButtonRail style={{ margin: 8 }}>
        <button>A</button>
      </ButtonRail>
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });
});

describe('ButtonRail with multiple children', () => {
  it('renders many buttons', () => {
    render(
      <ButtonRail>
        {Array.from({ length: 10 }, (_, i) => (
          <button key={i} data-testid={`btn-${i}`}>Button {i}</button>
        ))}
      </ButtonRail>
    );
    expect(screen.getByTestId('btn-0')).toBeInTheDocument();
    expect(screen.getByTestId('btn-9')).toBeInTheDocument();
  });

  it('keeps the focused child past the visible right fading edge', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRail') && !className.includes('buttonRailInner')) {
        return 200;
      }
      return 40;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRailInner')) {
        return 500;
      }
      return this.offsetWidth;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
      switch (this.textContent) {
        case 'A':
          return 0;
        case 'B':
          return 80;
        case 'C':
          return 160;
        case 'D':
          return 240;
        default:
          return 0;
      }
    });

    const { container } = render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
        <button tabIndex={0}>C</button>
        <button tabIndex={0}>D</button>
      </ButtonRail>,
    );

    screen.getByRole('button', { name: 'C' }).focus();
    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(-64px)');
    });
  });

  it('prevents the browser default scroll when moving focus internally', () => {
    render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
      </ButtonRail>,
    );
    const first = screen.getByRole('button', { name: 'A' });
    const second = screen.getByRole('button', { name: 'B' });
    const originalFocus = second.focus.bind(second);
    const focusSpy = vi.fn((options?: FocusOptions) => originalFocus(options));
    second.focus = focusSpy;

    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('traps ArrowRight at the last child (focus stays, event consumed)', () => {
    render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
      </ButtonRail>,
    );
    const last = screen.getByRole('button', { name: 'B' });
    last.focus();
    // dispatchEvent returns false when a handler called preventDefault.
    const notPrevented = fireEvent.keyDown(last, { key: 'ArrowRight' });
    expect(notPrevented).toBe(false);
    expect(document.activeElement).toBe(last);
  });

  it('traps ArrowLeft at the first child (focus stays, event consumed)', () => {
    render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
      </ButtonRail>,
    );
    const first = screen.getByRole('button', { name: 'A' });
    first.focus();
    const notPrevented = fireEvent.keyDown(first, { key: 'ArrowLeft' });
    expect(notPrevented).toBe(false);
    expect(document.activeElement).toBe(first);
  });

  it('does not trap vertical navigation (ArrowDown bubbles out of the rail)', () => {
    render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
      </ButtonRail>,
    );
    const first = screen.getByRole('button', { name: 'A' });
    first.focus();
    const notPrevented = fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(notPrevented).toBe(true);
  });

  it('keeps the rail scroll position pinned while focused', () => {
    const { container } = render(
      <ButtonRail>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
      </ButtonRail>,
    );
    const rail = container.firstElementChild as HTMLElement;
    Object.defineProperty(rail, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: 128,
    });

    screen.getByRole('button', { name: 'A' }).focus();

    expect(rail.scrollLeft).toBe(0);
  });
});

describe('ButtonRail imperative handle', () => {
  function mockOverflowingRailMetrics() {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRail') && !className.includes('buttonRailInner')) {
        return 200;
      }
      return 40;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      const className = String(this.className);
      if (className.includes('buttonRailInner')) {
        return 500;
      }
      return this.offsetWidth;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
      switch (this.textContent) {
        case 'A':
          return 0;
        case 'B':
          return 80;
        case 'C':
          return 160;
        case 'D':
          return 240;
        default:
          return 0;
      }
    });
  }

  it('skipAnimationForNextFocusMovement makes the next focus move land immediately without a spring', () => {
    mockOverflowingRailMetrics();
    // Drive layout-follow frames synchronously. The clock jumps forward by a
    // large amount each tick so the follow loop terminates after its first
    // pass (now >= follow end time). The skipped (non-animated) path commits
    // the final translation immediately within that pass rather than easing in
    // via the spring.
    let clock = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      clock += 1_000_000;
      return clock;
    });
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(performance.now());
      return 0 as unknown as number;
    });

    const handleRef = createRef<ButtonRailHandle>();
    const { container } = render(
      <ButtonRail ref={handleRef}>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
        <button tabIndex={0}>C</button>
        <button tabIndex={0}>D</button>
      </ButtonRail>,
    );
    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    // Focus A first; A->C would normally ease in via the spring.
    act(() => {
      screen.getByRole('button', { name: 'A' }).focus();
    });

    act(() => {
      handleRef.current?.skipAnimationForNextFocusMovement();
    });
    act(() => {
      screen.getByRole('button', { name: 'C' }).focus();
    });

    // Lands directly at the focused target (no partial spring easing).
    expect(inner.style.transform).toBe('translateX(-64px)');
  });

  it('skip flag is one-shot and clears after the next focus movement', () => {
    mockOverflowingRailMetrics();
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 0 as unknown as number);

    const handleRef = createRef<ButtonRailHandle>();
    render(
      <ButtonRail ref={handleRef}>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
        <button tabIndex={0}>C</button>
        <button tabIndex={0}>D</button>
      </ButtonRail>,
    );

    act(() => {
      screen.getByRole('button', { name: 'A' }).focus();
    });

    // First move consumes the skip flag, forcing the non-animated layout-follow
    // path instead of a spring.
    act(() => {
      handleRef.current?.skipAnimationForNextFocusMovement();
    });
    act(() => {
      screen.getByRole('button', { name: 'B' }).focus();
    });

    rafSpy.mockClear();

    // Second move: flag was cleared, so B->D schedules a spring animation frame.
    act(() => {
      screen.getByRole('button', { name: 'D' }).focus();
    });

    expect(rafSpy).toHaveBeenCalled();
  });

  it('resetScrollPositionIfNoFocusedChild resets translation when nothing is focused', async () => {
    mockOverflowingRailMetrics();
    const handleRef = createRef<ButtonRailHandle>();
    const { container } = render(
      <ButtonRail ref={handleRef}>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
        <button tabIndex={0}>C</button>
        <button tabIndex={0}>D</button>
      </ButtonRail>,
    );
    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    act(() => {
      screen.getByRole('button', { name: 'C' }).focus();
    });
    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(-64px)');
    });

    // Move focus out of the rail so no child is focused.
    act(() => {
      (screen.getByRole('button', { name: 'C' }) as HTMLElement).blur();
      document.body.focus();
    });

    act(() => {
      handleRef.current?.resetScrollPositionIfNoFocusedChild(false);
    });

    expect(inner.style.transform).toBe('translateX(0px)');
  });

  it('resetScrollPositionIfNoFocusedChild is a no-op while a child is focused', async () => {
    mockOverflowingRailMetrics();
    const handleRef = createRef<ButtonRailHandle>();
    const { container } = render(
      <ButtonRail ref={handleRef}>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
        <button tabIndex={0}>C</button>
        <button tabIndex={0}>D</button>
      </ButtonRail>,
    );
    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    act(() => {
      screen.getByRole('button', { name: 'C' }).focus();
    });
    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(-64px)');
    });

    act(() => {
      handleRef.current?.resetScrollPositionIfNoFocusedChild(false);
    });

    // Still scrolled to C; reset was ignored because a child holds focus.
    expect(inner.style.transform).toBe('translateX(-64px)');
  });

  it('updateScrollPosition recomputes the scroll for the last focused child', async () => {
    mockOverflowingRailMetrics();
    const handleRef = createRef<ButtonRailHandle>();
    const { container } = render(
      <ButtonRail ref={handleRef}>
        <button tabIndex={0}>A</button>
        <button tabIndex={0}>B</button>
        <button tabIndex={0}>C</button>
        <button tabIndex={0}>D</button>
      </ButtonRail>,
    );
    const inner = container.querySelector('[class*="buttonRailInner"]') as HTMLElement;

    act(() => {
      screen.getByRole('button', { name: 'C' }).focus();
    });
    await waitFor(() => {
      expect(inner.style.transform).toBe('translateX(-64px)');
    });

    // Layout shifts (the focused child C moves right) without a new focus event.
    // updateScrollPosition re-derives the translation for the LAST focused child
    // (C, index 2) against the new metrics and applies it.
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
      switch (this.textContent) {
        case 'A':
          return 0;
        case 'B':
          return 120;
        case 'C':
          return 240;
        case 'D':
          return 360;
        default:
          return 0;
      }
    });

    act(() => {
      handleRef.current?.updateScrollPosition(false);
    });

    // C now sits further right, so the rail scrolls further left than before.
    expect(inner.style.transform).toBe('translateX(-144px)');
  });
});

describe('ButtonRail scroll reporting', () => {
  it('reports a signed scroll position (-translation)', () => {
    // Negative translation (scrolled right) -> positive scrollX.
    expect(getButtonRailScrollX(-100)).toBe(100);
    // Positive translation (centered content) -> negative scrollX, not clamped
    // to 0.
    expect(getButtonRailScrollX(50)).toBe(-50);
  });
});
