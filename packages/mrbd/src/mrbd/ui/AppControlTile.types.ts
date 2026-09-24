/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * AppControlTile public API for Meta Ray-Ban Display.
 */

import type { ReactNode } from 'react';
import type { ContainerProps } from '@wearables-ui-toolkit/foundation/components/Container';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { ContainerMaterial } from '@wearables-ui-toolkit/foundation';
import type { ShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import type {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from './Avatar';

/**
 * Single-seed-color theming (deriving the whole secondary material — idle fill,
 * radial gradient stops, inner-glow tint — from one color) is not yet available:
 * it requires an OKLCH WCAG-contrast color-ramp pipeline that does not exist here
 * yet, and is deferred rather than approximated (an approximate tint would drift
 * from the contrast-targeted shades).
 *
 * For now, callers tint the tile by passing a full `material` override (from
 * `ContainerProps`), which already covers the themed-secondary case via
 * `MaterialLibrary.themedSecondary()`.
 */
export interface AppControlTileProps extends Omit<ContainerProps, 'children'> {
  /**
   * Title text displayed below the app image/avatar.
   * When null/undefined, the image is centered in the tile.
   */
  title?: string;

  /**
   * Enable marquee (continuous scroll) for long titles.
   * Default: false
   */
  enableTitleMarquee?: boolean;

  /**
   * Avatar image source URL.
   * When set, the app icon is hidden and the avatar is shown instead.
   */
  avatarSrc?: string;

  /**
   * Content for the avatar primary surface. The Avatar owns the slot size.
   * When set, the app icon is hidden and the avatar is shown instead.
   */
  avatarPrimaryContent?: ReactNode;

  /**
   * Avatar alt text for accessibility.
   */
  avatarAlt?: string;

  /**
   * Avatar badge image source URL.
   * Shown as a small overlay on the avatar (e.g., an app or status badge).
   */
  avatarBadgeSrc?: string;

  /**
   * Content for the avatar image-badge slot. The Avatar owns the badge size.
   */
  avatarBadgeContent?: ReactNode;

  /**
   * Avatar status indicator displayed in the bottom-right avatar slot.
   */
  avatarStatusIndicator?: StatusIndicatorType;

  /**
   * Glyph drawn on top of the avatar status-indicator dot.
   * Only shows when avatarStatusIndicator is set.
   */
  avatarStatusIndicatorIcon?: IconSource;

  /**
   * Shape of the avatar primary image.
   */
  avatarPrimaryImageShape?: AvatarShape;

  /**
   * Placeholder style for the avatar.
   */
  avatarPlaceholderStyle?: PlaceholderStyle;

  /**
   * App icon source URL (image, SVG, etc.).
   * Hidden when avatar or custom icon content is set.
   */
  iconSrc?: string;

  /**
   * Custom content for the app-icon slot. The tile owns the slot size and
   * optional icon-container material. Takes precedence over `iconSrc` and is
   * hidden when avatar content is provided.
   */
  iconContent?: ReactNode;

  /**
   * Optional material for the 72px app icon container. When omitted, the icon
   * renders without a material container (no resting backdrop). The
   * icon-container material is only drawn when a caller explicitly provides one,
   * and is then pinned to the focused appearance.
   */
  iconContainerMaterial?: ContainerMaterial;

  /** Shape of the optional app-icon material container. */
  iconContainerShapeProvider?: ShapeProvider;

  /**
   * Status icon (glyph) displayed below the title.
   * When set, the title is limited to a single line.
   */
  statusIcon?: IconSource;

  /**
   * Custom media displayed in the status area. This takes precedence over
   * `statusIcon` and can contain animated SVG, canvas, video, or another React
   * component. The media owner controls loading and playback declaratively.
   */
  statusMedia?: ReactNode;

  /**
   * Width of the tile. Fills available width when omitted (no default).
   * Caller can specify a fixed pixel value or a CSS sizing value.
   */
  width?: number | string;

  /**
   * Height of the tile. Wraps content with minHeight=120px when omitted.
   * Caller can specify a fixed pixel value or a CSS sizing value.
   */
  height?: number | string;
}
