/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { forwardRef, useState, type AnchorHTMLAttributes } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  NextNavigationProvider,
  NextPageTransition,
  NextPreloadLink,
  getBrowserNavigationEntryIndex,
  getNextHistoryIndex,
  getPageTransitionDirectionForHistoryIndex,
  useNextNavigation,
  useNextPageTransition,
} from './index';

const router = vi.hoisted(() => ({
  back: vi.fn(),
  pathname: '/',
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => router.pathname,
  useRouter: () => router,
}));

vi.mock('next/link', () => ({
  default: forwardRef<
    HTMLAnchorElement,
    AnchorHTMLAttributes<HTMLAnchorElement> & { href: unknown }
  >(function MockLink({ href, ...props }, ref) {
    return (
      <a
        {...props}
        href={typeof href === 'string' ? href : JSON.stringify(href)}
        ref={ref}
      />
    );
  }),
}));

function setNavigationApi(value: unknown): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'navigation');
  Object.defineProperty(window, 'navigation', { configurable: true, value });
  return () => {
    if (descriptor == null) {
      delete (window as Window & { navigation?: unknown }).navigation;
    } else {
      Object.defineProperty(window, 'navigation', descriptor);
    }
  };
}

function TransitionProbe() {
  const [, setRenderCount] = useState(0);
  const state = useNextPageTransition();
  return (
    <>
      <span data-testid="direction">{state.direction}</span>
      <span data-testid="pathname">{state.pathname}</span>
      <button onClick={() => setRenderCount(count => count + 1)}>Render</button>
    </>
  );
}

function renderAtPath(
  pathname: string,
  props: Parameters<typeof NextNavigationProvider>[0] = {},
) {
  router.pathname = pathname;
  window.history.replaceState(null, '', pathname);
  const tree = (nextProps = props) => (
    <NextNavigationProvider {...nextProps}>
      <TransitionProbe />
    </NextNavigationProvider>
  );
  const view = render(tree());
  return {
    navigate(nextPathname: string) {
      router.pathname = nextPathname;
      view.rerender(tree());
    },
    view,
  };
}

function dispatchBackKey(): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Escape',
  });
  act(() => {
    document.dispatchEvent(event);
  });
  return event;
}

