/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ModalBannerTag,
  ModalContentMode,
} from '../Modal.types';

export interface ModalLeadingVisibilityInput {
  contentMode: ModalContentMode;
  /** Presence-only: any non-null value counts as "has icon". */
  icon?: unknown;
  bannerSrc?: string;
  logoSrc?: string;
  avatarSrc?: string;
  avatarPrimaryContent?: unknown;
}

export interface ModalLeadingVisibility {
  hasBanner: boolean;
  hasLogo: boolean;
  hasAvatar: boolean;
  hasIcon: boolean;
}

export interface ModalSubtitleVisibilityInput {
  subtitle?: string;
  contentMode: ModalContentMode;
  hasListItems: boolean;
}

export interface ModalBannerTagVisibilityInput {
  bannerTag: ModalBannerTag;
  hasBanner: boolean;
}

export interface ModalContentDescriptionInput {
  showTitle: boolean;
  title?: string;
  showSubtitle: boolean;
  subtitle?: string;
  showBannerTag: boolean;
  bannerTagText: string | null;
}

export interface ModalFocusableInput {
  isCarouselItem: boolean;
  isSubtitleOverflowing: boolean;
}

export interface ModalReadMoreInput {
  showSubtitle: boolean;
  isSubtitleOverflowing: boolean;
}

export interface ModalClickableForReadMoreInput {
  isSubtitleOverflowing: boolean;
}
