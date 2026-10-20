/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {NotificationBadge} from '../mrbd/ui/NotificationBadge';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function installInkFixture() {
  const callbacks = new Map<Element, ResizeObserverCallback>();
  const disconnect = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(element: Element) { callbacks.set(element, this.callback); }
    disconnect = disconnect;
  });
  const measureText = vi.fn(() => ({width: 24}));
  const getImageData = vi.fn((_x, _y, width: number, height: number) => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 54; y < 70; y++) {
      for (let x = 18; x < 36; x++) data[(y * width + x) * 4 + 3] = 255;
    }
    return {data};
  });
  const context = {measureText, getImageData, fillText: vi.fn()};
  const range = {selectNodeContents: vi.fn(), getBoundingClientRect: () => ({width: measureText().width})};
  vi.spyOn(document, 'createRange').mockReturnValue(range as unknown as Range);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (_kind, options) {
    return options && 'willReadFrequently' in options && options.willReadFrequently
      ? context as unknown as CanvasRenderingContext2D
      : null;
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return this.hasAttribute('aria-hidden')
      ? {x: 0, y: 44, top: 44, width: 0, height: 0} as DOMRect
      : {x: 10, y: 20, top: 20, width: 40, height: 32} as DOMRect;
  });
  return {callbacks, disconnect, measureText, getImageData};
}

describe('NotificationBadge rendered glyph alignment', () => {
  it('centers painted ink on both axes while retaining text, root ref and minimum size', () => {
    installInkFixture();
    const {rerender} = render(<NotificationBadge text="gyp" data-testid="badge" style={{minWidth: 80}} />);
    const root = screen.getByTestId('badge');
    const label = screen.getByText('gyp');
    expect(label.style.translate).toBe('1px -6px');
    expect(root).toHaveStyle({minWidth: '80px', height: '32px'});
    expect(root).toHaveTextContent('gyp');
    rerender(<NotificationBadge text="11" data-testid="badge" style={{minWidth: 0}} />);
    expect(screen.getByText('11')).toBe(label);
    expect(label.style.translate).toBe('1px -6px');
    expect(screen.getByTestId('badge')).toBe(root);
    expect(root).toHaveStyle({minWidth: '0px', height: '32px'});
  });

  it('refreshes after label resize and disconnects the leaf observer on unmount', () => {
    const {callbacks, disconnect, measureText, getImageData} = installInkFixture();
    const {unmount} = render(<NotificationBadge text="1" />);
    const label = screen.getByText('1');
    measureText.mockReturnValue({width: 32});
    callbacks.get(label)?.([], {} as ResizeObserver);
    expect(label.style.translate).toBe('5px -6px');
    getImageData.mockReturnValue({data: new Uint8ClampedArray(64 * 128 * 4)});
    callbacks.get(label)?.([], {} as ResizeObserver);
    expect(label.style.translate).toBe('');
    unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(label.style.translate).toBe('');
    vi.unstubAllGlobals();
  });

  it('retains normal layout rather than translating a differently shaped run', () => {
    const {getImageData} = installInkFixture();
    vi.mocked(document.createRange).mockReturnValue({
      selectNodeContents: vi.fn(),
      getBoundingClientRect: () => ({width: 28}),
    } as unknown as Range);
    render(<NotificationBadge text="11" />);
    expect(screen.getByText('11').style.translate).toBe('');
    expect(getImageData).not.toHaveBeenCalled();
  });

  it('clears stale alignment on same-text caller style and class changes without resizing', () => {
    installInkFixture();
    const realStyle = getComputedStyle;
    let unsupported = false;
    vi.stubGlobal('getComputedStyle', (element: Element) => new Proxy(realStyle(element), {
      get: (style, key) => {
        if (key === 'fontFeatureSettings' && unsupported) return '"zero"';
        const value = Reflect.get(style, key);
        return typeof value === 'function' ? value.bind(style) : value;
      },
    }));
    const {rerender} = render(<NotificationBadge text="1" />);
    const label = screen.getByText('1');
    expect(label.style.translate).toBe('1px -6px');
    unsupported = true;
    rerender(<NotificationBadge text="1" className="unsupported" />);
    expect(label.style.translate).toBe('');
    unsupported = false;
    rerender(<NotificationBadge text="1" className="supported" />);
    expect(label.style.translate).toBe('1px -6px');
    unsupported = true;
    rerender(<NotificationBadge text="1" className="supported" style={{fontFeatureSettings: '"zero"'}} />);
    expect(label.style.translate).toBe('');
    unsupported = false;
    rerender(<NotificationBadge text="1" className="supported" />);
    expect(screen.getByText('1')).toBe(label);
    expect(label.style.translate).toBe('1px -6px');
  });

  it('keeps normal alignment inside unsupported root rotation even when advances agree', () => {
    const {getImageData} = installInkFixture();
    render(<NotificationBadge text="1" style={{transform: 'rotate(180deg)'}} />);
    expect(screen.getByText('1').style.translate).toBe('');
    expect(getImageData).not.toHaveBeenCalled();
  });

  it('keeps normal layout when no canvas is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<NotificationBadge text="New" aria-label="New notifications" />);
    expect(screen.getByText('New').style.translate).toBe('');
    expect(screen.getByLabelText('New notifications')).toHaveTextContent('New');
  });
});
