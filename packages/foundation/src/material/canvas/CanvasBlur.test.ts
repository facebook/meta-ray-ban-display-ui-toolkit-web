/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  drawWithCanvasBlur,
  gaussianBlurImageData,
  setNativeCanvasFilterSupportForTesting,
} from './CanvasBlur';

function imageData(width: number, height: number): ImageData {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) } as unknown as ImageData;
}

function setPixel(image: ImageData, x: number, y: number, rgba: number[]): void {
  image.data.set(rgba, (y * image.width + x) * 4);
}

function pixel(image: ImageData, x: number, y: number): number[] {
  const i = (y * image.width + x) * 4;
  return Array.from(image.data.slice(i, i + 4));
}

function alphaSum(image: ImageData): number {
  let sum = 0;
  for (let i = 3; i < image.data.length; i += 4) sum += image.data[i];
  return sum;
}

function fakeContext(extra: Record<string, unknown> = {}) {
  return {
    canvas: { width: 40, height: 20 },
    filter: 'none',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low',
    getTransform: () => ({ a: 2, b: 0, c: 0, d: 2, e: 3, f: 4 }),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => imageData(w, h)),
    putImageData: vi.fn(),
    ...extra,
  };
}

afterEach(() => {
  setNativeCanvasFilterSupportForTesting(null);
  vi.restoreAllMocks();
});

describe('gaussianBlurImageData', () => {
  it.each([1, 1.5, 3, 6])('spreads a block symmetrically and conserves alpha (sigma %s)', sigma => {
    const size = 61;
    const image = imageData(size, size);
    for (let y = 26; y <= 34; y += 1) {
      for (let x = 26; x <= 34; x += 1) setPixel(image, x, y, [255, 255, 255, 255]);
    }
    const before = alphaSum(image);

    gaussianBlurImageData(image, sigma);

    expect(pixel(image, 26, 30)[3]).toBeLessThan(255);
    expect(pixel(image, 24, 30)[3]).toBeGreaterThan(0);
    expect(pixel(image, 24, 30)[3]).toBeLessThan(pixel(image, 26, 30)[3]);
    expect(pixel(image, 22, 30)).toEqual(pixel(image, 38, 30));
    expect(pixel(image, 30, 22)).toEqual(pixel(image, 30, 38));
    expect(pixel(image, 22, 30)).toEqual(pixel(image, 30, 22));
    expect(Math.abs(alphaSum(image) - before)).toBeLessThan(before * 0.02);
  });

  it('blurs in premultiplied space so transparent pixels contribute no color', () => {
    const image = imageData(21, 21);
    for (let i = 0; i < 21 * 21; i += 1) image.data.set([0, 255, 0, 0], i * 4);
    for (let y = 8; y <= 12; y += 1) {
      for (let x = 8; x <= 12; x += 1) setPixel(image, x, y, [255, 0, 0, 255]);
    }

    gaussianBlurImageData(image, 2);

    const [r, g, , a] = pixel(image, 14, 10);
    expect(a).toBeGreaterThan(0);
    expect(r).toBe(255);
    expect(g).toBe(0);
  });

  it('reuses channel buffers across sizes and clears transparent pixels from previous draws', () => {
    const Original = globalThis.Float32Array;
    let allocations = 0;
    vi.stubGlobal('Float32Array', new Proxy(Original, {
      construct(target, args) {
        allocations++;
        return Reflect.construct(target, args);
      },
    }));
    try {
      const first = imageData(21, 21);
      setPixel(first, 10, 10, [255, 0, 0, 255]);
      gaussianBlurImageData(first, 2);
      const afterFirst = allocations;
      const next = imageData(11, 11);
      setPixel(next, 5, 5, [0, 255, 0, 255]);
      gaussianBlurImageData(next, 2);
      expect(allocations).toBe(afterFirst);
      const green = pixel(next, 5, 5);
      expect(green[0]).toBe(0);
      expect(green[1]).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('recycles a tainted layer only after a canvas reset restores read access', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const ctx = fakeContext();
    let canvas: HTMLCanvasElement;
    let tainted = false;
    const layerCtx = fakeContext({
      getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => {
        if (tainted) throw new DOMException('tainted', 'SecurityError');
        return imageData(w, h);
      }),
    });
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(() => {
      const candidate = { height: 0, getContext: () => layerCtx } as HTMLCanvasElement;
      let width = 0;
      Object.defineProperty(candidate, 'width', {
        get: () => width,
        set: value => { width = value; tainted = false; },
      });
      canvas = candidate;
      return candidate;
    });

    expect(drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, () => {
      tainted = true;
    })).toBe(false);
    expect(canvas!.width).toBe(64);
    expect(drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, () => {})).toBe(true);
    expect(createElement).toHaveBeenCalledOnce();
    expect(layerCtx.getImageData).toHaveBeenCalledWith(0, 0, 1, 1);
  });

  it('bounds the sampled-kernel cache when blur radii animate', () => {
    const evictions = vi.spyOn(Map.prototype, 'delete');
    for (let i = 0; i < 40; i += 1) {
      gaussianBlurImageData(imageData(8, 8), 1 + i / 100);
    }
    expect(evictions.mock.calls.some(([key]) => typeof key === 'number')).toBe(true);
  });

  it('leaves fully transparent regions transparent black', () => {
    const image = imageData(30, 30);
    setPixel(image, 2, 2, [255, 255, 255, 255]);
    gaussianBlurImageData(image, 1);
    expect(pixel(image, 25, 25)).toEqual([0, 0, 0, 0]);
  });
});

