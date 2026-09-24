/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface PaginationVisibleWindow {
  visibleIndices: number[];
  windowStart: number;
}

export interface PaginationDotState {
  index: number;
  isActive: boolean;
  isOverflow: boolean;
  x: number;
  diameter: number;
  opacity: number;
}

export interface PaginationDotStateInput {
  visibleIndices: number[];
  windowStart: number;
  currentPage: number;
}
