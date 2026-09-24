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
  type CSSProperties,
  type ReactNode,
} from 'react';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import {
  Avatar,
  AvatarSize,
  type AvatarShape,
  type PlaceholderStyle,
  type StatusIndicatorType,
} from '../Avatar';
import { RadioButtonInternal } from './RadioButtonInternal';
import { SwitchInternal } from './SwitchInternal';
import { Tag } from '../Tag';
import {
  SubtitleTextColor,
  TimestampPosition,
  type StatusIcon,
  type StatusIndicator,
} from '../ListItem.types';
import {
  IconTintColor,
  getIconTintBlendMode,
  getIconTintCSSVariable,
} from '../IconTintColor';
import {
  TimestampTextColor,
  getTimestampTextBlendMode,
  getTimestampTextCSSVariable,
} from '../TimestampTextColor';
import type { ListItemLayoutState } from './ListItemLayout';
import { getListItemSubtitleStyle } from './ListItemLayout';
import { createListItemTagMaterial } from './ListItemMaterials';
import {
  STATUS_INDICATOR_COLORS,
  STATUS_INDICATOR_LABELS,
} from './AvatarMetrics';
import styles from '../ListItem.module.css';

const LIST_ITEM_TAG_STYLE: CSSProperties = { mixBlendMode: 'normal' };

export interface ListItemLeadingSlotProps {
  layout: Pick<ListItemLayoutState, 'hasLeading' | 'hasAvatar'>;
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
}

export const ListItemLeadingSlot = memo(function ListItemLeadingSlot({
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
}: ListItemLeadingSlotProps) {
  // The primary icon defaults to PRIMARY (the CSS module already paints
  // PRIMARY), so only emit an inline override for other cases.
  const iconStyle = useMemo<CSSProperties | undefined>(
    () => iconTintColor == null || iconTintColor === IconTintColor.PRIMARY
      ? undefined
      : {
        color: getIconTintCSSVariable(iconTintColor),
        mixBlendMode: getIconTintBlendMode(iconTintColor),
      },
    [iconTintColor],
  );
  if (!layout.hasLeading) {
    return null;
  }

  return (
    <div className={styles.leadingSlot}>
      {layout.hasAvatar ? (
        <div className={styles.avatarWrapper}>
          <Avatar
            src={avatarSrc}
            primaryContent={avatarPrimaryContent}
            secondarySrc={avatarSecondarySrc}
            secondaryContent={avatarSecondaryContent}
            badgeImageSrc={avatarBadgeSrc}
            badgeContent={avatarBadgeContent}
            alt={avatarAlt}
            size={AvatarSize.MEDIUM}
            primaryImageShape={avatarShape}
            statusIndicator={avatarStatusIndicator}
            statusIndicatorIcon={avatarStatusIndicatorIcon}
            placeholderStyle={avatarPlaceholderStyle}
          />
        </div>
      ) : (
        <div className={styles.iconContainer} style={iconStyle}>
          {icon != null && <IconImage source={icon} />}
        </div>
      )}
    </div>
  );
});

export interface ListItemSecondLineProps {
  layout: Pick<
    ListItemLayoutState,
    'effectiveSubtitle' | 'showSubtitleTimestamp'
  >;
  secondaryIcon?: IconSource;
  secondaryIconTintColor?: IconTintColor;
  subtitleTextColor: SubtitleTextColor;
  subtitleMaxLines: number;
  timestamp?: string;
  timestampTextColor?: TimestampTextColor;
}

export const ListItemSecondLine = memo(function ListItemSecondLine({
  layout,
  secondaryIcon,
  secondaryIconTintColor,
  subtitleTextColor,
  subtitleMaxLines,
  timestamp,
  timestampTextColor,
}: ListItemSecondLineProps) {
  const subtitleStyle = useMemo<CSSProperties>(
    () => ({
      ...getListItemSubtitleStyle(subtitleMaxLines),
      mixBlendMode:
        subtitleTextColor === SubtitleTextColor.SECONDARY
          ? 'lighten'
          : undefined,
    }),
    [subtitleMaxLines, subtitleTextColor],
  );
  // The secondary icon defaults to SECONDARY, which composites with a lighten
  // blend. Resolve the effective tint and always emit color + blend inline (like
  // ButtonContent) so the default's lighten is never dropped.
  const secondaryIconStyle = useMemo<CSSProperties>(
    () => {
      const tint = secondaryIconTintColor ?? IconTintColor.SECONDARY;
      return {
        color: getIconTintCSSVariable(tint),
        mixBlendMode: getIconTintBlendMode(tint),
      };
    },
    [secondaryIconTintColor],
  );
  // The subtitle-line timestamp defaults to SECONDARY (composited with a lighten
  // blend). Resolve the effective color and always emit so the default's lighten
  // is never dropped.
  const subtitleTimestampStyle = useMemo<CSSProperties>(
    () => {
      const color = timestampTextColor ?? TimestampTextColor.SECONDARY;
      return {
        color: getTimestampTextCSSVariable(color),
        mixBlendMode: getTimestampTextBlendMode(color),
      };
    },
    [timestampTextColor],
  );
  if (!layout.effectiveSubtitle && !layout.showSubtitleTimestamp) {
    return null;
  }

  return (
    <div className={styles.secondLineContainer}>
      {secondaryIcon != null && (
        <div className={styles.secondaryIcon} style={secondaryIconStyle}>
          <IconImage source={secondaryIcon} />
        </div>
      )}

      {layout.effectiveSubtitle && (
        <span
          className={`${styles.subtitleText} ${
            subtitleTextColor !== SubtitleTextColor.SECONDARY
              ? styles[subtitleTextColor]
              : ''
          }`}
          style={subtitleStyle}
        >
          {layout.effectiveSubtitle}
        </span>
      )}

      {layout.showSubtitleTimestamp && layout.effectiveSubtitle && (
        <span
          className={styles.subtitleTimestampDivider}
          style={subtitleTimestampStyle}
        >
          {'\u2022'}
        </span>
      )}
      {layout.showSubtitleTimestamp && (
        <span
          className={styles.subtitleTimestamp}
          style={subtitleTimestampStyle}
        >
          {timestamp}
        </span>
      )}
    </div>
  );
});

