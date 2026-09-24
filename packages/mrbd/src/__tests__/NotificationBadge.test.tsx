/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotificationBadge } from '../mrbd/ui/NotificationBadge';

describe('NotificationBadge', () => {
  it.each([1, 12, '99+'])('centers the %s label in the badge content', text => {
    const { container } = render(<NotificationBadge text={text} />);
    const badge = container.firstElementChild;
    const label = badge?.querySelector('span');

    expect(badge).toHaveStyle({ height: '32px' });
    expect(label).toHaveTextContent(String(text));
    expect(label?.className).toContain('label');
  });

  it('does not render an interactive role or tab stop', () => {
    const { container } = render(<NotificationBadge text={12} />);
    const badge = container.firstElementChild;

    expect(badge).not.toHaveAttribute('role');
    expect(badge).not.toHaveAttribute('tabindex');
  });
});
