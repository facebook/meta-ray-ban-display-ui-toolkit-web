/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * IsolatedControl tests
 *
 * Constants:
 * - Height: 88px (ISOLATED_CONTROL_HEIGHT)
 * - Padding: 32px right, 24px left with icon, 32px left without icon
 * - Default increment: 10% (DEFAULT_INCREMENT_PERCENTAGE)
 * - Role: slider
 * - DPAD left/right: adjust value
 */

import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { INVALID_FOCUS_DIRECTION_EVENT } from '@wearables-ui-toolkit/foundation/base/FocusCoordinator';
import {
  IsolatedControl,
  type IsolatedControlHandle,
} from '../mrbd/ui/IsolatedControl';
import {
  clampIsolatedControlValue,
  getIsolatedControlAnnouncementPercent,
  getIsolatedControlContentStyle,
  getIsolatedControlMinWidth,
  getIsolatedControlNextValue,
} from '../mrbd/ui/private/IsolatedControlLayout';
import {
  ISOLATED_CONTROL_HEIGHT,
  ISOLATED_CONTROL_MIN_WIDTH_NO_ICON,
  ISOLATED_CONTROL_MIN_WIDTH_WITH_ICON,
  ISOLATED_CONTROL_PADDING_LEFT_NO_ICON,
  ISOLATED_CONTROL_PADDING_LEFT_WITH_ICON,
} from '../mrbd/ui/private/IsolatedControlMetrics';

const TEST_ICON_SRC = '/icons/test-icon.svg';
const TEST_ICON: IconSource = { uri: TEST_ICON_SRC };

// ============================================================================
// Initialization
// ============================================================================

describe('IsolatedControl initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<IsolatedControl value={0.5} />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=slider', () => {
    render(<IsolatedControl value={0.5} aria-label="Volume" />);
    expect(screen.getAllByRole('slider')[0]).toBeInTheDocument();
  });

  it('has height of 88px (ISOLATED_CONTROL_HEIGHT)', () => {
    const { container } = render(<IsolatedControl value={0.5} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain(`height: ${ISOLATED_CONTROL_HEIGHT}`);
  });

  it('defaults partial focus to the vertical axis', () => {
    render(<IsolatedControl value={0.5} aria-label="Brightness" />);
    const root = screen.getAllByRole('slider')[0];
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 1);

    act(() => {
      root.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'right' },
        }),
      );
    });

    expect(requestFrameSpy).not.toHaveBeenCalled();

    act(() => {
      root.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'down' },
        }),
      );
    });

    expect(requestFrameSpy).toHaveBeenCalledTimes(1);
    requestFrameSpy.mockRestore();
  });
});

// ============================================================================
// Icon
// ============================================================================

describe('IsolatedControl icon', () => {
  it('renders icon when provided', () => {
    const { container } = render(
      <IsolatedControl value={0.5} icon={TEST_ICON} />
    );
    const icon = container.querySelector('[style*="mask-image"]');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('style')).toContain(TEST_ICON_SRC);
  });

  it('hides icon area when not provided', () => {
    const { container } = render(<IsolatedControl value={0.5} />);
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
  });

  it('adjusts padding when icon present (24px left)', () => {
    const { container } = render(
      <IsolatedControl value={0.5} icon={TEST_ICON} />
    );
    // The IsolatedControl content div is inside contentWrapper
    const allContent = container.querySelectorAll('[class*="content"]');
    const icContent = Array.from(allContent).find(
      el => el.getAttribute('style')?.includes('padding-left')
    );
    expect(icContent).not.toBeNull();
    expect(icContent?.getAttribute('style')).toContain(
      `padding-left: ${ISOLATED_CONTROL_PADDING_LEFT_WITH_ICON}`,
    );
  });

  it('uses standard padding when no icon (32px left)', () => {
    const { container } = render(<IsolatedControl value={0.5} />);
    const allContent = container.querySelectorAll('[class*="content"]');
    const icContent = Array.from(allContent).find(
      el => el.getAttribute('style')?.includes('padding-left')
    );
    expect(icContent).not.toBeNull();
    expect(icContent?.getAttribute('style')).toContain(
      `padding-left: ${ISOLATED_CONTROL_PADDING_LEFT_NO_ICON}`,
    );
  });

  it('uses wrap-content min width with and without icon', () => {
    const withIcon = render(
      <IsolatedControl value={0.5} icon={TEST_ICON} />
    );
    expect(withIcon.container.firstElementChild?.getAttribute('style')).toContain(
      `min-width: ${ISOLATED_CONTROL_MIN_WIDTH_WITH_ICON}px`,
    );

    const withoutIcon = render(<IsolatedControl value={0.5} />);
    expect(withoutIcon.container.firstElementChild?.getAttribute('style')).toContain(
      `min-width: ${ISOLATED_CONTROL_MIN_WIDTH_NO_ICON}px`,
    );
  });
});

