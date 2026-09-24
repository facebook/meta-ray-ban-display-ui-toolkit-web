/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';

export interface FadingEdgeLengths {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface ScrollMetrics {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
}

export interface FadingEdgeState {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export interface FadingEdgeInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface FadingEdgeOverlayStyles {
  top: CSSProperties;
  bottom: CSSProperties;
  left: CSSProperties;
  right: CSSProperties;
}

export interface ScrollIntoFadingEdgeSafeAreaOptions {
  axis?: 'both' | 'vertical' | 'horizontal';
  behavior?: ScrollBehavior;
  extraMargin?: number;
  minimumInsets?: Partial<FadingEdgeInsets>;
}
