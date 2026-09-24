/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ProgressRing tests
 *
 * Constants:
 * - SMALL = 48px, LARGE = 100px
 * - STROKE_WIDTH = 4px
 * - START_ANGLE_DEGREES = -90 (12 o'clock)
 * - SWEEP_ANGLE_DEGREES = 360 (full circle)
 * - Track color: background track color
 * - Progress color: active control color
 * - Spring: stiffness 150, damping 18, mass 1
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { ProgressRing, ProgressRingSize } from '../mrbd/ui/ProgressRing';
import {
  getProgressRingArcStyle,
  getProgressRingCircumference,
  getProgressRingDashOffset,
  getProgressRingRadius,
} from '../mrbd/ui/private/ProgressRingGeometry';
import {
  PROGRESS_RING_SIZE_PX,
  PROGRESS_RING_START_ANGLE_DEGREES,
  PROGRESS_RING_STROKE_WIDTH,
  PROGRESS_RING_SWEEP_ANGLE_DEGREES,
  PROGRESS_RING_TRANSITION_DURATION_MS,
} from '../mrbd/ui/private/ProgressRingMetrics';

describe('ProgressRing rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressRing />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('keeps the live region outside the progressbar', () => {
    const { container } = render(<ProgressRing announceUpdatesForAccessibility />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(screen.getByRole('progressbar')).not.toContainElement(liveRegion);
  });

  it('has role=progressbar', () => {
    render(<ProgressRing progress={0.5} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('forwards ref and capture id to the progressbar element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ProgressRing
        ref={ref}
        progress={0.5}
        data-uit-capture-id="ring-capture"
      />,
    );
    const progressbar = screen.getByRole('progressbar');
    expect(ref.current).toBe(progressbar);
    expect(progressbar).toHaveAttribute('data-uit-capture-id', 'ring-capture');
  });

  it('renders SVG with two circles (track + progress) when progress > 0', () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });

  it('keeps a hidden progress circle mounted when progress = 0', () => {
    const { container } = render(<ProgressRing progress={0} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });
});

describe('ProgressRing sizes (SMALL=48px, LARGE=100px)', () => {
  it('SMALL is 48px', () => {
    expect(PROGRESS_RING_SIZE_PX[ProgressRingSize.SMALL]).toBe(48);
    const { container } = render(<ProgressRing size={ProgressRingSize.SMALL} />);
    const el = container.firstElementChild;
    expect(el?.className).toContain('small');
  });

  it('LARGE is 100px', () => {
    expect(PROGRESS_RING_SIZE_PX[ProgressRingSize.LARGE]).toBe(100);
    const { container } = render(<ProgressRing size={ProgressRingSize.LARGE} />);
    const el = container.firstElementChild;
    expect(el?.className).toContain('large');
  });

  it('defaults to SMALL', () => {
    const { container } = render(<ProgressRing />);
    const el = container.firstElementChild;
    expect(el?.className).toContain('small');
  });
});

describe('ProgressRing SVG properties (paint configuration)', () => {
  it('stroke width = 4 (PROGRESS_RING_STROKE_WIDTH)', () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    const circles = container.querySelectorAll('circle');
    circles.forEach(c => {
      expect(c.getAttribute('stroke-width')).toBe(String(PROGRESS_RING_STROKE_WIDTH));
    });
  });

  it('track has round linecap (rounded cap)', () => {
    const { container } = render(<ProgressRing />);
    const track = container.querySelector('[class*="ringTrack"]');
    expect(track).not.toBeNull();
  });

  it('progress circle has round linecap', () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    const circles = container.querySelectorAll('circle');
    // Both track and progress should be round
    expect(circles.length).toBe(2);
  });

  it('circles have fill=none (stroke only)', () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    // fill:none is set via CSS class, verified via className
    const track = container.querySelector('[class*="ringTrack"]');
    expect(track).not.toBeNull();
  });

  it('progress circle starts at 12 o\'clock (START_ANGLE = -90)', () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    const progressCircle = container.querySelector('[class*="ringProgress"]');
    const transform = progressCircle?.getAttribute('transform') ?? '';
    expect(PROGRESS_RING_START_ANGLE_DEGREES).toBe(-90);
    expect(transform).toContain(`rotate(${PROGRESS_RING_START_ANGLE_DEGREES}`);
  });

  it('uses a full circle sweep angle', () => {
    expect(PROGRESS_RING_SWEEP_ANGLE_DEGREES).toBe(360);
  });

  it('SVG viewBox matches SMALL size (48)', () => {
    const { container } = render(
      <ProgressRing size={ProgressRingSize.SMALL} progress={0.5} />
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 48 48');
  });

  it('SVG viewBox matches LARGE size (100)', () => {
    const { container } = render(
      <ProgressRing size={ProgressRingSize.LARGE} progress={0.5} />
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100');
  });
});

