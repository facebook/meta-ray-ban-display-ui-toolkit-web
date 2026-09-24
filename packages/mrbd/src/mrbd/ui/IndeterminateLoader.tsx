/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * IndeterminateLoader component for Meta Ray-Ban Display
 *
 * A spinning loading indicator for unknown-duration loading states.
 * Uses SVG with CSS keyframe animations for a rotating arc that changes
 * sweep length.
 *
 * Sizes: XSMALL (24px), SMALL (32px), MEDIUM (48px), LARGE (72px)
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import {
  INDETERMINATE_LOADER_CIRCLE_CENTER,
  INDETERMINATE_LOADER_PATH_LENGTH,
  INDETERMINATE_LOADER_VIEWBOX_SIZE,
} from './private/IndeterminateLoaderMetrics';
import {
  getIndeterminateLoaderClassName,
  getIndeterminateLoaderGeometry,
} from './private/IndeterminateLoaderLayout';
import {
  IndeterminateLoaderSize,
  type IndeterminateLoaderProps,
} from './IndeterminateLoader.types';
import styles from './IndeterminateLoader.module.css';

export { IndeterminateLoaderSize } from './IndeterminateLoader.types';
export type { IndeterminateLoaderProps } from './IndeterminateLoader.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * IndeterminateLoader - spinning loading indicator
 *
 * Renders an SVG circle with CSS animations implementing a
 * Material Design indeterminate spinner:
 * - The entire SVG rotates continuously
 * - The stroke dash pattern animates to create the growing/shrinking arc effect
 */
export const IndeterminateLoader = memo(forwardRef<HTMLDivElement, IndeterminateLoaderProps>(
  function IndeterminateLoader(
    {
      isAnimating = true,
      size = IndeterminateLoaderSize.LARGE,
      className = '',
      style = DEFAULT_STYLE,
      'aria-label': ariaLabel = 'Loading',
      ...rest
    },
    ref
  ) {
    /**
     * Scale the stroke width relative to the viewBox.
     * The viewBox is always 48, but we render at different pixel sizes.
     * Stroke width in viewBox coordinates = (strokeWidth / sizePx) * viewBoxSize
     */
    const {
      circleRadius,
      scaledStrokeWidth,
    } = useMemo(
      () => getIndeterminateLoaderGeometry(size),
      [size],
    );

    const loaderClassName = useMemo(
      () => getIndeterminateLoaderClassName({
        baseClassName: styles.loader,
        sizeClassName: styles[size],
        pausedClassName: styles.loaderPaused,
        isAnimating,
        className,
      }),
      [size, isAnimating, className],
    );

    return (
      <div
        {...rest}
        ref={ref}
        className={loaderClassName}
        style={style}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <svg
          className={styles.loaderSvg}
          viewBox={`0 0 ${INDETERMINATE_LOADER_VIEWBOX_SIZE} ${INDETERMINATE_LOADER_VIEWBOX_SIZE}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className={styles.loaderCircle}
            cx={INDETERMINATE_LOADER_CIRCLE_CENTER}
            cy={INDETERMINATE_LOADER_CIRCLE_CENTER}
            r={circleRadius}
            strokeWidth={scaledStrokeWidth}
            pathLength={INDETERMINATE_LOADER_PATH_LENGTH}
          />
        </svg>
      </div>
    );
  }
));
