/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import type { State } from '../../base/Interactions';
import type { ShapeProvider } from '../../material/ShapeProvider';
import type { StackType } from '../CardStack.types';

export interface CardStackSize {
  width: number;
  height: number;
}

export interface CardStackMetrics extends CardStackSize {
  offsetX: number;
  offsetY: number;
}

export interface CardStackMeasuredLayout {
  ratio: number;
  cardWidth: number;
  cardHeight: number;
  stackDimensions: CardStackMetrics;
}

export interface CardStackBackgroundStyleParams {
  type: StackType;
  index: number;
  interactionState: State;
  stackDimensions: CardStackMetrics;
  cardWidth: number;
  cardHeight: number;
  shapeProvider: ShapeProvider;
}

export interface CardStackPrimaryStyleParams {
  type: StackType;
  hasBackgroundCards: boolean;
  stackDimensions: CardStackMetrics;
  cardWidth: number;
  cardHeight: number;
}

export interface CardStackContainerStyleParams {
  interactionState: State;
  stackDimensions: CardStackMetrics;
  style?: CSSProperties;
}
