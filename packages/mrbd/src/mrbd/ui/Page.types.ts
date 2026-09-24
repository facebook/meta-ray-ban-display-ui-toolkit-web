/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  HTMLAttributes,
  ReactNode,
} from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from './Avatar.types';
import type { HeaderAvatarSize } from './Header';

export interface PageProps extends HTMLAttributes<HTMLDivElement> {
  /** Page content. */
  children?: ReactNode;

  /** Whether to show the header. */
  showHeader?: boolean;

  /**
   * Whether to inset page content below the display system-bar region.
   * The page root and header position are unaffected.
   * @default true
   */
  enableSystemBarInset?: boolean;

  /** Header text. */
  headerText?: string;

  /** Maximum number of header text lines. */
  headerMaxLines?: number;

  /** Header metadata text. */
  headerMetadata?: string;

  /** Header icon. */
  headerIcon?: IconSource;

  /** Whether to show the header avatar. */
  headerShowAvatar?: boolean;

  /** Header avatar image source URL. */
  headerAvatarSrc?: string;

  /** Content for the header avatar primary surface. The Avatar owns the slot size. */
  headerAvatarPrimaryContent?: ReactNode;

  /** Secondary avatar image source URL for the header avatar duo layout. */
  headerAvatarSecondarySrc?: string;

  /** Content for the header avatar secondary surface. The Avatar owns the slot size. */
  headerAvatarSecondaryContent?: ReactNode;

  /** Header avatar badge image source URL for the image-badge slot. */
  headerAvatarBadgeSrc?: string;

  /** Content for the header avatar image-badge slot. The Avatar owns the badge size. */
  headerAvatarBadgeContent?: ReactNode;

  /** Header avatar alt text. */
  headerAvatarAlt?: string;

  /** Header avatar size. */
  headerAvatarSize?: HeaderAvatarSize;

  /** Status indicator to display on the header avatar. */
  headerStatusIndicator?: StatusIndicatorType;

  /**
   * Glyph drawn over the header avatar status-indicator dot. Only shows when
   * headerStatusIndicator is also set.
   */
  headerStatusIndicatorIcon?: IconSource;

  /** Shape of the header avatar primary image. */
  headerPrimaryImageShape?: AvatarShape;

  /** Placeholder style for the header avatar. */
  headerPlaceholderStyle?: PlaceholderStyle;

  /** Whether the header is in a loading state. */
  headerIsLoading?: boolean;
}

/**
 * Imperative handle for Page.
 *
 * Exposes the rendered header height so consumers can offset content or
 * coordinate scroll behavior.
 */
export interface PageHandle {
  /**
   * Returns the rendered header height in pixels, or 0 when the header is
   * not shown.
   */
  getHeaderHeight(): number;

  /**
   * The root DOM element of the page, for consumers that need direct access
   * to the underlying `HTMLDivElement`. Null before mount / after unmount.
   */
  getElement(): HTMLDivElement | null;
}
