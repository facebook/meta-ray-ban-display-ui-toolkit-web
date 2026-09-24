/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  FULL_SCRIM_GRADIENT,
  SCRIM_DEFAULT_ELEVATION,
} from './ScrimMetrics';
import { ScrimPosition } from '../Scrim.types';

const BASE_SCRIM_STYLE: CSSProperties = {
  position: 'absolute',
  pointerEvents: 'none',
  zIndex: SCRIM_DEFAULT_ELEVATION,
};

export function getScrimStyle(position: ScrimPosition): CSSProperties {
  switch (position) {
    case ScrimPosition.LEFT:
      return {
        ...BASE_SCRIM_STYLE,
        inset: 0,
        background: 'linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))',
      };
    case ScrimPosition.RIGHT:
      return {
        ...BASE_SCRIM_STYLE,
        inset: 0,
        background: 'linear-gradient(to left, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))',
      };
    case ScrimPosition.TOP:
      return {
        ...BASE_SCRIM_STYLE,
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))',
      };
    case ScrimPosition.BOTTOM:
      return {
        ...BASE_SCRIM_STYLE,
        inset: 0,
        background: 'linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))',
      };
    case ScrimPosition.FULL:
      return {
        ...BASE_SCRIM_STYLE,
        inset: 0,
        background: FULL_SCRIM_GRADIENT,
      };
  }
}
