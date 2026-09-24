/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type FocusEvent,
  type FocusEventHandler,
  type HTMLAttributes,
  type PointerEvent,
  type PointerEventHandler,
  type ReactNode,
  type RefObject,
} from 'react';
import { AnimationDurations } from '../motion/Animations';

export type RoutePreloadHandler = (preloadKey: string) => Promise<unknown> | unknown;
export type RoutePreloadRequest = (preloadKey: string) => boolean;

export interface RoutePreloadProviderProps {
  children?: ReactNode;
  preloadRoute?: RoutePreloadHandler;
}

export interface RoutePreloadTargetProps extends HTMLAttributes<HTMLDivElement> {
  preloadKey?: string | null;
  preloadOnFocus?: boolean;
  preloadOnPointerEnter?: boolean;
  preloadOnVisible?: boolean;
  root?: Element | null;
  rootMargin?: string;
  threshold?: IntersectionObserverInit['threshold'];
}

export interface UseRoutePreloadTargetOptions<T extends HTMLElement> {
  onFocusCapture?: FocusEventHandler<T>;
  onPointerEnter?: PointerEventHandler<T>;
  preloadKey?: string | null;
  preloadOnFocus?: boolean;
  preloadOnPointerEnter?: boolean;
  preloadOnVisible?: boolean;
  root?: Element | null;
  rootMargin?: string;
  threshold?: IntersectionObserverInit['threshold'];
}

export interface RoutePreloadTargetBindings<T extends HTMLElement> {
  'data-route-preload-key': string | undefined;
  onFocusCapture: FocusEventHandler<T> | undefined;
  onPointerEnter: PointerEventHandler<T> | undefined;
  ref: RefObject<T | null>;
}

interface RoutePreloadContextValue {
  enabled: boolean;
  preload: RoutePreloadRequest;
}

const DISABLED_ROUTE_PRELOAD_CONTEXT: RoutePreloadContextValue = {
  enabled: false,
  preload: () => false,
};
const RoutePreloadContext = createContext<RoutePreloadContextValue>(
  DISABLED_ROUTE_PRELOAD_CONTEXT,
);
const ROUTE_PRELOAD_IDLE_TIMEOUT_MS = 1000;
const ROUTE_PRELOAD_IDLE_FALLBACK_MS = 32;
const ROUTE_PRELOAD_INPUT_SETTLE_MS =
  AnimationDurations.CONTAINER_STATE_CHANGE + 80;

type IdleCallbackHandle = number;
type IdleCallbackRequest = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions,
) => IdleCallbackHandle;
type IdleCallbackCancel = (handle: IdleCallbackHandle) => void;

const NOOP = () => {};

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function isDirectionalNavigationKey(key: string): boolean {
  return (
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight'
  );
}

function requestPreloadIdleCallback(callback: () => void): IdleCallbackHandle {
  const win = window as Window & {
    requestIdleCallback?: IdleCallbackRequest;
  };

  if (typeof win.requestIdleCallback === 'function') {
    return win.requestIdleCallback(
      () => callback(),
      { timeout: ROUTE_PRELOAD_IDLE_TIMEOUT_MS },
    );
  }

  return window.setTimeout(callback, ROUTE_PRELOAD_IDLE_FALLBACK_MS);
}

function cancelPreloadIdleCallback(handle: IdleCallbackHandle): void {
  const win = window as Window & {
    cancelIdleCallback?: IdleCallbackCancel;
  };

  if (typeof win.cancelIdleCallback === 'function') {
    win.cancelIdleCallback(handle);
    return;
  }

  window.clearTimeout(handle);
}

function getNearestScrollRoot(element: HTMLElement): Element | null {
  return element.closest('[data-scroll-view="true"]');
}

function rectsIntersect(a: DOMRect, b: DOMRect): boolean {
  return (
    a.bottom > b.top &&
    a.top < b.bottom &&
    a.right > b.left &&
    a.left < b.right
  );
}

function isElementVisibleWithinRoot(
  element: HTMLElement,
  root: Element | null,
): boolean {
  const elementRect = element.getBoundingClientRect();
  const rootRect = root?.getBoundingClientRect() ?? new DOMRect(
    0,
    0,
    window.innerWidth,
    window.innerHeight,
  );
  return rectsIntersect(elementRect, rootRect);
}

type VisibilityListener = () => void;

interface SharedIntersectionObserverEntry {
  observer: IntersectionObserver;
  listeners: Map<Element, Set<VisibilityListener>>;
}

const viewportIntersectionObservers = new Map<
  string,
  SharedIntersectionObserverEntry
>();
const rootedIntersectionObservers = new WeakMap<
  Element,
  Map<string, SharedIntersectionObserverEntry>
