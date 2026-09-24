/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ContextMenu component for Meta Ray-Ban Display
 * Popup-shaped horizontal scrolling menu
 *
 * Features:
 * - 72px fixed height
 * - Horizontal scroll with Left/Right arrow key navigation
 * - Drop shadow material background
 * - Dismiss on Escape key or Up/Down navigation beyond edges
 * - Optional tail/arrow pointing to anchor element
 * - Fading edges on scroll overflow
 */

import {
  forwardRef,
  memo,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import type { TooltipContentInjectedProps } from '@wearables-ui-toolkit/foundation/base/TooltipPopup.types';
import {
  EMPTY_SCROLL_METRICS,
  FADING_EDGE_LENGTH_MEDIUM,
  getScrollMetrics,
  sameScrollMetrics,
} from '@wearables-ui-toolkit/foundation/internal';
import { SHADOW_BLUR_RADIUS } from './private/ContextMenuPath';
import {
  CONTEXT_MENU_FOCUS_SEARCH_FROM_ORIGIN_EVENT,
} from './private/ContextMenuMetrics';
import {
  getContextMenuFadingEdgeStrengths,
  getContextMenuFocusedItem,
  getContextMenuFocusTarget,
  getContextMenuItemIndex,
  getContextMenuItems,
  getContextMenuNextItem,
  getContextMenuPadding,
  scrollContextMenuItemIntoView,
  shouldShowContextMenuTail,
} from './private/ContextMenuLayout';
import {
  getContextMenuContainerStyle,
  getContextMenuMaterialShape,
  getContextMenuScrollViewportStyle,
} from './private/ContextMenuPresentation';
import { DismissReason } from './ContextMenu.types';
import type { ContextMenuHandle, ContextMenuProps } from './ContextMenu.types';
import styles from './ContextMenu.module.css';
import { ContextMenuFrame } from './private/ContextMenuFrame';

export { DismissReason } from './ContextMenu.types';
export type { ContextMenuHandle, ContextMenuProps } from './ContextMenu.types';

const DEFAULT_STYLE: CSSProperties = {};
// The anchor's release animation can briefly clear browser focus after the
// popup has already become visible, so keep the menu focus guard alive through
// the complete handoff instead of checking only the first paint.
const AUTO_FOCUS_SETTLE_FRAMES = 30;

/**
 * ContextMenu component
 * Horizontal scrolling context menu with keyboard navigation.
 */
export const ContextMenu = memo(forwardRef<ContextMenuHandle, ContextMenuProps>(
  function ContextMenu(
    {
      children,
      onDismiss,
      showTail = true,
      tailDirection,
      tailCenterX,
      maxWidth,
      focusSearchOrigin,
      fadingEdgeLength = FADING_EDGE_LENGTH_MEDIUM,
      style = DEFAULT_STYLE,
      className = '',
      role,
      'aria-label': ariaLabel,
      'aria-disabled': ariaDisabled,
      ...injectedProps
    },
    ref
  ) {
    const { isPositioned } = injectedProps as Partial<TooltipContentInjectedProps>;
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const onDismissRef = useRef(onDismiss);
    const focusSearchOriginRef = useRef(focusSearchOrigin);
    const focusOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const focusOutFrameRef = useRef<number | null>(null);
    const dismissalRequestedRef = useRef(false);
    const dismissalAckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoFocusHandoffActiveRef = useRef(false);
    const [measuredSize, setMeasuredSize] = useState({ width: 0, height: 0 });
    const [scrollMetrics, setScrollMetrics] = useState(EMPTY_SCROLL_METRICS);

    useLayoutEffect(() => {
      onDismissRef.current = onDismiss;
      focusSearchOriginRef.current = focusSearchOrigin;
    }, [focusSearchOrigin, onDismiss]);

    // Drop shadow padding
    const dropShadowPadding = SHADOW_BLUR_RADIUS * 2;

    const showTailPointer = useMemo(
      () => shouldShowContextMenuTail(showTail, tailDirection),
      [showTail, tailDirection],
    );
    const { paddingTop, paddingBottom, totalHeight } = useMemo(
      () => getContextMenuPadding(
        showTailPointer,
        tailDirection,
        dropShadowPadding,
      ),
      [dropShadowPadding, showTailPointer, tailDirection],
    );

    /**
     * Scroll a focused item into view.
     */
    const scrollItemIntoView = useCallback((element: HTMLElement) => {
      scrollContextMenuItemIntoView(scrollRef.current, element, fadingEdgeLength);
    }, [fadingEdgeLength]);

    /**
     * Scroll the item at the given index into view.
     */
    const scrollToItem = useCallback((index: number, smooth: boolean = true) => {
      const items = getContextMenuItems(scrollRef.current, styles.itemsContainer);
      const item = items[index];
      if (item == null) {
        return;
      }
      item.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        inline: 'nearest',
        block: 'nearest',
      });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        scrollToItem,
        getElement: () => containerRef.current,
      }),
      [scrollToItem],
    );

    const getFocusedMenuItem = useCallback((): HTMLElement | null => {
      return getContextMenuFocusedItem(containerRef.current, document.activeElement);
    }, []);

    const requestFocusSearchFromFocusedItem = useCallback(
      (direction: 'up' | 'down' | 'left' | 'right') => {
        if (typeof document === 'undefined') {
          return false;
        }

        const origin = getFocusedMenuItem() ?? focusSearchOrigin ?? null;
        if (!origin) {
          return false;
        }

        const rect = origin.getBoundingClientRect();
        const detail = {
          origin,
          originRect: {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            x: rect.x,
            y: rect.y,
          },
          direction,
          handled: false,
        };
        const event = new CustomEvent(CONTEXT_MENU_FOCUS_SEARCH_FROM_ORIGIN_EVENT, {
          detail,
          cancelable: true,
        });
        document.dispatchEvent(event);
        return detail.handled || event.defaultPrevented;
      },
      [focusSearchOrigin, getFocusedMenuItem],
    );

    const updateFadingEdges = useCallback(() => {
      const scrollContainer = scrollRef.current;
      if (!scrollContainer) return;

      const nextMetrics = getScrollMetrics(scrollContainer);
      setScrollMetrics(current =>
        sameScrollMetrics(current, nextMetrics) ? current : nextMetrics,
      );
    }, []);

    /**
     * Request dismissal and re-arm focus-out handling when the consumer does
     * not honor it. A controlled or persistent popup may stay mounted after
     * the request; without the re-arm, the pending dismissal marker lingers
     * and later genuine focus loss is permanently suppressed.
     */
    const requestDismissal = useCallback((reason: DismissReason) => {
      if (onDismiss == null) {
        return;
      }
      dismissalRequestedRef.current = true;
      onDismiss(reason);
      if (dismissalAckTimerRef.current != null) {
        clearTimeout(dismissalAckTimerRef.current);
      }
      dismissalAckTimerRef.current = setTimeout(() => {
        dismissalAckTimerRef.current = null;
        // Unmount cancels this timer, so reaching here means the menu is
        // still mounted and the consumer ignored the dismissal. Reset
        // unconditionally: a later focus-out from inside the menu is always
        // preceded by a focus-in, and an honored dismissal already consumed
        // the marker synchronously.
        dismissalRequestedRef.current = false;
      }, 0);
    }, [onDismiss]);

    /**
     * Handle keyboard events for navigation and dismissal.
     * Performs a focus search and dispatches key events.
     */
    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
      // Escape key dismisses
      if (event.key === 'Escape') {
        event.preventDefault();
        autoFocusHandoffActiveRef.current = false;
        requestDismissal(DismissReason.BACK_BUTTON);
        return;
      }

      // Up/Down arrow keys dismiss (no vertical navigation in horizontal menu)
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        autoFocusHandoffActiveRef.current = false;
        requestFocusSearchFromFocusedItem(event.key === 'ArrowUp' ? 'up' : 'down');
        requestDismissal(DismissReason.NAVIGATION);
        return;
      }

      // Left/Right arrow keys navigate between items
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const focusedElement = document.activeElement as HTMLElement | null;
        if (!focusedElement) return;

        const items = getContextMenuItems(scrollRef.current, styles.itemsContainer);
        if (items.length === 0) return;

        const currentIndex = getContextMenuItemIndex(items, focusedElement);
        if (currentIndex === -1) return;

        const nextItem = getContextMenuNextItem(items, currentIndex, event.key);
        if (nextItem != null) {
          event.preventDefault();
          getContextMenuFocusTarget(nextItem).focus();
          scrollItemIntoView(nextItem);
        } else {
          event.preventDefault();
          // Horizontal edge overflow keeps the menu open — it only dismisses on
          // vertical focus-search failure. Still surface the focus-search
          // request so the host can handle edge overflow, but do NOT fire a
          // NAVIGATION dismissal here.
          requestFocusSearchFromFocusedItem(event.key === 'ArrowLeft' ? 'left' : 'right');
        }
      }
    }, [requestDismissal, requestFocusSearchFromFocusedItem, scrollItemIntoView]);

    const handleFocusIn = useCallback(() => {
      dismissalRequestedRef.current = false;
    }, []);
    const handleFocusOut = useCallback(
      (event: FocusEvent) => {
        const menu = containerRef.current;
        if (!menu) {
          return;
        }

        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && menu.contains(nextTarget)) {
          dismissalRequestedRef.current = false;
          return;
        }
        if (dismissalRequestedRef.current) {
          return;
        }
        const focusFellBackToApplicationBoundary =
          nextTarget == null ||
          (
            nextTarget instanceof HTMLElement &&
            nextTarget.tabIndex < 0 &&
            (
              nextTarget.contains(menu) ||
              (
                focusSearchOriginRef.current != null &&
                nextTarget.contains(focusSearchOriginRef.current)
              )
            )
          );
        if (nextTarget instanceof Node && !focusFellBackToApplicationBoundary) {
          autoFocusHandoffActiveRef.current = false;
        }

        if (focusOutTimerRef.current != null) {
          clearTimeout(focusOutTimerRef.current);
          focusOutTimerRef.current = null;
        }
        if (focusOutFrameRef.current != null) {
          cancelAnimationFrame(focusOutFrameRef.current);
          focusOutFrameRef.current = null;
        }
        const dismissIfFocusStayedOutside = () => {
          focusOutTimerRef.current = setTimeout(() => {
            focusOutTimerRef.current = null;
            const activeElement = document.activeElement;
            if (activeElement instanceof Node && menu.contains(activeElement)) {
              return;
            }

            autoFocusHandoffActiveRef.current = false;
            onDismissRef.current?.(DismissReason.NAVIGATION);
          }, 0);
        };
        if (focusFellBackToApplicationBoundary) {
          // Let the already queued autofocus-settle frame reclaim focus first.
          // If it cannot, the next task still dismisses the genuinely blurred
          // menu instead of suppressing focus loss for the full handoff window.
          focusOutFrameRef.current = requestAnimationFrame(() => {
            focusOutFrameRef.current = null;
            dismissIfFocusStayedOutside();
          });
        } else {
          dismissIfFocusStayedOutside();
        }
      },
      [],
    );

    useLayoutEffect(() => {
      const menu = containerRef.current;
      if (!menu) {
        return undefined;
      }

      menu.addEventListener('focusin', handleFocusIn);
      menu.addEventListener('focusout', handleFocusOut);
      return () => {
        menu.removeEventListener('focusin', handleFocusIn);
        menu.removeEventListener('focusout', handleFocusOut);
        if (focusOutTimerRef.current != null) {
          clearTimeout(focusOutTimerRef.current);
          focusOutTimerRef.current = null;
        }
        if (focusOutFrameRef.current != null) {
          cancelAnimationFrame(focusOutFrameRef.current);
          focusOutFrameRef.current = null;
        }
      };
    }, [handleFocusIn, handleFocusOut]);

    // The dismissal re-arm timer outlives listener re-registrations: this
    // effect re-runs whenever the focus callbacks change identity (common
    // with inline consumer callbacks), and cancelling a pending re-arm
    // there would strand the dismissal marker. Its callback only touches
    // refs, so it is safe to let it fire across re-renders; cancel it
    // only on unmount.
    useEffect(() => {
      return () => {
        if (dismissalAckTimerRef.current != null) {
          clearTimeout(dismissalAckTimerRef.current);
          dismissalAckTimerRef.current = null;
        }
      };
    }, []);

    /**
     * Focus the first item when mounted
     */
    useEffect(() => {
      if (isPositioned === false) {
        return undefined;
      }
      const firstItem = getContextMenuItems(
        scrollRef.current,
        styles.itemsContainer,
      )[0];
      if (!firstItem) {
        return undefined;
      }
      autoFocusHandoffActiveRef.current = true;
      let frameId: number | null = null;
      let completedFrames = 0;
      const settleFocus = () => {
        if (!autoFocusHandoffActiveRef.current) {
          return;
        }
        const menu = containerRef.current;
        if (menu != null && !menu.contains(document.activeElement)) {
          getContextMenuFocusTarget(firstItem).focus({ preventScroll: true });
        }
        completedFrames += 1;
        if (completedFrames < AUTO_FOCUS_SETTLE_FRAMES) {
          frameId = requestAnimationFrame(settleFocus);
        } else {
          autoFocusHandoffActiveRef.current = false;
        }
      };
      frameId = requestAnimationFrame(settleFocus);
      return () => {
        autoFocusHandoffActiveRef.current = false;
        if (frameId != null) {
          cancelAnimationFrame(frameId);
        }
      };
    }, [isPositioned]);

    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const updateSize = () => {
        const rect = el.getBoundingClientRect();
        const nextWidth = Math.round(rect.width * 100) / 100;
        const nextHeight = Math.round(rect.height * 100) / 100;
        setMeasuredSize(prev =>
          prev.width === nextWidth && prev.height === nextHeight
            ? prev
            : { width: nextWidth, height: nextHeight },
        );
      };

      updateSize();
      if (typeof ResizeObserver === 'undefined') {
        return undefined;
      }

      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }, [maxWidth, paddingBottom, paddingTop, showTailPointer]);

    useLayoutEffect(() => {
      updateFadingEdges();

      const scrollContainer = scrollRef.current;
      if (!scrollContainer || typeof ResizeObserver === 'undefined') {
        return undefined;
      }

      const observer = new ResizeObserver(updateFadingEdges);
      observer.observe(scrollContainer);
      const itemsContainer = scrollContainer.querySelector(`.${styles.itemsContainer}`);
      if (itemsContainer) {
        observer.observe(itemsContainer);
      }

      const frameId = requestAnimationFrame(updateFadingEdges);
      return () => {
        cancelAnimationFrame(frameId);
        observer.disconnect();
      };
    }, [children, maxWidth, measuredSize.width, updateFadingEdges]);

    const containerStyle = useMemo(
      () => getContextMenuContainerStyle({
        totalHeight,
        paddingTop,
        paddingBottom,
        dropShadowPadding,
        maxWidth,
        style,
      }),
      [
        dropShadowPadding,
        maxWidth,
        paddingBottom,
        paddingTop,
        style,
        totalHeight,
      ],
    );
    const {
      effectiveWidth,
      effectiveHeight,
      pathD,
      shadowOffsetY,
    } = useMemo(
      () => getContextMenuMaterialShape({
        measuredSize,
        maxWidth,
        totalHeight,
        dropShadowPadding,
        showTailPointer,
        tailDirection,
        tailCenterX,
      }),
      [
        dropShadowPadding,
        maxWidth,
        measuredSize,
        showTailPointer,
        tailCenterX,
        tailDirection,
        totalHeight,
      ],
    );
    const fadingEdgeStrengths = useMemo(
      () => getContextMenuFadingEdgeStrengths(
        scrollMetrics,
        fadingEdgeLength,
      ),
      [fadingEdgeLength, scrollMetrics],
    );
    const scrollViewportStyle = useMemo(
      () => getContextMenuScrollViewportStyle(
        fadingEdgeLength,
      ),
      [fadingEdgeLength],
    );

    return (
      <ContextMenuFrame
        containerRef={containerRef}
        scrollRef={scrollRef}
        className={className}
        containerStyle={containerStyle}
        role={role}
        ariaLabel={ariaLabel}
        ariaDisabled={ariaDisabled}
        pathD={pathD}
        effectiveWidth={effectiveWidth}
        effectiveHeight={effectiveHeight}
        shadowOffsetY={shadowOffsetY}
        scrollViewportStyle={scrollViewportStyle}
        fadingEdgeStrengths={fadingEdgeStrengths}
        onKeyDown={handleKeyDown}
        onScroll={updateFadingEdges}
      >
        {children}
      </ContextMenuFrame>
    );
  }
));
