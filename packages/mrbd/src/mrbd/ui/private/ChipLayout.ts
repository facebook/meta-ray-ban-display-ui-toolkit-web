/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CornerRadius } from '@wearables-ui-toolkit/foundation';
import { AvatarSize } from '../Avatar.types';
import { ChipAvatarSize } from '../Chip.types';
import type {
  ChipContentConfig,
  ChipContentState,
} from './ChipLayout.types';

export type { ChipContentConfig, ChipContentState } from './ChipLayout.types';

/** Avatar size mapping. */
export function chipAvatarSizeToAvatarSize(size: ChipAvatarSize): AvatarSize {
  switch (size) {
    case ChipAvatarSize.SMALL:
      return AvatarSize.XXSMALL;
    case ChipAvatarSize.LARGE:
      return AvatarSize.SMALL;
  }
}

export function getChipContentState({
  text,
  metadata,
  icon,
  isLoading,
  showAvatar,
}: ChipContentConfig): ChipContentState {
  const hasIcon = icon != null && !isLoading && !showAvatar;
  const hasAvatar = showAvatar && !isLoading;
  const hasLeading = hasIcon || hasAvatar || isLoading;
  const hasText = text != null && text.length > 0;
  const hasMetadata = metadata != null && metadata.length > 0;

  return { hasIcon, hasAvatar, hasLeading, hasText, hasMetadata };
}

/** Corner radius update logic. */
export function getChipCornerRadius(
  hasAvatar: boolean,
  avatarSize: ChipAvatarSize,
): CornerRadius {
  return hasAvatar && avatarSize === ChipAvatarSize.LARGE
    ? CornerRadius.MEDIUM
    : CornerRadius.SMALL;
}
