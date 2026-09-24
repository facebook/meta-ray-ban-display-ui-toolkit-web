/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  preserveFocusedInteractableDuringNavigation,
  useBackNavigation,
  type PageTransitionDirection,
} from '@wearables-ui-toolkit/mrbd';
import {
  getLauncherDetailPage,
  getLauncherDetailPageDepth,
  getLauncherHistoryPage,
  ensureLauncherDetailPageHistory,
  LAUNCHER_HISTORY_PAGES,
  popLauncherPageHistory,
  pushLauncherPageHistory,
  replaceLauncherPageHistory,
  type LauncherDetailPage,
} from './launcherPageHistory';
import {
  getHistoryPageForHorizontalIndex,
  getHorizontalPageIndex,
  getVerticalPageIndex,
  ALL_APPS_PAGE_INDEX,
  HOME_PAGE_INDEX,
  HOME_PANEL_PAGE_INDEX,
  QUICK_SETTINGS_PAGE_INDEX,
  UPPER_PANEL_PAGE_INDEX,
} from './launcherPages';
import type { QuickSettingsSliderId } from './quickSettingsOverlay';
import {
  isTransientModeHistoryActive,
  popTransientModeHistory,
  pushTransientModeHistory,
} from './transientModeHistory';

interface UseLauncherNavigationOptions {
  isPinningApps: boolean;
  setAppPinningMode: (enabled: boolean) => void;
}

