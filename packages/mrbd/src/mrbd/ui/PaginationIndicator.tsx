/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * PaginationIndicator component for Meta Ray-Ban Display
 *
 * Shows current page position in a paginated view.
 * Two modes:
 * - TEXT: Displays "2 of 5" style text in a chip
 * - DOTS: Dot indicators with active highlight, overflow dots, and animated transitions
 *
 * Props: mode, pageCount, currentPage
 */

import {
  forwardRef,
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import { Chip } from './Chip';
import {
  calculatePaginationDotStates,
  calculatePaginationVisibleWindow,
  getPaginationContainerClassName,
  getPaginationDotStyle,
  getPaginationDotsContainerStyle,
  getPaginationText,
} from './private/PaginationIndicatorLayout';
import { PaginationMode } from './PaginationIndicator.types';
import type { PaginationIndicatorProps } from './PaginationIndicator.types';
import styles from './PaginationIndicator.module.css';
// Text style classes are global (loaded via theme.css @import)

export { PaginationMode } from './PaginationIndicator.types';
export type { PaginationIndicatorProps } from './PaginationIndicator.types';

const EMPTY_PAGINATION_STYLE: CSSProperties = {};
const TEXT_CHIP_STYLE: CSSProperties = { pointerEvents: 'none' };

/**
 * PaginationIndicator component
 *
 * TEXT mode: renders a chip showing "currentPage of pageCount".
 * DOTS mode: renders animated dot indicators with a sliding window
 * for overflow pages.
 */
export const PaginationIndicator = memo(forwardRef<HTMLDivElement, PaginationIndicatorProps>(
  function PaginationIndicator(
    {
      mode = PaginationMode.TEXT,
      pageCount = 0,
      currentPage = 0,
      className = '',
      style = EMPTY_PAGINATION_STYLE,
      ...rest
    },
    ref
  ) {
    const containerClassName = useMemo(
      () => getPaginationContainerClassName(
        styles.paginationIndicator,
        className,
      ),
      [className],
    );

    if (mode === PaginationMode.TEXT) {
      return (
        <TextPaginationIndicator
          ref={ref}
          className={containerClassName}
          style={style}
          pageCount={pageCount}
          currentPage={currentPage}
          rootProps={rest}
        />
      );
    }

    return (
      <DotsPaginationIndicator
        ref={ref}
        className={containerClassName}
        style={style}
        pageCount={pageCount}
        currentPage={currentPage}
        rootProps={rest}
      />
    );
  }
));

/**
 * TEXT mode pagination indicator.
 * Displays "X / Y" text inside a real Chip component.
 *
 * Renders a centered Chip child with the default DEEMPHASIZED style.
 * Not focusable, not exposed to accessibility.
 * Text comes from the label format string ("X of Y").
 */
const TextPaginationIndicator = memo(forwardRef<
  HTMLDivElement,
  {
    pageCount: number;
    currentPage: number;
    className: string;
    style: CSSProperties;
    rootProps: HTMLAttributes<HTMLDivElement>;
  }
>(function TextPaginationIndicator({ pageCount, currentPage, className, style, rootProps }, ref) {
  if (pageCount <= 0) return null;

  const text = useMemo(
    () => getPaginationText(pageCount, currentPage),
    [currentPage, pageCount],
  );

  return (
    <div
      {...rootProps}
      ref={ref}
      className={className}
      style={style}
    >
      <Chip
        text={text}
        aria-hidden
        maxLines={1}
        style={TEXT_CHIP_STYLE}
      />
    </div>
  );
}));

/**
 * DOTS mode pagination indicator.
 * Renders animated dots with a sliding window for overflow pages.
 */
const DotsPaginationIndicator = memo(forwardRef<
  HTMLDivElement,
  {
    pageCount: number;
    currentPage: number;
    className: string;
    style: CSSProperties;
    rootProps: HTMLAttributes<HTMLDivElement>;
  }
>(function DotsPaginationIndicator({
  pageCount,
  currentPage,
  className,
  style,
  rootProps,
}, ref) {
  const windowStartRef = useRef(0);

  /**
   * Calculate the window start and visible dot indices.
   */
  const visibleWindow = useMemo(() => {
    return calculatePaginationVisibleWindow(
      pageCount,
      currentPage,
      windowStartRef.current,
    );
  }, [pageCount, currentPage]);
  const { visibleIndices, windowStart } = visibleWindow;

  useLayoutEffect(() => {
    windowStartRef.current = windowStart;
  }, [windowStart]);

  /**
   * Calculate dot states with positions.
   */
  const dotStates = useMemo(() => {
    return calculatePaginationDotStates({
      visibleIndices,
      windowStart,
      currentPage,
    });
  }, [visibleIndices, windowStart, currentPage]);

  const containerStyle = useMemo(
    () => getPaginationDotsContainerStyle(style),
    [style],
  );
  const rootClassName = useMemo(
    () => `${className} ${styles.dotsContainer}`,
    [className],
  );
  const dotElements = useMemo(
    () => dotStates.map((dot) => (
      <div
        key={dot.index}
        className={[
          styles.dot,
          dot.isActive ? styles.dotActive : '',
          dot.isOverflow ? styles.dotOverflow : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={getPaginationDotStyle(dot)}
      />
    )),
    [dotStates],
  );

  return (
    <div
      {...rootProps}
      ref={ref}
      className={rootClassName}
      style={containerStyle}
    >
      {dotElements}
    </div>
  );
}));
