/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Pager component
 * Paginated view container
 *
 * Features:
 * - Horizontal or vertical page orientation
 * - Animated page transitions (slide + fade with spring physics)
 * - Left/Right (horizontal) or Up/Down (vertical) arrow key navigation
 * - Back returns to home when useBackButtonForHome is set; the shared
 *   Back aliases (Escape, Backspace, BrowserBack, GoBack) are the fallback
 * - Page lifecycle callbacks (onPageChange)
 * - Navigation locking support
 * - Peek animation before navigating
 *
 * Usage:
 * ```tsx
 * <Pager
 *   orientation={PagerOrientation.HORIZONTAL}
 *   currentPageIndex={0}
 *   onPageChange={(newIndex, prevIndex) => setPage(newIndex)}
 * >
 *   <div>Page 1</div>
 *   <div>Page 2</div>
 *   <div>Page 3</div>
 * </Pager>
 * ```
 */

import {
  forwardRef,
  Fragment,
  memo,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useImperativeHandle,
  useMemo,
  isValidElement,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  Children,
  type ReactElement,
  type ReactNode,
} from 'react';
import styles from './Pager.module.css';
import {
  INVALID_PAGE_INDEX,
  PEEK_OUT_MS,
  PEEK_RESTORE_MS,
  SPRING_SETTLE_MS,
} from './private/PagerAnimation';
import type { PeekState } from './private/PagerAnimation';
import {
  getInitialFocusableElement,
  hasFocusableInDirection,
  isKeyboardReachable,
} from './private/PagerFocus';
import type { FocusDirection } from './private/PagerFocus';
import {
  FOCUS_NAVIGATION_HANDLED_EVENT,
  INVALID_FOCUS_DIRECTION_EVENT,
} from '../base/FocusNavigationEvents';
import { retargetNavigationFocusRetention } from '../base/FocusCoordinator';
import {
  isBackNavigationKey,
  useTransientBackNavigation,
} from '../navigation/BackNavigation';
import {
  NavigationDirection,
  PagerOrientation,
} from './Pager.types';
import type {
  PagerHandle,
  PagerInitialFocusRequest,
  PagerPageLifecycle,
  PagerPageProps,
  PagerProps,
} from './Pager.types';
import { getPagerPageStyle } from './private/PagerPresentation';
import { PagerPages } from './private/PagerPages';
import {
  PagerPageLifecycleProvider,
  usePagerPageLifecycle,
  type PagerPageLifecycleStore,
} from './private/PagerPageLifecycle';

export { NavigationDirection, PagerOrientation } from './Pager.types';
export { usePagerPageLifecycle };
export type {
  PagerAnimationCompletedRequest,
  PagerHandle,
  PagerInitialFocusRequest,
  PagerPageLifecycle,
  PagerPageProps,
  PagerProps,
} from './Pager.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * How long a controlled owner has to apply a requested Back navigation before
 * the pending marker is discarded.
 *
 * The marker exists only to classify the arriving navigation as Back for
 * initial-focus direction. A synchronous owner applies the index in the same
 * tick, but an owner that round-trips through history or a router answers a
 * task or more later, so the window has to outlast that round trip; expiring
 * on the next task classifies every asynchronous owner's Back as a forward
 * navigation.
 *
 * An owner that applies a *different* index clears the marker immediately, so
 * this bound only covers the request an owner never answers at all: it stays
 * short enough that such a request cannot leave the marker armed for a later,
 * unrelated navigation home.
 */
const PENDING_CONTROLLED_BACK_TIMEOUT_MS = 250;

interface ResolvedPagerPage {
  content: ReactNode;
  key: string;
  lifecycle: PagerPageProps;
}

type PendingFocusRequest = PagerInitialFocusRequest;

export const PagerPage = memo(function PagerPage({
  children,
}: PagerPageProps) {
  return <Fragment>{children}</Fragment>;
});

function getViewportSizeForOrientation(
  orientation: PagerOrientation,
): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  const viewportSize = orientation === PagerOrientation.HORIZONTAL
    ? window.visualViewport?.width
    : window.visualViewport?.height;
  if (typeof viewportSize === 'number' && viewportSize > 0) {
    return viewportSize;
  }

  const windowSize = orientation === PagerOrientation.HORIZONTAL
    ? window.innerWidth
    : window.innerHeight;
  return typeof windowSize === 'number' && windowSize > 0 ? windowSize : 0;
}

function getContainerSizeForOrientation(
  element: HTMLElement | null,
  orientation: PagerOrientation,
): number {
  const measuredSize = orientation === PagerOrientation.HORIZONTAL
    ? element?.clientWidth
    : element?.clientHeight;
  return measuredSize != null && measuredSize > 0
    ? measuredSize
    : getViewportSizeForOrientation(orientation);
}

