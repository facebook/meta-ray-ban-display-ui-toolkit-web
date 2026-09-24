/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import type {
  PageTransitionConfig,
  PageTransitionInitialFocus,
  PageTransitionMotionConfig,
  PageTransitionProps,
} from './PageTransition.types';
import {
  claimFocusedInteractable,
  FORCE_FOCUS_SYNC_EVENT,
  getFocusOwner,
  isInitialFocusEligibleElement,
} from '../base/FocusCoordinator';
import { FOCUS_CANDIDATE_SELECTOR } from '../base/FocusNavigationEvents';
import { runWithFocusSafeAreaScrollSuppressed } from '../components/private/FadingEdges';
import styles from './PageTransition.module.css';

const APP_APPEAR_EASING = 'cubic-bezier(0.5, 0, 0, 1)';
const APP_DISAPPEAR_EASING = 'cubic-bezier(0.33, 0, 0, 1)';
const FRAGMENT_ENTER_EXIT_EASING = 'cubic-bezier(0.33, 0, 0.67, 1)';
const FRAGMENT_FORWARD_ENTER_TRANSLATE_EASING =
  'cubic-bezier(0.33, 0, 0.2, 1)';
const FRAGMENT_BACK_ENTER_TRANSLATE_EASING =
  'cubic-bezier(0.33, 0, 0.19, 1)';
const NO_SCALE_SEGMENT = {
  durationMs: 0,
  easing: FRAGMENT_ENTER_EXIT_EASING,
  from: 1,
  to: 1,
};
const PAGE_TRANSITION_CONTENT_READY_TIMEOUT_MS = 200;
const DEVICE_WEBVIEW_TRANSITION_TIMING_SCALE = 1.75;

export const InAppPageTransitionConfig: PageTransitionConfig = {
  forward: {
    enter: {
      alpha: {
        delayMs: 267,
        durationMs: 167,
        easing: FRAGMENT_ENTER_EXIT_EASING,
        from: 0,
        to: 1,
      },
      scale: NO_SCALE_SEGMENT,
      translateX: {
        delayMs: 233,
        durationMs: 267,
        easing: FRAGMENT_FORWARD_ENTER_TRANSLATE_EASING,
        from: 15,
        to: 0,
      },
    },
    exit: {
      alpha: {
        delayMs: 33,
        durationMs: 100,
        easing: FRAGMENT_ENTER_EXIT_EASING,
        from: 1,
        to: 0,
      },
      scale: NO_SCALE_SEGMENT,
      translateX: {
        durationMs: 167,
        easing: FRAGMENT_ENTER_EXIT_EASING,
        from: 0,
        to: -15,
      },
    },
    totalDurationMs: 500,
  },
  back: {
    enter: {
      alpha: {
        delayMs: 300,
        durationMs: 167,
        easing: FRAGMENT_ENTER_EXIT_EASING,
        from: 0,
        to: 1,
      },
      scale: NO_SCALE_SEGMENT,
      translateX: {
        delayMs: 267,
        durationMs: 233,
        easing: FRAGMENT_BACK_ENTER_TRANSLATE_EASING,
        from: -15,
        to: 0,
      },
    },
    exit: {
      alpha: {
        delayMs: 33,
        durationMs: 100,
        easing: FRAGMENT_ENTER_EXIT_EASING,
        from: 1,
        to: 0,
      },
      scale: NO_SCALE_SEGMENT,
      translateX: {
        durationMs: 167,
        easing: FRAGMENT_ENTER_EXIT_EASING,
        from: 0,
        to: 15,
      },
    },
    totalDurationMs: 500,
  },
};

export const AppSwitchPageTransitionConfig: PageTransitionConfig = {
  forward: {
    enter: {
      alpha: {
        delayMs: 467,
        durationMs: 200,
        easing: APP_APPEAR_EASING,
        from: 0,
        to: 1,
      },
      scale: {
        delayMs: 400,
        durationMs: 267,
        easing: APP_APPEAR_EASING,
        from: 0.9,
        to: 1,
      },
      translateX: {
        delayMs: 400,
        durationMs: 400,
        easing: APP_APPEAR_EASING,
        from: 55,
        to: 0,
      },
    },
    exit: {
      alpha: {
        durationMs: 400,
        easing: APP_DISAPPEAR_EASING,
        from: 1,
        to: 0,
      },
      scale: {
        delayMs: 33,
        durationMs: 367,
        easing: APP_DISAPPEAR_EASING,
        from: 1,
        to: 0.9,
      },
      translateX: {
        durationMs: 233,
        easing: APP_DISAPPEAR_EASING,
        from: 0,
        to: -55,
      },
    },
    totalDurationMs: 800,
  },
};

