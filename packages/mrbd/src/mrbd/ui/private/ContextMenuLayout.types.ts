/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type ContextMenuTailDirection = 'up' | 'down';

export interface ContextMenuPadding {
  paddingTop: number;
  paddingBottom: number;
  totalHeight: number;
}

export interface ContextMenuMeasuredSize {
  width: number;
  height: number;
}

export interface ContextMenuEffectiveSize {
  width: number;
  height: number;
}

export interface ContextMenuFadingEdgeStrengths {
  left: number;
  right: number;
}
