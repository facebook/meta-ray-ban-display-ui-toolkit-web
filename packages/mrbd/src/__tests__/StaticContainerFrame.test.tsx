/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { StaticContainerFrame } from '@wearables-ui-toolkit/foundation/components/private/StaticContainerFrame';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { defaultShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

const smoothPath = 'M 0 0 H 120 V 48 H 0 Z';

function renderFrame(overrides = {}) {
  const material = MaterialLibrary.defaultStatic();

  return render(
    <StaticContainerFrame
      containerRef={() => {}}
      contentRef={() => {}}
      backgroundLayerRef={() => {}}
      foregroundLayerRef={() => {}}
      className="custom-static"
      containerStyle={{ position: 'relative', width: 120, height: 48 }}
      effectiveUseSmoothCorners
      smoothCornerPath={smoothPath}
      materialShapePath={smoothPath}
      clipContent
      backgroundLayers={material.getBackgroundLayers()}
      foregroundLayers={material.getForegroundLayers()}
      visualState={VisualState.DEFAULT}
      containerW={120}
      containerH={48}
      shapeContext={{ shapeProvider: defaultShapeProvider }}
      idPrefix="static-clip"
      backgroundLayerStyle={{}}
      foregroundLayerStyle={{}}
      contentWrapperStyle={{}}
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

    expect(screen.getByRole('status', { name: 'Chip' })).toBeInTheDocument();
    expect(screen.getByText('Static content')).toBeInTheDocument();
    expect(container.querySelector('[class*="backgroundLayers"]')).not.toBeNull();
    expect(container.querySelector('[class*="foregroundLayers"]')).not.toBeNull();
  });

  it('clips only the content wrapper at the container shape edge', () => {
    const { container } = renderFrame();
    const root = container.firstElementChild as HTMLElement;
    const backgroundLayers = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    const contentWrapper = container.querySelector<HTMLElement>(
      '[class*="contentWrapper"]',
    );
    const foregroundLayers = container.querySelector<HTMLElement>(
      '[class*="foregroundLayers"]',
    );

    expect(container.querySelector('clipPath')).toBeNull();
    expect(root.style.clipPath).toBe('');
    expect(contentWrapper?.style.clipPath).toBe(`path('${smoothPath}')`);
    expect(contentWrapper?.style.overflow).toBe('hidden');
    expect(backgroundLayers?.style.clipPath).toBe('');
    expect(foregroundLayers?.style.clipPath).toBe('');
  });

  it('does not clip when clipContent is false', () => {
    const { container } = renderFrame({ clipContent: false });
    const root = container.firstElementChild as HTMLElement;
    const contentWrapper = container.querySelector('[class*="contentWrapper"]');

    expect(root.style.clipPath).toBe('');
    expect((contentWrapper as HTMLElement)?.style.clipPath).toBe('');
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
