/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ProgressRing component for Meta Ray-Ban Display
 *
 * A circular determinate progress indicator with a background track
 * and a progress arc. Progress fills from 0.0 to 1.0 (top, clockwise).
 *
 * Supports smooth spring-like animated transitions between progress values
 * using CSS transitions.
 *
 * Sizes: SMALL (48px), LARGE (100px)
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import {
  getProgressRingArcTransform,
  getProgressRingAriaLabel,
  getProgressRingClassName,
  getProgressRingClampedProgress,
  getProgressRingGeometry,
  getProgressRingPercentage,
  getProgressRingProgressCircleStyle,
} from './private/ProgressRingLayout';
import {
  PROGRESS_RING_STROKE_WIDTH,
} from './private/ProgressRingMetrics';
import {
  ProgressRingSize,
  type ProgressRingProps,
} from './ProgressRing.types';
import styles from './ProgressRing.module.css';

export { ProgressRingSize } from './ProgressRing.types';
export type { ProgressRingProps } from './ProgressRing.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * ProgressRing - circular determinate progress indicator
 *
 * Renders two SVG circles:
 * 1. Track (background) - full circle in track color
 * 2. Progress arc (foreground) - partial circle showing progress
 *
 * Uses stroke-dasharray and stroke-dashoffset for the progress arc,
 * with optional CSS transition for smooth animated changes.
 */
export const ProgressRing = memo(forwardRef<HTMLDivElement, ProgressRingProps>(
  function ProgressRing(
    {
      progress = 0,
      size = ProgressRingSize.SMALL,
      animated = false,
      announceUpdatesForAccessibility = false,
      className = '',
      style = DEFAULT_STYLE,
      'aria-label': ariaLabelProp,
      ...rest
    },
    ref
  ) {
    /** Clamp progress to 0-1 range */
    const clampedProgress = useMemo(
      () => getProgressRingClampedProgress(progress),
      [progress],
    );
    const { sizePx, center, radius, circumference } = useMemo(
      () => getProgressRingGeometry(size),
      [size],
    );

    /**
     * Progress arc inline styles
     * Conditionally applies CSS transition for animated mode
     */
    const progressCircleStyle = useMemo(
      () => getProgressRingProgressCircleStyle({
        circumference,
        progress: clampedProgress,
        animated,
      }),
      [circumference, clampedProgress, animated]
    );

    /** Percentage for accessibility (rounded to nearest integer) */
    const percentageValue = useMemo(
      () => getProgressRingPercentage(clampedProgress),
      [clampedProgress],
    );

    const ringClassName = useMemo(
      () => getProgressRingClassName({
        baseClassName: styles.progressRing,
        ringClassName: styles.ring,
        sizeClassName: styles[size],
        className,
      }),
      [size, className],
    );
    const ariaLabel = useMemo(
      () => getProgressRingAriaLabel(percentageValue, ariaLabelProp),
      [percentageValue, ariaLabelProp],
    );
    /**
     * Live-region text announces the rounded percentage (e.g. "<pct>%").
     * Empty when announcements are disabled so nothing is announced. (Just the
     * percentage — a caller label is part of the static aria-label, not re-announced.)
     *
     * The `role="progressbar"` element is not focusable (no tab stop), so there
     * is no accessibility-focus state to gate on — gating on focus would silence
     * announcements entirely. Announcements are therefore gated only on the
     * caller's `announceUpdatesForAccessibility` opt-in; this is the intentional
     * non-focusable-progressbar idiom (same as ZoomIndicator/ProgressIndicator).
     */
    const liveAnnouncement = announceUpdatesForAccessibility
      ? `${percentageValue}%`
      : '';
    const arcTransform = useMemo(
      () => getProgressRingArcTransform(center),
      [center],
    );

    return (
      <div
        className={ringClassName}
        style={style}
      >
        <div
          {...rest}
          ref={ref}
          className={styles.progressbar}
          role="progressbar"
          aria-valuenow={percentageValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ariaLabel}
        >
          <svg
            className={styles.ringSvg}
            viewBox={`0 0 ${sizePx} ${sizePx}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Track (background circle) */}
            <circle
              className={styles.ringTrack}
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={PROGRESS_RING_STROKE_WIDTH}
            />

            {/* Progress arc (foreground) */}
            <circle
              className={styles.ringProgress}
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={PROGRESS_RING_STROKE_WIDTH}
              style={progressCircleStyle}
              transform={arcTransform}
            />
          </svg>
        </div>
        {/* Live region announces "<pct>%" on progress change when enabled.
            Kept a sibling of the role="progressbar" element so screen readers
            reliably announce updates. */}
        <div
          className={styles.visuallyHidden}
          aria-live="polite"
          aria-atomic="true"
        >
          {liveAnnouncement}
        </div>
      </div>
    );
  }
));
