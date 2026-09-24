/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ModalBannerSize,
  ModalBannerTag,
  ModalContentMode,
  type ModalListItem,
} from '../Modal.types';
import {
  MODAL_BANNER_STANDARD_HEIGHT_RATIO,
  MODAL_BANNER_TALLER_HEIGHT_RATIO,
} from './ModalMetrics';
import { getTrailingTagLabel, TrailingTag } from '../TrailingTag';
import type {
  ModalBannerTagVisibilityInput,
  ModalClickableForReadMoreInput,
  ModalContentDescriptionInput,
  ModalFocusableInput,
  ModalLeadingVisibility,
  ModalLeadingVisibilityInput,
  ModalReadMoreInput,
  ModalSubtitleVisibilityInput,
} from './ModalLayout.types';

export type {
  ModalBannerTagVisibilityInput,
  ModalClickableForReadMoreInput,
  ModalContentDescriptionInput,
  ModalFocusableInput,
  ModalLeadingVisibility,
  ModalLeadingVisibilityInput,
  ModalReadMoreInput,
  ModalSubtitleVisibilityInput,
} from './ModalLayout.types';

export function getModalLeadingVisibility({
  contentMode,
  icon,
  bannerSrc,
  logoSrc,
  avatarSrc,
  avatarPrimaryContent,
}: ModalLeadingVisibilityInput): ModalLeadingVisibility {
  if (contentMode === ModalContentMode.TITLE_ONLY) {
    return {
      hasBanner: false,
      hasLogo: false,
      hasAvatar: false,
      hasIcon: false,
    };
  }

  const hasBanner = bannerSrc != null;
  const hasLogo = logoSrc != null && !hasBanner;
  const hasAvatar =
    (avatarSrc != null || avatarPrimaryContent != null) && !hasBanner && !hasLogo;
  const hasIcon = icon != null && !hasBanner && !hasLogo && !hasAvatar;

  return {
    hasBanner,
    hasLogo,
    hasAvatar,
    hasIcon,
  };
}

export function hasModalListItems(
  listItems: ModalListItem[] | undefined,
  contentMode: ModalContentMode,
): boolean {
  return (
    contentMode !== ModalContentMode.TITLE_ONLY &&
    listItems != null &&
    listItems.length > 0
  );
}

export function shouldShowModalSubtitle({
  subtitle,
  contentMode,
  hasListItems,
}: ModalSubtitleVisibilityInput): boolean {
  return (
    subtitle != null &&
    subtitle.length > 0 &&
    contentMode !== ModalContentMode.TITLE_ONLY &&
    !hasListItems
  );
}

export function shouldShowModalTitle(title?: string): boolean {
  return title != null && title.length > 0;
}

/**
 * Resolve a {@link ModalBannerTag} to its display label, or `null` for `NONE`.
 *
 * The BETA label is owned by the design system and shared with
 * {@link getTrailingTagLabel} so it is sourced from a single place here, staying
 * consistent and localizable.
 */
export function getModalBannerTagText(tag: ModalBannerTag): string | null {
  switch (tag) {
    case ModalBannerTag.BETA:
      return getTrailingTagLabel(TrailingTag.BETA);
    case ModalBannerTag.NONE:
    default:
      return null;
  }
}

export function shouldShowModalBannerTag({
  bannerTag,
  hasBanner,
}: ModalBannerTagVisibilityInput): boolean {
  return bannerTag !== ModalBannerTag.NONE && hasBanner;
}

export function getModalContentDescription({
  showTitle,
  title,
  showSubtitle,
  subtitle,
  showBannerTag,
  bannerTagText,
}: ModalContentDescriptionInput): string | undefined {
  const parts: string[] = [];

  if (showTitle && title != null) {
    parts.push(title);
  }
  if (showSubtitle && subtitle != null) {
    parts.push(subtitle);
  }
  if (showBannerTag && bannerTagText != null) {
    parts.push(bannerTagText);
  }

  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function shouldModalBeFocusable({
  isCarouselItem,
  isSubtitleOverflowing,
}: ModalFocusableInput): boolean {
  return isCarouselItem || isSubtitleOverflowing;
}

export function shouldModalShowReadMore({
  showSubtitle,
  isSubtitleOverflowing,
}: ModalReadMoreInput): boolean {
  return showSubtitle && isSubtitleOverflowing;
}

export function shouldModalBeClickableForReadMore({
  isSubtitleOverflowing,
}: ModalClickableForReadMoreInput): boolean {
  return isSubtitleOverflowing;
}

export function getModalBannerHeightRatio(
  bannerSize: ModalBannerSize,
): number {
  return bannerSize === ModalBannerSize.TALLER
    ? MODAL_BANNER_TALLER_HEIGHT_RATIO
    : MODAL_BANNER_STANDARD_HEIGHT_RATIO;
}
