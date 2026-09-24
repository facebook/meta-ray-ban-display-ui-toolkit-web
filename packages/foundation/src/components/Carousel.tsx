/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Carousel component
 *
 * Horizontal scrolling container for traversable content (e.g., Gallery,
 * Notifications, Music). Items center-snap on focus and keyboard navigation.
 *
 * Features:
 * - Horizontal scrolling with center-snapping
 * - Left/Right arrow key navigation between items
 * - Configurable gap between items
 * - Optional pagination indicator (TEXT or DOTS mode)
 * - Vertical alignment: CENTER or BOTTOM
 * - Indicator placement: UNDER or BOTTOM_OVERLAY
 * - Focus management for d-pad navigation (no touch)
 *
 * Usage:
 * ```tsx
 * <Carousel
 *   itemGap={24}
 *   showPagination={true}
 *   paginationMode={PaginationMode.DOTS}
 *   onItemCentered={(index) => console.log('Centered:', index)}
 * >
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Carousel>
 * ```
 */

import {
  forwardRef,
  memo,
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  useMemo,
  type CSSProperties,
  type KeyboardEvent,
  type FocusEvent,
  Children,
} from 'react';
import { PaginationMode } from './Carousel.types';
import styles from './Carousel.module.css';
import {
  DEFAULT_CAROUSEL_FADING_EDGE_LENGTH,
  DEFAULT_CAROUSEL_ITEM_GAP,
  DEFAULT_CAROUSEL_OVERLAY_DISTANCE,
  getCarouselAlignmentClass,
  getCarouselClassName,
  getCarouselFadingEdgeOverlayStyles,
  getCarouselIndexForKey,
  getCarouselScrollTarget,
  getFirstCarouselFocusableDescendant,
  isCarouselIndexInRange,
  shouldShowCarouselPagination,
} from './private/CarouselLayout';
import {
  CarouselIndicatorPlacement,
  CarouselVerticalAlignment,
} from './Carousel.types';
import type { CarouselHandle, CarouselProps } from './Carousel.types';
import { useCarouselLayoutState } from './private/useCarouselLayoutState';
import { CarouselFrame } from './private/CarouselFrame';

export {
  CarouselIndicatorPlacement,
  CarouselVerticalAlignment,
  PaginationMode,
} from './Carousel.types';
export type { CarouselHandle, CarouselProps, ProgressIndicatorCustomization } from './Carousel.types';

const DEFAULT_STYLE: CSSProperties = {};
type CarouselAlignmentStyleClasses = {
  alignBottom: string;
  alignCenter: string;
};
type CarouselRootStyleClasses = {
  carousel: string;
};

// ============================================================================
// Component
// ============================================================================

/**
 * Carousel component
 * Horizontally scrollable container with center-snapping items.
 *
 * Navigation:
 * - Left/Right arrow keys move between items
 * - Items are center-snapped on focus
 * - Focus wrapping is prevented at boundaries
 *
 * The carousel manages focus and scroll position internally. Each item
 * is individually focusable for d-pad/keyboard navigation.
 */
