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
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  DEFAULT_MOTION_FRAME_TIME_MS,
  resolveEquilibriumThresholds,
} from './Animations';
import {
  EquilibriumMode,
  type SecondOrderConfig,
} from './Animations.types';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const DEFAULT_FRAME_RATE = 30;
const useClientLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;
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

export interface SecondOrderAnimationController {
  /** Returns the most recently emitted value. */
  getValue: () => number;
  /** Returns whether the animation is actively scheduled. */
  isAnimating: () => boolean;
  /** Retargets the animation while preserving its current velocity. */
  setTarget: (targetValue: number) => void;
  /** Holds the current value until the next `setTarget` call and clears velocity. */
  stop: () => void;
}

export interface UseSecondOrderAnimationOptions {
  config: SecondOrderConfig;
  /** Finite positive update rate, with stable representable dynamics. @default 30 */
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
  /** Called after the animation reaches or snaps to its target. */
  onRest?: (value: number) => void;
}

interface SecondOrderRuntimeConfig {
  equilibriumMode: EquilibriumMode;
  frameIntervalMs: number;
  k1: number;
  k2: number;
  k3: number;
  prefersReducedMotion: boolean;
}

function getNow(): number | null {
  if (
    typeof performance === 'undefined' ||
    typeof performance.now !== 'function'
  ) {
    return null;
  }
  const now = performance.now();
  return Number.isFinite(now) ? now : null;
}

function resolveFrameIntervalMs(frameRate: number | undefined): number {
  if (frameRate == null) {
    return DEFAULT_MOTION_FRAME_TIME_MS;
  }
  if (!Number.isFinite(frameRate) || frameRate <= 0) {
    throw new Error(
      'useSecondOrderAnimation frameRate must be a positive number.',
    );
  }
  const interval = 1000 / frameRate;
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error(
      'useSecondOrderAnimation frameRate must produce a finite frame interval.',
    );
  }
  return interval;
}

function validateSecondOrderConfig(config: SecondOrderConfig): void {
  if (!Number.isFinite(config.frequency) || config.frequency <= 0) {
    throw new Error(
      'useSecondOrderAnimation frequency must be a positive number.',
    );
  }
  if (!Number.isFinite(config.damping) || config.damping < 0) {
    throw new Error(
      'useSecondOrderAnimation damping must be a nonnegative number.',
    );
  }
  if (config.response != null && !Number.isFinite(config.response)) {
    throw new Error(
      'useSecondOrderAnimation response must be a finite number.',
    );
  }
}

function validateSecondOrderValue(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(
      `useSecondOrderAnimation ${name} must be a finite number.`,
    );
  }
}

function resolveRuntimeConfig(
  config: SecondOrderConfig,
  frameRate: number | undefined,
  prefersReducedMotion: boolean,
): SecondOrderRuntimeConfig {
  validateSecondOrderConfig(config);
  const frameIntervalMs = resolveFrameIntervalMs(frameRate);
  const angularFrequency = 2 * Math.PI * config.frequency;
  const squaredAngularFrequency = angularFrequency * angularFrequency;
  const k1 = config.damping / (Math.PI * config.frequency);
  const k2 = 1 / squaredAngularFrequency;
  const k3 = (config.response ?? 1) * config.damping / angularFrequency;
  const stepSeconds = frameIntervalMs / 1000;
  const squaredStep = stepSeconds * stepSeconds;
  const dampingStep = stepSeconds * k1 / k2;
  const stiffnessStep = squaredStep / k2;

  if (
    ![
      angularFrequency,
      squaredAngularFrequency,
      k1,
      k2,
      k3,
      stepSeconds,
      squaredStep,
      dampingStep,
      stiffnessStep,
    ].every(Number.isFinite) ||
    angularFrequency <= 0 ||
    squaredAngularFrequency <= 0 ||
    k2 <= 0 ||
    stepSeconds <= 0 ||
    squaredStep <= 0 ||
    stiffnessStep <= 0 ||
    (config.damping > 0 && dampingStep <= 0)
  ) {
    throw new Error(
      'useSecondOrderAnimation dynamics must remain finite and representable at this frameRate.',
    );
  }

  // The position-first recurrence is stable only when 2a + b < 4, where
  // a = h*k1/k2 and b = h*h/k2. Zero damping permits neutral oscillation.
  if (2 * dampingStep + stiffnessStep >= 4) {
    throw new Error(
      'useSecondOrderAnimation dynamics require a stable timestep at this frameRate.',
    );
  }

  return {
    equilibriumMode: config.equilibriumMode ?? EquilibriumMode.DEFAULT,
    frameIntervalMs,
    k1,
    k2,
    k3,
    prefersReducedMotion,
  };
}

