/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  PAGINATION_ACTIVE_DOT_SIZE,
  PAGINATION_DOT_SPACING,
  PAGINATION_INACTIVE_DOT_SIZE,
  PAGINATION_MAX_WINDOW_WIDTH,
  PAGINATION_OVERFLOW_DOT_SIZE,
  PAGINATION_REAL_DOT_COUNT,
} from './PaginationIndicatorMetrics';
import type {
  PaginationDotState,
  PaginationDotStateInput,
  PaginationVisibleWindow,
} from './PaginationIndicatorLayout.types';

export type {
  PaginationDotState,
  PaginationDotStateInput,
  PaginationVisibleWindow,
} from './PaginationIndicatorLayout.types';

export function getPaginationContainerClassName(
  baseClassName: string,
  className: string,
): string {
  return [baseClassName, className].filter(Boolean).join(' ');
}

export function getPaginationText(pageCount: number, currentPage: number): string {
  return `${currentPage + 1} of ${pageCount}`;
}

export function getPaginationDotDiameter(
  isActive: boolean,
  isOverflow: boolean,
): number {
  if (isActive) {
    return PAGINATION_ACTIVE_DOT_SIZE;
  }
  if (isOverflow) {
    return PAGINATION_OVERFLOW_DOT_SIZE;
  }
  return PAGINATION_INACTIVE_DOT_SIZE;
}

export function calculatePaginationVisibleWindow(
  pageCount: number,
  currentPage: number,
  previousWindowStart = 0,
): PaginationVisibleWindow {
  if (pageCount <= 0) {
    return { visibleIndices: [], windowStart: 0 };
  }

  if (pageCount <= PAGINATION_REAL_DOT_COUNT) {
    return {
      visibleIndices: Array.from({ length: pageCount }, (_, i) => i),
      windowStart: 0,
    };
  }

  let windowStart = previousWindowStart;
  if (currentPage < windowStart) {
    windowStart = currentPage;
  } else if (currentPage >= windowStart + PAGINATION_REAL_DOT_COUNT) {
    windowStart = currentPage - PAGINATION_REAL_DOT_COUNT + 1;
  }
  windowStart = Math.max(
    0,
    Math.min(windowStart, pageCount - PAGINATION_REAL_DOT_COUNT),
  );

  const visibleIndices: number[] = [];
  if (windowStart > 0) {
    visibleIndices.push(windowStart - 1);
  }

  for (
    let i = windowStart;
    i < windowStart + PAGINATION_REAL_DOT_COUNT;
    i += 1
  ) {
    visibleIndices.push(i);
  }

  const rightOverflow = windowStart + PAGINATION_REAL_DOT_COUNT;
  if (rightOverflow < pageCount) {
    visibleIndices.push(rightOverflow);
  }

  return { visibleIndices, windowStart };
}

export function calculatePaginationDotStates({
  visibleIndices,
  windowStart,
  currentPage,
}: PaginationDotStateInput): PaginationDotState[] {
  if (visibleIndices.length === 0) {
    return [];
  }

  const realEnd = windowStart + PAGINATION_REAL_DOT_COUNT - 1;
  const states: PaginationDotState[] = visibleIndices.map((index) => {
    const isActive = index === currentPage;
    const isOverflow = index < windowStart || index > realEnd;
    const diameter = getPaginationDotDiameter(isActive, isOverflow);
    return {
      index,
      isActive,
      isOverflow,
      x: 0,
      diameter,
      opacity: 1,
    };
  });

  let previousDiameter = 0;
  let currentX = 0;

  states.forEach((state, i) => {
    if (i === 0) {
      currentX = state.diameter / 2;
    } else {
      currentX += previousDiameter / 2 + PAGINATION_DOT_SPACING + state.diameter / 2;
    }
    state.x = currentX;
    previousDiameter = state.diameter;
  });

  const totalWidth = currentX + previousDiameter / 2;
  const offset = (PAGINATION_MAX_WINDOW_WIDTH - totalWidth) / 2;
  if (offset > 0) {
    states.forEach((state) => {
      state.x += offset;
    });
  }

  return states;
}

export function getPaginationDotsContainerStyle(
  style: CSSProperties,
): CSSProperties {
  return {
    width: PAGINATION_MAX_WINDOW_WIDTH,
    height: PAGINATION_ACTIVE_DOT_SIZE,
    ...style,
  };
}

export function getPaginationDotStyle(dot: PaginationDotState): CSSProperties {
  return {
    width: dot.diameter,
    height: dot.diameter,
    left: dot.x - dot.diameter / 2,
    top: (PAGINATION_ACTIVE_DOT_SIZE - dot.diameter) / 2,
  };
}
