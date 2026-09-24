/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Animation timing and interpolation system
 */

import { State } from '../base/Interactions';
import type { StateTransition } from '../base/Interactions';
import { EquilibriumMode } from './Animations.types';
import type {
  AnimationState,
  SpringConfig,
  StateChangeAnimationConfig,
  TransitionDescriptor,
} from './Animations.types';

export { EquilibriumMode } from './Animations.types';
export type {
  AnimationState,
  SpringConfig,
  StateChangeAnimationConfig,
  TransitionDescriptor,
} from './Animations.types';

/**
 * Animation durations (in milliseconds)
 */
export const AnimationDurations = {
  /** Default state change (DEFAULT ↔ FOCUSED) */
  CONTAINER_STATE_CHANGE: 300,

  /** Press in animation (any state → PRESSED) */
  CONTAINER_PRESS_IN: 80,

  /** Press out animation (PRESSED → previous state) */
  CONTAINER_PRESS_OUT: 100,

  /** Fast focus during scrolling */
  CONTAINER_STATE_CHANGE_FAST_FOCUS: 150,

  /** Delay before expansion during fast movement */
  CONTAINER_FAST_MOVEMENT_EXPANSION_HESITATION_DELAY: 500,

  /** Text opacity animation */
  TEXT_OPACITY: 250,

  /** Text opacity expand delay */
  TEXT_OPACITY_EXPAND_DELAY: 50,

  /** Text opacity collapse delay */
  TEXT_OPACITY_COLLAPSE_DELAY: 0,

  /** Icon rotation animation */
  ICON_ROTATION: 100,

  /** Duration of each segment of the discrete rubberband animation */
  CONTAINER_RUBBERBAND: 150,
} as const;

/**
 * Cubic-bezier timing functions for the animation path interpolators.
 * Use these with CSS transitions or Web Animations API
 */
export const Interpolators = {
  /**
   * Container scale animation interpolator
   * Control points (0.68, 0, 0.29, 1)
   * Smooth ease-in-out for state changes
   */
  CONTAINER_SCALE: 'cubic-bezier(0.68, 0, 0.29, 1)',

  /**
   * Container press in interpolator
   * Control points (0.23, 0.23, 0.24, 1)
   * Quick, responsive press feedback
   */
  CONTAINER_PRESS_IN: 'cubic-bezier(0.23, 0.23, 0.24, 1)',

  /**
   * Container press out interpolator
   * Control points (0.25, 0.08, 0.4, 1)
   * Smooth release animation
   */
  CONTAINER_PRESS_OUT: 'cubic-bezier(0.25, 0.08, 0.4, 1)',

  /**
   * Chip icon/avatar transition interpolator
   * Control points (0, 0.45, 0.46, 0.94)
   */
  ICON_AVATAR: 'cubic-bezier(0, 0.45, 0.46, 0.94)',

  /**
   * Container rubberband stage-one interpolator (discrete rubberband)
   * Control points (0.33, 1, 0.68, 1)
   */
  CONTAINER_RUBBERBAND_STAGE_ONE: 'cubic-bezier(0.33, 1, 0.68, 1)',

  /**
   * Container rubberband stage-two interpolator (discrete rubberband)
   * Control points (0.11, 0, 0.5, 0)
   */
  CONTAINER_RUBBERBAND_STAGE_TWO: 'cubic-bezier(0.11, 0, 0.5, 0)',

  /**
   * Text opacity interpolator
   * Standard ease for subtle transitions
   */
  TEXT_OPACITY: 'cubic-bezier(0.4, 0, 0.2, 1)',

  /**
   * Linear interpolator
   */
  LINEAR: 'linear',
} as const;

const CubicBezierControlPoints = {
  CONTAINER_SCALE: [0.68, 0, 0.29, 1],
  CONTAINER_PRESS_IN: [0.23, 0.23, 0.24, 1],
  CONTAINER_PRESS_OUT: [0.25, 0.08, 0.4, 1],
  ICON_AVATAR: [0, 0.45, 0.46, 0.94],
} as const;

export function cubicBezierY(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const sampleCurveX = (t: number): number => {
    const invT = 1 - t;
    return 3 * invT * invT * t * x1 + 3 * invT * t * t * x2 + t * t * t;
  };
  const sampleCurveY = (t: number): number => {
    const invT = 1 - t;
    return 3 * invT * invT * t * y1 + 3 * invT * t * t * y2 + t * t * t;
  };
  const sampleCurveDerivativeX = (t: number): number => {
    const invT = 1 - t;
    return 3 * invT * invT * x1 + 6 * invT * t * (x2 - x1) + 3 * t * t * (1 - x2);
  };

  let t = x;
  for (let i = 0; i < 6; i += 1) {
    const currentX = sampleCurveX(t) - x;
    const derivative = sampleCurveDerivativeX(t);
    if (Math.abs(currentX) < 0.0001 || Math.abs(derivative) < 0.0001) {
      break;
    }
    t -= currentX / derivative;
  }

  if (t < 0 || t > 1) {
    let low = 0;
    let high = 1;
    t = x;
    for (let i = 0; i < 10; i += 1) {
      const currentX = sampleCurveX(t);
      if (Math.abs(currentX - x) < 0.0001) {
        break;
      }
      if (currentX < x) {
        low = t;
      } else {
        high = t;
      }
      t = (low + high) / 2;
    }
  }

  return sampleCurveY(t);
}