export const DefaultPageTransitionConfig = InAppPageTransitionConfig;

interface PageTransitionEntry {
  children: ReactNode;
  id: number;
  phase: 'preparingEnter' | 'entering' | 'preparingExit' | 'exiting' | 'idle';
  transitionKey: string;
}

interface PageTransitionScrollSnapshot {
  left: number;
  path: number[];
  top: number;
}

interface PageTransitionStateSnapshot {
  focusedIndex: number | null;
  scroll: PageTransitionScrollSnapshot[];
}

function toCssDuration(valueMs: number): string {
  return `${valueMs}ms`;
}

function clampTimingScale(value: number): number {
  return Math.min(Math.max(value, 0.25), 4);
}

function getRasterWarmAlpha(value: number): string {
  return value === 0 ? '0.001' : `${value}`;
}

function getAutoPageTransitionTimingScale(): number {
  if (typeof navigator === 'undefined') {
    return 1;
  }

  const userAgent = navigator.userAgent;
  // Detect the on-device Android WebView via its User-Agent token, which runs
  // the page transition slightly slower to match the device's compositor.
  return userAgent.includes('Greatwhite') && userAgent.includes('; wv)')
    ? DEVICE_WEBVIEW_TRANSITION_TIMING_SCALE
    : 1;
}

function getResolvedPageTransitionTimingScale(
  timingScale: PageTransitionProps['timingScale'],
): number {
  if (timingScale == null || timingScale === 'auto') {
    return getAutoPageTransitionTimingScale();
  }

  return Number.isFinite(timingScale) && timingScale > 0
    ? clampTimingScale(timingScale)
    : 1;
}

function toScaledCssDuration(valueMs: number, timingScale: number): string {
  return toCssDuration(valueMs === 0 ? 0 : Math.round(valueMs * timingScale));
}

function getDirectionalMotion(
  config: PageTransitionConfig,
  direction: PageTransitionProps['direction'],
): PageTransitionMotionConfig {
  return direction === 'back' && config.back != null
    ? config.back
    : config.forward;
}

function getTransitionStyle(
  config: PageTransitionMotionConfig,
  timingScale: number,
): CSSProperties {
  return {
    '--uit-page-transition-enter-alpha-delay':
      toScaledCssDuration(config.enter.alpha.delayMs ?? 0, timingScale),
    '--uit-page-transition-enter-alpha-duration':
      toScaledCssDuration(config.enter.alpha.durationMs, timingScale),
    '--uit-page-transition-enter-alpha-easing': config.enter.alpha.easing,
    '--uit-page-transition-enter-alpha-from': `${config.enter.alpha.from}`,
    '--uit-page-transition-enter-alpha-raster-from':
      getRasterWarmAlpha(config.enter.alpha.from),
    '--uit-page-transition-enter-alpha-to': `${config.enter.alpha.to}`,
    '--uit-page-transition-enter-scale-delay':
      toScaledCssDuration(config.enter.scale.delayMs ?? 0, timingScale),
    '--uit-page-transition-enter-scale-duration':
      toScaledCssDuration(config.enter.scale.durationMs, timingScale),
    '--uit-page-transition-enter-scale-easing': config.enter.scale.easing,
    '--uit-page-transition-enter-scale-from': `${config.enter.scale.from}`,
    '--uit-page-transition-enter-scale-to': `${config.enter.scale.to}`,
    '--uit-page-transition-enter-translate-delay':
      toScaledCssDuration(config.enter.translateX.delayMs ?? 0, timingScale),
    '--uit-page-transition-enter-translate-duration':
      toScaledCssDuration(config.enter.translateX.durationMs, timingScale),
    '--uit-page-transition-enter-translate-easing':
      config.enter.translateX.easing,
    '--uit-page-transition-enter-translate-from':
      `${config.enter.translateX.from}px`,
    '--uit-page-transition-enter-translate-to':
      `${config.enter.translateX.to}px`,
    '--uit-page-transition-exit-alpha-delay':
      toScaledCssDuration(config.exit.alpha.delayMs ?? 0, timingScale),
    '--uit-page-transition-exit-alpha-duration':
      toScaledCssDuration(config.exit.alpha.durationMs, timingScale),
    '--uit-page-transition-exit-alpha-easing': config.exit.alpha.easing,
    '--uit-page-transition-exit-alpha-from': `${config.exit.alpha.from}`,
    '--uit-page-transition-exit-alpha-to': `${config.exit.alpha.to}`,
    '--uit-page-transition-exit-scale-delay':
      toScaledCssDuration(config.exit.scale.delayMs ?? 0, timingScale),
    '--uit-page-transition-exit-scale-duration':
      toScaledCssDuration(config.exit.scale.durationMs, timingScale),
    '--uit-page-transition-exit-scale-easing': config.exit.scale.easing,
    '--uit-page-transition-exit-scale-from': `${config.exit.scale.from}`,
    '--uit-page-transition-exit-scale-to': `${config.exit.scale.to}`,
    '--uit-page-transition-exit-translate-delay':
      toScaledCssDuration(config.exit.translateX.delayMs ?? 0, timingScale),
    '--uit-page-transition-exit-translate-duration':
      toScaledCssDuration(config.exit.translateX.durationMs, timingScale),
    '--uit-page-transition-exit-translate-easing':
      config.exit.translateX.easing,
    '--uit-page-transition-exit-translate-from':
      `${config.exit.translateX.from}px`,
    '--uit-page-transition-exit-translate-to':
      `${config.exit.translateX.to}px`,
  } as CSSProperties;
}

