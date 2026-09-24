/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * FocusNavigationProvider
 *
 * Provides geometric focus navigation for Meta Ray-Ban Display apps.
 * Arrow keys move focus between focusable elements based on their
 * position on screen. Native Tab traversal is preserved by default; opt into
 * the on-device d-pad-only behavior via `blockTabNavigation`.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  FOCUS_NAVIGATION_HANDLED_EVENT,
  FOCUS_POPUP_ROOT_SELECTOR,
  FOCUS_SECTION_SELECTOR,
  FOCUS_SEARCH_FROM_ORIGIN_EVENT,
  FOCUSABLE_SELECTOR,
  INVALID_FOCUS_DIRECTION_EVENT,
  SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
  SCROLL_VIEW_SELECTOR,
  type FocusNavigationDirection as Direction,
} from '../base/FocusNavigationEvents';
import { registerAutoFocusFirstOwner } from '../base/FocusCoordinator';
import { withPreRecordedFocusChange } from '../base/InteractableFastScrollTracker';

interface FocusNavigationContextValue {
  /** Whether focus navigation is currently active */
  isActive: boolean;
  /** Move focus in a geometric direction */
  moveFocus: (direction: Direction) => boolean;
  /** Activate/click the currently focused element */
  activateFocused: () => void;
  /** Restore focus to an eligible target when focus has left the provider */
  clearFocus: () => void;
}

const FocusNavigationContext = createContext<FocusNavigationContextValue>({
  isActive: false,
  moveFocus: () => false,
  activateFocused: () => {},
  clearFocus: () => {},
});

const INTERNAL_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
};
const INTERACTABLE_SELECTOR = '[data-uit-interactable]';
const focusNavigationRoots = new Set<HTMLElement>();

function getOwningFocusNavigationRoot(element: Element | null): HTMLElement | null {
  if (element == null) {
    return null;
  }

  let owner: HTMLElement | null = null;
  for (const root of focusNavigationRoots) {
    if (root.contains(element) && (owner == null || owner.contains(root))) {
      owner = root;
    }
  }
  return owner;
}

/**
 * Hook to access focus navigation context.
 * Components can use this to check if focus nav is active
 * or to programmatically move focus.
 */
export function useFocusNavigation() {
  return useContext(FocusNavigationContext);
}

export interface FocusNavigationProviderProps {
  children: React.ReactNode;
  /** Whether focus navigation is enabled */
  enabled?: boolean;
  /** The container element ref to scope focus queries to */
  containerRef?: React.RefObject<HTMLElement | null>;
  /**
   * Block native Tab focus traversal so navigation is d-pad/arrow-key only
   * (matches on-device behavior). Off by default so the web build keeps a
   * working Tab order for keyboard and assistive-technology users.
   */
  blockTabNavigation?: boolean;
  /**
   * Let the FocusCoordinator auto-focus the top-left interactable on mount /
   * page change. Off by default so the coordinator does not steal focus from
   * native focus order or the host application.
   */
  autoFocusFirst?: boolean;
}

interface FocusSearchFromOriginDetail {
  origin?: Element | null;
  originRect?: FocusSearchOriginRect | null;
  direction?: Direction;
  handled?: boolean;
}

interface FocusSearchOriginRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

interface ScrollViewNavigationRequestDetail {
  direction: Direction;
  handled: boolean;
  origin?: Element;
}

function toDOMRect(rect: FocusSearchOriginRect): DOMRect {
  const width = rect.width ?? rect.right - rect.left;
  const height = rect.height ?? rect.bottom - rect.top;
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width,
    height,
    x: rect.x ?? rect.left,
    y: rect.y ?? rect.top,
    toJSON: () => ({}),
  } as DOMRect;
}

function rectCenterX(rect: DOMRect): number {
  return rect.left + rect.width / 2;
}

function rectCenterY(rect: DOMRect): number {
  return rect.top + rect.height / 2;
}

