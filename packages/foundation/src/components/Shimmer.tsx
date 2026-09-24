/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  forwardRef,
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react';
import {
  SHIMMER_ANIMATION_DURATION_MS,
  SHIMMER_DEFAULT_BASE_ALPHA,
  SHIMMER_STATIC_PROGRESS_MAX,
  SHIMMER_STATIC_PROGRESS_MIN,
  getShimmerMaskOffset,
  getShimmerTranslateWidth,
} from './private/ShimmerMetrics';
import {
  ShimmerItemCornerRadius,
  ShimmerRepeatMode,
  type ShimmerProps,
  type ShimmerItemProps,
} from './Shimmer.types';
import { useComposedRef } from '../utils/useComposedRef';
import styles from './Shimmer.module.css';

export {
  ShimmerItemCornerRadius,
  ShimmerRepeatMode,
} from './Shimmer.types';
export type {
  ShimmerProps,
  ShimmerItemProps,
} from './Shimmer.types';

type ShimmerStyle = CSSProperties & {
  '--uit-shimmer-animation-duration'?: string;
  '--uit-shimmer-animation-delay'?: string;
  '--uit-shimmer-base-opacity'?: number;
  '--uit-shimmer-direction'?: string;
  '--uit-shimmer-iteration-count'?: string | number;
};

const DEFAULT_STYLE: CSSProperties = {};
const DEFAULT_ITEM_STYLE: CSSProperties = {};
const INFINITE_REPEAT_COUNT = -1;

function clampStaticProgress(progress: number): number {
  return Math.min(
    SHIMMER_STATIC_PROGRESS_MAX,
    Math.max(SHIMMER_STATIC_PROGRESS_MIN, progress),
  );
}

function getAnimationIterationCount(repeatCount: number): string | number {
  if (repeatCount < 0) {
    return 'infinite';
  }
  return repeatCount + 1;
}

/**
 * Builds the root class list (running / paused / static).
 *
 * Note: the CSS animation runs whenever shimmering is visible and started. There
 * is no explicit visibility-driven stop/restart — browsers already
 * throttle/pause offscreen CSS animations, so consumers that need a hard stop
 * should toggle `autoStart`/`showShimmer`.
 */
function getRootClassName({
  autoStart,
  className,
  clipToChildren,
  showShimmer,
  staticAnimationProgress,
}: {
  autoStart: boolean;
  className: string;
  clipToChildren: boolean;
  showShimmer: boolean;
  staticAnimationProgress: number | null | undefined;
}): string {
  return [
    styles.root,
    clipToChildren ? styles.clipToChildren : '',
    showShimmer ? styles.shimmerVisible : '',
    showShimmer && staticAnimationProgress == null && autoStart ? styles.running : '',
    showShimmer && staticAnimationProgress == null && !autoStart ? styles.paused : '',
    showShimmer && staticAnimationProgress != null ? styles.static : '',
    className,
  ].filter(Boolean).join(' ');
}

function getRadiusClassName(cornerRadius: ShimmerItemCornerRadius): string {
  switch (cornerRadius) {
    case ShimmerItemCornerRadius.SQUARE:
      return styles.radiusSquare;
    case ShimmerItemCornerRadius.XXSMALL:
      return styles.radiusXxsmall;
    case ShimmerItemCornerRadius.XSMALL:
      return styles.radiusXsmall;
    case ShimmerItemCornerRadius.SMALL:
      return styles.radiusSmall;
    case ShimmerItemCornerRadius.LARGE:
      return styles.radiusLarge;
    case ShimmerItemCornerRadius.XLARGE:
      return styles.radiusXlarge;
    case ShimmerItemCornerRadius.MEDIUM:
    default:
      return styles.radiusMedium;
  }
}

export const Shimmer = memo(forwardRef<HTMLDivElement, ShimmerProps>(
  function Shimmer(
    {
      autoStart = true,
      children,
      className = '',
      clipToChildren = false,
      repeatCount = INFINITE_REPEAT_COUNT,
      repeatMode = ShimmerRepeatMode.RESTART,
      showShimmer = true,
      startDelayMs = 0,
      staticAnimationProgress = null,
      style = DEFAULT_STYLE,
      ...rest
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null);

    const setRootRef = useComposedRef(ref, rootRef);

    useLayoutEffect(() => {
      const root = rootRef.current;
      if (root == null) {
        return;
      }

      const updateMaskGeometry = () => {
        const {width, height} = root.getBoundingClientRect();
        const translateWidth = getShimmerTranslateWidth(width, height);
        const progress =
          staticAnimationProgress == null
            ? SHIMMER_STATIC_PROGRESS_MIN
            : clampStaticProgress(staticAnimationProgress);
        const maskOffset = getShimmerMaskOffset(width, height, progress);

        root.style.setProperty(
          '--uit-shimmer-mask-start-position',
          `${-translateWidth}px 0`,
        );
        root.style.setProperty(
          '--uit-shimmer-mask-end-position',
          `${translateWidth}px 0`,
        );
        root.style.setProperty(
          '--uit-shimmer-mask-position',
          `${maskOffset}px 0`,
        );
      };

      updateMaskGeometry();

      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const resizeObserver = new ResizeObserver(updateMaskGeometry);
      resizeObserver.observe(root);
      return () => {
        resizeObserver.disconnect();
      };
    }, [staticAnimationProgress]);

    const rootClassName = useMemo(
      () => getRootClassName({
        autoStart,
        className,
        clipToChildren,
        showShimmer,
        staticAnimationProgress,
      }),
      [
        autoStart,
        className,
        clipToChildren,
        showShimmer,
        staticAnimationProgress,
      ],
    );

    const rootStyle = useMemo<ShimmerStyle>(
      () => ({
        '--uit-shimmer-animation-duration': `${SHIMMER_ANIMATION_DURATION_MS}ms`,
        '--uit-shimmer-animation-delay': `${Math.max(0, startDelayMs)}ms`,
        '--uit-shimmer-base-opacity': SHIMMER_DEFAULT_BASE_ALPHA,
        '--uit-shimmer-direction':
          repeatMode === ShimmerRepeatMode.REVERSE ? 'alternate' : 'normal',
        '--uit-shimmer-iteration-count': getAnimationIterationCount(repeatCount),
        ...style,
      }),
      // staticAnimationProgress is not read here (it drives the mask geometry
      // effect + rootClassName, not these style vars), so it is not a dependency.
      [
        repeatCount,
        repeatMode,
        startDelayMs,
        style,
      ],
    );

    return (
      <div
        ref={setRootRef}
        className={rootClassName}
        style={rootStyle}
        {...rest}
      >
        <div className={showShimmer ? styles.baseContent : styles.content}>
          {children}
        </div>
      </div>
    );
  },
));

export const ShimmerItem = memo(forwardRef<HTMLDivElement, ShimmerItemProps>(
  function ShimmerItem(
    {
      className = '',
      cornerRadius = ShimmerItemCornerRadius.MEDIUM,
      height,
      style = DEFAULT_ITEM_STYLE,
      width,
      ...rest
    },
    ref,
  ) {
    const itemClassName = useMemo(
      () => [
        styles.item,
        getRadiusClassName(cornerRadius),
        className,
      ].filter(Boolean).join(' '),
      [className, cornerRadius],
    );

    const itemStyle = useMemo<CSSProperties>(
      () => ({
        width,
        height,
        ...style,
      }),
      [height, style, width],
    );

    return (
      <div
        ref={ref}
        className={itemClassName}
        style={itemStyle}
        aria-hidden="true"
        {...rest}
      />
    );
  },
));
