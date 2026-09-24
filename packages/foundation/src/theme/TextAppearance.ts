/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Toolkit text appearance — CSS class name constants
 *
 * Each constant maps to a CSS class in the text styles stylesheet that bundles
 * the complete text style (font-family, size, line-height, weight, padding).
 *
 * Web usage: <span className={TextAppearance.META2}>text</span>
 *
 * Components should use these constants instead of specifying individual
 * font properties so typography stays consistent across text sizes.
 */
export const TextAppearance = {
  NUMERAL1: 'uit-text-numeral1',
  NUMERAL2: 'uit-text-numeral2',
  DISPLAY1: 'uit-text-display1',
  HEADING1: 'uit-text-heading1',
  HEADING2: 'uit-text-heading2',
  BODY1: 'uit-text-body1',
  BODY1_EMPHASIZED: 'uit-text-body1-emphasized',
  BODY2: 'uit-text-body2',
  BODY2_EMPHASIZED: 'uit-text-body2-emphasized',
  LABEL: 'uit-text-label',
  LABEL_EMPHASIZED: 'uit-text-label-emphasized',
  META1: 'uit-text-meta1',
  META1_EMPHASIZED: 'uit-text-meta1-emphasized',
  META2: 'uit-text-meta2',
  META2_EMPHASIZED: 'uit-text-meta2-emphasized',
  META3: 'uit-text-meta3',
} as const;

export type {
  TextAppearanceKey,
  TextAppearanceValue,
} from './TextAppearance.types';
