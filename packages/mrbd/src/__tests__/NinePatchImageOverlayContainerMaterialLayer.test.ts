/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import {
  NinePatchImageOverlayContainerMaterialLayer,
  drawNinePatchImage,
  layoutNinePatchAxis,
  metadataForImage,
  parseNinePatchMetadata,
  type NinePatchMetadata,
} from '@wearables-ui-toolkit/foundation/material/layers/NinePatchImageOverlayContainerMaterialLayer';
import {
  CanvasRecorder,
  FakePath2D,
} from './helpers/canvasRecorder';

describe('NinePatchImageOverlayContainerMaterialLayer', () => {
  it('leaves clipping disabled unless requested', () => {
    const defaultLayer = new NinePatchImageOverlayContainerMaterialLayer({
      id: 'default',
      imageUrl: '/image.9.png',
    });
    const clippedLayer = new NinePatchImageOverlayContainerMaterialLayer({
      id: 'clipped',
      imageUrl: '/image.9.png',
      clipToShape: true,
    });

    expect(defaultLayer.clipsToShape).toBe(false);
    expect(clippedLayer.clipsToShape).toBe(true);
  });
});

function markerImage(
  width: number,
  height: number,
  horizontalMarkers: readonly number[],
  verticalMarkers: readonly number[],
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const x of horizontalMarkers) {
    data[x * 4 + 3] = 255;
  }
  for (const y of verticalMarkers) {
    data[(y * width) * 4 + 3] = 255;
  }
  return data;
}

describe('parseNinePatchMetadata', () => {
  it('reads multiple contiguous stretch regions in content coordinates', () => {
    const metadata = parseNinePatchMetadata(
      markerImage(8, 7, [2, 3, 5], [2, 4, 5]),
      8,
      7,
    );

    expect(metadata).toEqual({
      sourceWidth: 6,
      sourceHeight: 5,
      horizontalStretch: [
        { start: 1, end: 3 },
        { start: 4, end: 5 },
      ],
      verticalStretch: [
        { start: 1, end: 2 },
        { start: 3, end: 5 },
      ],
    });
  });

  it('rejects images missing either required stretch axis', () => {
    expect(
      parseNinePatchMetadata(markerImage(5, 5, [2], []), 5, 5),
    ).toBeNull();
    expect(
      parseNinePatchMetadata(markerImage(5, 5, [], [2]), 5, 5),
    ).toBeNull();
  });
});

describe('layoutNinePatchAxis', () => {
  it('preserves fixed runs and assigns remaining space to stretch runs', () => {
    expect(layoutNinePatchAxis(4, 10, [{ start: 1, end: 3 }])).toEqual([
      {
        sourceStart: 0,
        sourceSize: 1,
        destinationStart: 0,
        destinationSize: 1,
      },
      {
        sourceStart: 1,
        sourceSize: 2,
        destinationStart: 1,
        destinationSize: 8,
      },
      {
        sourceStart: 3,
        sourceSize: 1,
        destinationStart: 9,
        destinationSize: 1,
      },
    ]);
  });

  it('shrinks fixed runs proportionally when the destination is undersized', () => {
    expect(layoutNinePatchAxis(10, 4, [{ start: 4, end: 6 }])).toEqual([
      {
        sourceStart: 0,
        sourceSize: 4,
        destinationStart: 0,
        destinationSize: 2,
      },
      {
        sourceStart: 4,
        sourceSize: 2,
        destinationStart: 2,
        destinationSize: 0,
      },
      {
        sourceStart: 6,
        sourceSize: 4,
        destinationStart: 2,
        destinationSize: 2,
      },
    ]);
  });

  it('preserves asymmetric fixed-run proportions at the destination boundary', () => {
    const [leading, stretch, trailing] = layoutNinePatchAxis(
      10,
      5,
      [{ start: 2, end: 5 }],
    );

    expect(stretch.destinationSize).toBe(0);
    expect(trailing.destinationSize / leading.destinationSize).toBeCloseTo(
      trailing.sourceSize / leading.sourceSize,
    );
    expect(leading.destinationStart + leading.destinationSize).toBeCloseTo(
      stretch.destinationStart,
    );
    expect(stretch.destinationStart + stretch.destinationSize).toBeCloseTo(
      trailing.destinationStart,
    );
    expect(trailing.destinationStart + trailing.destinationSize).toBe(5);
  });
});

