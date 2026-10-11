/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { setNativeCanvasFilterSupportForTesting } from './CanvasBlur';
import * as canvasBlur from './CanvasBlur';
import { drawDropShadow, drawImageClipped, drawInnerGlow } from './CanvasDrawUtils';
import * as canvasDrawUtils from './CanvasDrawUtils';
import { ImageContentContainerMaterialLayer } from '../layers/ImageContentContainerMaterialLayer';
import { VisualState } from '../../base/Interactions';

function createContext(canvas: HTMLCanvasElement) {
  return {
    canvas,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    getTransform: () => ({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 }),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
      width: Math.min(width, 2),
      height: Math.min(height, 2),
      data: new Uint8ClampedArray(Math.min(width, 2) * Math.min(height, 2) * 4),
    })),
    putImageData: vi.fn(),
  };
}

afterEach(() => {
  setNativeCanvasFilterSupportForTesting(null);
  vi.restoreAllMocks();
});

describe('device-pixel canvas effects', () => {
  it('scales drop-shadow blur and offsets at DPR 2 but preserves DPR 1', () => {
    const ctx = createContext({ width: 80, height: 80 } as HTMLCanvasElement);
    const shadow = { path: {} as Path2D, color: 'black', blur: 8, offsetX: 3, offsetY: -4 };
    drawDropShadow(ctx as unknown as CanvasRenderingContext2D, { ...shadow, dpr: 2 });
    expect([ctx.shadowBlur, ctx.shadowOffsetX, ctx.shadowOffsetY]).toEqual([16, 6, -8]);
    drawDropShadow(ctx as unknown as CanvasRenderingContext2D, { ...shadow, dpr: 1 });
    expect([ctx.shadowBlur, ctx.shadowOffsetX, ctx.shadowOffsetY]).toEqual([8, 3, -4]);
  });

  it('uses physical-pixel sigma for an inner glow', () => {
    const blur = vi.spyOn(canvasBlur, 'drawWithCanvasBlur').mockReturnValue(true);
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
      canvas.getContext = vi.fn(() => createContext(canvas)) as unknown as HTMLCanvasElement['getContext'];
      return canvas;
    });
    const target = createContext({ width: 160, height: 80 } as HTMLCanvasElement);
    drawInnerGlow(target as unknown as CanvasRenderingContext2D, {
      path: {} as Path2D, width: 80, height: 40, color: 'white',
      blurRadius: 20, sigmaScale: 0.5, dpr: 2, alpha: 1,
      shapeKey: 'dpr-regression-inner-glow',
    });
    expect(blur).toHaveBeenCalledWith(expect.anything(), 20, expect.any(Function));
  });
  it('passes a device-pixel blur length for image content', () => {
    const draw = vi.spyOn(canvasDrawUtils, 'drawImageClipped').mockImplementation(() => {});
    const image = document.createElement('img');
    const layer = new ImageContentContainerMaterialLayer({ id: 'image', imageUrl: '/image', blurPx: 6 });
    const params = {
      state: VisualState.DEFAULT,
      path: {} as Path2D,
      width: 80,
      height: 40,
      dpr: 2,
      assets: { getImage: () => image },
      lerpState: (valueForState: (state: VisualState) => number) => valueForState(VisualState.DEFAULT),
    } as Parameters<NonNullable<typeof layer.drawCanvas>>[1];
    layer.drawCanvas!(createContext({ width: 160, height: 80 } as HTMLCanvasElement) as unknown as CanvasRenderingContext2D, params);
    expect(draw).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ blurPx: 12 }));
    params.dpr = 1;
    layer.drawCanvas!(createContext({ width: 80, height: 40 } as HTMLCanvasElement) as unknown as CanvasRenderingContext2D, params);
    expect(draw).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ blurPx: 6 }));
  });
});

