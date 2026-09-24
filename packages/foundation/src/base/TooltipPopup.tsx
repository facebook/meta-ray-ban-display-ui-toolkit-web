/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  cloneElement,
  isValidElement,
  memo,
  useMemo,
  type ReactElement,
  type FocusEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import tooltipStyles from './TooltipPopup.module.css';
import { preserveFocusedInteractableDuringNavigation } from './FocusCoordinator';
import { useDefaultTooltipPresentation } from './TooltipPresentation';
import {
  getFloatingPortalRootOffset,
  useFloatingPortalRoot,
} from '../portal/FloatingPortalRoot';
import {
  chooseAnchoredTooltipPosition,
  getEffectiveAnchorRect,
  getTooltipAnchorTarget,
  getTooltipBoundaryRect,
  getWindowTooltipBoundaryRect,
  isSameTooltipBoundary,
  TooltipPosition,
} from './TooltipPositioning';
import type { TooltipBoundaryRect } from './TooltipPositioning';
import type {
  TooltipContentInjectedProps,
  TooltipPopupProps,
} from './TooltipPopup.types';
import { useTransientBackNavigation } from '../navigation/BackNavigation';

const TOOLTIP_VISUAL_INSET = 16;
const CUSTOM_TOOLTIP_VISUAL_INSET = 12;
const TAIL_ANCHOR_SPACING = 6;
const NO_TAIL_ANCHOR_SPACING = 14;
const CUSTOM_TAIL_ANCHOR_SPACING = 4;
const CUSTOM_NO_TAIL_ANCHOR_SPACING = 8;
const EDGE_SPACING = 2;
const BACK_FOCUS_RECOVERY_MS = 1_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export { TooltipPosition } from './TooltipPositioning';
export type { TooltipPopupProps } from './TooltipPopup.types';

