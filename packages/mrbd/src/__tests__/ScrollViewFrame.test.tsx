/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScrollViewFrame } from '@wearables-ui-toolkit/foundation/components/private/ScrollViewFrame';
import { ScrollViewOrientation } from '@wearables-ui-toolkit/foundation/components/ScrollView.types';

function renderFrame(overrides = {}) {
  return render(
    <ScrollViewFrame
      className="custom-scroll"
      frameStyle={{ width: 200, height: 100 }}
      scrollRef={() => {}}
      scrollViewStyle={{ overflowY: 'auto' }}
      orientation={ScrollViewOrientation.VERTICAL}
      tabIndex={0}
      ariaLabel="Menu"
      onScroll={vi.fn()}
      onFocus={vi.fn()}
      onKeyDown={vi.fn()}
      isScrollbarEnabled
      contentOverflows
      fadingEdgeOverlayStyles={{
        top: { height: 64, opacity: 0 },
        bottom: { height: 64, opacity: 1 },
        left: { width: 0, opacity: 0 },
        right: { width: 0, opacity: 0 },
      }}
      scrollbarVisible
      scrollbarTrackStyle={{ height: 80 }}
      scrollbarHandleStyle={{ height: 20, transform: 'translateY(4px)' }}
      {...overrides}
    >
      <button>Item</button>
    </ScrollViewFrame>,
  );
}

describe('ScrollViewFrame', () => {
  it('renders the scroll region and content slot', () => {
    renderFrame();

    expect(screen.getByRole('region', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Item' })).toBeInTheDocument();
  });

  it('renders a floating scrollbar when enabled and overflowing', () => {
    const { container } = renderFrame();

    const scrollbar = container.querySelector('[class*="scrollbarContainer"]');
    expect(scrollbar).not.toBeNull();
    expect(scrollbar).toHaveAttribute('data-visible', 'true');
  });

  it('omits the scrollbar when disabled', () => {
    const { container } = renderFrame({ isScrollbarEnabled: false });

    expect(container.querySelector('[class*="scrollbarContainer"]')).toBeNull();
  });

  it('uses the content slot as the default focus boundary', () => {
    const { container } = renderFrame();

    const content = container.querySelector(
      '[data-uit-focus-boundary-root="true"]',
    );
    expect(content).not.toBeNull();
    expect(content).toContainElement(screen.getByRole('button', { name: 'Item' }));
  });
});
