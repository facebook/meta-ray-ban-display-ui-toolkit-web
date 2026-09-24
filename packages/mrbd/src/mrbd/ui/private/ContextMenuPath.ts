/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ContextMenu shape metrics and path generation.
 * Constructs the popup body + rounded tail.
 */

import {
  generateRoundedPolygonPath,
  RoundedPolygonVertex,
} from '@wearables-ui-toolkit/foundation/utils/SmoothCorners';
import type { ContextMenuPathConfig } from './ContextMenuPath.types';

export type {
  ContextMenuPathConfig,
  ContextMenuTailDirection,
} from './ContextMenuPath.types';

/** Shape constants */
export const CONTEXT_MENU_HEIGHT = 72;
export const SHADOW_BLUR_RADIUS = 6;

// Tail dimensions (16 * 0.85 * 1.25 = 17)
export const TAIL_HEIGHT = 17;

const TAIL_WIDTH = TAIL_HEIGHT * 1.5;
const TAIL_EDGE_SPACING = 4;
const TAIL_TIP_ROUNDING = 8;
const TAIL_BASE_ROUNDING = 32;
const SMOOTHING = 0.75;
// This is a clamp sentinel rather than a design radius. It matches the
// `--uit-corner-radius-full: 9999px` CSS value while allowing the polygon
// generator to reduce the actual radius to half the available extent.
const FULL_PILL_RADIUS_CEILING = 9999;
// Narrow-container threshold factor for switching to the degraded tail
// (applied to the tail base rounding).
const DEGRADED_TAIL_FACTOR = 0.75;

export function contextMenuPath({
  width,
  height,
  inset,
  tailDirection,
  tailCenterX,
}: ContextMenuPathConfig): string {
  const left = inset;
  const top = inset;
  const right = Math.max(left, width - inset);
  const bottom = Math.max(top, height - inset);
  const bodyTop = tailDirection === 'up' ? top + TAIL_HEIGHT : top;
  const bodyBottom = tailDirection === 'down' ? bottom - TAIL_HEIGHT : bottom;
  // Pill radius clamps to half of the shorter of the FULL width and FULL height
  // (including the tail band). The RoundedPolygon generator reduces it per-corner
  // where the rounded body edges are shorter.
  const fullWidth = Math.max(0, right - left);
  const fullHeight = Math.max(0, bottom - top);
  const r = Math.min(
    FULL_PILL_RADIUS_CEILING,
    Math.min(fullWidth, fullHeight) / 2,
  );

  if (!tailDirection) {
    return generateRoundedPolygonPath(
      [
        { x: left, y: bodyTop, r },
        { x: right, y: bodyTop, r },
        { x: right, y: bodyBottom, r },
        { x: left, y: bodyBottom, r },
      ],
      SMOOTHING,
    );
  }

  // Very narrow containers use a degraded 5-point tail (no base vertices, only
  // the tip rounding) to avoid the RoundedPolygon corner asymmetry the 7-point
  // polygon produces when the corner-to-tail-base edges are too short.
  const useDegradedTail =
    fullWidth < TAIL_WIDTH + r + TAIL_BASE_ROUNDING * DEGRADED_TAIL_FACTOR;
  const halfTail = TAIL_WIDTH / 2;
  const minTailCenter = useDegradedTail
    ? left + TAIL_EDGE_SPACING
    : left + r + TAIL_EDGE_SPACING + halfTail;
  const maxTailCenter = useDegradedTail
    ? right - TAIL_EDGE_SPACING
    : right - r - TAIL_EDGE_SPACING - halfTail;
  const center = minTailCenter <= maxTailCenter
    ? Math.min(Math.max(tailCenterX, minTailCenter), maxTailCenter)
    : left + (right - left) / 2;

  let vertices: RoundedPolygonVertex[];

  if (tailDirection === 'down') {
    vertices = useDegradedTail
      ? [
          { x: left, y: bodyTop, r },
          { x: left, y: bodyBottom, r },
          { x: center, y: bottom, r: TAIL_TIP_ROUNDING },
          { x: right, y: bodyBottom, r },
          { x: right, y: bodyTop, r },
        ]
      : [
          { x: left, y: bodyTop, r },
          { x: left, y: bodyBottom, r },
          { x: center - halfTail, y: bodyBottom, r: TAIL_BASE_ROUNDING },
          { x: center, y: bottom, r: TAIL_TIP_ROUNDING },
          { x: center + halfTail, y: bodyBottom, r: TAIL_BASE_ROUNDING },
          { x: right, y: bodyBottom, r },
          { x: right, y: bodyTop, r },
        ];
  } else {
    vertices = useDegradedTail
      ? [
          { x: left, y: bodyTop, r },
          { x: left, y: bodyBottom, r },
          { x: right, y: bodyBottom, r },
          { x: right, y: bodyTop, r },
          { x: center, y: top, r: TAIL_TIP_ROUNDING },
        ]
      : [
          { x: left, y: bodyTop, r },
          { x: left, y: bodyBottom, r },
          { x: right, y: bodyBottom, r },
          { x: right, y: bodyTop, r },
          { x: center + halfTail, y: bodyTop, r: TAIL_BASE_ROUNDING },
          { x: center, y: top, r: TAIL_TIP_ROUNDING },
          { x: center - halfTail, y: bodyTop, r: TAIL_BASE_ROUNDING },
        ];
  }

  return generateRoundedPolygonPath(vertices, SMOOTHING);
}
