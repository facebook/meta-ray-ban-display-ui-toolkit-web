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
import { RadioButtonInternal } from './private/RadioButtonInternal';
import type { RadioButtonProps } from './RadioButton.types';

export type { RadioButtonProps } from './RadioButton.types';

/**
 * Public RadioButton. Typed without in-package-only props such as
 * `presentational`.
 */
export const RadioButton = RadioButtonInternal as unknown as ForwardRefExoticComponent<
  RadioButtonProps & RefAttributes<HTMLDivElement>
>;