function isPagerPageElement(
  child: ReactNode,
): child is ReactElement<PagerPageProps> {
  return isValidElement<PagerPageProps>(child) && child.type === PagerPage;
}

function resolvePagerPage(child: ReactNode, index: number): ResolvedPagerPage {
  const key = isValidElement(child) && child.key != null
    ? String(child.key)
    : `page-${index}`;
  if (!isPagerPageElement(child)) {
    return {
      content: child,
      key,
      lifecycle: {},
    };
  }

  return {
    content: child.props.children,
    key,
    lifecycle: child.props,
  };
}

function resolvePageIndex(requestedIndex: number, pageCount: number): number {
  if (pageCount <= 0) {
    return INVALID_PAGE_INDEX;
  }

  const integerIndex = Number.isFinite(requestedIndex)
    ? Math.trunc(requestedIndex)
    : 0;
  return Math.min(Math.max(integerIndex, 0), pageCount - 1);
}

function getNavigationDirection({
  isViaBack,
  orientation,
  previousPageIndex,
  pageIndex,
}: {
  isViaBack: boolean;
  orientation: PagerOrientation;
  previousPageIndex: number;
  pageIndex: number;
}): NavigationDirection {
  if (isViaBack) {
    return NavigationDirection.BACK;
  }
  if (previousPageIndex === INVALID_PAGE_INDEX) {
    return NavigationDirection.START;
  }

  if (orientation === PagerOrientation.HORIZONTAL) {
    return pageIndex < previousPageIndex
      ? NavigationDirection.RIGHT
      : NavigationDirection.LEFT;
  }

  return pageIndex < previousPageIndex
    ? NavigationDirection.DOWN
    : NavigationDirection.UP;
}

function getNextPageForFocusDirection({
  direction,
  internalIndex,
  orientation,
}: {
  direction: FocusDirection;
  internalIndex: number;
  orientation: PagerOrientation;
}): number | null {
  if (orientation === PagerOrientation.HORIZONTAL) {
    if (direction === 'left') {
      return internalIndex - 1;
    }
    if (direction === 'right') {
      return internalIndex + 1;
    }
    return null;
  }

  if (direction === 'up') {
    return internalIndex - 1;
  }
  if (direction === 'down') {
    return internalIndex + 1;
  }
  return null;
}

function directionFromInvalidFocusEvent(event: Event): FocusDirection | null {
  const direction = (event as CustomEvent<{ direction?: FocusDirection }>).detail?.direction;
  return direction === 'left' ||
    direction === 'right' ||
    direction === 'up' ||
    direction === 'down'
    ? direction
    : null;
}

function dispatchFocusNavigationHandled(element: HTMLElement): void {
  element.dispatchEvent(new CustomEvent(FOCUS_NAVIGATION_HANDLED_EVENT));
}

// ============================================================================
// Component
// ============================================================================

/**
 * Pager component
 * Paginated container with animated transitions between pages.
 *
 * Navigation:
 * - Horizontal mode: Left/Right arrow keys switch pages
 * - Vertical mode: Up/Down arrow keys switch pages
 * - Back returns to home (if configured); Escape is the desktop fallback
 *
 * Pages are positioned absolutely within the container and animated
 * using CSS transforms (translateX/Y) and opacity transitions.
 */
