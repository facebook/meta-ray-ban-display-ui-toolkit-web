/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ButtonDivider tests
 * Tests the divider pill between buttons in ButtonGroup.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ButtonDivider } from '../mrbd/ui/ButtonDivider';
import {
  BUTTON_DIVIDER_HEIGHT,
  BUTTON_DIVIDER_MARGIN_HORIZONTAL,
  BUTTON_DIVIDER_SIZABLE,
  BUTTON_DIVIDER_TOTAL_WIDTH,
  BUTTON_DIVIDER_WIDTH,
} from '../mrbd/ui/private/ButtonDividerMetrics';

describe('ButtonDivider rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<ButtonDivider />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('is aria-hidden', () => {
    const { container } = render(<ButtonDivider />);
    const el = container.firstElementChild;
    expect(el?.getAttribute('aria-hidden')).toBe('true');
  });

  it('inner pill has correct width (8px) and height (36px)', () => {
    const { container } = render(<ButtonDivider />);
    // The pill is the inner element with the dimensions
    const pill = container.querySelector('[class*="pill"]') ?? container.querySelector('div > div');
    if (pill) {
      const style = pill.getAttribute('style') ?? '';
      expect(style).toContain(`width: ${BUTTON_DIVIDER_WIDTH}px`);
      expect(style).toContain(`height: ${BUTTON_DIVIDER_HEIGHT}px`);
    }
  });

  it('outer wrapper applies the expected horizontal margins', () => {
    const { container } = render(<ButtonDivider />);
    const pill = container.querySelector('[class*="pill"]') ?? container.querySelector('div > div');
    const style = pill?.getAttribute('style') ?? '';
    expect(style).toContain(`margin-left: ${BUTTON_DIVIDER_MARGIN_HORIZONTAL}px`);
    expect(style).toContain(`margin-right: ${BUTTON_DIVIDER_MARGIN_HORIZONTAL}px`);
  });
});

describe('ButtonDivider Sizable interface', () => {
  it('defines the internal ButtonGroup sizing marker with correct dimensions', () => {
    expect(BUTTON_DIVIDER_SIZABLE).toBeDefined();
    expect(BUTTON_DIVIDER_SIZABLE.defaultWidth).toBe(BUTTON_DIVIDER_TOTAL_WIDTH);
    expect(BUTTON_DIVIDER_SIZABLE.focusedWidth).toBe(BUTTON_DIVIDER_TOTAL_WIDTH);
    expect(BUTTON_DIVIDER_SIZABLE.height).toBe(BUTTON_DIVIDER_HEIGHT);
  });
});
