/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * IsolatedControl public API for Meta Ray-Ban Display.
 */

import type { ContainerProps } from '@wearables-ui-toolkit/foundation/components/Container';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';

export interface IsolatedControlProps extends Omit<ContainerProps, 'children' | 'onClick'> {
  /**
   * Icon source displayed on the left side.
   * If undefined, the icon area is hidden and padding adjusts.
   */
  icon?: IconSource;

  /** Minimum slider value. Default: 0. */
  minimumValue?: number;

  /** Maximum slider value. Default: 1. */
  maximumValue?: number;

  /**
   * Current slider value, clamped to [minimumValue, maximumValue].
   *
   * When provided, the control is fully controlled: the value only changes
   * when the parent updates this prop (typically from `onValueChanged`).
   *
   * When omitted, the control is uncontrolled: it seeds its value from
   * `defaultValue` and self-updates on Left/Right key events while still
   * firing `onValueChanged`.
   */
  value?: number;

  /**
   * Initial value for uncontrolled mode. Ignored when `value` is provided.
   * Default: `minimumValue`.
   */
  defaultValue?: number;

  /**
   * Fraction of the range to increment/decrement for each d-pad action.
   * Default: 0.1.
   */
  incrementPercentage?: number;

  /** Callback fired when Left/Right changes the value. */
  onValueChanged?: (newValue: number) => void;

  /**
   * Optional click handler.
   * IsolatedControl is not clickable by default.
   */
  onClick?: () => void;

  /** Whether value changes should animate. Default: true. */
  animated?: boolean;

  /** Accessible label for screen readers. */
  'aria-label'?: string;
}

/**
 * Imperative handle for IsolatedControl.
 *
 * Exposes a `setValue(value, animated)` method, allowing callers to set the
 * value programmatically.
 * In uncontrolled mode this updates the internal value; in controlled mode it
 * still fires `onValueChanged` so the parent can update the `value` prop.
 */
export interface IsolatedControlHandle {
  /**
   * Sets the value of the slider, clamped to [minimumValue, maximumValue].
   *
   * @param value The new value to set the slider to.
   * @param animated Whether to animate the change. Default: false.
   */
  setValue(value: number, animated?: boolean): void;

  /**
   * The root DOM element of the control, for consumers that need direct access
   * to the underlying `HTMLDivElement`. Null before mount / after unmount.
   */
  getElement(): HTMLDivElement | null;
}
