/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { getScrimStyle } from './ScrimStyles';
import { ScrimPosition } from '../Scrim.types';

export function getScrimMergedStyle({
  position,
  style,
}: {
  position: ScrimPosition;
  style: CSSProperties;
}): CSSProperties {
  return {
    ...getScrimStyle(position),
    ...style,
  };
}
