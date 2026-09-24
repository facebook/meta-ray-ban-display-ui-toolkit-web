/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Carousel tests
 * Covers item centering and boundary focus behavior.
 */

import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  Carousel,
  CarouselIndicatorPlacement,
  CarouselVerticalAlignment,
} from '@wearables-ui-toolkit/foundation';
import type { CarouselHandle } from '@wearables-ui-toolkit/foundation';
import { PaginationMode } from '../mrbd/ui/PaginationIndicator';

describe('Carousel layout', () => {
  let clientWidthSpy: ReturnType<typeof vi.spyOn>;
  let offsetWidthSpy: ReturnType<typeof vi.spyOn>;
  let scrollToMock: ReturnType<typeof vi.fn>;

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
    scrollToMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollToMock,
    });
  });

  afterEach(() => {
    clientWidthSpy.mockRestore();
    offsetWidthSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('getRootElement returns the rendered carousel root through the ref', () => {
    const ref = vi.fn();

    const { container } = render(
      <Carousel ref={ref}>
        <button>One</button>
      </Carousel>,
    );

    const handle = ref.mock.calls[ref.mock.calls.length - 1]?.[0];
    // The callback ref receives the live imperative handle whose
    // getRootElement points at the actual rendered root node.
    expect(handle.getRootElement()).toBe(container.firstElementChild);
  });

  it('scrolls, centers, and focuses an item via the scrollToPosition handle', () => {
    // scrollToPosition scrolls the item into view, centers/focuses it, and fires
    // `onItemCentered`.
    const handleItemCentered = vi.fn();
    const ref = createRef<CarouselHandle>();
    const { container } = render(
      <Carousel ref={ref} onItemCentered={handleItemCentered}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );
    scrollToMock.mockClear();

    act(() => {
      ref.current?.scrollToPosition(2);
    });

    expect(container.firstElementChild).toHaveAttribute('data-current-item', '2');
    expect(document.activeElement).toBe(screen.getByText('Three'));
    expect(handleItemCentered).toHaveBeenCalledWith(2);
    expect(scrollToMock).toHaveBeenCalled();
  });

  it('ignores scrollToPosition for an out-of-range index', () => {
    const handleItemCentered = vi.fn();
    const ref = createRef<CarouselHandle>();
    const { container } = render(
      <Carousel ref={ref} onItemCentered={handleItemCentered}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );

    act(() => {
      ref.current?.scrollToPosition(5);
    });

    expect(container.firstElementChild).toHaveAttribute('data-current-item', '0');
    expect(handleItemCentered).not.toHaveBeenCalled();
  });

  it('centers first and last items with edge offsets', async () => {
    const { container } = render(
      <Carousel>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );

    await waitFor(() => {
      expect(container.querySelector<HTMLElement>('[data-item-index="0"]')?.style.marginLeft)
        .toBe('68px');
    });
    expect(container.querySelector<HTMLElement>('[data-item-index="2"]')?.style.marginRight)
      .toBe('68px');
    expect(container.querySelector<HTMLElement>('[data-item-index="1"]')?.style.marginLeft)
      .toBe('12px');
  });

  it('uses under-indicator spacing classes for text and dots modes', () => {
    const { container, rerender } = render(
      <Carousel paginationMode={PaginationMode.TEXT}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );

    expect(container.querySelector('.paginationUnder.paginationText')).not.toBeNull();

    rerender(
      <Carousel paginationMode={PaginationMode.DOTS}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );

    expect(container.querySelector('.paginationUnder.paginationDots')).not.toBeNull();
  });

  it('applies pagination visibility thresholds by mode', () => {
    const { container, rerender } = render(
      <Carousel paginationMode={PaginationMode.TEXT}>
        <button>Only</button>
      </Carousel>,
    );

    expect(container.querySelector('.paginationUnder.paginationText')).not.toBeNull();
    expect(container).toHaveTextContent('1 of 1');

    rerender(
      <Carousel paginationMode={PaginationMode.DOTS}>
        <button>Only</button>
      </Carousel>,
    );

    expect(container.querySelector('.paginationUnder.paginationDots')).toBeNull();
  });

  it('moves focus right without wrapping past the last item', async () => {
    const handleItemCentered = vi.fn();
    const { container } = render(
      <Carousel onItemCentered={handleItemCentered}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );

    const one = screen.getByText('One');
    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowRight' });

    expect(container.firstElementChild).toHaveAttribute('data-current-item', '1');
    expect(document.activeElement).toBe(screen.getByText('Two'));
    expect(handleItemCentered).toHaveBeenCalledWith(1);

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });

    expect(container.firstElementChild).toHaveAttribute('data-current-item', '1');
    expect(document.activeElement).toBe(screen.getByText('Two'));
  });

  it('contains handled item navigation but lets boundary keys reach the parent pager', async () => {
    const handleParentKeyDown = vi.fn();
    const { container } = render(
      <div onKeyDown={handleParentKeyDown}>
        <Carousel>
          <button>One</button>
          <button>Two</button>
        </Carousel>
      </div>,
    );

    const firstItem = screen.getByText('One');
    firstItem.focus();
    const moveEvent = createEvent.keyDown(firstItem, {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });

    fireEvent(firstItem, moveEvent);

    expect(moveEvent.defaultPrevented).toBe(true);
    expect(handleParentKeyDown).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(container.querySelector('[data-current-item]')).toHaveAttribute(
        'data-current-item',
        '1',
      );
      expect(document.activeElement).toBe(screen.getByText('Two'));
    });

    const boundaryEvent = createEvent.keyDown(screen.getByText('Two'), {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });

    fireEvent(screen.getByText('Two'), boundaryEvent);

    expect(boundaryEvent.defaultPrevented).toBe(false);
    expect(handleParentKeyDown).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByText('Two'));
  });

  it('hands focus from the scroll surface to the currently centered item', () => {
    const { container } = render(
      <Carousel initialIndex={1}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );

    const list = container.querySelector<HTMLElement>('[role="list"]');
    list?.focus();

    expect(container.firstElementChild).toHaveAttribute('data-current-item', '1');
    expect(document.activeElement).toBe(screen.getByText('Two'));
  });

  it('recenters the current item when focus re-enters it', () => {
    render(
      <Carousel>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );
    scrollToMock.mockClear();

    screen.getByText('One').focus();

    expect(scrollToMock).toHaveBeenCalledWith({
      left: 0,
      behavior: 'smooth',
    });
  });

  it('applies overlay placement and bottom alignment classes', () => {
    const { container } = render(
      <Carousel
        indicatorPlacement={CarouselIndicatorPlacement.BOTTOM_OVERLAY}
        verticalAlignment={CarouselVerticalAlignment.BOTTOM}
      >
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );

    expect(container.querySelector('.paginationOverlay')).not.toBeNull();
    expect(container.querySelector('[role="list"]')).toHaveClass('alignBottom');
  });

  it('shows horizontal fading edges only when content is offscreen in that direction', async () => {
    const { container } = render(
      <Carousel>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );

    const list = container.querySelector<HTMLElement>('[role="list"]')!;
    Object.defineProperty(list, 'clientWidth', {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(list, 'scrollWidth', {
      configurable: true,
      value: 900,
    });
    Object.defineProperty(list, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: 0,
    });
    fireEvent.scroll(list);

    const leftFade = container.querySelector<HTMLElement>('[data-edge="left"]')!;
    const rightFade = container.querySelector<HTMLElement>('[data-edge="right"]')!;

    await waitFor(() => {
      // Default fading edge is 32px.
      expect(leftFade.style.width).toBe('32px');
      expect(leftFade.style.opacity).toBe('0');
      expect(rightFade.style.width).toBe('32px');
      expect(rightFade.style.opacity).toBe('1');
    });

    Object.defineProperty(list, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: 600,
    });
    fireEvent.scroll(list);

    await waitFor(() => {
      expect(leftFade.style.opacity).toBe('1');
      expect(rightFade.style.opacity).toBe('0');
    });
  });

  it('uses a configurable fixed horizontal fading edge length', async () => {
    const { container } = render(
      <Carousel fadingEdgeLength={40}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );

    const list = container.querySelector<HTMLElement>('[role="list"]')!;
    Object.defineProperty(list, 'clientWidth', {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(list, 'scrollWidth', {
      configurable: true,
      value: 900,
    });
    Object.defineProperty(list, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: 20,
    });
    fireEvent.scroll(list);

    const leftFade = container.querySelector<HTMLElement>('[data-edge="left"]')!;
    const rightFade = container.querySelector<HTMLElement>('[data-edge="right"]')!;

    await waitFor(() => {
      expect(leftFade.style.width).toBe('40px');
      expect(leftFade.style.opacity).toBe('0.5');
      expect(rightFade.style.width).toBe('40px');
      expect(rightFade.style.opacity).toBe('1');
    });
  });
});
