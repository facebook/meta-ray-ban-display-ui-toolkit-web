/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRef, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Link, MemoryRouter } from 'react-router-dom';
import { TooltipMode } from '@wearables-ui-toolkit/foundation/base/TooltipMode';
import {
  State,
  type InteractionState,
} from '@wearables-ui-toolkit/foundation/base/Interactions';
import { TooltipPosition } from '@wearables-ui-toolkit/foundation/base/TooltipPopup';
import { Button } from '../mrbd/ui/Button';
import {
  getVerticalMenuAnchorProps,
  VerticalMenu,
  VerticalMenuCorner,
  VerticalMenuDismissReason,
} from '../mrbd/ui/VerticalMenu';
import { VerticalMenuButton } from '../mrbd/ui/VerticalMenuButton';

function ButtonMenuHarness({
  onDismissRequest,
  onStateChange,
}: {
  onDismissRequest?: (reason: VerticalMenuDismissReason) => void;
  onStateChange?: (previous: InteractionState, next: InteractionState) => void;
} = {}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Button
      title="Actions"
      alwaysShowText
      tooltipMode={isOpen ? TooltipMode.FOCUSED : TooltipMode.NONE}
      tooltipHidesFocusState
      onStateChange={onStateChange}
      tooltipContent={
        <VerticalMenu
          onDismissRequest={(reason) => {
            onDismissRequest?.(reason);
            setIsOpen(false);
          }}
        >
          <VerticalMenuButton text="Share" />
          <VerticalMenuButton text="Delete" />
        </VerticalMenu>
      }
      {...getVerticalMenuAnchorProps(VerticalMenuCorner.BELOW_LEFT)}
    />
  );
}

