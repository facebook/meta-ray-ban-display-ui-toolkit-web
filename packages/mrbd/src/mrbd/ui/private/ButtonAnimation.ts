/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { AnimationDurations } from '@wearables-ui-toolkit/foundation/motion/Animations';
import {
  BUTTON_DEFAULT_CONTENT_SCALE,
  BUTTON_MINIMUM_WIDTH,
  LeadingAccessoryRenderMode,
  OPACITY_ANIMATION_COLLAPSE_DELAY,
  OPACITY_ANIMATION_DURATION,
  OPACITY_ANIMATION_EXPAND_DELAY,
  getButtonContentScale,
  getButtonIconLeadingMargin,
  getButtonTextOpacity,
} from './ButtonLayout';
import type { ButtonAnimationValues } from './ButtonLayout';

export interface ButtonAnimationValueParams {
  state: State;
  targetWidth: number;
  renderMode: LeadingAccessoryRenderMode;
  hasText: boolean;
  alwaysShowText: boolean;
}

export interface ButtonInitialAnimationValueParams
  extends Omit<ButtonAnimationValueParams, 'state' | 'targetWidth'> {
  measuredContentWidth: number;
}

export interface ButtonAnimationTimingParams {
  state: State;
  previousState: State;
  startValues: ButtonAnimationValues;
  targetValues: ButtonAnimationValues;
}

export interface ButtonAnimationTiming {
  duration: number;
  opacityDuration: number;
  opacityDelay: number;
}

export function getButtonInitialAnimationValues({
  measuredContentWidth,
  renderMode,
  hasText,
  alwaysShowText,
}: ButtonInitialAnimationValueParams): ButtonAnimationValues {
  const startsExpanded =
    alwaysShowText || renderMode === LeadingAccessoryRenderMode.NONE;
  const width = startsExpanded
    ? Math.max(measuredContentWidth, BUTTON_MINIMUM_WIDTH)
    : BUTTON_MINIMUM_WIDTH;

  return {
    width,
    scale: startsExpanded
      ? getButtonContentScale(State.DEFAULT, width)
      : BUTTON_DEFAULT_CONTENT_SCALE,
    iconLeadingMargin: getButtonIconLeadingMargin(
      State.DEFAULT,
      renderMode,
      hasText,
      alwaysShowText,
    ),
    textOpacity: getButtonTextOpacity(
      State.DEFAULT,
      renderMode,
      hasText,
      alwaysShowText,
    ),
  };
}

export function getButtonAnimationTargetValues({
  state,
  targetWidth,
  renderMode,
  hasText,
  alwaysShowText,
}: ButtonAnimationValueParams): ButtonAnimationValues {
  return {
    width: targetWidth,
    scale: getButtonContentScale(state, targetWidth),
    iconLeadingMargin: getButtonIconLeadingMargin(
      state,
      renderMode,
      hasText,
      alwaysShowText,
    ),
    textOpacity: getButtonTextOpacity(
      state,
      renderMode,
      hasText,
      alwaysShowText,
    ),
  };
}

export function getButtonAnimationTiming({
  state,
  previousState,
  startValues,
  targetValues,
}: ButtonAnimationTimingParams): ButtonAnimationTiming {
  const duration = state === State.PRESSED
    ? AnimationDurations.CONTAINER_PRESS_IN
    : previousState === State.PRESSED
      ? AnimationDurations.CONTAINER_PRESS_OUT
      : AnimationDurations.CONTAINER_STATE_CHANGE;
  const opacityDuration = state === State.PRESSED || previousState === State.PRESSED
    ? duration
    : OPACITY_ANIMATION_DURATION;
  const opacityDelay = state === State.PRESSED || previousState === State.PRESSED
    ? 0
    : targetValues.textOpacity > startValues.textOpacity
      ? OPACITY_ANIMATION_EXPAND_DELAY
      : OPACITY_ANIMATION_COLLAPSE_DELAY;

  return {
    duration,
    opacityDuration,
    opacityDelay,
  };
}

export function areButtonAnimationValuesAtTarget(
  startValues: ButtonAnimationValues,
  targetValues: ButtonAnimationValues,
): boolean {
  return (
    Math.abs(startValues.width - targetValues.width) < 0.01 &&
    Math.abs(startValues.scale - targetValues.scale) < 0.0001 &&
    Math.abs(startValues.iconLeadingMargin - targetValues.iconLeadingMargin) < 0.01 &&
    Math.abs(startValues.textOpacity - targetValues.textOpacity) < 0.001
  );
}
