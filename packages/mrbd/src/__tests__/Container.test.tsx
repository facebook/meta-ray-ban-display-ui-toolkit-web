/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Container tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, fireEvent, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { Container, PartialFocusSupportedAxis } from '@wearables-ui-toolkit/foundation/components/Container';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { VisualState, State, InteractionConstants } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { FastScrollTracker } from '@wearables-ui-toolkit/foundation/base/InteractableFastScrollTracker';
import { createFocusedMaterialLayer } from '@wearables-ui-toolkit/foundation/material/DefaultContainerMaterialLayerFactories';
import {
  FORCE_FOCUS_SYNC_EVENT,
  INVALID_FOCUS_DIRECTION_EVENT,
  PARTIAL_FOCUS_HANDOFF_EVENT,
} from '@wearables-ui-toolkit/foundation/base/FocusCoordinator';
import { drawLayer } from './helpers/canvasRecorder';
import {
  ContainerMaterial,
  LayerPlacement,
  createLayer,
} from '@wearables-ui-toolkit/foundation';

// The fast-scroll tracker is a Date.now()-based module singleton; reset it before
// each test so rapid focus events from a prior test don't leak into this one and
// trigger the fast-focus scale hesitation delay.
beforeEach(() => {
  FastScrollTracker.reset();
});

/**
 * The focus-aware glow layer draws its radial gradient by translating the canvas
 * to the gradient center before painting, so the recorded `translate` x is the
 * gradient origin's x. Returns that x for a given partial-focus offset.
 */
function focusedGradientOriginX(partialFocusX: number, width = 200): number {
  const recorder = drawLayer(createFocusedMaterialLayer(), {
    state: VisualState.FOCUSED,
    width,
    height: 88,
    partialFocusPosition: { x: partialFocusX, y: 0 },
  });
  const translate = recorder.ofType('translate')[0];
  return translate?.args[0] as number;
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

function mockElementAnimate() {
  const originalAnimate = HTMLElement.prototype.animate;
  const animateMock = vi.fn((
    _keyframes?: Keyframe[] | PropertyIndexedKeyframes | null,
    _options?: number | KeyframeAnimationOptions,
  ): Animation => ({
    cancel: vi.fn(),
    onfinish: null,
    oncancel: null,
  } as unknown as Animation));

  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    writable: true,
    value: animateMock,
  });

  return {
    animateMock,
    restore: () => {
      Object.defineProperty(HTMLElement.prototype, 'animate', {
        configurable: true,
        writable: true,
        value: originalAnimate,
      });
    },
  };
}

