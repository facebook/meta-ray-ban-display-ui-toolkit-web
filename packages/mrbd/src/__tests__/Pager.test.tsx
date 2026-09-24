/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Pager tests
 *
 * Paginated container with horizontal/vertical orientation, spring transitions,
 * arrow key navigation, and back button to home page.
 */

import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  StrictMode,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  NavigationDirection,
  Pager,
  PagerOrientation,
  PagerPage,
  usePagerPageLifecycle,
} from '@wearables-ui-toolkit/foundation/components/Pager';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { preserveFocusedInteractableDuringNavigation } from '@wearables-ui-toolkit/foundation/navigation/FocusRetention';
import type { PagerHandle } from '@wearables-ui-toolkit/foundation/components/Pager';
import {
  FOCUS_NAVIGATION_HANDLED_EVENT,
  INVALID_FOCUS_DIRECTION_EVENT,
} from '@wearables-ui-toolkit/foundation/base/FocusNavigationEvents';

function mockVisibleRect(
  element: HTMLElement,
  rect: Partial<DOMRect> = {},
): void {
  const left = rect.left ?? 0;
  const top = rect.top ?? 0;
  const width = rect.width ?? 100;
  const height = rect.height ?? 100;
  element.getBoundingClientRect = () =>
    ({
      left,
      top,
      right: rect.right ?? left + width,
      bottom: rect.bottom ?? top + height,
      width,
      height,
    }) as DOMRect;
}

describe('Pager initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Pager>
        <div>Page 1</div>
      </Pager>
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('forwards a working PagerHandle to a callback ref', () => {
    const ref = vi.fn();

    render(
      <Pager ref={ref}>
        <div>Page 1</div>
        <div>Page 2</div>
      </Pager>,
    );

    const handle = ref.mock.calls[ref.mock.calls.length - 1]?.[0] as PagerHandle;
    // Exercise the handle obtained through the callback ref to prove it is the
    // live imperative handle, not just an object with the right shape.
    expect(handle.pageCount()).toBe(2);
    expect(handle.isPageTransitionInProgress()).toBe(false);
  });

  it('renders first page by default', () => {
    const { container } = render(
      <Pager>
        <div data-testid="p1">Page 1</div>
        <div data-testid="p2">Page 2</div>
      </Pager>
    );
    expect(container.textContent).toContain('Page 1');
  });

  it('renders specified page index', () => {
    render(
      <Pager currentPageIndex={1}>
        <div>Page 1</div>
        <div data-testid="p2">Page 2</div>
      </Pager>
    );
    expect(screen.getByTestId('p2')).toBeInTheDocument();
  });

  it('normalizes invalid initial indexes to the nearest real page', () => {
    const { container, rerender } = render(
      <Pager currentPageIndex={-10}>
        <div>First page</div>
        <div>Last page</div>
      </Pager>,
    );
    const pager = container.querySelector('[data-page-count="2"]');

    expect(pager).toHaveAttribute('data-current-page', '0');
    expect(container.querySelector('[data-page-index="0"]')).toHaveAttribute(
      'aria-hidden',
      'false',
    );

    rerender(
      <Pager currentPageIndex={20}>
        <div>First page</div>
        <div>Last page</div>
      </Pager>,
    );
    expect(pager).toHaveAttribute('data-current-page', '1');
  });

  it('uses valid carousel semantics and standard ARIA prop precedence', () => {
    const { rerender } = render(
      <Pager aria-label="Standard label" ariaLabel="Legacy label">
        <div>Page content</div>
      </Pager>,
    );

    const pager = screen.getByRole('region', { name: 'Standard label' });
    expect(pager).toHaveAttribute('aria-roledescription', 'carousel');

    rerender(
      <Pager aria-label="Custom group" role="group">
        <div>Page content</div>
      </Pager>,
    );
    expect(screen.getByRole('group', { name: 'Custom group' })).toBe(pager);
  });

  it('runs a consumer key handler before internal navigation', () => {
    const handleKeyDown = vi.fn((event: ReactKeyboardEvent) => {
      event.preventDefault();
    });
    const { container } = render(
      <Pager
        currentPageIndex={1}
        homeIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div>Home</div>
        <div>Current</div>
      </Pager>,
    );
    const pager = screen.getByRole('region', { name: 'Page viewer' });

    fireEvent.keyDown(pager, { key: 'Escape' });

    expect(handleKeyDown).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-page-count="2"]')).toHaveAttribute(
      'data-current-page',
      '1',
    );
  });

  it('reconciles a removed current page to the nearest surviving index', () => {
    const handlePageChange = vi.fn();
    const renderPager = (pageCount: number) => (
      <Pager currentPageIndex={2} onPageChange={handlePageChange}>
        {Array.from({ length: pageCount }, (_, index) => (
          <div key={index}>Page {index + 1}</div>
        ))}
      </Pager>
    );
    const view = render(renderPager(3));

    view.rerender(renderPager(2));

    expect(view.container.querySelector('[data-page-count="2"]')).toHaveAttribute(
      'data-current-page',
      '1',
    );
    expect(handlePageChange).toHaveBeenCalledWith(1, 2, true);
  });

  it('reconciles a removed current page even while navigation is locked', () => {
    const handleLockedAttempt = vi.fn();
    const renderPager = (pageCount: number) => (
      <Pager
        currentPageIndex={2}
        navigationLocked
        onNavigationAttemptWhileLocked={handleLockedAttempt}
      >
        {Array.from({ length: pageCount }, (_, index) => (
          <div key={index}>Locked page {index + 1}</div>
        ))}
      </Pager>
    );
    const view = render(renderPager(3));

    view.rerender(renderPager(2));

    expect(view.container.querySelector('[data-page-count="2"]')).toHaveAttribute(
      'data-current-page',
      '1',
    );
    expect(handleLockedAttempt).not.toHaveBeenCalled();
  });

  it('continues to lock explicit controlled updates when page count is stable', () => {
    const handleLockedAttempt = vi.fn();
    const view = render(
      <Pager
        currentPageIndex={0}
        navigationLocked
        onNavigationAttemptWhileLocked={handleLockedAttempt}
      >
        <div>Locked first page</div>
        <div>Locked second page</div>
      </Pager>,
    );

    view.rerender(
      <Pager
        currentPageIndex={1}
        navigationLocked
        onNavigationAttemptWhileLocked={handleLockedAttempt}
      >
        <div>Locked first page</div>
        <div>Locked second page</div>
      </Pager>,
    );

    expect(view.container.querySelector('[data-page-count="2"]')).toHaveAttribute(
      'data-current-page',
      '0',
    );
    expect(handleLockedAttempt).toHaveBeenCalledTimes(1);

    view.rerender(
      <Pager currentPageIndex={1} navigationLocked={false}>
        <div>Locked first page</div>
        <div>Locked second page</div>
      </Pager>,
    );
    expect(view.container.querySelector('[data-page-count="2"]')).toHaveAttribute(
      'data-current-page',
      '1',
    );
  });

  it('honors a controlled index when page growth makes it available', () => {
    const renderPager = (pageCount: number) => (
      <Pager currentPageIndex={2}>
        {Array.from({ length: pageCount }, (_, index) => (
          <div key={index}>Growing page {index + 1}</div>
        ))}
      </Pager>
    );
    const view = render(renderPager(2));
    expect(view.container.querySelector('[data-page-count="2"]')).toHaveAttribute(
      'data-current-page',
      '1',
    );

    view.rerender(renderPager(3));

    expect(view.container.querySelector('[data-page-count="3"]')).toHaveAttribute(
      'data-current-page',
      '2',
    );
  });

  it('uses the invalid sentinel internally while empty and restores a real page', () => {
    const handlePageChange = vi.fn();
    const view = render(
      <Pager currentPageIndex={1} onPageChange={handlePageChange} />,
    );

    expect(view.container.querySelector('[data-page-count="0"]')).toHaveAttribute(
      'data-current-page',
      '-1',
    );

    view.rerender(
      <Pager currentPageIndex={1} onPageChange={handlePageChange}>
        <div>Only page</div>
      </Pager>,
    );
    expect(view.container.querySelector('[data-page-count="1"]')).toHaveAttribute(
      'data-current-page',
      '0',
    );
    expect(handlePageChange).not.toHaveBeenCalled();
  });

  it('lets mounted page content handle the initial START focus request', () => {
    const requestInitialFocus = vi.fn(() => {
      screen.getByText('Initial target').focus();
      return true;
    });

    function InitialPage() {
      usePagerPageLifecycle({ onRequestInitialFocus: requestInitialFocus });
      return <button>Initial target</button>;
    }

    render(
      <Pager currentPageIndex={1} requestInitialFocusOnMount>
        <button>Other page</button>
        <InitialPage />
      </Pager>,
    );

    expect(requestInitialFocus).toHaveBeenCalledWith({
      direction: NavigationDirection.START,
      pageIndex: 1,
      previousPageIndex: -1,
    });
    expect(document.activeElement).toBe(screen.getByText('Initial target'));
  });

  it('delegates focus from the pager surface into the current page', () => {
    const requestInitialFocus = vi.fn(() => {
      screen.getByText('Current target').focus();
      return true;
    });

    function CurrentPage() {
      usePagerPageLifecycle({ onRequestInitialFocus: requestInitialFocus });
      return <button>Current target</button>;
    }

    render(
      <Pager aria-label="Outer pages">
        <CurrentPage />
      </Pager>,
    );

    screen.getByRole('region', { name: 'Outer pages' }).focus();

    expect(requestInitialFocus).toHaveBeenCalledWith({
      direction: NavigationDirection.START,
      pageIndex: 0,
      previousPageIndex: -1,
    });
    expect(document.activeElement).toBe(screen.getByText('Current target'));
  });

  it('delegates focus through nested pager surfaces to the leaf target', () => {
    render(
      <Pager aria-label="Outer pages">
        <Pager aria-label="Inner pages">
          <button>Leaf target</button>
        </Pager>
      </Pager>,
    );

    const outerPager = screen.getByRole('region', { name: 'Outer pages' });
    const innerPager = screen.getByRole('region', { name: 'Inner pages' });
    const leafTarget = screen.getByText('Leaf target');
    [
      outerPager,
      innerPager,
      leafTarget,
      ...screen.getAllByRole('group'),
    ].forEach(element => mockVisibleRect(element));

    outerPager.focus();

    expect(document.activeElement).toBe(leafTarget);
  });

  it('uses viewport width as the initial horizontal size before measurement', () => {
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 800,
    });

    try {
      render(
        <Pager currentPageIndex={0}>
          <div>Page 1</div>
          <div>Page 2</div>
        </Pager>,
      );

      const hiddenPage = screen
        .getAllByRole('group', { hidden: true })
        .find(element => element.getAttribute('aria-label') === 'Page 2 of 2');
      expect(hiddenPage).toBeDefined();
      expect(hiddenPage)
        .toHaveStyle({ transform: 'translate(750px, 0px)' });
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalInnerWidth,
      });
    }
  });
});

