/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InteractableTooltipPortal } from '@wearables-ui-toolkit/foundation/base/InteractableTooltipPortal';
import { TooltipPosition } from '@wearables-ui-toolkit/foundation/base/TooltipPopup';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

function renderPortal(overrides = {}) {
  return render(
    <InteractableTooltipPortal
      isMounted
      isVisible
      text="Tooltip"
      focusable={false}
      showTail
      position={TooltipPosition.ANCHORED}
      anchorRef={createRef<HTMLDivElement>()}
      onFocusWithinChange={vi.fn()}
      onExited={vi.fn()}
      {...overrides}
    />,
  );
}

function ScaledAnchorContextMenuHarness() {
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div data-testid="boundary" data-uit-tooltip-boundary>
      <div ref={anchorRef} data-testid="anchor">Anchor</div>
      <InteractableTooltipPortal
        isMounted
        isVisible
        content={<div>Menu</div>}
        focusable
        showTail
        position={TooltipPosition.ANCHORED}
        anchorRef={anchorRef}
        onFocusWithinChange={vi.fn()}
        onExited={vi.fn()}
      />
    </div>
  );
}

function FocusableTooltipHarness({ isVisible }: { isVisible: boolean }) {
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <div data-testid="application-boundary" tabIndex={-1}>
      <button ref={anchorRef}>Anchor</button>
      <button>Navigation target</button>
      <InteractableTooltipPortal
        isMounted
        isVisible={isVisible}
        content={<button>Menu item</button>}
        focusable
        showTail={false}
        position={TooltipPosition.ANCHORED}
        anchorRef={anchorRef}
        onFocusWithinChange={vi.fn()}
        onExited={vi.fn()}
      />
    </div>
  );
}

