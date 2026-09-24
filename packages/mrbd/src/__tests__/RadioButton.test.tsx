/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * RadioButton tests
 *
 * Constants:
 * - RADIO_BUTTON_SIZE = 40
 * - RADIO_BUTTON_STROKE = 4
 * - RADIO_BUTTON_FILL_RADIUS = (40 - 4*4) / 2 = 12
 * - Track color: inset background color
 * - Stroke/fill color: active control color
 * - Default isChecked: false
 *
 * Contract: the public `RadioButton` is a visual-only `checked` building block
 * with no interaction or accessibility surface — not intended to be used on its
 * own. Its `checked` state is driven by the parent, and it becomes checkable
 * only when a click handler is attached. Interaction lives on the in-package
 * `RadioButtonInternal`, opted in via `onChange` (or routed through ListItem).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadioButton } from '../mrbd/ui/RadioButton';
import { RadioButtonInternal } from '../mrbd/ui/private/RadioButtonInternal';
import {
  getRadioButtonCenter,
  getRadioButtonStrokeRadius,
  RADIO_BUTTON_FILL_RADIUS,
  RADIO_BUTTON_SIZE,
  RADIO_BUTTON_STROKE,
} from '../mrbd/ui/private/RadioButtonMetrics';

// ============================================================================
// Public RadioButton — visual-only building block
// ============================================================================

