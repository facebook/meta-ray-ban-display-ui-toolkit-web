/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ContainerHeader component for Meta Ray-Ban Display.
 *
 * A non-interactive header for container sections.
 * Displays title, subtitle, and an optional icon or avatar.
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import { Avatar, AvatarSize } from './Avatar';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import {
  getContainerHeaderAriaLabel,
  getContainerHeaderLeadingVisualState,
} from './private/ContainerHeaderLayout';
import type { ContainerHeaderProps } from './ContainerHeader.types';
import styles from './ContainerHeader.module.css';

export type { ContainerHeaderProps } from './ContainerHeader.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * ContainerHeader component
 * Non-interactive display header with title/subtitle and optional leading visual.
 *
 * Supports two leading visuals plus a none state:
 * 1. Avatar (if avatarSrc or avatarPrimaryContent is provided)
 * 2. Icon (if icon is provided, and no avatar)
 * 3. None (text only — neither avatar nor icon provided)
 *
 * When both an avatar and an icon are provided, the avatar takes precedence and
 * the icon is not rendered.
 *
 * Glyph icons render inline as <svg> and tint via the surrounding color.
 */
export const ContainerHeader = memo(forwardRef<HTMLDivElement, ContainerHeaderProps>(
  function ContainerHeader(
    {
      title,
      subtitle,
      icon,
      avatarSrc,
      avatarPrimaryContent,
      avatarAlt = 'Avatar',
      statusIndicator,
      statusIndicatorIcon,
      primaryImageShape,
      placeholderStyle,
      avatarBadgeSrc,
      avatarBadgeContent,
      className = '',
      style = DEFAULT_STYLE,
      'aria-label': ariaLabelProp,
      ...rootProps
    },
    ref
  ) {
    const {
      hasAvatar,
      hasIcon,
      hasLeadingVisual,
    } = getContainerHeaderLeadingVisualState({
      avatarSrc,
      avatarPrimaryContent,
      icon,
    });
    const hasTitle = Boolean(title);
    const hasSubtitle = Boolean(subtitle);
    const ariaLabel = useMemo(
      () => getContainerHeaderAriaLabel({
        title,
        subtitle,
        // The status indicator only renders on the avatar; describe it only then.
        statusIndicator: hasAvatar ? statusIndicator : undefined,
      }),
      [title, subtitle, hasAvatar, statusIndicator],
    );
    const rootClassName = useMemo(
      () => `${styles.containerHeader} ${className}`,
      [className],
    );
    const textContentClassName = useMemo(
      () => `${styles.textContent} ${
        hasLeadingVisual
          ? styles.textContentWithLeading
          : styles.textContentWithoutLeading
      }`,
      [hasLeadingVisual],
    );

    return (
      <div
        {...rootProps}
        ref={ref}
        className={rootClassName}
        style={style}
        role="heading"
        aria-level={2}
        aria-label={ariaLabelProp ?? ariaLabel}
      >
        {/* Avatar (priority over icon) */}
        {hasAvatar && (
          <div className={styles.avatarContainer}>
            <Avatar
              src={avatarSrc}
              primaryContent={avatarPrimaryContent}
              alt={avatarAlt}
              size={AvatarSize.SMALL}
              statusIndicator={statusIndicator}
              statusIndicatorIcon={statusIndicatorIcon}
              primaryImageShape={primaryImageShape}
              placeholderStyle={placeholderStyle}
              badgeImageSrc={avatarBadgeSrc}
              badgeContent={avatarBadgeContent}
              aria-hidden
            />
          </div>
        )}

        {/* Icon (only if no avatar) */}
        {hasIcon && (
          <div className={styles.iconContainer}>
            <div className={styles.iconImageView}>
              {icon != null && <IconImage source={icon} />}
            </div>
          </div>
        )}

        {/* Text content */}
        {(hasTitle || hasSubtitle) && (
          <div
            className={textContentClassName}
          >
            {hasTitle && (
              <div className={styles.titleTextView}>{title}</div>
            )}
            {hasSubtitle && (
              <div className={styles.subtitleTextView}>{subtitle}</div>
            )}
          </div>
        )}
      </div>
    );
  }
));
