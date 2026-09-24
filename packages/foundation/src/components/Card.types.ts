/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  ReactNode,
} from 'react';
import type { ContainerProps } from './Container.types';

/**
 * Gradient scrim size applied to the card for text legibility over images.
 */
export const ScrimType = {
  NONE: 'none',
  SMALL: 'small',
  MEDIUM: 'medium',
  TALL: 'tall',
  FULL: 'full',
} as const;
export type ScrimType = (typeof ScrimType)[keyof typeof ScrimType];

export interface CardProps extends Omit<ContainerProps, 'children'> {
  /** Card content. */
  children?: ReactNode;

  /** Top gradient scrim type. */
  topScrim?: ScrimType;

  /** Bottom gradient scrim type. */
  bottomScrim?: ScrimType;

}

export interface CardScrimLayerProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}
