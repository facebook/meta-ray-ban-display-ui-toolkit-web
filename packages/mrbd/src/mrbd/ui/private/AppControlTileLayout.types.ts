/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';

export interface AppControlTileTitleState {
  titleClassName: string;
  rootClassName: string;
  rootStyle: CSSProperties;
}

export interface AppControlTileAccessibilityLabelOptions {
  title?: string;
}

export interface AppControlTileClassNameOptions {
  styles: Record<string, string>;
  hasTitle: boolean;
  hasStatusIcon: boolean;
  enableTitleMarquee: boolean;
  isTitleOverflowing: boolean;
}