// ============================================================================
// Pure helpers
// ============================================================================

describe('IsolatedControl layout helpers', () => {
  it('clamps values to the slider range', () => {
    expect(clampIsolatedControlValue(-1, 0, 1)).toBe(0);
    expect(clampIsolatedControlValue(2, 0, 1)).toBe(1);
    expect(clampIsolatedControlValue(0.5, 0, 1)).toBe(0.5);
  });

  it('calculates accessibility announcement percentages', () => {
    expect(getIsolatedControlAnnouncementPercent(0.5, 0, 1)).toBe(50);
    expect(getIsolatedControlAnnouncementPercent(1, 1, 1)).toBe(100);
  });

  it('calculates next values using increment percentage', () => {
    expect(
      getIsolatedControlNextValue({
        value: 0.5,
        minimumValue: 0,
        maximumValue: 1,
        incrementPercentage: 0.1,
        increment: true,
      }),
    ).toBeCloseTo(0.6);
    expect(
      getIsolatedControlNextValue({
        value: 0.05,
        minimumValue: 0,
        maximumValue: 1,
        incrementPercentage: 0.1,
        increment: false,
      }),
    ).toBe(0);
  });

  it('returns content padding and min width by icon presence', () => {
    expect(getIsolatedControlContentStyle(true).paddingLeft).toBe(
      ISOLATED_CONTROL_PADDING_LEFT_WITH_ICON,
    );
    expect(getIsolatedControlContentStyle(false).paddingLeft).toBe(
      ISOLATED_CONTROL_PADDING_LEFT_NO_ICON,
    );
    expect(getIsolatedControlMinWidth(true)).toBe(ISOLATED_CONTROL_MIN_WIDTH_WITH_ICON);
    expect(getIsolatedControlMinWidth(false)).toBe(ISOLATED_CONTROL_MIN_WIDTH_NO_ICON);
  });
});

// ============================================================================
// Value / Range (min/max delegation to SliderBar)
// ============================================================================

describe('IsolatedControl value and range', () => {
  it('aria-valuenow reflects current value', () => {
    render(<IsolatedControl value={0.7} aria-label="Slider" />);
    const slider = screen.getAllByRole('slider')[0];
    expect(slider.getAttribute('aria-valuenow')).toBe('0.7');
  });

  it('aria-valuemin defaults to 0', () => {
    render(<IsolatedControl value={0.5} aria-label="Slider" />);
    const slider = screen.getAllByRole('slider')[0];
    expect(slider.getAttribute('aria-valuemin')).toBe('0');
  });

  it('aria-valuemax defaults to 1', () => {
    render(<IsolatedControl value={0.5} aria-label="Slider" />);
    const slider = screen.getAllByRole('slider')[0];
    expect(slider.getAttribute('aria-valuemax')).toBe('1');
  });

  it('custom min/max are reflected in ARIA', () => {
    render(
      <IsolatedControl value={50} minimumValue={0} maximumValue={100} aria-label="Slider" />
    );
    const slider = screen.getAllByRole('slider')[0];
    expect(slider.getAttribute('aria-valuemin')).toBe('0');
    expect(slider.getAttribute('aria-valuemax')).toBe('100');
    expect(slider.getAttribute('aria-valuenow')).toBe('50');
  });

  it('clamps value to min/max', () => {
    render(<IsolatedControl value={-5} minimumValue={0} maximumValue={1} aria-label="S" />);
    const slider = screen.getAllByRole('slider')[0];
    expect(slider.getAttribute('aria-valuenow')).toBe('0');
  });
});

