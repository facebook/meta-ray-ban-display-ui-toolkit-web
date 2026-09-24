/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Card tests
 *
 * Container with card-specific material, optional gradient scrims,
 * MEDIUM rounded-rectangle shape by default with externally supplied shapes.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  Card,
  CardAboveScrim,
  CardBelowScrim,
  ScrimType,
} from '@wearables-ui-toolkit/foundation/components/Card';
import {
  CARD_FULL_SCRIM_FALLBACK_HEIGHT,
  CARD_SCRIM_COLOR,
  CARD_SCRIM_HEIGHT_MEDIUM,
  CARD_SCRIM_HEIGHT_SMALL,
  CARD_SCRIM_HEIGHT_TALL,
} from '@wearables-ui-toolkit/foundation/components/private/CardMetrics';
import {
  getBottomCardScrimGradient,
  getCardScrimHeight,
  getCardScrimStyle,
  getTopCardScrimGradient,
  isCardScrimVisible,
} from '@wearables-ui-toolkit/foundation/components/private/CardScrim';
import { CornerRadius } from '@wearables-ui-toolkit/foundation';
import { TailShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import {
  getCachedTailBubblePath,
  TailDirection as SmoothCornerTailDirection,
} from '@wearables-ui-toolkit/foundation/utils/SmoothCorners';

describe('Card initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<Card />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders children', () => {
    const { container } = render(
      <Card><span data-testid="card-content">Hello</span></Card>
    );
    expect(container.querySelector('[data-testid="card-content"]')).not.toBeNull();
  });

  it('has background layers from Container', () => {
    const { container } = render(<Card />);
    expect(container.querySelector('[class*="backgroundLayers"]')).not.toBeNull();
  });
});

describe('ScrimType enum', () => {
  it('NONE = "none"', () => { expect(ScrimType.NONE).toBe('none'); });
  it('SMALL = "small"', () => { expect(ScrimType.SMALL).toBe('small'); });
  it('MEDIUM = "medium"', () => { expect(ScrimType.MEDIUM).toBe('medium'); });
  it('TALL = "tall"', () => { expect(ScrimType.TALL).toBe('tall'); });
  it('FULL = "full"', () => { expect(ScrimType.FULL).toBe('full'); });
});

describe('Card scrims', () => {
  it('maps Meta Ray-Ban Display scrim heights to the scrim height constants', () => {
    expect(getCardScrimHeight(ScrimType.SMALL)).toBe(
      CARD_SCRIM_HEIGHT_SMALL,
    );
    expect(getCardScrimHeight(ScrimType.MEDIUM)).toBe(
      CARD_SCRIM_HEIGHT_MEDIUM,
    );
    expect(getCardScrimHeight(ScrimType.TALL)).toBe(
      CARD_SCRIM_HEIGHT_TALL,
    );
    expect(getCardScrimHeight(ScrimType.FULL, 321)).toBe(321);
    // FULL with no measured/known height falls back to the named constant,
    // not a magic 600 literal.
    expect(getCardScrimHeight(ScrimType.FULL)).toBe(
      CARD_FULL_SCRIM_FALLBACK_HEIGHT,
    );
  });

  it('treats only NONE as non-visible', () => {
    expect(isCardScrimVisible(ScrimType.NONE)).toBe(false);
    expect(isCardScrimVisible(ScrimType.SMALL)).toBe(true);
  });

  it('builds top and bottom gradients', () => {
    expect(getTopCardScrimGradient(100)).toBe(
      `linear-gradient(to bottom, ${CARD_SCRIM_COLOR} 20px, transparent 100px)`,
    );
    expect(getBottomCardScrimGradient(100)).toBe(
      `linear-gradient(to top, ${CARD_SCRIM_COLOR} 20px, transparent 100px)`,
    );
  });

  it('combines top and bottom scrim backgrounds in draw order', () => {
    const style = getCardScrimStyle({
      topScrim: ScrimType.SMALL,
      bottomScrim: ScrimType.MEDIUM,
      containerHeight: 300,
    });

    expect(style?.background).toContain('linear-gradient(to bottom');
    expect(style?.background).toContain('linear-gradient(to top');
  });

  it('returns no scrim style when both scrims are hidden', () => {
    expect(
      getCardScrimStyle({
        topScrim: ScrimType.NONE,
        bottomScrim: ScrimType.NONE,
        containerHeight: 300,
      }),
    ).toBeNull();
  });

  it('no scrim by default', () => {
    const { container } = render(<Card />);
    const scrim = container.querySelector('[class*="scrimLayer"]');
    expect(scrim).toBeNull();
  });

  it('renders top scrim', () => {
    const { container } = render(<Card topScrim={ScrimType.MEDIUM} />);
    const scrim = container.querySelector('[class*="scrimLayer"]');
    expect(scrim).not.toBeNull();
  });

  it('renders bottom scrim', () => {
    const { container } = render(<Card bottomScrim={ScrimType.SMALL} />);
    const scrim = container.querySelector('[class*="scrimLayer"]');
    expect(scrim).not.toBeNull();
  });

  it('renders both scrims', () => {
    const { container } = render(
      <Card topScrim={ScrimType.TALL} bottomScrim={ScrimType.MEDIUM} />
    );
    const scrim = container.querySelector('[class*="scrimLayer"]');
    expect(scrim).not.toBeNull();
    const bg = scrim?.getAttribute('style') ?? '';
    expect(bg).toContain('linear-gradient');
  });
});

