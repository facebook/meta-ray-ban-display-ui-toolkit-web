/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePrefersReducedMotion } from '@wearables-ui-toolkit/foundation/motion/usePrefersReducedMotion';

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shares one media-query listener across mounted consumers', () => {
    let matches = false;
    const listeners = new Set<() => void>();
    const addEventListener = vi.fn((_type: string, listener: () => void) => {
      listeners.add(listener);
    });
    const removeEventListener = vi.fn((_type: string, listener: () => void) => {
      listeners.delete(listener);
    });
    const query = {
      get matches() {
        return matches;
      },
      addEventListener,
      removeEventListener,
    } as unknown as MediaQueryList;
    vi.stubGlobal('matchMedia', vi.fn(() => query));

    const first = renderHook(usePrefersReducedMotion);
    const second = renderHook(usePrefersReducedMotion);

    expect(first.result.current).toBe(false);
    expect(second.result.current).toBe(false);
    expect(addEventListener).toHaveBeenCalledTimes(1);

    matches = true;
    act(() => listeners.forEach(listener => listener()));

    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);

    first.unmount();
    expect(removeEventListener).not.toHaveBeenCalled();
    second.unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('reads a fresh media query after the final consumer unmounts', () => {
    const firstQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    const secondQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    const matchMedia = vi.fn()
      .mockReturnValueOnce(firstQuery)
      .mockReturnValueOnce(secondQuery);
    vi.stubGlobal('matchMedia', matchMedia);

    const first = renderHook(usePrefersReducedMotion);
    expect(first.result.current).toBe(false);
    first.unmount();

    const second = renderHook(usePrefersReducedMotion);
    expect(second.result.current).toBe(true);
    second.unmount();
    expect(matchMedia).toHaveBeenCalledTimes(2);
  });
});
