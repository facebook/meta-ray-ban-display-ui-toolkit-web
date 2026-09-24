/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * InteractableBase regression tests for shared focus, press, and tooltip state.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, useState } from 'react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  FOCUS_NAVIGATION_HANDLED_EVENT,
  InteractableBase,
  PartialFocusSupportedAxis,
  TooltipMode,
  type PartialFocusHandoffDetail,
} from '@wearables-ui-toolkit/foundation/base/InteractableBase';
import {
  InteractionConstants,
  InteractionState,
  State,
} from '@wearables-ui-toolkit/foundation/base/Interactions';
import { registerAutoFocusFirstOwner } from '@wearables-ui-toolkit/foundation/base/FocusCoordinator';

function latestState(states: InteractionState[]): InteractionState {
  const state = states[states.length - 1];
  if (state == null) {
    throw new Error('Expected at least one state update');
  }
  return state;
}

function DismissiblePopupContent({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button type="button" onClick={onDismiss}>
      Close popup
    </button>
  );
}

function DismissibleFocusableTooltip({
  onStateChange,
}: {
  onStateChange: (previous: InteractionState, next: InteractionState) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <InteractableBase
      aria-label="Popup anchor"
      tooltipMode={isOpen ? TooltipMode.FOCUSED : TooltipMode.NONE}
      tooltipContent={(
        <DismissiblePopupContent onDismiss={() => setIsOpen(false)} />
      )}
      tooltipFocusable
      tooltipHidesFocusState
      onStateChange={onStateChange}
    >
      Popup anchor
    </InteractableBase>
  );
}

function latestHandoff(handoffs: PartialFocusHandoffDetail[]): PartialFocusHandoffDetail {
  const handoff = handoffs[handoffs.length - 1];
  if (handoff == null) {
    throw new Error('Expected at least one partial focus handoff');
  }
  return handoff;
}

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

