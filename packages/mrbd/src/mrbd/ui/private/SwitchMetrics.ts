/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/** Switch dimensions in px. */
export const SWITCH_WIDTH = 64;
export const SWITCH_HEIGHT = 40;
export const SWITCH_THUMB_RADIUS = 16;
export const SWITCH_THUMB_STROKE = 4;
export const SWITCH_THUMB_MARGIN = 4;

export const SWITCH_POSITION_OFF = 0;
export const SWITCH_POSITION_ON = 1;

export function getSwitchThumbCenterX(position: number): number {
  return (
    SWITCH_THUMB_MARGIN +
    SWITCH_THUMB_RADIUS +
    (SWITCH_WIDTH - 2 * SWITCH_THUMB_MARGIN - 2 * SWITCH_THUMB_RADIUS) * position
  );
}

export function getSwitchThumbInnerRadius(): number {
  return SWITCH_THUMB_RADIUS - SWITCH_THUMB_STROKE;
}