describe('Pager imperative handle', () => {
  it('reports pageCount, navigation lock, and transition state', () => {
    const ref = { current: null as PagerHandle | null };

    render(
      <Pager ref={ref} navigationLocked>
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </Pager>,
    );

    expect(ref.current?.pageCount()).toBe(3);
    expect(ref.current?.isNavigationLocked()).toBe(true);
    expect(ref.current?.isPageTransitionInProgress()).toBe(false);
  });

  it('isNavigationLocked reflects prop changes', () => {
    const ref = { current: null as PagerHandle | null };

    function Wrapper({ locked }: { locked: boolean }) {
      return (
        <Pager ref={ref} navigationLocked={locked}>
          <div>Page 1</div>
          <div>Page 2</div>
        </Pager>
      );
    }

    const { rerender } = render(<Wrapper locked={false} />);
    expect(ref.current?.isNavigationLocked()).toBe(false);

    rerender(<Wrapper locked />);
    expect(ref.current?.isNavigationLocked()).toBe(true);
  });

  it('preloadPageIfNeeded force-mounts an inactive page under unmountInactivePages', () => {
    const ref = { current: null as PagerHandle | null };

    render(
      <Pager ref={ref} unmountInactivePages>
        <div data-testid="p1">Page 1</div>
        <div data-testid="p2">Page 2</div>
        <div data-testid="p3">Page 3</div>
      </Pager>,
    );

    // Inactive pages are unmounted by default with unmountInactivePages.
    expect(screen.queryByTestId('p3')).toBeNull();

    act(() => {
      ref.current?.preloadPageIfNeeded(2);
    });

    expect(screen.getByTestId('p3')).toBeInTheDocument();
  });

  it('preloadPageIfNeeded is a no-op for out-of-range indices', () => {
    const ref = { current: null as PagerHandle | null };

    render(
      <Pager ref={ref} unmountInactivePages>
        <div data-testid="p1">Page 1</div>
        <div data-testid="p2">Page 2</div>
      </Pager>,
    );

    act(() => {
      ref.current?.preloadPageIfNeeded(-1);
      ref.current?.preloadPageIfNeeded(5);
    });

    expect(screen.queryByTestId('p2')).toBeNull();
  });

  it('unloadPage unmounts a preloaded inactive page and fires onWillUnloadPage', () => {
    const ref = { current: null as PagerHandle | null };
    const onWillUnloadPage = vi.fn();

    render(
      <Pager ref={ref} unmountInactivePages>
        <div data-testid="p1">Page 1</div>
        <PagerPage onWillUnloadPage={onWillUnloadPage}>
          <div data-testid="p2">Page 2</div>
        </PagerPage>
      </Pager>,
    );

    act(() => {
      ref.current?.preloadPageIfNeeded(1);
    });
    expect(screen.getByTestId('p2')).toBeInTheDocument();

    act(() => {
      ref.current?.unloadPage(1);
    });

    expect(screen.queryByTestId('p2')).toBeNull();
    expect(onWillUnloadPage).toHaveBeenCalledTimes(1);
  });

  it('unloadPage throws for the current page and out-of-range indices', () => {
    const ref = { current: null as PagerHandle | null };

    render(
      <Pager ref={ref}>
        <div>Page 1</div>
        <div>Page 2</div>
      </Pager>,
    );

    expect(() => {
      act(() => {
        ref.current?.unloadPage(0);
      });
    }).toThrow();
    expect(() => {
      act(() => {
        ref.current?.unloadPage(5);
      });
    }).toThrow();
  });
});

