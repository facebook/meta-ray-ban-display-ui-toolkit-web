/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { BUTTON_RAIL_FADING_EDGE_LENGTH } from './ButtonRailMetrics';
import { BUTTON_HEIGHT } from './ButtonLayout';
import type {
  ButtonRailFadingEdges,
  ButtonRailTranslationConfig,
  ButtonRailVisualChildMetrics,
} from './ButtonRailLayout.types';

export type {
  ButtonRailFadingEdges,
  ButtonRailTranslationConfig,
  ButtonRailVisualChildMetrics,
} from './ButtonRailLayout.types';

export function getButtonRailFocusableChildren(
  inner: HTMLElement | null,
): HTMLElement[] {
  if (!inner) return [];
  const focusable = inner.querySelectorAll<HTMLElement>(
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
  );
  return Array.from(focusable);
}

export function getButtonRailNextFocusable(
  focusable: HTMLElement[],
  current: HTMLElement | null,
  key: string,
): HTMLElement | null {
  if (current == null) return null;
  const currentIndex = focusable.indexOf(current);
  if (currentIndex === -1) return null;

  switch (key) {
    case 'ArrowLeft':
      return currentIndex > 0 ? focusable[currentIndex - 1] : null;
    case 'ArrowRight':
      return currentIndex < focusable.length - 1
        ? focusable[currentIndex + 1]
        : null;
    default:
      return null;
  }
}

export function getButtonRailFocusFollowTranslation(
  startTranslation: number,
  targetTranslation: number,
  easedProgress: number,
): number {
  return startTranslation +
    (targetTranslation - startTranslation) * easedProgress;
}

export function getButtonRailMonotonicFollowTranslation(
  currentTranslation: number,
  startTranslation: number,
  targetTranslation: number,
  requestedTranslation: number,
): number {
  if (targetTranslation < startTranslation) {
    return Math.max(
      targetTranslation,
      Math.min(currentTranslation, requestedTranslation),
    );
  }
  if (targetTranslation > startTranslation) {
    return Math.min(
      targetTranslation,
      Math.max(currentTranslation, requestedTranslation),
    );
  }
  return targetTranslation;
}

function getNumericStyleValue(style: CSSStyleDeclaration, property: string): number {
  const value = Number.parseFloat(style.getPropertyValue(property));
  return Number.isFinite(value) ? value : 0;
}

function getButtonRailTargetMetric(
  child: HTMLElement,
  focused: boolean,
  metric: 'layout-width' | 'scale',
): number | null {
  const state = focused ? 'focused' : 'default';
  const value = Number.parseFloat(
    child.getAttribute(`data-uit-button-${state}-${metric}`) ?? '',
  );
  return Number.isFinite(value) ? value : null;
}

export function measureButtonRailProjectedVisualChildMetrics(
  children: HTMLElement[],
  focusedIndex: number,
): ButtonRailVisualChildMetrics[] {
  let precedingLayoutShift = 0;

  return children.map((child, index) => {
    const currentStyle = window.getComputedStyle(child);
    const currentMarginLeft = getNumericStyleValue(currentStyle, 'margin-left');
    const currentMarginRight = getNumericStyleValue(currentStyle, 'margin-right');
    const targetLayoutWidth =
      getButtonRailTargetMetric(child, index === focusedIndex, 'layout-width') ??
      child.offsetWidth;
    const targetScale =
      getButtonRailTargetMetric(child, index === focusedIndex, 'scale') ??
      1;
    const targetVisualWidth = targetLayoutWidth * targetScale;
    const targetCompensation = -Math.max(
      0,
      (targetLayoutWidth - BUTTON_HEIGHT) * (1 - targetScale) / 2,
    );
    const left =
      child.offsetLeft +
      precedingLayoutShift +
      (targetCompensation - currentMarginLeft) +
      Math.max(0, targetLayoutWidth - targetVisualWidth) / 2;

    precedingLayoutShift +=
      targetLayoutWidth + targetCompensation * 2 -
      (child.offsetWidth + currentMarginLeft + currentMarginRight);

    return {
      center: left + targetVisualWidth / 2,
      left,
      right: left + targetVisualWidth,
      width: targetVisualWidth,
      rectWidth: targetVisualWidth,
    };
  });
}

function getVisualChildMetrics(child: HTMLElement): ButtonRailVisualChildMetrics {
  const layoutWidth = child.offsetWidth;
  const rectWidth = child.getBoundingClientRect().width;
  const width = rectWidth > 0 ? rectWidth : layoutWidth;
  const left = child.offsetLeft + Math.max(0, layoutWidth - width) / 2;

  return {
    center: left + width / 2,
    left,
    right: left + width,
    width,
    rectWidth,
  };
}

