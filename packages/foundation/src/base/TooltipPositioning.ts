/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Shared tooltip positioning helpers.
 * Apply window-boundary and preferred-position rules.
 */

import type {
  TooltipAnchorTarget,
  TooltipBoundaryRect,
  TooltipCenterPositionProvider,
  TooltipTailDirection,
  TooltipTargetRectProvider,
} from './TooltipPositioning.types';

export const TooltipPosition = {
  ANCHORED: 'anchored',
  CENTERED: 'centered',
  ANCHORED_BOTTOM: 'anchoredBottom',
} as const;
export type TooltipPosition =
  (typeof TooltipPosition)[keyof typeof TooltipPosition];

export type {
  TooltipAnchorPoint,
  TooltipAnchorRect,
  TooltipAnchorTarget,
  TooltipBoundaryRect,
  TooltipCenterPositionProvider,
  TooltipTailDirection,
  TooltipTargetRectProvider,
} from './TooltipPositioning.types';

export function getInitialTooltipTailDirection(
  position: TooltipPosition,
  showTooltipTail: boolean,
): TooltipTailDirection | undefined {
  if (!showTooltipTail) {
    return undefined;
  }

  if (position === TooltipPosition.ANCHORED_BOTTOM) {
    return 'up';
  }

  if (position === TooltipPosition.ANCHORED) {
    return 'down';
  }

  return undefined;
}

export function getWindowTooltipBoundaryRect(): TooltipBoundaryRect {
  if (typeof window === 'undefined') {
    return {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
    };
  }

  return {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function getTooltipBoundaryRect(anchor: HTMLElement): TooltipBoundaryRect {
  const boundaryElement = anchor.closest('[data-uit-tooltip-boundary]');
  if (boundaryElement instanceof HTMLElement) {
    const rect = boundaryElement.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  }

  return getWindowTooltipBoundaryRect();
}

export function getEffectiveAnchorRect(
  anchor: HTMLElement,
  tracksAnchorScale: boolean,
): DOMRect {
  const rect = anchor.getBoundingClientRect();
  if (tracksAnchorScale) {
    return rect;
  }

  const width = anchor.offsetWidth || rect.width;
  const height = anchor.offsetHeight || rect.height;
  const left = rect.left - (width - rect.width) / 2;
  const top = rect.top - (height - rect.height) / 2;
  return new DOMRect(left, top, width, height);
}

export function getTooltipAnchorTarget(
  anchor: HTMLElement,
  anchorRect: DOMRect,
  centerPositionProvider?: TooltipCenterPositionProvider,
  targetRectProvider?: TooltipTargetRectProvider,
): TooltipAnchorTarget {
  const centerPosition = centerPositionProvider?.(anchor) ?? null;
  const targetRect = targetRectProvider?.(anchor) ?? null;
  const targetRectWidth = targetRect != null
    ? targetRect.width ?? targetRect.right - targetRect.left
    : 0;

  return {
    centerX:
      centerPosition != null
        ? anchorRect.left + centerPosition.x
        : targetRect != null
          ? anchorRect.left + targetRect.left + targetRectWidth / 2
          : anchorRect.left + anchorRect.width / 2,
    top:
      targetRect != null
        ? anchorRect.top + targetRect.top
        : centerPosition != null
          ? anchorRect.top + centerPosition.y
          : anchorRect.top,
    bottom:
      targetRect != null
        ? anchorRect.top + targetRect.bottom
        : centerPosition != null
          ? anchorRect.top + centerPosition.y
          : anchorRect.bottom,
  };
}

export function isSameTooltipBoundary(
  a: TooltipBoundaryRect,
  b: TooltipBoundaryRect,
): boolean {
  return (
    Math.abs(a.left - b.left) < 0.25 &&
    Math.abs(a.top - b.top) < 0.25 &&
    Math.abs(a.width - b.width) < 0.25 &&
    Math.abs(a.height - b.height) < 0.25
  );
}

export function chooseAnchoredTooltipPosition(
  preferredPosition: TooltipPosition,
  anchorRect: DOMRect,
  tooltipHeight: number,
  boundaryRect: TooltipBoundaryRect,
  aboveY: number,
  belowY: number,
): TooltipPosition {
  // Required-space algorithm: flip only when the preferred side cannot fit the
  // tooltip AND the opposite side has more room between the anchor and the
  // boundary. `aboveY`/`belowY` are the
  // would-be tooltip top in each position (already including anchor spacing and
  // visual inset), so they encode whether the tooltip fits within the boundary.
  const roomAbove = anchorRect.top - boundaryRect.top;
  const roomBelow = boundaryRect.bottom - anchorRect.bottom;
  const fitsAbove = aboveY >= boundaryRect.top;
  const fitsBelow = belowY + tooltipHeight <= boundaryRect.bottom;

  if (preferredPosition === TooltipPosition.ANCHORED) {
    if (!fitsAbove && roomBelow > roomAbove) {
      return TooltipPosition.ANCHORED_BOTTOM;
    }
    return TooltipPosition.ANCHORED;
  }

  // ANCHORED_BOTTOM
  if (!fitsBelow && roomAbove > roomBelow) {
    return TooltipPosition.ANCHORED;
  }
  return TooltipPosition.ANCHORED_BOTTOM;
}

export function chooseTooltipVerticalPosition(
  preferredPosition: TooltipPosition,
  anchorRect: DOMRect,
  tooltipHeight: number,
  boundaryRect: TooltipBoundaryRect,
  aboveY: number,
  belowY: number,
): TooltipPosition {
  if (preferredPosition === TooltipPosition.CENTERED) {
    return TooltipPosition.CENTERED;
  }

  return chooseAnchoredTooltipPosition(
    preferredPosition,
    anchorRect,
    tooltipHeight,
    boundaryRect,
    aboveY,
    belowY,
  );
}
