/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  QUICK_REPLY_BUTTON_DEFAULT_SCALE_INSET,
  QUICK_REPLY_BUTTON_FOCUSED_SCALE_INSET,
  QUICK_REPLY_BUTTON_HEIGHT,
  QUICK_REPLY_BUTTON_MINIMUM_WIDTH,
  QUICK_REPLY_BUTTON_PRESSED_SCALE_INSET,
  QUICK_REPLY_HORIZONTAL_PADDING,
  QUICK_REPLY_ICON_SIZE,
  QUICK_REPLY_ICON_SPACING,
} from './QuickReplyButtonMetrics';

export interface QuickReplyTargetWidthConfig {
  hasText: boolean;
  shouldShowIcon: boolean;
  textWidth: number;
}

export function isQuickReplyStateExpanded(state: State): boolean {
  return state === State.FOCUSED || state === State.PRESSED;
}

export function shouldShowQuickReplyIcon(
  hasIcon: boolean,
  hasText: boolean,
  isExpanded: boolean,
): boolean {
  return hasIcon && (isExpanded || !hasText);
}

/** Computes the target container width for the button content. */
export function getQuickReplyTargetWidth({
  hasText,
  shouldShowIcon,
  textWidth,
}: QuickReplyTargetWidthConfig): number {
  if (!hasText) {
    return QUICK_REPLY_BUTTON_MINIMUM_WIDTH;
  }

  const padding = QUICK_REPLY_HORIZONTAL_PADDING * 2;

  if (shouldShowIcon) {
    return Math.max(
      textWidth + QUICK_REPLY_ICON_SPACING + QUICK_REPLY_ICON_SIZE + padding,
      QUICK_REPLY_BUTTON_MINIMUM_WIDTH,
    );
  }

  return Math.max(textWidth + padding, QUICK_REPLY_BUTTON_MINIMUM_WIDTH);
}

/** Computes the content scale factor for the given interaction state. */
export function getQuickReplyContentScale(
  state: State,
  targetWidth: number,
): number {
  const inset =
    state === State.DEFAULT
      ? QUICK_REPLY_BUTTON_DEFAULT_SCALE_INSET
      : state === State.FOCUSED
        ? QUICK_REPLY_BUTTON_FOCUSED_SCALE_INSET
        : QUICK_REPLY_BUTTON_PRESSED_SCALE_INSET;
  const dimension = state === State.DEFAULT ? QUICK_REPLY_BUTTON_HEIGHT : targetWidth;

  if (dimension < 1) return 1;
  return (dimension - inset * 2) / dimension;
}

export function getQuickReplyLayoutCompensation(
  targetWidth: number,
  contentScale: number,
): number {
  return -Math.max(
    0,
    (targetWidth - QUICK_REPLY_BUTTON_HEIGHT) * (1 - contentScale) / 2,
  );
}

export function getQuickReplyIconAlpha(shouldShowIcon: boolean): number {
  return shouldShowIcon ? 1 : 0;
}

export function getQuickReplyDisabledOpacity(disabled: boolean): number {
  return disabled ? 0.38 : 1;
}