export function getEasedProgressForStateChange(
  from: State,
  to: State,
  progress: number,
): number {
  const points =
    to === State.PRESSED
      ? CubicBezierControlPoints.CONTAINER_PRESS_IN
      : from === State.PRESSED
        ? CubicBezierControlPoints.CONTAINER_PRESS_OUT
        : CubicBezierControlPoints.CONTAINER_SCALE;

  return cubicBezierY(points[0], points[1], points[2], points[3], progress);
}

export const SpringConfigs = {
  /**
   * Determinate progress spring.
   * Spring: stiffness 150, damping 18, mass 1.
   */
  PROGRESS_VALUE: {
    stiffness: 150,
    damping: 18,
    mass: 1,
  } as SpringConfig,

  /**
   * Container scale spring for press
   * Spring: stiffness 350, damping 25, mass 1.
   */
  CONTAINER_SCALE_PRESS: {
    stiffness: 350,
    damping: 25,
    mass: 1,
  } as SpringConfig,

  /**
   * Container scale spring for release
   * Spring: stiffness 300, damping 19, mass 1.
   */
  CONTAINER_SCALE_RELEASE: {
    stiffness: 300,
    damping: 19,
    mass: 1,
  } as SpringConfig,

  /**
   * Partial focus handoff spring.
   * Spring: stiffness 120, damping 18, mass 1.
   */
  PARTIAL_FOCUS_HANDOFF: {
    stiffness: 120,
    damping: 18,
    mass: 1,
  } as SpringConfig,

  /**
   * Chip loading swap spring.
   * Spring: stiffness 150, damping 19, mass 1.
   */
  CHIP_LOADING_SWAP: {
    stiffness: 150,
    damping: 19,
    mass: 1,
  } as SpringConfig,

  /**
   * ControlTile icon swap spring.
   * Spring: stiffness 150, damping 15, mass 1.
   */
  CONTROL_TILE_ICON_SWAP: {
    stiffness: 150,
    damping: 15,
    mass: 1,
  } as SpringConfig,

  /** Named foundation spring presets. */
  SOFT: {
    stiffness: 120,
    damping: 14,
    mass: 1,
    equilibriumMode: EquilibriumMode.FASTER,
  } as SpringConfig,
  STANDARD: {
    stiffness: 180,
    damping: 12,
    mass: 1,
    equilibriumMode: EquilibriumMode.FASTER,
  } as SpringConfig,
  BOUNCY: {
    stiffness: 160,
    damping: 8,
    mass: 1,
    equilibriumMode: EquilibriumMode.FASTER,
  } as SpringConfig,
  SNAPPY: {
    stiffness: 240,
    damping: 10,
    mass: 1,
    equilibriumMode: EquilibriumMode.FASTER,
  } as SpringConfig,
} as const;

export function createLinearTimingFunction(
  samples: Array<{ progress: number; value: number }>,
): string {
  return `linear(${samples
    .map(({ progress, value }) => (
      `${Number(value.toFixed(4))} ${Number((progress * 100).toFixed(2))}%`
    ))
    .join(', ')})`;
}

export interface SpringTimingSample {
  progress: number;
  timeMs: number;
  value: number;
}

export interface SpringTimingResult {
  midpointMs: number;
  settleMs: number;
  samples: SpringTimingSample[];
}

export const DEFAULT_MOTION_FRAME_TIME_MS = 1000 / 30;

/**
 * Resolve the velocity/position equilibrium thresholds for a spring given its
 * {@link EquilibriumMode} and the start/end values of the motion. Shared by
 * `getSpringTiming` and {@link SpringIntegrator.isAtEquilibrium} so both settle
 * springs at identical points.
 */
export function resolveEquilibriumThresholds(
  mode: EquilibriumMode,
  startValue: number,
  endValue: number,
): { velocityThreshold: number; positionThreshold: number } {
  switch (mode) {
    case EquilibriumMode.SLOW:
      return {
        velocityThreshold: 0.0001 * (1 + Math.abs(endValue - startValue)),
        positionThreshold:
          0.001 * Math.max(Math.abs(startValue), Math.abs(endValue), 1),
      };
    case EquilibriumMode.FAST:
      return { velocityThreshold: 0.01, positionThreshold: 0.02 };
    case EquilibriumMode.FASTER:
      return { velocityThreshold: 0.05, positionThreshold: 0.02 };
    case EquilibriumMode.DEFAULT:
    default:
      return {
        velocityThreshold: 0.001 * (1 + Math.abs(endValue - startValue)),
        positionThreshold:
          0.01 * Math.max(Math.abs(startValue), Math.abs(endValue), 1),
      };
  }
}

