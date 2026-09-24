/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/** RadioButton dimensions in px. */
export const RADIO_BUTTON_SIZE = 40;
export const RADIO_BUTTON_STROKE = 4;
export const RADIO_BUTTON_FILL_RADIUS =
  (RADIO_BUTTON_SIZE - RADIO_BUTTON_STROKE * 4) / 2;

export function getRadioButtonCenter(): number {
  return RADIO_BUTTON_SIZE / 2;
}

export function getRadioButtonStrokeRadius(): number {
  return RADIO_BUTTON_SIZE / 2 - RADIO_BUTTON_STROKE / 2;
}
