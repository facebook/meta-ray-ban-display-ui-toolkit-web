/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Switch tests
 *
 * Constants:
 * - SWITCH_WIDTH = 64px, SWITCH_HEIGHT = 40px
 * - SWITCH_THUMB_RADIUS = 16px, SWITCH_THUMB_STROKE = 4px
 * - Thumb margin: 4px (spacing-xsmall)
 * - Track OFF: inset background color
 * - Track ON: persistent action color
 * - Thumb: active control color
 * - Animation uses `Interpolators.CONTAINER_SCALE`
 * - Default isOn: false
 *
 * Contract: the public `Switch` is a visual-only `checked` building block with
 * no interaction or accessibility surface — not intended to be used on its own.
 * Its state is driven by the parent, and it becomes checkable only when a click
 * handler is attached. Interaction lives on the in-package `SwitchInternal`,
 * opted in via `onChange` (or routed through ListItem).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from '../mrbd/ui/Switch';
import { SwitchInternal } from '../mrbd/ui/private/SwitchInternal';
import {
  getSwitchThumbCenterX,
  getSwitchThumbInnerRadius,
  SWITCH_HEIGHT,
  SWITCH_POSITION_OFF,
  SWITCH_POSITION_ON,
  SWITCH_THUMB_RADIUS,
  SWITCH_THUMB_STROKE,
  SWITCH_WIDTH,
} from '../mrbd/ui/private/SwitchMetrics';

// ============================================================================
// Public Switch — visual-only building block
// ============================================================================

