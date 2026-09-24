/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  HTMLAttributes,
} from 'react';

export const VignetteEdge = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
} as const;
export type VignetteEdge = (typeof VignetteEdge)[keyof typeof VignetteEdge];

export type VignetteEdgeVisibility = Partial<Record<VignetteEdge, boolean>>;
export type VignetteEdgeAnimation = Partial<Record<VignetteEdge, boolean>>;

export interface VignetteProps extends HTMLAttributes<HTMLDivElement> {
  enabledEdges?: VignetteEdgeVisibility;
  /**
   * Whether edge visibility changes should animate by default.
   */
  animate?: boolean;
  /** Per-edge overrides for `animate`. */
  animatedEdges?: VignetteEdgeAnimation;
  style?: CSSProperties;
}
