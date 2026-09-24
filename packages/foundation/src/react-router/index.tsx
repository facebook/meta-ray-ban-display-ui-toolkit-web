/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Link,
  createPath,
  resolvePath,
  useHref,
  useLocation,
  useNavigate,
  useNavigationType,
  type Location,
  type LinkProps,
  type To,
} from 'react-router-dom';
import { useBackNavigation } from '../navigation/BackNavigation';
import { useComposedRef } from '../utils/useComposedRef';
import { PageTransition } from '../navigation/PageTransition';
import type {
  PageTransitionDirection,
  PageTransitionProps,
} from '../navigation/PageTransition.types';
import {
  RoutePreloadProvider,
  useRoutePreloadTarget,
  type RoutePreloadHandler,
} from '../navigation/RoutePreloading';

export type ReactRouterNavigationType = 'POP' | 'PUSH' | 'REPLACE';

export interface ReactRouterPageTransitionState {
  direction: PageTransitionDirection;
  historyIndex: number | null;
  location: Location;
  navigationType: ReactRouterNavigationType;
  transitionKey: string;
}

export interface UseReactRouterPageTransitionOptions {
  getHistoryIndex?: () => number | null;
  getTransitionKey?: (location: Location) => string;
}

export interface ReactRouterNavigationProviderProps {
  children?: ReactNode;
  /** Route used when back is requested at history index zero. @default '/' */
  fallbackTo?: To | null;
  getHistoryIndex?: () => number | null;
  preloadRoute?: RoutePreloadHandler;
}

export interface ReactRouterNavigation {
  navigateBack: () => boolean;
}

interface ReactRouterNavigationContextValue extends ReactRouterNavigation {
  getDirectionOverride: (location: Location) => PageTransitionDirection | null;
  getHistoryIndex: () => number | null;
}

interface BrowserNavigationEntrySnapshot {
  key: string;
  state: unknown;
  url: string;
}

interface BrowserNavigationApi {
  currentEntry?: {
    key?: unknown;
  } | null;
}

const ReactRouterNavigationContext =
  createContext<ReactRouterNavigationContextValue | null>(null);

export type ReactRouterPageTransitionRender = (
  state: ReactRouterPageTransitionState,
) => ReactNode;

export type ReactRouterPageTransitionChildren =
  | ReactNode
  | ReactRouterPageTransitionRender;

export interface ReactRouterPageTransitionProps
  extends Omit<PageTransitionProps, 'children' | 'direction' | 'transitionKey'>,
    UseReactRouterPageTransitionOptions {
  children: ReactRouterPageTransitionChildren;
}

function getDefaultTransitionKey(location: Location): string {
  return location.pathname;
}

export function getBrowserHistoryIndex(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const historyState = window.history.state as { idx?: unknown } | null;
  return typeof historyState?.idx === 'number' ? historyState.idx : null;
}

function getBrowserNavigationEntrySnapshot(): BrowserNavigationEntrySnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const browserNavigation = (window as Window & {
    navigation?: BrowserNavigationApi;
  }).navigation;
  const key = browserNavigation?.currentEntry?.key;
  if (typeof key !== 'string') {
    return null;
  }

  return {
    key,
    state: window.history.state,
    url: window.location.href,
  };
}

function restoreDowngradedPushNavigation(
  previousEntry: BrowserNavigationEntrySnapshot,
  currentEntry: BrowserNavigationEntrySnapshot,
): boolean {
  if (
    typeof window === 'undefined' ||
    previousEntry.key !== currentEntry.key
  ) {
    return false;
  }

  // Some embedding environments can downgrade pushState to replaceState.
  // Rebuild the two entries with the browser's History implementation so
  // every router PUSH remains reachable through system Back navigation.
  History.prototype.replaceState.call(
    window.history,
    previousEntry.state,
    '',
    previousEntry.url,
  );
  History.prototype.pushState.call(
    window.history,
    currentEntry.state,
    '',
    currentEntry.url,
  );
  return true;
}

export function getPageTransitionDirectionForHistory(
  previousHistoryIndex: number | null,
  currentHistoryIndex: number | null,
  navigationType: ReactRouterNavigationType,
): PageTransitionDirection {
  if (
    navigationType === 'POP' &&
    previousHistoryIndex != null &&
    currentHistoryIndex != null &&
    currentHistoryIndex < previousHistoryIndex
  ) {
    return 'back';
  }

  return 'forward';
}

export function useReactRouterPageTransition({
  getHistoryIndex,
  getTransitionKey = getDefaultTransitionKey,
}: UseReactRouterPageTransitionOptions = {}): ReactRouterPageTransitionState {
  const navigationContext = useContext(ReactRouterNavigationContext);
  const location = useLocation();
  const navigationType = String(
    useNavigationType(),
  ) as ReactRouterNavigationType;
  const resolveHistoryIndex =
    getHistoryIndex ?? navigationContext?.getHistoryIndex ?? getBrowserHistoryIndex;
  const transitionKey = getTransitionKey(location);
  const historyIndex = resolveHistoryIndex();
  const committedTransitionRef = useRef<{
    direction: PageTransitionDirection;
    historyIndex: number | null;
    transitionKey: string;
  } | null>(null);
  const committedTransition = committedTransitionRef.current;
  const historyDirection = committedTransition?.transitionKey === transitionKey
    ? committedTransition.direction
    : getPageTransitionDirectionForHistory(
        committedTransition?.historyIndex ?? null,
        historyIndex,
        navigationType,
      );
  const directionOverride = navigationContext?.getDirectionOverride(location);
  const direction = directionOverride ?? historyDirection;

  useLayoutEffect(() => {
    committedTransitionRef.current = {
      direction: historyDirection,
      historyIndex,
      transitionKey,
    };
  }, [historyDirection, historyIndex, transitionKey]);

  return {
    direction,
    historyIndex,
    location,
    navigationType,
    transitionKey,
  };
}

