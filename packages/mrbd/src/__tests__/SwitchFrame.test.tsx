/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SwitchFrame } from '../mrbd/ui/private/SwitchFrame';

describe('SwitchFrame', () => {
  it('renders the switch root and SVG frame when interactive', () => {
    const { container } = render(
      <SwitchFrame
        className="custom-switch"
        style={{ opacity: 1 }}
        interactive
        disabled={false}
        checked
        thumbCenterX={20}
        thumbCenterY={20}
        thumbInnerRadius={12}
        thumbOutlineRadius={14}
        thumbTranslateX={24}
        position={1}
        shouldAnimate={false}
        transitionValue="none"
        onClick={() => {}}
        onKeyDown={() => {}}
      />,
    );

    expect(screen.getByRole('switch')).toHaveClass('custom-switch');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  it('forwards pointer and keyboard handlers from the owner component when interactive', () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <SwitchFrame
        className=""
        style={{}}
        interactive
        disabled={false}
        checked={false}
        thumbCenterX={20}
        thumbCenterY={20}
        thumbInnerRadius={12}
        thumbOutlineRadius={14}
        thumbTranslateX={0}
        position={0}
        shouldAnimate
        transitionValue="all 300ms"
        onClick={onClick}
        onKeyDown={onKeyDown}
      />,
    );

    const control = screen.getByRole('switch');
    fireEvent.click(control);
    fireEvent.keyDown(control, { key: 'Enter' });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('exposes role/aria-checked but no tab stop or handlers when not interactive', () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    const { container } = render(
      <SwitchFrame
        className=""
        style={{}}
        interactive={false}
        disabled={false}
        checked
        thumbCenterX={20}
        thumbCenterY={20}
        thumbInnerRadius={12}
        thumbOutlineRadius={14}
        thumbTranslateX={24}
        position={1}
        shouldAnimate={false}
        transitionValue="none"
        onClick={onClick}
        onKeyDown={onKeyDown}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    // A non-presentational switch always exposes role=switch and aria-checked;
    // only the tab stop and click/key handlers are gated on interactivity (an
    // onChange handler).
    expect(screen.getByRole('switch')).not.toBeNull();
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
      <SwitchFrame
        className=""
        style={{}}
        interactive={false}
        disabled={false}
        checked
        presentational
        thumbCenterX={20}
        thumbCenterY={20}
        thumbInnerRadius={12}
        thumbOutlineRadius={14}
        thumbTranslateX={24}
        position={1}
        shouldAnimate={false}
        transitionValue="none"
        onClick={onClick}
        onKeyDown={onKeyDown}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(screen.queryByRole('switch')).toBeNull();
    expect(root).not.toHaveAttribute('aria-checked');
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).not.toHaveAttribute('tabindex');

    fireEvent.click(root);
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });
});
