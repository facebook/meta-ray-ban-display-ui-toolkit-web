/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  TextColor,
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/foundation/components/TextView';
import {
  getTextColorValue,
  getTextStyleClass,
  TEXT_COLOR_CSS_MAP,
  TEXT_STYLE_CLASS_MAP,
} from '@wearables-ui-toolkit/foundation/components/private/TextViewStyles';
import { TextAppearance } from '@wearables-ui-toolkit/foundation/theme/TextAppearance';

describe('TextView rendering', () => {
  it('renders children with default text style and color', () => {
    const { container } = render(<TextView>Hello</TextView>);
    const el = container.firstElementChild as HTMLElement;

    expect(el.textContent).toBe('Hello');
    expect(el.className).toContain(getTextStyleClass(TextStyle.BODY1));
    expect(el.getAttribute('style')).toContain(
      `color: ${getTextColorValue(TextColor.PRIMARY)}`
    );
  });

  it('renders as the requested HTML element', () => {
    const { container } = render(
      <TextView as="h1" textStyle={TextStyle.HEADING1}>Heading</TextView>
    );

    expect(container.firstElementChild?.tagName).toBe('H1');
  });

  it('maps every text style to its public text appearance class', () => {
    expect(TEXT_STYLE_CLASS_MAP).toEqual({
      [TextStyle.NUMERAL1]: TextAppearance.NUMERAL1,
      [TextStyle.NUMERAL2]: TextAppearance.NUMERAL2,
      [TextStyle.DISPLAY1]: TextAppearance.DISPLAY1,
      [TextStyle.HEADING1]: TextAppearance.HEADING1,
      [TextStyle.HEADING2]: TextAppearance.HEADING2,
      [TextStyle.BODY1]: TextAppearance.BODY1,
      [TextStyle.BODY1_EMPHASIZED]: TextAppearance.BODY1_EMPHASIZED,
      [TextStyle.BODY2]: TextAppearance.BODY2,
      [TextStyle.BODY2_EMPHASIZED]: TextAppearance.BODY2_EMPHASIZED,
      [TextStyle.LABEL]: TextAppearance.LABEL,
      [TextStyle.LABEL_EMPHASIZED]: TextAppearance.LABEL_EMPHASIZED,
      [TextStyle.META1]: TextAppearance.META1,
      [TextStyle.META1_EMPHASIZED]: TextAppearance.META1_EMPHASIZED,
      [TextStyle.META2]: TextAppearance.META2,
      [TextStyle.META2_EMPHASIZED]: TextAppearance.META2_EMPHASIZED,
      [TextStyle.META3]: TextAppearance.META3,
    });
  });

  it('maps every text color enum to a theme token', () => {
    expect(TEXT_COLOR_CSS_MAP).toEqual({
      [TextColor.PRIMARY]: 'var(--uit-color-text-primary)',
      [TextColor.SECONDARY]: 'var(--uit-color-text-secondary)',
      // Placeholder / active-hover / accent text tokens.
      [TextColor.PLACEHOLDER]: 'var(--uit-color-text-placeholder)',
      [TextColor.ACTIVE_HOVER]: 'var(--uit-color-text-active-hover)',
      [TextColor.ACCENT]: 'var(--uit-color-text-accent)',
    });
  });

  it('uses lighten blending only for secondary text', () => {
    const { container, rerender } = render(
      <TextView textColor={TextColor.SECONDARY}>Secondary</TextView>
    );
    const element = container.firstElementChild as HTMLElement;

    expect(element.className).toContain('uit-color-text-secondary');
    expect(element.style.mixBlendMode).toBe('');

    rerender(<TextView textColor={TextColor.PRIMARY}>Primary</TextView>);
    expect(element.className).not.toContain('uit-color-text-secondary');
  });

  it('does not allow a style override to remove secondary blending', () => {
    const { container } = render(
      <TextView
        textColor={TextColor.SECONDARY}
        style={{ mixBlendMode: 'normal' }}
      >
        Secondary
      </TextView>
    );

    const element = container.firstElementChild as HTMLElement;
    expect(element.className).toContain('uit-color-text-secondary');
    expect(element.style.mixBlendMode).toBe('normal');
  });
});
