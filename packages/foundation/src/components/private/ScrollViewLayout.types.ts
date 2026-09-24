/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import type { FadingEdgeLengths } from './FadingEdges';
import type { ScrollViewOrientation } from '../ScrollView.types';

export type ScrollDirection = 'up' | 'down' | 'left' | 'right';

export interface ScrollbarGeometry {
  handleSize: number;
  handleOffset: number;
}

export interface ScrollViewFadingEdgeLengthInput {
  fadingEdgeEnabled: boolean;
  orientation: ScrollViewOrientation;
  topFadingEdgeLength?: number;
  bottomFadingEdgeLength?: number;
  leftFadingEdgeLength?: number;
  rightFadingEdgeLength?: number;
}

export interface ScrollViewFrameStyleInput {
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
}

export interface ScrollViewStyleInput {
  headerInsetPadding: number;
}

export type ScrollViewFadingEdgeLengths = FadingEdgeLengths;
