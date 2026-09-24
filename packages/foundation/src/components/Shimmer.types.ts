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

export const ShimmerRepeatMode = {
  RESTART: 'restart',
  REVERSE: 'reverse',
} as const;
export type ShimmerRepeatMode = (typeof ShimmerRepeatMode)[keyof typeof ShimmerRepeatMode];

export const ShimmerItemCornerRadius = {
  SQUARE: 'square',
  XXSMALL: 'xxsmall',
  XSMALL: 'xsmall',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge',
} as const;
export type ShimmerItemCornerRadius =
  (typeof ShimmerItemCornerRadius)[keyof typeof ShimmerItemCornerRadius];

export interface ShimmerProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  showShimmer?: boolean;
  autoStart?: boolean;
  clipToChildren?: boolean;
  repeatCount?: number;
  repeatMode?: ShimmerRepeatMode;
  startDelayMs?: number;
  staticAnimationProgress?: number | null;
}

export interface ShimmerItemProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  cornerRadius?: ShimmerItemCornerRadius;
  style?: CSSProperties;
}