describe('Pager navigation', () => {
  function InterruptiblePager({
    onPageChange,
    orientation = PagerOrientation.HORIZONTAL,
  }: {
    onPageChange: (newIndex: number, previousIndex: number, animated: boolean) => void;
    orientation?: PagerOrientation;
  }) {
    return (
      <Pager
        ariaLabel="Interruptible pager"
        defaultPageIndex={1}
        onPageChange={onPageChange}
        orientation={orientation}
      >
        <div>{orientation === PagerOrientation.HORIZONTAL ? 'Left page' : 'Top page'}</div>
        <button>Center action</button>
        <div>{orientation === PagerOrientation.HORIZONTAL ? 'Right page' : 'Bottom page'}</div>
      </Pager>
    );
  }

  it('calls onPageChange on navigation', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Pager currentPageIndex={0} onPageChange={handleChange}>
        <div>Page 1</div>
        <div>Page 2</div>
      </Pager>
    );
    fireEvent.keyDown(container.firstElementChild!, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalled();
  });

  it('does not navigate when locked', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Pager currentPageIndex={0} onPageChange={handleChange} navigationLocked>
        <div>Page 1</div>
        <div>Page 2</div>
      </Pager>
    );
    fireEvent.keyDown(container.firstElementChild!, { key: 'ArrowRight' });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('does not go before first page', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Pager currentPageIndex={0} onPageChange={handleChange}>
        <div>Page 1</div>
        <div>Page 2</div>
      </Pager>
    );
    fireEvent.keyDown(container.firstElementChild!, { key: 'ArrowLeft' });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('keeps child focus when directional navigation is invalid at a page boundary', () => {
    const handleChange = vi.fn();
    render(
      <Pager
        currentPageIndex={0}
        onPageChange={handleChange}
        orientation={PagerOrientation.VERTICAL}
      >
        <button>Top page action</button>
        <button>Next page action</button>
      </Pager>
    );

    const button = screen.getByText('Top page action');
    button.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    });

    const dispatched = button.dispatchEvent(event);

    expect(dispatched).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(button);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('pages when a focused descendant reports invalid direction at a page boundary', () => {
    const handled = vi.fn();
    render(
      <Pager defaultPageIndex={0}>
        <button>Current action</button>
        <button>Next action</button>
      </Pager>
    );

    const current = screen.getByText('Current action');
    current.addEventListener(FOCUS_NAVIGATION_HANDLED_EVENT, handled);
    current.focus();

    act(() => {
      current.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'right' },
        }),
      );
    });

    expect(screen.getByRole('group', { name: 'Page 2 of 2' })).toHaveAttribute(
      'aria-hidden',
      'false',
    );
    expect(handled).toHaveBeenCalledTimes(1);
  });

  it('ignores key events while hidden by an inactive parent page', () => {
    const handleChange = vi.fn();
    render(
      <Pager
        currentPageIndex={0}
        onPageChange={handleChange}
        orientation={PagerOrientation.VERTICAL}
        style={{ visibility: 'hidden' }}
      >
        <button>Hidden page action</button>
        <button>Hidden next action</button>
      </Pager>
    );

    const button = screen.getByText('Hidden page action');
    button.focus();
    fireEvent.keyDown(button, { key: 'ArrowDown' });

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('ignores key events while inside an aria-hidden inactive parent page', () => {
    const handleChange = vi.fn();
    render(
      <div aria-hidden="true">
        <Pager
          currentPageIndex={0}
          onPageChange={handleChange}
          orientation={PagerOrientation.VERTICAL}
        >
          <button>Inactive page action</button>
          <button>Inactive next action</button>
        </Pager>
      </div>
    );

    const button = screen.getByText('Inactive page action');
    button.focus();
    fireEvent.keyDown(button, { key: 'ArrowDown' });

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('moves focus to the active page wrapper before the next paint when the new page has no focusable child', () => {
    render(
      <Pager defaultPageIndex={0}>
        <button>Current action</button>
        <div>Static page</div>
      </Pager>
    );

    const button = screen.getByText('Current action');
    const staticPage = screen.getByLabelText('Page 2 of 2');

    button.focus();
    fireEvent.keyDown(button, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(staticPage);
  });

  it('keeps one-step reverse navigation after the browser focuses its root on an empty page', async () => {
    let stopPreservingFocus: (() => void) | null = null;

    function ControlledVerticalPager() {
      const [pageIndex, setPageIndex] = useState(1);
      return (
        <div data-testid="browser-root" tabIndex={-1}>
          <Pager
            ariaLabel="History-backed vertical pager"
            currentPageIndex={pageIndex}
            onPageChange={(nextPageIndex) => {
              stopPreservingFocus?.();
              stopPreservingFocus =
                preserveFocusedInteractableDuringNavigation();
              setPageIndex(nextPageIndex);
            }}
            orientation={PagerOrientation.VERTICAL}
            useBackButtonForHome={false}
          >
            <div>Static upper page</div>
            <Container onClick={() => {}}>Current action</Container>
          </Pager>
        </div>
      );
    }

    render(<ControlledVerticalPager />);
    const pager = screen.getByRole('region', {
      name: 'History-backed vertical pager',
    });
    const current = screen.getByRole('button', { name: 'Current action' });
    const browserRoot = screen.getByTestId('browser-root');

    try {
      act(() => {
        current.focus();
        fireEvent.keyDown(current, { key: 'ArrowUp' });
      });

      const upperPage = screen.getByRole('group', { name: 'Page 1 of 2' });
      expect(pager).toHaveAttribute('data-current-page', '0');
      expect(document.activeElement).toBe(upperPage);

      await act(async () => {
        browserRoot.focus();
        await Promise.resolve();
      });

      expect(document.activeElement).toBe(upperPage);

      fireEvent.keyDown(upperPage, { key: 'ArrowDown' });

      expect(pager).toHaveAttribute('data-current-page', '1');
    } finally {
      stopPreservingFocus?.();
    }
  });

  it('restarts the retention window when a late owner claim retargets it', async () => {
    // Retargeting restarts the per-target window ON PURPOSE: without it, an
    // owner claimed near the tail of the hold is killed by the previous
    // target's already-pending expiry, which was a real on-device bug.
    //
    // The restart is bounded — see `NAVIGATION_FOCUS_RETENTION_MAX_MS` in
    // FocusCoordinator — so it cannot roll forward indefinitely under
    // continuous keyboard navigation. If you are here because a reviewer asked
    // for a strict `hold + 750ms` ceiling, that change reintroduces the bug
    // this test covers; the sibling test
    // `releases the hold at its bounded ceiling ...` pins the other half.
    vi.useFakeTimers();
    let stopPreservingFocus: (() => void) | null = null;

    function LateClaimingPager() {
      const [pageIndex, setPageIndex] = useState(1);
      return (
        <div data-testid="browser-root" tabIndex={-1}>
          <button onClick={() => setPageIndex(0)}>Navigate up</button>
          <Pager
            ariaLabel="Late-claiming vertical pager"
            currentPageIndex={pageIndex}
            orientation={PagerOrientation.VERTICAL}
            useBackButtonForHome={false}
          >
            <Container onClick={() => {}}>Upper action</Container>
            <Container onClick={() => {}}>Current action</Container>
          </Pager>
        </div>
      );
    }

    try {
      render(<LateClaimingPager />);
      const current = screen.getByRole('button', { name: 'Current action' });
      const navigate = screen.getByRole('button', { name: 'Navigate up' });
      const browserRoot = screen.getByTestId('browser-root');
      // The inactive page is aria-hidden, so it is outside the accessibility
      // tree until the Pager activates it — query by text rather than role.
      const upper = screen
        .getByText('Upper action')
        .closest('[role="button"]') as HTMLElement;
      // jsdom reports zero-size rects, and focus selection skips candidates
      // with no box — without this the Pager falls back to the page wrapper
      // (the structural retarget path) instead of claiming this owner.
      mockVisibleRect(screen.getByLabelText('Page 1 of 2'));
      mockVisibleRect(upper, { left: 10, top: 10, width: 80, height: 40 });

      act(() => {
        current.focus();
      });

      // The hold opens, but the destination page — which has its own focusable
      // owner, so the claim path rather than the structural retarget path runs
      // — only mounts near the tail of the window.
      stopPreservingFocus = preserveFocusedInteractableDuringNavigation();
      act(() => {
        vi.advanceTimersByTime(700);
      });

      act(() => {
        navigate.click();
      });

      expect(document.activeElement).toBe(upper);

      // Past the ORIGINAL deadline but inside the window the claim restarted.
      act(() => {
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        browserRoot.focus();
        await Promise.resolve();
      });

      expect(document.activeElement).toBe(upper);
    } finally {
      stopPreservingFocus?.();
      vi.useRealTimers();
    }
  });

  it('keeps the retention window alive when a late page swap retargets it', async () => {
    vi.useFakeTimers();
    let stopPreservingFocus: (() => void) | null = null;

    function LatePagingVerticalPager() {
      const [pageIndex, setPageIndex] = useState(1);
      return (
        <div data-testid="browser-root" tabIndex={-1}>
          <button onClick={() => setPageIndex(0)}>Navigate up</button>
          <Pager
            ariaLabel="Late-swapping vertical pager"
            currentPageIndex={pageIndex}
            orientation={PagerOrientation.VERTICAL}
            useBackButtonForHome={false}
          >
            <div>Static upper page</div>
            <Container onClick={() => {}}>Current action</Container>
          </Pager>
        </div>
      );
    }

    try {
      render(<LatePagingVerticalPager />);
      const current = screen.getByRole('button', { name: 'Current action' });
      const navigate = screen.getByRole('button', { name: 'Navigate up' });
      const browserRoot = screen.getByTestId('browser-root');

      act(() => {
        current.focus();
      });

      // A history-driven navigation opens the hold, but the page it reveals
      // only renders much later (lazy content, a slow frame). The retarget
      // therefore lands near the tail of the original window.
      stopPreservingFocus = preserveFocusedInteractableDuringNavigation();
      act(() => {
        vi.advanceTimersByTime(700);
      });

      act(() => {
        navigate.click();
      });

      const upperPage = screen.getByRole('group', { name: 'Page 1 of 2' });
      expect(document.activeElement).toBe(upperPage);

      // Past the ORIGINAL deadline, but inside the window the retarget opened.
      // Without the refresh the stale expiry fires here and the restore below
      // bails on an inactive retention, leaving the empty page unfocused.
      act(() => {
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        browserRoot.focus();
        await Promise.resolve();
      });

      expect(document.activeElement).toBe(upperPage);
    } finally {
      stopPreservingFocus?.();
      vi.useRealTimers();
    }
  });

  it('releases the hold at its bounded ceiling despite continuous claims', async () => {
    // The other half of the retargeting contract. The sibling tests above pin
    // "a late claim gets a usable window"; this one pins "the hold still ends".
    //
    // Restarting on every claim with no ceiling turns ordinary continuous
    // keyboard navigation into a rolling window: while it is armed, focus
    // parked on a non-focusable ancestor is treated as a boundary artifact and
    // restored, so content can never deliberately release focus. The cap is
    // NAVIGATION_FOCUS_RETENTION_MAX_MS (one extension, not unbounded).
    //
    // If you are here because this test failed after you removed the cap:
    // the cap is the fix, not the bug.
    vi.useFakeTimers();
    let stopPreservingFocus: (() => void) | null = null;

    try {
      render(
        <div data-testid="browser-root" tabIndex={-1}>
          <Container onClick={() => {}}>Rolling action</Container>
        </div>,
      );
      const action = screen.getByRole('button', { name: 'Rolling action' });
      const browserRoot = screen.getByTestId('browser-root');
      mockVisibleRect(action, { left: 10, top: 10, width: 80, height: 40 });

      act(() => {
        action.focus();
      });
      stopPreservingFocus = preserveFocusedInteractableDuringNavigation();

      // Continuous navigation: a genuine blur/refocus cycle every 300ms, which
      // is what drives `claimFocusedInteractable` and therefore the restart.
      // Re-calling focus() on an already-focused element fires no focus event
      // and claims nothing — an earlier version of this test did exactly that
      // and passed with the cap removed, proving nothing.
      for (let i = 0; i < 8; i += 1) {
        act(() => {
          vi.advanceTimersByTime(300);
        });
        act(() => {
          action.blur();
          action.focus();
        });
      }

      // Well past the ceiling: a deliberate release must now stand.
      await act(async () => {
        browserRoot.focus();
        await Promise.resolve();
      });

      expect(document.activeElement).not.toBe(action);
    } finally {
      stopPreservingFocus?.();
      vi.useRealTimers();
    }
  });

  it('moves focus to the first child before the next paint when the new page has one', () => {
    render(
      <Pager defaultPageIndex={0}>
        <button>Current action</button>
        <button>Next action</button>
      </Pager>
    );

    const current = screen.getByText('Current action');
    const next = screen.getByText('Next action');
    const nextPage = screen.getByLabelText('Page 2 of 2');
    nextPage.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
      }) as DOMRect;
    next.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 10,
        right: 90,
        bottom: 50,
        width: 80,
        height: 40,
      }) as DOMRect;

    current.focus();
    fireEvent.keyDown(current, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(next);
  });

  it('skips opted-out children when focusing the first child on a new page', () => {
    render(
      <Pager defaultPageIndex={0}>
        <button>Current action</button>
        <div>
          <button data-uit-initial-focus-excluded="true">
            Header tablist
          </button>
          <button>Content action</button>
        </div>
      </Pager>
    );

    const current = screen.getByText('Current action');
    const excluded = screen.getByText('Header tablist');
    const content = screen.getByText('Content action');
    const nextPage = screen.getByLabelText('Page 2 of 2');
    nextPage.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
      }) as DOMRect;
    excluded.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 10,
        right: 90,
        bottom: 50,
        width: 80,
        height: 40,
      }) as DOMRect;
    content.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 60,
        right: 90,
        bottom: 100,
        width: 80,
        height: 40,
      }) as DOMRect;

    current.focus();
    fireEvent.keyDown(current, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(content);
  });

  it('delegates initial focus to the page before falling back', () => {
    const requestInitialFocus = vi.fn(() => {
      screen.getByText('Custom target').focus();
      return true;
    });

    function DelegatingPager() {
      const [pageIndex, setPageIndex] = useState(1);

      return (
        <Pager
          ariaLabel="Delegating pager"
          currentPageIndex={pageIndex}
          onPageChange={(newIndex) => setPageIndex(newIndex)}
        >
          <button>Left page action</button>
          <button>Center action</button>
          <PagerPage onRequestInitialFocus={requestInitialFocus}>
            <div>
              <button>Fallback target</button>
              <button>Custom target</button>
            </div>
          </PagerPage>
        </Pager>
      );
    }

    render(<DelegatingPager />);

    const center = screen.getByText('Center action');
    center.focus();
    fireEvent.keyDown(center, { key: 'ArrowRight' });

    expect(requestInitialFocus).toHaveBeenCalledWith({
      direction: NavigationDirection.LEFT,
      pageIndex: 2,
      previousPageIndex: 1,
    });
    expect(document.activeElement).toBe(screen.getByText('Custom target'));
  });

  it('uses vertical entry directions for page focus requests', () => {
    const requestInitialFocus = vi.fn(() => true);

    function VerticalDelegatingPager() {
      const [pageIndex, setPageIndex] = useState(1);

      return (
        <Pager
          ariaLabel="Vertical delegating pager"
          currentPageIndex={pageIndex}
          onPageChange={(newIndex) => setPageIndex(newIndex)}
          orientation={PagerOrientation.VERTICAL}
        >
          <button>Top action</button>
          <button>Middle action</button>
          <PagerPage onRequestInitialFocus={requestInitialFocus}>
            <button>Bottom action</button>
          </PagerPage>
        </Pager>
      );
    }

    render(<VerticalDelegatingPager />);

    const middle = screen.getByText('Middle action');
    middle.focus();
    fireEvent.keyDown(middle, { key: 'ArrowDown' });

    expect(requestInitialFocus).toHaveBeenCalledWith({
      direction: NavigationDirection.UP,
      pageIndex: 2,
      previousPageIndex: 1,
    });
  });

  it('falls back to the first focusable child when the page does not handle focus', () => {
    const requestInitialFocus = vi.fn(() => false);

    render(
      <Pager defaultPageIndex={0}>
        <button>Current action</button>
        <PagerPage onRequestInitialFocus={requestInitialFocus}>
          <button>Fallback action</button>
        </PagerPage>
      </Pager>
    );

    const current = screen.getByText('Current action');
    const fallback = screen.getByText('Fallback action');
    const nextPage = screen.getByLabelText('Page 2 of 2');
    mockVisibleRect(nextPage);
    mockVisibleRect(fallback, { left: 10, top: 10, width: 80, height: 40 });

    current.focus();
    fireEvent.keyDown(current, { key: 'ArrowRight' });

    expect(requestInitialFocus).toHaveBeenCalled();
    expect(document.activeElement).toBe(fallback);
  });

  it('lets pages restore their own last focused child', () => {
    function PageOwnedRestoringPager() {
      const [pageIndex, setPageIndex] = useState(1);
      const lastFocusedElementRef = useRef<HTMLElement | null>(null);

      return (
        <Pager
          ariaLabel="Page-owned restoring pager"
          currentPageIndex={pageIndex}
          onPageChange={(newIndex) => setPageIndex(newIndex)}
        >
          <button>Left page action</button>
          <PagerPage
            onRequestInitialFocus={() => {
              lastFocusedElementRef.current?.focus({ preventScroll: true });
              return lastFocusedElementRef.current != null;
            }}
          >
            <div
              onFocusCapture={(event) => {
                if (event.target instanceof HTMLElement) {
                  lastFocusedElementRef.current = event.target;
                }
              }}
            >
              <button>Card 0</button>
              <button>Card 1</button>
              <button>Card 2</button>
            </div>
          </PagerPage>
          <button>Right page action</button>
        </Pager>
      );
    }

    render(<PageOwnedRestoringPager />);

    const lastCard = screen.getByText('Card 2');
    lastCard.focus();
    fireEvent.keyDown(lastCard, { key: 'ArrowRight' });

    expect(screen.getByLabelText('Page-owned restoring pager'))
      .toHaveAttribute('data-current-page', '2');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });

    expect(screen.getByLabelText('Page-owned restoring pager'))
      .toHaveAttribute('data-current-page', '1');
    expect(document.activeElement).toBe(lastCard);
  });

  it('runs page lifecycle callbacks for controlled currentPageIndex changes', () => {
    let setExternalPageIndex: ((index: number) => void) | null = null;
    const calls: string[] = [];
    const requestInitialFocus = vi.fn(() => true);

    function ControlledLifecyclePager() {
      const [pageIndex, setPageIndex] = useState(0);
      setExternalPageIndex = setPageIndex;

      return (
        <Pager
          ariaLabel="Externally controlled lifecycle pager"
          currentPageIndex={pageIndex}
        >
          <PagerPage
            onWillHidePage={() => calls.push('hide:0')}
            shouldPreventNavigation={() => true}
          >
            <button>Current action</button>
          </PagerPage>
          <PagerPage
            onRequestInitialFocus={requestInitialFocus}
            onWillShowPage={() => calls.push('show:1')}
          >
            <button>Next action</button>
          </PagerPage>
        </Pager>
      );
    }

    render(<ControlledLifecyclePager />);

    act(() => {
      setExternalPageIndex?.(1);
    });

    expect(screen.getByLabelText('Externally controlled lifecycle pager'))
      .toHaveAttribute('data-current-page', '1');
    expect(calls).toEqual(['hide:0', 'show:1']);
    expect(requestInitialFocus).toHaveBeenCalledWith({
      direction: NavigationDirection.LEFT,
      pageIndex: 1,
      previousPageIndex: 0,
    });
  });

  it('delivers page-owned show lifecycle after an inactive page mounts', () => {
    const handleShow = vi.fn();

    function DeferredPage() {
      const targetRef = useRef<HTMLButtonElement>(null);
      usePagerPageLifecycle({
        onWillShowPage: () => handleShow(targetRef.current),
      });
      return <button ref={targetRef}>Deferred action</button>;
    }

    render(
      <Pager unmountInactivePages>
        <button>Current action</button>
        <DeferredPage />
      </Pager>,
    );

    expect(screen.queryByText('Deferred action')).toBeNull();
    const current = screen.getByText('Current action');
    current.focus();
    fireEvent.keyDown(current, { key: 'ArrowRight' });

    const deferred = screen.getByText('Deferred action');
    expect(handleShow).toHaveBeenCalledTimes(1);
    expect(handleShow).toHaveBeenCalledWith(deferred);
  });

  it('lets the current page prevent navigation', () => {
    const handleChange = vi.fn();
    const handleBlockedNavigation = vi.fn();
    render(
      <Pager
        defaultPageIndex={0}
        onNavigationAttemptWhileLocked={handleBlockedNavigation}
        onPageChange={handleChange}
      >
        <PagerPage shouldPreventNavigation={() => true}>
          <button>Current action</button>
        </PagerPage>
        <button>Next action</button>
      </Pager>
    );

    const current = screen.getByText('Current action');
    current.focus();
    fireEvent.keyDown(current, { key: 'ArrowRight' });

    expect(handleChange).not.toHaveBeenCalled();
    expect(handleBlockedNavigation).not.toHaveBeenCalled();
  });

  it('keeps a controlled page authoritative when its owner rejects navigation', () => {
    const handleChange = vi.fn();
    render(
      <Pager currentPageIndex={0} onPageChange={handleChange}>
        <button>Current controlled action</button>
        <button>Next controlled action</button>
      </Pager>,
    );

    const current = screen.getByText('Current controlled action');
    current.focus();
    fireEvent.keyDown(current, { key: 'ArrowRight' });

    expect(handleChange).toHaveBeenCalledWith(1, 0, true);
    expect(screen.getByLabelText('Page viewer')).toHaveAttribute(
      'data-current-page',
      '0',
    );
  });

  it('allows reversing direction while a page transition is still running', () => {
    const handleChange = vi.fn();
    render(<InterruptiblePager onPageChange={handleChange} />);

    const pager = screen.getByLabelText('Interruptible pager');
    const center = screen.getByText('Center action');

    center.focus();
    fireEvent.keyDown(center, { key: 'ArrowLeft' });
    expect(pager).toHaveAttribute('data-current-page', '0');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });

    expect(pager).toHaveAttribute('data-current-page', '1');
    expect(handleChange).toHaveBeenNthCalledWith(1, 0, 1, true);
    expect(handleChange).toHaveBeenNthCalledWith(2, 1, 0, true);
  });

  it('pages correctly for two rapid directional inputs in the same render cycle', () => {
    const handleChange = vi.fn();
    render(<InterruptiblePager onPageChange={handleChange} />);

    const pager = screen.getByLabelText('Interruptible pager');
    const center = screen.getByText('Center action');

    center.focus();

    // Dispatch two directional inputs inside a single act batch so they both
    // run before React commits the first state update. The second input must
    // derive its current index from the synchronously-updated ref, not the
    // stale internalIndex state captured by handleKeyDown.
    act(() => {
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    });

    expect(pager).toHaveAttribute('data-current-page', '1');
    expect(handleChange).toHaveBeenNthCalledWith(1, 0, 1, true);
    expect(handleChange).toHaveBeenNthCalledWith(2, 1, 0, true);
  });

  it('allows reversing from the next horizontal page while a transition is still running', () => {
    const handleChange = vi.fn();
    render(<InterruptiblePager onPageChange={handleChange} />);

    const pager = screen.getByLabelText('Interruptible pager');
    const center = screen.getByText('Center action');

    center.focus();
    fireEvent.keyDown(center, { key: 'ArrowRight' });
    expect(pager).toHaveAttribute('data-current-page', '2');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });

    expect(pager).toHaveAttribute('data-current-page', '1');
    expect(handleChange).toHaveBeenNthCalledWith(1, 2, 1, true);
    expect(handleChange).toHaveBeenNthCalledWith(2, 1, 2, true);
  });

  it('allows reversing vertical page transitions while still running', () => {
    const handleChange = vi.fn();
    render(
      <InterruptiblePager
        onPageChange={handleChange}
        orientation={PagerOrientation.VERTICAL}
      />
    );

    const pager = screen.getByLabelText('Interruptible pager');
    const center = screen.getByText('Center action');

    center.focus();
    fireEvent.keyDown(center, { key: 'ArrowUp' });
    expect(pager).toHaveAttribute('data-current-page', '0');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });

    expect(pager).toHaveAttribute('data-current-page', '1');
    expect(handleChange).toHaveBeenNthCalledWith(1, 0, 1, true);
    expect(handleChange).toHaveBeenNthCalledWith(2, 1, 0, true);
  });

  it('can unmount inactive pages for expensive page content', () => {
    render(
      <Pager currentPageIndex={1} unmountInactivePages>
        <div data-testid="page-1">Page 1</div>
        <div data-testid="page-2">Page 2</div>
        <div data-testid="page-3">Page 3</div>
      </Pager>
    );

    expect(screen.queryByTestId('page-1')).toBeNull();
    expect(screen.getByTestId('page-2')).toBeInTheDocument();
    expect(screen.queryByTestId('page-3')).toBeNull();
  });

  it('keeps the outgoing page mounted until an animated transition settles', () => {
    vi.useFakeTimers();

    try {
      render(
        <Pager unmountInactivePages>
          <button>Current page action</button>
          <button>Next page action</button>
        </Pager>
      );

      const current = screen.getByText('Current page action');
      current.focus();
      fireEvent.keyDown(current, { key: 'ArrowRight' });

      expect(screen.getByText('Current page action')).toBeInTheDocument();
      expect(screen.getByText('Next page action')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(screen.queryByText('Current page action')).toBeNull();
      expect(screen.getByText('Next page action')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('calls onWillUnloadPage when inactive pages unmount after a transition', () => {
    vi.useFakeTimers();
    const handleUnload = vi.fn();

    try {
      render(
        <Pager unmountInactivePages>
          <PagerPage onWillUnloadPage={handleUnload}>
            <button>Current page action</button>
          </PagerPage>
          <button>Next page action</button>
        </Pager>
      );

      const current = screen.getByText('Current page action');
      current.focus();
      fireEvent.keyDown(current, { key: 'ArrowRight' });

      expect(handleUnload).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(handleUnload).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not report a false page unload during StrictMode effect replay', () => {
    vi.useFakeTimers();
    const handleUnload = vi.fn();

    try {
      const view = render(
        <StrictMode>
          <Pager unmountInactivePages>
            <PagerPage onWillUnloadPage={handleUnload}>
              <button>Strict current action</button>
            </PagerPage>
            <button>Strict next action</button>
          </Pager>
        </StrictMode>,
      );

      expect(handleUnload).not.toHaveBeenCalled();

      const current = screen.getByText('Strict current action');
      current.focus();
      fireEvent.keyDown(current, { key: 'ArrowRight' });
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(handleUnload).toHaveBeenCalledTimes(1);
      view.unmount();
      expect(handleUnload).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('calls onAnimationCompleted after the animated transition settles', () => {
    vi.useFakeTimers();
    const handleAnimationCompleted = vi.fn();

    try {
      render(
        <Pager>
          <button>Current page action</button>
          <PagerPage onAnimationCompleted={handleAnimationCompleted}>
            <button>Next page action</button>
          </PagerPage>
        </Pager>
      );

      const current = screen.getByText('Current page action');
      current.focus();
      fireEvent.keyDown(current, { key: 'ArrowRight' });

      expect(handleAnimationCompleted).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(399);
      });
      expect(handleAnimationCompleted).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(handleAnimationCompleted).toHaveBeenCalledWith({
        pageIndex: 1,
        previousPageIndex: 0,
      });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Pager back button', () => {
  it('Escape navigates to home when useBackButtonForHome', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Pager
        currentPageIndex={2}
        onPageChange={handleChange}
        useBackButtonForHome
        homeIndex={0}
      >
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </Pager>
    );
    fireEvent.keyDown(container.firstElementChild!, { key: 'Escape' });
    expect(handleChange).toHaveBeenCalled();
  });

  it.each(['Escape', 'Backspace', 'BrowserBack', 'GoBack'] as const)(
    '%s navigates to home inside the reachable subtree',
    key => {
      const handleChange = vi.fn();
      const { container } = render(
        <Pager
          currentPageIndex={2}
          onPageChange={handleChange}
          useBackButtonForHome
          homeIndex={0}
        >
          <div>Page 1</div>
          <div>Page 2</div>
          <div>Page 3</div>
        </Pager>,
      );
      fireEvent.keyDown(container.firstElementChild!, { key });
      expect(handleChange).toHaveBeenCalled();
    },
  );

  it('ignores Backspace typed in an editable without navigating', () => {
    const handleChange = vi.fn();
    render(
      <Pager
        currentPageIndex={2}
        onPageChange={handleChange}
        useBackButtonForHome
        homeIndex={0}
      >
        <div>Page 1</div>
        <div>Page 2</div>
        <div>
          Page 3<input aria-label="Pager search" />
        </div>
      </Pager>,
    );
    const editable = screen.getByLabelText('Pager search');
    fireEvent.keyDown(editable, { key: 'Backspace' });
    expect(handleChange).not.toHaveBeenCalled();

    fireEvent.keyDown(editable, { key: 'Escape' });
    expect(handleChange).toHaveBeenCalled();
  });

  it('browser Back navigates to home through transient history', () => {
    const handleChange = vi.fn();
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <Pager
        defaultPageIndex={2}
        onPageChange={handleChange}
        useBackButtonForHome
        homeIndex={0}
      >
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </Pager>,
    );

    try {
      expect(window.history.state.__uitTransientBackEntry).toEqual(
        expect.any(String),
      );
      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });

      expect(handleChange).toHaveBeenCalledWith(0, 2, true);
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('re-arms browser Back after returning home and leaving again', () => {
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <Pager defaultPageIndex={1} useBackButtonForHome homeIndex={0}>
        <button>Home action</button>
        <button>Detail action</button>
      </Pager>,
    );

    try {
      const firstEntry = window.history.state.__uitTransientBackEntry;
      expect(firstEntry).toEqual(expect.any(String));
      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });
      expect(screen.getByLabelText('Page viewer')).toHaveAttribute(
        'data-current-page',
        '0',
      );

      const homeAction = screen.getByRole('button', { name: 'Home action' });
      homeAction.focus();
      fireEvent.keyDown(homeAction, { key: 'ArrowRight' });

      expect(screen.getByLabelText('Page viewer')).toHaveAttribute(
        'data-current-page',
        '1',
      );
      expect(window.history.state.__uitTransientBackEntry).toEqual(
        expect.any(String),
      );
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('keeps browser Back armed when a controlled owner rejects home', () => {
    const handleChange = vi.fn();
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <Pager
        currentPageIndex={1}
        onPageChange={handleChange}
        useBackButtonForHome
        homeIndex={0}
      >
        <button>Home action</button>
        <button>Detail action</button>
      </Pager>,
    );

    try {
      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenLastCalledWith(0, 1, true);
      expect(screen.getByLabelText('Page viewer')).toHaveAttribute(
        'data-current-page',
        '1',
      );
      expect(window.history.state.__uitTransientBackEntry).toEqual(
        expect.any(String),
      );

      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });
      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(window.history.state.__uitTransientBackEntry).toEqual(
        expect.any(String),
      );
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('preserves Back focus direction through a controlled update', () => {
    const requestInitialFocus = vi.fn(() => true);
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);

    function ControlledBackPager() {
      const [pageIndex, setPageIndex] = useState(1);
      return (
        <Pager
          currentPageIndex={pageIndex}
          onPageChange={setPageIndex}
          useBackButtonForHome
          homeIndex={0}
        >
          <PagerPage onRequestInitialFocus={requestInitialFocus}>
            <button>Home action</button>
          </PagerPage>
          <button>Detail action</button>
        </Pager>
      );
    }

    const view = render(<ControlledBackPager />);
    try {
      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });

      expect(screen.getByLabelText('Page viewer')).toHaveAttribute(
        'data-current-page',
        '0',
      );
      expect(requestInitialFocus).toHaveBeenCalledWith({
        direction: NavigationDirection.BACK,
        pageIndex: 0,
        previousPageIndex: 1,
      });
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('keeps Back direction when a controlled owner applies home asynchronously', async () => {
    const requestInitialFocus = vi.fn(() => true);
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);

    function AsyncControlledPager() {
      const [pageIndex, setPageIndex] = useState(1);
      return (
        <Pager
          currentPageIndex={pageIndex}
          onPageChange={(nextIndex, _previousIndex, isBack) => {
            if (isBack !== true) {
              return;
            }
            // A controlled owner that round-trips through history or a router
            // answers a task or more after the request, not synchronously.
            setTimeout(() => setPageIndex(nextIndex), 30);
          }}
          useBackButtonForHome
          homeIndex={0}
        >
          <PagerPage onRequestInitialFocus={requestInitialFocus}>
            <button>Home action</button>
          </PagerPage>
          <button>Detail action</button>
        </Pager>
      );
    }

    const view = render(<AsyncControlledPager />);

    try {
      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(
          new PopStateEvent('popstate', { state: initialState }),
        );
      });

      await act(() => new Promise(resolve => setTimeout(resolve, 120)));

      // The navigation the owner finally applied IS the Back request, so it
      // must still be classified as Back for initial-focus direction.
      // The navigation the owner finally applied IS the Back request, so it
      // must still be classified as Back for initial-focus direction rather
      // than as a fresh forward navigation.
      expect(requestInitialFocus).toHaveBeenCalledWith({
        direction: NavigationDirection.BACK,
        pageIndex: 0,
        previousPageIndex: 1,
      });
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('treats a late controlled home update as a fresh navigation after an ignored Back request', async () => {
    const requestInitialFocus = vi.fn(() => true);
    const handleChange = vi.fn();
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <Pager
        currentPageIndex={1}
        onPageChange={handleChange}
        useBackButtonForHome
        homeIndex={0}
      >
        <PagerPage onRequestInitialFocus={requestInitialFocus}>
          <button>Home action</button>
        </PagerPage>
        <button>Detail action</button>
      </Pager>,
    );

    try {
      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });
      expect(handleChange).toHaveBeenCalledWith(0, 1, true);

      // Let the ignored Back request's pending marker expire. The window that
      // lets an asynchronous owner still be classified as Back also delays this
      // expiry, so wait past it rather than a single task.
      await act(() => new Promise(resolve => setTimeout(resolve, 320)));

      // An unrelated later navigation to home (e.g. a tab selection) must
      // not inherit the expired Back direction.
      view.rerender(
        <Pager
          currentPageIndex={0}
          onPageChange={handleChange}
          useBackButtonForHome
          homeIndex={0}
        >
          <PagerPage onRequestInitialFocus={requestInitialFocus}>
            <button>Home action</button>
          </PagerPage>
          <button>Detail action</button>
        </Pager>,
      );

      expect(requestInitialFocus).toHaveBeenCalledWith({
        direction: NavigationDirection.RIGHT,
        pageIndex: 0,
        previousPageIndex: 1,
      });
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('ignores Back for a pager nested in an inactive outer page', async () => {
    const nestedHandleChange = vi.fn();
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);

    function OuterPager({ pageIndex }: { pageIndex: number }) {
      return (
        <Pager currentPageIndex={pageIndex} onPageChange={() => {}}>
          <button>Outer home</button>
          <Pager
            currentPageIndex={1}
            onPageChange={nestedHandleChange}
            useBackButtonForHome
            homeIndex={0}
          >
            <button>Nested home</button>
            <button>Nested detail</button>
          </Pager>
        </Pager>
      );
    }

    const view = render(<OuterPager pageIndex={0} />);
    try {
      // Flush registration timeouts: the nested pager is off-home but hidden
      // in an inactive outer page, so it must not own the Back entry.
      await act(() => new Promise(resolve => setTimeout(resolve, 0)));
      expect(window.history.state.__uitTransientBackEntry).toBeUndefined();

      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });
      expect(nestedHandleChange).not.toHaveBeenCalled();

      // Activating the outer page re-arms Back for the nested pager.
      act(() => {
        view.rerender(<OuterPager pageIndex={1} />);
      });
      await waitFor(() => {
        expect(window.history.state.__uitTransientBackEntry).toEqual(
          expect.any(String),
        );
      });

      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });
      expect(nestedHandleChange).toHaveBeenCalledWith(0, 1, true);
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('registers a visible pager when MutationObserver is unavailable', async () => {
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    window.history.replaceState({ idx: 4 }, '', window.location.href);
    vi.stubGlobal('MutationObserver', undefined);
    const view = render(
      <Pager
        currentPageIndex={1}
        onPageChange={() => {}}
        useBackButtonForHome
        homeIndex={0}
      >
        <button>Home action</button>
        <button>Detail action</button>
      </Pager>,
    );

    try {
      await act(() => new Promise(resolve => setTimeout(resolve, 0)));
      expect(window.history.state.__uitTransientBackEntry).toEqual(
        expect.any(String),
      );
    } finally {
      view.unmount();
      vi.unstubAllGlobals();
      historyBack.mockRestore();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('suspends Back ownership while an ancestor hides the pager', async () => {
    const handleChange = vi.fn();
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <div data-testid="pager-wrapper">
        <Pager
          currentPageIndex={1}
          onPageChange={handleChange}
          useBackButtonForHome
          homeIndex={0}
        >
          <button>Home action</button>
          <button>Detail action</button>
        </Pager>
      </div>,
    );

    try {
      const wrapper = screen.getByTestId('pager-wrapper');
      await waitFor(() => {
        expect(window.history.state.__uitTransientBackEntry).toEqual(
          expect.any(String),
        );
      });
      const firstEntryId = window.history.state.__uitTransientBackEntry;

      // Hiding an ancestor suspends Back ownership and consumes the entry.
      act(() => {
        wrapper.style.display = 'none';
      });
      await waitFor(() => {
        expect(historyBack).toHaveBeenCalled();
      });

      // Restoring visibility re-registers the pager, minting a fresh entry.
      historyBack.mockClear();
      act(() => {
        wrapper.style.display = '';
      });
      await waitFor(() => {
        expect(window.history.state.__uitTransientBackEntry).not.toBe(
          firstEntryId,
        );
      });

      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });
      expect(handleChange).toHaveBeenCalledWith(0, 1, true);
    } finally {
      historyBack.mockRestore();
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('does not claim Escape outside the Pager subtree', () => {
    const handleChange = vi.fn();
    render(
      <Pager
        currentPageIndex={1}
        onPageChange={handleChange}
        useBackButtonForHome
        homeIndex={0}
      >
        <button>Home action</button>
        <button>Detail action</button>
      </Pager>,
    );

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('lets the current page intercept Escape before back-to-home navigation', () => {
    const handleChange = vi.fn();
    const handleInterceptBack = vi.fn(() => true);
    const { container } = render(
      <Pager
        currentPageIndex={1}
        onPageChange={handleChange}
        useBackButtonForHome
        homeIndex={0}
      >
        <button>Home action</button>
        <PagerPage onWillInterceptBack={handleInterceptBack}>
          <button>Current action</button>
        </PagerPage>
      </Pager>
    );

    fireEvent.keyDown(container.firstElementChild!, { key: 'Escape' });

    expect(handleInterceptBack).toHaveBeenCalled();
    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe('Pager custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <Pager className="my-pager">
        <div>Page 1</div>
      </Pager>
    );
    expect(container.firstElementChild?.className).toContain('my-pager');
  });
});
