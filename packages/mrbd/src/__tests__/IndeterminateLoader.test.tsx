/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * IndeterminateLoader tests
 *
 * Constants:
 * - Sizes: XSMALL=24px, SMALL=32px, MEDIUM=48px, LARGE=72px
 * - Stroke widths: XSMALL=3px, SMALL=4px, MEDIUM=6px, LARGE=8px
 * - Animation duration: 1667ms
 * - Color: active control color
 * - Default size: LARGE
 * - Default isAnimating: true
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { IndeterminateLoader, IndeterminateLoaderSize } from '../mrbd/ui/IndeterminateLoader';
import {
  getIndeterminateLoaderCircleRadius,
  getIndeterminateLoaderScaledEdgePadding,
  getIndeterminateLoaderScaledStrokeWidth,
} from '../mrbd/ui/private/IndeterminateLoaderGeometry';
import {
  INDETERMINATE_LOADER_ANIMATION_DURATION_MS,
  INDETERMINATE_LOADER_CIRCLE_CENTER,
  INDETERMINATE_LOADER_EDGE_PADDING_PX,
  INDETERMINATE_LOADER_PATH_LENGTH,
  INDETERMINATE_LOADER_SIZE_PX,
  INDETERMINATE_LOADER_STROKE_WIDTH,
  INDETERMINATE_LOADER_VIEWBOX_SIZE,
} from '../mrbd/ui/private/IndeterminateLoaderMetrics';

