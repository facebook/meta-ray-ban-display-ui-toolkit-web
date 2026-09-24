/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { ContainerFrame } from '@wearables-ui-toolkit/foundation/components/private/ContainerFrame';
import { ContainerMaterialCanvas } from '@wearables-ui-toolkit/foundation/components/private/ContainerMaterialCanvas';
import { ZERO_PARTIAL_FOCUS_POSITION } from '@wearables-ui-toolkit/foundation/components/private/useContainerPartialFocusFeedback';
import {
  LayerPlacement,
  createLayer,
  type MaterialLayer,
} from '@wearables-ui-toolkit/foundation';
import { defaultShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

const smoothPath = 'M 0 0 H 120 V 80 H 0 Z';

function renderFrame(overrides = {}) {
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
      clipContent
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

    expect(container.querySelector('[class*="backgroundLayers"]')).not.toBeNull();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(container.querySelector('[class*="foregroundLayers"]')).not.toBeNull();
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

  it('does not clip content when clipContent is false', () => {
    const { container } = renderFrame({ clipContent: false });
    const contentWrapper = container.querySelector('[class*="contentWrapper"]');

    expect(contentWrapper?.getAttribute('style')).not.toContain('clip-path');
    expect((contentWrapper as HTMLElement)?.style.overflow).toBe('visible');
  });

  it('keeps content-blended foreground layers in the container stacking context', () => {
    const { container } = renderFrame({ foregroundBlendsWithContent: true });
    const contentWrapper = container.querySelector<HTMLElement>('[class*="contentWrapper"]');
    const foregroundLayers = container.querySelector<HTMLElement>('[class*="foregroundLayers"]');

    expect(contentWrapper?.style.position).toBe('relative');
    expect(contentWrapper?.style.zIndex).toBe('');
    expect(foregroundLayers?.style.zIndex).toBe('auto');
  });

  it('keeps backdrop-blended background layers outside an intermediate stacking context', () => {
    const { container } = renderFrame({ backgroundBlendsWithBackdrop: true });
    const backgroundLayers = container.querySelector<HTMLElement>('[class*="backgroundLayers"]');
    const contentWrapper = container.querySelector<HTMLElement>('[class*="contentWrapper"]');
    const foregroundLayers = container.querySelector<HTMLElement>('[class*="foregroundLayers"]');

    expect(backgroundLayers?.style.isolation).toBe('auto');
    expect(backgroundLayers?.style.zIndex).toBe('auto');
    expect(contentWrapper?.style.position).toBe('relative');
    expect(contentWrapper?.style.zIndex).toBe('1');
    expect(foregroundLayers?.style.zIndex).toBe('2');
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