describe('Container rendering', () => {
  it('renders children', () => {
    const { container } = render(
      <Container>
        <span data-testid="child">Hello</span>
      </Container>
    );
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it('forwards function refs to the container element', () => {
    const ref = vi.fn();

    render(<Container ref={ref}>Content</Container>);

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('preserves native element props, semantics, and ref types', () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <Container as="button" ref={ref} type="button">
        Native container
      </Container>,
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute('type', 'button');
    expect(ref.current).not.toHaveAttribute('role');
  });

  it('renders background layers', () => {
    const { container } = render(
      <Container>Content</Container>
    );
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
  });

  it('clips DOM material layers without clipping SVG material wrappers', async () => {
    const { container } = render(
      <Container width={200} height={88}>Content</Container>
    );

    await waitFor(() => {
      const svgLayer = container.querySelector(
        '[class*="backgroundLayers"] svg[class*="materialLayer"]',
      );
      const clippedDomLayer = Array.from(
        container.querySelectorAll('[class*="backgroundLayers"] div[class*="materialLayer"]'),
      ).find(layer => (layer.getAttribute('style') ?? '').includes('clip-path: url('));

      expect(svgLayer?.getAttribute('style') ?? '').not.toContain('clip-path');
      expect(clippedDomLayer).not.toBeNull();
    });
  });

  it('applies border-radius from the default shape provider', () => {
    const { container } = render(
      <Container material={MaterialLibrary.button()}>Content</Container>
    );
    const root = container.firstElementChild;
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('border-radius');
  });

  it('applies width and height props', () => {
    const { container } = render(
      <Container width={100} height={50}>Content</Container>
    );
    const root = container.firstElementChild;
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('width: 100px');
    expect(style).toContain('height: 50px');
  });

});

describe('Container interactivity', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(
      <Container onClick={onClick}>Click me</Container>
    );
    const root = container.firstElementChild as HTMLElement;
    fireEvent.click(root);
    expect(onClick).toHaveBeenCalled();
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    const { container } = render(
      <Container onClick={onClick} disabled>Disabled</Container>
    );
    const root = container.firstElementChild as HTMLElement;
    fireEvent.click(root);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is focusable by default', () => {
    const { container } = render(
      <Container>Focusable</Container>
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tabIndex).toBeGreaterThanOrEqual(0);
  });

  it('marks the root when excluded from automatic initial focus', () => {
    const { container } = render(
      <Container initialFocusEligible={false}>Header-like control</Container>
    );

    expect(container.firstElementChild).toHaveAttribute(
      'data-uit-initial-focus-excluded',
      'true',
    );
  });

  it('handles focus and blur events', () => {
    const { container } = render(
      <Container>Focus test</Container>
    );
    const root = container.firstElementChild as HTMLElement;
    fireEvent.focus(root);
    fireEvent.blur(root);
    // Should not crash
    expect(root).toBeInTheDocument();
  });

  it('handles keyDown + keyUp Enter to trigger click', () => {
    const onClick = vi.fn();
    const { container } = render(
      <Container onClick={onClick}>Press me</Container>
    );
    const root = container.firstElementChild as HTMLElement;
    fireEvent.focus(root);
    fireEvent.keyDown(root, { key: 'Enter' });
    fireEvent.keyUp(root, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });
});

describe('Container scale and state', () => {
  it('snaps state changes when reduced motion is requested', () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    const material = MaterialLibrary.default();
    const setStateSpy = vi.spyOn(material, 'setState');
    const { container, unmount } = render(
      <Container width={400} height={300} material={material}>
        Reduced motion
      </Container>,
    );

    try {
      const root = container.querySelector('[role="button"]') as HTMLElement;
      fireEvent.focus(root);

      expect(setStateSpy).toHaveBeenLastCalledWith(
        VisualState.DEFAULT,
        VisualState.FOCUSED,
        false,
      );
    } finally {
      unmount();
      setStateSpy.mockRestore();
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });

  it('follows a controlled interaction state without DOM state changes', () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    const material = MaterialLibrary.default();
    const setStateSpy = vi.spyOn(material, 'setState');
    const view = render(
      <Container
        width={400}
        height={300}
        material={material}
        interactionStateOverride={{ state: State.DEFAULT, isDisabled: false }}
        contentScaleForStateFn={state => state === State.FOCUSED ? 1 : 0.96}
      >
        Controlled state
      </Container>,
    );

    try {
      const root = view.container.querySelector('[role="button"]') as HTMLElement;
      expect(root.style.transform).toBe('scale(0.96, 0.96)');
      setStateSpy.mockClear();

      fireEvent.focus(root);
      expect(setStateSpy).not.toHaveBeenCalled();
      expect(root.style.transform).toBe('scale(0.96, 0.96)');

      view.rerender(
        <Container
          width={400}
          height={300}
          material={material}
          interactionStateOverride={{ state: State.FOCUSED, isDisabled: false }}
          contentScaleForStateFn={state => state === State.FOCUSED ? 1 : 0.96}
        >
          Controlled state
        </Container>,
      );
      expect(setStateSpy).toHaveBeenLastCalledWith(
        VisualState.DEFAULT,
        VisualState.FOCUSED,
        false,
      );
      expect(root.style.transform).toBe('scale(1, 1)');

      setStateSpy.mockClear();
      fireEvent.blur(root);
      expect(setStateSpy).not.toHaveBeenCalled();
      expect(root.style.transform).toBe('scale(1, 1)');
    } finally {
      view.unmount();
      setStateSpy.mockRestore();
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });

  it('synchronizes interaction state when control ownership changes', () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    const view = render(
      <Container
        width={400}
        height={300}
        contentScaleForStateFn={state => state === State.FOCUSED ? 1 : 0.96}
      >
        Changing ownership
      </Container>,
    );

    try {
      const root = view.container.querySelector('[role="button"]') as HTMLElement;
      act(() => {
        root.focus();
      });
      expect(root.style.transform).toBe('scale(1, 1)');

      view.rerender(
        <Container
          width={400}
          height={300}
          interactionStateOverride={{ state: State.DEFAULT, isDisabled: false }}
          contentScaleForStateFn={state => state === State.FOCUSED ? 1 : 0.96}
        >
          Changing ownership
        </Container>,
      );
      expect(root.style.transform).toBe('scale(0.96, 0.96)');

      view.rerender(
        <Container
          width={400}
          height={300}
          contentScaleForStateFn={state => state === State.FOCUSED ? 1 : 0.96}
        >
          Changing ownership
        </Container>,
      );
      expect(root.style.transform).toBe('scale(1, 1)');

      act(() => {
        root.blur();
      });
      view.rerender(
        <Container
          width={400}
          height={300}
          interactionStateOverride={{ state: State.FOCUSED, isDisabled: false }}
          contentScaleForStateFn={state => state === State.FOCUSED ? 1 : 0.96}
        >
          Changing ownership
        </Container>,
      );
      expect(root.style.transform).toBe('scale(1, 1)');

      view.rerender(
        <Container
          width={400}
          height={300}
          contentScaleForStateFn={state => state === State.FOCUSED ? 1 : 0.96}
        >
          Changing ownership
        </Container>,
      );
      expect(root.style.transform).toBe('scale(0.96, 0.96)');

      view.rerender(
        <Container
          width={400}
          height={300}
          interactionStateOverride={{ state: State.DEFAULT, isDisabled: false }}
          contentScaleForStateFn={state => state === State.FOCUSED ? 1 : 0.96}
        >
          <input aria-label="Nested focus target" />
        </Container>,
      );
      const nestedInput = view.getByLabelText('Nested focus target');
      act(() => {
        nestedInput.focus();
      });
      expect(root.style.transform).toBe('scale(0.96, 0.96)');

      view.rerender(
        <Container
          width={400}
          height={300}
          contentScaleForStateFn={state => state === State.FOCUSED ? 1 : 0.96}
        >
          <input aria-label="Nested focus target" />
        </Container>,
      );
      expect(root.style.transform).toBe('scale(1, 1)');
    } finally {
      view.unmount();
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });

  it('updates disabled state after controlled interaction ownership is released', () => {
    const material = MaterialLibrary.default();
    const setStateSpy = vi.spyOn(material, 'setState');
    const view = render(
      <Container
        material={material}
        interactionStateOverride={{ state: State.DEFAULT, isDisabled: false }}
      >
        Changing disabled state
      </Container>,
    );

    view.rerender(
      <Container material={material}>
        Changing disabled state
      </Container>,
    );
    setStateSpy.mockClear();

    view.rerender(
      <Container material={material} disabled>
        Changing disabled state
      </Container>,
    );

    expect(setStateSpy).toHaveBeenLastCalledWith(
      VisualState.DEFAULT,
      VisualState.DEFAULT,
      true,
    );
  });

  it('initializes fixed-size default containers at the default scale', () => {
    const { container } = render(
      <Container width={100} height={100}>Default scale</Container>
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.transform).toBe('scale(0.84, 0.84)');
  });

  it('initializes auto-sized controlled pressed containers at the measured scale', () => {
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(200);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(88);

    try {
      const { container } = render(
        <Container
          interactionStateOverride={{ state: State.PRESSED, isDisabled: false }}
          contentScaleForStateFn={state => state === State.PRESSED ? 0.8 : 0.92}
        >
          Pressed
        </Container>,
      );

      const root = container.firstElementChild as HTMLElement;
      expect(root.style.transform).toBe('scale(0.8, 0.8)');
    } finally {
      offsetWidthSpy.mockRestore();
      offsetHeightSpy.mockRestore();
    }
  });

  it('snaps measured default scale without a transform transition', () => {
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frames.set(frameId, callback);
        return frameId;
      });
    const cancelFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((frameId: number) => {
        frames.delete(frameId);
      });
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(200);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(88);

    const { container, unmount } = render(
      <Container>Measured scale</Container>
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.transform).toBe('scale(0.92, 0.92)');
    expect(root.style.transition).toBe('none');

    unmount();
    requestFrameSpy.mockRestore();
    cancelFrameSpy.mockRestore();
    offsetWidthSpy.mockRestore();
    offsetHeightSpy.mockRestore();
  });

  it('snaps page-entry focus through the shared interaction animation flag', () => {
    const { animateMock, restore } = mockElementAnimate();
    const material = MaterialLibrary.card();
    const setStateSpy = vi.spyOn(material, 'setState');

    try {
      const { container } = render(
        <div data-page-transition-phase="entering">
          <Container width={400} height={300} material={material}>Initial focus</Container>
        </div>
      );

      const root = container.querySelector('[role="button"]') as HTMLElement;
      expect(root.style.transform).toContain('scale(0.96');

      fireEvent.focus(root);

      expect(root.style.transform).toBe('scale(1, 1)');
      expect(root.style.transition).toBe('none');
      expect(animateMock).not.toHaveBeenCalled();
      expect(setStateSpy).toHaveBeenLastCalledWith(
        VisualState.DEFAULT,
        VisualState.FOCUSED,
        false,
      );
    } finally {
      setStateSpy.mockRestore();
      restore();
    }
  });

  it('starts root scale animation from the same interaction state change as material focus', () => {
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frames.set(frameId, callback);
        return frameId;
      });
    const cancelFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((frameId: number) => {
        frames.delete(frameId);
      });
    const material = MaterialLibrary.card();
    const setStateSpy = vi.spyOn(material, 'setState');

    try {
      const { container } = render(
        <Container width={400} height={300} material={material}>Animated focus</Container>
      );

      const root = container.querySelector('[role="button"]') as HTMLElement;
      expect(root.style.transform).toContain('scale(0.96');

      frames.clear();
      requestFrameSpy.mockClear();
      fireEvent.focus(root);

      expect(root.style.transform).toContain('scale(0.96');

      const firstFrame = Array.from(frames.values())[0];
      expect(firstFrame).toBeDefined();

      act(() => {
        frames.clear();
        firstFrame?.(performance.now());
      });

      expect(root.style.transform).toContain('scale(0.96');
      expect(root.style.transition).toBe('none');

      const finalFrame = Array.from(frames.values())[0];
      act(() => {
        finalFrame?.(1000000);
      });
      expect(root.style.transform).toBe('scale(1, 1)');
      expect(setStateSpy).toHaveBeenLastCalledWith(
        VisualState.DEFAULT,
        VisualState.FOCUSED,
        true,
      );
    } finally {
      setStateSpy.mockRestore();
      requestFrameSpy.mockRestore();
      cancelFrameSpy.mockRestore();
    }
  });

  it('presses on down and holds a quick release for QUICK_PRESS_RELEASE_DELAY', () => {
    // Press-down applies immediately; a release that arrives within
    // QUICK_PRESS_RELEASE_DELAY of the press is DELAYED by a full
    // QUICK_PRESS_RELEASE_DELAY so a quick tap stays visibly pressed.
    FastScrollTracker.reset();
    vi.useFakeTimers();
    try {
      const states: State[] = [];
      const { container } = render(
        <Container
          width={400}
          height={300}
          material={MaterialLibrary.card()}
          onClick={() => {}}
          onStateChange={(_prev, next) => states.push(next.state)}
        >
          Tap
        </Container>
      );
      const root = container.querySelector('[role="button"]') as HTMLElement;

      act(() => { fireEvent.focus(root); });
      states.length = 0;

      // DOWN -> pressed immediately.
      act(() => { fireEvent.mouseDown(root); });
      expect(states[states.length - 1]).toBe(State.PRESSED);

      // UP a few ms later (well under the threshold) -> release is HELD, not applied.
      act(() => {
        vi.advanceTimersByTime(5);
        fireEvent.mouseUp(root);
      });
      expect(states[states.length - 1]).toBe(State.PRESSED);

      // After the full quick-press-release delay elapses, the release applies.
      act(() => { vi.advanceTimersByTime(InteractionConstants.QUICK_PRESS_RELEASE_DELAY); });
      expect(states[states.length - 1]).not.toBe(State.PRESSED);
    } finally {
      vi.useRealTimers();
    }
  });

  it('animates the press scale with an overshooting spring', () => {
    // Drive the rAF root-scale animation deterministically and assert the press
    // scale dips BELOW its settled value mid-flight — the spring overshoot
    // (CONTAINER_SCALE_PRESS), which a fixed cubic-bezier ease never produces.
    FastScrollTracker.reset();
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    const reqSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback): number => {
        const id = nextFrameId;
        nextFrameId += 1;
        frames.set(id, cb);
        return id;
      });
    const cancelSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((id: number) => {
        frames.delete(id);
      });
    const material = MaterialLibrary.card();
    const scaleOf = (el: HTMLElement): number => {
      const m = el.style.transform.match(/scale\(([0-9.]+)/);
      return m ? parseFloat(m[1]) : 1;
    };
    const runPendingAt = (t: number): void => {
      const pending = Array.from(frames.values());
      frames.clear();
      act(() => {
        pending.forEach((f) => f(t));
      });
    };
    try {
      // jsdom getBoundingClientRect() is 0, so the measured content scale is
      // always 1; supply an explicit scale (FOCUSED 1 -> PRESSED 0.96) so the
      // press has real travel for the spring to overshoot on.
      const { container } = render(
        <Container
          width={400}
          height={300}
          material={material}
          contentScaleForStateFn={(state) => (state === 'pressed' ? 0.96 : 1)}
        >
          Press
        </Container>
      );
      const root = container.querySelector('[role="button"]') as HTMLElement;

      // Settle FOCUSED (scale 1) before pressing.
      fireEvent.focus(root);
      runPendingAt(1e9);
      expect(scaleOf(root)).toBeCloseTo(1, 2);

      // Press: animate 1 -> ~0.96 with the spring.
      frames.clear();
      const base = performance.now();
      fireEvent.mouseDown(root);
      const swept: number[] = [];
      for (let dt = 10; dt <= 400 && frames.size > 0; dt += 20) {
        runPendingAt(base + dt);
        swept.push(scaleOf(root));
      }
      runPendingAt(base + 1e6); // settle
      const settled = scaleOf(root);

      expect(settled).toBeCloseTo(0.96, 2);
      // Overshoot: at least one mid-flight frame dipped below the settled scale.
      expect(swept.length).toBeGreaterThan(0);
      expect(Math.min(...swept)).toBeLessThan(settled);
    } finally {
      reqSpy.mockRestore();
      cancelSpy.mockRestore();
    }
  });

  it('snaps the entire state change while fast scrolling', () => {
    // Force fast-scroll: two focus changes within the threshold mark the tracker.
    FastScrollTracker.recordFocusChange();
    FastScrollTracker.recordFocusChange();
    expect(FastScrollTracker.isCurrentlyFastScrolling).toBe(true);

    const material = MaterialLibrary.card();
    const setStateSpy = vi.spyOn(material, 'setState');
    const stateChangeAnimations = vi.fn(() => []);
    const nextFocusTarget = document.createElement('button');
    document.body.appendChild(nextFocusTarget);
    try {
      const { container } = render(
        <Container
          width={400}
          height={300}
          material={material}
          contentScaleForStateFn={(state) => state === State.FOCUSED ? 1 : 0.96}
          stateChangeAnimations={stateChangeAnimations}
        >
          Fast focus
        </Container>
      );
      const root = container.querySelector('[role="button"]') as HTMLElement;
      const defaultTransform = root.style.transform;

      setStateSpy.mockClear();
      act(() => root.focus());

      expect(root.style.transform).toBe('scale(1, 1)');
      expect(setStateSpy).toHaveBeenCalledWith(
        VisualState.DEFAULT,
        VisualState.FOCUSED,
        false,
      );
      expect(stateChangeAnimations).toHaveBeenLastCalledWith(
        expect.objectContaining({ animated: false }),
      );

      setStateSpy.mockClear();
      act(() => nextFocusTarget.focus());

      expect(document.activeElement).toBe(nextFocusTarget);
      expect(setStateSpy).toHaveBeenCalledWith(
        VisualState.FOCUSED,
        VisualState.DEFAULT,
        false,
      );
      expect(root.style.transform).toBe(defaultTransform);
      expect(stateChangeAnimations).toHaveBeenLastCalledWith(
        expect.objectContaining({ animated: false }),
      );
    } finally {
      nextFocusTarget.remove();
      setStateSpy.mockRestore();
    }
  });

  it('does not restart an in-flight root animation for duplicate focus syncs', () => {
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frames.set(frameId, callback);
        return frameId;
      });
    const cancelFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((frameId: number) => {
        frames.delete(frameId);
      });
    const material = MaterialLibrary.card();

    try {
      const { container } = render(
        <Container width={400} height={300} material={material}>Stable focus</Container>
      );

      const root = container.querySelector('[role="button"]') as HTMLElement;
      act(() => {
        root.focus();
      });
      const requestsAfterFocus = requestFrameSpy.mock.calls.length;

      act(() => {
        root.dispatchEvent(new Event(FORCE_FOCUS_SYNC_EVENT, { cancelable: true }));
      });

      expect(requestFrameSpy.mock.calls.length).toBe(requestsAfterFocus);
    } finally {
      requestFrameSpy.mockRestore();
      cancelFrameSpy.mockRestore();
    }
  });

  it('does not animate root transform when caller-owned style transform is present', () => {
    const { animateMock, restore } = mockElementAnimate();
    const material = MaterialLibrary.card();
    const setStateSpy = vi.spyOn(material, 'setState');

    try {
      const { container } = render(
        <Container
          width={400}
          height={300}
          material={material}
          style={{ transform: 'scale(0.82)' }}
        >
          Caller scale
        </Container>
      );

      const root = container.querySelector('[role="button"]') as HTMLElement;
      fireEvent.focus(root);

      expect(root.style.transform).toBe('scale(0.82)');
      expect(animateMock).not.toHaveBeenCalled();
      expect(setStateSpy).toHaveBeenLastCalledWith(
        VisualState.DEFAULT,
        VisualState.FOCUSED,
        true,
      );
    } finally {
      setStateSpy.mockRestore();
      restore();
    }
  });

  it('applies transform: scale', () => {
    const { container } = render(
      <Container width={100} height={100}>Scaled</Container>
    );
    const root = container.firstElementChild;
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('scale(');
  });

  it('applies customAlpha as opacity', () => {
    const { container } = render(
      <Container customAlpha={0.5}>Alpha</Container>
    );
    const root = container.firstElementChild;
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('opacity');
  });

  it('applies customScaleX and customScaleY', () => {
    const { container } = render(
      <Container customScaleX={0.9} customScaleY={0.9}>Custom scale</Container>
    );
    const root = container.firstElementChild;
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('scale(');
  });
});

