/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createRef,
  type ComponentProps,
} from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ContainerMaterial,
  LayerPlacement,
  MaterialLibrary,
  VisualState,
  createLayer,
} from '@wearables-ui-toolkit/mrbd';
import type { IconVectorSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { MaterialStateTransition } from '@wearables-ui-toolkit/foundation/material/ContainerMaterial.types';
import { FocusNavigationProvider } from '@wearables-ui-toolkit/foundation/navigation/FocusNavigationProvider';
import { ScrollView } from '@wearables-ui-toolkit/foundation/components/ScrollView';
import { SCROLL_VIEW_NAVIGATION_REQUEST_EVENT } from '@wearables-ui-toolkit/foundation/base/FocusNavigationEvents';
import { InputTextViewFrame } from '../mrbd/ui/InputTextViewFrame';
import {
  INPUT_TEXT_VIEW_LINE_HEIGHT,
  INPUT_TEXT_VIEW_SINGLE_LINE_VERTICAL_PADDING,
  INPUT_TEXT_VIEW_VERTICAL_PADDING,
} from '../mrbd/ui/InputTextViewMetrics';

const TEST_ACTION_ICON: IconVectorSource = {
  viewBox: '0 0 24 24',
  paths: [{ d: 'M4 12h16' }],
};

const BASE_PROPS: ComponentProps<typeof InputTextViewFrame> = {
  rootProps: {},
  className: '',
  style: {},
  material: MaterialLibrary.textInput(),
  containerWidth: 520,
  textAreaRef: createRef<HTMLTextAreaElement>(),
  showAccessory: false,
  showActionButton: false,
  enterSubmissionEnabled: false,
  measureEmptyWidth: false,
  editAreaStyle: {},
  value: '',
  hint: 'Start writing',
  showLoader: false,
  loadingLabel: 'Loading',
  actionIcon: TEST_ACTION_ICON,
  actionLabel: 'Send',
  inputProps: {},
  onTextChange: () => {},
  onKeyDown: () => {},
  onSend: () => {},
};

function rect(
  top: number,
  height: number,
  left = 0,
  width = 520,
): DOMRect {
  return {
    width,
    height,
    top,
    left,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function installScrollAnimationHarness() {
  let nextTimerId = 1;
  let cancelledTimerCount = 0;
  const callbacks = new Map<number, () => void>();
  const setTimeoutSpy = vi.spyOn(window, 'setTimeout').mockImplementation(handler => {
    const timerId = nextTimerId;
    nextTimerId += 1;
    callbacks.set(timerId, handler as () => void);
    return timerId;
  });
  const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout').mockImplementation(timerId => {
    if (timerId != null && callbacks.delete(timerId)) {
      cancelledTimerCount += 1;
    }
  });
  return {
    flushLatest(stepCount = 10) {
      for (let step = 0; step < stepCount; step += 1) {
        const latestEntry = Array.from(callbacks.entries()).at(-1);
        if (latestEntry == null) {
          return;
        }
        const [timerId, callback] = latestEntry;
        callbacks.delete(timerId);
        callback();
      }
    },
    pendingCount: () => callbacks.size,
    cancelledCount: () => cancelledTimerCount,
    restore() {
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    },
  };
}

function installFrameAnimationHarness() {
  let nextFrameId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  const requestFrameSpy = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback: FrameRequestCallback): number => {
      const frameId = nextFrameId;
      nextFrameId += 1;
      callbacks.set(frameId, callback);
      return frameId;
    });
  const cancelFrameSpy = vi
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation((frameId: number) => {
      callbacks.delete(frameId);
    });
  return {
    clear() {
      callbacks.clear();
    },
    flushFirst(elapsedMs = 75) {
      const entry = callbacks.entries().next().value;
      if (entry == null) {
        throw new Error('No animation frame is pending.');
      }
      const [frameId, callback] = entry;
      callbacks.delete(frameId);
      callback(performance.now() + elapsedMs);
    },
    restore() {
      requestFrameSpy.mockRestore();
      cancelFrameSpy.mockRestore();
    },
  };
}

function renderFrame(
  overrides: Partial<ComponentProps<typeof InputTextViewFrame>> = {},
) {
  return render(<InputTextViewFrame {...BASE_PROPS} {...overrides} />);
}

function createStateProbeMaterial(
  renderedStates: VisualState[],
  renderedTransitions?: Array<MaterialStateTransition | null>,
): ContainerMaterial {
  return new ContainerMaterial({
    layers: [
      createLayer('input-text-view-state-probe', LayerPlacement.BACKGROUND, () => ({}), {
        drawCanvas: (_ctx, params) => {
          renderedStates.push(params.state);
          renderedTransitions?.push(
            params.transition == null ? null : { ...params.transition },
          );
        },
      }),
    ],
  });
}

