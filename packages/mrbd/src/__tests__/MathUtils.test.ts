/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import {
  approximatelyEqual,
  oppositeRad,
  safeDivide,
  toDegrees,
  toRadians,
} from '@wearables-ui-toolkit/foundation/utils/MathUtils';

describe('MathUtils', () => {
  it('compares numbers with epsilon tolerance', () => {
    expect(approximatelyEqual(1, 1 + 0.5e-5)).toBe(true);
    expect(approximatelyEqual(1, 1 + 2e-5)).toBe(false);
    expect(approximatelyEqual(10, 10.2, 0.25)).toBe(true);
  });

  it('converts between radians and degrees', () => {
    expect(toDegrees(Math.PI)).toBeCloseTo(180);
    expect(toDegrees(Math.PI / 2)).toBeCloseTo(90);
    expect(toRadians(180)).toBeCloseTo(Math.PI);
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2);
  });

  it('returns the opposite angle in a right triangle', () => {
    expect(oppositeRad(0)).toBeCloseTo(Math.PI / 2);
    expect(oppositeRad(Math.PI / 6)).toBeCloseTo(Math.PI / 3);
  });

  it('divides safely with a fallback value', () => {
    expect(safeDivide(10, 2)).toBe(5);
    expect(safeDivide(10, 0)).toBe(0);
    expect(safeDivide(10, 0, -1)).toBe(-1);
  });
});
