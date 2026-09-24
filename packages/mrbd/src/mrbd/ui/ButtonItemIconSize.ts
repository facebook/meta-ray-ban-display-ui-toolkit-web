/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Icon size for a {@link ButtonContextMenuItemView}. Callers pick a semantic
 * case; the component resolves it to the matching icon dimension and content
 * padding. Free-form sizes are intentionally NOT accepted — this keeps the API
 * strict.
 */
export const ButtonItemIconSize = {
  /** Medium icon (default). 24px icon with 16px content padding. */
  MEDIUM: 'medium',
  /** Large icon. 32px icon with tightened 12px content padding. */
  LARGE: 'large',
} as const;

export type ButtonItemIconSize =
  (typeof ButtonItemIconSize)[keyof typeof ButtonItemIconSize];
