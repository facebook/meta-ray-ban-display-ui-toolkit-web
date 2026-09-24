/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useMemo,
  type ReactNode,
} from 'react';
import { SliderBarInternal } from './SliderBarInternal';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from '../Avatar';
import {
  ListItemLeadingSlot,
  ListItemSecondLine,
  ListItemTrailingSlot,
} from './ListItemSlots';
import {
  getListItemSliderAnnouncementPercent,
} from './ListItemLayout';
import type { ListItemLayoutState } from './ListItemLayout';
import type {
  StatusIcon,
  StatusIndicator,
} from '../ListItem.types';
import {
  SubtitleTextColor,
  TimestampPosition,
} from '../ListItem.types';
import type { IconTintColor } from '../IconTintColor';
import type { TimestampTextColor } from '../TimestampTextColor';
import styles from '../ListItem.module.css';

interface ListItemContentProps {
  className?: string;
  layout: ListItemLayoutState;
  icon?: IconSource;
  iconTintColor?: IconTintColor;
  avatarSrc?: string;
  avatarPrimaryContent?: ReactNode;
  avatarSecondarySrc?: string;
  avatarSecondaryContent?: ReactNode;
  avatarBadgeSrc?: string;
  avatarBadgeContent?: ReactNode;
  avatarAlt: string;
  avatarShape: AvatarShape;
  avatarStatusIndicator?: StatusIndicatorType;
  avatarStatusIndicatorIcon?: IconSource;
  avatarPlaceholderStyle?: PlaceholderStyle;
  secondaryIcon?: IconSource;
  secondaryIconTintColor?: IconTintColor;
  subtitleTextColor: SubtitleTextColor;
  subtitleMaxLines: number;
  timestampPosition: TimestampPosition;
  timestamp?: string;
  timestampTextColor?: TimestampTextColor;
  statusIndicator?: StatusIndicator;
  statusIndicatorIcons?: StatusIcon[];
  statusIndicatorIconTintColor?: IconTintColor;
  checked: boolean;
  disabled: boolean;
  accessoryIcon?: IconSource;
  accessoryIconTintColor?: IconTintColor;
  trailingTagLabel?: string;
  contentDescription?: string;
  sliderValue: number;
  sliderMinimumValue: number;
  sliderMaximumValue: number;
}

/**
 * ListItem content region: leading slot, title/subtitle/slider region, and
 * trailing controls inside the interactive Container shell.
 */
export const ListItemContent = memo(function ListItemContent({
  className = '',
  layout,
  icon,
  iconTintColor,
  avatarSrc,
  avatarPrimaryContent,
  avatarSecondarySrc,
  avatarSecondaryContent,
  avatarBadgeSrc,
  avatarBadgeContent,
  avatarAlt,
  avatarShape,
  avatarStatusIndicator,
  avatarStatusIndicatorIcon,
  avatarPlaceholderStyle,
  secondaryIcon,
  secondaryIconTintColor,
  subtitleTextColor,
  subtitleMaxLines,
  timestampPosition,
  timestamp,
  timestampTextColor,
  statusIndicator,
  statusIndicatorIcons,
  statusIndicatorIconTintColor,
  checked,
  disabled,
  accessoryIcon,
  accessoryIconTintColor,
  trailingTagLabel,
  contentDescription,
  sliderValue,
  sliderMinimumValue,
  sliderMaximumValue,
}: ListItemContentProps) {
  const rootClassName = useMemo(
    () => `${styles.contentView} ${layout.isMultiline ? styles.multiline : ''} ${className}`,
    [className, layout.isMultiline],
  );

  const sliderAriaLabel = useMemo(
    () => contentDescription ||
      `${getListItemSliderAnnouncementPercent(
        sliderValue,
        sliderMinimumValue,
        sliderMaximumValue,
      )}%`,
    [
      contentDescription,
      sliderMaximumValue,
      sliderMinimumValue,
      sliderValue,
    ],
  );

  return (
    <div className={rootClassName}>
      <ListItemLeadingSlot
        layout={layout}
        icon={icon}
        iconTintColor={iconTintColor}
        avatarSrc={avatarSrc}
        avatarPrimaryContent={avatarPrimaryContent}
        avatarSecondarySrc={avatarSecondarySrc}
        avatarSecondaryContent={avatarSecondaryContent}
        avatarBadgeSrc={avatarBadgeSrc}
        avatarBadgeContent={avatarBadgeContent}
        avatarAlt={avatarAlt}
        avatarShape={avatarShape}
        avatarStatusIndicator={avatarStatusIndicator}
        avatarStatusIndicatorIcon={avatarStatusIndicatorIcon}
        avatarPlaceholderStyle={avatarPlaceholderStyle}
      />

      {layout.effectiveShowSlider ? (
        <div className={styles.sliderContainer}>
          <SliderBarInternal
            value={sliderValue}
            minimumValue={sliderMinimumValue}
            maximumValue={sliderMaximumValue}
            state={layout.sliderState}
            shouldExpandOnFocus={false}
            animated
            disabled={disabled}
            aria-label={sliderAriaLabel}
            presentational
          />
        </div>
      ) : (
        <div className={styles.titleAccessoryContainer}>
          <div className={styles.titleSubtitleContainer}>
            {layout.effectiveTitle && (
              <span className={styles.titleText}>{layout.effectiveTitle}</span>
            )}

            <ListItemSecondLine
              layout={layout}
              secondaryIcon={secondaryIcon}
              secondaryIconTintColor={secondaryIconTintColor}
              subtitleTextColor={subtitleTextColor}
              subtitleMaxLines={subtitleMaxLines}
              timestamp={timestamp}
              timestampTextColor={timestampTextColor}
            />
          </div>

          <ListItemTrailingSlot
            layout={layout}
            timestampPosition={timestampPosition}
            timestamp={timestamp}
            timestampTextColor={timestampTextColor}
            statusIndicator={statusIndicator}
            statusIndicatorIcons={statusIndicatorIcons}
            statusIndicatorIconTintColor={statusIndicatorIconTintColor}
            checked={checked}
            disabled={disabled}
            accessoryIcon={accessoryIcon}
            accessoryIconTintColor={accessoryIconTintColor}
            trailingTagLabel={trailingTagLabel}
          />
        </div>
      )}
    </div>
  );
});