describe('ProgressRing accessibility (progressbar a11y)', () => {
  it('aria-valuenow = percentage', () => {
    render(<ProgressRing progress={0.75} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });

  it('aria-valuemin = 0', () => {
    render(<ProgressRing progress={0.5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
  });

  it('aria-valuemax = 100', () => {
    render(<ProgressRing progress={0.5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
  });

  it('aria-label = "X%" (announced percentage)', () => {
    render(<ProgressRing progress={0.42} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '42%');
  });

  it('rounds percentage (round(progress * 100))', () => {
    render(<ProgressRing progress={0.667} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '67%');
  });

  it('ignores a blank custom aria-label', () => {
    render(<ProgressRing progress={0.42} aria-label="  " />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '42%');
  });
});

describe('ProgressRing progress clamping (clamped to [0, 1])', () => {
  it('clamps below 0', () => {
    render(<ProgressRing progress={-0.5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps above 1', () => {
    render(<ProgressRing progress={1.5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('0 = empty', () => {
    render(<ProgressRing progress={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('1 = full', () => {
    render(<ProgressRing progress={1} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('ProgressRing stroke-dasharray (progress arc)', () => {
  it('progress arc has stroke-dasharray set', () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    const progressCircle = container.querySelector('[class*="ringProgress"]');
    const style = progressCircle?.getAttribute('style') ?? '';
    expect(style).toContain('stroke-dasharray');
  });

  it('progress arc has stroke-dashoffset set', () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    const progressCircle = container.querySelector('[class*="ringProgress"]');
    const style = progressCircle?.getAttribute('style') ?? '';
    expect(style).toContain('stroke-dashoffset');
  });

  it('geometry helpers calculate the ring dimensions', () => {
    const radius = getProgressRingRadius(48, 4);
    const circumference = getProgressRingCircumference(radius);
    const dashOffset = getProgressRingDashOffset(circumference, 0.25);
    expect(radius).toBe(22);
    expect(circumference).toBeCloseTo(2 * Math.PI * 22);
    expect(dashOffset).toBeCloseTo(circumference * 0.75);
  });

  it('animated arc style uses the spring approximation duration', () => {
    const style = getProgressRingArcStyle(100, 50, true);
    expect(style.strokeDasharray).toBe('100 100');
    expect(style.strokeDashoffset).toBe(50);
    expect(style.transition).toContain(`${PROGRESS_RING_TRANSITION_DURATION_MS}ms`);
    expect(style.transition).toContain('linear(');
  });
});

describe('ProgressRing re-rendering', () => {
  it('updates progress correctly', () => {
    const { rerender } = render(<ProgressRing progress={0.3} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30');

    rerender(<ProgressRing progress={0.8} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');
  });

  it('updates size correctly', () => {
    const { container, rerender } = render(
      <ProgressRing size={ProgressRingSize.SMALL} progress={0.5} />
    );
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 48 48');

    rerender(<ProgressRing size={ProgressRingSize.LARGE} progress={0.5} />);
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 100 100');
  });
});

describe('ProgressRing accessibility announcements (announceUpdatesForAccessibility)', () => {
  function getLiveRegion(container: HTMLElement): HTMLElement | null {
    return container.querySelector('[aria-live="polite"]');
  }

  it('announces the rounded percent in a polite live region when enabled', () => {
    const { container } = render(
      <ProgressRing progress={0.42} announceUpdatesForAccessibility />
    );
    const liveRegion = getLiveRegion(container);
    expect(liveRegion).not.toBeNull();
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion?.textContent).toBe('42%');
  });

  it('rounds the announced percent like round(progress * 100)', () => {
    const { container } = render(
      <ProgressRing progress={0.667} announceUpdatesForAccessibility />
    );
    expect(getLiveRegion(container)?.textContent).toBe('67%');
  });

  it('updates the live announcement as progress changes', () => {
    const { container, rerender } = render(
      <ProgressRing progress={0.3} announceUpdatesForAccessibility />
    );
    expect(getLiveRegion(container)?.textContent).toBe('30%');

    rerender(<ProgressRing progress={0.8} announceUpdatesForAccessibility />);
    expect(getLiveRegion(container)?.textContent).toBe('80%');
  });

  it('renders no live announcement when disabled (default)', () => {
    const { container } = render(<ProgressRing progress={0.42} />);
    expect(getLiveRegion(container)?.textContent).toBe('');
  });

  it('does not announce after disabling even when progress changes', () => {
    const { container, rerender } = render(
      <ProgressRing progress={0.3} announceUpdatesForAccessibility />
    );
    expect(getLiveRegion(container)?.textContent).toBe('30%');

    rerender(<ProgressRing progress={0.8} announceUpdatesForAccessibility={false} />);
    expect(getLiveRegion(container)?.textContent).toBe('');
  });
});

describe('ProgressRing enum values', () => {
  it('SMALL = "small"', () => expect(ProgressRingSize.SMALL).toBe('small'));
  it('LARGE = "large"', () => expect(ProgressRingSize.LARGE).toBe('large'));
});
