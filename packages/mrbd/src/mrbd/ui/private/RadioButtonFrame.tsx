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
  RADIO_BUTTON_SIZE,
  RADIO_BUTTON_STROKE,
} from './RadioButtonMetrics';
import styles from '../RadioButton.module.css';

interface RadioButtonFrameProps extends HTMLAttributes<HTMLDivElement> {
  className: string;
  style: CSSProperties;
  interactive: boolean;
  disabled: boolean;
  checked: boolean;
  presentational?: boolean;
  center: number;
  outerRadius: number;
  strokeRadius: number;
  fillRadius: number;
  onClick: MouseEventHandler<HTMLDivElement>;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
}

/**
 * RadioButton frame: root radio target plus track, stroke ring, and checked
 * fill circle.
 */
export const RadioButtonFrame = memo(forwardRef<HTMLDivElement, RadioButtonFrameProps>(
  function RadioButtonFrame(
    {
      className,
      style,
      interactive,
      disabled,
      checked,
      presentational = false,
      center,
      outerRadius,
      strokeRadius,
      fillRadius,
      onClick,
      onKeyDown,
      ...rest
    },
    ref,
  ) {
    const rootClassName = useMemo(
      () => `${styles.radioButton} ${className}`,
      [className],
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
        role={presentational ? undefined : 'radio'}
        aria-checked={presentational ? undefined : checked}
        aria-disabled={interactive ? disabled || undefined : undefined}
        aria-hidden={presentational ? true : undefined}
      >
        <svg
          width={RADIO_BUTTON_SIZE}
          height={RADIO_BUTTON_SIZE}
          viewBox={`0 0 ${RADIO_BUTTON_SIZE} ${RADIO_BUTTON_SIZE}`}
          className={styles.radioSvg}
        >
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            className={styles.track}
          />

          <circle
            cx={center}
            cy={center}
            r={strokeRadius}
            className={styles.strokeRing}
            strokeWidth={RADIO_BUTTON_STROKE}
          />

          {checked && (
            <circle
              cx={center}
              cy={center}
              r={fillRadius}
              className={styles.fillCircle}
            />
          )}
        </svg>
      </div>
    );
  },
));