describe('InteractableBase focus ownership', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clears the previous focused interactable when another one receives focus', () => {
    const firstStates: InteractionState[] = [];
    const secondStates: InteractionState[] = [];

    render(
      <>
        <InteractableBase
          aria-label="First"
          onStateChange={(_previous, next) => firstStates.push(next)}
        >
          First
        </InteractableBase>
        <InteractableBase
          aria-label="Second"
          onStateChange={(_previous, next) => secondStates.push(next)}
        >
          Second
        </InteractableBase>
      </>,
    );

    act(() => {
      screen.getByLabelText('First').focus();
    });
    expect(latestState(firstStates).state).toBe(State.FOCUSED);

    act(() => {
      screen.getByLabelText('Second').focus();
    });

    expect(latestState(firstStates).state).toBe(State.DEFAULT);
    expect(latestState(secondStates).state).toBe(State.FOCUSED);
  });

  it('forwards function refs while keeping internal focus ownership', () => {
    const forwardedRef = vi.fn();
    const states: InteractionState[] = [];

    render(
      <InteractableBase
        ref={forwardedRef}
        aria-label="Forwarded ref target"
        onStateChange={(_previous, next) => states.push(next)}
      >
        Forwarded ref target
      </InteractableBase>,
    );

    const target = screen.getByLabelText('Forwarded ref target');
    expect(forwardedRef).toHaveBeenCalledWith(target);

    act(() => {
      target.focus();
    });

    expect(latestState(states).state).toBe(State.FOCUSED);
  });

  it('renders as a native button without replacing its native semantics', () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <InteractableBase as="button" ref={ref} type="button">
        Native action
      </InteractableBase>,
    );

    const button = screen.getByRole('button', { name: 'Native action' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).not.toHaveAttribute('role');
    expect(ref.current).toBe(button);
  });

  it('removes native roots from tab order when toolkit focusability is disabled', () => {
    const onClick = vi.fn();
    render(
      <InteractableBase
        as="button"
        type="button"
        interactive={false}
        onClick={onClick}
      >
        Static native action
      </InteractableBase>,
    );

    const button = screen.getByRole('button', { name: 'Static native action' });
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(fireEvent.click(button)).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('composes with a React Router Link and preserves link semantics', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <InteractableBase as={Link} to="/destination">
          Open destination
        </InteractableBase>
        <Routes>
          <Route
            path="/destination"
            element={<div data-testid="destination">Destination</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Open destination' });
    expect(link).not.toHaveAttribute('role');
    act(() => link.focus());
    fireEvent.keyDown(link, { key: 'Enter' });
    fireEvent.keyUp(link, { key: 'Enter' });
    expect(screen.getByTestId('destination')).toBeInTheDocument();
  });

  it('removes a non-interactive router link from tab order and blocks navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <InteractableBase as={Link} to="/destination" interactive={false}>
          Static destination
        </InteractableBase>
        <Routes>
          <Route
            path="/destination"
            element={<div data-testid="destination">Destination</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Static destination' });
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(fireEvent.click(link)).toBe(false);
    expect(screen.queryByTestId('destination')).toBeNull();
  });

  it('composes consumer mouse and focus handlers and focuses on pointer down', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onMouseDown = vi.fn();
    const onMouseUp = vi.fn();
    const onMouseLeave = vi.fn();

    render(
      <InteractableBase
        aria-label="Composed target"
        onFocus={onFocus}
        onBlur={onBlur}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />,
    );

    const target = screen.getByLabelText('Composed target');
    expect(fireEvent.mouseDown(target)).toBe(true);
    expect(document.activeElement).toBe(target);
    fireEvent.mouseUp(target);
    fireEvent.mouseLeave(target);
    act(() => target.blur());

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onMouseDown).toHaveBeenCalledTimes(1);
    expect(onMouseUp).toHaveBeenCalledTimes(1);
    expect(onMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('reports keyboard activation truthfully while preserving onClick', () => {
    const onActivate = vi.fn();
    const onClick = vi.fn();

    render(
      <InteractableBase
        aria-label="Keyboard target"
        onActivate={onActivate}
        onClick={onClick}
      />,
    );

    const target = screen.getByLabelText('Keyboard target');
    act(() => target.focus());
    fireEvent.keyDown(target, { key: 'Enter' });
    fireEvent.keyUp(target, { key: 'Enter' });

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate.mock.calls[0][0].type).toBe('keyup');
    expect(onActivate.mock.calls[0][0].nativeEvent).toBeInstanceOf(KeyboardEvent);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].type).toBe('click');
    expect(onClick.mock.calls[0][0].nativeEvent).toBeInstanceOf(MouseEvent);
  });

  it('returns a programmatic activation press pulse to the default state', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const states: InteractionState[] = [];
    const onClick = vi.fn();

    render(
      <InteractableBase
        as="button"
        type="button"
        onClick={onClick}
        onStateChange={(_previous, next) => states.push(next)}
      >
        Programmatic action
      </InteractableBase>,
    );

    act(() => screen.getByRole('button', { name: 'Programmatic action' }).click());
    expect(onClick).toHaveBeenCalledOnce();
    expect(latestState(states).state).toBe(State.PRESSED);

    act(() => {
      vi.advanceTimersByTime(InteractionConstants.QUICK_PRESS_RELEASE_DELAY);
    });
    expect(latestState(states).state).toBe(State.DEFAULT);
  });

  it('claims initial focus when the app root is the active element', async () => {
    const boundsSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => rect(20, 20, 100, 50));
    // Auto initial focus is opt-in (FocusNavigationProvider's `autoFocusFirst`);
    // enable it directly for this coordinator-level test.
    const root = document.createElement('div');
    root.tabIndex = -1;
    document.body.append(root);
    const releaseAutoFocusFirst = registerAutoFocusFirstOwner(root);
    root.focus();

    try {
      render(
        <InteractableBase aria-label="Initial target">
          Initial target
        </InteractableBase>,
        { container: root },
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByLabelText('Initial target'));
      });
    } finally {
      releaseAutoFocusFirst();
      boundsSpy.mockRestore();
      root.remove();
    }
  });

  it('emits partial focus handoff events when focus moves between interactables', () => {
    const firstHandoffs: PartialFocusHandoffDetail[] = [];
    const secondHandoffs: PartialFocusHandoffDetail[] = [];

    render(
      <>
        <InteractableBase
          aria-label="First"
          onPartialFocusHandoff={(detail) => firstHandoffs.push(detail)}
        >
          First
        </InteractableBase>
        <InteractableBase
          aria-label="Second"
          onPartialFocusHandoff={(detail) => secondHandoffs.push(detail)}
        >
          Second
        </InteractableBase>
      </>,
    );

    const first = screen.getByLabelText('First');
    const second = screen.getByLabelText('Second');
    first.getBoundingClientRect = vi.fn(() => rect(10, 20, 100, 50));
    second.getBoundingClientRect = vi.fn(() => rect(160, 20, 100, 50));

    act(() => {
      first.focus();
    });
    expect(latestHandoff(firstHandoffs).phase).toBe('reset');

    act(() => {
      second.focus();
    });

    const outgoing = latestHandoff(firstHandoffs);
    const incoming = latestHandoff(secondHandoffs);
    expect(outgoing?.phase).toBe('outgoing');
    expect(outgoing?.otherRect?.left).toBe(160);
    expect(incoming?.phase).toBe('incoming');
    expect(incoming?.otherRect?.left).toBe(10);
  });

  it('keeps partial focus handoff per-view when one interactable disables partial focus', () => {
    const firstHandoffs: PartialFocusHandoffDetail[] = [];
    const secondHandoffs: PartialFocusHandoffDetail[] = [];

    render(
      <>
        <InteractableBase
          aria-label="First"
          partialFocusSupportedAxis={PartialFocusSupportedAxis.None}
          onPartialFocusHandoff={(detail) => firstHandoffs.push(detail)}
        >
          First
        </InteractableBase>
        <InteractableBase
          aria-label="Second"
          onPartialFocusHandoff={(detail) => secondHandoffs.push(detail)}
        >
          Second
        </InteractableBase>
      </>,
    );

    const first = screen.getByLabelText('First');
    const second = screen.getByLabelText('Second');

    act(() => {
      first.focus();
    });
    expect(firstHandoffs).toEqual([]);

    act(() => {
      second.focus();
    });

    expect(firstHandoffs).toEqual([]);
    expect(latestHandoff(secondHandoffs).phase).toBe('incoming');
  });

  it('lets the previous interactable render handoff when the next disables partial focus', () => {
    const firstHandoffs: PartialFocusHandoffDetail[] = [];
    const secondHandoffs: PartialFocusHandoffDetail[] = [];

    render(
      <>
        <InteractableBase
          aria-label="First"
          onPartialFocusHandoff={(detail) => firstHandoffs.push(detail)}
        >
          First
        </InteractableBase>
        <InteractableBase
          aria-label="Second"
          partialFocusSupportedAxis={PartialFocusSupportedAxis.None}
          onPartialFocusHandoff={(detail) => secondHandoffs.push(detail)}
        >
          Second
        </InteractableBase>
      </>,
    );

    const first = screen.getByLabelText('First');
    const second = screen.getByLabelText('Second');

    act(() => {
      first.focus();
    });
    firstHandoffs.length = 0;

    act(() => {
      second.focus();
    });

    expect(latestHandoff(firstHandoffs).phase).toBe('outgoing');
    expect(secondHandoffs).toEqual([]);
  });

  it('returns from pressed to focused after a quick release while focused', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const states: InteractionState[] = [];

    render(
      <InteractableBase
        aria-label="Press target"
        onStateChange={(_previous, next) => states.push(next)}
      >
        Press target
      </InteractableBase>,
    );

    const target = screen.getByLabelText('Press target');
    act(() => {
      target.focus();
    });

    states.length = 0;
    fireEvent.mouseDown(target);
    expect(latestState(states).state).toBe(State.PRESSED);

    fireEvent.mouseUp(target);
    expect(latestState(states).state).toBe(State.PRESSED);

    act(() => {
      vi.advanceTimersByTime(InteractionConstants.QUICK_PRESS_RELEASE_DELAY);
    });

    expect(latestState(states).state).toBe(State.FOCUSED);
  });

  it('focuses on pointer activation and returns from pressed to focused', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const states: InteractionState[] = [];

    render(
      <InteractableBase
        aria-label="Pointer target"
        onStateChange={(_previous, next) => states.push(next)}
      >
        Pointer target
      </InteractableBase>,
    );

    const target = screen.getByLabelText('Pointer target');
    fireEvent.mouseDown(target);
    expect(latestState(states).state).toBe(State.PRESSED);

    fireEvent.mouseUp(target);
    act(() => {
      vi.advanceTimersByTime(InteractionConstants.QUICK_PRESS_RELEASE_DELAY);
    });

    expect(document.activeElement).toBe(target);
    expect(latestState(states).state).toBe(State.FOCUSED);
  });

  it('fires long press after the timeout and suppresses the follow-up click', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const onClick = vi.fn();
    const onLongPress = vi.fn();

    render(
      <InteractableBase
        aria-label="Long press target"
        onClick={onClick}
        onLongPress={onLongPress}
      >
        Long press target
      </InteractableBase>,
    );

    const target = screen.getByLabelText('Long press target');
    fireEvent.mouseDown(target);

    act(() => {
      vi.advanceTimersByTime(InteractionConstants.LONG_PRESS_TIMEOUT - 1);
    });
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);

    fireEvent.mouseUp(target);
    fireEvent.click(target);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps regular click behavior when pointer releases before long press timeout', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const onClick = vi.fn();
    const onLongPress = vi.fn();

    render(
      <InteractableBase
        aria-label="Short press target"
        onClick={onClick}
        onLongPress={onLongPress}
      >
        Short press target
      </InteractableBase>,
    );

    const target = screen.getByLabelText('Short press target');
    fireEvent.mouseDown(target);

    act(() => {
      vi.advanceTimersByTime(InteractionConstants.LONG_PRESS_TIMEOUT - 1);
    });
    fireEvent.mouseUp(target);
    fireEvent.click(target);

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables default button semantics and interaction state when interactive is false', () => {
    const states: InteractionState[] = [];
    const onClick = vi.fn();

    render(
      <InteractableBase
        aria-label="Static panel"
        interactive={false}
        onClick={onClick}
        onStateChange={(_previous, next) => states.push(next)}
      >
        Static panel
      </InteractableBase>,
    );

    const target = screen.getByLabelText('Static panel');
    expect(target.getAttribute('role')).toBeNull();
    expect(target.getAttribute('tabindex')).toBeNull();
    expect(target.getAttribute('aria-disabled')).toBeNull();

    fireEvent.focus(target);
    fireEvent.mouseDown(target);
    fireEvent.mouseUp(target);
    fireEvent.click(target);
    fireEvent.keyDown(target, { key: 'Enter' });
    fireEvent.keyUp(target, { key: 'Enter' });

    expect(states).toEqual([]);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('still forwards custom keydown handlers when interactive is false', () => {
    const onKeyDown = vi.fn();
    const onKeyUp = vi.fn();

    render(
      <InteractableBase
        aria-label="Static panel"
        interactive={false}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      >
        Static panel
      </InteractableBase>,
    );

    const target = screen.getByLabelText('Static panel');
    fireEvent.keyDown(target, { key: 'Escape' });
    fireEvent.keyUp(target, { key: 'Escape' });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onKeyUp).toHaveBeenCalledTimes(1);
  });

  it('can receive focus without allowing pointer press visuals', () => {
    const states: InteractionState[] = [];

    render(
      <InteractableBase
        aria-label="Focusable panel"
        interactive={false}
        focusable
        pressable={false}
        clickable={false}
        onStateChange={(_previous, next) => states.push(next)}
      >
        Focusable panel
      </InteractableBase>,
    );

    const target = screen.getByLabelText('Focusable panel');
    expect(target.getAttribute('tabindex')).toBe('0');
    expect(target.getAttribute('role')).toBeNull();

    act(() => {
      target.focus();
    });
    expect(latestState(states).state).toBe(State.FOCUSED);

    states.length = 0;
    fireEvent.mouseDown(target);
    fireEvent.mouseUp(target);
    fireEvent.click(target);

    expect(states).toEqual([]);
  });

  it('reports invalid directional focus when browser focus stays put through keyup', () => {
    const onInvalidFocusDirection = vi.fn();

    render(
      <InteractableBase
        aria-label="Edge target"
        onInvalidFocusDirection={onInvalidFocusDirection}
      >
        Edge target
      </InteractableBase>,
    );

    const target = screen.getByLabelText('Edge target');

    act(() => {
      target.focus();
    });

    fireEvent.keyDown(target, { key: 'ArrowRight' });
    fireEvent.keyUp(target, { key: 'ArrowRight' });

    expect(onInvalidFocusDirection).toHaveBeenCalledTimes(1);
    expect(onInvalidFocusDirection).toHaveBeenCalledWith('right');
  });

  it('does not report invalid directional focus after navigation was handled', () => {
    const onInvalidFocusDirection = vi.fn();

    render(
      <InteractableBase
        aria-label="Scrollable target"
        onInvalidFocusDirection={onInvalidFocusDirection}
      >
        Scrollable target
      </InteractableBase>,
    );

    const target = screen.getByLabelText('Scrollable target');

    act(() => {
      target.focus();
    });

    fireEvent.keyDown(target, { key: 'ArrowDown' });
    act(() => {
      target.dispatchEvent(new CustomEvent(FOCUS_NAVIGATION_HANDLED_EVENT));
    });
    fireEvent.keyUp(target, { key: 'ArrowDown' });

    expect(onInvalidFocusDirection).not.toHaveBeenCalled();
  });

  it('shows the disabled click tooltip when disabled activation is attempted', () => {
    vi.useFakeTimers();

    render(
      <InteractableBase
        aria-label="Disabled target"
        disabled
        tooltipMode={TooltipMode.DISABLED_CLICK}
        tooltipText="Disabled click"
      >
        Disabled target
      </InteractableBase>,
    );

    fireEvent.click(screen.getByLabelText('Disabled target'));

    const tooltip = document.body.querySelector('[role="tooltip"][aria-label="Disabled click"]');
    expect(tooltip).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(tooltip?.className).toContain('fadeOut');
  });

  it('immediately removes the previous interactable tooltip when another opens', async () => {
    render(
      <>
        <InteractableBase
          aria-label="First tooltip target"
          tooltipMode={TooltipMode.FOCUSED}
          tooltipText="First tooltip"
        >
          First tooltip target
        </InteractableBase>
        <InteractableBase
          aria-label="Second tooltip target"
          tooltipMode={TooltipMode.FOCUSED}
          tooltipText="Second tooltip"
        >
          Second tooltip target
        </InteractableBase>
      </>,
    );

    act(() => {
      screen.getByLabelText('First tooltip target').focus();
    });

    await waitFor(() => {
      expect(
        document.body.querySelector('[role="tooltip"][aria-label="First tooltip"]'),
      ).not.toBeNull();
    });

    act(() => {
      screen.getByLabelText('Second tooltip target').focus();
    });

    await waitFor(() => {
      expect(
        document.body.querySelector('[role="tooltip"][aria-label="First tooltip"]'),
      ).toBeNull();
      expect(
        document.body.querySelector('[role="tooltip"][aria-label="Second tooltip"]'),
      ).not.toBeNull();
      expect(document.body.querySelectorAll('[role="tooltip"]')).toHaveLength(1);
    });
  });

  it('hides the anchor focus visual state while focusable tooltip content is open', async () => {
    const states: InteractionState[] = [];

    render(
      <InteractableBase
        aria-label="Context menu anchor"
        tooltipMode={TooltipMode.FOCUSED}
        tooltipContent={<div>Context menu</div>}
        tooltipFocusable
        tooltipHidesFocusState
        onStateChange={(_previous, next) => states.push(next)}
      >
        Context menu anchor
      </InteractableBase>,
    );

    act(() => {
      screen.getByLabelText('Context menu anchor').focus();
    });

    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
      expect(latestState(states).state).toBe(State.DEFAULT);
    });
  });

  it('retains anchor focus across generic focusable popup teardown', async () => {
    const transitions: Array<[InteractionState, InteractionState]> = [];
    const browserRoot = document.createElement('div');
    browserRoot.tabIndex = -1;
    document.body.appendChild(browserRoot);
    const view = render(
      <DismissibleFocusableTooltip
        onStateChange={(previous, next) => transitions.push([previous, next])}
      />,
      { container: browserRoot },
    );

    try {
      const anchor = screen.getByLabelText('Popup anchor');
      anchor.focus();
      const closeButton = await screen.findByText('Close popup');
      closeButton.focus();
      await act(async () => {});

      transitions.length = 0;
      fireEvent.click(closeButton);

      expect(transitions.at(-1)?.[1].state).toBe(State.FOCUSED);
      expect(
        transitions.some(
          ([previous, next]) =>
            previous.state === State.FOCUSED && next.state === State.DEFAULT,
        ),
      ).toBe(false);
      await waitFor(() => expect(document.activeElement).toBe(anchor));
      await act(async () => {});
      transitions.length = 0;
      browserRoot.focus();
      await waitFor(() => expect(document.activeElement).toBe(anchor));
      expect(
        transitions.some(([, next]) => next.state === State.DEFAULT),
      ).toBe(false);
    } finally {
      view.unmount();
      browserRoot.remove();
    }
  });

  it('uses the latest tooltip focus-state override after rerender', async () => {
    const states: InteractionState[] = [];
    const renderTarget = (tooltipHidesFocusState: boolean) => (
      <InteractableBase
        aria-label="Dynamic context menu anchor"
        tooltipMode={TooltipMode.FOCUSED}
        tooltipContent={<div>Dynamic context menu</div>}
        tooltipFocusable
        tooltipHidesFocusState={tooltipHidesFocusState}
        onStateChange={(_previous, next) => states.push(next)}
      >
        Dynamic context menu anchor
      </InteractableBase>
    );
    const view = render(renderTarget(false));
    const target = screen.getByLabelText('Dynamic context menu anchor');

    act(() => target.focus());
    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
      expect(latestState(states).state).toBe(State.FOCUSED);
    });

    view.rerender(renderTarget(true));
    await waitFor(() => expect(latestState(states).state).toBe(State.DEFAULT));
    states.length = 0;
    fireEvent.mouseDown(target);
    expect(latestState(states).state).toBe(State.DEFAULT);

    view.rerender(renderTarget(false));
    await waitFor(() => expect(latestState(states).state).toBe(State.PRESSED));
  });

  it('coordinates tooltip ownership across instances and rerenders', async () => {
    const renderTargets = (firstLabel: string) => (
      <>
        <InteractableBase
          aria-label={firstLabel}
          tooltipMode={TooltipMode.FOCUSED}
          tooltipText={`${firstLabel} tooltip`}
        >
          {firstLabel}
        </InteractableBase>
        <InteractableBase
          aria-label="Second owner"
          tooltipMode={TooltipMode.FOCUSED}
          tooltipText="Second owner tooltip"
        >
          Second owner
        </InteractableBase>
      </>
    );
    const view = render(renderTargets('First owner'));

    act(() => screen.getByLabelText('First owner').focus());
    await waitFor(() => {
      expect(document.body.querySelector(
        '[role="tooltip"][aria-label="First owner tooltip"]',
      )).toBeInTheDocument();
    });

    act(() => screen.getByLabelText('Second owner').focus());
    await waitFor(() => {
      expect(document.body.querySelector(
        '[role="tooltip"][aria-label="Second owner tooltip"]',
      )).toBeInTheDocument();
      expect(document.body.querySelector(
        '[role="tooltip"][aria-label="First owner tooltip"]',
      )).toBeNull();
    });

    view.rerender(renderTargets('First owner rerendered'));
    act(() => screen.getByLabelText('First owner rerendered').focus());
    await waitFor(() => {
      expect(document.body.querySelector(
        '[role="tooltip"][aria-label="First owner rerendered tooltip"]',
      )).toBeInTheDocument();
      expect(document.body.querySelector(
        '[role="tooltip"][aria-label="Second owner tooltip"]',
      )).toBeNull();
    });
  });

  it('does not restore anchor visual focus when focus moves inside a portal tooltip', async () => {
    const states: InteractionState[] = [];

    render(
      <InteractableBase
        aria-label="Context menu anchor"
        tooltipMode={TooltipMode.FOCUSED}
        tooltipContent={<button>Portal item</button>}
        tooltipFocusable
        tooltipHidesFocusState
        onStateChange={(_previous, next) => states.push(next)}
      >
        Context menu anchor
      </InteractableBase>,
    );

    act(() => {
      screen.getByLabelText('Context menu anchor').focus();
    });

    const portalItem = await screen.findByText('Portal item');

    await waitFor(() => {
      expect(latestState(states).state).toBe(State.DEFAULT);
    });

    act(() => {
      portalItem.focus();
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(portalItem);
      expect(latestState(states).state).toBe(State.DEFAULT);
    });
  });

  it('keeps focusable tooltip content mounted while focus is handed from the anchor to the popup', async () => {
    render(
      <InteractableBase
        aria-label="Context menu anchor"
        tooltipMode={TooltipMode.FOCUSED}
        tooltipContent={<button>Portal item</button>}
        tooltipFocusable
      >
        Context menu anchor
      </InteractableBase>,
    );

    const anchor = screen.getByLabelText('Context menu anchor');
    act(() => {
      anchor.focus();
    });

    const portalItem = await screen.findByText('Portal item');
    const tooltip = screen.getByRole('tooltip', { hidden: true });

    fireEvent.blur(anchor, { relatedTarget: portalItem });

    await waitFor(() => {
      expect(tooltip.className).not.toContain('fadeOut');
      expect(screen.getByRole('tooltip', { hidden: true })).toContainElement(portalItem);
    });
  });

  it('passes popup tail positioning props into tooltip content', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === 'boundary') {
        return rect(100, 100, 600, 600);
      }
      if (this.getAttribute('aria-label') === 'Top anchor') {
        return rect(112, 172, 160, 72);
      }
      if (this.getAttribute('role') === 'tooltip') {
        return rect(0, 0, 288, 113);
      }
      return rect(0, 0, 0, 0);
    });

    function CustomTooltip({
      tailDirection,
      tailCenterX,
      maxWidth,
    }: {
      tailDirection?: 'up' | 'down';
      tailCenterX?: number;
      maxWidth?: number;
    }) {
      return (
        <div
          data-testid="custom-tooltip"
          data-tail-direction={tailDirection}
          data-tail-center-x={tailCenterX}
          data-max-width={maxWidth}
        >
          Custom
        </div>
      );
    }

    render(
      <div data-testid="boundary" data-uit-tooltip-boundary>
        <InteractableBase
          aria-label="Top anchor"
          tooltipMode={TooltipMode.FOCUSED}
          tooltipContent={<CustomTooltip />}
          tooltipFocusable
        >
          Top anchor
        </InteractableBase>
      </div>,
    );

    act(() => {
      screen.getByLabelText('Top anchor').focus();
    });

    const customTooltip = await screen.findByTestId('custom-tooltip');

    await waitFor(() => {
      expect(customTooltip.dataset.tailDirection).toBe('up');
      expect(Number(customTooltip.dataset.tailCenterX)).toBeGreaterThan(0);
      expect(customTooltip.dataset.maxWidth).toBe('620');
    });
  });
});
