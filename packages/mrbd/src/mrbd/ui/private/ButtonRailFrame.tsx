/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  FocusEventHandler,
  KeyboardEventHandler,
  ReactNode,
  Ref,
  UIEventHandler,
} from 'react';
import {
  memo,
  useMemo,
} from 'react';
import { BUTTON_RAIL_FADING_EDGE_LENGTH } from './ButtonRailMetrics';
import styles from '../ButtonRail.module.css';

interface ButtonRailFrameProps {
  children?: ReactNode;
  outerRef: Ref<HTMLDivElement>;
  innerRef: Ref<HTMLDivElement>;
  className: string;
  style: CSSProperties;
  innerStyle: CSSProperties;
  showLeftFade: boolean;
  showRightFade: boolean;
  onScroll: UIEventHandler<HTMLDivElement>;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onFocus: FocusEventHandler<HTMLDivElement>;
  onBlur: FocusEventHandler<HTMLDivElement>;
}

/**
 * Render-only ButtonRail shell: viewport, fading edges, and translated inner row.
 * ButtonRail owns focus navigation and translation calculations.
 */
export const ButtonRailFrame = memo(function ButtonRailFrame({
  children,
  outerRef,
  innerRef,
  className,
  style,
  innerStyle,
  showLeftFade,
  showRightFade,
  onScroll,
  onKeyDown,
  onFocus,
  onBlur,
}: ButtonRailFrameProps) {
  const outerStyle = useMemo(
    () => ({
      ['--fading-edge-length' as string]: `${BUTTON_RAIL_FADING_EDGE_LENGTH}px`,
      ...style,
    }),
    [style],
  );

  return (
    <div
      ref={outerRef}
      className={`${styles.buttonRail} ${className}`}
      style={outerStyle}
      role="group"
      aria-label="Button rail"
      // The rail clips with `overflow: hidden` and scrolls horizontally via a
      // transform on its inner track. This marker tells geometric focus
      // navigation the X axis is scrollable so children currently scrolled
      // off-clip stay focus-eligible (see getOverflowAxes).
      data-uit-focus-scrollable="x"
      onScroll={onScroll}
    >
      <div
        className={`${styles.fadingEdgeLeft} ${showLeftFade ? styles.visible : ''}`}
        aria-hidden="true"
      />

      <div
        ref={innerRef}
        className={styles.buttonRailInner}
        style={innerStyle}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {children}
      </div>

      <div
        className={`${styles.fadingEdgeRight} ${showRightFade ? styles.visible : ''}`}
        aria-hidden="true"
      />
    </div>
  );
});
