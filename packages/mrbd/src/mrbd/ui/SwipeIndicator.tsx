/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SwipeIndicator component for Meta Ray-Ban Display
 *
 * Shows a swipe direction prompt with an arrow caret and optional
 * gradient scrim overlay. It is a display-only element: it does not accept
 * focus or trigger actions. The owning surface controls gesture behavior and
 * may animate the prompt or caret through props and the imperative handle.
 *
 * Props: prompt, expanded, direction (UP/DOWN), showScrim
 */

import {
  forwardRef,
  memo,
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useImperativeHandle,
} from 'react';
import { TextAppearance } from '@wearables-ui-toolkit/foundation/theme/TextAppearance';
import { SwipeIndicatorCaretIcon } from './private/SwipeIndicatorIcon';
import {
  SWIPE_INDICATOR_NUDGE_INTERVAL_MS,
} from './private/SwipeIndicatorMetrics';
import {
  getSwipeIndicatorCaretStyle,
  getSwipeIndicatorClassName,
  getSwipeIndicatorContentStyle,
  getSwipeIndicatorDirectionConfig,
  getSwipeIndicatorNudgeReturnDelay,
  getSwipeIndicatorPromptStyle,
  getSwipeIndicatorScrimStyle,
  shouldRenderSwipeIndicatorPrompt,
  shouldRenderSwipeIndicatorScrim,
} from './private/SwipeIndicatorLayout';
import {
  SwipeDirection,
  type SwipeIndicatorHandle,
  type SwipeIndicatorProps,
} from './SwipeIndicator.types';
import styles from './SwipeIndicator.module.css';

export { SwipeDirection } from './SwipeIndicator.types';
export type {
  SwipeIndicatorHandle,
  SwipeIndicatorProps,
} from './SwipeIndicator.types';

const DEFAULT_STYLE = {};

/**
 * SwipeIndicator - directional swipe prompt with caret and optional scrim.
 *
 * Structure:
 * - Root container with optional gradient scrim background
 * - Content container (translates on expand/collapse)
 *   - Caret (arrow icon, rotated per direction, nudge-animated)
 *   - Prompt text (fades in/out on expand/collapse)
 */