class SecondOrderAnimationControllerImpl
implements SecondOrderAnimationController {
  private accumulatedFrameTimeMs = 0;
  private accumulatedTargetTimeMs = 0;
  private animationFrame: number | null = null;
  private config: SecondOrderRuntimeConfig;
  private frameEpoch = 0;
  private hasEmittedInitialValue = false;
  private hasMounted = false;
  private hasPreviousTarget = false;
  private isMounted = false;
  private isStopped = false;
  private isVisible = true;
  private lastFrameTime: number | null = null;
  private lifecycleEpoch = 0;
  private position: number;
  private previousTarget: number;
  private startPosition: number;
  private stateGeneration = 0;
  private target: number;
  private velocity = 0;

  constructor(
    initialValue: number,
    config: SecondOrderRuntimeConfig,
    private readonly emitChange: (value: number) => void,
    private readonly emitRest: (value: number) => void,
  ) {
    this.config = config;
    this.position = initialValue;
    this.previousTarget = initialValue;
    this.startPosition = initialValue;
    this.target = initialValue;
  }

  getValue = (): number => this.position;

  isAnimating = (): boolean => this.animationFrame != null;

  setTarget = (targetValue: number): void => {
    if (this.hasMounted && !this.isMounted) {
      return;
    }
    validateSecondOrderValue(targetValue, 'targetValue');
    const targetDelta = this.hasPreviousTarget
      ? targetValue - this.previousTarget
      : 0;
    if (
      !Number.isFinite(targetValue - this.position) ||
      !Number.isFinite(targetDelta) ||
      (this.hasPreviousTarget &&
        !Number.isFinite(targetDelta / this.minimumTargetSampleSeconds()))
    ) {
      throw new Error(
        'useSecondOrderAnimation targetValue must keep frame arithmetic finite.',
      );
    }

    if (targetValue !== this.target || this.isStopped) {
      this.stateGeneration += 1;
    }
    this.isStopped = false;
    if (targetValue !== this.target) {
      this.target = targetValue;
      this.startPosition = this.position;
    }
    this.reconcileMotion();
  };

  stop = (): void => {
    if (this.hasMounted && !this.isMounted) {
      return;
    }
    this.stateGeneration += 1;
    this.endTargetSampling();
    this.isStopped = true;
    this.startPosition = this.position;
    this.previousTarget = this.target;
    this.velocity = 0;
  };

  configure(config: SecondOrderRuntimeConfig): void {
    const resetsTiming =
      config.k1 !== this.config.k1 ||
      config.k2 !== this.config.k2 ||
      config.k3 !== this.config.k3 ||
      config.frameIntervalMs !== this.config.frameIntervalMs ||
      config.equilibriumMode !== this.config.equilibriumMode ||
      config.prefersReducedMotion !== this.config.prefersReducedMotion;
    const minimumSampleSeconds = resetsTiming
      ? config.frameIntervalMs / 1000
      : this.minimumTargetSampleSeconds();
    if (
      this.hasPreviousTarget &&
      !Number.isFinite((this.target - this.previousTarget) / minimumSampleSeconds)
    ) {
      throw new Error(
        'useSecondOrderAnimation config must keep frame arithmetic finite.',
      );
    }
    if (resetsTiming) {
      this.stateGeneration += 1;
      this.cancelScheduledFrame();
    }
    this.config = config;
    this.reconcileMotion();
  }

  mount(): void {
    if (this.isMounted) {
      return;
    }
    this.lifecycleEpoch += 1;
    this.stateGeneration += 1;
    this.isMounted = true;
    this.hasMounted = true;
    try {
      if (!this.hasEmittedInitialValue) {
        this.hasEmittedInitialValue = true;
        this.emitChange(this.position);
      }
      this.reconcileMotion();
    } catch (error) {
      this.unmount();
      throw error;
    }
  }

  unmount(): void {
    this.lifecycleEpoch += 1;
    this.stateGeneration += 1;
    this.isMounted = false;
    this.endTargetSampling();
  }

  setVisible(isVisible: boolean): void {
    if (this.isVisible === isVisible) {
      return;
    }
    this.stateGeneration += 1;
    this.isVisible = isVisible;
    if (isVisible) {
      this.reconcileMotion();
    } else {
      this.cancelScheduledFrame();
    }
  }

  private reconcileMotion(): void {
    if (!this.isMounted || this.isStopped) {
      return;
    }
    if (this.config.prefersReducedMotion || this.isAtEquilibrium()) {
      if (this.position !== this.target || this.velocity !== 0) {
        this.snapToTarget(true);
      } else {
        this.endTargetSampling();
      }
      return;
    }
    this.scheduleIfNeeded();
  }

  private tick(now: number, frameEpoch: number, lifecycleEpoch: number): void {
    if (
      frameEpoch !== this.frameEpoch ||
      lifecycleEpoch !== this.lifecycleEpoch
    ) {
      return;
    }
    this.animationFrame = null;
    if (
      !this.isMounted ||
      this.isStopped ||
      !this.isVisible ||
      this.config.prefersReducedMotion
    ) {
      return;
    }
    if (!Number.isFinite(now)) {
      this.stop();
      return;
    }
    if (this.isAtEquilibrium()) {
      this.snapToTarget(true);
      return;
    }

    const previousFrameTime = this.lastFrameTime ?? now;
    const elapsed = Math.max(0, now - previousFrameTime);
    const accumulatedTime = this.accumulatedFrameTimeMs + elapsed;
    const targetSampleTime = this.accumulatedTargetTimeMs + elapsed;
    if (
      !Number.isFinite(elapsed) ||
      !Number.isFinite(accumulatedTime) ||
      !Number.isFinite(targetSampleTime)
    ) {
      this.stop();
      return;
    }
    if (accumulatedTime < this.config.frameIntervalMs) {
      this.lastFrameTime = now;
      this.accumulatedFrameTimeMs = accumulatedTime;
      this.accumulatedTargetTimeMs = targetSampleTime;
      this.scheduleIfNeeded();
      return;
    }

    // Delayed callbacks advance at most one update and discard older elapsed time.
    const deltaSeconds = Math.min(
      accumulatedTime,
      this.config.frameIntervalMs,
    ) / 1000;
    const remainingTime = accumulatedTime % this.config.frameIntervalMs;
    const targetSampleSeconds = targetSampleTime / 1000;
    const target = this.target;
    const targetVelocity = this.hasPreviousTarget
      ? (target - this.previousTarget) / targetSampleSeconds
      : 0;
    const positionDelta = deltaSeconds * this.velocity;
    const nextPosition = this.position + positionDelta;
    const targetResponse = this.config.k3 * targetVelocity;
    const targetWithResponse = target + targetResponse;
    const dampingForce = this.config.k1 * this.velocity;
    const displacement = targetWithResponse - nextPosition;
    const force = displacement - dampingForce;
    const scaledForce = deltaSeconds * force;
    const velocityDelta = scaledForce / this.config.k2;
    const nextVelocity = this.velocity + velocityDelta;
    if (
      !Number.isFinite(deltaSeconds) ||
      !Number.isFinite(targetSampleSeconds) ||
      targetSampleSeconds <= 0 ||
      !Number.isFinite(remainingTime) ||
      !Number.isFinite(targetVelocity) ||
      !Number.isFinite(positionDelta) ||
      !Number.isFinite(nextPosition) ||
      !Number.isFinite(targetResponse) ||
      !Number.isFinite(targetWithResponse) ||
      !Number.isFinite(dampingForce) ||
      !Number.isFinite(displacement) ||
      !Number.isFinite(force) ||
      !Number.isFinite(scaledForce) ||
      !Number.isFinite(velocityDelta) ||
      !Number.isFinite(nextVelocity)
    ) {
      this.stop();
      return;
    }

    const generation = this.stateGeneration;
    this.lastFrameTime = now;
    this.accumulatedFrameTimeMs = remainingTime;
    this.accumulatedTargetTimeMs = 0;
    this.position = nextPosition;
    this.velocity = nextVelocity;
    this.previousTarget = target;
    this.hasPreviousTarget = true;
    this.emitChange(nextPosition);
    if (
      generation !== this.stateGeneration ||
      lifecycleEpoch !== this.lifecycleEpoch ||
      !this.isMounted ||
      this.isStopped
    ) {
      return;
    }
    if (this.isAtEquilibrium()) {
      this.snapToTarget(true);
    } else {
      this.scheduleIfNeeded();
    }
  }

  private minimumTargetSampleSeconds(): number {
    return (
      this.accumulatedTargetTimeMs + Math.max(
        0,
        this.config.frameIntervalMs - this.accumulatedFrameTimeMs,
      )
    ) / 1000;
  }

  private isAtEquilibrium(): boolean {
    const { positionThreshold, velocityThreshold } =
      this.config.equilibriumMode === EquilibriumMode.FAST
        ? { positionThreshold: 0.005, velocityThreshold: 0.01 }
        : resolveEquilibriumThresholds(
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
    const frameEpoch = ++this.frameEpoch;
    const lifecycleEpoch = this.lifecycleEpoch;
    this.animationFrame = window.requestAnimationFrame(now => {
      this.tick(now, frameEpoch, lifecycleEpoch);
    });
  }

  private endTargetSampling(): void {
    this.hasPreviousTarget = false;
    this.cancelScheduledFrame();
  }

  private cancelScheduledFrame(): void {
    this.frameEpoch += 1;
    const frame = this.animationFrame;
    this.animationFrame = null;
    this.accumulatedFrameTimeMs = 0;
    this.accumulatedTargetTimeMs = 0;
    this.lastFrameTime = null;
    if (
      frame != null &&
      typeof window !== 'undefined' &&
      typeof window.cancelAnimationFrame === 'function'
    ) {
      window.cancelAnimationFrame(frame);
    }
  }

  private snapToTarget(notifyRest: boolean = true): void {
    const reachedTarget = this.target;
    this.endTargetSampling();
    const generation = ++this.stateGeneration;
    const lifecycleEpoch = this.lifecycleEpoch;
    this.position = reachedTarget;
    this.previousTarget = reachedTarget;
    this.startPosition = reachedTarget;
    this.velocity = 0;
    this.emitChange(reachedTarget);
    if (
      notifyRest &&
      this.isMounted &&
      !this.isStopped &&
      generation === this.stateGeneration &&
      lifecycleEpoch === this.lifecycleEpoch &&
      this.target === reachedTarget &&
      this.position === reachedTarget
    ) {
      this.emitRest(reachedTarget);
    }
  }
}

/**
 * Creates a stable imperative second-order controller without subscribing the
 * calling component to per-frame React updates.
 *
 * The controller remains stable for the component lifetime. Call `setTarget`
 * from an event or effect; config and callbacks update without replacing the
 * controller or restarting active motion. Retargeting preserves velocity and
 * estimates target velocity so the response parameter can shape anticipation
 * and overshoot. Animation pauses while the document is hidden and snaps
 * immediately when reduced motion is requested. Retained controllers ignore
 * requests after unmount.
 *
 * Invalid initial options and option-defined updates throw during rendering.
 * A live update also checks its current target sampling before applying the
 * configuration. If that check rejects the update, the controller is disposed
 * before the original error reaches the nearest React error boundary. Reset
 * that boundary with valid options to create a new controller. In contrast,
 * rejected imperative targets leave the accepted motion unchanged.
 */
export function useSecondOrderAnimation({
  config,
  frameRate = DEFAULT_FRAME_RATE,
  initialValue,
  onChange,
  onRest,
}: UseSecondOrderAnimationOptions): SecondOrderAnimationController {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isDocumentVisible = useSyncExternalStore(
    subscribeToDocumentVisibility,
    getDocumentVisibilitySnapshot,
    () => true,
  );
  const callbacksRef = useRef({ onChange, onRest });
  const [controller] = useState(() => {
    validateSecondOrderValue(initialValue, 'initialValue');
    return new SecondOrderAnimationControllerImpl(
      initialValue,
      resolveRuntimeConfig(config, frameRate, prefersReducedMotion),
      value => callbacksRef.current.onChange(value),
      value => callbacksRef.current.onRest?.(value),
    );
  });
  const runtimeConfig = useMemo(
    () => resolveRuntimeConfig(config, frameRate, prefersReducedMotion),
    [
      config.damping,
      config.equilibriumMode,
      config.frequency,
      config.response,
      frameRate,
      prefersReducedMotion,
    ],
  );

  useClientLayoutEffect(() => {
    callbacksRef.current = { onChange, onRest };
  });

  useClientLayoutEffect(() => {
    controller.setVisible(isDocumentVisible);
  }, [controller, isDocumentVisible]);

  useClientLayoutEffect(() => {
    controller.mount();
    return () => {
      controller.unmount();
    };
  }, [controller]);

  useClientLayoutEffect(() => {
    try {
      controller.configure(runtimeConfig);
    } catch (error) {
      controller.unmount();
      throw error;
    }
  }, [controller, runtimeConfig]);

  return controller;
}
