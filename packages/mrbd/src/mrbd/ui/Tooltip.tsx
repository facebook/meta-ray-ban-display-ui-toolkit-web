/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Tooltip component for Meta Ray-Ban Display
 *
 * NOT a visual component — it's a manager that shows/hides a TooltipContainer
 * relative to an anchor element.
 *
 * Features:
 * - show()/hide() imperative API via useTooltip hook
 * - Positions TooltipContainer relative to an anchor element
 * - Optional auto-hide after a 5s timeout (off by default; opt in via
 *   shouldAutoDismiss)
 * - Animated entrance/exit (fade)
 * - Supports ANCHORED (above), ANCHORED_BOTTOM (below), and CENTERED positions
 * - Auto-repositions on scroll/resize
 *
 * Usage (hook):
 * ```tsx
 * const tooltip = useTooltip();
 * tooltip.show(anchorRef.current, { text: 'Hello', metadata: 'World' });
 * tooltip.hide();
 * ```
 *
 * Usage (component):
 * ```tsx
 * <Tooltip
 *   anchorRef={myRef}
 *   text="Hello"
 *   isVisible={showTooltip}
 *   onHide={() => setShowTooltip(false)}
 * />
 * ```
 */

import {
  memo,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type DependencyList,
  type ReactNode,
} from 'react';
import { TooltipPosition } from '@wearables-ui-toolkit/foundation/base/InteractableBase';
import {
  getInitialTooltipTailDirection,
  getTooltipBoundaryRect,
  getWindowTooltipBoundaryRect,
} from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';
import type { TooltipBoundaryRect } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';
import {
  TOOLTIP_ANIMATION_DURATION,
  TOOLTIP_AUTO_HIDE_DELAY,
} from './private/TooltipMetrics';
import {
  calculateTooltipPositionLayout,
  getTooltipAccessibleLabel,
  hasTooltipContent,
  shouldAutoDismissTooltip,
  shouldUpdateTooltipBoundary,
} from './private/TooltipLayout';
import { TooltipPortal } from './private/TooltipPortal';
import type {
  TooltipProps,
  TooltipShowOptions,
  TooltipState,
} from './Tooltip.types';

export { TooltipPosition };
export type {
  TooltipAnchorPoint,
  TooltipAnchorRect,
  TooltipCenterPositionProvider,
  TooltipProps,
  TooltipShowOptions,
  TooltipState,
  TooltipTargetRectProvider,
} from './Tooltip.types';

// ============================================================================
// Hook: useTooltip
// ============================================================================

/**
 * useTooltip hook
 * Imperative API for showing/hiding tooltips.
 * Manages lifecycle, positioning, and auto-dismiss.
 *
 * Usage:
 * ```tsx
 * const tooltip = useTooltip();
 *
 * <button
 *   ref={buttonRef}
 *   onFocus={() => tooltip.show(buttonRef.current!, { text: 'Help text' })}
 *   onBlur={() => tooltip.hide()}
 * >
 *   Hover me
 * </button>
 *
 * {tooltip.isShowing && tooltip.portal}
 * ```
 */
