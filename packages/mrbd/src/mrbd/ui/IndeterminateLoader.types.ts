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
} from 'react';

/**
 * Available sizes for the IndeterminateLoader.
 */
export const IndeterminateLoaderSize = {
  XSMALL: 'xsmall',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;
export type IndeterminateLoaderSize =
  (typeof IndeterminateLoaderSize)[keyof typeof IndeterminateLoaderSize];

export interface IndeterminateLoaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the loader animation is playing.
   * @default true
   */
  isAnimating?: boolean;

  /**
   * Size variant of the loader.
   * @default IndeterminateLoaderSize.LARGE
   */
  size?: IndeterminateLoaderSize;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;
}
