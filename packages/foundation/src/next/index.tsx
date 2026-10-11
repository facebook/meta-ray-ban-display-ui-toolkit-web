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
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useBackNavigation } from '../navigation/BackNavigation';
import { useNavigationFocusRetentionTrigger } from '../navigation/FocusRetention';
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

export interface NextPageTransitionState {
  direction: PageTransitionDirection;
  historyIndex: number | null;
  pathname: string;
  transitionKey: string;
}

export interface UseNextPageTransitionOptions {
  getHistoryIndex?: () => number | null;
  getTransitionKey?: (pathname: string) => string;
}

export interface NextNavigationProviderProps {
  children?: ReactNode;
  /**
   * App path used when back is requested at the first history entry. Pass
   * `null` to leave Back unhandled there. @default '/'
   */
  fallbackHref?: string | null;
  getHistoryIndex?: () => number | null;
  preloadRoute?: RoutePreloadHandler;
}

export interface NextNavigation {
  navigateBack: () => boolean;
}

interface NextNavigationContextValue extends NextNavigation {
  getDirectionOverride: (pathname: string) => PageTransitionDirection | null;
  getHistoryIndex: () => number | null;
  isTraversalTo: (pathname: string) => boolean;
}

interface BrowserNavigationEntrySnapshot {
  key: string;
  state: unknown;
  url: string;
}

interface BrowserNavigationApi {
  currentEntry?: {
    index?: unknown;
    key?: unknown;
  } | null;
}

const NextNavigationContext =
  createContext<NextNavigationContextValue | null>(null);

export type NextPageTransitionRender = (
  state: NextPageTransitionState,
) => ReactNode;

export interface NextPageTransitionProps
  extends Omit<PageTransitionProps, 'children' | 'direction' | 'transitionKey'>,
    UseNextPageTransitionOptions {
  /**
   * Renders the screen for the transition state. Next.js resolves a layout's
   * `children` from the current route, so an outgoing page cannot keep them;
   * render each screen from `state.pathname` instead.
   */
  children: NextPageTransitionRender;
}

function getDefaultTransitionKey(pathname: string): string {
  return pathname;
}

function getBrowserNavigationApi(): BrowserNavigationApi | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return (window as Window & { navigation?: BrowserNavigationApi })
    .navigation ?? null;
}

/**
 * Returns the current entry's position in the session history from the
 * browser Navigation API, or `null` when the API is unavailable.
 */
export function getBrowserNavigationEntryIndex(): number | null {
  const index = getBrowserNavigationApi()?.currentEntry?.index;
  return typeof index === 'number' && index >= 0 ? index : null;
}

const HISTORY_INDEX_STATE_KEY = '__uitHistoryIndex';

function readHistoryStateIndex(state: unknown): number | null {
  if (state == null || typeof state !== 'object') {
    return null;
  }
  const index = (state as Record<string, unknown>)[HISTORY_INDEX_STATE_KEY];
  return typeof index === 'number' && Number.isInteger(index) && index >= 0
    ? index
    : null;
}

/**
 * Returns `state` with the history index added, or `state` unchanged when it
 * cannot carry one.
 */
function withHistoryStateIndex(state: unknown, index: number): unknown {
  if (state == null) {
    return { [HISTORY_INDEX_STATE_KEY]: index };
  }
  if (typeof state !== 'object' || Array.isArray(state)) {
    return state;
  }
  return { ...(state as Record<string, unknown>), [HISTORY_INDEX_STATE_KEY]: index };
}

/**
 * Returns the current entry's position in the session history: the browser
 * Navigation API index when available, otherwise the index that
 * `NextNavigationProvider` records in history state, the way React Router's
 * browser history does. Next.js does not record a history index of its own.
 * Returns `null` before a provider has recorded an index.
 */
export function getNextHistoryIndex(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return getBrowserNavigationEntryIndex() ??
    readHistoryStateIndex(window.history.state);
}

function getBrowserNavigationEntrySnapshot(): BrowserNavigationEntrySnapshot | null {
  const key = getBrowserNavigationApi()?.currentEntry?.key;
  if (typeof key !== 'string') {
    return null;
  }

  return {
    key,
    state: window.history.state,
    url: window.location.href,
  };
}

