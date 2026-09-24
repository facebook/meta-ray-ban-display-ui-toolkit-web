/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ZoomIndicator tests
 *
 * Constants:
 * - Width: 40px
 * - Padding: 16px vertical
 * - Icon size: 24px
 * - Vertical orientation (rotated SliderBar)
 * - Non-interactive display component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getIndicatorPercentage } from '../mrbd/ui/private/IndicatorValue';
import { ZoomIndicator } from '../mrbd/ui/ZoomIndicator';
import {
  ZOOM_INDICATOR_CONTROL_WIDTH,
  ZOOM_INDICATOR_ICON_SIZE,
  ZOOM_INDICATOR_SLIDER_MIN_HEIGHT,
  ZOOM_INDICATOR_SLIDER_ICON_GAP,
  ZOOM_INDICATOR_VERTICAL_PADDING,
} from '../mrbd/ui/private/ZoomIndicatorMetrics';
import { TEST_ICON } from './helpers/testIcon';

const TEST_ICON_SRC = '/icons/test-icon.svg';

describe('ZoomIndicator initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<ZoomIndicator value={0.5} />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=progressbar', () => {
    render(<ZoomIndicator value={0.5} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

describe('ZoomIndicator icon', () => {
  it('defaults icon to the circle-handle glyph when omitted', () => {
    const { container } = render(<ZoomIndicator value={0.5} />);
    const iconContainer = container.querySelector('[class*="icon"]');
    expect(iconContainer).not.toBeNull();
    expect(iconContainer?.querySelector('svg')).not.toBeNull();
  });

  it('renders and tints a uri icon with the inherited color', () => {
    const { container } = render(
      <ZoomIndicator value={0.5} icon={{ uri: TEST_ICON_SRC }} />,
    );
    const iconContainer = container.querySelector('[class*="icon"]');
    expect(iconContainer).not.toBeNull();
    const mask = iconContainer?.querySelector('[style*="mask-image"]');
    expect(mask).toBeTruthy();
    const maskStyle = mask?.getAttribute('style') ?? '';
    expect(maskStyle).toContain(TEST_ICON_SRC);
    // Observable tint: the masked glyph fills with the inherited color.
    expect(maskStyle).toContain('background-color: currentcolor');
  });

  it('renders a vector token glyph inline and tints it via currentColor', () => {
    const { container } = render(
      <ZoomIndicator value={0.5} icon={TEST_ICON} />,
    );
    const iconContainer = container.querySelector('[class*="icon"]');
    expect(iconContainer).not.toBeNull();
    const svg = iconContainer?.querySelector('svg');
    expect(svg).not.toBeNull();
    // Observable tint: the inline glyph fills with the inherited color and
    // draws real path data rather than an empty element.
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.querySelector('path[d]')).not.toBeNull();
  });

  it('hides icon when explicitly set to null', () => {
    const { container } = render(
      <ZoomIndicator value={0.5} icon={null} />,
    );
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
    expect(container.querySelector('[class*="icon"]')).toBeNull();
  });
});

describe('ZoomIndicator value and range', () => {
  it('shared indicator percentage helper computes the announced percentage', () => {
    expect(getIndicatorPercentage(0.75, 0, 1)).toBe(75);
    expect(getIndicatorPercentage(1, 1, 1)).toBe(100);
  });

  it('aria-valuenow reflects value', () => {
    render(<ZoomIndicator value={0.3} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0.3');
  });

  it('clamps value to range', () => {
    render(<ZoomIndicator value={-0.5} minimumValue={0} maximumValue={1} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('default label is the bare "NN%" percentage with no "Zoom " prefix', () => {
    render(<ZoomIndicator value={0.75} />);
    const label = screen.getByRole('progressbar').getAttribute('aria-label') ?? '';
    expect(label).toBe('75%');
    expect(label).not.toContain('Zoom');
  });

  it('aria-valuenow/min/max are set on the progressbar', () => {
    render(<ZoomIndicator value={0.4} minimumValue={0} maximumValue={1} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0.4');
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressbar.getAttribute('aria-valuemax')).toBe('1');
  });

  it('announces the "NN%" percentage in a polite live region when enabled', () => {
    const { container } = render(
      <ZoomIndicator value={0.75} announceUpdatesForAccessibility />,
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live?.getAttribute('aria-atomic')).toBe('true');
    expect(live?.textContent).toBe('75%');
  });

  it('renders no live announcement by default (opt-in)', () => {
    const { container } = render(<ZoomIndicator value={0.75} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live?.textContent).toBe('');
  });

  it('custom aria-label is appended after the percentage', () => {
    render(<ZoomIndicator value={0.5} aria-label="Camera Zoom" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('50%, Camera Zoom');
  });

  it('ignores a blank custom aria-label', () => {
    render(<ZoomIndicator value={0.5} aria-label="  " />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('50%');
  });

  it('puts external label references on the progressbar', () => {
    const { container } = render(
      <ZoomIndicator
        value={0.5}
        aria-controls="zoom-controls"
        aria-describedby="zoom-description"
        aria-labelledby="zoom-label"
      />,
    );
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute(
      'aria-controls',
      'zoom-controls',
    );
    expect(progressbar).toHaveAttribute(
      'aria-describedby',
      'zoom-description',
    );
    expect(progressbar).toHaveAttribute(
      'aria-labelledby',
      'zoom-label',
    );
    expect(container.firstElementChild).not.toHaveAttribute('aria-controls');
  });
});

describe('ZoomIndicator dimensions', () => {
  it('content has width of 40px', () => {
    const { container } = render(<ZoomIndicator value={0.5} />);
    const content = container.querySelector('[class*="content"]');
    const style = content?.getAttribute('style') ?? '';
    expect(style).toContain(`width: ${ZOOM_INDICATOR_CONTROL_WIDTH}`);
  });

  it('layout metrics are exported', () => {
    expect(ZOOM_INDICATOR_VERTICAL_PADDING).toBe(16);
    expect(ZOOM_INDICATOR_SLIDER_ICON_GAP).toBe(8);
    expect(ZOOM_INDICATOR_ICON_SIZE).toBe(24);
    expect(ZOOM_INDICATOR_SLIDER_MIN_HEIGHT).toBe(200);
  });

  it('slider wrapper keeps 200px minimum height', () => {
    const { container } = render(<ZoomIndicator value={0.5} />);
    const sliderWrapper = container.querySelector('[class*="sliderWrapper"]');
    const style = sliderWrapper?.getAttribute('style') ?? '';
    expect(style).toContain(`flex-basis: ${ZOOM_INDICATOR_SLIDER_MIN_HEIGHT}`);
    expect(style).toContain(`min-height: ${ZOOM_INDICATOR_SLIDER_MIN_HEIGHT}`);
  });

  it('emits capture id on the root element', () => {
    const { container } = render(
      <ZoomIndicator value={0.5} data-uit-capture-id="zoom-capture" />,
    );
    expect(
      container.querySelector('[data-uit-capture-id="zoom-capture"]'),
    ).toBe(container.firstElementChild);
  });
});

describe('ZoomIndicator custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <ZoomIndicator value={0.5} className="my-zoom" />
    );
    expect(container.firstElementChild?.className).toContain('my-zoom');
  });
});

describe('ZoomIndicator re-rendering', () => {
  it('updates value on rerender', () => {
    const { rerender } = render(<ZoomIndicator value={0.3} />);
    rerender(<ZoomIndicator value={0.9} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0.9');
  });
});

describe('ZoomIndicator animated default', () => {
  it('does not animate by default', () => {
    const { container } = render(<ZoomIndicator value={0.5} />);
    const fill = container.querySelector('[class*="fill"]');
    const style = fill?.getAttribute('style') ?? '';
    expect(style).not.toContain('transition');
  });

  it('animates when animated is explicitly true', () => {
    const { container } = render(<ZoomIndicator value={0.5} animated={true} />);
    const fill = container.querySelector('[class*="fill"]');
    const style = fill?.getAttribute('style') ?? '';
    expect(style).toContain('transition');
  });
});
