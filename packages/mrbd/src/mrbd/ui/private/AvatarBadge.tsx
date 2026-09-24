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
import type { StatusIndicatorType } from '../Avatar.types';
import {
  STATUS_INDICATOR_COLORS,
  STATUS_INDICATOR_LABELS,
} from './AvatarMetrics';
import { IconImage, type IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { getCSSVariable, ThemeAttribute } from '@wearables-ui-toolkit/foundation/theme/Theme';
import styles from '../Avatar.module.css';

export interface AvatarBadgeProps {
  showBadge: boolean;
  badgeSize: number;
  badgeInset: number;
  statusIndicator?: StatusIndicatorType;
  /**
   * Localized per-status label overrides, merged over the English defaults for
   * the status dot's `aria-label`. Omitted statuses fall back to
   * `STATUS_INDICATOR_LABELS`.
   */
  statusIndicatorLabels?: Partial<Record<StatusIndicatorType, string>>;
  statusIndicatorIcon?: IconSource;
  /**
   * Content for the image-badge slot. Ignored when `statusIndicator` is
   * set because status indicators use the dedicated dot renderer.
   */
  badgeContent?: ReactNode;
  badgeImageSrc?: string;
}

const STATUS_ICON_WRAPPER_STYLE: CSSProperties = {
  color: getCSSVariable(ThemeAttribute.COLOR_ICON_PRIMARY),
};

export const AvatarBadge = memo(function AvatarBadge({
  showBadge,
  badgeSize,
  badgeInset,
  statusIndicator,
  statusIndicatorLabels,
  statusIndicatorIcon,
  badgeContent,
  badgeImageSrc,
}: AvatarBadgeProps) {
  const badgeContainerStyle: CSSProperties = useMemo(
    () => ({
      width: badgeSize,
      height: badgeSize,
      right: badgeInset,
      bottom: badgeInset,
    }),
    [badgeInset, badgeSize],
  );
  const statusDotStyle: CSSProperties | undefined = useMemo(
    () => statusIndicator == null
      ? undefined
      : {
          width: badgeSize,
          height: badgeSize,
          backgroundColor: STATUS_INDICATOR_COLORS[statusIndicator],
        },
    [badgeSize, statusIndicator],
  );
  // Glyph drawn inside the dot, inset by statusIndicatorSize * 3/14 per side,
  // so a 28px dot yields a 16px glyph.
  const statusIconStyle: CSSProperties = useMemo(() => {
    const inset = Math.floor((badgeSize * 3) / 14);
    const glyph = badgeSize - inset * 2;
    return { width: glyph, height: glyph };
  }, [badgeSize]);
  if (!showBadge) {
    return null;
  }

  return (
    <div
      className={styles.badgeContainer}
      style={badgeContainerStyle}
      aria-hidden="true"
    >
      {statusIndicator != null ? (
        <div
          className={styles.statusDot}
          style={statusDotStyle}
          role="status"
          aria-label={
            statusIndicatorLabels?.[statusIndicator] ??
            STATUS_INDICATOR_LABELS[statusIndicator]
          }
        >
          {statusIndicatorIcon != null && (
            <div
              className={styles.statusIndicatorGlyph}
              style={STATUS_ICON_WRAPPER_STYLE}
            >
              <IconImage source={statusIndicatorIcon} style={statusIconStyle} />
            </div>
          )}
        </div>
      ) : (
        <div className={styles.badgeContent}>
          {badgeContent != null ? badgeContent : badgeImageSrc != null && (
            <IconImage source={{ uri: badgeImageSrc, tinted: false }} />
          )}
        </div>
      )}
    </div>
  );
});
