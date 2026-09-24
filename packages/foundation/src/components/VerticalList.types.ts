/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  ReactNode,
} from 'react';
import type { ScrollViewProps } from './ScrollView.types';

export interface VerticalListProps extends Omit<
  ScrollViewProps,
  'children' | 'orientation'
> {
  /** Rows rendered inside the list. */
  children?: ReactNode;

  /** Additional class name applied to the row container. */
  contentClassName?: string;

  /** Inline styles applied to the row container. */
  contentStyle?: CSSProperties;
}
