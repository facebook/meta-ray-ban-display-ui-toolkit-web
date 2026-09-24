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

/**
 * Swipe direction enum.
 */
export const SwipeDirection = {
  UP: 'up',
  DOWN: 'down',
} as const;
export type SwipeDirection = (typeof SwipeDirection)[keyof typeof SwipeDirection];

type SwipeIndicatorAccessibilityProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  | 'aria-describedby'
  | 'aria-hidden'
  | 'aria-label'
  | 'aria-labelledby'
  | 'id'
>;

export interface SwipeIndicatorProps extends SwipeIndicatorAccessibilityProps {
  /** Data attributes used to identify the visual element in tests or tooling. */
  [dataAttribute: `data-${string}`]: string | number | boolean | undefined;

  /**
   * Prompt text displayed below/above the caret when expanded.
   * @default ''
   */
  prompt?: string;

  /**
   * Whether the prompt text is visible.
   * @default false
   */
  expanded?: boolean;

  /**
   * Direction the caret points, indicating swipe direction.
   * @default SwipeDirection.UP
   */
  direction?: SwipeDirection;

  /**
   * Whether to show a gradient scrim behind the indicator.
   * @default true
   */
  showScrim?: boolean;

  /**
   * Whether expand/collapse changes should animate.
   * @default false
   */
  animated?: boolean;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;
}

export interface SwipeIndicatorHandle {
  /**
   * Trigger a nudge animation on the caret.
   * @param count Number of nudge cycles.
   * @param animated Whether the nudge uses spring animation.
   */
  nudge: (count?: number, animated?: boolean) => void;
}
