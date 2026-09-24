/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  Ref,
  ReactNode,
} from 'react';
import {
  memo,
  useMemo,
} from 'react';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type {
  PlaceholderStyle,
  StatusIndicatorType,
} from '../Avatar.types';
import { IconTintColor, getIconTintCSSVariable, getIconTintBlendMode } from '../IconTintColor';
import { TrailingTag, getTrailingTagLabel } from '../TrailingTag';
import { Avatar, AvatarSize } from '../Avatar';
import {
  AVATAR_LEADING_MARGIN,
  ICON_VERTICAL_OFFSET,
  LeadingAccessoryRenderMode,
  TAG_TRAILING_MARGIN,
  TEXT_CONTENT_VERTICAL_PADDING,
  TEXT_LEADING_MARGIN_WITHOUT_ICON_AVATAR,
  TEXT_LEADING_MARGIN_WITH_ICON_AVATAR,
  TEXT_TRAILING_MARGIN,
  TEXT_TRAILING_MARGIN_WITH_TAG,
} from './ButtonLayout';
import { Tag } from '../Tag';
import styles from '../Button.module.css';

interface ButtonContentProps {
  contentViewContainerRef: Ref<HTMLDivElement>;
  contentViewRef: Ref<HTMLDivElement>;
  contentViewContainerStyle: CSSProperties;
  contentViewStyle: CSSProperties;
  renderMode: LeadingAccessoryRenderMode;
  icon?: IconSource;
  iconTintColor?: IconTintColor;
  applyIconTinting: boolean;
  showIconActiveIndicator: boolean;
  iconRotation: number;
  animateIconRotation?: boolean;
  iconRotationDuration?: number;
  avatarSrc?: string;
  avatarPrimaryContent?: ReactNode;
  avatarAlt?: string;
  /** Status indicator to display on the avatar. */
  statusIndicator?: StatusIndicatorType;
  /** Glyph drawn over the avatar status indicator dot. */
  statusIndicatorIcon?: IconSource;
  /** Avatar badge image source URL (rendered in the avatar badge slot). */
  avatarBadgeSrc?: string;
  /** Content for the avatar image-badge slot. The Avatar owns the badge size. */
  avatarBadgeContent?: ReactNode;
  /** Placeholder style for the avatar. */
  placeholderStyle?: PlaceholderStyle;
  title?: string;
  subtitle?: string;
  trailingTag?: TrailingTag;
  hasText: boolean;
  shouldTruncate: boolean;
  iconLeadingMargin: number;
  iconCounterScale: number;
  /**
   * Additional multiplier applied to the icon scale during an action
   * transition. 1 when no transition is in flight.
   */
  iconActionScale: number;
  /**
   * CSS `transition` applied to the icon transform during an action transition.
   * `'none'` when idle.
   */
  iconActionTransition: string;
  textOpacity: number;
}

/**
 * Button content viewport: an outer clipped container plus an inner
 * natural-width row containing icon/avatar, labels, and optional trailing tag.
 */