export const Carousel = memo(forwardRef<CarouselHandle, CarouselProps>(
  function Carousel(
    {
      children,
      itemGap = DEFAULT_CAROUSEL_ITEM_GAP,
      onItemCentered,
      showPagination = true,
      paginationMode = PaginationMode.TEXT,
      verticalAlignment = CarouselVerticalAlignment.CENTER,
      indicatorPlacement = CarouselIndicatorPlacement.UNDER,
      overlayDistance = DEFAULT_CAROUSEL_OVERLAY_DISTANCE,
      initialIndex = 0,
      fadingEdgeLength = DEFAULT_CAROUSEL_FADING_EDGE_LENGTH,
      className = '',
      style = DEFAULT_STYLE,
      ariaLabel,
      tabIndex = 0,
      progressIndicatorCustomizationOverride,
    },
    ref
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Resolve children into an array of items
    const items = useMemo(() => Children.toArray(children), [children]);
    const itemCount = items.length;
    const {
      edgeOffsets,
      scrollMetrics,
      updateScrollMetrics,
    } = useCarouselLayoutState({
      scrollAreaRef,
      itemRefs,
      items,
      itemCount,
    });

    /**
     * Scroll to center an item at the given index.
     */
    const scrollToItem = useCallback(
      (index: number, smooth: boolean = true) => {
        const scrollArea = scrollAreaRef.current;
        const itemEl = itemRefs.current[index];
        if (!scrollArea || !itemEl) return;

        scrollArea.scrollTo({
          left: getCarouselScrollTarget(scrollArea, itemEl),
          behavior: smooth ? 'smooth' : 'auto',
        });
      },
      []
    );

    /**
     * Focus and center an item.
     */
    const focusItem = useCallback(
      (index: number, smooth: boolean = true) => {
        if (!isCarouselIndexInRange(index, itemCount)) return;

        setCurrentIndex(index);
        onItemCentered?.(index);

        const itemEl = itemRefs.current[index];
        if (itemEl) {
          itemEl.focus({ preventScroll: true });
          scrollToItem(index, smooth);
        }
      },
      [itemCount, onItemCentered, scrollToItem]
    );

    /**
     * Initialize: scroll to initial index on mount.
     */
    useEffect(() => {
      if (initialIndex > 0 && initialIndex < itemCount) {
        // rAF defers the scroll until after layout so item offsets are measured.
        const rafId = requestAnimationFrame(() => {
          scrollToItem(initialIndex, false);
        });
        return () => cancelAnimationFrame(rafId);
      }
      return undefined;
      // Intentionally mount-only: initialIndex is the *initial* position and must
      // not re-scroll when itemCount/scrollToItem change after mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (itemCount === 0) return;
      if (currentIndex >= itemCount) {
        setCurrentIndex(itemCount - 1);
        requestAnimationFrame(() => scrollToItem(itemCount - 1, false));
      }
    }, [currentIndex, itemCount, scrollToItem]);

    /**
     * Handle keyboard navigation.
     * - Prevents wrapping at boundaries (returns current focus)
     * - Left/Right arrows navigate between items
     */
    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        const nextIndex = getCarouselIndexForKey(
          event.key,
          currentIndex,
          itemCount,
        );

        if (nextIndex != null) {
          event.preventDefault();
          event.stopPropagation();
          focusItem(nextIndex);
        }
      },
      [currentIndex, itemCount, focusItem]
    );

    /**
     * Handle individual item focus.
     * When an item receives focus (via keyboard or programmatic focus),
     * update the centered index and scroll.
     */
    const handleItemFocus = useCallback(
      (index: number, event?: FocusEvent<HTMLDivElement>) => {
        if (event != null && event.target === event.currentTarget) {
          const focusableChild = getFirstCarouselFocusableDescendant(event.currentTarget);
          if (focusableChild != null) {
            focusableChild.focus({ preventScroll: true });
            return;
          }
        }

        if (index !== currentIndex) {
          setCurrentIndex(index);
          onItemCentered?.(index);
        }
        scrollToItem(index);
      },
      [currentIndex, onItemCentered, scrollToItem]
    );

    /**
     * Directional focus can enter through the focusable scroll surface itself.
     * In that case focus is immediately resolved to the centered child instead
     * of being left on the invisible list.
     */
    const handleScrollAreaFocus = useCallback(
      (event: FocusEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        focusItem(currentIndex, false);
      },
      [currentIndex, focusItem],
    );

    /**
     * Set up item ref at a specific index.
     */
    const setItemRef = useCallback(
      (index: number) => (el: HTMLDivElement | null) => {
        itemRefs.current[index] = el;
      },
      []
    );

    // Resolve the optional progress-indicator customization for the active
    // index. Invokes the override with the active position and item count and
    // threads the result into the indicator's current/total/visibility.
    const progressCustomization = useMemo(
      () => progressIndicatorCustomizationOverride?.(currentIndex, itemCount),
      [progressIndicatorCustomizationOverride, currentIndex, itemCount],
    );

    // The dot/page values fed to the indicator. Defaults to the carousel's
    // active index + item count; overridden by the customization's
    // `currentIndex` / `totalItems` when present.
    const indicatorCurrentIndex = progressCustomization?.currentIndex ?? currentIndex;
    const indicatorItemCount = progressCustomization?.totalItems ?? itemCount;

    // Pagination visibility logic for the progress indicator.
    const shouldShowPagination = useMemo(
      () => {
        // When a customization is provided, its `isVisible` gates the indicator.
        if (progressCustomization != null && !progressCustomization.isVisible) {
          return false;
        }
        return shouldShowCarouselPagination(
          showPagination,
          indicatorItemCount,
          paginationMode,
        );
      },
      [progressCustomization, indicatorItemCount, paginationMode, showPagination],
    );

    // Track alignment class
    const alignmentClass = useMemo(
      () => getCarouselAlignmentClass(
        verticalAlignment,
        styles as CarouselAlignmentStyleClasses,
      ),
      [verticalAlignment],
    );
    const fadingEdgeOverlayStyles = useMemo(
      () => getCarouselFadingEdgeOverlayStyles(
        scrollMetrics,
        fadingEdgeLength,
      ),
      [fadingEdgeLength, scrollMetrics],
    );

    // Container class
    const containerClassName = useMemo(
      () => getCarouselClassName(styles as CarouselRootStyleClasses, className),
      [className],
    );

    // Imperative `scrollToPosition` handle. It reuses the same focus/scroll
    // logic the component applies for `initialIndex` (via `focusItem`), so a
    // programmatic scroll also centers and focuses the target item and fires
    // `onItemCentered`.
    useImperativeHandle(
      ref,
      () => ({
        scrollToPosition: (index: number) => {
          focusItem(index, false);
        },
        getRootElement: () => rootRef.current,
      }),
      [focusItem],
    );

    return (
      <CarouselFrame
        rootRef={rootRef}
        scrollAreaRef={scrollAreaRef}
        items={items}
        itemCount={itemCount}
        currentIndex={currentIndex}
        itemGap={itemGap}
        edgeOffsets={edgeOffsets}
        containerClassName={containerClassName}
        style={style}
        ariaLabel={ariaLabel}
        alignmentClass={alignmentClass}
        fadingEdgeOverlayStyles={fadingEdgeOverlayStyles}
        tabIndex={tabIndex}
        onKeyDown={handleKeyDown}
        onScrollAreaFocus={handleScrollAreaFocus}
        onScroll={updateScrollMetrics}
        setItemRef={setItemRef}
        onItemFocus={handleItemFocus}
        shouldShowPagination={shouldShowPagination}
        indicatorPlacement={indicatorPlacement}
        overlayDistance={overlayDistance}
        paginationMode={paginationMode}
        indicatorCurrentIndex={indicatorCurrentIndex}
        indicatorItemCount={indicatorItemCount}
      />
    );
  }
));
