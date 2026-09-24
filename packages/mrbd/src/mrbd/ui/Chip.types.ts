/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Chip public API for Meta Ray-Ban Display, including style and avatar configuration.
 */

import type { ReactNode } from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { StaticContainerProps } from '@wearables-ui-toolkit/foundation';
import type {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from './Avatar.types';

/**
 * Chip style enum.
 */
export const ChipStyle = {
  /** Emphasized style with primary text and surface background for headers. */
  EMPHASIZED: 'emphasized',
  /** Deemphasized style with secondary text and subtle appearance for tooltips and labels. */
  DEEMPHASIZED: 'deemphasized',
  /** Elevated style with primary text and elevated background for toasts. */
  ELEVATED: 'elevated',
} as const;
export type ChipStyle = (typeof ChipStyle)[keyof typeof ChipStyle];

/**
 * Chip avatar size enum.
 */
export const ChipAvatarSize = {
  /** Small avatar size for compact chips. */
  SMALL: 'small',
  /** Large avatar size for prominent chips. */
  LARGE: 'large',
} as const;
export type ChipAvatarSize = (typeof ChipAvatarSize)[keyof typeof ChipAvatarSize];

export interface ChipProps extends Omit<StaticContainerProps, 'children'> {
  /** The text to display in the chip. */
  text?: string;

  /** Maximum number of text lines. */
  maxLines?: number;

  /** The metadata text to display in the chip. */
  metadata?: string;

  /**
   * Icon to display in the chip.
   * Mutually exclusive with avatar and loading.
   */
  icon?: IconSource;

  /**
   * Whether the chip is in a loading state.
   * When true, an IndeterminateLoader is shown in place of the icon.
   */
  isLoading?: boolean;

  /**
   * Whether to show the avatar.
   * Mutually exclusive with icon and loading.
   */
  showAvatar?: boolean;

  /** Avatar image source URL. */
  avatarSrc?: string;

  /** Content for the avatar primary surface. The Avatar owns the slot size. */
  avatarPrimaryContent?: ReactNode;

  /** Avatar alt text for accessibility. */
  avatarAlt?: string;

  /** Avatar size. */
  avatarSize?: ChipAvatarSize;

  /** Status indicator to display on the avatar. */
  statusIndicator?: StatusIndicatorType;

  /** Glyph drawn over the avatar status indicator dot. */
  statusIndicatorIcon?: IconSource;

  /** Shape of the avatar primary image. */
  primaryImageShape?: AvatarShape;

  /** Placeholder style for the avatar. */
  placeholderStyle?: PlaceholderStyle;

  /** Secondary avatar image source URL for the duo layout. */
  avatarSecondarySrc?: string;

  /** Content for the avatar secondary surface. The Avatar owns the slot size. */
  avatarSecondaryContent?: ReactNode;

  /** Avatar badge image source URL for the image-badge slot. */
  avatarBadgeSrc?: string;

  /** Content for the avatar image-badge slot. The Avatar owns the badge size. */
  avatarBadgeContent?: ReactNode;

  /**
   * Chip style controlling text color, icon tint, and blend mode.
   * Default: DEEMPHASIZED
   */
  chipStyle?: ChipStyle;
}
