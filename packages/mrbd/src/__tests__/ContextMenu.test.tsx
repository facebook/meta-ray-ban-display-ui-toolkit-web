/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ContextMenu tests
 *
 * Constants:
 * - Height: 72px (CONTEXT_MENU_HEIGHT)
 * - Shadow blur: 6px
 * - Item spacing: 8px
 * - Fading edge: 64px
 * - Tail: 17px height, 25.5px width
 * - Dismiss on Escape, Up/Down arrows
 */

import { createRef, useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ContextMenu, DismissReason } from '../mrbd/ui/ContextMenu';
import type { ContextMenuHandle } from '../mrbd/ui/ContextMenu';
import { ContextMenuItemView } from '../mrbd/ui/ContextMenuItemView';
import { Button } from '../mrbd/ui/Button';
import { TooltipMode } from '@wearables-ui-toolkit/foundation/base/TooltipMode';
import { Pager } from '@wearables-ui-toolkit/foundation/components/Pager';
import { contextMenuPath } from '../mrbd/ui/private/ContextMenuPath';
import { generateRoundedPolygonPath } from '@wearables-ui-toolkit/foundation/utils/SmoothCorners';

function ButtonContextMenuHarness({
  onDismiss,
}: {
  onDismiss: (reason: DismissReason) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Button
      title="Actions"
      alwaysShowText
      tooltipMode={isOpen ? TooltipMode.FOCUSED : TooltipMode.NONE}
      tooltipFocusable
      tooltipContent={
        <ContextMenu
          onDismiss={(reason) => {
            onDismiss(reason);
            setIsOpen(false);
          }}
        >
          <ContextMenuItemView label="Share" />
        </ContextMenu>
      }
    />
  );
}

function PersistentButtonContextMenuHarness({
  onDismiss,
}: {
  onDismiss: (reason: DismissReason) => void;
}) {
  return (
    <Button
      title="Actions"
      alwaysShowText
      tooltipMode={TooltipMode.FOCUSED}
      tooltipFocusable
      tooltipContent={
        <ContextMenu onDismiss={onDismiss}>
          <ContextMenuItemView label="Share" />
        </ContextMenu>
      }
    />
  );
}

function NestedPagerContextMenuHarness({
  onDismiss,
}: {
  onDismiss: (reason: DismissReason) => void;
}) {
  const [pageIndex, setPageIndex] = useState(1);
  return (
    <Pager
      currentPageIndex={pageIndex}
      onPageChange={nextIndex => setPageIndex(nextIndex)}
      useBackButtonForHome
      homeIndex={0}
    >
      <button>Home action</button>
      <ButtonContextMenuHarness onDismiss={onDismiss} />
    </Pager>
  );
}

