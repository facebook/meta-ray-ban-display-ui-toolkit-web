/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createRef} from 'react';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {NotificationBadge} from '../mrbd/ui/NotificationBadge';

describe('NotificationBadge', () => {
  it.each([1, 12, '99+'])('renders %s in a compact noninteractive badge', text => {
    render(<NotificationBadge text={text} data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveStyle({height: '32px', minWidth: '32px'});
    expect(badge).toHaveTextContent(String(text));
    expect(badge).not.toHaveAttribute('role');
    expect(badge).not.toHaveAttribute('tabindex');
  });

  it('preserves explicit minimum widths through text changes and restores the default', () => {
    const {rerender} = render(<NotificationBadge text="9" data-testid="badge" style={{minWidth: 0}} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveStyle({height: '32px', minWidth: '0px'});
    rerender(<NotificationBadge text="99" data-testid="badge" style={{minWidth: '0px'}} />);
    expect(badge).toHaveTextContent('99');
    expect(badge).toHaveStyle({height: '32px', minWidth: '0px'});
    rerender(<NotificationBadge text="1" data-testid="badge" style={{minWidth: 0}} />);
    expect(screen.getByTestId('badge')).toBe(badge);
    expect(badge).toHaveTextContent('1');
    expect(badge).toHaveStyle({height: '32px', minWidth: '0px'});
    rerender(<NotificationBadge text="88" data-testid="badge" style={{minWidth: 80}} />);
    expect(badge).toHaveTextContent('88');
    expect(badge).toHaveStyle({height: '32px', minWidth: '80px'});
    rerender(<NotificationBadge text="99+" data-testid="badge" />);
    expect(badge).toHaveTextContent('99+');
    expect(badge).toHaveStyle({height: '32px', minWidth: '32px'});
  });

  it('preserves caller attributes, minimum width and ref across count updates', () => {
    const ref = createRef<HTMLDivElement>();
    const {rerender, unmount} = render(<NotificationBadge ref={ref} text="9" data-testid="badge" aria-label="Unread" className="count" style={{opacity: 0.5, minWidth: 80}} />);
    const badge = screen.getByTestId('badge');
    rerender(<NotificationBadge ref={ref} text="99" data-testid="badge" aria-label="Unread" className="count" style={{opacity: 0.5, minWidth: 80}} />);
    expect(badge).toHaveTextContent('99');
    expect(badge).toHaveStyle({height: '32px', minWidth: '80px', opacity: '0.5'});
    expect(badge).toHaveAttribute('aria-label', 'Unread');
    expect(badge).toHaveClass('count');
    expect(ref.current).toBe(badge);
    unmount();
    expect(ref.current).toBeNull();
  });

  it.each([1, 999])('keeps compact height authoritative over caller height %s', height => {
    render(<NotificationBadge text="99" data-testid="badge" style={{height, marginLeft: 8}} />);
    expect(screen.getByTestId('badge')).toHaveStyle({height: '32px', marginLeft: '8px'});
    expect(screen.getByTestId('badge')).toHaveTextContent('99');
  });

  it('preserves full custom labels, caller naming and the text slot through count-format changes', () => {
    const ref = createRef<HTMLDivElement>();
    const {rerender} = render(<NotificationBadge ref={ref} text={0} data-testid="badge" aria-label="Unread" style={{minWidth: 80}} />);
    const badge = screen.getByTestId('badge');
    const label = badge.querySelector('.uit-text-meta2');
    expect(label).toHaveTextContent('0');
    for (const text of ['99+', 'gyp', '東京', '١٢', -1, 1.5, 9]) {
      rerender(<NotificationBadge ref={ref} text={text} data-testid="badge" aria-label="Unread" style={{minWidth: 80}} />);
      expect(screen.getByTestId('badge')).toBe(badge);
      expect(badge.querySelector('.uit-text-meta2')).toBe(label);
      expect(label).toHaveTextContent(String(text));
      expect(badge).toHaveAttribute('aria-label', 'Unread');
      expect(badge).toHaveStyle({height: '32px', minWidth: '80px'});
      expect(badge).not.toHaveAttribute('tabindex');
      expect(ref.current).toBe(badge);
    }
  });

  it('clears a previously supplied count without removing the badge', () => {
    const {rerender} = render(<NotificationBadge text="99" data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    rerender(<NotificationBadge data-testid="badge" />);
    expect(screen.getByTestId('badge')).toBe(badge);
    expect(badge).not.toHaveTextContent(/\S/);
    expect(badge).toHaveStyle({height: '32px', minWidth: '32px'});
  });
});
