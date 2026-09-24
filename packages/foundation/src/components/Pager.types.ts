/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

/**
 * Orientation of the view pager.
 */
export const PagerOrientation = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
} as const;
export type PagerOrientation =
  (typeof PagerOrientation)[keyof typeof PagerOrientation];

/**
 * Direction of a page navigation.
 */
export const NavigationDirection = {
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down',
  START: 'start',
  BACK: 'back',
} as const;
export type NavigationDirection =
  (typeof NavigationDirection)[keyof typeof NavigationDirection];

/**
 * Imperative handle exposed via a Pager ref: preload/unload methods plus the
 * navigation-lock, page-count, and transition-progress getters.
 */
export interface PagerHandle {
  /**
   * Force the page at the given index to mount off-screen even when
   * `unmountInactivePages` is enabled. No-op for out-of-range indices.
   *
   * IMPORTANT: eagerly mounting a non-trivial page performs worse than letting
   * it mount during navigation. You almost certainly should not use this.
   */
  preloadPageIfNeeded(index: number): void;
  /**
   * Unmount the page at the given index. Throws when the index is out of range
   * or refers to the currently visible page.
   */
  unloadPage(index: number): void;
  /** Whether navigation is currently locked. */
  isNavigationLocked(): boolean;
  /** Number of pages. */
  pageCount(): number;
  /** Whether a page transition is currently animating. */
  isPageTransitionInProgress(): boolean;
}

export interface PagerInitialFocusRequest {
  /** Direction the new page is being entered from. */
  direction: NavigationDirection;
  /** Index of the page receiving the focus request. */
  pageIndex: number;
  /** Previously visible page index, or -1 when none existed. */
  previousPageIndex: number;
}

export interface PagerAnimationCompletedRequest {
  /** Index of the page whose transition completed. */
  pageIndex: number;
  /** Previously visible page index, or -1 when none existed. */
  previousPageIndex: number;
}

export interface PagerPageProps {
  /** Page content. */
  children?: ReactNode;
  /** Called before this page becomes current. */
  onWillShowPage?: () => void;
  /** Called before this page stops being current. */
  onWillHidePage?: () => void;
  /** Called before this page is unloaded because inactive pages are unmounted. */
  onWillUnloadPage?: () => void;
  /**
   * Called when this page becomes current and should choose initial focus.
   * Return true when the page handled focus; otherwise Pager uses fallback focus.
   */
  onRequestInitialFocus?: (
    request: PagerInitialFocusRequest,
  ) => boolean | void;
  /** Called before pager-level back-to-home handling. Return true to consume back. */
  onWillInterceptBack?: () => boolean;
  /** Return true to block page navigation from this page. */
  shouldPreventNavigation?: () => boolean;
  /** Called after an animated transition into this page completes. */
  onAnimationCompleted?: (
    request: PagerAnimationCompletedRequest,
  ) => void;
  /** Whether this page should perform the peek animation before navigation. */
  peekBeforeNavigation?: boolean;
}

export type PagerPageLifecycle = Omit<PagerPageProps, 'children'>;

export interface PagerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  /**
   * The orientation of the view pager.
   * @default PagerOrientation.HORIZONTAL
   */
  orientation?: PagerOrientation;

  /**
   * The index of the currently visible page (controlled).
   *
   * The current page is a controlled prop that defaults to `0` (the first page)
   * and never surfaces an uninitialized sentinel through this prop. The
   * component resolves a real page index up front so React renders
   * deterministically.
   *
   * NOTE: Controlled updates via this prop are treated as forced navigation and
   * intentionally bypass a page's {@link PagerPageProps.shouldPreventNavigation}
   * veto. The rationale is that the app already owns the source of truth for the
   * controlled index, so the pager honors it rather than letting an inner page
   * reject an app-driven change. This differs from keyboard/focus-driven
   * navigation, which DOES respect `shouldPreventNavigation`. If you need a page
   * to be able to veto an app-driven change, gate the state update in your own
   * component before setting this prop.
   * @default 0
   */
  currentPageIndex?: number;

  /**
   * The initially visible page when `currentPageIndex` is not provided.
   * Later changes to this prop do not change the current page.
   * @default 0
   */
  defaultPageIndex?: number;

  /**
   * Whether Back returns to the home page. Escape provides the desktop fallback.
   * @default true
   */
  useBackButtonForHome?: boolean;

  /**
   * Index of the "home" page to return to on Back or its Escape fallback.
   * @default -1 (meaning no home page)
   */
  homeIndex?: number;

  /**
   * Whether to animate page transitions.
   * @default true
   */
  animated?: boolean;

  /**
   * Callback fired when the current page changes.
   * Receives (newPageIndex, previousPageIndex, animated).
   */
  onPageChange?: (newIndex: number, prevIndex: number, animated: boolean) => void;

  /**
   * Callback fired when navigation is attempted while `navigationLocked` is
   * true. Page-level `shouldPreventNavigation` vetoes do not invoke it.
   */
  onNavigationAttemptWhileLocked?: () => void;

  /**
   * Whether navigation is locked (prevents page changes).
   * @default false
   */
  navigationLocked?: boolean;

  /**
   * Whether inactive pages should be unmounted after transitions settle.
   * @default false
   */
  unmountInactivePages?: boolean;

  /**
   * Whether the initially visible page should receive a START focus request
   * after its content mounts.
   * @default false
   */
  requestInitialFocusOnMount?: boolean;

  /** Page content — each child becomes a page */
  children?: ReactNode;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;

  /** ARIA label alias. Prefer the standard `aria-label` attribute. */
  ariaLabel?: string;

  /** Tab index for keyboard focus */
  tabIndex?: number;
}
