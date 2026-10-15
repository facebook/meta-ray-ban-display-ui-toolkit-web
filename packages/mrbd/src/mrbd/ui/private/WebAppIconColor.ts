/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createHexColorTokenScale,
  type HexColorToken,
} from '@wearables-ui-toolkit/foundation/colors/HexColorTokenScale';

interface RgbaColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

const WEB_APP_ICON_TOKENS = new Set<number>([150, 500, 700, 950, 1100]);

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function parseHexColor(color: string): RgbaColor | null {
  const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color.trim());
  if (match == null) {
    return null;
  }
  const value = match[1];
  const expanded = value.length <= 4
    ? value.split('').map(character => `${character}${character}`).join('')
    : value;
  return {
    red: Number.parseInt(expanded.slice(0, 2), 16),
    green: Number.parseInt(expanded.slice(2, 4), 16),
    blue: Number.parseInt(expanded.slice(4, 6), 16),
    alpha: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
  };
}

function toHexByte(value: number): string {
  return Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0').toUpperCase();
}

function toHexColor(color: RgbaColor): string {
  return `#${toHexByte(color.red)}${toHexByte(color.green)}${toHexByte(color.blue)}`;
}

export function isWebAppIconColor(value: string | null | undefined): value is string {
  return value != null && parseHexColor(value) != null;
}

export function createWebAppIconTokenScale(
  baseColor: string,
  tokens: readonly number[],
): string[] {
  if (tokens.some(token => !WEB_APP_ICON_TOKENS.has(token))) {
    return [];
  }
  return createHexColorTokenScale(baseColor, tokens as readonly HexColorToken[]);
}

export function colorAlpha(color: string): number {
  return parseHexColor(color)?.alpha ?? 1;
}

export function opaqueColor(color: string): string {
  const parsed = parseHexColor(color);
  return parsed == null ? color : toHexColor(parsed);
}