function getOverflowAxes(element: Element): {
  clipsX: boolean;
  clipsY: boolean;
  scrollsX: boolean;
  scrollsY: boolean;
} {
  const style = getComputedStyle(element);
  const overflowX = style.overflowX;
  const overflowY = style.overflowY;
  const clipsX = ['auto', 'scroll', 'hidden', 'clip'].includes(overflowX);
  const clipsY = ['auto', 'scroll', 'hidden', 'clip'].includes(overflowY);

  // Components that clip with `overflow: hidden` but scroll programmatically
  // (e.g. `ButtonRail`, which scrolls via a transform on its inner track) can
  // opt their scrollable axis into candidate eligibility via
  // `data-uit-focus-scrollable="x" | "y" | "both"`. Without this, only native
  // `auto`/`scroll` scrollers are considered scrollable, so a programmatic
  // scroller's off-clip children would be wrongly excluded and directional
  // navigation could never cross into a stacked rail whose aligned item is
  // currently scrolled out of view. The opt-in is axis-specific
  // so a decorative clip on the orthogonal axis is never affected.
  const scrollableMarker = element.getAttribute('data-uit-focus-scrollable');
  const optsInScrollX = scrollableMarker === 'x' || scrollableMarker === 'both';
  const optsInScrollY = scrollableMarker === 'y' || scrollableMarker === 'both';

  return {
    clipsX,
    clipsY,
    scrollsX:
      (['auto', 'scroll'].includes(overflowX) || optsInScrollX) &&
      element.scrollWidth > element.clientWidth + 1,
    scrollsY:
      (['auto', 'scroll'].includes(overflowY) || optsInScrollY) &&
      element.scrollHeight > element.clientHeight + 1,
  };
}

function intersectsAxis(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aEnd > bStart + 1 && aStart < bEnd - 1;
}

function isInsideClip(
  rect: DOMRect,
  clipRect: DOMRect,
  scrollableAxisAllowance: { x: boolean; y: boolean },
): boolean {
  const xVisible =
    scrollableAxisAllowance.x || intersectsAxis(rect.left, rect.right, clipRect.left, clipRect.right);
  const yVisible =
    scrollableAxisAllowance.y || intersectsAxis(rect.top, rect.bottom, clipRect.top, clipRect.bottom);

  return xVisible && yVisible;
}

function isVisibleFocusCandidate(element: Element, container: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const isRevealable = element.closest('[data-uit-focus-revealable="true"]') != null;

  if (
    element.closest('[inert]') != null ||
    element.getAttribute('aria-hidden') === 'true' ||
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    (!isRevealable && Number.parseFloat(style.opacity) === 0) ||
    style.pointerEvents === 'none' ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return false;
  }

  const scrollableAxisAllowance = { x: false, y: false };

  let parent = element.parentElement;
  while (parent && container.contains(parent)) {
    const parentStyle = getComputedStyle(parent);
    // An ancestor's `pointer-events: none` must NOT exclude its descendants
    // from geometric (d-pad/keyboard) focus navigation. `pointer-events` governs
    // pointer hit-testing only — not keyboard focus or visibility — and a
    // descendant can re-enable `pointer-events: auto`, so an ancestor's `none`
    // does not even imply the descendant is non-interactive to a pointer. A
    // layer that genuinely removes content from navigation uses `display: none`,
    // `visibility: hidden`, `aria-hidden`, or `inert` instead. Checking it here
    // broke d-pad navigation in apps that set `pointer-events: none` on a
    // container so a layer beneath it stays gesture-interactive while the
    // container's own focusable content re-enables pointer events.
    if (
      parent.getAttribute('aria-hidden') === 'true' ||
      parentStyle.display === 'none' ||
      parentStyle.visibility === 'hidden' ||
      (!isRevealable && Number.parseFloat(parentStyle.opacity) === 0)
    ) {
      return false;
    }

    const overflow = getOverflowAxes(parent);
    if (overflow.scrollsX) {
      scrollableAxisAllowance.x = true;
    }
    if (overflow.scrollsY) {
      scrollableAxisAllowance.y = true;
    }

    if (overflow.clipsX || overflow.clipsY) {
      const parentRect = parent.getBoundingClientRect();
      if (!isInsideClip(rect, parentRect, scrollableAxisAllowance)) {
        return false;
      }
    }

    if (parent === container) {
      break;
    }
    parent = parent.parentElement;
  }

  return isInsideClip(rect, container.getBoundingClientRect(), scrollableAxisAllowance);
}

