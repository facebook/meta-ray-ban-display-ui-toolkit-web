/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {act, cleanup, render} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {App} from './App';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('App host text scale', () => {
  it('updates appearance sizes and restores them without remounting app content', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Android WebView');
    const original = window.getComputedStyle.bind(window);
    let size = '160px';
    vi.spyOn(window, 'getComputedStyle').mockImplementation(element => {
      if ((element as HTMLElement).style.fontSize === '100px') {
        return {fontSize: size} as CSSStyleDeclaration;
      }
      return original(element);
    });
    const view = render(<App><span>Content</span></App>);
    const root = view.container.querySelector<HTMLElement>('[data-app-root]')!;
    const content = view.container.querySelector('[data-app-content-root]');
    expect(root.style.getPropertyValue('--uit-scaled-font-size-24')).toBe('18.75px');
    expect(root.style.getPropertyValue('--uit-scaled-font-size-22')).toBe('18.125px');
    size = '100px';
    act(() => { window.dispatchEvent(new Event('resize')); });
    expect(root.style.getPropertyValue('--uit-scaled-font-size-24')).toBe('');
    expect(view.container.querySelector('[data-app-content-root]')).toBe(content);
    size = 'not-a-size';
    act(() => { window.dispatchEvent(new Event('resize')); });
    expect(root.style.getPropertyValue('--uit-scaled-font-size-24')).toBe('');
    view.unmount();
    expect(root.querySelector('[aria-hidden]')).toBeNull();
  });

  it('leaves non-Android fonts and explicit caller properties unchanged', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Desktop');
    const view = render(<App style={{fontFamily: 'serif', margin: 12}}><span>Content</span></App>);
    const root = view.container.querySelector<HTMLElement>('[data-app-root]')!;
    expect(root.style.getPropertyValue('--uit-scaled-font-size-24')).toBe('');
    expect(root.style.fontFamily).toBe('serif');
    expect(root.style.margin).toBe('12px');
    expect(root.querySelector('span[aria-hidden="true"]')).toBeNull();
  });
});
