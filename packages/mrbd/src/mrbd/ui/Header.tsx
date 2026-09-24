/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Header component for Meta Ray-Ban Display
 *
 * A header component that can be used to display a title and optional avatar.
 * Uses Chip internally for content rendering.
 *
 * Features:
 * - Text display with optional metadata
 * - Optional icon (IconSource)
 * - Optional avatar with configurable size
 * - Loading state support
 * - Non-interactive (display only)
 * - Accessibility: heading role with combined text/metadata label
 */

import {
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react';
import { Chip, ChipStyle } from './Chip';
import { getHeaderContentDescription } from './private/HeaderAccessibility';
import { headerAvatarSizeToChipAvatarSize } from './private/HeaderAdapters';
import { HeaderAvatarSize, type HeaderHandle, type HeaderProps } from './Header.types';
import styles from './Header.module.css';

export { HeaderAvatarSize } from './Header.types';
export type { HeaderHandle, HeaderProps } from './Header.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * Header component
 * Page header with text and optional metadata, icon, or avatar.
 * Uses Chip with EMPHASIZED style internally.
 *
 * Usage:
 * ```tsx
 * <Header text="Page Title" />
 * <Header text="With Metadata" metadata="3 items" />
 * <Header text="With Icon" icon={notificationIcon} />
 * <Header text="With Avatar" showAvatar avatarSrc="/profile.jpg" />
 * ```
 */
export const Header = memo(forwardRef<HeaderHandle, HeaderProps>(
  function Header(
    {
      text,
      maxLines = 1,
      metadata,
      icon,
      showAvatar = false,
      avatarSrc,
      avatarPrimaryContent,
      avatarSecondarySrc,
      avatarSecondaryContent,
      avatarBadgeSrc,
      avatarBadgeContent,
      avatarAlt,
      avatarSize = HeaderAvatarSize.SMALL,
      statusIndicator,
      statusIndicatorIcon,
      primaryImageShape,
      placeholderStyle,
      isLoading = false,
      className = '',
      style = DEFAULT_STYLE,
      'aria-label': ariaLabel,
    },
    ref
  ) {
    /**
     * Build the accessible label.
     * - If explicit aria-label provided, use that
     * - Otherwise combine text + metadata
     */
    const contentDescription = useMemo(
      () => getHeaderContentDescription({
        ariaLabel,
        text,
        metadata,
        // The status indicator only shows on the avatar; describe it only then.
        statusIndicator: showAvatar ? statusIndicator : undefined,
      }),
      [ariaLabel, text, metadata, showAvatar, statusIndicator],
    );
    const rootClassName = useMemo(
      () => `${styles.header} ${className}`,
      [className],
    );
    const chipAvatarSize = useMemo(
      () => headerAvatarSizeToChipAvatarSize(avatarSize),
      [avatarSize],
    );

    const rootRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(
      ref,
      (): HeaderHandle => ({
        getHeaderHeight(): number {
          const node = rootRef.current;
          if (node == null) {
            return 0;
          }
          const measured = node.getBoundingClientRect().height;
          return measured > 0 ? measured : node.offsetHeight;
        },
        getElement: () => rootRef.current,
      }),
      [],
    );

    return (
      <div
        ref={rootRef}
        className={rootClassName}
        style={style}
        role="heading"
        aria-level={1}
        aria-label={contentDescription}
      >
        <div className={styles.headerContent}>
          <Chip
            text={text}
            maxLines={maxLines}
            metadata={metadata}
            icon={icon}
            showAvatar={showAvatar}
            avatarSrc={avatarSrc}
            avatarPrimaryContent={avatarPrimaryContent}
            avatarSecondarySrc={avatarSecondarySrc}
            avatarSecondaryContent={avatarSecondaryContent}
            avatarBadgeSrc={avatarBadgeSrc}
            avatarBadgeContent={avatarBadgeContent}
            avatarAlt={avatarAlt}
            avatarSize={chipAvatarSize}
            statusIndicator={statusIndicator}
            statusIndicatorIcon={statusIndicatorIcon}
            primaryImageShape={primaryImageShape}
            placeholderStyle={placeholderStyle}
            chipStyle={ChipStyle.EMPHASIZED}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }
));
