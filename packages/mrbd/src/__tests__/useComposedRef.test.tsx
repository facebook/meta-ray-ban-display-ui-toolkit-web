/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  StrictMode,
  createRef,
  forwardRef,
  type RefCallback,
  type RefObject,
} from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useComposedRef } from '@wearables-ui-toolkit/foundation/utils/useComposedRef';

interface ComposedRefProbeProps {
  label?: string;
  localRef: RefObject<HTMLDivElement | null>;
}

const ComposedRefProbe = forwardRef<HTMLDivElement, ComposedRefProbeProps>(
  function ComposedRefProbe({ label, localRef }, forwardedRef) {
    const composedRef = useComposedRef(forwardedRef, localRef);
    return <div ref={composedRef}>{label}</div>;
  },
);

afterEach(cleanup);

describe('useComposedRef', () => {
  it('runs a callback-ref cleanup once without also sending null', () => {
    const localRef = createRef<HTMLDivElement>();
    const receivedNodes: Array<HTMLDivElement | null> = [];
    let cleanupCalls = 0;
    const forwardedRef: RefCallback<HTMLDivElement> = node => {
      receivedNodes.push(node);
      if (node == null) {
        return;
      }
      return () => {
        cleanupCalls += 1;
        expect(localRef.current).toBeNull();
      };
    };

    const view = render(
      <ComposedRefProbe ref={forwardedRef} localRef={localRef} />,
    );
    const node = view.container.firstElementChild;

    expect(localRef.current).toBe(node);
    expect(receivedNodes).toEqual([node]);

    view.unmount();

    expect(cleanupCalls).toBe(1);
    expect(receivedNodes).toEqual([node]);
    expect(localRef.current).toBeNull();
  });

  it('sends null to a legacy callback ref during cleanup', () => {
    const localRef = createRef<HTMLDivElement>();
    const receivedNodes: Array<HTMLDivElement | null> = [];
    const forwardedRef: RefCallback<HTMLDivElement> = node => {
      receivedNodes.push(node);
    };

    const view = render(
      <ComposedRefProbe ref={forwardedRef} localRef={localRef} />,
    );
    const node = view.container.firstElementChild;
    view.unmount();

    expect(receivedNodes).toEqual([node, null]);
    expect(localRef.current).toBeNull();
  });

  it('updates both object refs on mount and unmount', () => {
    const localRef = createRef<HTMLDivElement>();
    const forwardedRef = createRef<HTMLDivElement>();

    const view = render(
      <ComposedRefProbe ref={forwardedRef} localRef={localRef} />,
    );
    const node = view.container.firstElementChild;

    expect(localRef.current).toBe(node);
    expect(forwardedRef.current).toBe(node);

    view.unmount();

    expect(localRef.current).toBeNull();
    expect(forwardedRef.current).toBeNull();
  });

  it('cleans up the previous callback ref exactly once when it is replaced', () => {
    const localRef = createRef<HTMLDivElement>();
    const firstNodes: Array<HTMLDivElement | null> = [];
    const secondNodes: Array<HTMLDivElement | null> = [];
    const cleanups: string[] = [];
    const firstRef: RefCallback<HTMLDivElement> = node => {
      firstNodes.push(node);
      return node == null
        ? undefined
        : () => {
            cleanups.push('first');
          };
    };
    const secondRef: RefCallback<HTMLDivElement> = node => {
      secondNodes.push(node);
      return node == null
        ? undefined
        : () => {
            cleanups.push('second');
          };
    };

    const view = render(
      <ComposedRefProbe ref={firstRef} localRef={localRef} />,
    );
    const node = view.container.firstElementChild;
    view.rerender(
      <ComposedRefProbe ref={secondRef} localRef={localRef} />,
    );

    expect(firstNodes).toEqual([node]);
    expect(secondNodes).toEqual([node]);
    expect(cleanups).toEqual(['first']);
    expect(localRef.current).toBe(node);

    view.unmount();

    expect(cleanups).toEqual(['first', 'second']);
    expect(firstNodes).toEqual([node]);
    expect(secondNodes).toEqual([node]);
  });

  it('does not detach a stable ref during ordinary rerenders', () => {
    const localRef = createRef<HTMLDivElement>();
    let setupCalls = 0;
    let cleanupCalls = 0;
    const forwardedRef: RefCallback<HTMLDivElement> = node => {
      if (node == null) {
        return;
      }
      setupCalls += 1;
      return () => {
        cleanupCalls += 1;
      };
    };

    const view = render(
      <ComposedRefProbe
        ref={forwardedRef}
        label="before"
        localRef={localRef}
      />,
    );
    view.rerender(
      <ComposedRefProbe
        ref={forwardedRef}
        label="after"
        localRef={localRef}
      />,
    );

    expect(setupCalls).toBe(1);
    expect(cleanupCalls).toBe(0);

    view.unmount();

    expect(cleanupCalls).toBe(1);
  });

  it('balances every callback-ref setup during StrictMode replay', () => {
    const localRef = createRef<HTMLDivElement>();
    const setupIds: number[] = [];
    const cleanupIds: number[] = [];
    let nullCalls = 0;
    const forwardedRef: RefCallback<HTMLDivElement> = node => {
      if (node == null) {
        nullCalls += 1;
        return;
      }
      const setupId = setupIds.length;
      setupIds.push(setupId);
      return () => {
        cleanupIds.push(setupId);
      };
    };

    const view = render(
      <StrictMode>
        <ComposedRefProbe ref={forwardedRef} localRef={localRef} />
      </StrictMode>,
    );

    expect(setupIds.length).toBeGreaterThanOrEqual(2);
    expect(cleanupIds).toEqual(setupIds.slice(0, -1));

    view.unmount();

    expect(cleanupIds).toEqual(setupIds);
    expect(new Set(cleanupIds).size).toBe(setupIds.length);
    expect(nullCalls).toBe(0);
    expect(localRef.current).toBeNull();
  });
});
