/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  Shimmer,
  ShimmerItem,
  ShimmerItemCornerRadius,
  ShimmerRepeatMode,
} from '@wearables-ui-toolkit/foundation/components/Shimmer';
import {
  SHIMMER_ANIMATION_DURATION_MS,
  SHIMMER_DEFAULT_BASE_ALPHA,
  SHIMMER_DEFAULT_DROPOFF,
  SHIMMER_DEFAULT_HIGHLIGHT_ALPHA,
  SHIMMER_DEFAULT_INTENSITY,
  SHIMMER_DEFAULT_TILT_DEGREES,
  SHIMMER_MASK_SIZE_PERCENT,
  SHIMMER_MASK_STOP_0,
  SHIMMER_MASK_STOP_1,
  SHIMMER_MASK_STOP_2,
  SHIMMER_MASK_STOP_3,
  getShimmerMaskOffset,
  getShimmerTranslateWidth,
} from '@wearables-ui-toolkit/foundation/components/private/ShimmerMetrics';

function rect(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    toJSON: () => {},
  } as DOMRect;
}

describe('Shimmer metrics', () => {
  it('uses the alpha-highlight shimmer defaults', () => {
    expect(SHIMMER_ANIMATION_DURATION_MS).toBe(1500);
    expect(SHIMMER_DEFAULT_BASE_ALPHA).toBe(0.75);
    expect(SHIMMER_DEFAULT_HIGHLIGHT_ALPHA).toBe(1);
    expect(SHIMMER_DEFAULT_TILT_DEGREES).toBe(20);
    expect(SHIMMER_DEFAULT_INTENSITY).toBe(0);
    expect(SHIMMER_DEFAULT_DROPOFF).toBe(0.5);
    expect(SHIMMER_MASK_SIZE_PERCENT).toBe(100);
    expect(SHIMMER_MASK_STOP_0).toBe(25);
    expect(SHIMMER_MASK_STOP_1).toBeCloseTo(49.95, 2);
    expect(SHIMMER_MASK_STOP_2).toBeCloseTo(50.05, 2);
    expect(SHIMMER_MASK_STOP_3).toBe(75);
  });

  it('computes translateWidth for left-to-right sweep geometry', () => {
    expect(getShimmerTranslateWidth(300, 94)).toBeCloseTo(334.21, 2);
    expect(getShimmerMaskOffset(300, 94, 0)).toBeCloseTo(-334.21, 2);
    expect(getShimmerMaskOffset(300, 94, 0.5)).toBeCloseTo(0, 2);
    expect(getShimmerMaskOffset(300, 94, 1)).toBeCloseTo(334.21, 2);
  });
});

describe('Shimmer rendering', () => {
  it('renders one masked content pass while shimmer is visible', () => {
    const { container } = render(
      <Shimmer>
        <span>Loading</span>
      </Shimmer>,
    );

    expect(container.querySelector('[class*="baseContent"]')).not.toBeNull();
    expect(container.querySelector('[class*="highlightContent"]')).toBeNull();
    expect(container.querySelectorAll('span')).toHaveLength(1);
  });

  it('provides the default base alpha to the content mask', () => {
    const { container } = render(
      <Shimmer>
        <span>Loading</span>
      </Shimmer>,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root.style.getPropertyValue('--uit-shimmer-base-opacity')).toBe('0.75');
  });

  it('renders only one content pass when shimmer is hidden', () => {
    const { container } = render(
      <Shimmer showShimmer={false}>
        <span>Loaded</span>
      </Shimmer>,
    );

    expect(container.querySelector('[class*="content"]')).not.toBeNull();
    expect(container.querySelector('[class*="baseContent"]')).toBeNull();
    expect(container.querySelector('[class*="highlightContent"]')).toBeNull();
  });

  it('does not duplicate child content or capture ids', () => {
    const { container } = render(
      <Shimmer data-uit-capture-id="shimmer-root">
        <div data-uit-capture-id="shimmer-child">
          <ShimmerItem width={62} height={62} />
        </div>
      </Shimmer>,
    );

    expect(
      container.querySelectorAll('[data-uit-capture-id="shimmer-root"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-uit-capture-id="shimmer-child"]'),
    ).toHaveLength(1);
    expect(container.querySelectorAll('[class*="item"]')).toHaveLength(1);
  });

  it('writes mask geometry as CSS variables without React state animation', () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    rectSpy.mockReturnValue(rect(300, 94));

    const { container } = render(
      <Shimmer staticAnimationProgress={0.5}>
        <ShimmerItem width={300} height={94} />
      </Shimmer>,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(parseFloat(root.style.getPropertyValue('--uit-shimmer-mask-start-position')))
      .toBeCloseTo(-334.21, 2);
    expect(parseFloat(root.style.getPropertyValue('--uit-shimmer-mask-end-position')))
      .toBeCloseTo(334.21, 2);
    expect(parseFloat(root.style.getPropertyValue('--uit-shimmer-mask-position')))
      .toBeCloseTo(0, 2);

    rectSpy.mockRestore();
  });

  it('clamps static progress before writing the mask position', () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    rectSpy.mockReturnValue(rect(300, 94));

    const { container } = render(
      <Shimmer staticAnimationProgress={2}>
        <ShimmerItem width={300} height={94} />
      </Shimmer>,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(parseFloat(root.style.getPropertyValue('--uit-shimmer-mask-position')))
      .toBeCloseTo(334.21, 2);

    rectSpy.mockRestore();
  });

  it('maps repeat mode and count to CSS animation controls', () => {
    const { container } = render(
      <Shimmer
        repeatCount={2}
        repeatMode={ShimmerRepeatMode.REVERSE}
        startDelayMs={125}
      >
        <ShimmerItem width={62} height={62} />
      </Shimmer>,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root.style.getPropertyValue('--uit-shimmer-direction')).toBe('alternate');
    expect(root.style.getPropertyValue('--uit-shimmer-iteration-count')).toBe('3');
    expect(root.style.getPropertyValue('--uit-shimmer-animation-delay')).toBe('125ms');
  });
});

describe('ShimmerItem', () => {
  it('renders shimmer item dimensions and corner radius class', () => {
    const { container } = render(
      <ShimmerItem
        width={62}
        height={20}
        cornerRadius={ShimmerItemCornerRadius.XSMALL}
      />,
    );
    const item = container.firstElementChild as HTMLElement;

    expect(item.style.width).toBe('62px');
    expect(item.style.height).toBe('20px');
    expect(item.className).toContain('radiusXsmall');
    expect(item.getAttribute('aria-hidden')).toBe('true');
  });
});
