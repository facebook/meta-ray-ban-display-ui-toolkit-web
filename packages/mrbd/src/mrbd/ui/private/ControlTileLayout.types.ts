/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { State } from '@wearables-ui-toolkit/foundation/base/Interactions';

export type ControlTileProgressMode = 'none' | 'circular' | 'horizontal';

export type ControlTileAriaRole = 'button' | 'switch' | 'slider';

export interface ControlTileAriaState {
  role: ControlTileAriaRole;
  ariaLabel?: string;
  ariaValueNow?: number;
  ariaValueMin?: number;
  ariaValueMax?: number;
  ariaChecked?: boolean;
}

export interface ControlTileProgressModeInput {
  showHorizontalProgressBar: boolean;
  showCircularProgressBar: boolean;
}

export interface ControlTileSliderStateInput {
  progressMode: ControlTileProgressMode;
  state: State;
}

export interface ControlTileIconBackgroundInput {
  state: State;
  checked: boolean | null;
  hasIcon: boolean;
  progressMode: ControlTileProgressMode;
  hasIconContainerMaterial?: boolean;
}

export interface ControlTileProgressKeyInput {
  showHorizontalProgressBar: boolean;
  disabled: boolean;
}

export interface ControlTileAriaStateInput {
  title?: string;
  checked: boolean | null;
  progress?: number;
}
