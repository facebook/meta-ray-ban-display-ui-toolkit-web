/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Carousel progress-indicator customization tests.
 *
 * Exercises the `progressIndicatorCustomizationOverride` hook, which threads the
 * returned `currentIndex` / `totalItems` / `isVisible` into the rendered
 * indicator.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Carousel } from '@wearables-ui-toolkit/foundation';
import type { ProgressIndicatorCustomization } from '@wearables-ui-toolkit/foundation';
import { App } from '../mrbd/app/App';
import { PaginationMode } from '../mrbd/ui/PaginationIndicator';

describe('Carousel progressIndicatorCustomizationOverride', () => {
  let scrollToMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollToMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollToMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invokes the override with the active index and item count', () => {
    const override = vi.fn(
      (index: number, numItems: number): ProgressIndicatorCustomization => ({
        currentIndex: index,
        totalItems: numItems,
        isVisible: true,
      }),
    );

    render(
      <Carousel
        paginationMode={PaginationMode.TEXT}
        progressIndicatorCustomizationOverride={override}
      >
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );

    // The override is invoked with the active position and item count.
    expect(override).toHaveBeenCalledWith(0, 3);
  });

  it('remaps currentIndex and totalItems in the rendered TEXT indicator', () => {
    const { container } = render(
      <Carousel
        paginationMode={PaginationMode.TEXT}
        progressIndicatorCustomizationOverride={() => ({
          currentIndex: 4,
          totalItems: 9,
          isVisible: true,
        })}
      >
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );

    // currentIndex 4 -> "5 of 9" (TEXT is 1-based: currentPage + 1).
    expect(container).toHaveTextContent('5 of 9');
    expect(container).not.toHaveTextContent('1 of 3');
  });

  it('remaps the dot count in the rendered DOTS indicator', () => {
    const { container } = render(
      <App>
        <Carousel
          paginationMode={PaginationMode.DOTS}
          progressIndicatorCustomizationOverride={() => ({
            currentIndex: 0,
            totalItems: 3,
            isVisible: true,
          })}
        >
          <button>One</button>
          <button>Two</button>
        </Carousel>
      </App>,
    );

    const dotsContainer = container.querySelector('[class*="dotsContainer"]');
    expect(dotsContainer).not.toBeNull();
    // totalItems 3 drives 3 dots, even though there are only 2 carousel items.
    expect(dotsContainer?.children).toHaveLength(3);
  });

  it('hides the indicator when the override returns isVisible: false', () => {
    const { container } = render(
      <Carousel
        paginationMode={PaginationMode.TEXT}
        progressIndicatorCustomizationOverride={() => ({
          currentIndex: 0,
          totalItems: 3,
          isVisible: false,
        })}
      >
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );

    // `isVisible: false` hides the indicator entirely.
    expect(container.querySelector('[class*="paginationText"]')).toBeNull();
    expect(container).not.toHaveTextContent('1 of 3');
  });
});