describe('ContextMenu initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<ContextMenu />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('exposes the menu container DOM node via the imperative handle', () => {
    const ref = createRef<ContextMenuHandle>();

    render(<ContextMenu ref={ref} />);

    expect(ref.current?.getElement()).toBeInstanceOf(HTMLDivElement);
  });

  it('has role=menu', () => {
    render(<ContextMenu />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <ContextMenu>
        <ContextMenuItemView label="Item 1" />
        <ContextMenuItemView label="Item 2" />
      </ContextMenu>
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});

describe('ContextMenu scrollToItem imperative API', () => {
  it('scrolls the item at the given index into view smoothly by default', () => {
    const ref = createRef<ContextMenuHandle>();
    render(
      <ContextMenu ref={ref}>
        <ContextMenuItemView label="One" />
        <ContextMenuItemView label="Two" />
        <ContextMenuItemView label="Three" />
      </ContextMenu>,
    );
    const items = screen.getAllByRole('menuitem');
    const scrollIntoView = vi.fn();
    items.forEach((item) => {
      item.scrollIntoView = scrollIntoView;
    });

    act(() => {
      ref.current?.scrollToItem(2);
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' }),
    );
    expect(scrollIntoView.mock.instances[0]).toBe(items[2]);
  });

  it('scrolls immediately when smooth is false', () => {
    const ref = createRef<ContextMenuHandle>();
    render(
      <ContextMenu ref={ref}>
        <ContextMenuItemView label="One" />
        <ContextMenuItemView label="Two" />
      </ContextMenu>,
    );
    const items = screen.getAllByRole('menuitem');
    const scrollIntoView = vi.fn();
    items.forEach((item) => {
      item.scrollIntoView = scrollIntoView;
    });

    act(() => {
      ref.current?.scrollToItem(1, false);
    });

    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'auto' }),
    );
    expect(scrollIntoView.mock.instances[0]).toBe(items[1]);
  });

  it('is a no-op for an out-of-range index', () => {
    const ref = createRef<ContextMenuHandle>();
    render(
      <ContextMenu ref={ref}>
        <ContextMenuItemView label="One" />
      </ContextMenu>,
    );
    const items = screen.getAllByRole('menuitem');
    const scrollIntoView = vi.fn();
    items.forEach((item) => {
      item.scrollIntoView = scrollIntoView;
    });

    act(() => {
      ref.current?.scrollToItem(5);
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe('ContextMenu dismiss', () => {
  it('Escape key dismisses with BACK_BUTTON reason', () => {
    const handleDismiss = vi.fn();
    const { container } = render(<ContextMenu onDismiss={handleDismiss} />);
    const scrollContainer = container.querySelector('[class*="scrollContainer"]')!;
    fireEvent.keyDown(scrollContainer, { key: 'Escape' });
    expect(handleDismiss).toHaveBeenCalledWith(DismissReason.BACK_BUTTON);
  });

  it('browser Back dismisses a focusable popup with BACK_BUTTON reason', async () => {
    const handleDismiss = vi.fn();
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 2 };
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        right: 220,
        bottom: 100,
        left: 0,
        width: 220,
        height: 100,
        toJSON: () => ({}),
      } as DOMRect);
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(<ButtonContextMenuHarness onDismiss={handleDismiss} />);

    try {
      const trigger = screen.getByRole('button', { name: 'Actions' });
      trigger.focus();
      const [menuItem] = await screen.findAllByRole('menuitem', { hidden: true });
      await waitFor(() => expect(document.activeElement).toBe(menuItem));

      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });

      expect(handleDismiss).toHaveBeenCalledWith(DismissReason.BACK_BUTTON);
      expect(document.activeElement).toBe(trigger);
      await act(() => new Promise(resolve => setTimeout(resolve, 0)));
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    } finally {
      view.unmount();
      rectSpy.mockRestore();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('shares one Back entry between a popup and its enclosing Pager', async () => {
    const handleDismiss = vi.fn();
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 2 };
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        right: 220,
        bottom: 100,
        left: 0,
        width: 220,
        height: 100,
        toJSON: () => ({}),
      } as DOMRect);
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <NestedPagerContextMenuHarness onDismiss={handleDismiss} />,
    );

    try {
      const trigger = screen.getByRole('button', { name: 'Actions' });
      trigger.focus();
      const [menuItem] = await screen.findAllByRole('menuitem', { hidden: true });
      await waitFor(() => expect(document.activeElement).toBe(menuItem));

      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });

      expect(handleDismiss).toHaveBeenCalledWith(DismissReason.BACK_BUTTON);
      expect(screen.getByLabelText('Page viewer')).toHaveAttribute(
        'data-current-page',
        '1',
      );
      await waitFor(() => {
        expect(window.history.state.__uitTransientBackEntry).toEqual(
          expect.any(String),
        );
      });

      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });
      expect(screen.getByLabelText('Page viewer')).toHaveAttribute(
        'data-current-page',
        '0',
      );
    } finally {
      view.unmount();
      rectSpy.mockRestore();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('re-arms Back while a controlled popup remains visible', async () => {
    const handleDismiss = vi.fn();
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 2 };
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        right: 220,
        bottom: 100,
        left: 0,
        width: 220,
        height: 100,
        toJSON: () => ({}),
      } as DOMRect);
    window.history.replaceState(initialState, '', window.location.href);
    const applicationRoot = document.createElement('div');
    applicationRoot.tabIndex = -1;
    document.body.appendChild(applicationRoot);
    const view = render(
      <PersistentButtonContextMenuHarness onDismiss={handleDismiss} />,
      { container: applicationRoot },
    );

    try {
      const trigger = screen.getByRole('button', { name: 'Actions' });
      trigger.focus();
      const [menuItem] = await screen.findAllByRole('menuitem', { hidden: true });
      await waitFor(() => expect(document.activeElement).toBe(menuItem));

      act(() => applicationRoot.focus());
      expect(document.activeElement).toBe(applicationRoot);
      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });
      expect(handleDismiss).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(document.activeElement).toBe(menuItem));

      act(() => applicationRoot.focus());
      await waitFor(() => expect(document.activeElement).toBe(menuItem));
      await waitFor(() => {
        expect(window.history.state.__uitTransientBackEntry).toEqual(
          expect.any(String),
        );
      });

      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });
      expect(handleDismiss).toHaveBeenCalledTimes(2);
    } finally {
      view.unmount();
      applicationRoot.remove();
      rectSpy.mockRestore();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('ArrowUp dismisses with NAVIGATION reason', () => {
    const handleDismiss = vi.fn();
    const { container } = render(<ContextMenu onDismiss={handleDismiss} />);
    const scrollContainer = container.querySelector('[class*="scrollContainer"]')!;
    fireEvent.keyDown(scrollContainer, { key: 'ArrowUp' });
    expect(handleDismiss).toHaveBeenCalledWith(DismissReason.NAVIGATION);
  });

  it('ArrowDown dismisses with NAVIGATION reason', () => {
    const handleDismiss = vi.fn();
    const { container } = render(<ContextMenu onDismiss={handleDismiss} />);
    const scrollContainer = container.querySelector('[class*="scrollContainer"]')!;
    fireEvent.keyDown(scrollContainer, { key: 'ArrowDown' });
    expect(handleDismiss).toHaveBeenCalledWith(DismissReason.NAVIGATION);
  });

  it('requests directional focus search from the focused menu item before vertical dismissal', () => {
    const handleDismiss = vi.fn();
    const anchor = document.createElement('button');
    const handleSearch = vi.fn((event: Event) => {
      const detail = (event as CustomEvent).detail;
      expect(detail.origin).toBe(screen.getByRole('menuitem'));
      expect(detail.originRect).toMatchObject({
        left: expect.any(Number),
        top: expect.any(Number),
        right: expect.any(Number),
        bottom: expect.any(Number),
      });
      expect(detail.direction).toBe('down');
      detail.handled = true;
      event.preventDefault();
    });
    document.addEventListener('uit-focus-search-from-origin', handleSearch);

    const { container } = render(
      <ContextMenu focusSearchOrigin={anchor} onDismiss={handleDismiss}>
        <ContextMenuItemView label="One" />
      </ContextMenu>,
    );
    const item = screen.getByRole('menuitem');
    item.focus();

    fireEvent.keyDown(container.querySelector('[class*="scrollContainer"]')!, { key: 'ArrowDown' });

    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleDismiss).toHaveBeenCalledWith(DismissReason.NAVIGATION);
    document.removeEventListener('uit-focus-search-from-origin', handleSearch);
  });

  it('requests directional focus search from the focused menu item at horizontal menu edges', () => {
    const handleDismiss = vi.fn();
    const anchor = document.createElement('button');
    const handleSearch = vi.fn((event: Event) => {
      const detail = (event as CustomEvent).detail;
      expect(detail.origin).toBe(screen.getAllByRole('menuitem')[1]);
      expect(detail.originRect).toMatchObject({
        left: expect.any(Number),
        top: expect.any(Number),
        right: expect.any(Number),
        bottom: expect.any(Number),
      });
      expect(detail.direction).toBe('right');
      detail.handled = true;
      event.preventDefault();
    });
    document.addEventListener('uit-focus-search-from-origin', handleSearch);

    render(
      <ContextMenu focusSearchOrigin={anchor} onDismiss={handleDismiss}>
        <ContextMenuItemView label="One" />
        <ContextMenuItemView label="Two" />
      </ContextMenu>,
    );
    const items = screen.getAllByRole('menuitem');
    items[1].focus();

    fireEvent.keyDown(items[1], { key: 'ArrowRight' });

    expect(handleSearch).toHaveBeenCalledTimes(1);
    // Horizontal edge overflow keeps the menu open (it only dismisses on
    // vertical focus-search failure); the focus-search request still fires.
    expect(handleDismiss).not.toHaveBeenCalled();
    document.removeEventListener('uit-focus-search-from-origin', handleSearch);
  });

  it('falls back to the anchor origin when no menu item owns focus', () => {
    const handleDismiss = vi.fn();
    const anchor = document.createElement('button');
    document.body.appendChild(anchor);
    const handleSearch = vi.fn((event: Event) => {
      const detail = (event as CustomEvent).detail;
      expect(detail.origin).toBe(anchor);
      expect(detail.originRect).toMatchObject({
        left: expect.any(Number),
        top: expect.any(Number),
        right: expect.any(Number),
        bottom: expect.any(Number),
      });
      expect(detail.direction).toBe('down');
      detail.handled = true;
      event.preventDefault();
    });
    document.addEventListener('uit-focus-search-from-origin', handleSearch);

    const { container } = render(
      <ContextMenu focusSearchOrigin={anchor} onDismiss={handleDismiss}>
        <ContextMenuItemView label="One" />
      </ContextMenu>,
    );
    anchor.focus();

    fireEvent.keyDown(container.querySelector('[class*="scrollContainer"]')!, { key: 'ArrowDown' });

    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleDismiss).toHaveBeenCalledWith(DismissReason.NAVIGATION);
    document.removeEventListener('uit-focus-search-from-origin', handleSearch);
    document.body.removeChild(anchor);
  });

  it('exits horizontal navigation from the item reached by menu navigation', () => {
    const handleDismiss = vi.fn();
    const anchor = document.createElement('button');
    const handleSearch = vi.fn((event: Event) => {
      const detail = (event as CustomEvent).detail;
      expect(detail.origin).toBe(screen.getAllByRole('menuitem')[1]);
      expect(detail.originRect).toMatchObject({
        left: expect.any(Number),
        top: expect.any(Number),
        right: expect.any(Number),
        bottom: expect.any(Number),
      });
      expect(detail.direction).toBe('right');
      detail.handled = true;
      event.preventDefault();
    });
    document.addEventListener('uit-focus-search-from-origin', handleSearch);

    const { container } = render(
      <ContextMenu focusSearchOrigin={anchor} onDismiss={handleDismiss}>
        <ContextMenuItemView label="One" />
        <ContextMenuItemView label="Two" />
      </ContextMenu>,
    );
    const scrollContainer = container.querySelector('[class*="scrollContainer"]') as HTMLElement;
    scrollContainer.scrollTo = vi.fn();
    const items = screen.getAllByRole('menuitem');
    items[0].focus();

    fireEvent.keyDown(items[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(items[1]);

    fireEvent.keyDown(items[1], { key: 'ArrowRight' });

    expect(handleSearch).toHaveBeenCalledTimes(1);
    // Horizontal edge overflow keeps the menu open (it only dismisses on
    // vertical focus-search failure); the focus-search request still fires.
    expect(handleDismiss).not.toHaveBeenCalled();
    document.removeEventListener('uit-focus-search-from-origin', handleSearch);
  });

  it('keeps a focusable popup open when focus briefly falls back to the application boundary', async () => {
    const handleDismiss = vi.fn();
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        right: 220,
        bottom: 100,
        left: 0,
        width: 220,
        height: 100,
        toJSON: () => ({}),
      } as DOMRect);
    const applicationRoot = document.createElement('div');
    applicationRoot.tabIndex = -1;
    document.body.appendChild(applicationRoot);
    const view = render(
      <ButtonContextMenuHarness onDismiss={handleDismiss} />,
      { container: applicationRoot },
    );

    try {
      const trigger = screen.getByRole('button', { name: 'Actions' });
      trigger.focus();
      const item = await screen.findByRole('menuitem', { hidden: true });
      await waitFor(() => expect(document.activeElement).toBe(item));

      item.blur();

      await waitFor(() => expect(document.activeElement).toBe(item));
      expect(handleDismiss).not.toHaveBeenCalled();
    } finally {
      view.unmount();
      applicationRoot.remove();
      rectSpy.mockRestore();
    }
  });

  it('preserves a queued focus-out dismissal across consumer re-render', () => {
    vi.useFakeTimers();
    const handleDismiss = vi.fn();
    const renderMenu = (revision: number) => (
      <>
        <ContextMenu onDismiss={reason => handleDismiss(revision, reason)}>
          <ContextMenuItemView label="One" />
        </ContextMenu>
        <button>Outside</button>
      </>
    );
    const view = render(renderMenu(1));
    const menu = screen.getByRole('menu');
    const outside = screen.getByText('Outside');

    try {
      outside.focus();
      menu.dispatchEvent(
        new FocusEvent('focusout', {
          bubbles: true,
          relatedTarget: outside,
        }),
      );

      // Recreate the inline onDismiss callback before the queued task runs.
      view.rerender(renderMenu(2));
      vi.runAllTimers();

      expect(handleDismiss).toHaveBeenCalledWith(2, DismissReason.NAVIGATION);
    } finally {
      view.unmount();
      vi.useRealTimers();
    }
  });

  it('dismisses when focus leaves the context menu', async () => {
    const handleDismiss = vi.fn();
    render(
      <>
        <ContextMenu onDismiss={handleDismiss}>
          <ContextMenuItemView label="One" />
        </ContextMenu>
        <button>Outside</button>
      </>,
    );

    const menu = screen.getByRole('menu');
    const item = screen.getByRole('menuitem');
    const outside = screen.getByText('Outside');

    await waitFor(() => {
      expect(document.activeElement).toBe(item);
    });

    outside.focus();
    menu.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: outside,
      }),
    );

    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalledWith(DismissReason.NAVIGATION);
    });
  });

  it('dismisses on focus loss after an ignored Escape dismissal', async () => {
    const handleDismiss = vi.fn();
    const { container } = render(
      <>
        <ContextMenu onDismiss={handleDismiss}>
          <ContextMenuItemView label="One" />
        </ContextMenu>
        <button>Outside</button>
      </>,
    );

    const menu = screen.getByRole('menu');
    const item = screen.getByRole('menuitem');
    const outside = screen.getByText('Outside');
    const scrollContainer = container.querySelector('[class*="scrollContainer"]')!;

    await waitFor(() => {
      expect(document.activeElement).toBe(item);
    });

    // The consumer keeps the menu mounted with focus inside, ignoring the
    // Escape dismissal.
    fireEvent.keyDown(scrollContainer, { key: 'Escape' });
    expect(handleDismiss).toHaveBeenCalledWith(DismissReason.BACK_BUTTON);

    // Let the unacknowledged dismissal marker expire.
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));
    expect(document.activeElement).toBe(item);

    outside.focus();
    menu.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: outside,
      }),
    );

    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalledWith(DismissReason.NAVIGATION);
    });
  });

  it('dismisses on focus loss after a consumer re-render strands an ignored dismissal', async () => {
    const handleDismiss = vi.fn();
    function RerenderingMenu() {
      const [tick, setTick] = useState(0);
      return (
        <>
          <ContextMenu
            onDismiss={(reason: DismissReason) => {
              handleDismiss(reason);
              setTick(current => current + 1);
            }}
          >
            <ContextMenuItemView label="One" />
          </ContextMenu>
          <button>Outside</button>
          <span data-testid="render-tick">{tick}</span>
        </>
      );
    }
    const { container } = render(<RerenderingMenu />);

    const menu = screen.getByRole('menu');
    const item = screen.getByRole('menuitem');
    const outside = screen.getByText('Outside');
    const scrollContainer = container.querySelector('[class*="scrollContainer"]')!;

    await waitFor(() => {
      expect(document.activeElement).toBe(item);
    });

    // The consumer re-renders (recreating its inline dismissal callback)
    // while ignoring the dismissal and keeping the menu mounted.
    fireEvent.keyDown(scrollContainer, { key: 'Escape' });
    expect(handleDismiss).toHaveBeenCalledWith(DismissReason.BACK_BUTTON);
    expect(screen.getByTestId('render-tick')).toHaveTextContent('1');

    // Let the re-arm timer fire across the re-render.
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    outside.focus();
    menu.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: outside,
      }),
    );

    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalledWith(DismissReason.NAVIGATION);
    });
  });
});

