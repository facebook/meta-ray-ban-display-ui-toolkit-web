/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * StaticContainer tests
 * Non-interactive container used by Chip, Tag, TooltipContainer.
 */

import { createRef, useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { StaticContainer, BackgroundStyle } from '@wearables-ui-toolkit/foundation';
import {
  ContainerMaterial,
  CornerRadius,
  LayerPlacement,
  RoundedRectangleShapeProvider,
  createLayer,
  type ShapePathParams,
  type ShapeProvider,
  type StrokePathParams,
} from '@wearables-ui-toolkit/foundation';
import { defaultShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { createStaticContainerMaterial } from '@wearables-ui-toolkit/foundation/material/StaticContainerMaterial';
import {
  MATERIAL_CANVAS_LAYOUT_GEOMETRY_EVENT,
} from '../../../foundation/src/components/private/ContainerMaterialCanvas';
import {
  createTextInputContainerMaterial,
  setTextInputMaterialLoading,
} from '@wearables-ui-toolkit/foundation/material/TextInputContainerMaterial';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import type { ContentClipMode } from '../../../foundation/src/components/ContainerContent.types';
import { drawLayer } from './helpers/canvasRecorder';

const ORIGINAL_REQUEST_ANIMATION_FRAME = window.requestAnimationFrame;
const ORIGINAL_CANCEL_ANIMATION_FRAME = window.cancelAnimationFrame;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    value: ORIGINAL_REQUEST_ANIMATION_FRAME,
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    configurable: true,
    value: ORIGINAL_CANCEL_ANIMATION_FRAME,
  });
});

function rect(
  width: number,
  height: number,
  x: number = 0,
  y: number = 0,
): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => {},
  } as DOMRect;
}