export const TooltipPopup = memo(function TooltipPopup({
  isVisible,
  text,
  metadata,
  content,
  contentDescription,
  focusable,
  showTail,
  position,
  centerPositionProvider,
  targetRectProvider,
  anchorRef,
  onFocusWithinChange,
  onBackRequest,
  onExited,
}: TooltipPopupProps) {
  const DefaultTooltipPresentation = useDefaultTooltipPresentation();
  const popupRef = useRef<HTMLDivElement>(null);
  const lastFocusedPopupElementRef = useRef<HTMLElement | null>(null);
  const isVisibleRef = useRef(isVisible);
  const stopBackFocusRecoveryRef = useRef<(() => void) | null>(null);
  const wasVisibleRef = useRef(isVisible);
  const wasFocusableRef = useRef(focusable);
  const portalRoot = useFloatingPortalRoot();
  const [layout, setLayout] = useState<{
    top: number;
    left: number;
    tailCenterX: number;
    tailDirection?: 'up' | 'down';
    visible: boolean;
  }>({
    top: 0,
    left: 0,
    tailCenterX: 0,
    tailDirection: undefined,
    visible: false,
  });
  const [clipBoundary, setClipBoundary] = useState<TooltipBoundaryRect>(
    getWindowTooltipBoundaryRect,
  );

  isVisibleRef.current = isVisible;

  const recoverPopupFocusIfStillVisible = useCallback(
    (focusTarget: HTMLElement | null) => {
      stopBackFocusRecoveryRef.current?.();

      let frameId: number | null = null;
      let timeoutId: number | null = null;
      let handleFocusIn: () => void;
      const stopRecovery = () => {
        if (frameId != null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
        if (timeoutId != null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
        document.removeEventListener('focusin', handleFocusIn, true);
        if (stopBackFocusRecoveryRef.current === stopRecovery) {
          stopBackFocusRecoveryRef.current = null;
        }
      };
      const recoverFocus = () => {
        frameId = null;
        const popup = popupRef.current;
        if (
          !isVisibleRef.current ||
          popup == null ||
          focusTarget == null ||
          !focusTarget.isConnected
        ) {
          stopRecovery();
          return;
        }

        const activeElement = document.activeElement;
        if (activeElement instanceof Node && popup.contains(activeElement)) {
          return;
        }
        const anchor = anchorRef.current;
        const focusIsAtApplicationBoundary =
          activeElement === document.body ||
          activeElement === document.documentElement ||
          (
            activeElement instanceof HTMLElement &&
            activeElement.tabIndex < 0 &&
            (
              activeElement.contains(popup) ||
              (anchor != null && activeElement.contains(anchor))
            )
          );
        if (!focusIsAtApplicationBoundary) {
          stopRecovery();
          return;
        }
        focusTarget.focus({ preventScroll: true });
      };
      handleFocusIn = () => recoverFocus();

      stopBackFocusRecoveryRef.current = stopRecovery;
      document.addEventListener('focusin', handleFocusIn, true);
      frameId = requestAnimationFrame(recoverFocus);
      timeoutId = window.setTimeout(stopRecovery, BACK_FOCUS_RECOVERY_MS);
    },
    [anchorRef],
  );

  useEffect(() => {
    if (!isVisible) {
      stopBackFocusRecoveryRef.current?.();
    }
  }, [isVisible]);

  useEffect(() => {
    return () => stopBackFocusRecoveryRef.current?.();
  }, []);

  const requestBackFromPopup = useCallback(() => {
    const popup = popupRef.current;
    const activeElement = document.activeElement;
    const retainedFocusTarget = lastFocusedPopupElementRef.current;
    const focusRecoveryTarget =
      popup != null &&
      retainedFocusTarget != null &&
      retainedFocusTarget.isConnected &&
      popup.contains(retainedFocusTarget)
        ? retainedFocusTarget
        : popup != null &&
            activeElement instanceof HTMLElement &&
            popup.contains(activeElement)
          ? activeElement
          : popup?.querySelector<HTMLElement>(
              '[role="menuitem"], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
    const contentBackTarget =
      focusRecoveryTarget ??
      popup?.querySelector<HTMLElement>('[role="menu"], [role="dialog"]');
    if (contentBackTarget != null) {
      const forwardedEvent = new globalThis.KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape',
        code: 'Escape',
      });
      (
        forwardedEvent as globalThis.KeyboardEvent & {
          __uitForwardedPopupBack?: boolean;
        }
      ).__uitForwardedPopupBack = true;
      contentBackTarget.dispatchEvent(forwardedEvent);
      if (forwardedEvent.defaultPrevented) {
        recoverPopupFocusIfStillVisible(focusRecoveryTarget ?? null);
        return;
      }
    }

    onBackRequest?.();
    recoverPopupFocusIfStillVisible(focusRecoveryTarget ?? null);
  }, [onBackRequest, recoverPopupFocusIfStillVisible]);
  useTransientBackNavigation(
    isVisible && focusable ? requestBackFromPopup : undefined,
    anchorRef.current,
    { priority: 1 },
  );

  useEffect(() => {
    if (!isVisible || !focusable) {
      return undefined;
    }

    const handleDocumentBack = (event: globalThis.KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        (event as globalThis.KeyboardEvent & { __uitForwardedPopupBack?: boolean })
          .__uitForwardedPopupBack === true
      ) {
        return;
      }

      const popup = popupRef.current;
      if (popup == null) {
        return;
      }

      const eventTarget = event.target;
      if (eventTarget instanceof Node && popup.contains(eventTarget)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      requestBackFromPopup();
    };

    document.addEventListener('keydown', handleDocumentBack, true);
    return () => document.removeEventListener('keydown', handleDocumentBack, true);
  }, [focusable, isVisible, requestBackFromPopup]);

  useLayoutEffect(() => {
    const wasVisible = wasVisibleRef.current;
    const wasFocusable = wasFocusableRef.current;
    wasVisibleRef.current = isVisible;
    wasFocusableRef.current = focusable;

    if (!wasVisible || isVisible || !wasFocusable) {
      return;
    }

    const popup = popupRef.current;
    const anchor = anchorRef.current;
    const activeElement = document.activeElement;
    const focusIsInsidePopup =
      popup != null &&
      activeElement instanceof Node &&
      popup.contains(activeElement);
    if (
      anchor != null &&
      anchor.isConnected &&
      (activeElement === anchor || focusIsInsidePopup)
    ) {
      preserveFocusedInteractableDuringNavigation(anchor);
    }
    // Navigation dismissal may already have moved focus to its next target.
    // Restore only when focus would otherwise be lost with the closing popup.
    if (anchor != null && anchor.isConnected && focusIsInsidePopup) {
      anchor.focus({ preventScroll: true });
    }
  }, [anchorRef, focusable, isVisible]);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const popup = popupRef.current;
    if (!anchor || !popup) return;

    const anchorRect = getEffectiveAnchorRect(anchor, false);
    const popupRect = popup.getBoundingClientRect();
    if (popupRect.width <= 0 || popupRect.height <= 0) return;

    const boundaryRect = getTooltipBoundaryRect(anchor);
    setClipBoundary(prev =>
      isSameTooltipBoundary(prev, boundaryRect) ? prev : boundaryRect,
    );

    const usesProvidedContent = content != null;
    const visualInset = usesProvidedContent ? CUSTOM_TOOLTIP_VISUAL_INSET : TOOLTIP_VISUAL_INSET;
    const gap = usesProvidedContent
      ? (showTail ? CUSTOM_TAIL_ANCHOR_SPACING : CUSTOM_NO_TAIL_ANCHOR_SPACING)
      : (showTail ? TAIL_ANCHOR_SPACING : NO_TAIL_ANCHOR_SPACING);
    const target = getTooltipAnchorTarget(
      anchor,
      anchorRect,
      centerPositionProvider,
      targetRectProvider,
    );
    const unclampedLeft =
      position === TooltipPosition.CENTERED
        ? boundaryRect.left + boundaryRect.width / 2 - popupRect.width / 2
        : target.centerX - popupRect.width / 2;
    const minLeft = boundaryRect.left + EDGE_SPACING - visualInset;
    const maxLeft = Math.max(
      minLeft,
      boundaryRect.right - EDGE_SPACING - popupRect.width + visualInset,
    );
    // The popup stays in anchor coordinates when the anchor leaves the
    // page viewport; the boundary then clips the popup instead of pulling it
    // back into view.
    const anchorOverlapsBoundaryX =
      anchorRect.right > boundaryRect.left &&
      anchorRect.left < boundaryRect.right;
    const left = anchorOverlapsBoundaryX
      ? Math.min(Math.max(unclampedLeft, minLeft), maxLeft)
      : unclampedLeft;

    const preferredPosition =
      position === TooltipPosition.CENTERED ? TooltipPosition.ANCHORED : position;
    const aboveTop = target.top - popupRect.height - gap + visualInset;
    const belowTop = target.bottom + gap - visualInset;
    // Only auto-flip tooltip content used as context-menu-style popups.
    // Built-in TooltipContainer instances keep the requested direction and clamp
    // into the window instead of flipping from below to above.
    const shouldAutoFlip = usesProvidedContent && focusable;
    const effectivePosition = shouldAutoFlip
      ? chooseAnchoredTooltipPosition(
          preferredPosition,
          anchorRect,
          popupRect.height,
          boundaryRect,
          aboveTop,
          belowTop,
        )
      : preferredPosition;
    const unclampedTop =
      effectivePosition === TooltipPosition.ANCHORED_BOTTOM ? belowTop : aboveTop;
    const minTop = boundaryRect.top + EDGE_SPACING - visualInset;
    const maxTop = Math.max(
      minTop,
      boundaryRect.bottom - EDGE_SPACING - popupRect.height + visualInset,
    );
    const anchorOverlapsBoundaryY =
      anchorRect.bottom > boundaryRect.top &&
      anchorRect.top < boundaryRect.bottom;
    const top = anchorOverlapsBoundaryY
      ? clamp(unclampedTop, minTop, maxTop)
      : unclampedTop;
    const canShowTail = showTail && position !== TooltipPosition.CENTERED;
    const tailDirection =
      canShowTail && effectivePosition === TooltipPosition.ANCHORED
        ? 'down'
        : canShowTail && effectivePosition === TooltipPosition.ANCHORED_BOTTOM
          ? 'up'
          : undefined;
    const tailCenterX = target.centerX - left;

    setLayout(prev => {
      if (
        Math.abs(prev.top - top) < 0.25 &&
        Math.abs(prev.left - left) < 0.25 &&
        Math.abs(prev.tailCenterX - tailCenterX) < 0.25 &&
        prev.tailDirection === tailDirection &&
        prev.visible
      ) {
        return prev;
      }
      return { top, left, tailCenterX, tailDirection, visible: true };
    });
  }, [
    anchorRef,
    centerPositionProvider,
    content,
    position,
    showTail,
    targetRectProvider,
  ]);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const popup = popupRef.current;
    let positionAnimationFrame: number | null = null;

    // Initial position calculation
    updatePosition();

    // Anchor movement caused by CSS transforms does not trigger ResizeObserver
    // or scroll events. Track it while visible so tooltips stay attached to
    // controls moving within rails, carousels, and other animated layouts.
    const trackAnchorPosition = () => {
      updatePosition();
      positionAnimationFrame = window.requestAnimationFrame(trackAnchorPosition);
    };
    if (isVisible) {
      positionAnimationFrame = window.requestAnimationFrame(trackAnchorPosition);
    }

    // ResizeObserver for size changes on anchor and popup
    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });
    if (anchor) resizeObserver.observe(anchor);
    if (popup) resizeObserver.observe(popup);

    // Collect scrollable ancestors to listen for scroll events
    const scrollListeners: EventTarget[] = [];
    let parent = anchor?.parentElement ?? null;
    while (parent != null) {
      const { overflow, overflowX, overflowY } = getComputedStyle(parent);
      if (
        overflow !== 'visible' || overflowX !== 'visible' || overflowY !== 'visible'
      ) {
        parent.addEventListener('scroll', updatePosition, { passive: true });
        scrollListeners.push(parent);
      }
      parent = parent.parentElement;
    }
    // Also listen on window for top-level scroll and resize
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);

    return () => {
      if (positionAnimationFrame != null) {
        window.cancelAnimationFrame(positionAnimationFrame);
      }
      resizeObserver.disconnect();
      for (const target of scrollListeners) {
        target.removeEventListener('scroll', updatePosition);
      }
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [anchorRef, isVisible, updatePosition]);

  const providedTooltipContent = useMemo(
    () => content != null && isValidElement(content)
      ? cloneElement(content as ReactElement<Partial<TooltipContentInjectedProps>>, {
          tailCenterX: layout.tailCenterX,
          tailDirection: layout.tailDirection,
          focusSearchOrigin: anchorRef.current,
          isPositioned: isVisible && layout.visible,
          maxWidth: Math.max(
            0,
            clipBoundary.width - (EDGE_SPACING * 2) + (CUSTOM_TOOLTIP_VISUAL_INSET * 2),
          ),
        })
      : content,
    [
      anchorRef,
      clipBoundary.width,
      content,
      layout.tailCenterX,
      layout.tailDirection,
      layout.visible,
      isVisible,
    ],
  );
  const boundaryStyle = useMemo(
    () => {
      const portalOffset = getFloatingPortalRootOffset(portalRoot);

      return {
        position: portalOffset.position,
        top: clipBoundary.top - portalOffset.top,
        left: clipBoundary.left - portalOffset.left,
        width: clipBoundary.width,
        height: clipBoundary.height,
        overflow: 'hidden' as const,
        zIndex: 10000,
        pointerEvents: 'none' as const,
      };
    },
    [
      clipBoundary.height,
      clipBoundary.left,
      clipBoundary.top,
      clipBoundary.width,
      portalRoot,
    ],
  );
  const popupStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: layout.top - clipBoundary.top,
      left: layout.left - clipBoundary.left,
      pointerEvents: focusable ? 'auto' as const : 'none' as const,
      visibility: layout.visible ? 'visible' as const : 'hidden' as const,
    }),
    [
      clipBoundary.left,
      clipBoundary.top,
      focusable,
      layout.left,
      layout.top,
      layout.visible,
    ],
  );
  const handleAnimationEnd = useCallback(() => {
    if (!isVisible) {
      const anchor = anchorRef.current;
      const activeElement = document.activeElement;
      const focusFellBackToApplicationBoundary =
        anchor != null &&
        activeElement instanceof HTMLElement &&
        activeElement !== anchor &&
        activeElement.contains(anchor) &&
        activeElement.tabIndex < 0;
      onExited();
      if (focusFellBackToApplicationBoundary) {
        window.requestAnimationFrame(() => {
          if (anchor.isConnected) {
            anchor.focus({ preventScroll: true });
          }
        });
      }
    }
  }, [anchorRef, isVisible, onExited]);
  const handleFocusCapture = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement) {
      lastFocusedPopupElementRef.current = event.target;
    }
    onFocusWithinChange(true);
  }, [onFocusWithinChange]);
  const handleBlurCapture = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      onFocusWithinChange(false);
    }
  }, [onFocusWithinChange]);
  const ariaLabel = useMemo(
    () => contentDescription ??
      ([text, metadata].filter(Boolean).join(', ') || undefined),
    [contentDescription, metadata, text],
  );
  const overlayClassName = useMemo(
    () => `${tooltipStyles.tooltipOverlay} ${
      isVisible ? tooltipStyles.fadeIn : tooltipStyles.fadeOut
    }`,
    [isVisible],
  );

  return (
    <div
      style={boundaryStyle}
    >
      <div
        ref={popupRef}
        className={overlayClassName}
        style={popupStyle}
        role="tooltip"
        aria-label={ariaLabel}
        onAnimationEnd={handleAnimationEnd}
        onFocusCapture={handleFocusCapture}
        data-uit-focus-popup-root={focusable ? 'true' : undefined}
        onBlurCapture={handleBlurCapture}
      >
        {providedTooltipContent ?? (
          <DefaultTooltipPresentation
            text={text}
            metadata={metadata}
            showTooltipTail={showTail}
            tailDirection={layout.tailDirection}
            tailCenterX={layout.tailCenterX}
          />
        )}
      </div>
    </div>
  );
});
