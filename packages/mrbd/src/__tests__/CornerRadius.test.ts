/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import {
  CornerRadius,
  getCornerRadiusValue,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

/**
 * The public `CornerRadius` type is a branded named-token type: callers select a
 * semantic token (`CornerRadius.LARGE`) rather than a magic pixel literal. The
 * generated CSS and numeric geometry use the same source definitions.
 */
describe('CornerRadius named-token resolution', () => {
  const cases = [
    [CornerRadius.XXSMALL, '--uit-corner-radius-xxsmall', '8px', 8],
    [CornerRadius.XSMALL, '--uit-corner-radius-xsmall', '16px', 16],
    [CornerRadius.SMALL, '--uit-corner-radius-small', '24px', 24],
    [CornerRadius.MEDIUM, '--uit-corner-radius-medium', '32px', 32],
    [CornerRadius.LARGE, '--uit-corner-radius-large', '48px', 48],
    [CornerRadius.XLARGE, '--uit-corner-radius-xlarge', '56px', 56],
    [CornerRadius.XXLARGE, '--uit-corner-radius-2xlarge', '64px', 64],
    [CornerRadius.XXXLARGE, '--uit-corner-radius-3xlarge', '128px', 128],
    [CornerRadius.FULL, '--uit-corner-radius-full', '9999px', 999],
  ] as const;

  it.each(cases)('maps %s to the CSS value for %s', (radius, _cssVariable, cssValue) => {
    expect(getCornerRadiusValue(radius)).toBe(cssValue);
  });

  it('preserves the public geometry values', () => {
    for (const [radius, , , geometryPixels] of cases) {
      expect(radius).toBe(geometryPixels);
    }
  });

  it('rounded rectangle providers own their radius', () => {
    const provider = new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);

    expect(provider.cornerRadius).toBe(32);
    expect(provider.getCssBorderRadius()).toBe('32px');
  });

  it('different geometry uses a different immutable provider', () => {
    const small = new RoundedRectangleShapeProvider(CornerRadius.SMALL);
    const full = new RoundedRectangleShapeProvider(CornerRadius.FULL);

    expect(small.getCssBorderRadius()).toBe('24px');
    expect(full.getCssBorderRadius()).toBe('9999px');
  });
});
