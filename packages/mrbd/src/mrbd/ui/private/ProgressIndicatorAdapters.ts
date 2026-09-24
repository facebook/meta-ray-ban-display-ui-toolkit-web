/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SliderBarSize } from '../SliderBar.types';
import { ProgressIndicatorSize } from '../ProgressIndicator.types';

/**
 * Maps ProgressIndicatorSize to SliderBarSize.
 */
export function progressIndicatorSizeToSliderBarSize(
  size: ProgressIndicatorSize,
): SliderBarSize {
  switch (size) {
    case ProgressIndicatorSize.DEFAULT:
      return SliderBarSize.DEFAULT;
    case ProgressIndicatorSize.THIN:
      return SliderBarSize.THIN;
  }
}
