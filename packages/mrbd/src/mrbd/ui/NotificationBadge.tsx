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
import type { NotificationBadgeProps } from './NotificationBadge.types';
import styles from './NotificationBadge.module.css';

export type { NotificationBadgeProps } from './NotificationBadge.types';
const DEFAULT_NOTIFICATION_BADGE_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

/** A compact, non-interactive notification label with a fixed 32 px height. */
export const NotificationBadge = memo(forwardRef<
  HTMLDivElement,
  NotificationBadgeProps
>(function NotificationBadge({
  text = '',
  shapeProvider = DEFAULT_NOTIFICATION_BADGE_SHAPE_PROVIDER,
  className = '',
  ...htmlProps
}, ref) {
  const material = useMemo(createNotificationBadgeMaterial, []);

  return (
    <StaticContainer
      {...htmlProps}
      ref={ref}
      className={`${styles.badge} ${className}`}
      contentClassName={styles.content}
      width="fit-content"
      height={32}
      backgroundStyle={BackgroundStyle.PRIMARY}
      material={material}
      shapeProvider={shapeProvider}
      useSmoothCorners={false}
    >
      <TextView
        className={styles.label}
        textStyle={TextStyle.META2}
        textColor={TextColor.PRIMARY}
      >
        {text}
      </TextView>
    </StaticContainer>
  );
}));
