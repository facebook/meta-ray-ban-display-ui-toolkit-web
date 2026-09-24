/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  FadingEdgeInsets,
  FadingEdgeLengths,
  FadingEdgeOverlayStyles,
  FadingEdgeState,
  ScrollIntoFadingEdgeSafeAreaOptions,
  ScrollMetrics,
} from './FadingEdges.types';
import {
  AnimationDurations,
  cubicBezierY,
} from '../../motion/Animations';

export const FADING_EDGE_LENGTH_MEDIUM = 64;
export const FADING_EDGE_LENGTH_XLARGE = 100;

export type {
  FadingEdgeInsets,
  FadingEdgeLengths,
  FadingEdgeOverlayStyles,
  FadingEdgeState,
  ScrollIntoFadingEdgeSafeAreaOptions,
  ScrollMetrics,
} from './FadingEdges.types';

const EDGE_EPSILON = 0.5;
const FOCUS_SCROLL_EASING = [0.68, 0, 0.29, 1] as const;
let suppressFocusSafeAreaScrollCount = 0;
const smoothFocusScrollFrameIds = new WeakMap<HTMLElement, number>();

export const EMPTY_SCROLL_METRICS: ScrollMetrics = {
  scrollTop: 0,
  scrollLeft: 0,
  scrollHeight: 0,
  scrollWidth: 0,
  clientHeight: 0,
  clientWidth: 0,
};

export function getScrollMetrics(element: HTMLElement): ScrollMetrics {
  return {
    scrollTop: element.scrollTop,
    scrollLeft: element.scrollLeft,
    scrollHeight: element.scrollHeight,
    scrollWidth: element.scrollWidth,
    clientHeight: element.clientHeight,
    clientWidth: element.clientWidth,
  };
}

export function getFadingEdgeState(
  metrics: ScrollMetrics,
  lengths: FadingEdgeLengths,
): FadingEdgeState {
  const maxScrollTop = Math.max(0, metrics.scrollHeight - metrics.clientHeight);
  const maxScrollLeft = Math.max(0, metrics.scrollWidth - metrics.clientWidth);

  return {
    top: (lengths.top ?? 0) > 0 && metrics.scrollTop > EDGE_EPSILON,
    bottom:
      (lengths.bottom ?? 0) > 0 && metrics.scrollTop < maxScrollTop - EDGE_EPSILON,
    left: (lengths.left ?? 0) > 0 && metrics.scrollLeft > EDGE_EPSILON,
    right:
      (lengths.right ?? 0) > 0 && metrics.scrollLeft < maxScrollLeft - EDGE_EPSILON,
  };
}

function fitInsetsToViewport(
  start: number,
  end: number,
  viewportLength: number,
): [number, number] {
  const total = start + end;
  const maxTotal = Math.max(0, viewportLength - EDGE_EPSILON);
  if (total <= maxTotal || total === 0) {
    return [start, end];
  }

  const scale = maxTotal / total;
  return [start * scale, end * scale];
}

export function fitFocusSafeAreaInsets(
  start: number,
  end: number,
  viewportLength: number,
  elementLength: number,
  minimumStart = 0,
  minimumEnd = 0,
): [number, number] {
  const available = Math.max(0, viewportLength - elementLength - EDGE_EPSILON);
  const minimumTotal = minimumStart + minimumEnd;
  if (minimumTotal >= available) {
    if (minimumTotal === 0) {
      return [0, 0];
    }
    const scale = available / minimumTotal;
    return [minimumStart * scale, minimumEnd * scale];
  }

  const extraStart = Math.max(0, start - minimumStart);
  const extraEnd = Math.max(0, end - minimumEnd);
  const extraTotal = extraStart + extraEnd;
  const extraAvailable = available - minimumTotal;
  if (extraTotal <= extraAvailable || extraTotal === 0) {
    return [start, end];
  }

  const scale = extraAvailable / extraTotal;
  return [
    minimumStart + extraStart * scale,
    minimumEnd + extraEnd * scale,
  ];
}

export function getActiveFadingEdgeInsets(
  metrics: ScrollMetrics,
  lengths: FadingEdgeLengths,
): FadingEdgeInsets {
  const state = getFadingEdgeState(metrics, lengths);
  const [top, bottom] = fitInsetsToViewport(
    state.top ? (lengths.top ?? 0) : 0,
    state.bottom ? (lengths.bottom ?? 0) : 0,
    metrics.clientHeight,
  );
  const [left, right] = fitInsetsToViewport(
    state.left ? (lengths.left ?? 0) : 0,
    state.right ? (lengths.right ?? 0) : 0,
    metrics.clientWidth,
  );

  return { top, bottom, left, right };
}

