/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  DEFAULT_MOTION_FRAME_TIME_MS,
  resolveEquilibriumThresholds,
} from './Animations';
import { EquilibriumMode, type SpringConfig } from './Animations.types';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const DEFAULT_FRAME_RATE = 30;
const visibilitySubscribers = new Set<() => void>();

function getDocumentVisibilitySnapshot(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden';
}

function notifyVisibilitySubscribers(): void {
  visibilitySubscribers.forEach(notify => notify());
}

function subscribeToDocumentVisibility(notify: () => void): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const visibilityDocument = document;
  visibilitySubscribers.add(notify);
  if (visibilitySubscribers.size === 1) {
    visibilityDocument.addEventListener(
      'visibilitychange',
      notifyVisibilitySubscribers,
    );
  }

  return () => {
    visibilitySubscribers.delete(notify);
    if (visibilitySubscribers.size === 0) {
      visibilityDocument.removeEventListener(
        'visibilitychange',
        notifyVisibilitySubscribers,
      );
    }
  };
}

export interface SpringAnimationController {
  /** Returns the most recently emitted spring value. */
  getValue: () => number;
  /** Returns whether the spring is actively scheduled. */
  isAnimating: () => boolean;
  /** Retargets the spring while preserving its current velocity. */
  setTarget: (targetValue: number) => void;
  /** Holds the current value until the next `setTarget` call and clears velocity. */
  stop: () => void;
}

export interface UseSpringAnimationOptions {
  config: SpringConfig;
  /** Maximum number of value updates per second. @default 30 */
  frameRate?: number;
  /** Initial value, read only when the controller is created. */
  initialValue: number;
  /**
   * Receives the initial value and subsequent animation frames.
   *
   * This is an imperative hot-path callback. Update DOM/CSS or another
   * imperative sink directly; calling a React state setter here reintroduces a
   * component render on every animation frame.
   */
  onChange: (value: number) => void;
  /** Called after the spring reaches or snaps to its target. */
  onRest?: (value: number) => void;
}

interface SpringRuntimeConfig {
  damping: number;
  equilibriumMode: EquilibriumMode;
  frameIntervalMs: number;
  mass: number;
  prefersReducedMotion: boolean;
  stiffness: number;
}

function getNow(): number {
  return typeof performance !== 'undefined' &&
    typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function resolveFrameIntervalMs(frameRate: number | undefined): number {
  if (frameRate == null) {
    return DEFAULT_MOTION_FRAME_TIME_MS;
  }
  if (!Number.isFinite(frameRate) || frameRate <= 0) {
    throw new Error('useSpringAnimation frameRate must be a positive number.');
  }
  return 1000 / frameRate;
}

function validateSpringConfig(config: SpringConfig): void {
  if (!Number.isFinite(config.mass) || config.mass <= 0) {
    throw new Error('useSpringAnimation mass must be a positive number.');
  }
  if (!Number.isFinite(config.stiffness) || config.stiffness <= 0) {
    throw new Error('useSpringAnimation stiffness must be a positive number.');
  }
  if (!Number.isFinite(config.damping) || config.damping < 0) {
    throw new Error('useSpringAnimation damping must be a nonnegative number.');
  }
}

function validateSpringValue(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`useSpringAnimation ${name} must be a finite number.`);
  }
}

class SpringAnimationControllerImpl implements SpringAnimationController {
  private accumulatedFrameTimeMs = 0;
  private animationFrame: number | null = null;
  private config: SpringRuntimeConfig;
  private isMounted = false;
  private isStopped = false;
  private isVisible = true;
  private lastFrameTime: number | null = null;
  private position: number;
  private startPosition: number;
  private target: number;
  private velocity = 0;

  constructor(
    initialValue: number,
    config: SpringRuntimeConfig,
    private readonly emitChange: (value: number) => void,
    private readonly emitRest: (value: number) => void,
  ) {
    this.config = config;
    this.position = initialValue;
    this.startPosition = initialValue;
    this.target = initialValue;
  }

  getValue = (): number => this.position;

  isAnimating = (): boolean => this.animationFrame != null;

  setTarget = (targetValue: number): void => {
    validateSpringValue(targetValue, 'targetValue');
    this.isStopped = false;
    if (targetValue !== this.target) {
      this.target = targetValue;
      this.startPosition = this.position;
    }

    if (this.config.prefersReducedMotion) {
      this.snapToTarget();
      return;
    }
    this.scheduleIfNeeded();
  };

  stop = (): void => {
    this.cancelScheduledFrame();
    this.isStopped = true;
    this.startPosition = this.position;
    this.velocity = 0;
  };

  configure(config: SpringRuntimeConfig): void {
    const shouldSnap =
      config.prefersReducedMotion && !this.config.prefersReducedMotion;
    this.config = config;

    if (this.isStopped) {
      return;
    }
    if (shouldSnap) {
      this.snapToTarget();
      return;
    }
    this.scheduleIfNeeded();
  }

  emitCurrentValue(): void {
    this.emitChange(this.position);
  }

  mount(): void {
    this.isMounted = true;
    this.scheduleIfNeeded();
  }

  unmount(): void {
    this.isMounted = false;
    this.cancelScheduledFrame();
  }

  setVisible(isVisible: boolean): void {
    if (this.isVisible === isVisible) {
      this.scheduleIfNeeded();
      return;
    }

    this.isVisible = isVisible;
    if (isVisible) {
      this.scheduleIfNeeded();
    } else {
      this.cancelScheduledFrame();
    }
  }

