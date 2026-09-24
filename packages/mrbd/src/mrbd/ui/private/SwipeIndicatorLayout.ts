/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  SWIPE_DIRECTION_CONFIG,
  SWIPE_INDICATOR_NUDGE_RETURN_MS,
  SWIPE_INDICATOR_SCRIM_ALPHA,
  SWIPE_INDICATOR_SPRING_DURATION_MS,
  SWIPE_INDICATOR_SPRING_EASING,
} from './SwipeIndicatorMetrics';
import { SwipeDirection } from '../SwipeIndicator.types';

export function getSwipeIndicatorDirectionConfig(direction: SwipeDirection) {
  return SWIPE_DIRECTION_CONFIG[direction];
}

export function getSwipeIndicatorClassName(
  baseClassName: string,
  className: string,
): string {
  return [baseClassName, className].filter(Boolean).join(' ');
}

export function getSwipeIndicatorCaretStyle({
  rotationDegrees,
  nudgeTranslate,
  nudgeAnimated,
}: {
  rotationDegrees: number;
  nudgeTranslate: number;
  nudgeAnimated: boolean;
}): CSSProperties {
  const style: CSSProperties = {
    transform: `rotate(${rotationDegrees}deg) translateY(${nudgeTranslate}px)`,
  };

  // The caret transition belongs to the nudge cycle only; rotation (direction)
  // is never animated.
  if (nudgeAnimated) {
    style.transition =
      `transform ${SWIPE_INDICATOR_SPRING_DURATION_MS}ms ` +
      SWIPE_INDICATOR_SPRING_EASING;
  }

  return style;
}

export function getSwipeIndicatorPromptStyle({
  expanded,
  animated,
}: {
  expanded: boolean;
  animated: boolean;
}): CSSProperties {
  const style: CSSProperties = {
    opacity: expanded ? 1 : 0,
    visibility: expanded ? 'visible' : 'hidden',
  };

  if (animated) {
    style.transition =
      `opacity ${SWIPE_INDICATOR_SPRING_DURATION_MS}ms ` +
      `${SWIPE_INDICATOR_SPRING_EASING}, visibility 0ms ` +
      (expanded ? '0ms' : `${SWIPE_INDICATOR_SPRING_DURATION_MS}ms`);
  }

  return style;
}

export function getSwipeIndicatorContentStyle({
  expanded,
  animated,
}: {
  expanded: boolean;
  animated: boolean;
}): CSSProperties {
  const style: CSSProperties = {
    transform: expanded
      ? 'translateY(0px)'
      : 'translateY(var(--uit-swipe-indicator-prompt-height, 0px))',
  };

  if (animated) {
    style.transition =
      `transform ${SWIPE_INDICATOR_SPRING_DURATION_MS}ms ` +
      SWIPE_INDICATOR_SPRING_EASING;
  }

  return style;
}

export function getSwipeIndicatorScrimStyle({
  expanded,
  animated,
  showScrim,
}: {
  expanded: boolean;
  animated: boolean;
  showScrim: boolean;
}): CSSProperties {
  if (!showScrim) {
    return {};
  }

  const style: CSSProperties = {
    opacity: SWIPE_INDICATOR_SCRIM_ALPHA,
    transform: expanded
      ? 'translateY(0px)'
      : 'translateY(var(--uit-swipe-indicator-prompt-height, 0px))',
  };

  if (animated) {
    style.transition =
      `transform ${SWIPE_INDICATOR_SPRING_DURATION_MS}ms ` +
      SWIPE_INDICATOR_SPRING_EASING;
  }

  return style;
}

export function shouldRenderSwipeIndicatorScrim(showScrim: boolean): boolean {
  return showScrim;
}

export function shouldRenderSwipeIndicatorPrompt(prompt: string): boolean {
  return prompt.length > 0;
}

export function getSwipeIndicatorNudgeReturnDelay(): number {
  return SWIPE_INDICATOR_NUDGE_RETURN_MS;
}
