/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Modal public API for Meta Ray-Ban Display.
 */

import type { CSSProperties, ReactNode } from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { PanelProps } from '@wearables-ui-toolkit/foundation/components/Panel';
import type {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from './Avatar.types';
import type { IconTintColor } from './IconTintColor';

/**
 * Content mode variants.
 */
export const ModalContentMode = {
  /** Standard modal styling with heading2 title. All content areas visible. */
  STANDARD: 'standard',
  /** Title-only modal with body2 emphasized title. Hides subtitle, icon, banner, and avatar. */
  TITLE_ONLY: 'title_only',
} as const;
export type ModalContentMode =
  (typeof ModalContentMode)[keyof typeof ModalContentMode];

/**
 * Banner size variants.
 */
export const ModalBannerSize = {
  /** Standard banner height — aspect ratio 440:204 */
  STANDARD: 'standard',
  /** Taller banner height — aspect ratio 440:300 */
  TALLER: 'taller',
} as const;
export type ModalBannerSize =
  (typeof ModalBannerSize)[keyof typeof ModalBannerSize];

/**
 * Banner tag variants.
 */
export const ModalBannerTag = {
  NONE: 'none',
  BETA: 'beta',
} as const;
export type ModalBannerTag =
  (typeof ModalBannerTag)[keyof typeof ModalBannerTag];

/**
 * List item definition for the modal's list section.
 */
export interface ModalListItem {
  /** Icon source for the list item */
  icon: IconSource;
  /** Description text displayed next to the icon */
  description: string;
  /**
   * Optional semantic icon tint. Callers pick a semantic {@link IconTintColor}
   * case; the component resolves it to a design-system color token. Free-form
   * CSS color strings are intentionally not accepted.
   */
  iconColor?: IconTintColor;
}

export interface ModalProps extends Omit<
  PanelProps,
  'children' | 'clickable' | 'focusable' | 'onClick' | 'pressable'
> {
  /** The title of the modal. If empty/null, the title is hidden. */
  title?: string;

  /** The subtitle of the modal. If empty/null, the subtitle is hidden. */
  subtitle?: string;

  /**
   * Content mode controlling styling and visibility rules.
   * Default: STANDARD
   */
  contentMode?: ModalContentMode;

  /**
   * Icon source to display in the leading area.
   * Setting this hides banner, logo, and avatar.
   */
  icon?: IconSource;

  /**
   * Banner image source URL.
   * Setting this hides icon, logo, and avatar.
   */
  bannerSrc?: string;

  /** Banner alt text for accessibility */
  bannerAlt?: string;

  /**
   * Banner size (aspect ratio variant).
   * Default: STANDARD
   */
  bannerSize?: ModalBannerSize;

  /**
   * Optional tag displayed overlaid on the banner.
   * Only visible when a banner is set.
   * Default: NONE
   */
  bannerTag?: ModalBannerTag;

  /**
   * Logo image source URL.
   * Displayed in a medium circular avatar. Setting this hides icon, banner, and avatar.
   */
  logoSrc?: string;

  /** Logo alt text for accessibility */
  logoAlt?: string;

  /**
   * Avatar image source URL.
   * Displayed in a large circular avatar. Setting this hides icon, banner, and logo.
   */
  avatarSrc?: string;

  /**
   * Content for the avatar primary surface. The Avatar owns the slot size.
   * Displayed in a large circular avatar. Setting this hides icon, banner, and logo.
   */
  avatarPrimaryContent?: ReactNode;

  /** Avatar alt text for accessibility */
  avatarAlt?: string;

  /**
   * Avatar secondary image source URL.
   * Displays the avatar in a duo layout when set.
   */
  avatarSecondarySrc?: string;

  /**
   * Content for the avatar secondary surface. The Avatar owns the slot size.
   */
  avatarSecondaryContent?: ReactNode;

  /**
   * Avatar badge image source URL.
   * Displayed in the avatar image-badge slot.
   */
  avatarBadgeSrc?: string;

  /**
   * Content for the avatar image-badge slot. The Avatar owns the badge size.
   */
  avatarBadgeContent?: ReactNode;

  /** Status indicator to display on the avatar. */
  statusIndicator?: StatusIndicatorType;

  /** Glyph drawn over the avatar status indicator dot. */
  statusIndicatorIcon?: IconSource;

  /** Shape of the avatar primary image. */
  primaryImageShape?: AvatarShape;

  /** Placeholder style for the avatar. */
  placeholderStyle?: PlaceholderStyle;

  /**
   * List items to display in the modal.
   * Each item has an icon and description text.
   * Setting list items hides the subtitle.
   */
  listItems?: ModalListItem[];

  /**
   * Buttons section at the bottom of the modal.
   * Typically a ButtonGroup with action buttons.
   */
  buttons?: ReactNode;

  /**
   * Whether this modal is being used as a carousel item. Carousel item modals
   * are made focusable so focus can drive carousel selection.
   */
  isCarouselItem?: boolean;

  /** Additional CSS class for the modal panel */
  className?: string;

  /** Additional inline styles for the modal panel */
  style?: CSSProperties;
}
