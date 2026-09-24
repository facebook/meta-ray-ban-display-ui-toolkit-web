/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Tooltip display mode.
 */
export enum TooltipMode {
  /** No tooltip */
  NONE = 'none',
  /** Show when focused */
  FOCUSED = 'focused',
  /** Show after dwell delay when focused */
  DWELL = 'dwell',
  /** Show on click when disabled */
  DISABLED_CLICK = 'disabledClick',
  /** Always show */
  ALWAYS = 'always',
}
