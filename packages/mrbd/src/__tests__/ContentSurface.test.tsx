/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { act, fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Container, StaticContainer, ContentLayout } from '@wearables-ui-toolkit/foundation';

describe.each([['interactive', Container], ['static', StaticContainer]] as const)('%s shared content surface', (_name, Component) => {
  it('owns content padding on one normal-flow clipped element, with zero root-inset snapshots on public updates', async () => {
    const view = (padding: string) => <Component width={160} height={80} contentStyle={{ padding }}><input defaultValue="retained" /></Component>;
    const { container, rerender } = render(view('4px 12px'));
    await act(async () => {});
    const root = container.firstElementChild as HTMLElement;
    const input = root.querySelector('input')!;
    const surface = input.parentElement!;
    expect(surface.parentElement).toBe(root);
    expect(surface).toHaveAttribute('data-uit-content-surface');
    expect(root).toHaveStyle({ padding: '0px', borderWidth: '0px', overflow: 'visible' });
    expect(surface).toHaveStyle({ padding: '4px 12px', boxSizing: 'border-box', overflow: 'hidden' });
    fireEvent.change(input, { target: { value: 'edited' } });
    input.focus();
    const styleRead = vi.spyOn(window, 'getComputedStyle');
    try {
      rerender(view('8px 24px'));
      expect(surface.style.padding).toBe('8px 24px');
      expect(styleRead.mock.calls.filter(([element]) => element === root)).toHaveLength(0);
      expect(root.querySelector('input')).toBe(input);
      expect(input.value).toBe('edited');
      expect(document.activeElement).toBe(input);
    } finally { styleRead.mockRestore(); }
  });

  it('keeps shape, rectangular bounds and unclipped modes on the same content node', () => {
    const view = (mode: 'shape' | 'bounds' | 'none') => <Component width={160} height={80} contentClip={mode} contentStyle={{ padding: '4px 12px' }}><span>Content</span></Component>;
    const { container, rerender } = render(view('shape'));
    const surface = container.querySelector<HTMLElement>('[data-uit-content-surface]')!;
    expect(surface.style.clipPath).toContain('path(');
    rerender(view('bounds'));
    expect(container.querySelector('[data-uit-content-surface]')).toBe(surface);
    expect(surface.style.clipPath).toContain('inset(');
    expect(surface.style.clipPath).toContain('160px');
    expect(surface.style.clipPath).toContain('80px');
    expect(surface.style.overflow).toBe('hidden');
    rerender(view('none'));
    expect(container.querySelector('[data-uit-content-surface]')).toBe(surface);
    expect(surface.style.overflow).toBe('visible');
  });

  it.each([['bounds', true], ['shape', false]] as const)('clips oversized padding to physical root dimensions in %s mode, smooth=%s', (contentClip, smooth) => {
    const { container } = render(<Component width={100} height={40} contentClip={contentClip} {...(_name === 'static' ? { useSmoothCorners: smooth } : {})} contentStyle={{ padding: '80px 70px 60px 50px' }}><span>Oversized</span></Component>);
    const surface = container.querySelector<HTMLElement>('[data-uit-content-surface]')!;
    if (contentClip === 'bounds' || _name === 'static') {
      expect(surface.style.clipPath).toContain('inset(');
      expect(surface.style.clipPath).toContain('100px');
      expect(surface.style.clipPath).toContain('40px');
    } else {
      expect(surface.style.clipPath).toContain('path(');
    }
    expect(surface.parentElement).toBe(container.firstElementChild);
    expect(surface.style.padding).toBe('80px 70px 60px 50px');
  });

  it('retains a root geometry box for untyped display:contents, and supports whole-component hiding', () => {
    const { container, rerender } = render(<Component width={100} height={40} style={{ display: 'contents' } as never}>Content</Component>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.display).toBe('inline-flex');
    rerender(<Component width={100} height={40} style={{ display: 'none' }}>Content</Component>);
    expect(container.firstElementChild).toBe(root);
    expect(root.style.display).toBe('none');
  });

  it('keeps a clipping box when untyped content styles request box removal or independent geometry', () => {
    const { container } = render(<Component width={160} height={80} contentStyle={{ display: 'contents', rotate: '30deg', zoom: 2 } as never}><span>Visible</span></Component>);
    const surface = container.querySelector<HTMLElement>('[data-uit-content-surface]')!;
    expect(surface.style.display).toBe('block');
    expect(surface.style.rotate).toBe('none');
    expect(surface.style.zoom).toBe('1');
    expect(surface.style.clipPath).toContain('path(');
    expect(surface.style.overflow).toBe('hidden');
  });

  it('allows explicit independently sized absolute-content reference layout without changing the surface envelope', () => {
    const { container } = render(<Component width={160} height={80} contentStyle={{ padding: '4px 12px' }}><ContentLayout style={{ width: '100%', height: '100%' }}><span style={{ position: 'absolute', right: '10%', bottom: 0 }}>Positioned</span></ContentLayout></Component>);
    const surface = container.querySelector<HTMLElement>('[data-uit-content-surface]')!;
    const layout = surface.firstElementChild as HTMLElement;
    expect(layout).toHaveStyle({ position: 'relative', width: '100%', height: '100%' });
    expect(surface).toHaveStyle({ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box' });
  });
});
