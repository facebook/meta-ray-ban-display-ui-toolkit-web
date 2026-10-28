/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRef, type ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { ContainerFrame } from '../../../foundation/src/components/private/ContainerFrame';
import { ContainerMaterialCanvas } from '../../../foundation/src/components/private/ContainerMaterialCanvas';
import { ZERO_PARTIAL_FOCUS_POSITION } from '../../../foundation/src/components/private/useContainerPartialFocusFeedback';
import {
  LayerPlacement,
  createLayer,
  type MaterialLayer,
} from '@wearables-ui-toolkit/foundation';
import { defaultShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

const smoothPath = 'M 0 0 H 120 V 80 H 0 Z';

function renderFrame(overrides: Partial<ComponentProps<typeof ContainerFrame>> = {}) {
  return render(
    <ContainerFrame
      backgroundLayers={[]}
      foregroundLayers={[]}
      foregroundBlendsWithContent={false}
      backgroundBlendsWithBackdrop={false}
      effectiveVisualState={VisualState.DEFAULT}
      activeMaterialTransition={null}
      isMaterialTransitionControlled={false}
      animated
      effectiveUseSmoothCorners
      smoothCornerPath={smoothPath}
      cssSmoothCornerClipPath={`path("${smoothPath}")`}
      clipPathId="container-clip"
      insetClipPathId="container-inset-clip"
      insetSmoothCornerPath={null}
      materialLayerPositionStyle={{ borderRadius: undefined }}
      hasInset={false}
      contentRef={() => {}}
      contentClip="shape"
      fillWidth
      fillHeight
      contentStyle={{ padding: '4px 12px' }}
      contentClassName="frame-content"
      layerPathD={smoothPath}
      layerW={120}
      layerH={80}
      idPrefix="container-clip"
      shapeContext={{ shapeProvider: defaultShapeProvider }}
      partialFocusPosition={ZERO_PARTIAL_FOCUS_POSITION}
      interactionTransition={{ duration: 300, interpolator: 'ease' }}
      {...overrides}
    >
      <span>Content</span>
    </ContainerFrame>,
  );
}

describe('ContainerFrame', () => {
  it('renders background content and foreground in draw order', () => {
    const { container } = renderFrame();
    const background = container.querySelector('[class*="backgroundLayers"]')!;
    const surface = screen.getByText('Content').parentElement!;
    const foreground = container.querySelector('[class*="foregroundLayers"]')!;

    expect(background.nextElementSibling).toBe(surface);
    expect(surface.nextElementSibling).toBe(foreground);
    expect(surface.parentElement).toBe(background.parentElement);
    expect(surface).toHaveAttribute('data-uit-content-surface');
    expect(container.querySelectorAll('[data-uit-content-surface]')).toHaveLength(1);
  });

  it('creates smooth corner clip defs when smooth corners are enabled', () => {
    const { container } = renderFrame();

    expect(container.querySelector('clipPath#container-clip')).not.toBeNull();
    expect(container.querySelector('path')?.getAttribute('d')).toBe(smoothPath);
  });

  it('hides smooth corner clip definitions from accessibility APIs', () => {
    const { container } = renderFrame();
    const clipDefinition = container.querySelector('svg');

    expect(clipDefinition).toHaveAttribute('aria-hidden', 'true');
    expect(clipDefinition).toHaveAttribute('focusable', 'false');
  });

  it.each(['shape', 'bounds', 'none'] as const)('uses one normal-flow border-box surface in %s mode', (contentClip) => {
    const contentRef = createRef<HTMLDivElement>();
    const { container } = renderFrame({ contentClip, contentRef });
    const surface = screen.getByText('Content').parentElement!;

    expect(contentRef.current).toBe(surface);
    expect(surface).toHaveClass('frame-content');
    expect(surface.parentElement).toBe(container);
    expect(surface).toHaveStyle({ position: 'relative', boxSizing: 'border-box', width: '100%', height: '100%', padding: '4px 12px', margin: '0px' });
    expect(surface.style.clipPath).toBe(contentClip === 'shape' ? `path("${smoothPath}")` : '');
    expect(surface.style.borderRadius).toBe('0px');
    expect(surface.style.overflow).toBe(contentClip === 'none' ? 'visible' : 'hidden');
    expect(surface.hasAttribute('data-uit-content-clip')).toBe(contentClip !== 'none');
    expect(container.querySelectorAll('[data-uit-content-surface]')).toHaveLength(1);
  });

  it.each([[true, false], [false, true], [false, false]])('fills only requested axes: width=%s height=%s', (fillWidth, fillHeight) => {
    renderFrame({ fillWidth, fillHeight, contentStyle: { display: 'grid', gap: 8, padding: 12 } });
    const surface = screen.getByText('Content').parentElement!;

    expect(surface.style.width).toBe(fillWidth ? '100%' : 'auto');
    expect(surface.style.height).toBe(fillHeight ? '100%' : 'auto');
    expect(surface).toHaveStyle({ display: 'grid', gap: '8px', padding: '12px', margin: '0px' });
  });

  it.each([false, true])('paints sequential content-blended foreground canvases after the surface with backdrop blending=%s', (backgroundBlendsWithBackdrop) => {
    const { container } = renderFrame({
      foregroundBlendsWithContent: true,
      backgroundBlendsWithBackdrop,
      foregroundLayers: [canvasLayer('border', 'overlay'), canvasLayer('glow', 'hard-light')],
    });
    const surface = screen.getByText('Content').parentElement!;
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
    const surface = screen.getByText('Content').parentElement!;
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
});

function canvasLayer(
  id: string,
  blendMode?: GlobalCompositeOperation,
): MaterialLayer {
  return createLayer(id, LayerPlacement.FOREGROUND, undefined, {
    blendMode,
    drawCanvas: () => {},
  });
}

function renderMaterialCanvases(layers: MaterialLayer[]): string {
  return renderToStaticMarkup(
    <ContainerMaterialCanvas
      layers={layers}
      effectiveVisualState={VisualState.DEFAULT}
      activeMaterialTransition={null}
      isMaterialTransitionControlled={false}
      animated={false}
      effectiveUseSmoothCorners={false}
      layerPathD={smoothPath}
      layerW={120}
      layerH={80}
      idPrefix="material-canvas"
      shapeContext={{ shapeProvider: defaultShapeProvider }}
      partialFocusPosition={ZERO_PARTIAL_FOCUS_POSITION}
      interactionTransition={{ duration: 0, interpolator: 'linear' }}
      blendWithContent
    />,
  );
}

describe('ContainerMaterialCanvas content blending', () => {
  it('keeps sequential backdrop-blend layers on separate canvases', () => {
    const markup = renderMaterialCanvases([
      canvasLayer('source-over'),
      canvasLayer('idle-border', 'overlay'),
      canvasLayer('back-glow', 'hard-light'),
      canvasLayer('front-glow', 'hard-light'),
    ]);

    expect(markup.match(/<canvas/g)).toHaveLength(4);
    expect(markup.match(/mix-blend-mode:hard-light/g)).toHaveLength(2);
    const rendered = document.createElement('div');
    rendered.innerHTML = markup;
    expect(Array.from(rendered.querySelectorAll('canvas')).map(canvas => canvas.style.mixBlendMode)).toEqual(['', 'overlay', 'hard-light', 'hard-light']);
  });

  it('keeps Porter-Duff composition canvas-local', () => {
    const markup = renderMaterialCanvases([
      canvasLayer('source-over'),
      canvasLayer('mask', 'source-atop'),
    ]);

    expect(markup.match(/<canvas/g)).toHaveLength(1);
    expect(markup).not.toContain('mix-blend-mode:source-atop');
  });
});
