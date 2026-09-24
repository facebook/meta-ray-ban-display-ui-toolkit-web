/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ButtonDivider component for Meta Ray-Ban Display
 *
 * A visual separator for use between Buttons or similar elements in a
 * ButtonGroup or ButtonRail. Implements the `Sizable` layout contract.
 *
 * The pill-shaped divider uses the colorBorderPrimary theme token and
 * includes built-in horizontal margins (8px, --uit-spacing-small).
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import {
  getButtonDividerClassName,
  getButtonDividerContainerStyle,
  getButtonDividerGroupItemHeight,
  getButtonDividerPillStyle,
} from './private/ButtonDividerLayout';
import type { ButtonDividerProps } from './ButtonDivider.types';
import styles from './ButtonDivider.module.css';

export type { ButtonDividerProps } from './ButtonDivider.types';

const DEFAULT_STYLE: CSSProperties = {};

// ---------- Component ----------

/**
 * ButtonDivider
 *
 * A pill-shaped vertical divider for ButtonGroup/ButtonRail.
 * Not interactive, not focusable, hidden from accessibility tree.
 */
export const ButtonDivider = memo(forwardRef<HTMLDivElement, ButtonDividerProps>(
  function ButtonDivider(
    {
      className = '',
      style = DEFAULT_STYLE,
    },
    ref,
  ) {
    const containerStyle = useMemo(
      () => getButtonDividerContainerStyle(style),
      [style],
    );
    const pillStyle = useMemo(() => getButtonDividerPillStyle(), []);
    const buttonDividerClassName = useMemo(
      () => getButtonDividerClassName(
        styles.buttonDivider,
        className,
      ),
      [className],
    );
    const buttonGroupItemHeight = useMemo(
      () => getButtonDividerGroupItemHeight(),
      [],
    );

    return (
      <div
        ref={ref}
        className={buttonDividerClassName}
        style={containerStyle}
        data-uit-button-group-item-height={buttonGroupItemHeight}
        aria-hidden="true"
      >
        <div className={styles.pill} style={pillStyle} />
      </div>
    );
  },
));
