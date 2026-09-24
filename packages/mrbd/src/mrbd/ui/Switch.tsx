/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';
import { SwitchInternal } from './private/SwitchInternal';
import type { SwitchProps } from './Switch.types';

export type { SwitchProps } from './Switch.types';

/**
 * Public Switch. Typed without in-package-only props such as `presentational`.
 */
export const Switch = SwitchInternal as unknown as ForwardRefExoticComponent<
  SwitchProps & RefAttributes<HTMLDivElement>
>;
