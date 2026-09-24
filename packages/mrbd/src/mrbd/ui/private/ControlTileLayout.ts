/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { SliderBarState } from '../SliderBar';
import {
  CONTROL_TILE_ICON_SCALE_HORIZONTAL_PROGRESS,
  CONTROL_TILE_ICON_SIZE_LARGE,
  CONTROL_TILE_ICON_SIZE_MEDIUM,
} from './ControlTileMetrics';
import type {
  ControlTileAriaState,
  ControlTileAriaStateInput,
  ControlTileIconBackgroundInput,
  ControlTileProgressKeyInput,
  ControlTileProgressMode,
  ControlTileProgressModeInput,
  ControlTileSliderStateInput,
} from './ControlTileLayout.types';

export type {
  ControlTileAriaRole,
  ControlTileAriaState,
  ControlTileAriaStateInput,
  ControlTileIconBackgroundInput,
  ControlTileProgressKeyInput,
  ControlTileProgressMode,
  ControlTileProgressModeInput,
  ControlTileSliderStateInput,
} from './ControlTileLayout.types';

export function getControlTileProgressMode({
  showHorizontalProgressBar,
  showCircularProgressBar,
}: ControlTileProgressModeInput): ControlTileProgressMode {
  if (showHorizontalProgressBar) {
    return 'horizontal';
  }

  if (showCircularProgressBar) {
    return 'circular';
  }

  return 'none';
}

export function hasControlTileProgressBar(mode: ControlTileProgressMode): boolean {
  return mode !== 'none';
}

export function getControlTileIconSize(hasProgressBar: boolean): number {
  return hasProgressBar
    ? CONTROL_TILE_ICON_SIZE_MEDIUM
    : CONTROL_TILE_ICON_SIZE_LARGE;
}

export function getControlTileIconScale(progressMode: ControlTileProgressMode): number {
  return progressMode === 'horizontal'
    ? CONTROL_TILE_ICON_SCALE_HORIZONTAL_PROGRESS
    : 1;
}

export function getControlTileSliderState({
  progressMode,
  state,
}: ControlTileSliderStateInput): SliderBarState {
  if (progressMode !== 'horizontal') {
    return SliderBarState.IDLE;
  }

  switch (state) {
    case State.FOCUSED:
    case State.PRESSED:
      return SliderBarState.FOCUSED;
    case State.DEFAULT:
    default:
      return SliderBarState.IDLE;
  }
}

export function shouldShowControlTileIconBackground({
  state,
  checked,
  hasIcon,
  progressMode,
  hasIconContainerMaterial = false,
}: ControlTileIconBackgroundInput): boolean {
  return (
    (state === State.FOCUSED ||
      state === State.PRESSED ||
      hasIconContainerMaterial ||
      checked === true) &&
    hasIcon &&
    progressMode !== 'horizontal'
  );
}

export function shouldHandleControlTileProgressKey({
  showHorizontalProgressBar,
  disabled,
}: ControlTileProgressKeyInput): boolean {
  return showHorizontalProgressBar && !disabled;
}

export function getControlTileAriaState({
  title,
  checked,
  progress,
}: ControlTileAriaStateInput): ControlTileAriaState {
  if (progress != null) {
    return {
      role: 'slider',
      ariaLabel: title,
      ariaValueNow: progress,
      ariaValueMin: 0,
      ariaValueMax: 1,
    };
  }

  return {
    role: checked != null ? 'switch' : 'button',
    ariaLabel: title,
    ariaChecked: checked ?? undefined,
  };
}