>();

function getThresholdKey(
  threshold: IntersectionObserverInit['threshold'],
): string {
  return Array.isArray(threshold)
    ? threshold.join(',')
    : `${threshold ?? 0}`;
}

function getThresholdFromKey(
  key: string,
): IntersectionObserverInit['threshold'] {
  if (key === '') {
    return [];
  }
  const values = key.split(',').map(Number);
  return values.length === 1 ? (values[0] ?? 0) : values;
}

function observeIntersection(
  element: HTMLElement,
  root: Element | null,
  rootMargin: string,
  threshold: IntersectionObserverInit['threshold'],
  listener: VisibilityListener,
): () => void {
  let registry = viewportIntersectionObservers;
  if (root != null) {
    let rootedRegistry = rootedIntersectionObservers.get(root);
    if (rootedRegistry == null) {
      rootedRegistry = new Map();
      rootedIntersectionObservers.set(root, rootedRegistry);
    }
    registry = rootedRegistry;
  }
  const key = `${rootMargin}|${getThresholdKey(threshold)}`;
  let shared = registry.get(key);
  if (shared == null) {
    const listeners = new Map<Element, Set<VisibilityListener>>();
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const targetListeners = listeners.get(entry.target);
          if (targetListeners == null) {
            continue;
          }
          for (const targetListener of targetListeners) {
            targetListener();
          }
        }
      },
      { root, rootMargin, threshold },
    );
    shared = { observer, listeners };
    registry.set(key, shared);
  }

  const sharedEntry = shared;
  let targetListeners = sharedEntry.listeners.get(element);
  if (targetListeners == null) {
    targetListeners = new Set();
    sharedEntry.listeners.set(element, targetListeners);
  }
  targetListeners.add(listener);
  if (targetListeners.size === 1) {
    sharedEntry.observer.observe(element);
  }

  let active = true;
  return () => {
    if (!active) {
      return;
    }
    active = false;

    const currentListeners = sharedEntry.listeners.get(element);
    currentListeners?.delete(listener);
    if (currentListeners?.size === 0) {
      sharedEntry.listeners.delete(element);
      sharedEntry.observer.unobserve(element);
    }
    if (sharedEntry.listeners.size === 0) {
      sharedEntry.observer.disconnect();
      registry.delete(key);
      if (root != null && registry.size === 0) {
        rootedIntersectionObservers.delete(root);
      }
    }
  };
}

interface FallbackVisibilityTarget {
  element: HTMLElement;
  listener: VisibilityListener;
  root: Element | null;
}

const fallbackVisibilityTargets = new Set<FallbackVisibilityTarget>();
let fallbackVisibilityFrame = 0;

function checkFallbackVisibilityTargets(): void {
  fallbackVisibilityFrame = 0;
  for (const target of fallbackVisibilityTargets) {
    if (isElementVisibleWithinRoot(target.element, target.root)) {
      target.listener();
    }
  }
}

function scheduleFallbackVisibilityCheck(): void {
  if (fallbackVisibilityFrame !== 0) {
    return;
  }
  fallbackVisibilityFrame = window.requestAnimationFrame(
    checkFallbackVisibilityTargets,
  );
}

function attachFallbackVisibilityListeners(): void {
  if (fallbackVisibilityTargets.size !== 1) {
    return;
  }
  document.addEventListener('scroll', scheduleFallbackVisibilityCheck, true);
  window.addEventListener('resize', scheduleFallbackVisibilityCheck);
}

function detachFallbackVisibilityListeners(): void {
  if (fallbackVisibilityTargets.size !== 0) {
    return;
  }
  document.removeEventListener('scroll', scheduleFallbackVisibilityCheck, true);
  window.removeEventListener('resize', scheduleFallbackVisibilityCheck);
  if (fallbackVisibilityFrame !== 0) {
    window.cancelAnimationFrame(fallbackVisibilityFrame);
    fallbackVisibilityFrame = 0;
  }
}

function observeFallbackVisibility(
  element: HTMLElement,
  root: Element | null,
  listener: VisibilityListener,
): () => void {
  const target = { element, listener, root };
  fallbackVisibilityTargets.add(target);
  attachFallbackVisibilityListeners();

  let active = true;
  return () => {
    if (!active) {
      return;
    }
    active = false;
    fallbackVisibilityTargets.delete(target);
    detachFallbackVisibilityListeners();
  };
}

