/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StrictMode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation';
import { WebAppIcon } from '../mrbd/ui/WebAppIcon';
import { createWebAppIconMaterial } from '../mrbd/ui/WebAppIconMaterial';
import { WebAppIconArtworkContainerMaterialLayer } from '../mrbd/ui/private/WebAppIconArtworkContainerMaterialLayer';
import { createWebAppIconTokenScale } from '../mrbd/ui/private/WebAppIconColor';
import {
  CanvasRecorder,
  FakePath2D,
  drawLayer,
  installOffscreenCanvasStub,
} from './helpers/canvasRecorder';

class FakeImage {
  static instances: FakeImage[] = [];

  complete = false;
  crossOrigin: string | null = null;
  naturalHeight = 64;
  naturalWidth = 64;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  private source = '';

  constructor() {
    FakeImage.instances.push(this);
  }

  get src(): string {
    return this.source;
  }

  set src(value: string) {
    this.source = value;
  }
}

function radialStopsFor(iconMaterial: ReturnType<typeof createWebAppIconMaterial>) {
  const layer = iconMaterial.material
    .getBackgroundLayers()
    .find(candidate => candidate.id === 'web-app-icon-idle-material');
  return drawLayer(layer!, { state: VisualState.DEFAULT }).gradients
    .find(gradient => gradient.kind === 'radial')?.stops;
}

function hexLuminance(color: string): number {
  const values = [1, 3, 5].map(index => Number.parseInt(color.slice(index, index + 2), 16));
  const components = values.map(value => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return components[0] * 0.2126 + components[1] * 0.7152 + components[2] * 0.0722;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  FakeImage.instances = [];
});

describe('createWebAppIconMaterial', () => {
  it('uses the standard fallback palette without valid artwork appearance', () => {
    const rendering = createWebAppIconMaterial();

    expect(rendering.isFallback).toBe(true);
    expect(radialStopsFor(rendering)).toEqual([
      { offset: 0, color: '#7F93B5' },
      { offset: 1 / 3, color: '#495E84' },
      { offset: 2 / 3, color: '#27344A' },
      { offset: 1, color: '#181F2D' },
    ]);
    expect(rendering.shapeProvider.getCssBorderRadius?.()).toBe('32px');
    expect(rendering.material.getForegroundLayers().map(layer => layer.id)).toEqual([
      'web-app-icon-partial-focus-lighting',
      'web-app-icon-artwork',
    ]);
  });

  it('treats empty artwork sources as fallback', () => {
    expect(createWebAppIconMaterial({
      iconSrc: '',
      themeColor: '#DC739A',
    }).isFallback).toBe(true);
    expect(createWebAppIconMaterial({
      iconSrc: '   ',
      themeColor: '#DC739A',
    }).isFallback).toBe(true);
  });

  it('derives a contrast-targeted four-stop palette from a theme color', () => {
    const themeColor = '#DC739A';
    const rendering = createWebAppIconMaterial({
      iconSrc: 'icon.svg',
      themeColor,
    });

    expect(rendering.isFallback).toBe(false);
    expect(radialStopsFor(rendering)).toEqual(
      createWebAppIconTokenScale(themeColor, [700, 950, 1100, 1100]).map(
        (color, index) => ({ offset: [0, 0.33, 0.66, 1][index], color }),
      ),
    );
  });

  it('uses explicit radial colors and discards mismatched stops', () => {
    const rendering = createWebAppIconMaterial({
      iconSrc: 'icon.svg',
      radialColors: ['#88CB12', '#4C8101', '#122402'],
      radialStops: [0, 1],
    });

    expect(rendering.isFallback).toBe(false);
    expect(radialStopsFor(rendering)).toEqual([
      { offset: 0, color: '#88CB12' },
      { offset: 0.5, color: '#4C8101' },
      { offset: 1, color: '#122402' },
    ]);
  });

  it('moves only the foreground light with partial focus', () => {
    const rendering = createWebAppIconMaterial({
      iconSrc: 'icon.svg',
      themeColor: '#5160FF',
    });
    const layers = [
      ...rendering.material.getBackgroundLayers(),
      ...rendering.material.getForegroundLayers(),
    ];
    const focusLight = layers.find(
      layer => layer.id === 'web-app-icon-partial-focus-lighting',
    );

    expect(focusLight?.supportsDiscretePartialFocus).toBe(true);
    expect(
      layers
        .filter(layer => layer !== focusLight)
        .every(layer => !layer.supportsDiscretePartialFocus),
    ).toBe(true);
  });

  it('omits partial-focus lighting when disabled', () => {
    const rendering = createWebAppIconMaterial({
      iconSrc: 'icon.svg',
      themeColor: '#5160FF',
      partialFocusLighting: false,
    });

    expect(rendering.material.getForegroundLayers().map(layer => layer.id)).toEqual([
      'web-app-icon-artwork',
    ]);
    expect(
      rendering.material
        .getBackgroundLayers()
        .find(layer => layer.id === 'glow-stroke')
        ?.supportsDiscretePartialFocus,
    ).toBe(true);
  });

  it('hides the colored background in the none state', () => {
    const rendering = createWebAppIconMaterial();
    const layer = rendering.material
      .getBackgroundLayers()
      .find(candidate => candidate.id === 'web-app-icon-idle-material');

    expect(drawLayer(layer!, { state: VisualState.NONE }).paintOps).toHaveLength(0);
  });

  it('derives a lighter artwork highlight from the effect color', () => {
    const effectColor = '#DC739A';
    const highlight = createWebAppIconTokenScale(effectColor, [150])[0];

    expect(hexLuminance(highlight)).toBeGreaterThan(hexLuminance(effectColor));
  });
});

