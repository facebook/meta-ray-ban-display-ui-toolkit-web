/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  ReactNode,
} from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from './Avatar.types';

/**
 * Header avatar size enum.
 */
export const HeaderAvatarSize = {
  /** Small avatar size for compact headers. */
  SMALL: 'small',
  /** Large avatar size for prominent headers. */
  LARGE: 'large',
} as const;
export type HeaderAvatarSize = (typeof HeaderAvatarSize)[keyof typeof HeaderAvatarSize];

/**
 * Header public API.
 *
 * Fully prop-driven and declarative — callers change `showAvatar`, `avatarSrc`,
 * `isLoading`, `icon`, `avatarSize`, etc. and the component re-renders, animating
 * the avatar/loading/icon transitions via CSS.
 */
export interface HeaderProps {
  /** The text to display in the header. */
  text?: string;

  /** Maximum number of text lines. Default: 1 */
  maxLines?: number;

  /** The metadata text to display in the header. */
  metadata?: string;

  /**
   * Icon to display in the header.
   * Mutually exclusive with avatar and loading.
   */
  icon?: IconSource;

  /**
   * Whether to show the avatar.
   * Mutually exclusive with icon and loading.
   * Default: false
   */
  showAvatar?: boolean;

  /** Avatar image source URL. */
  avatarSrc?: string;

  /** Content for the avatar primary surface. The Avatar owns the slot size. */
  avatarPrimaryContent?: ReactNode;

  /** Secondary avatar image source URL for the avatar duo layout. */
  avatarSecondarySrc?: string;

  /** Content for the avatar secondary surface. The Avatar owns the slot size. */
  avatarSecondaryContent?: ReactNode;

  /** Avatar badge image source URL for the image-badge slot. */
  avatarBadgeSrc?: string;

  /** Content for the avatar image-badge slot. The Avatar owns the badge size. */
  avatarBadgeContent?: ReactNode;

  /**
   * Avatar alt text for accessibility. Optional with no default — when
   * omitted, the value is passed through as undefined and the underlying
   * Avatar's own alt handling applies. Callers should supply a localized
   * string.
   */
  avatarAlt?: string;

  /** Avatar size. Default: SMALL */
  avatarSize?: HeaderAvatarSize;

  /** Status indicator to display on the avatar. */
  statusIndicator?: StatusIndicatorType;

  /**
   * Glyph drawn over the avatar status-indicator dot. Only shows when
   * statusIndicator is also set.
   */
  statusIndicatorIcon?: IconSource;

  /** Shape of the avatar primary image. */
  primaryImageShape?: AvatarShape;

  /** Placeholder style for the avatar. */
  placeholderStyle?: PlaceholderStyle;

  /**
   * Whether the header is in a loading state.
   * When true, an indeterminate loader is shown in place of the icon.
   */
  isLoading?: boolean;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;

  /**
   * Custom accessible label override.
   * If not set, text and metadata are combined for accessibility.
   */
  'aria-label'?: string;
}

/**
 * Imperative handle for Header — exposes the measured header height and root
 * element to callers.
 */
export interface HeaderHandle {
  /** Measured header height in px (0 before layout). */
  getHeaderHeight(): number;
  /** The root header element, or null before mount. */
  getElement(): HTMLDivElement | null;
}
