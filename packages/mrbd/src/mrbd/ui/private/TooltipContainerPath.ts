/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  generateRoundedPolygonPath,
  RoundedPolygonVertex,
} from '@wearables-ui-toolkit/foundation/utils/SmoothCorners';
import type { TooltipTailDirection } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning.types';
import {
  TOOLTIP_CONTAINER_CORNER_RADIUS,
  TOOLTIP_CONTAINER_SMOOTHING,
  TOOLTIP_CONTAINER_TAIL_BASE_ROUNDING,
  TOOLTIP_CONTAINER_TAIL_EDGE_SPACING,
  TOOLTIP_CONTAINER_TAIL_TIP_ROUNDING,
} from './TooltipContainerMetrics';

export function tooltipContainerPath({
  width,
  height,
  inset,
  tailDirection,
  tailCenterX,
  tailHeight,
  tailWidth,
}: {
  width: number;
  height: number;
  inset: number;
  tailDirection?: TooltipTailDirection;
  tailCenterX: number;
  tailHeight: number;
  tailWidth: number;
}): string {
  const left = inset;
  const top = inset;
  const right = Math.max(left, width - inset);
  const bottom = Math.max(top, height - inset);
  const w = right - left;
  const h = bottom - top;
  const r = Math.min(
    Math.max(0, TOOLTIP_CONTAINER_CORNER_RADIUS),
    Math.min(w, h) / 2,
  );

  if (!tailDirection || tailHeight <= 0 || tailWidth <= 0) {
    return generateRoundedPolygonPath(
      [
        { x: left, y: top, r },
        { x: right, y: top, r },
        { x: right, y: bottom, r },
        { x: left, y: bottom, r },
      ],
      TOOLTIP_CONTAINER_SMOOTHING,
    );
  }

  const bodyTop = tailDirection === 'up' ? top + tailHeight : top;
  const bodyBottom = tailDirection === 'down' ? bottom - tailHeight : bottom;
  const halfTail = tailWidth / 2;
  const minTailCenter =
    left + r + TOOLTIP_CONTAINER_TAIL_EDGE_SPACING + halfTail;
  const maxTailCenter =
    right - r - TOOLTIP_CONTAINER_TAIL_EDGE_SPACING - halfTail;
  const center = minTailCenter <= maxTailCenter
    ? Math.min(Math.max(tailCenterX, minTailCenter), maxTailCenter)
    : left + (right - left) / 2;
  const useDegradedTail =
    w <
    (tailWidth +
      r +
      TOOLTIP_CONTAINER_TAIL_BASE_ROUNDING * 0.75);

  let verts: RoundedPolygonVertex[];

  if (tailDirection === 'down') {
    verts = useDegradedTail
      ? [
          { x: left, y: top, r },
          { x: left, y: bodyBottom, r },
          { x: center, y: bottom, r: TOOLTIP_CONTAINER_TAIL_TIP_ROUNDING },
          { x: right, y: bodyBottom, r },
          { x: right, y: top, r },
        ]
      : [
          { x: left, y: top, r },
          { x: left, y: bodyBottom, r },
          {
            x: center - halfTail,
            y: bodyBottom,
            r: TOOLTIP_CONTAINER_TAIL_BASE_ROUNDING,
          },
          { x: center, y: bottom, r: TOOLTIP_CONTAINER_TAIL_TIP_ROUNDING },
          {
            x: center + halfTail,
            y: bodyBottom,
            r: TOOLTIP_CONTAINER_TAIL_BASE_ROUNDING,
          },
          { x: right, y: bodyBottom, r },
          { x: right, y: top, r },
        ];
    return generateRoundedPolygonPath(verts, TOOLTIP_CONTAINER_SMOOTHING);
  }

  verts = useDegradedTail
    ? [
        { x: left, y: bodyTop, r },
        { x: left, y: bottom, r },
        { x: right, y: bottom, r },
        { x: right, y: bodyTop, r },
        { x: center, y: top, r: TOOLTIP_CONTAINER_TAIL_TIP_ROUNDING },
      ]
    : [
        { x: left, y: bodyTop, r },
        { x: left, y: bottom, r },
        { x: right, y: bottom, r },
        { x: right, y: bodyTop, r },
        {
          x: center + halfTail,
          y: bodyTop,
          r: TOOLTIP_CONTAINER_TAIL_BASE_ROUNDING,
        },
        { x: center, y: top, r: TOOLTIP_CONTAINER_TAIL_TIP_ROUNDING },
        {
          x: center - halfTail,
          y: bodyTop,
          r: TOOLTIP_CONTAINER_TAIL_BASE_ROUNDING,
        },
      ];
  return generateRoundedPolygonPath(verts, TOOLTIP_CONTAINER_SMOOTHING);
}
