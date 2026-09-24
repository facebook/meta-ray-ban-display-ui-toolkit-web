/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  startSynchronizedTransition,
} from '@wearables-ui-toolkit/foundation/motion/SynchronizedTransition';

describe('SynchronizedTransition', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('drives all participants from one animation frame timeline', () => {
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    vi.spyOn(performance, 'now').mockReturnValue(0);
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frames.set(frameId, callback);
        return frameId;
      });
    vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((frameId: number) => {
        frames.delete(frameId);
      });
    const firstFrames: number[] = [];
    const secondFrames: number[] = [];
    const firstComplete = vi.fn();
    const secondComplete = vi.fn();

    startSynchronizedTransition({
      participants: [
        {
          durationMs: 100,
          onComplete: firstComplete,
          onFrame: ({ linearProgress }) => {
            firstFrames.push(linearProgress);
          },
        },
        {
          durationMs: 200,
          easing: progress => progress * progress,
          onComplete: secondComplete,
          onFrame: ({ easedProgress }) => {
            secondFrames.push(easedProgress);
          },
        },
      ],
    });

    expect(requestFrameSpy).toHaveBeenCalledTimes(1);
    expect(firstFrames).toEqual([0]);
    expect(secondFrames).toEqual([0]);

    const frameAt50ms = Array.from(frames.values())[0];
    frames.clear();
    frameAt50ms?.(50);

    expect(firstFrames[firstFrames.length - 1]).toBe(0.5);
    expect(secondFrames[secondFrames.length - 1]).toBe(0.0625);
    expect(requestFrameSpy).toHaveBeenCalledTimes(2);

    const frameAt200ms = Array.from(frames.values())[0];
    frames.clear();
    frameAt200ms?.(200);

    expect(firstFrames[firstFrames.length - 1]).toBe(1);
    expect(secondFrames[secondFrames.length - 1]).toBe(1);
    expect(firstComplete).toHaveBeenCalledTimes(1);
    expect(secondComplete).toHaveBeenCalledTimes(1);
  });

  it('cancels every participant through the same handle', () => {
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi
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
    const firstCancel = vi.fn();
    const secondCancel = vi.fn();
    const firstComplete = vi.fn();
    const secondComplete = vi.fn();

    const transition = startSynchronizedTransition({
      participants: [
        {
          durationMs: 100,
          onCancel: firstCancel,
          onComplete: firstComplete,
          onFrame: () => {},
        },
        {
          durationMs: 200,
          onCancel: secondCancel,
          onComplete: secondComplete,
          onFrame: () => {},
        },
      ],
    });

    transition.cancel();

    expect(cancelFrameSpy).toHaveBeenCalledTimes(1);
    expect(firstCancel).toHaveBeenCalledTimes(1);
    expect(secondCancel).toHaveBeenCalledTimes(1);
    expect(firstComplete).not.toHaveBeenCalled();
    expect(secondComplete).not.toHaveBeenCalled();
  });
});
