/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRef, type ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { StaticContainerFrame } from '../../../foundation/src/components/private/StaticContainerFrame';
import { LayerPlacement, createLayer } from '@wearables-ui-toolkit/foundation';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { defaultShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

const smoothPath = 'M 0 0 H 120 V 48 H 0 Z';

function renderFrame(overrides: Partial<ComponentProps<typeof StaticContainerFrame>> = {}) {
  const material = MaterialLibrary.defaultStatic();

  return render(
    <StaticContainerFrame
      containerRef={() => {}}
      contentRef={() => {}}
      backgroundLayerRef={() => {}}
      foregroundLayerRef={() => {}}
      className="custom-static"
      containerStyle={{ position: 'relative', width: 120, height: 48, padding: 0, borderWidth: 0, boxSizing: 'border-box', overflow: 'visible' }}
      effectiveUseSmoothCorners
      smoothCornerPath={smoothPath}
      materialShapePath={smoothPath}
      contentClip="shape"
      fillWidth
      fillHeight
      contentStyle={{ padding: '4px 12px' }}
      contentClassName="static-frame-content"
      backgroundLayers={material.getBackgroundLayers()}
      foregroundLayers={material.getForegroundLayers()}
      visualState={VisualState.DEFAULT}
      containerW={120}
      containerH={48}
      shapeContext={{ shapeProvider: defaultShapeProvider }}
      idPrefix="static-clip"
      backgroundLayerStyle={{}}
      foregroundLayerStyle={{}}
      foregroundBlendsWithContent={false}
      backgroundBlendsWithBackdrop={false}
      {...overrides}
    >
      <span>Static content</span>
    </StaticContainerFrame>,
  );
}

describe('StaticContainerFrame', () => {
  it('renders static content between material layers', () => {
    const { container } = renderFrame({
      rootProps: { role: 'status', 'aria-label': 'Chip' },
    });
    const root = screen.getByRole('status', { name: 'Chip' });
    const background = container.querySelector('[class*="backgroundLayers"]')!;
    const surface = screen.getByText('Static content').parentElement!;
    const foreground = container.querySelector('[class*="foregroundLayers"]')!;

    expect(background.parentElement).toBe(root);
    expect(background.nextElementSibling).toBe(surface);
    expect(surface.nextElementSibling).toBe(foreground);
    expect(surface.parentElement).toBe(root);
    expect(root.querySelectorAll('[data-uit-content-surface]')).toHaveLength(1);
  });

  it('clips only the content surface at the container shape edge', () => {
    const contentRef = createRef<HTMLDivElement>();
    const { container } = renderFrame({ contentRef });
    const root = container.firstElementChild as HTMLElement;
    const background = container.querySelector<HTMLElement>('[class*="backgroundLayers"]')!;
    const surface = screen.getByText('Static content').parentElement!;
    const foreground = container.querySelector<HTMLElement>('[class*="foregroundLayers"]')!;

    expect(container.querySelector('clipPath')).toBeNull();
    expect(root.style.clipPath).toBe('');
    expect(root).toHaveStyle({ padding: '0px', borderWidth: '0px', overflow: 'visible' });
    expect(contentRef.current).toBe(surface);
    expect(surface).toHaveClass('static-frame-content');
    expect(surface.parentElement).toBe(root);
    expect(surface.style.clipPath).toBe(`path('${smoothPath}')`);
    expect(surface.style.borderRadius).toBe('0px');
    expect(surface).toHaveStyle({ overflow: 'hidden', boxSizing: 'border-box', width: '100%', height: '100%', padding: '4px 12px', margin: '0px' });
    expect(background.style.clipPath).toBe('');
    expect(foreground.style.clipPath).toBe('');
  });

  it.each(['bounds', 'none'] as const)('keeps the normal-flow surface without a shape clip in %s mode', (contentClip) => {
    const { container } = renderFrame({ contentClip });
    const root = container.firstElementChild as HTMLElement;
    const surface = screen.getByText('Static content').parentElement!;

    expect(root.style.clipPath).toBe('');
    expect(surface.parentElement).toBe(root);
    expect(surface.style.clipPath).toBe('');
    expect(surface.style.borderRadius).toBe('0px');
    expect(surface.style.overflow).toBe(contentClip === 'none' ? 'visible' : 'hidden');
    expect(surface.hasAttribute('data-uit-content-clip')).toBe(contentClip !== 'none');
    expect(surface).toHaveStyle({ width: '100%', height: '100%', padding: '4px 12px', margin: '0px' });
  });

  it.each([[true, false], [false, true], [false, false]])('fills only requested axes: width=%s height=%s', (fillWidth, fillHeight) => {
    renderFrame({ fillWidth, fillHeight, contentStyle: { display: 'flex', gap: 8, padding: 12 } });
    const surface = screen.getByText('Static content').parentElement!;

    expect(surface.style.width).toBe(fillWidth ? '100%' : 'auto');
    expect(surface.style.height).toBe(fillHeight ? '100%' : 'auto');
    expect(surface).toHaveStyle({ display: 'flex', gap: '8px', padding: '12px', margin: '0px' });
  });

  it.each([false, true])('paints sequential content-blended foreground canvases after the surface with backdrop blending=%s', (backgroundBlendsWithBackdrop) => {
    const { container } = renderFrame({
      foregroundBlendsWithContent: true,
      backgroundBlendsWithBackdrop,
      foregroundLayers: [
        createLayer('border', LayerPlacement.FOREGROUND, undefined, { blendMode: 'overlay', drawCanvas: () => {} }),
        createLayer('glow', LayerPlacement.FOREGROUND, undefined, { blendMode: 'hard-light', drawCanvas: () => {} }),
      ],
    });
    const surface = screen.getByText('Static content').parentElement!;
    const foreground = container.querySelector<HTMLElement>('[class*="foregroundLayers"]')!;

    expect(surface.style.position).toBe('relative');
    expect(surface.style.zIndex).toBe(backgroundBlendsWithBackdrop ? '1' : '');
    expect(foreground.style.zIndex).toBe('auto');
    expect(surface.nextElementSibling).toBe(foreground);
    expect(Array.from(foreground.querySelectorAll('canvas')).map(canvas => canvas.style.mixBlendMode)).toEqual(['overlay', 'hard-light']);
    expect(foreground.style.clipPath).toBe('');
  });

  it('keeps actual backdrop-blended material below content and ordinary foreground layers above it', () => {
    const { container } = renderFrame({
      backgroundBlendsWithBackdrop: true,
      backgroundLayers: [createLayer('backdrop', LayerPlacement.BACKGROUND, undefined, { blendMode: 'screen', drawCanvas: () => {} })],
      foregroundLayers: [createLayer('foreground', LayerPlacement.FOREGROUND, () => ({ backgroundColor: 'white' }))],
    });
    const background = container.querySelector<HTMLElement>('[class*="backgroundLayers"]')!;
    const surface = screen.getByText('Static content').parentElement!;
    const foreground = container.querySelector<HTMLElement>('[class*="foregroundLayers"]')!;

    expect(background.style.isolation).toBe('auto');
    expect(background.style.zIndex).toBe('auto');
    expect(background.querySelector('canvas')?.style.mixBlendMode).toBe('screen');
    expect(background.nextElementSibling).toBe(surface);
    expect(surface.style.position).toBe('relative');
    expect(surface.style.zIndex).toBe('1');
    expect(surface.nextElementSibling).toBe(foreground);
    expect(foreground.style.zIndex).toBe('2');
    expect(foreground.querySelector('[data-uit-material-layer="foreground"]')).not.toBeNull();
    expect(background.style.clipPath).toBe('');
    expect(foreground.style.clipPath).toBe('');
  });

  it('does not own resized material clip path animations', () => {
    const animate = vi.fn(() => ({
      cancel: vi.fn(),
    }) as unknown as Animation);
    const animateDescriptor = Object.getOwnPropertyDescriptor(
      Element.prototype,
      'animate',
    );

    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      value: animate,
    });

    try {
      renderFrame();

      expect(animate).not.toHaveBeenCalled();
    } finally {
      if (animateDescriptor != null) {
        Object.defineProperty(Element.prototype, 'animate', animateDescriptor);
      } else {
        Reflect.deleteProperty(Element.prototype, 'animate');
      }
    }
  });
});