export interface ListItemTrailingSlotProps {
  layout: Pick<
    ListItemLayoutState,
    | 'hasTrailingContent'
    | 'showAccessoryTimestamp'
    | 'effectiveHasStatus'
    | 'hasStatusIcons'
    | 'showSubtitleTimestamp'
    | 'effectiveShowSwitch'
    | 'effectiveShowRadio'
    | 'effectiveHasAccessoryIcon'
    | 'effectiveHasTag'
    | 'accessoryIconOpacity'
  >;
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
}

export const ListItemTrailingSlot = memo(function ListItemTrailingSlot({
  layout,
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
}: ListItemTrailingSlotProps) {
  const statusIndicatorStyle = useMemo(
    () => statusIndicator == null
      ? undefined
      : { backgroundColor: STATUS_INDICATOR_COLORS[statusIndicator.type] },
    [statusIndicator],
  );
  const accessoryIconStyle = useMemo<CSSProperties>(
    () => ({
      opacity: layout.accessoryIconOpacity,
      ...(accessoryIconTintColor == null
        ? null
        : {
          color: getIconTintCSSVariable(accessoryIconTintColor),
          mixBlendMode: getIconTintBlendMode(accessoryIconTintColor),
        }),
    }),
    [accessoryIconTintColor, layout.accessoryIconOpacity],
  );
  // The accessory-position timestamp defaults to PRIMARY (the CSS module
  // already paints PRIMARY), so only emit an inline override for other cases.
  const timestampStyle = useMemo<CSSProperties | undefined>(
    () => timestampTextColor == null ||
      timestampTextColor === TimestampTextColor.PRIMARY
      ? undefined
      : {
        color: getTimestampTextCSSVariable(timestampTextColor),
        mixBlendMode: getTimestampTextBlendMode(timestampTextColor),
      },
    [timestampTextColor],
  );
  const tagMaterial = useMemo(
    () => createListItemTagMaterial(),
    [],
  );
  if (!layout.hasTrailingContent) {
    return null;
  }

  return (
    <div
      className={`${styles.trailingSlot} ${
        layout.effectiveHasTag ? styles.trailingSlotWithTag : ''
      } ${
        timestampPosition === TimestampPosition.ACCESSORY_TOP
          ? styles.trailingSlotTopAligned
          : ''
      }`}
    >
      {(layout.showAccessoryTimestamp ||
        layout.showSubtitleTimestamp ||
        layout.effectiveHasStatus) && (
        <div
          className={`${styles.timestampStatusContainer} ${
            timestampPosition === TimestampPosition.ACCESSORY_TOP
              ? styles.topAligned
              : ''
          }`}
        >
          {layout.showAccessoryTimestamp && (
            <span className={styles.timestampText} style={timestampStyle}>
              {timestamp}
            </span>
          )}

          {layout.effectiveHasStatus && (
            <div className={styles.statusIndicatorsContainer}>
              {/*
                Icons render before the dot so they sit to the LEFT of it
                (status-indicator icons first, the dot second).
              */}
              {layout.hasStatusIcons && statusIndicatorIcons && (
                <div className={styles.statusIndicatorIcons}>
                  {statusIndicatorIcons.map((statusIcon, index) => {
                    // Precedence: group override, then the per-icon tint,
                    // then the SECONDARY default (composited with a lighten
                    // blend). Resolve and always emit so SECONDARY's lighten is
                    // kept.
                    const tint =
                      statusIndicatorIconTintColor ??
                      statusIcon.tintColor ??
                      IconTintColor.SECONDARY;
                    const iconStyle: CSSProperties = {
                      color: getIconTintCSSVariable(tint),
                      mixBlendMode: getIconTintBlendMode(tint),
                    };
                    return (
                      <div
                        key={index}
                        className={styles.statusIndicatorIcon}
                        style={iconStyle}
                        aria-label={statusIcon.accessibilityContentDescription}
                      >
                        <IconImage source={statusIcon.icon} />
                      </div>
                    );
                  })}
                </div>
              )}
              {statusIndicator && (
                <div
                  className={styles.statusIndicatorDot}
                  style={statusIndicatorStyle}
                  aria-label={
                    statusIndicator.contentDescription ??
                    STATUS_INDICATOR_LABELS[statusIndicator.type]
                  }
                />
              )}
            </div>
          )}
        </div>
      )}

      {layout.effectiveShowSwitch && (
        <SwitchInternal checked={checked} disabled={disabled} presentational />
      )}

      {layout.effectiveShowRadio && (
        <RadioButtonInternal checked={checked} disabled={disabled} presentational />
      )}

      {layout.effectiveHasAccessoryIcon && accessoryIcon != null && (
        <div
          className={styles.accessoryIconContainer}
          style={accessoryIconStyle}
        >
          <IconImage source={accessoryIcon} className={styles.accessoryIcon} />
        </div>
      )}

      {layout.effectiveHasTag && (
        <div className={styles.trailingTag}>
          <Tag
            text={trailingTagLabel}
            material={tagMaterial}
            style={LIST_ITEM_TAG_STYLE}
          />
        </div>
      )}
    </div>
  );
});
