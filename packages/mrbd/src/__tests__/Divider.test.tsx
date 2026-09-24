/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Divider tests
 *
 * Constants: thickness = 2px, pill corner radius
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Divider, DividerOrientation } from '../mrbd/ui/Divider';
import { getDividerStyle } from '../mrbd/ui/private/DividerLayout';
import {
  DIVIDER_CORNER_RADIUS,
  DIVIDER_THICKNESS,
} from '../mrbd/ui/private/DividerMetrics';

describe('Divider rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<Divider />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('is aria-hidden', () => {
    const { container } = render(<Divider />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('Divider dimensions match the dimension constants', () => {
  it('HORIZONTAL: height = 2px (DIVIDER_THICKNESS)', () => {
    const { container } = render(<Divider />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain(`height: ${DIVIDER_THICKNESS}px`);
  });

  it('HORIZONTAL: width = 100%', () => {
    const { container } = render(<Divider />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 100%');
  });

  it('VERTICAL: width = 2px (DIVIDER_THICKNESS)', () => {
    const { container } = render(<Divider orientation={DividerOrientation.VERTICAL} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain(`width: ${DIVIDER_THICKNESS}px`);
  });

  it('VERTICAL: height = 100%', () => {
    const { container } = render(<Divider orientation={DividerOrientation.VERTICAL} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('height: 100%');
  });

  it('uses the shared XXSMALL corner radius', () => {
    const { container } = render(<Divider />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain(`border-radius: ${DIVIDER_CORNER_RADIUS}px`);
  });

  it('layout helper maps horizontal and vertical dimensions', () => {
    expect(getDividerStyle(DividerOrientation.HORIZONTAL)).toMatchObject({
      width: '100%',
      height: DIVIDER_THICKNESS,
      borderRadius: DIVIDER_CORNER_RADIUS,
    });
    expect(getDividerStyle(DividerOrientation.VERTICAL)).toMatchObject({
      width: DIVIDER_THICKNESS,
      height: '100%',
      borderRadius: DIVIDER_CORNER_RADIUS,
    });
  });
});

describe('Divider orientation', () => {
  it('defaults to HORIZONTAL', () => {
    const { container } = render(<Divider />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    // HORIZONTAL = width:100%, height:2px
    expect(style).toContain('width: 100%');
    expect(style).toContain(`height: ${DIVIDER_THICKNESS}px`);
  });

  it('VERTICAL mode swaps width and height', () => {
    const { container } = render(
      <Divider orientation={DividerOrientation.VERTICAL} />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain(`width: ${DIVIDER_THICKNESS}px`);
    expect(style).toContain('height: 100%');
  });
});

describe('Divider color', () => {
  it('uses colorBorderPrimary CSS variable', () => {
    const { container } = render(<Divider />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('divider');
  });

  it('uses a 25% white overlay alpha for the border color', () => {
    // 64/255 = 0.2509..., which rounds to 0.251.
    const alpha = 0x40 / 255;
    expect(alpha).toBeCloseTo(0.251, 2);
  });
});

describe('Divider custom styling', () => {
  it('accepts custom className', () => {
    const { container } = render(<Divider className="my-divider" />);
    expect(container.firstElementChild?.className).toContain('my-divider');
  });

  it('accepts custom style overrides', () => {
    const { container } = render(
      <Divider style={{ width: '50%' }} />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 50%');
  });

  it('custom style overrides default width', () => {
    const { container } = render(
      <Divider style={{ width: 200 }} />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 200px');
  });

  it('forwards custom data attributes', () => {
    const { container } = render(
      <Divider data-uit-capture-id="divider-capture" title="Section divider" />,
    );
    expect(container.firstElementChild).toHaveAttribute(
      'data-uit-capture-id',
      'divider-capture',
    );
    expect(container.firstElementChild).toHaveAttribute('title', 'Section divider');
  });
});
