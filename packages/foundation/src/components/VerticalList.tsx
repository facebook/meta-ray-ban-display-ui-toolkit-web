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
} from 'react';
import { ScrollView } from './ScrollView';
import type { VerticalListProps } from './VerticalList.types';
import styles from './VerticalList.module.css';

export type { VerticalListProps } from './VerticalList.types';

/**
 * The required host for a vertically scrolling collection of list rows.
 *
 * The scroll viewport remains full width while the row container applies the
 * list edge spacing. Header and fading-edge behavior are provided by
 * `ScrollView`.
 */
export const VerticalList = memo(forwardRef<HTMLDivElement, VerticalListProps>(
  function VerticalList(
    {
      children,
      contentClassName = '',
      contentStyle,
      ...scrollViewProps
    },
    ref,
  ) {
    const contentClasses = [styles.content, contentClassName]
      .filter(Boolean)
      .join(' ');

    return (
      <ScrollView ref={ref} {...scrollViewProps}>
        <div
          className={contentClasses}
          data-uit-focus-boundary-root="true"
          style={contentStyle}
        >
          {children}
        </div>
      </ScrollView>
    );
  },
));
