/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMeasuredElementDimensions } from './useMeasuredElementDimensions';

function MeasuredFixture({ preparing = false }: { preparing?: boolean }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const dimensions = useMeasuredElementDimensions(elementRef);
  return (
    <div data-page-transition-phase={preparing ? 'preparingEnter' : 'idle'}>
      <div
        ref={(element) => {
          elementRef.current = element;
          if (element != null) {
            Object.defineProperty(element, 'offsetWidth', {
              configurable: true,
              value: 100,
            });
            Object.defineProperty(element, 'offsetHeight', {
              configurable: true,
              value: 80,
            });
          }
        }}
      />
      <output>{dimensions == null ? 'unmeasured' : `${dimensions.w}x${dimensions.h}`}</output>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  // restoreAllMocks only undoes vi.spyOn — not the defineProperty mock below.
  // jsdom does not implement document.fonts at all, so when there was no
  // original the property must be absent again, not re-defined as undefined.
  delete (document as unknown as Record<string, unknown>).fonts;
});

describe('useMeasuredElementDimensions', () => {
  it('measures ordinary content synchronously', () => {
    render(<MeasuredFixture />);

    expect(screen.getByText('100x80')).toBeInTheDocument();
  });

  it('defers an incoming page\'s measurement off the synchronous mount path', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // The contrast is what makes this meaningful: ordinary content measures
    // synchronously during mount, while content inside a hidden
    // `preparingEnter` page does not — that skipped forced layout is the whole
    // point of the phase check.
    const { container } = render(<MeasuredFixture preparing />);
    expect(screen.getByText('unmeasured')).toBeInTheDocument();

    container.firstElementChild?.setAttribute(
      'data-page-transition-phase',
      'entering',
    );

    act(() => {
      callbacks.shift()?.(performance.now());
    });

    expect(screen.getByText('100x80')).toBeInTheDocument();
  });

  it('measures a non-preparing page synchronously, without waiting for a frame', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Without this case the deferral test above passes for the wrong reason:
    // "measured after a frame" is true of every page. Only the pairing shows
    // the `preparingEnter` check is what defers the mount-path measurement.
    render(<MeasuredFixture />);

    expect(screen.getByText('100x80')).toBeInTheDocument();
  });

  it('cancels deferred measurement when the incoming page unmounts', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const cancelAnimationFrame = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const { unmount } = render(<MeasuredFixture preparing />);
    unmount();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(callbacks).toHaveLength(1);
  });

  it('keeps fonts.ready from measuring while the page is still preparing', async () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Resolve fonts on demand so the callback lands while the page is still in
    // its hidden preparation phase — the case the deferral guards. Without the
    // guard this schedules a frame that forces layout in a frame the user
    // cannot see, which is exactly the work the deferral removes.
    let resolveFonts: () => void = () => {};
    const fontsReady = new Promise<void>((resolve) => {
      resolveFonts = resolve;
    });
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: fontsReady },
    });

    const { container } = render(<MeasuredFixture preparing />);
    expect(screen.getByText('unmeasured')).toBeInTheDocument();

    const framesBeforeFonts = callbacks.length;
    await act(async () => {
      resolveFonts();
      await fontsReady;
    });

    // The font resolution must not have queued its own measurement frame, and
    // the element must still be unmeasured.
    expect(callbacks).toHaveLength(framesBeforeFonts);
    expect(screen.getByText('unmeasured')).toBeInTheDocument();

    // Once the phase advances, the already-scheduled stabilization frame
    // measures as usual.
    container.firstElementChild?.setAttribute(
      'data-page-transition-phase',
      'entering',
    );
    act(() => {
      callbacks.shift()?.(performance.now());
    });

    expect(screen.getByText('100x80')).toBeInTheDocument();

    // Cleanup is self-contained rather than relying on this test running
    // immediately before a sibling that checks for the leak: run the same
    // teardown the `afterEach` hook performs and assert the property is gone.
    // Asserting ABSENCE is what detects a leak — jsdom implements no
    // `document.fonts`, so any shape assertion would pass vacuously whether or
    // not the mock survived. Verified by removing the delete below: this
    // assertion then fails, and it fails under `.only` too.
    delete (document as unknown as Record<string, unknown>).fonts;
    expect(Object.getOwnPropertyDescriptor(document, 'fonts')).toBeUndefined();
  });
});