describe('drawNinePatchImage', () => {
  it('draws nine source regions without the marker border', () => {
    const recorder = new CanvasRecorder();
    const image = {} as CanvasImageSource;
    const metadata: NinePatchMetadata = {
      sourceWidth: 4,
      sourceHeight: 4,
      horizontalStretch: [{ start: 1, end: 3 }],
      verticalStretch: [{ start: 1, end: 3 }],
    };

    drawNinePatchImage(
      recorder as unknown as CanvasRenderingContext2D,
      {
        path: new FakePath2D() as unknown as Path2D,
        image,
        metadata,
        width: 10,
        height: 8,
        alpha: 0.6,
        blend: 'screen',
      },
    );

    const draws = recorder.ofType('drawImage');
    expect(draws).toHaveLength(9);
    expect(draws[0].args).toEqual([image, 1, 1, 1, 1, 0, 0, 1, 1]);
    expect(draws[4].args).toEqual([image, 2, 2, 2, 2, 1, 1, 8, 6]);
    expect(draws[8].args).toEqual([image, 4, 4, 1, 1, 9, 7, 1, 1]);
    expect(draws[0].style?.globalAlpha).toBe(0.6);
    expect(draws[0].style?.globalCompositeOperation).toBe('screen');
    expect(recorder.ofType('clip')).toHaveLength(1);
  });

  it('draws all regions without clipping when no path is provided', () => {
    const recorder = new CanvasRecorder();

    drawNinePatchImage(
      recorder as unknown as CanvasRenderingContext2D,
      {
        image: {} as CanvasImageSource,
        metadata: {
          sourceWidth: 4,
          sourceHeight: 4,
          horizontalStretch: [{ start: 1, end: 3 }],
          verticalStretch: [{ start: 1, end: 3 }],
        },
        width: 10,
        height: 8,
        alpha: 1,
      },
    );

    expect(recorder.ofType('drawImage')).toHaveLength(9);
    expect(recorder.ofType('clip')).toHaveLength(0);
  });

  it('does not draw when fully transparent', () => {
    const recorder = new CanvasRecorder();

    drawNinePatchImage(
      recorder as unknown as CanvasRenderingContext2D,
      {
        image: {} as CanvasImageSource,
        metadata: {
          sourceWidth: 4,
          sourceHeight: 4,
          horizontalStretch: [{ start: 1, end: 3 }],
          verticalStretch: [{ start: 1, end: 3 }],
        },
        width: 10,
        height: 8,
        alpha: 0,
      },
    );

    expect(recorder.ofType('drawImage')).toHaveLength(0);
  });
});

describe('metadataForImage', () => {
  it('retries an image after its intrinsic dimensions become available', () => {
    const image = {
      naturalWidth: 0,
      naturalHeight: 0,
      width: 100,
      height: 100,
    };
    expect(metadataForImage(image as unknown as CanvasImageSource)).toBeNull();

    image.naturalWidth = 5;
    image.naturalHeight = 5;
    const context = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: markerImage(5, 5, [2], [2]),
      })),
    };
    const createElement = vi.spyOn(document, 'createElement')
      .mockReturnValue({
        getContext: () => context,
        width: 0,
        height: 0,
      } as unknown as HTMLCanvasElement);

    try {
      expect(metadataForImage(image as unknown as CanvasImageSource)).toEqual({
        sourceWidth: 3,
        sourceHeight: 3,
        horizontalStretch: [{ start: 1, end: 2 }],
        verticalStretch: [{ start: 1, end: 2 }],
      });
      expect(context.drawImage).toHaveBeenCalledWith(image, 0, 0);
    } finally {
      createElement.mockRestore();
    }
  });

  it('retries when the marker canvas context is temporarily unavailable', () => {
    const image = { naturalWidth: 5, naturalHeight: 5 };
    const context = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: markerImage(5, 5, [2], [2]),
      })),
    };
    const createElement = vi.spyOn(document, 'createElement')
      .mockReturnValueOnce({
        getContext: () => null,
        width: 0,
        height: 0,
      } as unknown as HTMLCanvasElement)
      .mockReturnValueOnce({
        getContext: () => context,
        width: 0,
        height: 0,
      } as unknown as HTMLCanvasElement);

    try {
      expect(metadataForImage(image as unknown as CanvasImageSource)).toBeNull();
      expect(metadataForImage(image as unknown as CanvasImageSource)).toEqual({
        sourceWidth: 3,
        sourceHeight: 3,
        horizontalStretch: [{ start: 1, end: 2 }],
        verticalStretch: [{ start: 1, end: 2 }],
      });
    } finally {
      createElement.mockRestore();
    }
  });
});
