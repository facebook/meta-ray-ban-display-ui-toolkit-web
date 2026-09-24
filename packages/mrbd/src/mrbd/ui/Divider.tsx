/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Divider component for Meta Ray-Ban Display
 * Simple horizontal or vertical rule used as a visual separator between content.
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import {
  getDividerClassName,
  getDividerMergedStyle,
} from './private/DividerLayout';
import {
  DividerOrientation,
  type DividerProps,
} from './Divider.types';
import styles from './Divider.module.css';

export { DividerOrientation } from './Divider.types';
export type { DividerProps } from './Divider.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * Divider component
 * Renders as a 2px thick pill using the colorBorderPrimary theme color.
 * In HORIZONTAL mode (default), it is 2px tall and fills available width.
 * In VERTICAL mode, it is 2px wide and fills available height.
 */
export const Divider = memo(forwardRef<HTMLDivElement, DividerProps>(
  function Divider(
    {
      orientation = DividerOrientation.HORIZONTAL,
      className = '',
      style = DEFAULT_STYLE,
      ...rest
    },
    ref
  ) {
    const dividerStyle = useMemo(
      () => getDividerMergedStyle({ orientation, style }),
      [orientation, style],
    );
    const dividerClassName = useMemo(
      () => getDividerClassName(styles.divider, className),
      [className],
    );

    return (
      <div
        {...rest}
        ref={ref}
        className={dividerClassName}
        style={dividerStyle}
        aria-hidden="true"
      />
    );
  }
));
