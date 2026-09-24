/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from 'react';

/** Supported complete text appearances. */
export const TextStyle = {
  NUMERAL1: 'numeral1',
  NUMERAL2: 'numeral2',
  DISPLAY1: 'display1',
  HEADING1: 'heading1',
  HEADING2: 'heading2',
  BODY1: 'body1',
  BODY1_EMPHASIZED: 'body1-emphasized',
  BODY2: 'body2',
  BODY2_EMPHASIZED: 'body2-emphasized',
  LABEL: 'label',
  LABEL_EMPHASIZED: 'label-emphasized',
  META1: 'meta1',
  META1_EMPHASIZED: 'meta1-emphasized',
  META2: 'meta2',
  META2_EMPHASIZED: 'meta2-emphasized',
  META3: 'meta3',
} as const;
export type TextStyle = (typeof TextStyle)[keyof typeof TextStyle];

/**
 * Supported text colors, each backed by a theme color token.
 */
export const TextColor = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  PLACEHOLDER: 'placeholder',
  ACTIVE_HOVER: 'activeHover',
  ACCENT: 'accent',
} as const;
export type TextColor = (typeof TextColor)[keyof typeof TextColor];

export type TextViewElement =
  | 'span'
  | 'p'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'label';

export interface TextViewProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  /** Text content to display. */
  children?: ReactNode;

  /** The text style to apply. */
  textStyle?: TextStyle;

  /** The text color to apply. */
  textColor?: TextColor;

  /** Additional CSS class. */
  className?: string;

  /** Additional inline styles. */
  style?: CSSProperties;

  /** HTML element to render. */
  as?: TextViewElement;
}
