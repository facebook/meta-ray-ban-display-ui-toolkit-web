/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContextMenuFrame } from '../mrbd/ui/private/ContextMenuFrame';

function renderFrame(overrides = {}) {
  return render(
    <ContextMenuFrame
      containerRef={() => {}}
      scrollRef={() => {}}
      className="custom-menu"
      containerStyle={{ width: 320, height: 96 }}
      pathD="M 0 0 H 320 V 96 H 0 Z"
      effectiveWidth={320}
      effectiveHeight={96}
      shadowOffsetY={4}
      scrollViewportStyle={{ width: 300 }}
      fadingEdgeStrengths={{ left: 0, right: 1 }}
      onKeyDown={vi.fn()}
      onScroll={vi.fn()}
      {...overrides}
    >
      <button>One</button>
    </ContextMenuFrame>,
  );
}

describe('ContextMenuFrame', () => {
  it('renders the menu and item slot', () => {
    renderFrame({ ariaLabel: 'Actions' });

    expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'One' })).toBeInTheDocument();
  });

  it('renders the material path when available', () => {
    const { container } = renderFrame();

    expect(container.querySelector('svg path')?.getAttribute('d')).toBe(
      'M 0 0 H 320 V 96 H 0 Z',
    );
  });

  it('applies independent fading edge opacity', () => {
    const { container } = renderFrame({ fadingEdgeStrengths: { left: 0.25, right: 0.75 } });
    const edges = container.querySelectorAll('[class*="fadingEdge"]');

    expect(edges[0]?.getAttribute('style')).toContain('opacity: 0.25');
    expect(edges[1]?.getAttribute('style')).toContain('opacity: 0.75');
  });
});
