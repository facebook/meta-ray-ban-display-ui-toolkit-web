/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QUICK_SETTINGS_PAGE_INDEX } from './launcherPages';
import { useLauncherNavigation } from './useLauncherNavigation';

describe('useLauncherNavigation detail pages', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('opens the nested Settings and app-grid-style routes', () => {
    const { result } = renderHook(() => useLauncherNavigation({
      isPinningApps: false,
      setAppPinningMode: vi.fn(),
    }));

    act(() => result.current.handleHorizontalPageChange(
      QUICK_SETTINGS_PAGE_INDEX,
    ));
    act(() => result.current.openSettings());
    expect(result.current.activeDetailPage).toBe('settings');
    expect(window.location.hash).toBe('#uit-launcher-page=settings');

    act(() => result.current.openAppGridStyle());
    expect(result.current.activeDetailPage).toBe('appGridStyle');
    expect(result.current.detailTransitionDirection).toBe('forward');
    expect(window.location.hash).toBe('#uit-launcher-page=appGridStyle');
  });

  it('restores each parent route through shared Back navigation', async () => {
    const { result } = renderHook(() => useLauncherNavigation({
      isPinningApps: false,
      setAppPinningMode: vi.fn(),
    }));

    act(() => result.current.handleHorizontalPageChange(
      QUICK_SETTINGS_PAGE_INDEX,
    ));
    act(() => result.current.openSettings());
    act(() => result.current.openAppGridStyle());

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(result.current.activeDetailPage).toBe('settings');
    });
    expect(result.current.detailTransitionDirection).toBe('back');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(result.current.activeDetailPage).toBeNull();
    });
    expect(result.current.horizontalPageIndex).toBe(
      QUICK_SETTINGS_PAGE_INDEX,
    );
  });

  it('restores a directly loaded detail route to its parent', async () => {
    window.history.replaceState({}, '', '#uit-launcher-page=appGridStyle');

    const { result } = renderHook(() => useLauncherNavigation({
      isPinningApps: false,
      setAppPinningMode: vi.fn(),
    }));

    expect(result.current.activeDetailPage).toBe('appGridStyle');
    expect(result.current.horizontalPageIndex).toBe(
      QUICK_SETTINGS_PAGE_INDEX,
    );

    act(() => {
      window.history.back();
    });
    await waitFor(() => {
      expect(window.location.hash).toBe('#uit-launcher-page=settings');
    });
  });

  it('clears a slider mode when its history marker no longer matches', () => {
    const historyBack = vi
      .spyOn(window.history, 'back')
      .mockImplementation(() => {});
    const { result } = renderHook(() => useLauncherNavigation({
      isPinningApps: false,
      setAppPinningMode: vi.fn(),
    }));

    act(() => result.current.handleHorizontalPageChange(
      QUICK_SETTINGS_PAGE_INDEX,
    ));
    act(() => result.current.handleActiveSliderChange('volume'));
    expect(result.current.activeSliderId).toBe('volume');
    window.history.replaceState({}, '', '#foreign-route');

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'BrowserBack',
    });
    act(() => document.dispatchEvent(event));

    expect(result.current.activeSliderId).toBeNull();
    expect(window.location.hash).toBe('#foreign-route');
    expect(historyBack).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
    historyBack.mockRestore();
  });

  it('clears pinning mode when its history marker no longer matches', () => {
    const historyBack = vi
      .spyOn(window.history, 'back')
      .mockImplementation(() => {});
    const setAppPinningMode = vi.fn();
    renderHook(() => useLauncherNavigation({
      isPinningApps: true,
      setAppPinningMode,
    }));
    window.history.replaceState({}, '', '#foreign-route');

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'GoBack',
    });
    act(() => document.dispatchEvent(event));

    expect(setAppPinningMode).toHaveBeenCalledTimes(1);
    expect(setAppPinningMode).toHaveBeenCalledWith(false);
    expect(window.location.hash).toBe('#foreign-route');
    expect(historyBack).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
    historyBack.mockRestore();
  });
});
