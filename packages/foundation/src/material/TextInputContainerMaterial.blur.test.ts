/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { VisualState } from '../base/Interactions';
import { ContainerMaterial } from './ContainerMaterial';
import { createTextInputContainerMaterial } from './TextInputContainerMaterial';
import * as canvasBlur from './canvas/CanvasBlur';

afterEach(() => vi.restoreAllMocks());

describe('text input idle shadow cache', () => {
  it('retries a failed blur and caches only the successful result', () => {
    const blur = vi.spyOn(canvasBlur, 'drawWithCanvasBlur')
      .mockReturnValueOnce(false)
      .mockReturnValue(true);
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const context = {
      canvas: { width: 100, height: 50 },
      save: vi.fn(),
      restore: vi.fn(),
      clip: vi.fn(),
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      stroke: vi.fn(),
    };
    const create = vi.spyOn(document, 'createElement').mockImplementation(tag => {
      if (tag !== 'canvas') throw new Error(`Unexpected ${tag}`);
      return { width: 0, height: 0, getContext: () => context } as unknown as HTMLCanvasElement;
    });
    const material = createTextInputContainerMaterial(() => new ContainerMaterial({ layers: [] }));
    const layer = material.getBackgroundLayers().find(item => item.id === 'text-input-idle-shadow');
    expect(layer?.drawCanvas).toBeDefined();
    const path = {} as Path2D;
    const params = {
      state: VisualState.DEFAULT,
      width: 50,
      height: 20,
      dpr: 1,
      path,
      lerpState: (valueForState: (state: VisualState) => number) => valueForState(VisualState.DEFAULT),
    };
    const paint = () => layer!.drawCanvas!(
      context as unknown as CanvasRenderingContext2D,
      params as Parameters<NonNullable<typeof layer.drawCanvas>>[1],
    );

    paint();
    paint();
    expect(blur).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledTimes(2);
    expect(context.drawImage).toHaveBeenCalledTimes(3);
    expect(context.shadowBlur).toBe(8);
    expect(context.drawImage.mock.calls[0][1]).toBeGreaterThan(0);
    expect(context.drawImage.mock.calls[1][0]).toBe(context.drawImage.mock.calls[2][0]);
    now.mockReturnValue(2_001);
    paint();
    paint();

    expect(blur).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledTimes(4);
    expect(context.drawImage).toHaveBeenCalledTimes(5);
    expect(context.drawImage.mock.calls[3][0]).toBe(context.drawImage.mock.calls[4][0]);
    expect(context.drawImage.mock.calls[3][0]).not.toBe(context.drawImage.mock.calls[1][0]);
  });

  it('invalidates a failed fallback immediately when geometry changes', () => {
    const blur = vi.spyOn(canvasBlur, 'drawWithCanvasBlur').mockReturnValue(false);
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const context = {
      canvas: { width: 100, height: 50 },
      save: vi.fn(), restore: vi.fn(), clip: vi.fn(), drawImage: vi.fn(),
      clearRect: vi.fn(), setTransform: vi.fn(),
      scale: vi.fn(), translate: vi.fn(), stroke: vi.fn(),
    };
    const create = vi.spyOn(document, 'createElement').mockImplementation(() => ({
      width: 0, height: 0, getContext: () => context,
    } as unknown as HTMLCanvasElement));
    const material = createTextInputContainerMaterial(() => new ContainerMaterial({ layers: [] }));
    const layer = material.getBackgroundLayers().find(item => item.id === 'text-input-idle-shadow');
    const params = {
      state: VisualState.DEFAULT, width: 50, height: 20, dpr: 1, path: {} as Path2D,
      lerpState: (valueForState: (state: VisualState) => number) => valueForState(VisualState.DEFAULT),
    };
    const paint = () => layer!.drawCanvas!(
      context as unknown as CanvasRenderingContext2D,
      params as Parameters<NonNullable<typeof layer.drawCanvas>>[1],
    );

    paint();
    paint();
    params.width = 51;
    paint();
    expect(blur).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledTimes(4);
    expect(context.drawImage).toHaveBeenCalledTimes(5);
    expect(context.drawImage.mock.calls.filter(([, x]) => x > 0)).toHaveLength(2);
  });
});
