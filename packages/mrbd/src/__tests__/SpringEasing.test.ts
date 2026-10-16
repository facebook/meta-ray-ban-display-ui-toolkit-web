/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect } from 'vitest';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  EquilibriumMode,
  SpringConfigs,
  SpringIntegrator,
  getSpringTiming,
  getContainerSpringForStateChange,
  getSpringEasing,
  resolveEquilibriumThresholds,
} from '@wearables-ui-toolkit/foundation/motion/Animations';

describe('resolveEquilibriumThresholds', () => {
  it('resolves every equilibrium mode', () => {
    expect(resolveEquilibriumThresholds(EquilibriumMode.DEFAULT, 2, 6)).toEqual({
      velocityThreshold: 0.005,
      positionThreshold: 0.06,
    });
    expect(resolveEquilibriumThresholds(EquilibriumMode.SLOW, 2, 6)).toEqual({
      velocityThreshold: 0.0005,
      positionThreshold: 0.006,
    });
    expect(resolveEquilibriumThresholds(EquilibriumMode.FAST, 2, 6)).toEqual({
      velocityThreshold: 0.01,
      positionThreshold: 0.02,
    });
    expect(resolveEquilibriumThresholds(EquilibriumMode.FASTER, 2, 6)).toEqual({
      velocityThreshold: 0.05,
      positionThreshold: 0.02,
    });
  });
});

describe('spring completion precision', () => {
  it.each([
    {mode: EquilibriumMode.DEFAULT, settled: true},
    {mode: EquilibriumMode.SLOW, settled: false},
    {mode: EquilibriumMode.FAST, settled: true},
    {mode: EquilibriumMode.FASTER, settled: true},
  ])('applies $mode precision to a low-velocity residual', ({mode, settled}) => {
    const spring = new SpringIntegrator({
      stiffness: 10,
      damping: 10,
      mass: 1,
      equilibriumMode: mode,
    });
    spring.setTarget(1, 0.992);
    expect(spring.isAtEquilibrium(0, 1)).toBe(settled);
    spring.setTarget(1, 1);
    expect(spring.isAtEquilibrium(0, 1)).toBe(true);
  });

  it.each([
    {mode: EquilibriumMode.DEFAULT, frames: 60},
    {mode: EquilibriumMode.SLOW, frames: 82},
    {mode: EquilibriumMode.FAST, frames: 45},
    {mode: EquilibriumMode.FASTER, frames: 38},
  ])('settles $mode spring values and timing at the same frame', ({mode, frames}) => {
    const config = {stiffness: 10, damping: 10, mass: 1, equilibriumMode: mode};
    const spring = new SpringIntegrator(config);
    spring.setTarget(1, 0);
    let value = 0;
    for (let frame = 1; frame <= frames; frame++) {
      value = spring.step(0.1);
      expect(value).toBeCloseTo(1 - 0.9 ** frame, 12);
      expect(spring.isAtEquilibrium(0, 1)).toBe(frame === frames);
    }
    const timing = getSpringTiming(config, 1, 100);
    expect(timing.settleMs).toBe(frames * 100);
    expect(timing.midpointMs).toBe(700);
    expect(timing.samples).toHaveLength(frames + 1);
    expect(timing.samples[frames]?.value).toBeCloseTo(value, 12);
    expect(timing.samples[frames]?.progress).toBe(1);
  });
});

describe('getContainerSpringForStateChange', () => {
  it('uses the press spring when entering PRESSED', () => {
    expect(getContainerSpringForStateChange(State.FOCUSED, State.PRESSED)).toBe(
      SpringConfigs.CONTAINER_SCALE_PRESS,
    );
    expect(getContainerSpringForStateChange(State.DEFAULT, State.PRESSED)).toBe(
      SpringConfigs.CONTAINER_SCALE_PRESS,
    );
  });

  it('uses the release spring when leaving PRESSED', () => {
    expect(getContainerSpringForStateChange(State.PRESSED, State.FOCUSED)).toBe(
      SpringConfigs.CONTAINER_SCALE_RELEASE,
    );
    expect(getContainerSpringForStateChange(State.PRESSED, State.DEFAULT)).toBe(
      SpringConfigs.CONTAINER_SCALE_RELEASE,
    );
  });

  it('returns null for non-press transitions (cubic-bezier path)', () => {
    expect(
      getContainerSpringForStateChange(State.DEFAULT, State.FOCUSED),
    ).toBeNull();
    expect(
      getContainerSpringForStateChange(State.FOCUSED, State.DEFAULT),
    ).toBeNull();
  });
});

describe('getSpringEasing', () => {
  it('runs for the spring settle time and starts at 0 / settles at 1', () => {
    const { durationMs, easing } = getSpringEasing(
      SpringConfigs.CONTAINER_SCALE_PRESS,
    );
    expect(durationMs).toBeGreaterThan(0);
    expect(easing(0)).toBe(0);
    expect(easing(1)).toBe(1);
  });

  it('overshoots past the target before settling (underdamped press spring)', () => {
    const { easing } = getSpringEasing(SpringConfigs.CONTAINER_SCALE_PRESS);
    let maxValue = 0;
    for (let i = 0; i <= 100; i += 1) {
      maxValue = Math.max(maxValue, easing(i / 100));
    }
    // The CONTAINER_SCALE_PRESS spring is underdamped, so the normalized value
    // exceeds 1 mid-flight — this is the overshoot that produces the press feel.
    expect(maxValue).toBeGreaterThan(1);
  });

  it('rises from rest before reaching the target (not an instant jump)', () => {
    const { easing } = getSpringEasing(SpringConfigs.CONTAINER_SCALE_RELEASE);
    const early = easing(0.1);
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(1);
  });
});
