/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AnimationDurations } from '@wearables-ui-toolkit/foundation/motion/Animations';
import { State, VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { LeadingAccessoryRenderMode } from './ButtonLayout.types';
import type {
  ButtonTargetWidthInput,
} from './ButtonLayout.types';

export { LeadingAccessoryRenderMode } from './ButtonLayout.types';
export type {
  ButtonAnimationValues,
  ButtonTargetWidthInput,
} from './ButtonLayout.types';

export const BUTTON_HEIGHT = 88;
export const BUTTON_MINIMUM_WIDTH = 88;
export const BUTTON_TEXT_ONLY_MAX_WIDTH = 384;
export const BUTTON_TEXT_WITH_ICON_MAX_WIDTH = 344;
export const BUTTON_TEXT_WITH_AVATAR_MAX_WIDTH = 320;

export const AVATAR_LEADING_MARGIN = 8;
export const ICON_IMAGEVIEW_LEADING_MARGIN_WITHOUT_TEXT = 28;
export const ICON_IMAGEVIEW_LEADING_MARGIN_WITH_TEXT = 26;
export const TEXT_LEADING_MARGIN_WITHOUT_ICON_AVATAR = 32;
export const TEXT_LEADING_MARGIN_WITH_ICON_AVATAR = 16;
export const TEXT_TRAILING_MARGIN = 32;
export const TEXT_TRAILING_MARGIN_WITH_TAG = 16;
export const TAG_TRAILING_MARGIN = 32;

export const BACKGROUND_CONTAINER_DEFAULT_SCALE_INSET = 8;
export const BACKGROUND_CONTAINER_FOCUSED_SCALE_INSET = 0;
export const BACKGROUND_CONTAINER_PRESSED_SCALE_INSET = 4;

export const ICON_VERTICAL_OFFSET = 5;
export const TEXT_CONTENT_VERTICAL_PADDING = 8;

export const ICON_COUNTER_SCALE_EXPANDED = 1.0;
export const BUTTON_DEFAULT_CONTENT_SCALE =
  (BUTTON_HEIGHT - BACKGROUND_CONTAINER_DEFAULT_SCALE_INSET * 2) / BUTTON_HEIGHT;

export const OPACITY_ANIMATION_EXPAND_DELAY = 50;
export const OPACITY_ANIMATION_COLLAPSE_DELAY = 0;
export const OPACITY_ANIMATION_DURATION =
  AnimationDurations.CONTAINER_STATE_CHANGE - OPACITY_ANIMATION_EXPAND_DELAY;

export function isButtonStateExpanded(state: State): boolean {
  return state === State.FOCUSED || state === State.PRESSED;
}

export function getButtonMaxWidth(
  renderMode: LeadingAccessoryRenderMode,
): number {
  switch (renderMode) {
    case LeadingAccessoryRenderMode.AVATAR:
      return BUTTON_TEXT_WITH_AVATAR_MAX_WIDTH;
    case LeadingAccessoryRenderMode.ICON:
      return BUTTON_TEXT_WITH_ICON_MAX_WIDTH;
    case LeadingAccessoryRenderMode.NONE:
      return BUTTON_TEXT_ONLY_MAX_WIDTH;
  }
}

export function shouldTruncateButtonContent(
  enforceMaxWidth: boolean,
  measuredContentWidth: number,
  renderMode: LeadingAccessoryRenderMode,
): boolean {
  if (!enforceMaxWidth) return false;
  if (measuredContentWidth <= 0) return false;
  return measuredContentWidth > getButtonMaxWidth(renderMode);
}

export function getButtonTextOpacity(
  state: State,
  renderMode: LeadingAccessoryRenderMode,
  hasText: boolean,
  alwaysShowText: boolean,
): number {
  if (!hasText) return 0;
  if (alwaysShowText) return 1;
  if (renderMode === LeadingAccessoryRenderMode.NONE) return 1;
  return isButtonStateExpanded(state) ? 1 : 0;
}

export function getButtonIconLeadingMargin(
  state: State,
  renderMode: LeadingAccessoryRenderMode,
  hasText: boolean,
  alwaysShowText: boolean,
): number {
  const expanded = isButtonStateExpanded(state);
  if (renderMode === LeadingAccessoryRenderMode.ICON && !hasText) {
    return ICON_IMAGEVIEW_LEADING_MARGIN_WITHOUT_TEXT;
  }
  if (expanded || alwaysShowText) {
    return ICON_IMAGEVIEW_LEADING_MARGIN_WITH_TEXT;
  }
  return ICON_IMAGEVIEW_LEADING_MARGIN_WITHOUT_TEXT;
}

export function getButtonContentScale(
  state: State,
  widthForScale: number,
): number {
  const inset = state === State.DEFAULT
    ? BACKGROUND_CONTAINER_DEFAULT_SCALE_INSET
    : state === State.FOCUSED
      ? BACKGROUND_CONTAINER_FOCUSED_SCALE_INSET
      : BACKGROUND_CONTAINER_PRESSED_SCALE_INSET;
  const dimension = state === State.DEFAULT ? BUTTON_HEIGHT : widthForScale;
  if (dimension < 1) return 1;
  return (dimension - inset * 2) / dimension;
}

export function getButtonTargetWidth({
  customWidth,
  renderMode,
  hasText,
  state,
  alwaysShowText,
  measuredContentWidth,
  enforceMaxWidth,
}: ButtonTargetWidthInput): number {
  if (customWidth != null) {
    return typeof customWidth === 'number' ? customWidth : BUTTON_MINIMUM_WIDTH;
  }

  let calculatedWidth: number;
  if (renderMode === LeadingAccessoryRenderMode.NONE) {
    calculatedWidth = Math.max(measuredContentWidth, BUTTON_MINIMUM_WIDTH);
  } else if (hasText) {
    calculatedWidth =
      isButtonStateExpanded(state) || alwaysShowText
        ? Math.max(measuredContentWidth, BUTTON_MINIMUM_WIDTH)
        : BUTTON_MINIMUM_WIDTH;
  } else {
    calculatedWidth = BUTTON_MINIMUM_WIDTH;
  }

  return enforceMaxWidth
    ? Math.min(calculatedWidth, getButtonMaxWidth(renderMode))
    : calculatedWidth;
}

export function shouldDeferButtonStateChangeUntilMeasured({
  customWidth,
  state,
  hasText,
  measuredContentWidth,
}: {
  customWidth: number | string | undefined;
  state: State;
  hasText: boolean;
  measuredContentWidth: number;
}): boolean {
  return (
    customWidth == null &&
    state !== State.DEFAULT &&
    hasText &&
    measuredContentWidth <= 0
  );
}

export function getButtonVisualState(
  state: State,
  rendersStandaloneAvatarWhenDefaultState: boolean,
): VisualState {
  if (rendersStandaloneAvatarWhenDefaultState && state === State.DEFAULT) {
    return VisualState.NONE;
  }

  switch (state) {
    case State.DEFAULT:
      return VisualState.DEFAULT;
    case State.FOCUSED:
      return VisualState.FOCUSED;
    case State.PRESSED:
      return VisualState.PRESSED;
  }
}

export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}
