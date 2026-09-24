/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CornerRadius } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import {
  AvatarSize,
  StatusIndicatorType,
} from '../Avatar.types';

// Per-size metric values for each avatar size.

export const DIMENSION: Record<AvatarSize, number> = {
  [AvatarSize.XXSMALL]: 36,
  [AvatarSize.XSMALL]: 48,
  [AvatarSize.SMALL]: 56,
  [AvatarSize.MEDIUM]: 64,
  [AvatarSize.LARGE]: 72,
  [AvatarSize.XLARGE]: 88,
  [AvatarSize.XXLARGE]: 104,
  [AvatarSize.XXXLARGE]: 200,
};

export const BADGE_SIZE: Record<AvatarSize, number> = {
  [AvatarSize.XXSMALL]: 16,
  [AvatarSize.XSMALL]: 24,
  [AvatarSize.SMALL]: 28,
  [AvatarSize.MEDIUM]: 28,
  [AvatarSize.LARGE]: 28,
  [AvatarSize.XLARGE]: 28,
  [AvatarSize.XXLARGE]: 28,
  [AvatarSize.XXXLARGE]: 28,
};

export const STATUS_INDICATOR_SIZE: Record<AvatarSize, number> = {
  [AvatarSize.XXSMALL]: 16,
  [AvatarSize.XSMALL]: 16,
  [AvatarSize.SMALL]: 16,
  [AvatarSize.MEDIUM]: 16,
  [AvatarSize.LARGE]: 16,
  [AvatarSize.XLARGE]: 24,
  [AvatarSize.XXLARGE]: 28,
  [AvatarSize.XXXLARGE]: 28,
};

export const BADGE_INSET: Record<AvatarSize, number> = {
  [AvatarSize.XXSMALL]: 0,
  [AvatarSize.XSMALL]: 1,
  [AvatarSize.SMALL]: 0,
  [AvatarSize.MEDIUM]: 0,
  [AvatarSize.LARGE]: 0,
  [AvatarSize.XLARGE]: 0,
  [AvatarSize.XXLARGE]: 0,
  [AvatarSize.XXXLARGE]: 10,
};

export const BADGE_MARGIN = 4;

export const PLACEHOLDER_ICON_SIZE: Record<AvatarSize, number> = {
  [AvatarSize.XXSMALL]: 14,
  [AvatarSize.XSMALL]: 15,
  [AvatarSize.SMALL]: 20,
  [AvatarSize.MEDIUM]: 20,
  [AvatarSize.LARGE]: 26,
  [AvatarSize.XLARGE]: 30,
  [AvatarSize.XXLARGE]: 36,
  [AvatarSize.XXXLARGE]: 72,
};

export const DUO_PLACEHOLDER_ICON_SIZE: Record<AvatarSize, number> = {
  [AvatarSize.XXSMALL]: 7,
  [AvatarSize.XSMALL]: 8,
  [AvatarSize.SMALL]: 10,
  [AvatarSize.MEDIUM]: 10,
  [AvatarSize.LARGE]: 13,
  [AvatarSize.XLARGE]: 14,
  [AvatarSize.XXLARGE]: 19,
  [AvatarSize.XXXLARGE]: 36,
};

export const DUO_SIZE: Record<AvatarSize, number> = {
  [AvatarSize.XXSMALL]: 18,
  [AvatarSize.XSMALL]: 24,
  [AvatarSize.SMALL]: 28,
  [AvatarSize.MEDIUM]: 32,
  [AvatarSize.LARGE]: 36,
  [AvatarSize.XLARGE]: 44,
  [AvatarSize.XXLARGE]: 52,
  [AvatarSize.XXXLARGE]: 100,
};

export const DUO_MARGIN: Record<AvatarSize, number> = {
  [AvatarSize.XXSMALL]: 4,
  [AvatarSize.XSMALL]: 4,
  [AvatarSize.SMALL]: 6,
  [AvatarSize.MEDIUM]: 6,
  [AvatarSize.LARGE]: 7,
  [AvatarSize.XLARGE]: 9,
  [AvatarSize.XXLARGE]: 11,
  [AvatarSize.XXXLARGE]: 20,
};

export const DUO_CUTOUT_MARGIN: Record<AvatarSize, number> = {
  [AvatarSize.XXSMALL]: 2,
  [AvatarSize.XSMALL]: 2,
  [AvatarSize.SMALL]: 2,
  [AvatarSize.MEDIUM]: 2,
  [AvatarSize.LARGE]: 3,
  [AvatarSize.XLARGE]: 3,
  [AvatarSize.XXLARGE]: 4,
  [AvatarSize.XXXLARGE]: 6,
};

export const ROUNDED_RECTANGLE_CORNER_RADIUS = CornerRadius.XSMALL;

export const STATUS_INDICATOR_COLORS: Record<StatusIndicatorType, string> = {
  [StatusIndicatorType.ACTIVE]: 'var(--uit-color-persistent-active, #26A756)',
  [StatusIndicatorType.INACTIVE]: 'var(--uit-color-persistent-inactive, #8D929D)',
  [StatusIndicatorType.NOTIFICATION]: 'var(--uit-color-persistent-notification, #FF5668)',
  [StatusIndicatorType.UNREAD]: 'var(--uit-color-persistent-unread, #2694FE)',
  [StatusIndicatorType.POSITIVE]: 'var(--uit-color-persistent-positive, #26A756)',
  [StatusIndicatorType.NEGATIVE]: 'var(--uit-color-persistent-negative, #FF5668)',
  [StatusIndicatorType.WARNING]: 'var(--uit-color-persistent-warning, #C58600)',
  [StatusIndicatorType.CAUTION]: 'var(--uit-color-persistent-caution, #EB6E00)',
};

export const STATUS_INDICATOR_LABELS: Record<StatusIndicatorType, string> = {
  [StatusIndicatorType.ACTIVE]: 'Active Status',
  [StatusIndicatorType.INACTIVE]: 'Inactive Status',
  [StatusIndicatorType.NOTIFICATION]: 'Notification Status',
  [StatusIndicatorType.UNREAD]: 'Unread Status',
  [StatusIndicatorType.POSITIVE]: 'Positive Status',
  [StatusIndicatorType.NEGATIVE]: 'Negative Status',
  [StatusIndicatorType.WARNING]: 'Warning Status',
  [StatusIndicatorType.CAUTION]: 'Caution Status',
};
