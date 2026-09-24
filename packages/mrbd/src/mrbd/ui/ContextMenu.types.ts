/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ContextMenu public API for Meta Ray-Ban Display.
 */

import type { ReactNode } from 'react';
import type { StaticContainerProps } from '@wearables-ui-toolkit/foundation';

/** Reasons why the context menu requests dismissal */
export const DismissReason = {
  /** User navigated vertically (up or down) beyond the menu edges */
  NAVIGATION: 'navigation',
  /** User pressed the Escape/back key */
  BACK_BUTTON: 'back_button',
} as const;
export type DismissReason =
  (typeof DismissReason)[keyof typeof DismissReason];

export interface ContextMenuProps
  extends Omit<StaticContainerProps, 'children' | 'height'> {
  /** Menu item elements (ContextMenuItemView instances) */
  children?: ReactNode;

  /** Callback when the user attempts to dismiss the menu */
  onDismiss?: (reason: DismissReason) => void;

  /**
   * Whether to show the tail (arrow pointer) when anchored.
   * When false, the tail is hidden and spacing to anchor is reduced.
   * Defaults to true.
   */
  showTail?: boolean;

  /** Tail direction (controlled by tooltip positioning) */
  tailDirection?: 'up' | 'down';

  /** Tail horizontal center position in px (relative to menu left edge) */
  tailCenterX?: number;

  /** Max measured popup width supplied by Tooltip positioning. */
  maxWidth?: number;

  /** Anchor element supplied by InteractableBase when rendered as a focusable tooltip. */
  focusSearchOrigin?: HTMLElement | null;

  /**
   * Length of each horizontal fading edge in pixels. Exposed as a prop so
   * consumers can tune the edge fade per instance.
   *
   * @default 64
   */
  fadingEdgeLength?: number;
}

/**
 * Imperative handle for ContextMenu.
 */
export interface ContextMenuHandle {
  /**
   * Scroll the item at the given index into view.
   *
   * @param index The index of the item to scroll to.
   * @param smooth If true, scroll smoothly; otherwise jump immediately. Defaults to true.
   */
  scrollToItem: (index: number, smooth?: boolean) => void;

  /**
   * Get the root DOM element of the context menu, or null if unmounted.
   * Provided for consumers that previously relied on the forwarded DOM node ref.
   */
  getElement: () => HTMLDivElement | null;
}
