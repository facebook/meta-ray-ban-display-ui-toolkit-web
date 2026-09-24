/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  FocusEvent,
  FocusEventHandler,
  KeyboardEventHandler,
  ReactNode,
  Ref,
  UIEventHandler,
} from 'react';
import {
  memo,
  useCallback,
  useMemo,
} from 'react';
import { useCarouselPaginationPresentation } from '../CarouselPaginationPresentation';
import type { PaginationMode } from '../Carousel.types';
import {
  getCarouselItemStyle,
  getCarouselPaginationClassName,
  getCarouselPaginationStyle,
} from './CarouselLayout';
import {
  CarouselIndicatorPlacement,
} from '../Carousel.types';
import type { FadingEdgeOverlayStyles } from './FadingEdges';
import styles from '../Carousel.module.css';

type CarouselPaginationStyleClasses = Parameters<
  typeof getCarouselPaginationClassName
>[0]['styles'];

interface CarouselFrameProps {
  rootRef: Ref<HTMLDivElement>;
  scrollAreaRef: Ref<HTMLDivElement>;
  items: ReactNode[];
  itemCount: number;
  currentIndex: number;
  itemGap: number;
  edgeOffsets: {
    start: number;
    end: number;
  };
  containerClassName: string;
  style: CSSProperties;
  ariaLabel?: string;
  alignmentClass: string;
  fadingEdgeOverlayStyles: FadingEdgeOverlayStyles;
  tabIndex: number;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onScrollAreaFocus: FocusEventHandler<HTMLDivElement>;
  onScroll: UIEventHandler<HTMLDivElement>;
  setItemRef: (index: number) => (el: HTMLDivElement | null) => void;
  onItemFocus: (index: number, event: FocusEvent<HTMLDivElement>) => void;
  shouldShowPagination: boolean;
  indicatorPlacement: CarouselIndicatorPlacement;
  overlayDistance: number;
  paginationMode: PaginationMode;
  /**
   * Current dot/page fed to the pagination indicator. Distinct from
   * `currentIndex` (the centered carousel item) so a
   * `progressIndicatorCustomizationOverride` can remap it.
   */
  indicatorCurrentIndex: number;
  /**
   * Total dot/page count fed to the pagination indicator. Distinct from
   * `itemCount` so a `progressIndicatorCustomizationOverride` can remap it.
   */
  indicatorItemCount: number;
}

interface CarouselFrameItemProps {
  item: ReactNode;
  index: number;
  itemCount: number;
  currentIndex: number;
  edgeOffsets: {
    start: number;
    end: number;
  };
  itemGap: number;
  setItemRef: (index: number) => (el: HTMLDivElement | null) => void;
  onItemFocus: (index: number, event: FocusEvent<HTMLDivElement>) => void;
}

const CarouselFrameItem = memo(function CarouselFrameItem({
  item,
  index,
  itemCount,
  currentIndex,
  edgeOffsets,
  itemGap,
  setItemRef,
  onItemFocus,
}: CarouselFrameItemProps) {
  const itemStyle = useMemo(
    () => getCarouselItemStyle({
      index,
      itemCount,
      edgeOffsets,
      itemGap,
    }),
    [index, itemCount, edgeOffsets, itemGap],
  );
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => onItemFocus(index, event),
    [index, onItemFocus],
  );

  return (
    <div
      ref={setItemRef(index)}
      className={styles.item}
      style={itemStyle}
      tabIndex={0}
      role="listitem"
      aria-label={`Item ${index + 1} of ${itemCount}`}
      data-item-index={index}
      data-centered={index === currentIndex ? 'true' : 'false'}
      onFocus={handleFocus}
    >
      {item}
    </div>
  );
});

/**
 * Render-only Carousel frame: root region, focusable scroll list, item slots,
 * and optional pagination indicator.
 */
export const CarouselFrame = memo(function CarouselFrame({
  rootRef,
  scrollAreaRef,
  items,
  itemCount,
  currentIndex,
  itemGap,
  edgeOffsets,
  containerClassName,
  style,
  ariaLabel,
  alignmentClass,
  fadingEdgeOverlayStyles,
  tabIndex,
  onKeyDown,
  onScrollAreaFocus,
  onScroll,
  setItemRef,
  onItemFocus,
  shouldShowPagination,
  indicatorPlacement,
  overlayDistance,
  paginationMode,
  indicatorCurrentIndex,
  indicatorItemCount,
}: CarouselFrameProps) {
  const PaginationPresentation = useCarouselPaginationPresentation();
  const scrollAreaClassName = useMemo(
    () => `${styles.scrollArea} ${alignmentClass}`,
    [alignmentClass],
  );
  const paginationClassName = useMemo(
    () => getCarouselPaginationClassName({
      indicatorPlacement,
      paginationMode,
      styles: styles as CarouselPaginationStyleClasses,
    }),
    [indicatorPlacement, paginationMode],
  );
  const paginationStyle = useMemo(
    () => getCarouselPaginationStyle({
      indicatorPlacement,
      overlayDistance,
    }),
    [indicatorPlacement, overlayDistance],
  );

  return (
    <div
      ref={rootRef}
      className={containerClassName}
      style={style}
      role="region"
      aria-label={ariaLabel ?? 'Carousel'}
      aria-roledescription="carousel"
      data-item-count={itemCount}
      data-current-item={currentIndex}
    >
      <div
        ref={scrollAreaRef}
        className={scrollAreaClassName}
        data-scroll-view="true"
        tabIndex={tabIndex}
        role="list"
        onKeyDown={onKeyDown}
        onFocus={onScrollAreaFocus}
        onScroll={onScroll}
      >
        <div className={styles.track}>
          {items.map((item, index) => (
            <CarouselFrameItem
              key={index}
              item={item}
              index={index}
              itemCount={itemCount}
              currentIndex={currentIndex}
              edgeOffsets={edgeOffsets}
              itemGap={itemGap}
              setItemRef={setItemRef}
              onItemFocus={onItemFocus}
            />
          ))}
        </div>
      </div>

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

      {shouldShowPagination && (
        <div className={paginationClassName} style={paginationStyle}>
          <PaginationPresentation
            mode={paginationMode}
            pageCount={indicatorItemCount}
            currentPage={indicatorCurrentIndex}
          />
        </div>
      )}
    </div>
  );
});
