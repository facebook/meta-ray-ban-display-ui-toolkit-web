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
import { ScrollViewOrientation } from '../ScrollView.types';
import type { FadingEdgeOverlayStyles } from './FadingEdges';
import styles from '../ScrollView.module.css';

interface ScrollViewFrameProps {
  children?: ReactNode;
  className: string;
  scrollContainerClassName: string;
  frameStyle: CSSProperties;
  scrollRef: Ref<HTMLDivElement>;
  scrollViewStyle: CSSProperties;
  orientation: ScrollViewOrientation;
  tabIndex: number;
  ariaLabel?: string;
  onScroll: UIEventHandler<HTMLDivElement>;
  onFocus: FocusEventHandler<HTMLDivElement>;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  isScrollbarEnabled: boolean;
  contentOverflows: boolean;
  fadingEdgeOverlayStyles: FadingEdgeOverlayStyles;
  scrollbarVisible: boolean;
  scrollbarTrackStyle: CSSProperties;
  scrollbarHandleStyle: CSSProperties;
}

/**
 * Render-only ScrollView frame: viewport, content slot, and floating scrollbar.
 * Scroll behavior and state calculation stay in ScrollView.
 */
export const ScrollViewFrame = memo(function ScrollViewFrame({
  children,
  className,
  scrollContainerClassName,
  frameStyle,
  scrollRef,
  scrollViewStyle,
  orientation,
  tabIndex,
  ariaLabel,
  onScroll,
  onFocus,
  onKeyDown,
  isScrollbarEnabled,
  contentOverflows,
  fadingEdgeOverlayStyles,
  scrollbarVisible,
  scrollbarTrackStyle,
  scrollbarHandleStyle,
}: ScrollViewFrameProps) {
  const frameClassName = useMemo(
    () => `${styles.scrollViewFrame} ${className}`,
    [className],
  );
  const scrollViewClassName = useMemo(
    () => `${styles.scrollView} ${scrollContainerClassName}`,
    [scrollContainerClassName],
  );
  return (
    <div
      className={frameClassName}
      style={frameStyle}
      data-axis={orientation}
    >
      <div
        ref={scrollRef}
        className={scrollViewClassName}
        style={scrollViewStyle}
        data-axis={orientation}
        data-scroll-view="true"
        data-uit-focus-section="true"
        tabIndex={tabIndex}
        role="region"
        aria-label={ariaLabel}
        onScroll={onScroll}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      >
        <div
          className={styles.content}
          data-axis={orientation}
          data-uit-focus-boundary-root="true"
        >
          {children}
        </div>
      </div>

      <div
        className={styles.fadingEdge}
        data-edge="top"
        style={fadingEdgeOverlayStyles.top}
        aria-hidden="true"
      />
      <div
        className={styles.fadingEdge}
        data-edge="bottom"
        style={fadingEdgeOverlayStyles.bottom}
        aria-hidden="true"
      />
      <div
        className={styles.fadingEdge}
        data-edge="left"
        style={fadingEdgeOverlayStyles.left}
        aria-hidden="true"
      />
      <div
        className={styles.fadingEdge}
        data-edge="right"
        style={fadingEdgeOverlayStyles.right}
        aria-hidden="true"
      />

      {isScrollbarEnabled && contentOverflows && (
        <div
          className={styles.scrollbarContainer}
          data-axis={orientation}
          data-visible={scrollbarVisible ? 'true' : 'false'}
          aria-hidden="true"
        >
          <div className={styles.scrollbarTrack} style={scrollbarTrackStyle} />
          <div className={styles.scrollbarHandle} style={scrollbarHandleStyle} />
        </div>
      )}
    </div>
  );
});
