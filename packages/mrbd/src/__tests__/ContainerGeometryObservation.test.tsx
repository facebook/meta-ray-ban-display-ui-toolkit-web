/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { StaticContainer } from '@wearables-ui-toolkit/foundation/components/StaticContainer';
import { CornerRadius, RoundedRectangleShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import type { ContentClipMode } from '../../../foundation/src/components/ContainerContent.types';

class GeometryObserver {
  static instances: GeometryObserver[] = [];
  targets = new Map<Element, ResizeObserverOptions | undefined>();
  observe = vi.fn((element: Element, options?: ResizeObserverOptions) => this.targets.set(element, options));
  unobserve = vi.fn((element: Element) => this.targets.delete(element));
  disconnect = vi.fn(() => this.targets.clear());
  constructor(readonly callback: ResizeObserverCallback) { GeometryObserver.instances.push(this); }
  emit(element: Element, width: number, height: number) {
    act(() => this.callback([{ target: element, borderBoxSize: [{ inlineSize: width, blockSize: height }], contentBoxSize: [{ inlineSize: width, blockSize: height }] } as ResizeObserverEntry], this as unknown as ResizeObserver));
  }
}

function rect(width: number, height: number, x = 0, y = 0): DOMRect {
  return { x, y, top: y, left: x, right: x + width, bottom: y + height, width, height, toJSON: () => ({}) } as DOMRect;
}

const clipModes: ContentClipMode[] = ['shape', 'bounds', 'none'];

describe('Container shared geometry observation', () => {
  beforeEach(() => {
    GeometryObserver.instances = [];
    vi.stubGlobal('ResizeObserver', GeometryObserver);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(160, 80));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it.each(clipModes)('keeps root border-box measurement without any clipping-only observer in %s mode', async (contentClip) => {
    const shapeProvider = new RoundedRectangleShapeProvider(CornerRadius.LARGE);
    const draw = (padding: string) => (
      <Container width="160px" height="80px" contentClip={contentClip} shapeProvider={shapeProvider} contentScaleForStateFn={() => 1} contentStyle={{ padding, display: 'grid', gridTemplateColumns: '100px', gridTemplateRows: '40px' }}>
        <input />
      </Container>
    );
    const view = render(draw('4px 12px'));
    try {
      const root = view.container.firstElementChild as HTMLElement;
      const surface = root.querySelector<HTMLElement>('[data-uit-content-surface]')!;
      const canvas = root.querySelector('canvas')!;
      expect(GeometryObserver.instances).toHaveLength(1);
      const borderObserver = GeometryObserver.instances[0];
      expect(borderObserver.targets.get(root)?.box).toBe('border-box');
      expect(Array.from(borderObserver.targets.keys())).toEqual([root]);
      expect(GeometryObserver.instances.some(observer => Array.from(observer.targets.values()).some(options => options?.box === 'content-box'))).toBe(false);
      const initialCanvasWidth = canvas.style.width;
      view.rerender(draw('8px 24px'));
      expect(surface).toHaveStyle({ padding: '8px 24px', margin: '0px', display: 'grid' });
      expect(root).toHaveStyle({ padding: '0px', borderWidth: '0px' });
      expect(canvas.style.width).toBe(initialCanvasWidth);
      root.style.width = '220px';
      root.style.height = '90px';
      borderObserver.emit(root, 220, 90);
      await waitFor(() => {
        expect(canvas.style.width).toBe('284px');
        expect(canvas.style.height).toBe('154px');
        if (contentClip === 'shape') {
          expect(surface.style.clipPath).toContain(shapeProvider.getShapePath({ width: 220, height: 90 }));
        } else if (contentClip === 'bounds') {
          expect(surface.style.clipPath).toContain('inset(');
          expect(surface.style.clipPath).toContain('220px');
          expect(surface.style.clipPath).toContain('90px');
        } else {
          expect(surface.style.clipPath).toBe('');
        }
      });
      expect(surface.style.overflow).toBe(contentClip === 'none' ? 'visible' : 'hidden');
      expect(GeometryObserver.instances).toHaveLength(1);
      view.unmount();
      expect(borderObserver.targets.size).toBe(0);
    } finally {
      view.unmount();
    }
  });

  it('retains the sole root border observer and content nodes across all clipping modes', () => {
    const draw = (contentClip: ContentClipMode) => <Container contentClip={contentClip} contentScaleForStateFn={() => 1}><input defaultValue="retained" /></Container>;
    const view = render(draw('shape'));
    try {
      const root = view.container.firstElementChild as HTMLElement;
      const input = root.querySelector('input')!;
      const surface = input.parentElement!;
      const borderObserver = GeometryObserver.instances[0];
      act(() => input.focus());
      for (const mode of ['none', 'bounds', 'shape'] as const) {
        view.rerender(draw(mode));
        expect(GeometryObserver.instances).toHaveLength(1);
        expect(Array.from(borderObserver.targets.entries())).toEqual([[root, { box: 'border-box' }]]);
        expect(root.querySelector('[data-uit-content-surface]')).toBe(surface);
        expect(root.querySelector('input')).toBe(input);
        expect(input).toHaveValue('retained');
        expect(document.activeElement).toBe(input);
      }
      view.unmount();
      expect(borderObserver.targets.size).toBe(0);
    } finally {
      view.unmount();
    }
  });

  describe.each(clipModes)('StaticContainer %s history', (contentClip) => {
    it.each(['root border box', 'surface content box', 'no notification'] as const)('uses the last participant positions from %s', (trigger) => {
      vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
      let rootRect = rect(160, 80, 100, 200);
      let participantRect = rect(80, 28, 110, 206);
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        return this.dataset.uitLayoutTransitionPart === 'label' ? participantRect : rootRect;
      });
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => rootRect.width);
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => rootRect.height);
      const draw = (width: number, token: number) => (
        <StaticContainer width={width} height={80} contentClip={contentClip} contentStyle={{ padding: '4px 12px' }} layoutTransitionToken={token}>
          <span data-uit-layout-transition-part="label">Retained label</span>
        </StaticContainer>
      );
      const view = render(draw(160, 0));
      try {
        const root = view.container.firstElementChild as HTMLElement;
        const surface = root.querySelector<HTMLElement>('[data-uit-content-surface]')!;
        const participant = surface.querySelector<HTMLElement>('[data-uit-layout-transition-part]')!;
        expect(GeometryObserver.instances).toHaveLength(2);
        const borderObserver = GeometryObserver.instances.find(observer => observer.targets.get(root)?.box === 'border-box')!;
        const historyObserver = GeometryObserver.instances.find(observer => observer.targets.get(surface)?.box === 'content-box')!;
        expect(borderObserver).toBeDefined();
        expect(historyObserver).toBeDefined();
        expect(historyObserver.targets.has(root)).toBe(false);
        expect(Array.from(historyObserver.targets.keys())).toEqual([surface]);
        participantRect = rect(80, 28, 120, 206);
        if (trigger === 'root border box') {
          rootRect = rect(180, 80, 100, 200);
          borderObserver.emit(root, 180, 80);
        } else if (trigger === 'surface content box') {
          surface.style.padding = '8px 24px';
          historyObserver.emit(surface, 112, 64);
        }
        rootRect = rect(220, 80, 100, 130);
        participantRect = rect(80, 28, 140, 136);
        view.rerender(draw(220, 1));
        expect(root.style.width).toBe(trigger === 'root border box' ? '180px' : '160px');
        expect(participant.style.transform).toBe(trigger === 'no notification' ? 'translate(-30px, 0px)' : 'translate(-20px, 0px)');
        expect(surface.parentElement).toBe(root);
        expect(surface.querySelector('[data-uit-layout-transition-part]')).toBe(participant);
        expect(surface.style.overflow).toBe(contentClip === 'none' ? 'visible' : 'hidden');
        if (contentClip === 'none') expect(surface.style.clipPath).toBe('');
        if (contentClip === 'bounds') {
          expect(surface.style.clipPath).toContain('inset(');
          expect(surface.style.clipPath).toContain('80px');
          expect(surface.style.clipPath).toContain('round 0px');
        }
        expect(GeometryObserver.instances).toHaveLength(2);
        view.unmount();
        expect(borderObserver.targets.size).toBe(0);
        expect(historyObserver.targets.size).toBe(0);
      } finally {
        view.unmount();
      }
    });
  });
});