describe('InteractableTooltipPortal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render while unmounted', () => {
    renderPortal({ isMounted: false });

    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('does not render without text or content', () => {
    renderPortal({ text: undefined, content: undefined });

    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('renders mounted tooltip content into the document portal', () => {
    renderPortal();

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-label',
      'Tooltip',
    );
  });

  it('restores the anchor when a focused popup starts dismissing', () => {
    const { rerender } = render(<FocusableTooltipHarness isVisible />);
    screen.getByText('Menu item').focus();

    rerender(<FocusableTooltipHarness isVisible={false} />);

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Anchor' }),
    );
  });

  it('preserves focus moved by navigation before popup dismissal', () => {
    const { rerender } = render(<FocusableTooltipHarness isVisible />);
    const navigationTarget = screen.getByRole('button', {
      name: 'Navigation target',
    });
    screen.getByText('Menu item').focus();
    navigationTarget.focus();

    rerender(<FocusableTooltipHarness isVisible={false} />);

    expect(document.activeElement).toBe(navigationTarget);
  });

  it('restores the anchor when focus falls to the application boundary on exit', async () => {
    const { rerender } = render(<FocusableTooltipHarness isVisible />);
    screen.getByText('Menu item').focus();

    rerender(<FocusableTooltipHarness isVisible={false} />);
    screen.getByTestId('application-boundary').focus();
    fireEvent.animationEnd(screen.getByRole('tooltip', { hidden: true }));

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Anchor' }),
      );
    });
  });

  it('forwards document Back to focused tooltip content before page navigation', () => {
    const onDismiss = vi.fn();
    const onPageBack = vi.fn();
    const anchorRef = createRef<HTMLButtonElement>();
    const handlePageBack = (event: KeyboardEvent) => {
      if (!event.defaultPrevented) {
        onPageBack();
      }
    };
    document.addEventListener('keydown', handlePageBack);

    try {
      render(
        <>
          <button ref={anchorRef}>Anchor</button>
          <InteractableTooltipPortal
            isMounted
            isVisible
            content={
              <button
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    onDismiss();
                  }
                }}
              >
                Menu item
              </button>
            }
            focusable
            showTail={false}
            position={TooltipPosition.ANCHORED}
            anchorRef={anchorRef}
            onFocusWithinChange={vi.fn()}
            onExited={vi.fn()}
          />
        </>,
      );
      screen.getByText('Menu item').focus();

      const backEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape',
      });
      document.dispatchEvent(backEvent);

      expect(onDismiss).toHaveBeenCalledOnce();
      expect(backEvent.defaultPrevented).toBe(true);
      expect(onPageBack).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', handlePageBack);
    }
  });

  it.each(['Escape', 'Backspace', 'BrowserBack', 'GoBack'])(
    'requests shared tooltip dismissal for the %s Back alias',
    (key) => {
      const onBackRequest = vi.fn();
      renderPortal({
        content: <button>Menu item</button>,
        text: undefined,
        focusable: true,
        onBackRequest,
      });
      // A focusable popup registers a transient Back owner, so it answers every
      // Back alias — not just Escape. ContextMenu and VerticalMenu match
      // 'Escape' literally instead, which is why the accessibility guide
      // documents those two separately from this surface.
      fireEvent.keyDown(document, { key });

      expect(onBackRequest).toHaveBeenCalledOnce();
    },
  );

  it('requests shared tooltip dismissal when content does not handle Back', () => {
    const onBackRequest = vi.fn();
    renderPortal({
      content: <button>Menu item</button>,
      text: undefined,
      focusable: true,
      onBackRequest,
    });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onBackRequest).toHaveBeenCalledOnce();
  });

  it('ignores a forwarded Back Escape from a sibling popup', () => {
    const onBackRequest = vi.fn();
    renderPortal({
      content: <button>Menu item</button>,
      text: undefined,
      focusable: true,
      onBackRequest,
    });

    const forwarded = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });
    (
      forwarded as KeyboardEvent & { __uitForwardedPopupBack?: boolean }
    ).__uitForwardedPopupBack = true;
    document.dispatchEvent(forwarded);

    expect(onBackRequest).not.toHaveBeenCalled();
    expect(forwarded.defaultPrevented).toBe(false);
  });

  it('dismisses a focusable tooltip when browser history moves back', () => {
    const onBackRequest = vi.fn();
    const initialState = { idx: 2 };
    window.history.replaceState(initialState, '', window.location.href);
    renderPortal({
      content: <button>Menu item</button>,
      text: undefined,
      focusable: true,
      onBackRequest,
    });

    expect(window.history.state.__uitTransientBackEntry).toEqual(
      expect.any(String),
    );
    window.history.replaceState(initialState, '', window.location.href);
    window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));

    expect(onBackRequest).toHaveBeenCalledOnce();
  });

  it('recovers persistent popup focus without polling animation frames', () => {
    vi.useFakeTimers();
    const frameCallbacks: FrameRequestCallback[] = [];
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(callback => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      });
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 2 };
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(<FocusableTooltipHarness isVisible />);

    try {
      const menuItem = screen.getByText('Menu item');
      menuItem.focus();
      requestFrame.mockClear();
      frameCallbacks.length = 0;

      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });

      expect(requestFrame).toHaveBeenCalledTimes(1);
      act(() => frameCallbacks.shift()?.(performance.now()));

      screen.getByTestId('application-boundary').focus();
      expect(document.activeElement).toBe(menuItem);

      const navigationTarget = screen.getByRole('button', {
        name: 'Navigation target',
      });
      navigationTarget.focus();
      expect(document.activeElement).toBe(navigationTarget);
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
      vi.useRealTimers();
    }
  });

  it('forwards browser Back to menu content when no menu item can receive focus', () => {
    const onDismiss = vi.fn();
    const onBackRequest = vi.fn();
    const initialState = { idx: 3 };
    window.history.replaceState(initialState, '', window.location.href);

    renderPortal({
      content: (
        <div
          role="menu"
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onDismiss();
            }
          }}
        >
          <button disabled>Unavailable</button>
        </div>
      ),
      text: undefined,
      focusable: true,
      onBackRequest,
    });

    window.history.replaceState(initialState, '', window.location.href);
    window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onBackRequest).not.toHaveBeenCalled();
  });

  it('positions provided content from the unscaled anchor bounds when the anchor is scaled', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.dataset.testid === 'anchor' ? 190 : 0;
      });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.dataset.testid === 'anchor' ? 88 : 0;
      });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        if (this.dataset.testid === 'boundary') {
          return rect(0, 0, 600, 600);
        }
        if (this.dataset.testid === 'anchor') {
          return rect(33.272728, 72, 155.454544, 72);
        }
        if (this.getAttribute('role') === 'tooltip') {
          return rect(0, 0, 288, 113);
        }
        return rect(0, 0, 0, 0);
      });

    render(<ScaledAnchorContextMenuHarness />);

    const tooltip = screen.getByRole('tooltip', { hidden: true });

    await waitFor(() => {
      expect(tooltip.style.visibility).toBe('visible');
    });
    expect(tooltip.style.left).toBe('-10px');
    expect(tooltip.style.top).toBe('144px');
  });
});
