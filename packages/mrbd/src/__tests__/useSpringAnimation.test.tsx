/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  StrictMode,
  useLayoutEffect,
} from 'react';
import { act, cleanup, render } from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  useSpringAnimation,
  type SpringAnimationController,
} from '@wearables-ui-toolkit/foundation/motion/useSpringAnimation';
import type { SpringConfig } from '@wearables-ui-toolkit/foundation/motion/Animations';

const SPRING_CONFIG: SpringConfig = {
  damping: 16,
  mass: 1,
  stiffness: 150,
};

let nextAnimationFrameId = 1;
let animationFrames = new Map<number, FrameRequestCallback>();
let documentVisibility: DocumentVisibilityState = 'visible';
let prefersReducedMotion = false;
const reducedMotionListeners = new Set<EventListenerOrEventListenerObject>();

const reducedMotionQuery = {
  get matches() {
    return prefersReducedMotion;
  },
  media: '(prefers-reduced-motion: reduce)',
  onchange: null,
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) => {
    if (type === 'change') {
      reducedMotionListeners.add(listener);
    }
  },
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) => {
    if (type === 'change') {
      reducedMotionListeners.delete(listener);
    }
  },
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => true,
} as MediaQueryList;

interface SpringProbeProps {
  config?: SpringConfig;
  frameRate?: number;
  initialValue?: number;
  onChange?: (value: number) => void;
  onController?: (controller: SpringAnimationController) => void;
  onRender?: () => void;
  onRest?: (value: number) => void;
  targetValue: number;
}

function SpringProbe({
  config = SPRING_CONFIG,
  frameRate,
  initialValue = 0,
  onChange = () => {},
  onController,
  onRender,
  onRest,
  targetValue,
}: SpringProbeProps) {
  onRender?.();
  const controller = useSpringAnimation({
    config,
    frameRate,
    initialValue,
    onChange,
    onRest,
  });

  useLayoutEffect(() => {
    onController?.(controller);
    controller.setTarget(targetValue);
  }, [controller, onController, targetValue]);

  return null;
}

function runAnimationFrame(now: number): void {
  const pendingFrames = [...animationFrames.values()];
  animationFrames.clear();
  pendingFrames.forEach(callback => callback(now));
}

function setReducedMotion(matches: boolean): void {
  prefersReducedMotion = matches;
  const event = new Event('change');
  reducedMotionListeners.forEach(listener => {
    if (typeof listener === 'function') {
      listener(event);
    } else {
      listener.handleEvent(event);
    }
  });
}

beforeAll(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => reducedMotionQuery));
});

beforeEach(() => {
  nextAnimationFrameId = 1;
  animationFrames = new Map();
  documentVisibility = 'visible';
  prefersReducedMotion = false;
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => documentVisibility,
  });
  vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    const id = nextAnimationFrameId;
    nextAnimationFrameId += 1;
    animationFrames.set(id, callback);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => {
    animationFrames.delete(id);
  });
});

