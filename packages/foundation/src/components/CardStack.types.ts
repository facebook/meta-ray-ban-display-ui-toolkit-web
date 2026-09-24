/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * CardStack public API and configuration surface.
 */

import type { ReactNode } from 'react';
import type { CardProps } from './Card';
import { ScrimType } from './Card';

/**
 * Stack type values controlling layout and interaction.
 */
export const StackType = {
  /** Interactive stack with focus animations. Max 2 background cards. */
  INTERACTIVE: 'interactive',
  /** Display stack with static scattered cards. Max 3 background cards. */
  DISPLAY: 'display',
} as const;
export type StackType = (typeof StackType)[keyof typeof StackType];

/**
 * Aspect ratio values for the cards in the stack.
 */
export const AspectRatio = {
  /** 1:1 square */
  SQUARE: 'square',
  /** 3:4 portrait */
  PORTRAIT: 'portrait',
} as const;
export type AspectRatio = (typeof AspectRatio)[keyof typeof AspectRatio];

/**
 * Background card configuration.
 */
export interface BackgroundCardConfig {
  /** Image source for the background card. */
  src?: string;
  /** Alt text for the image. */
  alt?: string;
  /** Custom content instead of an image. */
  children?: ReactNode;
}

export interface CardStackProps extends Omit<CardProps, 'children'> {
  /** Primary card content. */
  children?: ReactNode;

  /**
   * Stack type controlling layout and interaction.
   * INTERACTIVE: cards fan from corner pivot on focus (max 2 background cards).
   * DISPLAY: cards are scattered with rotation and translation (max 3 background cards).
   * @default StackType.INTERACTIVE
   */
  type?: StackType;

  /**
   * Aspect ratio of the cards.
   * @default AspectRatio.PORTRAIT
   */
  aspectRatio?: AspectRatio;

  /**
   * Background card configurations.
   * INTERACTIVE: max 2 cards.
   * DISPLAY: max 3 cards.
   */
  backgroundCards?: BackgroundCardConfig[];

  /**
   * Top scrim type passed to the primary Card.
   * @default ScrimType.NONE
   */
  topScrim?: ScrimType;

  /**
   * Bottom scrim type passed to the primary Card.
   * @default ScrimType.NONE
   */
  bottomScrim?: ScrimType;

  /**
   * Width of the card stack in px.
   * Cards are sized proportionally within this width.
   */
  width?: number;

  /**
   * Height of the card stack in px.
   * If not provided, calculated from width and aspect ratio.
   */
  height?: number;

  /**
   * Maximum measured stack width in px.
   * Constrains the measured size for row-constrained stacks.
   */
  maxWidth?: number;

  /**
   * Maximum measured stack height in px.
   * Constrains the measured size for row-constrained stacks.
   */
  maxHeight?: number;
}
