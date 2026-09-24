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
  icon,
}: {
  avatarSrc?: string;
  avatarPrimaryContent?: unknown;
  icon?: unknown;
}): ContainerHeaderLeadingVisualState {
  const hasAvatar = avatarSrc != null || avatarPrimaryContent != null;
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
}: {
  title?: string;
  subtitle?: string;
  statusIndicator?: StatusIndicatorType;
}): string | undefined {
  const parts = [title, subtitle].filter(Boolean) as string[];
  // Append the avatar's status-indicator description to the heading's content
  // description.
  if (statusIndicator != null) {
    parts.push(STATUS_INDICATOR_LABELS[statusIndicator]);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}