afterEach(() => {
  cleanup();
  reducedMotionListeners.clear();
  vi.restoreAllMocks();
  delete (document as Document & { visibilityState?: DocumentVisibilityState })
    .visibilityState;
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('useSpringAnimation', () => {
  it('updates at no more than 30fps without rendering the caller per frame', () => {
    const values: number[] = [];
    const rests: number[] = [];
    let controller: SpringAnimationController | null = null;
    let renderCount = 0;
    const onController = (nextController: SpringAnimationController) => {
      controller = nextController;
    };
    const onRender = () => {
      renderCount += 1;
    };

    const view = render(
      <SpringProbe
        onChange={value => values.push(value)}
        onController={onController}
        onRender={onRender}
        onRest={value => rests.push(value)}
        targetValue={0}
      />,
    );

    expect(animationFrames.size).toBe(0);
    expect(values).toEqual([0]);

    view.rerender(
      <SpringProbe
        onChange={value => values.push(value)}
        onController={onController}
        onRender={onRender}
        onRest={value => rests.push(value)}
        targetValue={1}
      />,
    );
    expect(animationFrames.size).toBe(1);
    const valuesBeforeFrames = values.length;

    act(() => {
      runAnimationFrame(16);
      runAnimationFrame(32);
    });
    expect(values).toHaveLength(valuesBeforeFrames);

    act(() => runAnimationFrame(34));
    expect(values).toHaveLength(valuesBeforeFrames + 1);

    act(() => {
      for (let now = 50; animationFrames.size > 0 && now < 10_000; now += 16) {
        runAnimationFrame(now);
      }
    });

    expect(renderCount).toBe(2);
    expect(controller?.getValue()).toBe(1);
    expect(controller?.isAnimating()).toBe(false);
    expect(values.at(-1)).toBe(1);
    expect(rests).toEqual([1]);
  });

  it('clamps dropped frame time to one spring frame interval', () => {
    let delayedController: SpringAnimationController | null = null;
    const delayedView = render(
      <SpringProbe
        onController={controller => {
          delayedController = controller;
        }}
        targetValue={1}
      />,
    );
    act(() => runAnimationFrame(100));
    const delayedValue = delayedController?.getValue();
    delayedView.unmount();

    let singleStepController: SpringAnimationController | null = null;
    render(
      <SpringProbe
        onController={controller => {
          singleStepController = controller;
        }}
        targetValue={1}
      />,
    );
    act(() => runAnimationFrame(34));

    expect(delayedValue).toBeDefined();
    expect(delayedValue).toBeCloseTo(singleStepController!.getValue(), 8);
  });

  it('keeps a stopped spring held across config changes until setTarget', () => {
    let controller: SpringAnimationController | null = null;
    const onController = (nextController: SpringAnimationController) => {
      controller = nextController;
    };
    const view = render(
      <SpringProbe onController={onController} targetValue={1} />,
    );

    act(() => {
      runAnimationFrame(16);
      runAnimationFrame(32);
      runAnimationFrame(34);
    });
    controller?.stop();
    const heldValue = controller?.getValue();
    expect(animationFrames.size).toBe(0);

    view.rerender(
      <SpringProbe
        config={{ ...SPRING_CONFIG, damping: 18 }}
        onController={onController}
        targetValue={1}
      />,
    );
    expect(controller?.getValue()).toBe(heldValue);
    expect(animationFrames.size).toBe(0);

    act(() => controller?.setTarget(1));
    expect(animationFrames.size).toBe(1);
    view.unmount();
    expect(animationFrames.size).toBe(0);
  });

  it('shares visibility observation and pauses every controller while hidden', () => {
    const addEventListener = vi.spyOn(document, 'addEventListener');
    const removeEventListener = vi.spyOn(document, 'removeEventListener');
    const view = render(
      <>
        <SpringProbe targetValue={1} />
        <SpringProbe targetValue={1} />
      </>,
    );

    expect(
      addEventListener.mock.calls.filter(([type]) => type === 'visibilitychange'),
    ).toHaveLength(1);
    expect(animationFrames.size).toBe(2);

    act(() => {
      documentVisibility = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(animationFrames.size).toBe(0);

    act(() => {
      documentVisibility = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(animationFrames.size).toBe(2);

    view.unmount();
    expect(
      removeEventListener.mock.calls.filter(([type]) => type === 'visibilitychange'),
    ).toHaveLength(1);
  });

  it('snaps an active spring when reduced motion becomes preferred', () => {
    const rests: number[] = [];
    let controller: SpringAnimationController | null = null;
    render(
      <SpringProbe
        onController={nextController => {
          controller = nextController;
        }}
        onRest={value => rests.push(value)}
        targetValue={1}
      />,
    );
    expect(animationFrames.size).toBe(1);

    act(() => setReducedMotion(true));

    expect(animationFrames.size).toBe(0);
    expect(controller?.getValue()).toBe(1);
    expect(rests).toEqual([1]);
  });

  it('keeps only one active loop through StrictMode replay', () => {
    const view = render(
      <StrictMode>
        <SpringProbe targetValue={1} />
      </StrictMode>,
    );

    expect(animationFrames.size).toBe(1);
    view.unmount();
    expect(animationFrames.size).toBe(0);
  });

  it('rejects invalid physics values before they can produce NaN frames', () => {
    expect(() => render(
      <SpringProbe
        config={{ ...SPRING_CONFIG, mass: 0 }}
        targetValue={1}
      />,
    )).toThrow('mass must be a positive number');

    expect(() => render(
      <SpringProbe
        config={{ ...SPRING_CONFIG, stiffness: 0 }}
        targetValue={1}
      />,
    )).toThrow('stiffness must be a positive number');

    expect(() => render(
      <SpringProbe
        config={{ ...SPRING_CONFIG, damping: -1 }}
        targetValue={1}
      />,
    )).toThrow('damping must be a nonnegative number');
  });
});
