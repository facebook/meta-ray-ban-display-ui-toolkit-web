/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppBadge } from '../mrbd/ui/AppBadge';
import { NotificationBadge } from '../mrbd/ui/NotificationBadge';

const icon = {
  viewBox: '0 0 24 24',
  paths: [{ d: 'M0 0h24v24z' }],
};

describe('AppBadge', () => {
  it('renders a decorative icon in a non-interactive container', () => {
    const { container } = render(<AppBadge icon={icon} data-testid="badge" />);
    const badge = screen.getByTestId('badge');

    expect(badge).not.toHaveAttribute('tabindex');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders without an icon', () => {
    const { container } = render(<AppBadge data-testid="badge" />);

    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('NotificationBadge', () => {
  it('renders primary meta text in a non-interactive container', () => {
    render(<NotificationBadge text={12} data-testid="badge" />);
    const badge = screen.getByTestId('badge');

    expect(badge).toHaveTextContent('12');
    expect(badge).not.toHaveAttribute('tabindex');
  });

  it('renders an empty non-interactive badge when text is omitted', () => {
    render(<NotificationBadge data-testid="badge" />);
    const badge = screen.getByTestId('badge');

    expect(badge).not.toHaveTextContent(/\S/);
    expect(badge).not.toHaveAttribute('tabindex');
  });
});