/**
 * Wraps `history.pushState` and `history.replaceState`, which Next.js uses for
 * every App Router navigation (its own history patch wraps these wrappers).
 *
 * - Records a history index in each entry's state: a push stores the current
 *   index plus one, and a replace keeps the current index, because Next.js
 *   replaces state on many commits without preserving custom keys. The first
 *   entry the provider sees is index zero, like a direct link.
 * - Some embedding environments downgrade `pushState` to `replaceState`. When
 *   the Navigation API shows that a push left the current entry unchanged,
 *   rebuild both entries with the browser's History implementation so every
 *   push stays reachable through system Back navigation.
 */
function useHistoryInstrumentation(retainNavigationFocus: () => void): void {
  useLayoutEffect(() => {
    const history = window.history;
    if (readHistoryStateIndex(history.state) == null) {
      History.prototype.replaceState.call(
        history,
        withHistoryStateIndex(history.state, 0),
        '',
        window.location.href,
      );
    }

    const pushDelegate = history.pushState;
    const replaceDelegate = history.replaceState;
    let active = true;
    const retainSamePathNavigation = (
      url: string | URL | null | undefined,
      isPush: boolean,
    ) => {
      const target = new URL(url ?? window.location.href, window.location.href);
      if (
        normalizePathname(target.pathname) ===
          normalizePathname(window.location.pathname) &&
        (isPush || target.href !== window.location.href)
      ) {
        retainNavigationFocus();
      }
    };
    const instrumentedPushState: History['pushState'] = (data, unused, url) => {
      if (!active) {
        pushDelegate.call(history, data, unused, url);
        return;
      }
      retainSamePathNavigation(url, true);
      const index = (readHistoryStateIndex(history.state) ?? 0) + 1;
      const previousEntry = getBrowserNavigationEntrySnapshot();
      pushDelegate.call(history, withHistoryStateIndex(data, index), unused, url);
      const currentEntry = previousEntry == null
        ? null
        : getBrowserNavigationEntrySnapshot();
      if (
        previousEntry == null ||
        currentEntry == null ||
        previousEntry.key !== currentEntry.key
      ) {
        return;
      }

      History.prototype.replaceState.call(
        history,
        previousEntry.state,
        '',
        previousEntry.url,
      );
      History.prototype.pushState.call(
        history,
        withHistoryStateIndex(currentEntry.state, index),
        '',
        currentEntry.url,
      );
    };
    const instrumentedReplaceState: History['replaceState'] = (
      data,
      unused,
      url,
    ) => {
      const index = active ? readHistoryStateIndex(history.state) : null;
      if (active) {
        retainSamePathNavigation(url, false);
      }
      replaceDelegate.call(
        history,
        index == null ? data : withHistoryStateIndex(data, index),
        unused,
        url,
      );
    };
    history.pushState = instrumentedPushState;
    history.replaceState = instrumentedReplaceState;

    return () => {
      active = false;
      // Next.js may have wrapped these functions after they were installed.
      // Leave the chain intact in that case; inactive wrappers only delegate.
      if (history.pushState === instrumentedPushState) {
        history.pushState = pushDelegate;
      }
      if (history.replaceState === instrumentedReplaceState) {
        history.replaceState = replaceDelegate;
      }
    };
  }, [retainNavigationFocus]);
}

function withoutTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

function decodePathname(pathname: string): string {
  try {
    return decodeURI(pathname);
  } catch {
    return pathname;
  }
}

function normalizePathname(pathname: string): string {
  return withoutTrailingSlash(decodePathname(pathname));
}

/**
 * Derives the Next.js `basePath` from a browser pathname and the router
 * pathname for the same location, or returns `null` when they disagree.
 */
function getNextBasePath(
  browserPathname: string,
  routerPathname: string,
): string | null {
  const browser = normalizePathname(browserPathname);
  const router = normalizePathname(routerPathname);
  if (router === '/') {
    return browser === '/' ? '' : browser;
  }
  return browser.endsWith(router)
    ? browser.slice(0, browser.length - router.length)
    : null;
}

