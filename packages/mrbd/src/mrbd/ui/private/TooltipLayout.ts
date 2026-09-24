/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { getFloatingPortalRootOffset } from '@wearables-ui-toolkit/foundation/portal/FloatingPortalRoot';
import { TooltipPosition } from '@wearables-ui-toolkit/foundation/base/InteractableBase';
import {
  chooseTooltipVerticalPosition,
  getEffectiveAnchorRect,
  getTooltipAnchorTarget,
  getTooltipBoundaryRect,
  isSameTooltipBoundary,
} from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';
import type { TooltipBoundaryRect } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';
import {
  TOOLTIP_EDGE_SPACING,
  TOOLTIP_NO_TAIL_ANCHOR_SPACING,
  TOOLTIP_TAIL_ANCHOR_SPACING,
  TOOLTIP_VISUAL_INSET,
} from './TooltipMetrics';
import type { TooltipShowOptions } from '../Tooltip.types';

export interface TooltipPositionLayout {
  position: {
    top: number;
    left: number;
  };
  boundaryRect: TooltipBoundaryRect;
  tailCenterX: number;
  tailDirection: 'up' | 'down';
}

export function calculateTooltipPositionLayout(
  anchor: HTMLElement,
  tooltip: HTMLElement,
  options: TooltipShowOptions,
): TooltipPositionLayout {
  const anchorRect = getEffectiveAnchorRect(anchor, options.tracksAnchorScale ?? false);
  const tooltipRect = tooltip.getBoundingClientRect();
  const tooltipWidth = tooltipRect.width;
  const tooltipHeight = tooltipRect.height;
  const boundaryRect = getTooltipBoundaryRect(anchor);
  const pos = options.position ?? TooltipPosition.ANCHORED;

  const target = getTooltipAnchorTarget(
    anchor,
    anchorRect,
    options.centerPositionProvider,
    options.targetRectProvider,
  );

  let x: number;
  if (pos === TooltipPosition.CENTERED) {
    x = boundaryRect.left + (boundaryRect.width - tooltipWidth) / 2;
  } else {
    x = target.centerX - tooltipWidth / 2;
  }

  x = Math.max(
    boundaryRect.left + TOOLTIP_EDGE_SPACING,
    Math.min(x, boundaryRect.right - tooltipWidth - TOOLTIP_EDGE_SPACING),
  );

  const usesBuiltInTooltipContainer = options.content == null;
  const tooltipVisualInset = usesBuiltInTooltipContainer ? TOOLTIP_VISUAL_INSET : 0;
  const showTail = shouldShowBuiltInTooltipTail(options, pos);
  const anchorSpacing = showTail
    ? TOOLTIP_TAIL_ANCHOR_SPACING
    : TOOLTIP_NO_TAIL_ANCHOR_SPACING;
  const aboveY = target.top - tooltipHeight - anchorSpacing + tooltipVisualInset;
  const belowY = target.bottom + anchorSpacing - tooltipVisualInset;
  // Vertical auto-flip is gated to custom-view tooltips (e.g. ContextMenu).
  // Built-in TooltipContainers never flip; their effective position is always
  // the requested one.
  const effectivePosition = usesBuiltInTooltipContainer
    ? pos
    : chooseTooltipVerticalPosition(
        pos,
        anchorRect,
        tooltipHeight,
        boundaryRect,
        aboveY,
        belowY,
      );
  const y =
    effectivePosition === TooltipPosition.ANCHORED_BOTTOM ? belowY : aboveY;

  return {
    position: { top: y, left: x },
    boundaryRect,
    tailCenterX: target.centerX - x,
    tailDirection:
      effectivePosition === TooltipPosition.ANCHORED_BOTTOM ? 'up' : 'down',
  };
}

export function shouldUpdateTooltipBoundary(
  previous: TooltipBoundaryRect,
  next: TooltipBoundaryRect,
): boolean {
  return !isSameTooltipBoundary(previous, next);
}

export function getTooltipAccessibleLabel(options: TooltipShowOptions): string | undefined {
  const fallbackAccessibleLabel = [options.text, options.metadata]
    .filter(Boolean)
    .join(', ');
  return options.contentDescription ?? (fallbackAccessibleLabel || undefined);
}

export function getTooltipPortalStyle(
  boundary: TooltipBoundaryRect,
  portalRoot: HTMLElement | null = null,
): CSSProperties {
  const portalOffset = getFloatingPortalRootOffset(portalRoot);

  return {
    position: portalOffset.position,
    top: boundary.top - portalOffset.top,
    left: boundary.left - portalOffset.left,
    width: boundary.width,
    height: boundary.height,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 9999,
  };
}

export function getTooltipOverlayStyle({
  position,
  boundary,
  isFocusable,
}: {
  position: { top: number; left: number };
  boundary: TooltipBoundaryRect;
  isFocusable?: boolean;
}): CSSProperties {
  return {
    position: 'absolute',
    top: position.top - boundary.top,
    left: position.left - boundary.left,
    pointerEvents: isFocusable ? 'auto' : 'none',
  };
}

export function hasTooltipContent(options: TooltipShowOptions): boolean {
  return Boolean(options.text || options.metadata || options.content);
}

export function shouldAutoDismissTooltip(options: TooltipShowOptions): boolean {
  return options.shouldAutoDismiss ?? false;
}

function shouldShowBuiltInTooltipTail(
  options: TooltipShowOptions,
  position: TooltipPosition,
): boolean {
  return (
    options.content == null &&
    (options.showTooltipTail ?? true) &&
    position !== TooltipPosition.CENTERED
  );
}