function isElementDisabled(element: HTMLElement): boolean {
  return (
    element.hasAttribute('disabled') ||
    element.getAttribute('aria-disabled') === 'true'
  );
}

function isElementFocusable(element: HTMLElement): boolean {
  if (isElementDisabled(element) || element.closest('[aria-hidden="true"]')) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.pointerEvents === 'none'
  ) {
    return false;
  }

  return element.tabIndex >= 0;
}

function isElementInitialFocusable(element: HTMLElement): boolean {
  return isElementFocusable(element) && isInitialFocusEligibleElement(element);
}

function getFocusableElements(pageElement: HTMLElement): HTMLElement[] {
  return Array.from(
    pageElement.querySelectorAll<HTMLElement>(FOCUS_CANDIDATE_SELECTOR),
  ).filter(isElementFocusable);
}

function getInitialFocusableElements(pageElement: HTMLElement): HTMLElement[] {
  return Array.from(
    pageElement.querySelectorAll<HTMLElement>(FOCUS_CANDIDATE_SELECTOR),
  ).filter(isElementInitialFocusable);
}

function compareFocusablePosition(a: HTMLElement, b: HTMLElement): number {
  const aRect = a.getBoundingClientRect();
  const bRect = b.getBoundingClientRect();
  const topDelta = aRect.top - bRect.top;
  if (Math.abs(topDelta) > 1) {
    return topDelta;
  }

  const leftDelta = aRect.left - bRect.left;
  if (Math.abs(leftDelta) > 1) {
    return leftDelta;
  }

  return 0;
}

function getTopLeftFocusableElement(
  pageElement: HTMLElement,
): HTMLElement | null {
  const focusableElements = getInitialFocusableElements(pageElement);
  if (focusableElements.length === 0) {
    return null;
  }

  return [...focusableElements].sort(compareFocusablePosition)[0] ?? null;
}

function getFocusCandidateFromEventTarget(
  target: EventTarget | null,
): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const candidate = target.closest(FOCUS_CANDIDATE_SELECTOR);
  return candidate instanceof HTMLElement && isElementFocusable(candidate)
    ? candidate
    : null;
}

function resolveInitialFocusElement(
  pageElement: HTMLElement,
  initialFocus: PageTransitionInitialFocus,
): HTMLElement | null {
  if (initialFocus === 'none') {
    return null;
  }

  if (initialFocus === 'top-left') {
    return getTopLeftFocusableElement(pageElement);
  }

  if (typeof initialFocus === 'function') {
    const resolvedElement = initialFocus(pageElement);
    return resolvedElement != null && isElementInitialFocusable(resolvedElement)
      ? resolvedElement
      : null;
  }

  const selectedElement = pageElement.querySelector(initialFocus.selector);
  return selectedElement instanceof HTMLElement &&
    isElementInitialFocusable(selectedElement)
    ? selectedElement
    : null;
}

function isScrollableElement(element: HTMLElement): boolean {
  return (
    element.scrollHeight > element.clientHeight + 1 ||
    element.scrollWidth > element.clientWidth + 1 ||
    element.scrollTop !== 0 ||
    element.scrollLeft !== 0
  );
}

function getScrollableElements(pageElement: HTMLElement): HTMLElement[] {
  return [
    pageElement,
    ...Array.from(pageElement.querySelectorAll<HTMLElement>('*')),
  ].filter(isScrollableElement);
}

function setInstantScrollPosition(
  element: HTMLElement,
  scroll: PageTransitionScrollSnapshot,
): void {
  const previousScrollBehavior = element.style.scrollBehavior;
  element.style.scrollBehavior = 'auto';
  element.scrollLeft = scroll.left;
  element.scrollTop = scroll.top;
  element.getBoundingClientRect();

  if (previousScrollBehavior === '') {
    element.style.removeProperty('scroll-behavior');
  } else {
    element.style.scrollBehavior = previousScrollBehavior;
  }
}