export const Pager = memo(forwardRef<PagerHandle, PagerProps>(
  function Pager(
    {
      orientation = PagerOrientation.HORIZONTAL,
      currentPageIndex: controlledIndex,
      defaultPageIndex = 0,
      useBackButtonForHome = true,
      homeIndex = INVALID_PAGE_INDEX,
      animated = true,
      onPageChange,
      onNavigationAttemptWhileLocked,
      navigationLocked = false,
      unmountInactivePages = false,
      requestInitialFocusOnMount = false,
      children,
      className = '',
      style = DEFAULT_STYLE,
      ariaLabel,
      tabIndex = 0,
      onFocus,
      onKeyDown,
      role,
      'aria-label': standardAriaLabel,
      'aria-roledescription': ariaRoleDescription,
      ...rest
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const peekOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const peekRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const peekedDirectionsRef = useRef<Record<string, boolean>>({});
    const pendingFocusRequestRef = useRef<PendingFocusRequest | null>(null);
    const hasRequestedInitialFocusRef = useRef(false);
    const unloadedPageIndicesRef = useRef<Set<number>>(new Set());
    const resolvedPages = useMemo(
      () => Children.toArray(children).map(resolvePagerPage),
      [children],
    );
    const pageCount = resolvedPages.length;
    const isControlled = controlledIndex !== undefined;
    const initialPageIndex = resolvePageIndex(
      controlledIndex ?? defaultPageIndex,
      pageCount,
    );
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [peekState, setPeekState] = useState<PeekState | null>(null);
    const [containerSize, setContainerSize] = useState<number | null>(null);
    // Indices force-mounted via preloadPageIfNeeded() and force-unmounted via
    // unloadPage(). Stored as state (not refs) so PagerPages re-renders when
    // the imperative handle mutates them.
    const [forcedPreloadIndices, setForcedPreloadIndices] = useState<ReadonlySet<number>>(
      () => new Set(),
    );
    const [forcedUnloadIndices, setForcedUnloadIndices] = useState<ReadonlySet<number>>(
      () => new Set(),
    );
    // index + prevIndex are stored together so a single state update keeps them
    // atomically consistent. previousIndex must be state (not a ref) because it
    // is read during render to position the outgoing page; reading a mutable ref
    // during render is non-deterministic under concurrent rendering.
    const [pageState, setPageState] = useState<{ index: number; prevIndex: number }>(
      { index: initialPageIndex, prevIndex: INVALID_PAGE_INDEX },
    );
    // Whether the pager is keyboard-reachable for Back ownership. Unmeasured
    // until after mount; a pager nested in an inactive outer page
    // (aria-hidden) must not own the shared Back entry. Registration waits
    // for the measurement so mounting never pushes a transient entry that
    // is immediately popped again.
    const [isBackReachable, setIsBackReachable] = useState<boolean | null>(null);
    const internalIndex = pageState.index;
    const internalIndexRef = useRef(initialPageIndex);
    const animatedRef = useRef(animated);
    const resolvedPagesRef = useRef(resolvedPages);
    const lifecycleStoresByKeyRef = useRef(
      new Map<string, PagerPageLifecycleStore>(),
    );
    const lifecycleStores = useMemo<PagerPageLifecycleStore[]>(() => (
      resolvedPages.map(page => (
        lifecycleStoresByKeyRef.current.get(page.key) ?? {
          current: null,
          isMounted: false,
          pendingWillShow: false,
        }
      ))
    ), [resolvedPages]);
    const lifecycleStoresRef = useRef(lifecycleStores);
    const pages = useMemo(
      () => resolvedPages.map((page, index) => (
        <PagerPageLifecycleProvider
          key={page.key}
          fallbackLifecycle={page.lifecycle}
          store={lifecycleStores[index]}
        >
          {page.content}
        </PagerPageLifecycleProvider>
      )),
      [lifecycleStores, resolvedPages],
    );
    const pendingControlledIndexRef = useRef<number | null>(null);
    const pendingControlledBackIndexRef = useRef<number | null>(null);
    const pendingControlledBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previousControlledIndexRef = useRef(controlledIndex);
    const previousPageCountRef = useRef(pageCount);

    // Keep refs in sync with latest values so that effects can read
    // current state without needing it in their dependency arrays.
    useEffect(() => { internalIndexRef.current = internalIndex; }, [internalIndex]);
    useEffect(() => { animatedRef.current = animated; }, [animated]);
    useLayoutEffect(() => {
      resolvedPagesRef.current = resolvedPages;
      lifecycleStoresRef.current = lifecycleStores;
      lifecycleStoresByKeyRef.current = new Map(
        resolvedPages.map((page, index) => [page.key, lifecycleStores[index]]),
      );
    }, [lifecycleStores, resolvedPages]);

    // Track keyboard reachability for transient Back ownership. An outer
    // pager deactivates the page this pager is nested in by toggling
    // aria-hidden without re-rendering nested content, so observe the
    // ancestor chain instead of measuring only during render. Attribute
    // observation covers the signals reachability is computed from, child
    // observation re-collects the chain when restructuring inserts or
    // removes ancestors, and updates are coalesced into a single frame so
    // a burst of mutations performs one reachability measurement.
    useLayoutEffect(() => {
      const container = containerRef.current;
      if (container == null) {
        return undefined;
      }
      let frameId: number | null = null;
      const measureBackReachability = () => {
        frameId = null;
        const next = isKeyboardReachable(container);
        setIsBackReachable(prev => (prev === next ? prev : next));
      };
      // Measure synchronously even when MutationObserver is unavailable so
      // older hosts can still register a visible pager for Back ownership.
      measureBackReachability();
      if (typeof MutationObserver === 'undefined') {
        window.addEventListener('resize', measureBackReachability);
        return () => {
          window.removeEventListener('resize', measureBackReachability);
        };
      }
      const scheduleBackReachabilityMeasure = () => {
        if (frameId != null) {
          return;
        }
        frameId = requestAnimationFrame(measureBackReachability);
      };
      const observer = new MutationObserver(records => {
        if (records.some(record => record.type === 'childList')) {
          observeAncestors();
        }
        scheduleBackReachabilityMeasure();
      });
      const observeAncestors = () => {
        observer.disconnect();
        let ancestor: HTMLElement | null = container;
        while (ancestor != null) {
          observer.observe(ancestor, {
            attributes: true,
            attributeFilter: ['aria-hidden', 'class', 'hidden', 'inert', 'style'],
            childList: true,
            subtree: false,
          });
          ancestor = ancestor.parentElement;
        }
      };
      observeAncestors();
      window.addEventListener('resize', scheduleBackReachabilityMeasure);
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', scheduleBackReachabilityMeasure);
        if (frameId != null) {
          cancelAnimationFrame(frameId);
        }
      };
    }, []);

    const getPageLifecycle = useCallback((index: number): PagerPageLifecycle => ({
      ...resolvedPagesRef.current[index]?.lifecycle,
      ...lifecycleStoresRef.current[index]?.current,
    }), []);

    useLayoutEffect(() => {
      const updateContainerSize = () => {
        const nextSize = getContainerSizeForOrientation(
          containerRef.current,
          orientation,
        );
        setContainerSize(currentSize =>
          currentSize === nextSize ? currentSize : nextSize
        );
      };

      updateContainerSize();

      const containerEl = containerRef.current;
      if (containerEl == null) {
        return;
      }

      window.addEventListener('resize', updateContainerSize);
      if (typeof ResizeObserver === 'undefined') {
        return () => {
          window.removeEventListener('resize', updateContainerSize);
        };
      }

      const resizeObserver = new ResizeObserver(updateContainerSize);
      resizeObserver.observe(containerEl);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateContainerSize);
      };
    }, [orientation]);

    // Timer cleanup on unmount. Page unload callbacks are emitted only by the
    // explicit inactive-page and imperative unload paths below.
    useEffect(() => {
      return () => {
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current);
        }
        if (peekOutTimerRef.current) {
          clearTimeout(peekOutTimerRef.current);
        }
        if (peekRestoreTimerRef.current) {
          clearTimeout(peekRestoreTimerRef.current);
        }
        if (pendingControlledBackTimerRef.current) {
          clearTimeout(pendingControlledBackTimerRef.current);
        }
      };
    }, []);

    const clearPeekTimers = useCallback(() => {
      if (peekOutTimerRef.current) {
        clearTimeout(peekOutTimerRef.current);
        peekOutTimerRef.current = null;
      }
      if (peekRestoreTimerRef.current) {
        clearTimeout(peekRestoreTimerRef.current);
        peekRestoreTimerRef.current = null;
      }
    }, []);

    const clearPendingControlledBack = useCallback(() => {
      pendingControlledBackIndexRef.current = null;
      if (pendingControlledBackTimerRef.current != null) {
        clearTimeout(pendingControlledBackTimerRef.current);
        pendingControlledBackTimerRef.current = null;
      }
    }, []);

    const shouldPeekBeforeNavigation = useCallback((pageIndex: number): boolean => {
      const pageEl = pageRefs.current[pageIndex];
      return (
        getPageLifecycle(pageIndex).peekBeforeNavigation === true ||
        pageEl?.hasAttribute('data-uit-pager-peek-before-navigation') ||
        pageEl?.querySelector('[data-uit-pager-peek-before-navigation="true"]') != null
      );
    }, [getPageLifecycle]);

    const startPeekIfNeeded = useCallback(
      (outgoingIndex: number, incomingIndex: number): boolean => {
        if (!shouldPeekBeforeNavigation(outgoingIndex)) {
          return false;
        }

        const key = `${outgoingIndex}:${incomingIndex}`;
        if (peekedDirectionsRef.current[key]) {
          return false;
        }

        peekedDirectionsRef.current[key] = true;
        clearPeekTimers();
        setPeekState({
          outgoingIndex,
          incomingIndex,
          phase: 'peek',
        });

        peekOutTimerRef.current = setTimeout(() => {
          peekOutTimerRef.current = null;
          setPeekState({
            outgoingIndex,
            incomingIndex,
            phase: 'restore',
          });
        }, PEEK_OUT_MS);

        peekRestoreTimerRef.current = setTimeout(() => {
          peekRestoreTimerRef.current = null;
          setPeekState(null);
        }, PEEK_OUT_MS + PEEK_RESTORE_MS);

        return true;
      },
      [clearPeekTimers, shouldPeekBeforeNavigation]
    );

    const focusFirstElementInPage = useCallback((pageIndex: number) => {
      const pageEl = pageRefs.current[pageIndex];
      if (!pageEl) return;

      const focusTarget = getInitialFocusableElement(pageEl);
      if (focusTarget != null) {
        focusTarget.focus({ preventScroll: true });
        return;
      }

      // A same-document history update can focus the application root after
      // this layout effect. The page wrapper becomes the retention target so
      // an otherwise empty page still receives the next directional input.
      retargetNavigationFocusRetention(pageEl);
      pageEl.focus({ preventScroll: true });
    }, []);

    const requestInitialFocusForPage = useCallback((
      request: PagerInitialFocusRequest,
    ) => {
      const handled =
        getPageLifecycle(request.pageIndex).onRequestInitialFocus?.(request) === true;
      if (!handled) {
        focusFirstElementInPage(request.pageIndex);
      }
    }, [focusFirstElementInPage, getPageLifecycle]);

    useLayoutEffect(() => {
      if (
        !requestInitialFocusOnMount ||
        hasRequestedInitialFocusRef.current ||
        internalIndex < 0 ||
        internalIndex >= pageCount
      ) {
        return;
      }

      hasRequestedInitialFocusRef.current = true;
      requestInitialFocusForPage({
        direction: NavigationDirection.START,
        pageIndex: internalIndex,
        previousPageIndex: INVALID_PAGE_INDEX,
      });
    }, [
      internalIndex,
      pageCount,
      requestInitialFocusForPage,
      requestInitialFocusOnMount,
    ]);

    useLayoutEffect(() => {
      const pendingRequest = pendingFocusRequestRef.current;
      if (pendingRequest == null || pendingRequest.pageIndex !== internalIndex) {
        return;
      }

      pendingFocusRequestRef.current = null;
      requestInitialFocusForPage(pendingRequest);
    }, [internalIndex, requestInitialFocusForPage]);

    const handleFocus = useCallback(
      (event: FocusEvent<HTMLDivElement>) => {
        onFocus?.(event);
        if (event.defaultPrevented || event.target !== event.currentTarget) {
          return;
        }

        const pageIndex = internalIndexRef.current;
        if (pageIndex < 0 || pageIndex >= pageRefs.current.length) {
          return;
        }
        requestInitialFocusForPage({
          direction: NavigationDirection.START,
          pageIndex,
          previousPageIndex: INVALID_PAGE_INDEX,
        });
      },
      [onFocus, requestInitialFocusForPage],
    );

    const unloadInactivePagesIfNeeded = useCallback((visiblePageIndex: number) => {
      if (!unmountInactivePages) {
        return;
      }

      resolvedPages.forEach((_page, index) => {
        if (
          index !== visiblePageIndex &&
          pageRefs.current[index] != null &&
          !unloadedPageIndicesRef.current.has(index)
        ) {
          getPageLifecycle(index).onWillUnloadPage?.();
          unloadedPageIndicesRef.current.add(index);
        }
      });
    }, [getPageLifecycle, resolvedPages, unmountInactivePages]);

    const finishAnimatedTransition = useCallback((
      visiblePageIndex: number,
      previousPageIndex: number,
    ) => {
      unloadInactivePagesIfNeeded(visiblePageIndex);
      setIsTransitioning(false);
      animationTimerRef.current = null;
      getPageLifecycle(visiblePageIndex).onAnimationCompleted?.({
        pageIndex: visiblePageIndex,
        previousPageIndex,
      });
    }, [getPageLifecycle, unloadInactivePagesIfNeeded]);

    /**
     * Navigate to a specific page.
     */
    const showPage = useCallback(
      (
        index: number,
        animate: boolean = true,
        requestInitialFocus: boolean = true,
        isViaBack: boolean = false,
        forceNavigation: boolean = false,
        notifyPageChange: boolean = true,
        bypassNavigationLock: boolean = false,
      ) => {
        const currentIndex = internalIndexRef.current;
        if (
          index < 0 ||
          index >= pageCount ||
          index === currentIndex
        ) {
          if (navigationLocked && !bypassNavigationLock) {
            onNavigationAttemptWhileLocked?.();
          }
          return false;
        }

        if (navigationLocked && !bypassNavigationLock) {
          onNavigationAttemptWhileLocked?.();
          return false;
        }

        const currentPage = getPageLifecycle(currentIndex);
        if (
          !forceNavigation &&
          currentIndex !== INVALID_PAGE_INDEX &&
          currentPage?.shouldPreventNavigation?.() === true
        ) {
          return false;
        }

        if (
          !forceNavigation &&
          animate &&
          startPeekIfNeeded(currentIndex, index)
        ) {
          return false;
        }

        if (isControlled && notifyPageChange && !forceNavigation) {
          onPageChange?.(index, currentIndex, animate);
          return true;
        }

        const prevIndex = currentIndex;
        currentPage?.onWillHidePage?.();
        const incomingLifecycleStore = lifecycleStoresRef.current[index];
        if (incomingLifecycleStore != null && !incomingLifecycleStore.isMounted) {
          incomingLifecycleStore.pendingWillShow = true;
        } else {
          getPageLifecycle(index).onWillShowPage?.();
        }
        clearPeekTimers();
        setPeekState(null);
        if (requestInitialFocus) {
          pendingFocusRequestRef.current = {
            direction: getNavigationDirection({
              isViaBack,
              orientation,
              pageIndex: index,
              previousPageIndex: prevIndex,
            }),
            pageIndex: index,
            previousPageIndex: prevIndex,
          };
        }

        unloadedPageIndicesRef.current.delete(index);
        setForcedUnloadIndices(prev => {
          if (!prev.has(index)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        internalIndexRef.current = index;
        setPageState({ index, prevIndex });

        const shouldAnimate = animate && prevIndex !== INVALID_PAGE_INDEX;
        if (shouldAnimate) {
          setIsTransitioning(true);

          if (animationTimerRef.current) {
            clearTimeout(animationTimerRef.current);
          }
          animationTimerRef.current = setTimeout(() => {
            finishAnimatedTransition(index, prevIndex);
          }, SPRING_SETTLE_MS);
        } else {
          unloadInactivePagesIfNeeded(index);
        }

        if (notifyPageChange) {
          onPageChange?.(index, prevIndex, animate);
        }
        return true;
      },
      [
        clearPeekTimers,
        finishAnimatedTransition,
        orientation,
        pageCount,
        navigationLocked,
        onPageChange,
        onNavigationAttemptWhileLocked,
        getPageLifecycle,
        isControlled,
        startPeekIfNeeded,
        unloadInactivePagesIfNeeded,
      ]
    );

    const navigateAtBoundary = useCallback((
      direction: FocusDirection,
      nextPage: number,
      eventTarget: EventTarget | null,
      event: Pick<Event, 'preventDefault' | 'stopPropagation'>,
      consumeAtPagerEdge: boolean,
    ): boolean => {
      const idx = internalIndexRef.current;
      const pageEl = pageRefs.current[idx];
      const targetElement =
        eventTarget instanceof HTMLElement ? eventTarget : null;
      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const focusSource =
        targetElement && pageEl?.contains(targetElement)
          ? targetElement
          : activeElement && pageEl?.contains(activeElement)
            ? activeElement
            : null;

      const canMoveFocusWithinPage =
        pageEl &&
        focusSource &&
        hasFocusableInDirection(focusSource, pageEl, direction);
      if (canMoveFocusWithinPage) {
        return false;
      }

      if (nextPage >= 0 && nextPage < pageCount) {
        event.preventDefault();
        event.stopPropagation();
        if (focusSource != null) {
          dispatchFocusNavigationHandled(focusSource);
        }
        showPage(nextPage, true, true);
        return true;
      }

      if (consumeAtPagerEdge && pageEl && focusSource) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }

      return false;
    }, [pageCount, showPage]);

    const handleInvalidFocusDirectionCapture = useCallback((event: Event) => {
      const containerEl = containerRef.current;
      if (containerEl == null || !isKeyboardReachable(containerEl)) {
        return;
      }

      const direction = directionFromInvalidFocusEvent(event);
      if (direction == null) {
        return;
      }

      const idx = internalIndexRef.current;
      const nextPage = getNextPageForFocusDirection({
        direction,
        internalIndex: idx,
        orientation,
      });
      if (nextPage == null) {
        return;
      }

      navigateAtBoundary(
        direction,
        nextPage,
        event.target,
        event,
        false,
      );
    }, [navigateAtBoundary, orientation]);

    useEffect(() => {
      const containerEl = containerRef.current;
      if (containerEl == null) {
        return;
      }

      containerEl.addEventListener(
        INVALID_FOCUS_DIRECTION_EVENT,
        handleInvalidFocusDirectionCapture,
        true,
      );
      return () => {
        containerEl.removeEventListener(
          INVALID_FOCUS_DIRECTION_EVENT,
          handleInvalidFocusDirectionCapture,
          true,
        );
      };
    }, [handleInvalidFocusDirectionCapture]);

    // Sync explicit controlled updates through the normal lifecycle path. When
    // the page set changes, re-resolve the controlled index against the pages
    // that now exist.
    useLayoutEffect(() => {
      const currentInternal = internalIndexRef.current;
      const previousControlledIndex = previousControlledIndexRef.current;
      const previousPageCount = previousPageCountRef.current;
      const pageCountChanged = pageCount !== previousPageCount;
      const controlledIndexChanged = !Object.is(
        controlledIndex,
        previousControlledIndex,
      );
      previousControlledIndexRef.current = controlledIndex;
      previousPageCountRef.current = pageCount;

      if (controlledIndexChanged || pageCountChanged) {
        pendingControlledIndexRef.current = resolvePageIndex(
          isControlled ? controlledIndex : currentInternal,
          pageCount,
        );
        if (
          controlledIndexChanged &&
          pendingControlledBackIndexRef.current != null &&
          pendingControlledIndexRef.current !== pendingControlledBackIndexRef.current
        ) {
          clearPendingControlledBack();
        }
      }

      if (pageCount === 0) {
        if (currentInternal === INVALID_PAGE_INDEX) {
          return;
        }
        if (animationTimerRef.current != null) {
          clearTimeout(animationTimerRef.current);
          animationTimerRef.current = null;
        }
        clearPeekTimers();
        pendingFocusRequestRef.current = null;
        internalIndexRef.current = INVALID_PAGE_INDEX;
        setIsTransitioning(false);
        setPeekState(null);
        setPageState({
          index: INVALID_PAGE_INDEX,
          prevIndex: INVALID_PAGE_INDEX,
        });
        return;
      }

      let targetIndex = currentInternal;
      let notifyPageChange = false;
      const pendingControlledIndex = pendingControlledIndexRef.current;
      if (pendingControlledIndex != null) {
        targetIndex = pendingControlledIndex;
        notifyPageChange =
          !controlledIndexChanged &&
          previousPageCount > 0 &&
          (currentInternal < 0 || currentInternal >= pageCount);
      }

      if (targetIndex !== currentInternal) {
        showPage(
          targetIndex,
          animatedRef.current,
          true,
          pendingControlledBackIndexRef.current === targetIndex,
          true,
          notifyPageChange,
          pageCountChanged,
        );
      }
      if (internalIndexRef.current === targetIndex) {
        pendingControlledIndexRef.current = null;
        if (pendingControlledBackIndexRef.current === targetIndex) {
          clearPendingControlledBack();
        }
      }
    }, [clearPeekTimers, clearPendingControlledBack, controlledIndex, isControlled, pageCount, showPage]);

    /**
     * Whether Back should take this Pager to its home page.
     *
     * The three Back paths share this test but deliberately read the current
     * page from different sources: the key handler and `handleBackToHome` use
     * the live ref, so a key pressed mid-transition is judged against the page
     * actually showing, while the transient registration keys off render state
     * so it re-registers when the page changes. Collapsing them onto one source
     * would change one of the two, so only the test itself is shared.
     */
    const canNavigateBackToHome = useCallback(
      (pageIndex: number): boolean =>
        useBackButtonForHome &&
        homeIndex !== INVALID_PAGE_INDEX &&
        pageIndex !== homeIndex,
      [homeIndex, useBackButtonForHome],
    );

    const handleBackToHome = useCallback((): boolean => {
      const idx = internalIndexRef.current;
      if (!canNavigateBackToHome(idx)) {
        return false;
      }
      const containerEl = containerRef.current;
      if (containerEl == null || !isKeyboardReachable(containerEl)) {
        // Registration already follows reachability, so this only fires when
        // a Back press races the observer update. Repair the registration
        // for the next press instead of driving an off-screen pager.
        setIsBackReachable(false);
        return false;
      }
      if (getPageLifecycle(idx).onWillInterceptBack?.() === true) {
        return false;
      }
      if (isControlled) {
        if (pendingControlledBackTimerRef.current != null) {
          clearTimeout(pendingControlledBackTimerRef.current);
        }
        pendingControlledBackIndexRef.current = homeIndex;
        // A controlled owner confirms by applying the requested index, but it
        // may also reject the request or never respond. An owner that applies a
        // different index clears this marker directly; this timer is the
        // backstop for an owner that never answers, so an ignored request
        // cannot linger and misclassify a later unrelated navigation to home as
        // a Back navigation for initial-focus direction.
        pendingControlledBackTimerRef.current = setTimeout(() => {
          pendingControlledBackTimerRef.current = null;
          pendingControlledBackIndexRef.current = null;
        }, PENDING_CONTROLLED_BACK_TIMEOUT_MS);
      }
      const didNavigate = showPage(homeIndex, true, true, true);
      if (!didNavigate) {
        clearPendingControlledBack();
      }
      // A controlled owner may apply the requested index later or reject it.
      // Keep the transient entry armed until the controlled value actually
      // reaches home so browser Back cannot escape the enclosing route.
      return didNavigate && !isControlled;
    }, [
      canNavigateBackToHome,
      clearPendingControlledBack,
      getPageLifecycle,
      homeIndex,
      isControlled,
      showPage,
    ]);

    useTransientBackNavigation(
      canNavigateBackToHome(internalIndex) && isBackReachable === true
        ? handleBackToHome
        : undefined,
      null,
      {
        focusRootRef: containerRef,
        // Pager already scopes keyboard Back aliases to its reachable subtree.
        handleEscape: false,
        // Pager owns page focus; restoring the captured non-home focus would
        // race the home page's initial-focus request during disarm.
        restoreFocus: false,
      },
    );

    /**
     * Handle keyboard navigation.
     *
     * Horizontal: Left/Right arrows
     * Vertical: Up/Down arrows
     * Both: shared Back aliases for back-to-home
     */
    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
          return;
        }

        const containerEl = containerRef.current;
        if (containerEl == null || !isKeyboardReachable(containerEl)) {
          return;
        }

        const idx = internalIndexRef.current;

        if (
          isBackNavigationKey(event) &&
          !event.repeat &&
          canNavigateBackToHome(idx)
        ) {
          event.preventDefault();
          event.stopPropagation();
          handleBackToHome();
          return;
        }

        // Directional navigation
        if (orientation === PagerOrientation.HORIZONTAL) {
          if (event.key === 'ArrowLeft') {
            navigateAtBoundary('left', idx - 1, event.target, event, true);
          } else if (event.key === 'ArrowRight') {
            navigateAtBoundary('right', idx + 1, event.target, event, true);
          }
        } else {
          if (event.key === 'ArrowUp') {
            navigateAtBoundary('up', idx - 1, event.target, event, true);
          } else if (event.key === 'ArrowDown') {
            navigateAtBoundary('down', idx + 1, event.target, event, true);
          }
        }
      },
      [
        orientation,
        homeIndex,
        useBackButtonForHome,
        handleBackToHome,
        navigateAtBoundary,
        onKeyDown,
      ]
    );

    /**
     * Calculate page styles for each page.
     *
     * For the current page: fully visible, no translation
     * For adjacent pages: translated off-screen, faded out
     * During transitions: CSS transitions handle the animation
     */
    const getPageStyle = useCallback(
      (pageIndex: number) => {
        const resolvedContainerSize = containerSize ??
          getContainerSizeForOrientation(containerRef.current, orientation);

        const pageStyle = getPagerPageStyle({
          orientation,
          internalIndex,
          pageIndex,
          containerSize: resolvedContainerSize,
          peekState,
        });

        const peekTransition =
          peekState != null &&
          (pageIndex === peekState.outgoingIndex || pageIndex === peekState.incomingIndex)
            ? `transform ${
                peekState.phase === 'peek' ? PEEK_OUT_MS : PEEK_RESTORE_MS
              }ms cubic-bezier(0.0, 0.0, 0.2, 1), opacity ${
                peekState.phase === 'peek' ? PEEK_OUT_MS : PEEK_RESTORE_MS
              }ms cubic-bezier(0.0, 0.0, 0.2, 1)`
            : undefined;

        return {
          ...pageStyle,
          transition: peekTransition,
        };
      },
      [orientation, internalIndex, containerSize, peekState]
    );

    // Container class
    const containerClassName = useMemo(
      () => [styles.pager, className]
        .filter(Boolean)
        .join(' '),
      [className],
    );
    useImperativeHandle(
      ref,
      (): PagerHandle => ({
        preloadPageIfNeeded: (index: number) => {
          if (index < 0 || index >= pageCount) {
            return;
          }
          setForcedUnloadIndices(prev => {
            if (!prev.has(index)) {
              return prev;
            }
            const next = new Set(prev);
            next.delete(index);
            return next;
          });
          unloadedPageIndicesRef.current.delete(index);
          setForcedPreloadIndices(prev => {
            if (prev.has(index)) {
              return prev;
            }
            const next = new Set(prev);
            next.add(index);
            return next;
          });
        },
        unloadPage: (index: number) => {
          if (
            index < 0 ||
            index >= pageCount ||
            index === internalIndexRef.current
          ) {
            throw new Error(
              'Invalid page index or page is currently being displayed.',
            );
          }
          if (
            pageRefs.current[index] != null &&
            !unloadedPageIndicesRef.current.has(index)
          ) {
            getPageLifecycle(index).onWillUnloadPage?.();
            unloadedPageIndicesRef.current.add(index);
          }
          setForcedPreloadIndices(prev => {
            if (!prev.has(index)) {
              return prev;
            }
            const next = new Set(prev);
            next.delete(index);
            return next;
          });
          setForcedUnloadIndices(prev => {
            if (prev.has(index)) {
              return prev;
            }
            const next = new Set(prev);
            next.add(index);
            return next;
          });
        },
        isNavigationLocked: () => navigationLocked,
        pageCount: () => pageCount,
        isPageTransitionInProgress: () => isTransitioning,
      }),
      [getPageLifecycle, isTransitioning, navigationLocked, pageCount],
    );

    return (
      <div
        {...rest}
        ref={containerRef}
        className={containerClassName}
        style={style}
        tabIndex={tabIndex}
        role={role ?? 'region'}
        aria-label={standardAriaLabel ?? ariaLabel ?? 'Page viewer'}
        aria-roledescription={ariaRoleDescription ?? 'carousel'}
        data-orientation={orientation}
        data-current-page={internalIndex}
        data-page-count={pageCount}
        data-transitioning={isTransitioning ? 'true' : 'false'}
        data-navigation-locked={navigationLocked ? 'true' : 'false'}
        data-peeking={peekState != null ? 'true' : 'false'}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
      >
        <PagerPages
          pages={pages}
          pageRefs={pageRefs}
          internalIndex={internalIndex}
          pageCount={pageCount}
          isTransitioning={isTransitioning}
          previousIndex={pageState.prevIndex}
          orientation={orientation}
          peekState={peekState}
          getPageStyle={getPageStyle}
          unmountInactivePages={unmountInactivePages}
          forcedPreloadIndices={forcedPreloadIndices}
          forcedUnloadIndices={forcedUnloadIndices}
        />
      </div>
    );
  }
));
