/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ButtonHandle } from '@wearables-ui-toolkit/mrbd/Button';
import type { ButtonRailHandle } from '@wearables-ui-toolkit/mrbd/ButtonRail';
import { useBackNavigation } from '@wearables-ui-toolkit/mrbd';
import type {
  LauncherPage,
  RailFocusTarget,
} from './launcherTypes';
import { useHostResumeFocus } from './useHostResumeFocus';

const LAST_RAIL_FOCUS_KEY = 'alpha-launcher-last-rail-focus';
const PAGE_FADE_DURATION_MS = 200;
const FOCUS_SETTLE_DURATION_MS = 300;
const FOCUS_COORDINATOR_HANDOFF_MS = 250;
const RAIL_BACK_FOCUS_RESTORE_DELAY_MS = 300;
const RAIL_BACK_GUARD_STATE_KEY = 'alphaLauncherRailBackGuard';

function createRailBackGuardId(): string {
  // A unique value prevents a stale same-URL history entry from being mistaken
  // for the guard created during this page session.
  return String(Date.now()) + '-' + String(Math.random());
}

function getPageFromLocation(): LauncherPage | null {
  const page = new URLSearchParams(window.location.search).get('page');
  return page === 'brightness' ||
    page === 'volume' ||
    page === 'notifications' ||
    page === 'settings'
    ? page
    : null;
}

function getRailFocusTarget(): RailFocusTarget {
  const lastTarget = window.sessionStorage.getItem(LAST_RAIL_FOCUS_KEY);
  return lastTarget === 'brightness' ||
    lastTarget === 'volume' ||
    lastTarget === 'notifications' ||
    lastTarget === 'settings'
    ? lastTarget
    : 'notifications';
}

function getPageUrl(page: LauncherPage): string {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  url.hash = '';
  return url.toString();
}

function getRailButtonTitle(target: RailFocusTarget): string {
  if (target === 'brightness') {
    return 'Brightness';
  }
  if (target === 'volume') {
    return 'Volume';
  }
  if (target === 'settings') {
    return 'Settings';
  }
  return 'Notifications';
}

/**
 * Owns navigation and focus behavior that is shared by every launcher screen.
 *
 * Keeping this browser integration in one hook lets the screen components stay
 * focused on demonstrating the toolkit composition. The same-page history entry makes
 * device Back return to Notifications before the host offers to exit.
 * Host-menu focus restoration is delegated to useHostResumeFocus so the
 * browser-history behavior remains readable here.
 */
