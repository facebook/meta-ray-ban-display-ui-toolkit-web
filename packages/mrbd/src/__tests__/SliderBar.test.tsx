/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SliderBar tests
 *
 * Constants:
 * - IDLE height = 12, FOCUSED height = 16, THIN height = 6
 * - Track color: background track color
 * - Fill IDLE: idle control color
 * - Fill FOCUSED: active control color
 * - Default: min=0, max=1, value=0, state=IDLE, size=DEFAULT
 * - Corner radius: pill (height/2)
 * - Animation: ~150ms ease-out
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SliderBar,
  SliderBarOrientation,
  SliderBarState,
  SliderBarSize,
} from '../mrbd/ui/SliderBar';
import {
  clampSliderBarValue,
  getSliderBarCrossAxisHeight,
  getSliderBarProgressScale,
} from '../mrbd/ui/private/SliderBarGeometry';
import {
  SLIDER_BAR_DEFAULT_INCREMENT_PERCENTAGE,
  SLIDER_BAR_FOCUSED_HEIGHT,
  SLIDER_BAR_IDLE_HEIGHT,
  SLIDER_BAR_THIN_HEIGHT,
} from '../mrbd/ui/private/SliderBarMetrics';

describe('SliderBar rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<SliderBar />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=progressbar when non-interactive', () => {
    render(<SliderBar value={0.5} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('has role=slider when interactive (onChange provided)', () => {
    render(<SliderBar value={0.5} onChange={() => {}} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('renders track and fill elements', () => {
    const { container } = render(<SliderBar value={0.5} />);
    const track = container.querySelector('[class*="track"]');
    const fill = container.querySelector('[class*="fill"]');
    expect(track).not.toBeNull();
    expect(fill).not.toBeNull();
  });

  it('defaults animated to false', () => {
    const { container } = render(<SliderBar value={0.5} />);
    const fill = container.querySelector('[class*="fill"]') as HTMLElement;
    expect(fill).not.toBeNull();
    expect(fill.style.transition).toBe('');
  });

  it('applies a value transition when animated is explicitly true', () => {
    const { container } = render(<SliderBar value={0.5} animated={true} />);
    const fill = container.querySelector('[class*="fill"]') as HTMLElement;
    expect(fill).not.toBeNull();
    expect(fill.style.transition).not.toBe('');
    expect(fill.style.transition).toContain('width');
  });
});

describe('SliderBar heights match the expected constants', () => {
  it('geometry helper returns the expected cross-axis heights', () => {
    expect(
      getSliderBarCrossAxisHeight(
        SliderBarState.IDLE,
        SliderBarSize.DEFAULT,
        true
      )
    ).toBe(SLIDER_BAR_IDLE_HEIGHT);
    expect(
      getSliderBarCrossAxisHeight(
        SliderBarState.FOCUSED,
        SliderBarSize.DEFAULT,
        true
      )
    ).toBe(SLIDER_BAR_FOCUSED_HEIGHT);
    expect(
      getSliderBarCrossAxisHeight(
        SliderBarState.FOCUSED,
        SliderBarSize.THIN,
        true
      )
    ).toBe(SLIDER_BAR_THIN_HEIGHT);
  });

  it('IDLE height = 12px', () => {
    const { container } = render(
      <SliderBar state={SliderBarState.IDLE} />
    );
    const bar = container.firstElementChild;
    const style = bar?.getAttribute('style') ?? '';
    expect(style).toContain('height: 12px');
  });

  it('FOCUSED height = 16px when shouldExpandOnFocus', () => {
    const { container } = render(
      <SliderBar state={SliderBarState.FOCUSED} shouldExpandOnFocus />
    );
    const bar = container.firstElementChild;
    const style = bar?.getAttribute('style') ?? '';
    expect(style).toContain('height: 16px');
  });

  it('FOCUSED without expand stays at IDLE height (12px)', () => {
    const { container } = render(
      <SliderBar state={SliderBarState.FOCUSED} shouldExpandOnFocus={false} />
    );
    const bar = container.firstElementChild;
    const style = bar?.getAttribute('style') ?? '';
    expect(style).toContain('height: 12px');
  });

  it('THIN height = 6px for both states', () => {
    const { container } = render(
      <SliderBar state={SliderBarState.IDLE} size={SliderBarSize.THIN} />
    );
    const bar = container.firstElementChild;
    const style = bar?.getAttribute('style') ?? '';
    expect(style).toContain('height: 6px');
  });

  it('THIN stays at 6px even in FOCUSED state', () => {
    const { container } = render(
      <SliderBar state={SliderBarState.FOCUSED} size={SliderBarSize.THIN} shouldExpandOnFocus />
    );
    const bar = container.firstElementChild;
    const style = bar?.getAttribute('style') ?? '';
    expect(style).toContain('height: 6px');
  });
});

describe('SliderBar default values', () => {
  it('defaults to state=IDLE', () => {
    const { container } = render(<SliderBar />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('height: 12px');
  });

  it('defaults to size=DEFAULT', () => {
    const { container } = render(<SliderBar />);
    // DEFAULT size uses IDLE_HEIGHT=12 in IDLE state
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('height: 12px');
  });

  it('defaults to value=0, min=0, max=1', () => {
    render(<SliderBar />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '1');
  });
});

describe('SliderBar accessibility', () => {
  it('aria-valuenow reflects value', () => {
    render(<SliderBar value={0.7} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0.7');
  });

  it('aria-valuemin reflects minimumValue', () => {
    render(<SliderBar minimumValue={10} maximumValue={100} value={50} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '10');
  });

  it('aria-valuemax reflects maximumValue', () => {
    render(<SliderBar minimumValue={0} maximumValue={100} value={50} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
  });
});

describe('SliderBar progress calculation', () => {
  it('progress helper returns full scale when minimum equals maximum', () => {
    expect(getSliderBarProgressScale(1, 1, 1)).toBe(1);
  });

  it('clamp helper bounds values to min/max', () => {
    expect(clampSliderBarValue(-1, 0, 1)).toBe(0);
    expect(clampSliderBarValue(2, 0, 1)).toBe(1);
  });

  it('0 value = no fill element rendered', () => {
    const { container } = render(<SliderBar value={0} />);
    // When progress is 0%, the fill element may not be rendered at all.
    const fill = container.querySelector('[class*="fill"]');
    // Either null OR has width: 0%
    if (fill) {
      const style = fill.getAttribute('style') ?? '';
      expect(style).toContain('width: 0%');
    }
  });

  it('1 value (default max) = 100% fill width', () => {
    const { container } = render(<SliderBar value={1} />);
    const fill = container.querySelector('[class*="fill"]');
    const style = fill?.getAttribute('style') ?? '';
    expect(style).toContain('width: 100%');
  });

  it('0.5 value = 50% fill width', () => {
    const { container } = render(<SliderBar value={0.5} />);
    const fill = container.querySelector('[class*="fill"]');
    const style = fill?.getAttribute('style') ?? '';
    expect(style).toContain('width: 50%');
  });

  it('custom range: value=50, min=0, max=100 = 50% fill', () => {
    const { container } = render(
      <SliderBar minimumValue={0} maximumValue={100} value={50} />
    );
    const fill = container.querySelector('[class*="fill"]');
    const style = fill?.getAttribute('style') ?? '';
    expect(style).toContain('width: 50%');
  });

  it('vertical orientation fills from bottom to top', () => {
    const { container } = render(
      <SliderBar
        value={0.5}
        orientation={SliderBarOrientation.VERTICAL}
        state={SliderBarState.FOCUSED}
      />,
    );
    const barStyle = container.firstElementChild?.getAttribute('style') ?? '';
    const fillStyle = container.querySelector('[class*="fill"]')?.getAttribute('style') ?? '';

    expect(barStyle).toContain('width: 16px');
    expect(barStyle).toContain('height: 100%');
    expect(fillStyle).toContain('bottom: 0px');
    expect(fillStyle).toContain('width: 100%');
    expect(fillStyle).toContain('height: 50%');
  });

  it('clamps value below minimum (no fill or 0% fill)', () => {
    const { container } = render(
      <SliderBar minimumValue={0} maximumValue={1} value={-0.5} />
    );
    const fill = container.querySelector('[class*="fill"]');
    if (fill) {
      const style = fill.getAttribute('style') ?? '';
      expect(style).toContain('width: 0%');
    }
    // Value still valid in ARIA
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps value above maximum to 100%', () => {
    const { container } = render(
      <SliderBar minimumValue={0} maximumValue={1} value={1.5} />
    );
    const fill = container.querySelector('[class*="fill"]');
    const style = fill?.getAttribute('style') ?? '';
    expect(style).toContain('width: 100%');
  });
});

describe('SliderBar pill shape', () => {
  it('has rounded appearance (pill shape via CSS, cornerRadius = height/2)', () => {
    const { container } = render(<SliderBar />);
    // The shared full-radius token is applied by the CSS class.
    const bar = container.firstElementChild;
    expect(bar).not.toBeNull();
    expect(bar?.className).toContain('sliderBar');
  });
});

describe('SliderBar state enum', () => {
  it('IDLE = "idle"', () => expect(SliderBarState.IDLE).toBe('idle'));
  it('FOCUSED = "focused"', () => expect(SliderBarState.FOCUSED).toBe('focused'));
});

describe('SliderBar size enum', () => {
  it('DEFAULT = "default"', () => expect(SliderBarSize.DEFAULT).toBe('default'));
  it('THIN = "thin"', () => expect(SliderBarSize.THIN).toBe('thin'));
});

describe('SliderBar orientation enum', () => {
  it('HORIZONTAL = "horizontal"', () =>
    expect(SliderBarOrientation.HORIZONTAL).toBe('horizontal'));
  it('VERTICAL = "vertical"', () =>
    expect(SliderBarOrientation.VERTICAL).toBe('vertical'));
});

describe('SliderBar re-rendering', () => {
  it('updates fill when value changes', () => {
    const { rerender, container } = render(<SliderBar value={0.3} />);
    let fill = container.querySelector('[class*="fill"]');
    expect(fill?.getAttribute('style')).toContain('width: 30%');

    rerender(<SliderBar value={0.8} />);
    fill = container.querySelector('[class*="fill"]');
    expect(fill?.getAttribute('style')).toContain('width: 80%');
  });

  it('updates height when state changes', () => {
    const { rerender, container } = render(
      <SliderBar state={SliderBarState.IDLE} shouldExpandOnFocus />
    );
    expect(container.firstElementChild?.getAttribute('style')).toContain('height: 12px');

    rerender(<SliderBar state={SliderBarState.FOCUSED} shouldExpandOnFocus />);
    expect(container.firstElementChild?.getAttribute('style')).toContain('height: 16px');
  });
});

describe('SliderBar cross-axis transition gating', () => {
  it('animates the cross-axis on an IDLE<->FOCUSED state change when animated', () => {
    const { rerender, container } = render(
      <SliderBar animated state={SliderBarState.IDLE} shouldExpandOnFocus />
    );
    rerender(
      <SliderBar animated state={SliderBarState.FOCUSED} shouldExpandOnFocus />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('transition');
    expect(style).toContain('height');
  });

  it('snaps the cross-axis on a size change without a transition', () => {
    const { rerender, container } = render(
      <SliderBar
        animated
        state={SliderBarState.FOCUSED}
        size={SliderBarSize.DEFAULT}
        shouldExpandOnFocus
      />
    );
    rerender(
      <SliderBar
        animated
        state={SliderBarState.FOCUSED}
        size={SliderBarSize.THIN}
        shouldExpandOnFocus
      />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).not.toContain('transition');
  });

  it('does not animate the cross-axis when not animated', () => {
    const { rerender, container } = render(
      <SliderBar state={SliderBarState.IDLE} shouldExpandOnFocus />
    );
    rerender(<SliderBar state={SliderBarState.FOCUSED} shouldExpandOnFocus />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).not.toContain('transition');
  });

  it('snaps the cross-axis on the mount render (no transition)', () => {
    const { container } = render(
      <SliderBar animated state={SliderBarState.FOCUSED} shouldExpandOnFocus />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).not.toContain('transition');
  });
});

describe('SliderBar custom props', () => {
  it('default increment percentage is 0.1', () => {
    expect(SLIDER_BAR_DEFAULT_INCREMENT_PERCENTAGE).toBe(0.1);
  });

  it('accepts className', () => {
    const { container } = render(<SliderBar className="my-slider" />);
    expect(container.firstElementChild?.className).toContain('my-slider');
  });

  it('accepts custom style', () => {
    const { container } = render(<SliderBar style={{ margin: 8 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });

  it('forwards custom data attributes', () => {
    render(
      <SliderBar data-uit-capture-id="slider-capture" title="Progress" />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'data-uit-capture-id',
      'slider-capture',
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('title', 'Progress');
  });
});
