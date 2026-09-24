/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UITCommonProps } from '@wearables-ui-toolkit/foundation/base/CommonProps';

/**
 * SliderBar visual state.
 * Controls the fill color and optionally the height.
 */
export const SliderBarState = {
  /** Default unfocused state with standard height and idle color. */
  IDLE: 'idle',
  /** Focused state with expanded height and active color. */
  FOCUSED: 'focused',
} as const;
export type SliderBarState = (typeof SliderBarState)[keyof typeof SliderBarState];

/**
 * SliderBar size variant.
 * Controls idle/focused height behavior.
 */
export const SliderBarSize = {
  /** Default size that expands when focused for enhanced visibility. */
  DEFAULT: 'default',
  /** Thin size that remains constant for compact layouts. */
  THIN: 'thin',
} as const;
export type SliderBarSize = (typeof SliderBarSize)[keyof typeof SliderBarSize];

/**
 * SliderBar orientation.
 */
export const SliderBarOrientation = {
  /** Horizontal slider bar with progress from left to right. */
  HORIZONTAL: 'horizontal',
  /** Vertical slider bar with progress from bottom to top. */
  VERTICAL: 'vertical',
} as const;
export type SliderBarOrientation =
  (typeof SliderBarOrientation)[keyof typeof SliderBarOrientation];

export interface SliderBarProps extends Omit<UITCommonProps, 'onChange'> {
  /** The minimum value of the slider. Default: 0 */
  minimumValue?: number;

  /** The maximum value of the slider. Default: 1 */
  maximumValue?: number;

  /** The current value of the slider, clamped to [minimumValue, maximumValue]. Default: 0 */
  value?: number;

  /** The visual state of the slider. Controls color and height. Default: IDLE */
  state?: SliderBarState;

  /** The size variant. Controls idle/focused heights. Default: DEFAULT */
  size?: SliderBarSize;

  /** Progress orientation. Default: horizontal */
  orientation?: SliderBarOrientation;

  /**
   * Whether the slider should expand its height when in FOCUSED state.
   * Default: true
   */
  shouldExpandOnFocus?: boolean;

  /**
   * Whether value (progress-fill) changes should animate with a smooth
   * transition. Default: false.
   *
   * Governs only the progress-fill transition. State-driven cross-axis
   * (height/width) and color transitions are governed separately by
   * `stateAnimated` (see `SliderBarInternalProps`).
   */
  animated?: boolean;

  /**
   * Callback fired when the value changes via keyboard interaction.
   * The parent component should update the value prop in response.
   *
   * By default the SliderBar is display-only: `value` is read-only, there is no
   * keyboard handling, and it reports `role="progressbar"`. Providing `onChange`
   * opts the slider into an interactive mode — `role="slider"`, a tab stop, and
   * ArrowLeft/Right stepping — for keyboard-only Meta Ray-Ban Display devices.
   */
  onChange?: (newValue: number) => void;

  /**
   * The amount to increment/decrement the value per key press, expressed as
   * a fraction of (maximumValue - minimumValue). Default: 0.1 (10%).
   *
   * Part of the keyboard interactive mode enabled by `onChange` above.
   */
  incrementPercentage?: number;

  /** Whether the component is disabled. Default: false */
  disabled?: boolean;
}

/**
 * In-package-only props. `presentational` renders the slider as a decorative
 * element — it drops its `role`, `aria-*` value attributes, and tab stop so a
 * parent that already owns the slider role/state (e.g. ListItem,
 * IsolatedControl) does not expose a duplicate nested widget or extra focus stop
 * to screen readers. Not part of the public API; set it via the
 * `SliderBarInternal` component (not barrel-exported).
 */
export interface SliderBarInternalProps extends SliderBarProps {
  presentational?: boolean;

  /**
   * Whether state-driven transitions (cross-axis height/width focus-expansion
   * and bar color) should animate. Default: falls back to `animated`.
   *
   * Fully independent from `animated` (the value/fill flag). This lets a parent
   * (e.g. IsolatedControl) animate the focus height/color expansion even when a
   * non-animated fill jump is requested.
   */
  stateAnimated?: boolean;
}