describe('VerticalMenu', () => {
  it('renders a fixed-width menu surface with interactive children', () => {
    render(
      <VerticalMenu aria-label="Actions" autoFocusFirstItem={false}>
        <VerticalMenuButton text="Share" />
        <VerticalMenuButton text="Delete" />
      </VerticalMenu>,
    );

    expect(screen.getByRole('menu', { name: 'Actions' })).toHaveStyle({ width: '220px' });
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    const share = screen.getByRole('menuitem', { name: 'Share' });
    expect(share).toHaveTextContent('Share');
    expect(share.tagName).toBe('BUTTON');
    expect(share).toHaveAttribute('type', 'button');
  });

  it('supports router-link props and a correctly typed forwarded ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <MemoryRouter>
        <VerticalMenu autoFocusFirstItem={false}>
          <VerticalMenuButton
            as={Link}
            ref={ref}
            to="/settings"
            text="Settings"
          />
        </VerticalMenu>
      </MemoryRouter>,
    );

    const item = screen.getByRole('menuitem', { name: 'Settings' });
    expect(item.tagName).toBe('A');
    expect(item).toHaveAttribute('href', '/settings');
    expect(ref.current).toBe(item);
  });

  it('supports an optional leading icon', () => {
    const { container } = render(
      <VerticalMenu autoFocusFirstItem={false}>
        <VerticalMenuButton
          text="Share"
          icon={{ viewBox: '0 0 24 24', paths: [{ d: 'M0 0h24v24z' }] }}
        />
        <VerticalMenuButton text="Delete" />
      </VerticalMenu>,
    );

    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('uses the standard aria-label prop for an overridden accessible name', () => {
    render(
      <VerticalMenu autoFocusFirstItem={false}>
        <VerticalMenuButton text="Share" aria-label="Share item" />
      </VerticalMenu>,
    );

    expect(
      screen.getByRole('menuitem', { name: 'Share item' }),
    ).toBeInTheDocument();
  });

  it('focuses the first item, moves vertically, and dismisses at an edge', async () => {
    const onDismissRequest = vi.fn();
    render(
      <VerticalMenu onDismissRequest={onDismissRequest}>
        <VerticalMenuButton text="First" />
        <VerticalMenuButton text="Second" />
      </VerticalMenu>,
    );
    const [first, second] = screen.getAllByRole('menuitem');
    await waitFor(() => expect(document.activeElement).toBe(first));

    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(second);
    expect(onDismissRequest).not.toHaveBeenCalled();

    fireEvent.keyDown(second, { key: 'ArrowDown' });
    expect(onDismissRequest).toHaveBeenCalledWith(
      VerticalMenuDismissReason.NAVIGATION,
    );
  });

  it('retains the trigger when ArrowUp dismisses the first item', async () => {
    const onDismissRequest = vi.fn();
    const onStateChange = vi.fn();
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
    const browserRoot = document.createElement('div');
    browserRoot.tabIndex = -1;
    document.body.appendChild(browserRoot);
    const view = render(
      <ButtonMenuHarness
        onDismissRequest={onDismissRequest}
        onStateChange={onStateChange}
      />,
      { container: browserRoot },
    );

    try {
      const trigger = screen.getByRole('button', { name: 'Actions' });
      trigger.focus();

      const [firstItem] = await screen.findAllByRole('menuitem', { hidden: true });
      await waitFor(() => expect(document.activeElement).toBe(firstItem));
      fireEvent.keyDown(firstItem, { key: 'ArrowUp' });

      expect(onDismissRequest).toHaveBeenCalledWith(
        VerticalMenuDismissReason.NAVIGATION,
      );
      await waitFor(() => expect(document.activeElement).toBe(trigger));
      await act(async () => {});
      onStateChange.mockClear();

      act(() => browserRoot.focus());
      await waitFor(() => expect(document.activeElement).toBe(trigger));
      expect(
        onStateChange.mock.calls.some(([, next]) => next.state === State.DEFAULT),
      ).toBe(false);
    } finally {
      view.unmount();
      browserRoot.remove();
      rectSpy.mockRestore();
    }
  });

  it('reclaims first-item focus while a popup mount is settling', async () => {
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame')
      .mockImplementation(callback => window.setTimeout(
        () => callback(performance.now()),
        50,
      ));
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(frameId => window.clearTimeout(frameId));
    const applicationBoundary = document.createElement('div');
    applicationBoundary.tabIndex = -1;
    document.body.appendChild(applicationBoundary);

    try {
      render(
        <VerticalMenu>
          <VerticalMenuButton text="First" />
          <VerticalMenuButton text="Second" />
        </VerticalMenu>,
        { container: applicationBoundary },
      );
      const first = screen.getByRole('menuitem', { name: 'First' });
      await waitFor(() => expect(document.activeElement).toBe(first));

      applicationBoundary.focus();
      expect(document.activeElement).toBe(applicationBoundary);
      await waitFor(() => expect(document.activeElement).toBe(first));
    } finally {
      applicationBoundary.remove();
      requestFrame.mockRestore();
      cancelFrame.mockRestore();
    }
  });

  it('does not reclaim focus from an unrelated non-tabbable container', () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame')
      .mockImplementation(callback => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      });

    try {
      const { container } = render(
        <>
          <VerticalMenu>
            <VerticalMenuButton text="First" />
          </VerticalMenu>
          <div data-testid="external-panel" tabIndex={-1}>
            Panel
          </div>
        </>,
      );
      const first = screen.getByRole('menuitem', { name: 'First' });
      const panel = container.querySelector(
        '[data-testid="external-panel"]',
      ) as HTMLElement;
      first.focus();
      panel.focus();

      act(() => {
        frameCallbacks.splice(0).forEach(callback => callback(performance.now()));
      });

      expect(document.activeElement).toBe(panel);
    } finally {
      requestFrame.mockRestore();
    }
  });

  it('does not reclaim focus from a legitimate external text input', () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame')
      .mockImplementation(callback => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      });

    try {
      render(
        <>
          <VerticalMenu>
            <VerticalMenuButton text="First" />
          </VerticalMenu>
          <textarea aria-label="External input" />
        </>,
      );
      const first = screen.getByRole('menuitem', { name: 'First' });
      const externalInput = screen.getByRole('textbox', { name: 'External input' });
      first.focus();
      externalInput.focus();

      act(() => {
        frameCallbacks.splice(0).forEach(callback => callback(performance.now()));
      });

      expect(document.activeElement).toBe(externalInput);
    } finally {
      requestFrame.mockRestore();
    }
  });

  it('does not reclaim focus after Back starts dismissal', () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame')
      .mockImplementation(callback => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      });
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    try {
      render(
        <VerticalMenu
          focusSearchOrigin={trigger}
          onDismissRequest={() => trigger.focus()}
        >
          <VerticalMenuButton text="First" />
        </VerticalMenu>,
      );
      const first = screen.getByRole('menuitem', { name: 'First' });
      first.focus();

      fireEvent.keyDown(first, { key: 'Escape' });
      expect(document.activeElement).toBe(trigger);
      const pendingFrames = frameCallbacks.splice(0);
      act(() => {
        pendingFrames.forEach(callback => callback(performance.now()));
      });

      expect(document.activeElement).toBe(trigger);
    } finally {
      trigger.remove();
      requestFrame.mockRestore();
    }
  });

  it('retries first-item focus when tooltip positioning becomes ready', async () => {
    const applicationBoundary = document.createElement('div');
    applicationBoundary.tabIndex = -1;
    document.body.appendChild(applicationBoundary);
    const hiddenPosition = { isPositioned: false } as const;
    const visiblePosition = { isPositioned: true } as const;
    applicationBoundary.focus();
    const { rerender } = render(
      <VerticalMenu {...hiddenPosition}>
        <VerticalMenuButton text="First" />
      </VerticalMenu>,
    );
    const first = screen.getByRole('menuitem', { name: 'First' });
    expect(document.activeElement).toBe(applicationBoundary);
    rerender(
      <VerticalMenu {...visiblePosition}>
        <VerticalMenuButton text="First" />
      </VerticalMenu>,
    );

    await waitFor(() => expect(document.activeElement).toBe(first));
    applicationBoundary.remove();
  });

  it('moves to the first and last items with Home and End', () => {
    render(
      <VerticalMenu autoFocusFirstItem={false}>
        <VerticalMenuButton text="First" />
        <VerticalMenuButton text="Second" />
        <VerticalMenuButton text="Third" />
      </VerticalMenu>,
    );
    const [first, second, third] = screen.getAllByRole('menuitem');
    second.focus();

    fireEvent.keyDown(second, { key: 'End' });
    expect(document.activeElement).toBe(third);

    fireEvent.keyDown(third, { key: 'Home' });
    expect(document.activeElement).toBe(first);
  });

  it('includes custom menu items in focus and keyboard traversal', async () => {
    render(
      <VerticalMenu>
        <button type="button" role="menuitem">Custom first</button>
        <VerticalMenuButton text="Built in" />
        <button type="button" role="menuitem">Custom last</button>
      </VerticalMenu>,
    );
    const [first, second, last] = screen.getAllByRole('menuitem');

    await waitFor(() => expect(document.activeElement).toBe(first));

    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(second);

    fireEvent.keyDown(second, { key: 'End' });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(last, { key: 'Home' });
    expect(document.activeElement).toBe(first);
  });

  it('skips disabled and hidden items during traversal', () => {
    render(
      <VerticalMenu autoFocusFirstItem={false}>
        <VerticalMenuButton text="First" />
        <button type="button" role="menuitem" disabled>Disabled</button>
        <button type="button" role="menuitem" style={{ display: 'none' }}>Hidden</button>
        <VerticalMenuButton text="Last" />
      </VerticalMenu>,
    );
    const first = screen.getByRole('menuitem', { name: 'First' });
    const last = screen.getByRole('menuitem', { name: 'Last' });
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowDown' });

    expect(document.activeElement).toBe(last);
  });

  it('does not claim Escape or boundary navigation without a dismiss handler', () => {
    render(
      <VerticalMenu autoFocusFirstItem={false}>
        <VerticalMenuButton text="Only item" />
      </VerticalMenu>,
    );
    const item = screen.getByRole('menuitem', { name: 'Only item' });
    item.focus();

    expect(fireEvent.keyDown(item, { key: 'Escape' })).toBe(true);
    expect(fireEvent.keyDown(item, { key: 'ArrowDown' })).toBe(true);
    expect(document.activeElement).toBe(item);
  });

  it.each(['Backspace', 'BrowserBack', 'GoBack'])(
    'leaves a standalone menu untouched by the %s Back alias',
    (key) => {
      const onDismissRequest = vi.fn();
      render(
        <VerticalMenu onDismissRequest={onDismissRequest}>
          <VerticalMenuButton text="Item" />
        </VerticalMenu>,
      );

      // Standalone, the menu matches `Escape` literally and registers no
      // transient Back owner, so the other aliases fall through to the
      // application. Hosted in a focusable tooltip popup it dismisses on all
      // four — see the tooltip-hosted test above.
      fireEvent.keyDown(screen.getByRole('menuitem'), { key });

      expect(onDismissRequest).not.toHaveBeenCalled();
    },
  );

  it('dismisses on Escape and lets consumers prevent menu handling', () => {
    const onDismissRequest = vi.fn();
    const { rerender } = render(
      <VerticalMenu onDismissRequest={onDismissRequest}>
        <VerticalMenuButton text="Item" />
      </VerticalMenu>,
    );
    fireEvent.keyDown(screen.getByRole('menuitem'), { key: 'Escape' });
    expect(onDismissRequest).toHaveBeenCalledWith(VerticalMenuDismissReason.ESCAPE);

    onDismissRequest.mockClear();
    rerender(
      <VerticalMenu
        onDismissRequest={onDismissRequest}
        onKeyDownCapture={(event) => event.preventDefault()}
      >
        <VerticalMenuButton text="Item" />
      </VerticalMenu>,
    );
    fireEvent.keyDown(screen.getByRole('menuitem'), { key: 'Escape' });
    expect(onDismissRequest).not.toHaveBeenCalled();
  });

  it('retains trigger focus when WebView clears focus after browser Back', async () => {
    const onDismissRequest = vi.fn();
    const onStateChange = vi.fn();
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
    const browserRoot = document.createElement('div');
    browserRoot.tabIndex = -1;
    document.body.appendChild(browserRoot);
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <ButtonMenuHarness
        onDismissRequest={onDismissRequest}
        onStateChange={onStateChange}
      />,
      { container: browserRoot },
    );

    try {
      const trigger = screen.getByRole('button', { name: 'Actions' });
      trigger.focus();

      const [firstItem] = await screen.findAllByRole('menuitem', { hidden: true });
      await waitFor(() => expect(document.activeElement).toBe(firstItem));
      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });

      expect(onDismissRequest).toHaveBeenCalledWith(
        VerticalMenuDismissReason.ESCAPE,
      );
      await waitFor(() => expect(document.activeElement).toBe(trigger));
      await act(async () => {});
      onStateChange.mockClear();

      act(() => browserRoot.focus());
      await waitFor(() => expect(document.activeElement).toBe(trigger));
      expect(
        onStateChange.mock.calls.some(([, next]) => next.state === State.DEFAULT),
      ).toBe(false);
    } finally {
      view.unmount();
      browserRoot.remove();
      rectSpy.mockRestore();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it.each(['Backspace', 'BrowserBack', 'GoBack'])(
    'dismisses a tooltip-hosted menu on the %s Back alias',
    async (key) => {
      const rect = {
        x: 0,
        y: 0,
        top: 0,
        right: 220,
        bottom: 100,
        left: 0,
        width: 220,
        height: 100,
        toJSON: () => ({}),
      } as DOMRect;
      const rectSpy = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue(rect);
      const browserRoot = document.createElement('div');
      browserRoot.tabIndex = -1;
      document.body.appendChild(browserRoot);
      const view = render(<ButtonMenuHarness onStateChange={vi.fn()} />, {
        container: browserRoot,
      });

      try {
        const trigger = screen.getByRole('button', { name: 'Actions' });
        trigger.focus();

        const [firstItem] = await screen.findAllByRole('menuitem', {
          hidden: true,
        });
        await waitFor(() => expect(document.activeElement).toBe(firstItem));

        // The menu itself matches `Escape` literally, but hosting it in a
        // focusable tooltip popup puts a transient Back owner in front of it.
        // That owner answers every Back alias and forwards a synthetic Escape
        // into the menu, so an alias the menu never matches still dismisses it.
        fireEvent.keyDown(document, { key });

        await waitFor(() => expect(document.activeElement).toBe(trigger));
      } finally {
        view.unmount();
        browserRoot.remove();
        rectSpy.mockRestore();
      }
    },
  );

  it('retains the trigger when Escape dismisses a Button tooltip menu', async () => {
    const onStateChange = vi.fn();
    const rect = {
      x: 0,
      y: 0,
      top: 0,
      right: 220,
      bottom: 100,
      left: 0,
      width: 220,
      height: 100,
      toJSON: () => ({}),
    } as DOMRect;
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(rect);
    const browserRoot = document.createElement('div');
    browserRoot.tabIndex = -1;
    document.body.appendChild(browserRoot);
    const view = render(<ButtonMenuHarness onStateChange={onStateChange} />, {
      container: browserRoot,
    });

    try {
      const trigger = screen.getByRole('button', { name: 'Actions' });
      trigger.focus();

      const [firstItem] = await screen.findAllByRole('menuitem', { hidden: true });
      await waitFor(() => expect(document.activeElement).toBe(firstItem));
      fireEvent.keyDown(firstItem, { key: 'Escape' });

      await waitFor(() => expect(document.activeElement).toBe(trigger));
      await act(async () => {});
      onStateChange.mockClear();

      act(() => browserRoot.focus());
      await waitFor(() => expect(document.activeElement).toBe(trigger));
      expect(
        onStateChange.mock.calls.some(([, next]) => next.state === State.DEFAULT),
      ).toBe(false);
    } finally {
      view.unmount();
      browserRoot.remove();
      rectSpy.mockRestore();
    }
  });
});