export function useLauncherNavigation({
  isPinningApps,
  setAppPinningMode,
}: UseLauncherNavigationOptions) {
  const initialHistoryPageRef = useRef(getLauncherHistoryPage());
  const initialHistoryPage = initialHistoryPageRef.current;
  const [activeSliderId, setActiveSliderId] =
    useState<QuickSettingsSliderId | null>(null);
  const [activeDetailPage, setActiveDetailPage] =
    useState<LauncherDetailPage | null>(() =>
      getLauncherDetailPage(initialHistoryPage));
  const [detailTransitionDirection, setDetailTransitionDirection] =
    useState<PageTransitionDirection>('forward');
  const [focusLockedSliderId, setFocusLockedSliderId] =
    useState<QuickSettingsSliderId | null>(null);
  const initialHorizontalPageIndex =
    getHorizontalPageIndex(initialHistoryPage);
  const initialVerticalPageIndex = getVerticalPageIndex(initialHistoryPage);
  const [horizontalPageIndex, setHorizontalPageIndex] =
    useState(initialHorizontalPageIndex);
  const [verticalPageIndex, setVerticalPageIndex] =
    useState(initialVerticalPageIndex);
  const activeSliderIdRef = useRef<QuickSettingsSliderId | null>(null);
  const activeDetailPageRef = useRef<LauncherDetailPage | null>(
    getLauncherDetailPage(initialHistoryPage),
  );
  const isPinningAppsRef = useRef(isPinningApps);
  const horizontalPageIndexRef = useRef(initialHorizontalPageIndex);
  const verticalPageIndexRef = useRef(initialVerticalPageIndex);
  // `handleBackNavigation` is registered once with `useBackNavigation` and
  // reads all of its inputs through refs so it never needs re-creating. This
  // prop is one of those inputs: capturing it in the closure would pin the
  // first render's setter, so a caller passing a non-stable `setAppPinningMode`
  // would see Back close pinning mode against stale state.
  const setAppPinningModeRef = useRef(setAppPinningMode);

  useEffect(() => {
    const initialDetailPage = getLauncherDetailPage(initialHistoryPage);
    if (initialDetailPage != null) {
      ensureLauncherDetailPageHistory(initialDetailPage);
    }
  }, [initialHistoryPage]);

  useEffect(() => {
    activeSliderIdRef.current = activeSliderId;
  }, [activeSliderId]);

  useEffect(() => {
    isPinningAppsRef.current = isPinningApps;
  }, [isPinningApps]);

  useEffect(() => {
    setAppPinningModeRef.current = setAppPinningMode;
  }, [setAppPinningMode]);

  const handleActiveSliderChange = useCallback((
    sliderId: QuickSettingsSliderId | null,
  ) => {
    const previousSliderId = activeSliderIdRef.current;
    if (previousSliderId == null && sliderId != null) {
      pushTransientModeHistory('quickSettingsSlider');
    } else if (previousSliderId != null && sliderId == null) {
      popTransientModeHistory('quickSettingsSlider');
    }
    if (sliderId != null) {
      setFocusLockedSliderId(sliderId);
    }
    activeSliderIdRef.current = sliderId;
    setActiveSliderId(sliderId);
  }, []);

  const handlePinningModeChange = useCallback((enabled: boolean) => {
    const wasEnabled = isPinningAppsRef.current;
    if (!wasEnabled && enabled) {
      pushTransientModeHistory('appPinning');
    } else if (wasEnabled && !enabled) {
      popTransientModeHistory('appPinning');
    }
    isPinningAppsRef.current = enabled;
    setAppPinningMode(enabled);
  }, [setAppPinningMode]);

  const openDetailPage = useCallback((page: LauncherDetailPage) => {
    if (activeDetailPageRef.current === page) {
      return;
    }
    pushLauncherPageHistory(page);
    activeDetailPageRef.current = page;
    setDetailTransitionDirection('forward');
    setActiveDetailPage(page);
  }, []);

  const handleBackNavigation = useCallback(() => {
    // A visible transient mode owns this Back even when its history marker is
    // missing or foreign: close the mode locally and claim the event. Falling
    // through would also pop the parent route/hash.
    if (activeSliderIdRef.current != null) {
      if (!popTransientModeHistory('quickSettingsSlider')) {
        activeSliderIdRef.current = null;
        setActiveSliderId(null);
      }
      return true;
    }
    if (isPinningAppsRef.current) {
      if (!popTransientModeHistory('appPinning')) {
        isPinningAppsRef.current = false;
        setAppPinningModeRef.current(false);
      }
      return true;
    }

    const historyPage = getLauncherHistoryPage();
    return historyPage == null
      ? false
      : popLauncherPageHistory(historyPage);
  }, []);
  const openAppGridStyle = useCallback(() => {
    openDetailPage(LAUNCHER_HISTORY_PAGES.APP_GRID_STYLE);
  }, [openDetailPage]);
  const openSettings = useCallback(() => {
    openDetailPage(LAUNCHER_HISTORY_PAGES.SETTINGS);
  }, [openDetailPage]);

  useBackNavigation(handleBackNavigation);

  useEffect(() => {
    const handlePopState = () => {
      // Some embedded browsers briefly focus their root while applying a
      // same-document history entry. Retaining the toolkit focus avoids a visible
      // unfocus/refocus flash while Back dismisses a page or temporary mode.
      const isHandlingLauncherNavigation =
        activeSliderIdRef.current != null ||
        activeDetailPageRef.current != null ||
        isPinningAppsRef.current ||
        horizontalPageIndexRef.current !== HOME_PAGE_INDEX ||
        verticalPageIndexRef.current !== HOME_PANEL_PAGE_INDEX ||
        getLauncherHistoryPage() != null;
      if (isHandlingLauncherNavigation) {
        preserveFocusedInteractableDuringNavigation();
      }

      if (
        activeSliderIdRef.current != null &&
        !isTransientModeHistoryActive('quickSettingsSlider')
      ) {
        activeSliderIdRef.current = null;
        setActiveSliderId(null);
      }
      if (
        isPinningAppsRef.current &&
        !isTransientModeHistoryActive('appPinning')
      ) {
        isPinningAppsRef.current = false;
        setAppPinningMode(false);
      }

      const historyPage = getLauncherHistoryPage();
      const nextDetailPage = getLauncherDetailPage(historyPage);
      const previousDetailDepth = getLauncherDetailPageDepth(
        activeDetailPageRef.current,
      );
      const nextDetailDepth = getLauncherDetailPageDepth(nextDetailPage);
      setDetailTransitionDirection(
        nextDetailDepth > previousDetailDepth ? 'forward' : 'back',
      );
      activeDetailPageRef.current = nextDetailPage;
      setActiveDetailPage(nextDetailPage);
      const nextHorizontalPageIndex = getHorizontalPageIndex(historyPage);
      const nextVerticalPageIndex = getVerticalPageIndex(historyPage);
      horizontalPageIndexRef.current = nextHorizontalPageIndex;
      verticalPageIndexRef.current = nextVerticalPageIndex;
      setHorizontalPageIndex(nextHorizontalPageIndex);
      setVerticalPageIndex(nextVerticalPageIndex);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setAppPinningMode]);

  const handleHorizontalPageChange = useCallback((pageIndex: number) => {
    const previousPageIndex = horizontalPageIndexRef.current;
    if (pageIndex !== QUICK_SETTINGS_PAGE_INDEX) {
      setFocusLockedSliderId(null);
      handleActiveSliderChange(null);
    }
    if (pageIndex !== ALL_APPS_PAGE_INDEX && isPinningAppsRef.current) {
      handlePinningModeChange(false);
    }

    const historyPage = getHistoryPageForHorizontalIndex(pageIndex);
    const previousHistoryPage =
      getHistoryPageForHorizontalIndex(previousPageIndex);
    if (previousHistoryPage == null && historyPage != null) {
      pushLauncherPageHistory(historyPage);
    } else if (previousHistoryPage != null && historyPage == null) {
      popLauncherPageHistory(previousHistoryPage);
    } else if (
      previousHistoryPage != null &&
      historyPage != null &&
      previousHistoryPage !== historyPage
    ) {
      replaceLauncherPageHistory(historyPage);
    }

    horizontalPageIndexRef.current = pageIndex;
    setHorizontalPageIndex(pageIndex);
  }, [handleActiveSliderChange, handlePinningModeChange]);

  const handleVerticalPageChange = useCallback((pageIndex: number) => {
    const previousPageIndex = verticalPageIndexRef.current;
    if (
      previousPageIndex === HOME_PANEL_PAGE_INDEX &&
      pageIndex === UPPER_PANEL_PAGE_INDEX
    ) {
      pushLauncherPageHistory(LAUNCHER_HISTORY_PAGES.UPPER_PANEL);
    } else if (
      previousPageIndex === UPPER_PANEL_PAGE_INDEX &&
      pageIndex === HOME_PANEL_PAGE_INDEX
    ) {
      popLauncherPageHistory(LAUNCHER_HISTORY_PAGES.UPPER_PANEL);
    }
    verticalPageIndexRef.current = pageIndex;
    setVerticalPageIndex(pageIndex);
  }, []);
  const releaseSliderFocusLock = useCallback(() => {
    setFocusLockedSliderId(null);
  }, []);

  return {
    activeDetailPage,
    activeSliderId,
    detailTransitionDirection,
    focusLockedSliderId,
    handleActiveSliderChange,
    handleHorizontalPageChange,
    handlePinningModeChange,
    handleVerticalPageChange,
    horizontalPageIndex,
    isSliderOverlayActive:
      horizontalPageIndex === QUICK_SETTINGS_PAGE_INDEX && activeSliderId != null,
    openAppGridStyle,
    openSettings,
    releaseSliderFocusLock,
    verticalPageIndex,
  };
}