function getElementPath(
  pageElement: HTMLElement,
  element: HTMLElement,
): number[] {
  const path: number[] = [];
  let current: HTMLElement | null = element;
  while (current != null && current !== pageElement) {
    const parent: HTMLElement | null = current.parentElement;
    if (parent == null) {
      return [];
    }
    path.unshift(Array.prototype.indexOf.call(parent.children, current));
    current = parent;
  }
  return current === pageElement ? path : [];
}

function resolveElementPath(
  pageElement: HTMLElement,
  path: number[],
): HTMLElement | null {
  let current: Element = pageElement;
  for (const childIndex of path) {
    const child = current.children.item(childIndex);
    if (!(child instanceof HTMLElement)) {
      return null;
    }
    current = child;
  }
  return current instanceof HTMLElement ? current : null;
}

function applyScrollSnapshot(
  pageElement: HTMLElement,
  snapshot: PageTransitionStateSnapshot | undefined,
): void {
  snapshot?.scroll.forEach(scroll => {
    const element = resolveElementPath(pageElement, scroll.path);
    if (element == null) {
      return;
    }

    setInstantScrollPosition(element, scroll);
    element.dispatchEvent(new Event('scroll'));
  });
}

function syncFocusOwnerForRestoredFocus(element: HTMLElement): boolean {
  const forceSyncEvent = new Event(FORCE_FOCUS_SYNC_EVENT, {
    cancelable: true,
  });
  if (!element.dispatchEvent(forceSyncEvent)) {
    return true;
  }

  const owner = getFocusOwner(element);
  if (owner == null) {
    return false;
  }

  claimFocusedInteractable(owner);
  owner.applyFocus(true);
  return true;
}

function isFocusWithinElement(element: HTMLElement): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  const activeElement = document.activeElement;
  return (
    activeElement === element ||
    (typeof Node !== 'undefined' &&
      activeElement instanceof Node &&
      element.contains(activeElement))
  );
}

function focusRestoredElement(element: HTMLElement): boolean {
  if (isFocusWithinElement(element)) {
    return true;
  }
  element.focus({ preventScroll: true });
  return isFocusWithinElement(element);
}

function isDocumentFocusEffectivelyEmpty(): boolean {
  if (typeof document === 'undefined') {
    return true;
  }

  const activeElement = document.activeElement;
  if (
    activeElement == null ||
    activeElement === document.body ||
    activeElement === document.documentElement
  ) {
    return true;
  }

  if (typeof HTMLElement === 'undefined' || !(activeElement instanceof HTMLElement)) {
    return false;
  }

  return !isElementFocusable(activeElement);
}

function capturePageTransitionState(
  pageElement: HTMLElement,
  fallbackFocusedElement: HTMLElement | null = null,
): PageTransitionStateSnapshot {
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const focusedElement =
    fallbackFocusedElement != null &&
          fallbackFocusedElement.isConnected &&
          pageElement.contains(fallbackFocusedElement)
        ? fallbackFocusedElement
        : activeElement != null && pageElement.contains(activeElement)
          ? activeElement
          : null;
  const focusableElements = getFocusableElements(pageElement);
  const focusedIndex = focusedElement == null
    ? -1
    : focusableElements.indexOf(focusedElement);
  return {
    focusedIndex: focusedIndex >= 0 ? focusedIndex : null,
    scroll: getScrollableElements(pageElement).map(element => ({
      left: element.scrollLeft,
      path: getElementPath(pageElement, element),
      top: element.scrollTop,
    })),
  };
}

