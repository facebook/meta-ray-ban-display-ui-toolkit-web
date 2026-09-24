/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Carousel `overlayDistance` tests.
 *
 * `overlayDistance` sets the pagination container's bottom offset in
 * `BOTTOM_OVERLAY` placement and is ignored in `UNDER` placement.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  Carousel,
  CarouselIndicatorPlacement,
} from '@wearables-ui-toolkit/foundation';
import {
  DEFAULT_CAROUSEL_OVERLAY_DISTANCE,
  getCarouselPaginationStyle,
} from '@wearables-ui-toolkit/foundation/components/private/CarouselLayout';
import styles from '@wearables-ui-toolkit/foundation/components/Carousel.module.css';
import { PaginationMode } from '../mrbd/ui/PaginationIndicator';

function getPaginationContainer(container: HTMLElement): HTMLElement | null {
  // Resolve by the CSS-module token without a CSS selector: the generated
  // scoped class name can contain characters that are invalid in a selector.
  return (
    Array.from(container.querySelectorAll<HTMLElement>('div')).find((el) =>
      el.classList.contains(styles.paginationContainer),
    ) ?? null
  );
}

describe('Carousel overlayDistance', () => {
  let clientWidthSpy: ReturnType<typeof vi.spyOn>;
  let offsetWidthSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clientWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockImplementation(function getClientWidth(this: HTMLElement) {
        return this.getAttribute('role') === 'list' ? 536 : 400;
      });
    offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(function getOffsetWidth(this: HTMLElement) {
        return this.getAttribute('role') === 'listitem' ? 400 : 536;
      });
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    clientWidthSpy.mockRestore();
    offsetWidthSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('defaults overlayDistance to 24px', () => {
    expect(DEFAULT_CAROUSEL_OVERLAY_DISTANCE).toBe(24);
  });

  it('applies overlayDistance as the bottom padding in BOTTOM_OVERLAY placement', () => {
    expect(
      getCarouselPaginationStyle({
        indicatorPlacement: CarouselIndicatorPlacement.BOTTOM_OVERLAY,
        overlayDistance: 40,
      }),
    ).toEqual({ paddingBottom: 40 });
  });

  it('ignores overlayDistance in UNDER placement', () => {
    expect(
      getCarouselPaginationStyle({
        indicatorPlacement: CarouselIndicatorPlacement.UNDER,
        overlayDistance: 40,
      }),
    ).toEqual({});
  });

  it('sets the pagination container bottom offset in BOTTOM_OVERLAY placement', () => {
    const { container } = render(
      <Carousel
        showPagination
        paginationMode={PaginationMode.DOTS}
        indicatorPlacement={CarouselIndicatorPlacement.BOTTOM_OVERLAY}
        overlayDistance={40}
      >
        <button>Card 1</button>
        <button>Card 2</button>
      </Carousel>,
    );

    const pagination = getPaginationContainer(container);
    expect(pagination).not.toBeNull();
    expect(pagination?.style.paddingBottom).toBe('40px');
  });

  it('falls back to the default overlayDistance in BOTTOM_OVERLAY placement', () => {
    const { container } = render(
      <Carousel
        showPagination
        paginationMode={PaginationMode.DOTS}
        indicatorPlacement={CarouselIndicatorPlacement.BOTTOM_OVERLAY}
      >
        <button>Card 1</button>
        <button>Card 2</button>
      </Carousel>,
    );

    const pagination = getPaginationContainer(container);
    expect(pagination?.style.paddingBottom).toBe(
      `${DEFAULT_CAROUSEL_OVERLAY_DISTANCE}px`,
    );
  });

  it('does not apply overlayDistance to the pagination container in UNDER placement', () => {
    const { container } = render(
      <Carousel
        showPagination
        paginationMode={PaginationMode.DOTS}
        indicatorPlacement={CarouselIndicatorPlacement.UNDER}
        overlayDistance={40}
      >
        <button>Card 1</button>
        <button>Card 2</button>
      </Carousel>,
    );

    const pagination = getPaginationContainer(container);
    expect(pagination).not.toBeNull();
    expect(pagination?.style.paddingBottom).toBe('');
  });
});
