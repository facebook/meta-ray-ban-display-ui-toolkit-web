/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * CircularProgressBar component for Meta Ray-Ban Display
 *
 * A circular arc progress indicator with configurable start/end angles,
 * stroke width, and animated progress transitions.
 *
 * Unlike ProgressRing (which is always a full circle), CircularProgressBar
 * supports partial arcs with configurable angular range.
 *
 * Props: progress (0-1), strokeWidthPx, startAngleDegrees, endAngleDegrees
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import {
  getCircularProgressBarAriaLabel,
  getCircularProgressBarClassName,
  getCircularProgressBarClampedProgress,
  getCircularProgressBarContainerStyle,
  getCircularProgressBarGeometry,
  getCircularProgressBarPercentage,
  getCircularProgressBarProgressStyle,
} from './private/CircularProgressBarLayout';
import {
  CIRCULAR_PROGRESS_DEFAULT_END_ANGLE_DEGREES,
  CIRCULAR_PROGRESS_DEFAULT_SIZE,
  CIRCULAR_PROGRESS_DEFAULT_START_ANGLE_DEGREES,
  CIRCULAR_PROGRESS_DEFAULT_STROKE_WIDTH,
} from './private/CircularProgressBarMetrics';
import type { CircularProgressBarProps } from './CircularProgressBar.types';
import styles from './CircularProgressBar.module.css';

export type { CircularProgressBarProps } from './CircularProgressBar.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * CircularProgressBar - configurable arc progress indicator
 *
 * Renders two SVG paths:
 * 1. Track (background) - full arc in track color at 20% opacity
 * 2. Progress arc - partial arc showing current progress
 *
 * Uses SVG path arcs with stroke-linecap round.
 */
export const CircularProgressBar = memo(forwardRef<HTMLDivElement, CircularProgressBarProps>(
  function CircularProgressBar(
    {
      progress = 0,
      animated = false,
      strokeWidthPx = CIRCULAR_PROGRESS_DEFAULT_STROKE_WIDTH,
      startAngleDegrees = CIRCULAR_PROGRESS_DEFAULT_START_ANGLE_DEGREES,
      endAngleDegrees = CIRCULAR_PROGRESS_DEFAULT_END_ANGLE_DEGREES,
      size: sizeProp,
      className = '',
      style = DEFAULT_STYLE,
      'aria-label': ariaLabelProp,
      ...rest
    },
    ref
  ) {
    const clampedProgress = useMemo(
      () => getCircularProgressBarClampedProgress(progress),
      [progress],
    );
    const { trackPath, trackLength } = useMemo(
      () => getCircularProgressBarGeometry({
        size: sizeProp ?? CIRCULAR_PROGRESS_DEFAULT_SIZE,
        strokeWidthPx,
        startAngleDegrees,
        endAngleDegrees,
      }),
      [sizeProp, strokeWidthPx, startAngleDegrees, endAngleDegrees],
    );

    /**
     * Animated progress style using stroke-dasharray on the full track path
     */
    const animatedProgressStyle = useMemo(
      () => getCircularProgressBarProgressStyle({
        progress: clampedProgress,
        trackLength,
        animated,
      }),
      [clampedProgress, trackLength, animated]
    );

    const percentageValue = useMemo(
      () => getCircularProgressBarPercentage(clampedProgress),
      [clampedProgress],
    );

    const containerClassName = useMemo(
      () => getCircularProgressBarClassName(
        styles.circularProgressBar,
        className,
      ),
      [className],
    );
    const containerStyle = useMemo(
      () => getCircularProgressBarContainerStyle({ size: sizeProp, style }),
      [sizeProp, style],
    );
    const coordinateSize = sizeProp ?? CIRCULAR_PROGRESS_DEFAULT_SIZE;
    const viewBox = `0 0 ${coordinateSize} ${coordinateSize}`;
    const ariaLabel = useMemo(
      () => getCircularProgressBarAriaLabel(percentageValue),
      [percentageValue],
    );

    return (
      <div
        {...rest}
        ref={ref}
        className={containerClassName}
        style={containerStyle}
        role="progressbar"
        aria-valuenow={percentageValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabelProp ?? ariaLabel}
      >
        <svg
          className={styles.svg}
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Track (background arc) - full sweep at 20% opacity */}
          <path
            className={styles.track}
            d={trackPath}
            fill="none"
            strokeWidth={strokeWidthPx}
            strokeLinecap="round"
          />

          {/* Progress arc - uses dasharray for animated transitions */}
          <path
            className={styles.progress}
            d={trackPath}
            fill="none"
            strokeWidth={strokeWidthPx}
            strokeLinecap="round"
            style={animatedProgressStyle}
          />
        </svg>
      </div>
    );
  }
));