describe('WebAppIconArtworkContainerMaterialLayer', () => {
  it('renders and caches monochrome artwork with room for its shadow', () => {
    const offscreenRecorders: CanvasRecorder[] = [];
    const restore = installOffscreenCanvasStub(recorder => offscreenRecorders.push(recorder));
    const image = { naturalWidth: 32, naturalHeight: 16 } as CanvasImageSource;
    const layer = new WebAppIconArtworkContainerMaterialLayer({
      iconSrc: 'monochrome.svg',
      effectColor: '#DC739A',
    });

    try {
      const first = drawLayer(layer, {
        width: 112,
        height: 112,
        getImage: () => image,
      });
      const firstContextCount = offscreenRecorders.length;
      const second = drawLayer(layer, {
        width: 112,
        height: 112,
        getImage: () => image,
      });

      expect(first.ofType('drawImage').at(-1)?.args.slice(5)).toEqual([8, 8, 96, 96]);
      expect(second.ofType('drawImage').at(-1)?.args.slice(5)).toEqual([8, 8, 96, 96]);
      expect(firstContextCount).toBe(7);
      expect(offscreenRecorders[6].ofType('drawImage')).toHaveLength(4);
      expect(offscreenRecorders[1].ofType('drawImage')[0]?.style?.globalAlpha).toBe(0.35);
      expect(offscreenRecorders).toHaveLength(firstContextCount);
      expect(
        offscreenRecorders.some(recorder =>
          recorder.ofType('fillRect').some(operation =>
            operation.style?.fillStyle === '#000000' &&
            operation.style.globalCompositeOperation === 'source-in',
          ),
        ),
      ).toBe(true);
      expect(
        offscreenRecorders.some(recorder =>
          recorder.paintOps.some(operation => operation.style?.filter === 'blur(3.42857px)'),
        ),
      ).toBe(true);
      expect(
        offscreenRecorders.some(recorder =>
          recorder.gradients.some(gradient => gradient.kind === 'linear'),
        ),
      ).toBe(true);
    } finally {
      restore();
    }
  });

  it('keeps the artwork centered when the backing store rounds up', () => {
    const offscreenRecorders: CanvasRecorder[] = [];
    const restore = installOffscreenCanvasStub(recorder => offscreenRecorders.push(recorder));
    const image = { naturalWidth: 64, naturalHeight: 64 } as CanvasImageSource;
    const layer = new WebAppIconArtworkContainerMaterialLayer({
      iconSrc: 'fractional-dpr.svg',
      effectColor: '#DC739A',
    });

    try {
      // 72px bounds: the padded canvas is a fractional number of CSS pixels, so
      // its device-pixel backing store rounds up. Reverse-computing the draw
      // size from that store overshoots and de-centers the artwork.
      const recorder = drawLayer(layer, {
        width: 72,
        height: 72,
        dpr: 1.5,
        getImage: () => image,
      });

      const draw = recorder.ofType('drawImage').at(-1);
      const [left, top, drawWidth, drawHeight] = draw?.args.slice(5) as number[];

      // The intended padded size in CSS pixels, independent of any rounding.
      const artworkSize = 72 * (64 / 112);
      const renderPadding = Math.max(16, 3.42857 + 3.42857, 4.57143 + 3.42857) *
        (artworkSize / 64);
      const expectedSize = artworkSize + renderPadding * 2;

      expect(drawWidth).toBeCloseTo(expectedSize, 6);
      expect(drawHeight).toBeCloseTo(expectedSize, 6);
      expect(left).toBeCloseTo((72 - expectedSize) / 2, 6);
      expect(top).toBeCloseTo((72 - expectedSize) / 2, 6);
    } finally {
      restore();
    }
  });

  it('scales artwork and effect geometry with material bounds', () => {
    const offscreenRecorders: CanvasRecorder[] = [];
    const restore = installOffscreenCanvasStub(recorder => offscreenRecorders.push(recorder));
    const image = { naturalWidth: 64, naturalHeight: 64 } as CanvasImageSource;
    const layer = new WebAppIconArtworkContainerMaterialLayer({
      iconSrc: 'responsive.svg',
      effectColor: '#DC739A',
    });

    try {
      const small = drawLayer(layer, {
        width: 56,
        height: 84,
        getImage: () => image,
      });
      const smallContextCount = offscreenRecorders.length;
      const large = drawLayer(layer, {
        width: 224,
        height: 280,
        getImage: () => image,
      });
      const smallBounds = small.ofType('drawImage').at(-1)?.args.slice(5) as number[];
      const largeBounds = large.ofType('drawImage').at(-1)?.args.slice(5) as number[];

      expect(smallBounds[0]).toBeCloseTo(4);
      expect(smallBounds[1]).toBeCloseTo(18);
      expect(smallBounds[2]).toBeCloseTo(48);
      expect(smallBounds[3]).toBeCloseTo(48);
      expect(largeBounds[0]).toBeCloseTo(16);
      expect(largeBounds[1]).toBeCloseTo(44);
      expect(largeBounds[2]).toBeCloseTo(192);
      expect(largeBounds[3]).toBeCloseTo(192);
      expect(offscreenRecorders).toHaveLength(smallContextCount * 2);
      expect(
        offscreenRecorders.some(recorder =>
          recorder.paintOps.some(operation => operation.style?.filter === 'blur(1.714285px)'),
        ),
      ).toBe(true);
      expect(
        offscreenRecorders.some(recorder =>
          recorder.paintOps.some(operation => operation.style?.filter === 'blur(6.85714px)'),
        ),
      ).toBe(true);
    } finally {
      restore();
    }
  });

  it('scales blur radii into device pixels on high-density canvases', () => {
    const offscreenRecorders: CanvasRecorder[] = [];
    const restore = installOffscreenCanvasStub(recorder => offscreenRecorders.push(recorder));
    const layer = new WebAppIconArtworkContainerMaterialLayer({
      iconSrc: 'dense.svg',
      effectColor: '#DC739A',
    });

    try {
      drawLayer(layer, {
        width: 112,
        height: 112,
        dpr: 2,
        getImage: () => ({ naturalWidth: 64, naturalHeight: 64 }) as CanvasImageSource,
      });

      expect(
        offscreenRecorders.some(recorder =>
          recorder.paintOps.some(operation => operation.style?.filter === 'blur(6.85714px)'),
        ),
      ).toBe(true);
      expect(
        offscreenRecorders.some(recorder =>
          recorder.paintOps.some(operation => operation.style?.filter === 'blur(32px)'),
        ),
      ).toBe(true);
    } finally {
      restore();
    }
  });
});

