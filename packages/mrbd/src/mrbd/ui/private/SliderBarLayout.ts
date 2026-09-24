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
  clampSliderBarValue,
  getSliderBarCrossAxisHeight,
  getSliderBarProgressScale,
} from './SliderBarGeometry';
import {
  SLIDER_BAR_VALUE_TRANSITION_DURATION_MS,
  SLIDER_BAR_VALUE_TRANSITION_EASING,
} from './SliderBarMetrics';
import { SliderBarOrientation, SliderBarSize, SliderBarState } from '../SliderBar.types';

export function isSliderBarInteractive({
  hasChangeHandler,
  disabled,
}: {
  hasChangeHandler: boolean;
  disabled: boolean;
}): boolean {
  return hasChangeHandler && !disabled;
}

export function getSliderBarClampedValue(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return clampSliderBarValue(value, minimumValue, maximumValue);
}

export function getSliderBarProgressPercent(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return getSliderBarProgressScale(value, minimumValue, maximumValue) * 100;
}

export function getSliderBarAccessibilityPercent(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return Math.round(getSliderBarProgressScale(value, minimumValue, maximumValue) * 100);
}

export function getSliderBarTrackHeight({
  state,
  size,
  shouldExpandOnFocus,
}: {
  state: SliderBarState;
  size: SliderBarSize;
  shouldExpandOnFocus: boolean;
}): number {
  return getSliderBarCrossAxisHeight(state, size, shouldExpandOnFocus);
}

export function getSliderBarFillColor(state: SliderBarState): string {
  return state === SliderBarState.FOCUSED
    ? 'var(--uit-color-control-active, rgba(255, 255, 255, 0.749))'
    : 'var(--uit-color-control-idle, rgba(255, 255, 255, 0.502))';
}

export function getSliderBarNextValue({
  clampedValue,
  minimumValue,
  maximumValue,
  incrementPercentage,
  direction,
}: {
  clampedValue: number;
  minimumValue: number;
  maximumValue: number;
  incrementPercentage: number;
  direction: 'decrement' | 'increment';
}): number {
  const step = (maximumValue - minimumValue) * incrementPercentage;
  const delta = direction === 'increment' ? step : -step;
  return clampSliderBarValue(clampedValue + delta, minimumValue, maximumValue);
}

export function getSliderBarContainerStyle({
  orientation,
  trackHeight,
  animateCrossAxis,
  style,
}: {
  orientation: SliderBarOrientation;
  trackHeight: number;
  // Animate the cross-axis (height for horizontal, width for vertical) only when
  // the change is an IDLE<->FOCUSED state change. Size/orientation changes pass
  // false so they snap rather than animate.
  animateCrossAxis: boolean;
  style: CSSProperties;
}): CSSProperties {
  if (orientation === SliderBarOrientation.VERTICAL) {
    return {
      width: trackHeight,
      height: '100%',
      ...(animateCrossAxis
        ? {
            transition: `width ${AnimationDurations.CONTAINER_STATE_CHANGE}ms ${Interpolators.CONTAINER_SCALE}`,
          }
        : null),
      ...style,
    };
  }

  return {
    height: trackHeight,
    ...(animateCrossAxis
      ? {
          transition: `height ${AnimationDurations.CONTAINER_STATE_CHANGE}ms ${Interpolators.CONTAINER_SCALE}`,
        }
      : null),
    ...style,
  };
}

export function getSliderBarFillStyle({
  orientation,
  progressPercent,
  fillColor,
  valueAnimated,
  stateAnimated,
}: {
  orientation: SliderBarOrientation;
  progressPercent: number;
  fillColor: string;
  // Animates the fill dimension (width for horizontal, height for vertical).
  valueAnimated: boolean;
  // Animates the fill (bar) color on IDLE<->FOCUSED transitions.
  stateAnimated: boolean;
}): CSSProperties {
  const style: CSSProperties =
    orientation === SliderBarOrientation.VERTICAL
      ? {
          top: 'auto',
          bottom: 0,
          width: '100%',
          height: `${progressPercent}%`,
          backgroundColor: fillColor,
        }
      : {
          width: `${progressPercent}%`,
          backgroundColor: fillColor,
        };

  const transitions: string[] = [];
  if (valueAnimated) {
    const animatedDimension =
      orientation === SliderBarOrientation.VERTICAL ? 'height' : 'width';
    transitions.push(
      `${animatedDimension} ${SLIDER_BAR_VALUE_TRANSITION_DURATION_MS}ms ${SLIDER_BAR_VALUE_TRANSITION_EASING}`,
    );
  }
  if (stateAnimated) {
    transitions.push(
      `background-color ${AnimationDurations.CONTAINER_STATE_CHANGE}ms ${Interpolators.CONTAINER_SCALE}`,
    );
  }
  if (transitions.length > 0) {
    style.transition = transitions.join(', ');
  }

  return style;
}

export function getSliderBarClassName({
  baseClassName,
  animatedClassName,
  stateAnimated,
  className,
}: {
  baseClassName: string;
  animatedClassName: string;
  // Toggles the `.animated` class, which gates state-driven color transitions.
  stateAnimated: boolean;
  className: string;
}): string {
  return [
    baseClassName,
    stateAnimated ? animatedClassName : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
