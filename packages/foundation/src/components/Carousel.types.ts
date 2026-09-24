/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Carousel public API.
 */

import type { CSSProperties, ReactNode } from 'react';
/** Pagination display mode requested from the active device presentation. */
export const PaginationMode = {
  TEXT: 'text',
  DOTS: 'dots',
} as const;
export type PaginationMode =
  (typeof PaginationMode)[keyof typeof PaginationMode];

/**
 * Vertical alignment of carousel items.
 */
export const CarouselVerticalAlignment = {
  CENTER: 'center',
  BOTTOM: 'bottom',
} as const;
export type CarouselVerticalAlignment =
  (typeof CarouselVerticalAlignment)[keyof typeof CarouselVerticalAlignment];

/**
 * Placement of the pagination indicator relative to the carousel.
 */
export const CarouselIndicatorPlacement = {
  /** Indicator is positioned below the carousel, taking up space */
  UNDER: 'under',
  /** Indicator overlays the bottom of the carousel */
  BOTTOM_OVERLAY: 'bottom_overlay',
} as const;
export type CarouselIndicatorPlacement =
  (typeof CarouselIndicatorPlacement)[keyof typeof CarouselIndicatorPlacement];

/**
 * Customization for the pagination / progress indicator.
 *
 * Exposes `currentIndex`, `totalItems`, and `isVisible`, letting a caller
 * override the indexing and visibility of the progress indicator for a given
 * render.
 */
export interface ProgressIndicatorCustomization {
  /**
   * The dot/page that should be rendered as current (0-based). Replaces the
   * active carousel position when provided.
   */
  currentIndex: number;

  /**
   * The total number of dots/pages to render. Replaces the carousel item count
   * when provided.
   */
  totalItems: number;

  /**
   * Whether the progress indicator should be visible; when `false` the
   * indicator is hidden even if it would otherwise be shown.
   */
  isVisible: boolean;
}

/**
 * Imperative handle for the Carousel.
 */
export interface CarouselHandle {
  /**
   * Scroll to, center, and focus the item at the given index. Scrolls the item
   * into view, centers it, focuses it, and fires the `onItemCentered` callback.
   */
  scrollToPosition(index: number): void;

  /**
   * Access the root DOM element of the carousel.
   * Provided so consumers that previously relied on the forwarded
   * `HTMLDivElement` ref (e.g. to query descendant items) can still reach
   * the node.
   */
  getRootElement(): HTMLDivElement | null;
}

export interface CarouselProps {
  /** Carousel items — each child becomes an item */
  children?: ReactNode;

  /**
   * Gap between items, in pixels.
   * @default DEFAULT_CAROUSEL_ITEM_GAP (24)
   */
  itemGap?: number;

  /**
   * Callback fired when an item is centered/focused.
   * Receives the 0-based item index.
   */
  onItemCentered?: (index: number) => void;

  /**
   * Whether to show the pagination indicator.
   * @default true
   */
  showPagination?: boolean;

  /**
   * Pagination display mode.
   * @default PaginationMode.TEXT
   */
  paginationMode?: PaginationMode;

  /**
   * Vertical alignment of items within the carousel.
   * @default CarouselVerticalAlignment.CENTER
   */
  verticalAlignment?: CarouselVerticalAlignment;

  /**
   * Placement of the pagination indicator.
   * @default CarouselIndicatorPlacement.UNDER
   */
  indicatorPlacement?: CarouselIndicatorPlacement;

  /**
   * Distance, in pixels, of the pagination indicator from the bottom of the
   * carousel. Only applies in `CarouselIndicatorPlacement.BOTTOM_OVERLAY`
   * placement; it is ignored in `UNDER` placement.
   * @default DEFAULT_CAROUSEL_OVERLAY_DISTANCE (24)
   */
  overlayDistance?: number;

  /**
   * Initial item index to display.
   * @default 0
   */
  initialIndex?: number;

  /**
   * Length of each horizontal fading edge in pixels.
   * @default 32
   */
  fadingEdgeLength?: number;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;

  /** ARIA label */
  ariaLabel?: string;

  /** Tab index for keyboard focus */
  tabIndex?: number;

  /**
   * Per-render hook to customize the pagination / progress indicator.
   *
   * A `(index, numItems) => ProgressIndicatorCustomization` hook. It is called
   * with the active item index and the total item count whenever the indicator
   * updates; the returned
   * {@link ProgressIndicatorCustomization} drives the indicator's current
   * dot/page (`currentIndex`), total dot/page count (`totalItems`), and
   * visibility (`isVisible`) instead of the defaults.
   *
   * When this returns `isVisible: false` the indicator is hidden even if it
   * would otherwise be shown.
   */
  progressIndicatorCustomizationOverride?: (
    index: number,
    numItems: number,
  ) => ProgressIndicatorCustomization;
}
