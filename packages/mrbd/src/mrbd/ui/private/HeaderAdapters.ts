/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ChipAvatarSize } from '../Chip';
import { HeaderAvatarSize } from '../Header.types';

/**
 * Maps `HeaderAvatarSize` values to `ChipAvatarSize` values.
 */
export function headerAvatarSizeToChipAvatarSize(size: HeaderAvatarSize): ChipAvatarSize {
  switch (size) {
    case HeaderAvatarSize.SMALL:
      return ChipAvatarSize.SMALL;
    case HeaderAvatarSize.LARGE:
      return ChipAvatarSize.LARGE;
  }
}