function restorePageTransitionState(
  pageElement: HTMLElement,
  snapshot: PageTransitionStateSnapshot | undefined,
  initialFocus: PageTransitionInitialFocus,
): boolean {
  const focusableElements = getFocusableElements(pageElement);
  const restoredFocusedElement =
    snapshot?.focusedIndex == null
      ? null
      : focusableElements[snapshot.focusedIndex] ?? null;
  const focusTarget =
    restoredFocusedElement ??
    (snapshot == null ? resolveInitialFocusElement(pageElement, initialFocus) : null);

  runWithFocusSafeAreaScrollSuppressed(() => {
    applyScrollSnapshot(pageElement, snapshot);
    if (focusTarget != null && !isFocusWithinElement(focusTarget)) {
      focusTarget.focus({ preventScroll: true });
    }
    applyScrollSnapshot(pageElement, snapshot);
  });

  if (focusTarget == null) {
    return false;
  }

  // Track whether the first blur/focus cycle has already run. The cycle
  // produces the correct material glow (DEFAULT->FOCUSED transition) so
  // we must let it execute once. Subsequent retries (rAF, setTimeout)
  // would repeat the blur/focus and cause visible flicker without adding
  // any visual benefit — once the first call succeeds, the element
  // already has full focus + material state.
  let focusSyncCompleted = false;

  const syncRestoredFocus = () => {
    if (typeof document === 'undefined' || !focusTarget.isConnected) {
      return;
    }

    if (
      focusSyncCompleted &&
      (isFocusWithinElement(focusTarget) || !isDocumentFocusEffectivelyEmpty())
    ) {
      return;
    }

    runWithFocusSafeAreaScrollSuppressed(() => {
      if (!isFocusWithinElement(focusTarget)) {
        syncFocusOwnerForRestoredFocus(focusTarget);
      }
      const focusLanded = focusRestoredElement(focusTarget);
      if (focusLanded) {
        focusSyncCompleted = syncFocusOwnerForRestoredFocus(focusTarget);
      }
      applyScrollSnapshot(pageElement, snapshot);
    });
  };

  syncRestoredFocus();
  window.requestAnimationFrame(syncRestoredFocus);
  window.setTimeout(syncRestoredFocus, 0);
  window.setTimeout(syncRestoredFocus, 75);
  window.setTimeout(syncRestoredFocus, 150);
  window.setTimeout(syncRestoredFocus, 300);
  window.setTimeout(syncRestoredFocus, 550);
  return true;
}

function restorePageTransitionScrollState(
  pageElement: HTMLElement,
  snapshot: PageTransitionStateSnapshot | undefined,
): void {
  applyScrollSnapshot(pageElement, snapshot);
}

function waitForImageReady(image: HTMLImageElement): Promise<void> {
  if (image.complete) {
    return image.decode?.().catch(() => undefined) ?? Promise.resolve();
  }

  return new Promise(resolve => {
    const cleanup = () => {
      image.removeEventListener('load', handleSettled);
      image.removeEventListener('error', handleSettled);
    };
    const handleSettled = () => {
      cleanup();
      const decodePromise = image.decode?.().catch(() => undefined);
      if (decodePromise != null) {
        decodePromise.then(() => resolve());
        return;
      }

      resolve();
    };

    image.addEventListener('load', handleSettled, { once: true });
    image.addEventListener('error', handleSettled, { once: true });
  });
}

function waitForPageTransitionContentReady(
  pageElement: HTMLElement | undefined,
): Promise<void> {
  if (pageElement == null) {
    return Promise.resolve();
  }

  const images = Array.from(pageElement.querySelectorAll('img'));
  if (images.length === 0) {
    return Promise.resolve();
  }

  let timeout = 0;
  return Promise.race([
    Promise.all(images.map(waitForImageReady)).then(() => undefined),
    new Promise<void>(resolve => {
      timeout = window.setTimeout(
        resolve,
        PAGE_TRANSITION_CONTENT_READY_TIMEOUT_MS,
      );
    }),
  ]).finally(() => {
    // Image settlement can win this race after the host document is gone, so
    // the fallback timer is only clearable while its owning window exists.
    if (typeof window !== 'undefined') {
      window.clearTimeout(timeout);
    }
  });
}

function createEntry(
  transitionKey: string,
  children: ReactNode,
  phase: PageTransitionEntry['phase'],
  id: number,
): PageTransitionEntry {
  return {
    children,
    id,
    phase,
    transitionKey,
  };
}

function retainOnlyEntryId(entryIds: Set<number>, id: number): void {
  const shouldRetain = entryIds.has(id);
  entryIds.clear();
  if (shouldRetain) {
    entryIds.add(id);
  }
}

/**
 * Keyed page transition host for routing libraries.
 *
 * The default config applies the Meta Ray-Ban Display fragment navigation
 * motion for in-app route changes. The app-switch transition is exported
 * separately for surfaces that need cross-app motion instead. The component is
 * intentionally router-agnostic; React Router should pass `location.pathname`
 * or `location.key` as `transitionKey` and render its route outlet as children.
 */
