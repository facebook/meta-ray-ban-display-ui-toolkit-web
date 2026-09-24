/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ButtonContextMenuItemView } from '../mrbd/ui/ContextMenuItemView';
import { ButtonItemIconSize } from '../mrbd/ui/ButtonItemIconSize';
import { IconTintColor } from '../mrbd/ui/IconTintColor';

const TEST_ICON_SRC = '/icons/test-icon.svg';

function renderItem(overrides = {}) {
  return render(
    <ButtonContextMenuItemView
      icon={{ uri: TEST_ICON_SRC }}
      title="Report"
      {...overrides}
    />,
  );
}

describe('ButtonContextMenuItemView', () => {
  it('tints the icon with the default PRIMARY token when no tint is provided', () => {
    const { container } = renderItem();
    const iconDiv = container.querySelector('[class*="buttonItemIcon"]');
    const style = iconDiv?.getAttribute('style') ?? '';

    expect(style).toContain('color: var(--uit-color-icon-primary)');
    // The camelCase enum value must not leak into the var name.
    expect(style).not.toContain('--colorIconPrimary');
    // Only SECONDARY composites with lighten.
    expect(style).not.toContain('mix-blend-mode: lighten');
  });

  it('resolves NEGATIVE to the persistent negative token for destructive actions', () => {
    const { container } = renderItem({ iconTintColor: IconTintColor.NEGATIVE });
    const iconDiv = container.querySelector('[class*="buttonItemIcon"]');
    const style = iconDiv?.getAttribute('style') ?? '';

    expect(style).toContain('color: var(--uit-color-persistent-negative)');
    expect(style).not.toContain('var(--uit-color-icon-primary)');
    expect(style).not.toContain('--uit-blend-mode-secondary');
  });

  it('composites a SECONDARY icon tint with the lighten blend mode', () => {
    const { container } = renderItem({ iconTintColor: IconTintColor.SECONDARY });
    const iconDiv = container.querySelector('[class*="buttonItemIcon"]');
    const style = iconDiv?.getAttribute('style') ?? '';

    expect(style).toContain('color: var(--uit-color-icon-secondary)');
    expect(style).toContain('mix-blend-mode: lighten');
  });

  it('resolves ACTION to the persistent action token', () => {
    const { container } = renderItem({ iconTintColor: IconTintColor.ACTION });
    const style =
      container.querySelector('[class*="buttonItemIcon"]')?.getAttribute('style') ?? '';

    expect(style).toContain('color: var(--uit-color-persistent-action)');
    expect(style).not.toContain('--uit-blend-mode-secondary');
  });
});

describe('ButtonContextMenuItemView icon size', () => {
  it('defaults to MEDIUM: no large icon swap and no tightened padding', () => {
    const { container } = renderItem();

    const icon = container.querySelector('[class*="buttonItemIcon"]');
    expect(icon?.className).not.toMatch(/buttonItemIconLarge/);

    const content = container.querySelector('[class*="buttonItemContent"]');
    expect(content?.className).not.toMatch(/buttonItemContentLarge/);
  });

  it('LARGE swaps the icon size AND tightens content padding to 12px', () => {
    const { container } = renderItem({ iconSize: ButtonItemIconSize.LARGE });

    const icon = container.querySelector('[class*="buttonItemIcon"]');
    expect(icon?.className).toMatch(/buttonItemIconLarge/);

    // `buttonItemContentLarge` is the modifier that applies `padding: 0 12px`,
    // tightening the horizontal padding from 16px to 12px.
    const content = container.querySelector('[class*="buttonItemContent"]');
    expect(content?.className).toMatch(/buttonItemContentLarge/);
  });
});