describe('RadioButton dimensions (validate minimum size)', () => {
  it('size is 40x40px (RADIO_BUTTON_SIZE = 40)', () => {
    const { container } = render(<RadioButton />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain(`width: ${RADIO_BUTTON_SIZE}px`);
    expect(style).toContain(`height: ${RADIO_BUTTON_SIZE}px`);
  });

  it('SVG viewBox matches size (40x40)', () => {
    const { container } = render(<RadioButton />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 40 40');
  });
});

describe('RadioButton initial state (initial state is off)', () => {
  it('does not show fill circle when unchecked', () => {
    const { container } = render(<RadioButton />);
    // Only track and stroke ring circles, no fill circle
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2); // track + stroke only
  });

  it('shows fill circle when checked', () => {
    const { container } = render(<RadioButton checked />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3); // track + stroke + fill
  });
});

describe('RadioButton accessibility (non-interactive)', () => {
  // A non-presentational radio always exposes role=radio and aria-checked
  // (reflecting state); only the tab stop and click/key handlers are gated on
  // interactivity (an onChange handler). A standalone read-only radio stays
  // exposed to assistive tech — only presentational usage hides it.
  it('exposes role=radio even without an onChange handler', () => {
    render(<RadioButton checked />);
    expect(screen.getByRole('radio')).not.toBeNull();
  });

  it('exposes aria-checked reflecting state but has no tab stop when non-interactive', () => {
    const { container } = render(<RadioButton checked />);
    const root = container.firstElementChild;
    expect(root?.getAttribute('aria-checked')).toBe('true');
    expect(root?.getAttribute('tabindex')).toBeNull();
  });

  it('is not aria-hidden (it is a visible image-like node)', () => {
    const { container } = render(<RadioButton />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBeNull();
  });

  it('uses the default cursor (no pointer affordance)', () => {
    const { container } = render(<RadioButton />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('cursor: default');
  });
});

describe('RadioButton SVG structure', () => {
  it('renders track circle', () => {
    const { container } = render(<RadioButton />);
    const track = container.querySelector('[class*="track"]');
    expect(track).not.toBeNull();
  });

  it('renders stroke ring', () => {
    const { container } = render(<RadioButton />);
    const strokeRing = container.querySelector('[class*="strokeRing"]');
    expect(strokeRing).not.toBeNull();
  });

  it('stroke ring has strokeWidth=4 (RADIO_BUTTON_STROKE=4)', () => {
    const { container } = render(<RadioButton />);
    const strokeRing = container.querySelector('[class*="strokeRing"]');
    expect(strokeRing?.getAttribute('stroke-width')).toBe('4');
  });

  it('fill circle has correct radius when checked (FILL_RADIUS=12)', () => {
    const { container } = render(<RadioButton checked />);
    const fillCircle = container.querySelector('[class*="fillCircle"]');
    expect(fillCircle).not.toBeNull();
    expect(fillCircle?.getAttribute('r')).toBe(String(RADIO_BUTTON_FILL_RADIUS));
  });

  it('circles are centered at (20, 20)', () => {
    const { container } = render(<RadioButton />);
    const circles = container.querySelectorAll('circle');
    circles.forEach(c => {
      expect(c.getAttribute('cx')).toBe(String(getRadioButtonCenter()));
      expect(c.getAttribute('cy')).toBe(String(getRadioButtonCenter()));
    });
  });

  it('stroke metrics are exposed for geometry', () => {
    expect(RADIO_BUTTON_STROKE).toBe(4);
    expect(getRadioButtonStrokeRadius()).toBe(18);
  });
});

describe('RadioButton disabled visual (no disabled drawing branch)', () => {
  it('does not apply a visual disabled opacity', () => {
    const { container } = render(<RadioButton />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).not.toContain('opacity');
  });
});

describe('RadioButton re-rendering', () => {
  it('updates when isChecked changes', () => {
    const { rerender, container } = render(<RadioButton checked={false} />);
    expect(container.querySelectorAll('circle').length).toBe(2);

    rerender(<RadioButton checked={true} />);
    expect(container.querySelectorAll('circle').length).toBe(3);

    rerender(<RadioButton checked={false} />);
    expect(container.querySelectorAll('circle').length).toBe(2);
  });
});

describe('RadioButton custom props', () => {
  it('accepts className', () => {
    const { container } = render(<RadioButton className="my-radio" />);
    expect(container.firstElementChild?.className).toContain('my-radio');
  });

  it('accepts custom style', () => {
    const { container } = render(<RadioButton style={{ margin: 8 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });

  it('forwards custom data attributes', () => {
    const { container } = render(
      <RadioButton data-uit-capture-id="radio-capture" title="Selection" />,
    );
    expect(
      container.querySelector('[data-uit-capture-id="radio-capture"]'),
    ).not.toBeNull();
    expect(container.firstElementChild).toHaveAttribute('title', 'Selection');
  });
});

// ============================================================================
// RadioButtonInternal — interactive mode (onChange provided)
// ============================================================================

describe('RadioButtonInternal accessibility (interactive node)', () => {
  it('has role=radio when onChange is provided', () => {
    render(<RadioButtonInternal onChange={vi.fn()} />);
    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('aria-checked reflects isChecked state', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RadioButtonInternal checked={false} onChange={onChange} />,
    );
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'false');

    rerender(<RadioButtonInternal checked={true} onChange={onChange} />);
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true');
  });

  it('is focusable when not disabled (tabIndex >= 0)', () => {
    render(<RadioButtonInternal onChange={vi.fn()} />);
    expect(screen.getByRole('radio').tabIndex).toBeGreaterThanOrEqual(0);
  });

  it('is not focusable when disabled (tabIndex = -1)', () => {
    render(<RadioButtonInternal onChange={vi.fn()} disabled />);
    expect(screen.getByRole('radio').tabIndex).toBe(-1);
  });

  it('aria-disabled reflects disabled state', () => {
    render(<RadioButtonInternal onChange={vi.fn()} disabled />);
    expect(screen.getByRole('radio')).toHaveAttribute('aria-disabled', 'true');
  });

  it('uses pointer cursor when enabled', () => {
    const { container } = render(<RadioButtonInternal onChange={vi.fn()} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('cursor: pointer');
  });

  it('uses default cursor when disabled', () => {
    const { container } = render(
      <RadioButtonInternal onChange={vi.fn()} disabled />,
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('cursor: default');
  });
});

describe('RadioButtonInternal onChange', () => {
  it('calls onChange when clicked', () => {
    const onChange = vi.fn();
    render(<RadioButtonInternal onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<RadioButtonInternal onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole('radio'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toggles from unchecked to checked', () => {
    const onChange = vi.fn();
    render(<RadioButtonInternal checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('toggles from checked to unchecked', () => {
    const onChange = vi.fn();
    render(<RadioButtonInternal checked={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('keyboard Enter triggers onChange', () => {
    const onChange = vi.fn();
    render(<RadioButtonInternal onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('radio'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('keyboard Space triggers onChange', () => {
    const onChange = vi.fn();
    render(<RadioButtonInternal onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('radio'), { key: ' ' });
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('RadioButtonInternal presentational (parent owns the role)', () => {
  it('drops role/tab stop and is aria-hidden even with onChange', () => {
    const { container } = render(
      <RadioButtonInternal checked onChange={vi.fn()} presentational />,
    );
    expect(screen.queryByRole('radio')).toBeNull();
    const root = container.firstElementChild;
    expect(root?.getAttribute('aria-hidden')).toBe('true');
    expect(root?.getAttribute('tabindex')).toBeNull();
  });
});