/**
 * Measure every child's visual metrics in a single layout-read pass. Callers
 * that need both the content width and the scroll translation should measure
 * once here and pass the result into `getButtonRailVisualContentWidth` and
 * `calculateButtonRailTranslation`, so each child is read from layout once per
 * focus change instead of several times.
 */
export function measureButtonRailVisualChildMetrics(
  children: HTMLElement[],
): ButtonRailVisualChildMetrics[] {
  return children.map(getVisualChildMetrics);
}

/**
 * Centers and scrolls based on perceived visual extents
 * after child scale compensation, not simply the unscaled layout width.
 */
export function getButtonRailVisualContentWidth(
  inner: HTMLElement | null,
  children: HTMLElement[],
  childMetrics?: ButtonRailVisualChildMetrics[],
): number {
  if (!inner || children.length === 0) {
    return inner?.scrollWidth ?? 0;
  }

  const metrics = childMetrics ?? children.map(getVisualChildMetrics);
  const hasRenderableRects = metrics.some((child) => child.rectWidth > 0);
  if (!hasRenderableRects) {
    return inner.scrollWidth;
  }

  const style = getComputedStyle(inner);
  const paddingRight = getNumericStyleValue(style, 'padding-right');
  const maxRight = Math.max(0, ...metrics.map((child) => child.right));

  return Math.max(0, maxRight + paddingRight);
}

/** Computes the scroll-delta target position. */
export function calculateButtonRailTranslation({
  focusedIndex,
  currentTranslation,
  viewportWidth,
  contentWidth,
  children,
  anchorIndex,
  centerContentWhenSmallerThanWidth,
  centerFocusedView,
  childMetrics: precomputedChildMetrics,
}: ButtonRailTranslationConfig): number {
  if (children.length === 0) return 0;

  const frameCenter = viewportWidth / 2;
  const childMetrics =
    precomputedChildMetrics ?? children.map(getVisualChildMetrics);
  const hasRenderableRects = childMetrics.some((child) => child.rectWidth > 0);

  if (centerFocusedView && focusedIndex >= 0 && focusedIndex < children.length) {
    return frameCenter - childMetrics[focusedIndex].center;
  }

  if (
    contentWidth <= viewportWidth &&
    centerContentWhenSmallerThanWidth &&
    anchorIndex == null
  ) {
    if (hasRenderableRects) {
      const visualLeft = Math.min(...childMetrics.map(child => child.left));
      const visualRight = Math.max(...childMetrics.map(child => child.right));
      return frameCenter - (visualLeft + visualRight) / 2;
    }
    return (viewportWidth - contentWidth) / 2;
  }

  if (anchorIndex != null && anchorIndex >= 0 && anchorIndex < children.length) {
    const anchorCenter = childMetrics[anchorIndex].center;
    const centeredTranslation = frameCenter - anchorCenter;

    if (focusedIndex >= 0 && focusedIndex !== anchorIndex) {
      const isFocusedAfterAnchor = focusedIndex > anchorIndex;
      const firstChildLeft = childMetrics[0].left + centeredTranslation;
      const lastChildRight = contentWidth + centeredTranslation;
      const allLeftVisible = firstChildLeft >= 0;
      const allRightVisible = lastChildRight <= viewportWidth;

      if (
        (!isFocusedAfterAnchor && allLeftVisible) ||
        (isFocusedAfterAnchor && allRightVisible)
      ) {
        return centeredTranslation;
      }
    }

    if (focusedIndex < 0) {
      return centeredTranslation;
    }
  }

  if (focusedIndex < 0) {
    return 0;
  }

  const focusedChild = childMetrics[focusedIndex];

  if (focusedIndex === 0) {
    return 0;
  }

  if (focusedIndex === children.length - 1) {
    const scrollRight = contentWidth - viewportWidth;
    if (scrollRight > 0) {
      return -scrollRight;
    }
    return centerContentWhenSmallerThanWidth && anchorIndex == null
      ? (viewportWidth - contentWidth) / 2
      : 0;
  }

  if (anchorIndex != null && anchorIndex >= 0 && anchorIndex < children.length) {
    const firstChildLeft = childMetrics[0].left;
    const lastChildRight = childMetrics[children.length - 1].right;
    const anchorCenter = childMetrics[anchorIndex].center;
    const focusedCenter = focusedChild.center;

    const anchorCenterRelative = anchorCenter - firstChildLeft;
    const focusedCenterRelative = focusedCenter - firstChildLeft;
    const lastChildRightRelative = lastChildRight - firstChildLeft;

    let desiredFocusedCenter: number;
    if (focusedIndex === anchorIndex) {
      desiredFocusedCenter = frameCenter;
    } else if (focusedIndex < anchorIndex) {
      desiredFocusedCenter =
        (focusedCenterRelative / anchorCenterRelative) * frameCenter;
    } else {
      const rightSideProgress =
        (focusedCenterRelative - anchorCenterRelative) /
        (lastChildRightRelative - anchorCenterRelative);
      desiredFocusedCenter = frameCenter * (1 + rightSideProgress);
    }

    let translation = desiredFocusedCenter - focusedCenter;
    if (focusedChild.left + translation < BUTTON_RAIL_FADING_EDGE_LENGTH) {
      translation = BUTTON_RAIL_FADING_EDGE_LENGTH - focusedChild.left;
    } else if (
      focusedChild.right + translation >
      viewportWidth - BUTTON_RAIL_FADING_EDGE_LENGTH
    ) {
      translation =
        viewportWidth - BUTTON_RAIL_FADING_EDGE_LENGTH - focusedChild.right;
    }
    return translation;
  }

  const childLeft = focusedChild.left;
  const childRight = focusedChild.right;

  if (anchorIndex != null && anchorIndex >= 0 && anchorIndex < children.length) {
    const anchorCenter = childMetrics[anchorIndex].center;
    const contentLeft = childMetrics[0].left;
    const focusedCenter = focusedChild.center;
    let desiredFocusedCenter: number;

    if (focusedIndex === anchorIndex) {
      desiredFocusedCenter = frameCenter;
    } else if (focusedIndex < anchorIndex) {
      const leftSpan = anchorCenter - contentLeft;
      desiredFocusedCenter = leftSpan > 0
        ? ((focusedCenter - contentLeft) / leftSpan) * frameCenter
        : frameCenter;
    } else {
      const rightSpan = contentWidth - anchorCenter;
      desiredFocusedCenter = rightSpan > 0
        ? frameCenter * (1 + (focusedCenter - anchorCenter) / rightSpan)
        : frameCenter;
    }

    let targetTranslation = desiredFocusedCenter - focusedCenter;
    const focusedLeftOnScreen = childLeft + targetTranslation;
    const focusedRightOnScreen = childRight + targetTranslation;

    if (focusedLeftOnScreen < BUTTON_RAIL_FADING_EDGE_LENGTH) {
      targetTranslation +=
        BUTTON_RAIL_FADING_EDGE_LENGTH - focusedLeftOnScreen;
    } else if (
      focusedRightOnScreen > viewportWidth - BUTTON_RAIL_FADING_EDGE_LENGTH
    ) {
      targetTranslation -=
        focusedRightOnScreen -
        (viewportWidth - BUTTON_RAIL_FADING_EDGE_LENGTH);
    }

    return targetTranslation;
  }

  const visibleLeft = -currentTranslation;
  const visibleRight = -currentTranslation + viewportWidth;
  const leftInset = visibleLeft > 0 ? BUTTON_RAIL_FADING_EDGE_LENGTH : 0;
  const rightInset = visibleRight < contentWidth ? BUTTON_RAIL_FADING_EDGE_LENGTH : 0;
  const leftEdge = childLeft - leftInset;
  const rightEdge = childRight + rightInset;

  if (leftEdge < visibleLeft) {
    return -leftEdge;
  }
  if (rightEdge > visibleRight) {
    return viewportWidth - rightEdge;
  }

  return currentTranslation;
}

