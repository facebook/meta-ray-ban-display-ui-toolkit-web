/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  HTMLAttributes,
} from 'react';

export interface CircularProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Progress value, clamped to 0.0-1.0 range.
   * @default 0
   */
  progress?: number;

  /**
   * Whether progress changes should animate with a spring-like transition.
   *
   * This is a persistent declarative prop backed by a CSS transition, so it
   * applies to EVERY progress change while set. To animate only some updates,
   * toggle this prop around the update rather than passing a per-update flag.
   * @default false
   */
  animated?: boolean;

  /**
   * Stroke width in pixels for both track and progress arc.
   * @default 6
   */
  strokeWidthPx?: number;

  /**
   * Starting angle in degrees for the arc.
   * 0 = right (3 o'clock), 90 = bottom, 180 = left, 270 = top.
   * @default 140
   */
  startAngleDegrees?: number;

  /**
   * Ending angle in degrees for the arc.
   * @default 400
   */
  endAngleDegrees?: number;

  /**
   * Width/height of the component in pixels (always square). Omit to fill the
   * parent square while using the default coordinate system for the SVG path.
   */
  size?: number;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;
}