export function useReactRouterNavigation(): ReactRouterNavigation {
  const context = useContext(ReactRouterNavigationContext);
  if (context == null) {
    throw new Error(
      'useReactRouterNavigation must be used within ReactRouterNavigationProvider.',
    );
  }

  return context;
}

export function ReactRouterNavigationProvider({
  children,
  fallbackTo = '/',
  getHistoryIndex = getBrowserHistoryIndex,
  preloadRoute,
}: ReactRouterNavigationProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = String(
    useNavigationType(),
  ) as ReactRouterNavigationType;
  const committedBrowserEntryRef = useRef(
    getBrowserNavigationEntrySnapshot(),
  );
  const [pendingBackTransition, setPendingBackTransition] = useState<{
    fromLocationKey: string;
    toLocationKey: string | null;
  } | null>(null);

  useLayoutEffect(() => {
    const previousEntry = committedBrowserEntryRef.current;
    let currentEntry = getBrowserNavigationEntrySnapshot();

    if (
      navigationType === 'PUSH' &&
      previousEntry != null &&
      currentEntry != null &&
      restoreDowngradedPushNavigation(previousEntry, currentEntry)
    ) {
      currentEntry = getBrowserNavigationEntrySnapshot();
    }

    committedBrowserEntryRef.current = currentEntry;
  }, [location.key, navigationType]);

  const navigateBack = useCallback((): boolean => {
    const historyIndex = getHistoryIndex();
    if (historyIndex != null && historyIndex > 0) {
      navigate(-1);
      return true;
    }

    if (fallbackTo == null) {
      return false;
    }

    const fallbackPath = resolvePath(fallbackTo, location.pathname);
    const currentPath = createPath({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
    if (createPath(fallbackPath) === currentPath) {
      return false;
    }

    setPendingBackTransition({
      fromLocationKey: getDefaultTransitionKey(location),
      toLocationKey: null,
    });
    navigate(fallbackPath, { replace: true });
    return true;
  }, [fallbackTo, getHistoryIndex, location, navigate]);

  useBackNavigation(navigateBack);

  const locationKey = getDefaultTransitionKey(location);
  useEffect(() => {
    setPendingBackTransition(current => {
      if (current == null || locationKey === current.fromLocationKey) {
        return current;
      }
      if (current.toLocationKey == null) {
        return { ...current, toLocationKey: locationKey };
      }
      return locationKey === current.toLocationKey ? current : null;
    });
  }, [locationKey]);

  const value = useMemo<ReactRouterNavigationContextValue>(() => ({
    getDirectionOverride: nextLocation => {
      if (pendingBackTransition == null) {
        return null;
      }

      const nextLocationKey = getDefaultTransitionKey(nextLocation);
      if (nextLocationKey === pendingBackTransition.fromLocationKey) {
        return null;
      }
      if (
        pendingBackTransition.toLocationKey == null ||
        nextLocationKey === pendingBackTransition.toLocationKey
      ) {
        return 'back';
      }
      return null;
    },
    getHistoryIndex,
    navigateBack,
  }), [getHistoryIndex, navigateBack, pendingBackTransition]);

  return (
    <ReactRouterNavigationContext.Provider value={value}>
      <RoutePreloadProvider preloadRoute={preloadRoute}>
        {children}
      </RoutePreloadProvider>
    </ReactRouterNavigationContext.Provider>
  );
}

export function ReactRouterPageTransition({
  children,
  getHistoryIndex,
  getTransitionKey,
  ...pageTransitionProps
}: ReactRouterPageTransitionProps) {
  const state = useReactRouterPageTransition({
    getHistoryIndex,
    getTransitionKey,
  });
  const content = typeof children === 'function'
    ? (children as ReactRouterPageTransitionRender)(state)
    : children;

  return (
    <PageTransition
      {...pageTransitionProps}
      direction={state.direction}
      transitionKey={state.transitionKey}
    >
      {content}
    </PageTransition>
  );
}

export interface ReactRouterPreloadLinkProps extends LinkProps {
  preloadKey?: string | null;
  preloadOnFocus?: boolean;
  preloadOnPointerEnter?: boolean;
  preloadOnVisible?: boolean;
  preloadRoot?: Element | null;
  preloadRootMargin?: string;
  preloadThreshold?: IntersectionObserverInit['threshold'];
}

export const ReactRouterPreloadLink = forwardRef<
  HTMLAnchorElement,
  ReactRouterPreloadLinkProps
>(function ReactRouterPreloadLink({
  onFocusCapture,
  onPointerEnter,
  preloadKey,
  preloadOnFocus,
  preloadOnPointerEnter,
  preloadOnVisible,
  preloadRoot,
  preloadRootMargin,
  preloadThreshold,
  to,
  ...linkProps
}, forwardedRef) {
  const href = useHref(to);
  const bindings = useRoutePreloadTarget<HTMLAnchorElement>({
    onFocusCapture,
    onPointerEnter,
    preloadKey: preloadKey === undefined ? href : preloadKey,
    preloadOnFocus,
    preloadOnPointerEnter,
    preloadOnVisible,
    root: preloadRoot,
    rootMargin: preloadRootMargin,
    threshold: preloadThreshold,
  });
  const mergedRef = useComposedRef(forwardedRef, bindings.ref);

  return (
    <Link
      {...linkProps}
      {...bindings}
      ref={mergedRef}
      to={to}
    />
  );
});