export function getSpringTiming(
  config: SpringConfig,
  target: number = 1,
  frameTimeMs: number = 1000 / 60,
): SpringTimingResult {
  let current = 0;
  let velocity = 0;
  let midpointMs = 0;
  let settleMs = 0;
  const samples: SpringTimingSample[] = [
    {
      progress: 0,
      timeMs: 0,
      value: current,
    },
  ];
  const { velocityThreshold, positionThreshold } = resolveEquilibriumThresholds(
    config.equilibriumMode ?? EquilibriumMode.DEFAULT,
    0,
    target,
  );
  const deltaTime = frameTimeMs / 1000;
  const maxFrames = 240;

  for (let frame = 1; frame <= maxFrames; frame += 1) {
    const displacement = target - current;
    const springForce = displacement * config.stiffness;
    const dampingForce = -velocity * config.damping;
    const acceleration = (springForce + dampingForce) / config.mass;
    velocity += acceleration * deltaTime;
    current += velocity * deltaTime;
    const timeMs = frame * frameTimeMs;
    samples.push({
      progress: 0,
      timeMs,
      value: current,
    });

    if (midpointMs === 0 && current >= target / 2) {
      midpointMs = timeMs;
    }

    if (
      Math.abs(velocity) < velocityThreshold &&
      Math.abs(current - target) <= positionThreshold
    ) {
      settleMs = timeMs;
      break;
    }
  }

  if (midpointMs === 0) {
    midpointMs = samples[Math.floor(samples.length / 2)]?.timeMs ?? frameTimeMs;
  }
  if (settleMs === 0) {
    settleMs = samples[samples.length - 1]?.timeMs ?? midpointMs;
  }

  for (const sample of samples) {
    sample.progress = settleMs > 0
      ? Math.min(sample.timeMs / settleMs, 1)
      : 1;
  }

  return {
    midpointMs,
    samples,
    settleMs,
  };
}

/**
 * Spring config for the content-scale animation of a press state change, or
 * null when the transition does not involve the pressed state. A press-in /
 * press-out uses a spring; every other transition uses the interpolated
 * (cubic-bezier) path.
 */
export function getContainerSpringForStateChange(
  from: State,
  to: State,
): SpringConfig | null {
  if (to === State.PRESSED) {
    return SpringConfigs.CONTAINER_SCALE_PRESS;
  }
  if (from === State.PRESSED) {
    return SpringConfigs.CONTAINER_SCALE_RELEASE;
  }
  return null;
}

/**
 * Convert a spring config into a duration + easing pair for the JS rAF
 * transition driver. The spring is simulated to its natural settle time (so the
 * animation runs for as long as the spring takes rather than a fixed duration),
 * and the easing samples the normalized spring position — which overshoots past
 * 1 before settling, so the driven value overshoots the target and springs back.
 */
export function getSpringEasing(
  config: SpringConfig,
  frameTimeMs: number = DEFAULT_MOTION_FRAME_TIME_MS,
): { durationMs: number; easing: (linearProgress: number) => number } {
  const { settleMs, samples } = getSpringTiming(config, 1, frameTimeMs);
  return {
    durationMs: settleMs,
    easing: (linearProgress: number): number => {
      if (linearProgress <= 0) {
        return samples[0]?.value ?? 0;
      }
      if (linearProgress >= 1) {
        return 1;
      }
      for (let i = 1; i < samples.length; i += 1) {
        const prev = samples[i - 1];
        const next = samples[i];
        if (linearProgress <= next.progress) {
          const span = next.progress - prev.progress;
          const t = span > 0 ? (linearProgress - prev.progress) / span : 0;
          return prev.value + (next.value - prev.value) * t;
        }
      }
      return samples[samples.length - 1]?.value ?? 1;
    },
  };
}

/**
 * Animation transition helper
 * Creates CSS transition string from duration and interpolator
 * Supports single property or array of properties
 */
export function createTransition(
  properties: string | string[],
  duration: number,
  interpolator: string = Interpolators.CONTAINER_SCALE,
  delay: number = 0
): string {
  const props = Array.isArray(properties) ? properties : [properties];
  return props
    .map(prop => `${prop} ${duration}ms ${interpolator}${delay > 0 ? ` ${delay}ms` : ''}`)
    .join(', ');
}

/**
 * Multiple property transitions
 */
