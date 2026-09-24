/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { HTMLAttributes } from 'react';

export function clampIndicatorValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns the rounded percentage announced by the indicator components.
 * Returns 100 when minimumValue equals maximumValue.
 */
export function getIndicatorPercentage(value: number, min: number, max: number): number {
  if (min === max) {
    return 100;
  }
  return Math.round(((value - min) / (max - min)) * 100);
}

export function getIndicatorAriaLabel(
  accessibilityPercent: number,
  ariaLabel?: string,
  defaultLabel?: string,
): string {
  const label = ariaLabel?.trim() || defaultLabel?.trim();
  return label
    ? `${accessibilityPercent}%, ${label}`
    : `${accessibilityPercent}%`;
}

export function splitIndicatorAriaAttributes(
  props: HTMLAttributes<HTMLDivElement>,
): {
  rootProps: HTMLAttributes<HTMLDivElement>;
  progressbarAriaProps: HTMLAttributes<HTMLDivElement>;
} {
  const rootProps: HTMLAttributes<HTMLDivElement> = {};
  const progressbarAriaProps: HTMLAttributes<HTMLDivElement> = {};

  Object.entries(props).forEach(([key, value]) => {
    const target = key.startsWith('aria-')
      ? progressbarAriaProps
      : rootProps;
    (target as Record<string, unknown>)[key] = value;
  });

  return { rootProps, progressbarAriaProps };
}
