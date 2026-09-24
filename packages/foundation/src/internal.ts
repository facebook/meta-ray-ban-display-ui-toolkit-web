/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export {
  EMPTY_SCROLL_METRICS,
  FADING_EDGE_LENGTH_MEDIUM,
  getScrollMetrics,
  sameScrollMetrics,
  scrollElementIntoFadingEdgeSafeArea,
} from './components/private/FadingEdges';
export type { ScrollMetrics } from './components/private/FadingEdges';
export { PanelInternal } from './components/private/PanelInternal';
export { getTextStyleClass } from './components/private/TextViewStyles';
