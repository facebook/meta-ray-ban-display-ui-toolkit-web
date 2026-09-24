/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

interface RgbaColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

interface OklchColor {
  lightness: number;
  chroma: number;
  hue: number;
}

const TOKEN_CONTRAST_RATIO = new Map<number, number>([
  [150, 1.3],
  [500, 3.1],
  [700, 6.5],
  [950, 12.5],
  [1100, 18.8],
]);
const COLOR_SCALE_LENGTH = 3000;
const LIGHTNESS_SAMPLE_COUNT = 50;

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

function gammaToLinear(value: number): number {
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToGamma(value: number): number {
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * value ** (1 / 2.4) - 0.055;
}

function rgbToOklch(color: RgbaColor): OklchColor {
  const red = gammaToLinear(color.red / 255);
  const green = gammaToLinear(color.green / 255);
  const blue = gammaToLinear(color.blue / 255);
  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  const oklabL = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const oklabA = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const oklabB = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  const chroma = Math.hypot(oklabA, oklabB);
  const rawHue = chroma === 0 ? 0 : Math.atan2(oklabB, oklabA) * 180 / Math.PI;
  return {
    lightness: oklabL,
    chroma,
    hue: rawHue < 0 ? rawHue + 360 : rawHue,
  };
}

function oklchToRgb(color: OklchColor): RgbaColor {
  const hue = color.hue * Math.PI / 180;
  const oklabA = color.chroma * Math.cos(hue);
  const oklabB = color.chroma * Math.sin(hue);
  const l = color.lightness + 0.3963377774 * oklabA + 0.2158037573 * oklabB;
  const m = color.lightness - 0.1055613458 * oklabA - 0.0638541728 * oklabB;
  const s = color.lightness - 0.0894841775 * oklabA - 1.291485548 * oklabB;
  const lCubed = l ** 3;
  const mCubed = m ** 3;
  const sCubed = s ** 3;
  return {
    red: clamp(linearToGamma(4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed) * 255, 0, 255),
    green: clamp(linearToGamma(-1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed) * 255, 0, 255),
    blue: clamp(linearToGamma(-0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed) * 255, 0, 255),
    alpha: 1,
  };
}

function luminance(color: RgbaColor): number {
  const component = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return component(color.red) * 0.2126 + component(color.green) * 0.7152 + component(color.blue) * 0.0722;
}

function contrast(color: RgbaColor): number {
  return 1.05 / (luminance(color) + 0.05);
}

function interpolateHue(first: number, second: number, progress: number): number {
  const delta = ((second - first + 540) % 360) - 180;
  return (first + delta * progress + 360) % 360;
}

function interpolateScaleColor(colors: readonly RgbaColor[], index: number): RgbaColor {
  const progress = index / (COLOR_SCALE_LENGTH - 1);
  const scaled = progress * (colors.length - 1);
  const colorIndex = clamp(Math.trunc(scaled), 0, colors.length - 2);
  const localProgress = scaled - colorIndex;
  const first = rgbToOklch(colors[colorIndex]);
  const second = rgbToOklch(colors[colorIndex + 1]);
  return oklchToRgb({
    lightness: first.lightness + (second.lightness - first.lightness) * localProgress,
    chroma: first.chroma + (second.chroma - first.chroma) * localProgress,
    hue: interpolateHue(first.hue, second.hue, localProgress),
  });
}

function createContrastScale(baseColor: RgbaColor, targetRatios: readonly number[]): string[] {
  const base = rgbToOklch(baseColor);
  const colorKeys: RgbaColor[] = [];
  for (let index = 0; index < LIGHTNESS_SAMPLE_COUNT; index += 1) {
    const lightness = index / (LIGHTNESS_SAMPLE_COUNT - 1);
    colorKeys.push(oklchToRgb({
      lightness,
      chroma: Math.max(0, base.chroma * (0.5 + lightness * 0.5)),
      hue: base.hue,
    }));
  }
  colorKeys.push(baseColor);
  colorKeys.sort((first, second) => rgbToOklch(second).lightness - rgbToOklch(first).lightness);
  const colors = [
    { red: 255, green: 255, blue: 255, alpha: 1 },
    ...colorKeys,
    { red: 0, green: 0, blue: 0, alpha: 1 },
  ];
  const colorCache = new Map<number, RgbaColor>();
  const contrastCache = new Map<number, number>();
  const colorAt = (index: number) => {
    const clampedIndex = clamp(index, 0, COLOR_SCALE_LENGTH - 1);
    const cached = colorCache.get(clampedIndex);
    if (cached != null) {
      return cached;
    }
    const color = interpolateScaleColor(colors, clampedIndex);
    colorCache.set(clampedIndex, color);
    return color;
  };
  const contrastAt = (index: number) => {
    const cached = contrastCache.get(index);
    if (cached != null) {
      return cached;
    }
    const value = contrast(colorAt(index));
    contrastCache.set(index, value);
    return value;
  };
  return targetRatios.map(targetRatio => {
    let step = Math.trunc(COLOR_SCALE_LENGTH / 2);
    let position = step;
    let current = contrastAt(position);
    let remaining = 100;
    const adjustedTarget = targetRatio + 0.005 * Math.sign(targetRatio);
    while (Math.abs(current - adjustedTarget) > 0.01 && remaining > 0) {
      remaining -= 1;
      step = Math.max(1, Math.trunc(step / 2));
      position = current < adjustedTarget
        ? clamp(position + step, 0, COLOR_SCALE_LENGTH - 1)
        : clamp(position - step, 0, COLOR_SCALE_LENGTH - 1);
      current = contrastAt(position);
    }
    return toHexColor(colorAt(position));
  });
}

export function isWebAppIconColor(value: string | null | undefined): value is string {
  return value != null && parseHexColor(value) != null;
}

export function createWebAppIconTokenScale(
  baseColor: string,
  tokens: readonly number[],
): string[] {
  const parsed = parseHexColor(baseColor);
  if (parsed == null) {
    return [];
  }
  const ratios = tokens.map(token => TOKEN_CONTRAST_RATIO.get(token));
  if (ratios.some(ratio => ratio == null)) {
    return [];
  }
  return createContrastScale(parsed, ratios as number[]);
}

export function colorAlpha(color: string): number {
  return parseHexColor(color)?.alpha ?? 1;
}

export function opaqueColor(color: string): string {
  const parsed = parseHexColor(color);
  return parsed == null ? color : toHexColor(parsed);
}
