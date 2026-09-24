/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { DividerOrientation } from '../Divider.types';
import {
  DIVIDER_CORNER_RADIUS,
  DIVIDER_THICKNESS,
} from './DividerMetrics';

export function getDividerStyle(
  orientation: DividerOrientation,
): CSSProperties {
  const isHorizontal = orientation === DividerOrientation.HORIZONTAL;

  return {
    width: isHorizontal ? '100%' : DIVIDER_THICKNESS,
    height: isHorizontal ? DIVIDER_THICKNESS : '100%',
    borderRadius: DIVIDER_CORNER_RADIUS,
  };
}

export function getDividerMergedStyle({
  orientation,
  style,
}: {
  orientation: DividerOrientation;
  style: CSSProperties;
}): CSSProperties {
  return {
    ...getDividerStyle(orientation),
    ...style,
  };
}

export function getDividerClassName(
  baseClassName: string,
  className: string,
): string {
  return [baseClassName, className].filter(Boolean).join(' ');
}
