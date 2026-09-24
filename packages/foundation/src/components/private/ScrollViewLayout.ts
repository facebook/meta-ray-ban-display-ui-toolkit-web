/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  FADING_EDGE_LENGTH_MEDIUM,
  type FadingEdgeLengths,
  type ScrollMetrics,
} from './FadingEdges';
import { ScrollViewOrientation } from '../ScrollView.types';
import type {
  ScrollDirection,
  ScrollViewFadingEdgeLengthInput,
  ScrollViewFrameStyleInput,
  ScrollViewStyleInput,
  ScrollbarGeometry,
} from './ScrollViewLayout.types';
import {
  FOCUSABLE_SELECTOR,
  SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
} from '../../base/FocusNavigationEvents';

export type {
  ScrollDirection,
  ScrollViewFadingEdgeLengthInput,
  ScrollViewFadingEdgeLengths,
  ScrollViewFrameStyleInput,
  ScrollViewStyleInput,
  ScrollbarGeometry,
} from './ScrollViewLayout.types';

// Scrollbar constants for Meta Ray-Ban Display.
export const SCROLLBAR_TRACK_SIZE_PX = 100;
export const SCROLLBAR_MIN_HANDLE_SIZE_PX = 8;
export const SCROLLBAR_HIDE_DELAY_MS = 1500;
export const KEYBOARD_SCROLL_STEP_PX = 60;
export const FOCUS_EDGE_SCROLL_FRACTION = 0.5;
export const SCROLL_EPSILON = 0.5;
export { SCROLL_VIEW_NAVIGATION_REQUEST_EVENT };

export const FOCUSABLE_DESCENDANT_SELECTOR = FOCUSABLE_SELECTOR;

export function getScrollDirectionForKey(key: string): ScrollDirection | null {
  switch (key) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    default:
      return null;
  }
}

export function getScrollAxisForOrientation(
  orientation: ScrollViewOrientation,
): 'horizontal' | 'vertical' {
  return orientation === ScrollViewOrientation.HORIZONTAL ? 'horizontal' : 'vertical';
}

export function supportsScrollDirection(
  orientation: ScrollViewOrientation,
  direction: ScrollDirection,
): boolean {
  return orientation === ScrollViewOrientation.HORIZONTAL
    ? direction === 'left' || direction === 'right'
    : direction === 'up' || direction === 'down';
}

export function getRemainingScrollDistance(
  element: HTMLElement,
  direction: ScrollDirection,
): number {
  switch (direction) {
    case 'up':
      return element.scrollTop;
    case 'down':
      return Math.max(0, element.scrollHeight - element.clientHeight - element.scrollTop);
    case 'left':
      return element.scrollLeft;
    case 'right':
      return Math.max(0, element.scrollWidth - element.clientWidth - element.scrollLeft);
  }
}

export function getBlockedFocusScrollAmount(
  viewportLength: number,
  remainingDistance: number,
): number {
  return Math.min(remainingDistance, viewportLength * FOCUS_EDGE_SCROLL_FRACTION);
}

export function getScrollViewFadingEdgeLengths({
  fadingEdgeEnabled,
  orientation,
  topFadingEdgeLength,
  bottomFadingEdgeLength,
  leftFadingEdgeLength,
  rightFadingEdgeLength,
}: ScrollViewFadingEdgeLengthInput): FadingEdgeLengths {
  if (!fadingEdgeEnabled) {
    return {};
  }

  if (orientation === ScrollViewOrientation.HORIZONTAL) {
    return {
      left: leftFadingEdgeLength ?? FADING_EDGE_LENGTH_MEDIUM,
      right: rightFadingEdgeLength ?? FADING_EDGE_LENGTH_MEDIUM,
    };
  }

  return {
    top: topFadingEdgeLength ?? FADING_EDGE_LENGTH_MEDIUM,
    bottom: bottomFadingEdgeLength ?? FADING_EDGE_LENGTH_MEDIUM,
  };
}

export function getScrollViewHeaderInsetPadding(
  insetForHeader: boolean,
  headerHeight: number,
): number {
  return insetForHeader ? headerHeight : 0;
}

export function getScrollViewContentOverflows(
  metrics: ScrollMetrics,
  orientation: ScrollViewOrientation,
): boolean {
  return orientation === ScrollViewOrientation.HORIZONTAL
    ? metrics.scrollWidth > metrics.clientWidth
    : metrics.scrollHeight > metrics.clientHeight;
}

export function getScrollbarGeometry(
  metrics: ScrollMetrics,
  orientation: ScrollViewOrientation,
  contentOverflows: boolean,
): ScrollbarGeometry {
  if (!contentOverflows) {
    return {
      handleSize: SCROLLBAR_TRACK_SIZE_PX,
      handleOffset: 0,
    };
  }

  const isHorizontal = orientation === ScrollViewOrientation.HORIZONTAL;
  const viewportSize = isHorizontal ? metrics.clientWidth : metrics.clientHeight;
  const contentSize = isHorizontal ? metrics.scrollWidth : metrics.scrollHeight;
  const scrollOffset = isHorizontal ? metrics.scrollLeft : metrics.scrollTop;
  const maxScroll = Math.max(0, contentSize - viewportSize);
  const handleSize = Math.max(
    SCROLLBAR_TRACK_SIZE_PX * (viewportSize / contentSize),
    SCROLLBAR_MIN_HANDLE_SIZE_PX,
  );
  const scrollRatio = maxScroll > 0 ? scrollOffset / maxScroll : 0;

  return {
    handleSize,
    handleOffset: (SCROLLBAR_TRACK_SIZE_PX - handleSize) * scrollRatio,
  };
}

