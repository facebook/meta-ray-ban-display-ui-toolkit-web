/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  getRadioButtonCenter,
  getRadioButtonStrokeRadius,
  RADIO_BUTTON_FILL_RADIUS,
  RADIO_BUTTON_SIZE,
} from './RadioButtonMetrics';

export function canToggleRadioButton(disabled: boolean): boolean {
  return !disabled;
}

export function isRadioButtonActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

export function getRadioButtonContainerStyle({
  interactive,
  disabled,
  style,
}: {
  interactive: boolean;
  disabled: boolean;
  style: CSSProperties;
}): CSSProperties {
  return {
    width: RADIO_BUTTON_SIZE,
    height: RADIO_BUTTON_SIZE,
    // Pointer affordance only in interactive mode; the visual-only building
    // block (and disabled) use the default cursor.
    cursor: interactive && !disabled ? 'pointer' : 'default',
    ...style,
  };
}

export function getRadioButtonGeometry(): {
  center: number;
  outerRadius: number;
  strokeRadius: number;
  fillRadius: number;
} {
  return {
    center: getRadioButtonCenter(),
    outerRadius: RADIO_BUTTON_SIZE / 2,
    strokeRadius: getRadioButtonStrokeRadius(),
    fillRadius: RADIO_BUTTON_FILL_RADIUS,
  };
}
