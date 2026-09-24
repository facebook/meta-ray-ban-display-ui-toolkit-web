/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import {
  FADING_EDGE_LENGTH_MEDIUM,
  fitFocusSafeAreaInsets,
  getActiveFadingEdgeInsets,
  getFadingEdgeOverlayStyles,
  getFadingEdgeState,
  scrollElementIntoFadingEdgeSafeArea,
} from '@wearables-ui-toolkit/foundation/components/private/FadingEdges';

describe('FadingEdges', () => {
  it('contracts fade clearance when the focused element needs more room', () => {
    expect(fitFocusSafeAreaInsets(64, 64, 100, 40)).toEqual([29.75, 29.75]);
  });

  it('preserves the header inset before preferred fade clearance', () => {
    expect(fitFocusSafeAreaInsets(80, 64, 200, 40, 80)).toEqual([80, 64]);
    expect(fitFocusSafeAreaInsets(80, 64, 120, 40, 80)).toEqual([79.5, 0]);
  });

  it('shows only the bottom vertical edge at the top of overflowing content', () => {
    const metrics = {
      scrollTop: 0,
      scrollLeft: 0,
      scrollHeight: 300,
      scrollWidth: 100,
      clientHeight: 100,
      clientWidth: 100,
    };

    expect(getFadingEdgeState(metrics, {
      top: FADING_EDGE_LENGTH_MEDIUM,
      bottom: FADING_EDGE_LENGTH_MEDIUM,
    })).toEqual({
      top: false,
      bottom: true,
      left: false,
      right: false,
    });
    const overlays = getFadingEdgeOverlayStyles(metrics, {
      top: FADING_EDGE_LENGTH_MEDIUM,
      bottom: FADING_EDGE_LENGTH_MEDIUM,
    });
    expect(overlays.top).toMatchObject({ height: '64px', opacity: 0 });
    expect(overlays.bottom).toMatchObject({ height: '64px', opacity: 1 });
  });

  it('shows both vertical edges while there is content above and below', () => {
    const overlays = getFadingEdgeOverlayStyles(
      {
        scrollTop: 40,
        scrollLeft: 0,
        scrollHeight: 300,
        scrollWidth: 100,
        clientHeight: 100,
        clientWidth: 100,
      },
      {
        top: FADING_EDGE_LENGTH_MEDIUM,
        bottom: FADING_EDGE_LENGTH_MEDIUM,
      },
    );

    expect(overlays.top).toMatchObject({ height: '64px', opacity: 0.625 });
    expect(overlays.bottom).toMatchObject({ height: '64px', opacity: 1 });
  });

  it('keeps edge length fixed while fading edge strength changes', () => {
    const overlays = getFadingEdgeOverlayStyles(
      {
        scrollTop: 0,
        scrollLeft: 16,
        scrollHeight: 100,
        scrollWidth: 300,
        clientHeight: 100,
        clientWidth: 100,
      },
      {
        left: FADING_EDGE_LENGTH_MEDIUM,
        right: FADING_EDGE_LENGTH_MEDIUM,
      },
    );

    expect(overlays.left).toMatchObject({ width: '64px', opacity: 0.25 });
    expect(overlays.right).toMatchObject({ width: '64px', opacity: 1 });
  });

  it('shows only the left horizontal edge at the end of overflowing content', () => {
    const metrics = {
      scrollTop: 0,
      scrollLeft: 200,
      scrollHeight: 100,
      scrollWidth: 300,
      clientHeight: 100,
      clientWidth: 100,
    };

    expect(getFadingEdgeState(metrics, {
      left: FADING_EDGE_LENGTH_MEDIUM,
      right: FADING_EDGE_LENGTH_MEDIUM,
    })).toEqual({
      top: false,
      bottom: false,
      left: true,
      right: false,
    });
    const overlays = getFadingEdgeOverlayStyles(metrics, {
      left: FADING_EDGE_LENGTH_MEDIUM,
      right: FADING_EDGE_LENGTH_MEDIUM,
    });
    expect(overlays.left).toMatchObject({ width: '64px', opacity: 1 });
    expect(overlays.right).toMatchObject({ width: '64px', opacity: 0 });
  });

  it('reserves space only for visible fading edges', () => {
    expect(getActiveFadingEdgeInsets(
      {
        scrollTop: 0,
        scrollLeft: 0,
        scrollHeight: 300,
        scrollWidth: 300,
        clientHeight: 100,
        clientWidth: 100,
      },
      {
        top: FADING_EDGE_LENGTH_MEDIUM,
        bottom: FADING_EDGE_LENGTH_MEDIUM,
        left: FADING_EDGE_LENGTH_MEDIUM,
        right: FADING_EDGE_LENGTH_MEDIUM,
      },
    )).toEqual({
      top: 0,
      bottom: FADING_EDGE_LENGTH_MEDIUM,
      left: 0,
      right: FADING_EDGE_LENGTH_MEDIUM,
    });

    expect(getActiveFadingEdgeInsets(
      {
        scrollTop: 200,
        scrollLeft: 200,
        scrollHeight: 300,
        scrollWidth: 300,
        clientHeight: 100,
        clientWidth: 100,
      },
      {
        top: FADING_EDGE_LENGTH_MEDIUM,
        bottom: FADING_EDGE_LENGTH_MEDIUM,
        left: FADING_EDGE_LENGTH_MEDIUM,
        right: FADING_EDGE_LENGTH_MEDIUM,
      },
    )).toEqual({
      top: FADING_EDGE_LENGTH_MEDIUM,
      bottom: 0,
      left: FADING_EDGE_LENGTH_MEDIUM,
      right: 0,
    });
  });

  it('scrolls focused elements past active fading edges', () => {
    const scrollContainer = document.createElement('div');
    const element = document.createElement('button');
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(performance.now() + 1000);
        return 1;
      });

    Object.defineProperties(scrollContainer, {
      scrollTop: { configurable: true, writable: true, value: 0 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
      scrollHeight: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 100 },
      clientHeight: { configurable: true, value: 100 },
      clientWidth: { configurable: true, value: 100 },
      scrollTo: { configurable: true, value: vi.fn() },
    });
    scrollContainer.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => {},
    });
    element.getBoundingClientRect = () => ({
      x: 0,
      y: 80,
      top: 80,
      left: 0,
      right: 100,
      bottom: 95,
      width: 100,
      height: 15,
      toJSON: () => {},
    });

    expect(scrollElementIntoFadingEdgeSafeArea(scrollContainer, element, {
      top: FADING_EDGE_LENGTH_MEDIUM,
      bottom: FADING_EDGE_LENGTH_MEDIUM,
    })).toBe(true);
    expect(scrollContainer.scrollTop).toBe(59);
    expect(scrollContainer.scrollLeft).toBe(0);

    requestAnimationFrameSpy.mockRestore();
  });
});