export function sameScrollMetrics(a: ScrollMetrics, b: ScrollMetrics): boolean {
  return (
    a.scrollTop === b.scrollTop &&
    a.scrollLeft === b.scrollLeft &&
    a.scrollHeight === b.scrollHeight &&
    a.scrollWidth === b.scrollWidth &&
    a.clientHeight === b.clientHeight &&
    a.clientWidth === b.clientWidth
  );
}

function cancelSmoothFocusScroll(scrollContainer: HTMLElement): void {
  const frameId = smoothFocusScrollFrameIds.get(scrollContainer);
  if (frameId == null) {
    return;
  }

  window.cancelAnimationFrame(frameId);
  smoothFocusScrollFrameIds.delete(scrollContainer);
}

function scrollToFocusSafeAreaTarget(
  scrollContainer: HTMLElement,
  top: number,
  left: number,
  behavior: ScrollBehavior,
): void {
  cancelSmoothFocusScroll(scrollContainer);

  if (behavior !== 'smooth') {
    scrollContainer.scrollTo({ top, left, behavior });
    return;
  }

  const startTop = scrollContainer.scrollTop;
  const startLeft = scrollContainer.scrollLeft;
  const deltaTop = top - startTop;
  const deltaLeft = left - startLeft;

  if (Math.abs(deltaTop) <= EDGE_EPSILON && Math.abs(deltaLeft) <= EDGE_EPSILON) {
    return;
  }

  const startTime = performance.now();
  const duration = AnimationDurations.CONTAINER_STATE_CHANGE_FAST_FOCUS;

  const update = (timestamp: number) => {
    const linearProgress = Math.min(1, Math.max(0, (timestamp - startTime) / duration));
    const easedProgress = cubicBezierY(
      FOCUS_SCROLL_EASING[0],
      FOCUS_SCROLL_EASING[1],
      FOCUS_SCROLL_EASING[2],
      FOCUS_SCROLL_EASING[3],
      linearProgress,
    );

    scrollContainer.scrollTop = startTop + deltaTop * easedProgress;
    scrollContainer.scrollLeft = startLeft + deltaLeft * easedProgress;

    if (linearProgress < 1) {
      smoothFocusScrollFrameIds.set(
        scrollContainer,
        window.requestAnimationFrame(update),
      );
      return;
    }

    scrollContainer.scrollTop = top;
    scrollContainer.scrollLeft = left;
    smoothFocusScrollFrameIds.delete(scrollContainer);
  };

  smoothFocusScrollFrameIds.set(scrollContainer, window.requestAnimationFrame(update));
}

export function scrollToFocusBoundary(
  scrollContainer: HTMLElement,
  boundary: 'top' | 'bottom' | 'left' | 'right',
  behavior: ScrollBehavior = 'smooth',
): boolean {
  const metrics = getScrollMetrics(scrollContainer);
  const maxScrollTop = Math.max(0, metrics.scrollHeight - metrics.clientHeight);
  const maxScrollLeft = Math.max(0, metrics.scrollWidth - metrics.clientWidth);
  const top = boundary === 'top'
    ? 0
    : boundary === 'bottom'
      ? maxScrollTop
      : metrics.scrollTop;
  const left = boundary === 'left'
    ? 0
    : boundary === 'right'
      ? maxScrollLeft
      : metrics.scrollLeft;

  scrollToFocusSafeAreaTarget(scrollContainer, top, left, behavior);
  return (
    Math.abs(top - metrics.scrollTop) > EDGE_EPSILON ||
    Math.abs(left - metrics.scrollLeft) > EDGE_EPSILON
  );
}