function installCanvasRenderHarness(parentWidth = 252): () => void {
  const restores: Array<() => void> = [];
  const globalRecord = globalThis as Record<string, unknown>;

  if (globalRecord.Path2D == null) {
    globalRecord.Path2D = class {
      addPath(): void {}
    };
    restores.push(() => {
      delete globalRecord.Path2D;
    });
  }
  if (globalRecord.DOMMatrix == null) {
    globalRecord.DOMMatrix = class {
      translateSelf(): this {
        return this;
      }
      scaleSelf(): this {
        return this;
      }
    };
    restores.push(() => {
      delete globalRecord.DOMMatrix;
    });
  }

  const canvasPrototype = HTMLCanvasElement.prototype as unknown as {
    getContext: unknown;
  };
  const originalGetContext = canvasPrototype.getContext;
  canvasPrototype.getContext = () => ({
    setTransform() {},
    clearRect() {},
    translate() {},
    scale() {},
    save() {},
    restore() {},
    clip() {},
  });
  restores.push(() => {
    canvasPrototype.getContext = originalGetContext;
  });

  const elementPrototype = HTMLElement.prototype;
  const originalGetBoundingClientRect = elementPrototype.getBoundingClientRect;
  elementPrototype.getBoundingClientRect = function getBoundingClientRect(): DOMRect {
    const width = this.hasAttribute('data-uit-focus-section') ? parentWidth : 252;
    return {
      width,
      height: 120,
      top: 0,
      left: 0,
      right: width,
      bottom: 120,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };
  restores.push(() => {
    elementPrototype.getBoundingClientRect = originalGetBoundingClientRect;
  });

  return () => {
    for (const restore of restores.reverse()) {
      restore();
    }
  };
}

describe('InputTextViewFrame', () => {
  it('renders editable text and forwards root attributes', () => {
    renderFrame({
      rootProps: { id: 'message-input' },
      className: 'custom-input',
      editAreaStyle: { width: 400 },
      value: 'Hello',
    });

    expect(screen.getByLabelText('Start writing')).toHaveValue('Hello');
    expect(document.getElementById('message-input')).toBeInTheDocument();
  });

  it('forwards text changes and send clicks', () => {
    const onTextChange = vi.fn();
    const onSend = vi.fn();
    renderFrame({
      showActionButton: true,
      value: 'Draft',
      onTextChange,
      onSend,
    });

    fireEvent.change(screen.getByLabelText('Start writing'), {
      target: { value: 'Updated draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onTextChange).toHaveBeenCalledWith('Updated draft');
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('renders the loader instead of an action button', () => {
    renderFrame({
      showAccessory: true,
      value: 'Sending',
      showLoader: true,
      loadingLabel: 'Sending message',
    });

    expect(
      screen.getByRole('progressbar', { name: 'Sending message' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });

  it('keeps the focused loading material static for reduced motion', () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    const material = MaterialLibrary.textInput();

    const { unmount } = renderFrame({
      material,
      showAccessory: true,
      showLoader: true,
    });

    const focusedLayer = [
      ...material.getBackgroundLayers(),
      ...material.getForegroundLayers(),
    ].find(layer => layer.id === 'focused-material');
    expect(focusedLayer?.isVisibleForState?.(VisualState.FOCUSED)).toBe(false);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();

    unmount();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it('keeps the Container out of sequential focus while proxying programmatic focus', () => {
    renderFrame();

    const textarea = screen.getByLabelText('Start writing');
    const focusOwner = textarea.closest('[data-uit-interactable]');
    expect(focusOwner).toBeInstanceOf(HTMLElement);
    expect(focusOwner).toHaveAttribute('tabindex', '-1');
    expect(focusOwner).toHaveAttribute('role', 'group');
    const focusSpy = vi.spyOn(textarea, 'focus');

    act(() => {
      (focusOwner as HTMLElement).focus();
    });

    expect(document.activeElement).toBe(textarea);
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it.each([
    ['ArrowLeft', 'x', -1],
    ['ArrowRight', 'x', 1],
    ['ArrowUp', 'y', -1],
    ['ArrowDown', 'y', 1],
  ] as const)(
    'uses Container rubber-band feedback for blocked %s navigation',
    (key, axis, sign) => {
      const animation = installFrameAnimationHarness();
      const { container, unmount } = render(
        <FocusNavigationProvider>
          <InputTextViewFrame
            {...BASE_PROPS}
            textAreaRef={BASE_PROPS.textAreaRef}
            value="Draft"
          />
        </FocusNavigationProvider>,
      );
      const navigationRoot = container.firstElementChild as HTMLElement;
      const textarea = screen.getByLabelText('Start writing');
      const focusOwner = textarea.closest<HTMLElement>('[data-uit-interactable]');
      if (focusOwner == null) {
        throw new Error('InputTextView Container focus owner missing.');
      }
      navigationRoot.getBoundingClientRect = () => rect(0, 600, 0, 600);
      focusOwner.getBoundingClientRect = () => rect(100, 88, 100, 320);
      textarea.getBoundingClientRect = () => rect(100, 88, 100, 320);

      act(() => {
        textarea.focus();
      });
      animation.clear();
      fireEvent.keyDown(textarea, { key });
      act(() => {
        animation.flushFirst();
      });

      const [translateX = 0, translateY = 0] = focusOwner.style.translate
        .split(' ')
        .map(value => Number.parseFloat(value));
      const directionalOffset = axis === 'x' ? translateX : translateY;
      expect(directionalOffset * sign).toBeGreaterThan(0);

      unmount();
      animation.restore();
    },
  );

  it('centers one line and uses multiline padding after the text wraps', async () => {
    const { rerender } = renderFrame({ value: 'One line' });
    const textarea = screen.getByLabelText('Start writing');

    expect(textarea).toHaveStyle({
      lineHeight: `${INPUT_TEXT_VIEW_LINE_HEIGHT}px`,
      paddingTop: `${INPUT_TEXT_VIEW_SINGLE_LINE_VERTICAL_PADDING}px`,
      paddingBottom: `${INPUT_TEXT_VIEW_SINGLE_LINE_VERTICAL_PADDING}px`,
    });

    const multilineScrollHeight = vi.fn(() => 131);
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: multilineScrollHeight,
    });
    rerender(
      <InputTextViewFrame
        {...BASE_PROPS}
        textAreaRef={BASE_PROPS.textAreaRef}
        value={'First line\nSecond line'}
      />,
    );

    await waitFor(() =>
      expect(textarea).toHaveStyle({
        paddingTop: `${INPUT_TEXT_VIEW_VERTICAL_PADDING}px`,
        paddingBottom: `${INPUT_TEXT_VIEW_VERTICAL_PADDING}px`,
      })
    );
    expect(multilineScrollHeight).toHaveBeenCalledTimes(1);

    textarea.scrollTop = 100;
    const singleLineScrollHeight = vi.fn(() => 72);
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: singleLineScrollHeight,
    });
    rerender(
      <InputTextViewFrame
        {...BASE_PROPS}
        textAreaRef={BASE_PROPS.textAreaRef}
        value="One line"
      />,
    );

    await waitFor(() =>
      expect(textarea).toHaveStyle({
        paddingTop: `${INPUT_TEXT_VIEW_SINGLE_LINE_VERTICAL_PADDING}px`,
        paddingBottom: `${INPUT_TEXT_VIEW_SINGLE_LINE_VERTICAL_PADDING}px`,
      })
    );
    expect(singleLineScrollHeight).toHaveBeenCalledTimes(1);
    expect(textarea.scrollTop).toBe(0);
  });

  it('focuses without exposing browser caret interaction', () => {
    renderFrame({ value: 'Draft' });
    const textarea = screen.getByLabelText('Start writing');
    const pointerDownEvent = createEvent.pointerDown(textarea);

    fireEvent(textarea, pointerDownEvent);

    expect(pointerDownEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(textarea);
    expect(document.querySelector('[data-uit-input-caret]')).toBeNull();
  });

  it('uses a send enter-key hint whenever Enter submission is enabled', () => {
    renderFrame({ enterSubmissionEnabled: true, showActionButton: false });

    expect(screen.getByLabelText('Start writing')).toHaveAttribute(
      'enterkeyhint',
      'send',
    );
  });

  it('skips the empty disabled action during geometric focus traversal', () => {
    const { container } = render(
      <FocusNavigationProvider>
        <div data-testid="empty-navigation-layout">
          <InputTextViewFrame
            {...BASE_PROPS}
            rootProps={{ 'data-testid': 'empty-input-root' }}
            textAreaRef={BASE_PROPS.textAreaRef}
            showActionButton={true}
            value=""
          />
          <button type="button">Outside action</button>
        </div>
      </FocusNavigationProvider>,
    );
    const focusRoot = container.firstElementChild as HTMLElement;
    const layout = screen.getByTestId('empty-navigation-layout');
    const inputRoot = screen.getByTestId('empty-input-root');
    const focusSection = inputRoot.matches('[data-uit-focus-section]')
      ? inputRoot
      : inputRoot.querySelector<HTMLElement>('[data-uit-focus-section]');
    const textarea = screen.getByLabelText('Start writing');
    const action = screen.getByRole('button', { name: 'Send' });
    const outsideAction = screen.getByRole('button', { name: 'Outside action' });
    focusRoot.getBoundingClientRect = () => rect(0, 600, 0, 800);
    layout.getBoundingClientRect = () => rect(0, 600, 0, 800);
    inputRoot.getBoundingClientRect = () => rect(100, 152, 0, 608);
    if (focusSection == null) {
      throw new Error('InputTextView focus section missing.');
    }
    focusSection.getBoundingClientRect = () => rect(100, 152, 0, 608);
    textarea.getBoundingClientRect = () => rect(100, 152, 0, 520);
    action.getBoundingClientRect = () => rect(164, 88, 520, 88);
    outsideAction.getBoundingClientRect = () => rect(148, 56, 620, 56);

    textarea.focus();
    fireEvent.keyDown(textarea, { key: 'ArrowRight' });

    expect(action).toHaveAttribute('tabindex', '-1');
    expect(document.activeElement).toBe(outsideAction);
  });

  it('keeps horizontal focus navigation stable through the action', async () => {
    const { container } = render(
      <FocusNavigationProvider>
        <div data-testid="navigation-layout">
          <InputTextViewFrame
            {...BASE_PROPS}
            rootProps={{ 'data-testid': 'input-root' }}
            textAreaRef={BASE_PROPS.textAreaRef}
            showActionButton={true}
            value="Draft"
          />
          <button type="button">Outside action</button>
        </div>
      </FocusNavigationProvider>,
    );
    const focusRoot = container.firstElementChild as HTMLElement;
    const layout = screen.getByTestId('navigation-layout');
    const inputRoot = screen.getByTestId('input-root');
    const focusSection = inputRoot.matches('[data-uit-focus-section]')
      ? inputRoot
      : inputRoot.querySelector<HTMLElement>('[data-uit-focus-section]');
    const textarea = screen.getByLabelText('Start writing');
    const action = screen.getByRole('button', { name: 'Send' });
    const outsideAction = screen.getByRole('button', { name: 'Outside action' });
    focusRoot.getBoundingClientRect = () => rect(0, 600, 0, 800);
    layout.getBoundingClientRect = () => rect(0, 600, 0, 800);
    inputRoot.getBoundingClientRect = () => rect(100, 152, 0, 608);
    if (focusSection == null) {
      throw new Error('InputTextView focus section missing.');
    }
    focusSection.getBoundingClientRect = () => rect(100, 152, 0, 608);
    textarea.getBoundingClientRect = () => rect(100, 152, 0, 520);
    action.getBoundingClientRect = () => rect(164, 88, 520, 88);
    outsideAction.getBoundingClientRect = () => rect(148, 56, 620, 56);

    act(() => {
      textarea.focus();
      fireEvent.keyDown(textarea, { key: 'ArrowRight' });
      fireEvent.keyUp(action, { key: 'ArrowRight' });
    });
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));
    expect(document.activeElement).toBe(action);

    act(() => {
      fireEvent.keyDown(action, { key: 'ArrowLeft' });
      fireEvent.keyUp(textarea, { key: 'ArrowLeft' });
    });
    expect(document.activeElement).toBe(textarea);

    act(() => {
      fireEvent.keyDown(textarea, { key: 'ArrowRight' });
      fireEvent.keyUp(action, { key: 'ArrowRight' });
      fireEvent.keyDown(action, { key: 'ArrowRight' });
    });
    expect(document.activeElement).toBe(outsideAction);
  });

  it('scrolls on vertical keys until the corresponding edge', () => {
    const handleRootKeyDown = vi.fn();
    const handleInputKeyDown = vi.fn();
    renderFrame({
      value: 'First\nSecond\nThird\nFourth\nFifth',
      rootProps: { onKeyDown: handleRootKeyDown },
      onKeyDown: handleInputKeyDown,
    });
    const textarea = screen.getByLabelText('Start writing');
    Object.defineProperties(textarea, {
      clientHeight: { configurable: true, value: 120 },
      scrollHeight: { configurable: true, value: 240 },
      scrollTop: { configurable: true, writable: true, value: 0 },
    });
    const animation = installScrollAnimationHarness();

    const scrollDownEvent = createEvent.keyDown(textarea, { key: 'ArrowDown' });
    fireEvent(textarea, scrollDownEvent);

    expect(scrollDownEvent.defaultPrevented).toBe(true);
    expect(textarea.scrollTop).toBe(0);
    act(() => animation.flushLatest(2));
    expect(textarea.scrollTop).toBeGreaterThan(0);
    expect(textarea.scrollTop).toBeLessThan(INPUT_TEXT_VIEW_LINE_HEIGHT);
    act(() => animation.flushLatest());
    expect(textarea.scrollTop).toBe(INPUT_TEXT_VIEW_LINE_HEIGHT);
    expect(handleRootKeyDown).not.toHaveBeenCalled();
    expect(handleInputKeyDown).toHaveBeenCalledTimes(1);

    textarea.scrollTop = 120;
    const bottomEdgeEvent = createEvent.keyDown(textarea, { key: 'ArrowDown' });
    fireEvent(textarea, bottomEdgeEvent);

    expect(bottomEdgeEvent.defaultPrevented).toBe(false);
    expect(textarea.scrollTop).toBe(120);
    expect(handleRootKeyDown).toHaveBeenCalledTimes(1);

    const scrollUpEvent = createEvent.keyDown(textarea, { key: 'ArrowUp' });
    fireEvent(textarea, scrollUpEvent);
    act(() => animation.flushLatest());

    expect(scrollUpEvent.defaultPrevented).toBe(true);
    expect(textarea.scrollTop).toBe(120 - INPUT_TEXT_VIEW_LINE_HEIGHT);
    expect(handleRootKeyDown).toHaveBeenCalledTimes(1);

    textarea.scrollTop = 0;
    const topEdgeEvent = createEvent.keyDown(textarea, { key: 'ArrowUp' });
    fireEvent(textarea, topEdgeEvent);

    expect(topEdgeEvent.defaultPrevented).toBe(false);
    expect(handleRootKeyDown).toHaveBeenCalledTimes(2);
    animation.restore();
  });

  it('snaps scrolling when reduced motion is requested', () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    const { unmount } = renderFrame({
      value: 'First\nSecond\nThird\nFourth\nFifth',
    });
    const textarea = screen.getByLabelText('Start writing');
    Object.defineProperties(textarea, {
      clientHeight: { configurable: true, value: 120 },
      scrollHeight: { configurable: true, value: 240 },
      scrollTop: { configurable: true, writable: true, value: 0 },
    });

    fireEvent.keyDown(textarea, { key: 'ArrowDown' });
    expect(textarea.scrollTop).toBe(INPUT_TEXT_VIEW_LINE_HEIGHT);

    unmount();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it('queues repeated smooth scrolling before yielding at the edge', () => {
    const handleRootKeyDown = vi.fn();
    renderFrame({
      value: 'First\nSecond\nThird\nFourth\nFifth',
      rootProps: { onKeyDown: handleRootKeyDown },
    });
    const textarea = screen.getByLabelText('Start writing');
    Object.defineProperties(textarea, {
      clientHeight: { configurable: true, value: 120 },
      scrollHeight: { configurable: true, value: 240 },
      scrollTop: { configurable: true, writable: true, value: 0 },
    });
    const animation = installScrollAnimationHarness();

    for (let index = 0; index < 3; index += 1) {
      fireEvent.keyDown(textarea, { key: 'ArrowDown' });
    }

    expect(animation.pendingCount()).toBe(1);
    expect(animation.cancelledCount()).toBe(2);
    const pendingEdgeEvent = createEvent.keyDown(textarea, { key: 'ArrowDown' });
    fireEvent(textarea, pendingEdgeEvent);
    expect(pendingEdgeEvent.defaultPrevented).toBe(true);
    expect(handleRootKeyDown).not.toHaveBeenCalled();

    act(() => animation.flushLatest());
    expect(textarea.scrollTop).toBe(120);
    const reachedEdgeEvent = createEvent.keyDown(textarea, { key: 'ArrowDown' });
    fireEvent(textarea, reachedEdgeEvent);
    expect(reachedEdgeEvent.defaultPrevented).toBe(false);
    expect(handleRootKeyDown).toHaveBeenCalledTimes(1);
    animation.restore();
  });

  it('cancels pending scrolling before reversing direction', () => {
    const handleRootKeyDown = vi.fn();
    renderFrame({
      value: 'First\nSecond\nThird\nFourth\nFifth',
      rootProps: { onKeyDown: handleRootKeyDown },
    });
    const textarea = screen.getByLabelText('Start writing');
    Object.defineProperties(textarea, {
      clientHeight: { configurable: true, value: 120 },
      scrollHeight: { configurable: true, value: 240 },
      scrollTop: { configurable: true, writable: true, value: 0 },
    });
    const animation = installScrollAnimationHarness();

    fireEvent.keyDown(textarea, { key: 'ArrowDown' });
    expect(animation.pendingCount()).toBe(1);

    const reverseAtTopEvent = createEvent.keyDown(textarea, { key: 'ArrowUp' });
    fireEvent(textarea, reverseAtTopEvent);
    expect(reverseAtTopEvent.defaultPrevented).toBe(false);
    expect(animation.pendingCount()).toBe(0);
    expect(animation.cancelledCount()).toBe(1);
    expect(handleRootKeyDown).toHaveBeenCalledTimes(1);

    textarea.scrollTop = 20;
    fireEvent.keyDown(textarea, { key: 'ArrowDown' });
    const reverseInContentEvent = createEvent.keyDown(textarea, { key: 'ArrowUp' });
    fireEvent(textarea, reverseInContentEvent);
    expect(reverseInContentEvent.defaultPrevented).toBe(true);
    expect(animation.pendingCount()).toBe(1);
    act(() => animation.flushLatest());
    expect(textarea.scrollTop).toBe(0);

    animation.restore();
  });

  it('lets the parent restore a clipped field before scrolling its text', () => {
    const handleParentKeyDown = vi.fn();
    const handleNavigationRequest = vi.fn((event: Event) => {
      (event as CustomEvent<{ handled: boolean }>).detail.handled = true;
    });
    const { container } = render(
      <div data-scroll-view="true" onKeyDown={handleParentKeyDown}>
        <InputTextViewFrame
          {...BASE_PROPS}
          textAreaRef={BASE_PROPS.textAreaRef}
          value={'First\nSecond\nThird\nFourth\nFifth'}
        />
      </div>,
    );
    const scrollView = container.firstElementChild as HTMLElement;
    const textarea = screen.getByLabelText('Start writing');
    Object.defineProperties(textarea, {
      clientHeight: { configurable: true, value: 120 },
      scrollHeight: { configurable: true, value: 240 },
      scrollTop: { configurable: true, writable: true, value: 80 },
    });
    const animation = installScrollAnimationHarness();
    scrollView.getBoundingClientRect = () => rect(0, 600);
    textarea.getBoundingClientRect = () => rect(40, 152);
    scrollView.addEventListener(
      SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
      handleNavigationRequest,
    );

    fireEvent.keyDown(textarea, { key: 'ArrowDown' });
    expect(animation.pendingCount()).toBe(1);

    textarea.getBoundingClientRect = () => rect(-40, 152);
    const clippedEvent = createEvent.keyDown(textarea, { key: 'ArrowUp' });
    fireEvent(textarea, clippedEvent);

    expect(clippedEvent.defaultPrevented).toBe(true);
    expect(textarea.scrollTop).toBe(80);
    expect(animation.pendingCount()).toBe(0);
    expect(animation.cancelledCount()).toBe(1);
    expect(handleNavigationRequest).toHaveBeenCalledTimes(1);
    expect(handleParentKeyDown).not.toHaveBeenCalled();

    textarea.getBoundingClientRect = () => rect(40, 152);
    const visibleEvent = createEvent.keyDown(textarea, { key: 'ArrowUp' });
    fireEvent(textarea, visibleEvent);
    act(() => animation.flushLatest());

    expect(visibleEvent.defaultPrevented).toBe(true);
    expect(textarea.scrollTop).toBe(80 - INPUT_TEXT_VIEW_LINE_HEIGHT);
    expect(handleNavigationRequest).toHaveBeenCalledTimes(1);
    expect(handleParentKeyDown).not.toHaveBeenCalled();
    animation.restore();
  });

  it('lets a real ScrollView align a clipped field without scrolling its text', () => {
    render(
      <ScrollView
        height={100}
        ariaLabel="Parent scroll view"
        fadingEdgeEnabled={false}
      >
        <div data-uit-focus-boundary-root="true">
          <InputTextViewFrame
            {...BASE_PROPS}
            textAreaRef={BASE_PROPS.textAreaRef}
            value={'First\nSecond\nThird\nFourth\nFifth'}
          />
          <button type="button">Following action</button>
        </div>
      </ScrollView>,
    );
    const scrollView = screen.getByRole('region', { name: 'Parent scroll view' });
    const textarea = screen.getByLabelText('Start writing');
    const followingAction = screen.getByRole('button', { name: 'Following action' });
    Object.defineProperties(scrollView, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, writable: true, value: 50 },
    });
    Object.defineProperties(textarea, {
      clientHeight: { configurable: true, value: 40 },
      scrollHeight: { configurable: true, value: 120 },
      scrollTop: { configurable: true, writable: true, value: 40 },
    });
    scrollView.getBoundingClientRect = () => rect(0, 100, 0, 100);
    textarea.getBoundingClientRect = () => rect(-20, 40, 0, 80);
    followingAction.getBoundingClientRect = () => rect(50, 20, 0, 80);
    scrollView.scrollTo = vi.fn();
    const animation = installScrollAnimationHarness();
    const event = createEvent.keyDown(textarea, { key: 'ArrowUp' });

    fireEvent(textarea, event);

    expect(event.defaultPrevented).toBe(true);
    expect(scrollView.scrollTo).toHaveBeenCalledWith({
      behavior: 'auto',
      left: 0,
      top: 0,
    });
    expect(textarea.scrollTop).toBe(40);
    expect(animation.pendingCount()).toBe(0);
    animation.restore();
  });

  it('restores only the clipped edge matching the pressed direction', () => {
    const handleNavigationRequest = vi.fn((event: Event) => {
      (event as CustomEvent<{ handled: boolean }>).detail.handled = true;
    });
    const { container } = render(
      <div data-scroll-view="true">
        <InputTextViewFrame
          {...BASE_PROPS}
          textAreaRef={BASE_PROPS.textAreaRef}
          value={'First\nSecond\nThird\nFourth\nFifth'}
        />
      </div>,
    );
    const scrollView = container.firstElementChild as HTMLElement;
    const textarea = screen.getByLabelText('Start writing');
    Object.defineProperties(textarea, {
      clientHeight: { configurable: true, value: 120 },
      scrollHeight: { configurable: true, value: 240 },
      scrollTop: { configurable: true, writable: true, value: 40 },
    });
    const animation = installScrollAnimationHarness();
    scrollView.getBoundingClientRect = () => rect(0, 600);
    scrollView.addEventListener(
      SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
      handleNavigationRequest,
    );

    textarea.getBoundingClientRect = () => rect(-40, 152);
    fireEvent.keyDown(textarea, { key: 'ArrowDown' });
    expect(handleNavigationRequest).not.toHaveBeenCalled();
    expect(animation.pendingCount()).toBe(1);
    act(() => animation.flushLatest());

    textarea.scrollTop = 80;
    textarea.getBoundingClientRect = () => rect(500, 152);
    fireEvent.keyDown(textarea, { key: 'ArrowUp' });
    expect(handleNavigationRequest).not.toHaveBeenCalled();
    expect(animation.pendingCount()).toBe(1);
    act(() => animation.flushLatest());

    animation.restore();
  });

  it('shows and updates the custom scrollbar for overflowing text', () => {
    renderFrame({ value: 'A long message' });
    const textarea = screen.getByLabelText('Start writing');
    Object.defineProperties(textarea, {
      clientHeight: { configurable: true, value: 120 },
      scrollHeight: { configurable: true, value: 240 },
      scrollTop: { configurable: true, writable: true, value: 60 },
    });

    fireEvent.scroll(textarea);

    const scrollbar = document.querySelector<HTMLElement>('[data-uit-input-scrollbar]');
    expect(scrollbar).not.toBeNull();
    expect(
      scrollbar?.style.getPropertyValue('--uit-input-text-view-scroll-ratio'),
    ).toBe('0.5');
    expect(
      scrollbar?.style.getPropertyValue('--uit-input-text-view-viewport-ratio'),
    ).toBe('0.5');
  });

  it('maps text-action traversal to visual direction in RTL', () => {
    renderFrame({
      rootProps: { dir: 'rtl' },
      showActionButton: true,
      value: 'Draft',
    });
    const textarea = screen.getByLabelText('Start writing');
    const action = screen.getByRole('button', { name: 'Send' });

    act(() => textarea.focus());
    const moveToAction = createEvent.keyDown(textarea, { key: 'ArrowLeft' });
    fireEvent(textarea, moveToAction);
    expect(moveToAction.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(action);

    const continueOutward = createEvent.keyDown(action, { key: 'ArrowLeft' });
    fireEvent(action, continueOutward);
    expect(continueOutward.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(action);

    const returnToText = createEvent.keyDown(action, { key: 'ArrowRight' });
    fireEvent(action, returnToText);
    expect(returnToText.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(textarea);
  });

  it('returns focus from the action to the text area on ArrowUp', () => {
    renderFrame({ showActionButton: true, value: 'Draft' });
    const textarea = screen.getByLabelText('Start writing');
    const action = screen.getByRole('button', { name: 'Send' });

    act(() => textarea.focus());
    fireEvent.keyDown(textarea, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(action);

    const returnToText = createEvent.keyDown(action, { key: 'ArrowUp' });
    fireEvent(action, returnToText);
    expect(returnToText.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(textarea);
  });

  it('does not consume action-to-text navigation after the input becomes disabled', () => {
    const handleRootKeyDown = vi.fn();
    const { rerender } = renderFrame({
      rootProps: { onKeyDown: handleRootKeyDown },
      showActionButton: true,
      value: 'Draft',
    });
    const action = screen.getByRole('button', { name: 'Send' });
    act(() => action.focus());

    rerender(
      <InputTextViewFrame
        {...BASE_PROPS}
        rootProps={{ onKeyDown: handleRootKeyDown }}
        showActionButton={true}
        value="Draft"
        inputProps={{ disabled: true }}
      />,
    );
    const event = createEvent.keyDown(action, { key: 'ArrowLeft' });
    fireEvent(action, event);

    expect(event.defaultPrevented).toBe(false);
    expect(handleRootKeyDown).toHaveBeenCalledTimes(1);
  });

  it('measures localized shrink-empty hints and remeasures after fonts load', async () => {
    let loadingDoneListener: EventListener | null = null;
    const fontsDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts');
    const fakeFonts = {
      ready: new Promise<FontFaceSet>(() => {}),
      addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === 'loadingdone') {
          loadingDoneListener = listener as EventListener;
        }
      }),
      removeEventListener: vi.fn(),
    } as unknown as FontFaceSet;
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: fakeFonts,
    });

    let hintWidth = 180;
    let rulerDirection = '';
    let rulerUnicodeBidi = '';
    const originalGetComputedStyle = window.getComputedStyle;
    const computedStyleSpy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((element, pseudoElement) => {
        const computedStyle = originalGetComputedStyle(element, pseudoElement);
        if (element instanceof HTMLTextAreaElement) {
          Object.defineProperties(computedStyle, {
            direction: { configurable: true, value: 'rtl' },
            unicodeBidi: { configurable: true, value: 'plaintext' },
          });
        }
        return computedStyle;
      });
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getBoundingClientRect(): DOMRect {
        if (this instanceof HTMLSpanElement && this.style.position === 'fixed') {
          rulerDirection = this.style.direction;
          rulerUnicodeBidi = this.style.unicodeBidi;
          return rect(0, 0, 0, hintWidth);
        }
        return originalRect.call(this);
      });

    try {
      renderFrame({
        measureEmptyWidth: true,
        hint: 'メッセージを書く',
      });
      const textarea = screen.getByLabelText('メッセージを書く');
      const textContainer = textarea.closest<HTMLElement>('[data-uit-interactable]');
      expect(textContainer).not.toBeNull();
      await waitFor(() => expect(textContainer?.style.width).toBe('228px'));
      expect(rulerDirection).toBe('rtl');
      expect(rulerUnicodeBidi).toBe('plaintext');

      hintWidth = 300;
      act(() => {
        loadingDoneListener?.(new Event('loadingdone'));
      });
      await waitFor(() => expect(textContainer?.style.width).toBe('348px'));
    } finally {
      computedStyleSpy.mockRestore();
      rectSpy.mockRestore();
      if (fontsDescriptor == null) {
        delete (document as Document & { fonts?: FontFaceSet }).fonts;
      } else {
        Object.defineProperty(document, 'fonts', fontsDescriptor);
      }
    }
  });

  it('cancels keyboard scrolling when an external scroll changes position', () => {
    renderFrame({ value: 'First\nSecond\nThird\nFourth\nFifth' });
    const textarea = screen.getByLabelText('Start writing');
    Object.defineProperties(textarea, {
      clientHeight: { configurable: true, value: 120 },
      scrollHeight: { configurable: true, value: 240 },
      scrollTop: { configurable: true, writable: true, value: 0 },
    });
    const animation = installScrollAnimationHarness();

    fireEvent.keyDown(textarea, { key: 'ArrowDown' });
    act(() => animation.flushLatest(1));
    expect(animation.pendingCount()).toBe(1);

    textarea.scrollTop = 90;
    fireEvent.scroll(textarea);
    expect(animation.pendingCount()).toBe(0);
    expect(animation.cancelledCount()).toBe(1);
    act(() => animation.flushLatest());
    expect(textarea.scrollTop).toBe(90);

    animation.restore();
  });

  it('caps multiline growth at three native-height lines', async () => {
    const { rerender } = renderFrame({ value: 'One line' });
    const textarea = screen.getByLabelText('Start writing');
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: () => 280,
    });

    rerender(
      <InputTextViewFrame
        {...BASE_PROPS}
        value={'First\nSecond\nThird\nFourth'}
      />,
    );

    await waitFor(() => expect(textarea.style.height).toBe('168px'));
  });

  it('switches material focus directly between the text area and action', async () => {
    const textStates: VisualState[] = [];
    const textTransitions: Array<MaterialStateTransition | null> = [];
    const actionStates: VisualState[] = [];
    const textMaterial = createStateProbeMaterial(textStates, textTransitions);
    const textMaterialStateSpy = vi.spyOn(textMaterial, 'setState');
    const restoreHarness = installCanvasRenderHarness(348);

    try {
      renderFrame({
        material: textMaterial,
        actionButtonMaterial: createStateProbeMaterial(actionStates),
        containerWidth: 252,
        showActionButton: true,
        value: 'Draft',
      });

      const textarea = screen.getByLabelText('Start writing');
      const action = screen.getByRole('button', { name: 'Send' });
      const textContainer = textarea.closest<HTMLElement>('[data-uit-interactable]');
      const defaultScale = (348 - 16) / 348;
      expect(textContainer).not.toBeNull();

      act(() => textarea.focus());
      await waitFor(() => {
        expect(textStates[textStates.length - 1]).toBe(VisualState.FOCUSED);
        expect(textContainer?.style.transform).toBe('scale(1, 1)');
      });
      expect(
        textMaterialStateSpy.mock.calls.filter(
          call => call[0] === VisualState.DEFAULT && call[1] === VisualState.FOCUSED,
        ),
      ).toHaveLength(1);

      fireEvent.keyDown(textarea, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(document.activeElement).toBe(action);
        expect(textStates[textStates.length - 1]).toBe(VisualState.DEFAULT);
        expect(actionStates[actionStates.length - 1]).toBe(VisualState.FOCUSED);
        expect(textContainer?.style.transform).toBe(
          `scale(${defaultScale}, ${defaultScale})`,
        );
      });
      expect(textTransitions).toContainEqual(
        expect.objectContaining({
          from: VisualState.FOCUSED,
          to: VisualState.DEFAULT,
        }),
      );
      expect(
        textMaterialStateSpy.mock.calls.filter(
          call => call[0] === VisualState.FOCUSED && call[1] === VisualState.DEFAULT,
        ),
      ).toHaveLength(1);

      const textTransitionCountBeforeReturn = textTransitions.length;
      fireEvent.keyDown(action, { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(document.activeElement).toBe(textarea);
        expect(textStates[textStates.length - 1]).toBe(VisualState.FOCUSED);
        expect(actionStates[actionStates.length - 1]).toBe(VisualState.DEFAULT);
        expect(textContainer?.style.transform).toBe('scale(1, 1)');
      });
      const returnTransitions = textTransitions.slice(textTransitionCountBeforeReturn);
      expect(returnTransitions).toContainEqual(
        expect.objectContaining({
          from: VisualState.DEFAULT,
          to: VisualState.FOCUSED,
        }),
      );
      expect(returnTransitions).not.toContainEqual(
        expect.objectContaining({
          from: VisualState.FOCUSED,
          to: VisualState.DEFAULT,
        }),
      );
      expect(
        textMaterialStateSpy.mock.calls.filter(
          call => call[0] === VisualState.DEFAULT && call[1] === VisualState.FOCUSED,
        ),
      ).toHaveLength(2);
    } finally {
      restoreHarness();
    }
  });
});
