/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  ACTION_HINT_HORIZONTAL_PADDING,
  ACTION_HINT_ICON_END_MARGIN,
  ACTION_HINT_ICON_SIZE,
  ACTION_HINT_VERTICAL_PADDING,
} from './ActionHintMetrics';

export function getActionHintClassName(
  baseClassName: string,
  className: string,
): string {
  return `${baseClassName} ${className}`;
}

export function getActionHintContainerStyle(style: CSSProperties): CSSProperties {
  return {
    display: 'inline-flex',
    padding: `${ACTION_HINT_VERTICAL_PADDING}px ${ACTION_HINT_HORIZONTAL_PADDING}px`,
    ...style,
  };
}

export function getActionHintIconStyle(): CSSProperties {
  return {
    width: ACTION_HINT_ICON_SIZE,
    height: ACTION_HINT_ICON_SIZE,
    marginRight: ACTION_HINT_ICON_END_MARGIN,
  };
}
