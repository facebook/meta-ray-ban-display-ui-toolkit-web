/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ScrollView component
 * Scrollable container.
 *
 * Features:
 * - Custom scrollbar rendering (thin, themed)
 * - Fading edges at top/bottom using CSS mask-image gradients
 * - ArrowUp/ArrowDown keyboard scrolling
 * - Smooth scrolling behavior
 * - Header inset support
 */

import {
  forwardRef,
  memo,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  type CSSProperties,
  type KeyboardEvent,
  type FocusEvent,
} from 'react';
import {
  fitFocusSafeAreaInsets,
  getFadingEdgeOverlayStyles,
  isFocusSafeAreaScrollSuppressed,
  scrollElementIntoFadingEdgeSafeArea,
  scrollToFocusBoundary,
  type FadingEdgeLengths,
} from './private/FadingEdges';
import { FOCUS_NAVIGATION_HANDLED_EVENT } from '../base/InteractableBase';
import {
  FOCUS_SEARCH_FROM_ORIGIN_EVENT,
  FOCUS_BOUNDARY_ROOT_SELECTOR,
  SCROLL_VIEW_SELECTOR,
} from '../base/FocusNavigationEvents';
import {
  KEYBOARD_SCROLL_STEP_PX,
  SCROLL_EPSILON,
  getBlockedFocusScrollAmount,
  getRemainingScrollDistance,
  SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
  getScrollDirectionForKey,
  getScrollAxisForOrientation,
  getScrollbarGeometry,
  getScrollbarHandleStyle,
  getScrollbarTrackStyle,
  getScrollViewContentOverflows,
  getScrollViewFadingEdgeLengths,
  getScrollViewFrameStyle,
  getScrollViewHeaderInsetPadding,
  getScrollViewStyle,
  hasFocusableDescendantInDirection,
  isFocusAtFocusableBoundary,
  supportsScrollDirection,
  type ScrollDirection,
} from './private/ScrollViewLayout';
import { ScrollViewOrientation } from './ScrollView.types';
import type { ScrollViewProps } from './ScrollView.types';
import { useComposedRef } from '../utils/useComposedRef';
import { useScrollViewState } from './private/useScrollViewState';
import { ScrollViewFrame } from './private/ScrollViewFrame';
import { AnimationDurations } from '../motion/Animations';
export { ScrollViewOrientation } from './ScrollView.types';
export type { ScrollViewProps } from './ScrollView.types';

const DEFAULT_STYLE: CSSProperties = {};
const DEFAULT_DIMENSION = '100%';

interface ScrollViewNavigationRequestDetail {
  consumeBoundaryAlignment?: boolean;
  direction?: ScrollDirection;
  handled?: boolean;
  origin?: Element;
}

interface FocusSearchFromOriginDetail {
  direction: ScrollDirection;
  handled: boolean;
  origin: Element;
}

