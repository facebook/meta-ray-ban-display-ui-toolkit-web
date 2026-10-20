/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { STATUS_INDICATOR_LABELS } from './AvatarMetrics';
import type { StatusIndicatorType } from '../Avatar.types';

export interface ContainerHeaderLeadingVisualState {
  hasAvatar: boolean;
  hasIcon: boolean;
  hasLeadingVisual: boolean;
}

export function getContainerHeaderLeadingVisualState({
  avatarSrc,
  avatarPrimaryContent,
  avatarBadgeSrc,
  avatarBadgeContent,
  icon,
}: {
  avatarSrc?: string;
  avatarPrimaryContent?: unknown;
  avatarBadgeSrc?: string;
  avatarBadgeContent?: unknown;
  icon?: unknown;
}): ContainerHeaderLeadingVisualState {
  const hasAvatar =
    avatarSrc != null ||
    avatarPrimaryContent != null ||
    avatarBadgeSrc != null ||
    avatarBadgeContent != null;
  const hasIcon = Boolean(icon) && !hasAvatar;

  return {
    hasAvatar,
    hasIcon,
    hasLeadingVisual: hasAvatar || hasIcon,
  };
}

export function getContainerHeaderAriaLabel({
  title,
  subtitle,
  statusIndicator,
  statusIndicatorLabels,
}: {
  title?: string;
  subtitle?: string;
  statusIndicator?: StatusIndicatorType;
  statusIndicatorLabels?: Partial<Record<StatusIndicatorType, string>>;
}): string | undefined {
  const parts = [title, subtitle].filter(Boolean) as string[];
  if (statusIndicator != null) {
    const overrideLabel = statusIndicatorLabels?.[statusIndicator];
    const statusLabel = typeof overrideLabel === 'string'
      ? overrideLabel
      : STATUS_INDICATOR_LABELS[statusIndicator];
    if (typeof statusLabel === 'string' && statusLabel.trim().length > 0) {
      parts.push(statusLabel);
    }
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}
