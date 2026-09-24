/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import {
  AppSwitchPageTransitionConfig,
  InAppPageTransitionConfig,
  PageTransition,
} from '@wearables-ui-toolkit/foundation/navigation/PageTransition';
import { ScrollView } from '@wearables-ui-toolkit/foundation/components/ScrollView';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { Pager } from '@wearables-ui-toolkit/foundation/components/Pager';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';

describe('PageTransition', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes the fragment transition constants', () => {
    expect(InAppPageTransitionConfig.forward.enter.translateX.from).toBe(15);
    expect(InAppPageTransitionConfig.forward.enter.translateX.to).toBe(0);
    expect(InAppPageTransitionConfig.forward.enter.translateX.delayMs).toBe(233);
    expect(InAppPageTransitionConfig.forward.enter.translateX.durationMs).toBe(267);
    expect(InAppPageTransitionConfig.forward.enter.alpha.delayMs).toBe(267);
    expect(InAppPageTransitionConfig.forward.enter.alpha.durationMs).toBe(167);
    expect(InAppPageTransitionConfig.forward.exit.translateX.to).toBe(-15);
    expect(InAppPageTransitionConfig.forward.exit.translateX.durationMs).toBe(167);
    expect(InAppPageTransitionConfig.forward.exit.alpha.delayMs).toBe(33);
    expect(InAppPageTransitionConfig.forward.exit.alpha.durationMs).toBe(100);
    expect(InAppPageTransitionConfig.forward.totalDurationMs).toBe(500);

    expect(InAppPageTransitionConfig.back?.enter.translateX.from).toBe(-15);
    expect(InAppPageTransitionConfig.back?.enter.translateX.delayMs).toBe(267);
    expect(InAppPageTransitionConfig.back?.enter.translateX.durationMs).toBe(233);
    expect(InAppPageTransitionConfig.back?.enter.alpha.delayMs).toBe(300);
    expect(InAppPageTransitionConfig.back?.exit.translateX.to).toBe(15);
    expect(InAppPageTransitionConfig.back?.totalDurationMs).toBe(500);
  });

  it('vends the app switch transition separately', () => {
    expect(AppSwitchPageTransitionConfig.forward.enter.translateX.from).toBe(55);
    expect(AppSwitchPageTransitionConfig.forward.enter.translateX.delayMs).toBe(400);
    expect(AppSwitchPageTransitionConfig.forward.enter.translateX.durationMs).toBe(400);
    expect(AppSwitchPageTransitionConfig.forward.enter.scale.delayMs).toBe(400);
    expect(AppSwitchPageTransitionConfig.forward.enter.scale.durationMs).toBe(267);
    expect(AppSwitchPageTransitionConfig.forward.enter.alpha.delayMs).toBe(467);
    expect(AppSwitchPageTransitionConfig.forward.enter.alpha.durationMs).toBe(200);
    expect(AppSwitchPageTransitionConfig.forward.exit.translateX.to).toBe(-55);
    expect(AppSwitchPageTransitionConfig.forward.exit.translateX.durationMs).toBe(233);
    expect(AppSwitchPageTransitionConfig.forward.exit.scale.delayMs).toBe(33);
    expect(AppSwitchPageTransitionConfig.forward.exit.scale.durationMs).toBe(367);
    expect(AppSwitchPageTransitionConfig.forward.exit.alpha.durationMs).toBe(400);
    expect(AppSwitchPageTransitionConfig.forward.totalDurationMs).toBe(800);
  });

  it('uses fragment navigation as the default transition style', () => {
    const { container } = render(
      <PageTransition transitionKey="menu">
        <div>Menu</div>
      </PageTransition>
    );

    expect(container.firstElementChild).toHaveStyle({
      '--uit-page-transition-enter-translate-from': '15px',
      '--uit-page-transition-enter-scale-from': '1',
      '--uit-page-transition-exit-translate-to': '-15px',
    });
  });

  it('uses back fragment values for reverse navigation', () => {
    const { container } = render(
      <PageTransition transitionKey="menu" direction="back">
        <div>Menu</div>
      </PageTransition>
    );

    expect(container.firstElementChild).toHaveStyle({
      '--uit-page-transition-enter-translate-from': '-15px',
      '--uit-page-transition-exit-translate-to': '15px',
    });
  });

  it('keeps aria-hidden off an outgoing page while it still owns focus', () => {
    const { container, rerender } = render(
      <PageTransition transitionKey="menu" initialFocus="none">
        <button>Menu action</button>
      </PageTransition>,
    );
    const menuAction = screen.getByText('Menu action');
    menuAction.focus();

    rerender(
      <PageTransition transitionKey="buttons" initialFocus="none">
        <button>Buttons action</button>
      </PageTransition>,
    );

    const outgoingPage = container.querySelector(
      '[data-page-transition-key="menu"]',
    );
    expect(outgoingPage).toHaveAttribute('aria-hidden', 'false');
    expect(outgoingPage).toHaveAttribute('inert');
    expect(document.activeElement).toBe(menuAction);
  });

  it('hides the outgoing page once focus moves to the incoming page', () => {
    const { container, rerender } = render(
      <PageTransition transitionKey="menu" initialFocus="none">
        <button>Menu action</button>
      </PageTransition>,
    );
    const menuAction = screen.getByText('Menu action');
    menuAction.focus();

    rerender(
      <PageTransition transitionKey="buttons" initialFocus="none">
        <button>Buttons action</button>
      </PageTransition>,
    );

    const outgoingPage = container.querySelector(
      '[data-page-transition-key="menu"]',
    );
    expect(outgoingPage).toHaveAttribute('aria-hidden', 'false');

    const incomingAction = screen.getByText('Buttons action');
    act(() => {
      incomingAction.focus();
    });

    expect(outgoingPage).toHaveAttribute('aria-hidden', 'true');
    expect(outgoingPage).toHaveAttribute('inert');
    expect(document.activeElement).toBe(incomingAction);
  });

  it('can scale transition timings for slower WebView devices', () => {
    const { container } = render(
      <PageTransition transitionKey="menu" timingScale={2}>
        <div>Menu</div>
      </PageTransition>
    );

    expect(container.firstElementChild).toHaveStyle({
      '--uit-page-transition-enter-translate-delay': '466ms',
      '--uit-page-transition-enter-translate-duration': '534ms',
      '--uit-page-transition-enter-alpha-delay': '534ms',
      '--uit-page-transition-enter-alpha-duration': '334ms',
    });
  });

  it('prepares outgoing and incoming pages before starting a route animation', async () => {
    vi.useFakeTimers();
    const onTransitionEnd = vi.fn();
    const { container, rerender } = render(
      <PageTransition transitionKey="menu" onTransitionEnd={onTransitionEnd}>
        <div>Menu</div>
      </PageTransition>
    );

    rerender(
      <PageTransition transitionKey="buttons" onTransitionEnd={onTransitionEnd}>
        <div>Buttons</div>
      </PageTransition>
    );

    const pages = container.querySelectorAll('[data-page-transition-phase]');
    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveAttribute('data-page-transition-phase', 'preparingExit');
    expect(pages[1]).toHaveAttribute('data-page-transition-phase', 'preparingEnter');
    expect(pages[0]).toHaveAttribute('aria-hidden', 'true');
    expect(pages[0]).toHaveAttribute('inert');
    expect(pages[1]).toHaveAttribute('aria-hidden', 'false');
    expect(pages[1]).not.toHaveAttribute('inert');
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Buttons')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
    });

    const animatingPages = container.querySelectorAll('[data-page-transition-phase]');
    expect(animatingPages).toHaveLength(2);
    expect(animatingPages[0]).toHaveAttribute('data-page-transition-phase', 'exiting');
    expect(animatingPages[1]).toHaveAttribute('data-page-transition-phase', 'entering');

    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });

    const settledPages = container.querySelectorAll('[data-page-transition-phase]');
    expect(settledPages).toHaveLength(1);
    expect(settledPages[0]).toHaveAttribute('data-page-transition-phase', 'idle');
    expect(screen.queryByText('Menu')).toBeNull();
    expect(screen.getByText('Buttons')).toBeInTheDocument();
    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
  });

  it('does not restart an in-flight transition when timing props change', async () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <PageTransition transitionKey="menu" timingScale={1}>
        <div>Menu</div>
      </PageTransition>,
    );

    rerender(
      <PageTransition transitionKey="buttons" timingScale={1}>
        <div>Buttons</div>
      </PageTransition>,
    );
    rerender(
      <PageTransition transitionKey="buttons" timingScale={2}>
        <div>Buttons</div>
      </PageTransition>,
    );

    await act(async () => {
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
    });
    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });

    const pages = container.querySelectorAll('[data-page-transition-phase]');
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveAttribute('data-page-transition-phase', 'idle');
  });

  it('completes the transition when children change during the preparing phase', async () => {
    vi.useFakeTimers();
    const onTransitionEnd = vi.fn();
    const { container, rerender } = render(
      <PageTransition transitionKey="menu" onTransitionEnd={onTransitionEnd}>
        <div>Menu</div>
      </PageTransition>
    );

    // Start the transition (key change → preparing phase).
    rerender(
      <PageTransition transitionKey="buttons" onTransitionEnd={onTransitionEnd}>
        <div>Buttons v1</div>
      </PageTransition>
    );

    const preparing = container.querySelectorAll('[data-page-transition-phase]');
    expect(preparing[0]).toHaveAttribute('data-page-transition-phase', 'preparingExit');
    expect(preparing[1]).toHaveAttribute('data-page-transition-phase', 'preparingEnter');

    // Children change WHILE still preparing (no frames advanced yet). This is the
    // regression: it must not cancel-and-wedge the transition.
    rerender(
      <PageTransition transitionKey="buttons" onTransitionEnd={onTransitionEnd}>
        <div>Buttons v2</div>
      </PageTransition>
    );

    await act(async () => {
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
    });

    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });

    const settled = container.querySelectorAll('[data-page-transition-phase]');
    expect(settled).toHaveLength(1);
    expect(settled[0]).toHaveAttribute('data-page-transition-phase', 'idle');
    expect(screen.queryByText('Menu')).toBeNull();
    expect(screen.getByText('Buttons v2')).toBeInTheDocument();
    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
  });

  it('keeps updating the entering page children mid-animation (exiting page stays frozen)', async () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <PageTransition transitionKey="menu">
        <div>Menu</div>
      </PageTransition>
    );

    rerender(
      <PageTransition transitionKey="buttons">
        <div>Buttons v1</div>
      </PageTransition>
    );

    // Advance into the entering/exiting (animating) phase.
    await act(async () => {
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
    });

    const animating = container.querySelectorAll('[data-page-transition-phase]');
    expect(animating[0]).toHaveAttribute('data-page-transition-phase', 'exiting');
    expect(animating[1]).toHaveAttribute('data-page-transition-phase', 'entering');

    // Change children WHILE animating: the entering page updates, the exiting
    // page keeps its frozen snapshot.
    rerender(
      <PageTransition transitionKey="buttons">
        <div>Buttons v2</div>
      </PageTransition>
    );

    expect(screen.getByText('Buttons v2')).toBeInTheDocument();
    expect(screen.queryByText('Buttons v1')).toBeNull();
    expect(screen.getByText('Menu')).toBeInTheDocument(); // exiting page frozen

    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });

    const settled = container.querySelectorAll('[data-page-transition-phase]');
    expect(settled).toHaveLength(1);
    expect(screen.getByText('Buttons v2')).toBeInTheDocument();
    expect(screen.queryByText('Menu')).toBeNull();
  });

  it('restarts toward the new key when transitionKey changes mid-animation', async () => {
    vi.useFakeTimers();
    const onTransitionEnd = vi.fn();
    const { container, rerender } = render(
      <PageTransition transitionKey="a" onTransitionEnd={onTransitionEnd}>
        <div>A</div>
      </PageTransition>
    );

    // Start A -> B and advance into the animating phase.
    rerender(
      <PageTransition transitionKey="b" onTransitionEnd={onTransitionEnd}>
        <div>B</div>
      </PageTransition>
    );
    await act(async () => {
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
    });
    const animating = container.querySelectorAll('[data-page-transition-phase]');
    expect(animating[0]).toHaveAttribute('data-page-transition-phase', 'exiting');
    expect(animating[1]).toHaveAttribute('data-page-transition-phase', 'entering');

    // Interrupt with a new key C before A -> B settles. The in-flight transition
    // is cancelled and a fresh B -> C transition starts (B becomes the exiting
    // page, A is dropped) — it must not wedge.
    rerender(
      <PageTransition transitionKey="c" onTransitionEnd={onTransitionEnd}>
        <div>C</div>
      </PageTransition>
    );

    const restarted = container.querySelectorAll('[data-page-transition-phase]');
    expect(restarted).toHaveLength(2);
    expect(screen.queryByText('A')).toBeNull(); // older page dropped
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
      await Promise.resolve();
      vi.advanceTimersByTime(16);
    });
    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });

    const settled = container.querySelectorAll('[data-page-transition-phase]');
    expect(settled).toHaveLength(1);
    expect(settled[0]).toHaveAttribute('data-page-transition-phase', 'idle');
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('B')).toBeNull();
    expect(onTransitionEnd).toHaveBeenCalledTimes(1); // only the final settle
  });

  it('updates children without transition when the key is stable', () => {
    const { container, rerender } = render(
      <PageTransition transitionKey="menu">
        <div>Menu v1</div>
      </PageTransition>
    );

    rerender(
      <PageTransition transitionKey="menu">
        <div>Menu v2</div>
      </PageTransition>
    );

    const pages = container.querySelectorAll('[data-page-transition-phase]');
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveAttribute('data-page-transition-phase', 'idle');
    expect(screen.queryByText('Menu v1')).toBeNull();
    expect(screen.getByText('Menu v2')).toBeInTheDocument();
  });

  it('can disable transitions for router integrations that need an immediate swap', () => {
    const onTransitionEnd = vi.fn();
    const { container, rerender } = render(
      <PageTransition transitionKey="menu" disabled onTransitionEnd={onTransitionEnd}>
        <div>Menu</div>
      </PageTransition>
    );

    rerender(
      <PageTransition transitionKey="buttons" disabled onTransitionEnd={onTransitionEnd}>
        <div>Buttons</div>
      </PageTransition>
    );

    const pages = container.querySelectorAll('[data-page-transition-phase]');
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveAttribute('data-page-transition-phase', 'idle');
    expect(screen.queryByText('Menu')).toBeNull();
    expect(screen.getByText('Buttons')).toBeInTheDocument();
    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
  });

  it('focuses the top-left focusable element when a page first loads', () => {
    render(
      <PageTransition transitionKey="menu">
        <button
          ref={(element) => {
            if (element != null) {
              element.getBoundingClientRect = () => ({
                bottom: 140,
                height: 40,
                left: 20,
                right: 120,
                top: 100,
                width: 100,
                x: 20,
                y: 100,
                toJSON: () => {},
              });
            }
          }}
        >
          Lower
        </button>
        <button
          ref={(element) => {
            if (element != null) {
              element.getBoundingClientRect = () => ({
                bottom: 50,
                height: 40,
                left: 40,
                right: 140,
                top: 10,
                width: 100,
                x: 40,
                y: 10,
                toJSON: () => {},
              });
            }
          }}
        >
          Top
        </button>
      </PageTransition>
    );

    expect(document.activeElement).toBe(screen.getByText('Top'));
  });

  it('skips focusables that opt out of automatic initial focus', () => {
    render(
      <PageTransition transitionKey="subnavigation">
        <button
          data-uit-initial-focus-excluded="true"
          ref={(element) => {
            if (element != null) {
              element.getBoundingClientRect = () => ({
                bottom: 50,
                height: 40,
                left: 10,
                right: 150,
                top: 10,
                width: 140,
                x: 10,
                y: 10,
                toJSON: () => {},
              });
            }
          }}
        >
          Header item
        </button>
        <button
          ref={(element) => {
            if (element != null) {
              element.getBoundingClientRect = () => ({
                bottom: 140,
                height: 40,
                left: 20,
                right: 160,
                top: 100,
                width: 140,
                x: 20,
                y: 100,
                toJSON: () => {},
              });
            }
          }}
        >
          Content item
        </button>
      </PageTransition>
    );

    expect(document.activeElement).toBe(screen.getByText('Content item'));
  });

  it('can skip initial focus when pages manage their own focus', () => {
    render(
      <PageTransition transitionKey="menu" initialFocus="none">
        <button>Menu action</button>
      </PageTransition>
    );

    expect(document.activeElement).not.toBe(screen.getByText('Menu action'));
  });

  it('can use a selected initial focus target', () => {
    render(
      <PageTransition
        transitionKey="menu"
        initialFocus={{ selector: '[data-initial-focus="true"]' }}
      >
        <button>First action</button>
        <button data-initial-focus="true">Selected action</button>
      </PageTransition>
    );

    expect(document.activeElement).toBe(screen.getByText('Selected action'));
  });

  it('retries initial focus when the browser parks focus on the app root', () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    root.tabIndex = -1;
    document.body.append(root);

    try {
      render(
        <PageTransition transitionKey="menu">
          <button>Menu action</button>
        </PageTransition>,
        { container: root },
      );

      const menuAction = screen.getByText('Menu action');
      expect(document.activeElement).toBe(menuAction);

      act(() => {
        root.focus();
      });
      expect(document.activeElement).toBe(root);

      act(() => {
        vi.advanceTimersByTime(75);
      });

      expect(document.activeElement).toBe(menuAction);
    } finally {
      root.remove();
      vi.useRealTimers();
    }
  });

  it('restores an interactable when the browser parks focus on an idle app root', async () => {
    vi.useFakeTimers();
    const stateChanges = vi.fn();
    const root = document.createElement('div');
    root.tabIndex = -1;
    document.body.append(root);

    try {
      render(
        <PageTransition transitionKey="menu" initialFocus="none">
          <Container onStateChange={(_prev, next) => stateChanges(next.state)}>
            <span>Menu item</span>
          </Container>
        </PageTransition>,
        { container: root },
      );
      const menuItem = screen
        .getByText('Menu item')
        .closest('[role="button"]') as HTMLElement;

      act(() => {
        menuItem.focus();
      });
      expect(stateChanges).toHaveBeenCalledWith(State.FOCUSED);
      stateChanges.mockClear();

      await act(async () => {
        root.focus();
        await Promise.resolve();
      });

      expect(document.activeElement).toBe(menuItem);
      expect(stateChanges).not.toHaveBeenCalledWith(State.DEFAULT);
    } finally {
      root.remove();
      vi.useRealTimers();
    }
  });

  it('forwards focus and blur capture to the consumer while tracking its own', async () => {
    const onFocusCapture = vi.fn();
    const onBlurCapture = vi.fn();
    const root = document.createElement('div');
    root.tabIndex = -1;
    document.body.append(root);

    try {
      render(
        <PageTransition
          transitionKey="menu"
          initialFocus="none"
          onFocusCapture={onFocusCapture}
          onBlurCapture={onBlurCapture}
        >
          <button>Menu action</button>
        </PageTransition>,
        { container: root },
      );
      const menuAction = screen.getByText('Menu action');

      await act(async () => {
        menuAction.focus();
        await Promise.resolve();
      });
      expect(onFocusCapture).toHaveBeenCalled();

      // The component composes blur capture to track which page holds focus.
      // That must not swallow the consumer's handler: the prop is part of the
      // public DOM surface and the JSX binding overrides the props spread.
      await act(async () => {
        menuAction.blur();
        await Promise.resolve();
      });
      expect(onBlurCapture).toHaveBeenCalled();
    } finally {
      root.remove();
    }
  });

  it('lets an idle page release focus when the application blurs to the body', async () => {
    const stateChanges = vi.fn();
    const root = document.createElement('div');
    root.tabIndex = -1;
    document.body.append(root);

    try {
      render(
        <PageTransition transitionKey="menu" initialFocus="none">
          <Container onStateChange={(_prev, next) => stateChanges(next.state)}>
            <span>Menu item</span>
          </Container>
        </PageTransition>,
        { container: root },
      );
      const menuItem = screen
        .getByText('Menu item')
        .closest('[role="button"]') as HTMLElement;

      act(() => {
        menuItem.focus();
      });
      expect(document.activeElement).toBe(menuItem);
      expect(stateChanges).toHaveBeenCalledWith(State.FOCUSED);
      stateChanges.mockClear();

      // A deliberate exit — a background click or an explicit blur() — parks
      // focus on the body rather than on a non-focusable ancestor. That is a
      // real focus exit, not a transition artifact, so the coordinator must
      // leave it alone: otherwise content inside a PageTransition page (most
      // application content) could never release focus at all.
      await act(async () => {
        menuItem.blur();
        await Promise.resolve();
      });

      expect(document.activeElement).toBe(document.body);

      // The owner's visual state is released on the next frame, so the focus
      // ring does not linger on content the user has navigated away from.
      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
      });

      expect(stateChanges).toHaveBeenCalledWith(State.DEFAULT);
    } finally {
      root.remove();
    }
  });

  it('lets an empty nested Pager page keep structural focus inside an idle transition', async () => {
    render(
      <PageTransition transitionKey="menu" initialFocus="none">
        <Pager>
          <Container onClick={() => {}}>Current action</Container>
          <div>Static nested page</div>
        </Pager>
      </PageTransition>,
    );
    const current = screen.getByRole('button', { name: 'Current action' });

    await act(async () => {
      current.focus();
      fireEvent.keyDown(current, { key: 'ArrowRight' });
      await Promise.resolve();
    });

    expect(document.activeElement).toBe(
      screen.getByRole('group', { name: 'Page 2 of 2' }),
    );
  });

  it('restores focused element and scroll position when returning to a page', () => {
    vi.useFakeTimers();
    const applyScrollableMetrics = (element: HTMLDivElement | null) => {
      if (element == null) {
        return;
      }

      Object.defineProperty(element, 'clientHeight', {
        configurable: true,
        value: 100,
      });
      Object.defineProperty(element, 'scrollHeight', {
        configurable: true,
        value: 500,
      });
    };
    const renderPage = (name: string) => (
      <div>
        <button>{name} first</button>
        <div ref={applyScrollableMetrics} data-testid={`${name}-scroll`}>
          <button>{name} second</button>
        </div>
      </div>
    );
    const { rerender } = render(
      <PageTransition transitionKey="menu">
        {renderPage('menu')}
      </PageTransition>
    );
    const menuScroll = screen.getByTestId('menu-scroll');
    menuScroll.scrollTop = 144;
    screen.getByText('menu second').focus();

    rerender(
      <PageTransition transitionKey="buttons">
        {renderPage('buttons')}
      </PageTransition>
    );
    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });

    rerender(
      <PageTransition transitionKey="menu" direction="back">
        {renderPage('menu')}
      </PageTransition>
    );

    expect(screen.getByTestId('menu-scroll').scrollTop).toBe(144);
    expect(document.activeElement).toBe(screen.getByText('menu second'));
  });

  it('restores nested scroll state when the outgoing page temporarily overflows', () => {
    vi.useFakeTimers();
    const applyScrollableMetrics = (element: HTMLDivElement | null) => {
      if (element == null) {
        return;
      }

      Object.defineProperty(element, 'clientHeight', {
        configurable: true,
        value: 100,
      });
      Object.defineProperty(element, 'scrollHeight', {
        configurable: true,
        value: 500,
      });
    };
    const renderPage = (name: string) => (
      <div>
        <button>{name} first</button>
        <div ref={applyScrollableMetrics} data-testid={`${name}-scroll`}>
          <button>{name} second</button>
        </div>
      </div>
    );
    const { container, rerender } = render(
      <PageTransition transitionKey="menu">
        {renderPage('menu')}
      </PageTransition>
    );
    const menuScroll = screen.getByTestId('menu-scroll');
    menuScroll.scrollTop = 144;
    screen.getByText('menu second').focus();

    const outgoingPage = container.querySelector(
      '[data-page-transition-key="menu"]',
    );
    expect(outgoingPage).toBeInstanceOf(HTMLElement);
    Object.defineProperty(outgoingPage, 'clientWidth', {
      configurable: true,
      value: 100,
    });
    Object.defineProperty(outgoingPage, 'scrollWidth', {
      configurable: true,
      value: 200,
    });

    rerender(
      <PageTransition transitionKey="buttons">
        {renderPage('buttons')}
      </PageTransition>
    );
    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });

    rerender(
      <PageTransition transitionKey="menu" direction="back">
        {renderPage('menu')}
      </PageTransition>
    );

    expect(screen.getByTestId('menu-scroll').scrollTop).toBe(144);
    expect(document.activeElement).toBe(screen.getByText('menu second'));
  });

  it('restores the last interacted element when clicks navigate before focus changes', () => {
    vi.useFakeTimers();
    const renderPage = (name: string) => (
      <div>
        <button>{name} first</button>
        <button>{name} second</button>
      </div>
    );
    const { rerender } = render(
      <PageTransition transitionKey="menu" initialFocus="none">
        {renderPage('menu')}
      </PageTransition>
    );

    fireEvent.pointerDown(screen.getByText('menu second'));

    rerender(
      <PageTransition transitionKey="buttons" initialFocus="none">
        {renderPage('buttons')}
      </PageTransition>
    );
    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });

    rerender(
      <PageTransition transitionKey="menu" direction="back" initialFocus="none">
        {renderPage('menu')}
      </PageTransition>
    );

    expect(document.activeElement).toBe(screen.getByText('menu second'));
  });

  it('does not let a stale pointer target override later focused route state', () => {
    vi.useFakeTimers();
    const renderPage = (name: string) => (
      <div>
        <button>{name} first</button>
        <button>{name} second</button>
      </div>
    );
    const { rerender } = render(
      <PageTransition transitionKey="menu" initialFocus="none">
        {renderPage('menu')}
      </PageTransition>
    );

    fireEvent.pointerDown(screen.getByText('menu first'));
    screen.getByText('menu second').focus();

    rerender(
      <PageTransition transitionKey="buttons" initialFocus="none">
        {renderPage('buttons')}
      </PageTransition>
    );
    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });

    rerender(
      <PageTransition transitionKey="menu" direction="back" initialFocus="none">
        {renderPage('menu')}
      </PageTransition>
    );

    expect(document.activeElement).toBe(screen.getByText('menu second'));
  });

  it('restores the last focused page element if browser focus is lost before snapshot', () => {
    vi.useFakeTimers();
    const renderPage = (name: string) => (
      <div>
        <button>{name} first</button>
        <button>{name} second</button>
      </div>
    );
    const { rerender } = render(
      <PageTransition transitionKey="menu" initialFocus="none">
        {renderPage('menu')}
      </PageTransition>
    );

    screen.getByText('menu second').focus();
    screen.getByText('menu second').blur();

    rerender(
      <PageTransition transitionKey="buttons" initialFocus="none">
        {renderPage('buttons')}
      </PageTransition>
    );
    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });

    rerender(
      <PageTransition transitionKey="menu" direction="back" initialFocus="none">
        {renderPage('menu')}
      </PageTransition>
    );

    expect(document.activeElement).toBe(screen.getByText('menu second'));
  });

  it('force-syncs the toolkit focus owner state when restoring a clicked element', () => {
    vi.useFakeTimers();
    const menuStateChanges = vi.fn();
    const renderMenu = () => (
      <Container onStateChange={(_prev, next) => menuStateChanges(next.state)}>
        <span>menu item</span>
      </Container>
    );
    const { rerender } = render(
      <PageTransition transitionKey="menu" initialFocus="none">
        {renderMenu()}
      </PageTransition>
    );

    fireEvent.pointerDown(screen.getByText('menu item'));

    rerender(
      <PageTransition transitionKey="buttons" initialFocus="none">
        <button>buttons first</button>
      </PageTransition>
    );
    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });
    menuStateChanges.mockClear();

    rerender(
      <PageTransition transitionKey="menu" direction="back" initialFocus="none">
        {renderMenu()}
      </PageTransition>
    );

    expect(document.activeElement).toBe(
      screen.getByText('menu item').closest('[role="button"]'),
    );
    expect(menuStateChanges).toHaveBeenCalledWith(State.FOCUSED);
  });

  it('keeps the toolkit focus state when WebView parks focus on an unowned route shell', () => {
    vi.useFakeTimers();
    const menuStateChanges = vi.fn();
    const root = document.createElement('div');
    root.tabIndex = -1;
    document.body.append(root);
    const renderMenu = () => (
      <Container onStateChange={(_prev, next) => menuStateChanges(next.state)}>
        <span>menu item</span>
      </Container>
    );

    try {
      const { rerender } = render(
        <PageTransition transitionKey="menu" initialFocus="none">
          {renderMenu()}
        </PageTransition>,
        { container: root },
      );
      const menuItem = screen
        .getByText('menu item')
        .closest('[role="button"]') as HTMLElement;

      act(() => {
        menuItem.focus();
      });
      expect(menuStateChanges).toHaveBeenCalledWith(State.FOCUSED);
      menuStateChanges.mockClear();

      rerender(
        <PageTransition transitionKey="buttons" initialFocus="none">
          <button>buttons first</button>
        </PageTransition>,
      );
      act(() => {
        root.focus();
      });
      act(() => {
        vi.advanceTimersByTime(16);
      });

      expect(menuStateChanges).not.toHaveBeenCalledWith(State.DEFAULT);
    } finally {
      root.remove();
      vi.useRealTimers();
    }
  });

  it('resets partial focus feedback instead of handing off across pages', () => {
    vi.useFakeTimers();
    const menuPartialFocus = vi.fn();
    const buttonsPartialFocus = vi.fn();
    const renderPage = (
      label: string,
      onPartialFocusHandoff: typeof menuPartialFocus,
    ) => (
      <Container onPartialFocusHandoff={onPartialFocusHandoff}>
        <span>{label}</span>
      </Container>
    );
    const { rerender } = render(
      <PageTransition transitionKey="menu">
        {renderPage('menu item', menuPartialFocus)}
      </PageTransition>
    );
    menuPartialFocus.mockClear();

    rerender(
      <PageTransition transitionKey="buttons">
        {renderPage('buttons item', buttonsPartialFocus)}
      </PageTransition>
    );

    expect(menuPartialFocus).not.toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'outgoing' }),
    );
    expect(buttonsPartialFocus).not.toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'incoming' }),
    );
  });

  it('restores ScrollView position immediately without smooth focus scrolling', () => {
    vi.useFakeTimers();
    const scrollTo = vi.fn();
    const applyScrollViewMetrics = (element: HTMLDivElement | null) => {
      if (element == null) {
        return;
      }

      Object.defineProperty(element, 'clientHeight', {
        configurable: true,
        value: 100,
      });
      Object.defineProperty(element, 'scrollHeight', {
        configurable: true,
        value: 500,
      });
      element.getBoundingClientRect = () => ({
        bottom: 100,
        height: 100,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => {},
      });
      Object.defineProperty(element, 'scrollTo', {
        configurable: true,
        value: scrollTo,
      });
    };
    const applySecondButtonRect = (element: HTMLButtonElement | null) => {
      if (element == null) {
        return;
      }

      element.getBoundingClientRect = () => ({
        bottom: 30,
        height: 30,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => {},
      });
    };
    const renderMenu = () => (
      <ScrollView ref={applyScrollViewMetrics} height={100} ariaLabel="Menu scroll">
        <button>menu first</button>
        <button ref={applySecondButtonRect}>menu second</button>
      </ScrollView>
    );
    const { rerender } = render(
      <PageTransition transitionKey="menu">
        {renderMenu()}
      </PageTransition>
    );
    const menuScroll = screen.getByRole('region', { name: 'Menu scroll' });
    screen.getByText('menu second').focus();
    menuScroll.scrollTop = 144;

    rerender(
      <PageTransition transitionKey="buttons">
        <button>buttons first</button>
      </PageTransition>
    );
    act(() => {
      vi.advanceTimersByTime(InAppPageTransitionConfig.forward.totalDurationMs);
    });
    scrollTo.mockClear();

    rerender(
      <PageTransition transitionKey="menu" direction="back">
        {renderMenu()}
      </PageTransition>
    );

    expect(screen.getByRole('region', { name: 'Menu scroll' }).scrollTop).toBe(144);
    expect(document.activeElement).toBe(screen.getByText('menu second'));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
