/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ButtonRail component for Meta Ray-Ban Display
 *
 * A horizontally scrolling group of buttons. Use instead of ButtonGroup
 * when items may exceed the viewport width and need to scroll.
 *
 * Features:
 * - Contains a ButtonGroup internally with START alignment
 * - Smooth spring-like scroll animation when focus moves between items
 * - Fading edge gradients on overflow sides
 * - Left/Right arrow key navigation between child buttons
 * - Optional anchor view for centering behavior
 * - Centers content when smaller than width (configurable)
 * - No touch — all interaction via d-pad/trackpad
 *
 * Key differences from ButtonGroup:
 * - Alignment is always START (not configurable)
 * - Handles horizontal scrolling automatically
 * - Draws fading edge gradients at overflow boundaries
 */

import {
  forwardRef,
  memo,
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import type { ButtonRailHandle, ButtonRailProps } from './ButtonRail.types';
import {
  calculateButtonRailTranslation,
  getButtonRailAppliedTranslation,
  getButtonRailFadingEdges,
  getButtonRailFocusFollowTranslation,
  getButtonRailMonotonicFollowTranslation,
  getButtonRailFocusableChildren,
  getButtonRailNextFocusable,
  getButtonRailScrollX,
  getButtonRailVisualContentWidth,
  measureButtonRailVisualChildMetrics,
  measureButtonRailProjectedVisualChildMetrics,
} from './private/ButtonRailLayout';
import {
  AnimationDurations,
  getEasedProgressForStateChange,
} from '@wearables-ui-toolkit/foundation/motion/Animations';
import { usePrefersReducedMotion } from '@wearables-ui-toolkit/foundation/motion/usePrefersReducedMotion';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  BUTTON_RAIL_SCROLL_SPRING_DAMPING,
  BUTTON_RAIL_SCROLL_SPRING_FRAME_MS,
  BUTTON_RAIL_SCROLL_SPRING_MASS,
  BUTTON_RAIL_SCROLL_SPRING_POSITION_THRESHOLD,
  BUTTON_RAIL_SCROLL_SPRING_STIFFNESS,
  BUTTON_RAIL_SCROLL_SPRING_VELOCITY_THRESHOLD,
} from './private/ButtonRailMetrics';
import { ButtonRailFrame } from './private/ButtonRailFrame';

export type { ButtonRailHandle, ButtonRailProps } from './ButtonRail.types';

const DEFAULT_STYLE: CSSProperties = {};

function isSpringAtEquilibrium(
  velocity: number,
  endValue: number,
  currentValue: number,
): boolean {
  return (
    Math.abs(velocity) < BUTTON_RAIL_SCROLL_SPRING_VELOCITY_THRESHOLD &&
    Math.abs(currentValue - endValue) <=
      BUTTON_RAIL_SCROLL_SPRING_POSITION_THRESHOLD
  );
}

