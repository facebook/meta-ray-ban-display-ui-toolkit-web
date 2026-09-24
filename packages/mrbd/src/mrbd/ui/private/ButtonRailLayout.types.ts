/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/** Per-child visual extents, measured once and reused across scroll math. */
export interface ButtonRailVisualChildMetrics {
  center: number;
  left: number;
  right: number;
  width: number;
  rectWidth: number;
}

export interface ButtonRailTranslationConfig {
  focusedIndex: number;
  currentTranslation: number;
  viewportWidth: number;
  contentWidth: number;
  children: HTMLElement[];
  anchorIndex?: number;
  centerContentWhenSmallerThanWidth: boolean;
  centerFocusedView: boolean;
  /**
   * Pre-measured child metrics. When provided, the children are not read from
   * layout again here (avoids re-measuring every child on each scroll pass).
   */
  childMetrics?: ButtonRailVisualChildMetrics[];
}

export interface ButtonRailFadingEdges {
  showLeftFade: boolean;
  showRightFade: boolean;
}