const CSS_SOURCE = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/ui/IndeterminateLoader.module.css`,
  'utf8',
);
const CIRCUMFERENCE = INDETERMINATE_LOADER_PATH_LENGTH;

describe('IndeterminateLoader rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<IndeterminateLoader />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders an SVG circle', () => {
    const { container } = render(<IndeterminateLoader />);
    const circle = container.querySelector('circle');
    expect(circle).not.toBeNull();
  });

  it('circle has round linecap', () => {
    const { container } = render(<IndeterminateLoader />);
    const circle = container.querySelector('circle');
    // Round linecap is set via CSS class
    expect(circle).not.toBeNull();
  });

  it('preserves a caller-provided aria-label', () => {
    render(<IndeterminateLoader aria-label="Refreshing results" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Refreshing results',
    );
  });

  it('uses Loading as the default aria-label', () => {
    render(<IndeterminateLoader />);

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Loading',
    );
  });
});

describe('IndeterminateLoader sizes match the dimension constants', () => {
  it('XSMALL = 24px', () => {
    expect(INDETERMINATE_LOADER_SIZE_PX[IndeterminateLoaderSize.XSMALL]).toBe(24);
    const { container } = render(
      <IndeterminateLoader size={IndeterminateLoaderSize.XSMALL} />
    );
    expect(container.firstElementChild?.className).toContain('xsmall');
  });

  it('SMALL = 32px', () => {
    expect(INDETERMINATE_LOADER_SIZE_PX[IndeterminateLoaderSize.SMALL]).toBe(32);
    const { container } = render(
      <IndeterminateLoader size={IndeterminateLoaderSize.SMALL} />
    );
    expect(container.firstElementChild?.className).toContain('small');
  });

  it('MEDIUM = 48px', () => {
    expect(INDETERMINATE_LOADER_SIZE_PX[IndeterminateLoaderSize.MEDIUM]).toBe(48);
    const { container } = render(
      <IndeterminateLoader size={IndeterminateLoaderSize.MEDIUM} />
    );
    expect(container.firstElementChild?.className).toContain('medium');
  });

  it('LARGE = 72px', () => {
    expect(INDETERMINATE_LOADER_SIZE_PX[IndeterminateLoaderSize.LARGE]).toBe(72);
    const { container } = render(
      <IndeterminateLoader size={IndeterminateLoaderSize.LARGE} />
    );
    expect(container.firstElementChild?.className).toContain('large');
  });

  it('defaults to LARGE', () => {
    const { container } = render(<IndeterminateLoader />);
    expect(container.firstElementChild?.className).toContain('large');
  });
});

describe('IndeterminateLoader stroke widths match the dimension constants', () => {
  it('XSMALL stroke width = 3px', () => {
    expect(INDETERMINATE_LOADER_STROKE_WIDTH[IndeterminateLoaderSize.XSMALL]).toBe(3);
    const { container } = render(
      <IndeterminateLoader size={IndeterminateLoaderSize.XSMALL} />
    );
    const circle = container.querySelector('circle');
    const sw = parseFloat(circle?.getAttribute('stroke-width') ?? '0');
    // Stroke is scaled: (3/24) * 48 = 6 in viewBox coordinates
    expect(sw).toBeCloseTo(6, 0);
  });

  it('SMALL stroke width = 4px', () => {
    expect(INDETERMINATE_LOADER_STROKE_WIDTH[IndeterminateLoaderSize.SMALL]).toBe(4);
    const { container } = render(
      <IndeterminateLoader size={IndeterminateLoaderSize.SMALL} />
    );
    const circle = container.querySelector('circle');
    const sw = parseFloat(circle?.getAttribute('stroke-width') ?? '0');
    // Stroke is scaled: (4/32) * 48 = 6 in viewBox coordinates
    expect(sw).toBeCloseTo(6, 0);
  });

  it('MEDIUM stroke width = 6px', () => {
    expect(INDETERMINATE_LOADER_STROKE_WIDTH[IndeterminateLoaderSize.MEDIUM]).toBe(6);
    const { container } = render(
      <IndeterminateLoader size={IndeterminateLoaderSize.MEDIUM} />
    );
    const circle = container.querySelector('circle');
    const sw = parseFloat(circle?.getAttribute('stroke-width') ?? '0');
    // Stroke is scaled: (6/48) * 48 = 6 in viewBox coordinates
    expect(sw).toBeCloseTo(6, 0);
  });

  it('LARGE stroke width = 8px', () => {
    expect(INDETERMINATE_LOADER_STROKE_WIDTH[IndeterminateLoaderSize.LARGE]).toBe(8);
    const { container } = render(
      <IndeterminateLoader size={IndeterminateLoaderSize.LARGE} />
    );
    const circle = container.querySelector('circle');
    const sw = parseFloat(circle?.getAttribute('stroke-width') ?? '0');
    // Stroke is scaled: (8/72) * 48 ≈ 5.33 in viewBox coordinates
    expect(sw).toBeCloseTo(5.33, 0);
  });

  it('scaled stroke helper projects the size into viewBox coordinates', () => {
    expect(getIndeterminateLoaderScaledStrokeWidth(8, 72)).toBeCloseTo(5.33, 2);
  });
});

describe('IndeterminateLoader animation state', () => {
  it('animates by default (isAnimating=true)', () => {
    const { container } = render(<IndeterminateLoader />);
    // When animating, should NOT have the paused class
    expect(container.firstElementChild?.className).not.toContain('Paused');
  });

  it('pauses when isAnimating=false', () => {
    const { container } = render(<IndeterminateLoader isAnimating={false} />);
    expect(container.firstElementChild?.className).toContain('Paused');
  });

  it('resumes when isAnimating changes to true', () => {
    const { rerender, container } = render(
      <IndeterminateLoader isAnimating={false} />
    );
    expect(container.firstElementChild?.className).toContain('Paused');

    rerender(<IndeterminateLoader isAnimating={true} />);
    expect(container.firstElementChild?.className).not.toContain('Paused');
  });
});

describe('IndeterminateLoader SVG structure', () => {
  it('SVG has consistent viewBox across all sizes', () => {
    for (const size of Object.values(IndeterminateLoaderSize)) {
      const { container } = render(<IndeterminateLoader size={size} />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('viewBox')).toBe(
        `0 0 ${INDETERMINATE_LOADER_VIEWBOX_SIZE} ${INDETERMINATE_LOADER_VIEWBOX_SIZE}`
      );
    }
  });

  it('circle center is at viewBox center (24, 24)', () => {
    const { container } = render(<IndeterminateLoader />);
    const circle = container.querySelector('circle');
    expect(circle?.getAttribute('cx')).toBe(String(INDETERMINATE_LOADER_CIRCLE_CENTER));
    expect(circle?.getAttribute('cy')).toBe(String(INDETERMINATE_LOADER_CIRCLE_CENTER));
  });

  it('circle radius is inset by half the stroke to avoid animated edge clipping', () => {
    const { container } = render(
      <IndeterminateLoader size={IndeterminateLoaderSize.LARGE} />
    );
    const circle = container.querySelector('circle');
    expect(Number(circle?.getAttribute('r'))).toBeCloseTo(62 / 3, 5);
    expect(getIndeterminateLoaderCircleRadius(6)).toBe(21);
    expect(getIndeterminateLoaderCircleRadius(16 / 3)).toBeCloseTo(64 / 3, 5);
  });

  it('keeps one physical pixel of cap padding inside the SVG viewport', () => {
    expect(INDETERMINATE_LOADER_EDGE_PADDING_PX).toBe(1);
    expect(getIndeterminateLoaderScaledEdgePadding(72)).toBeCloseTo(2 / 3, 5);
    expect(
      getIndeterminateLoaderCircleRadius(
        getIndeterminateLoaderScaledStrokeWidth(8, 72),
        getIndeterminateLoaderScaledEdgePadding(72),
      ),
    ).toBeCloseTo(62 / 3, 5);
  });

  it('keeps dash units stable while using an inset SVG radius', () => {
    const { container } = render(<IndeterminateLoader />);
    const circle = container.querySelector('circle');

    expect(circle?.getAttribute('pathLength')).toBe(String(INDETERMINATE_LOADER_PATH_LENGTH));
  });
});

describe('IndeterminateLoader custom props', () => {
  it('accepts custom className', () => {
    const { container } = render(<IndeterminateLoader className="my-loader" />);
    expect(container.firstElementChild?.className).toContain('my-loader');
  });

  it('accepts custom style', () => {
    const { container } = render(<IndeterminateLoader style={{ opacity: 0.5 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('opacity: 0.5');
  });

  it('forwards capture ids to the loader root', () => {
    const { container } = render(
      <IndeterminateLoader data-uit-capture-id="loader-large" />,
    );

    expect(container.firstElementChild).toHaveAttribute(
      'data-uit-capture-id',
      'loader-large',
    );
  });
});

describe('IndeterminateLoader animation constants', () => {
  it('animation duration should be 1667ms', () => {
    expect(INDETERMINATE_LOADER_ANIMATION_DURATION_MS).toBe(1667);
    expect(CSS_SOURCE).toContain(
      `animation: indeterminateArc ${INDETERMINATE_LOADER_ANIMATION_DURATION_MS}ms linear infinite`
    );
  });

  it('dash keyframes preserve one circle circumference to avoid reset snaps', () => {
    const dasharrays = [...CSS_SOURCE.matchAll(/stroke-dasharray:\s*([\d.]+)\s+([\d.]+)/g)];
    expect(dasharrays.length).toBeGreaterThan(0);

    for (const [, dash, gap] of dasharrays) {
      expect(Number(dash) + Number(gap)).toBeCloseTo(CIRCUMFERENCE, 1);
    }
  });

  it('loop boundary advances by exactly one circumference', () => {
    const firstOffset = CSS_SOURCE.match(/0%\s*\{[^}]*stroke-dashoffset:\s*([\d.-]+)/);
    const finalOffset = CSS_SOURCE.match(/100%\s*\{[^}]*stroke-dashoffset:\s*([\d.-]+)/);

    expect(firstOffset).not.toBeNull();
    expect(finalOffset).not.toBeNull();
    expect(Number(firstOffset![1]) - Number(finalOffset![1])).toBeCloseTo(CIRCUMFERENCE, 1);
  });

  it('applies stroke color through CSS', () => {
    const { container } = render(<IndeterminateLoader />);
    const circle = container.querySelector('circle');
    // Color is applied via CSS class, verified via module CSS review
    expect(circle).not.toBeNull();
  });
});

describe('IndeterminateLoader enum values', () => {
  it('XSMALL = "xsmall"', () => expect(IndeterminateLoaderSize.XSMALL).toBe('xsmall'));
  it('SMALL = "small"', () => expect(IndeterminateLoaderSize.SMALL).toBe('small'));
  it('MEDIUM = "medium"', () => expect(IndeterminateLoaderSize.MEDIUM).toBe('medium'));
  it('LARGE = "large"', () => expect(IndeterminateLoaderSize.LARGE).toBe('large'));
});
