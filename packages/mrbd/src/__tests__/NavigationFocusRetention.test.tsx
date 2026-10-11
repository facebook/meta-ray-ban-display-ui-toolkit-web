/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Link, MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PageTransition,
  preserveFocusedInteractableDuringNavigation,
  useNavigationFocusRetention,
} from '@wearables-ui-toolkit/foundation';
import { retargetNavigationFocusRetention } from '@wearables-ui-toolkit/foundation/base/FocusCoordinator';
import { ReactRouterNavigationProvider } from '@wearables-ui-toolkit/foundation/react-router';
import { ControlTile } from '../mrbd/ui/ControlTile';

let browserRoot: HTMLElement | null = null;

function createBrowserRoot(): HTMLElement {
  browserRoot = document.createElement('div');
  browserRoot.tabIndex = -1;
  document.body.appendChild(browserRoot);
  return browserRoot;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  browserRoot?.remove();
  browserRoot = null;
  window.history.replaceState(null, '', '/');
});

function RouteKeyRetention({ routeKey }: { routeKey: string }) {
  useNavigationFocusRetention(routeKey);
  return null;
}

function Screen({ children }: { children?: ReactNode }) {
  return (
    <>
      {children}
      <ControlTile title="Brightness" />
    </>
  );
}

async function focusTileThenSimulateBrowserRootFocus(
  root: HTMLElement,
  navigate: () => void,
): Promise<HTMLElement> {
  const tile = screen.getByRole('button', { name: 'Brightness' });
  act(() => {
    tile.focus();
  });
  navigate();
  // The embedded browser focuses its document root while it applies a
  // same-document history entry.
  await act(async () => {
    root.focus();
    await Promise.resolve();
  });
  return tile;
}

describe('useNavigationFocusRetention', () => {
  it('keeps the focused interactable when the route key changes', async () => {
    const root = createBrowserRoot();
    const view = render(
      <Screen><RouteKeyRetention routeKey="/lists" /></Screen>,
      { container: root },
    );

    const tile = await focusTileThenSimulateBrowserRootFocus(root, () => {
      view.rerender(<Screen><RouteKeyRetention routeKey="/lists/groceries" /></Screen>);
    });

    expect(document.activeElement).toBe(tile);
  });

  it('keeps the focused interactable when the browser applies popstate', async () => {
    const root = createBrowserRoot();
    render(
      <Screen><RouteKeyRetention routeKey="/lists" /></Screen>,
      { container: root },
    );

    const tile = await focusTileThenSimulateBrowserRootFocus(root, () => {
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    });

    expect(document.activeElement).toBe(tile);
  });

  it('does not hold focus on the first render or after unmount', async () => {
    const root = createBrowserRoot();
    const view = render(
      <Screen><RouteKeyRetention routeKey="/lists" /></Screen>,
      { container: root },
    );

    await focusTileThenSimulateBrowserRootFocus(root, () => {});
    expect(document.activeElement).toBe(root);

    await focusTileThenSimulateBrowserRootFocus(root, () => {
      view.rerender(<Screen><RouteKeyRetention routeKey="/lists/groceries" /></Screen>);
      view.rerender(<Screen />);
    });
    expect(document.activeElement).toBe(root);
  });
});

