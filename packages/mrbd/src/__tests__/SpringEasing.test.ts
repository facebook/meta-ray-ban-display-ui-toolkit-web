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
  SpringConfigs,
  getContainerSpringForStateChange,
  getSpringEasing,
} from '@wearables-ui-toolkit/foundation/motion/Animations';

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