describe('Container disabled state', () => {
  it('sets disabled semantics and initial opacity', () => {
    const { container } = render(
      <Container disabled>Disabled</Container>
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root?.getAttribute('aria-disabled')).toBe('true');
    expect(root).toHaveStyle({ opacity: '0.5' });
  });
});

describe('Container material', () => {
  it('renders CSS-only layers created with createLayer', () => {
    const material = new ContainerMaterial({
      layers: [
        createLayer(
          'css-surface',
          LayerPlacement.BACKGROUND,
          () => ({ backgroundColor: 'rgb(1, 2, 3)' }),
        ),
      ],
    });
    const { container } = render(
      <Container width={120} height={48} material={material}>CSS material</Container>,
    );

    const layer = container.querySelector<HTMLElement>(
      '[data-uit-material-layer="css-surface"]',
    );
    expect(layer?.style.backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('preserves sort order across CSS and canvas layers', () => {
    const material = new ContainerMaterial({
      layers: [
        createLayer(
          'css-top',
          LayerPlacement.BACKGROUND,
          () => ({ backgroundColor: 'rgb(3, 3, 3)' }),
          { sortOrder: 300 },
        ),
        createLayer('canvas-middle', LayerPlacement.BACKGROUND, undefined, {
          sortOrder: 200,
          drawCanvas: () => {},
        }),
        createLayer(
          'css-bottom',
          LayerPlacement.BACKGROUND,
          () => ({ backgroundColor: 'rgb(1, 1, 1)' }),
          { sortOrder: 100 },
        ),
      ],
    });
    const { container } = render(
      <Container width={120} height={48} material={material} />,
    );
    const background = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    const layerOrder = Array.from(background?.children ?? []).map((child) =>
      child.tagName === 'CANVAS'
        ? 'canvas-middle'
        : child.getAttribute('data-uit-material-layer'),
    );

    expect(layerOrder).toEqual(['css-bottom', 'canvas-middle', 'css-top']);
  });

  it('applies material alpha to layers without dimming content', () => {
    const material = new ContainerMaterial({
      alpha: 0.4,
      layers: [],
    });
    const { container } = render(
      <Container material={material}>Readable content</Container>,
    );
    const root = container.firstElementChild as HTMLElement;
    const background = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );

    expect(root.style.opacity).toBe('1');
    expect(background?.style.opacity).toBe('0.4');
  });

  it('multiplies post-composition state alpha without dimming content', () => {
    const material = new ContainerMaterial({
      alpha: 0.5,
      alphaForState: (state) => state === VisualState.FOCUSED ? 0.6 : 1,
      layers: [],
    });
    const { container } = render(
      <Container
        material={material}
        visualStateOverride={VisualState.FOCUSED}
      >
        Readable content
      </Container>,
    );
    const root = container.firstElementChild as HTMLElement;
    const background = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );

    expect(root.style.opacity).toBe('1');
    expect(background?.style.opacity).toBe('0.3');
  });

  it('interpolates post-composition state alpha with a controlled transition', () => {
    const material = new ContainerMaterial({
      alphaForState: (state) => state === VisualState.FOCUSED ? 0.6 : 1,
      layers: [],
    });
    const { container } = render(
      <Container
        material={material}
        visualStateOverride={VisualState.FOCUSED}
        materialTransition={{
          from: VisualState.DEFAULT,
          to: VisualState.FOCUSED,
          progress: 0.5,
        }}
      />,
    );
    const background = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );

    expect(background?.style.opacity).toBe('0.8');
  });

  it('clips content without clipping unbounded material layers', () => {
    const material = new ContainerMaterial({
      layers: [
        createLayer('shadow', LayerPlacement.BACKGROUND, undefined, {
          clipsToShape: false,
          drawCanvas: () => {},
        }),
      ],
    });
    const { container } = render(
      <Container width={120} height={48} material={material}>Content</Container>,
    );
    const root = container.firstElementChild as HTMLElement;
    const content = container.querySelector<HTMLElement>(
      '[class*="contentWrapper"]',
    );
    const background = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    const canvas = background?.querySelector<HTMLCanvasElement>('canvas');

    expect(root.style.overflow).toBe('visible');
    expect(content?.style.overflow).toBe('hidden');
    expect(background?.style.clipPath).toBe('');
    expect(canvas?.style.clipPath).toBe('');
  });

  it('detaches old materials and synchronizes replacement state', () => {
    const first = MaterialLibrary.button();
    const second = MaterialLibrary.button();
    const view = render(
      <Container material={first} visualStateOverride={VisualState.FOCUSED} />,
    );

    view.rerender(
      <Container material={second} visualStateOverride={VisualState.FOCUSED} />,
    );

    expect(second.getCurrentState()).toBe(VisualState.FOCUSED);
    expect(() => first.attachToHost({}, () => {})).not.toThrow();
  });

  it('synchronizes visual state overrides on the same material instance', () => {
    const material = MaterialLibrary.button();
    const view = render(
      <Container material={material} visualStateOverride={VisualState.DEFAULT} />,
    );

    view.rerender(
      <Container material={material} visualStateOverride={VisualState.PRESSED} />,
    );

    expect(material.getCurrentState()).toBe(VisualState.PRESSED);
  });

  it('opens backdrop-blended background layers to the parent backdrop', () => {
    const material = new ContainerMaterial({
      backgroundBlendsWithBackdrop: true,
      layers: [
        createLayer('blend', LayerPlacement.BACKGROUND, undefined, {
          blendMode: 'screen',
          drawCanvas: () => {},
        }),
      ],
    });
    const { container } = render(
      <Container
        width={120}
        height={48}
        material={material}
        contentScaleForStateFn={() => 1}
      >
        Content
      </Container>,
    );
    const root = container.firstElementChild as HTMLElement;
    const background = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    const content = container.querySelector<HTMLElement>(
      '[class*="contentWrapper"]',
    );

    expect(root).toHaveAttribute(
      'data-uit-background-blends-with-backdrop',
      'true',
    );
    expect(root.style.isolation).toBe('auto');
    expect(root.style.zIndex).toBe('');
    expect(root.style.transform).toBe('');
    expect(root.style.translate).toBe('');
    expect(background?.style.isolation).toBe('auto');
    expect(background?.style.zIndex).toBe('auto');
    expect(content?.style.zIndex).toBe('1');
  });

  it('uses default material when none specified', () => {
    const defaultMaterial = vi.spyOn(MaterialLibrary, 'default');

    render(<Container>Default material</Container>);

    expect(defaultMaterial).toHaveBeenCalledOnce();
  });

  it.each([
    ['button', () => MaterialLibrary.button()],
    ['panel', () => MaterialLibrary.panel()],
    ['card', () => MaterialLibrary.card()],
  ])('consumes %s material layers', (_name, createMaterial) => {
    const material = createMaterial();
    const getBackgroundLayers = vi.spyOn(material, 'getBackgroundLayers');

    render(<Container material={material}>Custom material</Container>);

    expect(getBackgroundLayers).toHaveBeenCalled();
  });

  it('renders controlled material transition layers without independent CSS transitions', () => {
    const { container } = render(
      <Container
        width={200}
        height={88}
        material={MaterialLibrary.button()}
        materialTransition={{
          from: VisualState.DEFAULT,
          to: VisualState.FOCUSED,
          progress: 0.5,
        }}
      >
        Synced material
      </Container>
    );

    // The controlled transition drives a canvas redraw instead of crossfading
    // per-layer DOM nodes. The button material's layers are all background, so
    // the background placement renders a material canvas (an empty placement
    // renders no canvas at all).
    const backgroundCanvas = container.querySelector(
      '[class*="backgroundLayers"] canvas',
    );
    expect(backgroundCanvas).not.toBeNull();

    // ...and no per-layer DOM nodes with their own independent CSS transitions
    // exist to compete with the controlled material transition.
    const perLayerTransitionNodes = Array.from(
      container.querySelectorAll<HTMLElement>('[class*="materialLayer"]'),
    );
    expect(perLayerTransitionNodes).toHaveLength(0);
  });

  it('keeps inset smooth clip definitions without applying CSS clips to SVG material layers', () => {
    const { container } = render(
      <Container
        width={200}
        height={88}
        material={MaterialLibrary.button().withInset(8)}
      >
        Inset material
      </Container>
    );

    const clipPathIds = Array.from(container.querySelectorAll('clipPath, clippath')).map(
      (clipPath) => clipPath.id,
    );
    const materialLayers = Array.from(
      container.querySelectorAll<HTMLElement>('[class*="materialLayer"]'),
    );

    expect(clipPathIds.some((id) => id.includes('clip-inset'))).toBe(true);
    expect(materialLayers.every((layer) => layer.style.clipPath === '')).toBe(true);
  });

  it('uses settled rendered bounds for auto-sized smooth material geometry', async () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    let calls = 0;
    rectSpy.mockImplementation(() => {
      calls += 1;
      return calls < 3 ? rect(0, 0, 55.07, 27.82) : rect(0, 0, 67.31, 34);
    });

    const { container } = render(
      <Container material={MaterialLibrary.button()}>
        Beta
      </Container>
    );

    await waitFor(() => {
      // The material canvas is sized from the settled measured bounds plus the
      // overflow padding (CANVAS_PADDING = 32 per side), so a 67.31 x 34
      // border box yields a 131.31 x 98 canvas — proving the geometry settled
      // on the final measured size, not the transient first measurement.
      const canvas = container.querySelector<HTMLCanvasElement>(
        '[class*="backgroundLayers"] canvas',
      );
      expect(canvas?.style.width).toBe('131.31px');
      expect(canvas?.style.height).toBe('98px');
      // The smooth-corner path is computed from the same settled bounds and is
      // still observable through the clip-path defs.
      const clipPath = container.querySelector('clipPath path, clippath path');
      expect(clipPath?.getAttribute('d')).toContain('34');
    });

    rectSpy.mockRestore();
  });

  it('uses untransformed border-box dimensions for material geometry while scaled', async () => {
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(rect(0, 0, 55.07, 27.82));
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(67);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(34);

    const { container } = render(
      <Container
        material={MaterialLibrary.button()}
        style={{ transform: 'scale(0.82)' }}
      >
        Beta
      </Container>
    );

    await waitFor(() => {
      // Even though the scaled getBoundingClientRect reports 55.07 x 27.82, the
      // material geometry uses the untransformed border-box (offsetWidth /
      // offsetHeight = 67 x 34). The canvas is sized from those border-box
      // dimensions plus CANVAS_PADDING (32 per side) -> 131 x 98, not from the
      // shrunken scaled rect.
      const canvas = container.querySelector<HTMLCanvasElement>(
        '[class*="backgroundLayers"] canvas',
      );
      expect(canvas?.style.width).toBe('131px');
      expect(canvas?.style.height).toBe('98px');
    });

    rectSpy.mockRestore();
    offsetWidthSpy.mockRestore();
    offsetHeightSpy.mockRestore();
  });

  it('rubber-bands and offsets focus-aware material on invalid directional focus', () => {
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frames.set(frameId, callback);
        return frameId;
      });
    const cancelFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((frameId: number) => {
        frames.delete(frameId);
      });

    const material = MaterialLibrary.button();
    const { container, unmount } = render(
      <Container
        width={200}
        height={88}
        material={material}
        style={{ transform: 'scale(0.75)' }}
        data-uit-capture-id="rubber-band-test"
      >
        Rubber
      </Container>
    );

    const root = container.querySelector('[data-uit-capture-id="rubber-band-test"]') as HTMLElement;
    // Baseline gradient origin with no partial-focus offset.
    const initialCx = focusedGradientOriginX(0);
    frames.clear();

    act(() => {
      root.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'right' },
        }),
      );
    });

    const firstFrame = Array.from(frames.values())[0];
    expect(firstFrame).toBeDefined();

    act(() => {
      frames.clear();
      firstFrame?.(performance.now() + 75);
    });

    // The container rubber-bands (translate offset) while preserving the
    // caller-owned transform, and forwards a rightward partial-focus offset to
    // the material...
    expect(root.style.translate).not.toBe('0px 0px');
    expect(root.style.transform).toBe('scale(0.75)');
    const partialFocusX = material.getPartialFocusPosition().x;
    expect(partialFocusX).toBeGreaterThan(0);
    // ...which shifts the focus-aware gradient origin to the right.
    expect(focusedGradientOriginX(partialFocusX)).toBeGreaterThan(initialCx);

    unmount();
    requestFrameSpy.mockRestore();
    cancelFrameSpy.mockRestore();
  });

  it('can disable root translation while keeping rubber-band material offsets', () => {
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frames.set(frameId, callback);
        return frameId;
      });
    const cancelFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((frameId: number) => {
        frames.delete(frameId);
      });
    const material = MaterialLibrary.button();

    const { container, unmount } = render(
      <Container
        width={200}
        height={88}
        material={material}
        isRubberbandTranslationEnabled={false}
        data-uit-capture-id="rubber-band-no-translation-test"
      >
        Rubber
      </Container>
    );

    const root = container.querySelector(
      '[data-uit-capture-id="rubber-band-no-translation-test"]',
    ) as HTMLElement;
    // Baseline gradient origin with no partial-focus offset.
    const initialCx = focusedGradientOriginX(0);
    frames.clear();

    act(() => {
      root.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'right' },
        }),
      );
    });

    const firstFrame = Array.from(frames.values())[0];
    expect(firstFrame).toBeDefined();

    act(() => {
      firstFrame?.(performance.now() + 75);
    });

    // The root does not translate (rubber-band translation disabled), but the
    // material still receives the rubber-band partial-focus offset...
    expect(root.style.translate).toBe('0px 0px');
    const partialFocusX = material.getPartialFocusPosition().x;
    expect(partialFocusX).toBeGreaterThan(0);
    // ...which shifts the focus-aware gradient origin to the right.
    expect(focusedGradientOriginX(partialFocusX)).toBeGreaterThan(initialCx);

    unmount();
    requestFrameSpy.mockRestore();
    cancelFrameSpy.mockRestore();
  });

  it('rubber-bands while reporting invalid directional focus to consumers', () => {
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frames.set(frameId, callback);
        return frameId;
      });
    const cancelFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((frameId: number) => {
        frames.delete(frameId);
      });
    const onInvalidFocusDirection = vi.fn();

    const { container, unmount } = render(
      <Container
        width={200}
        height={88}
        material={MaterialLibrary.button()}
        onInvalidFocusDirection={onInvalidFocusDirection}
        data-uit-capture-id="rubber-band-consumer-test"
      >
        Rubber
      </Container>
    );

    const root = container.querySelector(
      '[data-uit-capture-id="rubber-band-consumer-test"]',
    ) as HTMLElement;
    frames.clear();

    act(() => {
      root.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'down' },
        }),
      );
    });

    expect(onInvalidFocusDirection).toHaveBeenCalledTimes(1);
    expect(onInvalidFocusDirection).toHaveBeenCalledWith('down');

    const firstFrame = Array.from(frames.values())[0];
    expect(firstFrame).toBeDefined();

    act(() => {
      firstFrame?.(performance.now() + 75);
    });

    expect(root.style.translate).not.toBe('0px 0px');

    unmount();
    requestFrameSpy.mockRestore();
    cancelFrameSpy.mockRestore();
  });

  it('reports invalid directional focus without rubber-banding when partial focus is disabled', () => {
    const onInvalidFocusDirection = vi.fn();

    const { container } = render(
      <Container
        width={200}
        height={88}
        material={MaterialLibrary.button()}
        partialFocusSupportedAxis={PartialFocusSupportedAxis.None}
        onInvalidFocusDirection={onInvalidFocusDirection}
        data-uit-capture-id="rubber-band-disabled-test"
      >
        Rubber
      </Container>
    );

    const root = container.querySelector(
      '[data-uit-capture-id="rubber-band-disabled-test"]',
    ) as HTMLElement;
    const requestFrameSpy = vi.spyOn(window, 'requestAnimationFrame');

    act(() => {
      root.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'down' },
        }),
      );
    });

    expect(onInvalidFocusDirection).toHaveBeenCalledTimes(1);
    expect(onInvalidFocusDirection).toHaveBeenCalledWith('down');
    expect(requestFrameSpy).not.toHaveBeenCalled();

    requestFrameSpy.mockRestore();
  });

  it('rubber-bands only on the configured partial focus axis', () => {
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frames.set(frameId, callback);
        return frameId;
      });
    const cancelFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((frameId: number) => {
        frames.delete(frameId);
      });

    const { container, unmount } = render(
      <Container
        width={200}
        height={88}
        material={MaterialLibrary.button()}
        partialFocusSupportedAxis={PartialFocusSupportedAxis.Y}
        data-uit-capture-id="rubber-band-axis-test"
      >
        Rubber
      </Container>
    );

    const root = container.querySelector(
      '[data-uit-capture-id="rubber-band-axis-test"]',
    ) as HTMLElement;
    frames.clear();

    act(() => {
      root.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'right' },
        }),
      );
    });
    expect(frames.size).toBe(0);

    act(() => {
      root.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'down' },
        }),
      );
    });
    expect(frames.size).toBeGreaterThan(0);

    unmount();
    requestFrameSpy.mockRestore();
    cancelFrameSpy.mockRestore();
  });

  it('animates partial-focus handoff material origins without translating the container', () => {
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frames.set(frameId, callback);
        return frameId;
      });
    const cancelFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((frameId: number) => {
        frames.delete(frameId);
      });

    const material = MaterialLibrary.button();
    const { container, unmount } = render(
      <Container
        width={200}
        height={88}
        material={material}
        data-uit-capture-id="handoff-test"
      >
        Handoff
      </Container>
    );

    const root = container.querySelector('[data-uit-capture-id="handoff-test"]') as HTMLElement;
    root.getBoundingClientRect = vi.fn(() => rect(100, 100, 200, 88));
    // Gradient origin at rest (no partial-focus offset).
    const initialCx = focusedGradientOriginX(0);
    frames.clear();

    act(() => {
      root.dispatchEvent(
        new CustomEvent(PARTIAL_FOCUS_HANDOFF_EVENT, {
          detail: {
            phase: 'incoming',
            otherRect: rect(0, 100, 60, 88),
            animated: true,
          },
        }),
      );
    });

    // The handoff comes from a neighbor to the left, so the material's
    // partial-focus origin shifts left, moving the gradient origin below the
    // resting position — all without translating the container.
    const incomingPartialFocusX = material.getPartialFocusPosition().x;
    const incomingCx = focusedGradientOriginX(incomingPartialFocusX);
    expect(root.style.translate === '0px' || root.style.translate === '0px 0px').toBe(true);
    expect(incomingCx).toBeLessThan(initialCx);

    const firstFrame = Array.from(frames.values())[0];
    expect(firstFrame).toBeDefined();

    act(() => {
      frames.clear();
      firstFrame?.(performance.now() + 100);
    });

    // The origin animates back toward rest (gradient origin increases) while the
    // container still never translates.
    const returningPartialFocusX = material.getPartialFocusPosition().x;
    const returningCx = focusedGradientOriginX(returningPartialFocusX);
    expect(returningCx).toBeGreaterThan(incomingCx);
    expect(root.style.translate === '0px' || root.style.translate === '0px 0px').toBe(true);

    unmount();
    requestFrameSpy.mockRestore();
    cancelFrameSpy.mockRestore();
  });

});

