/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BackgroundStyle } from '../StaticContainer.types';

export const PrivateBackgroundStyle = {
  ALWAYS_VISIBLE: 'always-visible',
} as const;
export type PrivateBackgroundStyle =
  (typeof PrivateBackgroundStyle)[keyof typeof PrivateBackgroundStyle];

export type ResolvedBackgroundStyle = BackgroundStyle | PrivateBackgroundStyle;
