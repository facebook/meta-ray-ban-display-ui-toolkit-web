/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import {
  createHexColorTokenScale,
  isHexColor,
  type HexColorToken,
} from '@wearables-ui-toolkit/mrbd';
import {
  colorAlpha,
  createWebAppIconTokenScale,
  isWebAppIconColor,
  opaqueColor,
} from '../mrbd/ui/private/WebAppIconColor';

const TOKEN_CONTRAST_RATIOS: readonly (readonly [HexColorToken, number])[] = [
  [50, 1.1],
  [100, 1.2],
  [150, 1.3],
  [200, 1.5],
  [250, 1.7],
  [300, 2.0],
  [350, 2.2],
  [400, 2.5],
  [450, 2.8],
  [500, 3.1],
  [550, 3.8],
  [600, 4.7],
  [650, 5.4],
  [700, 6.5],
  [750, 7.6],
  [800, 8.5],
  [850, 9.6],
  [900, 11.2],
  [950, 12.5],
  [1000, 14.7],
  [1050, 16.5],
  [1100, 18.8],
];
const ICON_TOKENS: readonly HexColorToken[] = [150, 500, 700, 950, 1100];
const BLUE_SHADES = ['#8DF0FF', '#2694FE', '#125FA8', '#00326E', '#000B3E'];

function contrastAgainstWhite(color: string): number {
  const channels = [1, 3, 5].map(offset => {
    const value = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return 1.05 / (luminance + 0.05);
}

describe('createHexColorTokenScale', () => {
  it.each(['#2694FE', '#F5394F', '#0B991F', '#808080'])('derives all contrast steps for %s', seed => {
    const colors = createHexColorTokenScale(seed, TOKEN_CONTRAST_RATIOS.map(([token]) => token));
    expect(colors).toHaveLength(TOKEN_CONTRAST_RATIOS.length);
    let previousContrast = 1;
    colors.forEach((color, index) => {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
      const contrast = contrastAgainstWhite(color);
      expect(contrast).toBeGreaterThan(previousContrast);
      expect(Math.abs(contrast - TOKEN_CONTRAST_RATIOS[index][1])).toBeLessThan(0.25);
      previousContrast = contrast;
    });
  });

  it('preserves requested ordering and repeated steps without changing the input', () => {
    const tokens = Object.freeze([1100, 150, 700, 150] as const);
    expect(createHexColorTokenScale('#2694FE', tokens)).toEqual([
      BLUE_SHADES[4], BLUE_SHADES[0], BLUE_SHADES[2], BLUE_SHADES[0],
    ]);
    expect(tokens).toEqual([1100, 150, 700, 150]);
  });

  it('normalizes supported hexadecimal spellings and ignores seed alpha', () => {
    expect(createHexColorTokenScale('  #2694fe  ', ICON_TOKENS)).toEqual(BLUE_SHADES);
    expect(createHexColorTokenScale('#2694FE80', ICON_TOKENS)).toEqual(BLUE_SHADES);
    expect(createHexColorTokenScale('#369', ICON_TOKENS)).toEqual(
      createHexColorTokenScale('#336699', ICON_TOKENS),
    );
    expect(createHexColorTokenScale('#3690', ICON_TOKENS)).toEqual(
      createHexColorTokenScale('#336699FF', ICON_TOKENS),
    );
  });

  it.each(['', 'blue', 'rgb(1, 2, 3)', '#12', '#12345', '#1234567', '#GGG'])('rejects invalid seed %j', seed => {
    expect(createHexColorTokenScale(seed, ICON_TOKENS)).toEqual([]);
  });

  it.each([0, 25, 49, 1101, 500.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects unsupported step %s as a whole request', token => {
    expect(createHexColorTokenScale('#2694FE', [150, token as HexColorToken, 700])).toEqual([]);
  });

  it('returns no shades for an empty request', () => {
    expect(createHexColorTokenScale('#2694FE', [])).toEqual([]);
  });
});

describe('isHexColor', () => {
  it.each(['#369', '#3690', '#336699', '#33669980', '  #aAbBcC  '])('accepts %s', value => {
    expect(isHexColor(value)).toBe(true);
  });

  it.each([null, undefined, 123, {}, '', 'red', '#12345', '#GGG'])('rejects %j', value => {
    expect(isHexColor(value)).toBe(false);
  });
});

describe('WebAppIcon color handling', () => {
  it.each([
    ['#8AB4FF', ['#BDE8FF', '#7193CF', '#425E8F', '#1D335C', '#021030']],
    ['#2694FE', BLUE_SHADES],
    ['#F5394F', ['#FFD9C9', '#F75F67', '#AF2C39', '#6F0011', '#2E0000']],
    ['#0B991F', ['#8BFA8B', '#48A54A', '#166D1C', '#003E00', '#001600']],
    ['#856CFF', ['#EADAFF', '#9181FB', '#5E4EB5', '#36237A', '#150045']],
    ['#000', ['#E2E2E2', '#929292', '#5E5E5E', '#343434', '#121212']],
    ['#fff', ['#E0E0E0', '#929292', '#5E5E5E', '#343434', '#121212']],
  ] as const)('keeps established shade output for %s', (seed, expected) => {
    expect(createWebAppIconTokenScale(seed, ICON_TOKENS)).toEqual(expected);
  });

  it('retains its supported step subset and invalid-input fallback', () => {
    expect(createWebAppIconTokenScale('#2694FE', [1000])).toEqual([]);
    expect(createWebAppIconTokenScale('#2694FE', [150, 250, 700])).toEqual([]);
    expect(createWebAppIconTokenScale('rgb(1, 2, 3)', ICON_TOKENS)).toEqual([]);
    expect(createWebAppIconTokenScale('#2694FE', [])).toEqual([]);
  });

  it('keeps color validation, opacity normalization and alpha unchanged', () => {
    expect(isWebAppIconColor(' #2694fe80 ')).toBe(true);
    expect(isWebAppIconColor('blue')).toBe(false);
    expect(isWebAppIconColor(undefined)).toBe(false);
    expect(colorAlpha('#2694FE80')).toBe(128 / 255);
    expect(colorAlpha('blue')).toBe(1);
    expect(opaqueColor(' #2694fe80 ')).toBe('#2694FE');
    expect(opaqueColor('blue')).toBe('blue');
  });
});