export function useTooltip(): TooltipState {
  const [isShowing, setIsShowing] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [options, setOptions] = useState<TooltipShowOptions>({});
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [clipBoundary, setClipBoundary] = useState<TooltipBoundaryRect>(
    getWindowTooltipBoundaryRect
  );
  const [tailCenterX, setTailCenterX] = useState<number | undefined>(undefined);
  const [tailDirection, setTailDirection] = useState<'up' | 'down' | undefined>(undefined);

  const anchorRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isShowingRef = useRef(false);
  const isDismissingRef = useRef(false);
  // The onHide callback for the currently-shown tooltip. Held in a ref so it is
  // not a dependency of hide(); cleared once fired so it never fires twice for a
  // single show/hide cycle.
  const onHideRef = useRef<(() => void) | undefined>(undefined);

  const fireOnHide = useCallback(() => {
    const onHide = onHideRef.current;
    onHideRef.current = undefined;
    onHide?.();
  }, []);

  useEffect(() => {
    isShowingRef.current = isShowing;
  }, [isShowing]);

  useEffect(() => {
    isDismissingRef.current = isDismissing;
  }, [isDismissing]);

  /**
   * Calculate tooltip position relative to anchor.
   */
  const calculatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;

    const layout = calculateTooltipPositionLayout(anchor, tooltip, options);
    setClipBoundary(prev =>
      shouldUpdateTooltipBoundary(prev, layout.boundaryRect)
        ? layout.boundaryRect
        : prev
    );
    // The tracksAnchorScale path drives this every frame via rAF; bail out of
    // the position setState when nothing moved so we don't spin the React tree
    // on a steady-state anchor.
    setPosition(prev =>
      prev.top === layout.position.top && prev.left === layout.position.left
        ? prev
        : layout.position
    );
    setTailCenterX(prev =>
      prev === layout.tailCenterX ? prev : layout.tailCenterX
    );
    setTailDirection(prev =>
      prev === layout.tailDirection ? prev : layout.tailDirection
    );
    setIsPositioned(true);
  }, [options]);

  const clearTimers = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    if (fadeOutTimerRef.current) {
      clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
  }, []);

  const hide = useCallback((animated: boolean = true) => {
    clearTimers();

    if (!isShowingRef.current && !isDismissingRef.current) return;

    if (animated) {
      isDismissingRef.current = true;
      setIsDismissing(true);
      fadeOutTimerRef.current = setTimeout(() => {
        isShowingRef.current = false;
        isDismissingRef.current = false;
        setIsShowing(false);
        setIsDismissing(false);
        setIsPositioned(false);
        anchorRef.current = null;
        fireOnHide();
      }, TOOLTIP_ANIMATION_DURATION);
    } else {
      isShowingRef.current = false;
      isDismissingRef.current = false;
      setIsShowing(false);
      setIsDismissing(false);
      setIsPositioned(false);
      anchorRef.current = null;
      fireOnHide();
    }
  }, [clearTimers, fireOnHide]);

  const show = useCallback((anchor: HTMLElement, opts: TooltipShowOptions) => {
    if (!hasTooltipContent(opts)) return;

    clearTimers();

    // Hide any existing tooltip without animation. Re-showing replaces the prior
    // tooltip, so fire its onHide before adopting the new callback so each shown
    // tooltip's onHide fires exactly once.
    fireOnHide();
    onHideRef.current = opts.onHide;
    isShowingRef.current = true;
    isDismissingRef.current = false;
    setIsDismissing(false);
    setIsPositioned(false);
    anchorRef.current = anchor;
    setClipBoundary(getTooltipBoundaryRect(anchor));
    setTailDirection(
      getInitialTooltipTailDirection(
        opts.position ?? TooltipPosition.ANCHORED,
        opts.content == null && (opts.showTooltipTail ?? true)
      )
    );
    setOptions(opts);
    setIsShowing(true);

    // Set up auto-dismiss
    if (shouldAutoDismissTooltip(opts)) {
      autoDismissTimerRef.current = setTimeout(() => {
        hide(true);
      }, TOOLTIP_AUTO_HIDE_DELAY);
    }
  }, [clearTimers, fireOnHide, hide]);

  const update = useCallback((anchor: HTMLElement, opts: TooltipShowOptions) => {
    if (!hasTooltipContent(opts)) {
      hide(true);
      return;
    }
    if (!isShowingRef.current || isDismissingRef.current || anchorRef.current !== anchor) {
      show(anchor, opts);
      return;
    }

    anchorRef.current = anchor;
    setOptions(opts);
  }, [hide, show]);

  const refreshPosition = useCallback(() => {
    calculatePosition();
  }, [calculatePosition]);

  // Recalculate position when showing or options change
  useEffect(() => {
    if (!isShowing) return;

    // Use requestAnimationFrame to wait for the tooltip to render
    const frame = requestAnimationFrame(() => {
      calculatePosition();
    });

    return () => cancelAnimationFrame(frame);
  }, [isShowing, options, calculatePosition]);

  useEffect(() => {
    if (!isShowing || tailDirection == null) return;

    let secondFrame: number | null = null;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        calculatePosition();
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame != null) {
        cancelAnimationFrame(secondFrame);
      }
    };
  }, [isShowing, tailDirection, calculatePosition]);

  useEffect(() => {
    if (!isShowing || !options.tracksAnchorScale) return;

    let frame: number | null = null;
    const tick = () => {
      calculatePosition();
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      if (frame != null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [isShowing, options.tracksAnchorScale, calculatePosition]);

  useEffect(() => {
    if (!isShowing || !tooltipRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      calculatePosition();
    });
    observer.observe(tooltipRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isShowing, calculatePosition]);

  // Listen for scroll/resize to reposition
  useEffect(() => {
    if (!isShowing) return;

    let frameId: number | null = null;
    let secondFrameId: number | null = null;
    const handleReposition = () => {
      calculatePosition();
      if (frameId != null) {
        cancelAnimationFrame(frameId);
      }
      if (secondFrameId != null) {
        cancelAnimationFrame(secondFrameId);
      }
      frameId = requestAnimationFrame(() => {
        calculatePosition();
        secondFrameId = requestAnimationFrame(calculatePosition);
      });
    };

    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      if (frameId != null) {
        cancelAnimationFrame(frameId);
      }
      if (secondFrameId != null) {
        cancelAnimationFrame(secondFrameId);
      }
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isShowing, calculatePosition]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const accessibleLabel = useMemo(
    () => getTooltipAccessibleLabel(options),
    [options],
  );

  // Build portal content
  const portal = useMemo(
    () => isShowing
      ? (
        <TooltipPortal
          tooltipRef={tooltipRef}
          clipBoundary={clipBoundary}
          position={position}
          isDismissing={isDismissing}
          options={options}
          isPositioned={isPositioned}
          accessibleLabel={accessibleLabel}
          tailDirection={tailDirection}
          tailCenterX={tailCenterX}
        />
      )
      : null,
    [
      accessibleLabel,
      clipBoundary,
      isDismissing,
      isPositioned,
      isShowing,
      options,
      position,
      tailCenterX,
      tailDirection,
    ],
  );

  return {
    isShowing: isShowing && !isDismissing,
    show,
    update,
    hide,
    refreshPosition,
    portal,
  };
}

// ============================================================================
// Declarative Component
// ============================================================================

/**
 * Tooltip component (declarative API)
 * For cases where you want to control visibility via props instead of imperatively.
 *
 * Usage:
 * ```tsx
 * <Tooltip
 *   anchorRef={buttonRef}
 *   text="Help text"
 *   isVisible={showTooltip}
 *   onHide={() => setShowTooltip(false)}
 * />
 * ```
 */
export const Tooltip = memo(function Tooltip({
  anchorRef,
  text,
  metadata,
  icon,
  trailingIcon,
  content,
  contentDescription,
  isFocusable,
  tracksAnchorScale,
  centerPositionProvider,
  targetRectProvider,
  isVisible = false,
  onHide,
  position = TooltipPosition.ANCHORED,
  shouldAutoDismiss = false,
  showTooltipTail = true,
}: TooltipProps): ReactNode {
  const tooltip = useTooltip();

  // Keep the imperative tooltip API and the latest show options in refs so the
  // effects below can read them without listing them as dependencies. The show
  // effect intentionally re-runs only when visibility or content actually
  // changes (see contentDeps), not on every new option-object identity.
  const tooltipRef = useRef(tooltip);
  tooltipRef.current = tooltip;
  const showOptionsRef = useRef<TooltipShowOptions>({});
  showOptionsRef.current = {
    text,
    metadata,
    icon,
    trailingIcon,
    content,
    contentDescription,
    isFocusable,
    tracksAnchorScale,
    centerPositionProvider,
    targetRectProvider,
    position,
    shouldAutoDismiss,
    showTooltipTail,
  };

  // Content identity that should trigger a re-show while already visible.
  // ReactNode/provider fields are included by identity (they rarely change
  // every render in practice), primitives by value.
  const contentDeps: DependencyList = [
    text,
    metadata,
    icon,
    trailingIcon,
    content,
    contentDescription,
    isFocusable,
    tracksAnchorScale,
    centerPositionProvider,
    targetRectProvider,
    position,
    shouldAutoDismiss,
    showTooltipTail,
  ];

  const anchorElementRef = useRef(anchorRef);
  anchorElementRef.current = anchorRef;

  useEffect(() => {
    if (isVisible) {
      const anchor = anchorElementRef.current.current;
      if (anchor) {
        // When the content becomes empty while showing, hide instead of relying
        // on show() to silently no-op (which would leave a stale tooltip visible).
        if (hasTooltipContent(showOptionsRef.current)) {
          if (tooltipRef.current.isShowing) {
            tooltipRef.current.update(anchor, showOptionsRef.current);
          } else {
            tooltipRef.current.show(anchor, showOptionsRef.current);
          }
        } else if (tooltipRef.current.isShowing) {
          tooltipRef.current.hide(true);
        }
      }
    } else if (tooltipRef.current.isShowing) {
      tooltipRef.current.hide(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, ...contentDeps]);

  // Keep onHide in a ref so its identity is not an effect dependency; fire it
  // only on a genuine showing true->false transition (not on mount and not when
  // the callback identity changes mid-show).
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;
  const wasShowingRef = useRef(false);

  useEffect(() => {
    if (wasShowingRef.current && !tooltip.isShowing) {
      onHideRef.current?.();
    }
    wasShowingRef.current = tooltip.isShowing;
  }, [tooltip.isShowing]);

  return tooltip.portal;
});
