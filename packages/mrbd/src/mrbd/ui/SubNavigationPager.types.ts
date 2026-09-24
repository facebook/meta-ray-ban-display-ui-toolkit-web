/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  ReactNode,
} from 'react';
import type { SubNavigationItem } from './SubNavigation';

export interface SubNavigationPagerProps {
  /**
   * Navigation items — each item corresponds to a page in the Pager.
   * Items are displayed in the SubNavigation tab bar.
   */
  items: SubNavigationItem[];

  /**
   * Page content — each child becomes a page in the Pager.
   * The number of children should match the number of items.
   */
  children?: ReactNode;

  /**
   * Whether the Escape key navigates to the home page.
   * Delegated to the underlying Pager.
   * @default true
   */
  useBackButtonForHome?: boolean;

  /**
   * Index of the "home" page to return to on Escape.
   * Delegated to the underlying Pager.
   * @default -1
   */
  homeIndex?: number;

  /**
   * Enables automatic hiding of the SubNavigation header after a timeout period.
   * When enabled, the SubNavigation fades out after inactivity and fades back in
   * when focused. Use setVisible to manually control visibility.
   * @default false
   */
  autoHide?: boolean;

  /**
   * Controls whether the SubNavigation header is entirely disabled (hidden from layout).
   * When true, hides SubNavigation and removes it from layout entirely.
   * Independent from autoHide/setVisible which control alpha for fade animations.
   * @default false
   */
  subNavigationDisabled?: boolean;

  /**
   * Controls whether the SubNavigation header has an additional top margin
   * (`SUBNAVIGATION_TOP_MARGIN` = 20px). Defaults to true; disable only for
   * hosts that own the top inset themselves.
   * @default true
   */
  enableTopPadding?: boolean;

  /**
   * Callback fired when the current page changes.
   * Receives (newPageIndex, previousPageIndex, animated).
   */
  onPageChange?: (
    newIndex: number,
    prevIndex: number,
    animated: boolean,
  ) => void;

  /**
   * Whether navigation is locked (prevents page changes).
   * @default false
   */
  navigationLocked?: boolean;

  /**
   * Callback fired when navigation is attempted while locked.
   */
  onNavigationAttemptWhileLocked?: () => void;

  /**
   * The index of the currently visible page (controlled).
   * @default 0
   */
  currentPageIndex?: number;

  /**
   * The initially visible page when `currentPageIndex` is not provided.
   * @default 0
   */
  defaultPageIndex?: number;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;

  /** ARIA label for the component */
  ariaLabel?: string;
}
