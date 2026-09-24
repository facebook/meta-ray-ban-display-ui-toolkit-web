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
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import {
  BrowserRouter,
  HashRouter,
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  ReactRouterNavigationProvider,
  ReactRouterPageTransition,
  ReactRouterPreloadLink,
  getPageTransitionDirectionForHistory,
  useReactRouterPageTransition,
} from './index';
import { Pager } from '../components/Pager';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function LocationProbe() {
  return <span data-testid="pathname">{useLocation().pathname}</span>;
}

function TransitionProbe() {
  const [, setRenderCount] = useState(0);
  const state = useReactRouterPageTransition();
  return (
    <>
      <span data-testid="provider-direction">{state.direction}</span>
      <button onClick={() => setRenderCount(count => count + 1)}>Render</button>
    </>
  );
}

describe('ReactRouterPageTransition', () => {
  it('uses browser history index changes for route transition direction', () => {
    expect(getPageTransitionDirectionForHistory(2, 1, 'POP')).toBe('back');
    expect(getPageTransitionDirectionForHistory(1, 2, 'POP')).toBe('forward');
    expect(getPageTransitionDirectionForHistory(1, 2, 'PUSH')).toBe('forward');
    expect(getPageTransitionDirectionForHistory(1, 1, 'REPLACE')).toBe('forward');
    expect(getPageTransitionDirectionForHistory(null, null, 'POP')).toBe('forward');
  });

  it('uses the reverse direction for HashRouter Back traversal', async () => {
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    window.history.replaceState({ idx: 0, key: 'root' }, '', '/#/');

    try {
      render(
        <HashRouter>
          <ReactRouterNavigationProvider>
            <LocationProbe />
            <TransitionProbe />
            <Link to="/details">Details</Link>
          </ReactRouterNavigationProvider>
        </HashRouter>,
      );

      fireEvent.click(screen.getByRole('link', { name: 'Details' }));
      expect(screen.getByTestId('pathname')).toHaveTextContent('/details');
      expect(screen.getByTestId('provider-direction')).toHaveTextContent(
        'forward',
      );

      await act(async () => {
        window.history.back();
        await new Promise(resolve => window.setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/');
        expect(screen.getByTestId('provider-direction')).toHaveTextContent(
          'back',
        );
      });
    } finally {
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('renders routes with transition state from React Router', () => {
    render(
      <MemoryRouter initialEntries={['/demo/buttons']}>
        <ReactRouterPageTransition
          getHistoryIndex={() => 4}
          getTransitionKey={location => location.pathname}
        >
          {state => (
            <>
              <span data-testid="direction">{state.direction}</span>
              <span data-testid="history-index">{state.historyIndex}</span>
              <span data-testid="transition-key">{state.transitionKey}</span>
              <Routes location={state.location}>
                <Route path="/" element={<span>Menu</span>} />
                <Route path="/demo/:component" element={<span>Buttons</span>} />
              </Routes>
            </>
          )}
        </ReactRouterPageTransition>
      </MemoryRouter>,
    );

    expect(screen.getByText('Buttons')).toBeInTheDocument();
    expect(screen.getByTestId('direction')).toHaveTextContent('forward');
    expect(screen.getByTestId('history-index')).toHaveTextContent('4');
    expect(screen.getByTestId('transition-key')).toHaveTextContent('/demo/buttons');
  });

  it('uses the pathname as the default transition key', () => {
    render(
      <MemoryRouter
        initialEntries={[{
          pathname: '/demo/buttons',
          search: '?source=menu',
          hash: '#focused',
          key: 'router-generated-key',
        }]}
      >
        <ReactRouterPageTransition>
          {state => (
            <span data-testid="transition-key">{state.transitionKey}</span>
          )}
        </ReactRouterPageTransition>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('transition-key')).toHaveTextContent(
      '/demo/buttons',
    );
  });

  it('preserves back direction across unstable callback identities', () => {
    function TransitionProbe({
      historyIndex,
      transitionKey,
    }: {
      historyIndex: number;
      transitionKey: string;
    }) {
      return (
        <MemoryRouter initialEntries={['/demo/buttons']}>
          <ReactRouterPageTransition
            getHistoryIndex={() => historyIndex}
            getTransitionKey={() => transitionKey}
          >
            {state => (
              <span data-testid="direction">{state.direction}</span>
            )}
          </ReactRouterPageTransition>
        </MemoryRouter>
      );
    }

    const view = render(
      <TransitionProbe historyIndex={2} transitionKey="first" />,
    );
    view.rerender(
      <TransitionProbe historyIndex={1} transitionKey="second" />,
    );
    const currentDirection = () => view.container.querySelector(
      '[data-page-transition-key="second"] [data-testid="direction"]',
    );
    expect(currentDirection()).toHaveTextContent('back');

    view.rerender(
      <TransitionProbe historyIndex={1} transitionKey="second" />,
    );
    expect(currentDirection()).toHaveTextContent('back');
  });

  it('navigates back through router history for Escape', () => {
    render(
      <MemoryRouter initialEntries={['/', '/demo/buttons']} initialIndex={1}>
        <ReactRouterNavigationProvider getHistoryIndex={() => 1}>
          <LocationProbe />
        </ReactRouterNavigationProvider>
      </MemoryRouter>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.getByTestId('pathname')).toHaveTextContent('/');
  });

  it('lets a pager consume browser Back before the enclosing route', async () => {
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    window.history.replaceState({ idx: 0, key: 'root' }, '', '/');

    try {
      render(
        <BrowserRouter>
          <ReactRouterNavigationProvider>
            <TransitionProbe />
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <LocationProbe />
                    <Link to="/details">Details</Link>
                  </>
                }
              />
              <Route
                path="/details"
                element={
                  <>
                    <LocationProbe />
                    <Pager defaultPageIndex={1} homeIndex={0}>
                      <button>Home page</button>
                      <button>Detail page</button>
                    </Pager>
                  </>
                }
              />
            </Routes>
          </ReactRouterNavigationProvider>
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByRole('link', { name: 'Details' }));
      expect(screen.getByTestId('pathname')).toHaveTextContent('/details');
      expect(document.querySelector('[data-current-page="1"]')).not.toBeNull();
      expect(window.history.state.__uitTransientBackEntry).toEqual(
        expect.any(String),
      );

      await act(async () => {
        window.history.back();
        await new Promise(resolve => window.setTimeout(resolve, 0));
      });

      expect(screen.getByTestId('pathname')).toHaveTextContent('/details');
      await waitFor(() => {
        expect(document.querySelector('[data-current-page="0"]')).not.toBeNull();
      });

      await act(async () => {
        window.history.back();
        await new Promise(resolve => window.setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByTestId('pathname').textContent).toBe('/');
      });
      expect(screen.getByTestId('provider-direction')).toHaveTextContent('back');
    } finally {
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('restores a browser entry when pushState is downgraded to replaceState', async () => {
    const originalPushState = window.history.pushState;
    const originalNavigationDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'navigation',
    );
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    Object.defineProperty(window, 'navigation', {
      configurable: true,
      value: {
        currentEntry: { key: 'unchanged-entry' },
      },
    });
    window.history.replaceState({ idx: 0, key: 'initial' }, '', '/');
    window.history.pushState = function downgradedPushState(data, unused, url) {
      window.history.replaceState(data, unused, url);
    };

    try {
      render(
        <BrowserRouter>
          <ReactRouterNavigationProvider>
            <LocationProbe />
            <Link to="/demo/buttons">Buttons</Link>
          </ReactRouterNavigationProvider>
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByRole('link', { name: 'Buttons' }));
      expect(screen.getByTestId('pathname')).toHaveTextContent('/demo/buttons');

      await act(async () => {
        window.history.back();
        await new Promise(resolve => window.setTimeout(resolve, 0));
      });

      expect(screen.getByTestId('pathname')).toHaveTextContent('/');
    } finally {
      window.history.pushState = originalPushState;
      if (originalNavigationDescriptor == null) {
        delete (window as Window & { navigation?: unknown }).navigation;
      } else {
        Object.defineProperty(
          window,
          'navigation',
          originalNavigationDescriptor,
        );
      }
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('uses the fallback as a back transition at history index zero', () => {
    render(
      <MemoryRouter initialEntries={['/demo/buttons']}>
        <ReactRouterNavigationProvider getHistoryIndex={() => 0}>
          <LocationProbe />
          <TransitionProbe />
          <Link to="/other">Other</Link>
        </ReactRouterNavigationProvider>
      </MemoryRouter>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.getByTestId('pathname')).toHaveTextContent('/');
    expect(screen.getByTestId('provider-direction')).toHaveTextContent('back');
    fireEvent.click(screen.getByRole('button', { name: 'Render' }));
    expect(screen.getByTestId('provider-direction')).toHaveTextContent('back');

    fireEvent.click(screen.getByRole('link', { name: 'Other' }));
    expect(screen.getByTestId('pathname')).toHaveTextContent('/other');
    expect(screen.getByTestId('provider-direction')).toHaveTextContent('forward');
  });

  it('leaves Escape unclaimed when already at the fallback', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ReactRouterNavigationProvider getHistoryIndex={() => 0}>
          <LocationProbe />
        </ReactRouterNavigationProvider>
      </MemoryRouter>,
    );
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });

    document.dispatchEvent(event);

    expect(screen.getByTestId('pathname')).toHaveTextContent('/');
    expect(event.defaultPrevented).toBe(false);
  });

  it('warms semantic links through the provider', async () => {
    vi.useFakeTimers();
    const preloadRoute = vi.fn();
    render(
      <MemoryRouter>
        <ReactRouterNavigationProvider preloadRoute={preloadRoute}>
          <ReactRouterPreloadLink
            preloadKey="buttons"
            preloadOnVisible={false}
            to="/demo/buttons"
          >
            Buttons
          </ReactRouterPreloadLink>
        </ReactRouterNavigationProvider>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Buttons' });
    expect(link).toHaveAttribute('href', '/demo/buttons');
    fireEvent.focus(link);
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(preloadRoute).toHaveBeenCalledWith('buttons');
  });
});
