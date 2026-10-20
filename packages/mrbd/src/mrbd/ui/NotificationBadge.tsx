/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  forwardRef,
  memo,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react';
import {
  BackgroundStyle,
  StaticContainer,
} from '@wearables-ui-toolkit/foundation';
import {
  TextColor,
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/foundation/components/TextView';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { createNotificationBadgeMaterial } from './private/BadgeMaterials';
import {useBadgeGlyphCentering} from './private/useBadgeGlyphCentering';
import type { NotificationBadgeProps } from './NotificationBadge.types';
import styles from './NotificationBadge.module.css';

export type { NotificationBadgeProps } from './NotificationBadge.types';
const MIN_NOTIFICATION_BADGE_SIZE = 32;
const DEFAULT_STYLE: CSSProperties = {};
const DEFAULT_NOTIFICATION_BADGE_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

/** A compact, non-interactive notification label with content-aware sizing. */
export const NotificationBadge = memo(forwardRef<
  HTMLDivElement,
  NotificationBadgeProps
>(function NotificationBadge({
  text = '',
  shapeProvider = DEFAULT_NOTIFICATION_BADGE_SHAPE_PROVIDER,
  className = '',
  style = DEFAULT_STYLE,
  ...htmlProps
}, ref) {
  const labelRef = useRef<HTMLSpanElement>(null);
  useBadgeGlyphCentering(labelRef, text, style, className);
  const material = useMemo(createNotificationBadgeMaterial, []);
  const badgeStyle = useMemo(
    () => ({ ...style, minWidth: style.minWidth ?? MIN_NOTIFICATION_BADGE_SIZE }),
    [style],
  );
  const isDigitCount = typeof text === 'number'
    ? Number.isInteger(text) && text >= 0
    : typeof text === 'string' && /^\d+\+?$/.test(text);

  return (
    <StaticContainer
      {...htmlProps}
      ref={ref}
      className={`${styles.badge} ${className}`}
      contentClassName={styles.content}
      width="fit-content"
      height={MIN_NOTIFICATION_BADGE_SIZE}
      style={badgeStyle}
      backgroundStyle={BackgroundStyle.PRIMARY}
      material={material}
      shapeProvider={shapeProvider}
      useSmoothCorners={false}
    >
      <TextView
        ref={labelRef}
        className={`${styles.label} ${isDigitCount ? styles.digitLabel : ''}`}
        textStyle={TextStyle.META2}
        textColor={TextColor.PRIMARY}
      >
        {text}
      </TextView>
    </StaticContainer>
  );
}));