  private readonly tick = (now: number): void => {
    this.animationFrame = null;
    if (
      !this.isMounted ||
      this.isStopped ||
      !this.isVisible ||
      this.config.prefersReducedMotion ||
      this.isAtEquilibrium()
    ) {
      return;
    }

    const previousFrameTime = this.lastFrameTime ?? now;
    this.lastFrameTime = now;
    this.accumulatedFrameTimeMs += Math.max(0, now - previousFrameTime);

    if (this.accumulatedFrameTimeMs < this.config.frameIntervalMs) {
      this.scheduleIfNeeded();
      return;
    }

    // Cap each update to one display frame and discard older elapsed time so
    // a delayed animation frame does not overshoot.
    const deltaSeconds = Math.min(
      this.accumulatedFrameTimeMs,
      this.config.frameIntervalMs,
    ) / 1000;
    this.accumulatedFrameTimeMs %= this.config.frameIntervalMs;

    const displacement = this.target - this.position;
    const springForce = displacement * this.config.stiffness;
    const dampingForce = -this.velocity * this.config.damping;
    const acceleration =
      (springForce + dampingForce) / this.config.mass;
    this.velocity += acceleration * deltaSeconds;
    this.position += this.velocity * deltaSeconds;
    this.emitChange(this.position);

    if (this.isAtEquilibrium()) {
      this.snapToTarget(true);
    } else {
      this.scheduleIfNeeded();
    }
  };

  private isAtEquilibrium(): boolean {
    const { positionThreshold, velocityThreshold } =
      resolveEquilibriumThresholds(
        this.config.equilibriumMode,
        this.startPosition,
        this.target,
      );
    return (
      Math.abs(this.velocity) < velocityThreshold &&
      Math.abs(this.position - this.target) <= positionThreshold
    );
  }

  private scheduleIfNeeded(): void {
    if (
      this.animationFrame != null ||
      !this.isMounted ||
      this.isStopped ||
      !this.isVisible ||
      this.config.prefersReducedMotion ||
      this.isAtEquilibrium()
    ) {
      return;
    }

    if (
      typeof window === 'undefined' ||
      typeof window.requestAnimationFrame !== 'function'
    ) {
      this.snapToTarget(true);
      return;
    }

    if (this.lastFrameTime == null) {
      this.lastFrameTime = getNow();
    }
    this.animationFrame = window.requestAnimationFrame(this.tick);
  }

  private cancelScheduledFrame(): void {
    if (this.animationFrame != null) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.accumulatedFrameTimeMs = 0;
    this.lastFrameTime = null;
  }

  private snapToTarget(notifyRest: boolean = !this.isAtEquilibrium()): void {
    this.cancelScheduledFrame();
    this.position = this.target;
    this.startPosition = this.target;
    this.velocity = 0;
    this.emitChange(this.target);
    if (notifyRest) {
      this.emitRest(this.target);
    }
  }
}

/**
 * Creates a stable imperative spring controller without subscribing the calling
 * component to per-frame React updates.
 *
 * The controller remains stable for the component lifetime. Call `setTarget`
 * from an event or effect; config and callbacks update without replacing the
 * controller or restarting an active spring. Animation pauses while the
 * document is hidden and snaps immediately when reduced motion is requested.
 */
export function useSpringAnimation({
  config,
  frameRate = DEFAULT_FRAME_RATE,
  initialValue,
  onChange,
  onRest,
}: UseSpringAnimationOptions): SpringAnimationController {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isDocumentVisible = useSyncExternalStore(
    subscribeToDocumentVisibility,
    getDocumentVisibilitySnapshot,
    () => true,
  );
  const callbacksRef = useRef({ onChange, onRest });
  const [controller] = useState(() => {
    validateSpringConfig(config);
    validateSpringValue(initialValue, 'initialValue');
    return new SpringAnimationControllerImpl(
      initialValue,
      {
        damping: config.damping,
        equilibriumMode: config.equilibriumMode ?? EquilibriumMode.DEFAULT,
        frameIntervalMs: resolveFrameIntervalMs(frameRate),
        mass: config.mass,
        prefersReducedMotion,
        stiffness: config.stiffness,
      },
      value => callbacksRef.current.onChange(value),
      value => callbacksRef.current.onRest?.(value),
    );
  });

  useLayoutEffect(() => {
    callbacksRef.current = { onChange, onRest };
  });

  useLayoutEffect(() => {
    validateSpringConfig(config);
    controller.configure({
      damping: config.damping,
      equilibriumMode: config.equilibriumMode ?? EquilibriumMode.DEFAULT,
      frameIntervalMs: resolveFrameIntervalMs(frameRate),
      mass: config.mass,
      prefersReducedMotion,
      stiffness: config.stiffness,
    });
  }, [
    config.damping,
    config.equilibriumMode,
    config.mass,
    config.stiffness,
    controller,
    frameRate,
    prefersReducedMotion,
  ]);

  useLayoutEffect(() => {
    controller.emitCurrentValue();
  }, [controller]);

  useLayoutEffect(() => {
    controller.setVisible(isDocumentVisible);
  }, [controller, isDocumentVisible]);

  useEffect(() => {
    controller.mount();
    return () => {
      controller.unmount();
    };
  }, [controller]);

  return controller;
}
