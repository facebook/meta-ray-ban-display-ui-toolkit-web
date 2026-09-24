/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StaticContainerProps } from './StaticContainer.types';

export interface TextSwitcherProps
  extends Omit<
    StaticContainerProps,
    'children' | 'backgroundStyle'
  > {
  /** The text to display. Changes trigger crossfade animation. */
  text?: string;

  /** Animation duration in milliseconds for each fade. */
  duration?: number;

  /** Whether to skip animation on the first text set. */
  noAnimationFirstView?: boolean;

  /**
   * Whether to animate text changes.
   *
   * This is a per-render prop that governs every text change while set. To make
   * individual updates independently animate or snap, a consumer would need an
   * imperative per-call text-setting handle.
   */
  animated?: boolean;
}