export function clampButtonRailTranslation(
  newTranslation: number,
  viewportWidth: number,
  contentWidth: number,
): number {
  const maxPositiveTranslation =
    contentWidth > 0 && viewportWidth > contentWidth
      ? viewportWidth - contentWidth
      : 0;
  const minNegativeTranslation =
    contentWidth > viewportWidth ? viewportWidth - contentWidth : 0;
  return Math.min(
    maxPositiveTranslation,
    Math.max(minNegativeTranslation, newTranslation),
  );
}

export function getButtonRailAppliedTranslation(
  newTranslation: number,
  viewportWidth: number,
  contentWidth: number,
  centerFocusedView: boolean,
): number {
  return centerFocusedView
    ? newTranslation
    : clampButtonRailTranslation(
        newTranslation,
        viewportWidth,
        contentWidth,
      );
}

export function getButtonRailFadingEdges(
  tx: number,
  viewportWidth: number,
  contentWidth: number,
): ButtonRailFadingEdges {
  return {
    showLeftFade: tx < 0,
    showRightFade: contentWidth + tx > viewportWidth,
  };
}

/**
 * Reports the scroll position as a signed value (`-translation`). Positive
 * translation (centered content smaller than the viewport, or the allowed
 * positive clamp) is therefore reported as a negative x, not clamped to 0.
 */
export function getButtonRailScrollX(translation: number): number {
  return -translation;
}