describe('shared navigation focus recovery', () => {
  it.each(['retargeted', 'explicit'] as const)(
    'uses only the %s destination target while an outgoing page still has an owner',
    async mode => {
      const root = createBrowserRoot();
      const view = render(
        <PageTransition transitionKey="first" initialFocus="none">
          <ControlTile title="Outgoing action" />
        </PageTransition>,
        { container: root },
      );
      const outgoing = screen.getByRole('button', { name: 'Outgoing action' });
      act(() => outgoing.focus());

      view.rerender(
        <PageTransition transitionKey="second" initialFocus="none">
          <div role="group" aria-label="Destination" tabIndex={-1} />
        </PageTransition>,
      );
      const destination = screen.getByRole('group', { name: 'Destination' });
      const focused: EventTarget[] = [];
      root.addEventListener('focusin', event => {
        if (event.target != null) {
          focused.push(event.target);
        }
      });
      const release = preserveFocusedInteractableDuringNavigation(
        mode === 'explicit' ? destination : null,
      );

      try {
        if (mode === 'retargeted') {
          retargetNavigationFocusRetention(destination);
        }
        await act(async () => {
          root.focus();
          await Promise.resolve();
        });

        expect(document.activeElement).toBe(destination);
        expect(focused.filter(target => target === destination)).toHaveLength(1);
        expect(focused).not.toContain(outgoing);
      } finally {
        release();
      }
    },
  );

  it.each(['dialog', 'button', 'ancestor'] as const)(
    'respects deliberate %s focus without a navigation hold',
    async kind => {
      const root = createBrowserRoot();
      const content = (
        <div role={kind === 'ancestor' ? 'group' : undefined} aria-label="Focus destination" tabIndex={-1}>
          <ControlTile title="Incoming action" />
        </div>
      );
      const renderPage = (transitionKey: string) => (
        <>
          <PageTransition transitionKey={transitionKey} initialFocus="none">
            {content}
          </PageTransition>
          {kind === 'dialog' && <div role="dialog" aria-label="Focus destination" tabIndex={-1} />}
          {kind === 'button' && <button>Focus destination</button>}
        </>
      );
      const view = render(renderPage('first'), {container: root});
      if (kind !== 'ancestor') {
        view.rerender(renderPage('second'));
      }
      const incoming = screen.getAllByRole('button', {name: 'Incoming action'}).at(-1)!;
      const destination = screen.getByRole(
        kind === 'ancestor' ? 'group' : kind,
        {name: 'Focus destination'},
      );
      act(() => incoming.focus());

      await act(async () => {
        destination.focus();
        await Promise.resolve();
      });

      expect(document.activeElement).toBe(destination);
    },
  );

  it.each(['retarget', 'release', 'unmount', 'disconnect', 'expire'] as const)(
    'rechecks a queued recovery after %s and coalesces repeated reconciliation',
    async change => {
      if (change === 'expire') {
        vi.useFakeTimers();
      }
      const root = createBrowserRoot();
      const view = render(
        <><Screen /><div role="group" aria-label="Destination" tabIndex={-1} /></>,
        {container: root},
      );
      const tile = screen.getByRole('button', {name: 'Brightness'});
      const destination = screen.getByRole('group', {name: 'Destination'});
      act(() => tile.focus());
      const release = preserveFocusedInteractableDuringNavigation();
      const tileParent = tile.parentNode!;
      const tileNextSibling = tile.nextSibling;
      const focused: EventTarget[] = [];
      const queueSpy = vi.spyOn(globalThis, 'queueMicrotask');
      root.addEventListener('focusin', event => {
        if (event.target != null) focused.push(event.target);
      });
      try {
        await act(async () => {
          const queueCallsBefore = queueSpy.mock.calls.length;
          root.focus();
          root.dispatchEvent(new FocusEvent('focusin', {bubbles: true}));
          root.dispatchEvent(new FocusEvent('focusin', {bubbles: true}));
          expect(queueSpy.mock.calls.length - queueCallsBefore).toBe(1);
          if (change === 'retarget') retargetNavigationFocusRetention(destination);
          if (change === 'release') release();
          if (change === 'unmount') view.unmount();
          if (change === 'disconnect') tile.remove();
          if (change === 'expire') vi.advanceTimersByTime(751);
          await Promise.resolve();
        });
        expect(document.activeElement).toBe(change === 'retarget' ? destination : root);
        expect(focused.filter(target => target === destination)).toHaveLength(change === 'retarget' ? 1 : 0);
        expect(focused).not.toContain(tile);
      } finally {
        queueSpy.mockRestore();
        if (change === 'disconnect') {
          tileParent.insertBefore(tile, tileNextSibling);
        }
        release();
      }
    },
  );

  it('does not let queued recovery overwrite a deliberate focus move', async () => {
    const root = createBrowserRoot();
    const view = render(
      <>
        <RouteKeyRetention routeKey="/first" />
        <ControlTile title="Brightness" />
        <button>Other action</button>
      </>,
      { container: root },
    );
    const tile = screen.getByRole('button', { name: 'Brightness' });
    const other = screen.getByRole('button', { name: 'Other action' });
    act(() => tile.focus());
    view.rerender(
      <>
        <RouteKeyRetention routeKey="/second" />
        <ControlTile title="Brightness" />
        <button>Other action</button>
      </>,
    );

    await act(async () => {
      root.focus();
      other.focus();
      await Promise.resolve();
    });

    expect(document.activeElement).toBe(other);
  });
});

describe('ReactRouterNavigationProvider', () => {
  it('holds focus across route changes', async () => {
    const root = createBrowserRoot();
    render(
      <MemoryRouter initialEntries={['/lists']}>
        <ReactRouterNavigationProvider>
          <Screen><Link to="/lists/groceries">Groceries</Link></Screen>
        </ReactRouterNavigationProvider>
      </MemoryRouter>,
      { container: root },
    );

    const tile = await focusTileThenSimulateBrowserRootFocus(root, () => {
      act(() => {
        screen.getByRole('link', { name: 'Groceries' }).click();
      });
    });

    expect(document.activeElement).toBe(tile);
  });
});