describe('drawWithCanvasBlur', () => {
  it('uses the native canvas filter when supported', () => {
    setNativeCanvasFilterSupportForTesting(true);
    const ctx = fakeContext();
    const filters: string[] = [];
    const blurred = drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 6, target => {
      expect(target).toBe(ctx);
      filters.push(ctx.filter);
    });
    expect(blurred).toBe(true);
    expect(filters).toEqual(['blur(6px)']);
    expect(ctx.filter).toBe('none');
    expect(ctx.getImageData).not.toHaveBeenCalled();
  });

  it('draws directly without a filter when sigma is zero', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const ctx = fakeContext();
    const draw = vi.fn();
    drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 0, draw);
    expect(draw).toHaveBeenCalledWith(ctx);
    expect(ctx.filter).toBe('none');
  });

  it('falls back to a padded software-blurred layer composited in device space', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const layerCtx = fakeContext();
    const layerCanvas = { width: 0, height: 0, getContext: () => layerCtx };
    vi.spyOn(document, 'createElement').mockReturnValue(layerCanvas as unknown as HTMLCanvasElement);
    const ctx = fakeContext();
    const draw = vi.fn();

    drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 2, draw);

    const pad = 6;
    expect(layerCanvas.width).toBe(40 + pad * 2);
    expect(layerCanvas.height).toBe(20 + pad * 2);
    expect(layerCtx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 3 + pad, 4 + pad);
    expect(layerCtx.save).toHaveBeenCalled();
    expect(layerCtx.restore).toHaveBeenCalled();
    expect(draw).toHaveBeenCalledWith(layerCtx);
    expect(layerCtx.getImageData).toHaveBeenCalledWith(0, 0, 52, 32);
    expect(layerCtx.putImageData).toHaveBeenCalled();
    expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    expect(ctx.drawImage).toHaveBeenCalledWith(layerCanvas, -pad, -pad);
    expect(ctx.save).toHaveBeenCalledBefore(ctx.drawImage);
    expect(ctx.restore).toHaveBeenCalledAfter(ctx.drawImage);
  });

  it('draws unblurred when the layer cannot be read back', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const layerCtx = fakeContext({
      getImageData: vi.fn(() => {
        throw new Error('tainted');
      }),
    });
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => layerCtx,
    } as unknown as HTMLCanvasElement);
    const ctx = fakeContext();
    const targets: unknown[] = [];

    const blurred = drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, target => targets.push(target));

    expect(blurred).toBe(false);
    expect(targets).toEqual([layerCtx, ctx]);
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('does not pool an unreadable layer after a tainted image', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const firstCtx = fakeContext({ getImageData: vi.fn(() => { throw new Error('tainted'); }) });
    const secondCtx = fakeContext();
    let created = 0;
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(() => {
      const ctx = created++ === 0 ? firstCtx : secondCtx;
      return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
    });
    const ctx = fakeContext();

    drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, () => {});
    drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, () => {});

    expect(createElement).toHaveBeenCalledTimes(2);
    expect(secondCtx.getImageData).toHaveBeenCalledOnce();
    expect(ctx.drawImage).toHaveBeenCalledOnce();
  });

  it('reuses a clean layer without retaining callback canvas state', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const layerCtx = fakeContext();
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => layerCtx,
    } as unknown as HTMLCanvasElement);
    const ctx = fakeContext();

    drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, () => {});
    drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, () => {});

    expect(createElement).toHaveBeenCalledOnce();
    expect(layerCtx.save).toHaveBeenCalledTimes(2);
    expect(layerCtx.restore).toHaveBeenCalledTimes(2);
    expect(layerCtx.getImageData).toHaveBeenCalledTimes(2);
  });

  it('returns a clean pooled layer when drawing throws before tainting it', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const layerCtx = fakeContext();
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => layerCtx,
    } as unknown as HTMLCanvasElement);
    const ctx = fakeContext();

    expect(() => drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, () => {
      throw new Error('draw failed');
    })).toThrow('draw failed');
    drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, () => {});

    expect(createElement).toHaveBeenCalledOnce();
    expect(layerCtx.restore).toHaveBeenCalledTimes(2);
    expect(layerCtx.getImageData).toHaveBeenCalledWith(0, 0, 1, 1);
    expect(ctx.drawImage).toHaveBeenCalledOnce();
  });

  it('discards the pooled layer when drawing throws after tainting it', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const taintedCtx = fakeContext({ getImageData: vi.fn(() => { throw new Error('tainted'); }) });
    const cleanCtx = fakeContext();
    let created = 0;
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(() => ({
      width: 0,
      height: 0,
      getContext: () => created++ === 0 ? taintedCtx : cleanCtx,
    } as unknown as HTMLCanvasElement));
    const ctx = fakeContext();

    expect(() => drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, () => {
      throw new Error('draw failed');
    })).toThrow('draw failed');
    drawWithCanvasBlur(ctx as unknown as CanvasRenderingContext2D, 4, () => {});

    expect(createElement).toHaveBeenCalledTimes(2);
    expect(taintedCtx.getImageData).toHaveBeenCalledWith(0, 0, 1, 1);
    expect(cleanCtx.getImageData).toHaveBeenCalledOnce();
  });
});
