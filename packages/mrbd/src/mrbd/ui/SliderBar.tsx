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
import { SliderBarInternal } from './private/SliderBarInternal';
import type { SliderBarProps } from './SliderBar.types';

export {
  SliderBarOrientation,
  SliderBarSize,
  SliderBarState,
} from './SliderBar.types';
export type { SliderBarProps } from './SliderBar.types';

/**
 * Public SliderBar. Typed without in-package-only props such as
 * `presentational` and `stateAnimated`.
 */
export const SliderBar = SliderBarInternal as unknown as ForwardRefExoticComponent<
  SliderBarProps & RefAttributes<HTMLDivElement>
>;
