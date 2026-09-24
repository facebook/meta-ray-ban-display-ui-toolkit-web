/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaginationMode } from '../mrbd/ui/PaginationIndicator';
import { CarouselFrame } from '@wearables-ui-toolkit/foundation/components/private/CarouselFrame';
import {
  CarouselIndicatorPlacement,
} from '@wearables-ui-toolkit/foundation/components/Carousel.types';

function renderFrame(overrides = {}) {
  return render(
    <CarouselFrame
      rootRef={() => {}}
      scrollAreaRef={() => {}}
      items={[<button key="one">Card 1</button>, <button key="two">Card 2</button>]}
      itemCount={2}
      currentIndex={0}
      itemGap={24}
      edgeOffsets={{ start: 0, end: 0 }}
      containerClassName="carousel"
      style={{ width: 400 }}
      alignmentClass="center"
      fadingEdgeOverlayStyles={{
        top: {},
        bottom: {},
        left: { width: 64, opacity: 0 },
        right: { width: 64, opacity: 0 },
      }}
      tabIndex={0}
      onKeyDown={vi.fn()}
      onScrollAreaFocus={vi.fn()}
      onScroll={vi.fn()}
      setItemRef={() => () => {}}
      onItemFocus={vi.fn()}
      shouldShowPagination
      indicatorPlacement={CarouselIndicatorPlacement.UNDER}
      overlayDistance={24}
      paginationMode={PaginationMode.TEXT}
      indicatorCurrentIndex={0}
      indicatorItemCount={2}
      {...overrides}
    />,
  );
}

describe('CarouselFrame', () => {
  it('renders a carousel region with list items', () => {
    renderFrame({ ariaLabel: 'Featured' });

    expect(screen.getByRole('region', { name: 'Featured' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('marks the centered item', () => {
    const { container } = renderFrame({ currentIndex: 1 });

    expect(container.querySelector('[data-item-index="1"]')).toHaveAttribute(
      'data-centered',
      'true',
    );
  });

  it('can omit pagination', () => {
    const { container } = renderFrame({ shouldShowPagination: false });

    expect(container.textContent).not.toContain('1 of 2');
  });
});
