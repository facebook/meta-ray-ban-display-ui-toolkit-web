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

export const AvatarSize = {
  XXSMALL: 'xxsmall',
  XSMALL: 'xsmall',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge',
  XXLARGE: 'xxlarge',
  XXXLARGE: 'xxxlarge',
} as const;
export type AvatarSize = (typeof AvatarSize)[keyof typeof AvatarSize];

export const AvatarShape = {
  CIRCLE: 'circle',
  ROUNDED_RECTANGLE: 'roundedRectangle',
} as const;
export type AvatarShape = (typeof AvatarShape)[keyof typeof AvatarShape];

export const AvatarStyle = {
  STANDARD: 'standard',
  SURFACE: 'surface',
  TRANSPARENT: 'transparent',
  TRANSLUCENT: 'translucent',
} as const;
export type AvatarStyle = (typeof AvatarStyle)[keyof typeof AvatarStyle];

export const PlaceholderStyle = {
  AVATAR: 'avatar',
  IMAGE: 'image',
} as const;
export type PlaceholderStyle = (typeof PlaceholderStyle)[keyof typeof PlaceholderStyle];

export const StatusIndicatorType = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  NOTIFICATION: 'notification',
  UNREAD: 'unread',
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  WARNING: 'warning',
  CAUTION: 'caution',
} as const;
export type StatusIndicatorType = (typeof StatusIndicatorType)[keyof typeof StatusIndicatorType];

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  secondarySrc?: string;
  /**
   * Content for the primary avatar surface. The content is rendered in
   * the Avatar-owned primary slot and overrides `src` and the primary
   * placeholder.
   */
  primaryContent?: ReactNode;
  /**
   * Content for the secondary avatar surface. The content is rendered in
   * the Avatar-owned secondary slot and overrides `secondarySrc` and the
   * secondary placeholder.
   */
  secondaryContent?: ReactNode;
  /**
   * Accessible label for the avatar image. Defaults to the English string
   * `'Profile Picture'`, which is a localizable fallback only — callers should
   * pass a localized string.
   */
  alt?: string;
  placeholderStyle?: PlaceholderStyle;
  placeholderIcon?: IconSource;
  secondaryPlaceholderIcon?: IconSource;
  size?: AvatarSize;
  primaryImageShape?: AvatarShape;
  avatarStyle?: AvatarStyle;
  statusIndicator?: StatusIndicatorType;
  /**
   * Per-status accessibility labels appended to the avatar's `aria-label` when a
   * `statusIndicator` is set. Keys are partial — any omitted status falls back
   * to the built-in English defaults (e.g. `'Active Status'`). Pass localized
   * strings here to display translated status labels.
   */
  statusIndicatorLabels?: Partial<Record<StatusIndicatorType, string>>;
  /**
   * Glyph drawn centered on top of the status-indicator dot, tinted to
   * icon-primary. Only rendered when `statusIndicator` is also set (the dot is
   * the backdrop).
   */
  statusIndicatorIcon?: IconSource;
  /**
   * Content for the image-badge slot. The content is rendered in the
   * Avatar-owned badge box and overrides `badgeImageSrc`. Status indicators use
   * the dedicated `statusIndicator` and `statusIndicatorIcon` props.
   */
  badgeContent?: ReactNode;
  badgeImageSrc?: string;
  showStroke?: boolean;
  className?: string;
  style?: CSSProperties;
}