beforeEach(() => {
  router.back.mockReset();
  router.replace.mockReset();
  router.pathname = '/';
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('getBrowserNavigationEntryIndex', () => {
  it('reads the Navigation API entry index and ignores missing values', () => {
    let restore = setNavigationApi({ currentEntry: { index: 3, key: 'a' } });
    expect(getBrowserNavigationEntryIndex()).toBe(3);
    restore();

    restore = setNavigationApi({ currentEntry: { index: -1, key: 'a' } });
    expect(getBrowserNavigationEntryIndex()).toBeNull();
    restore();

    expect(getBrowserNavigationEntryIndex()).toBeNull();
  });
});

describe('getPageTransitionDirectionForHistoryIndex', () => {
  it('compares indexes and treats an unindexed traversal as Back', () => {
    expect(getPageTransitionDirectionForHistoryIndex(2, 1, false)).toBe('back');
    expect(getPageTransitionDirectionForHistoryIndex(1, 2, true)).toBe('forward');
    expect(getPageTransitionDirectionForHistoryIndex(null, null, true)).toBe('back');
    expect(getPageTransitionDirectionForHistoryIndex(null, null, false)).toBe('forward');
  });
});

describe('NextNavigationProvider', () => {
  it('navigates back through router history for Escape', () => {
    renderAtPath('/lists/groceries', { getHistoryIndex: () => 2 });

    const event = dispatchBackKey();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('replaces to the fallback as a back transition at the first entry', () => {
    const { navigate } = renderAtPath('/lists/groceries', {
      getHistoryIndex: () => 0,
    });

    dispatchBackKey();
    expect(router.replace).toHaveBeenCalledWith('/');
    navigate('/');

    expect(screen.getByTestId('direction')).toHaveTextContent('back');
    fireEvent.click(screen.getByRole('button', { name: 'Render' }));
    expect(screen.getByTestId('direction')).toHaveTextContent('back');

    navigate('/settings');
    expect(screen.getByTestId('direction')).toHaveTextContent('forward');
  });

  it('leaves Back unclaimed at the fallback or without one', () => {
    renderAtPath('/', { getHistoryIndex: () => 0 });
    expect(dispatchBackKey().defaultPrevented).toBe(false);
    cleanup();

    renderAtPath('/lists', { fallbackHref: null, getHistoryIndex: () => 0 });
    expect(dispatchBackKey().defaultPrevented).toBe(false);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('leaves Back unclaimed at the canonical trailing-slash fallback', () => {
    renderAtPath('/lists/', {fallbackHref: '/lists', getHistoryIndex: () => 0});

    expect(dispatchBackKey().defaultPrevented).toBe(false);
    expect(dispatchBackKey().defaultPrevented).toBe(false);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it.each(['/lists?sort=date', '/lists#details', 'https://other.example/lists/'])(
    'does not conflate the fallback %s with the current route',
    fallbackHref => {
      renderAtPath('/lists/', {fallbackHref, getHistoryIndex: () => 0});

      expect(dispatchBackKey().defaultPrevented).toBe(true);
      expect(router.replace).toHaveBeenCalledWith(fallbackHref);
    },
  );

  it('derives transition direction from the history index', () => {
    let historyIndex = 1;
    const { navigate } = renderAtPath('/', {
      getHistoryIndex: () => historyIndex,
    });

    historyIndex = 2;
    navigate('/lists');
    expect(screen.getByTestId('direction')).toHaveTextContent('forward');

    historyIndex = 1;
    navigate('/');
    expect(screen.getByTestId('direction')).toHaveTextContent('back');
  });

  it('treats a browser traversal as Back when no history index exists', () => {
    const { navigate } = renderAtPath('/', { getHistoryIndex: () => null });

    navigate('/lists');
    expect(screen.getByTestId('direction')).toHaveTextContent('forward');

    window.history.replaceState(null, '', '/');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    navigate('/');
    expect(screen.getByTestId('direction')).toHaveTextContent('back');

    navigate('/settings');
    expect(screen.getByTestId('direction')).toHaveTextContent('forward');
  });

  it('ignores a same-URL traversal when the next route is pushed', () => {
    const { navigate } = renderAtPath('/lists', { getHistoryIndex: () => null });
    window.history.replaceState(null, '', '/lists');

    // A dismissed overlay pops its temporary same-URL history entry.
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    navigate('/lists/groceries');

    expect(screen.getByTestId('direction')).toHaveTextContent('forward');
  });

  it('does not treat a route that only shares a path suffix as the traversal destination', () => {
    const { navigate } = renderAtPath('/', { getHistoryIndex: () => null });
    navigate('/lists');

    // The traversal lands on /archive/settings, but the router commits
    // /settings, an unrelated route.
    window.history.replaceState(null, '', '/archive/settings');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    navigate('/settings');

    expect(screen.getByTestId('direction')).toHaveTextContent('forward');
  });

  it('matches traversal destinations under a base path', () => {
    window.history.replaceState(null, '', '/app/lists');
    router.pathname = '/lists';
    const view = render(
      <NextNavigationProvider getHistoryIndex={() => null}>
        <TransitionProbe />
      </NextNavigationProvider>,
    );

    window.history.replaceState(null, '', '/app/');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    router.pathname = '/';
    view.rerender(
      <NextNavigationProvider getHistoryIndex={() => null}>
        <TransitionProbe />
      </NextNavigationProvider>,
    );

    expect(screen.getByTestId('direction')).toHaveTextContent('back');
  });

  it('exposes navigateBack and requires the provider', () => {
    let navigateBack: (() => boolean) | null = null;
    function Consumer() {
      navigateBack = useNextNavigation().navigateBack;
      return null;
    }
    router.pathname = '/lists';
    render(
      <NextNavigationProvider getHistoryIndex={() => 1}>
        <Consumer />
      </NextNavigationProvider>,
    );

    expect(navigateBack!()).toBe(true);
    expect(router.back).toHaveBeenCalledTimes(1);

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      'useNextNavigation must be used within NextNavigationProvider.',
    );
    consoleError.mockRestore();
  });

  it('restores a browser entry when pushState is downgraded to replaceState', () => {
    const originalPushState = window.history.pushState;
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const restoreNavigation = setNavigationApi({
      currentEntry: { key: 'unchanged-entry' },
    });
    window.history.replaceState({ page: 'home' }, '', '/');
    const downgradedPushState: History['pushState'] = (data, unused, url) => {
      window.history.replaceState(data, unused, url);
    };
    window.history.pushState = downgradedPushState;

    try {
      const { view } = renderAtPath('/');
      const lengthBeforePush = window.history.length;

      window.history.pushState({ page: 'lists' }, '', '/lists');

      expect(window.history.length).toBe(lengthBeforePush + 1);
      expect(window.location.pathname).toBe('/lists');
      expect(window.history.state).toEqual({
        page: 'lists',
        __uitHistoryIndex: 1,
      });

      view.unmount();
      expect(window.history.pushState).toBe(downgradedPushState);
    } finally {
      window.history.pushState = originalPushState;
      restoreNavigation();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('restores both history methods on unmount', () => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const { view } = renderAtPath('/');
    expect(window.history.pushState).not.toBe(originalPushState);

    view.unmount();

    expect(window.history.pushState).toBe(originalPushState);
    expect(window.history.replaceState).toBe(originalReplaceState);
  });
});

describe('NextNavigationProvider without the Navigation API', () => {
  // jsdom has no Navigation API, so the provider's own history index applies.
  function pushRoute(
    navigate: (pathname: string) => void,
    pathname: string,
  ) {
    // Next.js commits a navigation by pushing an entry with its own state.
    window.history.pushState({ __NA: true }, '', pathname);
    navigate(pathname);
  }

  it('records an index that pushes increment and replaces keep', () => {
    const { navigate } = renderAtPath('/');
    expect(getNextHistoryIndex()).toBe(0);

    pushRoute(navigate, '/lists');
    pushRoute(navigate, '/lists/travel');
    expect(getNextHistoryIndex()).toBe(2);

    // Next.js replaces state on later commits without custom keys.
    window.history.replaceState({ __NA: true, tree: 'next' }, '', '/lists/travel');
    expect(window.history.state).toEqual({
      __NA: true,
      tree: 'next',
      __uitHistoryIndex: 2,
    });
  });

  it('goes back through history from a deep route instead of replacing to the fallback', () => {
    const { navigate } = renderAtPath('/');
    pushRoute(navigate, '/lists');
    pushRoute(navigate, '/lists/travel/items/tickets');

    expect(dispatchBackKey().defaultPrevented).toBe(true);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('goes back through history when the fallback route has history behind it', () => {
    const { navigate } = renderAtPath('/settings');
    pushRoute(navigate, '/');

    expect(dispatchBackKey().defaultPrevented).toBe(true);

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('replaces to the fallback when opened from a direct link', () => {
    renderAtPath('/lists/travel');

    dispatchBackKey();

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('keeps the recorded index across a reload', () => {
    window.history.replaceState({ __NA: true, __uitHistoryIndex: 3 }, '', '/lists');
    router.pathname = '/lists';
    render(
      <NextNavigationProvider>
        <TransitionProbe />
      </NextNavigationProvider>,
    );

    expect(getNextHistoryIndex()).toBe(3);
    dispatchBackKey();
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('derives back direction from the recorded index', () => {
    const { navigate } = renderAtPath('/');
    pushRoute(navigate, '/lists');
    expect(screen.getByTestId('direction')).toHaveTextContent('forward');

    // A Back traversal restores the previous entry's state natively.
    History.prototype.replaceState.call(
      window.history,
      { __NA: true, __uitHistoryIndex: 0 },
      '',
      '/',
    );
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    navigate('/');

    expect(screen.getByTestId('direction')).toHaveTextContent('back');
  });
});

describe('NextPageTransition', () => {
  it('renders the current route with transition state', () => {
    router.pathname = '/lists';
    render(
      <NextNavigationProvider getHistoryIndex={() => 0}>
        <NextPageTransition>
          {({ direction, pathname, transitionKey }) => (
            <span data-testid="state">
              {`${pathname}|${transitionKey}|${direction}`}
            </span>
          )}
        </NextPageTransition>
      </NextNavigationProvider>,
    );

    expect(screen.getByTestId('state')).toHaveTextContent('/lists|/lists|forward');
  });
});

describe('NextPreloadLink', () => {
  it('warms routes keyed by string and object hrefs', async () => {
    vi.useFakeTimers();
    const preloadRoute = vi.fn();
    render(
      <NextNavigationProvider preloadRoute={preloadRoute}>
        <NextPreloadLink href="/lists/groceries" preloadOnVisible={false}>
          Groceries
        </NextPreloadLink>
        <NextPreloadLink
          href={{ hash: 'top', pathname: '/lists', query: { sort: 'name' } }}
          preloadOnVisible={false}
        >
          Lists
        </NextPreloadLink>
      </NextNavigationProvider>,
    );

    fireEvent.focus(screen.getByRole('link', { name: 'Groceries' }));
    fireEvent.focus(screen.getByRole('link', { name: 'Lists' }));
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(preloadRoute).toHaveBeenCalledWith('/lists/groceries');
    expect(preloadRoute).toHaveBeenCalledWith('/lists?sort=name#top');
  });
});