describe('Card above/below scrim layering', () => {
  // Draw ordering: below-scrim children, then the gradient scrim, then
  // content wrapped by CardAboveScrim.
  function domOrder(container: HTMLElement): string[] {
    const stack = container.querySelector('[class*="contentStack"]');
    expect(stack).not.toBeNull();
    return Array.from(stack!.children).map((el) => {
      const testId = el.getAttribute('data-testid');
      if (testId) {
        return testId;
      }
      if (el.className.includes('scrimLayer')) {
        return 'scrim';
      }
      if (el.className.includes('aboveScrim')) {
        return 'aboveScrim';
      }
      if (el.className.includes('belowScrim')) {
        return 'belowScrim';
      }
      return 'other';
    });
  }

  it('renders CardAboveScrim children after the scrim and unwrapped children before it', () => {
    const { container } = render(
      <Card topScrim={ScrimType.MEDIUM}>
        <span data-testid="below">below</span>
        <CardAboveScrim>
          <span data-testid="above-inner">above</span>
        </CardAboveScrim>
      </Card>,
    );

    const order = domOrder(container);
    const belowIdx = order.indexOf('below');
    const scrimIdx = order.indexOf('scrim');
    const aboveIdx = order.indexOf('aboveScrim');
    const aboveWrapper = container.querySelector('[class*="aboveScrim"]');

    expect(belowIdx).toBeGreaterThanOrEqual(0);
    expect(scrimIdx).toBeGreaterThanOrEqual(0);
    expect(aboveIdx).toBeGreaterThanOrEqual(0);
    // Layering: unwrapped child paints first, then the scrim, then the
    // above-scrim wrapper on top.
    expect(belowIdx).toBeLessThan(scrimIdx);
    expect(scrimIdx).toBeLessThan(aboveIdx);
    // The above-scrim region is the topmost (last-painted) layer and carries
    // the wrapped content.
    expect(aboveIdx).toBe(order.length - 1);
    expect(aboveWrapper).not.toBeNull();
    expect(
      aboveWrapper?.querySelector('[data-testid="above-inner"]'),
    ).not.toBeNull();
  });

  it('keeps CardBelowScrim children before the scrim', () => {
    const { container } = render(
      <Card bottomScrim={ScrimType.SMALL}>
        <CardBelowScrim>
          <span data-testid="explicit-below">below</span>
        </CardBelowScrim>
        <CardAboveScrim>
          <span data-testid="explicit-above">above</span>
        </CardAboveScrim>
      </Card>,
    );

    const stack = container.querySelector('[class*="contentStack"]')!;
    const nodes = Array.from(stack.children);
    const belowIdx = nodes.findIndex((el) =>
      el.querySelector('[data-testid="explicit-below"]'),
    );
    const scrimIdx = nodes.findIndex((el) =>
      el.className.includes('scrimLayer'),
    );
    const aboveIdx = nodes.findIndex((el) =>
      el.querySelector('[data-testid="explicit-above"]'),
    );

    expect(belowIdx).toBeGreaterThanOrEqual(0);
    expect(scrimIdx).toBeGreaterThanOrEqual(0);
    expect(aboveIdx).toBeGreaterThanOrEqual(0);
    expect(belowIdx).toBeLessThan(scrimIdx);
    expect(scrimIdx).toBeLessThan(aboveIdx);
  });

  it('renders all children below scrim by default when nothing is wrapped', () => {
    const { container } = render(
      <Card topScrim={ScrimType.MEDIUM}>
        <span data-testid="a">a</span>
        <span data-testid="b">b</span>
      </Card>,
    );

    const order = domOrder(container);
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('scrim'));
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('scrim'));
    // Scrim is last: no above-scrim children.
    expect(order[order.length - 1]).toBe('scrim');
  });
});

describe('Card custom props', () => {
  it('accepts className', () => {
    const { container } = render(<Card className="my-card" />);
    expect(container.firstElementChild?.className).toContain('my-card');
  });

  it('accepts width and height', () => {
    const { container } = render(<Card width={300} height={200} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 300');
    expect(style).toContain('height: 200');
  });
});

describe('Card tail clipping', () => {
  it('clips left-tail content with the rounded tail path', () => {
    const { container } = render(
      <Card
        width={200}
        height={200}
        shapeProvider={new TailShapeProvider('left', CornerRadius.SMALL)}
      />,
    );
    const contentWrapper = container.querySelector('[class*="contentWrapper"]');

    expect(contentWrapper?.getAttribute('style')).toContain(
      `clip-path: path("${getCachedTailBubblePath(
        200,
        200,
        CornerRadius.SMALL,
        SmoothCornerTailDirection.LEFT,
      )}")`,
    );
  });

  it('clips right-tail content with the rounded tail path', () => {
    const { container } = render(
      <Card
        width={200}
        height={200}
        shapeProvider={new TailShapeProvider('right', CornerRadius.SMALL)}
      />,
    );
    const contentWrapper = container.querySelector('[class*="contentWrapper"]');

    expect(contentWrapper?.getAttribute('style')).toContain(
      `clip-path: path("${getCachedTailBubblePath(
        200,
        200,
        CornerRadius.SMALL,
        SmoothCornerTailDirection.RIGHT,
      )}")`,
    );
  });
});
