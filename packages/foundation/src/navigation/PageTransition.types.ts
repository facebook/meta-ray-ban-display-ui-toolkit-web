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

export interface PageTransitionSegmentConfig {
  durationMs: number;
  delayMs?: number;
  easing: string;
}

export interface PageTransitionValueSegmentConfig
  extends PageTransitionSegmentConfig {
  from: number;
  to: number;
}

export interface PageTransitionStateConfig {
  alpha: PageTransitionValueSegmentConfig;
  scale: PageTransitionValueSegmentConfig;
  translateX: PageTransitionValueSegmentConfig;
}

export interface PageTransitionMotionConfig {
  enter: PageTransitionStateConfig;
  exit: PageTransitionStateConfig;
  totalDurationMs: number;
}

export type PageTransitionDirection = 'forward' | 'back';

export interface PageTransitionConfig {
  forward: PageTransitionMotionConfig;
  back?: PageTransitionMotionConfig;
}

export type PageTransitionInitialFocus =
  | 'top-left'
  | 'none'
  | { selector: string }
  | ((pageElement: HTMLElement) => HTMLElement | null);

export interface PageTransitionProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onTransitionEnd'> {
  children: ReactNode;
  className?: string;
  config?: PageTransitionConfig;
  direction?: PageTransitionDirection;
  disabled?: boolean;
  initialFocus?: PageTransitionInitialFocus;
  pageClassName?: string;
  preservePageState?: boolean;
  style?: CSSProperties;
  timingScale?: number | 'auto';
  transitionKey: string;
  onTransitionEnd?: () => void;
}
