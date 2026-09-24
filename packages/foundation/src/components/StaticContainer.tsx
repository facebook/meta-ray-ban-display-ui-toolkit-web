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
import { StaticContainerInternal } from './private/StaticContainerInternal';
import type { StaticContainerProps } from './StaticContainer.types';

export {
  BackgroundStyle,
} from './StaticContainer.types';
export type { StaticContainerProps } from './StaticContainer.types';

/**
 * Public StaticContainer. Typed without private implementation props.
 */
export const StaticContainer =
  StaticContainerInternal as unknown as ForwardRefExoticComponent<
    StaticContainerProps & RefAttributes<HTMLDivElement>
  >;
