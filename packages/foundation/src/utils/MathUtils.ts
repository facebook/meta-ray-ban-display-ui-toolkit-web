/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Pure numeric helpers.
 */

export function approximatelyEqual(
  value: number,
  other: number,
  epsilon: number = 1e-5,
): boolean {
  return Math.abs(value - other) <= epsilon;
}

export function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

export function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

export function oppositeRad(radians: number): number {
  return Math.PI / 2 - radians;
}

export function safeDivide(
  value: number,
  divisor: number,
  fallback: number = 0,
): number {
  return divisor === 0 ? fallback : value / divisor;
}
