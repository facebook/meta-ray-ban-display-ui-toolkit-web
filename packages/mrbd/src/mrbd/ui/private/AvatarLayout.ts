/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getCachedSmoothRoundedRectPath } from '@wearables-ui-toolkit/foundation/utils/SmoothCorners';
import {
  AvatarShape,
  AvatarSize,
  StatusIndicatorType,
} from '../Avatar.types';
import {
  BADGE_INSET,
  BADGE_MARGIN,
  BADGE_SIZE,
  DIMENSION,
  DUO_CUTOUT_MARGIN,
  DUO_MARGIN,
  DUO_SIZE,
  ROUNDED_RECTANGLE_CORNER_RADIUS,
  STATUS_INDICATOR_LABELS,
  STATUS_INDICATOR_SIZE,
} from './AvatarMetrics';
import type {
  AvatarBadgeMetrics,
  AvatarDuoMetrics,
} from './AvatarLayout.types';

export type {
  AvatarBadgeMetrics,
  AvatarDuoMetrics,
} from './AvatarLayout.types';

export function getAvatarDimension(size: AvatarSize): number {
  return DIMENSION[size];
}

export function hasAvatarDuoLayout(
  secondarySrc?: string,
  secondaryPlaceholderIcon?: unknown,
  secondaryContent?: unknown,
): boolean {
  return secondarySrc != null || secondaryPlaceholderIcon != null || secondaryContent != null;
}

export function hasAvatarBadge(
  statusIndicator?: StatusIndicatorType,
  badgeImage?: unknown,
  badgeContent?: unknown,
): boolean {
  return statusIndicator != null || badgeImage != null || badgeContent != null;
}

export function getAvatarBadgeMetrics(
  size: AvatarSize,
  dimension: number,
  statusIndicator?: StatusIndicatorType,
): AvatarBadgeMetrics {
  const badgeSize = statusIndicator != null
    ? STATUS_INDICATOR_SIZE[size]
    : BADGE_SIZE[size];
  const badgeInset = BADGE_INSET[size];
  const badgeCutoutSize = badgeSize + BADGE_MARGIN * 2;
  const cutoutCx =
    (dimension - badgeSize - BADGE_MARGIN - badgeInset) + badgeCutoutSize / 2;
  const cutoutCy =
    (dimension - badgeSize - BADGE_MARGIN - badgeInset) + badgeCutoutSize / 2;

  return {
    badgeSize,
    badgeInset,
    cutoutCx,
    cutoutCy,
    cutoutR: badgeCutoutSize / 2,
  };
}

export function getAvatarClipPath(
  dimension: number,
  primaryImageShape: AvatarShape,
): string {
  if (primaryImageShape === AvatarShape.ROUNDED_RECTANGLE) {
    return getCachedSmoothRoundedRectPath({
      width: dimension,
      height: dimension,
      cornerRadius: ROUNDED_RECTANGLE_CORNER_RADIUS,
    });
  }
  const r = dimension / 2;
  return getCirclePath(r, r, r);
}

export function getAvatarDuoMetrics(
  size: AvatarSize,
  dimension: number,
): AvatarDuoMetrics {
  const duoSize = DUO_SIZE[size];
  const duoMargin = DUO_MARGIN[size];
  const duoCutoutMargin = DUO_CUTOUT_MARGIN[size];
  const duoR = duoSize / 2;
  const primaryCx = duoR + duoMargin;
  const primaryCy = dimension - duoR - duoMargin;
  const secondaryCx = dimension - duoR - duoMargin;
  const secondaryCy = duoR + duoMargin;

  return {
    duoSize,
    duoMargin,
    duoCutoutMargin,
    duoR,
    primaryCx,
    primaryCy,
    secondaryCx,
    secondaryCy,
    secondaryCutoutR: (duoSize + duoCutoutMargin * 2) / 2,
  };
}

export function getCirclePath(cx: number, cy: number, r: number): string {
  return `M ${cx - r},${cy} A ${r},${r} 0 1,0 ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy} Z`;
}

/**
 * Builds the avatar's accessibility label.
 *
 * `statusIndicatorLabels` overrides are merged over the built-in English
 * defaults so callers can supply localized per-status labels; any omitted
 * status falls back to `STATUS_INDICATOR_LABELS`.
 */
export function getAvatarAriaLabel(
  alt: string,
  statusIndicator?: StatusIndicatorType,
  statusIndicatorLabels?: Partial<Record<StatusIndicatorType, string>>,
): string {
  const parts: string[] = [alt];
  if (statusIndicator != null) {
    parts.push(
      statusIndicatorLabels?.[statusIndicator] ??
        STATUS_INDICATOR_LABELS[statusIndicator],
    );
  }
  return parts.join(', ');
}
