/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * PaginationIndicator public API for Meta Ray-Ban Display.
 */

import type { PaginationMode } from '@wearables-ui-toolkit/foundation';
import type {
  CSSProperties,
  HTMLAttributes,
} from 'react';

/**
 * Pagination display mode.
 */
export { PaginationMode } from '@wearables-ui-toolkit/foundation';

export interface PaginationIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Display mode for the pagination indicator.
   * @default PaginationMode.TEXT
   */
  mode?: PaginationMode;

  /**
   * Total number of pages.
   * @default 0
   */
  pageCount?: number;

  /**
   * Current page index (0-based).
   * @default 0
   */
  currentPage?: number;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;
}