/**
 * Whether a traversal that landed on the browser pathname `destination`
 * produced the router `pathname`. Without a known base path, only an exact
 * match counts, so an unrelated route that shares a suffix is never mistaken
 * for the traversal destination.
 */
function isNextTraversalDestination(
  destination: string,
  pathname: string,
  basePath: string | null,
): boolean {
  const browser = normalizePathname(destination);
  const router = normalizePathname(pathname);
  if (basePath == null || basePath === '') {
    return browser === router;
  }
  return browser === (router === '/' ? basePath : `${basePath}${router}`);
}

function isCurrentHref(href: string, pathname: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const current = new URL(
    `${pathname}${window.location.search}${window.location.hash}`,
    window.location.origin,
  );
  const target = new URL(href, current);
  return (
    target.origin === current.origin &&
    normalizePathname(target.pathname) === normalizePathname(current.pathname) &&
    target.search === current.search &&
    target.hash === current.hash
  );
}

export function getPageTransitionDirectionForHistoryIndex(
  previousHistoryIndex: number | null,
  currentHistoryIndex: number | null,
  isTraversal: boolean,
): PageTransitionDirection {
  if (previousHistoryIndex != null && currentHistoryIndex != null) {
    return currentHistoryIndex < previousHistoryIndex ? 'back' : 'forward';
  }

  // Without a history index, treat a browser traversal as Back. Display
  // glasses expose system Back but no Forward control.
  return isTraversal ? 'back' : 'forward';
}

export function useNextPageTransition({
  getHistoryIndex,
  getTransitionKey = getDefaultTransitionKey,
}: UseNextPageTransitionOptions = {}): NextPageTransitionState {
  const navigationContext = useContext(NextNavigationContext);
  const pathname = usePathname() ?? '/';
  const resolveHistoryIndex =
    getHistoryIndex ??
    navigationContext?.getHistoryIndex ??
    getNextHistoryIndex;
  const transitionKey = getTransitionKey(pathname);
  const historyIndex = resolveHistoryIndex();
  const committedTransitionRef = useRef<{
    direction: PageTransitionDirection;
    historyIndex: number | null;
    transitionKey: string;
  } | null>(null);
  const committedTransition = committedTransitionRef.current;
  const historyDirection = committedTransition?.transitionKey === transitionKey
    ? committedTransition.direction
    : getPageTransitionDirectionForHistoryIndex(
        committedTransition?.historyIndex ?? null,
        historyIndex,
        navigationContext?.isTraversalTo(pathname) ?? false,
      );
  const directionOverride = navigationContext?.getDirectionOverride(pathname);
  const direction = directionOverride ?? historyDirection;

  useLayoutEffect(() => {
    committedTransitionRef.current = {
      direction: historyDirection,
      // Next.js writes a pushed entry while committing the new route, after
      // this render read the index. Read it again once the entry exists.
      historyIndex: resolveHistoryIndex(),
      transitionKey,
    };
  }, [historyDirection, resolveHistoryIndex, transitionKey]);

  return {
    direction,
    historyIndex,
    pathname,
    transitionKey,
  };
}

export function useNextNavigation(): NextNavigation {
  const context = useContext(NextNavigationContext);
  if (context == null) {
    throw new Error(
      'useNextNavigation must be used within NextNavigationProvider.',
    );
  }

  return context;
}

/**
 * Connects the Next.js App Router to toolkit Back navigation, page transition
 * direction, route preloading, and navigation focus retention.
 */
