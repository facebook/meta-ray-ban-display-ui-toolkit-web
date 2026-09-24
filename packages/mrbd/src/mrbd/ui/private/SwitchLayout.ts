/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { AnimationDurations, Interpolators } from '@wearables-ui-toolkit/foundation/motion/Animations';
import {
  getSwitchThumbCenterX,
  getSwitchThumbInnerRadius,
  SWITCH_HEIGHT,
  SWITCH_POSITION_OFF,
  SWITCH_POSITION_ON,
  SWITCH_THUMB_RADIUS,
  SWITCH_THUMB_STROKE,
  SWITCH_WIDTH,
} from './SwitchMetrics';

export function getSwitchPosition(isOn: boolean): number {
  return isOn ? SWITCH_POSITION_ON : SWITCH_POSITION_OFF;
}

export function canToggleSwitch(disabled: boolean): boolean {
  return !disabled;
}

export function isSwitchActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

export function getSwitchContainerStyle({
  interactive,
  disabled,
  style,
}: {
  interactive: boolean;
  disabled: boolean;
  style: CSSProperties;
}): CSSProperties {
  return {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    // Pointer affordance only in interactive mode; the visual-only building
    // block (and disabled) use the default cursor.
    cursor: interactive && !disabled ? 'pointer' : 'default',
    ...style,
  };
}

export function getSwitchTransition(shouldAnimate: boolean): string {
  return shouldAnimate
    ? `${AnimationDurations.CONTAINER_STATE_CHANGE}ms ${Interpolators.CONTAINER_SCALE}`
    : 'none';
}

export function getSwitchGeometry(position: number): {
  thumbCenterX: number;
  thumbCenterY: number;
  thumbInnerRadius: number;
  thumbOutlineRadius: number;
  thumbTranslateX: number;
} {
  const offCenterX = getSwitchThumbCenterX(SWITCH_POSITION_OFF);
  return {
    thumbCenterX: offCenterX,
    thumbCenterY: SWITCH_HEIGHT / 2,
    thumbInnerRadius: getSwitchThumbInnerRadius(),
    thumbOutlineRadius: SWITCH_THUMB_RADIUS - SWITCH_THUMB_STROKE / 2,
    thumbTranslateX: getSwitchThumbCenterX(position) - offCenterX,
  };
}

export function getSwitchTrackStyle({
  position,
  shouldAnimate,
  transitionValue,
}: {
  position: number;
  shouldAnimate: boolean;
  transitionValue: string;
}): CSSProperties {
  return {
    fill: position === SWITCH_POSITION_ON
      ? 'var(--uit-color-persistent-action)'
      : 'var(--uit-color-background-inset)',
    transition: shouldAnimate ? `fill ${transitionValue}` : 'none',
  };
}

export function getSwitchThumbGroupStyle({
  thumbTranslateX,
  shouldAnimate,
  transitionValue,
}: {
  thumbTranslateX: number;
  shouldAnimate: boolean;
  transitionValue: string;
}): CSSProperties {
  return {
    transform: `translateX(${thumbTranslateX}px)`,
    transformOrigin: '0 0',
    transition: shouldAnimate ? `transform ${transitionValue}` : 'none',
  };
}

export function getSwitchThumbFillStyle({
  position,
  shouldAnimate,
  transitionValue,
}: {
  position: number;
  shouldAnimate: boolean;
  transitionValue: string;
}): CSSProperties {
  return {
    opacity: position,
    transition: shouldAnimate
      ? `opacity ${transitionValue}`
      : 'none',
  };
}
