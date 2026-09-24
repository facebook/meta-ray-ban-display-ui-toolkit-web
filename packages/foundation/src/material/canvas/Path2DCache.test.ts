/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ShapeProvider } from '../ShapeProvider';
import {
  clearPath2DCache,
  getInsetStrokePath2D,
} from './Path2DCache';

class FakePath2D {
  constructor(readonly path?: string) {}
}

afterEach(() => {
  clearPath2DCache();
  vi.unstubAllGlobals();
});

describe('getInsetStrokePath2D', () => {
  it('reuses inset geometry within half a physical pixel', () => {
    vi.stubGlobal('Path2D', FakePath2D);
    const getStrokePath = vi.fn(({ strokeWidth }: { strokeWidth: number }) =>
      `stroke-${strokeWidth}`,
    );
    const shapeProvider: ShapeProvider = {
      getShapePath: () => 'fill',
      getStrokePath,
    };
    const shapeContext = { shapeProvider };

    const first = getInsetStrokePath2D(100, 80, 1.01, shapeContext, 1);
    const sameBucket = getInsetStrokePath2D(100, 80, 1.24, shapeContext, 1);
    const nextBucket = getInsetStrokePath2D(100, 80, 1.26, shapeContext, 1);

    expect(first).toBe(sameBucket);
    expect(nextBucket).not.toBe(first);
    expect(getStrokePath.mock.calls.map(([params]) => params.strokeWidth)).toEqual([
      1,
      1.5,
    ]);
  });

  it('bounds animated stroke geometry to rasterization-relevant paths', () => {
    vi.stubGlobal('Path2D', FakePath2D);
    const getStrokePath = vi.fn(({ strokeWidth }: { strokeWidth: number }) =>
      `stroke-${strokeWidth}`,
    );
    const shapeProvider: ShapeProvider = {
      getShapePath: () => 'fill',
      getStrokePath,
    };
    const shapeContext = { shapeProvider };

    for (let step = 0; step <= 100; step += 1) {
      getInsetStrokePath2D(
        100,
        80,
        1 + (2 * step) / 100,
        shapeContext,
        1,
      );
    }

    expect(getStrokePath).toHaveBeenCalledTimes(5);
  });

  it('uses device-pixel ratio when choosing geometry buckets', () => {
    vi.stubGlobal('Path2D', FakePath2D);
    const getStrokePath = vi.fn(({ strokeWidth }: { strokeWidth: number }) =>
      `stroke-${strokeWidth}`,
    );
    const shapeProvider: ShapeProvider = {
      getShapePath: () => 'fill',
      getStrokePath,
    };
    const shapeContext = { shapeProvider };

    getInsetStrokePath2D(100, 80, 1.12, shapeContext, 2);
    getInsetStrokePath2D(100, 80, 1.13, shapeContext, 2);

    expect(getStrokePath.mock.calls.map(([params]) => params.strokeWidth)).toEqual([
      1,
      1.25,
    ]);
  });
});
