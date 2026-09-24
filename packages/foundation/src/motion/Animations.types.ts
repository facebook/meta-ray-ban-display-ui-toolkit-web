/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Equilibrium detection mode for spring animations. Controls the
 * velocity/position thresholds at which a spring is considered settled.
 */
export const EquilibriumMode = {
  /** Conservative thresholds for precise animations. */
  DEFAULT: 'default',
  /** Very conservative thresholds for high-precision animations. */
  SLOW: 'slow',
  /** Aggressive thresholds for snappy animations. */
  FAST: 'fast',
  /** Even more aggressive thresholds for ultra-snappy animations. */
  FASTER: 'faster',
} as const;
export type EquilibriumMode = (typeof EquilibriumMode)[keyof typeof EquilibriumMode];

/**
 * Spring animation parameters.
 */
export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  /** Equilibrium detection mode (defaults to {@link EquilibriumMode.DEFAULT}). */
  equilibriumMode?: EquilibriumMode;
}

export interface TransitionDescriptor {
  property: string;
  duration: number;
  interpolator?: string;
  delay?: number;
}

/**
 * Animation state for tracking running animations.
 */
export interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  duration: number;
  fromValue: number;
  toValue: number;
  interpolator: string;
}

export interface StateChangeAnimationConfig {
  duration: number;
  interpolator: string;
}
