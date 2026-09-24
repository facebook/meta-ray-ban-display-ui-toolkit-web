/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Dot sizes in px for active, inactive, and overflow dots, plus spacing.
 */
export const PAGINATION_ACTIVE_DOT_SIZE = 12;
export const PAGINATION_INACTIVE_DOT_SIZE = 8;
export const PAGINATION_OVERFLOW_DOT_SIZE = 4;
export const PAGINATION_DOT_SPACING = 8;

/**
 * Maximum number of "real" (non-overflow) dots visible at once.
 */
export const PAGINATION_REAL_DOT_COUNT = 3;

export function getPaginationMaxWindowWidth(): number {
  const overflowDots = 2;
  const inactiveDots = 2;
  const totalSpacing = 4 * PAGINATION_DOT_SPACING;
  return (
    totalSpacing +
    PAGINATION_ACTIVE_DOT_SIZE +
    inactiveDots * PAGINATION_INACTIVE_DOT_SIZE +
    overflowDots * PAGINATION_OVERFLOW_DOT_SIZE
  );
}

export const PAGINATION_MAX_WINDOW_WIDTH = getPaginationMaxWindowWidth();