/**
 * Find the nearest focusable element in the given direction
 * from the currently focused element.
 *
 * Algorithm:
 * 1. Get all focusable elements in the container
 * 2. Filter to elements that are in the correct direction
 * 3. Score by distance, preferring elements that are more aligned
 *    with the direction of movement
 */
function findNearestInDirection(
  current: Element,
  candidates: Element[],
  direction: Direction,
  scope?: Element,
): Element | null {
  return findNearestFromRect(
    current.getBoundingClientRect(),
    candidates,
    direction,
    current,
    scope,
  );
}

function findNearestFromRect(
  sourceRect: DOMRect,
  candidates: Element[],
  direction: Direction,
  current?: Element,
  scope?: Element,
): Element | null {
  let bestCandidate: Element | null = null;
  let bestRect: DOMRect | null = null;

  for (const candidate of candidates) {
    if (scope != null && !scope.contains(candidate)) {
      continue;
    }
    if (
      current != null &&
      (candidate === current || candidate.contains(current) || current.contains(candidate))
    ) {
      continue;
    }

    const candidateRect = candidate.getBoundingClientRect();
    if (isBetterFocusCandidate(direction, sourceRect, candidateRect, bestRect)) {
      bestCandidate = candidate;
      bestRect = candidateRect;
    }
  }

  return bestCandidate;
}

function getContainingFocusSections(
  current: Element,
  container: HTMLElement,
): HTMLElement[] {
  const sections: HTMLElement[] = [];
  let section = current.closest(FOCUS_SECTION_SELECTOR);

  while (section instanceof HTMLElement && container.contains(section)) {
    sections.push(section);
    section = section.parentElement?.closest(FOCUS_SECTION_SELECTOR) ?? null;
  }

  return sections;
}

/**
 * Distance from a point to the nearest edge of a rect (0 if the point is
 * inside the rect). Used to pick the focusable closest to a pointer click.
 */
function distanceFromPointToRect(x: number, y: number, rect: DOMRect): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}

/**
 * Find the focusable candidate nearest to a pointer (x, y), by distance to its
 * box. Lets a click anywhere in the navigation area land on the closest element.
 */
function findNearestToPoint(x: number, y: number, candidates: Element[]): Element | null {
  let best: Element | null = null;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = distanceFromPointToRect(x, y, candidate.getBoundingClientRect());
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

/**
 * True when running on an Android platform (the Meta Ray-Ban Display device's Android
 * WebView, or Android Chrome). Pointer-to-focus is a desktop browser mouse
 * affordance; on the device interaction is d-pad/trackpad and synthetic taps
 * shouldn't move focus, so the behavior is gated off here.
 */
function isAndroidPlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /android/i.test(navigator.userAgent);
}

function isBetterFocusCandidate(
  direction: Direction,
  source: DOMRect,
  candidate: DOMRect,
  currentBest: DOMRect | null,
): boolean {
  if (!isFocusCandidate(source, candidate, direction)) {
    return false;
  }

  if (currentBest == null || !isFocusCandidate(source, currentBest, direction)) {
    return true;
  }

  if (beamBeats(direction, source, candidate, currentBest)) {
    return true;
  }

  if (beamBeats(direction, source, currentBest, candidate)) {
    return false;
  }

  return getWeightedDistanceFor(
    majorAxisDistance(direction, source, candidate),
    minorAxisDistance(direction, source, candidate),
  ) < getWeightedDistanceFor(
    majorAxisDistance(direction, source, currentBest),
    minorAxisDistance(direction, source, currentBest),
  );
}