export function useLauncherNavigation() {
  const [activePage, setActivePage] =
    useState<LauncherPage | null>(getPageFromLocation);
  const [isLeavingPage, setIsLeavingPage] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);
  const [railFocusTarget, setRailFocusTarget] =
    useState<RailFocusTarget>(getRailFocusTarget);
  // Bumped whenever the document is shown again after a cross-document
  // traversal, so the shared focus/ready effect below re-runs exactly as it
  // does on a first mount instead of staying wedged in its previous state.
  const [restoreNonce, setRestoreNonce] = useState(0);

  const buttonRailRef = useRef<ButtonRailHandle>(null);
  const notificationsButtonRef = useRef<ButtonHandle>(null);
  const railBackGuardIdRef = useRef<string | null>(null);
  const isDisarmingRailBackGuardRef = useRef(false);
  const isRestoringNotificationsRef = useRef(false);
  const railBackFocusTimerRef = useRef(0);
  const navigationTimerRef = useRef(0);
  const pageReadyTimerRef = useRef(0);
  const {
    rememberFocusedButton,
    restoreLastFocusedButton,
  } = useHostResumeFocus(activePage, buttonRailRef);

  const schedulePageReady = useCallback(() => {
    window.clearTimeout(pageReadyTimerRef.current);
    pageReadyTimerRef.current = window.setTimeout(() => {
      setIsPageReady(true);
    }, FOCUS_SETTLE_DURATION_MS);
  }, []);

  const scheduleRailPageReady = useCallback(() => {
    window.sessionStorage.removeItem(LAST_RAIL_FOCUS_KEY);
    schedulePageReady();
  }, [schedulePageReady]);

  const scheduleNotificationsFocus = useCallback(() => {
    // History traversal restores the previous DOM focus after popstate. Waiting
    // for that restoration prevents it from overriding Notifications.
    isRestoringNotificationsRef.current = true;
    window.clearTimeout(railBackFocusTimerRef.current);
    railBackFocusTimerRef.current = window.setTimeout(() => {
      notificationsButtonRef.current?.getElement()?.focus();
      isRestoringNotificationsRef.current = false;
    }, RAIL_BACK_FOCUS_RESTORE_DELAY_MS);
  }, []);

  /**
   * Restores the hook to "showing whatever the URL says, nothing in flight".
   *
   * Shared by every way a launcher screen can be re-shown, so the restore
   * behavior cannot drift per surface: same-document history traversal
   * (popstate) and cross-document restore from the back/forward cache
   * (pageshow with `persisted`).
   *
   * Bumping the nonce is part of the restore, not an extra step a caller can
   * forget: it re-runs the shared focus/ready effect below. Without it a
   * restore that lands on the page already in `activePage` — a same-URL
   * traversal, or Back into the screen you were already on — would clear
   * `isPageReady` with no dependency change to set it again, leaving the
   * screen wedged at zero opacity: the same black screen, by a different route.
   */
  const restoreNavigationStateFromLocation = useCallback(() => {
    window.clearTimeout(navigationTimerRef.current);
    window.clearTimeout(pageReadyTimerRef.current);
    window.clearTimeout(railBackFocusTimerRef.current);
    setActivePage(getPageFromLocation());
    setRailFocusTarget(getRailFocusTarget());
    setIsLeavingPage(false);
    setIsPageReady(false);
    setRestoreNonce(nonce => nonce + 1);
  }, []);

  useEffect(() => {
    // Page content mounts before the toolkit focus coordinator finishes its own
    // handoff. Apply initial focus after that handoff to avoid visible flashes.
    const timeout = window.setTimeout(() => {
      if (activePage === 'brightness' || activePage === 'volume') {
        document.querySelector<HTMLElement>('[role="slider"]')?.focus();
        schedulePageReady();
        return;
      }

      if (activePage === 'notifications' || activePage === 'settings') {
        const pageSelector =
          '[data-alpha-list-page="' + activePage + '"] [data-uit-interactable]';
        document.querySelector<HTMLElement>(pageSelector)?.focus();
        schedulePageReady();
        return;
      }

      const targetTitle = getRailButtonTitle(railFocusTarget);
      Array.from(
        document.querySelectorAll<HTMLElement>('[role="button"]'),
      ).find(button => button.textContent === targetTitle)?.focus();
      scheduleRailPageReady();
    }, FOCUS_COORDINATOR_HANDOFF_MS);
    return () => window.clearTimeout(timeout);
  }, [
    activePage,
    railFocusTarget,
    restoreNonce,
    schedulePageReady,
    scheduleRailPageReady,
  ]);

  const openPage = useCallback((page: LauncherPage) => {
    window.sessionStorage.setItem(LAST_RAIL_FOCUS_KEY, page);
    setIsLeavingPage(true);
    // Let the CSS fade finish before adding the destination URL to history.
    navigationTimerRef.current = window.setTimeout(() => {
      window.location.assign(getPageUrl(page));
    }, PAGE_FADE_DURATION_MS);
  }, []);

  const closePage = useCallback(() => {
    setIsLeavingPage(true);
    navigationTimerRef.current = window.setTimeout(() => {
      window.history.back();
    }, PAGE_FADE_DURATION_MS);
  }, []);

  const handleRailChildFocus = useCallback(
    (focusedChild: HTMLElement | null) => {
      if (focusedChild == null) {
        if (activePage == null) {
          restoreLastFocusedButton(0);
        }
        return;
      }

      if (activePage != null || isRestoringNotificationsRef.current) {
        return;
      }

      rememberFocusedButton(focusedChild);

      const notificationsButton =
        notificationsButtonRef.current?.getElement();
      if (focusedChild === notificationsButton) {
        if (railBackGuardIdRef.current != null) {
          // Only traverse when this document can still prove it owns the
          // current entry. A live ref is not that proof: it survives a restored
          // document, and an entry can be replaced or consumed without clearing
          // it. Where the samples are served as siblings on one origin they
          // share a history stack, so popping an entry we do not own navigates
          // out of the launcher into a neighbouring app. Same contract the
          // launcher's transient modes follow: when the marker is missing or
          // foreign, clear locally and keep the parent entry.
          const ownsCurrentEntry =
            window.history.state?.[RAIL_BACK_GUARD_STATE_KEY] ===
            railBackGuardIdRef.current;
          if (ownsCurrentEntry) {
            isDisarmingRailBackGuardRef.current = true;
            isRestoringNotificationsRef.current = true;
            window.history.back();
          } else {
            railBackGuardIdRef.current = null;
            scheduleNotificationsFocus();
          }
        }
        return;
      }

      if (railBackGuardIdRef.current == null) {
        // This same-URL entry gives device Back something to consume while a
        // non-anchor button is focused. Popping it returns focus to the anchor.
        const guardId = createRailBackGuardId();
        window.history.pushState(
          {
            ...(window.history.state ?? {}),
            [RAIL_BACK_GUARD_STATE_KEY]: guardId,
          },
          '',
          window.location.href,
        );
        railBackGuardIdRef.current = guardId;
      }
    },
    [
      activePage,
      rememberFocusedButton,
      restoreLastFocusedButton,
      scheduleNotificationsFocus,
    ],
  );

  useEffect(() => {
    const handlePageChanged = (event: PopStateEvent) => {
      if (isDisarmingRailBackGuardRef.current) {
        isDisarmingRailBackGuardRef.current = false;
        railBackGuardIdRef.current = null;
        scheduleNotificationsFocus();
        return;
      }

      const nextPage = getPageFromLocation();
      const landedOnRailBackGuard =
        event.state?.[RAIL_BACK_GUARD_STATE_KEY] ===
        railBackGuardIdRef.current;
      if (
        nextPage == null &&
        railBackGuardIdRef.current != null &&
        !landedOnRailBackGuard
      ) {
        railBackGuardIdRef.current = null;
        scheduleNotificationsFocus();
        return;
      }

      window.clearTimeout(navigationTimerRef.current);
      window.clearTimeout(pageReadyTimerRef.current);
      window.clearTimeout(railBackFocusTimerRef.current);
      restoreNavigationStateFromLocation();
    };
    window.addEventListener('popstate', handlePageChanged);
    return () => {
      window.clearTimeout(navigationTimerRef.current);
      window.clearTimeout(pageReadyTimerRef.current);
      window.clearTimeout(railBackFocusTimerRef.current);
      window.removeEventListener('popstate', handlePageChanged);
    };
  }, [restoreNavigationStateFromLocation, scheduleNotificationsFocus]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) {
        return;
      }
      // Navigating between launcher screens replaces the document, so Back is a
      // cross-document traversal and the browser restores this document from
      // the back/forward cache with its React state exactly as it was left —
      // including the fade-out started just before leaving, which renders the
      // whole screen at zero opacity. `popstate` does not cover this case, so
      // every screen needs the same restore here, not a per-surface guard.
      isDisarmingRailBackGuardRef.current = false;
      isRestoringNotificationsRef.current = false;
      railBackGuardIdRef.current = null;
      restoreNavigationStateFromLocation();
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [restoreNavigationStateFromLocation]);

  const handleBack = useCallback(() => {
    if (activePage != null) {
      closePage();
      return true;
    }

    const notificationsButton =
      notificationsButtonRef.current?.getElement();
    if (
      notificationsButton != null &&
      document.activeElement !== notificationsButton
    ) {
      notificationsButton.focus();
      return true;
    }

    return false;
  }, [activePage, closePage]);
  useBackNavigation(handleBack);

  return {
    activePage,
    isLeavingPage,
    isPageReady,
    railFocusTarget,
    buttonRailRef,
    notificationsButtonRef,
    openPage,
    closePage,
    handleRailChildFocus,
  };
}
