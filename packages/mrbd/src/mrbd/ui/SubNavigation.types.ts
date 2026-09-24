/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SubNavigation public API for Meta Ray-Ban Display.
 */

import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { ContainerProps } from '@wearables-ui-toolkit/foundation/components/Container';

/**
 * A single item in the SubNavigation.
 */
export interface SubNavigationItem {
  /** Label text shown when item is active and focused */
  label: string;

  /** Icon source */
  icon: IconSource;

  /**
   * When true, shows an indeterminate loader in place of the icon, with a
   * cross-fade between the icon and the loader.
   */
  isLoading?: boolean;
}

export interface SubNavigationProps
  extends Omit<ContainerProps, 'children' | 'onStateChange'> {
  /** Navigation items */
  items: SubNavigationItem[];

  /**
   * Active item index. Use -1 (or undefined) for no active item.
   *
   * Defaults to -1 (nothing selected): on mount no tab is highlighted (all tabs
   * at inactive alpha) until an active item is explicitly provided.
   */
  active?: number;

  /** Enable auto-hide after timeout */
  autoHide?: boolean;

  /** Callback when active item changes */
  onActiveChange?: (index: number) => void;

  /**
   * Callback fired when the SubNavigation gains or loses focus.
   *
   * Derived from the component's internal focus state, so it fires once on
   * focus enter (`true`) and once on focus leave (`false`).
   */
  onFocusChange?: (hasFocus: boolean) => void;
}

/**
 * Imperative handle for SubNavigation.
 *
 * Exposes `setVisible(visible, animated)` (animated defaults to true).
 */
export interface SubNavigationHandle {
  /**
   * Manually controls the visibility of the subnavigation header. Intended to
   * be used alongside the `autoHide` prop for scroll-aware show/hide behavior.
   *
   * Focus can reveal a hidden header, and showing it restarts the auto-hide
   * timer when `autoHide` is enabled.
   *
   * @param visible Whether the subnavigation header should be visible.
   * @param animated Whether to animate the visibility change (defaults to true).
   */
  setVisible(visible: boolean, animated?: boolean): void;

  /**
   * The root DOM element of the subnavigation, for consumers that need direct
   * access to the underlying `HTMLDivElement`. Null before mount / after
   * unmount.
   */
  getElement(): HTMLDivElement | null;
}
