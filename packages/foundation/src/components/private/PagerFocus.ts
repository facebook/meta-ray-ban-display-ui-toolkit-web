/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isInitialFocusEligibleElement } from '../../base/FocusCoordinator';
import { FOCUSABLE_SELECTOR } from '../../base/FocusNavigationEvents';

export type FocusDirection = 'left' | 'right' | 'up' | 'down';

export { FOCUSABLE_SELECTOR };

function getRectCenter(rect: DOMRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function rectsIntersect(a: DOMRect, b: DOMRect): boolean {
  return (
    a.right > b.left + 1 &&
    a.left < b.right - 1 &&
    a.bottom > b.top + 1 &&
    a.top < b.bottom - 1
  );
}

function clipsOverflow(element: Element): boolean {
  const style = getComputedStyle(element);
  return [style.overflow, style.overflowX, style.overflowY].some((overflow) =>
    ['auto', 'scroll', 'hidden', 'clip'].includes(overflow),
  );
}

function isVisibleFocusCandidate(element: Element, boundary: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return false;
  }

  let visibleRect = boundary.getBoundingClientRect();
  if (!rectsIntersect(rect, visibleRect)) {
    return false;
  }

  let parent = element.parentElement;
  while (parent && boundary.contains(parent)) {
    const parentStyle = getComputedStyle(parent);
    if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
      return false;
    }

    if (clipsOverflow(parent)) {
      const parentRect = parent.getBoundingClientRect();
      if (!rectsIntersect(rect, parentRect)) {
        return false;
      }
      visibleRect = parentRect;
    }

    if (parent === boundary) {
      break;
    }
    parent = parent.parentElement;
  }

  return rectsIntersect(rect, visibleRect);
}

function getFocusableElements(boundary: HTMLElement): HTMLElement[] {
  return Array.from(boundary.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((element): element is HTMLElement => element instanceof HTMLElement)
    .filter((element) => isVisibleFocusCandidate(element, boundary));
}

export function getInitialFocusableElement(boundary: HTMLElement): HTMLElement | null {
  const candidates = getFocusableElements(boundary)
    .filter(isInitialFocusEligibleElement);
  return (
    candidates.find(
      (candidate) => !candidates.some((other) => other !== candidate && candidate.contains(other)),
    ) ??
    candidates[0] ??
    null
  );
}

function findNearestInDirection(
  current: HTMLElement,
  candidates: HTMLElement[],
  direction: FocusDirection,
): HTMLElement | null {
  const currentRect = current.getBoundingClientRect();
  const currentCenter = getRectCenter(currentRect);
  let bestCandidate: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    if (candidate === current) continue;
    if (candidate.contains(current) || current.contains(candidate)) continue;

    const candidateRect = candidate.getBoundingClientRect();
    const candidateCenter = getRectCenter(candidateRect);
    const dx = candidateCenter.x - currentCenter.x;
    const dy = candidateCenter.y - currentCenter.y;

    // Edge-based directional test, matching FocusNavigationProvider's in-page
    // beam model. Comparing edges (not just center deltas) is what lets an
    // element that spans the full cross-axis — e.g. a full-width tile — report
    // that nothing sits beside it, so the Pager hands off to the adjacent
    // page instead of being blocked by a diagonally-offset neighbor.
    const isInDirection =
      direction === 'up'
        ? (currentRect.bottom > candidateRect.bottom ||
            currentRect.top >= candidateRect.bottom) &&
          currentRect.top > candidateRect.top
        : direction === 'down'
          ? (currentRect.top < candidateRect.top ||
              currentRect.bottom <= candidateRect.top) &&
            currentRect.bottom < candidateRect.bottom
          : direction === 'left'
            ? (currentRect.right > candidateRect.right ||
                currentRect.left >= candidateRect.right) &&
              currentRect.left > candidateRect.left
            : (currentRect.left < candidateRect.left ||
                currentRect.right <= candidateRect.left) &&
              currentRect.right < candidateRect.right;

    if (!isInDirection) continue;

    const primaryDist =
      direction === 'up' || direction === 'down'
        ? Math.abs(dy)
        : Math.abs(dx);
    const secondaryDist =
      direction === 'up' || direction === 'down'
        ? Math.abs(dx)
        : Math.abs(dy);
    const score = primaryDist + secondaryDist * 2.5;

    if (score < bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

export function hasFocusableInDirection(
  current: HTMLElement,
  page: HTMLElement,
  direction: FocusDirection,
): boolean {
  return findNearestInDirection(current, getFocusableElements(page), direction) != null;
}

export function isKeyboardReachable(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current) {
    const style = getComputedStyle(current);
    if (
      current.getAttribute('aria-hidden') === 'true' ||
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.pointerEvents === 'none'
    ) {
      return false;
    }

    current = current.parentElement;
  }

  return true;
}
