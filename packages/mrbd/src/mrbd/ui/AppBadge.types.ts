/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { HTMLAttributes } from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { ShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

export interface AppBadgeProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** Decorative icon centered in the badge. */
  icon?: IconSource;
  shapeProvider?: ShapeProvider;
}
