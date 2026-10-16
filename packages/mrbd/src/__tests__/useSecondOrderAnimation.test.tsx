/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Component,
  StrictMode,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
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
  EquilibriumMode,
  SecondOrderConfigs,
  type SecondOrderConfig,
} from '@wearables-ui-toolkit/foundation/motion/Animations';
import {
  useSecondOrderAnimation,
  type SecondOrderAnimationController,
} from '@wearables-ui-toolkit/foundation/motion/useSecondOrderAnimation';
import {
  SecondOrderConfigs as PublicSecondOrderConfigs,
  useSecondOrderAnimation as usePublicSecondOrderAnimation,
} from '@wearables-ui-toolkit/mrbd';
import { useSpringAnimation } from '@wearables-ui-toolkit/foundation/motion/useSpringAnimation';

const SECOND_ORDER_CONFIG: SecondOrderConfig = {
  frequency: 1,
  damping: 1,
  response: 1,
};

let nextAnimationFrameId = 1;
let animationFrames = new Map<number, FrameRequestCallback>();
let requestedFrames: FrameRequestCallback[] = [];
let isDocumentVisible = true;
let currentTime = 0;
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

class MotionErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidCatch(error: Error): void {
    this.props.onError(error);
  }

  render(): ReactNode {
    return this.state.error == null
      ? this.props.children
      : <div role="alert">{this.state.error.message}</div>;
  }
}

interface SecondOrderProbeProps {
  config?: SecondOrderConfig;
  frameRate?: number;
  initialValue?: number;
  onChange?: (value: number) => void;
  onController?: (controller: SecondOrderAnimationController) => void;
  onRender?: () => void;
  onRest?: (value: number) => void;
  targetValue: number;
}