function remainsVisibleAtFocusBoundary(
  scrollContainer: HTMLElement,
  source: Element,
  orientation: ScrollViewOrientation,
  direction: ScrollDirection,
  fadingEdgeLengths: FadingEdgeLengths,
  headerInset: number,
): boolean {
  const containerRect = scrollContainer.getBoundingClientRect();
  const sourceRect = source.getBoundingClientRect();

  if (orientation === ScrollViewOrientation.HORIZONTAL) {
    const viewportLeft = containerRect.left;
    const viewportRight = containerRect.width > 0
      ? containerRect.right
      : viewportLeft + scrollContainer.clientWidth;
    const maxScrollLeft = Math.max(
      0,
      scrollContainer.scrollWidth - scrollContainer.clientWidth,
    );
    const targetScrollLeft = direction === 'left' ? 0 : maxScrollLeft;
    const [leftInset, rightInset] = fitFocusSafeAreaInsets(
      targetScrollLeft > SCROLL_EPSILON
        ? (fadingEdgeLengths.left ?? 0)
        : 0,
      targetScrollLeft < maxScrollLeft - SCROLL_EPSILON
        ? (fadingEdgeLengths.right ?? 0)
        : 0,
      viewportRight - viewportLeft,
      sourceRect.width,
    );
    const safeLeft = viewportLeft + leftInset;
    const safeRight = viewportRight - rightInset;
    const projectedLeft =
      sourceRect.left - (targetScrollLeft - scrollContainer.scrollLeft);
    const projectedRight = projectedLeft + sourceRect.width;
    return (
      projectedLeft >= safeLeft - SCROLL_EPSILON &&
      projectedRight <= safeRight + SCROLL_EPSILON
    );
  }

  const viewportTop = containerRect.top;
  const viewportBottom = containerRect.height > 0
    ? containerRect.bottom
    : viewportTop + scrollContainer.clientHeight;
  const maxScrollTop = Math.max(
    0,
    scrollContainer.scrollHeight - scrollContainer.clientHeight,
  );
  const targetScrollTop = direction === 'up' ? 0 : maxScrollTop;
  const [topInset, bottomInset] = fitFocusSafeAreaInsets(
    Math.max(
      headerInset,
      targetScrollTop > SCROLL_EPSILON
        ? (fadingEdgeLengths.top ?? 0)
        : 0,
    ),
    targetScrollTop < maxScrollTop - SCROLL_EPSILON
      ? (fadingEdgeLengths.bottom ?? 0)
      : 0,
    viewportBottom - viewportTop,
    sourceRect.height,
    headerInset,
  );
  const safeTop = viewportTop + topInset;
  const safeBottom = viewportBottom - bottomInset;
  const projectedTop =
    sourceRect.top - (targetScrollTop - scrollContainer.scrollTop);
  const projectedBottom = projectedTop + sourceRect.height;
  return (
    projectedTop >= safeTop - SCROLL_EPSILON &&
    projectedBottom <= safeBottom + SCROLL_EPSILON
  );
}

function isPartiallyVisibleInViewport(
  scrollContainer: HTMLElement,
  source: Element,
  orientation: ScrollViewOrientation,
): boolean {
  const containerRect = scrollContainer.getBoundingClientRect();
  const sourceRect = source.getBoundingClientRect();
  const viewportRight = containerRect.width > 0
    ? containerRect.right
    : containerRect.left + scrollContainer.clientWidth;
  const viewportBottom = containerRect.height > 0
    ? containerRect.bottom
    : containerRect.top + scrollContainer.clientHeight;

  return orientation === ScrollViewOrientation.HORIZONTAL
    ? sourceRect.right > containerRect.left + SCROLL_EPSILON &&
        sourceRect.left < viewportRight - SCROLL_EPSILON
    : sourceRect.bottom > containerRect.top + SCROLL_EPSILON &&
        sourceRect.top < viewportBottom - SCROLL_EPSILON;
}

