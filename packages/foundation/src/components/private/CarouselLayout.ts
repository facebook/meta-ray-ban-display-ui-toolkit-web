/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { PaginationMode } from '../Carousel.types';
import {
  getFadingEdgeOverlayStyles,
  type FadingEdgeOverlayStyles,
  type FadingEdgeLengths,
  type ScrollMetrics,
} from './FadingEdges';
import {
  CarouselIndicatorPlacement,
  CarouselVerticalAlignment,
} from '../Carousel.types';

export interface CarouselEdgeOffsets {
  start: number;
  end: number;
}

/**
 * Default gap between carousel items, in px (24). It is inlined as a number
 * because the spacing tokens exist only as CSS custom properties (strings),
 * which cannot feed this numeric layout math, following the same convention as
 * the other metrics constants.
 */
export const DEFAULT_CAROUSEL_ITEM_GAP = 24;

/**
 * Default fading-edge length, in px (32). The horizontal fade uses the small
 * fading-edge length (32) on Meta Ray-Ban Display, rather than the medium (64) value.
 */
export const DEFAULT_CAROUSEL_FADING_EDGE_LENGTH = 32;

/**
 * Default distance, in px (24), of the pagination indicator from the bottom of
 * the carousel in `BOTTOM_OVERLAY` placement.
 *
 * As with `DEFAULT_CAROUSEL_ITEM_GAP`, the value is inlined here because the
 * package has no shared numeric spacing-token module.
 */
export const DEFAULT_CAROUSEL_OVERLAY_DISTANCE = 24;

const FOCUSABLE_DESCENDANT_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function getFirstCarouselFocusableDescendant(
  element: HTMLElement,
): HTMLElement | null {
  return Array.from(element.querySelectorAll(FOCUSABLE_DESCENDANT_SELECTOR)).find(
    (candidate): candidate is HTMLElement =>
      candidate instanceof HTMLElement && candidate !== element,
  ) ?? null;
}

export function getCarouselEdgeOffsets(
  scrollArea: HTMLElement | null,
  itemRefs: Array<HTMLElement | null>,
  itemCount: number,
): CarouselEdgeOffsets {
  if (scrollArea == null || itemCount === 0) {
    return { start: 0, end: 0 };
  }

  const firstItem = itemRefs[0];
  const lastItem = itemRefs[itemCount - 1];
  return {
    start: firstItem ? Math.max(0, (scrollArea.clientWidth - firstItem.offsetWidth) / 2) : 0,
    end: lastItem ? Math.max(0, (scrollArea.clientWidth - lastItem.offsetWidth) / 2) : 0,
  };
}

export function areCarouselEdgeOffsetsEqual(
  a: CarouselEdgeOffsets,
  b: CarouselEdgeOffsets,
): boolean {
  return a.start === b.start && a.end === b.end;
}

export function getCarouselScrollTarget(
  scrollArea: HTMLElement,
  itemElement: HTMLElement,
): number {
  const scrollAreaCenter = scrollArea.clientWidth / 2;
  const itemCenter = itemElement.offsetLeft + itemElement.clientWidth / 2;
  return Math.max(0, itemCenter - scrollAreaCenter);
}

export function isCarouselIndexInRange(index: number, itemCount: number): boolean {
  return index >= 0 && index < itemCount;
}

export function getCarouselIndexForKey(
  key: string,
  currentIndex: number,
  itemCount: number,
): number | null {
  if (key === 'ArrowLeft' && currentIndex > 0) {
    return currentIndex - 1;
  }

  if (key === 'ArrowRight' && currentIndex < itemCount - 1) {
    return currentIndex + 1;
  }

  return null;
}

export function shouldShowCarouselPagination(
  showPagination: boolean,
  itemCount: number,
  paginationMode: PaginationMode,
): boolean {
  if (!showPagination) {
    return false;
  }

  return paginationMode === PaginationMode.TEXT
    ? itemCount >= 1
    : itemCount >= 2;
}

export function getCarouselAlignmentClass(
  verticalAlignment: CarouselVerticalAlignment,
  styles: { alignBottom: string; alignCenter: string },
): string {
  return verticalAlignment === CarouselVerticalAlignment.BOTTOM
    ? styles.alignBottom
    : styles.alignCenter;
}

export function getCarouselFadingEdgeLengths(
  fadingEdgeLength: number = DEFAULT_CAROUSEL_FADING_EDGE_LENGTH,
): FadingEdgeLengths {
  return {
    left: fadingEdgeLength,
    right: fadingEdgeLength,
  };
}

export function getCarouselFadingEdgeOverlayStyles(
  scrollMetrics: ScrollMetrics,
  fadingEdgeLength: number,
): FadingEdgeOverlayStyles {
  return getFadingEdgeOverlayStyles(
    scrollMetrics,
    getCarouselFadingEdgeLengths(fadingEdgeLength),
  );
}

export function getCarouselItemStyle({
  index,
  itemCount,
  edgeOffsets,
  itemGap,
}: {
  index: number;
  itemCount: number;
  edgeOffsets: CarouselEdgeOffsets;
  itemGap: number;
}): CSSProperties {
  return {
    marginLeft: index === 0 ? edgeOffsets.start : itemGap / 2,
    marginRight: index === itemCount - 1 ? edgeOffsets.end : itemGap / 2,
  };
}

export function getCarouselPaginationClassName({
  indicatorPlacement,
  paginationMode,
  styles,
}: {
  indicatorPlacement: CarouselIndicatorPlacement;
  paginationMode: PaginationMode;
  styles: {
    paginationContainer: string;
    paginationOverlay: string;
    paginationUnder: string;
    paginationDots: string;
    paginationText: string;
  };
}): string {
  const placementClass =
    indicatorPlacement === CarouselIndicatorPlacement.BOTTOM_OVERLAY
      ? styles.paginationOverlay
      : styles.paginationUnder;
  const modeClass =
    paginationMode === PaginationMode.DOTS
      ? styles.paginationDots
      : styles.paginationText;

  return `${styles.paginationContainer} ${placementClass} ${modeClass}`;
}

/**
 * Resolve the inline style for the pagination container.
 *
 * In `BOTTOM_OVERLAY` placement the progress indicator's bottom offset is set
 * to `overlayDistance`; in `UNDER` placement the offset is 0, so
 * `overlayDistance` is ignored.
 */
export function getCarouselPaginationStyle({
  indicatorPlacement,
  overlayDistance,
}: {
  indicatorPlacement: CarouselIndicatorPlacement;
  overlayDistance: number;
}): CSSProperties {
  if (indicatorPlacement !== CarouselIndicatorPlacement.BOTTOM_OVERLAY) {
    return {};
  }

  return { paddingBottom: overlayDistance };
}

export function getCarouselClassName(
  styles: { carousel: string },
  className: string,
): string {
  return [styles.carousel, className].filter(Boolean).join(' ');
}
