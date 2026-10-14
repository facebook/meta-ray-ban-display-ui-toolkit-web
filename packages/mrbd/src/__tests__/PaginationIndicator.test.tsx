/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * PaginationIndicator tests
 *
 * Constants:
 * - ACTIVE_DOT_SIZE = 12
 * - INACTIVE_DOT_SIZE = 8
 * - OVERFLOW_DOT_SIZE = 4
 * - DOT_SPACING = 8
 * - REAL_DOT_COUNT = 3
 * - Text format: "X of Y"
 * - Modes: TEXT, DOTS
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaginationIndicator, PaginationMode } from '../mrbd/ui/PaginationIndicator';
import { calculatePaginationVisibleWindow } from '../mrbd/ui/private/PaginationIndicatorLayout';

describe('PaginationIndicator initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<PaginationIndicator />);
    expect(container.firstElementChild).toBeNull(); // pageCount=0, renders nothing
  });

  it('renders in TEXT mode with pages', () => {
    const { container } = render(
      <PaginationIndicator mode={PaginationMode.TEXT} pageCount={5} currentPage={0} />
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders in DOTS mode with pages', () => {
    const { container } = render(
      <PaginationIndicator mode={PaginationMode.DOTS} pageCount={5} currentPage={0} />
    );
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe('PaginationMode enum', () => {
  it('TEXT = "text"', () => {
    expect(PaginationMode.TEXT).toBe('text');
  });
  it('DOTS = "dots"', () => {
    expect(PaginationMode.DOTS).toBe('dots');
  });
});

describe('PaginationIndicator TEXT mode', () => {
  it('displays "1 of 5" for first page', () => {
    const { container } = render(
      <PaginationIndicator mode={PaginationMode.TEXT} pageCount={5} currentPage={0} />
    );
    expect(container.textContent).toContain('1 of 5');
  });

  it('displays "3 of 5" for third page', () => {
    const { container } = render(
      <PaginationIndicator mode={PaginationMode.TEXT} pageCount={5} currentPage={2} />
    );
    expect(container.textContent).toContain('3 of 5');
  });

  it('displays "5 of 5" for last page', () => {
    const { container } = render(
      <PaginationIndicator mode={PaginationMode.TEXT} pageCount={5} currentPage={4} />
    );
    expect(container.textContent).toContain('5 of 5');
  });

  it('single page shows "1 of 1"', () => {
    const { container } = render(
      <PaginationIndicator mode={PaginationMode.TEXT} pageCount={1} currentPage={0} />
    );
    expect(container.textContent).toContain('1 of 1');
  });

  it('updates on page change', () => {
    const { container, rerender } = render(
      <PaginationIndicator mode={PaginationMode.TEXT} pageCount={5} currentPage={0} />
    );
    expect(container.textContent).toContain('1 of 5');

    rerender(
      <PaginationIndicator mode={PaginationMode.TEXT} pageCount={5} currentPage={3} />
    );
    expect(container.textContent).toContain('4 of 5');
  });

  it('passes a one-based page to a custom text formatter', () => {
    const formatText = vi.fn(
      (displayPage: number, pageCount: number) =>
        `${displayPage} sur ${pageCount}`,
    );
    render(
      <PaginationIndicator
        mode={PaginationMode.TEXT}
        pageCount={5}
        currentPage={2}
        formatText={formatText}
      />
    );

    expect(screen.getByText('3 sur 5')).toBeInTheDocument();
    expect(formatText).toHaveBeenCalledWith(3, 5);
  });

  it('updates the label when the formatter or page state changes', () => {
    const french = (displayPage: number, pageCount: number) =>
      `${displayPage} sur ${pageCount}`;
    const german = (displayPage: number, pageCount: number) =>
      `${displayPage} von ${pageCount}`;
    const { rerender } = render(
      <PaginationIndicator pageCount={5} currentPage={2} formatText={french} />,
    );
    expect(screen.getByText('3 sur 5')).toBeInTheDocument();

    rerender(
      <PaginationIndicator pageCount={5} currentPage={2} formatText={german} />,
    );
    expect(screen.getByText('3 von 5')).toBeInTheDocument();

    rerender(
      <PaginationIndicator pageCount={7} currentPage={3} formatText={german} />,
    );
    expect(screen.getByText('4 von 7')).toBeInTheDocument();
  });

  it('formats only visible text across empty and dot-mode transitions', () => {
    const formatText = vi.fn(
      (displayPage: number, pageCount: number) =>
        `${displayPage} sur ${pageCount}`,
    );
    const { container, rerender } = render(
      <PaginationIndicator pageCount={0} formatText={formatText} />,
    );
    expect(container.firstElementChild).toBeNull();
    expect(formatText).not.toHaveBeenCalled();

    rerender(<PaginationIndicator pageCount={2} formatText={formatText} />);
    expect(screen.getByText('1 sur 2')).toBeInTheDocument();
    expect(formatText).toHaveBeenCalledWith(1, 2);

    formatText.mockClear();
    rerender(
      <PaginationIndicator
        mode={PaginationMode.DOTS}
        pageCount={2}
        formatText={formatText}
      />,
    );
    expect(formatText).not.toHaveBeenCalled();
    expect(container.querySelector('[class*="dotsContainer"]')?.children).toHaveLength(2);
    expect(container.firstElementChild).not.toHaveAttribute('formatText');

    rerender(<PaginationIndicator pageCount={0} formatText={formatText} />);
    expect(container.firstElementChild).toBeNull();
    expect(formatText).not.toHaveBeenCalled();
  });

  it('keeps the chip text to one stable line during page changes', () => {
    const { rerender } = render(
      <PaginationIndicator mode={PaginationMode.TEXT} pageCount={5} currentPage={1} />
    );
    expect(screen.getByText('2 of 5')).toHaveStyle({
      whiteSpace: 'nowrap',
      width: 'max-content',
    });

    rerender(
      <PaginationIndicator mode={PaginationMode.TEXT} pageCount={5} currentPage={2} />
    );
    expect(screen.getByText('3 of 5')).toHaveStyle({
      whiteSpace: 'nowrap',
      width: 'max-content',
    });
  });
});

describe('PaginationIndicator DOTS mode', () => {
  it('renders correct number of dots for small page count', () => {
    const { container } = render(
      <PaginationIndicator mode={PaginationMode.DOTS} pageCount={3} currentPage={0} />
    );
    // Count direct children of the dots container (each is a dot div)
    const dotsContainer = container.querySelector('[class*="dotsContainer"]');
    const dots = dotsContainer?.children ?? [];
    expect(dots.length).toBe(3);
  });

  it('active dot has active class', () => {
    const { container } = render(
      <PaginationIndicator mode={PaginationMode.DOTS} pageCount={3} currentPage={1} />
    );
    const activeDots = container.querySelectorAll('[class*="dotActive"]');
    expect(activeDots.length).toBe(1);
  });

  it('renders overflow dots for large page count', () => {
    const { container } = render(
      <PaginationIndicator mode={PaginationMode.DOTS} pageCount={10} currentPage={0} />
    );
    const overflowDots = container.querySelectorAll('[class*="dotOverflow"]');
    expect(overflowDots.length).toBeGreaterThan(0);
  });

  it('active dot changes on page change', () => {
    const { container, rerender } = render(
      <PaginationIndicator mode={PaginationMode.DOTS} pageCount={5} currentPage={0} />
    );
    const activeDots1 = container.querySelectorAll('[class*="dotActive"]');
    expect(activeDots1.length).toBe(1);

    rerender(
      <PaginationIndicator mode={PaginationMode.DOTS} pageCount={5} currentPage={2} />
    );
    const activeDots2 = container.querySelectorAll('[class*="dotActive"]');
    expect(activeDots2.length).toBe(1);
  });

  it('retains the dot window while moving back inside the current window', () => {
    const { rerender, container } = render(
      <PaginationIndicator mode={PaginationMode.DOTS} pageCount={5} currentPage={0} />
    );

    rerender(
      <PaginationIndicator mode={PaginationMode.DOTS} pageCount={5} currentPage={3} />
    );
    const dotsAtPage4 = container.querySelector('[class*="dotsContainer"]')?.children ?? [];
    expect(dotsAtPage4.length).toBe(5);

    rerender(
      <PaginationIndicator mode={PaginationMode.DOTS} pageCount={5} currentPage={2} />
    );
    const dotsAtPage3 = container.querySelector('[class*="dotsContainer"]')?.children ?? [];
    expect(dotsAtPage3.length).toBe(5);
  });

  it('pure window calculation accepts the previous windowStart state', () => {
    const forwardWindow = calculatePaginationVisibleWindow(5, 3, 0);
    expect(forwardWindow.windowStart).toBe(1);
    expect(forwardWindow.visibleIndices).toEqual([0, 1, 2, 3, 4]);

    const reverseWithinWindow = calculatePaginationVisibleWindow(
      5,
      2,
      forwardWindow.windowStart,
    );
    expect(reverseWithinWindow.windowStart).toBe(1);
    expect(reverseWithinWindow.visibleIndices).toEqual([0, 1, 2, 3, 4]);
  });

  it('renders no active/overflow dots when pageCount is 0', () => {
    const { container } = render(
      <PaginationIndicator mode={PaginationMode.DOTS} pageCount={0} />
    );
    const activeDots = container.querySelectorAll('[class*="dotActive"]');
    const overflowDots = container.querySelectorAll('[class*="dotOverflow"]');
    expect(activeDots.length).toBe(0);
    expect(overflowDots.length).toBe(0);
  });
});

describe('PaginationIndicator custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <PaginationIndicator
        mode={PaginationMode.TEXT}
        pageCount={3}
        currentPage={0}
        className="my-pag"
      />
    );
    expect(container.firstElementChild?.className).toContain('my-pag');
  });
});
