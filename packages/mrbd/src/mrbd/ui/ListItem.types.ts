/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ComponentPropsWithRef,
  ElementType,
  ReactElement,
  ReactNode,
} from 'react';
import type { ContainerProps } from '@wearables-ui-toolkit/foundation/components/Container';
import type { ContainerImplementationProps } from '@wearables-ui-toolkit/foundation/components/Container.types';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { AvatarShape } from './Avatar';
import type {
  PlaceholderStyle,
  StatusIndicatorType,
} from './Avatar.types';
import type { IconTintColor } from './IconTintColor';
import type { TimestampTextColor } from './TimestampTextColor';
import type { TrailingTag } from './TrailingTag';

export const SubtitleTextColor = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  POSITIVE: 'positive',
  WARNING: 'warning',
  NEGATIVE: 'negative',
  INFO: 'info',
} as const;
export type SubtitleTextColor =
  (typeof SubtitleTextColor)[keyof typeof SubtitleTextColor];

export const TimestampPosition = {
  ACCESSORY: 'accessory',
  ACCESSORY_TOP: 'accessoryTop',
  SUBTITLE: 'subtitle',
} as const;
export type TimestampPosition =
  (typeof TimestampPosition)[keyof typeof TimestampPosition];

export interface StatusIndicator {
  type: StatusIndicatorType;
  contentDescription?: string;
}

export interface StatusIcon {
  icon: IconSource;
  accessibilityContentDescription?: string;
  /**
   * Per-icon tint override. Takes precedence over the group-level
   * {@link ListItemProps.statusIndicatorIconTintColor}.
   */
  tintColor?: IconTintColor;
}

export interface ListItemOwnProps {
  /** Class name applied to the row's internal content layout. */
  contentClassName?: string;
  title?: string;
  titleContentDescription?: string;
  subtitle?: string;
  subtitleContentDescription?: string;
  subtitleTextColor?: SubtitleTextColor;
  subtitleMaxLines?: number;
  timestamp?: string;
  timestampContentDescription?: string;
  timestampPosition?: TimestampPosition;
  timestampTextColor?: TimestampTextColor;
  icon?: IconSource;
  iconTintColor?: IconTintColor;
  avatarSrc?: string;
  /** Content for the leading avatar primary surface. The Avatar owns the slot size. */
  avatarPrimaryContent?: ReactNode;
  /** Secondary avatar image source URL for the leading avatar duo layout. */
  avatarSecondarySrc?: string;
  /** Content for the leading avatar secondary surface. The Avatar owns the slot size. */
  avatarSecondaryContent?: ReactNode;
  /** Avatar badge image source URL for the leading avatar badge slot. */
  avatarBadgeSrc?: string;
  /** Content for the leading avatar badge slot. The Avatar owns the badge size. */
  avatarBadgeContent?: ReactNode;
  avatarAlt?: string;
  avatarShape?: AvatarShape;
  /** Status indicator to display on the leading avatar. */
  avatarStatusIndicator?: StatusIndicatorType;
  /** Glyph drawn over the leading avatar's status indicator dot. */
  avatarStatusIndicatorIcon?: IconSource;
  /** Placeholder style for the leading avatar. */
  avatarPlaceholderStyle?: PlaceholderStyle;
  secondaryIcon?: IconSource;
  secondaryIconTintColor?: IconTintColor;
  accessoryIconTintColor?: IconTintColor;
  statusIndicatorIconTintColor?: IconTintColor;
  showSwitch?: boolean;
  showRadioButton?: boolean;
  showSlider?: boolean;
  checked?: boolean;
  onCheckedChange?: (isChecked: boolean) => void;
  sliderMinimumValue?: number;
  sliderMaximumValue?: number;
  sliderValue?: number;
  sliderIncrementPercentage?: number;
  onSliderValueChange?: (newValue: number) => void;
  statusIndicator?: StatusIndicator;
  statusIndicatorIcons?: StatusIcon[];
  accessoryIcon?: IconSource;
  accessoryIconAlwaysVisible?: boolean;
  trailingTag?: TrailingTag;
}

export type ListItemProps<T extends ElementType = 'div'> =
  ListItemOwnProps & Omit<
    ContainerProps<T>,
    keyof ListItemOwnProps | 'children' | 'height' | 'width'
  >;

export type ListItemImplementationProps = ListItemOwnProps & Omit<
  ContainerImplementationProps,
  keyof ListItemOwnProps | 'children' | 'height' | 'width'
>;

export interface ListItemComponent {
  (
    props: ListItemProps<'div'> & {
      ref?: ComponentPropsWithRef<'div'>['ref'];
    },
  ): ReactElement | null;
  <T extends ElementType>(
    props: ListItemProps<T> & {
      as: T;
      ref?: ComponentPropsWithRef<T>['ref'];
    },
  ): ReactElement | null;
}
