/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from './Avatar.types';

export interface ContainerHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Title text. */
  title?: string;

  /** Subtitle text. */
  subtitle?: string;

  /** Icon source. */
  icon?: IconSource;

  /** Avatar image source URL. */
  avatarSrc?: string;

  /** Content for the avatar primary surface. The Avatar owns the slot size. */
  avatarPrimaryContent?: ReactNode;

  /** Avatar alt text for accessibility. */
  avatarAlt?: string;

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

  /** Avatar badge image source URL. */
  avatarBadgeSrc?: string;

  /** Content for the avatar image-badge slot. The Avatar owns the badge size. */
  avatarBadgeContent?: ReactNode;

  /** Additional CSS class. */
  className?: string;

  /** Additional inline styles. */
  style?: CSSProperties;
}