describe('Safari clipped-image blur cache', () => {
  it('blurs a decoded image once across focus/alpha frames and invalidates on geometry change', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const image = document.createElement('img');
    const target = createContext({ width: 40, height: 20 } as HTMLCanvasElement);
    const offscreens: ReturnType<typeof createContext>[] = [];
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(tag => {
      if (tag !== 'canvas') {
        throw new Error(`Unexpected element: ${tag}`);
      }
      const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
      const context = createContext(canvas);
      canvas.getContext = vi.fn(() => context) as unknown as HTMLCanvasElement['getContext'];
      offscreens.push(context);
      return canvas;
    });
    const params = {
      image,
      path: {} as Path2D,
      width: 20,
      height: 10,
      blurPx: 2,
      alpha: 1,
    };

    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    drawImageClipped(target as unknown as CanvasRenderingContext2D, { ...params, alpha: 0.5 });

    expect(createElement).toHaveBeenCalledTimes(2); // cached image + blur working layer
    expect(offscreens[1].getImageData).toHaveBeenCalledOnce();
    expect(target.drawImage).toHaveBeenCalledTimes(2);
    expect(target.drawImage.mock.calls[0][0]).toBe(target.drawImage.mock.calls[1][0]);
    expect(target.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    expect(target.clip).toHaveBeenCalledTimes(2);

    drawImageClipped(target as unknown as CanvasRenderingContext2D, { ...params, width: 21 });
    expect(createElement).toHaveBeenCalledTimes(3);
    expect(offscreens[1].getImageData).toHaveBeenCalledTimes(2);
    expect(target.drawImage).toHaveBeenCalledTimes(3);
    expect(target.drawImage.mock.calls[2][0]).not.toBe(target.drawImage.mock.calls[0][0]);
  });

  it('retains an oversized blur as the sole cache entry instead of recomputing each frame', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const image = document.createElement('img');
    const target = createContext({ width: 2100, height: 2100 } as HTMLCanvasElement);
    const contexts: ReturnType<typeof createContext>[] = [];
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(() => {
      const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
      const context = createContext(canvas);
      canvas.getContext = vi.fn(() => context) as unknown as HTMLCanvasElement['getContext'];
      contexts.push(context);
      return canvas;
    });
    const params = { image, path: {} as Path2D, width: 1000, height: 1000, blurPx: 2, alpha: 1 };

    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    drawImageClipped(target as unknown as CanvasRenderingContext2D, { ...params, alpha: 0.5 });

    expect(createElement).toHaveBeenCalledTimes(2);
    expect(contexts[1].getImageData).toHaveBeenCalledOnce();
    expect(target.drawImage).toHaveBeenCalledTimes(2);
  });

  it('evicts old image keys even when their bitmaps are small', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const images = Array.from({ length: 9 }, () => document.createElement('img'));
    const target = createContext({ width: 10, height: 10 } as HTMLCanvasElement);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(() => {
      const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
      const context = createContext(canvas);
      canvas.getContext = vi.fn(() => context) as unknown as HTMLCanvasElement['getContext'];
      return canvas;
    });
    const params = { path: {} as Path2D, width: 10, height: 10, blurPx: 2, alpha: 1 };

    for (const image of images) {
      drawImageClipped(target as unknown as CanvasRenderingContext2D, { ...params, image });
    }
    // Nine small images exceed the eight-entry cap, so the first must blur again.
    expect(createElement).toHaveBeenCalledTimes(10);
    drawImageClipped(target as unknown as CanvasRenderingContext2D, { ...params, image: images[0] });
    expect(createElement).toHaveBeenCalledTimes(11);
  });

  it('does not cache an unreadable fallback and retries once the image can be blurred', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const image = document.createElement('img');
    const target = createContext({ width: 40, height: 20 } as HTMLCanvasElement);
    const contexts: ReturnType<typeof createContext>[] = [];
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(() => {
      const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
      const context = createContext(canvas);
      if (contexts.length < 2) {
        context.getImageData.mockImplementation(() => { throw new DOMException('tainted', 'SecurityError'); });
      }
      canvas.getContext = vi.fn(() => context) as unknown as HTMLCanvasElement['getContext'];
      contexts.push(context);
      return canvas;
    });
    const params = { image, path: {} as Path2D, width: 20, height: 10, blurPx: 2, alpha: 1 };

    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    image.crossOrigin = 'anonymous';
    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);

    expect(createElement).toHaveBeenCalledTimes(4);
    expect(target.drawImage).toHaveBeenCalledTimes(3);
    expect(target.drawImage.mock.calls[0][0]).toBe(image);
    expect(target.drawImage.mock.calls[1][0]).not.toBe(image);
    expect(target.drawImage.mock.calls[1][0]).toBe(target.drawImage.mock.calls[2][0]);
    expect(contexts[3].getImageData).toHaveBeenCalledOnce();
  });

  it('backs off unreadable cross-origin images without allocating canvases on every frame', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const image = document.createElement('img');
    const target = createContext({ width: 40, height: 20 } as HTMLCanvasElement);
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(() => {
      const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
      const context = createContext(canvas);
      context.getImageData.mockImplementation(() => { throw new DOMException('tainted', 'SecurityError'); });
      canvas.getContext = vi.fn(() => context) as unknown as HTMLCanvasElement['getContext'];
      return canvas;
    });
    const params = { image, path: {} as Path2D, width: 20, height: 10, blurPx: 2, alpha: 1 };

    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);

    expect(createElement).toHaveBeenCalledTimes(2);
    expect(target.drawImage).toHaveBeenCalledTimes(3);
    expect(target.drawImage.mock.calls[1][0]).toBe(image);
    expect(target.drawImage.mock.calls[2][0]).toBe(image);

    now.mockReturnValue(2_001);
    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    expect(createElement).toHaveBeenCalledTimes(4);
  });

  it('bounds retries when the working layer is unavailable without presenting a raw canvas as blurred', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const image = document.createElement('img');
    const target = createContext({ width: 40, height: 20 } as HTMLCanvasElement);
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    let created = 0;
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(() => {
      const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
      const context = createContext(canvas);
      canvas.getContext = vi.fn(() => ++created === 2 ? null : context) as unknown as HTMLCanvasElement['getContext'];
      return canvas;
    });
    const params = { image, path: {} as Path2D, width: 20, height: 10, blurPx: 2, alpha: 1 };

    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    expect(createElement).toHaveBeenCalledTimes(2);
    expect(target.drawImage).toHaveBeenCalledTimes(2);
    expect(target.drawImage.mock.calls[0][0]).toBe(image);
    expect(target.drawImage.mock.calls[1][0]).toBe(image);

    now.mockReturnValue(2_001);
    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    expect(createElement).toHaveBeenCalledTimes(4);
    expect(target.drawImage.mock.calls[2][0]).not.toBe(image);
  });

  it('bounds retries when a non-security readback failure persists', () => {
    setNativeCanvasFilterSupportForTesting(false);
    const image = document.createElement('img');
    const target = createContext({ width: 40, height: 20 } as HTMLCanvasElement);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(() => {
      const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
      const context = createContext(canvas);
      context.getImageData.mockImplementation(() => { throw new DOMException('not ready', 'InvalidStateError'); });
      canvas.getContext = vi.fn(() => context) as unknown as HTMLCanvasElement['getContext'];
      return canvas;
    });
    const params = { image, path: {} as Path2D, width: 20, height: 10, blurPx: 2, alpha: 1 };

    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);
    drawImageClipped(target as unknown as CanvasRenderingContext2D, params);

    expect(createElement).toHaveBeenCalledTimes(2);
    expect(target.drawImage.mock.calls[0][0]).toBe(image);
    expect(target.drawImage.mock.calls[1][0]).toBe(image);
  });
});
