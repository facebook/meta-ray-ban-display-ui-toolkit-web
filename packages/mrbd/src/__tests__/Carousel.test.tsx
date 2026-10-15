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

import {createRef, useState} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  Carousel,
  CarouselIndicatorPlacement,
  CarouselVerticalAlignment,
} from '@wearables-ui-toolkit/foundation';
import type {CarouselHandle} from '@wearables-ui-toolkit/foundation';
import {Carousel as DisplayCarousel} from '../mrbd/ui/Carousel';
import {PaginationMode} from '../mrbd/ui/PaginationIndicator';

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

    const {container} = render(
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
    const {container} = render(
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

    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '2',
    );
    expect(document.activeElement).toBe(screen.getByText('Three'));
    expect(handleItemCentered).toHaveBeenCalledWith(2);
    expect(scrollToMock).toHaveBeenCalled();
  });

  it('ignores scrollToPosition for an out-of-range index', () => {
    const handleItemCentered = vi.fn();
    const ref = createRef<CarouselHandle>();
    const {container} = render(
      <Carousel ref={ref} onItemCentered={handleItemCentered}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );

    act(() => {
      ref.current?.scrollToPosition(5);
    });

    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '0',
    );
    expect(handleItemCentered).not.toHaveBeenCalled();
  });

  it('centers first and last items with edge offsets', async () => {
    const {container} = render(
      <Carousel>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );

    await waitFor(() => {
      expect(
        container.querySelector<HTMLElement>('[data-item-index="0"]')?.style
          .marginLeft,
      ).toBe('68px');
    });
    expect(
      container.querySelector<HTMLElement>('[data-item-index="2"]')?.style
        .marginRight,
    ).toBe('68px');
    expect(
      container.querySelector<HTMLElement>('[data-item-index="1"]')?.style
        .marginLeft,
    ).toBe('12px');
  });

  it('uses under-indicator spacing classes for text and dots modes', () => {
    const {container, rerender} = render(
      <Carousel paginationMode={PaginationMode.TEXT}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );

    expect(
      container.querySelector('.paginationUnder.paginationText'),
    ).not.toBeNull();

    rerender(
      <Carousel paginationMode={PaginationMode.DOTS}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );

    expect(
      container.querySelector('.paginationUnder.paginationDots'),
    ).not.toBeNull();
  });

  it('applies pagination visibility thresholds by mode', () => {
    const {container, rerender} = render(
      <Carousel paginationMode={PaginationMode.TEXT}>
        <button>Only</button>
      </Carousel>,
    );

    expect(
      container.querySelector('.paginationUnder.paginationText'),
    ).not.toBeNull();
    expect(container).toHaveTextContent('1 of 1');

    rerender(
      <Carousel paginationMode={PaginationMode.DOTS}>
        <button>Only</button>
      </Carousel>,
    );

    expect(
      container.querySelector('.paginationUnder.paginationDots'),
    ).toBeNull();
  });

  it('moves focus right without wrapping past the last item', async () => {
    const handleItemCentered = vi.fn();
    const {container} = render(
      <Carousel onItemCentered={handleItemCentered}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );

    const one = screen.getByText('One');
    one.focus();
    fireEvent.keyDown(one, {key: 'ArrowRight'});

    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '1',
    );
    expect(document.activeElement).toBe(screen.getByText('Two'));
    expect(handleItemCentered).toHaveBeenCalledWith(1);

    fireEvent.keyDown(document.activeElement!, {key: 'ArrowRight'});

    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '1',
    );
    expect(document.activeElement).toBe(screen.getByText('Two'));
  });

  it('contains handled item navigation but lets boundary keys reach the parent pager', async () => {
    const handleParentKeyDown = vi.fn();
    const {container} = render(
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
    const {container} = render(
      <Carousel initialIndex={1}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );

    const list = container.querySelector<HTMLElement>('[role="list"]');
    act(() => list?.focus());

    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '1',
    );
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
    const {container} = render(
      <Carousel
        indicatorPlacement={CarouselIndicatorPlacement.BOTTOM_OVERLAY}
        verticalAlignment={CarouselVerticalAlignment.BOTTOM}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );

    expect(container.querySelector('.paginationOverlay')).not.toBeNull();
    expect(container.querySelector('[role="list"]')).toHaveClass('alignBottom');
  });

  it('shows horizontal fading edges only when content is offscreen in that direction', async () => {
    const {container} = render(
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

    const leftFade =
      container.querySelector<HTMLElement>('[data-edge="left"]')!;
    const rightFade = container.querySelector<HTMLElement>(
      '[data-edge="right"]',
    )!;

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

  function layoutCarousel(container: HTMLElement, widths = [400, 400, 400]) {
    const list = container.querySelector<HTMLElement>('[role="list"]')!;
    const items = Array.from(
      list.querySelectorAll<HTMLElement>('[role="listitem"]'),
    );
    const viewportWidth = 536;
    Object.defineProperties(list, {
      clientWidth: {configurable: true, value: viewportWidth},
      scrollLeft: {configurable: true, writable: true, value: 0},
    });
    vi.spyOn(list, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(100, 0, viewportWidth, 240),
    );
    let left = Math.max(0, (viewportWidth - widths[0]) / 2);
    items.forEach((item, index) => {
      const width = widths[index];
      const offset = left;
      Object.defineProperties(item, {
        offsetLeft: {configurable: true, value: offset},
        clientWidth: {configurable: true, value: width},
      });
      vi.spyOn(item, 'getBoundingClientRect').mockImplementation(
        () => new DOMRect(100 + offset - list.scrollLeft, 0, width, 240),
      );
      left += width + (index < items.length - 1 ? 24 : 0);
    });
    Object.defineProperty(list, 'scrollWidth', {
      configurable: true,
      value:
        left + Math.max(0, (viewportWidth - widths[widths.length - 1]) / 2),
    });
    return {
      list,
      scroll(left: number) {
        list.scrollLeft = left;
        fireEvent.scroll(list);
      },
    };
  }

  it('keeps centered state, focus, callback and pagination aligned during direct scrolling', () => {
    const onItemCentered = vi.fn();
    const {container} = render(
      <Carousel onItemCentered={onItemCentered}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );
    const position = layoutCarousel(container);
    screen.getByText('One').focus();
    scrollToMock.mockClear();

    position.scroll(424);

    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '1',
    );
    expect(container.querySelector('[data-item-index="1"]')).toHaveAttribute(
      'data-centered',
      'true',
    );
    expect(document.activeElement).toBe(screen.getByText('Two'));
    expect(onItemCentered.mock.calls).toEqual([[1]]);
    expect(container).toHaveTextContent('2 of 3');
    expect(scrollToMock).not.toHaveBeenCalled();

    position.scroll(848);
    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '2',
    );
    expect(document.activeElement).toBe(screen.getByText('Three'));
    expect(onItemCentered.mock.calls).toEqual([[1], [2]]);
    expect(container).toHaveTextContent('3 of 3');

    position.scroll(0);
    expect(document.activeElement).toBe(screen.getByText('One'));
    expect(onItemCentered.mock.calls).toEqual([[1], [2], [0]]);
  });

  it('chooses the nearest center for differently sized items', () => {
    const onItemCentered = vi.fn();
    const {container} = render(
      <Carousel onItemCentered={onItemCentered}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );
    const position = layoutCarousel(container, [400, 260, 520]);
    screen.getByText('One').focus();

    position.scroll(200);
    expect(document.activeElement).toBe(screen.getByText('Two'));
    position.scroll(600);
    expect(document.activeElement).toBe(screen.getByText('Three'));
    expect(onItemCentered.mock.calls).toEqual([[1], [2]]);
  });

  it('does not repeat a centered-item notification or competing scroll for unchanged positions', () => {
    const onItemCentered = vi.fn();
    const {container} = render(
      <Carousel onItemCentered={onItemCentered}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );
    const position = layoutCarousel(container);
    screen.getByText('One').focus();
    scrollToMock.mockClear();
    position.scroll(424);
    position.scroll(430);
    fireEvent(position.list, new Event('scrollend'));

    expect(onItemCentered.mock.calls).toEqual([[1]]);
    expect(document.activeElement).toBe(screen.getByText('Two'));
    expect(scrollToMock).not.toHaveBeenCalled();
  });

  it('does not steal focus from another control when the strip scrolls', () => {
    const onItemCentered = vi.fn();
    const {container} = render(
      <>
        <button>Elsewhere</button>
        <Carousel onItemCentered={onItemCentered}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>
      </>,
    );
    const position = layoutCarousel(container);
    const elsewhere = screen.getByText('Elsewhere');
    elsewhere.focus();
    position.scroll(424);
    fireEvent(position.list, new Event('scrollend'));

    expect(document.activeElement).toBe(elsewhere);
    expect(container.querySelector('[data-current-item]')).toHaveAttribute(
      'data-current-item',
      '1',
    );
    expect(container).toHaveTextContent('2 of 3');
    expect(onItemCentered.mock.calls).toEqual([[1]]);
  });

  it('respects focus moved outside the strip by a centered-item callback', () => {
    const onItemCentered = vi.fn(() => screen.getByText('Elsewhere').focus());
    const {container} = render(
      <>
        <button>Elsewhere</button>
        <Carousel onItemCentered={onItemCentered}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>
      </>,
    );
    const position = layoutCarousel(container);
    screen.getByText('One').focus();
    position.scroll(424);

    expect(document.activeElement).toBe(screen.getByText('Elsewhere'));
    expect(onItemCentered.mock.calls).toEqual([[1]]);
  });

  it('preserves the focused descendant within an already current item', () => {
    const {container} = render(
      <Carousel>
        <div>
          <button>First action</button>
          <button>Second action</button>
        </div>
        <button>Next item</button>
      </Carousel>,
    );
    const position = layoutCarousel(container, [400, 400]);
    screen.getByText('Second action').focus();
    position.scroll(0);
    expect(document.activeElement).toBe(screen.getByText('Second action'));
  });

  it('keeps a keyboard destination current while its smooth scroll passes intermediate items', () => {
    const onItemCentered = vi.fn();
    const {container} = render(
      <Carousel onItemCentered={onItemCentered}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );
    const position = layoutCarousel(container);
    screen.getByText('One').focus();
    fireEvent.keyDown(screen.getByText('One'), {key: 'ArrowRight'});
    position.scroll(100);

    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '1',
    );
    expect(document.activeElement).toBe(screen.getByText('Two'));
    expect(onItemCentered.mock.calls).toEqual([[1]]);

    position.scroll(424);
    fireEvent(position.list, new Event('scrollend'));
    expect(onItemCentered.mock.calls).toEqual([[1]]);
    expect(container).toHaveTextContent('2 of 3');
  });

  it('preserves a keyboard destination before delayed first movement', () => {
    vi.useFakeTimers();
    try {
      const onItemCentered = vi.fn();
      const {container, unmount} = render(
        <Carousel onItemCentered={onItemCentered}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>,
      );
      const position = layoutCarousel(container);
      act(() => screen.getByText('One').focus());
      fireEvent.keyDown(screen.getByText('One'), {key: 'ArrowRight'});
      act(() => vi.advanceTimersByTime(1000));

      expect(container.firstElementChild).toHaveAttribute(
        'data-current-item',
        '1',
      );
      expect(document.activeElement).toBe(screen.getByText('Two'));
      expect(onItemCentered.mock.calls).toEqual([[1]]);
      position.scroll(424);
      expect(onItemCentered.mock.calls).toEqual([[1]]);
      unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('preserves a keyboard destination across a long intermediate scroll gap', () => {
    vi.useFakeTimers();
    try {
      const onItemCentered = vi.fn();
      const {container, unmount} = render(
        <Carousel onItemCentered={onItemCentered}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>,
      );
      const position = layoutCarousel(container);
      act(() => screen.getByText('One').focus());
      fireEvent.keyDown(screen.getByText('One'), {key: 'ArrowRight'});
      position.scroll(100);
      act(() => vi.advanceTimersByTime(1000));

      expect(container.firstElementChild).toHaveAttribute(
        'data-current-item',
        '1',
      );
      expect(document.activeElement).toBe(screen.getByText('Two'));
      expect(container).toHaveTextContent('2 of 3');
      expect(onItemCentered.mock.calls).toEqual([[1]]);
      position.scroll(424);
      expect(onItemCentered.mock.calls).toEqual([[1]]);
      unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the latest rapid-key destination when an earlier destination passes', () => {
    const onItemCentered = vi.fn();
    const {container} = render(
      <Carousel onItemCentered={onItemCentered}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );
    const position = layoutCarousel(container);
    act(() => screen.getByText('One').focus());
    fireEvent.keyDown(screen.getByText('One'), {key: 'ArrowRight'});
    fireEvent.keyDown(screen.getByText('Two'), {key: 'ArrowRight'});
    position.scroll(424);

    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '2',
    );
    expect(document.activeElement).toBe(screen.getByText('Three'));
    expect(onItemCentered.mock.calls).toEqual([[1], [2]]);
    position.scroll(848);
    expect(onItemCentered.mock.calls).toEqual([[1], [2]]);
  });

  it('reconciles an interrupted imperative scroll when movement ends', () => {
    const onItemCentered = vi.fn();
    const ref = createRef<CarouselHandle>();
    const {container} = render(
      <Carousel ref={ref} onItemCentered={onItemCentered}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );
    const position = layoutCarousel(container);
    act(() => ref.current?.scrollToPosition(2));
    position.scroll(500);
    expect(document.activeElement).toBe(screen.getByText('Three'));

    fireEvent(position.list, new Event('scrollend'));
    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '1',
    );
    expect(document.activeElement).toBe(screen.getByText('Two'));
    expect(onItemCentered.mock.calls).toEqual([[2], [1]]);
  });

  it.each(['wheel', 'pointerdown'])(
    'lets %s interaction replace a pending scroll destination',
    eventName => {
      const onItemCentered = vi.fn();
      const ref = createRef<CarouselHandle>();
      const {container} = render(
        <Carousel ref={ref} onItemCentered={onItemCentered}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>,
      );
      const position = layoutCarousel(container);
      act(() => ref.current?.scrollToPosition(2));
      fireEvent(position.list, new Event(eventName, {bubbles: true}));
      position.scroll(424);

      expect(document.activeElement).toBe(screen.getByText('Two'));
      expect(onItemCentered.mock.calls).toEqual([[2], [1]]);
    },
  );

  it('reconciles quiet scrolling when a scroll-end event is unavailable', () => {
    vi.useFakeTimers();
    try {
      const onItemCentered = vi.fn();
      const ref = createRef<CarouselHandle>();
      const {container, unmount} = render(
        <Carousel ref={ref} onItemCentered={onItemCentered}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>,
      );
      const position = layoutCarousel(container);
      act(() => ref.current?.scrollToPosition(2));
      fireEvent(position.list, new Event('wheel', {bubbles: true}));
      position.scroll(500);
      expect(onItemCentered.mock.calls).toEqual([[2], [1]]);
      act(() => vi.advanceTimersByTime(250));
      expect(document.activeElement).toBe(screen.getByText('Two'));
      expect(onItemCentered.mock.calls).toEqual([[2], [1]]);
      unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(['wheel', 'pointerdown'])(
    'cancels the earlier navigation timer before %s movement starts',
    eventName => {
      vi.useFakeTimers();
      try {
        const onItemCentered = vi.fn();
        const ref = createRef<CarouselHandle>();
        const {container, unmount} = render(
          <Carousel ref={ref} onItemCentered={onItemCentered}>
            <button>One</button>
            <button>Two</button>
            <button>Three</button>
          </Carousel>,
        );
        const position = layoutCarousel(container);
        act(() => ref.current?.scrollToPosition(2));
        fireEvent(position.list, new Event(eventName, {bubbles: true}));
        act(() => vi.advanceTimersByTime(250));

        expect(container.firstElementChild).toHaveAttribute(
          'data-current-item',
          '2',
        );
        expect(document.activeElement).toBe(screen.getByText('Three'));
        expect(onItemCentered.mock.calls).toEqual([[2]]);
        position.scroll(424);
        expect(container.firstElementChild).toHaveAttribute(
          'data-current-item',
          '1',
        );
        expect(document.activeElement).toBe(screen.getByText('Two'));
        expect(onItemCentered.mock.calls).toEqual([[2], [1]]);
        unmount();
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it('uses the latest centered-item callback for pending completion', () => {
    vi.useFakeTimers();
    try {
      const original = vi.fn();
      const updated = vi.fn();
      const ref = createRef<CarouselHandle>();
      const {container, rerender, unmount} = render(
        <Carousel ref={ref} onItemCentered={original}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>,
      );
      const position = layoutCarousel(container);
      act(() => ref.current?.scrollToPosition(2));
      position.scroll(500);
      rerender(
        <Carousel ref={ref} onItemCentered={updated}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>,
      );
      fireEvent(position.list, new Event('scrollend'));
      expect(original.mock.calls).toEqual([[2]]);
      expect(updated.mock.calls).toEqual([[1]]);
      unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels pending completion after unmount', () => {
    vi.useFakeTimers();
    try {
      const onItemCentered = vi.fn();
      const ref = createRef<CarouselHandle>();
      const {container, unmount} = render(
        <Carousel ref={ref} onItemCentered={onItemCentered}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>,
      );
      const position = layoutCarousel(container);
      act(() => ref.current?.scrollToPosition(2));
      position.scroll(500);
      unmount();
      fireEvent(position.list, new Event('scrollend'));
      act(() => vi.advanceTimersByTime(250));
      expect(onItemCentered.mock.calls).toEqual([[2]]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears a removed destination without late notifications or focus transfer', () => {
    vi.useFakeTimers();
    try {
      const onItemCentered = vi.fn();
      const ref = createRef<CarouselHandle>();
      const {container, rerender, unmount} = render(
        <Carousel ref={ref} onItemCentered={onItemCentered}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>,
      );
      const position = layoutCarousel(container);
      act(() => ref.current?.scrollToPosition(2));
      position.scroll(500);
      rerender(
        <Carousel ref={ref} onItemCentered={onItemCentered}>
          <button>One</button>
        </Carousel>,
      );
      layoutCarousel(container, [400]);
      act(() => vi.advanceTimersByTime(250));
      expect(container.firstElementChild).toHaveAttribute(
        'data-current-item',
        '0',
      );
      expect(onItemCentered.mock.calls).toEqual([[2], [0]]);
      expect(container).toHaveTextContent('1 of 1');
      unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('updates callback-derived application state when a shorter list clamps the current item', () => {
    const ref = createRef<CarouselHandle>();
    function Consumer({count}: {count: number}) {
      const [centered, setCentered] = useState(-1);
      return (
        <>
          <output data-testid="centered-output">{centered}</output>
          <Carousel ref={ref} onItemCentered={setCentered}>
            {Array.from({length: count}, (_, index) => (
              <button key={index}>Item {index}</button>
            ))}
          </Carousel>
        </>
      );
    }
    const {container, rerender} = render(<Consumer count={3} />);
    layoutCarousel(container);
    act(() => ref.current?.scrollToPosition(2));
    expect(screen.getByTestId('centered-output')).toHaveTextContent('2');

    rerender(<Consumer count={1} />);
    const position = layoutCarousel(container, [400]);
    fireEvent(position.list, new Event('scrollend'));
    expect(container.querySelector('[data-current-item]')).toHaveAttribute(
      'data-current-item',
      '0',
    );
    expect(screen.getByTestId('centered-output')).toHaveTextContent('0');
    expect(container).toHaveTextContent('1 of 1');
  });

  it('bounds a requested destination to the browser-reported scroll range', () => {
    const ref = createRef<CarouselHandle>();
    const {container} = render(
      <Carousel ref={ref}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </Carousel>,
    );
    const position = layoutCarousel(container);
    Object.defineProperty(position.list, 'scrollWidth', {
      configurable: true,
      value: 900,
    });
    scrollToMock.mockClear();
    act(() => ref.current?.scrollToPosition(2));
    expect(scrollToMock).toHaveBeenLastCalledWith({
      left: 364,
      behavior: 'auto',
    });
  });

  it('does not reclaim focus after it leaves during pending completion', () => {
    const onItemCentered = vi.fn();
    const ref = createRef<CarouselHandle>();
    const {container} = render(
      <>
        <button>Elsewhere</button>
        <Carousel ref={ref} onItemCentered={onItemCentered}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Carousel>
      </>,
    );
    const position = layoutCarousel(container);
    act(() => ref.current?.scrollToPosition(2));
    position.scroll(500);
    const elsewhere = screen.getByText('Elsewhere');
    elsewhere.focus();
    fireEvent(position.list, new Event('scrollend'));
    expect(onItemCentered.mock.calls).toEqual([[2], [1]]);
    expect(document.activeElement).toBe(elsewhere);
  });

  it.each([0, 2])(
    'does not select an unmeasured item in a %s-item strip',
    itemCount => {
      const onItemCentered = vi.fn();
      const {container} = render(
        <Carousel onItemCentered={onItemCentered}>
          {Array.from({length: itemCount}, (_, index) => (
            <button key={index}>{index}</button>
          ))}
        </Carousel>,
      );
      const list = container.querySelector<HTMLElement>('[role="list"]')!;
      list.scrollLeft = 100;
      fireEvent.scroll(list);
      fireEvent(list, new Event('scrollend'));
      expect(onItemCentered).not.toHaveBeenCalled();
      expect(container.firstElementChild).toHaveAttribute(
        'data-current-item',
        '0',
      );
    },
  );

  it.each([
    {name: 'foundation', Component: Carousel},
    {name: 'display', Component: DisplayCarousel},
  ])(
    'forwards one-based formatted position text through the $name presentation',
    ({Component}) => {
      const formatText = vi.fn(
        (page: number, count: number) => `${page} sur ${count}`,
      );
      const {container} = render(
        <Component formatPaginationText={formatText}>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </Component>,
      );
      const position = layoutCarousel(container);
      screen.getByText('One').focus();
      expect(container).toHaveTextContent('1 sur 3');
      expect(formatText).toHaveBeenLastCalledWith(1, 3);
      position.scroll(424);
      expect(container).toHaveTextContent('2 sur 3');
      expect(formatText).toHaveBeenLastCalledWith(2, 3);
    },
  );

  it('formats customized indicator values without changing item selection', () => {
    const formatText = vi.fn(
      (page: number, count: number) => `${page}/${count}`,
    );
    const {container} = render(
      <DisplayCarousel
        formatPaginationText={formatText}
        progressIndicatorCustomizationOverride={() => ({
          currentIndex: 6,
          totalItems: 12,
          isVisible: true,
        })}>
        <button>One</button>
        <button>Two</button>
      </DisplayCarousel>,
    );
    expect(container.firstElementChild).toHaveAttribute(
      'data-current-item',
      '0',
    );
    expect(container).toHaveTextContent('7/12');
    expect(formatText).toHaveBeenLastCalledWith(7, 12);
  });

  it.each([
    {
      name: 'foundation dots',
      Component: Carousel,
      props: {paginationMode: PaginationMode.DOTS, showPagination: true},
    },
    {
      name: 'display dots',
      Component: DisplayCarousel,
      props: {paginationMode: PaginationMode.DOTS, showPagination: true},
    },
    {
      name: 'foundation hidden',
      Component: Carousel,
      props: {paginationMode: PaginationMode.TEXT, showPagination: false},
    },
    {
      name: 'display hidden',
      Component: DisplayCarousel,
      props: {paginationMode: PaginationMode.TEXT, showPagination: false},
    },
    {
      name: 'foundation customized hidden',
      Component: Carousel,
      props: {
        progressIndicatorCustomizationOverride: () => ({
          currentIndex: 0,
          totalItems: 2,
          isVisible: false,
        }),
      },
    },
    {
      name: 'display customized hidden',
      Component: DisplayCarousel,
      props: {
        progressIndicatorCustomizationOverride: () => ({
          currentIndex: 0,
          totalItems: 2,
          isVisible: false,
        }),
      },
    },
  ])('does not call the text formatter for $name', ({Component, props}) => {
    const formatText = vi.fn(() => 'formatted');
    render(
      <Component {...props} formatPaginationText={formatText}>
        <button>One</button>
        <button>Two</button>
      </Component>,
    );
    expect(formatText).not.toHaveBeenCalled();
  });

  it.each([
    {name: 'foundation', Component: Carousel},
    {name: 'display', Component: DisplayCarousel},
  ])('does not format an empty $name strip', ({Component}) => {
    const formatText = vi.fn(() => 'formatted');
    const {container} = render(<Component formatPaginationText={formatText} />);
    expect(formatText).not.toHaveBeenCalled();
    expect(container).not.toHaveTextContent('formatted');
    expect(container.querySelector('[role="listitem"]')).toBeNull();
  });

  it('updates the formatter at the same position and restores the English default when removed', () => {
    const {container, rerender} = render(
      <Carousel formatPaginationText={(page, count) => `${page} sur ${count}`}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );
    expect(container).toHaveTextContent('1 sur 2');
    rerender(
      <Carousel formatPaginationText={(page, count) => `${page}/${count}`}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );
    expect(container).toHaveTextContent('1/2');
    rerender(
      <Carousel>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );
    expect(container).toHaveTextContent('1 of 2');
  });

  it('preserves an intentionally empty formatted label', () => {
    const formatText = vi.fn(() => '');
    const {container} = render(
      <Carousel formatPaginationText={formatText}>
        <button>One</button>
        <button>Two</button>
      </Carousel>,
    );
    expect(formatText).toHaveBeenCalledWith(1, 2);
    expect(container).not.toHaveTextContent('1 of 2');
  });

  it('uses a configurable fixed horizontal fading edge length', async () => {
    const {container} = render(
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

    const leftFade =
      container.querySelector<HTMLElement>('[data-edge="left"]')!;
    const rightFade = container.querySelector<HTMLElement>(
      '[data-edge="right"]',
    )!;

    await waitFor(() => {
      expect(leftFade.style.width).toBe('40px');
      expect(leftFade.style.opacity).toBe('0.5');
      expect(rightFade.style.width).toBe('40px');
      expect(rightFade.style.opacity).toBe('1');
    });
  });
});
