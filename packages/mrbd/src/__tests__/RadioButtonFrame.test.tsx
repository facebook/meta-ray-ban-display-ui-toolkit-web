/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RadioButtonFrame } from '../mrbd/ui/private/RadioButtonFrame';

describe('RadioButtonFrame', () => {
  it('renders radio root and checked SVG frame when interactive', () => {
    const { container } = render(
      <RadioButtonFrame
        className="custom-radio"
        style={{ opacity: 1 }}
        interactive
        disabled={false}
        checked
        center={18}
        outerRadius={16}
        strokeRadius={13}
        fillRadius={8}
        onClick={() => {}}
        onKeyDown={() => {}}
      />,
    );

    expect(screen.getByRole('radio')).toHaveClass('custom-radio');
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true');
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('circle')).toHaveLength(3);
  });

  it('omits the checked fill circle when unchecked', () => {
    const { container } = render(
      <RadioButtonFrame
        className=""
        style={{}}
        interactive
        disabled={false}
        checked={false}
        center={18}
        outerRadius={16}
        strokeRadius={13}
        fillRadius={8}
        onClick={() => {}}
        onKeyDown={() => {}}
      />,
    );

    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  it('forwards pointer and keyboard handlers from the owner component when interactive', () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <RadioButtonFrame
        className=""
        style={{}}
        interactive
        disabled={false}
        checked={false}
        center={18}
        outerRadius={16}
        strokeRadius={13}
        fillRadius={8}
        onClick={onClick}
        onKeyDown={onKeyDown}
      />,
    );

    const control = screen.getByRole('radio');
    fireEvent.click(control);
    fireEvent.keyDown(control, { key: 'Enter' });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('exposes role/aria-checked but no tab stop or handlers when not interactive', () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    const { container } = render(
      <RadioButtonFrame
        className=""
        style={{}}
        interactive={false}
        disabled={false}
        checked
        center={18}
        outerRadius={16}
        strokeRadius={13}
        fillRadius={8}
        onClick={onClick}
        onKeyDown={onKeyDown}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    // A non-presentational radio always exposes role=radio and aria-checked;
    // only the tab stop and click/key handlers are gated on interactivity (an
    // onChange handler).
    expect(screen.getByRole('radio')).not.toBeNull();
    expect(root).toHaveAttribute('aria-checked', 'true');
    expect(root).not.toHaveAttribute('tabindex');
    // AT-exposed and visible — not hidden from assistive tech.
    expect(root).not.toHaveAttribute('aria-hidden');

    fireEvent.click(root);
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('strips role/aria/tabindex, hides from AT, and ignores handlers when presentational', () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    const { container } = render(
      <RadioButtonFrame
        className=""
        style={{}}
        interactive={false}
        disabled={false}
        checked
        presentational
        center={18}
        outerRadius={16}
        strokeRadius={13}
        fillRadius={8}
        onClick={onClick}
        onKeyDown={onKeyDown}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(screen.queryByRole('radio')).toBeNull();
    expect(root).not.toHaveAttribute('aria-checked');
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).not.toHaveAttribute('tabindex');

    fireEvent.click(root);
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });
});
