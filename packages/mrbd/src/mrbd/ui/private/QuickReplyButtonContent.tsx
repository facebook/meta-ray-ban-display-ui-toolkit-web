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
  type Ref,
} from 'react';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import styles from '../QuickReplyButton.module.css';

interface QuickReplyButtonContentProps {
  contentViewContainerRef: Ref<HTMLDivElement>;
  contentViewRef: Ref<HTMLDivElement>;
  titleRef: Ref<HTMLDivElement>;
  contentViewContainerStyle: CSSProperties;
  contentViewStyle: CSSProperties;
  title?: string;
  icon?: IconSource;
  hasText: boolean;
  hasIcon: boolean;
  isExpanded: boolean;
  iconAlpha: number;
}

/**
 * QuickReplyButton content viewport: clipped outer width container plus
 * natural-width text/icon row.
 */
export const QuickReplyButtonContent = memo(function QuickReplyButtonContent({
  contentViewContainerRef,
  contentViewRef,
  titleRef,
  contentViewContainerStyle,
  contentViewStyle,
  title,
  icon,
  hasText,
  hasIcon,
  isExpanded,
  iconAlpha,
}: QuickReplyButtonContentProps) {
  const textColorClass = isExpanded ? styles.titleExpanded : styles.titleDefault;
  const iconColorClass = isExpanded ? styles.iconExpanded : styles.iconDefault;
  const iconStyle = useMemo(
    () => ({
      opacity: iconAlpha,
      transition: 'none',
    }),
    [iconAlpha],
  );

  return (
    <div
      className={styles.contentViewContainer}
      style={contentViewContainerStyle}
      ref={contentViewContainerRef}
    >
      <div
        className={styles.contentView}
        style={contentViewStyle}
        ref={contentViewRef}
      >
        {hasText && (
          <div
            ref={titleRef}
            className={`${styles.titleLabel} ${textColorClass}`}
          >
            {title}
          </div>
        )}

        {hasIcon && (
          <div
            className={`${styles.iconImageView} ${hasText ? styles.iconImageViewWithText : ''} ${iconColorClass}`}
            style={iconStyle}
          >
            {icon != null && <IconImage source={icon} />}
          </div>
        )}
      </div>
    </div>
  );
});
