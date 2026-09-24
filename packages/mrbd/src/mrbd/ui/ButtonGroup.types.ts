/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ButtonGroup public API for Meta Ray-Ban Display.
 * Defines the alignment options and Sizable contract.
 */

import type { CSSProperties, ReactNode } from 'react';

/**
 * Alignment of buttons within the group.
 */
export const ButtonGroupAlignment = {
  /** Align buttons to the leading edge (left in LTR layouts) */
  START: 'start',
  /** Center buttons as a group within the container */
  CENTER: 'center',
  /** Align buttons to the trailing edge (right in LTR layouts) */
  END: 'end',
} as const;
export type ButtonGroupAlignment =
  (typeof ButtonGroupAlignment)[keyof typeof ButtonGroupAlignment];

/**
 * Sizable interface — the contract for ButtonGroup children.
 * Components that can be placed inside a ButtonGroup must implement this.
 */
export interface Sizable {
  /** Width when focused (px) */
  focusedWidth: number;
  /** Width when unfocused (px) */
  defaultWidth: number;
  /** Height (px) */
  height: number;
}

export interface ButtonGroupProps {
  /** Child elements (typically Button or divider components) */
  children: ReactNode;

  /** Alignment of children within the group */
  alignment?: ButtonGroupAlignment;

  /**
   * Callback when a child gains or loses focus.
   *
   * @param group - The ButtonGroup container element (or null before mount).
   * @param focusedChild - The DOM element that gained focus, or null if focus left the group.
   */
  onChildFocusChange?: (
    group: HTMLElement | null,
    focusedChild: HTMLElement | null,
  ) => void;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;
}
