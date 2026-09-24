/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { HTMLAttributes } from 'react';
import type { ShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

export interface NotificationBadgeProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** Notification count or short label displayed in the badge. */
  text?: string | number;
  shapeProvider?: ShapeProvider;
}