export function createTransitions(
  transitions: TransitionDescriptor[]
): string {
  return transitions
    .map((t) =>
      createTransition(
        t.property,
        t.duration,
        t.interpolator ?? Interpolators.CONTAINER_SCALE,
        t.delay ?? 0
      )
    )
    .join(', ');
}

/**
 * Collapse an animation duration to 0 when the user prefers reduced motion.
 *
 * Pure helper for JS-driven animations: pass the result through to your
 * timing/duration logic so animations snap to their target instead of
 * tweening. Pair with `usePrefersReducedMotion()` to source the flag.
 *
 * @param durationMs - The intended animation duration in milliseconds.
 * @param prefersReduced - Whether the user prefers reduced motion.
 * @returns `0` when reduced motion is preferred, otherwise `durationMs`.
 */
export function reducedMotionDuration(
  durationMs: number,
  prefersReduced: boolean,
): number {
  return prefersReduced ? 0 : durationMs;
}

/**
 * Simple spring integrator for custom animations
 * Based on physics: F = -kx - cv
 */
export class SpringIntegrator {
  private position: number = 0;
  private velocity: number = 0;
  private target: number = 0;
  private config: SpringConfig;

  constructor(config: SpringConfig) {
    this.config = config;
  }

  setTarget(target: number, currentPosition: number = this.position): void {
    this.target = target;
    this.position = currentPosition;
    this.velocity = 0;
  }

  step(deltaTime: number): number {
    const { stiffness, damping, mass } = this.config;

    // Spring force: F = -k * displacement
    const displacement = this.position - this.target;
    const springForce = -stiffness * displacement;

    // Damping force: F = -c * velocity
    const dampingForce = -damping * this.velocity;

    // Total force and acceleration
    const acceleration = (springForce + dampingForce) / mass;

    // Update velocity and position
    this.velocity += acceleration * deltaTime;
    this.position += this.velocity * deltaTime;

    return this.position;
  }

  isAtRest(threshold: number = 0.001): boolean {
    const displacement = Math.abs(this.position - this.target);
    const velocity = Math.abs(this.velocity);
    return displacement < threshold && velocity < threshold;
  }

  isAtEquilibrium(startValue: number, endValue: number = this.target): boolean {
    const { velocityThreshold, positionThreshold } = resolveEquilibriumThresholds(
      this.config.equilibriumMode ?? EquilibriumMode.DEFAULT,
      startValue,
      endValue,
    );
    return (
      Math.abs(this.velocity) < velocityThreshold &&
      Math.abs(this.position - endValue) <= positionThreshold
    );
  }
}

/**
 * Calculate interpolated value at current time
 */
export function interpolateValue(
  animState: AnimationState,
  currentTime: number
): number {
  const elapsed = currentTime - animState.startTime;
  const progress = Math.min(elapsed / animState.duration, 1);

  // For now, use linear interpolation
  // In production, you'd evaluate the cubic-bezier at progress
  const interpolatedProgress = progress;

  return (
    animState.fromValue +
    (animState.toValue - animState.fromValue) * interpolatedProgress
  );
}

/**
 * Get animation duration for a state change
 *
 * @param transition - The state transition info
 * @returns Duration in milliseconds
 */
export function getAnimationDurationForStateChange(
  transition: StateTransition
): number {
  const { from, to, isFastScrolling } = transition;

  // Press in - quick response
  if (to === State.PRESSED) {
    return AnimationDurations.CONTAINER_PRESS_IN;
  }

  // Press out - slightly slower
  if (from === State.PRESSED) {
    return AnimationDurations.CONTAINER_PRESS_OUT;
  }

  // Fast scrolling uses reduced duration
  if (isFastScrolling) {
    return AnimationDurations.CONTAINER_STATE_CHANGE_FAST_FOCUS;
  }

  // Default state change
  return AnimationDurations.CONTAINER_STATE_CHANGE;
}

/**
 * Get animation interpolator for a state change
 *
 * @param transition - The state transition info
 * @returns CSS timing function string
 */
export function getAnimationInterpolatorForStateChange(
  transition: StateTransition
): string {
  const { from, to } = transition;

  // Press in - quick, responsive
  if (to === State.PRESSED) {
    return Interpolators.CONTAINER_PRESS_IN;
  }

  // Press out - smooth release
  if (from === State.PRESSED) {
    return Interpolators.CONTAINER_PRESS_OUT;
  }

  // Default state change
  return Interpolators.CONTAINER_SCALE;
}

/**
 * Get complete animation config for a state transition
 * Convenience function that returns both duration and interpolator
 */
export function getAnimationConfigForStateChange(
  transition: StateTransition
): StateChangeAnimationConfig {
  return {
    duration: getAnimationDurationForStateChange(transition),
    interpolator: getAnimationInterpolatorForStateChange(transition),
  };
}
