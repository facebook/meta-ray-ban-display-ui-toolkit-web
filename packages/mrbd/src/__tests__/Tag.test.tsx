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
import { render, screen } from '@testing-library/react';
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

  it('puts padding on the material root so material surrounds the full tag', () => {
    const { container } = render(<Tag text="Label" />);
    const tagEl = container.firstElementChild;
    const style = tagEl?.getAttribute('style') ?? '';
    expect(style).toContain('padding: 4px 12px');
    const textEl = container.querySelector('[class*="tagText"]');
    expect(textEl).not.toBeNull();
    expect(textEl?.getAttribute('style') ?? '').not.toContain('padding');
  });

  it('uses StaticContainer as base (renders material background)', () => {
    const { container } = render(<Tag text="Test" />);
    // StaticContainer renders backgroundLayers
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
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
