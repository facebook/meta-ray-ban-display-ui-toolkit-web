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
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEventHandler,
} from 'react';
import styles from '../SliderBar.module.css';

interface SliderBarFrameProps extends HTMLAttributes<HTMLDivElement> {
  className: string;
  style: CSSProperties;
  isInteractive: boolean;
  presentational?: boolean;
  clampedValue: number;
  minimumValue: number;
  maximumValue: number;
  accessibilityLabel: string;
  accessibilityValueText: string;
  disabled: boolean;
  fillStyle: CSSProperties;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
}

/**
 * SliderBar frame: root progress/slider target with background track and
 * optional filled portion.
 *
 * Exposes `role="slider"` with `aria-valuenow/min/max` when interactive
 * (keyboard handling via `onChange`); otherwise renders `role="progressbar"`
 * with the same range info as a non-interactive display element.
 */
export const SliderBarFrame = memo(forwardRef<HTMLDivElement, SliderBarFrameProps>(
  function SliderBarFrame(
    {
      className,
      style,
      isInteractive,
      presentational = false,
      clampedValue,
      minimumValue,
      maximumValue,
      accessibilityLabel,
      accessibilityValueText,
      disabled,
      fillStyle,
      onKeyDown,
      ...rest
    },
    ref,
  ) {
    const role = presentational
      ? undefined
      : isInteractive
        ? 'slider'
        : 'progressbar';

    return (
      <div
        {...rest}
        ref={ref}
        className={className}
        style={style}
        role={role}
        tabIndex={presentational ? -1 : isInteractive ? 0 : undefined}
        aria-valuenow={presentational ? undefined : clampedValue}
        aria-valuemin={presentational ? undefined : minimumValue}
        aria-valuemax={presentational ? undefined : maximumValue}
        aria-valuetext={presentational ? undefined : accessibilityValueText}
        aria-label={presentational ? undefined : accessibilityLabel}
        aria-disabled={presentational ? undefined : disabled || undefined}
        aria-hidden={presentational ? true : undefined}
        onKeyDown={!presentational && isInteractive ? onKeyDown : undefined}
      >
        <div className={styles.track} />

        <div className={styles.fill} style={fillStyle} />
      </div>
    );
  },
));
