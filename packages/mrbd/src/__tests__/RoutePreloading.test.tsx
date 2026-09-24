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
  fireEvent,
  render,
} from '@testing-library/react';
import { useEffect } from 'react';
import {
  RoutePreloadProvider,
  RoutePreloadTarget,
  useRoutePreloadTarget,
  useRoutePreloader,
  type RoutePreloadRequest,
  type RoutePreloadTargetBindings,
} from '@wearables-ui-toolkit/foundation/navigation/RoutePreloading';

function RoutePreloadRequestProbe({
  onRequest,
}: {
  onRequest: (request: RoutePreloadRequest) => void;
}) {
  const request = useRoutePreloader();
  useEffect(() => onRequest(request), [onRequest, request]);
  return null;
}

function RoutePreloadTargetBindingsProbe({
  onBindings,
}: {
  onBindings: (
    bindings: RoutePreloadTargetBindings<HTMLDivElement>,
  ) => void;
}) {
  const bindings = useRoutePreloadTarget<HTMLDivElement>({
    preloadKey: 'buttons',
    preloadOnVisible: false,
  });
  useEffect(() => onBindings(bindings), [bindings, onBindings]);
  return <div ref={bindings.ref} />;
}

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  static intersectOnObserve = true;

  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];
  readonly observed = new Set<Element>();
  readonly unobserved = new Set<Element>();
  private readonly callback: IntersectionObserverCallback;

  constructor(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.callback = callback;
    this.root = options.root ?? null;
    this.rootMargin = options.rootMargin ?? '0px';
    const threshold = options.threshold ?? 0;
    this.thresholds = Array.isArray(threshold) ? threshold : [threshold];
    MockIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.add(target);
    if (!MockIntersectionObserver.intersectOnObserve) {
      return;
    }
    const entry = {
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRatio: 1,
      intersectionRect: target.getBoundingClientRect(),
      isIntersecting: true,
      rootBounds: null,
      target,
      time: 0,
    } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }

  unobserve(target: Element) {
    this.observed.delete(target);
    this.unobserved.add(target);
  }

  disconnect() {
    this.observed.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

describe('RoutePreloading', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    MockIntersectionObserver.instances = [];
    MockIntersectionObserver.intersectOnObserve = true;
  });

  it('preloads a route when its target becomes visible in the nearest ScrollView', async () => {
    vi.useFakeTimers();
    const preloadRoute = vi.fn();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    const { container } = render(
      <RoutePreloadProvider preloadRoute={preloadRoute}>
        <div data-scroll-view="true">
          <RoutePreloadTarget preloadKey="settings">
            <button>Settings</button>
          </RoutePreloadTarget>
        </div>
      </RoutePreloadProvider>,
    );

    expect(preloadRoute).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(preloadRoute).toHaveBeenCalledWith('settings');
    expect(MockIntersectionObserver.instances[0]?.root).toBe(
      container.querySelector('[data-scroll-view="true"]'),
    );
    expect(MockIntersectionObserver.instances[0]?.unobserved.size).toBe(1);
  });

  it('shares one visibility observer for targets with the same options', () => {
    MockIntersectionObserver.intersectOnObserve = false;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    render(
      <RoutePreloadProvider preloadRoute={() => {}}>
        <div data-scroll-view="true">
          <RoutePreloadTarget preloadKey="buttons">Buttons</RoutePreloadTarget>
          <RoutePreloadTarget preloadKey="cards">Cards</RoutePreloadTarget>
        </div>
      </RoutePreloadProvider>,
    );

    expect(MockIntersectionObserver.instances).toHaveLength(1);
    expect(MockIntersectionObserver.instances[0]?.observed.size).toBe(2);
  });

  it('dedupes visibility, focus, and pointer preload requests for the same route', async () => {
    vi.useFakeTimers();
    const preloadRoute = vi.fn();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    const { getByText } = render(
      <RoutePreloadProvider preloadRoute={preloadRoute}>
        <RoutePreloadTarget preloadKey="buttons">
          <button>Buttons</button>
        </RoutePreloadTarget>
      </RoutePreloadProvider>,
    );

    fireEvent.focus(getByText('Buttons'));
    fireEvent.pointerEnter(getByText('Buttons'));

    await vi.advanceTimersByTimeAsync(1000);
    expect(preloadRoute).toHaveBeenCalledTimes(1);
  });

  it('waits for directional navigation to settle before route warming', async () => {
    vi.useFakeTimers();
    const preloadRoute = vi.fn();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    render(
      <RoutePreloadProvider preloadRoute={preloadRoute}>
        <RoutePreloadTarget preloadKey="containers">
          <button>Containers</button>
        </RoutePreloadTarget>
      </RoutePreloadProvider>,
    );

    await vi.advanceTimersByTimeAsync(200);
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    await vi.advanceTimersByTimeAsync(300);

    expect(preloadRoute).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(preloadRoute).toHaveBeenCalledWith('containers');
  });

  it('drains visible route warming requests one at a time', async () => {
    vi.useFakeTimers();
    let resolveFirstPreload: () => void = () => {
      throw new Error('First preload did not start');
    };
    const preloadRoute = vi.fn((preloadKey: string) => {
      if (preloadKey !== 'cards') {
        return undefined;
      }

      return new Promise<void>((resolve) => {
        resolveFirstPreload = resolve;
      });
    });
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    render(
      <RoutePreloadProvider preloadRoute={preloadRoute}>
        <RoutePreloadTarget preloadKey="cards">
          <button>Cards</button>
        </RoutePreloadTarget>
        <RoutePreloadTarget preloadKey="containers">
          <button>Containers</button>
        </RoutePreloadTarget>
      </RoutePreloadProvider>,
    );

    await vi.advanceTimersByTimeAsync(1000);
    expect(preloadRoute).toHaveBeenCalledTimes(1);
    expect(preloadRoute).toHaveBeenCalledWith('cards');

    resolveFirstPreload();
    await vi.advanceTimersByTimeAsync(100);

    expect(preloadRoute).toHaveBeenCalledTimes(2);
    expect(preloadRoute).toHaveBeenLastCalledWith('containers');
  });

  it('continues draining and permits retry after a synchronous preload failure', async () => {
    vi.useFakeTimers();
    let shouldThrow = true;
    const preloadRoute = vi.fn((preloadKey: string) => {
      if (preloadKey === 'buttons' && shouldThrow) {
        shouldThrow = false;
        throw new Error('Synchronous load failure');
      }
    });

    const { getByText } = render(
      <RoutePreloadProvider preloadRoute={preloadRoute}>
        <RoutePreloadTarget preloadKey="buttons" preloadOnVisible={false}>
          <button>Buttons</button>
        </RoutePreloadTarget>
        <RoutePreloadTarget preloadKey="cards" preloadOnVisible={false}>
          <button>Cards</button>
        </RoutePreloadTarget>
      </RoutePreloadProvider>,
    );

    fireEvent.focus(getByText('Buttons'));
    fireEvent.focus(getByText('Cards'));
    await vi.advanceTimersByTimeAsync(1000);

    expect(preloadRoute).toHaveBeenNthCalledWith(1, 'buttons');
    expect(preloadRoute).toHaveBeenNthCalledWith(2, 'cards');

    fireEvent.focus(getByText('Buttons'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(preloadRoute).toHaveBeenNthCalledWith(3, 'buttons');
  });

  it('shares fallback scroll and resize listeners across targets', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const documentAdd = vi.spyOn(document, 'addEventListener');
    const documentRemove = vi.spyOn(document, 'removeEventListener');
    const windowAdd = vi.spyOn(window, 'addEventListener');
    const windowRemove = vi.spyOn(window, 'removeEventListener');

    const view = render(
      <RoutePreloadProvider preloadRoute={() => {}}>
        <RoutePreloadTarget preloadKey="buttons">Buttons</RoutePreloadTarget>
        <RoutePreloadTarget preloadKey="cards">Cards</RoutePreloadTarget>
      </RoutePreloadProvider>,
    );

    expect(documentAdd.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1);
    expect(windowAdd.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);

    view.unmount();
    expect(documentRemove.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1);
    expect(windowRemove.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);
  });

  it('installs no observer or directional listener without a route handler', () => {
    MockIntersectionObserver.intersectOnObserve = false;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    const documentAdd = vi.spyOn(document, 'addEventListener');
    const documentRemove = vi.spyOn(document, 'removeEventListener');

    const view = render(
      <RoutePreloadProvider>
        <RoutePreloadTarget preloadKey="buttons">
          <button>Buttons</button>
        </RoutePreloadTarget>
      </RoutePreloadProvider>,
    );

    expect(MockIntersectionObserver.instances).toHaveLength(0);
    expect(
      documentAdd.mock.calls.filter(
        ([type, , options]) => type === 'keydown' && options === true,
      ),
    ).toHaveLength(0);

    view.rerender(
      <RoutePreloadProvider preloadRoute={() => {}}>
        <RoutePreloadTarget preloadKey="buttons">
          <button>Buttons</button>
        </RoutePreloadTarget>
      </RoutePreloadProvider>,
    );

    expect(MockIntersectionObserver.instances).toHaveLength(1);
    expect(
      documentAdd.mock.calls.filter(
        ([type, , options]) => type === 'keydown' && options === true,
      ),
    ).toHaveLength(1);

    view.rerender(
      <RoutePreloadProvider>
        <RoutePreloadTarget preloadKey="buttons">
          <button>Buttons</button>
        </RoutePreloadTarget>
      </RoutePreloadProvider>,
    );

    expect(MockIntersectionObserver.instances[0]?.unobserved.size).toBe(1);
    expect(
      documentRemove.mock.calls.filter(
        ([type, , options]) => type === 'keydown' && options === true,
      ),
    ).toHaveLength(1);
  });

  it('installs no fallback visibility listeners without a route handler', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const documentAdd = vi.spyOn(document, 'addEventListener');
    const windowAdd = vi.spyOn(window, 'addEventListener');

    render(
      <RoutePreloadProvider>
        <RoutePreloadTarget preloadKey="buttons">Buttons</RoutePreloadTarget>
      </RoutePreloadProvider>,
    );

    expect(
      documentAdd.mock.calls.filter(([type]) => type === 'scroll'),
    ).toHaveLength(0);
    expect(
      windowAdd.mock.calls.filter(([type]) => type === 'resize'),
    ).toHaveLength(0);
  });

  it('omits preload-only event bindings until a handler is configured', () => {
    const capturedBindings: Array<
      RoutePreloadTargetBindings<HTMLDivElement>
    > = [];
    const captureBindings = (
      bindings: RoutePreloadTargetBindings<HTMLDivElement>,
    ) => {
      capturedBindings.push(bindings);
    };
    const view = render(
      <RoutePreloadProvider>
        <RoutePreloadTargetBindingsProbe onBindings={captureBindings} />
      </RoutePreloadProvider>,
    );

    let bindings = capturedBindings[capturedBindings.length - 1];
    expect(bindings?.onFocusCapture).toBeUndefined();
    expect(bindings?.onPointerEnter).toBeUndefined();

    view.rerender(
      <RoutePreloadProvider preloadRoute={() => {}}>
        <RoutePreloadTargetBindingsProbe onBindings={captureBindings} />
      </RoutePreloadProvider>,
    );

    bindings = capturedBindings[capturedBindings.length - 1];
    expect(bindings?.onFocusCapture).toBeTypeOf('function');
    expect(bindings?.onPointerEnter).toBeTypeOf('function');
  });

  it('preserves consumer event handlers when preloading is disabled', () => {
    const onFocusCapture = vi.fn();
    const onPointerEnter = vi.fn();
    const { getByText } = render(
      <RoutePreloadProvider>
        <RoutePreloadTarget
          preloadKey="buttons"
          preloadOnVisible={false}
          onFocusCapture={onFocusCapture}
          onPointerEnter={onPointerEnter}
        >
          <button>Buttons</button>
        </RoutePreloadTarget>
      </RoutePreloadProvider>,
    );

    fireEvent.focus(getByText('Buttons'));
    fireEvent.pointerEnter(getByText('Buttons'));

    expect(onFocusCapture).toHaveBeenCalledOnce();
    expect(onPointerEnter).toHaveBeenCalledOnce();
  });

  it('retries visible preloading when a failed handler is replaced', async () => {
    vi.useFakeTimers();
    const firstPreloadRoute = vi.fn(() => {
      throw new Error('temporary failure');
    });
    const secondPreloadRoute = vi.fn();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const view = render(
      <RoutePreloadProvider>
        <RoutePreloadTarget preloadKey="buttons">Buttons</RoutePreloadTarget>
      </RoutePreloadProvider>,
    );
    expect(MockIntersectionObserver.instances).toHaveLength(0);

    view.rerender(
      <RoutePreloadProvider preloadRoute={firstPreloadRoute}>
        <RoutePreloadTarget preloadKey="buttons">Buttons</RoutePreloadTarget>
      </RoutePreloadProvider>,
    );
    await vi.advanceTimersByTimeAsync(1000);
    expect(firstPreloadRoute).toHaveBeenCalledOnce();

    view.rerender(
      <RoutePreloadProvider preloadRoute={secondPreloadRoute}>
        <RoutePreloadTarget preloadKey="buttons">Buttons</RoutePreloadTarget>
      </RoutePreloadProvider>,
    );
    await vi.advanceTimersByTimeAsync(1000);

    expect(secondPreloadRoute).toHaveBeenCalledOnce();
  });

  it('reports whether a preload request was accepted by a provider', () => {
    let requestWithoutProvider: RoutePreloadRequest | null = null;
    let requestWithProvider: RoutePreloadRequest | null = null;
    const captureWithoutProvider = (request: RoutePreloadRequest) => {
      requestWithoutProvider = request;
    };
    const captureWithProvider = (request: RoutePreloadRequest) => {
      requestWithProvider = request;
    };

    render(
      <>
        <RoutePreloadRequestProbe onRequest={captureWithoutProvider} />
        <RoutePreloadProvider preloadRoute={() => {}}>
          <RoutePreloadRequestProbe onRequest={captureWithProvider} />
        </RoutePreloadProvider>
      </>,
    );

    expect(requestWithoutProvider?.('buttons')).toBe(false);
    expect(requestWithProvider?.('buttons')).toBe(true);
  });
});
