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

export const MediaWrapperSize = {
  SMALL: 'small',
  LARGE: 'large',
} as const;
export type MediaWrapperSize = (typeof MediaWrapperSize)[keyof typeof MediaWrapperSize];

export const MediaWrapperPosition = {
  TOP: 'top',
  BOTTOM: 'bottom',
} as const;
export type MediaWrapperPosition = (typeof MediaWrapperPosition)[keyof typeof MediaWrapperPosition];

export interface MediaWrapperProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  size?: MediaWrapperSize;
  position?: MediaWrapperPosition;
  style?: CSSProperties;
}