function SecondOrderProbe({
  config = SECOND_ORDER_CONFIG,
  frameRate,
  initialValue = 0,
  onChange = () => {},
  onController,
  onRender,
  onRest,
  targetValue,
}: SecondOrderProbeProps) {
  onRender?.();
  const controller = useSecondOrderAnimation({
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
  currentTime = now;
  const pendingFrames = [...animationFrames.values()];
  animationFrames.clear();
  pendingFrames.forEach(callback => callback(now));
}

function runOneValueUpdate(startTime: number): void {
  runAnimationFrame(startTime + 16);
  runAnimationFrame(startTime + 32);
  runAnimationFrame(startTime + 34);
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
  requestedFrames = [];
  isDocumentVisible = true;
  currentTime = 0;
  prefersReducedMotion = false;
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
    () => isDocumentVisible ? 'visible' : 'hidden',
  );
  vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    const id = nextAnimationFrameId;
    nextAnimationFrameId += 1;
    animationFrames.set(id, callback);
    requestedFrames.push(callback);
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
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('public default follower motion', () => {
  it('drives changing targets through the package entrypoint and settles once', () => {
    const values: number[] = [];
    const rests: number[] = [];
    const { result } = renderHook(() => usePublicSecondOrderAnimation({
      config: PublicSecondOrderConfigs.DEFAULT,
      initialValue: 0,
      onChange: value => values.push(value),
      onRest: value => rests.push(value),
    }));
    const controller = result.current;
    expect(values).toEqual([0]);
    act(() => controller.setTarget(1));
    expect(animationFrames.size).toBe(1);
    act(() => {
      runAnimationFrame(34);
      runAnimationFrame(68);
    });
    expect(controller.getValue()).toBeGreaterThan(0);
    expect(controller.getValue()).toBeLessThan(1);
    expect(rests).toEqual([]);
    act(() => controller.setTarget(0.75));
    act(() => {
      for (let now = 84; animationFrames.size > 0 && now <= 10_000; now += 16) {
        runAnimationFrame(now);
      }
    });
    expect(values.every(Number.isFinite)).toBe(true);
    expect(values[values.length - 1]).toBe(0.75);
    expect(rests).toEqual([0.75]);
    expect(result.current).toBe(controller);
    expect(controller.isAnimating()).toBe(false);
    expect(animationFrames.size).toBe(0);
  });
});

describe('FAST spring and follower compatibility', () => {
  it('preserves an existing spring value for a target inside its settled tolerance', () => {
    const values: number[] = [];
    const rests: number[] = [];
    const { result } = renderHook(() => useSpringAnimation({
      config: {stiffness: 10, damping: 10, mass: 1, equilibriumMode: EquilibriumMode.FAST},
      frameRate: 10,
      initialValue: 0,
      onChange: value => values.push(value),
      onRest: value => rests.push(value),
    }));
    act(() => result.current.setTarget(0.015));
    expect(result.current.getValue()).toBe(0);
    expect(result.current.isAnimating()).toBe(false);
    expect(animationFrames.size).toBe(0);
    act(() => runAnimationFrame(100));
    expect(values).toEqual([0]);
    expect(rests).toEqual([]);
  });

  it('animates a follower target inside the existing spring tolerance and completes once', () => {
    const values: number[] = [];
    const rests: number[] = [];
    const { result } = renderHook(() => usePublicSecondOrderAnimation({
      config: {...SECOND_ORDER_CONFIG, equilibriumMode: EquilibriumMode.FAST},
      frameRate: 10,
      initialValue: 0,
      onChange: value => values.push(value),
      onRest: value => rests.push(value),
    }));
    expect(values).toEqual([0]);
    act(() => result.current.setTarget(0.015));
    expect(result.current.isAnimating()).toBe(true);
    expect(animationFrames.size).toBe(1);
    expect(rests).toEqual([]);
    act(() => {
      runAnimationFrame(100);
      runAnimationFrame(200);
    });
    expect(result.current.getValue()).toBeGreaterThan(0);
    expect(result.current.getValue()).toBeLessThan(0.015);
    expect(rests).toEqual([]);
    act(() => {
      for (let now = 300; animationFrames.size > 0 && now <= 5000; now += 100) {
        runAnimationFrame(now);
      }
    });
    expect(values.every(Number.isFinite)).toBe(true);
    expect(values[values.length - 1]).toBe(0.015);
    expect(rests).toEqual([0.015]);
    expect(result.current.getValue()).toBe(0.015);
    expect(result.current.isAnimating()).toBe(false);
    expect(animationFrames.size).toBe(0);
  });
});

describe('useSecondOrderAnimation', () => {
  it('settles on the latest target without rendering the caller per frame', () => {
    const values: number[] = [];
    const rests: number[] = [];
    let controller!: SecondOrderAnimationController;
    let renderCount = 0;
    const onController = (nextController: SecondOrderAnimationController) => {
      controller = nextController;
    };
    const onRender = () => {
      renderCount += 1;
    };

    const view = render(
      <SecondOrderProbe
        onChange={value => values.push(value)}
        onController={onController}
        onRender={onRender}
        onRest={value => rests.push(value)}
        targetValue={0}
      />,
    );

    expect(values).toEqual([0]);
    expect(animationFrames.size).toBe(0);

    view.rerender(
      <SecondOrderProbe
        onChange={value => values.push(value)}
        onController={onController}
        onRender={onRender}
        onRest={value => rests.push(value)}
        targetValue={1}
      />,
    );
    expect(animationFrames.size).toBe(1);

    act(() => {
      for (let now = 16; animationFrames.size > 0 && now < 10_000; now += 16) {
        runAnimationFrame(now);
      }
    });

    expect(renderCount).toBe(2);
    expect(controller.getValue()).toBe(1);
    expect(controller.isAnimating()).toBe(false);
    expect(values.at(-1)).toBe(1);
    expect(rests).toEqual([1]);
  });

  it('uses target velocity to shape a retargeted value', () => {
    let anticipationController!: SecondOrderAnimationController;
    let normalController!: SecondOrderAnimationController;
    const view = render(
      <>
        <SecondOrderProbe
          config={SecondOrderConfigs.ANTICIPATION}
          onController={controller => {
            anticipationController = controller;
          }}
          targetValue={1}
        />
        <SecondOrderProbe
          config={SecondOrderConfigs.DEFAULT}
          onController={controller => {
            normalController = controller;
          }}
          targetValue={1}
        />
      </>,
    );

    act(() => {
      runOneValueUpdate(0);
      runOneValueUpdate(34);
    });

    view.rerender(
      <>
        <SecondOrderProbe
          config={SecondOrderConfigs.ANTICIPATION}
          onController={controller => {
            anticipationController = controller;
          }}
          targetValue={2}
        />
        <SecondOrderProbe
          config={SecondOrderConfigs.DEFAULT}
          onController={controller => {
            normalController = controller;
          }}
          targetValue={2}
        />
      </>,
    );

    act(() => {
      runOneValueUpdate(68);
      runOneValueUpdate(102);
    });

    expect(anticipationController.getValue()).toBeLessThan(
      normalController.getValue(),
    );
  });

  it('keeps a stopped value held through config changes until retargeted', () => {
    let controller!: SecondOrderAnimationController;
    const onController = (nextController: SecondOrderAnimationController) => {
      controller = nextController;
    };
    const view = render(
      <SecondOrderProbe onController={onController} targetValue={1} />,
    );

    act(() => runOneValueUpdate(0));
    controller.stop();
    const heldValue = controller.getValue();

    view.rerender(
      <SecondOrderProbe
        config={{ ...SECOND_ORDER_CONFIG, damping: 0.8 }}
        onController={onController}
        targetValue={1}
      />,
    );

    expect(controller.getValue()).toBe(heldValue);
    expect(animationFrames.size).toBe(0);

    act(() => controller.setTarget(1));
    expect(animationFrames.size).toBe(1);
  });

  it('snaps active motion when reduced motion becomes preferred', () => {
    const rests: number[] = [];
    let controller!: SecondOrderAnimationController;
    render(
      <SecondOrderProbe
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
    expect(controller.getValue()).toBe(1);
    expect(rests).toEqual([1]);
  });

  it('rejects invalid dynamics before they can produce non-finite frames', () => {
    expect(() => render(
      <SecondOrderProbe
        config={{ ...SECOND_ORDER_CONFIG, frequency: 0 }}
        targetValue={1}
      />,
    )).toThrow('frequency must be a positive number');

    expect(() => render(
      <SecondOrderProbe
        config={{ ...SECOND_ORDER_CONFIG, damping: -1 }}
        targetValue={1}
      />,
    )).toThrow('damping must be a nonnegative number');

    expect(() => render(
      <SecondOrderProbe
        config={{ ...SECOND_ORDER_CONFIG, response: Number.NaN }}
        targetValue={1}
      />,
    )).toThrow('response must be a finite number');
  });
});

function finishFrames(startTime = 0, limitMs = 20_000): void {
  for (
    let now = startTime + 16;
    animationFrames.size > 0 && now < startTime + limitMs;
    now += 16
  ) {
    runAnimationFrame(now);
  }
}

function setDocumentVisible(visible: boolean): void {
  isDocumentVisible = visible;
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('second-order numeric boundaries', () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects a non-finite initial value before callbacks or scheduling: %s',
    initialValue => {
      const onChange = vi.fn();
      expect(() => render(
        <SecondOrderProbe
          initialValue={initialValue}
          onChange={onChange}
          targetValue={1}
        />,
      )).toThrow('initialValue must be a finite number');
      expect(onChange).not.toHaveBeenCalled();
      expect(animationFrames.size).toBe(0);
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects a non-finite target without cancelling the accepted motion: %s',
    target => {
      let controller!: SecondOrderAnimationController;
      const onRest = vi.fn();
      render(
        <SecondOrderProbe
          onController={value => { controller = value; }}
          onRest={onRest}
          targetValue={1}
        />,
      );
      const pending = [...animationFrames.keys()];
      expect(() => controller.setTarget(target)).toThrow(
        'targetValue must be a finite number',
      );
      expect([...animationFrames.keys()]).toEqual(pending);
      act(() => finishFrames());
      expect(controller.getValue()).toBe(1);
      expect(onRest).toHaveBeenCalledExactlyOnceWith(1);
    },
  );

  it('uses the first frame timestamp when the initial clock is unavailable', () => {
    vi.spyOn(performance, 'now').mockReturnValue(Number.NaN);
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    render(
      <SecondOrderProbe
        onChange={value => values.push(value)}
        onController={value => { controller = value; }}
        targetValue={1}
      />,
    );
    act(() => {
      runAnimationFrame(100);
      runAnimationFrame(134);
      finishFrames(134);
    });
    expect(controller.getValue()).toBe(1);
    expect(values.every(Number.isFinite)).toBe(true);
    expect(animationFrames.size).toBe(0);
  });

  it.each([1e200, 1e-200, Number.MAX_VALUE])(
    'rejects a frequency whose derived arithmetic is unrepresentable: %s',
    frequency => {
      expect(() => render(
        <SecondOrderProbe
          config={{ ...SECOND_ORDER_CONFIG, frequency }}
          targetValue={1}
        />,
      )).toThrow('dynamics must remain finite and representable');
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    },
  );

  it.each([Number.MIN_VALUE, 1e-200, Number.MAX_VALUE])(
    'rejects an unrepresentable frame interval or timestep: %s',
    frameRate => {
      expect(() => render(
        <SecondOrderProbe frameRate={frameRate} targetValue={1} />,
      )).toThrow(/frameRate/);
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    },
  );

  it('rejects an overflowing response intermediate before emitting values', () => {
    const onChange = vi.fn();
    expect(() => render(
      <SecondOrderProbe
        config={{ frequency: 1, damping: 2, response: Number.MAX_VALUE }}
        onChange={onChange}
        targetValue={1}
      />,
    )).toThrow('dynamics must remain finite and representable');
    expect(onChange).not.toHaveBeenCalled();
    expect(animationFrames.size).toBe(0);
  });

  it('rejects finite coefficients with an unstable discrete timestep', () => {
    expect(() => render(
      <SecondOrderProbe frameRate={1} targetValue={1} />,
    )).toThrow('dynamics require a stable timestep');
    expect(animationFrames.size).toBe(0);
  });

  it('brackets the damped stability boundary and accepts the normal control', () => {
    const k1 = 1 / Math.PI;
    const k2 = 1 / (4 * Math.PI * Math.PI);
    const boundaryStep = Math.sqrt(k1 * k1 + 4 * k2) - k1;
    const boundaryRate = 1 / boundaryStep;
    expect(() => render(
      <SecondOrderProbe frameRate={boundaryRate * 0.999} targetValue={1} />,
    )).toThrow('stable timestep');

    let controller!: SecondOrderAnimationController;
    render(
      <SecondOrderProbe
        frameRate={boundaryRate * 1.001}
        onController={value => { controller = value; }}
        targetValue={0}
      />,
    );
    expect(controller.getValue()).toBe(0);
    expect(controller.isAnimating()).toBe(false);

    render(<SecondOrderProbe frameRate={30} targetValue={1} />);
    expect(animationFrames.size).toBe(1);
  });

  it('bounds undamped motion without claiming that it reaches rest', () => {
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    const onRest = vi.fn();
    render(
      <SecondOrderProbe
        config={{ frequency: 1, damping: 0, response: 1 }}
        onChange={value => values.push(value)}
        onController={value => { controller = value; }}
        onRest={onRest}
        targetValue={1}
      />,
    );
    act(() => {
      for (let now = 16; now < 2_000; now += 16) {
        runAnimationFrame(now);
      }
    });
    expect(values.every(Number.isFinite)).toBe(true);
    expect(controller.isAnimating()).toBe(true);
    expect(onRest).not.toHaveBeenCalled();
    act(() => controller.stop());
    expect(animationFrames.size).toBe(0);
  });

  it('rejects the undamped boundary rather than admitting marginal growth', () => {
    expect(() => render(
      <SecondOrderProbe
        config={{ frequency: 1, damping: 0, response: 1 }}
        frameRate={Math.PI * 0.999}
        targetValue={1}
      />,
    )).toThrow('stable timestep');
  });

  it('animates an arbitrary finite domain without normalizing its values', () => {
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    const rests: number[] = [];
    render(
      <SecondOrderProbe
        config={{ ...SECOND_ORDER_CONFIG, equilibriumMode: 'fast' }}
        initialValue={-1200}
        onChange={value => values.push(value)}
        onController={value => { controller = value; }}
        onRest={value => rests.push(value)}
        targetValue={350}
      />,
    );
    expect(values[0]).toBe(-1200);
    act(() => finishFrames());
    expect(controller.getValue()).toBe(350);
    expect(values.every(Number.isFinite)).toBe(true);
    expect(rests).toEqual([350]);
    expect(animationFrames.size).toBe(0);
  });

  it('uses zero target velocity for the first accepted target sample', () => {
    let first!: SecondOrderAnimationController;
    let second!: SecondOrderAnimationController;
    render(
      <>
        <SecondOrderProbe
          config={{ ...SECOND_ORDER_CONFIG, response: 0 }}
          onController={value => { first = value; }}
          targetValue={1}
        />
        <SecondOrderProbe
          config={{ ...SECOND_ORDER_CONFIG, response: 2 }}
          onController={value => { second = value; }}
          targetValue={1}
        />
      </>,
    );
    act(() => runOneValueUpdate(0));
    expect(first.getValue()).toBe(0);
    expect(second.getValue()).toBe(0);
    act(() => runOneValueUpdate(34));
    const expectedPosition = 4 * Math.PI * Math.PI / (30 * 30);
    expect(first.getValue()).toBeCloseTo(expectedPosition, 10);
    expect(second.getValue()).toBeCloseTo(expectedPosition, 10);
  });

  it.each([
    {frameRate: 50, firstTime: 20, delayedTime: 1020, followingTime: 1040},
    {frameRate: 50, firstTime: 25, delayedTime: 50, followingTime: 60},
    {frameRate: 1e6, firstTime: 0.00125, delayedTime: 0.0025, followingTime: 0.003},
  ])(
    'samples target velocity over elapsed active time at $delayedTime ms',
    ({frameRate, firstTime, delayedTime, followingTime}) => {
      let controller!: SecondOrderAnimationController;
      const values: number[] = [];
      render(
        <SecondOrderProbe
          frameRate={frameRate}
          onChange={value => values.push(value)}
          onController={value => { controller = value; }}
          targetValue={1}
        />,
      );
      act(() => runAnimationFrame(firstTime));
      expect(values).toEqual([0, 0]);
      act(() => controller.setTarget(2));
      act(() => runAnimationFrame(delayedTime));

      const step = 1 / frameRate;
      const k1 = 1 / Math.PI;
      const k2 = 1 / (4 * Math.PI * Math.PI);
      const k3 = 1 / (2 * Math.PI);
      const firstVelocity = step / k2;
      const secondPosition = step * firstVelocity;
      const sampleSeconds = (delayedTime - firstTime) / 1000;
      const secondVelocity = firstVelocity + step * (
        2 + k3 / sampleSeconds - secondPosition - k1 * firstVelocity
      ) / k2;
      expect(values).toHaveLength(3);
      expect(controller.getValue()).toBeCloseTo(secondPosition, 10);

      act(() => runAnimationFrame(followingTime));
      expect(values).toHaveLength(4);
      expect(controller.getValue()).toBeCloseTo(
        secondPosition + step * secondVelocity,
        10,
      );
      expect(values.every(Number.isFinite)).toBe(true);
    },
  );

  it('rejects an unrepresentable next-sample velocity before target mutation', () => {
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    render(
      <SecondOrderProbe
        frameRate={50}
        onChange={value => values.push(value)}
        onController={value => { controller = value; }}
        targetValue={1}
      />,
    );
    act(() => runAnimationFrame(25));
    act(() => controller.setTarget(2));
    act(() => runAnimationFrame(50));
    const held = controller.getValue();
    const pending = [...animationFrames.keys()];
    expect(() => controller.setTarget(2e306)).toThrow(
      'targetValue must keep frame arithmetic finite',
    );
    expect(controller.getValue()).toBe(held);
    expect([...animationFrames.keys()]).toEqual(pending);
    act(() => runAnimationFrame(60));
    expect(controller.isAnimating()).toBe(true);
    expect(values).toHaveLength(4);
    expect(values.every(Number.isFinite)).toBe(true);
    act(() => finishFrames(60));
    expect(controller.getValue()).toBe(2);
  });

  it('reads the initial value once for the stable controller', () => {
    let controller!: SecondOrderAnimationController;
    const onController = (value: SecondOrderAnimationController) => {
      controller = value;
    };
    const values: number[] = [];
    const onChange = (value: number) => values.push(value);
    const view = render(
      <SecondOrderProbe
        initialValue={37}
        onChange={onChange}
        onController={onController}
        targetValue={37}
      />,
    );
    const originalController = controller;
    view.rerender(
      <SecondOrderProbe
        initialValue={99}
        onChange={onChange}
        onController={onController}
        targetValue={37}
      />,
    );
    expect(controller).toBe(originalController);
    expect(controller.getValue()).toBe(37);
    expect(values).toEqual([37]);
    expect(animationFrames.size).toBe(0);
  });

  it('rejects a non-representable target span without changing the held state', () => {
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    render(
      <SecondOrderProbe
        initialValue={Number.MAX_VALUE}
        onChange={value => values.push(value)}
        onController={value => { controller = value; }}
        targetValue={Number.MAX_VALUE}
      />,
    );
    expect(() => controller.setTarget(-Number.MAX_VALUE)).toThrow(
      'targetValue must keep frame arithmetic finite',
    );
    expect(controller.getValue()).toBe(Number.MAX_VALUE);
    expect(values).toEqual([Number.MAX_VALUE]);
    expect(animationFrames.size).toBe(0);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'holds the last finite state on an invalid frame timestamp: %s',
    now => {
      let controller!: SecondOrderAnimationController;
      const values: number[] = [];
      const onRest = vi.fn();
      render(
        <SecondOrderProbe
          onChange={value => values.push(value)}
          onController={value => { controller = value; }}
          onRest={onRest}
          targetValue={1}
        />,
      );
      act(() => runAnimationFrame(now));
      expect(controller.getValue()).toBe(0);
      expect(values).toEqual([0]);
      expect(onRest).not.toHaveBeenCalled();
      expect(animationFrames.size).toBe(0);
      act(() => {
        controller.setTarget(2);
        finishFrames();
      });
      expect(controller.getValue()).toBe(2);
      expect(values.every(Number.isFinite)).toBe(true);
      expect(onRest).toHaveBeenCalledExactlyOnceWith(2);
    },
  );

  it('stops an overflowing integration transaction without emitting NaN or rest', () => {
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    const onRest = vi.fn();
    render(
      <SecondOrderProbe
        onChange={value => values.push(value)}
        onController={value => { controller = value; }}
        onRest={onRest}
        targetValue={Number.MAX_VALUE}
      />,
    );
    act(() => runOneValueUpdate(0));
    expect(controller.getValue()).toBe(0);
    expect(controller.isAnimating()).toBe(false);
    expect(values).toEqual([0]);
    expect(onRest).not.toHaveBeenCalled();
  });
});

describe('second-order sampling epochs', () => {
  it.each([
    'stop',
    'completion',
    'reduced motion',
    'visibility pause',
    'changed configuration',
    'unchanged configuration',
  ])('uses the appropriate target history after %s', transition => {
    const k1 = 1 / Math.PI;
    const k2 = 1 / (4 * Math.PI * Math.PI);
    const step = 1 / 50;
    const firstVelocity = step / k2;
    let position = step * firstVelocity;
    let velocity = firstVelocity + step * (
      1 - position - k1 * firstVelocity
    ) / k2;
    let nextStep = step;
    let response = 1;
    const values: number[] = [];
    const view = renderHook<
      SecondOrderAnimationController,
      { response: number | undefined; frameRate: number }
    >(
      (options: { response: number | undefined; frameRate: number }) =>
        usePublicSecondOrderAnimation({
          config: { ...SECOND_ORDER_CONFIG, response: options.response },
          frameRate: options.frameRate,
          initialValue: 0,
          onChange: value => values.push(value),
        }),
      { initialProps: { response: 1, frameRate: 50 } },
    );
    const controller = view.result.current;
    act(() => {
      controller.setTarget(1);
      runAnimationFrame(20);
      runAnimationFrame(40);
    });
    expect(controller.getValue()).toBeCloseTo(position, 12);

    if (transition === 'stop') {
      act(() => controller.stop());
      velocity = 0;
    } else if (transition === 'completion') {
      act(() => finishFrames(currentTime));
      expect(controller.getValue()).toBe(1);
      expect(controller.isAnimating()).toBe(false);
      position = 1;
      velocity = 0;
    } else if (transition === 'reduced motion') {
      act(() => setReducedMotion(true));
      expect(controller.getValue()).toBe(1);
      act(() => setReducedMotion(false));
      position = 1;
      velocity = 0;
    } else if (transition === 'visibility pause') {
      act(() => {
        setDocumentVisible(false);
        currentTime += 10_000;
        controller.setTarget(2);
      });
      expect(animationFrames.size).toBe(0);
      act(() => setDocumentVisible(true));
    } else if (transition === 'changed configuration') {
      view.rerender({ response: 2, frameRate: 100 });
      response = 2;
      nextStep = 1 / 100;
    } else {
      view.rerender({ response: undefined, frameRate: 50 });
    }
    expect(view.result.current).toBe(controller);
    expect(controller.getValue()).toBeCloseTo(position, 12);
    act(() => controller.setTarget(2));
    const startTime = currentTime;
    const firstPosition = position + nextStep * velocity;
    const preservesTargetHistory =
      transition === 'visibility pause' ||
      transition === 'changed configuration' ||
      transition === 'unchanged configuration';
    const targetVelocity = preservesTargetHistory ? 1 / nextStep : 0;
    const nextVelocity = velocity + nextStep * (
      2 + response / (2 * Math.PI) * targetVelocity - firstPosition - k1 * velocity
    ) / k2;
    act(() => runAnimationFrame(startTime + nextStep * 1000));
    expect(controller.getValue()).toBeCloseTo(firstPosition, 12);
    act(() => runAnimationFrame(startTime + nextStep * 2000));
    expect(controller.getValue()).toBeCloseTo(
      firstPosition + nextStep * nextVelocity,
      12,
    );
    expect(values.every(Number.isFinite)).toBe(true);
    expect(controller.isAnimating()).toBe(true);
  });

  it('does not estimate a discarded target span when restarting after stop', () => {
    const values: number[] = [];
    const { result } = renderHook(() => usePublicSecondOrderAnimation({
      config: SECOND_ORDER_CONFIG,
      frameRate: 50,
      initialValue: 0,
      onChange: value => values.push(value),
    }));
    const controller = result.current;
    act(() => {
      controller.setTarget(1e308);
      runAnimationFrame(20);
      controller.stop();
    });
    expect(controller.getValue()).toBe(0);
    expect(animationFrames.size).toBe(0);
    act(() => controller.setTarget(-1e308));
    act(() => {
      runAnimationFrame(40);
      runAnimationFrame(60);
    });
    const expectedPosition = -1e308 * (1 / 50) ** 2 * 4 * Math.PI * Math.PI;
    expect(controller.getValue() / expectedPosition).toBeCloseTo(1, 12);
    expect(values.every(Number.isFinite)).toBe(true);
    expect(controller.isAnimating()).toBe(true);
  });
});

describe('second-order configuration error boundaries', () => {
  it.each([
    {
      config: { ...SECOND_ORDER_CONFIG, frequency: 10 },
      message: 'dynamics require a stable timestep',
    },
    {
      config: { ...SECOND_ORDER_CONFIG, frequency: 1e200 },
      message: 'dynamics must remain finite and representable',
    },
  ].flatMap(testCase => [false, true].map(strictMode => ({
    ...testCase,
    strictMode,
  }))))(
    'rejects initial $message before publishing a controller (StrictMode=$strictMode)',
    ({ config, message, strictMode }) => {
      const onChange = vi.fn();
      const onRest = vi.fn();
      const caughtErrors: Error[] = [];
      const rootErrors: unknown[] = [];
      const publishedControllers: SecondOrderAnimationController[] = [];
      function InvalidInitialConsumer() {
        const controller = usePublicSecondOrderAnimation({
          config,
          frameRate: 30,
          initialValue: 7,
          onChange,
          onRest,
        });
        useLayoutEffect(() => {
          publishedControllers.push(controller);
          controller.setTarget(8);
        }, [controller]);
        return null;
      }
      const boundary = (
        <MotionErrorBoundary onError={error => caughtErrors.push(error)}>
          <InvalidInitialConsumer />
        </MotionErrorBoundary>
      );
      const view = render(strictMode ? <StrictMode>{boundary}</StrictMode> : boundary, {
        onCaughtError: error => rootErrors.push(error),
      });
      expect(caughtErrors).toHaveLength(1);
      expect(caughtErrors[0].message).toContain(message);
      expect(rootErrors).toEqual([caughtErrors[0]]);
      expect(screen.getByRole('alert').textContent).toBe(caughtErrors[0].message);
      expect(publishedControllers).toEqual([]);
      expect(onChange).not.toHaveBeenCalled();
      expect(onRest).not.toHaveBeenCalled();
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
      expect(animationFrames.size).toBe(0);
      view.unmount();
    },
  );

  it.each([
    {
      failure: 'unstable dynamics',
      config: { ...SECOND_ORDER_CONFIG, frequency: 10 },
      frameRate: 30,
      target: 1,
      message: 'dynamics require a stable timestep',
      rejectionPhase: 'render',
    },
    {
      failure: 'unrepresentable coefficients',
      config: { ...SECOND_ORDER_CONFIG, frequency: 1e200 },
      frameRate: 30,
      target: 1,
      message: 'dynamics must remain finite and representable',
      rejectionPhase: 'render',
    },
    {
      failure: 'target sampling overflow',
      config: SECOND_ORDER_CONFIG,
      frameRate: 1e6,
      target: 1e305,
      message: 'config must keep frame arithmetic finite',
      rejectionPhase: 'commit',
    },
  ].flatMap(testCase => [false, true].map(strictMode => ({
    ...testCase,
    strictMode,
  }))))(
    'disposes rejected $failure motion under an error boundary (StrictMode=$strictMode)',
    ({ config, frameRate, target, message, strictMode, rejectionPhase }) => {
      const visibilityListeners = new Set<EventListenerOrEventListenerObject>();
      const originalAdd = document.addEventListener.bind(document);
      const originalRemove = document.removeEventListener.bind(document);
      vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, listener, options) => {
          if (type === 'visibilitychange') visibilityListeners.add(listener);
          originalAdd(type, listener, options);
        },
      );
      vi.spyOn(document, 'removeEventListener').mockImplementation(
        (type, listener, options) => {
          if (type === 'visibilitychange') visibilityListeners.delete(listener);
          originalRemove(type, listener, options);
        },
      );
      const originalVisibilityListeners = new Set(visibilityListeners);
      const originalReducedMotionListeners = new Set(reducedMotionListeners);
      const survivorRest = vi.fn();
      const survivor = renderHook(() => usePublicSecondOrderAnimation({
        config: SECOND_ORDER_CONFIG,
        initialValue: 0,
        onChange: () => {},
        onRest: survivorRest,
      }));
      const sharedVisibilityListeners = new Set(visibilityListeners);
      const sharedReducedMotionListeners = new Set(reducedMotionListeners);
      expect(sharedVisibilityListeners.size).toBeGreaterThan(
        originalVisibilityListeners.size,
      );
      expect(sharedReducedMotionListeners.size).toBeGreaterThan(
        originalReducedMotionListeners.size,
      );

      const caughtErrors: Error[] = [];
      const rootErrors: unknown[] = [];
      const onChange = vi.fn();
      const onRest = vi.fn();
      const completedRenders: Array<{
        config: SecondOrderConfig;
        frameRate: number;
      }> = [];
      const rejectedCommitStates: Array<{
        animating: boolean;
        before: number;
        after: number;
        changes: number;
        rests: number;
      }> = [];
      function CommitObserver({ onCommit }: { onCommit?: () => void }) {
        useLayoutEffect(() => {
          onCommit?.();
        }, [onCommit]);
        return null;
      }
      let publishedController!: SecondOrderAnimationController;
      function RejectionConsumer(options: {
        config: SecondOrderConfig;
        frameRate: number;
      }) {
        const motion = usePublicSecondOrderAnimation({
          ...options,
          initialValue: 0,
          onChange,
          onRest,
        });
        completedRenders.push(options);
        useLayoutEffect(() => {
          publishedController = motion;
        }, [motion]);
        return null;
      }
      function RejectionTree({
        config,
        frameRate,
        boundaryKey = 0,
        onCommit,
      }: {
        config: SecondOrderConfig;
        frameRate: number;
        boundaryKey?: number;
        onCommit?: () => void;
      }) {
        const boundary = (
          <>
            <MotionErrorBoundary
              key={boundaryKey}
              onError={error => caughtErrors.push(error)}
            >
              <RejectionConsumer config={config} frameRate={frameRate} />
            </MotionErrorBoundary>
            <CommitObserver onCommit={onCommit} />
          </>
        );
        return strictMode ? <StrictMode>{boundary}</StrictMode> : boundary;
      }
      const view = render(
        <RejectionTree config={SECOND_ORDER_CONFIG} frameRate={30} />,
        { onCaughtError: error => rootErrors.push(error) },
      );
      const controller = publishedController;
      act(() => {
        controller.setTarget(1);
        runAnimationFrame(34);
        runAnimationFrame(68);
        controller.setTarget(target);
      });
      const heldValue = controller.getValue();
      expect(heldValue).toBeGreaterThan(0);
      expect(heldValue).toBeLessThan(1);
      expect(animationFrames.size).toBe(1);
      const [frameId, staleFrame] = [...animationFrames.entries()][0];
      const changesBeforeError = [...onChange.mock.calls];
      const restsBeforeError = [...onRest.mock.calls];
      const rendersBeforeError = completedRenders.length;
      const observeRejectedCommit = () => {
        const animating = controller.isAnimating();
        const before = controller.getValue();
        controller.setTarget(2);
        staleFrame(10_000);
        rejectedCommitStates.push({
          animating,
          before,
          after: controller.getValue(),
          changes: onChange.mock.calls.length,
          rests: onRest.mock.calls.length,
        });
      };

      view.rerender(
        <RejectionTree
          config={config}
          frameRate={frameRate}
          onCommit={observeRejectedCommit}
        />,
      );

      if (rejectionPhase === 'render') {
        expect(completedRenders).toHaveLength(rendersBeforeError);
      } else {
        expect(completedRenders.length).toBeGreaterThan(rendersBeforeError);
      }
      expect(rejectedCommitStates.length).toBeGreaterThan(0);
      expect(rejectedCommitStates).toEqual(
        rejectedCommitStates.map(() => ({
          animating: false,
          before: heldValue,
          after: heldValue,
          changes: changesBeforeError.length,
          rests: restsBeforeError.length,
        })),
      );
      expect(caughtErrors).toHaveLength(1);
      expect(caughtErrors[0]).toBeInstanceOf(Error);
      expect(caughtErrors[0].message).toContain(message);
      expect(rootErrors).toHaveLength(1);
      expect(rootErrors[0]).toBe(caughtErrors[0]);
      expect(screen.getByRole('alert').textContent).toBe(caughtErrors[0].message);
      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(frameId);
      expect(controller.isAnimating()).toBe(false);
      expect(controller.getValue()).toBe(heldValue);
      expect(animationFrames.size).toBe(0);
      expect(visibilityListeners).toEqual(sharedVisibilityListeners);
      expect(reducedMotionListeners).toEqual(sharedReducedMotionListeners);

      act(() => {
        staleFrame(10_000);
        controller.setTarget(2);
        controller.stop();
      });
      expect(controller.getValue()).toBe(heldValue);
      expect(onChange.mock.calls).toEqual(changesBeforeError);
      expect(onRest.mock.calls).toEqual(restsBeforeError);
      expect(animationFrames.size).toBe(0);

      act(() => {
        survivor.result.current.setTarget(0.5);
        runAnimationFrame(102);
        runAnimationFrame(136);
      });
      expect(survivor.result.current.getValue()).toBeGreaterThan(0);
      expect(survivor.result.current.getValue()).toBeLessThan(0.5);
      act(() => setDocumentVisible(false));
      expect(animationFrames.size).toBe(0);
      act(() => setDocumentVisible(true));
      expect(animationFrames.size).toBe(1);
      act(() => setReducedMotion(true));
      expect(survivor.result.current.getValue()).toBe(0.5);
      expect(survivorRest).toHaveBeenCalledExactlyOnceWith(0.5);
      expect(onChange.mock.calls).toEqual(changesBeforeError);
      expect(onRest.mock.calls).toEqual(restsBeforeError);
      expect(animationFrames.size).toBe(0);
      act(() => setReducedMotion(false));
      view.rerender(
        <RejectionTree
          config={SECOND_ORDER_CONFIG}
          frameRate={30}
          boundaryKey={1}
        />,
      );
      const recoveredController = publishedController;
      expect(recoveredController).not.toBe(controller);
      expect(recoveredController.getValue()).toBe(0);
      const recoveryChanges = [...onChange.mock.calls];
      act(() => recoveredController.setTarget(0.75));
      const recoveredFrames = [...animationFrames.keys()];
      act(() => {
        staleFrame(20_000);
        controller.setTarget(3);
        controller.stop();
      });
      expect(controller.getValue()).toBe(heldValue);
      expect([...animationFrames.keys()]).toEqual(recoveredFrames);
      expect(onChange.mock.calls).toEqual(recoveryChanges);
      act(() => {
        runAnimationFrame(170);
        runAnimationFrame(204);
      });
      expect(recoveredController.getValue()).toBeGreaterThan(0);
      expect(recoveredController.getValue()).toBeLessThan(0.75);
      act(() => finishFrames(204));
      expect(recoveredController.getValue()).toBe(0.75);
      expect(onRest).toHaveBeenCalledExactlyOnceWith(0.75);
      expect(animationFrames.size).toBe(0);
      view.unmount();
      survivor.unmount();
      expect(visibilityListeners).toEqual(originalVisibilityListeners);
      expect(reducedMotionListeners).toEqual(originalReducedMotionListeners);
    },
  );
});

describe('second-order callback and lifetime transactions', () => {
  it('does not announce rest for a target replaced during a normal snap', () => {
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    const rests: number[] = [];
    render(
      <SecondOrderProbe
        onChange={value => {
          values.push(value);
          if (value === 0.005) controller.setTarget(2);
        }}
        onController={value => { controller = value; }}
        onRest={value => rests.push(value)}
        targetValue={0}
      />,
    );
    act(() => controller.setTarget(0.005));
    expect(controller.getValue()).toBe(0.005);
    expect(rests).toEqual([]);
    expect(animationFrames.size).toBe(1);
    act(() => finishFrames());
    expect(controller.getValue()).toBe(2);
    expect(values.at(-1)).toBe(2);
    expect(rests).toEqual([2]);
  });

  it('reports only the reached target after a nested reduced-motion snap', () => {
    prefersReducedMotion = true;
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    const rests: number[] = [];
    render(
      <SecondOrderProbe
        onChange={value => {
          values.push(value);
          if (value === 1) controller.setTarget(2);
        }}
        onController={value => { controller = value; }}
        onRest={value => rests.push(value)}
        targetValue={0}
      />,
    );
    act(() => controller.setTarget(1));
    expect(controller.getValue()).toBe(2);
    expect(values).toEqual([0, 1, 2]);
    expect(rests).toEqual([2]);
    expect(animationFrames.size).toBe(0);
  });

  it('honors stop from a snap callback without reporting completion', () => {
    let controller!: SecondOrderAnimationController;
    const onRest = vi.fn();
    render(
      <SecondOrderProbe
        onChange={value => {
          if (value === 0.005) controller.stop();
        }}
        onController={value => { controller = value; }}
        onRest={onRest}
        targetValue={0}
      />,
    );
    act(() => controller.setTarget(0.005));
    expect(controller.getValue()).toBe(0.005);
    expect(controller.isAnimating()).toBe(false);
    expect(onRest).not.toHaveBeenCalled();
  });

  it('honors unmount from a snap callback and ignores later controller requests', () => {
    let controller!: SecondOrderAnimationController;
    const onRest = vi.fn();
    const view = render(
      <SecondOrderProbe
        onChange={value => {
          if (value === 0.005) cleanup();
        }}
        onController={value => { controller = value; }}
        onRest={onRest}
        targetValue={0}
      />,
    );
    act(() => controller.setTarget(0.005));
    expect(onRest).not.toHaveBeenCalled();
    expect(animationFrames.size).toBe(0);
    act(() => controller.setTarget(2));
    expect(controller.getValue()).toBe(0.005);
    expect(animationFrames.size).toBe(0);
    view.unmount();
  });

  it('honors stop from a frame callback instead of rescheduling the old intent', () => {
    let controller!: SecondOrderAnimationController;
    let stopped = false;
    const values: number[] = [];
    const onRest = vi.fn();
    render(
      <SecondOrderProbe
        onChange={value => {
          values.push(value);
          if (value > 0 && !stopped) {
            stopped = true;
            controller.stop();
          }
        }}
        onController={value => { controller = value; }}
        onRest={onRest}
        targetValue={1}
      />,
    );
    act(() => {
      runOneValueUpdate(0);
      runOneValueUpdate(34);
    });
    const held = controller.getValue();
    expect(held).toBeGreaterThan(0);
    expect(held).toBeLessThan(1);
    expect(animationFrames.size).toBe(0);
    expect(onRest).not.toHaveBeenCalled();
    act(() => runAnimationFrame(10_000));
    expect(controller.getValue()).toBe(held);
    expect(values.at(-1)).toBe(held);
  });

  it('preserves a new animation started by onRest', () => {
    let controller!: SecondOrderAnimationController;
    const rests: number[] = [];
    const positions: number[] = [];
    render(
      <SecondOrderProbe
        onController={value => { controller = value; }}
        onRest={value => {
          rests.push(value);
          positions.push(controller.getValue());
          if (value === 1) controller.setTarget(2);
        }}
        targetValue={1}
      />,
    );
    act(() => finishFrames());
    expect(rests).toEqual([1, 2]);
    expect(positions).toEqual(rests);
    expect(controller.getValue()).toBe(2);
    expect(animationFrames.size).toBe(0);
  });

  it('does not duplicate rest when onChange accepts the same target', () => {
    let controller!: SecondOrderAnimationController;
    const rests: number[] = [];
    render(
      <SecondOrderProbe
        onChange={value => {
          if (value > 0) controller.setTarget(1);
        }}
        onController={value => { controller = value; }}
        onRest={value => rests.push(value)}
        targetValue={1}
      />,
    );
    act(() => finishFrames());
    expect(rests).toEqual([1]);
    expect(controller.getValue()).toBe(1);
    expect(animationFrames.size).toBe(0);
  });

  it('ignores an old canceled frame without clearing the replacement frame', () => {
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    render(
      <SecondOrderProbe
        onChange={value => values.push(value)}
        onController={value => { controller = value; }}
        targetValue={1}
      />,
    );
    const stale = requestedFrames[0];
    act(() => {
      controller.stop();
      controller.setTarget(2);
    });
    const freshKeys = [...animationFrames.keys()];
    const before = [...values];
    act(() => stale(10_000));
    expect(values).toEqual(before);
    expect([...animationFrames.keys()]).toEqual(freshKeys);
    expect(controller.isAnimating()).toBe(true);
    act(() => finishFrames());
    expect(controller.getValue()).toBe(2);
  });

  it('keeps the StrictMode controller stable and rejects a prior mount callback', () => {
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    const rests: number[] = [];
    render(
      <StrictMode>
        <SecondOrderProbe
          onChange={value => values.push(value)}
          onController={value => { controller = value; }}
          onRest={value => rests.push(value)}
          targetValue={1}
        />
      </StrictMode>,
    );
    expect(values).toEqual([0]);
    expect(requestedFrames.length).toBeGreaterThanOrEqual(2);
    const freshKeys = [...animationFrames.keys()];
    act(() => requestedFrames[0](10_000));
    expect(values).toEqual([0]);
    expect([...animationFrames.keys()]).toEqual(freshKeys);
    expect(rests).toEqual([]);
    act(() => finishFrames());
    expect(controller.getValue()).toBe(1);
    expect(rests).toEqual([1]);
    expect(animationFrames.size).toBe(0);
  });

  it('pauses hidden motion and resumes the latest target without a time jump', () => {
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    const rests: number[] = [];
    render(
      <SecondOrderProbe
        onChange={value => values.push(value)}
        onController={value => { controller = value; }}
        onRest={value => rests.push(value)}
        targetValue={1}
      />,
    );
    act(() => runOneValueUpdate(0));
    const stale = requestedFrames.at(-1)!;
    act(() => setDocumentVisible(false));
    const held = controller.getValue();
    const before = [...values];
    act(() => {
      currentTime = 60_000;
      controller.setTarget(2);
      stale(60_000);
    });
    expect(animationFrames.size).toBe(0);
    expect(controller.getValue()).toBe(held);
    expect(values).toEqual(before);
    expect(rests).toEqual([]);
    act(() => setDocumentVisible(true));
    act(() => {
      runAnimationFrame(60_016);
      runAnimationFrame(60_032);
    });
    expect(controller.getValue()).toBe(held);
    expect(values).toEqual(before);
    expect(rests).toEqual([]);
    act(() => runAnimationFrame(60_034));
    expect(values.length).toBe(before.length + 1);
    expect(controller.getValue()).not.toBe(2);
    expect(Number.isFinite(controller.getValue())).toBe(true);
    act(() => finishFrames(60_034));
    expect(controller.getValue()).toBe(2);
    expect(rests).toEqual([2]);
  });

  it('schedules no frames while initially hidden and snaps if reduced motion wins', () => {
    isDocumentVisible = false;
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    const rests: number[] = [];
    render(
      <SecondOrderProbe
        onChange={value => values.push(value)}
        onController={value => { controller = value; }}
        onRest={value => rests.push(value)}
        targetValue={1}
      />,
    );
    expect(values).toEqual([0]);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    act(() => setReducedMotion(true));
    expect(controller.getValue()).toBe(1);
    expect(rests).toEqual([1]);
    expect(animationFrames.size).toBe(0);
  });

  it('ignores retained-controller calls and stale frames after disposal', () => {
    let controller!: SecondOrderAnimationController;
    const values: number[] = [];
    const rests: number[] = [];
    const view = render(
      <SecondOrderProbe
        onChange={value => values.push(value)}
        onController={value => { controller = value; }}
        onRest={value => rests.push(value)}
        targetValue={1}
      />,
    );
    const stale = requestedFrames[0];
    act(() => setReducedMotion(true));
    view.unmount();
    const beforeValues = [...values];
    const beforeRests = [...rests];
    act(() => {
      controller.setTarget(2);
      controller.stop();
      stale(10_000);
    });
    expect(values).toEqual(beforeValues);
    expect(rests).toEqual(beforeRests);
    expect(controller.getValue()).toBe(1);
    expect(animationFrames.size).toBe(0);
    expect(reducedMotionListeners.size).toBe(0);
  });

  it('refreshes callbacks and configuration without replacing the controller', () => {
    let controller!: SecondOrderAnimationController;
    const onController = (value: SecondOrderAnimationController) => {
      controller = value;
    };
    const oldChange = vi.fn();
    const oldRest = vi.fn();
    const nextChange = vi.fn();
    const nextRest = vi.fn();
    const view = render(
      <SecondOrderProbe
        onChange={oldChange}
        onController={onController}
        onRest={oldRest}
        targetValue={1}
      />,
    );
    const original = controller;
    act(() => runOneValueUpdate(0));
    const held = controller.getValue();
    view.rerender(
      <SecondOrderProbe
        config={{ ...SECOND_ORDER_CONFIG, response: 1.5 }}
        onChange={nextChange}
        onController={onController}
        onRest={nextRest}
        targetValue={1}
      />,
    );
    expect(controller).toBe(original);
    expect(controller.getValue()).toBe(held);
    expect(nextChange).not.toHaveBeenCalled();
    act(() => finishFrames(34));
    expect(controller.getValue()).toBe(1);
    expect(nextChange).toHaveBeenCalled();
    expect(nextRest).toHaveBeenCalledExactlyOnceWith(1);
    expect(oldRest).not.toHaveBeenCalled();
  });

  it('seeds the rendered position without resetting later imperative motion', () => {
    function InitialPositionMarker({target}: {target: number}) {
      const marker = useRef<HTMLSpanElement>(null);
      const initialTarget = useRef(target);
      const motion = useSecondOrderAnimation({
        config: SECOND_ORDER_CONFIG,
        initialValue: initialTarget.current,
        onChange: value => {
          marker.current?.style.setProperty('--marker-x', `${value}px`);
        },
      });
      useEffect(() => motion.setTarget(target), [motion, target]);
      return (
        <span
          ref={marker}
          data-testid="initial-position-marker"
          style={{'--marker-x': `${initialTarget.current}px`} as CSSProperties}
        />
      );
    }
    const server = renderToString(<InitialPositionMarker target={37} />);
    expect(server).toContain('--marker-x:37px');
    const view = render(<InitialPositionMarker target={0} />);
    const marker = view.getByTestId('initial-position-marker');
    expect(marker.style.getPropertyValue('--marker-x')).toBe('0px');
    view.rerender(<InitialPositionMarker target={1} />);
    expect(marker.style.getPropertyValue('--marker-x')).toBe('0px');
    act(() => {
      runOneValueUpdate(0);
      runOneValueUpdate(34);
    });
    const movingPosition = marker.style.getPropertyValue('--marker-x');
    expect(movingPosition).not.toBe('0px');
    expect(movingPosition).not.toBe('1px');
    view.rerender(<InitialPositionMarker target={1} />);
    expect(marker.style.getPropertyValue('--marker-x')).toBe(movingPosition);
    act(() => finishFrames(68));
    expect(marker.style.getPropertyValue('--marker-x')).toBe('1px');
  });

  it('does not emit or schedule callbacks during server rendering', () => {
    const onChange = vi.fn();
    const onRest = vi.fn();
    let serverValue = Number.NaN;
    function ServerProbe() {
      const controller = useSecondOrderAnimation({
        config: SECOND_ORDER_CONFIG,
        initialValue: 37,
        onChange,
        onRest,
      });
      serverValue = controller.getValue();
      return <span data-value={serverValue} />;
    }
    const output = renderToString(<ServerProbe />);
    expect(output).toContain('data-value="37"');
    expect(serverValue).toBe(37);
    expect(onChange).not.toHaveBeenCalled();
    expect(onRest).not.toHaveBeenCalled();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('snaps to an exact target when the animation-frame API is unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'requestAnimationFrame');
    const values: number[] = [];
    const rests: number[] = [];
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: undefined,
    });
    try {
      render(
        <SecondOrderProbe
          onChange={value => values.push(value)}
          onRest={value => rests.push(value)}
          targetValue={1}
        />,
      );
      expect(values).toEqual([0, 1]);
      expect(rests).toEqual([1]);
      expect(animationFrames.size).toBe(0);
    } finally {
      if (original) Object.defineProperty(window, 'requestAnimationFrame', original);
    }
  });

  it('propagates callback exceptions without claiming a completed target', () => {
    prefersReducedMotion = true;
    let controller!: SecondOrderAnimationController;
    const failure = new Error('callback failed');
    const onRest = vi.fn();
    render(
      <SecondOrderProbe
        onChange={value => {
          if (value === 1) throw failure;
        }}
        onController={value => { controller = value; }}
        onRest={onRest}
        targetValue={0}
      />,
    );
    expect(() => act(() => controller.setTarget(1))).toThrow(failure);
    expect(controller.getValue()).toBe(1);
    expect(onRest).not.toHaveBeenCalled();
    expect(animationFrames.size).toBe(0);
  });
});
