/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * VolumeIndicator tests
 *
 * Constants:
 * - Height: 44px (CONTROL_HEIGHT)
 * - Padding: 16px horizontal (spacing-medium)
 * - Icon size: 24px
 * - Non-interactive display component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  clampIndicatorValue,
  getIndicatorPercentage,
} from '../mrbd/ui/private/IndicatorValue';
import { VolumeIndicator } from '../mrbd/ui/VolumeIndicator';
import {
  VOLUME_INDICATOR_CONTROL_HEIGHT,
  VOLUME_INDICATOR_HORIZONTAL_PADDING,
  VOLUME_INDICATOR_ICON_SLIDER_GAP,
  VOLUME_INDICATOR_SLIDER_MIN_WIDTH,
} from '../mrbd/ui/private/VolumeIndicatorMetrics';
import { TEST_ICON } from './helpers/testIcon';

const TEST_ICON_SRC = '/icons/volume.svg';

describe('VolumeIndicator initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<VolumeIndicator value={0.5} />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=progressbar', () => {
    render(<VolumeIndicator value={0.5} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

describe('VolumeIndicator icon', () => {
  it('defaults to the speaker glyph when icon is omitted', () => {
    const { container } = render(<VolumeIndicator value={0.5} />);
    const iconContainer = container.querySelector('[class*="icon"]');
    expect(iconContainer).not.toBeNull();
    expect(iconContainer?.querySelector('svg')).not.toBeNull();
  });

  it('renders a default inline svg icon', () => {
    const { container } = render(<VolumeIndicator value={0.5} />);
    const path = container
      .querySelector('[class*="icon"] svg path')
      ?.getAttribute('d');
    expect(path).toBeTruthy();
    expect((path ?? '').length).toBeGreaterThan(0);
  });

  it('hides icon when icon is null', () => {
    const { container } = render(<VolumeIndicator value={0.5} icon={null} />);
    expect(container.querySelector('[class*="icon"]')).toBeNull();
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <VolumeIndicator value={0.5} icon={{ uri: TEST_ICON_SRC }} />,
    );
    const iconContainer = container.querySelector('[class*="icon"]');
    expect(iconContainer).not.toBeNull();
    const mask = iconContainer?.querySelector('[style*="mask-image"]');
    expect(mask).toBeTruthy();
    expect(mask?.getAttribute('style')).toContain(TEST_ICON_SRC);
  });

  it('renders an inline svg for a vector token', () => {
    const { container } = render(
      <VolumeIndicator value={0.5} icon={TEST_ICON} />,
    );
    const iconContainer = container.querySelector('[class*="icon"]');
    expect(iconContainer).not.toBeNull();
    expect(iconContainer?.querySelector('svg')).not.toBeNull();
  });

  it('clears icon when icon is set to null', () => {
    const { container, rerender } = render(
      <VolumeIndicator value={0.5} icon={{ uri: TEST_ICON_SRC }} />,
    );
    expect(container.querySelector('[style*="mask-image"]')).toBeTruthy();
    rerender(<VolumeIndicator value={0.5} icon={null} />);
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
    expect(container.querySelector('[class*="icon"]')).toBeNull();
  });
});

describe('VolumeIndicator value and range', () => {
  it('shared indicator helpers compute the value announcement math', () => {
    expect(clampIndicatorValue(1.5, 0, 1)).toBe(1);
    expect(getIndicatorPercentage(0.5, 0, 1)).toBe(50);
    expect(getIndicatorPercentage(1, 1, 1)).toBe(100);
  });

  it('aria-valuenow reflects value', () => {
    render(<VolumeIndicator value={0.7} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0.7');
  });

  it('clamps value to range', () => {
    render(<VolumeIndicator value={1.5} minimumValue={0} maximumValue={1} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  });

  it('default label includes the percentage and volume context', () => {
    render(<VolumeIndicator value={0.5} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('50%, Volume');
  });

  it('custom aria-label is appended after the percentage', () => {
    render(<VolumeIndicator value={0.5} aria-label="Media Volume" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('50%, Media Volume');
  });

  it('falls back to the default label when custom aria-label is blank', () => {
    render(<VolumeIndicator value={0.5} aria-label="  " />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('50%, Volume');
  });

  it('puts external label references on the progressbar', () => {
    const { container } = render(
      <VolumeIndicator
        value={0.5}
        aria-controls="volume-controls"
        aria-describedby="volume-description"
        aria-labelledby="volume-label"
      />,
    );
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute(
      'aria-controls',
      'volume-controls',
    );
    expect(progressbar).toHaveAttribute(
      'aria-describedby',
      'volume-description',
    );
    expect(progressbar).toHaveAttribute(
      'aria-labelledby',
      'volume-label',
    );
    expect(container.firstElementChild).not.toHaveAttribute('aria-controls');
  });
});

describe('VolumeIndicator accessibility announcements (announceUpdatesForAccessibility)', () => {
  // The indicator's progressbar is non-focusable, so announcements are opt-in
  // via announceUpdatesForAccessibility (default false), same idiom as
  // ProgressRing. The live region is a sibling of the role="progressbar" node.
  it('announces the "NN%" percentage in a polite live region when enabled', () => {
    const { container } = render(
      <VolumeIndicator value={0.75} announceUpdatesForAccessibility />,
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live?.getAttribute('aria-atomic')).toBe('true');
    expect(live?.textContent).toBe('75%');
  });

  it('renders no live announcement by default (opt-in)', () => {
    const { container } = render(<VolumeIndicator value={0.75} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live?.textContent).toBe('');
  });
});

describe('VolumeIndicator dimensions', () => {
  it('content has height of 44px', () => {
    const { container } = render(<VolumeIndicator value={0.5} />);
    const content = container.querySelector('[class*="content"]');
    const style = content?.getAttribute('style') ?? '';
    expect(style).toContain(`height: ${VOLUME_INDICATOR_CONTROL_HEIGHT}`);
  });

  it('layout metrics are exported', () => {
    expect(VOLUME_INDICATOR_HORIZONTAL_PADDING).toBe(16);
    expect(VOLUME_INDICATOR_ICON_SLIDER_GAP).toBe(8);
    expect(VOLUME_INDICATOR_SLIDER_MIN_WIDTH).toBe(200);
  });

  it('slider wrapper keeps 200px minimum width', () => {
    const { container } = render(<VolumeIndicator value={0.5} />);
    const sliderWrapper = container.querySelector('[class*="sliderWrapper"]');
    const style = sliderWrapper?.getAttribute('style') ?? '';
    expect(style).toContain(`min-width: ${VOLUME_INDICATOR_SLIDER_MIN_WIDTH}`);
  });

  it('emits capture id on the root element', () => {
    const { container } = render(
      <VolumeIndicator value={0.5} data-uit-capture-id="volume-capture" />,
    );
    expect(
      container.querySelector('[data-uit-capture-id="volume-capture"]'),
    ).toBe(container.firstElementChild);
  });
});

describe('VolumeIndicator animation', () => {
  it('does not animate the slider fill by default', () => {
    const { container } = render(<VolumeIndicator value={0.5} />);
    const fill = container.querySelector('[class*="sliderWrapper"] div[class*="fill"]');
    const style = fill?.getAttribute('style') ?? '';
    expect(style).not.toContain('transition');
  });

  it('animates the slider fill when animated is true', () => {
    const { container } = render(<VolumeIndicator value={0.5} animated />);
    const fill = container.querySelector('[class*="sliderWrapper"] div[class*="fill"]');
    const style = fill?.getAttribute('style') ?? '';
    expect(style).toContain('transition');
  });
});

describe('VolumeIndicator custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <VolumeIndicator value={0.5} className="my-vol" />
    );
    expect(container.firstElementChild?.className).toContain('my-vol');
  });
});
