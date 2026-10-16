/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ContextMenuSize } from '../ContextMenu.types';

/** Minimum item size for each ContextMenu size variant. */
export const CONTEXT_MENU_ITEM_SIZE: Record<ContextMenuSize, number> = {
  default: 56,
  small: 48,
};
