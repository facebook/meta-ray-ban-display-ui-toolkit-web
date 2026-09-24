/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * CardStack tests
 *
 * Card with background cards in a stack formation.
 * INTERACTIVE: focus-animated fan from corner pivot.
 * DISPLAY: static scattered with rotation/translation.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { CardStack, StackType, AspectRatio } from '@wearables-ui-toolkit/foundation/components/CardStack';
import {
  getCardStackContainerStyle,
  getCardStackMeasuredLayout,
  getValidBackgroundCards,
} from '@wearables-ui-toolkit/foundation/components/private/CardStackLayout';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';

describe('CardStack initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<CardStack />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders primary card content', () => {
    const { container } = render(
      <CardStack>
        <span data-testid="primary">Main</span>
      </CardStack>
    );
    expect(container.querySelector('[data-testid="primary"]')).not.toBeNull();
  });
});

describe('StackType enum', () => {
  it('INTERACTIVE = "interactive"', () => {
    expect(StackType.INTERACTIVE).toBe('interactive');
  });
  it('DISPLAY = "display"', () => {
    expect(StackType.DISPLAY).toBe('display');
  });
});

describe('AspectRatio enum', () => {
  it('SQUARE = "square"', () => {
    expect(AspectRatio.SQUARE).toBe('square');
  });
  it('PORTRAIT = "portrait"', () => {
    expect(AspectRatio.PORTRAIT).toBe('portrait');
  });
});

describe('CardStack background cards', () => {
  it('renders background cards in INTERACTIVE mode', () => {
    const { container } = render(
      <CardStack
        type={StackType.INTERACTIVE}
        backgroundCards={[
          { src: '/bg1.jpg', alt: 'bg1' },
          { src: '/bg2.jpg', alt: 'bg2' },
        ]}
      >
        <div>Primary</div>
      </CardStack>
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders background cards in DISPLAY mode', () => {
    const { container } = render(
      <CardStack
        type={StackType.DISPLAY}
        backgroundCards={[
          { src: '/bg1.jpg' },
          { src: '/bg2.jpg' },
          { src: '/bg3.jpg' },
        ]}
      >
        <div>Primary</div>
      </CardStack>
    );
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe('CardStack aspect ratio', () => {
  it('SQUARE renders correctly', () => {
    const { container } = render(
      <CardStack aspectRatio={AspectRatio.SQUARE}>
        <div>Content</div>
      </CardStack>
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('PORTRAIT renders correctly', () => {
    const { container } = render(
      <CardStack aspectRatio={AspectRatio.PORTRAIT}>
        <div>Content</div>
      </CardStack>
    );
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe('CardStack custom props', () => {
  it('accepts className', () => {
    const { container } = render(<CardStack className="my-stack" />);
    expect(container.firstElementChild?.className).toContain('my-stack');
  });
});

describe('CardStack display constraints', () => {
  it('keeps the display root size while recomputing child card size', () => {
    const layout = getCardStackMeasuredLayout(
      StackType.DISPLAY,
      AspectRatio.PORTRAIT,
      200,
      undefined,
      undefined,
      undefined,
      3,
    );

    expect(layout.stackDimensions).toEqual({
      width: 314,
      height: 374,
      offsetX: 56,
      offsetY: 100,
    });
    expect(layout.cardWidth).toBe(184);
    expect(layout.cardHeight).toBe(245);
  });

  it('honors the row max width constraints for square display stacks', () => {
    const layout = getCardStackMeasuredLayout(
      StackType.DISPLAY,
      AspectRatio.SQUARE,
      200,
      undefined,
      222,
      undefined,
      3,
    );

    expect(layout.stackDimensions).toEqual({
      width: 222,
      height: 212,
      offsetX: 52,
      offsetY: 98,
    });
    expect(layout.cardWidth).toBe(111);
    expect(layout.cardHeight).toBe(111);
  });

  it('honors the row max width constraints for square interactive stacks', () => {
    const layout = getCardStackMeasuredLayout(
      StackType.INTERACTIVE,
      AspectRatio.SQUARE,
      200,
      undefined,
      252,
      undefined,
      2,
    );

    expect(layout.stackDimensions).toEqual({
      width: 252,
      height: 192,
      offsetX: 0,
      offsetY: 0,
    });
    expect(layout.cardWidth).toBe(192);
    expect(layout.cardHeight).toBe(192);
  });

  it('uses the measured root width for content scaling', () => {
    const style = getCardStackContainerStyle({
      interactionState: State.DEFAULT,
      stackDimensions: {
        width: 222,
        height: 212,
        offsetX: 52,
        offsetY: 98,
      },
      style: {},
    });

    expect(style.width).toBe(222);
    expect(style.height).toBe(212);
    expect(style.transform).toBe('scale(0.9279279279279279)');
  });
});

describe('CardStack background card overflow warning', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws (in dev) when INTERACTIVE exceeds the max of 2 cards', () => {
    // Over-provisioning throws in development builds; production builds truncate
    // gracefully instead.
    expect(() =>
      getValidBackgroundCards(
        [{ src: '/a.jpg' }, { src: '/b.jpg' }, { src: '/c.jpg' }],
        StackType.INTERACTIVE,
      ),
    ).toThrow('CardStack of type interactive can only have 2 cards');
  });

  it('throws (in dev) when DISPLAY exceeds the max of 3 cards', () => {
    expect(() =>
      getValidBackgroundCards(
        [{ src: '/a.jpg' }, { src: '/b.jpg' }, { src: '/c.jpg' }, { src: '/d.jpg' }],
        StackType.DISPLAY,
      ),
    ).toThrow('CardStack of type display can only have 3 cards');
  });

  it('does not warn when background cards are within the max', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = getValidBackgroundCards(
      [{ src: '/a.jpg' }, { src: '/b.jpg' }],
      StackType.INTERACTIVE,
    );

    expect(result).toHaveLength(2);
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn for an empty background cards list', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = getValidBackgroundCards([], StackType.DISPLAY);

    expect(result).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });
});
