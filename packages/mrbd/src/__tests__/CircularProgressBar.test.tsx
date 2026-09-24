/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * CircularProgressBar tests
 *
 * Constants:
 * - Start angle: 140 degrees (90 + 50)
 * - End angle: 400 degrees (90 + 310)
 * - Stroke width: 6px
 * - Background opacity: 20%
 * - Spring: stiffness 150, damping 18, mass 1
 * - Color: primary icon color (track at 20%, progress at 100%)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularProgressBar } from '../mrbd/ui/CircularProgressBar';
import {
  describeCircularProgressArc,
  getCircularProgressArcStyle,
  getCircularProgressTrackLength,
} from '../mrbd/ui/private/CircularProgressBarGeometry';
import {
  CIRCULAR_PROGRESS_BACKGROUND_ALPHA,
  CIRCULAR_PROGRESS_DEFAULT_END_ANGLE_DEGREES,
  CIRCULAR_PROGRESS_DEFAULT_SIZE,
  CIRCULAR_PROGRESS_DEFAULT_START_ANGLE_DEGREES,
  CIRCULAR_PROGRESS_DEFAULT_STROKE_WIDTH,
  CIRCULAR_PROGRESS_TRANSITION_DURATION_MS,
} from '../mrbd/ui/private/CircularProgressBarMetrics';

describe('CircularProgressBar rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<CircularProgressBar />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=progressbar', () => {
    render(<CircularProgressBar progress={0.5} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders an SVG element', () => {
    const { container } = render(<CircularProgressBar />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders track path (background arc)', () => {
    const { container } = render(<CircularProgressBar />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('renders progress path when progress > 0', () => {
    const { container } = render(<CircularProgressBar progress={0.5} />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2); // track + progress
  });

  it('keeps a hidden progress path mounted when progress = 0', () => {
    const { container } = render(<CircularProgressBar progress={0} />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2); // track + zero-length progress path
  });
});

describe('CircularProgressBar accessibility', () => {
  it('sets aria-valuenow to percentage', () => {
    render(<CircularProgressBar progress={0.75} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '75');
  });

  it('sets aria-valuemin to 0', () => {
    render(<CircularProgressBar progress={0.5} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
  });

  it('sets aria-valuemax to 100', () => {
    render(<CircularProgressBar progress={0.5} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('sets aria-label with percentage', () => {
    render(<CircularProgressBar progress={0.33} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-label', '33%');
  });

  it('rounds percentage for aria-label', () => {
    render(<CircularProgressBar progress={0.667} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-label', '67%');
  });

  it('preserves a caller-provided aria-label', () => {
    render(<CircularProgressBar progress={0.33} aria-label="Download progress" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Download progress',
    );
  });
});

describe('CircularProgressBar progress clamping', () => {
  it('clamps progress below 0 to 0', () => {
    render(<CircularProgressBar progress={-0.5} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps progress above 1 to 100', () => {
    render(<CircularProgressBar progress={1.5} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('handles progress = 0', () => {
    render(<CircularProgressBar progress={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('handles progress = 1', () => {
    render(<CircularProgressBar progress={1} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('CircularProgressBar SVG properties', () => {
  it('track has round stroke linecap', () => {
    const { container } = render(<CircularProgressBar />);
    const trackPath = container.querySelector('path');
    expect(trackPath?.getAttribute('stroke-linecap')).toBe('round');
  });

  it('default stroke width is 6px', () => {
    const { container } = render(<CircularProgressBar />);
    const trackPath = container.querySelector('path');
    expect(trackPath?.getAttribute('stroke-width')).toBe(
      String(CIRCULAR_PROGRESS_DEFAULT_STROKE_WIDTH)
    );
  });

  it('custom stroke width is applied', () => {
    const { container } = render(<CircularProgressBar strokeWidthPx={10} />);
    const trackPath = container.querySelector('path');
    expect(trackPath?.getAttribute('stroke-width')).toBe('10');
  });

  it('paths have fill=none (stroke only)', () => {
    const { container } = render(<CircularProgressBar progress={0.5} />);
    const paths = container.querySelectorAll('path');
    paths.forEach(path => {
      expect(path.getAttribute('fill')).toBe('none');
    });
  });

  it('SVG viewBox matches size', () => {
    const { container } = render(<CircularProgressBar size={80} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 80 80');
  });
});

describe('CircularProgressBar sizing', () => {
  it('fills the parent square when size is omitted', () => {
    const { container } = render(<CircularProgressBar />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 100%');
    expect(style).toContain('height: 100%');
  });

  it('uses the default coordinate size for the viewBox when size is omitted', () => {
    const { container } = render(<CircularProgressBar />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe(
      `0 0 ${CIRCULAR_PROGRESS_DEFAULT_SIZE} ${CIRCULAR_PROGRESS_DEFAULT_SIZE}`,
    );
    expect(svg?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
  });

  it('custom size is applied', () => {
    const { container } = render(<CircularProgressBar size={56} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 56px');
    expect(style).toContain('height: 56px');
  });

  it('component is always square', () => {
    const { container } = render(<CircularProgressBar size={200} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 200px');
    expect(style).toContain('height: 200px');
  });
});

describe('CircularProgressBar default angles', () => {
  it('default start angle is 140 (90 + 50)', () => {
    expect(CIRCULAR_PROGRESS_DEFAULT_START_ANGLE_DEGREES).toBe(140);
  });

  it('default sweep is 260 degrees (400 - 140)', () => {
    expect(
      CIRCULAR_PROGRESS_DEFAULT_END_ANGLE_DEGREES -
        CIRCULAR_PROGRESS_DEFAULT_START_ANGLE_DEGREES
    ).toBe(260);
  });

  it('arc path helper sweeps in the clockwise large-arc direction', () => {
    const path = describeCircularProgressArc(50, 50, 47, 140, 400);
    expect(path).toContain('A 47 47 0 1 1');
  });

  it('track length helper uses radius times sweep radians', () => {
    expect(getCircularProgressTrackLength(47, 260)).toBeCloseTo(
      47 * ((260 * Math.PI) / 180)
    );
  });

  it('animated arc style uses the spring approximation duration', () => {
    const style = getCircularProgressArcStyle(0.5, 100, true);
    expect(style.strokeDasharray).toBe('100 100');
    expect(style.strokeDashoffset).toBe(50);
    expect(style.transition).toContain(`${CIRCULAR_PROGRESS_TRANSITION_DURATION_MS}ms`);
    expect(style.transition).toContain('linear(');
  });
});

describe('CircularProgressBar track opacity', () => {
  it('track has 20% opacity (BACKGROUND_ALPHA = 0x33)', () => {
    expect(CIRCULAR_PROGRESS_BACKGROUND_ALPHA).toBe(0x33);
    const { container } = render(<CircularProgressBar />);
    const trackPath = container.querySelector('[class*="track"]');
    expect(trackPath).not.toBeNull();
    // Opacity is applied via CSS class, not inline — verify class exists
  });
});

describe('CircularProgressBar re-rendering', () => {
  it('updates when progress changes', () => {
    const { rerender } = render(<CircularProgressBar progress={0.3} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30');

    rerender(<CircularProgressBar progress={0.7} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '70');
  });

  it('updates when size changes', () => {
    const { container, rerender } = render(<CircularProgressBar size={100} />);
    expect(container.firstElementChild?.getAttribute('style')).toContain('width: 100px');

    rerender(<CircularProgressBar size={50} />);
    expect(container.firstElementChild?.getAttribute('style')).toContain('width: 50px');
  });
});