export function scrollElementIntoFadingEdgeSafeArea(
  scrollContainer: HTMLElement,
  element: HTMLElement,
  lengths: FadingEdgeLengths,
  {
    axis = 'both',
    behavior = 'smooth',
    extraMargin = 0,
    minimumInsets = {},
  }: ScrollIntoFadingEdgeSafeAreaOptions = {},
): boolean {
  const metrics = getScrollMetrics(scrollContainer);
  const activeInsets = getActiveFadingEdgeInsets(metrics, lengths);
  const containerRect = scrollContainer.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const maxScrollTop = Math.max(0, metrics.scrollHeight - metrics.clientHeight);
  const maxScrollLeft = Math.max(0, metrics.scrollWidth - metrics.clientWidth);

  const minimumTop = (minimumInsets.top ?? 0) + extraMargin;
  const minimumBottom = (minimumInsets.bottom ?? 0) + extraMargin;
  const minimumLeft = (minimumInsets.left ?? 0) + extraMargin;
  const minimumRight = (minimumInsets.right ?? 0) + extraMargin;
  const [topInset, bottomInset] = fitFocusSafeAreaInsets(
    Math.max(activeInsets.top, minimumInsets.top ?? 0) + extraMargin,
    Math.max(activeInsets.bottom, minimumInsets.bottom ?? 0) + extraMargin,
    containerRect.height,
    elementRect.height,
    minimumTop,
    minimumBottom,
  );
  const [leftInset, rightInset] = fitFocusSafeAreaInsets(
    Math.max(activeInsets.left, minimumInsets.left ?? 0) + extraMargin,
    Math.max(activeInsets.right, minimumInsets.right ?? 0) + extraMargin,
    containerRect.width,
    elementRect.width,
    minimumLeft,
    minimumRight,
  );
  const safeTop = containerRect.top + topInset;
  const safeBottom = containerRect.bottom - bottomInset;
  const safeLeft = containerRect.left + leftInset;
  const safeRight = containerRect.right - rightInset;

  let nextScrollTop = metrics.scrollTop;
  let nextScrollLeft = metrics.scrollLeft;

  if (axis !== 'horizontal') {
    if (elementRect.top < safeTop) {
      nextScrollTop -= safeTop - elementRect.top;
    } else if (elementRect.bottom > safeBottom) {
      nextScrollTop += elementRect.bottom - safeBottom;
    }
  }

  if (axis !== 'vertical') {
    if (elementRect.left < safeLeft) {
      nextScrollLeft -= safeLeft - elementRect.left;
    } else if (elementRect.right > safeRight) {
      nextScrollLeft += elementRect.right - safeRight;
    }
  }

  nextScrollTop = Math.min(maxScrollTop, Math.max(0, nextScrollTop));
  nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, nextScrollLeft));

  if (
    Math.abs(nextScrollTop - metrics.scrollTop) <= EDGE_EPSILON &&
    Math.abs(nextScrollLeft - metrics.scrollLeft) <= EDGE_EPSILON
  ) {
    return false;
  }

  scrollToFocusSafeAreaTarget(scrollContainer, nextScrollTop, nextScrollLeft, behavior);
  return true;
}

export function isFocusSafeAreaScrollSuppressed(): boolean {
  return suppressFocusSafeAreaScrollCount > 0;
}

export function runWithFocusSafeAreaScrollSuppressed(callback: () => void): void {
  suppressFocusSafeAreaScrollCount += 1;
  try {
    callback();
  } finally {
    suppressFocusSafeAreaScrollCount -= 1;
  }
}

function edgeStrength(distance: number, length: number): number {
  if (length <= 0 || distance <= EDGE_EPSILON) {
    return 0;
  }

  return Math.min(distance / length, 1);
}

function formatEdgeOpacity(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
}

export function getFadingEdgeOverlayStyles(
  metrics: ScrollMetrics,
  lengths: FadingEdgeLengths,
): FadingEdgeOverlayStyles {
  const topLength = lengths.top ?? 0;
  const bottomLength = lengths.bottom ?? 0;
  const leftLength = lengths.left ?? 0;
  const rightLength = lengths.right ?? 0;
  const maxScrollTop = Math.max(0, metrics.scrollHeight - metrics.clientHeight);
  const maxScrollLeft = Math.max(0, metrics.scrollWidth - metrics.clientWidth);
  const topStrength = edgeStrength(metrics.scrollTop, topLength);
  const bottomStrength = edgeStrength(maxScrollTop - metrics.scrollTop, bottomLength);
  const leftStrength = edgeStrength(metrics.scrollLeft, leftLength);
  const rightStrength = edgeStrength(maxScrollLeft - metrics.scrollLeft, rightLength);

  return {
    top: {
      height: topLength > 0 ? `${topLength}px` : undefined,
      opacity: formatEdgeOpacity(topStrength),
    },
    bottom: {
      height: bottomLength > 0 ? `${bottomLength}px` : undefined,
      opacity: formatEdgeOpacity(bottomStrength),
    },
    left: {
      width: leftLength > 0 ? `${leftLength}px` : undefined,
      opacity: formatEdgeOpacity(leftStrength),
    },
    right: {
      width: rightLength > 0 ? `${rightLength}px` : undefined,
      opacity: formatEdgeOpacity(rightStrength),
    },
  };
}