describe('Container clipContent', () => {
  it('clips only the content wrapper by default', () => {
    const { container } = render(
      <Container>Clipped</Container>
    );
    const root = container.firstElementChild as HTMLElement;
    const content = container.querySelector<HTMLElement>(
      '[class*="contentWrapper"]',
    );
    expect(root.style.overflow).toBe('visible');
    expect(content?.style.overflow).toBe('hidden');
  });

  it('does not clip when clipContent is false', () => {
    const { container } = render(
      <Container clipContent={false}>Not clipped</Container>
    );
    const root = container.firstElementChild as HTMLElement;
    const content = container.querySelector<HTMLElement>(
      '[class*="contentWrapper"]',
    );
    expect(root.style.overflow).toBe('visible');
    expect(content?.style.overflow).toBe('visible');
  });

  it('clips HTML content with the rendered smooth path geometry', async () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    rectSpy.mockReturnValue({
      x: 0,
      y: 0,
      width: 321.5,
      height: 123.25,
      top: 0,
      left: 0,
      right: 321.5,
      bottom: 123.25,
      toJSON: () => {},
    } as DOMRect);

    const { container } = render(
      <Container width="100%">
        Fractional
      </Container>
    );

    await waitFor(() => {
      const contentWrapper = container.querySelector('[class*="contentWrapper"]') as HTMLElement;
      // Content is clipped with the rendered smooth-corner path geometry,
      // computed from the measured 321.5 x 123.25 bounds...
      const clipPath = contentWrapper?.getAttribute('style') ?? '';
      expect(clipPath).toContain('clip-path: path(');
      // ...and the material canvas is sized from the same bounds plus the
      // overflow padding (CANVAS_PADDING = 32 per side) -> 385.5 x 187.25.
      const canvas = container.querySelector<HTMLCanvasElement>(
        '[class*="backgroundLayers"] canvas',
      );
      expect(canvas?.style.width).toBe('385.5px');
      expect(canvas?.style.height).toBe('187.25px');
    });

    rectSpy.mockRestore();
  });
});