describe('Switch dimensions (SWITCH_WIDTH=64, SWITCH_HEIGHT=40)', () => {
  it('width is 64px', () => {
    const { container } = render(<Switch />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 64px');
  });

  it('height is 40px', () => {
    const { container } = render(<Switch />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('height: 40px');
  });
});

describe('Switch initial state (isOn = false)', () => {
  it('defaults to off (thumb at start position)', () => {
    const { container } = render(<Switch />);
    const thumb = container.querySelector('[class*="thumbGroup"]');
    expect(thumb?.getAttribute('style')).toContain('translateX(0px)');
  });

  it('can be initialized to on (thumb at end position)', () => {
    const { container } = render(<Switch checked />);
    const thumb = container.querySelector('[class*="thumbGroup"]');
    expect(thumb?.getAttribute('style')).toContain('translateX(24px)');
  });
});

describe('Switch accessibility (non-interactive)', () => {
  // A non-presentational switch always exposes role=switch and aria-checked
  // (reflecting state); only the tab stop and click/key handlers are gated on
  // interactivity (an onChange handler). A standalone read-only switch stays
  // exposed to assistive tech — only presentational usage hides it.
  it('exposes role=switch even without an onChange handler', () => {
    render(<Switch checked />);
    expect(screen.getByRole('switch')).not.toBeNull();
  });

  it('exposes aria-checked reflecting state but has no tab stop when non-interactive', () => {
    const { container } = render(<Switch checked />);
    const root = container.firstElementChild;
    expect(root?.getAttribute('aria-checked')).toBe('true');
    expect(root?.getAttribute('tabindex')).toBeNull();
  });

  it('is not aria-hidden (it is a visible image-like node)', () => {
    const { container } = render(<Switch />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBeNull();
  });

  it('uses the default cursor (no pointer affordance)', () => {
    const { container } = render(<Switch />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('cursor: default');
  });
});

describe('Switch rendering', () => {
  it('renders track element', () => {
    const { container } = render(<Switch />);
    const track = container.querySelector('[class*="track"]');
    expect(track).not.toBeNull();
  });

  it('renders thumb element', () => {
    const { container } = render(<Switch />);
    const thumb = container.querySelector('[class*="thumb"]');
    expect(thumb).not.toBeNull();
  });

  it('thumb position changes based on isOn', () => {
    const { container, rerender } = render(<Switch checked={false} />);
    const thumbOff = container.querySelector('[class*="thumbGroup"]');
    const styleOff = thumbOff?.getAttribute('style') ?? '';

    rerender(<Switch checked={true} />);
    const thumbOn = container.querySelector('[class*="thumbGroup"]');
    const styleOn = thumbOn?.getAttribute('style') ?? '';

    // Thumb should be at different positions for on/off
    expect(styleOff).not.toEqual(styleOn);
  });

  it('animates the thumb via a translated group instead of snapping SVG cx', () => {
    const { container, rerender } = render(<Switch checked={false} />);
    const thumbGroupOff = container.querySelector('[class*="thumbGroup"]');
    const thumbOutline = container.querySelector('[class*="thumbOutline"]');
    expect(thumbGroupOff?.getAttribute('style')).toContain('translateX(0px)');
    expect(thumbOutline?.getAttribute('cx')).toBe('20');

    rerender(<Switch checked />);
    const thumbGroupOn = container.querySelector('[class*="thumbGroup"]');
    const thumbOutlineOn = container.querySelector('[class*="thumbOutline"]');
    expect(thumbGroupOn?.getAttribute('style')).toContain('translateX(24px)');
    expect(thumbOutlineOn?.getAttribute('cx')).toBe('20');
  });
});

describe('Switch disabled visual (no disabled drawing branch)', () => {
  it('does not apply a visual disabled opacity', () => {
    const { container } = render(<Switch />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).not.toContain('opacity');
  });
});

describe('Switch constants verification', () => {
  it('SWITCH_WIDTH = 64', () => {
    expect(SWITCH_WIDTH).toBe(64);
  });

  it('SWITCH_HEIGHT = 40', () => {
    expect(SWITCH_HEIGHT).toBe(40);
  });

  it('SWITCH_THUMB_RADIUS = 16', () => {
    expect(SWITCH_THUMB_RADIUS).toBe(16);
  });

  it('SWITCH_THUMB_STROKE = 4', () => {
    expect(SWITCH_THUMB_STROKE).toBe(4);
  });

  it('thumb OFF center = margin + radius = 4 + 16 = 20', () => {
    expect(getSwitchThumbCenterX(SWITCH_POSITION_OFF)).toBe(20);
  });

  it('thumb ON center = 64 - margin - radius = 64 - 4 - 16 = 44', () => {
    expect(getSwitchThumbCenterX(SWITCH_POSITION_ON)).toBe(44);
  });

  it('thumb inner radius = radius - stroke = 12', () => {
    expect(getSwitchThumbInnerRadius()).toBe(12);
  });
});

describe('Switch re-rendering', () => {
  it('updates the thumb position when toggled', () => {
    const { container, rerender } = render(<Switch checked={false} />);
    const read = () =>
      container
        .querySelector('[class*="thumbGroup"]')
        ?.getAttribute('style') ?? '';
    expect(read()).toContain('translateX(0px)');

    rerender(<Switch checked={true} />);
    expect(read()).toContain('translateX(24px)');

    rerender(<Switch checked={false} />);
    expect(read()).toContain('translateX(0px)');
  });

  it('does not crash on rapid toggling', () => {
    const { container, rerender } = render(<Switch checked={false} />);
    for (let i = 0; i < 10; i++) {
      rerender(<Switch checked={i % 2 === 0} />);
    }
    expect(container.querySelector('[class*="switch"]')).toBeInTheDocument();
  });
});

describe('Switch custom props', () => {
  it('accepts className', () => {
    const { container } = render(<Switch className="my-switch" />);
    expect(container.firstElementChild?.className).toContain('my-switch');
  });

  it('accepts custom style', () => {
    const { container } = render(<Switch style={{ margin: 8 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });

  it('forwards custom data attributes', () => {
    const { container } = render(
      <Switch data-uit-capture-id="switch-capture" title="Power" />,
    );
    expect(
      container.querySelector('[data-uit-capture-id="switch-capture"]'),
    ).not.toBeNull();
    expect(container.firstElementChild).toHaveAttribute('title', 'Power');
  });
});

// ============================================================================
// SwitchInternal — interactive mode (onChange provided)
// ============================================================================

describe('SwitchInternal accessibility (interactive node)', () => {
  it('has role=switch when onChange is provided', () => {
    render(<SwitchInternal onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('aria-checked reflects isOn state', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SwitchInternal checked={false} onChange={onChange} />,
    );
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    rerender(<SwitchInternal checked={true} onChange={onChange} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('is focusable when not disabled', () => {
    render(<SwitchInternal onChange={vi.fn()} />);
    expect(screen.getByRole('switch').tabIndex).toBeGreaterThanOrEqual(0);
  });

  it('is not focusable when disabled', () => {
    render(<SwitchInternal onChange={vi.fn()} disabled />);
    expect(screen.getByRole('switch').tabIndex).toBe(-1);
  });

  it('aria-disabled when disabled', () => {
    render(<SwitchInternal onChange={vi.fn()} disabled />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true');
  });

  it('cursor is pointer when enabled', () => {
    const { container } = render(<SwitchInternal onChange={vi.fn()} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('cursor: pointer');
  });

  it('cursor is default when disabled', () => {
    const { container } = render(
      <SwitchInternal onChange={vi.fn()} disabled />,
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('cursor: default');
  });
});

describe('SwitchInternal onChange', () => {
  it('calls onChange when clicked', () => {
    const onChange = vi.fn();
    render(<SwitchInternal onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<SwitchInternal onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toggles off→on', () => {
    const onChange = vi.fn();
    render(<SwitchInternal checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('toggles on→off', () => {
    const onChange = vi.fn();
    render(<SwitchInternal checked={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('keyboard Enter triggers toggle', () => {
    const onChange = vi.fn();
    render(<SwitchInternal onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('switch'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('keyboard Space triggers toggle', () => {
    const onChange = vi.fn();
    render(<SwitchInternal onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('switch'), { key: ' ' });
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('SwitchInternal presentational (parent owns the role)', () => {
  it('drops role/tab stop and is aria-hidden even with onChange', () => {
    const { container } = render(
      <SwitchInternal checked onChange={vi.fn()} presentational />,
    );
    expect(screen.queryByRole('switch')).toBeNull();
    const root = container.firstElementChild;
    expect(root?.getAttribute('aria-hidden')).toBe('true');
    expect(root?.getAttribute('tabindex')).toBeNull();
  });
});
