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

export const ScrollViewOrientation = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
} as const;
export type ScrollViewOrientation =
  (typeof ScrollViewOrientation)[keyof typeof ScrollViewOrientation];

export interface ScrollViewProps {
  /** Scrollable content. */
  children?: ReactNode;

  /** Length, in pixels, of the fading edge drawn at the top of the vertical scroll axis. */
  topFadingEdgeLength?: number;

  /** Length, in pixels, of the fading edge drawn at the bottom of the vertical scroll axis. */
  bottomFadingEdgeLength?: number;

  /**
   * Length, in pixels, of the fading edge drawn at the left of the horizontal
   * scroll axis. Used when `orientation` is horizontal.
   */
  leftFadingEdgeLength?: number;

  /**
   * Length, in pixels, of the fading edge drawn at the right of the horizontal
   * scroll axis. Used when `orientation` is horizontal.
   */
  rightFadingEdgeLength?: number;

  /** Whether to reserve top inset space for an overlapping header. */
  insetForHeader?: boolean;

  /**
   * Header inset height, in pixels, used when `insetForHeader` is set. Supplied
   * explicitly as a numeric inset.
   */
  headerHeight?: number;

  /**
   * Whether the scrollbar is shown. The single-axis scrollbar (matching the
   * active `orientation`) is opt-in via this prop.
   */
  scrollbarEnabled?: boolean;

  /**
   * Alias for `scrollbarEnabled`. Both control the same single-axis scrollbar
   * that tracks the active `orientation`.
   */
  showScrollbar?: boolean;

  /**
   * Whether fading edges are drawn at the scroll boundaries. Controls whether
   * the scroll edges fade out their content.
   */
  fadingEdgeEnabled?: boolean;

  /**
   * Scroll axis: vertical or horizontal.
   */
  orientation?: ScrollViewOrientation;

  /** Explicit width override. */
  width?: number | string;

  /** Explicit height override. */
  height?: number | string;

  /** Additional CSS class name applied to the root element. */
  className?: string;

  /** Additional CSS class name applied to the scrolling viewport element. */
  scrollContainerClassName?: string;

  /** Inline styles applied to the root element. */
  style?: CSSProperties;

  /** Accessible label for the scroll region. */
  ariaLabel?: string;

  /** Tab index for keyboard focus. */
  tabIndex?: number;

  /** Called with the current scroll offset when the content scrolls. */
  onScroll?: (scrollTop: number) => void;
}
