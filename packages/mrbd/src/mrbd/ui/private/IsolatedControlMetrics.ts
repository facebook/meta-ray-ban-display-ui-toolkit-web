/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Metrics for IsolatedControl.
 * Layout dimensions used by the component.
 */

/** Component height: 88px. */
export const ISOLATED_CONTROL_HEIGHT = 88;

/** Slider minimum width: 200px. */
export const ISOLATED_CONTROL_SLIDER_MIN_WIDTH = 200;

/** Icon size: 36px. */
export const ISOLATED_CONTROL_ICON_SIZE = 36;

/** Content left padding when an icon is shown: 24px (--uit-spacing-large). */
export const ISOLATED_CONTROL_PADDING_LEFT_WITH_ICON = 24;

/** Content left padding without an icon: 32px (--uit-spacing-xlarge). */
export const ISOLATED_CONTROL_PADDING_LEFT_NO_ICON = 32;

/** Content right padding: 32px (--uit-spacing-xlarge). */
export const ISOLATED_CONTROL_PADDING_RIGHT = 32;

/** Gap between icon and slider: 16px (--uit-spacing-medium). */
export const ISOLATED_CONTROL_ICON_SLIDER_GAP = 16;

/** Default increment percentage per key press. */
export const ISOLATED_CONTROL_DEFAULT_INCREMENT_PERCENTAGE = 0.1;

/** Minimum content width with icon. */
export const ISOLATED_CONTROL_MIN_WIDTH_WITH_ICON =
  ISOLATED_CONTROL_SLIDER_MIN_WIDTH +
  ISOLATED_CONTROL_ICON_SIZE +
  ISOLATED_CONTROL_PADDING_LEFT_WITH_ICON +
  ISOLATED_CONTROL_PADDING_RIGHT +
  ISOLATED_CONTROL_ICON_SLIDER_GAP;

/** Minimum content width without icon. */
export const ISOLATED_CONTROL_MIN_WIDTH_NO_ICON =
  ISOLATED_CONTROL_SLIDER_MIN_WIDTH +
  ISOLATED_CONTROL_PADDING_LEFT_NO_ICON +
  ISOLATED_CONTROL_PADDING_RIGHT;