describe('getVerticalMenuAnchorProps', () => {
  it('maps corners to tooltip placement and fixed-width alignment', () => {
    const left = getVerticalMenuAnchorProps(VerticalMenuCorner.BELOW_LEFT);
    const right = getVerticalMenuAnchorProps(VerticalMenuCorner.ABOVE_RIGHT);
    expect(getVerticalMenuAnchorProps(VerticalMenuCorner.BELOW_LEFT)).toBe(left);
    expect(getVerticalMenuAnchorProps(VerticalMenuCorner.ABOVE_RIGHT)).toBe(right);
    const anchor = document.createElement('div');
    Object.defineProperties(anchor, {
      offsetWidth: { configurable: true, value: 400 },
      offsetHeight: { configurable: true, value: 72 },
    });

    expect(left.tooltipPosition).toBe(TooltipPosition.ANCHORED_BOTTOM);
    expect(left.tooltipShowTail).toBe(false);
    expect(left.tooltipTargetRectProvider(anchor)).toMatchObject({
      left: 110,
      right: 110,
      top: 0,
      bottom: 72,
    });
    expect(right.tooltipPosition).toBe(TooltipPosition.ANCHORED);
    expect(right.tooltipTargetRectProvider(anchor)).toMatchObject({
      left: 290,
      right: 290,
    });

    Object.defineProperty(anchor, 'offsetWidth', { value: 72 });
    expect(left.tooltipTargetRectProvider(anchor)).toMatchObject({
      left: 110,
      right: 110,
    });
    expect(right.tooltipTargetRectProvider(anchor)).toMatchObject({
      left: -38,
      right: -38,
    });
  });
});
