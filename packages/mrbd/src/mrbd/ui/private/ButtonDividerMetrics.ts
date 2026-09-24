/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Sizable } from '../ButtonGroup.types';

/** Width of the pill divider: 8px. */
export const BUTTON_DIVIDER_WIDTH = 8;

/** Height of the pill divider: 36px. */
export const BUTTON_DIVIDER_HEIGHT = 36;

/** Horizontal margin on each side: 8px (--uit-spacing-small). */
export const BUTTON_DIVIDER_MARGIN_HORIZONTAL = 8;

/** Total measured width of the divider pill plus built-in side margins. */
export const BUTTON_DIVIDER_TOTAL_WIDTH =
  BUTTON_DIVIDER_WIDTH + BUTTON_DIVIDER_MARGIN_HORIZONTAL * 2;

export const BUTTON_DIVIDER_SIZABLE: Sizable = {
  defaultWidth: BUTTON_DIVIDER_TOTAL_WIDTH,
  focusedWidth: BUTTON_DIVIDER_TOTAL_WIDTH,
  height: BUTTON_DIVIDER_HEIGHT,
};