export const SwipeIndicator = memo(forwardRef<SwipeIndicatorHandle, SwipeIndicatorProps>(
  function SwipeIndicator(
    {
      prompt = '',
      expanded = false,
      direction = SwipeDirection.UP,
      showScrim = true,
      animated = false,
      className = '',
      style = DEFAULT_STYLE,
      id,
      'aria-describedby': ariaDescribedBy,
      'aria-hidden': ariaHidden,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      ...candidateDataAttributes
    },
    ref
  ) {
    const [nudgeTranslate, setNudgeTranslate] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const promptRef = useRef<HTMLDivElement>(null);
    const nudgeCountRef = useRef(0);
    const nudgeAnimatedRef = useRef(false);
    const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dirConfig = useMemo(
      () => getSwipeIndicatorDirectionConfig(direction),
      [direction],
    );

    /**
     * Nudge animation implementation.
     * Runs a nudgeStart/nudgeEnd/nudgeNext cycle.
     */
    const nudgeEnd = useCallback(() => {
      setNudgeTranslate(0);
      // nudgeNext
      if (nudgeCountRef.current > 0) {
        nudgeCountRef.current -= 1;
        if (nudgeCountRef.current > 0) {
          nudgeTimerRef.current = setTimeout(() => {
            // nudgeStart
            setNudgeTranslate(dirConfig.nudgeOffset);
            nudgeTimerRef.current = setTimeout(
              nudgeEnd,
              getSwipeIndicatorNudgeReturnDelay(),
            );
          }, SWIPE_INDICATOR_NUDGE_INTERVAL_MS);
        }
      }
    }, [dirConfig.nudgeOffset]);

    const nudgeStart = useCallback(
      (count: number, isAnimated: boolean) => {
        nudgeAnimatedRef.current = isAnimated;
        if (nudgeCountRef.current <= 0) {
          nudgeCountRef.current = count;
          setNudgeTranslate(dirConfig.nudgeOffset);
          nudgeTimerRef.current = setTimeout(
            nudgeEnd,
            getSwipeIndicatorNudgeReturnDelay(),
          );
        } else {
          nudgeCountRef.current = count;
        }
      },
      [dirConfig.nudgeOffset, nudgeEnd]
    );

    // Expose nudge via imperative handle
    useImperativeHandle(
      ref,
      () => ({
        nudge: (count = 1, isAnimated = true) => {
          nudgeStart(count, isAnimated);
        },
      }),
      [nudgeStart]
    );

    // Cleanup timers on unmount
    useEffect(() => {
      return () => {
        if (nudgeTimerRef.current) {
          clearTimeout(nudgeTimerRef.current);
        }
      };
    }, []);

    /**
     * Caret transform: rotation for direction + translateY for nudge.
     */
    const caretStyle = useMemo(
      () => getSwipeIndicatorCaretStyle({
        rotationDegrees: dirConfig.rotationDegrees,
        nudgeTranslate,
        nudgeAnimated: nudgeAnimatedRef.current,
      }),
      [dirConfig.rotationDegrees, nudgeTranslate],
    );

    /**
     * Prompt text styles: opacity fades for expand/collapse.
     */
    const promptStyle = useMemo(
      () => getSwipeIndicatorPromptStyle({ expanded, animated }),
      [expanded, animated],
    );

    const contentStyle = useMemo(
      () => getSwipeIndicatorContentStyle({ expanded, animated }),
      [expanded, animated],
    );

    /**
     * Scrim gradient background.
     * Top-to-bottom gradient [transparent, color] with alpha = SCRIM_ALPHA (35%).
     */
    const scrimStyle = useMemo(
      () => getSwipeIndicatorScrimStyle({ expanded, animated, showScrim }),
      [expanded, animated, showScrim],
    );

    const containerClassName = useMemo(
      () => getSwipeIndicatorClassName(
        styles.swipeIndicator,
        className,
      ),
      [className],
    );
    const promptClassName = useMemo(
      () => `${styles.prompt} ${TextAppearance.META3}`,
      [],
    );
    const dataAttributes = Object.fromEntries(
      Object.entries(candidateDataAttributes).filter(([name]) =>
        name.startsWith('data-')
      ),
    );

    useLayoutEffect(() => {
      const root = rootRef.current;
      const promptElement = promptRef.current;
      if (!root) {
        return;
      }

      const updatePromptHeight = () => {
        const promptHeight = promptElement == null
          ? 0
          : Math.round(promptElement.getBoundingClientRect().height);
        root.style.setProperty(
          '--uit-swipe-indicator-prompt-height',
          `${promptHeight}px`,
        );
      };

      updatePromptHeight();

      if (promptElement == null || typeof ResizeObserver === 'undefined') {
        window.addEventListener('resize', updatePromptHeight);
        return () => {
          window.removeEventListener('resize', updatePromptHeight);
        };
      }

      const resizeObserver = new ResizeObserver(updatePromptHeight);
      resizeObserver.observe(promptElement);

      return () => {
        resizeObserver.disconnect();
      };
    }, [prompt]);

    return (
      <div
        {...dataAttributes}
        ref={rootRef}
        id={id}
        aria-describedby={ariaDescribedBy}
        aria-hidden={ariaHidden}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={containerClassName}
        style={style}
      >
        {/* Scrim gradient overlay */}
        {shouldRenderSwipeIndicatorScrim(showScrim) && (
          <div className={styles.scrim} style={scrimStyle} />
        )}

        {/* Content container */}
        <div className={styles.content} style={contentStyle}>
          {/* Caret arrow */}
          <div className={styles.caret} style={caretStyle}>
            <SwipeIndicatorCaretIcon />
          </div>

          {shouldRenderSwipeIndicatorPrompt(prompt) && (
            <div ref={promptRef} className={promptClassName} style={promptStyle}>
              {prompt}
            </div>
          )}
        </div>
      </div>
    );
  }
));
