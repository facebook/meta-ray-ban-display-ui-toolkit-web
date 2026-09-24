/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type TooltipTailDirection = 'up' | 'down';

export interface TooltipBoundaryRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface TooltipAnchorPoint {
  x: number;
  y: number;
}

export interface TooltipAnchorRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width?: number;
  height?: number;
}

export type TooltipCenterPositionProvider = (
  anchor: HTMLElement,
) => TooltipAnchorPoint | null | undefined;

export type TooltipTargetRectProvider = (
  anchor: HTMLElement,
) => TooltipAnchorRect | null | undefined;

export interface TooltipAnchorTarget {
  centerX: number;
  top: number;
  bottom: number;
}