function isFocusCandidate(source: DOMRect, destination: DOMRect, direction: Direction): boolean {
  switch (direction) {
    case 'left':
      return (
        (source.right > destination.right || source.left >= destination.right) &&
        source.left > destination.left
      );
    case 'right':
      return (
        (source.left < destination.left || source.right <= destination.left) &&
        source.right < destination.right
      );
    case 'up':
      return (
        (source.bottom > destination.bottom || source.top >= destination.bottom) &&
        source.top > destination.top
      );
    case 'down':
      return (
        (source.top < destination.top || source.bottom <= destination.top) &&
        source.bottom < destination.bottom
      );
  }
}

function beamsOverlap(direction: Direction, source: DOMRect, destination: DOMRect): boolean {
  if (direction === 'left' || direction === 'right') {
    return destination.bottom > source.top && destination.top < source.bottom;
  }

  return destination.right > source.left && destination.left < source.right;
}

function beamBeats(
  direction: Direction,
  source: DOMRect,
  candidate: DOMRect,
  currentBest: DOMRect,
): boolean {
  const candidateInBeam = beamsOverlap(direction, source, candidate);
  const bestInBeam = beamsOverlap(direction, source, currentBest);

  if (bestInBeam || !candidateInBeam) {
    return false;
  }

  if (!isToDirectionOf(direction, source, currentBest)) {
    return true;
  }

  if (direction === 'left' || direction === 'right') {
    return true;
  }

  return (
    majorAxisDistance(direction, source, candidate) <
    majorAxisDistanceToFarEdge(direction, source, currentBest)
  );
}

function isToDirectionOf(direction: Direction, source: DOMRect, destination: DOMRect): boolean {
  switch (direction) {
    case 'left':
      return source.left >= destination.right;
    case 'right':
      return source.right <= destination.left;
    case 'up':
      return source.top >= destination.bottom;
    case 'down':
      return source.bottom <= destination.top;
  }
}

function majorAxisDistance(direction: Direction, source: DOMRect, destination: DOMRect): number {
  return Math.max(0, majorAxisDistanceRaw(direction, source, destination));
}

function majorAxisDistanceRaw(
  direction: Direction,
  source: DOMRect,
  destination: DOMRect,
): number {
  switch (direction) {
    case 'left':
      return source.left - destination.right;
    case 'right':
      return destination.left - source.right;
    case 'up':
      return source.top - destination.bottom;
    case 'down':
      return destination.top - source.bottom;
  }
}

function majorAxisDistanceToFarEdge(
  direction: Direction,
  source: DOMRect,
  destination: DOMRect,
): number {
  return Math.max(1, majorAxisDistanceToFarEdgeRaw(direction, source, destination));
}

function majorAxisDistanceToFarEdgeRaw(
  direction: Direction,
  source: DOMRect,
  destination: DOMRect,
): number {
  switch (direction) {
    case 'left':
      return source.left - destination.left;
    case 'right':
      return destination.right - source.right;
    case 'up':
      return source.top - destination.top;
    case 'down':
      return destination.bottom - source.bottom;
  }
}

function minorAxisDistance(direction: Direction, source: DOMRect, destination: DOMRect): number {
  if (direction === 'left' || direction === 'right') {
    return Math.abs(rectCenterY(source) - rectCenterY(destination));
  }

  return Math.abs(rectCenterX(source) - rectCenterX(destination));
}

function getWeightedDistanceFor(majorAxisDistanceValue: number, minorAxisDistanceValue: number): number {
  return 13 * majorAxisDistanceValue * majorAxisDistanceValue +
    minorAxisDistanceValue * minorAxisDistanceValue;
}

function isInsideFocusPopup(element: Element | null): boolean {
  return element?.closest(FOCUS_POPUP_ROOT_SELECTOR) != null;
}

