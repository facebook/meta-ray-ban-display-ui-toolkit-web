/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  HTMLAttributes,
} from 'react';

/** Orientation of the divider. */
export const DividerOrientation = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
} as const;
export type DividerOrientation =
  (typeof DividerOrientation)[keyof typeof DividerOrientation];

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Orientation of the divider. */
  orientation?: DividerOrientation;

  /** Additional CSS class */
  className?: string;

  /** Additional styles */
  style?: CSSProperties;
}
