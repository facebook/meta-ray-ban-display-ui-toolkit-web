/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ProgressIndicator tests
 *
 * Features:
 * - Role: progressbar
 * - Size: DEFAULT and THIN variants
 * - Active/inactive visual states
 * - Non-interactive display component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getIndicatorPercentage } from '../mrbd/ui/private/IndicatorValue';
import { progressIndicatorSizeToSliderBarSize } from '../mrbd/ui/private/ProgressIndicatorAdapters';
import { ProgressIndicator, ProgressIndicatorSize } from '../mrbd/ui/ProgressIndicator';
import { SliderBarSize } from '../mrbd/ui/SliderBar';

describe('ProgressIndicator initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressIndicator />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=progressbar', () => {
    render(<ProgressIndicator />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('default value is 0', () => {
    render(<ProgressIndicator />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });
});

describe('ProgressIndicator value and range', () => {
  it('shared indicator percentage helper computes the announced percentage', () => {
    expect(getIndicatorPercentage(0.5, 0, 1)).toBe(50);
    expect(getIndicatorPercentage(1, 1, 1)).toBe(100);
  });

  it('aria-valuenow reflects value', () => {
    render(<ProgressIndicator value={0.6} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0.6');
  });

  it('clamps value to min/max', () => {
    render(<ProgressIndicator value={2} minimumValue={0} maximumValue={1} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  });

  it('custom min/max', () => {
    render(<ProgressIndicator value={50} minimumValue={0} maximumValue={100} />);
    const el = screen.getByRole('progressbar');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('50');
  });

  it('default label shows percentage', () => {
    render(<ProgressIndicator value={0.5} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('50%');
  });
});

describe('ProgressIndicator size variants', () => {
  it('DEFAULT size renders', () => {
    const { container } = render(
      <ProgressIndicator value={0.5} size={ProgressIndicatorSize.DEFAULT} />
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('THIN size renders', () => {
    const { container } = render(
      <ProgressIndicator value={0.5} size={ProgressIndicatorSize.THIN} />
    );
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe('ProgressIndicatorSize enum', () => {
  it('DEFAULT = "default"', () => {
    expect(ProgressIndicatorSize.DEFAULT).toBe('default');
  });
  it('THIN = "thin"', () => {
    expect(ProgressIndicatorSize.THIN).toBe('thin');
  });

  it('maps ProgressIndicator size to SliderBar size', () => {
    expect(progressIndicatorSizeToSliderBarSize(ProgressIndicatorSize.DEFAULT)).toBe(
      SliderBarSize.DEFAULT
    );
    expect(progressIndicatorSizeToSliderBarSize(ProgressIndicatorSize.THIN)).toBe(
      SliderBarSize.THIN
    );
  });
});

describe('ProgressIndicator active state', () => {
  it('defaults to active', () => {
    const { container } = render(<ProgressIndicator value={0.5} />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders in inactive state', () => {
    const { container } = render(<ProgressIndicator value={0.5} isActive={false} />);
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe('ProgressIndicator animated default', () => {
  it('defaults to animated=false (no transition style on the fill)', () => {
    const { container } = render(<ProgressIndicator value={0.5} />);
    const fill = container.querySelector('[class*="fill"]');
    const style = fill?.getAttribute('style') ?? '';
    expect(style).not.toContain('transition');
  });

  it('applies a transition when animated is explicitly true', () => {
    const { container } = render(<ProgressIndicator value={0.5} animated />);
    const fill = container.querySelector('[class*="fill"]');
    const style = fill?.getAttribute('style') ?? '';
    expect(style).toContain('transition');
  });
});

describe('ProgressIndicator custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <ProgressIndicator value={0.5} className="my-progress" />
    );
    expect(container.firstElementChild?.className).toContain('my-progress');
  });

  it('custom aria-label is appended after the percentage', () => {
    render(<ProgressIndicator value={0.5} aria-label="Download" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('50%, Download');
  });

  it('ignores a blank custom aria-label', () => {
    render(<ProgressIndicator value={0.5} aria-label="  " />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('50%');
  });

  it('forwards ARIA relationships to the progressbar node', () => {
    const { container } = render(
      <ProgressIndicator value={0.5} aria-describedby="progress-help" />,
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-describedby',
      'progress-help',
    );
    expect(container.firstElementChild).not.toHaveAttribute('aria-describedby');
  });
});

describe('ProgressIndicator accessibility announcements', () => {
  it('announces the percentage by default', () => {
    const { container } = render(<ProgressIndicator value={0.5} />);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('50%');
  });

  it('does not announce the percentage when disabled', () => {
    const { container } = render(
      <ProgressIndicator value={0.5} announceUpdatesForAccessibility={false} />,
    );
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('');
  });
});

describe('ProgressIndicator re-rendering', () => {
  it('updates value on rerender', () => {
    const { rerender } = render(<ProgressIndicator value={0.3} />);
    rerender(<ProgressIndicator value={0.8} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0.8');
  });
});