describe('WebAppIcon', () => {
  let restoreCanvas: () => void;

  beforeEach(() => {
    vi.stubGlobal('Path2D', FakePath2D);
    restoreCanvas = installOffscreenCanvasStub();
  });

  afterEach(() => {
    restoreCanvas();
  });

  it('is decorative by default and labels standalone identity', () => {
    const { rerender } = render(<WebAppIcon data-testid="icon" />);

    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
    rerender(<WebAppIcon data-testid="icon" aria-label="Trail guide" />);
    expect(screen.getByTestId('icon')).toHaveAttribute('role', 'img');
    expect(screen.getByTestId('icon')).toHaveAccessibleName('Trail guide');
  });

  it('preserves caller-provided accessibility semantics', () => {
    const { rerender } = render(
      <>
        <span id="icon-label">Trail guide</span>
        <WebAppIcon data-testid="icon" aria-labelledby="icon-label" />
      </>,
    );

    expect(screen.getByTestId('icon')).toHaveAttribute('role', 'img');
    expect(screen.getByTestId('icon')).toHaveAccessibleName('Trail guide');
    expect(screen.getByTestId('icon')).not.toHaveAttribute('aria-hidden');

    rerender(<WebAppIcon data-testid="icon" aria-hidden={false} />);
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'false');

    rerender(<WebAppIcon data-testid="icon" role="button" />);
    expect(screen.getByTestId('icon')).toHaveAttribute('role', 'button');
    expect(screen.getByTestId('icon')).not.toHaveAttribute('aria-hidden');
  });

  it('scales the canonical material into smaller and larger bounds', () => {
    const { container, rerender } = render(
      <WebAppIcon data-testid="icon" width={87} height={91} />,
    );

    expect(screen.getByTestId('icon')).toHaveStyle({ width: '87px', height: '91px' });
    const materialContainer = container.querySelector<HTMLElement>('[class*="container"]');
    expect(materialContainer).toHaveStyle({
      left: '0px',
      top: '2px',
      transform: 'scale(0.7767857142857143)',
    });

    rerender(<WebAppIcon data-testid="icon" width={224} height={168} />);
    expect(screen.getByTestId('icon')).toHaveStyle({ width: '224px', height: '168px' });
    expect(materialContainer).toHaveStyle({
      left: '28px',
      top: '0px',
      transform: 'scale(1.5)',
    });
  });

  it('keeps fallback until custom artwork loads', async () => {
    vi.stubGlobal('Image', FakeImage as unknown as typeof Image);
    const callbackFallbackStates: Array<string | null> = [];
    const onIconReady = vi.fn(() => {
      callbackFallbackStates.push(
        screen.getByTestId('icon').getAttribute('data-web-app-icon-fallback'),
      );
    });
    render(
      <WebAppIcon
        data-testid="icon"
        iconSrc="custom.svg"
        themeColor="#DC739A"
        onIconReady={onIconReady}
      />,
    );
    const customLoad = FakeImage.instances.find(image => image.src === 'custom.svg');

    expect(screen.getByTestId('icon')).toHaveAttribute('data-web-app-icon-fallback', 'true');
    act(() => customLoad?.onload?.());

    await waitFor(() => {
      expect(screen.getByTestId('icon')).toHaveAttribute('data-web-app-icon-fallback', 'false');
    });
    expect(onIconReady).toHaveBeenCalledWith(true);
    expect(callbackFallbackStates).toEqual(['false']);
    expect(FakeImage.instances.filter(image => image.src === 'custom.svg')).toHaveLength(1);
  });

  it('retries the same source when its appearance request changes', async () => {
    vi.stubGlobal('Image', FakeImage as unknown as typeof Image);
    const onIconReady = vi.fn();
    const { rerender } = render(
      <WebAppIcon
        data-testid="icon"
        iconSrc="retry.svg"
        themeColor="#DC739A"
        onIconReady={onIconReady}
      />,
    );
    const firstLoad = FakeImage.instances.find(image => image.src === 'retry.svg');
    act(() => firstLoad?.onerror?.());
    await waitFor(() => expect(onIconReady).toHaveBeenCalledWith(false));

    rerender(
      <WebAppIcon
        data-testid="icon"
        iconSrc="retry.svg"
        themeColor="#5160FF"
        onIconReady={onIconReady}
      />,
    );
    const retryLoads = FakeImage.instances.filter(image => image.src === 'retry.svg');
    expect(retryLoads).toHaveLength(2);
    act(() => retryLoads[1]?.onload?.());

    await waitFor(() => {
      expect(screen.getByTestId('icon')).toHaveAttribute('data-web-app-icon-fallback', 'false');
    });
    expect(onIconReady).toHaveBeenLastCalledWith(true);
  });

  it('reuses resolved artwork while appearance props change', async () => {
    vi.stubGlobal('Image', FakeImage as unknown as typeof Image);
    const onIconReady = vi.fn();
    const { rerender } = render(
      <WebAppIcon
        data-testid="icon"
        iconSrc="stable.svg"
        themeColor="#DC739A"
        onIconReady={onIconReady}
      />,
    );
    const image = FakeImage.instances.find(candidate => candidate.src === 'stable.svg');
    act(() => image?.onload?.());
    await waitFor(() => {
      expect(screen.getByTestId('icon')).toHaveAttribute('data-web-app-icon-fallback', 'false');
    });

    rerender(
      <WebAppIcon
        data-testid="icon"
        iconSrc="stable.svg"
        themeColor="#5160FF"
        onIconReady={onIconReady}
      />,
    );

    expect(screen.getByTestId('icon')).toHaveAttribute('data-web-app-icon-fallback', 'false');
    expect(FakeImage.instances.filter(candidate => candidate.src === 'stable.svg')).toHaveLength(1);
    await waitFor(() => expect(onIconReady).toHaveBeenCalledTimes(2));
    expect(onIconReady).toHaveBeenLastCalledWith(true);
  });

  it('reports one fallback result under Strict Mode effect replay', () => {
    const onIconReady = vi.fn();

    render(
      <StrictMode>
        <WebAppIcon onIconReady={onIconReady} />
      </StrictMode>,
    );

    expect(onIconReady).toHaveBeenCalledOnce();
    expect(onIconReady).toHaveBeenCalledWith(false);
  });

  it('ignores a stale image completion after the source changes', async () => {
    vi.stubGlobal('Image', FakeImage as unknown as typeof Image);
    const { rerender } = render(
      <WebAppIcon data-testid="icon" iconSrc="first.svg" themeColor="#DC739A" />,
    );
    const firstLoad = FakeImage.instances.find(image => image.src === 'first.svg');

    rerender(
      <WebAppIcon data-testid="icon" iconSrc="second.svg" themeColor="#DC739A" />,
    );
    const secondLoad = FakeImage.instances.find(image => image.src === 'second.svg');
    act(() => firstLoad?.onload?.());
    expect(screen.getByTestId('icon')).toHaveAttribute('data-web-app-icon-fallback', 'true');

    act(() => secondLoad?.onload?.());
    await waitFor(() => {
      expect(screen.getByTestId('icon')).toHaveAttribute('data-web-app-icon-fallback', 'false');
    });
  });

  it('does not request custom artwork without valid appearance colors', () => {
    vi.stubGlobal('Image', FakeImage as unknown as typeof Image);
    const onIconReady = vi.fn();
    render(
      <WebAppIcon
        data-testid="icon"
        iconSrc="custom.svg"
        onIconReady={onIconReady}
      />,
    );

    expect(FakeImage.instances.some(image => image.src === 'custom.svg')).toBe(false);
    expect(screen.getByTestId('icon')).toHaveAttribute('data-web-app-icon-fallback', 'true');
    expect(onIconReady).toHaveBeenCalledWith(false);
  });
});