export function RoutePreloadProvider({
  children,
  preloadRoute,
}: RoutePreloadProviderProps) {
  const preloadedKeysRef = useRef<Set<string>>(new Set());
  const preloadQueueRef = useRef<string[]>([]);
  const queuedKeysRef = useRef<Set<string>>(new Set());
  const drainTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const idleCallbackRef = useRef<IdleCallbackHandle | null>(null);
  const isDrainingRef = useRef(false);
  const lastDirectionalInputAtRef = useRef(now());
  const drainQueueRef = useRef<() => void>(NOOP);

  const clearScheduledDrain = useCallback(() => {
    if (drainTimerRef.current != null) {
      window.clearTimeout(drainTimerRef.current);
      drainTimerRef.current = null;
    }
    if (idleCallbackRef.current != null) {
      cancelPreloadIdleCallback(idleCallbackRef.current);
      idleCallbackRef.current = null;
    }
  }, []);

  const scheduleDrain = useCallback((delayMs: number = 0) => {
    if (drainTimerRef.current != null || idleCallbackRef.current != null) {
      return;
    }

    drainTimerRef.current = window.setTimeout(() => {
      drainTimerRef.current = null;
      idleCallbackRef.current = requestPreloadIdleCallback(() => {
        idleCallbackRef.current = null;
        drainQueueRef.current();
      });
    }, Math.max(0, delayMs));
  }, []);

  const drainQueue = useCallback(() => {
    if (isDrainingRef.current) {
      return;
    }

    const timeSinceDirectionalInput = now() - lastDirectionalInputAtRef.current;
    if (timeSinceDirectionalInput < ROUTE_PRELOAD_INPUT_SETTLE_MS) {
      scheduleDrain(ROUTE_PRELOAD_INPUT_SETTLE_MS - timeSinceDirectionalInput);
      return;
    }

    const preloadKey = preloadQueueRef.current.shift();
    if (preloadKey == null) {
      return;
    }

    queuedKeysRef.current.delete(preloadKey);

    if (preloadRoute == null) {
      preloadedKeysRef.current.delete(preloadKey);
      scheduleDrain();
      return;
    }

    isDrainingRef.current = true;
    let preloadResult: unknown;
    try {
      preloadResult = preloadRoute(preloadKey);
    } catch {
      isDrainingRef.current = false;
      preloadedKeysRef.current.delete(preloadKey);
      if (preloadQueueRef.current.length > 0) {
        scheduleDrain();
      }
      return;
    }

    Promise.resolve(preloadResult)
      .catch(() => {
        preloadedKeysRef.current.delete(preloadKey);
      })
      .finally(() => {
        isDrainingRef.current = false;
        if (preloadQueueRef.current.length > 0) {
          scheduleDrain();
        }
      });
  }, [preloadRoute, scheduleDrain]);

  useLayoutEffect(() => {
    drainQueueRef.current = drainQueue;
    return () => {
      if (drainQueueRef.current === drainQueue) {
        drainQueueRef.current = NOOP;
      }
    };
  }, [drainQueue]);

  const preload = useCallback<RoutePreloadRequest>(
    preloadKey => {
      if (preloadRoute == null) {
        return false;
      }
      if (
        preloadedKeysRef.current.has(preloadKey) ||
        queuedKeysRef.current.has(preloadKey)
      ) {
        return true;
      }

      preloadedKeysRef.current.add(preloadKey);
      queuedKeysRef.current.add(preloadKey);
      preloadQueueRef.current.push(preloadKey);
      scheduleDrain(ROUTE_PRELOAD_INPUT_SETTLE_MS);
      return true;
    },
    [preloadRoute, scheduleDrain],
  );

  useEffect(() => {
    if (preloadRoute == null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isDirectionalNavigationKey(event.key)) {
        return;
      }

      lastDirectionalInputAtRef.current = now();
      if (preloadQueueRef.current.length > 0 && !isDrainingRef.current) {
        clearScheduledDrain();
        scheduleDrain(ROUTE_PRELOAD_INPUT_SETTLE_MS);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [clearScheduledDrain, preloadRoute, scheduleDrain]);

  useEffect(() => {
    if (preloadRoute != null) {
      return;
    }

    clearScheduledDrain();
    for (const preloadKey of queuedKeysRef.current) {
      preloadedKeysRef.current.delete(preloadKey);
    }
    preloadQueueRef.current = [];
    queuedKeysRef.current.clear();
  }, [clearScheduledDrain, preloadRoute]);

  useEffect(() => {
    return () => {
      clearScheduledDrain();
      preloadQueueRef.current = [];
      queuedKeysRef.current.clear();
    };
  }, [clearScheduledDrain]);

  const contextValue = useMemo<RoutePreloadContextValue>(() => ({
    enabled: preloadRoute != null,
    preload,
  }), [preload, preloadRoute]);

  return (
    <RoutePreloadContext.Provider value={contextValue}>
      {children}
    </RoutePreloadContext.Provider>
  );
}

export function useRoutePreloader(): RoutePreloadRequest {
  return useContext(RoutePreloadContext).preload;
}

export function useRoutePreloadTarget<T extends HTMLElement>({
  onFocusCapture,
  onPointerEnter,
  preloadKey,
  preloadOnFocus = true,
  preloadOnPointerEnter = true,
  preloadOnVisible = true,
  root,
  rootMargin = '0px',
  threshold = 0.01,
}: UseRoutePreloadTargetOptions<T>): RoutePreloadTargetBindings<T> {
  const elementRef = useRef<T>(null);
  const stopVisibilityObservationRef = useRef<(() => void) | null>(null);
  const {
    enabled: isPreloadEnabled,
    preload: preloadRoute,
  } = useContext(RoutePreloadContext);
  const thresholdKey = getThresholdKey(threshold);
  const preload = useCallback((): boolean => {
    if (
      !isPreloadEnabled ||
      preloadKey == null ||
      preloadRoute(preloadKey) === false
    ) {
      return false;
    }

    stopVisibilityObservationRef.current?.();
    stopVisibilityObservationRef.current = null;
    return true;
  }, [isPreloadEnabled, preloadKey, preloadRoute]);

  useEffect(() => {
    const element = elementRef.current;
    if (
      !isPreloadEnabled ||
      !preloadOnVisible ||
      preloadKey == null ||
      element == null
    ) {
      return;
    }

    const observerRoot = root === undefined ? getNearestScrollRoot(element) : root;
    const observerThreshold = getThresholdFromKey(thresholdKey);
    let cleanup: (() => void) | null = null;
    let stopWhenReady = false;
    const handleVisible = () => {
      if (!preload()) {
        return;
      }
      if (cleanup == null) {
        stopWhenReady = true;
      } else {
        const stop = cleanup;
        cleanup = null;
        stop();
      }
    };

    if (typeof IntersectionObserver === 'undefined') {
      cleanup = observeFallbackVisibility(element, observerRoot, handleVisible);
      if (isElementVisibleWithinRoot(element, observerRoot)) {
        handleVisible();
      }
    } else {
      cleanup = observeIntersection(
        element,
        observerRoot,
        rootMargin,
        observerThreshold,
        handleVisible,
      );
    }

    if (stopWhenReady) {
      cleanup?.();
      cleanup = null;
    }
    stopVisibilityObservationRef.current = cleanup;

    return () => {
      if (stopVisibilityObservationRef.current === cleanup) {
        stopVisibilityObservationRef.current = null;
      }
      cleanup?.();
    };
  }, [
    isPreloadEnabled,
    preload,
    preloadKey,
    preloadOnVisible,
    root,
    rootMargin,
    thresholdKey,
  ]);

  const handleFocusCapture = useCallback(
    (event: FocusEvent<T>) => {
      if (isPreloadEnabled && preloadOnFocus) {
        preload();
      }
      onFocusCapture?.(event);
    },
    [isPreloadEnabled, onFocusCapture, preload, preloadOnFocus],
  );
  const handlePointerEnter = useCallback(
    (event: PointerEvent<T>) => {
      if (isPreloadEnabled && preloadOnPointerEnter) {
        preload();
      }
      onPointerEnter?.(event);
    },
    [isPreloadEnabled, onPointerEnter, preload, preloadOnPointerEnter],
  );

  const focusCaptureBinding =
    onFocusCapture != null || (isPreloadEnabled && preloadOnFocus)
      ? handleFocusCapture
      : undefined;
  const pointerEnterBinding =
    onPointerEnter != null || (isPreloadEnabled && preloadOnPointerEnter)
      ? handlePointerEnter
      : undefined;

  return {
    ref: elementRef,
    'data-route-preload-key': preloadKey ?? undefined,
    onFocusCapture: focusCaptureBinding,
    onPointerEnter: pointerEnterBinding,
  };
}

export const RoutePreloadTarget = memo(function RoutePreloadTarget({
  children,
  onFocusCapture,
  onPointerEnter,
  preloadKey,
  preloadOnFocus,
  preloadOnPointerEnter,
  preloadOnVisible,
  root,
  rootMargin,
  threshold,
  ...htmlProps
}: RoutePreloadTargetProps) {
  const bindings = useRoutePreloadTarget<HTMLDivElement>({
    onFocusCapture,
    onPointerEnter,
    preloadKey,
    preloadOnFocus,
    preloadOnPointerEnter,
    preloadOnVisible,
    root,
    rootMargin,
    threshold,
  });

  return <div {...htmlProps} {...bindings}>{children}</div>;
});
