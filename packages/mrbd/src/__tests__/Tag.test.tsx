/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Tag tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Tag } from '../mrbd/ui/Tag';

describe('Tag text property', () => {
  it('renders text when provided', () => {
    render(<Tag text="Beta" />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders empty when text is undefined', () => {
    const { container } = render(<Tag />);
    expect(container.textContent).toBe('');
  });

  it('updates text when prop changes', () => {
    const { rerender } = render(<Tag text="v1" />);
    expect(screen.getByText('v1')).toBeInTheDocument();

    rerender(<Tag text="v2" />);
    expect(screen.getByText('v2')).toBeInTheDocument();
  });
});

describe('Tag styling', () => {
  it('has the blend-mode class on container', () => {
    const { container } = render(<Tag text="Label" />);
    const tagEl = container.firstElementChild;
    expect(tagEl).not.toBeNull();
  });

  it('puts padding on the shared content surface while keeping the material root inset-free', () => {
    const { container } = render(<Tag text="Label" />);
    const tagEl = container.firstElementChild;
    expect(tagEl).toHaveStyle({ padding: '0px', borderWidth: '0px' });
    const textEl = container.querySelector('[class*="tagText"]');
    expect(textEl).not.toBeNull();
    expect(textEl?.parentElement).toHaveStyle({ padding: '4px 12px' });
    expect(textEl?.parentElement?.parentElement).toBe(tagEl);
    expect(textEl?.getAttribute('style') ?? '').not.toContain('padding');
  });

  it('uses StaticContainer as base (renders material background)', () => {
    const { container } = render(<Tag text="Test" />);
    // StaticContainer renders backgroundLayers
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
  });
});

describe('Tag content clipping', () => {
  it('clips the padded surface once without rounding the text', () => {
    const { container } = render(<Tag text="Beta" />);
    const root = container.firstElementChild as HTMLElement;
    const text = screen.getByText('Beta');
    const surface = text.parentElement!;

    expect(surface.parentElement).toBe(root);
    expect(root).toHaveStyle({ padding: '0px', overflow: 'visible' });
    expect(surface).toHaveStyle({ padding: '4px 12px', margin: '0px', overflow: 'hidden' });
    expect(surface.style.borderRadius).toBe(surface.style.clipPath === '' ? 'inherit' : '0px');
    expect(text.style.borderRadius).toBe('');
    expect(text.style.clipPath).toBe('');
    expect(text.style.overflow).toBe('');
  });

  it('keeps caller padding and content styling on the same outer-aligned surface', async () => {
    const { rerender } = render(
      <Tag text="Beta" contentClassName="label-content" contentStyle={{ padding: '2px 18px 6px 8px' }} />,
    );
    const surface = screen.getByText('Beta').parentElement!;
    expect(surface).toHaveClass('label-content');
    expect(surface).toHaveStyle({ padding: '2px 18px 6px 8px', margin: '0px' });

    rerender(<Tag text="Beta" contentClassName="label-content" contentStyle={{ padding: '8px 24px' }} />);
    await waitFor(() => expect(surface).toHaveStyle({ padding: '8px 24px', margin: '0px' }));
    expect(screen.getByText('Beta').parentElement).toBe(surface);
    expect(screen.getByText('Beta').style.borderRadius).toBe('');
  });

  it('follows runtime clipping changes without replacing the surface or masking text', () => {
    const { rerender } = render(<Tag text="Beta" contentClip="none" />);
    const text = screen.getByText('Beta');
    const surface = text.parentElement!;
    expect(text.closest('[data-uit-content-clip]')).toBeNull();

    rerender(<Tag text="Beta" contentClip="shape" />);
    expect(text.closest('[data-uit-content-clip]')).toBe(surface);
    expect(surface).toHaveStyle({ padding: '4px 12px', margin: '0px', overflow: 'hidden' });
    expect(text.style.clipPath).toBe('');

    rerender(<Tag text="Beta" contentClip="none" />);
    expect(text.parentElement).toBe(surface);
    expect(text.closest('[data-uit-content-clip]')).toBeNull();
  });

  it('retains the caller opt-out from outer clipping', () => {
    render(<Tag text="Beta" contentClip="none" />);
    const text = screen.getByText('Beta');
    const surface = text.parentElement!;
    expect(surface).toHaveStyle({ overflow: 'visible' });
    expect(surface.style.clipPath).toBe('');
    expect(text.style.clipPath).toBe('');
  });
});

describe('Tag text content', () => {
  it('renders its text element', () => {
    const { container } = render(<Tag text="Test" />);
    const textEl = container.querySelector('[class*="tagText"]');
    expect(textEl).not.toBeNull();
  });

  it('uses defaultStatic material (no gradient/glow)', () => {
    const { container } = render(<Tag text="Test" />);
    // Only 1 background layer (idle material), no focused/pressed layers
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
  });
});

describe('Tag blend mode (screen-composited view)', () => {
  it('has mix-blend-mode class on container', () => {
    const { container } = render(<Tag text="Test" />);
    const tagEl = container.firstElementChild;
    expect(tagEl?.className).toContain('tag');
  });
});

describe('Tag additional style prop', () => {
  it('accepts custom style overrides', () => {
    const { container } = render(<Tag text="Custom" style={{ opacity: 0.5 }} />);
    const tagEl = container.firstElementChild;
    const style = tagEl?.getAttribute('style') ?? '';
    expect(style).toContain('opacity: 0.5');
  });

  it('accepts custom className', () => {
    const { container } = render(<Tag text="Custom" className="my-tag" />);
    const tagEl = container.firstElementChild;
    expect(tagEl?.className).toContain('my-tag');
  });
});
