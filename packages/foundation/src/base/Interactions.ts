/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Interaction state types and constants
 */

import type { InteractionState } from './Interactions.types';

export type {
  ContentScaleForStateFn,
  InteractionState,
  StateTransition,
  VisualStateForInteractionStateFn,
} from './Interactions.types';

/**
 * Animation and timing constants.
 */
export const InteractionConstants = {
  /** Minimum time pressed state is shown for visual feedback. */
  QUICK_PRESS_RELEASE_DELAY: 120,
  /** Default long-press timeout (500ms). */
  LONG_PRESS_TIMEOUT: 500,
  /** Tooltip dwell delay. */
  TOOLTIP_DWELL_DELAY: 3000,
  /** Fast scroll detection threshold. */
  FAST_SCROLL_THRESHOLD_MS: 140,
  /** Fast scroll decay threshold. */
  FAST_SCROLL_DECAY_THRESHOLD: 750,
  /** Auto-dismiss delay for the disabled-click tooltip (matches the tooltip
   *  auto-hide delay). */
  DISABLED_CLICK_TOOLTIP_DISMISS_DELAY: 5000,
} as const;

/**
 * Interactive component states
 */
export const State = {
  DEFAULT: 'default',
  FOCUSED: 'focused',
  PRESSED: 'pressed',
} as const;
export type State = (typeof State)[keyof typeof State];

/**
 * Visual states for rendering
 * Maps to material layer visibility
 */
export const VisualState = {
  NONE: 'none',
  DEFAULT: 'default',
  FOCUSED: 'focused',
  PRESSED: 'pressed',
} as const;
export type VisualState = (typeof VisualState)[keyof typeof VisualState];

/**
 * Default content-scale horizontal insets (in px) for each interaction state.
 * Specialized packages can replace this policy through
 * `ContentScaleForStateFn` without changing the shared interaction model.
 *
 * Note: Only horizontal insets are defined here. The vertical scale is derived
 * from the horizontal inset applied to the container's aspect ratio.
 */
export const DefaultContentScaleInsets = {
  [State.DEFAULT]: {
    horizontal: 8,
  },
  [State.FOCUSED]: {
    horizontal: 0,
  },
  [State.PRESSED]: {
    horizontal: 8,
  },
} as const;

/**
 * Calculate the shared default content scale for a given state.
 *
 * Content scale computes a SINGLE scale from WIDTH only:
 *   return (width - (inset.horizontal * 2)) / width
 * This single value is applied to BOTH scaleX AND scaleY (uniform scale).
 * Height is NOT used in the calculation.
 */
export function getDefaultContentScaleForState(
  state: State,
  containerSize: { width: number; height: number },
): number {
  const inset = DefaultContentScaleInsets[state].horizontal;

  if (containerSize.width <= 0) return 1;
  return (containerSize.width - inset * 2) / containerSize.width;
}

/**
 * Map interaction state to visual state.
 *
 * When `hasStandaloneVisual` is set, the resting DEFAULT state collapses to
 * NONE so a standalone avatar/glyph shows no resting backdrop.
 */
export function visualStateForInteractionState(
  interactionState: InteractionState,
  hasStandaloneVisual: boolean = false
): VisualState {
  if (interactionState.isDisabled) {
    return VisualState.DEFAULT;
  }

  switch (interactionState.state) {
    case State.DEFAULT:
      return hasStandaloneVisual ? VisualState.NONE : VisualState.DEFAULT;
    case State.FOCUSED:
      return VisualState.FOCUSED;
    case State.PRESSED:
      return VisualState.PRESSED;
    default:
      return VisualState.DEFAULT;
  }
}

/**
 * Determine if state transition should be animated
 */
export function shouldAnimateTransition(
  fromState: State,
  toState: State
): boolean {
  // Don't animate if states are the same
  if (fromState === toState) {
    return false;
  }

  // All state transitions should animate
  return true;
}
