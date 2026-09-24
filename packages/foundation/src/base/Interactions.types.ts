/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  State,
  VisualState,
} from './Interactions';

/**
 * Combined state representation
 */
export interface InteractionState {
  state: State;
  isDisabled: boolean;
}

/**
 * State transition info for animation selection
 */
export interface StateTransition {
  from: State;
  to: State;
  isFastScrolling: boolean;
}

/**
 * Override callback for visual state calculation.
 * Maps an interaction state to the visual state used for rendering.
 */
export type VisualStateForInteractionStateFn = (
  interactionState: InteractionState,
) => VisualState;

/**
 * Override callback for content scale calculation.
 * Computes the content scale factor for a given state and container size.
 */
export type ContentScaleForStateFn = (
  state: State,
  containerSize: { width: number; height: number },
) => number;