export function NextNavigationProvider({
  children,
  fallbackHref = '/',
  getHistoryIndex = getNextHistoryIndex,
  preloadRoute,
}: NextNavigationProviderProps) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const traversalDestinationRef = useRef<string | null>(null);
  const basePathRef = useRef<string | null>(null);
  const [pendingBackTransition, setPendingBackTransition] = useState<{
    fromLocationKey: string;
    toLocationKey: string | null;
  } | null>(null);

    const retainNavigationFocus = useNavigationFocusRetentionTrigger(pathname);
  useHistoryInstrumentation(retainNavigationFocus);

  useLayoutEffect(() => {
    // The base path is fixed for an application. Only the mount-time pair is
    // trusted: later commits can run before the router updates the URL.
    basePathRef.current = getNextBasePath(window.location.pathname, pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      traversalDestinationRef.current = window.location.pathname;
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    traversalDestinationRef.current = null;
  }, [pathname]);

  const navigateBack = useCallback((): boolean => {
    const historyIndex = getHistoryIndex();
    if (historyIndex != null && historyIndex > 0) {
      router.back();
      return true;
    }

    if (fallbackHref == null || isCurrentHref(fallbackHref, pathname)) {
      return false;
    }

    setPendingBackTransition({
      fromLocationKey: getDefaultTransitionKey(pathname),
      toLocationKey: null,
    });
    router.replace(fallbackHref);
    return true;
  }, [fallbackHref, getHistoryIndex, pathname, router]);

  useBackNavigation(navigateBack);

  const locationKey = getDefaultTransitionKey(pathname);
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

  const value = useMemo<NextNavigationContextValue>(() => ({
    getDirectionOverride: nextPathname => {
      if (pendingBackTransition == null) {
        return null;
      }

      const nextLocationKey = getDefaultTransitionKey(nextPathname);
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
    isTraversalTo: nextPathname => {
      const destination = traversalDestinationRef.current;
      return (
        destination != null &&
        isNextTraversalDestination(destination, nextPathname, basePathRef.current)
      );
    },
    navigateBack,
  }), [getHistoryIndex, navigateBack, pendingBackTransition]);

  return (
    <NextNavigationContext.Provider value={value}>
      <RoutePreloadProvider preloadRoute={preloadRoute}>
        {children}
      </RoutePreloadProvider>
    </NextNavigationContext.Provider>
  );
}

export function NextPageTransition({
  children,
  getHistoryIndex,
  getTransitionKey,
  ...pageTransitionProps
}: NextPageTransitionProps) {
  const state = useNextPageTransition({
    getHistoryIndex,
    getTransitionKey,
  });
  return (
    <PageTransition
      {...pageTransitionProps}
      direction={state.direction}
      transitionKey={state.transitionKey}
    >
      {children(state)}
    </PageTransition>
  );
}

type NextLinkProps = ComponentPropsWithoutRef<typeof Link>;

export interface NextPreloadLinkProps extends NextLinkProps {
  preloadKey?: string | null;
  preloadOnFocus?: boolean;
  preloadOnPointerEnter?: boolean;
  preloadOnVisible?: boolean;
  preloadRoot?: Element | null;
  preloadRootMargin?: string;
  preloadThreshold?: IntersectionObserverInit['threshold'];
}

function getHrefPreloadKey(href: NextLinkProps['href']): string {
  if (typeof href === 'string') {
    return href;
  }

  const search = href.search ?? (
    href.query == null || typeof href.query === 'string'
      ? href.query ?? ''
      : new URLSearchParams(
          Object.entries(href.query).flatMap(([name, value]) =>
            (Array.isArray(value) ? value : [value])
              .filter(item => item != null)
              .map(item => [name, String(item)]),
          ),
        ).toString()
  );
  const normalizedSearch = search === '' || search.startsWith('?')
    ? search
    : `?${search}`;
  const hash = href.hash == null || href.hash === '' || href.hash.startsWith('#')
    ? href.hash ?? ''
    : `#${href.hash}`;
  return `${href.pathname ?? ''}${normalizedSearch}${hash}`;
}

export const NextPreloadLink = forwardRef<
  HTMLAnchorElement,
  NextPreloadLinkProps
>(function NextPreloadLink({
  href,
  onFocusCapture,
  onPointerEnter,
  preloadKey,
  preloadOnFocus,
  preloadOnPointerEnter,
  preloadOnVisible,
  preloadRoot,
  preloadRootMargin,
  preloadThreshold,
  ...linkProps
}, forwardedRef) {
  const bindings = useRoutePreloadTarget<HTMLAnchorElement>({
    onFocusCapture,
    onPointerEnter,
    preloadKey: preloadKey === undefined ? getHrefPreloadKey(href) : preloadKey,
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
      href={href}
      ref={mergedRef}
    />
  );
});