// ============================================================================
// Key events (DPAD left/right)
// ============================================================================

describe('IsolatedControl key handling (DPAD)', () => {
  it('ArrowRight increments value', () => {
    const handleChange = vi.fn();
    render(
      <IsolatedControl value={0.5} onValueChanged={handleChange} aria-label="Vol" />
    );
    fireEvent.keyDown(screen.getAllByRole('slider')[0], { key: 'ArrowRight' });
    expect(handleChange).not.toHaveBeenCalled();
    fireEvent.keyUp(screen.getAllByRole('slider')[0], { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledTimes(1);
    // Default increment: 10% of range(0-1) = 0.1, so new value = 0.6
    expect(handleChange).toHaveBeenCalledWith(expect.closeTo(0.6, 5));
  });

  it('ArrowLeft decrements value', () => {
    const handleChange = vi.fn();
    render(
      <IsolatedControl value={0.5} onValueChanged={handleChange} aria-label="Vol" />
    );
    fireEvent.keyDown(screen.getAllByRole('slider')[0], { key: 'ArrowLeft' });
    expect(handleChange).not.toHaveBeenCalled();
    fireEvent.keyUp(screen.getAllByRole('slider')[0], { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith(expect.closeTo(0.4, 5));
  });

  it('does not exceed maximum', () => {
    const handleChange = vi.fn();
    render(
      <IsolatedControl value={0.95} onValueChanged={handleChange} aria-label="Vol" />
    );
    fireEvent.keyDown(screen.getAllByRole('slider')[0], { key: 'ArrowRight' });
    fireEvent.keyUp(screen.getAllByRole('slider')[0], { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('does not go below minimum', () => {
    const handleChange = vi.fn();
    render(
      <IsolatedControl value={0.05} onValueChanged={handleChange} aria-label="Vol" />
    );
    fireEvent.keyDown(screen.getAllByRole('slider')[0], { key: 'ArrowLeft' });
    fireEvent.keyUp(screen.getAllByRole('slider')[0], { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith(0);
  });

  it('ignores keys when disabled', () => {
    const handleChange = vi.fn();
    render(
      <IsolatedControl value={0.5} onValueChanged={handleChange} disabled aria-label="Vol" />
    );
    const keyDownNotPrevented = fireEvent.keyDown(screen.getAllByRole('slider')[0], {
      key: 'ArrowRight',
    });
    fireEvent.keyUp(screen.getAllByRole('slider')[0], { key: 'ArrowRight' });
    expect(keyDownNotPrevented).toBe(true);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('custom incrementPercentage works', () => {
    const handleChange = vi.fn();
    render(
      <IsolatedControl
        value={0.5}
        incrementPercentage={0.25}
        onValueChanged={handleChange}
        aria-label="Vol"
      />
    );
    fireEvent.keyDown(screen.getAllByRole('slider')[0], { key: 'ArrowRight' });
    fireEvent.keyUp(screen.getAllByRole('slider')[0], { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith(expect.closeTo(0.75, 5));
  });

  it('allows vertical arrows to pass through to focus navigation', () => {
    const handleChange = vi.fn();
    render(
      <IsolatedControl value={0.5} onValueChanged={handleChange} aria-label="Vol" />
    );

    const slider = screen.getAllByRole('slider')[0];
    expect(fireEvent.keyDown(slider, { key: 'ArrowDown' })).toBe(true);
    expect(fireEvent.keyUp(slider, { key: 'ArrowDown' })).toBe(true);
    expect(handleChange).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Accessibility (range info, scroll actions)
// ============================================================================

describe('IsolatedControl accessibility', () => {
  it('aria-label from prop', () => {
    render(<IsolatedControl value={0.5} aria-label="Brightness" />);
    const slider = screen.getAllByRole('slider')[0];
    expect(slider.getAttribute('aria-label')).toBe('Brightness');
  });

  it('aria-label defaults to percentage', () => {
    render(<IsolatedControl value={0.5} />);
    const slider = screen.getAllByRole('slider')[0];
    expect(slider.getAttribute('aria-label')).toBe('50%');
  });

  it('aria-disabled when disabled', () => {
    render(<IsolatedControl value={0.5} disabled aria-label="S" />);
    const slider = screen.getAllByRole('slider')[0];
    expect(slider.getAttribute('aria-disabled')).toBe('true');
  });
});

// ============================================================================
// Material / Container
// ============================================================================

describe('IsolatedControl material', () => {
  it('has background layers', () => {
    const { container } = render(<IsolatedControl value={0.5} />);
    expect(container.querySelector('[class*="backgroundLayers"]')).not.toBeNull();
  });
});

// ============================================================================
// Custom props
// ============================================================================

describe('IsolatedControl custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <IsolatedControl value={0.5} className="my-control" />
    );
    expect(container.firstElementChild?.className).toContain('my-control');
  });

  it('accepts custom style merged with height', () => {
    const { container } = render(
      <IsolatedControl value={0.5} style={{ margin: 8 }} />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('height: 88');
    expect(style).toContain('margin: 8px');
  });
});

// ============================================================================
// Re-rendering
// ============================================================================

describe('IsolatedControl re-rendering', () => {
  it('updates value on rerender', () => {
    const { rerender } = render(
      <IsolatedControl value={0.3} aria-label="Slider" />
    );
    rerender(<IsolatedControl value={0.7} aria-label="Slider" />);
    expect(screen.getAllByRole('slider')[0].getAttribute('aria-valuenow')).toBe('0.7');
  });

  it('updates range on rerender', () => {
    const { rerender } = render(
      <IsolatedControl value={50} minimumValue={0} maximumValue={100} aria-label="S" />
    );
    rerender(
      <IsolatedControl value={50} minimumValue={10} maximumValue={200} aria-label="S" />
    );
    expect(screen.getAllByRole('slider')[0].getAttribute('aria-valuemin')).toBe('10');
    expect(screen.getAllByRole('slider')[0].getAttribute('aria-valuemax')).toBe('200');
  });

  it('uses the latest controlled value for key increments', () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <IsolatedControl value={0.2} onValueChanged={handleChange} aria-label="Vol" />
    );

    rerender(
      <IsolatedControl value={0.7} onValueChanged={handleChange} aria-label="Vol" />
    );
    const slider = screen.getAllByRole('slider')[0];
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyUp(slider, { key: 'ArrowRight' });

    expect(handleChange).toHaveBeenCalledWith(expect.closeTo(0.8, 5));
  });

  it('uses the latest controlled mode for imperative updates', () => {
    const ref = createRef<IsolatedControlHandle>();
    const { rerender } = render(
      <IsolatedControl ref={ref} defaultValue={0.2} aria-label="Vol" />
    );

    rerender(<IsolatedControl ref={ref} value={0.5} aria-label="Vol" />);
    act(() => ref.current?.setValue(0.9));
    rerender(<IsolatedControl ref={ref} defaultValue={0.2} aria-label="Vol" />);
    expect(screen.getAllByRole('slider')[0]).toHaveAttribute('aria-valuenow', '0.2');

    act(() => ref.current?.setValue(0.8));
    expect(screen.getAllByRole('slider')[0]).toHaveAttribute('aria-valuenow', '0.8');
  });
});

// ============================================================================
// Uncontrolled mode (no `value` prop, seeded from `defaultValue`)
// ============================================================================

describe('IsolatedControl uncontrolled mode', () => {
  it('seeds value from defaultValue', () => {
    render(<IsolatedControl defaultValue={0.3} aria-label="Vol" />);
    expect(screen.getAllByRole('slider')[0].getAttribute('aria-valuenow')).toBe('0.3');
  });

  it('defaults to minimumValue when no defaultValue is provided', () => {
    render(<IsolatedControl minimumValue={0.2} maximumValue={1} aria-label="Vol" />);
    expect(screen.getAllByRole('slider')[0].getAttribute('aria-valuenow')).toBe('0.2');
  });

  it('self-updates value on ArrowRight and still fires onValueChanged', () => {
    const handleChange = vi.fn();
    render(
      <IsolatedControl
        defaultValue={0.5}
        onValueChanged={handleChange}
        aria-label="Vol"
      />
    );
    const slider = screen.getAllByRole('slider')[0];

    act(() => {
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyUp(slider, { key: 'ArrowRight' });
    });

    expect(handleChange).toHaveBeenCalledWith(expect.closeTo(0.6, 5));
    // Internal state advanced without the parent updating any prop.
    expect(slider.getAttribute('aria-valuenow')).toBe('0.6');
  });

  it('self-updates value on ArrowLeft', () => {
    render(<IsolatedControl defaultValue={0.5} aria-label="Vol" />);
    const slider = screen.getAllByRole('slider')[0];

    act(() => {
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      fireEvent.keyUp(slider, { key: 'ArrowLeft' });
    });

    expect(slider.getAttribute('aria-valuenow')).toBe('0.4');
  });

  it('accumulates self-updates across multiple key presses', () => {
    render(<IsolatedControl defaultValue={0.5} aria-label="Vol" />);
    const slider = screen.getAllByRole('slider')[0];

    act(() => {
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyUp(slider, { key: 'ArrowRight' });
    });
    act(() => {
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyUp(slider, { key: 'ArrowRight' });
    });

    expect(slider.getAttribute('aria-valuenow')).toBe('0.7');
  });
});

// ============================================================================
// Controlled mode does not self-update
// ============================================================================

describe('IsolatedControl controlled mode', () => {
  it('does not self-update internal value when `value` is provided', () => {
    const handleChange = vi.fn();
    render(
      <IsolatedControl value={0.5} onValueChanged={handleChange} aria-label="Vol" />
    );
    const slider = screen.getAllByRole('slider')[0];

    act(() => {
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyUp(slider, { key: 'ArrowRight' });
    });

    // onValueChanged fires, but the rendered value stays pinned to the prop.
    expect(handleChange).toHaveBeenCalledWith(expect.closeTo(0.6, 5));
    expect(slider.getAttribute('aria-valuenow')).toBe('0.5');
  });
});

// ============================================================================
// Imperative handle (ref.setValue)
// ============================================================================

describe('IsolatedControl imperative handle', () => {
  it('ref.setValue updates the value in uncontrolled mode', () => {
    const ref = createRef<IsolatedControlHandle>();
    render(<IsolatedControl ref={ref} defaultValue={0.2} aria-label="Vol" />);
    const slider = screen.getAllByRole('slider')[0];
    expect(slider.getAttribute('aria-valuenow')).toBe('0.2');

    act(() => {
      ref.current?.setValue(0.8);
    });

    expect(slider.getAttribute('aria-valuenow')).toBe('0.8');
  });

  it('ref.setValue clamps to the slider range', () => {
    const ref = createRef<IsolatedControlHandle>();
    render(
      <IsolatedControl ref={ref} defaultValue={0.5} minimumValue={0} maximumValue={1} aria-label="Vol" />
    );
    const slider = screen.getAllByRole('slider')[0];

    act(() => {
      ref.current?.setValue(5);
    });
    expect(slider.getAttribute('aria-valuenow')).toBe('1');

    act(() => {
      ref.current?.setValue(-5);
    });
    expect(slider.getAttribute('aria-valuenow')).toBe('0');
  });

  it('ref.setValue fires onValueChanged', () => {
    const handleChange = vi.fn();
    const ref = createRef<IsolatedControlHandle>();
    render(
      <IsolatedControl ref={ref} defaultValue={0.2} onValueChanged={handleChange} aria-label="Vol" />
    );

    act(() => {
      ref.current?.setValue(0.7, true);
    });

    expect(handleChange).toHaveBeenCalledWith(expect.closeTo(0.7, 5));
  });

  it('ref.setValue fires onValueChanged in controlled mode without self-updating', () => {
    const handleChange = vi.fn();
    const ref = createRef<IsolatedControlHandle>();
    render(
      <IsolatedControl ref={ref} value={0.5} onValueChanged={handleChange} aria-label="Vol" />
    );
    const slider = screen.getAllByRole('slider')[0];

    act(() => {
      ref.current?.setValue(0.9);
    });

    expect(handleChange).toHaveBeenCalledWith(expect.closeTo(0.9, 5));
    expect(slider.getAttribute('aria-valuenow')).toBe('0.5');
  });
});