export const ButtonContent = memo(function ButtonContent({
  contentViewContainerRef,
  contentViewRef,
  contentViewContainerStyle,
  contentViewStyle,
  renderMode,
  icon,
  iconTintColor,
  applyIconTinting,
  showIconActiveIndicator,
  iconRotation,
  animateIconRotation = false,
  iconRotationDuration = 1000,
  avatarSrc,
  avatarPrimaryContent,
  avatarAlt,
  statusIndicator,
  statusIndicatorIcon,
  avatarBadgeSrc,
  avatarBadgeContent,
  placeholderStyle,
  title,
  subtitle,
  trailingTag,
  hasText,
  shouldTruncate,
  iconLeadingMargin,
  iconCounterScale,
  iconActionScale,
  iconActionTransition,
  textOpacity,
}: ButtonContentProps) {
  const iconStyle: CSSProperties = useMemo(
    () => ({
      marginLeft: iconLeadingMargin,
      transform: `translateY(${ICON_VERTICAL_OFFSET}px) scale(${iconCounterScale * iconActionScale})`,
      transition: iconActionTransition,
      color: applyIconTinting
        ? getIconTintCSSVariable(iconTintColor ?? IconTintColor.PRIMARY)
        : undefined,
      mixBlendMode: applyIconTinting
        ? getIconTintBlendMode(iconTintColor ?? IconTintColor.PRIMARY)
        : undefined,
    }),
    [
      applyIconTinting,
      iconActionScale,
      iconActionTransition,
      iconCounterScale,
      iconLeadingMargin,
      iconTintColor,
    ],
  );
  const iconRotationStyle: CSSProperties = useMemo(
    () => ({
      transform: `rotate(${iconRotation}deg)`,
      transition: animateIconRotation
        ? `transform ${Math.max(0, iconRotationDuration)}ms ease-out`
        : 'none',
    }),
    [animateIconRotation, iconRotation, iconRotationDuration],
  );

  const avatarStyle: CSSProperties = useMemo(
    () => ({
      marginLeft: AVATAR_LEADING_MARGIN,
      transform: `scale(${iconCounterScale})`,
      transformOrigin: 'center',
      transition: 'none',
    }),
    [iconCounterScale],
  );

  const textLeadingMargin =
    renderMode === LeadingAccessoryRenderMode.NONE
      ? TEXT_LEADING_MARGIN_WITHOUT_ICON_AVATAR
      : TEXT_LEADING_MARGIN_WITH_ICON_AVATAR;
  const trailingTagLabel = getTrailingTagLabel(trailingTag ?? TrailingTag.NONE);
  const shouldRenderTrailingTag = trailingTagLabel != null && hasText;

  const textContentStyle: CSSProperties = useMemo(
    () => ({
      marginLeft: textLeadingMargin,
      marginRight: shouldRenderTrailingTag ? TEXT_TRAILING_MARGIN_WITH_TAG : TEXT_TRAILING_MARGIN,
      paddingTop: TEXT_CONTENT_VERTICAL_PADDING,
      paddingBottom: TEXT_CONTENT_VERTICAL_PADDING,
      opacity: textOpacity,
      transition: 'none',
    }),
    [shouldRenderTrailingTag, textLeadingMargin, textOpacity],
  );
  const iconIndicatorStyle = useMemo(
    () => ({ visibility: showIconActiveIndicator ? 'visible' as const : 'hidden' as const }),
    [showIconActiveIndicator],
  );
  const trailingTagStyle: CSSProperties = useMemo(
    () => ({
      marginRight: TAG_TRAILING_MARGIN,
      opacity: textOpacity,
      transition: 'none',
      flexShrink: 0,
    }),
    [textOpacity],
  );

  return (
    <div
      className={styles.contentViewContainer}
      style={contentViewContainerStyle}
      ref={contentViewContainerRef}
    >
      <div className={styles.contentView} style={contentViewStyle} ref={contentViewRef}>
        {renderMode === LeadingAccessoryRenderMode.ICON && (
          <div className={styles.iconContent} style={iconStyle}>
            <div className={styles.iconRotationContent} style={iconRotationStyle}>
              <div className={styles.iconImageView}>
                {icon != null && <IconImage source={icon} />}
              </div>
              <div
                className={styles.iconIndicator}
                style={iconIndicatorStyle}
              />
            </div>
          </div>
        )}

        {renderMode === LeadingAccessoryRenderMode.AVATAR && (
          <div className={styles.avatarContent} style={avatarStyle}>
            <Avatar
              src={avatarSrc}
              primaryContent={avatarPrimaryContent}
              alt={avatarAlt}
              size={AvatarSize.LARGE}
              statusIndicator={statusIndicator}
              statusIndicatorIcon={statusIndicatorIcon}
              badgeImageSrc={avatarBadgeSrc}
              badgeContent={avatarBadgeContent}
              placeholderStyle={placeholderStyle}
            />
          </div>
        )}

        {hasText && (
          <div
            className={`${styles.textContent} ${shouldTruncate ? styles.textContentTruncate : ''}`}
            style={textContentStyle}
          >
            {title && <div className={styles.titleLabel}>{title}</div>}
            {subtitle && <div className={styles.subtitleLabel}>{subtitle}</div>}
          </div>
        )}

        {shouldRenderTrailingTag && (
          <Tag
            text={trailingTagLabel}
            className={styles.trailingTag}
            style={trailingTagStyle}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
});