function stepSpring(
  current: number,
  goal: number,
  deltaTime: number,
  velocity: number,
): { value: number; velocity: number } {
  const displacement = goal - current;
  const springForce = displacement * BUTTON_RAIL_SCROLL_SPRING_STIFFNESS;
  const dampingForce = -velocity * BUTTON_RAIL_SCROLL_SPRING_DAMPING;
  const acceleration =
    (springForce + dampingForce) / BUTTON_RAIL_SCROLL_SPRING_MASS;
  const nextVelocity = velocity + acceleration * deltaTime;

  return {
    value: current + nextVelocity * deltaTime,
    velocity: nextVelocity,
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * ButtonRail component
 * Horizontally scrolling button container with keyboard navigation.
 *
 * Usage:
 * ```tsx
 * <ButtonRail>
 *   <Button icon={<CameraIcon />} />
 *   <Button icon={<VideoIcon />} title="Video" />
 *   <Button icon={<PhotoIcon />} title="Photo" />
 * </ButtonRail>
 *
 * // With anchor (center around 2nd button when focused items are on its side)
 * <ButtonRail anchorIndex={1}>
 *   <Button icon={<LeftIcon />} />
 *   <Button icon={<CenterIcon />} />
 *   <Button icon={<RightIcon />} />
 * </ButtonRail>
 * ```
 */
export const ButtonRail = memo(forwardRef<ButtonRailHandle, ButtonRailProps>(
  function ButtonRail(
    {
      children,
      anchorIndex,
      centerContentWhenSmallerThanWidth = true,
      centerFocusedView = false,
      onScrollChange,
      onChildFocusChange,
      className = '',
      style = DEFAULT_STYLE,
    },
    ref
  ) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);

    // One-shot flag: when set, the next focus-driven scroll skips its animation
    // and the flag is cleared. Set via the
    // `skipAnimationForNextFocusMovement` handle and consumed on the next focus change.
    const skipAnimationForNextFocusRef = useRef(false);

    // Current translation of the inner container (negative = scrolled right).
    // Owned imperatively (translationRef + direct transform mutation) so the
    // spring scroll loop never re-renders React per frame.
    const translationRef = useRef(0);
    const springCurrentValueRef = useRef(0);
    const springVelocityRef = useRef(0);
    const springEndValueRef = useRef(0);
    const springAnimationFrameRef = useRef<number | null>(null);
    const springLastFrameTimeRef = useRef<number | null>(null);
    // Focus-driven layout follow. The rail projects the final Button layout, then
    // follows the focused Button's measured expansion progress. This keeps both
    // movements synchronized even when frame delivery is slower than the nominal
    // state-change duration.
    const followInProgressRef = useRef(false);
    const followStartTimeRef = useRef(0);
    const followStartTranslationRef = useRef(0);
    const followInitialTargetRef = useRef(0);
    const followStartFocusedWidthRef = useRef(0);
    const followTargetFocusedWidthRef = useRef(0);
    const followSettledFrameCountRef = useRef(0);
    const followFrameRef = useRef<number | null>(null);
    const focusExitFrameRef = useRef<number | null>(null);
    // Track which edge fading gradients to show
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);
    // Track the last focused child index for scroll calculations
    const lastFocusedIndexRef = useRef<number>(-1);
    // Cache the most recently measured content/viewport widths so paths that run
    // together within a frame (calculateTranslation + scrollTo, and the spring's
    // per-frame updateFadingEdges) can reuse the same numbers instead of
    // re-reading layout. Refreshed at every real measurement point.
    const lastMeasuredContentWidthRef = useRef<number | null>(null);
    const lastMeasuredViewportWidthRef = useRef<number | null>(null);

    const resetNativeScrollPosition = useCallback(() => {
      const outer = outerRef.current;
      if (outer && outer.scrollLeft !== 0) {
        outer.scrollLeft = 0;
      }
    }, []);

    /**
     * Get all focusable children within the inner container.
     */
    const getFocusableChildren = useCallback((): HTMLElement[] => {
      return getButtonRailFocusableChildren(innerRef.current);
    }, []);

    /**
     * Calculate the desired translation to make a focused child visible.
     */
    const calculateTranslation = useCallback(
      (focusedIndex: number, projectFinalLayout = false): number => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return translationRef.current;

        const children = getFocusableChildren();
        if (children.length === 0) return 0;
        // Measure every child once, then reuse the metrics for both the content
        // width and the translation math (each child was previously read from
        // layout several times per focus change).
        const childMetrics = projectFinalLayout
          ? measureButtonRailProjectedVisualChildMetrics(children, focusedIndex)
          : measureButtonRailVisualChildMetrics(children);
        const contentWidth = getButtonRailVisualContentWidth(
          inner,
          children,
          childMetrics,
        );

        lastMeasuredContentWidthRef.current = contentWidth;
        lastMeasuredViewportWidthRef.current = outer.offsetWidth;

        return calculateButtonRailTranslation({
          focusedIndex,
          currentTranslation: translationRef.current,
          viewportWidth: outer.offsetWidth,
          contentWidth,
          children,
          anchorIndex,
          centerContentWhenSmallerThanWidth,
          centerFocusedView,
          childMetrics,
        });
      },
      [
        getFocusableChildren,
        centerFocusedView,
        centerContentWhenSmallerThanWidth,
        anchorIndex,
      ]
    );

    /**
     * Update fading edge visibility based on current translation.
     */
    const updateFadingEdges = useCallback(
      (tx: number) => {
        const inner = innerRef.current;
        const outer = outerRef.current;
        if (!inner || !outer) return;

        let contentWidth: number;
        let viewportWidth: number;
        if (
          lastMeasuredContentWidthRef.current != null &&
          lastMeasuredViewportWidthRef.current != null
        ) {
          contentWidth = lastMeasuredContentWidthRef.current;
          viewportWidth = lastMeasuredViewportWidthRef.current;
        } else {
          const children = getFocusableChildren();
          contentWidth = getButtonRailVisualContentWidth(inner, children);
          viewportWidth = outer.offsetWidth;
          lastMeasuredContentWidthRef.current = contentWidth;
          lastMeasuredViewportWidthRef.current = viewportWidth;
        }

        const edges = getButtonRailFadingEdges(tx, viewportWidth, contentWidth);
        setShowLeftFade(edges.showLeftFade);
        setShowRightFade(edges.showRightFade);
      },
      [getFocusableChildren]
    );

    // Drive the scroll transform imperatively. Mutating the inner element's
    // transform directly (instead of via React state) keeps the spring rAF loop
    // off the React render path — following the codebase's motion guidance
    // ("avoid per-frame React state for animation").
    const applyTransform = useCallback((value: number) => {
      const inner = innerRef.current;
      if (inner != null) {
        inner.style.transform = `translateX(${Math.round(value)}px)`;
      }
    }, []);

    const commitTranslation = useCallback(
      (nextTranslation: number) => {
        const previousTranslation = translationRef.current;
        const constrainedTranslation = followInProgressRef.current
          ? getButtonRailMonotonicFollowTranslation(
              previousTranslation,
              followStartTranslationRef.current,
              followInitialTargetRef.current,
              nextTranslation,
            )
          : nextTranslation;
        const roundedTranslation = Math.round(constrainedTranslation);

        translationRef.current = roundedTranslation;
        applyTransform(roundedTranslation);
        updateFadingEdges(roundedTranslation);

        if (previousTranslation === roundedTranslation) {
          return;
        }

        const scrollX = getButtonRailScrollX(roundedTranslation);
        const previousScrollX = getButtonRailScrollX(previousTranslation);
        onScrollChange?.(scrollX, scrollX - previousScrollX);
      },
      [applyTransform, onScrollChange, updateFadingEdges],
    );

    const cancelSpring = useCallback(() => {
      if (springAnimationFrameRef.current != null) {
        window.cancelAnimationFrame(springAnimationFrameRef.current);
        springAnimationFrameRef.current = null;
      }
      springLastFrameTimeRef.current = null;
      springVelocityRef.current = 0;
    }, []);

    const cancelLayoutFollow = useCallback(() => {
      followInProgressRef.current = false;
      followStartTimeRef.current = 0;
      if (followFrameRef.current != null) {
        window.cancelAnimationFrame(followFrameRef.current);
        followFrameRef.current = null;
      }
    }, []);

    const animateSpringTo = useCallback(
      (endValue: number) => {
        if (springAnimationFrameRef.current == null) {
          springCurrentValueRef.current = translationRef.current;
          springVelocityRef.current = 0;
          springLastFrameTimeRef.current = null;
        }

        springEndValueRef.current = endValue;

        if (springAnimationFrameRef.current != null) {
          return;
        }

        const tick = (now: number) => {
          const end = springEndValueRef.current;
          const current = springCurrentValueRef.current;
          const lastFrameTime = springLastFrameTimeRef.current ?? now;
          const deltaTime = Math.min(
            now - lastFrameTime,
            BUTTON_RAIL_SCROLL_SPRING_FRAME_MS,
          ) / 1000;

          springLastFrameTimeRef.current = now;

          if (isSpringAtEquilibrium(springVelocityRef.current, end, current)) {
            springCurrentValueRef.current = end;
            springVelocityRef.current = 0;
            springAnimationFrameRef.current = null;
            springLastFrameTimeRef.current = null;
            commitTranslation(end);
            return;
          }

          const next = stepSpring(
            current,
            end,
            deltaTime,
            springVelocityRef.current,
          );

          springCurrentValueRef.current = next.value;
          springVelocityRef.current = next.velocity;
          commitTranslation(next.value);
          springAnimationFrameRef.current = window.requestAnimationFrame(tick);
        };

        springAnimationFrameRef.current = window.requestAnimationFrame(tick);
      },
      [commitTranslation],
    );

    /**
     * Apply scroll to a target translation with optional animation.
     */
    const scrollTo = useCallback(
      (
        newTranslation: number,
        shouldAnimate: boolean,
        allowRunningAnimation = false,
        reuseMeasurement = false,
      ) => {
        resetNativeScrollPosition();
        const outer = outerRef.current;
        const inner = innerRef.current;
        let viewportWidth: number;
        let contentWidth: number;
        if (
          reuseMeasurement &&
          lastMeasuredContentWidthRef.current != null &&
          lastMeasuredViewportWidthRef.current != null
        ) {
          viewportWidth = lastMeasuredViewportWidthRef.current;
          contentWidth = lastMeasuredContentWidthRef.current;
        } else {
          viewportWidth = outer?.offsetWidth ?? 0;
          const children = getFocusableChildren();
          contentWidth = getButtonRailVisualContentWidth(inner, children);
          lastMeasuredContentWidthRef.current = contentWidth;
          lastMeasuredViewportWidthRef.current = viewportWidth;
        }
        const appliedTranslation = getButtonRailAppliedTranslation(
          newTranslation,
          viewportWidth,
          contentWidth,
          centerFocusedView,
        );
        const delta = appliedTranslation - translationRef.current;

        if (Math.abs(delta) < 1 && springAnimationFrameRef.current == null) {
          updateFadingEdges(translationRef.current);
          return;
        }

        if (
          shouldAnimate ||
          (allowRunningAnimation && springAnimationFrameRef.current != null)
        ) {
          animateSpringTo(appliedTranslation);
          return;
        }

        cancelSpring();
        springCurrentValueRef.current = appliedTranslation;
        springEndValueRef.current = appliedTranslation;
        commitTranslation(appliedTranslation);
      },
      [
        animateSpringTo,
        cancelSpring,
        commitTranslation,
        centerFocusedView,
        getFocusableChildren,
        resetNativeScrollPosition,
        updateFadingEdges,
      ]
    );

    const getAppliedTranslation = useCallback(
      (translation: number): number => {
        return getButtonRailAppliedTranslation(
          translation,
          lastMeasuredViewportWidthRef.current ?? 0,
          lastMeasuredContentWidthRef.current ?? 0,
          centerFocusedView,
        );
      },
      [centerFocusedView],
    );

    // Re-measure only when layout changes. The animation frame loop consumes
    // this cached target without forcing another layout pass.
    const runFollowRecompute = useCallback(() => {
      const measuredTranslation = calculateTranslation(
        lastFocusedIndexRef.current,
      );
      const newTranslation = getAppliedTranslation(measuredTranslation);

      if (followInProgressRef.current) {
        return;
      }

      scrollTo(newTranslation, false, false, true);
    }, [calculateTranslation, getAppliedTranslation, scrollTo]);

    const startLayoutFollow = useCallback(
      (shouldAnimate: boolean) => {
        // Clear any pending follow schedules from a previous focus.
        if (followFrameRef.current != null) {
          window.cancelAnimationFrame(followFrameRef.current);
          followFrameRef.current = null;
        }
        if (shouldAnimate) {
          cancelSpring();
          const startTime = performance.now();
          const startTranslation = translationRef.current;
          const measuredTarget = calculateTranslation(
            lastFocusedIndexRef.current,
            true,
          );
          const initialTarget = getAppliedTranslation(measuredTarget);
          const focusedChild = getFocusableChildren()[
            lastFocusedIndexRef.current
          ];
          const startFocusedWidth = focusedChild?.offsetWidth ?? 0;
          const targetFocusedWidth = Number.parseFloat(
            focusedChild?.getAttribute(
              'data-uit-button-focused-layout-width',
            ) ?? '',
          );

          followInProgressRef.current = true;
          followStartTimeRef.current = startTime;
          followStartTranslationRef.current = startTranslation;
          followInitialTargetRef.current = initialTarget;
          followStartFocusedWidthRef.current = startFocusedWidth;
          followTargetFocusedWidthRef.current = Number.isFinite(
            targetFocusedWidth,
          )
            ? targetFocusedWidth
            : startFocusedWidth;
          followSettledFrameCountRef.current = 0;

          const tick = () => {
            const now = performance.now();
            const timeProgress = Math.min(
              Math.max(
                (now - followStartTimeRef.current) /
                  AnimationDurations.CONTAINER_STATE_CHANGE,
                0,
              ),
              1,
            );
            const currentFocusedWidth = focusedChild?.offsetWidth ?? 0;
            const focusedWidthDelta =
              followTargetFocusedWidthRef.current -
              followStartFocusedWidthRef.current;
            const tracksButtonWidth = Math.abs(focusedWidthDelta) >= 1;
            const progress = tracksButtonWidth
              ? Math.min(
                  Math.max(
                    (currentFocusedWidth -
                      followStartFocusedWidthRef.current) /
                      focusedWidthDelta,
                    0,
                  ),
                  1,
                )
              : getEasedProgressForStateChange(
                  State.DEFAULT,
                  State.FOCUSED,
                  timeProgress,
                );
            commitTranslation(getButtonRailFocusFollowTranslation(
              followStartTranslationRef.current,
              followInitialTargetRef.current,
              progress,
            ));

            const exceededFallbackDeadline =
              now - followStartTimeRef.current >=
              AnimationDurations.CONTAINER_STATE_CHANGE * 4;
            const focusedChildIsStable =
              document.activeElement === focusedChild && progress >= 0.999;
            followSettledFrameCountRef.current = focusedChildIsStable
              ? followSettledFrameCountRef.current + 1
              : 0;
            if (
              followSettledFrameCountRef.current < 2 &&
              !exceededFallbackDeadline &&
              followInProgressRef.current
            ) {
              followFrameRef.current = window.requestAnimationFrame(tick);
              return;
            }

            commitTranslation(followInitialTargetRef.current);
            followFrameRef.current = null;
            followInProgressRef.current = false;
            followStartTimeRef.current = 0;
            runFollowRecompute();
          };

          followFrameRef.current = window.requestAnimationFrame(tick);
        } else {
          cancelSpring();
          followInProgressRef.current = false;
          followFrameRef.current = window.requestAnimationFrame(() => {
            followFrameRef.current = null;
            runFollowRecompute();
          });
        }
      },
      [
        calculateTranslation,
        cancelSpring,
        commitTranslation,
        getAppliedTranslation,
        getFocusableChildren,
        runFollowRecompute,
      ],
    );

    /**
     * Handle keyboard navigation between children.
     * Performs a focus search for left / right navigation.
     */
    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
          return;
        }

        const focusable = getFocusableChildren();
        if (focusable.length === 0) return;

        const active = document.activeElement as HTMLElement;
        // Only trap when focus is on a rail child; otherwise let the event
        // bubble (e.g. focus is on the rail container itself).
        if (focusable.indexOf(active) === -1) return;

        // Trap horizontal navigation inside the rail: at the edges, focus stays
        // on the currently focused button so left/right never escapes the rail —
        // consume the event even when there is no adjacent button and focus
        // simply stays put.
        event.preventDefault();
        event.stopPropagation();

        const nextFocusable = getButtonRailNextFocusable(
          focusable,
          active,
          event.key,
        );

        if (nextFocusable != null) {
          nextFocusable.focus({ preventScroll: true });
          resetNativeScrollPosition();
        }
      },
      [getFocusableChildren, resetNativeScrollPosition]
    );

    /**
     * Handle focus changes within the rail.
     * Triggers scroll adjustment when a child gains focus.
     */
    const handleFocusIn = useCallback(
      (event: FocusEvent<HTMLDivElement>) => {
        resetNativeScrollPosition();
        const focusable = getFocusableChildren();
        const target = event.target as HTMLElement;
        const index = focusable.indexOf(target);

        if (index >= 0) {
          if (focusExitFrameRef.current != null) {
            window.cancelAnimationFrame(focusExitFrameRef.current);
            focusExitFrameRef.current = null;
          }
          const previousIndex = lastFocusedIndexRef.current;
          lastFocusedIndexRef.current = index;
          if (index === previousIndex && followInProgressRef.current) {
            onChildFocusChange?.(target);
            return;
          }
          const skipAnimation = skipAnimationForNextFocusRef.current;
          skipAnimationForNextFocusRef.current = false;
          const shouldAnimate =
            !skipAnimation &&
            !prefersReducedMotion &&
            previousIndex >= 0;

          if (shouldAnimate) {
            startLayoutFollow(true);
          } else {
            startLayoutFollow(false);
          }

          onChildFocusChange?.(target);
        }
      },
      [
        getFocusableChildren,
        prefersReducedMotion,
        startLayoutFollow,
        onChildFocusChange,
        resetNativeScrollPosition,
      ]
    );

    const handleFocusOut = useCallback(
      (event: FocusEvent<HTMLDivElement>) => {
        const container = outerRef.current;
        if (!container) return;

        if (
          event.relatedTarget &&
          container.contains(event.relatedTarget as Node)
        ) {
          return;
        }

        if (focusExitFrameRef.current != null) {
          window.cancelAnimationFrame(focusExitFrameRef.current);
        }
        focusExitFrameRef.current = window.requestAnimationFrame(() => {
          focusExitFrameRef.current = null;
          const active = document.activeElement;
          const lastFocusedChild = getFocusableChildren()[
            lastFocusedIndexRef.current
          ];
          if (active === lastFocusedChild) {
            return;
          }
          if (
            active instanceof HTMLElement &&
            (container.contains(active) || active.contains(container)) &&
            lastFocusedChild != null
          ) {
            lastFocusedChild.focus({ preventScroll: true });
            resetNativeScrollPosition();
            return;
          }

          onChildFocusChange?.(null);
          cancelLayoutFollow();
        });
      },
      [
        cancelLayoutFollow,
        getFocusableChildren,
        onChildFocusChange,
        resetNativeScrollPosition,
      ]
    );

    /**
     * Recompute scroll position when content or viewport size changes.
     * Handles size-change and layout-change events.
     */
    useLayoutEffect(() => {
      if (followInProgressRef.current) {
        return;
      }
      const newTranslation = calculateTranslation(
        lastFocusedIndexRef.current
      );
      scrollTo(newTranslation, false, true, true);
    }, [children]); // eslint-disable-line react-hooks/exhaustive-deps

    useLayoutEffect(() => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner || typeof ResizeObserver === 'undefined') {
        return;
      }

      let animationFrame: number | null = null;
      const scheduleRecompute = () => {
        if (animationFrame != null) {
          window.cancelAnimationFrame(animationFrame);
        }
        animationFrame = window.requestAnimationFrame(() => {
          animationFrame = null;
          runFollowRecompute();
        });
      };

      const resizeObserver = new ResizeObserver(scheduleRecompute);
      resizeObserver.observe(outer);
      resizeObserver.observe(inner);
      Array.from(inner.children).forEach(child => resizeObserver.observe(child));
      scheduleRecompute();

      return () => {
        if (animationFrame != null) {
          window.cancelAnimationFrame(animationFrame);
        }
        resizeObserver.disconnect();
      };
    }, [children, runFollowRecompute]);

    /**
     * Initialize fading edges on mount.
     */
    useEffect(() => {
      updateFadingEdges(translationRef.current);
    }, [updateFadingEdges]);

    // Keep the inner element's transform in sync with the imperatively-owned
    // translation on every render (innerStyle no longer carries transform), so
    // the initial paint always has an explicit translateX and re-renders (e.g.
    // fade-edge toggles) re-apply rather than clear it.
    useLayoutEffect(() => {
      applyTransform(translationRef.current);
    });

    useEffect(() => {
      return () => {
        if (focusExitFrameRef.current != null) {
          window.cancelAnimationFrame(focusExitFrameRef.current);
          focusExitFrameRef.current = null;
        }
        cancelLayoutFollow();
        cancelSpring();
      };
    }, [cancelLayoutFollow, cancelSpring]);

    /**
     * Whether a focusable child within the rail currently holds focus.
     */
    const hasFocusedChild = useCallback((): boolean => {
      const outer = outerRef.current;
      const active = document.activeElement;
      return (
        outer != null &&
        active != null &&
        active !== outer &&
        outer.contains(active)
      );
    }, []);

    useImperativeHandle<ButtonRailHandle, ButtonRailHandle>(
      ref,
      () => ({
        skipAnimationForNextFocusMovement: () => {
          skipAnimationForNextFocusRef.current = true;
        },
        resetScrollPositionIfNoFocusedChild: (animated: boolean) => {
          if (hasFocusedChild()) {
            return;
          }
          cancelLayoutFollow();
          lastFocusedIndexRef.current = -1;
          scrollTo(calculateTranslation(-1), animated);
        },
        updateScrollPosition: (animated: boolean) => {
          cancelLayoutFollow();
          scrollTo(calculateTranslation(lastFocusedIndexRef.current), animated);
        },
        getElement: () => outerRef.current,
      }),
      [calculateTranslation, cancelLayoutFollow, hasFocusedChild, scrollTo],
    );

    // Transform is driven imperatively via applyTransform (direct DOM mutation
    // in the spring rAF loop), so React never re-renders per frame and
    // re-renders (e.g. fade-edge toggles) never clobber the animated transform.
    // transition:none keeps scrolling snappy. The memo is a stable object so the
    // inner element's React-managed style never changes after mount.
    const innerStyle = useMemo<CSSProperties>(
      () => ({
        transition: 'none',
      }),
      [],
    );

    return (
      <ButtonRailFrame
        outerRef={outerRef}
        innerRef={innerRef}
        className={className}
        style={style}
        innerStyle={innerStyle}
        showLeftFade={showLeftFade}
        showRightFade={showRightFade}
        onScroll={resetNativeScrollPosition}
        onKeyDown={handleKeyDown}
        onFocus={handleFocusIn}
        onBlur={handleFocusOut}
      >
        {children}
      </ButtonRailFrame>
    );
  }
));