export const PageTransition = memo(function PageTransition({
  children,
  className = '',
  config = DefaultPageTransitionConfig,
  direction = 'forward',
  disabled = false,
  initialFocus = 'top-left',
  pageClassName = '',
  preservePageState = true,
  style,
  timingScale = 'auto',
  transitionKey,
  onTransitionEnd,
  onBlurCapture,
  onFocusCapture,
  onMouseDownCapture,
  onPointerDownCapture,
  ...htmlProps
}: PageTransitionProps) {
  const nextIdRef = useRef(1);
  const pageElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const lastFocusedCandidatePathsRef = useRef<Map<string, number[]>>(new Map());
  const pendingInteractionCandidatePathsRef = useRef<Map<string, number[]>>(
    new Map(),
  );
  const pageStateSnapshotsRef = useRef<Map<string, PageTransitionStateSnapshot>>(
    new Map(),
  );
  const restoredScrollEntryIdsRef = useRef<Set<number>>(new Set());
  const restoredFocusEntryIdsRef = useRef<Set<number>>(new Set());
  const entriesRef = useRef<PageTransitionEntry[]>([
    createEntry(transitionKey, children, 'idle', 0),
  ]);
  const [entries, setEntries] = useState<PageTransitionEntry[]>(
    entriesRef.current,
  );
  // Which rendered page entry currently contains DOM focus, tracked
  // reactively so render never reads `document.activeElement` or refs.
  const [focusedEntryId, setFocusedEntryId] = useState<number | null>(null);
  // Latest children, read by the transition effect without listing `children` as
  // a dependency. See the transition effect and the children-sync effect below.
  const childrenRef = useRef(children);
  childrenRef.current = children;
  const activeMotion = getDirectionalMotion(config, direction);
  const resolvedTimingScale = getResolvedPageTransitionTimingScale(timingScale);
  const transitionPresentationRef = useRef<{
    durationMs: number;
    style: CSSProperties;
    transitionKey: string;
  } | null>(null);
  if (transitionPresentationRef.current?.transitionKey !== transitionKey) {
    transitionPresentationRef.current = {
      durationMs: Math.round(activeMotion.totalDurationMs * resolvedTimingScale),
      style: getTransitionStyle(activeMotion, resolvedTimingScale),
      transitionKey,
    };
  }
  const activeTransitionDurationMs = transitionPresentationRef.current.durationMs;
  const transitionOptionsRef = useRef({
    activeTransitionDurationMs,
    disabled,
    onTransitionEnd,
    preservePageState,
  });
  transitionOptionsRef.current = {
    activeTransitionDurationMs,
    disabled,
    onTransitionEnd,
    preservePageState,
  };
  const transitionStyle = transitionPresentationRef.current.style;
  const viewportStyle = useMemo(
    () => ({
      ...transitionStyle,
      ...style,
    }),
    [style, transitionStyle],
  );
  const setPageElement = useCallback((
    id: number,
    element: HTMLDivElement | null,
  ) => {
    if (element == null) {
      pageElementsRef.current.delete(id);
      return;
    }

    pageElementsRef.current.set(id, element);
  }, []);
  const rememberPendingInteractionCandidate = useCallback(
    (target: EventTarget | null) => {
      const activeEntry = entriesRef.current[entriesRef.current.length - 1];
      if (activeEntry == null) {
        return;
      }

      const pageElement = pageElementsRef.current.get(activeEntry.id);
      const focusCandidate = getFocusCandidateFromEventTarget(target);
      if (
        pageElement == null ||
        focusCandidate == null ||
        !pageElement.contains(focusCandidate)
      ) {
        return;
      }

      pendingInteractionCandidatePathsRef.current.set(
        activeEntry.transitionKey,
        getElementPath(pageElement, focusCandidate),
      );
    },
    [],
  );
  const rememberFocusedCandidate = useCallback((target: EventTarget | null) => {
    const activeEntry = entriesRef.current[entriesRef.current.length - 1];
    if (activeEntry == null) {
      return;
    }

    const pageElement = pageElementsRef.current.get(activeEntry.id);
    const focusCandidate = getFocusCandidateFromEventTarget(target);
    if (
      pageElement == null ||
      focusCandidate == null ||
      !pageElement.contains(focusCandidate)
    ) {
      return;
    }

    lastFocusedCandidatePathsRef.current.set(
      activeEntry.transitionKey,
      getElementPath(pageElement, focusCandidate),
    );
  }, []);
  const clearPendingInteractionCandidate = useCallback(
    (target: EventTarget | null) => {
      const activeEntry = entriesRef.current[entriesRef.current.length - 1];
      if (activeEntry == null) {
        return;
      }

      const pageElement = pageElementsRef.current.get(activeEntry.id);
      if (
        pageElement != null &&
        target instanceof Element &&
        pageElement.contains(target)
      ) {
        pendingInteractionCandidatePathsRef.current.delete(
          activeEntry.transitionKey,
        );
      }
    },
    [],
  );
  const getEntryIdContaining = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Node)) {
      return null;
    }
    for (const [id, pageElement] of pageElementsRef.current) {
      if (pageElement.contains(target)) {
        return id;
      }
    }
    return null;
  }, []);
  const handleFocusCapture = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      rememberFocusedCandidate(event.target);
      clearPendingInteractionCandidate(event.target);
      const focusedId = getEntryIdContaining(event.target);
      if (focusedId != null) {
        setFocusedEntryId(focusedId);
      }
      onFocusCapture?.(event);
    },
    [
      clearPendingInteractionCandidate,
      getEntryIdContaining,
      onFocusCapture,
      rememberFocusedCandidate,
    ],
  );
  const handleBlurCapture = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      // Focus moving within the same page re-fires focus capture, which
      // re-asserts the entry. Only clear when focus leaves every rendered
      // page (e.g. to body) so the outgoing page regains aria-hidden.
      const nextId = getEntryIdContaining(event.relatedTarget);
      if (nextId == null) {
        setFocusedEntryId(null);
      }
      onBlurCapture?.(event);
    },
    [getEntryIdContaining, onBlurCapture],
  );
  const handleMouseDownCapture = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      rememberPendingInteractionCandidate(event.target);
      onMouseDownCapture?.(event);
    },
    [onMouseDownCapture, rememberPendingInteractionCandidate],
  );
  const handlePointerDownCapture = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      rememberPendingInteractionCandidate(event.target);
      onPointerDownCapture?.(event);
    },
    [onPointerDownCapture, rememberPendingInteractionCandidate],
  );

  useLayoutEffect(() => {
    if (!preservePageState) {
      return;
    }

    const activeEntry = entries[entries.length - 1];
    if (
      activeEntry == null ||
      restoredScrollEntryIdsRef.current.has(activeEntry.id)
    ) {
      return;
    }

    const pageElement = pageElementsRef.current.get(activeEntry.id);
    if (pageElement == null) {
      return;
    }

    restoredScrollEntryIdsRef.current.add(activeEntry.id);
    restorePageTransitionScrollState(
      pageElement,
      pageStateSnapshotsRef.current.get(activeEntry.transitionKey),
    );
  }, [entries, preservePageState]);

  useLayoutEffect(() => {
    if (!preservePageState) {
      return;
    }

    const activeEntry = entries[entries.length - 1];
    if (
      activeEntry == null ||
      restoredFocusEntryIdsRef.current.has(activeEntry.id)
    ) {
      return;
    }

    const pageElement = pageElementsRef.current.get(activeEntry.id);
    if (pageElement == null) {
      return;
    }

    const focusRestored = restorePageTransitionState(
      pageElement,
      pageStateSnapshotsRef.current.get(activeEntry.transitionKey),
      initialFocus,
    );

    // Only mark focus as restored if a target was actually focused. When the
    // page uses Suspense with lazy-loaded content, the first attempt may find
    // no focusable elements (fallback renders null). By not marking it, we
    // re-attempt on the next render once the lazy content mounts.
    if (focusRestored) {
      restoredFocusEntryIdsRef.current.add(activeEntry.id);
    }
  }, [entries, initialFocus, preservePageState]);

  useEffect(() => {
    const transitionOptions = transitionOptionsRef.current;
    const currentEntries = entriesRef.current;
    const activeEntry = currentEntries[currentEntries.length - 1];

    // Same key → no transition is needed. `children` is intentionally NOT a
    // dependency of this effect: if it were, a per-render children change that
    // lands during the preparing phase would re-run this effect, whose cleanup
    // cancels the scheduled animation frames; the re-run then sees the freshly
    // created entry already carrying `transitionKey` and returns here WITHOUT
    // rescheduling — freezing the pages in `preparingEnter`/`preparingExit`
    // forever. Children updates are propagated by the children-sync effect below.
    if (activeEntry?.transitionKey === transitionKey) {
      return;
    }

    const shouldAnimate = !transitionOptions.disabled && activeEntry != null;
    const nextEntry = createEntry(
      transitionKey,
      childrenRef.current,
      shouldAnimate ? 'preparingEnter' : 'idle',
      nextIdRef.current,
    );
    nextIdRef.current += 1;

    if (transitionOptions.preservePageState && activeEntry != null) {
      const activePageElement = pageElementsRef.current.get(activeEntry.id);
      if (activePageElement != null) {
        const activeTransitionKey = activeEntry.transitionKey;
        const activeElement =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const activeElementIsFocusableInPage =
          activeElement != null &&
          activePageElement.contains(activeElement) &&
          isElementFocusable(activeElement);
        const fallbackFocusedPath =
          pendingInteractionCandidatePathsRef.current.get(activeTransitionKey) ??
          (activeElementIsFocusableInPage
            ? null
            : lastFocusedCandidatePathsRef.current.get(activeTransitionKey) ?? null);
        const fallbackFocusedElement = fallbackFocusedPath == null
          ? null
          : resolveElementPath(activePageElement, fallbackFocusedPath);
        pageStateSnapshotsRef.current.set(
          activeTransitionKey,
          capturePageTransitionState(
            activePageElement,
            fallbackFocusedElement,
          ),
        );
      }
    }

    if (activeEntry != null) {
      pendingInteractionCandidatePathsRef.current.delete(activeEntry.transitionKey);
      lastFocusedCandidatePathsRef.current.delete(activeEntry.transitionKey);
    }
    restoredScrollEntryIdsRef.current.clear();
    restoredFocusEntryIdsRef.current.clear();

    if (!shouldAnimate) {
      entriesRef.current = [nextEntry];
      setEntries([nextEntry]);
      transitionOptions.onTransitionEnd?.();
      return;
    }

    const nextEntries = [
      {
        ...activeEntry,
        phase: 'preparingExit' as const,
      },
      nextEntry,
    ];
    entriesRef.current = nextEntries;
    setEntries(nextEntries);

    let firstAnimationFrame = 0;
    let secondAnimationFrame = 0;
    let timeout = 0;
    let cancelled = false;
    const settleTransition = () => {
      // Read the latest entry (its children may have been updated mid-transition
      // by the children-sync effect) rather than the stale `nextEntry` closure.
      const latestEntry =
        entriesRef.current.find(entry => entry.id === nextEntry.id) ?? nextEntry;
      const settledEntry = {
        ...latestEntry,
        phase: 'idle' as const,
      };
      retainOnlyEntryId(restoredScrollEntryIdsRef.current, nextEntry.id);
      retainOnlyEntryId(restoredFocusEntryIdsRef.current, nextEntry.id);
      entriesRef.current = [settledEntry];
      setEntries([settledEntry]);
      transitionOptions.onTransitionEnd?.();
    };
    const startEnterAnimation = () => {
      const currentEntries = entriesRef.current;
      if (!currentEntries.some(entry => entry.id === nextEntry.id)) {
        return;
      }

      const enteringEntries = currentEntries.map(entry => (
        entry.id === nextEntry.id
          ? {
              ...entry,
              phase: 'entering' as const,
            }
          : entry.id === activeEntry.id
            ? {
                ...entry,
                phase: 'exiting' as const,
              }
          : entry
      ));
      entriesRef.current = enteringEntries;
      setEntries(enteringEntries);
      timeout = window.setTimeout(
        settleTransition,
        transitionOptions.activeTransitionDurationMs,
      );
    };

    firstAnimationFrame = window.requestAnimationFrame(() => {
      waitForPageTransitionContentReady(
        pageElementsRef.current.get(nextEntry.id),
      ).then(() => {
        if (cancelled) {
          return;
        }

        secondAnimationFrame = window.requestAnimationFrame(
          startEnterAnimation,
        );
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstAnimationFrame);
      window.cancelAnimationFrame(secondAnimationFrame);
      window.clearTimeout(timeout);
    };
  }, [transitionKey]);

  // Propagate per-render children updates to the on-screen page WITHOUT
  // disturbing an in-flight transition. Because the transition effect above
  // omits `children` from its deps, this is the only path that refreshes page
  // content after mount. Only the entry matching the current `transitionKey`
  // (the entering/idle page) is updated; an exiting page keeps its snapshot.
  useEffect(() => {
    const currentEntries = entriesRef.current;
    let changed = false;
    const nextEntries = currentEntries.map(entry => {
      if (entry.transitionKey === transitionKey && entry.children !== children) {
        changed = true;
        return { ...entry, children };
      }
      return entry;
    });
    if (changed) {
      entriesRef.current = nextEntries;
      setEntries(nextEntries);
    }
  }, [children, transitionKey]);

  // Inactive pages are always inert. Defer aria-hidden only while one still
  // contains DOM focus, because Chromium rejects hiding the focused subtree.
  // `focusedEntryId` is tracked reactively via focus/blur capture above.

  return (
    <div
      {...htmlProps}
      className={`${styles.viewport} ${className}`}
      style={viewportStyle}
      data-page-transition-active={entries.length > 1 ? 'true' : 'false'}
      data-page-transition-direction={direction}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onMouseDownCapture={handleMouseDownCapture}
      onPointerDownCapture={handlePointerDownCapture}
    >
      {entries.map((entry, index) => (
        <div
          key={`${entry.transitionKey}:${entry.id}`}
          ref={(element) => setPageElement(entry.id, element)}
          className={`${styles.page} ${styles[entry.phase]} ${pageClassName}`}
          data-page-transition-key={entry.transitionKey}
          data-page-transition-phase={entry.phase}
          aria-hidden={
            index !== entries.length - 1 && entry.id !== focusedEntryId
          }
          inert={index !== entries.length - 1}
        >
          <div className={styles.pageContent}>
            {entry.children}
          </div>
        </div>
      ))}
    </div>
  );
});
