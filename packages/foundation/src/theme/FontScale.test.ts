/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {describe, expect, it} from 'vitest';
import {convertSpToDp, getScaledCssTextSize, getScaledTextSizeProperties} from './FontScale';

describe('Text-size conversion', () => {
  it('keeps default, reduced and pre-curve sizes linear', () => {
    expect(convertSpToDp(24, 1)).toBe(24);
    expect(convertSpToDp(24, 0.85)).toBeCloseTo(20.4);
    expect(convertSpToDp(24, 1.1)).toBeCloseTo(26.4);
  });

  it('uses exact scale tables without JavaScript decimal-key truncation', () => {
    expect(convertSpToDp(24, 1.15)).toBeCloseTo(25.2);
    expect(convertSpToDp(24, 1.3)).toBeCloseTo(26.4);
    expect(convertSpToDp(24, 1.5)).toBe(28);
    expect(convertSpToDp(24, 1.8)).toBeCloseTo(32.8);
    expect(convertSpToDp(24, 2)).toBe(36);
  });

  it('uses the intended curve despite subpixel scale-measurement noise', () => {
    expect(convertSpToDp(24, 1.1499997)).toBeCloseTo(25.2);
    expect(convertSpToDp(24, 1.1500003)).toBeCloseTo(25.2);
    expect(convertSpToDp(24, 1.2999997)).toBeCloseTo(26.4);
    expect(convertSpToDp(24, 1.3000003)).toBeCloseTo(26.4);
    expect(convertSpToDp(24, 1.295)).toBeLessThan(26.4);
    expect(convertSpToDp(24, 1.14)).toBeCloseTo(27.36);
  });

  it('interpolates both font scales and sizes for the supported maximum', () => {
    expect(convertSpToDp(24, 1.6)).toBeCloseTo(29.6);
    expect(convertSpToDp(22, 1.6)).toBeCloseTo(28.6);
    expect(getScaledCssTextSize(24, 1.6) * 1.6).toBe(30);
    expect(getScaledCssTextSize(22, 1.6) * 1.6).toBe(29);
  });

  it('preserves interpolation from zero, signed sizes and high-size ratios', () => {
    expect(convertSpToDp(4, 1.5)).toBe(6);
    expect(convertSpToDp(-24, 1.5)).toBe(-28);
    expect(convertSpToDp(0, 1.5)).toBe(0);
    expect(convertSpToDp(120, 1.5)).toBe(120);
    expect(convertSpToDp(24, 2.1)).toBeCloseTo(50.4);
  });

  it('removes compensation at reset and preserves shared size distinctions', () => {
    expect(getScaledTextSizeProperties(1)).toEqual({});
    const values = getScaledTextSizeProperties(1.6);
    expect(values['--uit-scaled-font-size-24']).toBe('18.75px');
    expect(values['--uit-scaled-font-size-22']).toBe('18.125px');
    expect(values['--uit-scaled-font-size-80']).not.toBe(values['--uit-scaled-font-size-24']);
  });

  it('rejects invalid scales instead of emitting unusable CSS', () => {
    for (const scale of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => getScaledCssTextSize(24, scale)).toThrow(RangeError);
    }
    expect(() => convertSpToDp(Number.NaN, 1)).toThrow(RangeError);
  });
});