describe('DismissReason enum', () => {
  it('NAVIGATION = "navigation"', () => {
    expect(DismissReason.NAVIGATION).toBe('navigation');
  });
  it('BACK_BUTTON = "back_button"', () => {
    expect(DismissReason.BACK_BUTTON).toBe('back_button');
  });
});

describe('ContextMenu tail', () => {
  it('uses a single integrated material path when showTail=true and direction set', () => {
    // maxWidth gives a deterministic width so the path is emitted in jsdom (no
    // layout/measurement); without a measured size or maxWidth, pathD is null.
    const { container } = render(
      <ContextMenu showTail tailDirection="down" tailCenterX={100} maxWidth={200} />
    );
    const path = container.querySelector('svg path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('d')?.length).toBeGreaterThan(300);
  });

  it('omits tail vertices when showTail=false', () => {
    const { container } = render(
      <ContextMenu showTail={false} tailDirection="down" tailCenterX={100} maxWidth={200} />
    );
    const path = container.querySelector('svg path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('d')).not.toContain('101');
  });

  it('omits tail vertices when no direction specified', () => {
    const { container } = render(<ContextMenu showTail maxWidth={200} />);
    const path = container.querySelector('svg path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('d')).not.toContain('101');
  });

  it('honors maxWidth from tooltip positioning', () => {
    const { container } = render(<ContextMenu maxWidth={320} />);
    const menu = container.firstElementChild as HTMLElement;
    expect(menu.style.maxWidth).toBe('320px');
  });

  it('uses a degraded (fewer-vertex) tail path for very narrow containers', () => {
    // Wide container -> full 7-point tail; very narrow container -> degraded
    // 5-point tail (no base vertices).
    const wide = contextMenuPath({
      width: 200,
      height: 89,
      inset: 6,
      tailDirection: 'down',
      tailCenterX: 100,
    });
    const narrow = contextMenuPath({
      width: 60,
      height: 89,
      inset: 6,
      tailDirection: 'down',
      tailCenterX: 30,
    });
    const countCurves = (d: string) => (d.match(/C/g) ?? []).length;
    expect(countCurves(narrow)).toBeLessThan(countCurves(wide));
    expect(narrow.length).toBeGreaterThan(0);
  });

  it('keeps degraded tail placement responsive to the requested center', () => {
    const leftBiased = contextMenuPath({
      width: 60,
      height: 89,
      inset: 6,
      tailDirection: 'down',
      tailCenterX: 20,
    });
    const rightBiased = contextMenuPath({
      width: 60,
      height: 89,
      inset: 6,
      tailDirection: 'down',
      tailCenterX: 40,
    });
    expect(leftBiased).not.toBe(rightBiased);
  });

  it('preserves full pill geometry above the public FULL numeric sentinel', () => {
    const path = contextMenuPath({
      width: 4000,
      height: 4000,
      inset: 0,
      tailCenterX: 2000,
    });
    const expectedPath = generateRoundedPolygonPath(
      [
        { x: 0, y: 0, r: 2000 },
        { x: 4000, y: 0, r: 2000 },
        { x: 4000, y: 4000, r: 2000 },
        { x: 0, y: 4000, r: 2000 },
      ],
      0.75,
    );

    expect(path).toBe(expectedPath);
  });
});

describe('ContextMenu fading edges', () => {
  function getLeftFade(scrollViewport: Element) {
    return scrollViewport.querySelector<HTMLElement>('[class*="fadingEdgeLeft"]')!;
  }

  function getRightFade(scrollViewport: Element) {
    return scrollViewport.querySelector<HTMLElement>('[class*="fadingEdgeRight"]')!;
  }

  function setScrollMetrics(
    element: Element,
    metrics: { clientWidth: number; scrollWidth: number; scrollLeft: number },
  ) {
    Object.defineProperty(element, 'clientWidth', {
      configurable: true,
      value: metrics.clientWidth,
    });
    Object.defineProperty(element, 'scrollWidth', {
      configurable: true,
      value: metrics.scrollWidth,
    });
    Object.defineProperty(element, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: metrics.scrollLeft,
    });
  }

  function renderScrollableMenu() {
    const rendered = render(
      <ContextMenu maxWidth={180}>
        <ContextMenuItemView label="One" />
        <ContextMenuItemView label="Two" />
        <ContextMenuItemView label="Three" />
        <ContextMenuItemView label="Four" />
      </ContextMenu>
    );
    const scrollContainer = rendered.container.querySelector(
      '[class*="scrollContainer"]',
    )!;
    const scrollViewport = rendered.container.querySelector(
      '[class*="scrollViewport"]',
    )!;
    return { ...rendered, scrollContainer, scrollViewport };
  }

  it('does not show fading edges when all items fit', async () => {
    const { scrollContainer, scrollViewport } = renderScrollableMenu();

    setScrollMetrics(scrollContainer, {
      clientWidth: 320,
      scrollWidth: 320,
      scrollLeft: 0,
    });
    fireEvent.scroll(scrollContainer);

    await waitFor(() => {
      expect(getLeftFade(scrollViewport).style.opacity).toBe('0');
      expect(getRightFade(scrollViewport).style.opacity).toBe('0');
    });
  });

  it('shows only the right fading edge at the start of overflowing content', async () => {
    const { scrollContainer, scrollViewport } = renderScrollableMenu();

    setScrollMetrics(scrollContainer, {
      clientWidth: 180,
      scrollWidth: 360,
      scrollLeft: 0,
    });
    fireEvent.scroll(scrollContainer);

    await waitFor(() => {
      expect(getLeftFade(scrollViewport).style.opacity).toBe('0');
      expect(getRightFade(scrollViewport).style.opacity).toBe('1');
    });
  });

  it('updates fading edges as horizontal scroll position changes', async () => {
    const { scrollContainer, scrollViewport } = renderScrollableMenu();

    setScrollMetrics(scrollContainer, {
      clientWidth: 180,
      scrollWidth: 360,
      scrollLeft: 40,
    });
    fireEvent.scroll(scrollContainer);

    await waitFor(() => {
      expect(getLeftFade(scrollViewport).style.opacity).toBe('0.625');
      expect(getRightFade(scrollViewport).style.opacity).toBe('1');
    });

    setScrollMetrics(scrollContainer, {
      clientWidth: 180,
      scrollWidth: 360,
      scrollLeft: 180,
    });
    fireEvent.scroll(scrollContainer);

    await waitFor(() => {
      expect(getLeftFade(scrollViewport).style.opacity).toBe('1');
      expect(getRightFade(scrollViewport).style.opacity).toBe('0');
    });
  });

  it('renders fading edges as fixed viewport overlays instead of scroll masks', async () => {
    const { scrollContainer, scrollViewport } = renderScrollableMenu();

    setScrollMetrics(scrollContainer, {
      clientWidth: 180,
      scrollWidth: 360,
      scrollLeft: 40,
    });
    fireEvent.scroll(scrollContainer);

    await waitFor(() => {
      expect(getLeftFade(scrollViewport).style.opacity).toBe('0.625');
      expect(getRightFade(scrollViewport).style.opacity).toBe('1');
    });
    expect(
      (scrollViewport as HTMLElement).style.getPropertyValue('--uit-fading-edge-mask'),
    ).toBe('');
    expect(
      (scrollContainer as HTMLElement).style.getPropertyValue('--uit-fading-edge-mask'),
    ).toBe('');
  });

  it('uses a configurable fixed fading edge length', async () => {
    const rendered = render(
      <ContextMenu maxWidth={180} fadingEdgeLength={40}>
        <ContextMenuItemView label="One" />
        <ContextMenuItemView label="Two" />
        <ContextMenuItemView label="Three" />
      </ContextMenu>,
    );
    const scrollContainer = rendered.container.querySelector(
      '[class*="scrollContainer"]',
    )!;
    const scrollViewport = rendered.container.querySelector(
      '[class*="scrollViewport"]',
    )!;

    setScrollMetrics(scrollContainer, {
      clientWidth: 180,
      scrollWidth: 360,
      scrollLeft: 20,
    });
    fireEvent.scroll(scrollContainer);

    await waitFor(() => {
      expect(
        (scrollViewport as HTMLElement).style.getPropertyValue(
          '--uit-context-menu-fading-edge-length',
        ),
      ).toBe('40px');
      expect(getLeftFade(scrollViewport).style.opacity).toBe('0.5');
      expect(getRightFade(scrollViewport).style.opacity).toBe('1');
    });
  });

  it('scrolls focused menu items past active fading edges', () => {
    const { container } = render(
      <ContextMenu maxWidth={180}>
        <ContextMenuItemView label="One" />
        <ContextMenuItemView label="Two" />
        <ContextMenuItemView label="Three" />
      </ContextMenu>,
    );
    const scrollContainer = container.querySelector<HTMLElement>(
      '[class*="scrollContainer"]',
    )!;
    const items = screen.getAllByRole('menuitem');
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(performance.now() + 1000);
        return 1;
      });

    setScrollMetrics(scrollContainer, {
      clientWidth: 180,
      scrollWidth: 360,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollContainer, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    });
    scrollContainer.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 180,
      bottom: 72,
      width: 180,
      height: 72,
      toJSON: () => {},
    });
    items[1].getBoundingClientRect = () => ({
      x: 120,
      y: 0,
      top: 0,
      left: 120,
      right: 170,
      bottom: 72,
      width: 50,
      height: 72,
      toJSON: () => {},
    });

    act(() => {
      items[0].focus();
      fireEvent.keyDown(items[0], { key: 'ArrowRight' });
    });

    expect(scrollContainer.scrollTop).toBe(0);
    expect(scrollContainer.scrollLeft).toBe(62);

    requestAnimationFrameSpy.mockRestore();
  });
});

describe('ContextMenu custom props', () => {
  it('accepts className', () => {
    const { container } = render(<ContextMenu className="my-menu" />);
    expect(container.firstElementChild?.className).toContain('my-menu');
  });
});
