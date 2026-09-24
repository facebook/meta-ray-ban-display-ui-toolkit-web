/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ButtonRail public API for Meta Ray-Ban Display.
 */

import type { CSSProperties, ReactNode } from 'react';

export interface ButtonRailProps {
  /** Child elements (typically Button components) */
  children: ReactNode;

  /**
   * Index of the anchor child element.
   * The ButtonRail will try to keep the anchor centered when focused.
   *
   * IMPORTANT: Content on both sides of the anchor should be at least 50%
   * of the ButtonRail width for correct scroll positioning.
   */
  anchorIndex?: number;

  /**
   * Center content when it fits within the rail width.
   * Ignored when an anchor is provided.
   * Default: true
   */
  centerContentWhenSmallerThanWidth?: boolean;

  /**
   * Force-center the focused view within the rail.
   * Essentially 'static cursor' — use only with explicit design approval.
   * Overrides anchor behavior when true.
   * Default: false
   */
  centerFocusedView?: boolean;

  /**
   * Callback when the scroll position changes.
   *
   * @param scrollX - Current horizontal scroll offset (positive = scrolled right)
   * @param deltaX - Change in scroll position
   */
  onScrollChange?: (scrollX: number, deltaX: number) => void;

  /**
   * Callback when a child gains or loses focus within the rail.
   *
   * @param focusedChild - The focused element, or null if focus left the rail
   */
  onChildFocusChange?: (focusedChild: HTMLElement | null) => void;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;
}

/**
 * Imperative handle for ButtonRail.
 *
 * Exposes the following methods:
 * - `skipAnimationForNextFocusMovement` (a one-shot flag consumed by the next
 *   focus-driven scroll)
 * - `resetScrollPositionIfNoFocusedChild(animated)`
 * - `updateScrollPosition(animated)`
 */
export interface ButtonRailHandle {
  /**
   * Skip the scroll animation for the next focus-driven scroll movement.
   *
   * Sets a one-shot flag that is consumed (and cleared) by the next focus
   * change. Call this BEFORE programmatically moving focus to a child to avoid an
   * unwanted scroll animation. Automatically resets after the next focus change.
   */
  skipAnimationForNextFocusMovement(): void;

  /**
   * Reset the scroll position to the default if no child is currently focused.
   * If a child is focused, this is a no-op (focus determines rail position).
   *
   * @param animated If true, the scroll position is animated to the default.
   */
  resetScrollPositionIfNoFocusedChild(animated: boolean): void;

  /**
   * Recompute and apply the scroll position for the last focused child.
   *
   * @param animated If true, the scroll position change is animated.
   */
  updateScrollPosition(animated: boolean): void;

  /**
   * The rail viewport DOM node, or null if unmounted.
   *
   * Preserved so consumers that previously read the root element via the ref
   * (the ref type was formerly `HTMLDivElement`) can still reach it.
   */
  getElement(): HTMLDivElement | null;
}