export function getScrollViewFrameStyle({
  width,
  height,
  style,
}: ScrollViewFrameStyleInput): CSSProperties {
  return {
    width,
    height,
    ...style,
  };
}

export function getScrollViewStyle({
  headerInsetPadding,
}: ScrollViewStyleInput): CSSProperties {
  return {
    paddingTop:
      headerInsetPadding > 0
        ? `calc(${headerInsetPadding}px + var(--uit-page-content-origin-offset, 0px))`
        : undefined,
  };
}

export function getScrollbarTrackStyle(
  orientation: ScrollViewOrientation,
): CSSProperties {
  return orientation === ScrollViewOrientation.HORIZONTAL
    ? { width: `${SCROLLBAR_TRACK_SIZE_PX}px` }
    : { height: `${SCROLLBAR_TRACK_SIZE_PX}px` };
}

export function getScrollbarHandleStyle(
  orientation: ScrollViewOrientation,
  { handleSize, handleOffset }: ScrollbarGeometry,
): CSSProperties {
  return orientation === ScrollViewOrientation.HORIZONTAL
    ? {
        width: `${handleSize}px`,
        left: `calc(50% - ${SCROLLBAR_TRACK_SIZE_PX / 2}px + ${handleOffset}px)`,
      }
    : {
        height: `${handleSize}px`,
        top: `calc(50% - ${SCROLLBAR_TRACK_SIZE_PX / 2}px + ${handleOffset}px)`,
      };
}

function isFocusableElementVisibleWithinRoot(
  element: HTMLElement,
  focusBoundaryRoot: HTMLElement,
): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  let current: HTMLElement | null = element;
  while (current != null && focusBoundaryRoot.contains(current)) {
    const style = getComputedStyle(current);
    if (
      current.hasAttribute('inert') ||
      current.getAttribute('aria-hidden') === 'true' ||
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      (current === element && style.pointerEvents === 'none')
    ) {
      return false;
    }
    if (current === focusBoundaryRoot) {
      break;
    }
    current = current.parentElement;
  }
  return true;
}

export function isFocusAtFocusableBoundary(
  focusBoundaryRoot: HTMLElement,
  source: Element,
  direction: ScrollDirection,
): boolean {
  const focusables = Array.from(
    focusBoundaryRoot.querySelectorAll<HTMLElement>(FOCUSABLE_DESCENDANT_SELECTOR),
  ).filter(element => isFocusableElementVisibleWithinRoot(element, focusBoundaryRoot));
  if (focusables.length < 2) {
    return false;
  }
  const sourceFocusable = focusables.find(candidate =>
    candidate === source ||
    candidate.contains(source) ||
    source.contains(candidate)
  );
  if (sourceFocusable == null) {
    return false;
  }

  const sourceRect = sourceFocusable.getBoundingClientRect();
  return !focusables.some(candidate => {
    if (candidate === sourceFocusable) {
      return false;
    }
    const candidateRect = candidate.getBoundingClientRect();
    return (
      candidateRect.width > 0 &&
      candidateRect.height > 0 &&
      isFocusCandidateInDirection(sourceRect, candidateRect, direction)
    );
  });
}

function isFocusCandidateInDirection(
  source: DOMRect,
  destination: DOMRect,
  direction: ScrollDirection,
): boolean {
  switch (direction) {
    case 'up':
      return (
        (source.bottom > destination.bottom || source.top >= destination.bottom) &&
        source.top > destination.top
      );
    case 'down':
      return (
        (source.top < destination.top || source.bottom <= destination.top) &&
        source.bottom < destination.bottom
      );
    case 'left':
      return (
        (source.right > destination.right || source.left >= destination.right) &&
        source.left > destination.left
      );
    case 'right':
      return (
        (source.left < destination.left || source.right <= destination.left) &&
        source.right < destination.right
      );
  }
}

export function hasFocusableDescendantInDirection(
  scrollContainer: HTMLElement,
  source: Element,
  direction: ScrollDirection,
): boolean {
  const sourceRect = source.getBoundingClientRect();
  return Array.from(scrollContainer.querySelectorAll(FOCUSABLE_DESCENDANT_SELECTOR)).some(candidate => {
    if (
      candidate === source ||
      candidate.contains(source) ||
      source.contains(candidate) ||
      !(candidate instanceof HTMLElement)
    ) {
      return false;
    }

    // Read each candidate's rect once and use it for both the size check and
    // the direction test. The cheap geometric direction test gates the more
    // expensive getComputedStyle visibility check, so style resolution only
    // runs for the (usually few) candidates that lie in the search direction.
    const candidateRect = candidate.getBoundingClientRect();
    if (candidateRect.width <= 0 || candidateRect.height <= 0) {
      return false;
    }
    if (!isFocusCandidateInDirection(sourceRect, candidateRect, direction)) {
      return false;
    }
    return isFocusableElementVisibleWithinRoot(candidate, scrollContainer);
  });
}
