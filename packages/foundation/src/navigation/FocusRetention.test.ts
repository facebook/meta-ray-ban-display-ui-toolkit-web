/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useNavigationFocusRetention } from './FocusRetention';

const coordinator = vi.hoisted(() => {
  const events: string[] = [];
  let holdCount = 0;
  return {
    events,
    preserve: vi.fn(() => {
      holdCount += 1;
      const hold = `hold${holdCount}`;
      events.push(`open ${hold}`);
      return () => {
        events.push(`release ${hold}`);
      };
    }),
    reset() {
      events.length = 0;
      holdCount = 0;
    },
  };
});

vi.mock('../base/FocusCoordinator', () => ({
  preserveFocusedInteractableDuringNavigation: coordinator.preserve,
}));

afterEach(() => {
  coordinator.reset();
  coordinator.preserve.mockClear();
});

describe('useNavigationFocusRetention', () => {
  it('releases the previous hold before opening the next one', () => {
    const { rerender, unmount } = renderHook(
      ({ routeKey }) => useNavigationFocusRetention(routeKey),
      { initialProps: { routeKey: '/lists' } },
    );
    expect(coordinator.events).toEqual([]);

    // A Back traversal fires popstate, then the router commits the new route.
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    rerender({ routeKey: '/' });
    rerender({ routeKey: '/settings' });
    unmount();

    expect(coordinator.events).toEqual([
      'open hold1',
      'release hold1',
      'open hold2',
      'release hold2',
      'open hold3',
      'release hold3',
    ]);
  });

  it('ignores re-renders that keep the same route key', () => {
    const { rerender } = renderHook(
      ({ routeKey }) => useNavigationFocusRetention(routeKey),
      { initialProps: { routeKey: '/lists' } },
    );

    rerender({ routeKey: '/lists' });

    expect(coordinator.preserve).not.toHaveBeenCalled();
  });
});
