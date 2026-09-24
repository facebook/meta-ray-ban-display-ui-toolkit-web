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
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type MouseEventHandler,
} from 'react';
import {
  SWITCH_HEIGHT,
  SWITCH_THUMB_STROKE,
  SWITCH_WIDTH,
} from './SwitchMetrics';
import {
  getSwitchThumbFillStyle,
  getSwitchThumbGroupStyle,
  getSwitchTrackStyle,
} from './SwitchLayout';
import styles from '../Switch.module.css';

interface SwitchFrameProps extends HTMLAttributes<HTMLDivElement> {
  className: string;
  style: CSSProperties;
  interactive: boolean;
  disabled: boolean;
  checked: boolean;
  presentational?: boolean;
  thumbCenterX: number;
  thumbCenterY: number;
  thumbInnerRadius: number;
  thumbOutlineRadius: number;
  thumbTranslateX: number;
  position: number;
  shouldAnimate: boolean;
  transitionValue: string;
  onClick: MouseEventHandler<HTMLDivElement>;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
}

/**
 * Switch frame: root interaction target plus track and thumb
 * circles rendered with SVG geometry from SwitchLayout.
 */
export const SwitchFrame = memo(forwardRef<HTMLDivElement, SwitchFrameProps>(
  function SwitchFrame(
    {
      className,
      style,
      interactive,
      disabled,
      checked,
      presentational = false,
      thumbCenterX,
      thumbCenterY,
      thumbInnerRadius,
      thumbOutlineRadius,
      thumbTranslateX,
      position,
      shouldAnimate,
      transitionValue,
      onClick,
      onKeyDown,
      ...rest
    },
    ref,
  ) {
    const rootClassName = useMemo(
      () => `${styles.switch} ${className}`,
      [className],
    );
    const trackStyle = useMemo(
      () => getSwitchTrackStyle({
        position,
        shouldAnimate,
        transitionValue,
      }),
      [position, shouldAnimate, transitionValue],
    );
    const thumbGroupStyle = useMemo(
      () => getSwitchThumbGroupStyle({
        thumbTranslateX,
        shouldAnimate,
        transitionValue,
      }),
      [thumbTranslateX, shouldAnimate, transitionValue],
    );
    const thumbFillStyle = useMemo(
      () => getSwitchThumbFillStyle({
        position,
        shouldAnimate,
        transitionValue,
      }),
      [position, shouldAnimate, transitionValue],
    );

    return (
      <div
        {...rest}
        ref={ref}
        className={rootClassName}
        style={style}
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? onKeyDown : undefined}
        tabIndex={interactive ? (disabled ? -1 : 0) : undefined}
        role={presentational ? undefined : 'switch'}
        aria-checked={presentational ? undefined : checked}
        aria-disabled={interactive ? disabled || undefined : undefined}
        aria-hidden={presentational ? true : undefined}
      >
        <svg
          width={SWITCH_WIDTH}
          height={SWITCH_HEIGHT}
          viewBox={`0 0 ${SWITCH_WIDTH} ${SWITCH_HEIGHT}`}
          className={styles.switchSvg}
        >
          <rect
            x={0}
            y={0}
            width={SWITCH_WIDTH}
            height={SWITCH_HEIGHT}
            rx={SWITCH_HEIGHT / 2}
            ry={SWITCH_HEIGHT / 2}
            className={styles.track}
            style={trackStyle}
          />

          <g className={styles.thumbGroup} style={thumbGroupStyle}>
            <circle
              cx={thumbCenterX}
              cy={thumbCenterY}
              r={thumbOutlineRadius}
              className={styles.thumbOutline}
              strokeWidth={SWITCH_THUMB_STROKE}
            />

            <circle
              cx={thumbCenterX}
              cy={thumbCenterY}
              r={thumbInnerRadius}
              className={styles.thumbFill}
              style={thumbFillStyle}
            />
          </g>
        </svg>
      </div>
    );
  },
));