function isVisibleScrollCandidate(element: HTMLElement, container: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  if (
    element.closest('[inert]') != null ||
    element.getAttribute('aria-hidden') === 'true' ||
    element.closest('[data-page-transition-phase="exiting"]') != null ||
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.pointerEvents === 'none' ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return false;
  }

  let parent = element.parentElement;
  while (parent && container.contains(parent)) {
    const parentStyle = getComputedStyle(parent);
    // See isVisibleFocusCandidate: an ancestor's `pointer-events: none` does not
    // remove a descendant from d-pad navigation, so it must not exclude a
    // scroll candidate either.
    if (
      parent.getAttribute('aria-hidden') === 'true' ||
      parentStyle.display === 'none' ||
      parentStyle.visibility === 'hidden'
    ) {
      return false;
    }
    if (parent === container) {
      break;
    }
    parent = parent.parentElement;
  }

  return isInsideClip(rect, container.getBoundingClientRect(), { x: false, y: false });
}

function getScrollableCandidates(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(SCROLL_VIEW_SELECTOR)).filter(
    (element) => isVisibleScrollCandidate(element, container),
  );
}

function requestScrollViewNavigation(
  element: HTMLElement,
  direction: Direction,
  origin?: Element | null,
): boolean {
  const detail: ScrollViewNavigationRequestDetail = {
    direction,
    handled: false,
    origin: origin ?? undefined,
  };
  element.dispatchEvent(new CustomEvent<ScrollViewNavigationRequestDetail>(
    SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
    {
      detail,
      cancelable: true,
    },
  ));
  return detail.handled;
}

function prioritizeScrollableCandidates(
  candidates: HTMLElement[],
  origin?: Element | null,
): HTMLElement[] {
  const containingCandidate =
    origin == null ? null : candidates.find((element) => element.contains(origin));
  if (containingCandidate == null) {
    return candidates;
  }

  return [
    containingCandidate,
    ...candidates.filter((candidate) => candidate !== containingCandidate),
  ];
}

function scrollNearestScrollableInDirection(
  container: HTMLElement,
  direction: Direction,
  origin?: Element | null,
): boolean {
  const candidates = prioritizeScrollableCandidates(
    getScrollableCandidates(container),
    origin,
  );
  return candidates.some((candidate) =>
    requestScrollViewNavigation(candidate, direction, origin)
  );
}

function getFocusFeedbackTarget(element: Element): Element {
  return element.closest(INTERACTABLE_SELECTOR) ?? element;
}

function dispatchFocusNavigationHandled(element: Element): void {
  getFocusFeedbackTarget(element).dispatchEvent(
    new CustomEvent(FOCUS_NAVIGATION_HANDLED_EVENT),
  );
}

function dispatchInvalidFocusDirection(element: Element, direction: Direction): void {
  getFocusFeedbackTarget(element).dispatchEvent(
    new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
      detail: { direction },
    }),
  );
}

function focusDirectionalTarget(element: HTMLElement): void {
  const focus = () => element.focus({ preventScroll: true });
  if (element.matches(INTERACTABLE_SELECTOR)) {
    withPreRecordedFocusChange(focus);
  } else {
    focus();
  }
}

