/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  BUTTON_DIVIDER_HEIGHT,
  BUTTON_DIVIDER_MARGIN_HORIZONTAL,
  BUTTON_DIVIDER_WIDTH,
} from './ButtonDividerMetrics';

export function getButtonDividerClassName(
  baseClassName: string,
  className: string,
): string {
  return [baseClassName, className].filter(Boolean).join(' ');
}

export function getButtonDividerContainerStyle(
  style: CSSProperties,
): CSSProperties {
  return {
    ...style,
  };
}

export function getButtonDividerPillStyle(): CSSProperties {
  return {
    width: BUTTON_DIVIDER_WIDTH,
    height: BUTTON_DIVIDER_HEIGHT,
    marginLeft: BUTTON_DIVIDER_MARGIN_HORIZONTAL,
    marginRight: BUTTON_DIVIDER_MARGIN_HORIZONTAL,
  };
}

export function getButtonDividerGroupItemHeight(): number {
  return BUTTON_DIVIDER_HEIGHT;
}