describe('StaticContainer rendering', () => {
  it.each(['shape', 'bounds', 'none'] as const)('retains surface content-box history independently of %s clipping', (contentClip) => {
    const originalResizeObserver = globalThis.ResizeObserver;
    const observers: Array<{
      callback: ResizeObserverCallback;
      targets: Array<{ element: Element; options?: ResizeObserverOptions }>;
    }> = [];
    class TestResizeObserver {
      readonly targets: Array<{ element: Element; options?: ResizeObserverOptions }> = [];
      constructor(callback: ResizeObserverCallback) {
        observers.push({ callback, targets: this.targets });
      }
      observe(element: Element, options?: ResizeObserverOptions): void {
        this.targets.push({ element, options });
      }
      unobserve(): void {}
      disconnect(): void {}
    }
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    const contentRef = createRef<HTMLDivElement>();
    const view = render(
      <StaticContainer contentClip={contentClip} contentRef={contentRef} width={120} height={48} contentStyle={{ padding: '4px 12px' }}>
        Content
      </StaticContainer>,
    );
    try {
      const root = view.container.firstElementChild as HTMLElement;
      const surface = contentRef.current!;
      expect(observers).toHaveLength(2);
      const historyObserver = observers.find(observer => observer.targets.some(target =>
        target.element === surface && target.options?.box === 'content-box',
      ));
      expect(historyObserver).toBeDefined();
      expect(historyObserver!.targets.some(target => target.element === root)).toBe(false);
      expect(observers.some(observer => observer.targets.some(target =>
        target.element === root && target.options?.box === 'border-box',
      ))).toBe(true);
      const initialClipPath = surface.style.clipPath;
      const computedStyle = vi.spyOn(window, 'getComputedStyle');
      surface.style.padding = '8px 20px';
      act(() => historyObserver!.callback([{ target: surface } as ResizeObserverEntry], {} as ResizeObserver));
      expect(computedStyle.mock.calls.filter(([element]) => element === root)).toHaveLength(0);
      expect(root).toHaveStyle({ padding: '0px', borderWidth: '0px' });
      expect(surface).toHaveStyle({ padding: '8px 20px', margin: '0px' });
      expect(surface.style.clipPath).toBe(initialClipPath);
      expect(surface.style.overflow).toBe(contentClip === 'none' ? 'visible' : 'hidden');
    } finally {
      view.unmount();
      vi.stubGlobal('ResizeObserver', originalResizeObserver);
    }
  });

  it('keeps the physical smooth path and root alignment when ancestor CSS changes content padding', async () => {
    const sheet = document.createElement('style');
    sheet.textContent = '.cascade-content { padding: 4px 12px; } .cascade-alt .cascade-content { padding: 4px 4px 4px 20px; }';
    document.head.appendChild(sheet);
    const shapeProvider = new RoundedRectangleShapeProvider(CornerRadius.LARGE);
    const expectedPath = shapeProvider.getShapePath({ width: 120, height: 48 });
    const view = (alternate: boolean) => (
      <div className={alternate ? 'cascade-alt' : ''}>
        <StaticContainer className="cascade-root" contentClassName="cascade-content" width={120} height={48} shapeProvider={shapeProvider}>
          {alternate ? 'After' : 'Before'}
        </StaticContainer>
      </div>
    );
    try {
      const { container, rerender } = render(view(false));
      const root = container.querySelector('.cascade-root') as HTMLElement;
      const attributes = root.getAttributeNames().map((name) => [name, root.getAttribute(name)]);
      const surface = root.querySelector('.cascade-content') as HTMLElement;
      expect(surface).toHaveStyle({ paddingLeft: '12px', paddingRight: '12px' });
      expect(surface.style.clipPath).toContain(expectedPath);
      rerender(view(true));
      expect(container.querySelector('.cascade-root')).toBe(root);
      expect(root.getAttributeNames().map((name) => [name, root.getAttribute(name)])).toEqual(attributes);
      expect(root).toHaveStyle({ width: '120px', height: '48px', padding: '0px', borderWidth: '0px' });
      expect(surface.parentElement).toBe(root);
      expect(root.querySelectorAll('[data-uit-content-surface]')).toHaveLength(1);
      await waitFor(() => expect(surface).toHaveStyle({ paddingLeft: '20px', paddingRight: '4px', margin: '0px' }));
      expect(surface.style.clipPath).toContain(expectedPath);
    } finally {
      sheet.remove();
    }
  });

  it('does not re-read root styles or change the padded surface on material revisions', () => {
    const material = createTextInputContainerMaterial(() => MaterialLibrary.default());
    const ref = vi.fn();
    const { container } = render(
      <StaticContainer ref={ref} material={material} width={120} height={48} contentStyle={{ padding: '4px 12px' }}>
        Content
      </StaticContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    const surface = root.querySelector('[data-uit-content-surface]');
    const computedStyle = vi.spyOn(window, 'getComputedStyle');
    act(() => setTextInputMaterialLoading(material, true));
    act(() => setTextInputMaterialLoading(material, false));
    expect(computedStyle.mock.calls.filter(([element]) => element === root)).toHaveLength(0);
    expect(root.querySelector('[data-uit-content-surface]')).toBe(surface);
    expect(surface).toHaveStyle({ padding: '4px 12px', margin: '0px' });
    expect(root).toHaveStyle({ padding: '0px', borderWidth: '0px' });
  });

  it('preserves descendant state, DOM identity and focus when clipping changes', () => {
    function StatefulContent() {
      const [value, setValue] = useState('initial');
      return (
        <input
          aria-label="Editable content"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
      );
    }
    const child = <StatefulContent />;
    const contentRef = createRef<HTMLDivElement>();
    const view = (contentClip: ContentClipMode) => (
      <StaticContainer width={160} height={80} contentClip={contentClip} contentRef={contentRef} contentClassName="editable-surface">{child}</StaticContainer>
    );
    const { getByRole, rerender } = render(view('none'));
    const input = getByRole('textbox');
    const surface = contentRef.current!;
    const root = surface.parentElement!;
    expect(input.parentElement).toBe(surface);
    expect(surface).toHaveClass('editable-surface');
    fireEvent.change(input, { target: { value: 'retained' } });
    act(() => input.focus());

    for (const contentClip of ['shape', 'bounds', 'none'] as const) {
      rerender(view(contentClip));
      expect(contentRef.current).toBe(surface);
      expect(surface.parentElement).toBe(root);
      expect(root.querySelectorAll('[data-uit-content-surface]')).toHaveLength(1);
      expect(getByRole('textbox')).toBe(input);
      expect(input).toHaveValue('retained');
      expect(input).toHaveFocus();
      expect(surface.style.overflow).toBe(contentClip === 'none' ? 'visible' : 'hidden');
      if (contentClip === 'none') expect(surface.style.clipPath).toBe('');
      if (contentClip === 'bounds') expect(surface.style.clipPath).toContain('inset(');
    }
  });

  it('renders children', () => {
    const { container } = render(
      <StaticContainer>
        <span>Content</span>
      </StaticContainer>
    );
    expect(container.textContent).toBe('Content');
  });

  it('forwards function refs to the static container element', () => {
    const ref = vi.fn();

    render(<StaticContainer ref={ref}>Content</StaticContainer>);

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('renders background layers', () => {
    const { container } = render(
      <StaticContainer>Content</StaticContainer>
    );
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
  });

  it('is not focusable (no tabIndex)', () => {
    const { container } = render(
      <StaticContainer>Not focusable</StaticContainer>
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tabIndex).toBe(-1);
  });

  it('fills explicit dimensions with its content wrapper', () => {
    const { container, rerender } = render(
      <StaticContainer width="100%" height="50%">
        <span>Responsive content</span>
      </StaticContainer>,
    );
    const content = container.querySelector<HTMLElement>(
      '[data-uit-content-clip="true"]',
    );

    expect(content).toHaveStyle({ width: '100%', height: '100%' });

    rerender(
      <StaticContainer>
        <span>Intrinsic content</span>
      </StaticContainer>,
    );
    expect(content?.style.width).toBe('auto');
    expect(content?.style.height).toBe('auto');
  });
});

describe('StaticContainer BackgroundStyle', () => {
  it('NONE hides background but still clips', () => {
    const { container } = render(
      <StaticContainer backgroundStyle={BackgroundStyle.NONE}>
        Hidden bg
      </StaticContainer>
    );
    // Content should still render
    expect(container.textContent).toBe('Hidden bg');
  });

  it('SECONDARY renders the static fill with screen blending', () => {
    const secondaryMaterial = createStaticContainerMaterial({ secondary: true });
    const idleLayer = secondaryMaterial
      .getBackgroundLayers()
      .find((layer) => layer.id === 'idle-material');
    expect(idleLayer).not.toBeUndefined();
    const recorder = drawLayer(idleLayer!, { state: VisualState.DEFAULT });
    const fillOps = recorder.paintOps.filter((op) => op.type === 'fill');
    expect(fillOps.length).toBeGreaterThan(0);
    expect(
      fillOps.some((op) => op.style?.globalCompositeOperation === 'screen'),
    ).toBe(true);
  });
});

describe('StaticContainer material', () => {
  it('uses defaultStatic material by default', () => {
    const defaultStatic = vi.spyOn(MaterialLibrary, 'defaultStatic');

    render(<StaticContainer>Default</StaticContainer>);

    expect(defaultStatic).toHaveBeenCalledWith({ secondary: false });
  });

  it('accepts custom material', () => {
    const material = MaterialLibrary.defaultStatic({ withDropShadow: true });
    const getBackgroundLayers = vi.spyOn(material, 'getBackgroundLayers');

    render(
      <StaticContainer material={material}>
        Shadow
      </StaticContainer>
    );

    expect(getBackgroundLayers).toHaveBeenCalled();
  });

  it('renders an explicitly selected static visual state', async () => {
    const material = MaterialLibrary.default();
    const { rerender } = render(
      <StaticContainer
        material={material}
        visualState={VisualState.FOCUSED}
      />,
    );

    await waitFor(() => {
      expect(material.getCurrentState()).toBe(VisualState.FOCUSED);
    });

    rerender(
      <StaticContainer
        material={material}
        visualState={VisualState.PRESSED}
      />,
    );

    await waitFor(() => {
      expect(material.getCurrentState()).toBe(VisualState.PRESSED);
    });
  });

  it('keeps BackgroundStyle.NONE hidden regardless of visualState', async () => {
    const material = MaterialLibrary.default();
    render(
      <StaticContainer
        material={material}
        backgroundStyle={BackgroundStyle.NONE}
        visualState={VisualState.FOCUSED}
      />,
    );

    await waitFor(() => {
      expect(material.getCurrentState()).toBe(VisualState.NONE);
    });
  });

  it('does not wrapper-clip material drop shadows', () => {
    const material = createStaticContainerMaterial({ withDropShadow: true });
    const shadow = material.getBackgroundLayers().find(
      (layer) => layer.id === 'drop-shadow',
    );
    const { container } = render(
      <StaticContainer
        width={120}
        height={48}
        material={material}
      />,
    );
    const background = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    const root = container.firstElementChild as HTMLElement;
    const content = container.querySelector<HTMLElement>(
      '[data-uit-content-clip="true"]',
    );

    expect(shadow?.clipsToShape).toBe(false);
    expect(root.style.overflow).toBe('visible');
    expect(content?.style.overflow).toBe('hidden');
    expect(background?.style.clipPath).toBe('');
    expect(background?.querySelector('canvas')?.style.clipPath).toBe('');
  });

  it('paints canvas materials when smooth corners are disabled', () => {
    const material = new ContainerMaterial({
      layers: [
        createLayer('canvas', LayerPlacement.BACKGROUND, undefined, {
          drawCanvas: () => {},
        }),
      ],
    });
    const { container } = render(
      <StaticContainer
        width={120}
        height={48}
        useSmoothCorners={false}
        material={material}
      />,
    );

    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('applies material inset and alpha only to material layers', () => {
    const material = new ContainerMaterial({
      alpha: 0.5,
      alphaForState: () => 0.4,
      inset: { top: 4, right: 12, bottom: 8, left: 10 },
      layers: [
        createLayer('canvas', LayerPlacement.BACKGROUND, undefined, {
          drawCanvas: () => {},
        }),
      ],
    });
    const { container } = render(
      <StaticContainer width={100} height={60} material={material}>
        Content
      </StaticContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    const background = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    const canvas = background?.querySelector('canvas');

    expect(root.style.opacity).toBe('');
    expect(background?.style.opacity).toBe('0.2');
    expect(background?.style.getPropertyValue('--uit-material-inset-top')).toBe('4px');
    expect(background?.style.getPropertyValue('--uit-material-inset-left')).toBe('10px');
    expect(canvas?.style.width).toBe('142px');
    expect(canvas?.style.height).toBe('112px');
  });

  it('does not mount material canvases when the material is hidden', () => {
    const material = new ContainerMaterial({
      hidden: true,
      layers: [
        createLayer('canvas', LayerPlacement.BACKGROUND, undefined, {
          animatesContinuously: true,
          drawCanvas: () => {},
        }),
      ],
    });
    const { container } = render(
      <StaticContainer width={100} height={40} material={material}>Content</StaticContainer>,
    );

    expect(container.textContent).toBe('Content');
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('blends secondary material canvases with the live backdrop', () => {
    const { container } = render(
      <StaticContainer
        width={120}
        height={48}
        backgroundStyle={BackgroundStyle.SECONDARY}
      />,
    );
    const canvas = container.querySelector<HTMLCanvasElement>(
      '[class*="backgroundLayers"] canvas',
    );
    const root = container.firstElementChild as HTMLElement;
    const background = canvas?.parentElement;
    const content = container.querySelector<HTMLElement>(
      '[data-uit-content-clip="true"]',
    );

    expect(canvas?.style.mixBlendMode).toBe('screen');
    expect(root).toHaveAttribute(
      'data-uit-background-blends-with-backdrop',
      'true',
    );
    expect(root.style.isolation).toBe('auto');
    expect(root.style.zIndex).toBe('');
    expect(root.style.clipPath).toBe('');
    expect(background?.style.isolation).toBe('auto');
    expect(background?.style.zIndex).toBe('auto');
    expect(content?.style.zIndex).toBe('1');
    expect(content?.style.clipPath).toContain('path(');
  });

  it('uses the material shape provider for clipping and canvas geometry', () => {
    const shapeProvider = {
      getShapePath: vi.fn(({ width, height }) => (
        `M 0,0 L ${width},0 L ${width},${height} Z`
      )),
      getStrokePath: vi.fn(() => 'M 1,1 L 2,1 L 2,2 Z'),
    };
    const material = new ContainerMaterial({
      layers: [
        createLayer('canvas', LayerPlacement.BACKGROUND, undefined, {
          drawCanvas: () => {},
        }),
      ],
    });
    const { container } = render(
      <StaticContainer
        width={90}
        height={36}
        material={material}
        shapeProvider={shapeProvider}
      />,
    );
    const background = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    const content = container.querySelector<HTMLElement>(
      '[data-uit-content-clip="true"]',
    );
    const canvas = background?.querySelector('canvas');

    expect(shapeProvider.getShapePath).toHaveBeenCalled();
    expect(content?.style.clipPath).toContain('M 0,0 L 90,0 L 90,36 Z');
    expect(background?.style.clipPath).toBe('');
    expect(canvas?.style.width).toBe('154px');
    expect(canvas?.style.height).toBe('100px');
  });
});

describe('StaticContainer shapeProvider prop', () => {
  it('applies a rounded rectangle provider', () => {
    const { container } = render(
      <StaticContainer
        width={120}
        height={48}
        useSmoothCorners={false}
        shapeProvider={new RoundedRectangleShapeProvider(CornerRadius.SMALL)}
      >
        Rounded
      </StaticContainer>
    );
    const root = container.firstElementChild;
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('border-radius: 24px');
    expect(style).not.toContain('border-radius: 48px');
  });

  it('keeps shape geometry independent from a passed material', () => {
    const passed = createStaticContainerMaterial();

    const { container } = render(
      <StaticContainer
        width={120}
        height={48}
        useSmoothCorners={false}
        material={passed}
        shapeProvider={new RoundedRectangleShapeProvider(CornerRadius.XSMALL)}
      >
        Rounded
      </StaticContainer>
    );
    const root = container.firstElementChild;
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('border-radius: 16px');
    expect(passed.getBackgroundLayers()).not.toHaveLength(0);
  });

});

describe('StaticContainer backgroundStyle material precedence', () => {
  it('SECONDARY derives the secondary static material, overriding a passed material', () => {
    const passed = createStaticContainerMaterial({ secondary: false });

    const { container } = render(
      <StaticContainer
        width={120}
        height={48}
        useSmoothCorners={false}
        backgroundStyle={BackgroundStyle.SECONDARY}
        material={passed}
      >
        Secondary precedence
      </StaticContainer>
    );

    const canvas = container.querySelector<HTMLCanvasElement>('canvas');
    expect(canvas?.style.mixBlendMode).toBe('screen');
  });

  it('PRIMARY (the default field value) keeps a passed material', () => {
    const passed = createStaticContainerMaterial();

    const { container } = render(
      <StaticContainer
        width={120}
        height={48}
        useSmoothCorners={false}
        backgroundStyle={BackgroundStyle.PRIMARY}
        material={passed}
      >
        Primary keeps material
      </StaticContainer>
    );
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('NONE keeps a passed material (hidden via visual state, not replaced)', () => {
    const passed = createStaticContainerMaterial();

    const { container } = render(
      <StaticContainer
        width={120}
        height={48}
        useSmoothCorners={false}
        backgroundStyle={BackgroundStyle.NONE}
        material={passed}
      >
        None keeps material
      </StaticContainer>
    );
    expect(container.querySelector('[class*="backgroundLayers"]')).toHaveStyle({
      display: 'none',
    });
  });
});

describe('StaticContainer props', () => {
  it('applies width and height', () => {
    const { container } = render(
      <StaticContainer width={200} height={100}>Sized</StaticContainer>
    );
    const root = container.firstElementChild;
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('width: 200px');
    expect(style).toContain('height: 100px');
  });

  it('applies role and aria-label', () => {
    const { container } = render(
      <StaticContainer role="status" aria-label="Test label">
        Accessible
      </StaticContainer>
    );
    const root = container.firstElementChild;
    expect(root?.getAttribute('role')).toBe('status');
    expect(root?.getAttribute('aria-label')).toBe('Test label');
  });

  it('forwards component capture and test ids to the root', () => {
    const { container } = render(
      <StaticContainer
        data-testid="static-root"
        data-uit-capture-id="static-capture"
        id="static-id"
      >
        Identified
      </StaticContainer>
    );
    const root = container.firstElementChild;
    expect(root?.getAttribute('id')).toBe('static-id');
    expect(root?.getAttribute('data-testid')).toBe('static-root');
    expect(root?.getAttribute('data-uit-capture-id')).toBe('static-capture');
  });

  it('applies aria-hidden for decorative clipped content', () => {
    const { container } = render(
      <StaticContainer aria-hidden="true">
        Decorative
      </StaticContainer>
    );
    const root = container.firstElementChild;
    expect(root?.getAttribute('aria-hidden')).toBe('true');
  });

  it('clips only the content wrapper by default', () => {
    const { container } = render(
      <StaticContainer>Clipped</StaticContainer>
    );
    const root = container.firstElementChild as HTMLElement;
    const content = container.querySelector<HTMLElement>(
      '[data-uit-content-clip="true"]',
    );
    expect(root.style.overflow).toBe('visible');
    expect(content?.style.overflow).toBe('hidden');
  });

  it('does not clip when contentClip is none', () => {
    const { container } = render(
      <StaticContainer contentClip="none">Not clipped</StaticContainer>
    );
    const root = container.firstElementChild as HTMLElement;
    const content = container.querySelector<HTMLElement>(
      '[data-uit-content-surface]',
    );
    expect(root.style.overflow).toBe('visible');
    expect(content?.style.overflow).toBe('visible');
    expect(content?.style.clipPath).toBe('');
    expect(content).not.toHaveAttribute('data-uit-content-clip');
  });

  it('uses rendered fractional bounds for smooth clip geometry', async () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    rectSpy.mockReturnValue(rect(123.5, 45.25));

    try {
      const { container } = render(
        <StaticContainer width="100%">
          Fractional
        </StaticContainer>
      );

      await waitFor(() => {
        const content = container.querySelector<HTMLElement>(
          '[data-uit-content-clip="true"]',
        );
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        const bgLayers = container.querySelector(
          '[class*="backgroundLayers"]',
        ) as HTMLElement;
        // Canvas adds 32px padding on each side, so width/height = layer + 64.
        expect(canvas?.getAttribute('style')).toContain('width: 187.5px');
        expect(canvas?.getAttribute('style')).toContain('height: 109.25px');
        expect(content?.style.clipPath).toContain(defaultShapeProvider.getShapePath({ width: 123.5, height: 45.25 }));
        expect(bgLayers.style.clipPath).toBe('');
        expect(container.querySelector('clipPath')).toBeNull();
      });
    } finally {
      rectSpy.mockRestore();
    }
  });

  it('scales smooth material clipping with animated size transitions', async () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    rectSpy.mockReturnValue(rect(123.5, 45.25));

    try {
      const { container } = render(
        <StaticContainer width="auto" height="auto">
          Animated
        </StaticContainer>
      );

      await waitFor(() => {
        const root = container.firstElementChild as HTMLElement;
        const content = container.querySelector<HTMLElement>(
          '[data-uit-content-clip="true"]',
        );
        const bgLayers = container.querySelector(
          '[class*="backgroundLayers"]',
        ) as HTMLElement;
        const fgLayers = container.querySelector(
          '[class*="foregroundLayers"]',
        ) as HTMLElement;
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;

        expect(root.style.overflow).toBe('visible');
        expect(content?.style.overflow).toBe('hidden');
        expect(content?.style.clipPath).toContain('path(');
        expect(bgLayers.style.clipPath).toBe('');
        expect(bgLayers.getAttribute('style')).not.toContain('width: 123.5px');
        expect(bgLayers.getAttribute('style')).not.toContain('right: auto');
        expect(fgLayers.style.clipPath).toBe('');
        expect(fgLayers.getAttribute('style')).not.toContain('height: 45.25px');
        // Canvas tracks the measured layer box (+ 64px padding on each axis) and
        // is free to take any size — the equivalent of preserveAspectRatio="none".
        expect(canvas?.getAttribute('style')).toContain('width: 187.5px');
        expect(canvas?.getAttribute('style')).toContain('height: 109.25px');
        expect(container.querySelector('clipPath')).toBeNull();
      });
    } finally {
      rectSpy.mockRestore();
    }
  });

  it('uses the animation target geometry and returns to observed border-box geometry when it settles', async () => {
    const observers: Array<{
      callback: ResizeObserverCallback;
      targets: Map<Element, ResizeObserverOptions | undefined>;
    }> = [];
    const originalResizeObserver = globalThis.ResizeObserver;
    const originalGetAnimations = HTMLElement.prototype.getAnimations;
    let currentRect = rect(100, 40);
    let activeAnimations: Animation[] = [];

    class TestResizeObserver {
      readonly targets = new Map<Element, ResizeObserverOptions | undefined>();
      constructor(callback: ResizeObserverCallback) {
        observers.push({ callback, targets: this.targets });
      }
      observe(element: Element, options?: ResizeObserverOptions): void { this.targets.set(element, options); }
      unobserve(element: Element): void { this.targets.delete(element); }
      disconnect(): void { this.targets.clear(); }
    }

    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
      configurable: true,
      value: vi.fn(() => activeAnimations),
    });
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => currentRect);
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(() => currentRect.width);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(() => currentRect.height);

    const { container, unmount } = render(
      <StaticContainer>Animated</StaticContainer>,
    );
    try {
      const root = container.firstElementChild as HTMLElement;
      const borderObserver = observers.find(observer => observer.targets.get(root)?.box === 'border-box');
      expect(borderObserver).toBeDefined();
      await waitFor(() => {
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        expect(canvas?.style.width).toBe('164px');
        expect(canvas?.style.height).toBe('104px');
      });

      activeAnimations = [{
        playState: 'running',
        effect: {
          getKeyframes: () => [{ width: '100px' }, { width: '200px' }],
        },
      } as unknown as Animation];
      currentRect = rect(140, 40);
      const emitBorderBox = (width: number) => {
        const entry = {
          target: root,
          borderBoxSize: [{ blockSize: 40, inlineSize: width }],
        } as unknown as ResizeObserverEntry;
        act(() => borderObserver!.callback([entry], {} as ResizeObserver));
      };
      emitBorderBox(140);
      await waitFor(() => {
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        const surface = container.querySelector<HTMLElement>('[data-uit-content-surface]');
        expect(canvas?.style.width).toBe('264px');
        expect(canvas?.style.height).toBe('104px');
        expect(surface?.style.clipPath).toContain(defaultShapeProvider.getShapePath({ width: 200, height: 40 }));
      });

      activeAnimations = [];
      currentRect = rect(180, 40);
      emitBorderBox(180);
      await waitFor(() => {
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        const surface = container.querySelector<HTMLElement>('[data-uit-content-surface]');
        expect(canvas?.style.width).toBe('244px');
        expect(canvas?.style.height).toBe('104px');
        expect(surface?.style.clipPath).toContain(defaultShapeProvider.getShapePath({ width: 180, height: 40 }));
      });
    } finally {
      unmount();
      rectSpy.mockRestore();
      offsetWidthSpy.mockRestore();
      offsetHeightSpy.mockRestore();
      if (originalGetAnimations == null) {
        Reflect.deleteProperty(HTMLElement.prototype, 'getAnimations');
      } else {
        Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
          configurable: true,
          value: originalGetAnimations,
        });
      }
      vi.stubGlobal('ResizeObserver', originalResizeObserver);
    }
  });

  it('updates smooth corner paths through the container transition coordinator', async () => {
    const material = createStaticContainerMaterial();
    const smallShape = new RoundedRectangleShapeProvider(CornerRadius.SMALL);
    const largeShape = new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);

    const { container, rerender } = render(
      <StaticContainer
        width={200}
        height={80}
        material={material}
        shapeProvider={smallShape}
      >
        Animated radius
      </StaticContainer>
    );

    await waitFor(() => {
      const content = container.querySelector<HTMLElement>(
        '[data-uit-content-clip="true"]',
      );
      expect(content?.style.clipPath).toContain('path(');
    });

    const initialContentClip = container.querySelector<HTMLElement>(
      '[data-uit-content-clip="true"]',
    )?.style.clipPath;

    rerender(
      <StaticContainer
        width={200}
        height={80}
        material={material}
        shapeProvider={largeShape}
      >
        Animated radius
      </StaticContainer>
    );

    await waitFor(() => {
      const content = container.querySelector<HTMLElement>(
        '[data-uit-content-clip="true"]',
      );
      const backgroundLayers = container.querySelector<HTMLElement>(
        '[class*="backgroundLayers"]',
      );
      const foregroundLayers = container.querySelector<HTMLElement>(
        '[class*="foregroundLayers"]',
      );
      expect(content?.style.clipPath).toContain('path(');
      expect(backgroundLayers?.style.clipPath).toBe('');
      expect(foregroundLayers?.style.clipPath).toBe('');
      // Corner radius change must re-derive the shape path through the coordinator.
      expect(content?.style.clipPath).not.toBe(initialContentClip);
    });
  });

  it('keeps custom content and inset material geometry distinct during layout transitions', async () => {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    let frameCallback: FrameRequestCallback | null = null;
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn((callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 1;
      }),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: vi.fn(),
    });

    let containerSize = rect(100, 44);
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => containerSize);
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(() => containerSize.width);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(() => containerSize.height);

    try {
      const getShapePath = vi.fn(({
        width,
        height,
      }: ShapePathParams) => `M 3,5 L ${width},0 L ${width},${height} Z`);
      const shapeProvider: ShapeProvider = {
        getShapePath,
        getStrokePath: vi.fn((_params: StrokePathParams) => (
          'M 4,6 L 5,6 L 5,7 Z'
        )),
      };
      const material = new ContainerMaterial({
        inset: { top: 4, right: 10, bottom: 8, left: 6 },
        layers: [
          createLayer(
            'css-shape',
            LayerPlacement.BACKGROUND,
            () => ({ backgroundColor: 'black' }),
          ),
          createLayer('canvas', LayerPlacement.BACKGROUND, undefined, {
            drawCanvas: () => {},
          }),
        ],
      });
      const { container, rerender } = render(
        <StaticContainer
          width={100}
          height={44}
          material={material}
          shapeProvider={shapeProvider}
          layoutTransitionToken={0}
        >
          Custom shape
        </StaticContainer>,
      );

      await waitFor(() => {
        const content = container.querySelector<HTMLElement>(
          '[data-uit-content-clip="true"]',
        );
        expect(content?.style.clipPath).toContain(
          'M 3,5 L 100,0 L 100,44 Z',
        );
        const materialLayer = container.querySelector<HTMLElement>(
          '[data-uit-material-layer="css-shape"]',
        );
        expect(materialLayer?.style.clipPath).toContain(
          'M 3,5 L 84,0 L 84,32 Z',
        );
      });
      getShapePath.mockClear();
      containerSize = rect(140, 44);

      act(() => {
        rerender(
          <StaticContainer
            width={140}
            height={44}
            material={material}
            shapeProvider={shapeProvider}
            layoutTransitionToken={1}
          >
            Custom shape
          </StaticContainer>,
        );
      });

      const content = container.querySelector<HTMLElement>(
        '[data-uit-content-clip="true"]',
      );
      expect(content?.style.clipPath).toContain(
        'M 3,5 L 100,0 L 100,44 Z',
      );
      const background = container.querySelector<HTMLElement>(
        '[class*="backgroundLayers"]',
      );
      const materialLayer = container.querySelector<HTMLElement>(
        '[data-uit-material-layer="css-shape"]',
      );
      const canvas = background?.querySelector('canvas');
      expect(background?.style.left).toBe('6px');
      expect(background?.style.top).toBe('4px');
      expect(background?.style.width).toBe('84px');
      expect(background?.style.height).toBe('32px');
      expect(materialLayer?.style.clipPath).toContain(
        'M 3,5 L 84,0 L 84,32 Z',
      );

      act(() => {
        frameCallback?.(performance.now() + 50);
      });

      const [intermediateContentGeometry, intermediateMaterialGeometry] =
        getShapePath.mock.calls.slice(-2).map(([params]) => params);
      expect(intermediateContentGeometry).toEqual(expect.objectContaining({
        height: 44,
      }));
      expect(intermediateContentGeometry.width).toBeGreaterThan(100);
      expect(intermediateContentGeometry.width).toBeLessThan(140);
      expect(intermediateMaterialGeometry.width).toBeCloseTo(
        intermediateContentGeometry.width - 16,
      );
      expect(intermediateMaterialGeometry.height).toBeCloseTo(32);
      expect(Number.parseFloat(canvas?.style.width ?? '0') - 64).toBeCloseTo(
        intermediateMaterialGeometry.width,
      );
      expect(content?.style.clipPath).toContain('M 3,5 L');
      expect(materialLayer?.style.clipPath).toContain('M 3,5 L');
    } finally {
      rectSpy.mockRestore();
      offsetWidthSpy.mockRestore();
      offsetHeightSpy.mockRestore();
      Object.defineProperty(window, 'requestAnimationFrame', {
        configurable: true,
        value: originalRequestAnimationFrame,
      });
      Object.defineProperty(window, 'cancelAnimationFrame', {
        configurable: true,
        value: originalCancelAnimationFrame,
      });
    }
  });

  it('keeps layout participants visually continuous when target content reflows first', async () => {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn(() => 1),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: vi.fn(),
    });

    let containerSize = rect(100, 40);
    let participantRect = rect(80, 28, 10, 6);
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getMockRect(this: HTMLElement) {
        return this.dataset.uitLayoutTransitionPart === 'chip-text'
          ? participantRect
          : containerSize;
      });
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(() => containerSize.width);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(() => containerSize.height);

    const { container, rerender } = render(
      <StaticContainer
        width={100}
        height={40}
        useSmoothCorners={false}
        layoutTransitionToken={0}
      >
        <span data-uit-layout-transition-part="chip-text">Header Demo</span>
      </StaticContainer>,
    );

    await waitFor(() => {
      expect(
        container.querySelector<HTMLElement>('[data-uit-layout-transition-part="chip-text"]'),
      ).not.toBeNull();
    });

    containerSize = rect(140, 60);
    participantRect = rect(80, 28, 30, 6);

    act(() => {
      rerender(
        <StaticContainer
          width={140}
          height={60}
          useSmoothCorners={false}
          layoutTransitionToken={1}
        >
          <span data-uit-layout-transition-part="chip-text">Header Demo</span>
        </StaticContainer>,
      );
    });

    const root = container.firstElementChild as HTMLElement;
    const backgroundLayers = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    const participant = container.querySelector<HTMLElement>(
      '[data-uit-layout-transition-part="chip-text"]',
    );

    expect(root.style.width).toBe('100px');
    expect(root.style.height).toBe('40px');
    expect(backgroundLayers?.style.transform).toBe('');
    expect(participant?.style.transform).toBe('translate(-20px, 0px)');

    rectSpy.mockRestore();
    offsetWidthSpy.mockRestore();
    offsetHeightSpy.mockRestore();
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: originalRequestAnimationFrame,
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: originalCancelAnimationFrame,
    });
  });

  it('ignores viewport displacement when a parent scrolls between layouts', async () => {
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn(() => 1),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: vi.fn(),
    });

    let containerRect = rect(100, 40, 20, 200);
    let participantRect = rect(80, 28, 30, 206);
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getMockRect(this: HTMLElement) {
        return this.dataset.uitLayoutTransitionPart === 'chip-text'
          ? participantRect
          : containerRect;
      });
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(() => containerRect.width);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(() => containerRect.height);

    const { container, rerender } = render(
      <StaticContainer
        width={100}
        height={40}
        useSmoothCorners={false}
        layoutTransitionToken={0}
      >
        <span data-uit-layout-transition-part="chip-text">Activity</span>
      </StaticContainer>,
    );

    await waitFor(() => {
      expect(
        container.querySelector<HTMLElement>(
          '[data-uit-layout-transition-part="chip-text"]',
        ),
      ).not.toBeNull();
    });

    containerRect = rect(140, 40, 20, 130);
    participantRect = rect(80, 28, 30, 136);

    act(() => {
      rerender(
        <StaticContainer
          width={140}
          height={40}
          useSmoothCorners={false}
          layoutTransitionToken={1}
        >
          <span data-uit-layout-transition-part="chip-text">Activity</span>
        </StaticContainer>,
      );
    });

    const participant = container.querySelector<HTMLElement>(
      '[data-uit-layout-transition-part="chip-text"]',
    );
    expect(participant?.style.transform).toBe('');

    rectSpy.mockRestore();
    offsetWidthSpy.mockRestore();
    offsetHeightSpy.mockRestore();
  });

  it('FLIP-transforms participants during trailing-anchored transitions', async () => {
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn(() => 1),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: vi.fn(),
    });

    let containerSize = rect(100, 40);
    let participantRect = rect(80, 28, 10, 6);
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getMockRect(this: HTMLElement) {
        return this.dataset.uitLayoutTransitionPart === 'chip-text'
          ? participantRect
          : containerSize;
      });
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(() => containerSize.width);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(() => containerSize.height);

    const { container, rerender } = render(
      <StaticContainer
        width={100}
        height={40}
        useSmoothCorners={false}
        layoutTransitionAnchor="end"
        layoutTransitionToken={0}
      >
        <span data-uit-layout-transition-part="chip-text">
          Header Demo
        </span>
      </StaticContainer>,
    );

    await waitFor(() => {
      expect(
        container.querySelector<HTMLElement>('[data-uit-layout-transition-part="chip-text"]'),
      ).not.toBeNull();
    });

    containerSize = rect(140, 40);
    participantRect = rect(80, 28, 30, 6);

    act(() => {
      rerender(
        <StaticContainer
          width={140}
          height={40}
          useSmoothCorners={false}
          layoutTransitionAnchor="end"
          layoutTransitionToken={1}
        >
          <span data-uit-layout-transition-part="chip-text">
            Header Demo
          </span>
        </StaticContainer>,
      );
    });

    const participant = container.querySelector<HTMLElement>(
      '[data-uit-layout-transition-part="chip-text"]',
    );

    expect(participant?.style.transform).toBe('translate(-20px, 0px)');

    rectSpy.mockRestore();
    offsetWidthSpy.mockRestore();
    offsetHeightSpy.mockRestore();
  });

  it('does not FLIP-transform participants that opt out during trailing-anchored transitions', async () => {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn(() => 1),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: vi.fn(),
    });

    let containerSize = rect(100, 40);
    let participantRect = rect(80, 28, 10, 6);
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getMockRect(this: HTMLElement) {
        return this.dataset.uitLayoutTransitionPart === 'chip-text'
          ? participantRect
          : containerSize;
      });
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(() => containerSize.width);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(() => containerSize.height);

    const { container, rerender } = render(
      <StaticContainer
        width={100}
        height={40}
        useSmoothCorners={false}
        layoutTransitionAnchor="end"
        layoutTransitionToken={0}
      >
        <span
          data-uit-layout-transition-part="chip-text"
          data-uit-layout-transition-skip-flip="true"
        >
          Header Demo
        </span>
      </StaticContainer>,
    );

    await waitFor(() => {
      expect(
        container.querySelector<HTMLElement>('[data-uit-layout-transition-part="chip-text"]'),
      ).not.toBeNull();
    });

    containerSize = rect(140, 40);
    participantRect = rect(80, 28, 30, 6);

    act(() => {
      rerender(
        <StaticContainer
          width={140}
          height={40}
          useSmoothCorners={false}
          layoutTransitionAnchor="end"
          layoutTransitionToken={1}
        >
          <span
            data-uit-layout-transition-part="chip-text"
            data-uit-layout-transition-skip-flip="true"
          >
            Header Demo
          </span>
        </StaticContainer>,
      );
    });

    const participant = container.querySelector<HTMLElement>(
      '[data-uit-layout-transition-part="chip-text"]',
    );

    expect(participant?.style.transform).toBe('');

    rectSpy.mockRestore();
    offsetWidthSpy.mockRestore();
    offsetHeightSpy.mockRestore();
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: originalRequestAnimationFrame,
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: originalCancelAnimationFrame,
    });
  });

  it('keeps material shape geometry anchored to the start size through synchronized layout transitions', async () => {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn(() => 1),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: vi.fn(),
    });

    let containerSize = rect(100, 44);
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => containerSize);
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(() => containerSize.width);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(() => containerSize.height);
    const canvasDispatchSpy = vi.spyOn(
      HTMLCanvasElement.prototype,
      'dispatchEvent',
    );
    try {
      const material = createStaticContainerMaterial();

      const { container, rerender } = render(
        <StaticContainer
          width={100}
          height={44}
          material={material}
          layoutTransitionToken={0}
        >
          Header Demo
        </StaticContainer>,
      );

      await waitFor(() => {
        const content = container.querySelector<HTMLElement>(
          '[data-uit-content-clip="true"]',
        );
        const canvas = container.querySelector<HTMLCanvasElement>('canvas');
        expect(content?.style.clipPath).toContain('path(');
        expect(content?.style.clipPath).toContain('100');
        expect(canvas?.style.width).toBe('164px');
        expect(canvas?.style.height).toBe('108px');
      });

      containerSize = rect(140, 44);

      act(() => {
        rerender(
          <StaticContainer
            width={140}
            height={44}
            material={material}
            layoutTransitionToken={1}
          >
            Header Demo
          </StaticContainer>,
        );
      });

      const backgroundLayers = container.querySelector<HTMLElement>(
        '[class*="backgroundLayers"]',
      );
      const foregroundLayers = container.querySelector<HTMLElement>(
        '[class*="foregroundLayers"]',
      );
      const content = container.querySelector<HTMLElement>(
        '[data-uit-content-clip="true"]',
      );
      const canvas = backgroundLayers?.querySelector<HTMLCanvasElement>('canvas');
      // The synchronized transition keeps the shape anchored to the start size.
      expect(content?.style.clipPath).toContain('path(');
      expect(content?.style.clipPath).toContain('100');
      expect(backgroundLayers?.style.clipPath).toBe('');
      expect(foregroundLayers?.style.clipPath).toBe('');
      expect(canvas?.style.width).toBe('164px');
      expect(canvas?.style.height).toBe('108px');
    } finally {
      canvasDispatchSpy.mockRestore();
      rectSpy.mockRestore();
      offsetWidthSpy.mockRestore();
      offsetHeightSpy.mockRestore();
      Object.defineProperty(window, 'requestAnimationFrame', {
        configurable: true,
        value: originalRequestAnimationFrame,
      });
      Object.defineProperty(window, 'cancelAnimationFrame', {
        configurable: true,
        value: originalCancelAnimationFrame,
      });
    }
  });

  it('resizes live material canvases during synchronized layout transitions', async () => {
    let frameCallback: FrameRequestCallback | null = null;
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn((callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 1;
      }),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: vi.fn(),
    });

    let containerSize = rect(100, 44);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => containerSize);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(() => containerSize.width);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(() => containerSize.height);
    const canvasDispatchSpy = vi.spyOn(
      HTMLCanvasElement.prototype,
      'dispatchEvent',
    );
    const material = createStaticContainerMaterial();

    const { container, rerender } = render(
      <StaticContainer
        width={100}
        height={44}
        material={material}
        layoutTransitionToken={0}
      >
        Header Demo
      </StaticContainer>,
    );

    await waitFor(() => {
      const canvas = container.querySelector<HTMLCanvasElement>('canvas');
      expect(canvas?.style.width).toBe('164px');
    });
    const materialCanvas = container.querySelector<HTMLCanvasElement>('canvas');
    if (materialCanvas == null) {
      throw new Error('Expected StaticContainer material canvas');
    }

    containerSize = rect(140, 44);
    act(() => {
      rerender(
        <StaticContainer
          width={140}
          height={44}
          material={material}
          layoutTransitionToken={1}
        >
          Header Demo
        </StaticContainer>,
      );
    });

    const backgroundLayers = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    if (backgroundLayers == null) {
      throw new Error('Expected StaticContainer background layers');
    }
    const content = container.querySelector<HTMLElement>(
      '[data-uit-content-clip="true"]',
    );

    const lateCanvas = document.createElement('canvas');
    lateCanvas.style.left = '-32px';
    lateCanvas.style.top = '-32px';
    backgroundLayers.appendChild(lateCanvas);

    act(() => {
      frameCallback?.(performance.now() + 50);
    });

    const liveWidth = Number.parseFloat(lateCanvas.style.width);
    expect(liveWidth).toBeGreaterThan(164);
    expect(liveWidth).toBeLessThan(204);
    expect(lateCanvas.style.height).toBe('108px');
    expect(content?.style.clipPath).toContain('path(');
    expect(backgroundLayers.style.clipPath).toBe('');
    const transitionalWidths = canvasDispatchSpy.mock.calls
      .map(([event]) => event)
      .filter(event => event.type === MATERIAL_CANVAS_LAYOUT_GEOMETRY_EVENT)
      .map(event => (event as CustomEvent).detail.width as number)
      .filter(width => width > 100 && width < 140);
    expect(transitionalWidths).toHaveLength(2);

    act(() => {
      frameCallback?.(performance.now() + 1000);
    });
    expect(materialCanvas.style.width).toBe('204px');
    expect(materialCanvas.style.height).toBe('108px');
    expect(lateCanvas.style.width).toBe('204px');
    expect(lateCanvas.style.height).toBe('108px');

    act(() => {
      frameCallback?.(performance.now() + 1016);
    });
    act(() => {
      frameCallback?.(performance.now() + 1032);
    });
    expect(materialCanvas.style.width).toBe('204px');
    expect(materialCanvas.style.height).toBe('108px');
  });

  it('clears settled material layer geometry when no size transition runs', async () => {
    const { container, rerender } = render(
      <StaticContainer layoutTransitionToken={0}>
        Header Demo
      </StaticContainer>,
    );

    const backgroundLayers = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    const foregroundLayers = container.querySelector<HTMLElement>(
      '[class*="foregroundLayers"]',
    );
    if (backgroundLayers == null || foregroundLayers == null) {
      throw new Error('Expected StaticContainer material layers');
    }

    [backgroundLayers, foregroundLayers].forEach(layer => {
      layer.style.height = '44px';
      layer.style.left = '0px';
      layer.style.right = 'auto';
      layer.style.transform = 'translateX(12px)';
      layer.style.width = '176px';
      layer.style.willChange = 'width, height';
    });

    rerender(
      <StaticContainer
        layoutTransitionAnchor="end"
        layoutTransitionToken={0}
      >
        Header Demo
      </StaticContainer>,
    );

    await waitFor(() => {
      expect(backgroundLayers.style.height).toBe('');
      expect(backgroundLayers.style.left).toBe('');
      expect(backgroundLayers.style.right).toBe('');
      expect(backgroundLayers.style.transform).toBe('');
      expect(backgroundLayers.style.width).toBe('');
      expect(backgroundLayers.style.willChange).toBe('');
      expect(foregroundLayers.style.height).toBe('');
      expect(foregroundLayers.style.left).toBe('');
      expect(foregroundLayers.style.right).toBe('');
      expect(foregroundLayers.style.transform).toBe('');
      expect(foregroundLayers.style.width).toBe('');
      expect(foregroundLayers.style.willChange).toBe('');
    });
  });

  it('clears settled material layer geometry when a same-size transition is skipped', async () => {
    const { container, rerender } = render(
      <StaticContainer layoutTransitionToken={0}>
        Header Demo
      </StaticContainer>,
    );

    const backgroundLayers = container.querySelector<HTMLElement>(
      '[class*="backgroundLayers"]',
    );
    const foregroundLayers = container.querySelector<HTMLElement>(
      '[class*="foregroundLayers"]',
    );
    if (backgroundLayers == null || foregroundLayers == null) {
      throw new Error('Expected StaticContainer material layers');
    }

    [backgroundLayers, foregroundLayers].forEach(layer => {
      layer.style.height = '44px';
      layer.style.left = '0px';
      layer.style.right = 'auto';
      layer.style.transform = 'translateX(12px)';
      layer.style.width = '176px';
      layer.style.willChange = 'width, height';
    });

    rerender(
      <StaticContainer layoutTransitionToken={1}>
        Header Demo
      </StaticContainer>,
    );

    await waitFor(() => {
      expect(backgroundLayers.style.height).toBe('');
      expect(backgroundLayers.style.left).toBe('');
      expect(backgroundLayers.style.right).toBe('');
      expect(backgroundLayers.style.transform).toBe('');
      expect(backgroundLayers.style.width).toBe('');
      expect(backgroundLayers.style.willChange).toBe('');
      expect(foregroundLayers.style.height).toBe('');
      expect(foregroundLayers.style.left).toBe('');
      expect(foregroundLayers.style.right).toBe('');
      expect(foregroundLayers.style.transform).toBe('');
      expect(foregroundLayers.style.width).toBe('');
      expect(foregroundLayers.style.willChange).toBe('');
    });
  });

  it('refreshes smooth clip geometry when auto-sized content settles after first paint', async () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    let calls = 0;
    rectSpy.mockImplementation(() => {
      calls += 1;
      return calls < 3 ? rect(55.07, 27.82) : rect(67.31, 34);
    });

    const { container } = render(
      <StaticContainer>
        <span>Beta</span>
      </StaticContainer>
    );

    await waitFor(() => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
      // Settled size 67.31x34 plus 32px padding per side = 131.31x98.
      expect(canvas?.getAttribute('style')).toContain('width: 131.31px');
      expect(canvas?.getAttribute('style')).toContain('height: 98px');
    });

    rectSpy.mockRestore();
  });

  it('uses the untransformed border box for material geometry when the view is scaled', async () => {
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(rect(55.07, 27.82));
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(67);
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(34);

    const { container } = render(
      <StaticContainer style={{ transform: 'scale(0.82)' }}>
        <span>Beta</span>
      </StaticContainer>
    );

    await waitFor(() => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
      // Material geometry must come from the UNtransformed border box (67x34),
      // not the scaled visual rect (55.07x27.82). 67x34 + 64 padding = 131x98.
      expect(canvas?.getAttribute('style')).toContain('width: 131px');
      expect(canvas?.getAttribute('style')).toContain('height: 98px');
      expect(canvas?.getAttribute('style')).not.toContain('119.07');
      expect(canvas?.getAttribute('style')).not.toContain('91.82');
    });

    rectSpy.mockRestore();
    offsetWidthSpy.mockRestore();
    offsetHeightSpy.mockRestore();
  });

  it('retains physical bounds clips through completion, restart cancellation, and clipping-mode changes with a triangle provider', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    let now = 0;
    let nextFrameId = 1;
    const frames = new Map<number, FrameRequestCallback>();
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const frameId = nextFrameId++;
      frames.set(frameId, callback);
      return frameId;
    });
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((frameId) => {
      frames.delete(frameId);
    });
    const runFrame = (time: number) => {
      now = time;
      const pending = Array.from(frames.values());
      frames.clear();
      act(() => pending.forEach(callback => callback(time)));
    };
    let naturalWidth = 100;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => rect(naturalWidth, 40));
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => naturalWidth);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40);
    const trianglePath = (width: number, height: number) => `M 0,0 L ${width},0 L ${width / 2},${height} Z`;
    const shapeProvider: ShapeProvider = {
      getShapePath: ({ width, height }) => trianglePath(width, height),
      getStrokePath: () => 'M 1,1 L 2,1 L 1.5,2 Z',
      getCssBorderRadius: () => '16px',
    };
    const material = new ContainerMaterial({
      layers: [createLayer('triangle-material', LayerPlacement.BACKGROUND, () => ({ backgroundColor: 'black' }))],
    });
    const contentRef = createRef<HTMLDivElement>();
    const onComplete = vi.fn();
    const draw = (width: number, contentClip: ContentClipMode, token: number) => (
      <StaticContainer width={width} height={40} shapeProvider={shapeProvider} material={material} contentClip={contentClip} contentRef={contentRef} contentStyle={{ padding: '4px 12px' }} layoutTransitionToken={token} onLayoutTransitionComplete={onComplete}>
        <input aria-label="Bounds transition editor" defaultValue="initial" />
      </StaticContainer>
    );
    const setProperty = vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty');
    const removeProperty = vi.spyOn(CSSStyleDeclaration.prototype, 'removeProperty');
    const view = render(draw(100, 'shape', 0));
    try {
      const root = view.container.firstElementChild as HTMLElement;
      const surface = contentRef.current!;
      const input = view.getByRole('textbox');
      const materialLayer = root.querySelector<HTMLElement>('[data-uit-material-layer="triangle-material"]')!;
      const expectRetained = () => {
        expect(contentRef.current).toBe(surface);
        expect(surface.parentElement).toBe(root);
        expect(root.querySelectorAll('[data-uit-content-surface]')).toHaveLength(1);
        expect(view.getByRole('textbox')).toBe(input);
        expect(input).toHaveValue('retained');
        expect(input).toHaveFocus();
      };
      const expectWebkitWrite = (clip: string) => {
        const writes = setProperty.mock.calls.flatMap(([property, value], index) =>
          setProperty.mock.contexts[index] === surface.style && property === '-webkit-clip-path'
            ? [{ kind: 'set' as const, order: setProperty.mock.invocationCallOrder[index], value }]
            : [],
        );
        const removals = removeProperty.mock.calls.flatMap(([property], index) =>
          removeProperty.mock.contexts[index] === surface.style && property === '-webkit-clip-path'
            ? [{ kind: 'remove' as const, order: removeProperty.mock.invocationCallOrder[index], value: '' }]
            : [],
        );
        const operations = [...writes, ...removals].sort((first, second) => first.order - second.order);
        expect(operations.length).toBeGreaterThan(0);
        const lastOperation = operations[operations.length - 1];
        expect(lastOperation.kind).toBe(clip === '' ? 'remove' : 'set');
        expect(lastOperation.value).toBe(clip);
      };
      const expectClip = (clip: string, renderedByReact = false) => {
        expect(surface.style.clipPath).toBe(clip);
        if (renderedByReact) {
          const style = surface.style as CSSStyleDeclaration & {
            WebkitClipPath?: string;
            webkitClipPath?: string;
          };
          expect(style.WebkitClipPath || style.webkitClipPath || style.getPropertyValue('-webkit-clip-path')).toBe(clip);
        } else {
          expectWebkitWrite(clip);
        }
      };
      const expectBounds = (width: number, renderedByReact = false) => {
        expectClip(`inset(0px calc(100% - ${width}px) calc(100% - 40px) 0px round 0px)`, renderedByReact);
        expect(surface.style.clipPath).not.toContain('path(');
        expect(surface.style.borderRadius).toBe('0px');
        expect(surface.style.overflow).toBe('hidden');
      };
      fireEvent.change(input, { target: { value: 'retained' } });
      act(() => input.focus());
      expectClip(`path('${trianglePath(100, 40)}')`, true);
      view.rerender(draw(100, 'bounds', 0));
      expectBounds(100, true);
      expectRetained();

      naturalWidth = 160;
      view.rerender(draw(160, 'bounds', 1));
      expect(root).toHaveAttribute('data-uit-layout-transition-active', 'true');
      setProperty.mockClear();
      removeProperty.mockClear();
      runFrame(50);
      expect(Number.parseFloat(root.style.width)).toBeGreaterThan(100);
      expect(Number.parseFloat(root.style.width)).toBeLessThan(160);
      expect(surface.style.clipPath).toContain('inset(0px calc(100% - ');
      expect(surface.style.clipPath).not.toContain('path(');
      expectWebkitWrite(surface.style.clipPath);
      setProperty.mockClear();
      removeProperty.mockClear();
      runFrame(1000);
      expect(root).not.toHaveAttribute('data-uit-layout-transition-active');
      expectBounds(160);
      expect(onComplete).not.toHaveBeenCalled();
      runFrame(1016);
      runFrame(1032);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expectBounds(160);
      expect(materialLayer.style.clipPath).toBe(`path('${trianglePath(160, 40)}')`);
      expectRetained();

      naturalWidth = 200;
      view.rerender(draw(200, 'bounds', 2));
      runFrame(1082);
      expect(root).toHaveAttribute('data-uit-layout-transition-active', 'true');
      const canceledFrames = Array.from(frames.values());
      const cancelCount = cancelFrame.mock.calls.length;
      naturalWidth = 240;
      view.rerender(draw(240, 'bounds', 3));
      expect(cancelFrame.mock.calls.length).toBeGreaterThan(cancelCount);
      expect(root).toHaveAttribute('data-uit-layout-transition-active', 'true');
      setProperty.mockClear();
      removeProperty.mockClear();
      runFrame(2082);
      runFrame(2098);
      runFrame(2114);
      expect(onComplete).toHaveBeenCalledTimes(2);
      expect(root).toHaveStyle({ width: '240px', height: '40px' });
      expectBounds(240);
      act(() => canceledFrames.forEach(callback => callback(now)));
      act(() => vi.advanceTimersByTime(1000));
      expect(onComplete).toHaveBeenCalledTimes(2);
      expectBounds(240);
      expectRetained();

      naturalWidth = 280;
      view.rerender(draw(280, 'bounds', 4));
      runFrame(2164);
      expect(root).toHaveAttribute('data-uit-layout-transition-active', 'true');
      setProperty.mockClear();
      removeProperty.mockClear();
      view.rerender(draw(280, 'none', 4));
      expect(root).not.toHaveAttribute('data-uit-layout-transition-active');
      expect(onComplete).toHaveBeenCalledTimes(3);
      expectClip('');
      expect(surface.style.overflow).toBe('visible');
      runFrame(3164);
      runFrame(3180);
      runFrame(3196);
      act(() => vi.advanceTimersByTime(1000));
      expectClip('');
      expect(onComplete).toHaveBeenCalledTimes(3);
      expectRetained();
      for (const mode of ['shape', 'bounds', 'none'] as const) {
        view.rerender(draw(280, mode, 4));
        if (mode === 'bounds') expectBounds(280, true);
        else expectClip(mode === 'shape' ? `path('${trianglePath(280, 40)}')` : '', true);
        expect(surface.style.overflow).toBe(mode === 'none' ? 'visible' : 'hidden');
        expectRetained();
      }

      naturalWidth = 100;
      view.rerender(draw(100, 'bounds', 5));
      runFrame(4000);
      runFrame(4016);
      runFrame(4032);
      expectBounds(100);
      expect(onComplete).toHaveBeenCalledTimes(4);
      onComplete.mockClear();
      naturalWidth = 160;
      view.rerender(draw(160, 'bounds', 6));
      runFrame(4082);
      expect(root).toHaveAttribute('data-uit-layout-transition-active', 'true');
      expect(Number.parseFloat(root.style.width)).toBeGreaterThan(100);
      expect(Number.parseFloat(root.style.width)).toBeLessThan(160);
      const modeCanceledFrames = Array.from(frames.values());
      setProperty.mockClear();
      removeProperty.mockClear();
      naturalWidth = 240;
      view.rerender(draw(240, 'none', 7));
      expect(root).toHaveStyle({ width: '240px', height: '40px' });
      expect(root).not.toHaveAttribute('data-uit-layout-transition-active');
      expectClip('');
      expect(surface.style.overflow).toBe('visible');
      expect(onComplete).toHaveBeenCalledTimes(1);
      expectRetained();
      runFrame(5082);
      runFrame(5098);
      runFrame(5114);
      act(() => modeCanceledFrames.forEach(callback => callback(now)));
      act(() => vi.advanceTimersByTime(1000));
      expect(root).toHaveStyle({ width: '240px', height: '40px' });
      expect(root).not.toHaveAttribute('data-uit-layout-transition-active');
      expectClip('');
      expect(surface.style.overflow).toBe('visible');
      expect(onComplete).toHaveBeenCalledTimes(1);
      expectRetained();
    } finally {
      view.unmount();
      frames.clear();
      vi.useRealTimers();
    }
  });
});
