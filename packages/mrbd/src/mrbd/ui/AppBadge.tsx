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
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import {
  BackgroundStyle,
  StaticContainer,
} from '@wearables-ui-toolkit/foundation';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { createAppBadgeMaterial } from './private/BadgeMaterials';
import type { AppBadgeProps } from './AppBadge.types';
import styles from './AppBadge.module.css';

export type { AppBadgeProps } from './AppBadge.types';
const DEFAULT_APP_BADGE_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

/** A fixed, non-interactive 32 px app-icon badge. */
export const AppBadge = memo(forwardRef<HTMLDivElement, AppBadgeProps>(
  function AppBadge({
    icon,
    shapeProvider = DEFAULT_APP_BADGE_SHAPE_PROVIDER,
    className = '',
    ...htmlProps
  }, ref) {
    const material = useMemo(createAppBadgeMaterial, []);

    return (
      <StaticContainer
        {...htmlProps}
        ref={ref}
        className={`${styles.badge} ${className}`}
        contentClassName={styles.content}
        width={32}
        height={32}
        backgroundStyle={BackgroundStyle.PRIMARY}
        material={material}
        shapeProvider={shapeProvider}
        useSmoothCorners={false}
      >
        {icon != null && (
          <IconImage source={icon} className={styles.icon} />
        )}
      </StaticContainer>
    );
  },
));
