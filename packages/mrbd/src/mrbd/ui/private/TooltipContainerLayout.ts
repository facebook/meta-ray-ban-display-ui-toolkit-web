/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import type { TooltipTailDirection } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning.types';
import {
  TOOLTIP_CONTAINER_BASE_LINE_HEIGHT,
  TOOLTIP_CONTAINER_MIN_WIDTH,
  TOOLTIP_CONTAINER_SHADOW_BLUR_RADIUS,
  TOOLTIP_CONTAINER_TAIL_HEIGHT_RATIO,
  TOOLTIP_CONTAINER_TAIL_WIDTH_RATIO,
} from './TooltipContainerMetrics';
import type {
  TooltipContainerAutoWidthInput,
  TooltipContainerEffectiveSize,
  TooltipContainerEffectiveSizeInput,
  TooltipContainerPadding,
  TooltipContainerPaddingInput,
  TooltipContainerStyleInput,
  TooltipContainerTailDimensions,
} from './TooltipContainerLayout.types';

export type {
  TooltipContainerAutoWidthInput,
  TooltipContainerEffectiveSize,
  TooltipContainerEffectiveSizeInput,
  TooltipContainerPadding,
  TooltipContainerPaddingInput,
  TooltipContainerStyleInput,
  TooltipContainerTailDimensions,
} from './TooltipContainerLayout.types';

export function getTooltipContainerDropShadowPadding(): number {
  return TOOLTIP_CONTAINER_SHADOW_BLUR_RADIUS * 2;
}

export function getTooltipContainerTailDimensions(): TooltipContainerTailDimensions {
  const tailHeight =
    TOOLTIP_CONTAINER_BASE_LINE_HEIGHT * TOOLTIP_CONTAINER_TAIL_HEIGHT_RATIO;
  return {
    tailHeight,
    tailWidth: tailHeight * TOOLTIP_CONTAINER_TAIL_WIDTH_RATIO,
    tailLayoutPadding: Math.trunc(tailHeight),
  };
}

export function shouldShowTooltipContainerTail(
  showTooltipTail: boolean,
  tailDirection?: TooltipTailDirection,
): boolean {
  return showTooltipTail && tailDirection != null;
}

export function getTooltipContainerPadding({
  showTail,
  tailDirection,
  tailLayoutPadding,
  dropShadowPadding,
}: TooltipContainerPaddingInput): TooltipContainerPadding {
  return {
    paddingTop:
      showTail && tailDirection === 'up'
        ? dropShadowPadding + tailLayoutPadding
        : dropShadowPadding,
    paddingBottom:
      showTail && tailDirection === 'down'
        ? dropShadowPadding + tailLayoutPadding
        : dropShadowPadding,
  };
}

export function getTooltipContainerStyle({
  paddingTop,
  paddingBottom,
  dropShadowPadding,
  width,
  autoWidth,
  height,
  style,
}: TooltipContainerStyleInput): CSSProperties {
  return {
    padding: `${paddingTop}px ${dropShadowPadding}px ${paddingBottom}px ${dropShadowPadding}px`,
    minWidth: TOOLTIP_CONTAINER_MIN_WIDTH,
    width: width ?? autoWidth,
    height,
    overflow: 'visible',
    ...style,
  };
}

export function getTooltipContainerAutoWidth({
  width,
  measuredWidth,
}: TooltipContainerAutoWidthInput): number | undefined {
  return width == null && measuredWidth > 0
    ? Math.ceil(measuredWidth)
    : undefined;
}

export function getTooltipContainerEffectiveSize({
  measuredWidth,
  measuredHeight,
  width,
  height,
}: TooltipContainerEffectiveSizeInput): TooltipContainerEffectiveSize {
  return {
    width: measuredWidth > 0
      ? Math.ceil(measuredWidth)
      : typeof width === 'number'
        ? width
        : 0,
    height: measuredHeight > 0
      ? Math.ceil(measuredHeight)
      : typeof height === 'number'
        ? height
        : 0,
  };
}
