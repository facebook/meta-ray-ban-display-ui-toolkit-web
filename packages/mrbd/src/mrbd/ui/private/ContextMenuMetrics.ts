/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ContextMenuSize } from '../ContextMenu.types';

/** Minimum body height for each ContextMenu size variant. */
export const CONTEXT_MENU_HEIGHT: Record<ContextMenuSize, number> = {
  default: 64,
  small: 56,
};

/** 4px (--uit-spacing-xsmall). */
export const CONTEXT_MENU_ITEM_SPACING = 4;

export const CONTEXT_MENU_FOCUS_SEARCH_FROM_ORIGIN_EVENT =
  'uit-focus-search-from-origin';