function alignFocusedBoundary(
  scrollContainer: HTMLElement,
  source: Element,
  orientation: ScrollViewOrientation,
  direction: ScrollDirection,
  behavior: ScrollBehavior,
  fadingEdgeLengths: FadingEdgeLengths,
  headerInset: number,
): boolean {
  const focusBoundaryRoot = source.closest(FOCUS_BOUNDARY_ROOT_SELECTOR);
  if (
    !(focusBoundaryRoot instanceof HTMLElement) ||
    !scrollContainer.contains(focusBoundaryRoot) ||
    focusBoundaryRoot.closest(SCROLL_VIEW_SELECTOR) !== scrollContainer ||
    !supportsScrollDirection(orientation, direction) ||
    !isFocusAtFocusableBoundary(focusBoundaryRoot, source, direction) ||
    !remainsVisibleAtFocusBoundary(
      scrollContainer,
      source,
      orientation,
      direction,
      fadingEdgeLengths,
      headerInset,
    )
  ) {
    return false;
  }

  const boundary = direction === 'up'
    ? 'top'
    : direction === 'down'
      ? 'bottom'
      : direction;
  scrollToFocusBoundary(scrollContainer, boundary, behavior);
  return true;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ScrollView component
 * Scrollable container with custom scrollbar and fading edges.
 *
 * Usage:
 * ```tsx
 * <ScrollView
 *   height={400}
 *   topFadingEdgeLength={40}
 *   bottomFadingEdgeLength={40}
 * >
 *   <div>Scrollable content here...</div>
 * </ScrollView>
 * ```
 */
export const ScrollView = memo(forwardRef<HTMLDivElement, ScrollViewProps>(
  function ScrollView(
    {
      children,
      topFadingEdgeLength,
      bottomFadingEdgeLength,
      leftFadingEdgeLength,
      rightFadingEdgeLength,
      insetForHeader = false,
      headerHeight = 64,
      scrollbarEnabled,
      showScrollbar,
      fadingEdgeEnabled = true,
      orientation = ScrollViewOrientation.VERTICAL,
      width = DEFAULT_DIMENSION,
      height = DEFAULT_DIMENSION,
      className = '',
      scrollContainerClassName = '',
      style = DEFAULT_STYLE,
      ariaLabel,
      tabIndex = -1,
      onScroll: onScrollProp,
    },
    ref
  ) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const focusSafeAreaSuppressedTargetRef = useRef<HTMLElement | null>(null);
    const boundaryRealignmentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const boundaryRealignmentFrameRef = useRef<number | null>(null);
    const isScrollbarEnabled = useMemo(
      () => scrollbarEnabled ?? showScrollbar ?? true,
      [scrollbarEnabled, showScrollbar],
    );

    const fadingEdgeLengths = useMemo(
      () => getScrollViewFadingEdgeLengths({
        fadingEdgeEnabled,
        orientation,
        topFadingEdgeLength,
        bottomFadingEdgeLength,
        leftFadingEdgeLength,
        rightFadingEdgeLength,
      }),
      [
        bottomFadingEdgeLength,
        fadingEdgeEnabled,
        leftFadingEdgeLength,
        orientation,
        rightFadingEdgeLength,
        topFadingEdgeLength,
      ],
    );
    const headerInsetPadding = useMemo(
      () => getScrollViewHeaderInsetPadding(
        insetForHeader,
        headerHeight,
      ),
      [headerHeight, insetForHeader],
    );
    const getVisibleHeaderInset = useCallback((element: HTMLElement): number => {
      if (headerInsetPadding <= 0) {
        return 0;
      }
      const computedPadding = Number.parseFloat(
        window.getComputedStyle(element).paddingTop,
      );
      return Number.isFinite(computedPadding)
        ? Math.max(headerInsetPadding, computedPadding)
        : headerInsetPadding;
    }, [headerInsetPadding]);

    const {
      scrollState,
      scrollbarVisible,
      handleScroll,
    } = useScrollViewState({
      scrollRef,
      children,
      width,
      height,
      orientation,
      isScrollbarEnabled,
      onScroll: onScrollProp,
    });

    const cancelBoundaryRealignment = useCallback(() => {
      if (boundaryRealignmentTimeoutRef.current != null) {
        clearTimeout(boundaryRealignmentTimeoutRef.current);
        boundaryRealignmentTimeoutRef.current = null;
      }
      if (boundaryRealignmentFrameRef.current != null) {
        cancelAnimationFrame(boundaryRealignmentFrameRef.current);
        boundaryRealignmentFrameRef.current = null;
      }
    }, []);

    const scheduleBoundaryRealignment = useCallback(
      (source: HTMLElement) => {
        cancelBoundaryRealignment();
        const delay =
          AnimationDurations.CONTAINER_FAST_MOVEMENT_EXPANSION_HESITATION_DELAY +
          AnimationDurations.CONTAINER_STATE_CHANGE;
        boundaryRealignmentTimeoutRef.current = setTimeout(() => {
          boundaryRealignmentTimeoutRef.current = null;
          boundaryRealignmentFrameRef.current = requestAnimationFrame(() => {
            boundaryRealignmentFrameRef.current = null;
            const el = scrollRef.current;
            if (document.activeElement !== source || !el?.contains(source)) {
              return;
            }

            const leadingDirection = orientation === ScrollViewOrientation.HORIZONTAL
              ? 'left'
              : 'up';
            const trailingDirection = orientation === ScrollViewOrientation.HORIZONTAL
              ? 'right'
              : 'down';
            const headerInset = getVisibleHeaderInset(el);
            const alignedToBoundary = alignFocusedBoundary(
              el,
              source,
              orientation,
              leadingDirection,
              'auto',
              fadingEdgeLengths,
              headerInset,
            ) || alignFocusedBoundary(
                el,
                source,
                orientation,
                trailingDirection,
                'auto',
                fadingEdgeLengths,
                headerInset,
              );
            if (!alignedToBoundary) {
              scrollElementIntoFadingEdgeSafeArea(
                el,
                source,
                fadingEdgeLengths,
                {
                  axis: getScrollAxisForOrientation(orientation),
                  behavior: 'auto',
                  minimumInsets: { top: headerInset },
                },
              );
            }
          });
        }, delay);
      },
      [
        cancelBoundaryRealignment,
        fadingEdgeLengths,
        getVisibleHeaderInset,
        orientation,
      ],
    );

    useEffect(() => cancelBoundaryRealignment, [cancelBoundaryRealignment]);

    const handleFocus = useCallback(
      (event: FocusEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (
          !el ||
          event.target === event.currentTarget
        ) {
          return;
        }

        if (!(event.target instanceof HTMLElement)) {
          return;
        }
        if (isFocusSafeAreaScrollSuppressed()) {
          focusSafeAreaSuppressedTargetRef.current = event.target;
          return;
        }
        focusSafeAreaSuppressedTargetRef.current = null;
        cancelBoundaryRealignment();

        const owningScrollView = event.target.closest(SCROLL_VIEW_SELECTOR);
        if (
          owningScrollView instanceof HTMLElement &&
          owningScrollView !== el
        ) {
          const nestedContentOverflows =
            orientation === ScrollViewOrientation.HORIZONTAL
              ? owningScrollView.scrollWidth >
                owningScrollView.clientWidth + SCROLL_EPSILON
              : owningScrollView.scrollHeight >
                owningScrollView.clientHeight + SCROLL_EPSILON;
          if (nestedContentOverflows) {
            return;
          }
        }

        const leadingDirection = orientation === ScrollViewOrientation.HORIZONTAL
          ? 'left'
          : 'up';
        const trailingDirection = orientation === ScrollViewOrientation.HORIZONTAL
          ? 'right'
          : 'down';
        const headerInset = getVisibleHeaderInset(el);
        const alignedToBoundary =
          alignFocusedBoundary(
            el,
            event.target,
            orientation,
            leadingDirection,
            'smooth',
            fadingEdgeLengths,
            headerInset,
          ) ||
          alignFocusedBoundary(
            el,
            event.target,
            orientation,
            trailingDirection,
            'smooth',
            fadingEdgeLengths,
            headerInset,
          );
        if (alignedToBoundary) {
          scheduleBoundaryRealignment(event.target);
          return;
        }

        scrollElementIntoFadingEdgeSafeArea(el, event.target, fadingEdgeLengths, {
          axis: getScrollAxisForOrientation(orientation),
          minimumInsets: { top: headerInset },
        });
        scheduleBoundaryRealignment(event.target);
      },
      [
        cancelBoundaryRealignment,
        fadingEdgeLengths,
        getVisibleHeaderInset,
        orientation,
        scheduleBoundaryRealignment,
      ],
    );

    const scrollBlockedFocusDirection = useCallback(
      (
        direction: ScrollDirection,
        origin?: Element,
        consumeBoundaryAlignment: boolean = false,
      ): boolean => {
        const el = scrollRef.current;
        if (!el || !supportsScrollDirection(orientation, direction)) {
          return false;
        }

        if (
          origin != null &&
          el.contains(origin) &&
          alignFocusedBoundary(
            el,
            origin,
            orientation,
            direction,
            'auto',
            fadingEdgeLengths,
            getVisibleHeaderInset(el),
          )
        ) {
          return consumeBoundaryAlignment;
        }

        const remainingDistance = getRemainingScrollDistance(el, direction);
        if (remainingDistance <= SCROLL_EPSILON) {
          return false;
        }

        const viewportLength =
          direction === 'left' || direction === 'right'
            ? el.clientWidth
            : el.clientHeight;
        const scrollAmount = getBlockedFocusScrollAmount(
          viewportLength,
          remainingDistance,
        );

        cancelBoundaryRealignment();
        if (direction === 'left' || direction === 'right') {
          el.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
          });
        } else {
          el.scrollBy({
            top: direction === 'up' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
          });
        }
        return true;
      },
      [
        cancelBoundaryRealignment,
        fadingEdgeLengths,
        getVisibleHeaderInset,
        orientation,
      ],
    );

    useLayoutEffect(() => {
      const el = scrollRef.current;
      const activeElement = document.activeElement;
      if (
        isFocusSafeAreaScrollSuppressed() ||
        !(activeElement instanceof HTMLElement) ||
        !el?.contains(activeElement) ||
        focusSafeAreaSuppressedTargetRef.current === activeElement
      ) {
        return;
      }

      const leadingDirection = orientation === ScrollViewOrientation.HORIZONTAL
        ? 'left'
        : 'up';
      const trailingDirection = orientation === ScrollViewOrientation.HORIZONTAL
        ? 'right'
        : 'down';
      const headerInset = getVisibleHeaderInset(el);
      const alignedToBoundary = alignFocusedBoundary(
        el,
        activeElement,
        orientation,
        leadingDirection,
        'auto',
        fadingEdgeLengths,
        headerInset,
      ) || alignFocusedBoundary(
          el,
          activeElement,
          orientation,
          trailingDirection,
          'auto',
          fadingEdgeLengths,
          headerInset,
        );
      if (!alignedToBoundary) {
        scrollElementIntoFadingEdgeSafeArea(
          el,
          activeElement,
          fadingEdgeLengths,
          {
            axis: getScrollAxisForOrientation(orientation),
            behavior: 'auto',
            minimumInsets: { top: headerInset },
          },
        );
      }
    }, [
      fadingEdgeLengths,
      getVisibleHeaderInset,
      orientation,
      scrollState.clientHeight,
      scrollState.clientWidth,
      scrollState.scrollHeight,
      scrollState.scrollWidth,
    ]);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) {
        return;
      }

      const handleNavigationRequest = (event: Event) => {
        const customEvent = event as CustomEvent<ScrollViewNavigationRequestDetail>;
        const direction = customEvent.detail?.direction;
        if (direction == null) {
          return;
        }

        if (
          scrollBlockedFocusDirection(
            direction,
            customEvent.detail.origin,
            customEvent.detail.consumeBoundaryAlignment === true,
          )
        ) {
          customEvent.detail.handled = true;
          event.preventDefault();
        }
      };

      el.addEventListener(SCROLL_VIEW_NAVIGATION_REQUEST_EVENT, handleNavigationRequest);
      return () => {
        el.removeEventListener(SCROLL_VIEW_NAVIGATION_REQUEST_EVENT, handleNavigationRequest);
      };
    }, [scrollBlockedFocusDirection]);

    /**
     * Handle keyboard events for scrolling.
     */
    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (!el) return;

        const direction = getScrollDirectionForKey(event.key);
        const focusedDescendantIsVisible =
          event.target instanceof Element &&
          isPartiallyVisibleInViewport(
            el,
            event.target,
            orientation,
          );
        if (
          event.target !== event.currentTarget &&
          direction != null &&
          supportsScrollDirection(orientation, direction) &&
          event.target instanceof Element &&
          el.contains(event.target) &&
          (
            !focusedDescendantIsVisible ||
            !hasFocusableDescendantInDirection(el, event.target, direction)
          )
        ) {
          if (scrollBlockedFocusDirection(direction, event.target)) {
            event.preventDefault();
            event.stopPropagation();
            event.target.dispatchEvent(new CustomEvent(FOCUS_NAVIGATION_HANDLED_EVENT));
          }
          return;
        }

        if (event.target !== event.currentTarget) {
          return;
        }

        if (
          direction != null &&
          supportsScrollDirection(orientation, direction)
        ) {
          if (getRemainingScrollDistance(el, direction) <= SCROLL_EPSILON) {
            const detail: FocusSearchFromOriginDetail = {
              direction,
              handled: false,
              origin: el,
            };
            el.dispatchEvent(new CustomEvent<FocusSearchFromOriginDetail>(
              FOCUS_SEARCH_FROM_ORIGIN_EVENT,
              {
                bubbles: true,
                cancelable: true,
                detail,
              },
            ));
            if (detail.handled) {
              event.preventDefault();
              event.stopPropagation();
              el.dispatchEvent(new CustomEvent(FOCUS_NAVIGATION_HANDLED_EVENT));
            }
            return;
          }

          event.preventDefault();
          if (direction === 'left' || direction === 'right') {
            el.scrollBy({
              left: direction === 'left'
                ? -KEYBOARD_SCROLL_STEP_PX
                : KEYBOARD_SCROLL_STEP_PX,
              behavior: 'smooth',
            });
          } else {
            el.scrollBy({
              top: direction === 'up'
                ? -KEYBOARD_SCROLL_STEP_PX
                : KEYBOARD_SCROLL_STEP_PX,
              behavior: 'smooth',
            });
          }
          return;
        }

        switch (event.key) {
          case 'PageUp': {
            event.preventDefault();
            if (orientation === ScrollViewOrientation.HORIZONTAL) {
              el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
            } else {
              el.scrollBy({ top: -el.clientHeight, behavior: 'smooth' });
            }
            break;
          }
          case 'PageDown': {
            event.preventDefault();
            if (orientation === ScrollViewOrientation.HORIZONTAL) {
              el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
            } else {
              el.scrollBy({ top: el.clientHeight, behavior: 'smooth' });
            }
            break;
          }
          case 'Home': {
            event.preventDefault();
            if (orientation === ScrollViewOrientation.HORIZONTAL) {
              el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              el.scrollTo({ top: 0, behavior: 'smooth' });
            }
            break;
          }
          case 'End': {
            event.preventDefault();
            if (orientation === ScrollViewOrientation.HORIZONTAL) {
              el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
            } else {
              el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
            }
            break;
          }
          default:
            break;
        }
      },
      [
        orientation,
        scrollBlockedFocusDirection,
      ]
    );

    // ========================================================================
    // Scrollbar calculations
    // ========================================================================

    const contentOverflows = useMemo(
      () => getScrollViewContentOverflows(scrollState, orientation),
      [orientation, scrollState],
    );

    const scrollbarGeometry = useMemo(
      () => getScrollbarGeometry(
        scrollState,
        orientation,
        contentOverflows,
      ),
      [contentOverflows, orientation, scrollState],
    );

    const fadingEdgeOverlayStyles = useMemo(
      () => getFadingEdgeOverlayStyles(scrollState, fadingEdgeLengths),
      [fadingEdgeLengths, scrollState],
    );
    // ========================================================================
    // Styles
    // ========================================================================

    const frameStyle = useMemo(
      () => getScrollViewFrameStyle({
        width,
        height,
        style,
      }),
      [height, style, width],
    );

    const scrollViewStyle = useMemo(
      () => getScrollViewStyle({
        headerInsetPadding,
      }),
      [headerInsetPadding],
    );
    const scrollbarTrackStyle = useMemo(
      () => getScrollbarTrackStyle(orientation),
      [orientation],
    );
    const scrollbarHandleStyle = useMemo(
      () => getScrollbarHandleStyle(
        orientation,
        scrollbarGeometry,
      ),
      [orientation, scrollbarGeometry],
    );

    const setScrollRef = useComposedRef(ref, scrollRef);

    return (
      <ScrollViewFrame
        className={className}
        scrollContainerClassName={scrollContainerClassName}
        frameStyle={frameStyle}
        scrollRef={setScrollRef}
        scrollViewStyle={scrollViewStyle}
        orientation={orientation}
        tabIndex={tabIndex}
        ariaLabel={ariaLabel}
        onScroll={handleScroll}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        isScrollbarEnabled={isScrollbarEnabled}
        contentOverflows={contentOverflows}
        fadingEdgeOverlayStyles={fadingEdgeOverlayStyles}
        scrollbarVisible={scrollbarVisible}
        scrollbarTrackStyle={scrollbarTrackStyle}
        scrollbarHandleStyle={scrollbarHandleStyle}
      >
        {children}
      </ScrollViewFrame>
    );
  }
));
