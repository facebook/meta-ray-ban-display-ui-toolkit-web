/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface ChipContentConfig {
  text?: string;
  metadata?: string;
  icon?: unknown;
  isLoading: boolean;
  showAvatar: boolean;
}

export interface ChipContentState {
  hasIcon: boolean;
  hasAvatar: boolean;
  hasLeading: boolean;
  hasText: boolean;
  hasMetadata: boolean;
}