export function FocusNavigationProvider({
  children,
  enabled = true,
  containerRef,
  blockTabNavigation = false,
  autoFocusFirst = false,
}: FocusNavigationProviderProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const isActive = enabled;

  const getContainer = useCallback((): HTMLElement | null => {
    return containerRef?.current ?? internalRef.current;
  }, [containerRef]);

  useEffect(() => {
    if (!(enabled && autoFocusFirst)) {
      return undefined;
    }
    const container = getContainer();
    return container == null ? undefined : registerAutoFocusFirstOwner(container);
  }, [autoFocusFirst, enabled, getContainer]);

  const getFocusableElements = useCallback((): Element[] => {
    const container = getContainer();
    if (!container) return [];
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) =>
      isVisibleFocusCandidate(element, container),
    );
  }, [getContainer]);

  const moveFocus = useCallback(
    (direction: Direction): boolean => {
      const container = getContainer();
      if (!container) return false;

      const focusables = getFocusableElements();
      if (focusables.length === 0) {
        return scrollNearestScrollableInDirection(container, direction);
      }

      const active = document.activeElement;

      // If nothing is focused or focus is outside the container, focus the first element
      if (!active || !container.contains(active)) {
        const first = focusables[0] as HTMLElement;
        first.focus({ preventScroll: true });
        return true;
      }

      const focusSections = getContainingFocusSections(active, container);
      for (const section of focusSections) {
        const sectionNext = findNearestInDirection(
          active,
          focusables,
          direction,
          section,
        );
        if (sectionNext) {
          dispatchFocusNavigationHandled(active);
          focusDirectionalTarget(sectionNext as HTMLElement);
          return true;
        }

        if (
          section.matches(SCROLL_VIEW_SELECTOR) &&
          requestScrollViewNavigation(section, direction, active)
        ) {
          dispatchFocusNavigationHandled(active);
          return true;
        }
      }

      const next = findNearestInDirection(active, focusables, direction);
      if (next) {
        dispatchFocusNavigationHandled(active);
        focusDirectionalTarget(next as HTMLElement);
        return true;
      }

      if (active instanceof Element) {
        if (scrollNearestScrollableInDirection(container, direction, active)) {
          dispatchFocusNavigationHandled(active);
          return true;
        }
        dispatchInvalidFocusDirection(active, direction);
      }
      return false;
    },
    [getContainer, getFocusableElements],
  );

  const focusFromOrigin = useCallback(
    (
      origin: Element | null,
      direction: Direction,
      originRect?: FocusSearchOriginRect | null,
    ): boolean => {
      const container = getContainer();
      if (!container) {
        return false;
      }

      const focusables = getFocusableElements();
      if (focusables.length === 0) {
        return false;
      }

      const sourceRect =
        originRect != null
          ? toDOMRect(originRect)
          : origin instanceof Element && container.contains(origin)
            ? origin.getBoundingClientRect()
            : null;
      if (sourceRect == null) {
        return false;
      }

      const current =
        origin instanceof Element && container.contains(origin) ? origin : undefined;
      let next: Element | null = null;
      if (current != null) {
        const focusSections = getContainingFocusSections(current, container);
        for (const section of focusSections) {
          next = findNearestFromRect(
            sourceRect,
            focusables,
            direction,
            current,
            section,
          );
          if (next != null) {
            break;
          }
        }
      }
      next ??= findNearestFromRect(sourceRect, focusables, direction, current);
      if (!next) {
        return false;
      }

      focusDirectionalTarget(next as HTMLElement);
      return true;
    },
    [getContainer, getFocusableElements],
  );

  const activateFocused = useCallback(() => {
    const active = document.activeElement;
    if (active && active instanceof HTMLElement) {
      active.click();
    }
  }, []);

  const clearFocus = useCallback(() => {
    const container = getContainer();
    const activeElement = document.activeElement;
    if (
      container == null ||
      (activeElement instanceof Element &&
        activeElement !== container &&
        container.contains(activeElement))
    ) {
      return;
    }

    const first = getFocusableElements()[0];
    if (first instanceof HTMLElement) {
      first.focus({ preventScroll: true });
    }
  }, [getContainer, getFocusableElements]);

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const registeredContainer = getContainer();
    if (registeredContainer == null) {
      return;
    }
    focusNavigationRoots.add(registeredContainer);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) {
        return;
      }

      const container = getContainer();
      if (!container) return;

      const activeElement =
        document.activeElement instanceof Element ? document.activeElement : null;
      const eventTarget = e.target instanceof Element ? e.target : null;
      if (isInsideFocusPopup(activeElement) || isInsideFocusPopup(eventTarget)) {
        return;
      }

      const owningRoot =
        getOwningFocusNavigationRoot(activeElement) ??
        getOwningFocusNavigationRoot(eventTarget) ??
        (focusNavigationRoots.size === 1 ? registeredContainer : null);
      if (owningRoot !== container) {
        return;
      }

      // Only handle events if focus is within or on the container
      if (!container.contains(document.activeElement) && document.activeElement !== container) {
        // If nothing in the container is focused, and an arrow key is pressed,
        // focus the first element
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          const focusables = getFocusableElements();
          if (focusables.length > 0) {
            (focusables[0] as HTMLElement).focus({ preventScroll: true });
            e.preventDefault();
          } else {
            const direction = e.key === 'ArrowUp'
              ? 'up'
              : e.key === 'ArrowDown'
                ? 'down'
                : e.key === 'ArrowLeft'
                  ? 'left'
                  : 'right';
            if (scrollNearestScrollableInDirection(container, direction)) {
              e.preventDefault();
            }
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveFocus('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus('right');
          break;
        case 'Enter':
        case ' ':
          // Let the browser handle Enter/Space on buttons natively
          break;
        case 'Escape':
          clearFocus();
          break;
        case 'Tab':
          // Only block Tab when explicitly opted in (on-device d-pad-only
          // behavior). By default the web build keeps native Tab traversal so
          // keyboard / assistive-tech users are not trapped.
          if (blockTabNavigation) {
            e.preventDefault();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      focusNavigationRoots.delete(registeredContainer);
    };
  }, [
    blockTabNavigation,
    clearFocus,
    enabled,
    getContainer,
    getFocusableElements,
    moveFocus,
  ]);

  // Pointer handler: a click anywhere inside the navigation area moves focus to
  // the nearest focusable element to the click point — so a mouse behaves like
  // reaching that element via the d-pad. Clicks landing directly on a focusable
  // are left to the browser's native focus handling. Gated to non-Android
  // platforms: the Android device is d-pad/trackpad driven, where synthetic
  // taps should not move focus.
  useEffect(() => {
    if (!enabled || isAndroidPlatform()) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;

      const container = getContainer();
      const target = e.target instanceof Node ? e.target : null;
      if (!container || !target || !container.contains(target)) return;

      const targetElement = target instanceof Element ? target : null;
      if (isInsideFocusPopup(targetElement)) return;

      const focusables = getFocusableElements();
      if (focusables.length === 0) return;

      // Clicked on (or inside) a focusable — let native focus handle it.
      if (focusables.some((el) => el === target || el.contains(target))) return;

      const nearest = findNearestToPoint(e.clientX, e.clientY, focusables);
      if (nearest) {
        // Prevent the default focus shift to <body> so our focus sticks.
        e.preventDefault();
        (nearest as HTMLElement).focus({ preventScroll: true });
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [enabled, getContainer, getFocusableElements]);

  useEffect(() => {
    if (!enabled) return;

    const handleFocusSearchFromOrigin = (event: Event) => {
      const customEvent = event as CustomEvent<FocusSearchFromOriginDetail>;
      const detail = customEvent.detail;
      if (detail?.direction == null) {
        return;
      }

      const origin = detail.origin instanceof Element ? detail.origin : null;
      if (focusFromOrigin(origin, detail.direction, detail.originRect)) {
        detail.handled = true;
        event.preventDefault();
      }
    };

    document.addEventListener(FOCUS_SEARCH_FROM_ORIGIN_EVENT, handleFocusSearchFromOrigin);
    return () =>
      document.removeEventListener(FOCUS_SEARCH_FROM_ORIGIN_EVENT, handleFocusSearchFromOrigin);
  }, [enabled, focusFromOrigin]);

  const contextValue = useMemo<FocusNavigationContextValue>(
    () => ({
      isActive,
      moveFocus,
      activateFocused,
      clearFocus,
    }),
    [activateFocused, clearFocus, isActive, moveFocus],
  );

  return (
    <FocusNavigationContext.Provider value={contextValue}>
      {containerRef ? (
        // External container provided, just render children
        children
      ) : (
        // Wrap in a real box so focus candidate visibility checks have bounds.
        <div ref={internalRef} style={INTERNAL_CONTAINER_STYLE} tabIndex={-1}>
          {children}
        </div>
      )}
    </FocusNavigationContext.Provider>
  );
}
